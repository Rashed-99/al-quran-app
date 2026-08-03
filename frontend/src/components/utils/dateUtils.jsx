// Sydney timezone utilities (AEDT/AEST)
const SYDNEY_TIMEZONE = 'Australia/Sydney';

/**
 * Get current date in Sydney timezone
 */
export function getSydneyDate() {
  const now = new Date();
  const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: SYDNEY_TIMEZONE }));
  return sydneyTime;
}

/**
 * Get today's date string in Sydney timezone (YYYY-MM-DD format)
 */
export function getSydneyDateString() {
  const sydneyDate = getSydneyDate();
  const year = sydneyDate.getFullYear();
  const month = String(sydneyDate.getMonth() + 1).padStart(2, '0');
  const day = String(sydneyDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string matches today in Sydney timezone
 */
export function isToday(dateString) {
  if (!dateString) return false;
  return dateString === getSydneyDateString();
}

/**
 * Get the start of the current week (Monday 00:00 Sydney time)
 */
export function getWeekStartSydney() {
  const sydneyDate = getSydneyDate();
  const dayOfWeek = sydneyDate.getDay();
  // Adjust so Monday = 0, Sunday = 6
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const weekStart = new Date(sydneyDate);
  weekStart.setDate(sydneyDate.getDate() - adjustedDay);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get the end of the current week (Sunday 23:59:59 Sydney time)
 */
export function getWeekEndSydney() {
  const weekStart = getWeekStartSydney();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Generate weekly progress array for current week (Mon-Sun) in Sydney timezone
 */
export function generateWeeklyProgress() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekStart = getWeekStartSydney();
  
  return days.map((day, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(date.getDate()).padStart(2, '0');
    return {
      day,
      completed: false,
      date: `${year}-${month}-${dayNum}`
    };
  });
}

/**
 * Get all dates for the current week as strings (for filtering)
 */
export function getWeekDates() {
  const weekStart = getWeekStartSydney();
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
}

/**
 * Check if progress needs daily reset (last_read_date is not today in Sydney time)
 */
export function needsDailyReset(lastReadDate) {
  if (!lastReadDate) return true;
  return lastReadDate !== getSydneyDateString();
}

/**
 * Check if weekly progress needs reset (week has changed)
 */
export function needsWeeklyReset(weeklyProgress) {
  if (!weeklyProgress || weeklyProgress.length === 0) return true;
  
  const currentWeekDates = getWeekDates();
  const progressDates = weeklyProgress.map(d => d.date);
  
  // If the first date of weekly progress doesn't match current week's Monday
  return progressDates[0] !== currentWeekDates[0];
}