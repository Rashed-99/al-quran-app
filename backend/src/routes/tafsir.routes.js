import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as tafsirController from '../controllers/tafsir.controller.js';

const router = Router();

const paramsSchema = z.object({
  surah: z.coerce.number().int().min(1).max(114),
  verse: z.coerce.number().int().min(1),
});

// Tafsir text is public/static content, not per-user data, but still
// requires login to reduce anonymous scraping of the precomputed dataset.
router.get('/:surah/:verse', requireAuth, validate({ params: paramsSchema }), tafsirController.getForVerse);

export default router;
