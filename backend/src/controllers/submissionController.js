import { getSession, touchSession } from '../services/sessionService.js';
import { submitSession } from '../services/submissionService.js';

export async function submit(req, res) {
  const session = await getSession(req.params.sessionId, req.user.id);
  await touchSession(session);
  const submission = await submitSession(session);
  res.status(201).json({ submission });
}
