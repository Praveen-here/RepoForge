import { getSession } from '../services/sessionService.js';
import { submitSession } from '../services/submissionService.js';

export async function submit(req, res) {
  const submission = await submitSession(getSession(req.params.sessionId, req.user.id));
  res.status(201).json({ submission });
}
