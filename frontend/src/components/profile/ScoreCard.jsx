import { formatDate } from '@/lib/time';
import styles from './Profile.module.css';

const WIDTH = 460;
const HEIGHT = 120;
const PAD = 8;

/** Cumulative score over time, as a small line chart (like LeetCode's contest rating chart). */
function ScoreChart({ history }) {
  if (history.length === 0) {
    return <p className={styles.chartEmpty}>Solve a problem to start your score history.</p>;
  }

  // Start from zero just before the first solve so even one point draws a line.
  const points = [{ date: history[0].date, score: 0 }, ...history];
  const times = points.map((p) => new Date(p.date).getTime());
  const minT = times[0];
  const spanT = Math.max(times[times.length - 1] - minT, 1);
  const maxScore = Math.max(...points.map((p) => p.score), 1);

  const x = (i) => (points.length === 1 ? WIDTH / 2 : PAD + ((times[i] - minT) / spanT) * (WIDTH - PAD * 2));
  const y = (score) => HEIGHT - PAD - (score / maxScore) * (HEIGHT - PAD * 2);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
  const last = points.length - 1;

  return (
    <div className={styles.chart}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className={styles.chartSvg} aria-hidden="true">
        <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <circle cx={x(last)} cy={y(points[last].score)} r="4" fill="#fff" />
      </svg>
      <div className={styles.chartAxis}>
        <span>{formatDate(history[0].date)}</span>
        <span>{formatDate(history[history.length - 1].date)}</span>
      </div>
    </div>
  );
}

export default function ScoreCard({ stats, history }) {
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
        <ScoreChart history={history} />
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
