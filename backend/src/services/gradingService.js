import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/index.js';
import { getProblem } from '../config/problems.js';
import { HttpError } from '../utils/HttpError.js';
import { packFiles, readFirstFile } from '../utils/tar.js';
import { docker, execInContainer } from './docker.js';
import { getSessionContainer } from './sessionService.js';

const posix = path.posix;

// Grading runs in a fresh, short-lived container built from the clean problem image:
//   1. copy in only the user's editable folders
//   2. copy in the hidden tests
//   3. run the test command, read the JSON report, delete the container
// The user's own container never sees the hidden tests.

async function loadHiddenTests(problemId) {
  const dir = path.join(config.testsDir, problemId);
  let names;
  try {
    names = await fs.readdir(dir);
  } catch {
    throw new HttpError(500, `Hidden tests for "${problemId}" not found in ${config.testsDir}`);
  }

  const testFiles = names.filter((name) => !name.startsWith('solution'));
  return Promise.all(
    testFiles.map(async (name) => ({ name, content: await fs.readFile(path.join(dir, name)) })),
  );
}

async function copyUserFiles(problem, fromContainer, toContainer) {
  for (const dir of problem.editable) {
    const target = posix.join(problem.rootDir, dir);
    await execInContainer(toContainer, ['rm', '-rf', target], { user: 'root' });
    const archive = await fromContainer.getArchive({ path: target });
    await toContainer.putArchive(archive, { path: posix.dirname(target) });
  }
}

async function copyHiddenTests(problem, container) {
  const target = posix.join(problem.rootDir, problem.test.hiddenDir);
  await execInContainer(container, ['mkdir', '-p', target], { user: 'root' });
  const archive = await packFiles(await loadHiddenTests(problem.id));
  await container.putArchive(archive, { path: target });
}

async function readReport(container, reportPath) {
  try {
    const archive = await container.getArchive({ path: reportPath });
    const content = await readFirstFile(archive, 5 * 1024 * 1024);
    return content ? JSON.parse(content.toString('utf8')) : null;
  } catch {
    return null;
  }
}

// Only test names and pass/fail go back to the browser, never test code or error output.
function summarize(report) {
  const tests = report.testResults.flatMap((file) =>
    file.assertionResults.map((assertion) => ({
      name: [...assertion.ancestorTitles, assertion.title].join(' › '),
      status: assertion.status,
      durationMs: assertion.duration ?? 0,
    })),
  );
  const passed = tests.filter((test) => test.status === 'passed').length;
  return { passed, total: tests.length, tests };
}

export async function gradeSession(session) {
  const problem = getProblem(session.problemId);
  const startedAt = Date.now();

  const grader = await docker.createContainer({
    Image: problem.image,
    Cmd: ['sleep', 'infinity'],
    WorkingDir: problem.workdir,
    Labels: { 'repo-forge.grading': session.id },
    NetworkDisabled: true,
    HostConfig: {
      Memory: config.container.memoryBytes,
      NanoCpus: config.container.nanoCpus,
      PidsLimit: config.container.pidsLimit,
    },
  });

  try {
    await grader.start();
    await copyUserFiles(problem, getSessionContainer(session), grader);
    await copyHiddenTests(problem, grader);

    try {
      await execInContainer(grader, problem.test.command, {
        workdir: problem.workdir,
        timeoutMs: problem.test.timeoutMs,
      });
    } catch (error) {
      if (error.status === 504) {
        return { status: 'timeout', passed: 0, total: 0, tests: [], durationMs: Date.now() - startedAt };
      }
      throw error;
    }

    const report = await readReport(grader, problem.test.reportPath);
    const summary = report ? summarize(report) : { passed: 0, total: 0, tests: [] };

    let status = 'failed';
    if (summary.total === 0) status = 'error';
    else if (summary.passed === summary.total) status = 'accepted';

    return { status, ...summary, durationMs: Date.now() - startedAt };
  } finally {
    await grader.remove({ force: true }).catch(() => {});
  }
}
