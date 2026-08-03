import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { deleteAccount } from '../controllers/account.controller.js';

const router = Router();

router.delete('/', requireAuth, deleteAccount);

export default router;
