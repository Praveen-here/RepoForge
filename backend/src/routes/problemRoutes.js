import { Router } from 'express';
import { clearCoach, getCoach } from '../controllers/coachController.js';
import { getProblemBySlug, getProblemList, getProblemSubmissions } from '../controllers/problemController.js';

const router = Router();

router.get('/', getProblemList);
router.get('/:problemId', getProblemBySlug);
router.get('/:problemId/submissions', getProblemSubmissions);
router.get('/:problemId/coach', getCoach);
router.delete('/:problemId/coach', clearCoach);

export default router;
