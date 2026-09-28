'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { useAuth } from './AuthProvider';
import styles from './AuthCard.module.css';

/**
 * The page opened by the emailed link. It signs in with a POST (not on page load
 * of the API link itself), so email scanners that pre-open links cannot use it up.
 */
export default function MagicLinkVerifier() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the token works only once, so never send it twice
    started.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setError('This sign-in link is incomplete. Request a new one.');
      return;
    }

    api
      .verifyMagicLink(token)
      .then(async ({ next }) => {
        await refresh();
        router.replace(next || '/problems');
      })
      .catch((err) => setError(err.message));
  }, [searchParams, refresh, router]);

  if (error) {
    return (
      <div className={styles.card}>
        <div className={`${styles.iconCircle} ${styles.iconDanger}`}>
          <Icon name="alert" size={26} />
        </div>
        <h1 className={styles.title}>Link not valid</h1>
        <p className={styles.subtitle}>{error}</p>
        <Link href="/login" className={styles.submit}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <Spinner size={28} color="var(--accent)" />
      <h1 className={styles.title}>Signing you in…</h1>
    </div>
  );
}
