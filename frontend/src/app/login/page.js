import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import styles from '@/components/auth/AuthCard.module.css';

export const metadata = { title: 'Sign in · RepoForge' };

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
