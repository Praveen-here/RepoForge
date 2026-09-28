'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';
import { api, oauthStartUrl } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { GitHubIcon, GoogleIcon } from './BrandIcons';
import styles from './AuthCard.module.css';

const ERROR_MESSAGES = {
  oauth_cancelled: 'Sign-in was cancelled. Choose a method to try again.',
  oauth_state: 'That sign-in attempt expired or was interrupted. Please try again.',
  oauth_failed: 'We could not sign you in with that account. Please try again.',
  email_unverified: 'That account has no verified email address. Try another method.',
};

/** Only accept paths on this site as the "after sign-in" destination. */
function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/problems';
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const next = safeNext(searchParams.get('next'));

  const [providers, setProviders] = useState({ google: false, github: false, email: true });
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [error, setError] = useState(ERROR_MESSAGES[searchParams.get('error')] || null);

  // Already signed in? Go straight on.
  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, router, next]);

  useEffect(() => {
    api
      .getProviders()
      .then(({ providers }) => setProviders(providers))
      .catch(() => {});
  }, []);

  const sendLink = async (event) => {
    event?.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.requestMagicLink(email, next);
      setSentTo(email.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <Icon name="mail" size={26} />
        </div>
        <h1 className={styles.title}>Check your inbox</h1>
        <p className={styles.subtitle}>
          We sent a sign-in link to <strong>{sentTo}</strong>. It expires in 1 hour and works once.
        </p>
        <p className={styles.note}>Can&apos;t find it? Check your spam or junk folder.</p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.row}>
          <button type="button" className={styles.linkButton} onClick={() => setSentTo(null)}>
            Use a different email
          </button>
          <button type="button" className={styles.linkButton} onClick={sendLink} disabled={sending}>
            {sending ? 'Sending…' : 'Resend link'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <Logo size={40} />
      <h1 className={styles.title}>Sign in to RepoForge</h1>
      <p className={styles.subtitle}>Fix real bugs in real codebases.</p>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.providers}>
        {providers.google && (
          <a className={`${styles.provider} ${styles.google}`} href={oauthStartUrl('google', next)}>
            <GoogleIcon />
            Continue with Google
          </a>
        )}
        {providers.github && (
          <a className={`${styles.provider} ${styles.github}`} href={oauthStartUrl('github', next)}>
            <GitHubIcon />
            Continue with GitHub
          </a>
        )}
      </div>

      {(providers.google || providers.github) && (
        <div className={styles.divider}>
          <span>or</span>
        </div>
      )}

      <form className={styles.form} onSubmit={sendLink}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={styles.input}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <button type="submit" className={styles.submit} disabled={sending || !email.trim()}>
          {sending ? <Spinner size={16} color="#1a1a1a" /> : <Icon name="mail" size={16} strokeWidth={2} />}
          {sending ? 'Sending link…' : 'Email me a sign-in link'}
        </button>
      </form>

      <p className={styles.note}>No password needed. We&apos;ll email you a link that signs you in.</p>
    </div>
  );
}
