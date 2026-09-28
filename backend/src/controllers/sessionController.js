import { HttpError } from '../utils/HttpError.js';
import {
  getSession,
  restartSession,
  startSession,
  stopSession,
  toPublicSession,
} from '../services/sessionService.js';

export async function createSession(req, res) {
  const { problemId } = req.body || {};
  if (!problemId) {
    throw new HttpError(400, 'problemId is required');
  }

  const session = await startSession(problemId, req.user.id);
  res.status(201).json({ session: toPublicSession(session) });
}

export function getSessionById(req, res) {
  res.json({ session: toPublicSession(getSession(req.params.sessionId, req.user.id)) });
}

export async function restart(req, res) {
  const session = await restartSession(req.params.sessionId, req.user.id);
  res.json({ session: toPublicSession(session) });
}

export async function remove(req, res) {
  await stopSession(req.params.sessionId, req.user.id, { reset: req.query.reset === 'true' });
  res.status(204).end();
}
