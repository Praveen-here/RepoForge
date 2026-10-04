import { listFiles, readFile, writeFile } from '../services/fileService.js';
import { getSession, touchSession } from '../services/sessionService.js';

export async function getTree(req, res) {
  const tree = await listFiles(await getSession(req.params.sessionId, req.user.id));
  res.json({ tree });
}

export async function getContent(req, res) {
  const file = await readFile(await getSession(req.params.sessionId, req.user.id), req.query.path);
  res.json({ file });
}

export async function saveContent(req, res) {
  const { path, content } = req.body || {};
  const session = await getSession(req.params.sessionId, req.user.id);
  const result = await writeFile(session, path, content);
  await touchSession(session);
  res.json(result);
}
