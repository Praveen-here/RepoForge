import { getProblem, toPublicProblem } from '../config/problems.js';

export function getProblemById(req, res) {
  const problem = getProblem(req.params.problemId);
  res.json({ problem: toPublicProblem(problem) });
}
