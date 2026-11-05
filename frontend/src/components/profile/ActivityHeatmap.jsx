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

/** The past 365 days, ending today (UTC days), grouped into calendar months. */
function buildMonths(counts) {
  const today = Math.floor(Date.now() / DAY_MS);
  const months = [];

  for (let n = today - 364; n <= today; n += 1) {
    const date = new Date(n * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    const monthKey = key.slice(0, 7);

    let month = months[months.length - 1];
    if (month?.key !== monthKey) {
      month = { key: monthKey, label: MONTHS[date.getUTCMonth()], days: [] };
      months.push(month);
    }
    month.days.push({ key, date, count: counts.get(key) || 0 });
  }
  return months;
}

export default function ActivityHeatmap({ calendar }) {
  const counts = new Map(calendar.days.map((d) => [d.day, d.count]));
  const months = buildMonths(counts);

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
          {months.map((month) => (
            <div key={month.key} className={styles.monthBlock}>
              <div className={styles.monthGrid}>
                {month.days.map((d) => (
                  <span
                    key={d.key}
                    className={`${styles.cell} ${styles[`level${level(d.count)}`]}`}
                    // Row 1 is Sunday, so each day sits on its weekday and a month's first
                    // and last columns can be partly empty.
                    style={{ gridRow: d.date.getUTCDay() + 1 }}
                    title={`${d.count} submission${d.count === 1 ? '' : 's'} on ${d.date.toLocaleDateString(undefined, {
                      timeZone: 'UTC',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`}
                  />
                ))}
              </div>
              <span className={styles.monthLabel}>{month.label}</span>
            </div>
          ))}
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
