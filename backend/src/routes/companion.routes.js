import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as companionController from '../controllers/companion.controller.js';

const router = Router();
router.use(requireAuth);

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
});

const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/encouragement', companionController.encouragement);
router.get('/conversations', companionController.listConversations);
router.get(
  '/conversations/:id/messages',
  validate({ params: idParamSchema }),
  companionController.getMessages
);
router.post('/messages', validate({ body: sendMessageSchema }), companionController.sendMessage);

export default router;
