// Problems to load into the database with `npm run seed`.
// `config` mirrors each problem's problem.yaml: how to run, edit and grade it.

/** Express problems: Node 22 + nodemon, graded with Jest (JSON report). */
function expressConfig(overrides = {}) {
  return {
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
      reportFormat: 'jest-json',
      timeoutMs: 60_000,
    },
    ...overrides,
  };
}

/** Django problems: Python 3.12 + runserver auto-reload, graded with pytest (JUnit XML). */
function djangoConfig(appName) {
  return {
    rootDir: '/app',
    workdir: '/app/backend',
    port: 8000,
    readme: 'README.md',
    entryFile: `backend/${appName}/views.py`,
    editable: [`backend/${appName}`, 'frontend'],
    hidden: ['problem.yaml'],
    resources: { startupTimeoutMs: 60_000 },
    test: {
      sample: 'python -m pytest tests -q',
      hiddenDir: 'backend/.grader',
      command: ['python', '-m', 'pytest', '.grader', '-q', '-p', 'no:cacheprovider', '--junitxml=/tmp/report.xml'],
      reportPath: '/tmp/report.xml',
      reportFormat: 'junit-xml',
      timeoutMs: 90_000,
    },
  };
}

/** Spring Boot problems: Java 21, recompiled on save by start.sh, graded with Maven Surefire (JUnit XML). */
function springConfig(packagePath, entryClass) {
  return {
    rootDir: '/app',
    workdir: '/app/backend',
    port: 8080,
    readme: 'README.md',
    entryFile: `backend/src/main/java/${packagePath}/${entryClass}.java`,
    editable: ['backend/src/main'],
    hidden: ['problem.yaml', 'start.sh'],
    resources: { memoryMb: 1024, cpus: 2, startupTimeoutMs: 180_000 },
    test: {
      sample: 'mvn -o -q test',
      hiddenDir: `backend/src/test/java/${packagePath}`,
      command: [
        'sh',
        '-c',
        // Delete compiled classes first so the grader always compiles the submitted code.
        'rm -rf target/classes target/test-classes target/surefire-reports && mvn -o -q test -Dtest=HiddenTests -Dsurefire.failIfNoSpecifiedTests=false -Dmaven.test.failure.ignore=true',
      ],
      reportPath: '/app/backend/target/surefire-reports',
      reportFormat: 'junit-xml',
      timeoutMs: 240_000,
    },
  };
}

export const problems = [
  {
    slug: 'express-authentication-001',
    number: 1,
    title: 'Fix the Login Bug',
    framework: 'express',
    difficulty: 'Easy',
    tags: ['Authentication', 'bcrypt', 'async/await', 'JWT'],
    image: 'express-authentication-001:v1',
    config: expressConfig(),
  },
  {
    slug: 'express-admin-access-002',
    number: 2,
    title: 'Lock Down the Admin Routes',
    framework: 'express',
    difficulty: 'Medium',
    tags: ['Middleware', 'Authorization', 'JWT', 'Security'],
    image: 'express-admin-access-002:v1',
    config: expressConfig(),
  },
  {
    slug: 'express-product-pagination-003',
    number: 3,
    title: 'Fix Product Pagination',
    framework: 'express',
    difficulty: 'Medium',
    tags: ['Pagination', 'Query Params', 'Type Coercion'],
    image: 'express-product-pagination-003:v1',
    config: expressConfig({ entryFile: 'backend/src/controllers/productController.js' }),
  },
  {
    slug: 'express-flash-sale-004',
    number: 4,
    title: 'Stop the Flash-Sale Overselling',
    framework: 'express',
    difficulty: 'Hard',
    tags: ['Concurrency', 'Race Condition', 'async/await', 'Payments'],
    image: 'express-flash-sale-004:v1',
    config: expressConfig({ entryFile: 'backend/src/controllers/orderController.js' }),
  },
  {
    slug: 'django-library-borrow-005',
    number: 5,
    title: 'Borrowed Books Never Leave the Shelf',
    framework: 'django',
    difficulty: 'Easy',
    tags: ['Django ORM', 'Models', 'REST'],
    image: 'django-library-borrow-005:v1',
    config: djangoConfig('library'),
  },
  {
    slug: 'django-expense-summary-006',
    number: 6,
    title: 'Fix the Monthly Expense Report',
    framework: 'django',
    difficulty: 'Medium',
    tags: ['Django ORM', 'Aggregation', 'Dates'],
    image: 'django-expense-summary-006:v1',
    config: djangoConfig('expenses'),
  },
  {
    slug: 'spring-task-filter-007',
    number: 7,
    title: 'Status Filter Returns Nothing',
    framework: 'spring',
    difficulty: 'Easy',
    tags: ['Java', 'String Comparison', 'REST'],
    image: 'spring-task-filter-007:v1',
    config: springConfig('com/repoforge/tasks', 'TaskService'),
  },
];
