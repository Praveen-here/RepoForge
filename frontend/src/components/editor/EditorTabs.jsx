import FileIcon from '@/components/ui/FileIcon';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import { fileName } from '@/lib/files';
import styles from './EditorPane.module.css';

/** Open-file tabs, shown in the Code panel's toolbar row. */
export default function EditorTabs({ files, activePath, savingPath, onSelect, onClose }) {
  return (
    <div className={styles.toolbar} role="tablist">
      {files.length === 0 && <span className={styles.toolbarHint}>No file open</span>}

      {files.map((file) => {
        const isActive = file.path === activePath;
        const isDirty = file.content !== file.savedContent;

        return (
          <div
            key={file.path}
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onSelect(file.path)}
            onMouseDown={(e) => e.button === 1 && onClose(file.path)}
            title={file.path}
          >
            <FileIcon path={file.path} size={15} />
            <span className={styles.tabName}>{fileName(file.path)}</span>
            {!file.editable && file.status === 'ready' && <Icon name="lock" size={11} className={styles.tabLock} />}

            <span className={styles.tabAction}>
              {savingPath === file.path ? (
                <Spinner size={11} />
              ) : (
                <>
                  {isDirty && <span className={styles.tabDirty} />}
                  <button
                    type="button"
                    className={`${styles.tabClose} ${isDirty ? styles.tabCloseDirty : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(file.path);
                    }}
                    aria-label={`Close ${fileName(file.path)}`}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
