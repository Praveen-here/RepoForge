import styles from './Profile.module.css';

export default function ScoreCard({ stats }) {
  const top = stats.totalUsers ? (stats.rank / stats.totalUsers) * 100 : 100;

  return (
    <section className={`${styles.card} ${styles.scoreCard}`}>
      <div className={styles.scoreLeft}>
        <div className={styles.scoreRow}>
          <div>
            <span className={styles.label}>Score</span>
            <span className={styles.bigNumber}>{stats.score.toLocaleString()}</span>
          </div>
          <div>
            <span className={styles.label}>Global Ranking</span>
            <span className={styles.ranking}>
              {stats.rank.toLocaleString()}
              <span>/{stats.totalUsers.toLocaleString()}</span>
            </span>
          </div>
          <div>
            <span className={styles.label}>Solved</span>
            <span className={styles.ranking}>{stats.solved}</span>
          </div>
        </div>
      </div>

      <div className={styles.scoreRight}>
        <span className={styles.label}>Top</span>
        <span className={styles.bigNumber}>{top.toFixed(top < 10 ? 2 : 1)}%</span>
        <p className={styles.scoreHint}>
          Easy 10 · Medium 20 · Hard 40 points.
          <br />
          +20% when solved on the first try.
        </p>
      </div>
    </section>
  );
}
