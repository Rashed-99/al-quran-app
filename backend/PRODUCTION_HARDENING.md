# Phase 7 — Production Hardening

## What changed (code)

- **`src/config/env.js`** (new) — validates every required environment
  variable at boot with zod; refuses to start with a clear, itemized error
  if anything is missing or malformed. Also refuses to start in
  `production` if JWT secrets are still the `.env.example` placeholders.
- **`src/utils/logger.js`** (new) — structured logging: JSON lines in
  production (parseable by any log aggregator), readable text in dev.
- **`src/middleware/requestId.js`** (new) — every request gets a
  correlation ID, returned in `X-Request-Id` and echoed in error bodies,
  so a user-reported error can be traced to an exact log line.
- **`src/middleware/errorHandler.js`** — now logs 500s (and any
  non-`ApiError` exception) through the structured logger with the
  request ID, method, and path attached.
- **`src/app.js`**:
  - `trust proxy` enabled — required behind Railway/Render/any reverse
    proxy for `express-rate-limit` to see real client IPs and for secure
    cookies to behave correctly.
  - `helmet` CSP explicitly disabled (this is a JSON-only API, not
    serving HTML — CSP protects against script injection in rendered
    pages, which doesn't apply here; other helmet protections stay on).
  - `compression` added (gzip responses).
  - CORS origin now sourced from validated `env.CORS_ORIGIN` instead of
    reading `process.env` directly and silently falling back to `true`
    (which would have allowed *any* origin if the env var was missing).
- **`src/server.js`**:
  - Graceful shutdown on `SIGTERM`/`SIGINT` — stops accepting new
    connections, lets in-flight requests finish, disconnects Prisma, then
    exits. Force-exits after 10s if something hangs.
  - `unhandledRejection` / `uncaughtException` handlers log and exit
    rather than leaving the process in an unknown state.
- **`.env.example`** — updated to match the new validation rules (32+
  char secrets, required `LLM_API_KEY`, etc.) and documents which vars
  are required vs. optional-with-fallback.

## Security checklist (status)

| Item | Status |
|---|---|
| Passwords hashed (bcrypt, 12 rounds) | ✅ (Phase 4) |
| JWT access + refresh, httpOnly refresh cookie | ✅ (Phase 4) |
| Refresh token rotation + version-based invalidation | ✅ (Phase 4) |
| Rate limiting (general + auth-specific) | ✅ (Phase 4) |
| Companion daily message cap (cost control) | ✅ (Phase 4) |
| Input validation on every mutating endpoint (zod) | ✅ (Phase 4) |
| `helmet` security headers | ✅ |
| CORS locked to explicit origin list | ✅ (was previously falling back to `*` if unset — fixed this phase) |
| `trust proxy` for correct IP/cookie behavior behind a proxy | ✅ (this phase) |
| Env var validation at boot | ✅ (this phase) |
| Structured logging with request correlation | ✅ (this phase) |
| Graceful shutdown | ✅ (this phase) |
| Password reset doesn't leak account existence | ✅ (Phase 4) |
| Account deletion is atomic (no partial-delete state) | ✅ (Phase 4) |
| SQL injection | N/A — Prisma parameterizes all queries |
| Secrets never logged | ✅ — logger only receives explicit fields, never full request/env objects |
| HTTPS enforced | ⚠️ Your call — Railway/Render/Vercel terminate TLS for you; nothing else to do here, but confirm `NODE_ENV=production` is set so cookies get `secure: true` (see `auth.controller.js`) |
| Dependency vulnerability scanning | ⚠️ Not automated — recommend `npm audit` in CI, or GitHub Dependabot alerts (free) |
| `tar` vulnerability via `@capacitor/cli@6.x` | ⚠️ Known, deliberately accepted for now — `npm audit fix --force` would bump only `@capacitor/cli` to v8 while `@capacitor/core` and other `@capacitor/*` packages stay on v6, risking a broken iOS build from mismatched major versions. Only exploitable via a malicious `.tar` processed during local/CI build, not by end users of the deployed app. Revisit by upgrading all `@capacitor/*` packages together in one deliberate, tested pass — not in isolation. |

## Logging & monitoring recommendations

The app now logs structured JSON in production. What to layer on top,
roughly in order of value-for-effort:

1. **Platform logs (free, do this first).** Railway and Render both
   capture stdout/stderr automatically — the structured JSON lines this
   app emits are immediately searchable there. No setup needed beyond
   deploying.
2. **Uptime monitoring (free, 5 minutes).** Point a free service (e.g.
   UptimeRobot, Better Uptime's free tier) at `GET /health`. Alerts you
   by email/SMS if the API goes down — the single highest-value item for
   a community app with no dedicated ops team.
3. **Error tracking (free tier available).** Sentry's free tier covers a
   small app comfortably. Wire it into `errorHandler.js` (a few lines)
   to get stack traces + request context per error, searchable by the
   same request ID already in your logs. Optional but valuable once you
   have real users — logs alone require you to go looking; Sentry pages
   you.
4. **Database monitoring.** Neon's dashboard shows connection count,
   query performance, and storage — check it periodically, no extra
   setup required since you're already on Neon per the target stack.

Deliberately not recommending paid APM (Datadog, New Relic, etc.) —
disproportionate to a free community app's scale and budget.

## Backup strategy

- **Database:** Neon Postgres includes point-in-time recovery on all
  plans (including free tier, with a shorter retention window). No
  action needed beyond knowing it's there — confirm your plan's
  retention window in the Neon dashboard and note it somewhere the team
  can find it.
- **Before risky operations** (a schema migration, a bulk data fix), take
  a manual branch/snapshot in Neon first — it's a one-click operation and
  costs nothing on their branching model.
- **Migrations are the real backup for schema history** — `prisma/migrations/`
  is version-controlled and fully reproducible; you can always rebuild
  the schema from scratch even if you never took a manual snapshot.
- **Tafsir table** is regenerable from `prisma/seed/precompute-tafsir.js`
  (idempotent, skips existing rows) — losing this table is an
  inconvenience (re-run cost) rather than a data-loss event.
- **User data** (accounts, progress, favorites) is the only truly
  irreplaceable data — this is what Neon's PITR protects.

## What's intentionally out of scope here

- **API documentation** beyond `API_DOCUMENTATION.md` (e.g. a hosted
  Swagger UI) — the markdown reference is sufficient for a small team;
  add OpenAPI generation later if the API surface grows or external
  developers need self-serve docs.
- **Automated dependency scanning in CI** — no CI pipeline exists yet
  outside this migration; enabling GitHub Dependabot on the repo once
  it's pushed is a one-click, zero-maintenance option worth doing on
  day one.
- **Load testing** — not meaningful to simulate before real usage
  patterns exist; revisit if/when the app has active groups generating
  real traffic.
