# Booking backend

Node.js 24, Express and SQLite. `npm run dev` starts the API on 127.0.0.1:3001 and the public application gateway on localhost:3000 and private Vite on 127.0.0.1:3002. The gateway forwards API requests to the private API and browser assets to Vite. Existing frontend booking and dashboard views use these endpoints.

## Start locally

```sh
npm ci
cp .env.example .env.local
# Set ADMIN_PASSWORD in .env.local. Default 2026 is development-only.
npm run dev
```

The database is `data/niva.sqlite` by default and survives process/browser restarts. Private JSON records are encrypted using AES-256-GCM; see SECURITY.md for keys, backups and metadata limitations. Database and environment files are ignored by Git. Customer access tokens are kept in sessionStorage and private email links; appointment records are stored on the server, not in browser storage. A new device must verify an emailed code to recover a request. Without an email provider, an existing device/access link still works, while cross-device recovery reports that email setup is pending.

## Booking lifecycle

1. `GET /api/availability?month=YYYY-MM&serviceId=...` returns available slots, never patient details. The server owns service prices, durations, hours and interval checks. When Google is configured, the server subtracts its busy intervals; provider errors fail closed.
2. `POST /api/appointments` creates a pending request. Send a unique `Idempotency-Key` header and name, email, international phone, date, time and serviceId. The response contains the appointment and its private access token. Submitted fee/status/payment fields are ignored. An SQLite transaction protects overlapping intervals.
3. The server-authenticated admin approves or declines at `POST /api/admin/appointments/:id/decision` with `{decision:"approve"}` or `{decision:"decline"}`. Approval queues a private payment-access email. Neither approval nor a pending request creates a Google event.
4. The approved patient calls `POST /api/appointments/:id/payment/order`. The server creates/reuses the Razorpay order for the stored price. No charge endpoint exists before approval.
5. Checkout success calls `/payment/verify`. The server verifies Razorpay's HMAC and independently fetches the payment to verify **captured** status, exact amount, currency and order. Signed `payment.captured` webhooks provide the same fallback. Browser success alone does not mark an appointment paid.
6. Verified capture queues one calendar job. Successful event insertion updates `calendarStatus` and queues the final confirmation email. Missing configuration remains explicitly blocked/retryable; a calendar conflict requires staff review and is never reported as confirmed.

Pending and approved requests hold their intervals in this application's database. These holds do not block the independent Google booking page until a paid event is synced. There is no atomic transaction across external Google booking and payment systems: an external calendar change can race with payment. Such conflicts are flagged for staff review; automatic refunds are not implemented. Do not enable live payments before calendar configuration has been tested.

## Provider setup (later)

All credentials are server-only environment variables. Providers are disabled by default; their corresponding ENABLE_CALENDAR, ENABLE_PAYMENTS or ENABLE_EMAIL must also be true when intentionally connecting them later. Never use a `VITE_` prefix for secrets.

- **Google:** enable Calendar API; obtain the owner's calendar ID and server OAuth refresh token using `calendar.events` and `calendar.events.freebusy` scopes. Configure GOOGLE_CALENDAR_ID, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN. The appointment-schedule URL is not a Calendar ID. Tokens are refreshed server-side; no service account or public calendar is required.
- **Razorpay:** set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, configure automatic capture and the `payment.captured` webhook at `https://your-app/api/webhooks/razorpay`; set RAZORPAY_WEBHOOK_SECRET to its secret. Use test-mode keys and test payments first. Only the public checkout key goes to the client.
- **Email:** set RESEND_API_KEY and a verified MAIL_FROM sender. Approval emails link to APP_URL with private credentials in the URL fragment. No diagnosis or patient reason is put in emails or calendar titles.
- After configuration, restart the API and use **Connected services → Retry after configuring services** in the admin dashboard. Jobs run every ten seconds, with capped exponential retries for temporary failures. Persistent provider failures and conflicts are shown in the job list.

Provider adapters are implemented and covered by mocked HTTP tests. No live account authentication, real email delivery, charges, or calendar writes have been performed in this workspace.

## Calendar and availability API

- `GET /api/admin/calendar?start=YYYY-MM-DD` reads seven days from the configured Google calendar with recurrence expansion and pagination. The UI refreshes every minute and when the tab becomes visible. With no credentials it returns `{connected:false,events:[]}` rather than fabricated appointments.
- `GET` / `PUT /api/admin/availability` reads/updates seven weekly rules for **this custom booking UI**. Google's published API does not edit Appointment Schedule weekly-hours settings; manage those settings in Google if retaining its hosted booking page.
- `POST /api/admin/blocks` accepts future ISO `start` and `end`. Overlaps with existing requests are rejected. Busy events use deterministic app-owned IDs. `DELETE /api/admin/blocks/:id` removes only the matching app-created event, never existing patient appointments.
- `GET /api/admin/jobs` lists delivery status, excluding payloads/access tokens; `POST /api/admin/jobs/retry` retries blocked/failed jobs.

## Authentication and deployment

Admin sessions are random, hashed in SQLite, expire after eight hours, and use HttpOnly/SameSite=Strict cookies (Secure in production). Mutations require the exact APP_URL origin. Login, booking and lookup endpoints have rate limits. No client-side PIN grants API access. The legacy unused clinical components are not routed in the active dashboard.

```sh
npm test
npm run lint
npm run build
# Configure .env.local for production; APP_URL must be the real HTTPS origin.
# Set EDGE_HOST=0.0.0.0 and EDGE_PORT as needed behind your HTTPS proxy.
# Keep API_PORT private. Set DATA_ENCRYPTION_KEY before production startup.
npm start
```

The production launcher runs a filtering gateway and a private Node API process; the private process serves `dist/` and `/api` through the gateway. Deploy to a **single persistent Node 24 instance with a persistent volume** for DATABASE_PATH, behind HTTPS. Do not deploy SQLite on ephemeral serverless storage. The existing `vercel.json` describes only the static frontend export and does not deploy this backend. Serve the API and website through the same public gateway origin. Never expose the private API port.

Set ADMIN_PASSWORD to a unique password of at least 12 characters in production, and supply a 64-character hexadecimal DATA_ENCRYPTION_KEY through a secret manager. Back up SQLite and protect the volume, secrets and backups with host-level access controls/encryption. The schema creates automatically on first start. Multiple worker processes/replicas are not supported by this initial implementation; use a shared database and leased jobs before scaling. Audit entries cover booking creation, decisions and verified payment. No automatic refund, data-retention policy, multi-staff identities, production account provisioning, or deployment is included.

## Tests

The API tests use isolated temporary databases and mocked provider calls. They cover session/CSRF enforcement, authoritative pricing, overlaps, idempotency, approval/email gating, forged callbacks, payment amounts/capture, duplicate webhooks, unconfigured providers, OTP recovery, persistence after restart, and block safety. Adapter tests cover pagination, token refresh, fail-closed free/busy checks, deterministic event reuse and app-owned block deletion.

## Optional events and community section

The admin's Events & Community tab edits one featured gathering with heading, description, details, INR price and type. `GET/PUT /api/admin/event` stores its draft; `PATCH /api/admin/event/visibility` accepts `{enabled:true|false}`. Publishing requires saved nonempty heading/description/details. Price must be nonnegative, with at most two decimal places. Turning visibility off preserves content. `GET /api/events` exposes only the enabled entry, never a hidden draft. The homepage polls once per minute and on return to the tab. The public section includes Register & Pay (or Register for free). Registration and Razorpay verification are described below; group-event calendar creation is not automatic.

### Event registration and payment

`POST /api/events/register` accepts name, email, international phone and `eventVersion` (the published entry’s updatedAt), plus an Idempotency-Key header. Price and status come only from the server. The response includes a registration and its private access token. Free registrations confirm immediately; paid registrations stay awaiting_payment. Disabled events or stale event versions reject new registrations.

`GET /api/events/registrations/:id`, `POST .../payment/order` and `POST .../payment/verify` require the registration's bearer access token. Razorpay callbacks use the same server-side signature, order, captured-status, amount and currency checks as appointments. Signed payment.captured webhooks support both types of order. Duplicate callbacks queue only one registration-confirmation email. `GET /api/admin/event/registrations` lists registrations for authenticated staff.

Event snapshots preserve the registered heading, details and price if the admin edits the section later. Hiding/editing the event stops new checkout orders for its earlier version; an already-issued order can still capture and is honored. Event hiding does not issue refunds. Registration recovery in the UI uses the same browser session’s access token; cross-device event recovery, cancellations, capacity limits and refunds are not implemented. Do not switch a paid event to a new occasion until outstanding registrations are resolved.

With no Razorpay credentials, attendee details can be saved but paid registrations remain unconfirmed. No live payments were made while implementing or testing this feature.
