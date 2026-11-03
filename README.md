# Dr. Niva Jacob — online practice

React/TypeScript frontend with a Node 24 Express/SQLite booking backend.

```sh
npm ci
npm run dev
```

Open localhost:3000. An application firewall gateway runs on localhost:3000, with a private API on 127.0.0.1:3001 and private Vite on 127.0.0.1:3002. The local development admin password is `2026`; override ADMIN_PASSWORD in `.env.local`. Production requires a password of at least 12 characters.

Booking requests are stored in SQLite and shared with the admin dashboard. The flow is request → admin approval → approval email/payment access → verified captured payment → Google Calendar confirmation. Provider credentials are optional during development; missing services explicitly report setup pending and jobs remain retryable.

The calendar, Resend and Razorpay adapters are implemented but **not connected to live accounts**. Google Calendar credentials can be supplied later. Providers are explicitly disabled by default. Email and payment credentials are also needed to activate their respective services.

See [backend setup and API guide](server/README.md) for environment variables, endpoints, security boundaries, persistence, deployment and current limitations.

```sh
npm test
npm run lint
npm run build
npm start
```

`npm start` launches the public filtering gateway and private API on a persistent Node 24 server. Production requires a strong admin password and an external encryption key. See server/SECURITY.md for the protection model and deployment requirements. The included Vercel configuration supports a static frontend export only; it is not a full-stack deployment for this backend.
