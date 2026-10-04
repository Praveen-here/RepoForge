import Icon from '@/components/ui/Icon';
import { formatDate } from '@/lib/time';
import styles from './Profile.module.css';

const LOOKS = {
  'first-fix': { colors: ['#4ade80', '#15803d'], icon: 'check' },
  'hard-hitter': { colors: ['#f87171', '#b91c1c'], icon: 'alert' },
  sharpshooter: { colors: ['#60a5fa', '#1d4ed8'], icon: 'checkSquare' },
  polyglot: { colors: ['#c084fc', '#7e22ce'], icon: 'code' },
  'streak-7': { colors: ['#fbbf24', '#c2410c'], icon: 'clock' },
};

function Badge({ badge }) {
  const look = LOOKS[badge.id] || LOOKS['first-fix'];
  const gradientId = `badge-${badge.id}`;
  return (
    <div className={`${styles.badge} ${badge.earned ? '' : styles.badgeLocked}`} title={`${badge.name}: ${badge.description}`}>
      <svg width="64" height="70" viewBox="0 0 64 70" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={look.colors[0]} />
            <stop offset="100%" stopColor={look.colors[1]} />
          </linearGradient>
        </defs>
        <path d="M32 2 L60 18 L60 52 L32 68 L4 52 L4 18 Z" fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        <path d="M32 10 L53 22 L53 48 L32 60 L11 48 L11 22 Z" fill="rgba(0,0,0,0.18)" />
      </svg>
      <Icon name={look.icon} size={22} strokeWidth={2.4} className={styles.badgeIcon} />
    </div>
  );
}

export default function BadgesCard({ badges }) {
  const earned = badges.filter((b) => b.earned);
  const recent = [...earned].filter((b) => b.earnedAt !== 'earned').sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))[0] || earned[0];

  return (
    <section className={`${styles.card} ${styles.badgesCard}`}>
      <span className={styles.label}>Badges</span>
      <span className={styles.bigNumber}>{earned.length}</span>

      <div className={styles.badgeRow}>
        {badges.map((badge) => (
          <Badge key={badge.id} badge={badge} />
        ))}
      </div>

      {recent ? (
        <>
          <span className={styles.label}>Most Recent Badge</span>
          <span className={styles.badgeName}>
            {recent.name}
            {recent.earnedAt !== 'earned' && <span> · {formatDate(recent.earnedAt)}</span>}
          </span>
        </>
      ) : (
        <span className={styles.label}>Solve your first problem to earn a badge.</span>
      )}
    </section>
  );
}
