import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, statSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, request as httpRequest } from "node:http";
import { Store } from "./store";
import { createApp } from "./app";
import { createEdge, securityHeaders } from "./firewall";
import { createProviders, type Config } from "./providers";
const config: Config = {
  production: false,
  appUrl: "http://localhost:3000",
  adminPassword: "a-long-test-password",
  databasePath: ":memory:",
};
const listen = async (server: ReturnType<typeof createServer>) => {
  server.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  return "http://127.0.0.1:" + (server.address() as any).port;
};
const close = (server: ReturnType<typeof createServer>) =>
  new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
test("private database fields are authenticated ciphertext, including queue payloads and retry responses", async () => {
  const dir = mkdtempSync(join(tmpdir(), "niva-encryption-")),
    path = join(dir, "private.sqlite");
  const key = randomBytes(32).toString("hex");
  let store = new Store(path, key);
  try {
    await store.put({
      id: "sample-id",
      accessHash: "hash",
      startMs: 1,
      endMs: 2,
      patientName: "Private Sample Name",
      patientEmail: "private-sample@example.com",
    } as any);
    await store.job("approval_email", "sample-id", {
      token: "private-access-token",
    });
    await store.db
      .prepare("INSERT INTO idempotency VALUES(?,?,?)")
      .run(
        "request-key",
        "input-hash",
        store.encode({ accessToken: "private-access-token" }),
      );
    const raw = (await store.db.prepare("SELECT data FROM bookings").get())!
      .data as string;
    assert.ok(raw.startsWith("enc:v1:"));
    assert.ok(!raw.includes("Private Sample Name"));
    assert.equal(
      (await store.get("sample-id"))!.patientEmail,
      "private-sample@example.com",
    );
    assert.ok(
      (
        (await store.db.prepare("SELECT payload FROM jobs").get())!
          .payload as string
      ).startsWith("enc:v1:"),
    );
    assert.ok(
      (
        (await store.db.prepare("SELECT response FROM idempotency").get())!
          .response as string
      ).startsWith("enc:v1:"),
    );
    const parts = raw.split(":");
    parts[4] = (parts[4][0] === "A" ? "B" : "A") + parts[4].slice(1);
    assert.throws(() => store.decode(parts.join(":")));
    assert.equal(statSync(path).mode & 0o777, 0o600);
    await store.close();
    store = new Store(path, key);
    assert.equal(
      (await store.get("sample-id"))!.patientName,
      "Private Sample Name",
    );
    const wrongKeyStore = new Store(path, randomBytes(32).toString("hex"));
    await assert.rejects(wrongKeyStore.ready);
    await assert.rejects(wrongKeyStore.close());
  } finally {
    await store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("legacy plaintext private rows migrate without losing their contents", async () => {
  const dir = mkdtempSync(join(tmpdir(), "niva-migrate-")),
    path = join(dir, "old.sqlite");
  let store = new Store(path);
  try {
    await store.put({
      id: "legacy",
      accessHash: "h",
      startMs: 1,
      endMs: 2,
    } as any);
    await store.db
      .prepare("UPDATE bookings SET data=? WHERE id=?")
      .run(
        JSON.stringify({
          id: "legacy",
          patientEmail: "legacy-private@example.com",
          accessHash: "h",
          startMs: 1,
          endMs: 2,
        }),
        "legacy",
      );
    await store.close();
    store = new Store(path);
    assert.equal(
      (await store.get("legacy"))!.patientEmail,
      "legacy-private@example.com",
    );
    assert.ok(
      (
        (await store.db.prepare("SELECT data FROM bookings").get())!
          .data as string
      ).startsWith("enc:v1:"),
    );
    await store.close();
    assert.ok(
      !readFileSync(path).includes(Buffer.from("legacy-private@example.com")),
    );
    assert.equal(statSync(path + ".key").mode & 0o777, 0o600);
    store = new Store(path);
  } finally {
    await store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("inner API firewall refuses bypass, cross-site requests and non-JSON writes", async () => {
  const store = new Store(":memory:");
  const { app } = await createApp(
    { ...config, gatewaySecret: "private-edge-secret" },
    store,
  );
  const server = createServer(app),
    base = await listen(server);
  try {
    assert.equal((await fetch(base + "/api/health")).status, 403);
    assert.equal(
      (
        await fetch(base + "/api/health", {
          headers: { "x-niva-gateway": "private-edge-secret" },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await fetch(base + "/api/health", {
          headers: {
            "x-niva-gateway": "private-edge-secret",
            "Sec-Fetch-Site": "cross-site",
          },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/api/admin/login", {
          method: "POST",
          headers: {
            "x-niva-gateway": "private-edge-secret",
            Origin: config.appUrl,
            "Content-Type": "text/plain",
          },
          body: "password=secret",
        })
      ).status,
      415,
    );
  } finally {
    await close(server);
    await store.close();
  }
});
test("outer gateway blocks private paths, limits traffic, rejects bad hosts, and strips spoofed forwarding data", async () => {
  const upstream = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        client: req.headers["x-niva-client-ip"],
        forwarded: req.headers["x-forwarded-for"],
        gateway: req.headers["x-niva-gateway"],
      }),
    );
  });
  await listen(upstream);
  const gateway = createEdge({
    production: true,
    appUrl: config.appUrl,
    backendPort: (upstream.address() as any).port,
    secret: "real-private-secret",
    requestLimit: 4,
  });
  const base = await listen(gateway);
  const call = (path: string, headers: Record<string, string> = {}) =>
    new Promise<Response>((resolve, reject) => {
      const request = httpRequest(
        base + path,
        { headers: { Host: "localhost:3000", ...headers } },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () =>
            resolve(
              new Response(Buffer.concat(chunks), {
                status: response.statusCode,
                headers: response.headers as Record<string, string>,
              }),
            ),
          );
        },
      );
      request.on("error", reject);
      request.end();
    });
  try {
    for (const path of [
      "/.env.local",
      "/data/niva.sqlite",
      "/%252eenv",
      "/server/index.ts",
      "/assets/app.js.map",
    ])
      assert.equal((await call(path)).status, 404);
    assert.equal(
      (await call("/api/health", { Host: "untrusted.example" })).status,
      403,
    );
    const publicData = await call("/src/data/initialData.ts");
    assert.equal(publicData.status, 200);
    const first = await call("/api/health", {
      "x-niva-gateway": "spoofed",
      "x-forwarded-for": "8.8.8.8",
      "x-niva-client-ip": "8.8.8.8",
    });
    assert.equal(first.status, 200);
    const data = (await first.json()) as any;
    assert.equal(data.gateway, "real-private-secret");
    assert.equal(data.forwarded, undefined);
    assert.notEqual(data.client, "8.8.8.8");
    assert.equal(first.headers.get("x-frame-options"), "DENY");
    assert.ok(
      first.headers
        .get("content-security-policy")!
        .includes("frame-ancestors 'none'"),
    );
    assert.equal((await call("/api/health")).status, 200);
    assert.equal((await call("/api/health")).status, 200);
    assert.equal((await call("/api/health")).status, 429);
  } finally {
    await close(gateway);
    await close(upstream);
  }
});
test("provider credentials alone cannot enable excluded external services", async () => {
  let calls = 0;
  const providers = createProviders(
    {
      ...config,
      enableCalendar: false,
      enablePayments: false,
      enableEmail: false,
      calendarId: "id",
      googleClientId: "id",
      googleClientSecret: "secret",
      googleRefreshToken: "refresh",
      razorpayKey: "key",
      razorpaySecret: "secret",
      resendKey: "secret",
      mailFrom: "mail@example.com",
    },
    async () => {
      calls++;
      throw new Error("No outbound call expected.");
    },
  );
  assert.equal(providers.calendarConfigured, false);
  assert.equal(providers.paymentConfigured, false);
  assert.equal(providers.mailConfigured, false);
  await assert.rejects(
    providers.listEvents("2026-11-03T00:00:00Z", "2026-11-04T00:00:00Z"),
    /not connected/,
  );
  await assert.rejects(
    providers.createOrder({ fee: 1500, referenceNo: "test" }),
    /not configured/,
  );
  await assert.rejects(
    providers.sendMail(
      "private@example.com",
      "Subject",
      "Private body",
      "test",
    ),
    /not configured/,
  );
  assert.equal(calls, 0);
  assert.ok(
    !securityHeaders(true)
      ["Content-Security-Policy"].split("script-src ")[1]
      .split(";")[0]
      .includes("unsafe-inline"),
  );
});
