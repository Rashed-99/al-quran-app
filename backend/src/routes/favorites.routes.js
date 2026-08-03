import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import * as favoritesController from '../controllers/favorites.controller.js';

const router = Router();
router.use(requireAuth);

const createFavoriteSchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  surahName: z.string().min(1),
  verseNumber: z.number().int().min(1),
  arabicText: z.string().min(1),
  translation: z.string().min(1),
  notes: z.string().max(2000).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/', favoritesController.list);
router.post('/', validate({ body: createFavoriteSchema }), favoritesController.create);
router.delete('/:id', validate({ params: idParamSchema }), favoritesController.remove);

export default router;
