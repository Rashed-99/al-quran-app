import prisma from '../db/prismaClient.js';
import { ApiError } from '../utils/ApiError.js';
import { todayUTC, isSameUTCDate, isYesterdayUTC } from '../utils/date.js';

const HASANAT_PER_LETTER = 10;
// Rough average used only as a fallback estimate if the client doesn't
// send an explicit hasanat figure - mirrors the "10 per letter" note in
// the original ReadingProgress entity description.
const AVG_LETTERS_PER_VERSE = 80;

export async function getOrCreateProgress(userId) {
  let progress = await prisma.readingProgress.findUnique({ where: { userId } });
  if (!progress) {
    progress = await prisma.readingProgress.create({ data: { userId } });
  }

  // The original client (Home.jsx) reset today_verses_read/today_time_minutes
  // to 0 on load whenever last_read_date wasn't today. Replicated here
  // server-side so it's correct on first load of a new day even before the
  // user logs a new session - and so it works the same for every client,
  // not just the one that happened to be open.
  //
  // NOTE: this uses UTC "today" (see utils/date.js), whereas the original
  // used Sydney local time specifically. Acceptable simplification for a
  // single-region community app at launch; revisit if users span many
  // timezones and the UTC boundary causes visibly wrong "today" resets.
  if (progress.lastReadDate && !isSameUTCDate(progress.lastReadDate, todayUTC())) {
    if (progress.todayVersesRead !== 0 || progress.todayTimeMinutes !== 0) {
      progress = await prisma.readingProgress.update({
        where: { id: progress.id },
        data: { todayVersesRead: 0, todayTimeMinutes: 0 },
      });
    }
  }

  return progress;
}

/**
 * General-purpose lightweight patch: daily goals AND/OR just bookmarking
 * current_surah/current_verse (position save without incrementing totals -
 * replaces the old saveCurrentPosition/autoSaveProgress calls in Reading.jsx,
 * which moved the reading cursor without touching hasanat/streak/etc).
 */
export async function updateGoals(
  userId,
  { dailyGoalMinutes, dailyGoalVerses, currentSurah, currentVerse }
) {
  const progress = await getOrCreateProgress(userId);
  return prisma.readingProgress.update({
    where: { id: progress.id },
    data: {
      ...(dailyGoalMinutes !== undefined ? { dailyGoalMinutes } : {}),
      ...(dailyGoalVerses !== undefined ? { dailyGoalVerses } : {}),
      ...(currentSurah !== undefined ? { currentSurah } : {}),
      ...(currentVerse !== undefined ? { currentVerse } : {}),
    },
  });
}

function computeWeeklyProgress(existing, todayCompleted) {
  const today = todayUTC();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const list = Array.isArray(existing) ? [...existing] : [];

  const todayIso = today.toISOString().slice(0, 10);
  const idx = list.findIndex((d) => d.date === todayIso);
  const entry = { day: dayNames[today.getUTCDay()], date: todayIso, completed: todayCompleted };

  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }

  // Keep only the trailing 7 days.
  return list.slice(-7);
}

/**
 * The single, atomic replacement for what the old frontend did as 3-4
 * sequential base44 calls in Reading.jsx: bump ReadingProgress totals +
 * streak, upsert today's DailyLog, and (if reading as part of a group)
 * upsert today's GroupProgress row - all in one DB transaction so a
 * network blip can't leave progress partially recorded.
 */
export async function logReadingSession(userId, input) {
  const {
    versesRead = 0,
    timeMinutes = 0,
    hasanatEarned,
    currentSurah,
    currentVerse,
    groupId, // back-compat: single group
    groupIds, // preferred: update progress across all of the user's groups at once
  } = input;

  const targetGroupIds = groupIds ?? (groupId ? [groupId] : []);

  if (versesRead <= 0 && timeMinutes <= 0) {
    throw ApiError.badRequest('versesRead or timeMinutes must be greater than 0');
  }

  const earnedHasanat =
    typeof hasanatEarned === 'number' ? hasanatEarned : versesRead * AVG_LETTERS_PER_VERSE * HASANAT_PER_LETTER;

  return prisma.$transaction(async (tx) => {
    let progress = await tx.readingProgress.findUnique({ where: { userId } });
    if (!progress) {
      progress = await tx.readingProgress.create({ data: { userId } });
    }

    const today = todayUTC();
    const readToday = progress.lastReadDate && isSameUTCDate(progress.lastReadDate, today);
    const readYesterday = progress.lastReadDate && isYesterdayUTC(progress.lastReadDate, today);

    let newStreak = progress.currentStreak;
    if (!readToday) {
      newStreak = readYesterday ? progress.currentStreak + 1 : 1;
    }

    const todayVersesRead = (readToday ? progress.todayVersesRead : 0) + versesRead;
    const todayTimeMinutes = (readToday ? progress.todayTimeMinutes : 0) + timeMinutes;
    const goalCompleted =
      todayVersesRead >= progress.dailyGoalVerses || todayTimeMinutes >= progress.dailyGoalMinutes;

    const updatedProgress = await tx.readingProgress.update({
      where: { id: progress.id },
      data: {
        currentSurah: currentSurah ?? progress.currentSurah,
        currentVerse: currentVerse ?? progress.currentVerse,
        totalVersesRead: { increment: versesRead },
        totalTimeMinutes: { increment: timeMinutes },
        totalPagesRead: { increment: Math.floor(versesRead / 15) },
        totalHasanat: { increment: BigInt(Math.round(earnedHasanat)) },
        currentStreak: newStreak,
        longestStreak: Math.max(progress.longestStreak, newStreak),
        lastReadDate: today,
        todayVersesRead,
        todayTimeMinutes,
        weeklyProgress: computeWeeklyProgress(progress.weeklyProgress, goalCompleted),
      },
    });

    await tx.dailyLog.upsert({
      where: { unique_user_date_log: { userId, date: today } },
      create: {
        userId,
        date: today,
        versesRead,
        timeMinutes,
        hasanatEarned: BigInt(Math.round(earnedHasanat)),
        goalCompleted,
      },
      update: {
        versesRead: { increment: versesRead },
        timeMinutes: { increment: timeMinutes },
        hasanatEarned: { increment: BigInt(Math.round(earnedHasanat)) },
        goalCompleted,
      },
    });

    for (const gid of targetGroupIds) {
      const membership = await tx.groupMember.findUnique({
        where: { unique_group_member: { groupId: gid, userId } },
      });
      if (!membership) {
        // Skip groups the user isn't actually a member of rather than
        // failing the whole session save over one stale/invalid id.
        continue;
      }

      await tx.groupProgress.upsert({
        where: { unique_group_user_date: { groupId: gid, userId, date: today } },
        create: { groupId: gid, userId, date: today, versesRead, timeMinutes },
        update: {
          versesRead: { increment: versesRead },
          timeMinutes: { increment: timeMinutes },
        },
      });
    }

    return updatedProgress;
  });
}

export async function getDailyLogs(userId, { from, to } = {}) {
  return prisma.dailyLog.findMany({
    where: {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: 'desc' },
  });
}
