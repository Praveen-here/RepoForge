import styles from './Profile.module.css';

const LEVELS = [
  { key: 'Easy', label: 'Easy', color: 'var(--easy)' },
  { key: 'Medium', label: 'Med.', color: 'var(--medium)' },
  { key: 'Hard', label: 'Hard', color: 'var(--hard)' },
];

const SIZE = 180;
const R = 76;
const C = 2 * Math.PI * R;
const ARC = C * 0.75; // the gauge is a 270° arc, open at the bottom
const GAP = 6;

/** LeetCode-style gauge: one arc segment per difficulty, filled by the share solved. */
function Gauge({ difficulty }) {
  const total = LEVELS.reduce((sum, l) => sum + difficulty[l.key].total, 0) || 1;
  const usable = ARC - GAP * (LEVELS.length - 1);

  let offset = 0;
  const segments = LEVELS.map((level) => {
    const { solved, total: count } = difficulty[level.key];
    const length = (count / total) * usable;
    const segment = { ...level, start: offset, length, filled: count ? (solved / count) * length : 0 };
    offset += length + GAP;
    return segment;
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <g transform={`rotate(135 ${SIZE / 2} ${SIZE / 2})`}>
        {segments.map((s) => (
          <g key={s.key}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={s.color}
              strokeOpacity="0.2"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(s.length, 0.01)} ${C}`}
              strokeDashoffset={-s.start}
            />
            {s.filled > 0 && (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${s.filled} ${C}`}
                strokeDashoffset={-s.start}
              />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function SolvedCard({ stats }) {
  return (
    <section className={`${styles.card} ${styles.solvedCard}`}>
      <div className={styles.gauge}>
        <Gauge difficulty={stats.difficulty} />
        <div className={styles.gaugeCenter}>
          <span className={styles.gaugeNumber}>
            {stats.solved}
            <span>/{stats.totalProblems}</span>
          </span>
          <span className={styles.gaugeLabel}>
            <span className={styles.tick}>✓</span> Solved
          </span>
        </div>
        <span className={styles.attempting}>{stats.attempting} Attempting</span>
      </div>

      <div className={styles.levels}>
        {LEVELS.map((level) => (
          <div key={level.key} className={styles.level}>
            <span style={{ color: level.color }}>{level.label}</span>
            <strong>
              {stats.difficulty[level.key].solved}/{stats.difficulty[level.key].total}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
