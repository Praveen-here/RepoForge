import { Router } from 'express';
import { getProblemBySlug, getProblemList, getProblemSubmissions } from '../controllers/problemController.js';

const router = Router();

router.get('/', getProblemList);
router.get('/:problemId', getProblemBySlug);
router.get('/:problemId/submissions', getProblemSubmissions);

export default router;
