import { apiFirewall } from "./firewall";
import {
  eventRegistrationRoutes,
  completeEventPayment,
  listRegistrations,
  getRegistration,
} from "./eventRegistrations";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomUUID, randomInt, timingSafeEqual } from "node:crypto";
import { SERVICES } from "../src/data/initialData";
import type { DayAvailability, PracticeEvent } from "../src/types";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  Store,
  hash,
  secret,
  publicBooking,
  type Booking,
  type Job,
} from "./store";
import {
  AppError,
  requireValue,
  validHmac,
  createProviders,
  type Config,
  type Providers,
} from "./providers";
type Block = {
  id: string;
  start: string;
  end: string;
  googleEventId?: string;
  syncStatus: string;
};
const asyncRoute =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
const dateKey = (ms: number) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ms);
const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const asDate = (date: string, time: string) =>
  new Date(`${date}T${time}:00+05:30`).getTime();
const safeId = (value: unknown) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(value);
const validDate = (date: unknown): date is string =>
  typeof date === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(asDate(date, "12:00")) &&
  dateKey(asDate(date, "12:00")) === date;
const bearer = (req: Request) =>
  req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
export async function createApp(
  config: Config,
  store = new Store(config.databasePath, config.encryptionKey),
  providers: Providers = createProviders(config),
) {
  requireValue(
    config.adminPassword &&
      (!config.production || config.adminPassword.length >= 10),
    500,
    "Set ADMIN_PASSWORD to at least 10 characters in production.",
  );
  await store.ready;
  const app = express();
  app.use(apiFirewall(config.gatewaySecret, config.production));
  app.disable("x-powered-by");
  app.set("trust proxy", false);
  const origin = new URL(config.appUrl).origin;
  async function rate(req: Request, bucket: string, limit = 30) {
    const key = hash(
      `${bucket}:${config.gatewaySecret || ""}:${config.gatewaySecret ? req.get("x-niva-client-ip") : req.socket.remoteAddress}`,
    );
    const now = Date.now();
    await store.transaction(async () => {
      await store.db
        .prepare("DELETE FROM rate_limits WHERE reset_at < ?")
        .run(now);
      const row = await store.db
        .prepare("SELECT count FROM rate_limits WHERE key=?")
        .get(key);
      requireValue(
        !row || Number(row.count) < limit,
        429,
        "Too many attempts. Please try again later.",
      );
      await store.db
        .prepare(
          "INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=rate_limits.count+1",
        )
        .run(key, now + 15 * 60000);
    });
  }
  const admin = asyncRoute(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const cookie =
          req.headers.cookie
            ?.split(";")
            .map((s) => s.trim())
            .find((s) => s.startsWith("niva_session="))
            ?.slice(13) || "";
        requireValue(
          cookie &&
            (await store.db
              .prepare(
                "SELECT token_hash FROM sessions WHERE token_hash=? AND expires>?",
              )
              .get(hash(cookie), Date.now())),
          401,
          "Please sign in to the admin dashboard.",
        );
        next();
      } catch (error) {
        next(error);
      }
    },
  );
  async function patient(req: Request): Promise<Booking> {
    const id = String(req.params.id);
    const booking = await store.get(id);
    const token = bearer(req);
    const granted =
      token &&
      (await store.db
        .prepare(
          "SELECT booking_id FROM access_grants WHERE token_hash=? AND booking_id=? AND expires>?",
        )
        .get(hash(token), id, Date.now()));
    requireValue(
      booking && token && (hash(token) === booking.accessHash || granted),
      404,
      "Appointment not found or access link is invalid.",
    );
    return booking!;
  }
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
  // Validate signatures against the exact bytes, before JSON parsing or CSRF checks.
  app.post(
    "/api/webhooks/razorpay",
    express.raw({ type: "application/json", limit: "128kb", inflate: false }),
    asyncRoute(async (req, res) => {
      requireValue(
        config.webhookSecret,
        503,
        "Payment webhooks are not configured.",
      );
      requireValue(
        Buffer.isBuffer(req.body) &&
          validHmac(
            req.body,
            req.get("x-razorpay-signature"),
            config.webhookSecret!,
          ),
        401,
        "Invalid webhook signature.",
      );
      let event: any;
      try {
        event = JSON.parse(req.body.toString());
      } catch {
        throw new AppError(400, "Invalid webhook JSON.");
      }
      if (event.event === "payment.captured") {
        const payment = event.payload?.payment?.entity;
        requireValue(
          safeId(payment?.order_id) && safeId(payment?.id),
          400,
          "Invalid payment event.",
        );
        const booking = (await store.list()).find(
          (b) => b.orderId === payment.order_id,
        );
        const registration = booking
          ? undefined
          : (await listRegistrations(store)).find(
              (r) => r.orderId === payment.order_id,
            );
        requireValue(booking || registration, 404, "Unknown order.");
        const verified = await providers.getPayment(payment.id);
        if (booking) await completePayment(booking.id, verified);
        else await completeEventPayment(store, registration!.id, verified);
      }
      res.json({ received: true });
    }),
  );
  app.use(express.json({ limit: "32kb", inflate: false }));
  app.use((req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin !== origin
    )
      return res.status(403).json({ error: "Request origin is not allowed." });
    next();
  });
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/config", (_req, res) =>
    res.json({
      calendarConnected: providers.calendarConfigured,
      paymentsConnected: providers.paymentConfigured,
      emailConnected: providers.mailConfigured,
    }),
  );
  app.post(
    "/api/admin/login",
    asyncRoute(async (req, res, next) => {
      try {
        await rate(req, "login", 10);
        requireValue(
          typeof req.body.password === "string" &&
            req.body.password.length <= 256,
          400,
          "Enter your admin password.",
        );
        const supplied = Buffer.from(hash(req.body.password), "hex");
        requireValue(
          timingSafeEqual(
            supplied,
            Buffer.from(hash(config.adminPassword), "hex"),
          ),
          401,
          "Incorrect admin password.",
        );
        const token = secret();
        await store.db
          .prepare("DELETE FROM sessions WHERE expires<?")
          .run(Date.now());
        await store.db
          .prepare("INSERT INTO sessions VALUES(?,?)")
          .run(hash(token), Date.now() + 8 * 3600000);
        res.cookie("niva_session", token, {
          httpOnly: true,
          secure: config.production,
          sameSite: "strict",
          maxAge: 8 * 3600000,
          path: "/api",
        });
        res.json({ authenticated: true });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.get("/api/admin/session", admin, (_req, res) =>
    res.json({ authenticated: true }),
  );
  app.post(
    "/api/admin/logout",
    admin,
    asyncRoute(async (req, res) => {
      const token =
        req.headers.cookie
          ?.split(";")
          .map((s) => s.trim())
          .find((s) => s.startsWith("niva_session="))
          ?.slice(13) || "";
      await store.db
        .prepare("DELETE FROM sessions WHERE token_hash=?")
        .run(hash(token));
      res.clearCookie("niva_session", { path: "/api" });
      res.json({ ok: true });
    }),
  );
  type AvailabilitySnapshot = {
    hours: DayAvailability[];
    blocks: Block[];
    bookings: Booking[];
  };
  async function availabilitySnapshot(): Promise<AvailabilitySnapshot> {
    const [hours, blocks, bookings] = await Promise.all([
      store.setting<DayAvailability[]>("hours"),
      store.setting<Block[]>("blocks"),
      store.list(),
    ]);
    return { hours, blocks, bookings };
  }
  function availableIn(
    snapshot: AvailabilitySnapshot,
    date: string,
    time: string,
    duration: number,
    excludeId?: string,
  ) {
    const start = asDate(date, time),
      end = start + duration * 60000;
    const day = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    const hours = snapshot.hours.find((h) => h.day === day);
    if (
      !hours?.enabled ||
      start < Date.now() + 15 * 60000 ||
      start > Date.now() + 180 * 86400000 ||
      minutes(time) < minutes(hours.startTime) ||
      minutes(time) + duration > minutes(hours.endTime)
    )
      return false;
    if (
      snapshot.blocks.some(
        (b) => Date.parse(b.start) < end && Date.parse(b.end) > start,
      )
    )
      return false;
    return !snapshot.bookings.some(
      (b) =>
        b.id !== excludeId &&
        !["rejected", "cancelled"].includes(b.status) &&
        b.startMs < end &&
        b.endMs > start,
    );
  }
  async function localAvailable(
    date: string,
    time: string,
    duration: number,
    excludeId?: string,
  ) {
    return availableIn(
      await availabilitySnapshot(),
      date,
      time,
      duration,
      excludeId,
    );
  }
  async function externalAvailable(start: number, end: number) {
    return (
      !providers.calendarConfigured ||
      !(await providers.busy(start, end)).length
    );
  }
  app.get(
    "/api/availability",
    asyncRoute(async (req, res) => {
      await rate(req, "availability", 120);
      const month = String(req.query.month || ""),
        service = SERVICES.find((s) => s.id === req.query.serviceId);
      requireValue(
        /^\d{4}-\d{2}$/.test(month) && validDate(month + "-01") && service,
        400,
        "Choose a valid month and service.",
      );
      const start = asDate(month + "-01", "00:00");
      requireValue(
        start > Date.now() - 32 * 86400000 &&
          start < Date.now() + 181 * 86400000,
        400,
        "Month is outside the booking window.",
      );
      const endDate = new Date(month + "-01T12:00:00Z");
      endDate.setUTCMonth(endDate.getUTCMonth() + 1);
      const end = asDate(endDate.toISOString().slice(0, 10), "00:00");
      const busy = providers.calendarConfigured
        ? await providers.busy(start, end)
        : [];
      const snapshot = await availabilitySnapshot();
      const byDate: Record<string, string[]> = {};
      for (let day = 1; day <= 31; day++) {
        const date = month + "-" + String(day).padStart(2, "0");
        if (!validDate(date)) break;
        byDate[date] = [];
        for (let i = 0; i < 48; i++) {
          const time = `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
            ms = asDate(date, time);
          if (
            availableIn(snapshot, date, time, service!.durationMin) &&
            !busy.some(
              (b) =>
                Date.parse(b.start) < ms + service!.durationMin * 60000 &&
                Date.parse(b.end) > ms,
            )
          )
            byDate[date].push(time);
        }
      }
      res.json({
        byDate,
        source: providers.calendarConfigured
          ? "google-calendar"
          : "application-hours",
        timeZone: "Asia/Kolkata",
      });
    }),
  );
  app.post(
    "/api/appointments",
    asyncRoute(async (req, res) => {
      await rate(req, "bookings", 20);
      const {
        patientName,
        patientEmail,
        patientPhone,
        date,
        time,
        serviceId,
        reason = "",
      } = req.body;
      requireValue(
        typeof patientName === "string" &&
          patientName.trim().length > 0 &&
          patientName.length <= 100 &&
          typeof patientEmail === "string" &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail) &&
          patientEmail.length <= 254,
        400,
        "Enter a valid name and email.",
      );
      const phone =
        typeof patientPhone === "string"
          ? parsePhoneNumberFromString(patientPhone)
          : undefined;
      requireValue(
        phone?.isPossible(),
        400,
        "Enter a valid international phone number.",
      );
      const service = SERVICES.find((s) => s.id === serviceId);
      requireValue(
        service &&
          validDate(date) &&
          typeof time === "string" &&
          /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(time) &&
          typeof reason === "string" &&
          reason.length <= 1000,
        400,
        "Choose a valid service, date and time.",
      );
      const key = req.get("Idempotency-Key");
      requireValue(
        key && /^[a-zA-Z0-9_-]{16,100}$/.test(key),
        400,
        "A booking request key is required.",
      );
      const inputHash = hash(
        JSON.stringify([
          patientName,
          patientEmail,
          phone!.number,
          date,
          time,
          serviceId,
          reason,
        ]),
      );
      const previous = await store.db
        .prepare("SELECT payload_hash,response FROM idempotency WHERE key=?")
        .get(key!);
      if (previous) {
        requireValue(
          previous.payload_hash === inputHash,
          409,
          "This request key has already been used.",
        );
        return res.status(201).json(store.decode(previous.response as string));
      }
      requireValue(
        await externalAvailable(
          asDate(date, time),
          asDate(date, time) + service!.durationMin * 60000,
        ),
        409,
        "This time is no longer available. Choose another slot.",
      );
      const accessToken = secret();
      const booking: Booking = {
        id: randomUUID(),
        referenceNo: "APT-" + randomUUID().slice(0, 8).toUpperCase(),
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim().toLowerCase(),
        patientPhone: phone!.number,
        date,
        time,
        serviceId: service!.id,
        consultingFor: service!.name,
        durationMin: service!.durationMin,
        fee: service!.fee,
        reason,
        status: "pending",
        paymentStatus: "pending",
        clinicId: "online",
        patientType: "new-patient",
        createdAt: new Date().toISOString(),
        accessHash: hash(accessToken),
        startMs: asDate(date, time),
        endMs: asDate(date, time) + service!.durationMin * 60000,
        calendarStatus: "waiting_payment",
      };
      const response = await store.transaction(async () => {
        const previous = await store.db
          .prepare("SELECT payload_hash,response FROM idempotency WHERE key=?")
          .get(key!);
        if (previous) {
          requireValue(
            previous.payload_hash === inputHash,
            409,
            "This request key has already been used.",
          );
          return store.decode<{
            appointment: ReturnType<typeof publicBooking>;
            accessToken: string;
          }>(previous.response);
        }
        requireValue(
          await localAvailable(date, time, service!.durationMin),
          409,
          "This time is no longer available.",
        );
        const response = { appointment: publicBooking(booking), accessToken };
        await store.put(booking);
        await store.db
          .prepare("INSERT INTO idempotency VALUES(?,?,?)")
          .run(key!, inputHash, store.encode(response));
        await store.audit(booking.id, "request_created");
        return response;
      });
      res.status(201).json(response);
    }),
  );
  app.get(
    "/api/appointments/:id",
    asyncRoute(async (req, res, next) => {
      try {
        res.json({ appointment: publicBooking(await patient(req)) });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.post(
    "/api/lookup/start",
    asyncRoute(async (req, res) => {
      await rate(req, "lookup", 10);
      requireValue(
        providers.mailConfigured,
        503,
        "Email verification is not configured yet. Use your booking access link on this device.",
      );
      const { name, email, phone } = req.body;
      requireValue(
        typeof name === "string" &&
          typeof email === "string" &&
          typeof phone === "string" &&
          name.length <= 100 &&
          email.length <= 254 &&
          phone.length <= 30,
        400,
        "Enter your booking details.",
      );
      const normalized = parsePhoneNumberFromString(phone)?.number;
      const ids = (await store.list())
        .filter(
          (b) =>
            b.patientName.toLowerCase() === name.trim().toLowerCase() &&
            b.patientEmail === email.trim().toLowerCase() &&
            b.patientPhone === normalized,
        )
        .map((b) => b.id);
      const id = randomUUID(),
        code = String(randomInt(100000, 1000000));
      await store.db
        .prepare("DELETE FROM lookup_codes WHERE expires<?")
        .run(Date.now());
      await store.db
        .prepare("INSERT INTO lookup_codes VALUES(?,?,?,?,0,?)")
        .run(
          id,
          "",
          store.encode(hash(id + code)),
          Date.now() + 10 * 60000,
          store.encode(ids),
        );
      if (ids.length)
        await store.job(
          "lookup_email",
          "",
          { to: email.trim().toLowerCase(), code },
          "lookup:" + id,
        );
      res
        .status(202)
        .json({
          challengeId: id,
          message:
            "If the details match a booking, a verification code will be emailed.",
        });
    }),
  );
  app.post(
    "/api/lookup/verify",
    asyncRoute(async (req, res, next) => {
      try {
        await rate(req, "lookup_verify", 20);
        const { challengeId, code } = req.body;
        requireValue(
          typeof challengeId === "string" &&
            typeof code === "string" &&
            /^\d{6}$/.test(code),
          400,
          "Enter the six-digit verification code.",
        );
        const results = await store.transaction(async () => {
          const row = await store.db
            .prepare("SELECT * FROM lookup_codes WHERE id=?")
            .get(challengeId);
          if (
            !row ||
            Number(row.expires) <= Date.now() ||
            Number(row.attempts) >= 5
          )
            return null;
          await store.db
            .prepare("UPDATE lookup_codes SET attempts=attempts+1 WHERE id=?")
            .run(challengeId);
          if (store.decode<string>(row.code_hash) !== hash(challengeId + code))
            return null;
          const results = [];
          for (const id of store.decode<string[]>(row.booking_ids)) {
            const booking = await store.get(id);
            if (!booking) continue;
            const token = secret();
            await store.db
              .prepare("INSERT INTO access_grants VALUES(?,?,?)")
              .run(hash(token), id, Date.now() + 30 * 86400000);
            results.push({
              appointment: publicBooking(booking),
              accessToken: token,
            });
          }
          await store.db
            .prepare("DELETE FROM lookup_codes WHERE id=?")
            .run(challengeId);
          return results;
        });
        requireValue(results, 400, "Verification code is invalid or expired.");
        res.json({ results });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.get(
    "/api/admin/appointments",
    admin,
    asyncRoute(async (_req, res) =>
      res.json({ appointments: (await store.list()).map(publicBooking) }),
    ),
  );
  app.post(
    "/api/admin/appointments/:id/decision",
    admin,
    asyncRoute(async (req, res) => {
      const { decision } = req.body;
      requireValue(
        ["approve", "decline"].includes(decision),
        400,
        "Choose approve or decline.",
      );
      const id = String(req.params.id);
      const token = secret();
      await store.transaction(async () => {
        const b = await store.get(id);
        requireValue(b, 404, "Request not found.");
        const status = decision === "approve" ? "confirmed" : "rejected";
        if (b!.status === status) return;
        requireValue(
          b!.status === "pending",
          409,
          "This request has already been reviewed.",
        );
        requireValue(
          decision !== "approve" || b!.startMs > Date.now(),
          409,
          "The appointment time has passed.",
        );
        b!.status = status;
        await store.put(b!);
        await store.audit(id, decision);
        if (decision === "approve") {
          await store.db
            .prepare("INSERT INTO access_grants VALUES(?,?,?)")
            .run(hash(token), id, Date.now() + 30 * 86400000);
          await store.job("approval_email", id, { token });
        } else await store.job("decline_email", id, {});
      });
      res.json({ appointment: publicBooking((await store.get(id))!) });
    }),
  );
  app.get(
    "/api/admin/jobs",
    admin,
    asyncRoute(async (_req, res) =>
      res.json({
        jobs: await store.db
          .prepare(
            "SELECT id,kind,booking_id,status,attempts,last_error FROM jobs ORDER BY id DESC LIMIT 100",
          )
          .all(),
      }),
    ),
  );
  app.post(
    "/api/admin/jobs/retry",
    admin,
    asyncRoute(async (_req, res) => {
      await store.db
        .prepare(
          "UPDATE jobs SET status='pending',next_run=0 WHERE status IN ('blocked','failed')",
        )
        .run();
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/admin/calendar",
    admin,
    asyncRoute(async (req, res) => {
      const start = String(req.query.start || "");
      requireValue(validDate(start), 400, "Choose a valid week start.");
      if (!providers.calendarConfigured)
        return res.json({ connected: false, events: [] });
      const end = asDate(start, "00:00") + 7 * 86400000;
      const events = await providers.listEvents(
        new Date(asDate(start, "00:00")).toISOString(),
        new Date(end).toISOString(),
      );
      res.json({
        connected: true,
        events,
        updatedAt: new Date().toISOString(),
      });
    }),
  );
  // A single optional event/community feature. Drafts never reach the public endpoint.
  const eventReady = (event: PracticeEvent) =>
    !!(
      event.heading.trim() &&
      event.description.trim() &&
      event.details.trim()
    );
  app.get(
    "/api/events",
    asyncRoute(async (_req, res) => {
      const event = await store.setting<PracticeEvent>("event");
      res.json({ event: event.enabled ? event : null });
    }),
  );
  app.get(
    "/api/admin/event",
    admin,
    asyncRoute(async (_req, res) =>
      res.json({ event: await store.setting("event") }),
    ),
  );
  app.put(
    "/api/admin/event",
    admin,
    asyncRoute(async (req, res, next) => {
      try {
        const { heading, description, details, price, kind } = req.body;
        requireValue(
          typeof heading === "string" &&
            heading.length <= 120 &&
            typeof description === "string" &&
            description.length <= 3000 &&
            typeof details === "string" &&
            details.length <= 3000 &&
            typeof price === "number" &&
            Number.isFinite(price) &&
            price >= 0 &&
            price <= 1000000 &&
            Math.abs(price * 100 - Math.round(price * 100)) < 0.000001 &&
            ["event", "community"].includes(kind),
          400,
          "Enter valid event fields and a price with up to two decimal places.",
        );
        const event = await store.transaction(async () => {
          const event: PracticeEvent = {
            heading: heading.trim(),
            description: description.trim(),
            details: details.trim(),
            price,
            kind,
            enabled: (await store.setting<PracticeEvent>("event")).enabled,
            updatedAt: new Date().toISOString(),
          };
          requireValue(
            !event.enabled || eventReady(event),
            400,
            "Published events need a heading, description and details.",
          );
          await store.setSetting("event", event);
          await store.audit("event-settings", "event_updated");
          return event;
        });
        res.json({ event });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.patch(
    "/api/admin/event/visibility",
    admin,
    asyncRoute(async (req, res, next) => {
      try {
        requireValue(
          typeof req.body.enabled === "boolean",
          400,
          "Choose whether the event should be visible.",
        );
        const event = await store.transaction(async () => {
          const event = await store.setting<PracticeEvent>("event");
          requireValue(
            !req.body.enabled || eventReady(event),
            400,
            "Save a heading, description and details before turning this on.",
          );
          event.enabled = req.body.enabled;
          event.updatedAt = new Date().toISOString();
          await store.setSetting("event", event);
          await store.audit(
            "event-settings",
            event.enabled ? "event_published" : "event_hidden",
          );
          return event;
        });
        res.json({ event });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.get(
    "/api/admin/availability",
    admin,
    asyncRoute(async (_req, res) =>
      res.json({
        hours: await store.setting("hours"),
        blocks: await store.setting("blocks"),
      }),
    ),
  );
  app.put(
    "/api/admin/availability",
    admin,
    asyncRoute(async (req, res, next) => {
      try {
        const hours = req.body.hours;
        const validTime = (value: unknown) =>
          typeof value === "string" &&
          /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
        const names = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        requireValue(
          Array.isArray(hours) &&
            hours.length === 7 &&
            new Set(hours.map((h) => h.day)).size === 7 &&
            hours.every(
              (h) =>
                names.includes(h.day) &&
                typeof h.enabled === "boolean" &&
                validTime(h.startTime) &&
                validTime(h.endTime) &&
                h.startTime < h.endTime,
            ),
          400,
          "Supply seven valid day schedules.",
        );
        await store.setSetting(
          "hours",
          hours.map((h: DayAvailability) => ({
            day: h.day,
            enabled: h.enabled,
            startTime: h.startTime,
            endTime: h.endTime,
            clinicId: "online",
            slotDurationMin: 30,
          })),
        );
        res.json({
          ok: true,
          syncMode: "application-hours",
          message:
            "Custom booking hours updated. Google Appointment Schedule hours must be edited in Google.",
        });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.post(
    "/api/admin/blocks",
    admin,
    asyncRoute(async (req, res, next) => {
      try {
        const start = Date.parse(req.body.start),
          end = Date.parse(req.body.end);
        requireValue(
          Number.isFinite(start) &&
            Number.isFinite(end) &&
            end > start &&
            start > Date.now() &&
            end - start <= 366 * 86400000,
          400,
          "Choose a valid future interval.",
        );
        const block: Block = {
          id: randomUUID(),
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          syncStatus: "queued",
        };
        await store.transaction(async () => {
          requireValue(
            !(await store.list()).some(
              (b) =>
                !["rejected", "cancelled"].includes(b.status) &&
                b.startMs < end &&
                b.endMs > start,
            ),
            409,
            "This block overlaps an appointment request.",
          );
          await store.setSetting("blocks", [
            ...(await store.setting<Block[]>("blocks")),
            block,
          ]);
          await store.job("block_sync", block.id, { block });
        });
        res.status(201).json({ block });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.delete(
    "/api/admin/blocks/:id",
    admin,
    asyncRoute(async (req, res, next) => {
      try {
        await store.transaction(async () => {
          const blocks = await store.setting<Block[]>("blocks"),
            block = blocks.find((b) => b.id === req.params.id);
          requireValue(block, 404, "Block not found.");
          await store.setSetting(
            "blocks",
            blocks.filter((b) => b.id !== block!.id),
          );
          await store.job("block_delete", block!.id, { block });
        });
        res.json({ ok: true });
      } catch (error) {
        next(error);
      }
    }),
  );
  app.post(
    "/api/appointments/:id/payment/order",
    asyncRoute(async (req, res) => {
      const b = await patient(req);
      requireValue(
        b.status === "confirmed" &&
          b.paymentStatus !== "paid" &&
          b.startMs > Date.now(),
        409,
        "Payment is available only for an approved future appointment.",
      );
      const order = await store.transaction(async () => {
        const fresh = (await store.get(b.id))!;
        requireValue(
          fresh.status === "confirmed" &&
            fresh.paymentStatus !== "paid" &&
            fresh.startMs > Date.now(),
          409,
          "Payment is available only for an approved future appointment.",
        );
        if (fresh.orderId) return { id: fresh.orderId };
        requireValue(
          await externalAvailable(fresh.startMs, fresh.endMs),
          409,
          "The calendar slot has changed. Contact the practice before paying.",
        );
        const order = await providers.createOrder(fresh);
        fresh.orderId = order.id;
        await store.put(fresh);
        return order;
      });
      res.json({
        orderId: order.id,
        key: config.razorpayKey,
        amount: b.fee * 100,
        currency: "INR",
      });
    }),
  );
  async function completePayment(id: string, payment: any) {
    await store.transaction(async () => {
      const b = (await store.get(id))!;
      requireValue(
        b.orderId === payment.order_id &&
          payment.status === "captured" &&
          payment.amount === b.fee * 100 &&
          payment.currency === "INR",
        400,
        "Payment has not been captured for the expected amount.",
      );
      if (b.paymentStatus === "paid") {
        requireValue(
          b.paymentId === payment.id,
          409,
          "A different payment already exists.",
        );
        return;
      }
      requireValue(
        b.status === "confirmed",
        409,
        "Appointment is not approved.",
      );
      b.paymentStatus = "paid";
      b.paymentId = payment.id;
      b.calendarStatus = "queued";
      await store.put(b);
      await store.job("calendar_booking", id, {});
      await store.audit(id, "payment_captured");
    });
  }
  app.post(
    "/api/appointments/:id/payment/verify",
    asyncRoute(async (req, res) => {
      const b = await patient(req);
      const { paymentId, signature } = req.body;
      requireValue(
        config.razorpaySecret &&
          b.orderId &&
          safeId(paymentId) &&
          validHmac(
            `${b.orderId}|${paymentId}`,
            signature,
            config.razorpaySecret,
          ),
        400,
        "Invalid payment verification.",
      );
      await completePayment(b.id, await providers.getPayment(paymentId));
      res.json({ appointment: publicBooking((await store.get(b.id))!) });
    }),
  );
  app.use(
    "/api",
    eventRegistrationRoutes({ store, providers, config, admin, rate }),
  );
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    res
      .status(
        error instanceof AppError
          ? error.status
          : [400, 413, 415].includes(error.status)
            ? error.status
            : 500,
      )
      .json({
        error:
          error instanceof AppError
            ? error.message
            : error.status === 400
              ? "Invalid request body."
              : error.status === 413
                ? "Request body is too large."
                : error.status === 415
                  ? "Unsupported request encoding."
                  : "The request could not be completed. Please try again.",
      });
  });
  async function runJobs() {
    const deadline = Date.now() + 35_000;
    for (let count = 0; count < 20 && Date.now() < deadline; count++) {
      const job = await store.claimJob();
      if (!job) break;
      try {
        const payload = store.decode<any>(job.payload),
          b = await store.get(job.bookingId);
        if (job.kind === "calendar_booking") {
          requireValue(
            b?.paymentStatus === "paid",
            409,
            "Payment is required before calendar confirmation.",
          );
          const event = await providers.syncBooking(b!);
          await store.transaction(async () => {
            const fresh = (await store.get(job.bookingId))!;
            fresh.calendarEventId = event.id;
            fresh.calendarStatus = "synced";
            fresh.meetingUrl = event.hangoutLink;
            await store.put(fresh);
            await store.job("confirmation_email", fresh.id, {});
          });
        } else if (job.kind === "block_sync" || job.kind === "block_delete") {
          await store.transaction(async () => {
            const blocks = await store.setting<Block[]>("blocks");
            if (
              job.kind === "block_delete" ||
              blocks.some((block) => block.id === job.bookingId)
            )
              await providers.syncBlock(
                payload.block,
                job.kind === "block_delete",
              );
            await store.setSetting(
              "blocks",
              blocks.map((block) =>
                block.id === job.bookingId
                  ? { ...block, syncStatus: "synced" }
                  : block,
              ),
            );
          });
        } else if (job.kind === "event_registration_email") {
          const r = await getRegistration(store, job.bookingId);
          requireValue(
            r?.status === "registered",
            409,
            "Event registration is not confirmed.",
          );
          await providers.sendMail(
            r!.email,
            "Your event registration is confirmed",
            `You are registered for ${r!.event.heading}.\n\n${r!.event.details}\n\nReference: ${r!.referenceNo}`,
            "niva-event-" + job.id,
          );
        } else {
          let to = b?.patientEmail || payload.to,
            subject = "",
            text = "";
          if (job.kind === "lookup_email") {
            subject = "Your appointment verification code";
            text = `Your code is ${payload.code}. It expires in 10 minutes. If you did not request it, ignore this email.`;
          } else if (job.kind === "approval_email") {
            subject = "Your appointment request is approved";
            text = `Your appointment request has been approved. Continue to payment using your private access link:\n${config.appUrl.replace(/\/$/, "")}/#booking?appointment=${b!.id}&token=${payload.token}\nYour calendar booking is confirmed after successful payment.`;
          } else if (job.kind === "decline_email") {
            subject = "Update on your appointment request";
            text =
              "Your requested appointment time was not approved. Please contact the practice or request another time.";
          } else if (job.kind === "confirmation_email") {
            subject = "Your appointment is confirmed";
            text = `Your appointment is confirmed for ${b!.date} at ${b!.time} IST.${b!.meetingUrl ? "\nJoin: " + b!.meetingUrl : ""}`;
          } else throw new AppError(400, "Unknown job.");
          await providers.sendMail(to, subject, text, "niva-job-" + job.id);
        }
        await store.finishJob(job, "done");
      } catch (error) {
        const e = error as AppError;
        const blocked = e.status === 503 || e.status === 409;
        await store.finishJob(
          job,
          blocked ? "blocked" : job.attempts >= 7 ? "failed" : "pending",
          Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts),
          e instanceof AppError
            ? e.message
            : "Provider temporarily unavailable.",
        );
        if (e.status === 409 && job.kind === "calendar_booking") {
          await store.transaction(async () => {
            const b = (await store.get(job.bookingId))!;
            b.calendarStatus = "conflict";
            await store.put(b);
          });
        }
      }
    }
  }
  return { app, store, runJobs };
}
