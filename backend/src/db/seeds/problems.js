// Problems to load into the database with `npm run seed`.
// `config` mirrors each problem's problem.yaml: how to run, edit and grade it.
export const problems = [
  {
    slug: 'express-authentication-001',
    number: 1,
    title: 'Fix the Login Bug',
    framework: 'express',
    difficulty: 'Easy',
    tags: ['Authentication', 'bcrypt', 'async/await', 'JWT'],
    image: 'express-authentication-001:v1',
    config: {
      rootDir: '/app',
      workdir: '/app/backend',
      port: 3000,
      readme: 'README.md',
      entryFile: 'backend/src/app.js', // opened in the editor when the workspace loads
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
  },
];
