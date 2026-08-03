import asyncHandler from '../utils/asyncHandler.js';
import * as progressService from '../services/progress.service.js';

// Prisma returns BigInt for the hasanat columns (they can get large);
// JSON.stringify can't serialize BigInt natively, so normalize to Number
// before sending the response. Safe here since hasanat values stay well
// under Number.MAX_SAFE_INTEGER for any realistic amount of Quran reading.
function serializeProgress(progress) {
  if (!progress) return progress;
  return { ...progress, totalHasanat: Number(progress.totalHasanat) };
}

function serializeDailyLog(log) {
  return { ...log, hasanatEarned: Number(log.hasanatEarned) };
}

export const getProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getOrCreateProgress(req.user.id);
  res.json({ progress: serializeProgress(progress) });
});

export const updateGoals = asyncHandler(async (req, res) => {
  const progress = await progressService.updateGoals(req.user.id, req.body);
  res.json({ progress: serializeProgress(progress) });
});

export const logSession = asyncHandler(async (req, res) => {
  const progress = await progressService.logReadingSession(req.user.id, req.body);
  res.json({ progress: serializeProgress(progress) });
});

export const getDailyLogs = asyncHandler(async (req, res) => {
  const logs = await progressService.getDailyLogs(req.user.id, req.query);
  res.json({ logs: logs.map(serializeDailyLog) });
});
