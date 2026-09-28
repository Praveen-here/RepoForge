'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import PanelHeader from '@/components/ui/PanelHeader';
import Spinner from '@/components/ui/Spinner';
import styles from './PreviewPane.module.css';

const HEADER_TABS = [{ id: 'preview', label: 'Preview', icon: 'globe', iconColor: 'var(--icon-blue)' }];

/**
 * A mini browser showing the app running inside the session container.
 * reloadSignal: bump this number to reload the page (e.g. after a save).
 */
export default function PreviewPane({ baseUrl, reloadSignal, busy, onClose }) {
  const [path, setPath] = useState('/');
  const [address, setAddress] = useState('/');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (reloadSignal) setNonce((n) => n + 1);
  }, [reloadSignal]);

  const navigate = (event) => {
    event.preventDefault();
    const next = address.startsWith('/') ? address : `/${address}`;
    setAddress(next);
    setPath(next);
    setNonce((n) => n + 1);
  };

  const host = baseUrl?.replace(/^https?:\/\//, '');
  const src = baseUrl ? `${baseUrl}${path}` : null;

  return (
    <div className={styles.pane}>
      <PanelHeader tabs={HEADER_TABS}>
        <Button
          variant="ghost"
          size="sm"
          icon="external"
          onClick={() => src && window.open(src, '_blank', 'noopener')}
          title="Open in a new tab"
        />
        <Button variant="ghost" size="sm" icon="x" onClick={onClose} title="Hide preview" />
      </PanelHeader>

      <div className={styles.toolbar}>
        <Button variant="ghost" size="sm" icon="refresh" onClick={() => setNonce((n) => n + 1)} title="Reload" />
        <form className={styles.address} onSubmit={navigate}>
          <Icon name="lock" size={12} className={styles.addressIcon} />
          <span className={styles.host}>{host}</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            spellCheck={false}
            aria-label="Preview path"
          />
        </form>
      </div>

      <div className={styles.viewport}>
        {src && (
          <iframe
            key={`${src}#${nonce}`}
            src={src}
            title="App preview"
            className={styles.frame}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals allow-popups"
          />
        )}
        {busy && (
          <div className={styles.overlay}>
            <Spinner size={20} color="var(--text-muted)" />
            <span>Restarting app…</span>
          </div>
        )}
      </div>
    </div>
  );
}
