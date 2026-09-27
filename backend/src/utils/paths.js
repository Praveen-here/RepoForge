import path from 'node:path';
import { HttpError } from './HttpError.js';

const posix = path.posix;

// Turns a path from the browser (e.g. "backend/src/app.js") into an absolute
// path inside the container, and refuses anything that escapes the project root.
export function resolveProblemPath(problem, relPath) {
  if (typeof relPath !== 'string' || relPath.trim() === '') {
    throw new HttpError(400, 'A file path is required');
  }

  const absPath = posix.normalize(posix.join(problem.rootDir, relPath));
  if (absPath !== problem.rootDir && !absPath.startsWith(`${problem.rootDir}/`)) {
    throw new HttpError(400, 'Path is outside the project');
  }
  return absPath;
}

export function toRelativePath(problem, absPath) {
  return posix.relative(problem.rootDir, absPath);
}

export function isEditable(problem, relPath) {
  const normalized = posix.normalize(relPath);
  return problem.editable.some((dir) => normalized === dir || normalized.startsWith(`${dir}/`));
}
