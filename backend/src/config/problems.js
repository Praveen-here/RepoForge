import { HttpError } from '../utils/HttpError.js';

// Spike: problems are hardcoded here, mirroring each problem's problem.yaml.
// Phase 2 moves this into the Postgres `problems` table.
const problems = {
  'express-authentication-001': {
    id: 'express-authentication-001',
    title: 'Fix the Login Bug',
    framework: 'express',
    difficulty: 'Easy',
    image: 'express-authentication-001:v1',
    rootDir: '/app',
    workdir: '/app/backend',
    port: 3000,
    readme: 'README.md',
    editable: ['backend/src', 'frontend'],
    hidden: ['problem.yaml'],
    test: {
      sample: 'npm test',
      hiddenDir: 'backend/.grader',
      command: ['npx', 'jest', '--ci', '--roots=.grader', '--json', '--outputFile=/tmp/report.json'],
      reportPath: '/tmp/report.json',
      timeoutMs: 60_000,
    },
  },
};

export function getProblem(problemId) {
  const problem = problems[problemId];
  if (!problem) {
    throw new HttpError(404, `Problem "${problemId}" not found`);
  }
  return problem;
}

export function hasProblem(problemId) {
  return Boolean(problems[problemId]);
}

// The fields the browser is allowed to see (no image names or grading internals).
export function toPublicProblem(problem) {
  return {
    id: problem.id,
    title: problem.title,
    framework: problem.framework,
    difficulty: problem.difficulty,
    readme: problem.readme,
    editable: problem.editable,
    sampleTestCommand: problem.test.sample,
  };
}
