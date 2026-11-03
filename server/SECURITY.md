# Application security and operation

These controls protect the app. They do not change the computer's OS firewall or other apps. Google Calendar, payment and email integrations remain disabled until explicitly configured.

## Protection layers

On Vercel, the outer layer is Vercel's managed platform protection and HTTPS entry point. Static security headers and API routing are declared in `vercel.json`. The Function validates allowed hosts and derives client identity from Vercel's trusted forwarding data before injecting its private boundary credential. This is not a claim that a custom WAF policy or paid firewall product has been installed.

The inner API enforces the boundary credential, cross-site and mutation-origin checks, content types, payload limits, authenticated server sessions, private patient tokens, OTP limits, endpoint rate limits, validation and parameterized SQL. Editing browser storage cannot grant admin API access. Shared Postgres transactions coordinate mutations across Function instances; background jobs use expiring database leases.

For local development and persistent Node hosting, the custom HTTP gateway remains the outer layer. It filters hosts, methods, paths and private files; limits requests, bodies and concurrency; strips untrusted forwarding headers; and forwards to the loopback-only API. `npm run dev` also starts private Vite; `npm start` serves the built app. The launcher generates GATEWAY_SECRET in memory. These processes share an OS user and do not provide OS sandbox isolation. This local gateway does not run inside Vercel Functions.

## Confidential records and secrets

- AES-256-GCM encrypts private booking records, event registrations, settings, outbox payloads, OTP hashes/booking lists and saved idempotent responses before database storage. Nonces are random and authentication tags detect tampering. High-entropy session/access credentials are hashed where appropriate.
- This is record encryption, not whole-database encryption. Table/schema names, IDs, interval indices, queue metadata and audit timestamps remain visible. Use the database provider's access controls and infrastructure encryption as well.
- Remote Postgres connections verify TLS certificates. Vercel serves the public application over HTTPS. APP_URL must be the exact public HTTPS origin; HSTS and browser security headers are emitted in production.
- DATA_ENCRYPTION_KEY is required for production and all remote Postgres use: exactly 64 hexadecimal characters representing 32 random bytes. Keep it in the hosting secret store and separately from backups. Losing it loses access to encrypted records. Rotation needs a decrypt/re-encrypt migration; changing the variable alone does not rotate records.
- ADMIN_PASSWORD must be unique and at least 12 characters in production. The local `2026` default is development-only. MFA and multi-staff account provisioning are not included. Admin cookies are HttpOnly, SameSite=Strict and Secure in production, with an eight-hour session lifetime.
- Environment variables and database files are excluded from Git. Secrets must never use the `VITE_` prefix. Production database and credentials are scoped to Production; previews require isolated credentials and fail closed until configured.
- Passwords, clinical reasons, private tokens and request/response bodies are not logged by application code. Error responses are sanitized. Hosting/provider logs and operational access still require their own controls.
- Patient access-link tokens remain in sessionStorage; same-origin script compromise can read them. CSP reduces that risk but does not eliminate it. Legacy clinical browser entries have not been deleted.

Local SQLite creates a mode-0600 `<database>.key` file when no explicit key is supplied. This is a development convenience. Anyone with both the database and key can decrypt records. Legacy plaintext SQLite rows migrate on startup with a WAL checkpoint and VACUUM; this does not erase older backups, disk snapshots or filesystem history. Never upload the local database or key as deployment assets.

## Providers and background jobs

ENABLE_PAYMENTS, ENABLE_CALENDAR and ENABLE_EMAIL default to false. Credentials alone do not activate them. The app does not collect card details. Provider adapters use fixed HTTPS endpoints, reject redirects and have bounded timeouts. Tests use mocked providers and do not send real emails, charge cards or write calendar events.

Vercel runs delivery through request-triggered `waitUntil` work and an authenticated daily cron fallback. CRON_SECRET is required for `/api/cron/jobs`; it is not a public job-control endpoint. Database leases prevent two instances from claiming the same active job and allow recovery after an interrupted invocation. Provider idempotency limits duplicate external effects, but does not create a transaction spanning the database, payment system and Google Calendar.

## Backups and recovery

For Vercel, configure backups and restore procedures with the managed Postgres provider. `npm run backup` and `dist-server/backup.js` operate on local SQLite only; they do not back up cloud Postgres. Keep the encryption key separately, restrict backup access and test restoration. Automatic off-site backups, retention/deletion policies and disaster-recovery operations are not supplied by the application.

## Boundaries

No zero-leak or regulatory-compliance guarantee is made. Host or provider compromise, stolen admin credentials, browser extensions, application bugs, screenshots and authorized disclosure remain risks. Production use needs appropriate access controls, monitoring, backup/retention procedures and an independent security review. A clean dependency audit reports known advisories only and does not prove the absence of vulnerabilities.
