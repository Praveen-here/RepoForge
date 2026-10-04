import styles from './Profile.module.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function level(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/** One column per week (Sun..Sat) for the past year, ending today (UTC days). */
function buildWeeks(counts) {
  const today = Math.floor(Date.now() / DAY_MS);
  let start = today - 364;
  start -= new Date(start * DAY_MS).getUTCDay(); // back to Sunday

  const weeks = [];
  for (let day = start; day <= today; day += 7) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const n = day + i;
      if (n > today) break;
      const date = new Date(n * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      week.push({ key, date, count: counts.get(key) || 0 });
    }
    weeks.push(week);
  }
  return weeks;
}

export default function ActivityHeatmap({ calendar }) {
  const counts = new Map(calendar.days.map((d) => [d.day, d.count]));
  const weeks = buildWeeks(counts);

  return (
    <section className={`${styles.card} ${styles.heatmapCard}`}>
      <div className={styles.heatmapHeader}>
        <h3>
          <strong>{calendar.totalSubmissions.toLocaleString()}</strong> submission
          {calendar.totalSubmissions === 1 ? '' : 's'} in the past one year
        </h3>
        <div className={styles.heatmapStats}>
          <span>
            Total active days: <strong>{calendar.activeDays}</strong>
          </span>
          <span>
            Max streak: <strong>{calendar.maxStreak}</strong>
          </span>
          <span>
            Current streak: <strong>{calendar.currentStreak}</strong>
          </span>
        </div>
      </div>

      <div className={styles.heatmapScroll}>
        <div className={styles.heatmap}>
          {weeks.map((week, i) => {
            const firstOfMonth = week.find((d) => d.date.getUTCDate() === 1);
            return (
              <div key={week[0].key} className={styles.week}>
                <span className={styles.month}>
                  {firstOfMonth || i === 0 ? MONTHS[(firstOfMonth || week[0]).date.getUTCMonth()] : ''}
                </span>
                {week.map((d) => (
                  <span
                    key={d.key}
                    className={`${styles.cell} ${styles[`level${level(d.count)}`]}`}
                    title={`${d.count} submission${d.count === 1 ? '' : 's'} on ${d.date.toLocaleDateString(undefined, {
                      timeZone: 'UTC',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.legend}>
        Less
        {[0, 1, 2, 3, 4].map((n) => (
          <span key={n} className={`${styles.cell} ${styles[`level${n}`]}`} />
        ))}
        More
      </div>
    </section>
  );
}
