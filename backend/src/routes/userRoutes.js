import { Router } from 'express';
import { getUserProfile, updateMe } from '../controllers/userController.js';

const router = Router();

router.patch('/me', updateMe);
router.get('/:username/profile', getUserProfile);

export default router;
