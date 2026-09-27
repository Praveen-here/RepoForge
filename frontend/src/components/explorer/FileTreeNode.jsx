import FileIcon from '@/components/ui/FileIcon';
import Icon from '@/components/ui/Icon';
import styles from './FileExplorer.module.css';

const INDENT = 12;

export default function FileTreeNode({ node, depth, expanded, activePath, dirtyPaths, onToggle, onOpen }) {
  const isDirectory = node.type === 'directory';
  const isOpen = isDirectory && expanded.has(node.path);
  const isActive = node.path === activePath;

  const handleClick = () => (isDirectory ? onToggle(node.path) : onOpen(node.path));

  return (
    <>
      <div
        role="treeitem"
        aria-expanded={isDirectory ? isOpen : undefined}
        aria-selected={isActive}
        className={`${styles.row} ${isActive ? styles.active : ''}`}
        style={{ paddingLeft: 10 + depth * INDENT }}
        onClick={handleClick}
        title={node.path}
      >
        {isDirectory ? (
          <>
            <Icon name="chevronRight" size={13} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            <Icon name="folder" size={15} className={`${styles.folder} ${node.editable ? styles.folderEditable : ''}`} />
          </>
        ) : (
          <>
            <span className={styles.chevronSpacer} />
            <FileIcon path={node.path} />
          </>
        )}

        <span className={styles.name}>{node.name}</span>

        {!isDirectory && dirtyPaths.has(node.path) && <span className={styles.dirty} title="Unsaved changes" />}
        {!isDirectory && !node.editable && <Icon name="lock" size={12} className={styles.lock} />}
      </div>

      {isOpen &&
        node.children.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            activePath={activePath}
            dirtyPaths={dirtyPaths}
            onToggle={onToggle}
            onOpen={onOpen}
          />
        ))}
    </>
  );
}
