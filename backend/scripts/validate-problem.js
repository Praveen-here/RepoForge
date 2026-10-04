// Checks that a problem is solvable and its bug is real:
//   1. builds the problem's Docker image
//   2. grades the original (buggy) code   -> at least one hidden test must FAIL
//   3. applies solution.patch and grades  -> every hidden test must PASS
//
// Usage (from backend/):
//   npm run validate-problem -- ../../repo-forge-challenges/<problem-folder> [--skip-build]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { config } from '../src/config/index.js';
import { problems } from '../src/db/seeds/problems.js';
import { docker } from '../src/services/docker.js';
import { fromDirectory, runGrading } from '../src/services/gradingService.js';

const SKIP_DIRS = new Set(['node_modules', 'target', '.git', '__pycache__', '.pytest_cache']);

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function printResult(label, result) {
  console.log(`\n${label}: ${result.status.toUpperCase()}  ${result.passed}/${result.total} passed  (${(result.durationMs / 1000).toFixed(1)}s)`);
  for (const test of result.tests) {
    console.log(`   ${test.status === 'passed' ? '✓' : '✗'} ${test.name}`);
  }
}

const problemDir = path.resolve(process.argv[2] || '');
const slug = path.basename(problemDir);
const seed = problems.find((p) => p.slug === slug);
if (!seed) fail(`"${slug}" is not listed in src/db/seeds/problems.js`);

const problem = { id: seed.slug, image: seed.image, ...seed.config };
const patchFile = path.join(config.testsDir, slug, 'solution.patch');
await fs.access(patchFile).catch(() => fail(`Missing ${patchFile}`));

/** Every file in the build context, as forward-slash relative paths (skips SKIP_DIRS). */
async function listContextFiles(dir, prefix = '') {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listContextFiles(path.join(dir, entry.name), relative)));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

/** Builds the image through the Docker API (no docker CLI needed on PATH). */
async function buildImage() {
  const stream = await docker.buildImage(
    { context: problemDir, src: await listContextFiles(problemDir) },
    { t: seed.image },
  );
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (error, output) => {
        const failure = error || output.find((line) => line.error)?.error;
        return failure ? reject(new Error(failure)) : resolve();
      },
      (event) => event.stream?.startsWith('Step') && console.log(`  ${event.stream.trim()}`),
    );
  });
}

if (!process.argv.includes('--skip-build')) {
  console.log(`Building ${seed.image} ...`);
  await buildImage().catch((error) => fail(`docker build failed: ${error.message}`));
}

// 1. Buggy code, exactly as shipped in the image.
const buggy = await runGrading(problem, async () => {}, { label: `validate-${slug}-buggy` });
printResult('Buggy code', buggy);

// 2. Reference fix: copy the problem folder, apply the patch, grade those files.
const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `rf-validate-${slug}-`));
try {
  await fs.cp(problemDir, workDir, {
    recursive: true,
    filter: (source) => !SKIP_DIRS.has(path.basename(source)),
  });
  const apply = spawnSync('git', ['apply', '--whitespace=nowarn', patchFile], { cwd: workDir, encoding: 'utf8' });
  if (apply.status !== 0) fail(`solution.patch does not apply:\n${apply.stderr}`);

  const fixed = await runGrading(problem, fromDirectory(workDir), { label: `validate-${slug}-fixed` });
  printResult('With solution.patch', fixed);

  const bugIsReal = buggy.total > 0 && buggy.status !== 'accepted';
  const fixWorks = fixed.status === 'accepted';
  if (!bugIsReal) fail('The buggy code passes every hidden test, so the tests do not catch the bug.');
  if (!fixWorks) fail('The reference fix does not pass every hidden test.');
  console.log(`\n✓ ${slug} is valid: the bug is caught and the fix passes.\n`);
} finally {
  await fs.rm(workDir, { recursive: true, force: true });
}
