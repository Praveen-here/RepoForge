import { listFiles, readFile, writeFile } from '../services/fileService.js';
import { getSession } from '../services/sessionService.js';

export async function getTree(req, res) {
  const tree = await listFiles(getSession(req.params.sessionId));
  res.json({ tree });
}

export async function getContent(req, res) {
  const file = await readFile(getSession(req.params.sessionId), req.query.path);
  res.json({ file });
}

export async function saveContent(req, res) {
  const { path, content } = req.body || {};
  const result = await writeFile(getSession(req.params.sessionId), path, content);
  res.json(result);
}
