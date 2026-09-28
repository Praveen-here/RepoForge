'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import styles from './ProblemList.module.css';

const FRAMEWORK_LABELS = { express: 'Express.js', django: 'Django', spring: 'Spring Boot' };
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function StatusIcon({ status }) {
  if (status === 'solved') {
    return <Icon name="circleCheck" size={18} className={styles.solved} strokeWidth={2} />;
  }
  if (status === 'attempted') {
    return <Icon name="circleDashed" size={18} className={styles.attempted} strokeWidth={2} />;
  }
  return <span className={styles.todo} />;
}

export default function ProblemList() {
  const [problems, setProblems] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [framework, setFramework] = useState('');

  useEffect(() => {
    api
      .listProblems()
      .then(({ problems }) => setProblems(problems))
      .catch((err) => setError(err.message));
  }, []);

  const frameworks = useMemo(() => [...new Set((problems || []).map((p) => p.framework))], [problems]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (problems || []).filter(
      (p) =>
        (!query || `${p.number}. ${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(query)) &&
        (!difficulty || p.difficulty === difficulty) &&
        (!framework || p.framework === framework),
    );
  }, [problems, search, difficulty, framework]);

  const solved = (problems || []).filter((p) => p.status === 'solved').length;
  const total = problems?.length || 0;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1>Problems</h1>
          <p>Real codebases with real bugs. Open one, find the bug, fix it and submit.</p>
        </div>
        <div className={styles.progress}>
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="var(--success)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${total ? (solved / total) * 113.1 : 0} 113.1`}
              transform="rotate(-90 22 22)"
            />
          </svg>
          <span>
            <strong>{solved}</strong>/{total} Solved
          </span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Icon name="search" size={16} />
          <input
            placeholder="Search questions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search questions"
          />
        </label>
        <select
          className={styles.select}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          aria-label="Difficulty"
        >
          <option value="">Difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          aria-label="Framework"
        >
          <option value="">Framework</option>
          {frameworks.map((f) => (
            <option key={f} value={f}>
              {FRAMEWORK_LABELS[f] || f}
            </option>
          ))}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!problems && !error && (
        <div className={styles.loading}>
          <Spinner size={22} color="var(--text-muted)" />
        </div>
      )}

      {problems && (
        <div className={styles.table} role="table">
          <div className={`${styles.row} ${styles.head}`} role="row">
            <span role="columnheader">Status</span>
            <span role="columnheader">Title</span>
            <span role="columnheader">Framework</span>
            <span role="columnheader">Difficulty</span>
          </div>

          {visible.map((problem) => (
            <Link key={problem.id} href={`/problems/${problem.id}`} className={styles.row} role="row">
              <span className={styles.status} title={problem.status}>
                <StatusIcon status={problem.status} />
              </span>
              <span className={styles.title}>
                {problem.number}. {problem.title}
                <span className={styles.tags}>{problem.tags.join(' · ')}</span>
              </span>
              <span className={styles.framework}>{FRAMEWORK_LABELS[problem.framework] || problem.framework}</span>
              <span className={styles[`difficulty${problem.difficulty}`]}>{problem.difficulty}</span>
            </Link>
          ))}

          {visible.length === 0 && <p className={styles.empty}>No problems match your filters.</p>}
        </div>
      )}
    </div>
  );
}
