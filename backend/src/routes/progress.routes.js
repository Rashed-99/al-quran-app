import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as progressController from '../controllers/progress.controller.js';

const router = Router();
router.use(requireAuth);

const updateGoalsSchema = z.object({
  dailyGoalMinutes: z.number().int().positive().optional(),
  dailyGoalVerses: z.number().int().positive().optional(),
  currentSurah: z.number().int().min(1).max(114).optional(),
  currentVerse: z.number().int().min(1).optional(),
});

const logSessionSchema = z.object({
  versesRead: z.number().int().min(0).default(0),
  timeMinutes: z.number().min(0).default(0),
  hasanatEarned: z.number().min(0).optional(),
  currentSurah: z.number().int().min(1).max(114).optional(),
  currentVerse: z.number().int().min(1).optional(),
  groupId: z.string().uuid().optional(),
  groupIds: z.array(z.string().uuid()).optional(),
});

const dailyLogsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

router.get('/', progressController.getProgress);
router.patch('/', validate({ body: updateGoalsSchema }), progressController.updateGoals);
router.post('/sessions', validate({ body: logSessionSchema }), progressController.logSession);
router.get(
  '/daily-logs',
  validate({ query: dailyLogsQuerySchema }),
  progressController.getDailyLogs
);

export default router;
