import httpClient from './httpClient';

// The backend (Prisma) uses camelCase; every existing page in this app
// was written against Base44's snake_case entity field names. Translating
// here means Home.jsx, Reading.jsx, Stats.jsx, Settings.jsx, GoalCard.jsx
// etc. don't need every render-line touched - only their data-fetching
// calls change. See Phase 5 notes.
function toSnakeProgress(p) {
  if (!p) return p;
  return {
    id: p.id,
    current_surah: p.currentSurah,
    current_verse: p.currentVerse,
    total_verses_read: p.totalVersesRead,
    total_pages_read: p.totalPagesRead,
    total_time_minutes: p.totalTimeMinutes,
    total_hasanat: p.totalHasanat,
    current_streak: p.currentStreak,
    longest_streak: p.longestStreak,
    last_read_date: p.lastReadDate,
    daily_goal_minutes: p.dailyGoalMinutes,
    daily_goal_verses: p.dailyGoalVerses,
    today_verses_read: p.todayVersesRead,
    today_time_minutes: p.todayTimeMinutes,
    weekly_progress: p.weeklyProgress,
  };
}

function toSnakeDailyLog(l) {
  return {
    id: l.id,
    date: l.date,
    verses_read: l.versesRead,
    time_minutes: l.timeMinutes,
    hasanat_earned: l.hasanatEarned,
    goal_completed: l.goalCompleted,
  };
}

export async function getProgress() {
  const data = await httpClient.get('/api/reading-progress');
  return toSnakeProgress(data.progress);
}

export async function updateGoals({ daily_goal_minutes, daily_goal_verses } = {}) {
  const data = await httpClient.patch('/api/reading-progress', {
    dailyGoalMinutes: daily_goal_minutes,
    dailyGoalVerses: daily_goal_verses,
  });
  return toSnakeProgress(data.progress);
}

/**
 * Lightweight bookmark of current_surah/current_verse only - does NOT
 * increment totals/streak/hasanat. Replaces the old saveCurrentPosition /
 * autoSaveProgress calls in Reading.jsx.
 */
export async function savePosition({ current_surah, current_verse } = {}) {
  const data = await httpClient.patch('/api/reading-progress', {
    currentSurah: current_surah,
    currentVerse: current_verse,
  });
  return toSnakeProgress(data.progress);
}

/**
 * Replaces the multi-call sequence Reading.jsx used to make against
 * base44.entities.ReadingProgress / GroupProgress - this single call
 * updates progress + streak + today's daily log + (optionally) group
 * progress atomically on the server.
 */
export async function logReadingSession({
  verses_read,
  time_minutes,
  hasanat_earned,
  current_surah,
  current_verse,
  group_ids,
} = {}) {
  const data = await httpClient.post('/api/reading-progress/sessions', {
    versesRead: verses_read,
    timeMinutes: time_minutes,
    hasanatEarned: hasanat_earned,
    currentSurah: current_surah,
    currentVerse: current_verse,
    groupIds: group_ids,
  });
  return toSnakeProgress(data.progress);
}

export async function getDailyLogs({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  const data = await httpClient.get(`/api/reading-progress/daily-logs${qs ? `?${qs}` : ''}`);
  return data.logs.map(toSnakeDailyLog);
}
