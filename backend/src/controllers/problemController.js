import { getProblem, listProblems, toPublicProblem } from '../services/problemService.js';
import { getSubmissionHistory } from '../services/submissionService.js';

export async function getProblemList(req, res) {
  res.json({ problems: await listProblems(req.user.id) });
}

export async function getProblemBySlug(req, res) {
  const problem = await getProblem(req.params.problemId);
  res.json({ problem: toPublicProblem(problem) });
}

export async function getProblemSubmissions(req, res) {
  res.json({ submissions: await getSubmissionHistory(req.user.id, req.params.problemId) });
}
