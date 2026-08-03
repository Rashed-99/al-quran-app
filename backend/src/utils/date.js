// All "day" comparisons are done in UTC calendar-date terms to keep the
// server's notion of "today" deterministic regardless of server timezone.
// (A future improvement could shift this to the user's local timezone if
// captured at signup - noted here rather than solved, to avoid scope creep.)

export function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function toUTCDateOnly(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function isSameUTCDate(a, b) {
  return toUTCDateOnly(a).getTime() === toUTCDateOnly(b).getTime();
}

export function isYesterdayUTC(date, relativeTo = new Date()) {
  const d = toUTCDateOnly(date);
  const ref = toUTCDateOnly(relativeTo);
  const diffDays = (ref.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays === 1;
}

export function startOfTodayUTC() {
  return todayUTC();
}

export function endOfTodayUTC() {
  const start = todayUTC();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}
