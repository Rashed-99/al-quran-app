# Phase 8 — Capacitor + iOS App Store Preparation

## What changed (code)

- **`capacitor.config.json`** (new, frontend root) — app ID, name, splash
  screen/status bar colors matching the app's dark theme, `webDir: dist`.
- **`src/lib/nativeApp.js`** (new) — status bar style, splash screen
  dismissal, Android/iOS hardware back-button handling. Fully guarded by
  `Capacitor.isNativePlatform()` — a complete no-op on the web build, so
  this doesn't affect the Vercel deployment at all.
- **`src/main.jsx`** — calls `initNativeApp()` on startup.
- **`package.json`** (frontend) — added `@capacitor/*` packages and three
  scripts: `cap:sync`, `cap:open:ios`, `cap:run:ios`.
- **`index.html`** — was still Base44's template (title "Base44 APP",
  favicon pointing at `base44.com`). Fixed, plus added proper viewport/
  theme-color meta tags for a native-feeling status bar.
- **`public/manifest.json`** (new) — PWA manifest, also used by Capacitor
  for app metadata. **Needs a real `/public/icon.png`** — see checklist.
- **Backend privacy fix, found during this review**: `GET /api/groups/:id`
  was returning every member's **email address** to every other member
  (only needed for internal use like sending weekly emails). Apple's
  review process specifically scrutinizes apps that share user data
  between users without clear purpose — trimmed the API response to
  `username` only. Frontend (`GroupDetail.jsx`, `WeeklyLeaderboard.jsx`,
  `api/groups.js`) updated to match.
- **Backend cookie fix**: refresh-token cookie now sets `SameSite=None`
  in production (was `Lax`). Required because the Capacitor iOS app's
  origin (`capacitor://localhost`) is cross-site relative to your API
  domain — `Lax` would silently block login on the native app while
  working fine on web, which is a confusing bug to chase later. `None`
  requires `Secure`, which is already tied to `NODE_ENV=production`.
- **Daily reminders didn't actually work on iOS — fixed.**
  `DailyReminder.jsx` and `DailyReflection.jsx` called the **web**
  `Notification` API directly, which cannot deliver notifications inside
  a Capacitor WKWebView, and cannot fire at all while the app is
  backgrounded or closed. Shipped as-is, this would have been a
  documented feature ("get notified to read daily") that silently does
  nothing on iOS — both a poor user experience and a real Guideline 2.1
  (App Completeness) risk. Fixed with a new **`src/lib/notifications.js`**
  abstraction: schedules real, repeating OS-level notifications via
  `@capacitor/local-notifications` on native platforms (added as a new
  dependency this phase), and falls back to the original foreground-timer
  behavior unchanged on web. Both components now route through it instead
  of calling `Notification` directly.
- **Haptic feedback wired in.** `@capacitor/haptics` was already a
  dependency but unused anywhere. Added `src/lib/haptics.js` and wired
  light/medium feedback into `Reading.jsx`'s verse-advance and
  favorite-toggle actions — genuine native tactile response is part of
  what separates an app from a wrapped website (see the Guideline 4.2 row
  in the compliance table below). No-op on web.
- **Removed `@capacitor/preferences`.** It was declared but never used —
  localStorage already works correctly inside a Capacitor WKWebView, so
  this plugin added native binary size and an unused permission surface
  for no benefit.

## iOS build steps

These require Xcode and a macOS machine — not runnable in this sandbox.
Run locally:

```bash
cd frontend
npm install

# 1. Add the native iOS project (generates an ios/ folder - not committed
#    until you've customized it, see .gitignore note below)
npx cap add ios

# 2. Build the web app and copy it into the native project
npm run cap:sync

# 3. Open in Xcode
npm run cap:open:ios
```

In Xcode:

4. Select your Team under **Signing & Capabilities** (requires an Apple
   Developer Program account, $99/year).
5. Set the **Bundle Identifier** to match `capacitor.config.json`'s
   `appId` (`com.alquranapp.reader` is a placeholder — change both to
   your real reverse-DNS identifier registered in App Store Connect).
6. Add app icons and launch screen — see checklist below.
7. Set `VITE_API_BASE_URL` to your **deployed production backend URL**
   before running `npm run cap:sync` — the native app can't reach
   `localhost`. Point it at your Railway/Render URL.
8. Build and run on a simulator or physical device (**Product → Run**) to
   test before archiving.
9. **Product → Archive** → Distribute App → App Store Connect, once
   you're ready to submit.

Re-run `npm run cap:sync` after every frontend change before rebuilding
in Xcode — it copies the latest `dist/` into the native shell.

### A note on `ios/` and git

`npx cap add ios` generates a full native Xcode project under `ios/`.
Capacitor's convention is to commit this folder (unlike `node_modules`)
since it holds your signing config, custom native code, and Xcode
project settings — add it to git normally once generated, it isn't in
`.gitignore` by default from this migration.

## App Store submission checklist

**Assets (blocking — app cannot be submitted without these):**
- [ ] App icon: 1024×1024 PNG, no transparency, no rounded corners
      (Xcode/App Store Connect adds the mask). Generate the full iOS
      icon set from one source image with `npx @capacitor/assets generate`
      or Xcode's asset catalog.
- [ ] Launch screen configured (Capacitor generates a default from
      `capacitor.config.json`'s `backgroundColor` — fine to ship as-is,
      or customize via `ios/App/App/Assets.xcassets`).
- [ ] At least one screenshot per required device size for the App Store
      listing (iPhone 6.7" is currently mandatory; others recommended).
- [ ] `public/icon.png` in the web app itself (referenced by
      `manifest.json` and `index.html`) — currently a **placeholder path
      with no actual file**. Add a real 512×512 PNG.

**Legal (blocking):**
- [ ] **Privacy Policy URL** — required by Apple for every app, no
      exceptions. This app collects email, reading progress, and sends
      chat messages to an LLM provider — all of that needs disclosure.
      Host a simple policy page (even a static page on your Vercel
      deployment) and link it in App Store Connect.
- [ ] **App Privacy "Nutrition Label"** in App Store Connect — declare
      what's collected (Contact Info: email; User Content: reading
      progress, favorites, chat messages) and confirm none of it is used
      for tracking/advertising (it isn't, per your no-ads/no-payments
      decision).
- [ ] Terms of Use — not strictly required without subscriptions, but
      recommended given the social/group features (defines acceptable
      use for shared content).

**Functional (blocking or high-risk if skipped):**
- [ ] **Account deletion** — Apple Guideline 5.1.1(v) requires in-app
      account deletion for any app that supports account creation.
      ✅ Already built (`Settings.jsx` → `DELETE /api/account`,
      atomic cascade delete). Just verify it still works end-to-end
      against your production backend before submitting.
- [ ] Test on a real device, not just the simulator — push notification
      entitlements (if added later), keyboard behavior, and safe-area
      insets can differ.
- [ ] **Test local notifications on a real device**: enable a daily
      reminder in Settings, grant the permission prompt, background the
      app, and confirm the notification actually arrives at the
      scheduled time. This is the one feature in this app that behaves
      completely differently between simulator/web testing and a real
      device — don't skip it.
- [ ] Verify the app functions with a poor/offline connection — Apple
      reviewers routinely test airplane mode. At minimum, show a
      reasonable error state rather than a blank screen or infinite
      spinner (check `Reading.jsx`, `Home.jsx` loading states).
- [ ] Confirm `capacitor.config.json`'s `webContentsDebuggingEnabled` is
      `false` for the release build (already set).

**App Store Connect metadata:**
- [ ] App name, subtitle, description, keywords, category (likely
      "Reference" or "Education" or "Lifestyle" — not "Books" unless you
      want to compete in that specific, crowded category).
- [ ] Age rating questionnaire — see compliance risk below re: the
      Companion chat feature.
- [ ] Support URL and contact email.

## Compliance risk assessment

| Risk | Severity | Notes |
|---|---|---|
| **Sign in with Apple** | Low | Only required if you offer *other* third-party/social login (Google, Facebook, etc.). This app has email/password only — no Sign in with Apple obligation. Confirm this stays true if social login is ever added later. |
| **Account deletion** | Resolved | Guideline 5.1.1(v) compliance already built — see above. |
| **AI Companion chat content moderation** | Medium | The Companion accepts free-text input and returns LLM-generated output. Apple's review guidelines (1.2, 1.4.3, 4.3) increasingly scrutinize AI chat features for: (a) a way to report objectionable output, (b) reasonable content filtering on the LLM side, (c) an appropriate age rating. **Recommendation:** add a lightweight "Report" affordance on Companion messages before submission, and check whatever LLM provider you choose has content-moderation settings enabled. Set the age rating to reflect open-ended AI chat (likely 12+ rather than 4+) even though the app's core purpose is religious/educational. |
| **Group member privacy** | Resolved this phase | Emails were being shared between group members unnecessarily — fixed (see above). |
| **In-app purchases / donations** | Low, watch for later | No payments exist today per your explicit no-monetization decision. If a "Support us" donation link is ever added, Apple restricts linking to *external* payment for **digital content** but generally permits it for genuine charitable donations / real-world services — this is a gray area Apple evaluates case-by-case, so get current guidance before adding one, don't assume the current no-payments design generalizes. |
| **Religious content sensitivity** | Low | Quran text/translations sourced from an established public API (`alquran.cloud`); tafsir sources are named, attributed classical scholars. Low risk of "offensive content" rejection, but do a final read-through of the Companion's system prompt (`companion.service.js`) to ensure it can't be steered into disrespectful or theologically inflammatory output — LLM chat is the least predictable surface in the app. |
| **Native permission usage** | Very low | Uses `navigator.share`, `navigator.clipboard` (user-initiated, no `Info.plist` string needed), plus (new this phase) the standard iOS notification permission prompt via `@capacitor/local-notifications` for the daily reminder feature — a normal, expected prompt tied to a clearly-labeled in-app toggle, not a surprise ask on launch. Haptics require no permission on iOS. No camera/mic/location code paths exist. |
| **Background audio (verse recitation)** | Low | `Reading.jsx`'s audio playback is foreground-only (no background audio mode configured) — matches actual behavior, so no mismatch between declared capabilities and app behavior. If background playback is wanted later, it requires an explicit `UIBackgroundModes: audio` entitlement and consistent behavior, or Apple will reject for capability/behavior mismatch. |
| **Placeholder bundle ID** | Blocking until fixed | `capacitor.config.json`'s `com.alquranapp.reader` is a placeholder — must be replaced with your actual registered identifier before archiving, or the build will fail signing. |

## What's intentionally out of scope here

- **Android/Google Play** — the original brief specified iOS only; the
  Capacitor setup here is cross-platform by nature (`npx cap add android`
  would work with minimal extra effort if wanted later), but Play Store
  submission steps aren't covered.
- **Push notifications (remote/server-sent)** — still not implemented.
  What *is* now implemented (this phase) is client-scheduled **local**
  notifications for the daily reading/reflection reminders, via
  `@capacitor/local-notifications` — these are scheduled on-device and
  don't need a backend component. True push (e.g. "your group member just
  hit their goal") would additionally need `@capacitor/push-notifications`
  and a backend device-token table; not built since nothing in the
  current feature set requires server-initiated pushes.
- **App Store screenshots/marketing assets** — design work outside a
  code migration's scope; the checklist above flags what's needed, not
  how to produce it.
