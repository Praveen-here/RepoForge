import { Router } from 'express';
import {
  confirmMagicLink,
  finishOAuth,
  getMe,
  listProviders,
  logout,
  sendMagicLink,
  startOAuth,
} from '../controllers/authController.js';

const router = Router();

router.get('/providers', listProviders);
router.get('/me', getMe);
router.post('/logout', logout);

router.post('/magic-link', sendMagicLink);
router.post('/magic-link/verify', confirmMagicLink);

// Keep these last: ":provider" would otherwise also match "/me" and "/providers".
router.get('/:provider', startOAuth);
router.get('/:provider/callback', finishOAuth);

export default router;
