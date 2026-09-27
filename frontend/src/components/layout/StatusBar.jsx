import Icon from '@/components/ui/Icon';
import { languageLabel } from '@/lib/files';
import styles from './StatusBar.module.css';

export default function StatusBar({ session, problem, activeFile, saveState }) {
  return (
    <footer className={styles.bar}>
      <div className={styles.group}>
        <span className={styles.env}>
          <Icon name="box" size={12} />
          {session?.containerName || 'No container'}
        </span>
        {session && (
          <span className={styles.item}>
            <Icon name="globe" size={12} />
            {session.previewUrl.replace('http://', '')}
          </span>
        )}
      </div>

      <div className={styles.group}>
        {saveState && <span className={styles.item}>{saveState}</span>}
        {activeFile && (
          <>
            <span className={styles.item}>{activeFile.editable ? 'Editable' : 'Read-only'}</span>
            <span className={styles.item}>{languageLabel(activeFile.path)}</span>
          </>
        )}
        <span className={styles.item}>UTF-8</span>
        {problem && <span className={styles.item}>{problem.framework}</span>}
      </div>
    </footer>
  );
}
