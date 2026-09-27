import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import styles from './TopBar.module.css';

const FRAMEWORK_LABELS = { express: 'Express.js', django: 'Django', spring: 'Spring Boot' };

export default function TopBar({
  problem,
  sessionStatus,
  onRestart,
  onRunTests,
  onSubmit,
  restarting,
  submitting,
}) {
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <Logo size={24} />
        <span className={styles.brandName}>
          Repo<span>Forge</span>
        </span>
      </div>

      <div className={styles.divider} />

      {problem && (
        <div className={styles.problem}>
          <span className={styles.problemId}>{problem.id}</span>
          <span className={styles.problemTitle}>{problem.title}</span>
          <span className={`${styles.badge} ${styles[`difficulty${problem.difficulty}`]}`}>{problem.difficulty}</span>
          <span className={styles.chip}>{FRAMEWORK_LABELS[problem.framework] || problem.framework}</span>
        </div>
      )}

      <div className={styles.actions}>
        <span className={`${styles.status} ${styles[sessionStatus]}`}>
          <span className={styles.dot} />
          {sessionStatus === 'running' ? 'Environment running' : 'Restarting…'}
        </span>
        <Button variant="ghost" icon="restart" onClick={onRestart} loading={restarting} title="Restart the app container">
          Restart
        </Button>
        <Button variant="secondary" icon="play" onClick={onRunTests} title="Run the sample tests in the terminal">
          Run Tests
        </Button>
        <Button variant="primary" icon="send" onClick={onSubmit} loading={submitting}>
          {submitting ? 'Grading…' : 'Submit'}
        </Button>
      </div>
    </header>
  );
}
