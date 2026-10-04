import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';
import styles from './LaunchScreen.module.css';

/**
 * Full-page states around the workspace:
 *   loading -> starting the container
 *   error   -> it could not start
 *   lost    -> it was stopped (idle, or too many open problems); the code is saved
 */
export default function LaunchScreen({ problemId, error, lost, idleMinutes, onRetry }) {
  if (lost) {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <div className={styles.pauseIcon}>
            <Icon name="clock" size={26} />
          </div>
          <h1 className={styles.title}>Your environment was paused</h1>
          <p className={styles.text}>
            To save resources, environments stop after {idleMinutes || 20} minute{idleMinutes === 1 ? '' : 's'} without
            activity, or when you
            open more than 2 problems at once. <strong>Your code is saved.</strong>
          </p>
          <Button variant="primary" icon="play" onClick={onRetry}>
            Restart environment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <Logo size={44} />
        <h1 className={styles.title}>{error ? 'Could not start the environment' : 'Preparing your workspace'}</h1>
        <p className={styles.problem}>{problemId}</p>

        {error ? (
          <>
            <p className={styles.error}>
              <Icon name="alert" size={15} />
              {error}
            </p>
            <Button variant="primary" icon="refresh" onClick={onRetry}>
              Try again
            </Button>
          </>
        ) : (
          <ul className={styles.steps}>
            <li>
              <Spinner size={14} color="var(--accent)" />
              Starting an isolated container
            </li>
            <li>
              <Spinner size={14} color="var(--accent)" />
              Booting the app for the live preview
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
