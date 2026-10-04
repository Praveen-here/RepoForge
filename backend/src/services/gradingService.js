import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config/index.js';
import { HttpError } from '../utils/HttpError.js';
import { packDirectory, packFiles, readAllFiles } from '../utils/tar.js';
import { parseJestJson, parseJUnitXml } from '../utils/testReports.js';
import { docker, execInContainer } from './docker.js';
import { resourcesFor } from './problemService.js';
import { getSessionContainer } from './sessionService.js';

const posix = path.posix;

// Grading runs in a fresh, short-lived, network-less container built from the clean
// problem image:
//   1. copy in only the code being graded (the editable folders)
//   2. copy in the hidden tests
//   3. run the test command, read the report, delete the container
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

async function clearEditable(problem, grader, dir) {
  const target = posix.join(problem.rootDir, dir);
  await execInContainer(grader, ['rm', '-rf', target], { user: 'root' });
  return target;
}

/** Copies the editable folders from a user's session container. */
function fromContainer(source) {
  return async (problem, grader) => {
    for (const dir of problem.editable) {
      const target = await clearEditable(problem, grader, dir);
      const archive = await source.getArchive({ path: target });
      await grader.putArchive(archive, { path: posix.dirname(target) });
    }
  };
}

/** Copies the editable folders from a problem folder on this machine (used by the validator). */
export function fromDirectory(problemDir) {
  return async (problem, grader) => {
    for (const dir of problem.editable) {
      const target = await clearEditable(problem, grader, dir);
      const archive = await packDirectory(path.join(problemDir, dir), posix.basename(target));
      await grader.putArchive(archive, { path: posix.dirname(target) });
    }
  };
}

async function copyHiddenTests(problem, container) {
  const target = posix.join(problem.rootDir, problem.test.hiddenDir);
  await execInContainer(container, ['mkdir', '-p', target], { user: 'root' });
  const archive = await packFiles(await loadHiddenTests(problem.id));
  await container.putArchive(archive, { path: target });
}

/** Reads the report file (or every .xml file in a report folder) and returns the tests. */
async function readTests(container, test) {
  let files;
  try {
    files = await readAllFiles(await container.getArchive({ path: test.reportPath }), 20 * 1024 * 1024);
  } catch {
    return [];
  }

  try {
    if (test.reportFormat === 'junit-xml') {
      const xml = files.filter((file) => file.name.endsWith('.xml')).map((file) => file.content.toString('utf8'));
      return parseJUnitXml(xml);
    }
    return files.length ? parseJestJson(files[0].content.toString('utf8')) : [];
  } catch {
    return [];
  }
}

/**
 * Grades one version of the code. `copyCode(problem, grader)` puts that code
 * into the grading container. Only test names and pass/fail are returned,
 * never test code or error output.
 */
export async function runGrading(problem, copyCode, { label = 'grading' } = {}) {
  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;

  const grader = await docker.createContainer({
    Image: problem.image,
    Cmd: ['sleep', 'infinity'],
    WorkingDir: problem.workdir,
    Labels: { 'repo-forge.grading': label },
    NetworkDisabled: true,
    HostConfig: resourcesFor(problem).hostConfig,
  });

  try {
    await grader.start();
    await copyCode(problem, grader);
    await copyHiddenTests(problem, grader);

    try {
      await execInContainer(grader, problem.test.command, {
        workdir: problem.workdir,
        timeoutMs: problem.test.timeoutMs,
      });
    } catch (error) {
      if (error.status === 504) {
        return { status: 'timeout', passed: 0, total: 0, tests: [], durationMs: elapsed() };
      }
      throw error;
    }

    const tests = (await readTests(grader, problem.test)).filter((test) => test.status !== 'skipped');
    const passed = tests.filter((test) => test.status === 'passed').length;

    let status = 'failed';
    if (tests.length === 0) status = 'error';
    else if (passed === tests.length) status = 'accepted';

    return { status, passed, total: tests.length, tests, durationMs: elapsed() };
  } finally {
    await grader.remove({ force: true }).catch(() => {});
  }
}

export function gradeSession(session) {
  return runGrading(session.problem, fromContainer(getSessionContainer(session)), { label: session.id });
}
