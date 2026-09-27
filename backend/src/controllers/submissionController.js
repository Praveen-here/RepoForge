import { gradeSession } from '../services/gradingService.js';
import { getSession } from '../services/sessionService.js';

export async function submit(req, res) {
  const result = await gradeSession(getSession(req.params.sessionId));
  res.json({ result });
}
