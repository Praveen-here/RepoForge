import { config } from '../config/index.js';
import {
  findPublishedProblemBySlug,
  listPublishedProblemsWithStatus,
} from '../repositories/problemRepository.js';
import { HttpError } from '../utils/HttpError.js';

/**
 * Container limits for a problem. Problems can raise the defaults in their config,
 * e.g. Spring Boot needs more memory and CPU and starts more slowly than Express:
 *   resources: { memoryMb: 1024, cpus: 2, startupTimeoutMs: 120000 }
 */
export function resourcesFor(problem) {
  const resources = problem.resources || {};
  return {
    hostConfig: {
      Memory: resources.memoryMb ? resources.memoryMb * 1024 * 1024 : config.container.memoryBytes,
      NanoCpus: resources.cpus ? resources.cpus * 1_000_000_000 : config.container.nanoCpus,
      PidsLimit: config.container.pidsLimit,
    },
    startupTimeoutMs: resources.startupTimeoutMs || config.container.readyTimeoutMs,
  };
}

/**
 * Loads a problem with everything needed to run it. `id` is the slug
 * (e.g. express-authentication-001), `dbId` the database row id.
 */
export async function getProblem(slug) {
  const row = await findPublishedProblemBySlug(slug);
  if (!row) {
    throw new HttpError(404, `Problem "${slug}" not found`);
  }
  return {
    dbId: row.id,
    id: row.slug,
    number: row.number,
    title: row.title,
    framework: row.framework,
    difficulty: row.difficulty,
    tags: row.tags,
    image: row.image,
    ...row.config, // rootDir, workdir, port, readme, entryFile, editable, hidden, test
  };
}

// The fields the browser may see (no image names or grading internals).
export function toPublicProblem(problem) {
  return {
    id: problem.id,
    number: problem.number,
    title: problem.title,
    framework: problem.framework,
    difficulty: problem.difficulty,
    tags: problem.tags,
    readme: problem.readme,
    entryFile: problem.entryFile,
    editable: problem.editable,
    sampleTestCommand: problem.test.sample,
  };
}

export async function listProblems(userId) {
  const rows = await listPublishedProblemsWithStatus(userId);
  return rows.map((row) => ({
    id: row.slug,
    number: row.number,
    title: row.title,
    framework: row.framework,
    difficulty: row.difficulty,
    tags: row.tags,
    status: row.status,
  }));
}
