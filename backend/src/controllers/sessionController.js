import { HttpError } from '../utils/HttpError.js';
import {
  getSession,
  resetSession,
  restartSession,
  startSession,
  stopSession,
  toPublicSession,
  touchSession,
} from '../services/sessionService.js';

export async function createSession(req, res) {
  const { problemId } = req.body || {};
  if (!problemId) {
    throw new HttpError(400, 'problemId is required');
  }

  const session = await startSession(problemId, req.user.id);
  res.status(201).json({ session: toPublicSession(session) });
}

export async function getSessionById(req, res) {
  res.json({ session: toPublicSession(await getSession(req.params.sessionId, req.user.id)) });
}

/** POST /api/sessions/:id/heartbeat: the browser says "the user is still working". */
export async function heartbeat(req, res) {
  await touchSession(await getSession(req.params.sessionId, req.user.id));
  res.status(204).end();
}

export async function restart(req, res) {
  const session = await restartSession(req.params.sessionId, req.user.id);
  res.json({ session: toPublicSession(session) });
}

/** POST /api/sessions/:id/reset: back to the original code (the user's changes are deleted). */
export async function reset(req, res) {
  const session = await resetSession(req.params.sessionId, req.user.id);
  res.json({ session: toPublicSession(session) });
}

export async function remove(req, res) {
  await stopSession(req.params.sessionId, req.user.id, { reset: req.query.reset === 'true' });
  res.status(204).end();
}
