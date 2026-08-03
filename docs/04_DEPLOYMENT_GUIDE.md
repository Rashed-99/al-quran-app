# Deployment Guide

Follow this in order — each step depends on the one before it. Total
first-time setup: roughly 2-3 hours, most of it waiting on account
verification and your first Codemagic build.

---

## 0. Before you start: pick your real bundle ID

Everything downstream (Apple Developer registration, App Store Connect,
Codemagic signing) is keyed to one identifier. Decide it now — reverse-DNS
format, e.g. `com.yourname.alquran` or `com.yourorg.alquranapp`. You
cannot change it later without creating a new app record from scratch.

Update it in **`frontend/capacitor.config.json`**:
```json
"appId": "com.yourname.alquran"
```
Commit and push this change before continuing.

---

## 1. Database — Neon

1. Sign up at [neon.tech](https://neon.tech) (free tier).
2. Create a project. Note the region — pick one close to wherever you
   deploy the backend (Render, in step 2) to minimize latency.
3. Copy the connection string it gives you (starts with `postgresql://`).
   You'll paste this into Render's environment variables in step 2 —
   **not** into your local `.env`, since this is the production database.
4. Keep this tab open; you'll need the connection string in a minute.

---

## 2. Backend — Render

1. Sign up at [render.com](https://render.com), connect your GitHub account.
2. **New → Web Service**, select your repo.
3. Configure:
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npx prisma migrate deploy && npm start`
     (this runs any pending migrations every time the service starts —
     safe and idempotent; Prisma skips migrations already applied)
   - **Health Check Path:** `/health`
   - **Instance Type:** Free
4. Add environment variables (Render's dashboard, not a file) — use every
   value from `backend/.env.example`, specifically:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step 1 |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` (Render sets its own `PORT` too — Express reads `process.env.PORT` either way via `env.js`) |
   | `CORS_ORIGIN` | leave as `http://localhost:5173` for now — **you'll come back and update this in step 4** |
   | `JWT_ACCESS_SECRET` | the value already generated in your local `backend/.env` |
   | `JWT_REFRESH_SECRET` | same — copy both secrets over, don't regenerate |
   | `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `REFRESH_COOKIE_NAME` | copy as-is from `.env.example` defaults |
   | `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`, `COMPANION_DAILY_MESSAGE_LIMIT` | your chosen LLM provider's values |
   | `SMTP_*` | fill in if you've set up email, otherwise leave blank (app falls back to console logging) |

5. Deploy. First deploy takes a few minutes (installs deps, runs
   migrations against your fresh Neon database).
6. Once live, copy your Render URL — looks like
   `https://al-quran-backend.onrender.com`. Test it:
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   Should return `{"status":"ok"}`. If the service was idle, this first
   request may take 30-50 seconds (free tier cold start) — that's
   expected, not a bug.

**Known tradeoff, accepted:** on the free tier, Render spins the service
down after 15 minutes of no traffic. The first request after that wakes
it back up (~30-50s). Every request after that is normal speed. This is
the cost/UX tradeoff you chose — revisit if it becomes a real problem
(moving to Railway later requires no code changes, just re-pointing
`VITE_API_BASE_URL`).

---

## 3. One-time: precompute tafsir

Run this once, from your own machine, pointed at the **production**
database — not as part of the Render deploy (it's a long-running batch
job, not a web request):

```bash
cd backend
npm install
DATABASE_URL="<your Neon connection string>" \
TAFSIR_LLM_API_URL="<your LLM provider URL>" \
TAFSIR_LLM_API_KEY="<your LLM API key>" \
TAFSIR_LLM_MODEL="<your model>" \
npm run seed:tafsir
```

Takes a while (~18,700 LLM calls, paced to avoid rate limits). Safe to
interrupt and re-run — it skips verses already generated.

---

## 4. Frontend — Vercel

1. Sign up at [vercel.com](https://vercel.com), connect GitHub.
2. **Add New → Project**, select your repo.
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (should auto-detect)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Environment variable:
   - `VITE_API_BASE_URL` = your Render backend URL from step 2
     (e.g. `https://al-quran-backend.onrender.com`)
5. Deploy. You'll get a URL like `https://al-quran-app.vercel.app`.

**Now loop back to Render** (step 2) and update `CORS_ORIGIN` to your
real Vercel URL, e.g.:
```
CORS_ORIGIN=https://al-quran-app.vercel.app
```
Redeploy the backend for this to take effect. Until you do this, the
deployed frontend can't talk to the deployed backend — the browser will
block it as a cross-origin request from an unrecognized domain.

6. Test end to end: open your Vercel URL, register an account, confirm
   you land on Home. If login fails, check the browser console — a CORS
   error there means step 4's loop-back didn't take effect yet.

---

## 5. iOS — Codemagic (no Mac required)

### 5a. Apple Developer setup (one-time, in your browser)

1. At [developer.apple.com/account](https://developer.apple.com/account)
   → Certificates, Identifiers & Profiles → Identifiers → **+** → App IDs
   → register your bundle ID from step 0 (e.g. `com.yourname.alquran`).
2. At [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   → My Apps → **+** → New App → same bundle ID, platform iOS, fill in
   name/language/SKU.
3. Still in App Store Connect: **Users and Access → Integrations → App
   Store Connect API** → generate a new key with **App Manager** access.
   Download the `.p8` file **immediately** — Apple only lets you download
   it once. Note the **Key ID** and **Issuer ID** shown on that page.

### 5b. Codemagic setup

1. Sign up at [codemagic.io](https://codemagic.io) with your GitHub
   account, add this repo.
2. **Teams → Integrations → App Store Connect** → upload the `.p8` file
   plus the Key ID and Issuer ID from 5a.3. Name the integration
   (referenced as `appstore_credentials` in the config below — rename to
   match if you call it something else).
3. Add the `frontend/codemagic.yaml` file from this deliverable to your
   repo (already generated for you — see below). Edit the `BUNDLE_ID`
   value inside it to match step 0.
4. Push to GitHub. Codemagic auto-detects `codemagic.yaml` and shows the
   workflow in its dashboard.
5. Trigger a build (push to `main`, or manually from the dashboard).

The workflow:
- runs on a real Mac (Codemagic's cloud, free tier: 500 min/month)
- builds your Vite app
- runs `npx cap add ios` **on that Mac** — this is what lets you skip
  owning a Mac entirely, since this command normally needs one
- installs CocoaPods, handles code signing automatically via the App
  Store Connect API key
- builds the `.ipa` and uploads it straight to TestFlight

### 5c. After the first successful build

- Check TestFlight (App Store Connect → your app → TestFlight tab) — your
  build should appear within a few minutes of Codemagic finishing.
- Install via TestFlight on a real iPhone and test the full app before
  submitting for review — this is also your chance to catch anything
  from the App Store checklist in `docs/03_PHASE8_IOS_APP_STORE.md`
  (app icon, privacy policy link, account deletion flow, etc.) — none of
  that is automated by this pipeline.
- When ready: App Store Connect → your app → **+ Version** → attach the
  TestFlight build → fill in the remaining metadata from the Phase 8
  checklist → **Submit for Review**.

### A note on `codemagic.yaml` accuracy

Codemagic's YAML schema evolves; I wrote this against my best current
understanding of their code-signing and publishing syntax, but I can't
run it myself (no Codemagic account, no Mac to cross-check against). If
the first build fails on the signing or publishing step specifically
(not the `npm`/`cap` steps, which are plain shell and very unlikely to
be wrong), check the exact error against
[docs.codemagic.io](https://docs.codemagic.io) — the fix is almost
always a small syntax adjustment in the `ios_signing`/`publishing` block,
not a problem with the overall approach.

---

## Summary — what points at what

```
Vercel (frontend)  --VITE_API_BASE_URL-->  Render (backend)
Render (backend)   --CORS_ORIGIN-------->  Vercel URL (must match exactly)
Render (backend)   --DATABASE_URL------->  Neon
Codemagic (iOS)    --VITE_API_BASE_URL-->  Render (baked in at build time,
                                             set as a Codemagic env var,
                                             not read from frontend/.env.local)
```

For the iOS build specifically, add `VITE_API_BASE_URL` as an
environment variable in Codemagic's workflow settings (or in
`codemagic.yaml`'s `vars` block) pointing at your Render URL — the
native app can't reach `localhost`, and `.env.local` isn't committed to
git for Codemagic to read anyway.
