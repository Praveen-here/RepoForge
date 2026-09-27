import { Router } from 'express';
import { getContent, getTree, saveContent } from '../controllers/fileController.js';
import { createSession, getSessionById, remove, restart } from '../controllers/sessionController.js';
import { submit } from '../controllers/submissionController.js';

const router = Router();

router.post('/', createSession);
router.get('/:sessionId', getSessionById);
router.post('/:sessionId/restart', restart);
router.delete('/:sessionId', remove);

router.get('/:sessionId/files', getTree);
router.get('/:sessionId/files/content', getContent);
router.put('/:sessionId/files/content', saveContent);

router.post('/:sessionId/submissions', submit);

export default router;
