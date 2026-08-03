# Al-Quran (with Translation)

A standalone, self-hosted Quran reading and companion app — fully
migrated off Base44. Free for the community, no payments, no in-app
purchases.

## Structure

```
al-quran-app/
├── frontend/    React + Vite SPA (Vercel)
├── backend/     Node.js + Express + Prisma API (Railway/Render)
└── docs/        Migration history, architecture decisions, ER diagram,
                 and the original Base44 project metadata (kept for
                 reference only - no longer used by the running app)
```

## Getting started

1. **Backend first** — see `backend/README.md`. You need this running
   (or deployed) before the frontend has anything to talk to.
2. **Frontend** — see `frontend/README.md`.

## Documentation

- `docs/01_PHASE1_ANALYSIS.md` — full codebase analysis of the original
  Base44 export (entities, routes, auth flow, dependency map, risk
  assessment)
- `docs/02_PHASE2_DEPENDENCY_REPORT_AND_ROADMAP.md` — file-by-file Base44
  replacement report and the migration roadmap that was followed
- `docs/03_PHASE8_IOS_APP_STORE.md` — Capacitor setup, iOS build steps,
  App Store submission checklist, and compliance risk assessment
- `docs/04_DEPLOYMENT_GUIDE.md` — end-to-end deployment: Neon, Render,
  Vercel, and iOS via Codemagic (no Mac required)
- `backend/API_DOCUMENTATION.md` — full REST API reference
- `backend/PRODUCTION_HARDENING.md` — security checklist, logging/
  monitoring recommendations, backup strategy
- `backend/prisma/ER_DIAGRAM.mmd` — database entity-relationship diagram
  (Mermaid format)
- `docs/legacy-base44-config/` — the original Base44 entity schemas and
  agent configuration, kept only as historical reference; nothing in the
  running app reads from this folder

## Stack

- **Frontend:** React, Vite, React Query, Tailwind, shadcn/ui
- **Backend:** Node.js, Express, Prisma
- **Database:** PostgreSQL (Neon)
- **Auth:** JWT (access + httpOnly refresh cookie)
- **File storage:** none currently in use (no user-uploaded files in this app)
- **Payments:** none — this app is free and has no payment infrastructure by design

## Deployment targets

| Component | Target |
|---|---|
| Frontend | Vercel |
| Backend | Railway or Render |
| Database | Neon PostgreSQL |

## Status

All 8 phases of the migration are complete: analysis, dependency
mapping, database design, backend build, frontend migration,
authentication UI, production hardening, and Capacitor/iOS App Store
preparation. See `docs/03_PHASE8_IOS_APP_STORE.md` for the remaining
manual steps (Xcode signing, app icons, App Store Connect metadata) that
require a macOS machine and Apple Developer account and can't be
completed from this environment.
