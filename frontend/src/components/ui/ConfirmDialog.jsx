'use client';

import { useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

/** A small themed "are you sure?" dialog. Escape or clicking the backdrop cancels. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.backdrop} onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" ref={cancelRef} className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`${styles.confirm} ${danger ? styles.danger : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
