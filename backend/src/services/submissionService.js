import { createSubmission, listSubmissions } from '../repositories/submissionRepository.js';
import { gradeSession } from './gradingService.js';
import { getProblem } from './problemService.js';

function toPublicSubmission(row) {
  return {
    id: row.id,
    status: row.status,
    passed: row.passed,
    total: row.total,
    durationMs: row.runtime_ms,
    tests: row.results,
    createdAt: row.created_at,
  };
}

/** Grades the session's current code and saves the result. */
export async function submitSession(session) {
  const result = await gradeSession(session);
  const row = await createSubmission({
    userId: session.userId,
    problemId: session.problem.dbId,
    status: result.status,
    passed: result.passed,
    total: result.total,
    runtimeMs: result.durationMs,
    results: result.tests,
  });
  return toPublicSubmission(row);
}

export async function getSubmissionHistory(userId, problemSlug) {
  const problem = await getProblem(problemSlug);
  const rows = await listSubmissions({ userId, problemId: problem.dbId });
  return rows.map(toPublicSubmission);
}
