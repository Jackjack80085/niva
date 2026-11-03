# Dr. Niva Jacob — online practice

React/TypeScript frontend with a Node 24 Express booking API. Vercel serves the frontend and runs the API as a Function; shared Postgres stores bookings, sessions, approvals and event registrations. Local development uses encrypted SQLite by default.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open localhost:3000. The local gateway forwards to a private API on 127.0.0.1:3001 and Vite on 127.0.0.1:3002. The development admin password is `2026`; override ADMIN_PASSWORD in `.env.local`.

For Vercel, configure production-only DATABASE_URL (or POSTGRES_URL), ADMIN_PASSWORD (at least 12 characters), DATA_ENCRYPTION_KEY (64 hex characters), APP_URL (the public HTTPS origin), CRON_SECRET and NODEJS_HELPERS=0. Deploy the existing project with its included `vercel.json`. `/api/*` routes to `api/index.ts`; frontend routes retain their SPA fallback. The function uses Node 24 in Singapore (`sin1`). Preview deployments need their own isolated database and environment settings and fail closed until configured.

The booking flow is request → admin approval → payment access → verified captured payment → Google Calendar confirmation. Calendar, email and payment adapters are implemented but intentionally disabled until their accounts are configured. Missing providers report setup pending; queued work remains retryable.

```sh
npm test
npm run lint
npm run build
```

See [backend setup and API guide](server/README.md) and [security boundaries](server/SECURITY.md). `npm start` remains available for a persistent Node installation with the local filtering gateway; Vercel uses the exported Function instead.
