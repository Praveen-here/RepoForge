import Link from 'next/link';
import UserMenu from '@/components/auth/UserMenu';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';
import styles from './TopBar.module.css';

export default function TopBar({
  sessionStatus,
  containerName,
  onRestart,
  onRunTests,
  onSubmit,
  restarting,
  submitting,
  showPanel,
  showPreview,
  onTogglePanel,
  onTogglePreview,
}) {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <Link href="/problems" className={styles.logo} aria-label="RepoForge home">
          <Logo size={22} />
        </Link>
        <Link href="/problems" className={styles.problemList}>
          <Icon name="list" size={18} />
          Problem List
        </Link>
      </div>

      <div className={styles.center}>
        <div className={styles.group}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onRestart}
            disabled={restarting}
            title="Restart environment"
          >
            {restarting ? <Spinner size={15} /> : <Icon name="restart" size={17} strokeWidth={2} />}
          </button>
          <button type="button" className={styles.iconButton} onClick={onRunTests} title="Run sample tests">
            <Icon name="play" size={17} strokeWidth={2} style={{ fill: 'currentColor' }} />
          </button>
          <button type="button" className={styles.submit} onClick={onSubmit} disabled={submitting}>
            {submitting ? <Spinner size={15} /> : <Icon name="upload" size={18} strokeWidth={2} />}
            {submitting ? 'Judging' : 'Submit'}
          </button>
        </div>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={`${styles.toggle} ${showPanel ? styles.toggleOn : ''}`}
          onClick={onTogglePanel}
          aria-pressed={showPanel}
          title={`${showPanel ? 'Hide' : 'Show'} terminal panel (Ctrl+\`)`}
        >
          <Icon name="panelBottom" size={18} />
        </button>
        <button
          type="button"
          className={`${styles.toggle} ${showPreview ? styles.toggleOn : ''}`}
          onClick={onTogglePreview}
          aria-pressed={showPreview}
          title={`${showPreview ? 'Hide' : 'Show'} preview`}
        >
          <Icon name="panelRight" size={18} />
        </button>
        <span className={styles.divider} />
        <span className={`${styles.status} ${restarting ? styles.restarting : ''}`} title={containerName}>
          <span className={styles.dot} />
          {sessionStatus === 'running' ? 'Environment running' : 'Restarting…'}
        </span>
        <UserMenu />
      </div>
    </header>
  );
}
