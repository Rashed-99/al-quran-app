# API Documentation

Base URL: `{API_BASE_URL}` (e.g. `http://localhost:4000` in development)

All request/response bodies are JSON. Authenticated endpoints require an
`Authorization: Bearer <accessToken>` header. The refresh token travels
separately as an `httpOnly` cookie (`refresh_token` by default), sent
automatically by the browser — never put it in a header or JS-readable
storage.

Every response includes an `X-Request-Id` header; error responses also
echo it in the JSON body as `requestId`. Quote this ID when reporting a
bug — it correlates directly to a line in the server logs.

---

## Auth — `/auth`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | none | `{ email, password, username }` | Creates user + default ReadingProgress row. Sets refresh cookie, returns `{ user, accessToken }`. |
| POST | `/auth/login` | none | `{ email, password }` | Sets refresh cookie, returns `{ user, accessToken }`. |
| POST | `/auth/refresh` | refresh cookie | — | Rotates tokens, returns `{ user, accessToken }`. |
| POST | `/auth/logout` | Bearer | `{ everywhere?: boolean }` | Clears refresh cookie. `everywhere: true` invalidates all sessions (bumps `refreshTokenVersion`). |
| GET | `/auth/me` | Bearer | — | Returns `{ user }`. |
| PATCH | `/auth/me` | Bearer | `{ username }` | Returns `{ user }`. |
| POST | `/auth/forgot-password` | none | `{ email }` | Always returns success (doesn't leak registered emails). |
| POST | `/auth/reset-password` | none | `{ token, newPassword }` | Invalidates all existing sessions for that user. |

Auth endpoints are additionally rate-limited to 20 requests / 15 min per IP (`authLimiter`).

## Account — `/api/account`

| Method | Path | Auth | Notes |
|---|---|---|---|
| DELETE | `/api/account` | Bearer | Atomic cascade delete (progress, favorites, logs, group memberships, conversations). See known edge case re: group admins in `auth.service.js`. |

## Reading Progress — `/api/reading-progress`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/reading-progress` | Bearer | — | Auto-creates a default row if none exists. Also performs the daily counter reset if last read wasn't today. |
| PATCH | `/api/reading-progress` | Bearer | `{ dailyGoalMinutes?, dailyGoalVerses?, currentSurah?, currentVerse? }` | Goal updates and/or lightweight position bookmarking (no totals change). |
| POST | `/api/reading-progress/sessions` | Bearer | `{ versesRead?, timeMinutes?, hasanatEarned?, currentSurah?, currentVerse?, groupIds?: string[] }` | The atomic session-save: bumps totals/streak, upserts today's DailyLog, upserts GroupProgress for every listed group — all in one transaction. |
| GET | `/api/reading-progress/daily-logs?from=&to=` | Bearer | — | ISO date range, both optional. |

## Favorites — `/api/favorites`

| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/api/favorites` | Bearer | — |
| POST | `/api/favorites` | Bearer | `{ surahNumber, surahName, verseNumber, arabicText, translation, notes? }` |
| DELETE | `/api/favorites/:id` | Bearer | — |

## Groups — `/api/groups`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/groups` | Bearer | — | Groups the current user is a member of. |
| POST | `/api/groups` | Bearer | `{ name, description? }` | Creator becomes admin + first member; invite code auto-generated. |
| POST | `/api/groups/join` | Bearer | `{ inviteCode }` | |
| GET | `/api/groups/:id` | Bearer | — | Must be a member. |
| GET | `/api/groups/:id/progress?days=` | Bearer | — | Default 7 days. |
| GET | `/api/groups/:id/leaderboard?days=` | Bearer | — | Default 7 days, sorted by verses read desc. |

## Tafsir — `/api/tafsir`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/tafsir/:surah/:verse` | Bearer | Returns `{ tafsir: { ibnkathir, jalalayn, saadi } }` from the precomputed table. The Maududi source is fetched client-side directly from `alquran.cloud`, not through this API. |

## Companion — `/api/companion`

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| GET | `/api/companion/encouragement` | Bearer | — | Templated, no LLM call. |
| GET | `/api/companion/conversations` | Bearer | — | |
| GET | `/api/companion/conversations/:id/messages` | Bearer | — | |
| POST | `/api/companion/messages` | Bearer | `{ conversationId?, content }` | Rate-limited to `COMPANION_DAILY_MESSAGE_LIMIT` user messages/day (429 when exceeded). Auto-creates a conversation if `conversationId` omitted. |

## Health

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | none |

---

## Error format

```json
{
  "error": "Human-readable message",
  "requestId": "a1b2c3d4-...",
  "details": [ /* present only on 400 validation errors, from zod */ ]
}
```

| Status | Meaning |
|---|---|
| 400 | Validation failed (zod) |
| 401 | Missing/invalid/expired token, or bad credentials |
| 403 | Authenticated but not authorized (e.g. not a group member) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email, duplicate favorite) |
| 429 | Rate limited (general API, auth endpoints, or Companion daily limit) |
| 500 | Unexpected server error |
