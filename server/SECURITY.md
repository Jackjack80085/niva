# Application security and operation

This implementation protects the app only. It does not alter the computer's OS firewall, network settings or other apps. Payment and Google Calendar setup are excluded; all external delivery providers are disabled by default.

## Two layers

1. **Outer HTTP filtering gateway:** the website entry point on port 3000. It checks the Host header, restricts methods and API paths, blocks traversal/dotfiles/private files, caps headers/body size, imposes request/concurrency limits and timeouts, removes untrusted forwarding headers, and injects a private gateway credential. It emits CSP, anti-framing, no-referrer and other browser security headers. In production, development WebSocket upgrades are disabled.
2. **Inner API controls:** the API binds to 127.0.0.1 and requires the private gateway credential when launched. It rejects cross-site requests, foreign mutation origins, unsupported content types, compressed bodies and oversized payloads. Server-side sessions, patient access tokens, ownership checks, OTP attempt limits, endpoint rate limits, input validation and parameterized SQL enforce access inside the app. The browser cannot grant itself admin access by editing local storage.

`npm run dev` launches both layers and a private Vite process. `npm start` launches the built production gateway and API. GATEWAY_SECRET is generated in memory by the launcher and is not printed or sent to the browser. The edge child receives only its required environment configuration, not the provider/admin/encryption secrets. Both processes still run under the same OS user; this is not operating-system sandbox isolation.

## Confidential data

- AES-256-GCM encrypts private booking records, event registrations, settings, outbox payloads, OTP hashes/booking lists and saved idempotent responses before SQLite stores them. Random nonces and authentication tags detect tampering. High-entropy access/session credentials are stored as hashes where appropriate.
- This is **record encryption, not whole-disk encryption**. SQLite table/schema names, IDs, time indices, statuses in queue metadata and audit timestamps remain visible. Use an encrypted host volume for full filesystem protection.
- No request/response bodies, passwords, access tokens or clinical reasons are logged. Error responses are sanitized. The public event endpoint returns only enabled content; admin APIs and private status APIs require authorization.
- Production requires DATA_ENCRYPTION_KEY: exactly 64 hex characters representing 32 random bytes, injected from a secret manager. The app refuses to start without it. Store it separately from the database and its backups. Losing it loses access to encrypted records. Do not simply replace it: key rotation needs an explicit decrypt/re-encrypt migration.
- Local development automatically creates a mode-0600 `<database>.key` file. This is a convenience, not production key management. Someone who obtains both the DB and local key can decrypt records. Never commit, publish, email or upload either file.
- Existing plaintext app rows migrate to ciphertext on startup, with a WAL checkpoint and VACUUM. This does not erase earlier external backups, disk snapshots, filesystem journals or historic browser data. Those need separate retention/cleanup controls.
- Legacy clinical notes/prescriptions are no longer loaded or written by the frontend. Existing browser entries have not been deleted. Private access-link tokens remain in sessionStorage for status recovery; same-origin script compromise can read them. CSP reduces this risk but does not eliminate it.
- TLS protects data in transit. Put the production gateway behind HTTPS with valid certificates, set APP_URL to the exact public HTTPS origin, and keep API_PORT inaccessible from the network. All public traffic must pass through the gateway. HSTS is sent in production.

## Providers remain off

ENABLE_PAYMENTS, ENABLE_CALENDAR and ENABLE_EMAIL default to false at runtime. Merely supplying credentials cannot activate them. No card details are collected by this app. No real payment, calendar write or email is sent during tests. Provider adapters use fixed HTTPS endpoints, disable redirects and have bounded timeouts. Their configuration and live-account testing are deferred.

The local development admin password remains `2026` for your current preview. It is not suitable for real patient data or a public deployment. Production rejects passwords shorter than 12 characters. Use a unique strong password and restrict dashboard access. MFA/multi-staff account provisioning is not included.

## Backups and recovery

`npm run backup` creates a consistent SQLite snapshot under data/backups (or BACKUP_DIR) with private file permissions. Private records remain encrypted, and the encryption key is not copied. For a built production installation, run `node dist-server/backup.js` with the same server environment and external key. Move backups to an access-controlled encrypted backup service, retain them under an agreed policy, and test restore before using real data. This task does not configure off-site backup storage or automatic deletion.

## Deployment boundaries

This app-level gateway is not a managed WAF, network firewall or DDoS protection service. Host compromise, compromised admin accounts, browser extensions, targeted application bugs, provider account compromise, screenshots, or deliberate disclosure by an authorized admin remain risks. Public deployment still needs infrastructure hardening, TLS, a managed edge/DDoS layer where appropriate, secret management, monitoring, retention procedures and an independent security assessment. No zero-leak or regulatory-compliance guarantee is made.

Security tests cover ciphertext/tamper detection, legacy migration, gateway bypass, path blocking, spoofed forwarding headers, rate limits, CSRF, authentication, object access and disabled providers. Dependency auditing reports known advisories only; a clean audit is not proof that code has no vulnerabilities.
