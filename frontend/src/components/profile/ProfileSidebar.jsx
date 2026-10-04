import { Avatar } from '@/components/auth/UserMenu';
import Icon from '@/components/ui/Icon';
import { formatDate } from '@/lib/time';
import styles from './Profile.module.css';

const FRAMEWORK_LABELS = { express: 'Express.js', django: 'Django', spring: 'Spring Boot' };

export default function ProfileSidebar({ profile, onEdit }) {
  const { user, stats, frameworks } = profile;

  return (
    <aside className={`${styles.card} ${styles.sidebar}`}>
      <div className={styles.identity}>
        <div className={styles.avatarBox}>
          <Avatar user={user} size={80} />
        </div>
        <div className={styles.names}>
          <span className={styles.name}>{user.name}</span>
          <span className={styles.username}>{user.username}</span>
          <span className={styles.rank}>
            Rank <strong>{stats.rank.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {user.isMe && (
        <button type="button" className={styles.editButton} onClick={onEdit}>
          Edit Profile
        </button>
      )}

      <div className={styles.divider} />

      <h3 className={styles.sectionTitle}>Stats</h3>
      <ul className={styles.statList}>
        <li>
          <Icon name="trophy" size={18} className={styles.statIconGold} />
          <span>Score</span>
          <strong>{stats.score}</strong>
        </li>
        <li>
          <Icon name="circleCheck" size={18} className={styles.statIconGreen} />
          <span>Solved</span>
          <strong>{stats.solved}</strong>
        </li>
        <li>
          <Icon name="user" size={18} className={styles.statIconBlue} />
          <span>Member since</span>
          <strong>{formatDate(user.memberSince)}</strong>
        </li>
      </ul>

      <div className={styles.divider} />

      <h3 className={styles.sectionTitle}>Frameworks</h3>
      <ul className={styles.frameworkList}>
        {frameworks.map((f) => (
          <li key={f.framework}>
            <span className={styles.pill}>{FRAMEWORK_LABELS[f.framework] || f.framework}</span>
            <span className={styles.frameworkCount}>
              <strong>{f.solved}</strong> problem{f.solved === 1 ? '' : 's'} solved
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
