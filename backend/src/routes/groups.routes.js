import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as groupsController from '../controllers/groups.controller.js';

const router = Router();
router.use(requireAuth);

const createGroupSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});

const joinGroupSchema = z.object({
  inviteCode: z.string().length(6),
});

const idParamSchema = z.object({ id: z.string().uuid() });

const rangeQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
});

router.get('/', groupsController.list);
router.post('/', validate({ body: createGroupSchema }), groupsController.create);
router.post('/join', validate({ body: joinGroupSchema }), groupsController.join);
router.get('/:id', validate({ params: idParamSchema }), groupsController.detail);
router.get(
  '/:id/progress',
  validate({ params: idParamSchema, query: rangeQuerySchema }),
  groupsController.progress
);
router.get(
  '/:id/leaderboard',
  validate({ params: idParamSchema, query: rangeQuerySchema }),
  groupsController.leaderboard
);

export default router;
