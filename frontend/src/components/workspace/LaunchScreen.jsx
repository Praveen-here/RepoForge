import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';
import styles from './LaunchScreen.module.css';

export default function LaunchScreen({ problemId, error, onRetry }) {
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
