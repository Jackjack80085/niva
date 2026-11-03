import { randomUUID } from "node:crypto";
import { Router, type Request, type RequestHandler } from "express";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { EventRegistration, PracticeEvent } from "../src/types";
import { Store, hash, secret } from "./store";
import {
  requireValue,
  validHmac,
  type Config,
  type Providers,
} from "./providers";

type StoredRegistration = EventRegistration & {
  accessHash: string;
  orderId?: string;
  paymentId?: string;
};
export const getRegistration = async (
  store: Store,
  id: string,
): Promise<StoredRegistration | undefined> => {
  const row = await store.db
    .prepare("SELECT data FROM event_registrations WHERE id=?")
    .get(id);
  return row ? store.decode<StoredRegistration>(row.data) : undefined;
};
const put = (store: Store, r: StoredRegistration) =>
  store.db
    .prepare(
      "INSERT INTO event_registrations VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
    )
    .run(r.id, store.encode(r));
const publicRegistration = (r: StoredRegistration): EventRegistration => {
  const { accessHash, orderId, paymentId, ...safe } = r;
  return safe;
};
export const listRegistrations = async (store: Store) => {
  const rows = await store.db
    .prepare("SELECT data FROM event_registrations")
    .all();
  return rows
    .map((row) => store.decode<StoredRegistration>(row.data))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
export async function completeEventPayment(
  store: Store,
  registrationId: string,
  payment: any,
) {
  await store.transaction(async () => {
    const r = await getRegistration(store, registrationId);
    requireValue(
      r &&
        r.orderId === payment?.order_id &&
        payment.status === "captured" &&
        payment.amount === Math.round(r.price * 100) &&
        payment.currency === "INR",
      400,
      "Payment has not been captured for this event at the expected price.",
    );
    if (r!.paymentStatus === "paid") {
      requireValue(
        r!.paymentId === payment.id,
        409,
        "A different payment is already recorded.",
      );
      return;
    }
    r!.status = "registered";
    r!.paymentStatus = "paid";
    r!.paymentId = payment.id;
    await put(store, r!);
    await store.job("event_registration_email", r!.id, {});
    await store.audit(r!.id, "event_payment_captured");
  });
}
export function eventRegistrationRoutes({
  store,
  providers,
  config,
  admin,
  rate,
}: {
  store: Store;
  providers: Providers;
  config: Config;
  admin: RequestHandler;
  rate: (req: Request, bucket: string, limit?: number) => Promise<void>;
}) {
  const router = Router();
  const handler =
    (fn: (req: Request, res: any) => Promise<unknown>): RequestHandler =>
    (req, res, next) => {
      Promise.resolve(fn(req, res)).catch(next);
    };
  const access = async (req: Request) => {
    const r = await getRegistration(store, String(req.params.id));
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : "";
    requireValue(
      r && token && hash(token) === r.accessHash,
      404,
      "Registration not found or access link is invalid.",
    );
    return r!;
  };
  router.get(
    "/admin/event/registrations",
    admin,
    handler(async (_req, res) =>
      res.json({
        registrations: (await listRegistrations(store)).map(publicRegistration),
      }),
    ),
  );
  router.post(
    "/events/register",
    handler(async (req, res) => {
      await rate(req, "event_registration", 20);
      const { name, email, phone, eventVersion } = req.body;
      requireValue(
        typeof name === "string" &&
          name.trim() &&
          name.length <= 100 &&
          typeof email === "string" &&
          email.length <= 254 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        400,
        "Enter a valid name and email.",
      );
      const parsed =
        typeof phone === "string"
          ? parsePhoneNumberFromString(phone)
          : undefined;
      requireValue(
        parsed?.isPossible(),
        400,
        "Enter a valid international phone number.",
      );
      const key = req.get("Idempotency-Key");
      requireValue(
        key && /^[a-zA-Z0-9_-]{16,100}$/.test(key),
        400,
        "A registration request key is required.",
      );
      const inputHash = hash(
        JSON.stringify([name, email, parsed!.number, eventVersion]),
      );
      const response = await store.transaction(async () => {
        const previous = await store.db
          .prepare("SELECT payload_hash,response FROM idempotency WHERE key=?")
          .get("event:" + key);
        if (previous) {
          requireValue(
            previous.payload_hash === inputHash,
            409,
            "This registration request key has already been used.",
          );
          return store.decode<{
            registration: EventRegistration;
            accessToken: string;
          }>(previous.response);
        }
        const event = await store.setting<PracticeEvent>("event");
        requireValue(event.enabled, 409, "Registration is currently closed.");
        requireValue(
          eventVersion === event.updatedAt,
          409,
          "The event details or price changed. Refresh the page before registering.",
        );
        const token = secret();
        const registration: StoredRegistration = {
          id: randomUUID(),
          referenceNo: "EVT-" + randomUUID().slice(0, 8).toUpperCase(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: parsed!.number,
          event,
          price: event.price,
          status: event.price === 0 ? "registered" : "awaiting_payment",
          paymentStatus: event.price === 0 ? "not_required" : "pending",
          createdAt: new Date().toISOString(),
          accessHash: hash(token),
        };
        const response = {
          registration: publicRegistration(registration),
          accessToken: token,
        };
        await put(store, registration);
        await store.db
          .prepare("INSERT INTO idempotency VALUES(?,?,?)")
          .run("event:" + key, inputHash, store.encode(response));
        await store.audit(registration.id, "event_registration_created");
        if (registration.price === 0)
          await store.job("event_registration_email", registration.id, {});
        return response;
      });
      res.status(201).json(response);
    }),
  );
  router.get(
    "/events/registrations/:id",
    handler(async (req, res) =>
      res.json({ registration: publicRegistration(await access(req)) }),
    ),
  );
  router.post(
    "/events/registrations/:id/payment/order",
    handler(async (req, res) => {
      const result = await store.transaction(async () => {
        const r = await access(req);
        requireValue(
          r.status === "awaiting_payment" && r.price > 0,
          409,
          "This registration does not require payment.",
        );
        const current = await store.setting<PracticeEvent>("event");
        requireValue(
          current.enabled && current.updatedAt === r.event.updatedAt,
          409,
          "This event has changed or registration is closed. Contact the practice before paying.",
        );
        if (!r.orderId) {
          const order = await providers.createOrder({
            fee: r.price,
            referenceNo: r.referenceNo,
          });
          r.orderId = order.id;
          await put(store, r);
        }
        return {
          orderId: r.orderId,
          key: config.razorpayKey,
          amount: Math.round(r.price * 100),
          currency: "INR",
        };
      });
      res.json(result);
    }),
  );
  router.post(
    "/events/registrations/:id/payment/verify",
    handler(async (req, res) => {
      const r = await access(req);
      const { paymentId, signature } = req.body;
      requireValue(
        config.razorpaySecret &&
          r.orderId &&
          typeof paymentId === "string" &&
          /^[a-zA-Z0-9_-]{1,120}$/.test(paymentId) &&
          validHmac(
            `${r.orderId}|${paymentId}`,
            signature,
            config.razorpaySecret,
          ),
        400,
        "Invalid event payment verification.",
      );
      await completeEventPayment(
        store,
        r.id,
        await providers.getPayment(paymentId),
      );
      res.json({
        registration: publicRegistration((await getRegistration(store, r.id))!),
      });
    }),
  );
  return router;
}
