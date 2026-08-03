# Phase 2 — Base44 Dependency Report & Migration Roadmap

Scope now locked in:
- **No payments.** Stripe removed entirely from the target stack. No subscriptions, no in-app purchases, now or later.
- **AI Companion architecture:** precomputed/cached tafsir (Ibn Kathir, al-Jalalayn, al-Sa'di) generated once and stored in Postgres; rule-based templated progress encouragement (no LLM); open-ended chat kept but rate-limited and run against a free-tier LLM API.

No code has been modified yet — this is still analysis/design.

---

## Base44 Dependency Report

Format: File / Purpose / Replacement Strategy, one entry per Base44 touchpoint.

---

**File:** `src/api/base44Client.js`
**Purpose:** Instantiates the `@base44/sdk` client (`createClient`) used everywhere else in the app.
**Replacement Strategy:** Delete file. Create `src/api/httpClient.js` — a thin `fetch`/`axios` wrapper that attaches the JWT access token to every request and transparently retries once via `/auth/refresh` on a 401.

---

**File:** `src/lib/app-params.js`
**Purpose:** Reads Base44's `appId` and `token` from URL query params / localStorage — Base44's cross-domain login handoff mechanism.
**Replacement Strategy:** Delete file entirely. No equivalent needed — the new app owns its own login form and issues its own JWTs directly, so there's no external app handoff to manage.

---

**File:** `src/lib/AuthContext.jsx`
**Purpose:** Bootstraps session on load; calls `base44.auth.me()`, `base44.auth.logout()`, `base44.auth.redirectToLogin()`; also makes a raw axios call to Base44's `/api/apps/public/prod/public-settings/by-id/:appId` to detect `auth_required` / `user_not_registered` states.
**Replacement Strategy:** Rewrite as a context that calls new endpoints: `GET /auth/me`, `POST /auth/logout`. Drop the "public settings" / `user_not_registered` concept — that's a Base44 multi-tenant-app mechanism this single-purpose app doesn't need. Replace `redirectToLogin()` with an in-app route to `/login` (this app has no login UI today — new build, see Phase 6 below).

---

**File:** `src/lib/NavigationTracker.jsx`
**Purpose:** Calls `base44.appLogs.logUserInApp(pageName)` on every route change — page-view analytics.
**Replacement Strategy:** Drop, or replace with a free/low-cost analytics tool (e.g. Plausible self-hosted, or a simple `page_views` table + fire-and-forget `POST /api/analytics/pageview`). Not required for core functionality — recommend deferring past MVP.

---

**File:** `src/lib/PageNotFound.jsx`
**Purpose:** Calls `base44.auth.me()` to decide whether to redirect to login vs. show a 404.
**Replacement Strategy:** Same new `GET /auth/me` call as `AuthContext`.

---

**File:** `src/pages/Home.jsx`
**Purpose:** Loads/creates the user's `ReadingProgress` row on load; subscribes to realtime updates via `base44.entities.ReadingProgress.subscribe()`.
**Replacement Strategy:** `GET /api/reading-progress` (auto-creates a default row server-side if none exists, replacing the client-side create-if-missing logic). Realtime: replace `.subscribe()` with a simple client-side refetch-on-focus/refetch-on-interval via React Query (`refetchOnWindowFocus`, short `staleTime`) — sufficient for a single-user-editing-their-own-data screen; no websocket infra needed here (see Realtime Strategy below).

---

**File:** `src/pages/Favorites.jsx`
**Purpose:** Lists and deletes the user's `FavoriteVerse` rows.
**Replacement Strategy:** `GET /api/favorites`, `DELETE /api/favorites/:id`.

---

**File:** `src/pages/QuranReader.jsx`
**Purpose:** Toggles a verse as favorited/unfavorited while reading.
**Replacement Strategy:** `GET /api/favorites` (to check current state), `POST /api/favorites`, `DELETE /api/favorites/:id`.

---

**File:** `src/pages/Reading.jsx`
**Purpose:** Core reading-session flow — updates `ReadingProgress`, `GroupProgress` (if in a group), and `FavoriteVerse` across a single session; heaviest Base44 usage in the app.
**Replacement Strategy:** Consolidate into one transactional endpoint: `POST /api/reading-sessions` that, server-side, atomically updates `ReadingProgress` + `DailyLog` + `GroupProgress` (if applicable) in a single Prisma transaction — replacing 3–4 sequential client calls with one network round trip and no partial-failure risk. Favorites stay on the existing `/api/favorites` endpoints.

---

**File:** `src/pages/Settings.jsx`
**Purpose:** Profile edit (`auth.updateMe`), logout, daily goal edit, and full account deletion (loops through and deletes `ReadingProgress`, `FavoriteVerse`, `DailyLog` rows one by one client-side).
**Replacement Strategy:** `PATCH /auth/me` (username), `PATCH /api/reading-progress` (goals), `POST /auth/logout`, and a single `DELETE /api/account` that does a server-side cascading delete (via Prisma `onDelete: Cascade` on foreign keys) — safer and atomic, replacing the current client-orchestrated multi-step deletion.

---

**File:** `src/pages/Stats.jsx`
**Purpose:** Reads `ReadingProgress` and `DailyLog` history to render charts.
**Replacement Strategy:** `GET /api/reading-progress`, `GET /api/daily-logs?range=...`.

---

**File:** `src/pages/Groups.jsx`
**Purpose:** List groups, create a group, join via invite code.
**Replacement Strategy:** `GET /api/groups`, `POST /api/groups`, `POST /api/groups/join` (body: invite code).

---

**File:** `src/pages/GroupDetail.jsx`
**Purpose:** Group detail view; subscribes to `GroupProgress` realtime updates.
**Replacement Strategy:** `GET /api/groups/:id`, `GET /api/groups/:id/progress`. Realtime via refetch-on-interval (groups are inherently multi-user, so a 15–30s poll while the screen is open is a reasonable, infra-free approximation of the current live-update feel).

---

**File:** `src/components/groups/MemberProgressCard.jsx`
**Purpose:** Per-member card inside a group; subscribes to that member's progress.
**Replacement Strategy:** Included in the `GET /api/groups/:id/progress` payload above; same polling approach, no separate per-card subscription needed.

---

**File:** `src/components/groups/WeeklyLeaderboard.jsx`
**Purpose:** Computes weekly ranking from `GroupProgress`; sends congratulatory emails to top performers via `base44.integrations.Core.SendEmail`.
**Replacement Strategy:** `GET /api/groups/:id/leaderboard` for ranking. Move email sending server-side into a **scheduled weekly job** (e.g. a cron-triggered Express route, or a simple node-cron task) using a free-tier transactional email provider (Resend and SES both have generous free tiers). This is a behavior improvement over the current client-triggered version — email now sends reliably once per week regardless of whether any specific user happens to have the app open, and can't be triggered repeatedly by refreshing the page.

---

**File:** `src/components/home/GoalCard.jsx`
**Purpose:** Subscribes to `ReadingProgress` for a live-updating goal ring.
**Replacement Strategy:** Same polling/refetch-on-focus approach as `Home.jsx` (they share the same underlying data).

---

**File:** `src/components/reading/TafsirPopup.jsx`
**Purpose:** One tafsir source (Maududi) already comes from the free `alquran.cloud` API; three others (Ibn Kathir, al-Jalalayn, al-Sa'di) call `base44.integrations.Core.InvokeLLM` **live, uncached, on every open**.
**Replacement Strategy:** Precompute all three LLM-sourced tafsirs for all verses **once**, store in a `tafsir` table (`surah`, `verse`, `source`, `text`), and change this component to a pure `GET /api/tafsir/:surah/:verse` — identical UX, zero per-request LLM cost after the one-time batch job. See "Tafsir precompute job" below.

---

**File:** `src/pages/Companion.jsx`
**Purpose:** Full agent — conversation history (`getConversations`, `createConversation`, `addMessage`), realtime streaming (`subscribeToConversation`), progress-aware encouragement, and web-search-backed tafsir explanation.
**Replacement Strategy:** Split into three pieces per the agreed design:
1. **Encouragement** — no LLM call at all. A pure backend function that takes the user's `ReadingProgress` row and returns a templated message from a small set of rule-based variants (streak milestones, "X verses to goal," etc.).
2. **Tafsir questions asked in chat** — resolved against the same precomputed `tafsir` table as `TafsirPopup`, not a fresh LLM call.
3. **Open-ended chat** — the only piece that's a genuine live LLM call. `POST /api/companion/messages`, backed by a free-tier LLM API, with a **per-user daily rate limit** (e.g. 10–20 messages/day) enforced server-side to keep cost bounded and predictable at $0. Conversation history stored in a `conversations`/`messages` table (kept — this part of the original UX is worth preserving and is cheap to store). No token-streaming (SSE/WebSocket) — return the full reply once ready, which is simpler infra and a negligible UX difference at this message length.

---

**File:** `.env.local`
**Purpose:** `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` — client config pointing at the Base44-hosted backend.
**Replacement Strategy:** Replace with `VITE_API_BASE_URL` pointing at the new Express backend.

---

**File:** `package.json`
**Purpose:** Declares `@base44/sdk`, `@base44/vite-plugin`, and `@stripe/react-stripe-js` / `@stripe/stripe-js` (unused in code, and no longer part of scope).
**Replacement Strategy:** Remove all four packages.

---

**Not Base44-dependent — no changes needed:**
`src/components/reading/QuranAPI.jsx` (public `alquran.cloud` REST API — the actual Quran text/audio/Maududi-tafsir source), all `src/components/ui/*` (shadcn primitives), routing shell (`App.jsx`, `Layout.jsx`, `pages.config.js`), Tailwind/Vite config.

---

## Tafsir Precompute Job (new, one-time)

A standalone script (not part of the running app) that:
1. Iterates all 114 surahs / ~6,236 verses
2. For each verse × each of the 3 LLM-sourced tafsirs, reuses the exact existing prompts from `TafsirPopup.jsx` (`PROMPTS.ibnkathir`, `PROMPTS.jalalayn`, `PROMPTS.saadi`) — no prompt-quality regression
3. Writes results into the `tafsir` table
4. Is safe to re-run/resume (skip rows that already exist) in case of interruption or future corrections

This runs once before launch, and again only if you ever want to add a new tafsir source. Not part of the deployed backend's request path.

---

## Realtime Strategy (replacing all `.subscribe()` calls)

None of the current realtime usage (`GoalCard`, `Home`, `GroupDetail`, `MemberProgressCard`) needs true push infrastructure:
- **Own-data screens** (Home, GoalCard): React Query with `refetchOnWindowFocus: true` + a short `staleTime` gives the same "feels live" experience with zero extra infra.
- **Group screens** (GroupDetail, MemberProgressCard): a 15–30 second `refetchInterval` while the screen is mounted is an honest tradeoff — genuinely instant multi-user sync isn't needed for a reading-progress leaderboard, and it avoids running a WebSocket/SSE server for a free community app.

If real-time-to-the-second sync is ever wanted later, that's an isolated addition (e.g. one SSE endpoint), not a blocker now.

---

## Updated Migration Roadmap

| Phase | Scope | Effort (relative) | Depends on | Key risks |
|---|---|---|---|---|
| 3 — Database design | Prisma schema for User, ReadingProgress, FavoriteVerse, DailyLog, Group, GroupProgress, Conversation, Message, Tafsir | Small | Phase 2 (done) | Getting RLS-equivalent scoping right in query layer |
| 4 — Backend build | Express + Prisma CRUD/auth/session endpoints, JWT + refresh, rate limiting | Medium | Phase 3 | Auth correctness; cascading account deletion |
| 4b — Tafsir precompute job | One-time batch script + LLM calls | Small, but has real one-time $ cost (~18.7k LLM calls) | Phase 3 (needs `tafsir` table) | Cost estimate should be confirmed with your chosen LLM provider's pricing before running |
| 4c — Companion backend | Templated encouragement (trivial) + rate-limited chat endpoint + conversation storage | Medium | Phase 4, 4b | Keeping the daily rate limit low enough to guarantee $0 cost at scale |
| 5 — Frontend migration | Replace all `base44.*` calls per the table above; adopt React Query properly (already installed, currently unused) | Medium-Large (most files touched, but each change is mechanical) | Phase 4 | Realtime UX parity via polling — validate it feels acceptable |
| 6 — Authentication UI | Build login/register/forgot-password screens from scratch (none exist today) | Medium | Phase 4 | This is 100% new UI, not a swap |
| 7 — Production hardening | Env vars, logging, input validation, backups | Small-Medium | Phases 4–6 | — |
| 8 — iOS packaging (Capacitor) | Wrap in Capacitor, App Store checklist | Medium | Phase 7 | URL-param auth handoff is gone (good — simplifies iOS deep-linking), but new JWT storage needs to work correctly in a WebView context |

**Recommended order:** 3 → 4 → 4b (can run in parallel with 4c once the table exists) → 5 → 6 → 7 → 8. Nothing here is a blocker on anything else outside this order.

---

## Next step

Ready to move into **Phase 3 (database schema — ER diagram + Prisma schema + migration scripts)** whenever you say go. That's the first phase that produces actual code artifacts.
