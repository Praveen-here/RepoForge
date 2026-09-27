import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import styles from './TestResults.module.css';

const VERDICTS = {
  accepted: { title: 'Accepted', subtitle: 'All hidden tests passed. Nicely done.', tone: 'success', icon: 'check' },
  failed: { title: 'Wrong Answer', subtitle: 'Some hidden tests failed. Keep digging.', tone: 'danger', icon: 'x' },
  error: {
    title: 'Runtime Error',
    subtitle: 'The tests could not run. Check the App Logs tab for errors in your code.',
    tone: 'danger',
    icon: 'alert',
  },
  timeout: { title: 'Time Limit Exceeded', subtitle: 'Grading took too long and was stopped.', tone: 'danger', icon: 'clock' },
};

/** submission: { status: "idle" | "running" | "done" | "error", result?, error? } */
export default function TestResults({ submission }) {
  if (submission.status === 'idle') {
    return (
      <div className={styles.placeholder}>
        <Icon name="beaker" size={26} />
        <p>Click <strong>Submit</strong> to grade your fix against the hidden tests.</p>
        <p className={styles.hint}>Grading runs in a fresh, isolated container. Your workspace is not touched.</p>
      </div>
    );
  }

  if (submission.status === 'running') {
    return (
      <div className={styles.placeholder}>
        <Spinner size={24} color="var(--accent)" />
        <p>Running hidden tests in an isolated container…</p>
      </div>
    );
  }

  if (submission.status === 'error') {
    return (
      <div className={styles.placeholder}>
        <Icon name="alert" size={24} style={{ color: 'var(--danger)' }} />
        <p>{submission.error}</p>
      </div>
    );
  }

  const { result } = submission;
  const verdict = VERDICTS[result.status] || VERDICTS.error;
  const percent = result.total ? Math.round((result.passed / result.total) * 100) : 0;

  return (
    <div className={styles.results}>
      <div className={`${styles.summary} ${styles[verdict.tone]}`}>
        <div className={styles.verdictIcon}>
          <Icon name={verdict.icon} size={20} strokeWidth={2.25} />
        </div>
        <div className={styles.verdictText}>
          <h3>{verdict.title}</h3>
          <p>{verdict.subtitle}</p>
        </div>
        <div className={styles.score}>
          <span className={styles.scoreValue}>
            {result.passed}
            <span>/{result.total}</span>
          </span>
          <span className={styles.scoreLabel}>tests passed · {(result.durationMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {result.total > 0 && (
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
      )}

      <ul className={styles.list}>
        {result.tests.map((test) => (
          <li key={test.name} className={styles.test}>
            <span className={test.status === 'passed' ? styles.pass : styles.fail}>
              <Icon name={test.status === 'passed' ? 'check' : 'x'} size={14} strokeWidth={2.25} />
            </span>
            <span className={styles.testName}>{test.name}</span>
            <span className={styles.duration}>{test.durationMs} ms</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
