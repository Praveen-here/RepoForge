import { askCoach, clearCoachConversation, getCoachState } from '../services/coach/coachService.js';
import { getSession } from '../services/sessionService.js';

/** GET /api/problems/:problemId/coach: the saved conversation and hint progress. */
export async function getCoach(req, res) {
  res.json(await getCoachState(req.user.id, req.params.problemId));
}

/** DELETE /api/problems/:problemId/coach: starts a new conversation. */
export async function clearCoach(req, res) {
  await clearCoachConversation(req.user.id, req.params.problemId);
  res.status(204).end();
}

/** POST /api/sessions/:sessionId/coach { message | action, activeFile }: asks the coach. */
export async function ask(req, res) {
  const session = await getSession(req.params.sessionId, req.user.id);
  const { action, message, activeFile } = req.body || {};
  res.json(await askCoach(session, { action, message, activeFile }));
}
