'use client';

import { useEffect, useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import dialog from '@/components/ui/ConfirmDialog.module.css';
import styles from './Profile.module.css';

export default function EditProfileDialog({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { user: updated } = await api.updateMe({ name, username });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className={dialog.backdrop} onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className={dialog.dialog} role="dialog" aria-modal="true" aria-labelledby="edit-title" onSubmit={save}>
        <h2 id="edit-title" className={dialog.title}>
          Edit Profile
        </h2>

        <label className={styles.field}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required autoFocus />
        </label>
        <label className={styles.field}>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            maxLength={20}
            pattern="[a-z0-9][a-z0-9_\-]{2,19}"
            title="3-20 characters: lowercase letters, numbers, - or _"
            required
          />
          <span className={styles.fieldHint}>Your profile link: /u/{username || '…'}</span>
        </label>

        {error && <p className={styles.formError}>{error}</p>}

        <div className={dialog.actions}>
          <button type="button" className={dialog.cancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={dialog.confirm} disabled={saving}>
            {saving ? <Spinner size={14} color="#1a1a1a" /> : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
