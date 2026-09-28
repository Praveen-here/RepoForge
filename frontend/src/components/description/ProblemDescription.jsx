'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { markdownToHtml } from '@/lib/markdown';
import styles from './ProblemDescription.module.css';

const FRAMEWORK_LABELS = { express: 'Express.js', django: 'Django', spring: 'Spring Boot' };

/** The problem statement (the problem's README), laid out like a LeetCode description. */
export default function ProblemDescription({ sessionId, problem }) {
  const [readme, setReadme] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .readFile(sessionId, problem.readme)
      .then(({ file }) => setReadme(file.content))
      .catch((err) => setError(err.message));
  }, [sessionId, problem.readme]);

  const html = useMemo(() => (readme ? markdownToHtml(readme, { skipTitle: true }) : ''), [readme]);
  const { number } = problem;

  return (
    <div className={styles.description}>
      <h1 className={styles.title}>
        {number != null && `${number}. `}
        {problem.title}
      </h1>

      <div className={styles.pills}>
        <span className={`${styles.pill} ${styles[`difficulty${problem.difficulty}`]}`}>{problem.difficulty}</span>
        <span className={styles.pill}>
          <Icon name="code" size={13} strokeWidth={2} />
          {FRAMEWORK_LABELS[problem.framework] || problem.framework}
        </span>
        {problem.tags?.map((tag) => (
          <span key={tag} className={styles.pill}>
            <Icon name="tag" size={12} strokeWidth={2} />
            {tag}
          </span>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {!readme && !error && (
        <div className={styles.loading}>
          <Spinner size={18} color="var(--text-muted)" />
        </div>
      )}
      {readme && <div className={styles.content} dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}
