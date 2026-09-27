'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { initialExpanded } from '@/lib/files';
import FileTreeNode from './FileTreeNode';
import styles from './FileExplorer.module.css';

export default function FileExplorer({ title, tree, loading, error, editableDirs, activePath, dirtyPaths, onOpen, onRefresh }) {
  const [expanded, setExpanded] = useState(null);

  // Expand the top-level folders and the editable folders the first time the tree arrives.
  useEffect(() => {
    if (expanded === null && tree.length > 0) setExpanded(initialExpanded(tree, editableDirs));
  }, [tree, editableDirs, expanded]);

  const toggle = (path) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className={styles.explorer}>
      <div className={styles.header}>
        <span className={styles.label}>Explorer</span>
        <Button variant="ghost" size="sm" icon="refresh" onClick={onRefresh} title="Refresh files" />
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>{title}</span>
        {loading && <Spinner size={12} color="var(--text-faint)" />}
      </div>

      <div className={styles.tree} role="tree">
        {error && <p className={styles.error}>{error}</p>}
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            depth={0}
            expanded={expanded || new Set()}
            activePath={activePath}
            dirtyPaths={dirtyPaths}
            onToggle={toggle}
            onOpen={onOpen}
          />
        ))}
      </div>

      <div className={styles.legend}>
        Files marked with a lock are read-only. You can edit <code>{editableDirs.join(', ')}</code>.
      </div>
    </div>
  );
}
