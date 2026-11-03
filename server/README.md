# Booking backend

Node 24 and Express, with shared Postgres for Vercel and encrypted SQLite for local development. The frontend and API use the same origin.

## Local development

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The public gateway listens on localhost:3000 and forwards to the private API on 127.0.0.1:3001 and Vite on 127.0.0.1:3002. SQLite defaults to `data/niva.sqlite`; the local admin password defaults to `2026`. Override ADMIN_PASSWORD before sharing a development environment. Database, key and environment files are ignored by Git.

## Vercel deployment

The existing Vercel project builds the frontend into `dist/`. `api/index.ts` exports `server/vercel.ts` as a Function without opening a listening port or writing a temporary database. The API rewrite precedes the SPA fallback, so `/api/admin/login` reaches Express instead of `index.html`. Node 24 runs in `sin1`, with a 120-second invocation limit.

Set these server-only variables for **Production**, then deploy:

| Variable | Requirement |
| --- | --- |
| DATABASE_URL or POSTGRES_URL | Shared Postgres connection string, preferably the provider's pooled endpoint. Remote connections require verified TLS. |
| ADMIN_PASSWORD | Unique password of at least 12 characters. |
| DATA_ENCRYPTION_KEY | 32 random bytes encoded as 64 hex characters. Preserve separately from the database. |
| APP_URL | Exact public HTTPS origin, such as `https://niva-wheat.vercel.app`. |
| CRON_SECRET | Random secret used to authenticate Vercel's scheduled job request. |
| NODEJS_HELPERS | `0`, so Express receives the original Node request and parses the body itself. |
| ENABLE_PAYMENTS, ENABLE_CALENDAR, ENABLE_EMAIL | Keep `false` until intentionally configuring and testing the respective providers. |

Never prefix secrets with `VITE_`. The schema initializes automatically and verifies the encryption key. Postgres transactions and advisory locks coordinate booking intervals, idempotency and mutations across Function instances. Sessions and approvals survive cold starts and redeployments.

Production credentials must not be shared automatically with every Preview deployment. A preview needs its own database, encryption key and admin credentials; its origin is derived from VERCEL_URL. An unconfigured preview fails closed. Do not use SQLite or `/tmp` for durable Vercel storage.

Vercel's managed platform protection is the outer layer in this deployment; API authentication, validation and rate controls remain the inner layer. The custom local gateway does not run on Vercel. See [SECURITY.md](SECURITY.md) for the boundaries.

## Booking lifecycle and access

1. `GET /api/availability?month=YYYY-MM&serviceId=...` returns slots using server-owned prices, durations and hours. A configured Google calendar removes busy intervals; provider errors fail closed.
2. `POST /api/appointments` accepts name, email, international phone, date, time and serviceId, with a unique `Idempotency-Key` header. The response includes the appointment and a private access token. A shared database transaction prevents overlapping requests and duplicate retries. Client-supplied fee, status and payment fields are ignored.
3. An authenticated admin approves or declines through `POST /api/admin/appointments/:id/decision`. Approval queues a private payment-access email; it does not create a Google event.
4. The approved patient requests `/api/appointments/:id/payment/order`. The backend creates or reuses the order for the stored price.
5. `/payment/verify` validates the payment signature and independently checks captured status, amount, currency and order. Signed `payment.captured` webhooks provide the same fallback. Browser success alone cannot mark a booking paid.
6. Verified capture queues calendar confirmation, then the final email. Missing configuration remains blocked/retryable; conflicts require staff review.

Private status and checkout endpoints require the booking's bearer access token. The browser retains it in sessionStorage. Recovery on another device requires an emailed, single-use verification code through `/api/lookup/start` and `/api/lookup/verify`. With email disabled, existing access links still work but cross-device recovery reports setup pending.

Pending and approved requests hold intervals in this application's database. They do not block the independent Google booking page until a paid event is synced. Google and payment systems cannot share an atomic transaction: conflicts are flagged for staff review. Automatic refunds are not implemented.

## Providers and background delivery

Providers are intentionally off until ENABLE_CALENDAR, ENABLE_PAYMENTS or ENABLE_EMAIL is set to `true` along with the respective credentials:

- **Google:** GOOGLE_CALENDAR_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN. Authorize the calendar owner with `calendar.events` and `calendar.events.freebusy`. The public appointment-schedule URL is not a Calendar ID.
- **Razorpay:** RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET. Configure automatic capture and the `payment.captured` webhook at `/api/webhooks/razorpay`. Test calendar handling and test-mode payments before enabling live charges.
- **Email:** RESEND_API_KEY and a verified MAIL_FROM sender. Approval links carry private credentials in the URL fragment. Clinical reasons are excluded from email bodies and calendar titles.

On Vercel, successful API activity triggers queued work through `waitUntil`. Jobs use database leases so concurrent instances do not claim the same active job; expired leases can be recovered. Provider calls use idempotent identifiers where supported. Temporary failures use capped exponential retries. The Hobby-compatible daily cron (`0 0 * * *`, UTC) calls `/api/cron/jobs` with CRON_SECRET as a fallback. There is no ten-second timer on Vercel, and retries during an idle period may wait for activity or the next cron. The persistent local Node launcher retains its ten-second timer.

After configuring providers, redeploy and use **Connected services → Retry after configuring services**. No live email, charge or calendar write is performed by the test suite.

## Admin and event endpoints

- Admin authentication: `/api/admin/login`, `/session`, `/logout`. Hashed random sessions expire after eight hours; cookies are HttpOnly, SameSite=Strict and Secure in production. Mutation origins must match the configured app origin.
- `/api/admin/appointments` lists approval requests. `/api/admin/calendar?start=YYYY-MM-DD` reads the configured Google calendar for seven days; without credentials it returns `{connected:false,events:[]}`.
- `/api/admin/availability` reads or updates weekly rules for this custom booking UI. Google's Appointment Schedule hours must be edited in Google.
- `/api/admin/blocks` adds or deletes future busy intervals, rejecting appointment overlaps and syncing only app-owned Google events.
- `/api/admin/jobs` lists delivery status without private payloads; `/api/admin/jobs/retry` retries blocked or failed work.
- `/api/admin/event` edits one event/community draft; `/visibility` publishes or hides it. `/api/events` exposes only an enabled entry. Published content requires a heading, description and details; prices have at most two decimals.
- `/api/events/register` saves an attendee with an Idempotency-Key and current `eventVersion`. Free registrations confirm immediately; paid ones require captured payment. Registration status and payment endpoints require its private token. `/api/admin/event/registrations` is admin-only.

Event registrations preserve a snapshot of the event and price. Hiding or editing an event stops new orders for its earlier version; an already-issued order may still capture and is honored. Capacity limits, refunds, cancellations, cross-device event recovery, multi-staff identities and automatic data retention are not implemented.

## Checks and backups

```sh
npm test
npm run lint
npm run build
```

Tests cover authentication, cross-site rejection, encrypted storage, authoritative pricing, interval conflicts, concurrent idempotency, single-use recovery, payment verification, provider adapters and leased jobs. For a persistent Node installation, `npm start` runs the filtering gateway and private API. `npm run backup` snapshots **local SQLite only**; use the managed Postgres provider's backup and restore facilities for Vercel. Protect and retain the encryption key separately, and test restores before relying on real data.
