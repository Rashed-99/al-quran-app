# Al-Quran (with Translation) — Base44 Migration: Phase 1 Analysis

No code has been modified. This is analysis only, per your instructions.

---

## 1. Application Overview

A mobile-first Quran reading and memorization app built as a Base44-exported React/Vite SPA. Core features:

- **Quran reading** — full text via a third-party public API (not Base44), with translation, transliteration, audio, tafsir popups
- **Reading progress tracking** — streaks, hasanat (reward points), daily/weekly goals, verses/pages/time read
- **Favorites** — save verses with personal notes
- **Groups** — social reading groups with invite codes, member lists, per-member progress, weekly leaderboard, email notifications
- **AI Companion** — a chat agent that (a) encourages the user based on their real reading-progress data, and (b) explains verses (tafsir) using LLM + web search
- **Settings** — username, dark mode, daily goals, account/data deletion
- **Stats** — historical daily logs and charts

This is a single-tenant-per-user consumer app (no multi-org/B2B complexity), which simplifies the backend significantly.

## 2. File Structure Summary

```
Al Quran (with Translation)/
├── base44/                      # Base44 project metadata (not shipped to browser)
│   ├── config.jsonc             # build/site config
│   ├── agents/quran_companion.jsonc   # AI agent system prompt + entity permissions
│   └── entities/*.jsonc         # entity schemas + row-level-security (RLS) rules
├── src/
│   ├── api/base44Client.js      # Base44 SDK client init
│   ├── lib/
│   │   ├── AuthContext.jsx      # auth state, calls Base44 auth + a raw axios "public settings" endpoint
│   │   ├── app-params.js        # reads appId/token from URL/localStorage — Base44's auth handoff mechanism
│   │   ├── NavigationTracker.jsx# calls base44.appLogs.logUserInApp (analytics)
│   │   └── PageNotFound.jsx     # calls base44.auth.me()
│   ├── pages/                   # Home, Explore, QuranReader, Reading, Favorites, Groups,
│   │                             GroupDetail, Settings, Stats, Companion, StandaloneReader
│   ├── components/
│   │   ├── reading/QuranAPI.jsx # wraps the external alquran.cloud API (KEEP AS-IS, not Base44)
│   │   ├── reading/TafsirPopup.jsx  # calls base44.integrations.Core.InvokeLLM
│   │   ├── groups/WeeklyLeaderboard.jsx # calls base44.integrations.Core.SendEmail
│   │   ├── groups/MemberProgressCard.jsx
│   │   ├── home/GoalCard.jsx    # real-time subscribe
│   │   └── ui/*                 # shadcn/ui primitives — no backend dependency
│   └── App.jsx / Layout.jsx / pages.config.js  # routing shell
├── package.json                 # @base44/sdk, @base44/vite-plugin, Stripe SDK (unused in code so far), React Query, etc.
└── .env.local                   # VITE_BASE44_APP_ID, VITE_BASE44_APP_BASE_URL
```

~10,100 lines of JSX/JS across pages + components (excluding node_modules and generated ui/ primitives).

## 3. Component Map (feature → components)

| Feature | Components |
|---|---|
| Home dashboard | `Home.jsx`, `StatCard`, `GoalCard`, `WeeklyTracker`, `DailyReflection`, `DailyHadith`, `DailyReminder` |
| Reading | `Reading.jsx`, `QuranReader.jsx`, `StandaloneReader.jsx`, `VerseCard`, `VerseEndMarker`, `TafsirPopup`, `FontPicker`, `ReadingLevel`, `SessionStats`, `ReadingProgress` (component) |
| Explore | `Explore.jsx`, `SurahCard`, `VerseSelector` |
| Favorites | `Favorites.jsx` |
| Groups | `Groups.jsx`, `GroupDetail.jsx`, `MemberProgressCard`, `WeeklyLeaderboard` |
| Settings | `Settings.jsx` |
| Stats | `Stats.jsx` |
| AI Companion | `Companion.jsx`, `MessageBubble` |
| Shell | `Layout.jsx`, `App.jsx`, `NavigationTracker`, `PageNotFound`, `UserNotRegisteredError` |

## 4. Route Map

Auto-registered from `pages/` via `pages.config.js`, root `/` renders `Home` (mainPage). Router is plain `react-router-dom`, so this survives migration untouched:

```
/               → Home
/Explore
/Favorites
/GroupDetail
/Groups
/Home
/QuranReader
/Reading
/Settings
/StandaloneReader
/Stats
/Companion       (hardcoded route in App.jsx, not in pages.config)
*                → PageNotFound
```

## 5. Database Entity Map (from `base44/entities/*.jsonc`)

| Entity | Key fields | Notes |
|---|---|---|
| **User** | `username` | Base44's built-in user table extended with one custom field. Real auth fields (email, password hash) are Base44-managed and invisible to this repo. |
| **ReadingProgress** | current_surah, current_verse, totals (verses/pages/time/hasanat), streaks, daily goals, today's counters, `weekly_progress` (JSON array of 7 day objects) | One row per user (upsert pattern in code) |
| **FavoriteVerse** | surah_number, surah_name, verse_number, arabic_text, translation, notes | One row per saved verse |
| **DailyLog** | date, verses_read, time_minutes, hasanat_earned, goal_completed | One row per user per day |
| **Group** | name, description, invite_code (unique), members (array of emails), admin_email | |
| **GroupProgress** | group_id, user_email, user_name, date, verses_read, time_minutes | Denormalized copy of daily activity for leaderboards |
| **Surah** | number, name_arabic/english/translation, revelation_type, total_verses, verses[] (arabic/translation/transliteration) | **Not actually used** — the app fetches Surah data live from `api.alquran.cloud` via `QuranAPI.jsx` instead. Admin-only write. Likely a leftover/unused entity. |

Every entity except `Surah` uses **row-level security scoped to `created_by_id`/`created_by`/email**, i.e. "a user can only read/write their own rows." `Group` and `GroupProgress` add an `$or` clause for admins and for group-membership-based read access. This RLS logic must be reimplemented as authorization middleware/query filters in the new backend — Postgres RLS or Express-layer checks both work; recommendation in Phase 3.

## 6. Base44 Dependency Map

| File | Base44 usage | Purpose | Replacement strategy |
|---|---|---|---|
| `src/api/base44Client.js` | `createClient` from `@base44/sdk` | Instantiates the SDK client | Delete. Replace with a small `src/api/httpClient.js` (fetch/axios wrapper with JWT header + refresh) |
| `src/lib/app-params.js` | Reads Base44 `appId`/`token` from URL params & localStorage | Base44's cross-domain auth handoff | Delete. Replace with standard JWT storage (httpOnly refresh cookie + in-memory or localStorage access token) |
| `src/lib/AuthContext.jsx` | `base44.auth.me()`, `base44.auth.logout()`, `base44.auth.redirectToLogin()`, raw axios call to `/api/apps/public/prod/public-settings/by-id/:appId` | Session bootstrap, auth-required/user-not-registered error states | Rewrite: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`. Drop the "public settings" concept entirely — it's a Base44 multi-tenant-app mechanism this single-purpose app doesn't need. |
| `src/lib/NavigationTracker.jsx` | `base44.appLogs.logUserInApp(pageName)` | Page-view analytics | Replace with your own lightweight analytics endpoint, or drop, or swap for a third-party analytics SDK (Plausible/PostHog) |
| `src/lib/PageNotFound.jsx` | `base44.auth.me()` | Decide whether to show login vs 404 | Same new `GET /auth/me` |
| `src/pages/Home.jsx` | `base44.auth.me()`, `entities.ReadingProgress.filter/update/create`, `entities.ReadingProgress.subscribe()` | Load/create progress row; **live-updates via subscribe (websocket/SSE)** | REST: `GET/POST/PATCH /api/reading-progress`. Realtime: see §Realtime below |
| `src/pages/Favorites.jsx` | `auth.me()`, `entities.FavoriteVerse.filter/delete` | List & delete favorites | `GET /api/favorites`, `DELETE /api/favorites/:id` |
| `src/pages/QuranReader.jsx` | `auth.me()`, `entities.FavoriteVerse.filter/delete/create` | Toggle favorite while reading | `GET/POST/DELETE /api/favorites` |
| `src/pages/Reading.jsx` | `auth.me()`, `entities.ReadingProgress.*`, `entities.FavoriteVerse.*`, `entities.Group.list`, `entities.GroupProgress.filter/update/create` | Core reading-session logic: updates progress, group progress, favorites, all in one flow | Multiple REST calls; consider one `POST /api/reading-sessions` endpoint that atomically updates ReadingProgress + DailyLog + GroupProgress server-side (currently done as 3-4 sequential client calls — a good opportunity to make this a single transactional endpoint) |
| `src/pages/Settings.jsx` | `auth.me()`, `auth.updateMe()`, `auth.logout()`, `entities.ReadingProgress.update/delete`, `entities.FavoriteVerse.filter/delete`, `entities.DailyLog.filter/delete` | Profile edit, goal edit, **full account data deletion** | `PATCH /auth/me`, `POST /auth/logout`, `DELETE /api/account` (cascading delete server-side, not N client-side deletes) |
| `src/pages/Stats.jsx` | `auth.me()`, `entities.ReadingProgress.filter`, `entities.DailyLog.filter` | Charts | `GET /api/reading-progress`, `GET /api/daily-logs` |
| `src/pages/Groups.jsx` | `auth.me()`, `entities.Group.list/create/update` | Create group, join via code, list groups | `GET/POST /api/groups`, `POST /api/groups/:id/join` |
| `src/pages/GroupDetail.jsx` | `auth.me()`, `entities.Group.list`, `entities.GroupProgress.filter`, `entities.GroupProgress.subscribe()` | Group view + **realtime** | `GET /api/groups/:id`, `GET /api/groups/:id/progress` |
| `src/components/groups/MemberProgressCard.jsx` | `auth.me()`, `entities.GroupProgress.filter`, `entities.ReadingProgress.filter`, `.subscribe()` | Per-member card, realtime | same as above |
| `src/components/groups/WeeklyLeaderboard.jsx` | `entities.GroupProgress.filter`, `auth.me()`, **`base44.integrations.Core.SendEmail`** | Weekly ranking + emails winners | `GET /api/groups/:id/leaderboard`; email via your own backend (Resend/SendGrid/SES) triggered server-side (a cron/job, not client-triggered, is the right design — see Phase 4 risk note) |
| `src/components/home/GoalCard.jsx` | `entities.ReadingProgress.subscribe()` | Realtime goal ring | see Realtime below |
| `src/components/reading/TafsirPopup.jsx` | **`base44.integrations.Core.InvokeLLM`** | On-demand AI verse explanation | `POST /api/tafsir` backend route calling the Anthropic (or other LLM) API server-side, keeping the key off the client |
| `src/pages/Companion.jsx` | `base44.agents.getConversations/getConversation/createConversation/addMessage/subscribeToConversation` | Full AI chat agent (the `quran_companion` agent defined in `base44/agents/quran_companion.jsonc`) — reads ReadingProgress, and does web search for tafsir sourcing | This is the single biggest replacement item — see §7 below |
| `.env.local` | `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` | Client config | Replace with `VITE_API_BASE_URL` pointing at your new Express backend |
| `package.json` | `@base44/sdk`, `@base44/vite-plugin` | | Remove both packages |

**Not Base44-dependent (leave alone):** `QuranAPI.jsx` (public `api.alquran.cloud` REST API — this is where all actual Quran text/audio comes from, entirely independent of Base44), all `components/ui/*` (shadcn primitives), routing shell, Tailwind/Vite config.

## 7. The AI Companion Agent — special attention needed

`base44/agents/quran_companion.jsonc` defines a hosted Base44 "agent" with:
- A system prompt (encouragement using live ReadingProgress data + tafsir explanation using web search)
- Scoped, read-only tool access to the `ReadingProgress` and `Surah` entities
- Managed conversation history + realtime subscription

This is the most Base44-specific piece of the app — there's no drop-in open-source equivalent. To replace it you'll need to build, server-side:
1. A `conversations` + `messages` table
2. An endpoint that assembles the same system prompt, injects the user's real `ReadingProgress` row into context, and calls an LLM API (Anthropic Claude, given tools like web_search for the tafsir-sourcing requirement)
3. Either polling or SSE/WebSocket for the "subscribe" realtime experience in the UI

This is effectively rebuilding a small RAG/agent orchestration layer, not just an auth swap. Flagged as a **high-effort, high-risk item** in the roadmap below.

## 8. Authentication Flow (current, Base44)

1. On load, `AuthContext` builds a request to `/api/apps/public/prod/public-settings/by-id/{appId}` (a Base44-hosted proxy endpoint) using `appId` + optional `token` from URL/localStorage.
2. If that succeeds and a token is present, calls `base44.auth.me()` to fetch the user.
3. Three states drive the UI: loading, `auth_required` (→ `base44.auth.redirectToLogin()`, which bounces to Base44's hosted login), `user_not_registered` (→ custom error screen).
4. Logout calls `base44.auth.logout()`, which clears the Base44 token and redirects.

There is **no login/register form in this codebase** — Base44 hosts the entire login UI externally and hands back a token via URL param. This means Phase 6 must build an actual login/register UI from scratch (currently doesn't exist in the repo at all).

## 9. API Flow (current)

All data access is `base44.entities.<Entity>.<method>()` calls made directly from React components/pages — there is no API layer file (no `src/api/users.js` etc. yet, despite the SDK being wrapped in one client file). Every page fetches independently; there's no React Query usage for the Base44 entity calls even though `@tanstack/react-query` is installed (it's initialized in `query-client.js` but appears unused by grep — worth confirming in Phase 5 and adopting properly for the new REST layer, since you already listed React Query as your target stack).

## 10. Data Flow (current)

```
Browser (React) 
  → @base44/sdk (axios under the hood)
    → Base44-hosted backend (api.base44.app style, driven by appId)
      → Base44-managed Postgres (per-app, RLS-enforced from *.jsonc entity defs)
      → Base44-managed LLM integrations (InvokeLLM, agents)
      → Base44-managed email sending
      → Base44-managed realtime (subscribe() → likely websocket/SSE)

Separately, independent of Base44:
Browser → api.alquran.cloud (public REST) → Quran text/audio/tafsir source data
```

---

## 11. Migration Risk Assessment

| Risk | Severity | Notes |
|---|---|---|
| **No existing login/register UI** | High | Base44 hosts this externally today; must be built from scratch in Phase 6, not just "swapped" |
| **AI Companion agent** | High | Requires building conversation storage + LLM orchestration + realtime; the largest genuinely new engineering surface |
| **Realtime `.subscribe()` calls** (4 call sites: GoalCard, Home, GroupDetail, MemberProgressCard, Companion) | Medium-High | Need to choose SSE vs WebSockets vs polling; behavior/UX must be preserved |
| **RLS logic embedded in `.jsonc` files** | Medium | Must be faithfully reimplemented as Express middleware/query scoping per entity — a mistake here is a data-leak risk (e.g., Group read access spanning members OR admin OR global-admin role) |
| **Group email notifications (`SendEmail`)** | Medium | Currently invoked client-side from `WeeklyLeaderboard.jsx` — should move to a server-side scheduled job in the new design, which is a behavior change worth flagging even though it improves reliability/security |
| **Account deletion currently client-orchestrated** (Settings.jsx loops and deletes rows one by one) | Medium | Should become one atomic server-side cascade delete — safer, but is a logic change, not a pure lift-and-shift |
| **Unused `Surah` entity + apparently-unused React Query setup + `@stripe/*` packages with no Stripe code found yet** | Low | Confirm before building schema/payment endpoints — don't build unused infrastructure. Full-text grep for "stripe" and "payment" found no usage in `src/` yet; will re-check in Phase 3/4 in case it's referenced elsewhere I haven't scanned |
| **Capacitor/iOS packaging (Phase 8)** | Medium | Feasible, but api base URL, deep-linking (currently URL-param-based auth handoff), and any use of browser-only APIs will need checking |
| **`.env.local` contains your live Base44 App ID/URL** | Low (info) | Not a secret in the traditional sense, but confirms this is a real, currently-deployed app — worth keeping the old Base44 instance running in parallel until cutover is verified |

---

## What I did NOT yet do (by design, per your instructions)

- No dependency report table beyond what's above (Phase 2 will formalize this with File/Purpose/Replacement-Strategy in the exact format you asked for)
- No DB/Prisma schema (Phase 3)
- No backend code (Phase 4)
- No frontend API layer files (Phase 5)
- No migration roadmap with effort/dependency estimates yet — I'll produce that once you confirm scope, since effort estimates are meaningless without knowing e.g. whether you want the AI Companion rebuilt faithfully (bigger) or simplified (smaller), and whether Stripe is actually needed (I found no Stripe usage in the code despite it being in package.json and your target stack).

## Two things I need from you before Phase 2+

1. **Stripe** — your target stack lists it, but I found zero payment/subscription code in this repo. Is this planned functionality to add during migration, or should I skip building payment infrastructure?
2. **AI Companion fidelity** — rebuild it as-is (conversation history + progress-aware encouragement + web-search-backed tafsir), or would a simpler version (e.g. stateless single-turn tafsir lookup, no saved conversation history) meet your actual needs? This one decision swings the backend effort estimate a lot.
