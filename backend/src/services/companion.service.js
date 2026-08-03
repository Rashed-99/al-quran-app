import prisma from '../db/prismaClient.js';
import { ApiError } from '../utils/ApiError.js';
import { startOfTodayUTC } from '../utils/date.js';
import { env } from '../config/env.js';

const DAILY_MESSAGE_LIMIT = env.COMPANION_DAILY_MESSAGE_LIMIT;

// ---------------------------------------------------------------------
// 1. Progress encouragement - NO LLM CALL. Pure templated logic driven
//    by the user's real ReadingProgress row, replacing what Base44's
//    agent used to do with a live model call on every request.
// ---------------------------------------------------------------------
export async function getEncouragement(userId) {
  const progress = await prisma.readingProgress.findUnique({ where: { userId } });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  const name = user?.username ? user.username : 'there';

  if (!progress) {
    return `Welcome, ${name}! Ready to start your first reading session today?`;
  }

  const {
    currentStreak,
    longestStreak,
    todayVersesRead,
    todayTimeMinutes,
    dailyGoalVerses,
    dailyGoalMinutes,
    lastReadDate,
  } = progress;

  const readToday = lastReadDate && isToday(lastReadDate);
  const versesRemaining = Math.max(dailyGoalVerses - todayVersesRead, 0);
  const minutesRemaining = Math.max(dailyGoalMinutes - todayTimeMinutes, 0);
  const goalMet = versesRemaining === 0 || minutesRemaining === 0;

  if (!readToday) {
    if (currentStreak > 0) {
      return `Hi ${name}! You're on a ${currentStreak}-day streak — don't let it slip. Just ${dailyGoalVerses} verses today keeps it alive.`;
    }
    return `Hi ${name}! You haven't started today yet. Even ${dailyGoalVerses} verses (~${dailyGoalMinutes} min) would get you going.`;
  }

  if (goalMet) {
    return `Great work, ${name}! You've hit today's goal (${todayVersesRead} verses, ${todayTimeMinutes} min). Current streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}${currentStreak >= longestStreak && currentStreak > 0 ? ' — a new best!' : '.'}`;
  }

  return `You're ${versesRemaining} verse${versesRemaining === 1 ? '' : 's'} away from today's goal, ${name}. Keep going — you've got a ${currentStreak}-day streak riding on it.`;
}

function isToday(date) {
  const d = new Date(date);
  const today = startOfTodayUTC();
  return (
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate()
  );
}

// ---------------------------------------------------------------------
// 2. Conversations
// ---------------------------------------------------------------------
export async function listConversations(userId) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getOrCreateActiveConversation(userId) {
  const existing = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  if (existing) return existing;
  return prisma.conversation.create({ data: { userId } });
}

export async function getConversationMessages(userId, conversationId) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.userId !== userId) {
    throw ApiError.notFound('Conversation not found');
  }
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

// ---------------------------------------------------------------------
// 3. Rate-limited, LLM-backed open-ended chat
// ---------------------------------------------------------------------
async function assertUnderDailyLimit(userId) {
  const since = startOfTodayUTC();
  const count = await prisma.message.count({
    where: {
      role: 'user',
      createdAt: { gte: since },
      conversation: { userId },
    },
  });
  if (count >= DAILY_MESSAGE_LIMIT) {
    throw ApiError.tooManyRequests(
      `Daily Companion message limit (${DAILY_MESSAGE_LIMIT}) reached. Please try again tomorrow.`
    );
  }
}

const SYSTEM_PROMPT = `You are a Quran Companion for a Quran reading app. Be warm, concise, and encouraging.
When asked about reading progress, streaks, or goals, use the progress data provided in context - never invent numbers.
When asked to explain a verse (tafsir), remind the user they can open the Tafsir panel on any verse for classical scholarly explanations (Ibn Kathir, al-Jalalayn, al-Sa'di, Maududi) - you do not have live web search in this chat, so do not fabricate tafsir content yourself.
If asked something outside Quran/reading-progress topics, gently redirect back to your purpose.
Keep replies short unless the user asks for more detail.`;

async function callLLM(messages) {
  const response = await fetch(env.LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      messages,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw ApiError.internal(`Companion LLM call failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  // Written for an OpenAI-compatible chat completions response shape.
  // Adjust this line if your chosen free-tier provider's response differs.
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw ApiError.internal('Companion LLM returned an empty response');
  }
  return reply;
}

export async function sendMessage(userId, { conversationId, content }) {
  await assertUnderDailyLimit(userId);

  let conversation;
  if (conversationId) {
    conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.userId !== userId) {
      throw ApiError.notFound('Conversation not found');
    }
  } else {
    conversation = await prisma.conversation.create({ data: { userId } });
  }

  const progress = await prisma.readingProgress.findUnique({ where: { userId } });
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: 20, // cap context window sent to the LLM
  });

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'user', content },
  });

  const contextMessage = progress
    ? `User's current reading progress: streak=${progress.currentStreak} days, longestStreak=${progress.longestStreak}, todayVerses=${progress.todayVersesRead}/${progress.dailyGoalVerses}, todayMinutes=${progress.todayTimeMinutes}/${progress.dailyGoalMinutes}, totalVersesRead=${progress.totalVersesRead}.`
    : `User has no reading progress recorded yet.`;

  const llmMessages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextMessage}` },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content },
  ];

  const replyText = await callLLM(llmMessages);

  const [assistantMessage] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: conversation.id, role: 'assistant', content: replyText },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  return { conversationId: conversation.id, message: assistantMessage };
}
