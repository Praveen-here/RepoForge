import path from 'node:path';
import { config } from '../config/index.js';
import { getProblem } from '../config/problems.js';
import { HttpError } from '../utils/HttpError.js';
import { isEditable, resolveProblemPath, toRelativePath } from '../utils/paths.js';
import { packFiles, readFirstFile } from '../utils/tar.js';
import { execInContainer } from './docker.js';
import { getSessionContainer } from './sessionService.js';

const posix = path.posix;

// ---------- File tree ----------

function listCommand(rootDir) {
  const prune = config.files.excluded.map((name) => `-name ${name}`).join(' -o ');
  const find = (type) => `find . -mindepth 1 \\( ${prune} \\) -prune -o -type ${type} -print | sed 's/^/${type} /'`;
  return ['sh', '-c', `cd ${rootDir} && ${find('d')} && ${find('f')}`];
}

function sortTree(nodes) {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const node of nodes) {
    if (node.children) sortTree(node.children);
  }
  return nodes;
}

function buildTree(entries, problem) {
  const root = { children: [] };
  const directories = new Map([['', root]]);

  const ensureDirectory = (dirPath) => {
    if (directories.has(dirPath)) return directories.get(dirPath);
    const parent = ensureDirectory(posix.dirname(dirPath) === '.' ? '' : posix.dirname(dirPath));
    const node = {
      name: posix.basename(dirPath),
      path: dirPath,
      type: 'directory',
      editable: isEditable(problem, dirPath),
      children: [],
    };
    parent.children.push(node);
    directories.set(dirPath, node);
    return node;
  };

  for (const entry of entries) {
    if (entry.type === 'd') {
      ensureDirectory(entry.path);
    } else {
      const parentPath = posix.dirname(entry.path);
      const parent = ensureDirectory(parentPath === '.' ? '' : parentPath);
      parent.children.push({
        name: posix.basename(entry.path),
        path: entry.path,
        type: 'file',
        editable: isEditable(problem, entry.path),
      });
    }
  }

  return sortTree(root.children);
}

export async function listFiles(session) {
  const problem = getProblem(session.problemId);
  const container = getSessionContainer(session);

  const { stdout } = await execInContainer(container, listCommand(problem.rootDir));

  const entries = stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => ({ type: line[0], path: line.slice(2).replace(/^\.\//, '') }))
    .filter((entry) => !problem.hidden.includes(entry.path));

  return buildTree(entries, problem);
}

// ---------- Read / write ----------

export async function readFile(session, relPath) {
  const problem = getProblem(session.problemId);
  const absPath = resolveProblemPath(problem, relPath);
  const container = getSessionContainer(session);

  let archive;
  try {
    archive = await container.getArchive({ path: absPath });
  } catch (error) {
    if (error.statusCode === 404) throw new HttpError(404, 'File not found');
    throw error;
  }

  const content = await readFirstFile(archive, config.files.maxReadBytes);
  if (content === null) {
    throw new HttpError(400, 'Path is not a file');
  }

  const relativePath = toRelativePath(problem, absPath);
  return {
    path: relativePath,
    content: content.toString('utf8'),
    editable: isEditable(problem, relativePath),
  };
}

export async function writeFile(session, relPath, content) {
  const problem = getProblem(session.problemId);
  const absPath = resolveProblemPath(problem, relPath);
  const relativePath = toRelativePath(problem, absPath);

  if (typeof content !== 'string') {
    throw new HttpError(400, 'File content must be a string');
  }
  if (!isEditable(problem, relativePath)) {
    throw new HttpError(403, 'This file is read-only');
  }

  const archive = await packFiles([{ name: posix.basename(absPath), content: Buffer.from(content, 'utf8') }]);
  await getSessionContainer(session).putArchive(archive, { path: posix.dirname(absPath) });

  return { path: relativePath, savedAt: new Date().toISOString() };
}
