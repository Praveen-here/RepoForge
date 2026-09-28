import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import styles from './TestResults.module.css';

const VERDICTS = {
  accepted: { title: 'Accepted', tone: 'success' },
  failed: { title: 'Wrong Answer', tone: 'danger' },
  error: { title: 'Runtime Error', tone: 'danger', note: 'The tests could not run. Check App Logs for errors in your code.' },
  timeout: { title: 'Time Limit Exceeded', tone: 'danger', note: 'Grading took too long and was stopped.' },
};

/** submission: { status: "idle" | "running" | "done" | "error", result?, error? } */
export default function TestResults({ submission }) {
  if (submission.status === 'idle') {
    return (
      <div className={styles.placeholder}>
        <p>You must submit your code first.</p>
        <p className={styles.hint}>Submissions are judged against hidden tests in a fresh, isolated container.</p>
      </div>
    );
  }

  if (submission.status === 'running') {
    return (
      <div className={styles.placeholder}>
        <Spinner size={22} color="var(--text-muted)" />
        <p>Judging…</p>
      </div>
    );
  }

  if (submission.status === 'error') {
    return (
      <div className={styles.placeholder}>
        <p className={styles.danger}>{submission.error}</p>
      </div>
    );
  }

  const { result } = submission;
  const verdict = VERDICTS[result.status] || VERDICTS.error;

  return (
    <div className={styles.results}>
      <div className={styles.header}>
        <h2 className={`${styles.verdict} ${styles[verdict.tone]}`}>{verdict.title}</h2>
        <span className={styles.summary}>
          {result.passed} / {result.total} testcases passed
        </span>
      </div>

      {verdict.note && <p className={styles.note}>{verdict.note}</p>}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            <Icon name="clock" size={14} />
            Runtime
          </span>
          <span className={styles.statValue}>
            {(result.durationMs / 1000).toFixed(2)} <small>s</small>
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            <Icon name="checkSquare" size={14} />
            Passed
          </span>
          <span className={styles.statValue}>
            {result.passed} <small>/ {result.total}</small>
          </span>
        </div>
      </div>

      <ul className={styles.list}>
        {result.tests.map((test) => (
          <li key={test.name} className={styles.test}>
            <span className={`${styles.testDot} ${test.status === 'passed' ? styles.pass : styles.fail}`} />
            <span className={styles.testName}>{test.name}</span>
            <span className={styles.duration}>{test.durationMs} ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
