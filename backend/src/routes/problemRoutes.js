import { Router } from 'express';
import { getProblemById } from '../controllers/problemController.js';

const router = Router();

router.get('/:problemId', getProblemById);

export default router;
