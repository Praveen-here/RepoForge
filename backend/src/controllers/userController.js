import { getProfile, updateMyProfile } from '../services/profileService.js';

export async function getUserProfile(req, res) {
  res.json(await getProfile(req.params.username, req.user.id));
}

export async function updateMe(req, res) {
  res.json({ user: await updateMyProfile(req.user, req.body || {}) });
}
