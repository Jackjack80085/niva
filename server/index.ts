import { config as dotenv } from "dotenv";
import express from "express";
import path from "node:path";
import { createApp } from "./app";
import type { Config } from "./providers";
dotenv({ path: ".env.local", quiet: true });
dotenv({ quiet: true });
const production = process.env.NODE_ENV === "production";
const config: Config = {
  encryptionKey: process.env.DATA_ENCRYPTION_KEY,
  gatewaySecret: process.env.GATEWAY_SECRET,
  enablePayments: process.env.ENABLE_PAYMENTS === "true",
  enableCalendar: process.env.ENABLE_CALENDAR === "true",
  enableEmail: process.env.ENABLE_EMAIL === "true",
  production,
  appUrl: process.env.APP_URL || "http://localhost:3000",
  adminPassword: process.env.ADMIN_PASSWORD || (!production ? "2026" : ""),
  databasePath: process.env.DATABASE_PATH || "data/niva.sqlite",
  razorpayKey: process.env.RAZORPAY_KEY_ID,
  razorpaySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  resendKey: process.env.RESEND_API_KEY,
  mailFrom: process.env.MAIL_FROM,
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
};
if (!config.gatewaySecret)
  throw new Error(
    "Start the protected application with npm run dev or npm start.",
  );
if (production && !config.encryptionKey)
  throw new Error(
    "Production requires DATA_ENCRYPTION_KEY and the private gateway.",
  );
const { app, store, runJobs } = await createApp(config);
if (production) {
  app.use(
    express.static(path.resolve("dist"), {
      dotfiles: "deny",
      index: "index.html",
    }),
  );
  app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
}
const server = app.listen(
  Number(process.env.API_PORT || 3001),
  "127.0.0.1",
  () => {
    console.log(
      `Niva API listening on port ${process.env.API_PORT || 3001}. Calendar ${config.calendarId ? "configured" : "deferred"}.`,
    );
  },
);
const jobs = setInterval(() => void runJobs(), 10000);
void runJobs();
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    clearInterval(jobs);
    server.close(async () => {
      await store.close();
      process.exit(0);
    });
  });
