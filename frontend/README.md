# Al-Quran (with Translation) — Frontend

React + Vite SPA for the Al-Quran reading and companion app, wrapped with
Capacitor for iOS. Fully standalone — no dependency on Base44 (see
`/docs` at the repo root for the full migration history).

## Prerequisites

- Node.js 20+
- The backend running locally (see `../backend/README.md`) or a deployed
  backend URL
- For iOS builds specifically: a Mac with Xcode 15+, CocoaPods, and an
  Apple Developer account — see `/docs/03_PHASE8_IOS_APP_STORE.md`

## Setup

```bash
npm install
```

Set `VITE_API_BASE_URL` in `.env.local` to point at your backend
(defaults to `http://localhost:4000` for local development).

## Development (web)

```bash
npm run dev
```

## Build (web)

```bash
npm run build
npm run preview   # preview the production build locally
```

## iOS (Capacitor)

```bash
npx cap add ios        # one-time, generates ios/
npm run cap:sync       # build + copy web assets into the native project
npm run cap:open:ios   # open in Xcode
```

Full build steps, App Store checklist, and compliance notes:
`/docs/03_PHASE8_IOS_APP_STORE.md`.

## Structure

```
src/
├── api/           REST API client layer (auth, progress, favorites, groups, companion, tafsir)
├── components/    Feature + UI components
├── lib/           AuthContext, routing helpers, native (Capacitor) bootstrap, notifications, haptics
├── pages/         Route-level pages (including pages/auth/ for login/register/reset)
├── App.jsx        Routing + auth gating
└── pages.config.js  Auto-registered page routes (see file header for how this works)
capacitor.config.json   Capacitor app config (iOS)
```

## Deployment

**Web:** designed for Vercel (or any static host that serves a Vite SPA).
Set `VITE_API_BASE_URL` as an environment variable in your hosting
dashboard pointing at your deployed backend.

**iOS:** see `/docs/03_PHASE8_IOS_APP_STORE.md` for the full App Store
submission process.
