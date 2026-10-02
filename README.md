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
