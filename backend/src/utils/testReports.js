// Turns test-runner reports into one shape: [{ name, status: passed|failed|skipped, durationMs }].
//   jest-json  -> Jest's --json output (Express problems)
//   junit-xml  -> JUnit XML, written by pytest (--junitxml) and Maven Surefire (Django, Spring)

export function parseJestJson(text) {
  const report = JSON.parse(text);
  return report.testResults.flatMap((file) =>
    file.assertionResults.map((assertion) => ({
      name: [...assertion.ancestorTitles, assertion.title].join(' › '),
      status: assertion.status,
      durationMs: assertion.duration ?? 0,
    })),
  );
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function readAttributes(source) {
  const attributes = {};
  for (const [, key, value] of source.matchAll(/([\w:.-]+)="([^"]*)"/g)) {
    attributes[key] = decodeXml(value);
  }
  return attributes;
}

/** "returnsOnlyDoneTasks()" / "test_returns_only_done" -> "Returns only done tasks" */
function humanize(identifier) {
  const words = identifier
    .replace(/\(\)$/, '')
    .replace(/^test_?/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // returnsDone -> returns Done
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // ATask -> A Task
    .replace(/([a-zA-Z])(\d)/g, '$1 $2') // returns400 -> returns 400
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Test group label from a classname such as "test_hidden.TestBorrowing" (pytest)
 * or "com.repoforge.tasks.HiddenTests$FilterByStatus" (JUnit @Nested). Module-only
 * names (pytest functions) and the top-level "HiddenTests" wrapper are skipped.
 */
function groupLabel(classname = '') {
  const last = classname.split(/[.$]/).pop() || '';
  if (!/^[A-Z]/.test(last)) return '';
  const name = last.replace(/^Test/, '').replace(/Tests?$/, '');
  if (!name || name === 'Hidden' || name === 'Sample') return '';
  return humanize(name);
}

export function parseJUnitXml(documents) {
  const tests = [];
  for (const xml of documents) {
    for (const match of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
      const attributes = readAttributes(match[1]);
      const body = match[2] || '';

      let status = 'passed';
      if (/<(failure|error)\b/.test(body)) status = 'failed';
      else if (/<skipped\b/.test(body)) status = 'skipped';

      const group = groupLabel(attributes.classname);
      const title = humanize(attributes.name || 'test');
      tests.push({
        name: group ? `${group} › ${title}` : title,
        status,
        durationMs: Math.round(Number.parseFloat(attributes.time || '0') * 1000),
      });
    }
  }
  return tests;
}
