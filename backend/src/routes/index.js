import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import authRoutes from './authRoutes.js';
import problemRoutes from './problemRoutes.js';
import sessionRoutes from './sessionRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);

// Everything below needs a signed-in user.
router.use('/problems', requireAuth, problemRoutes);
router.use('/sessions', requireAuth, sessionRoutes);

export default router;
