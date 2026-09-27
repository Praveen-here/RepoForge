import { Router } from 'express';
import problemRoutes from './problemRoutes.js';
import sessionRoutes from './sessionRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/problems', problemRoutes);
router.use('/sessions', sessionRoutes);

export default router;
