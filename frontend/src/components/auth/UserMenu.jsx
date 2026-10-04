'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useAuth } from './AuthProvider';
import styles from './UserMenu.module.css';

export function Avatar({ user, size = 32 }) {
  const [broken, setBroken] = useState(false);
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  if (user.avatarUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        className={styles.avatar}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className={styles.initial} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
}

/** Avatar button with a dropdown: name, email, Problems, Sign out. */
export default function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.replace('/login');
  };

  return (
    <div className={styles.menu} ref={menuRef}>
      <button type="button" className={styles.trigger} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Avatar user={user} size={30} />
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.profile}>
            <Avatar user={user} size={40} />
            <div className={styles.identity}>
              <span className={styles.name}>{user.name}</span>
              <span className={styles.email}>{user.email}</span>
            </div>
          </div>
          <Link href={`/u/${user.username}`} className={styles.item} onClick={() => setOpen(false)} role="menuitem">
            <Icon name="user" size={16} />
            My Profile
          </Link>
          <Link href="/problems" className={styles.item} onClick={() => setOpen(false)} role="menuitem">
            <Icon name="list" size={16} />
            Problems
          </Link>
          <button type="button" className={styles.item} onClick={handleLogout} role="menuitem">
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
