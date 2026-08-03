import { Router } from 'express';
import authRoutes from './auth.routes.js';
import accountRoutes from './account.routes.js';
import progressRoutes from './progress.routes.js';
import favoritesRoutes from './favorites.routes.js';
import groupsRoutes from './groups.routes.js';
import companionRoutes from './companion.routes.js';
import tafsirRoutes from './tafsir.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/api/account', accountRoutes);
router.use('/api/reading-progress', progressRoutes);
router.use('/api/favorites', favoritesRoutes);
router.use('/api/groups', groupsRoutes);
router.use('/api/companion', companionRoutes);
router.use('/api/tafsir', tafsirRoutes);

router.get('/health', (req, res) => res.json({ status: 'ok' }));

export default router;
