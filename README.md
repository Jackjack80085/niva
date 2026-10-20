# Healthcare and clinical workspace

React and TypeScript application built with Vite and Tailwind CSS. Includes patient-facing pages, booking flows, and an admin dashboard.

## Run locally

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

## Validate

```sh
npm run lint
npm run build
```

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, add a new project and import the GitHub repository.
3. Use the repository root, the Vite framework preset, `npm ci` for installation, `npm run build` for building, and `dist` as the output directory.
4. Deploy. The included `vercel.json` supplies these settings and SPA fallback routing.

No environment variables are required by the current frontend. The `.env.example` contains placeholders from the original export; Gemini is not currently called by the app.

## Current application limitations

The admin passcode is verified in client-side code and is only a demo gate. Notes and prescriptions are stored in the current browser; there is no shared server database or backend authentication. Add server-side authentication, authorization, and durable data storage before using the dashboard with real patient data.

The exported application currently displays Dr. Niva Jacob branding despite the archive referring to Dr. Siddharth Sen. Review the branding and sample content before public launch.

## Online practice preview

All appointments use online consultations in IST. Booking requests start as pending; the doctor or an authorized associate can accept, decline, reschedule, complete, or cancel them. Accepted bookings support a manually supplied HTTPS video meeting link. No meeting provider or email delivery is connected.

Open `#admin-portal` and use doctor demo PIN `2026`. In Team & access, create local associate profiles with unique four-digit demo PINs and grant appointment, availability, or task access. Patient notes and prescription drafts remain doctor-only. Weekly hours, full-day leave ranges, and 30-minute blocks determine available booking times. Existing appointments remain scheduled when availability changes.

Appointments, schedules, associates, tasks, notes, and prescription drafts persist only in localStorage for this browser and origin. This does not provide real authentication, server-enforced permissions, cross-device booking synchronization, transactional concurrency protection, backups, email notifications, or production clinical record storage. Use sample data only. No Supabase dependency has been added. Browser storage clearing removes locally saved data.

Before launch, connect these workflows to a backend with individual staff authentication, permission enforcement, durable records, concurrency-safe booking, backups, and a chosen video/email service. Verify clinician credentials and replace demonstration content.
