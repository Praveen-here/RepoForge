import { Suspense } from 'react';
import MagicLinkVerifier from '@/components/auth/MagicLinkVerifier';
import styles from '@/components/auth/AuthCard.module.css';

export const metadata = { title: 'Signing in · RepoForge' };

export default function MagicLinkPage() {
  return (
    <main className={styles.page}>
      <Suspense>
        <MagicLinkVerifier />
      </Suspense>
    </main>
  );
}
