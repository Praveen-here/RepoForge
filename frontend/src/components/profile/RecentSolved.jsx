import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { timeAgo } from '@/lib/time';
import styles from './Profile.module.css';

export default function RecentSolved({ items }) {
  return (
    <section className={`${styles.card} ${styles.recentCard}`}>
      <div className={styles.recentHeader}>
        <span className={styles.recentTab}>
          <Icon name="circleCheck" size={16} strokeWidth={2} />
          Recent AC
        </span>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>No accepted submissions yet.</p>
      ) : (
        <ul className={styles.recentList}>
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/problems/${item.id}`} className={styles.recentRow}>
                <span className={styles.recentTitle}>
                  {item.number}. {item.title}
                </span>
                <span className={styles.recentWhen}>{timeAgo(item.solvedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
