'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import { usePersistentState } from '@/hooks/usePersistentState';
import { api } from '@/lib/api';
import { activeRows, createFilters, matchesFilters } from '@/lib/problemFilters';
import FilterPanel from './FilterPanel';
import styles from './ProblemList.module.css';

const FRAMEWORK_LABELS = { express: 'Express.js', django: 'Django', spring: 'Spring Boot' };
const DIFFICULTY_OPTIONS = [
  { value: 'Easy', label: 'Easy', color: 'var(--easy)' },
  { value: 'Medium', label: 'Medium', color: 'var(--medium)' },
  { value: 'Hard', label: 'Hard', color: 'var(--hard)' },
];

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
  // Remembered for this tab, so they are still applied after opening a problem and coming back.
  const [search, setSearch] = usePersistentState('repo-forge.problemSearch', '', { storage: 'session' });
  const [filters, setFilters] = usePersistentState('repo-forge.problemFilters', createFilters, { storage: 'session' });

  const filtersActive = Boolean(search.trim() || activeRows(filters).length);
  const resetAll = () => {
    setSearch('');
    setFilters(createFilters());
  };

  useEffect(() => {
    api
      .listProblems()
      .then(({ problems }) => setProblems(problems))
      .catch((err) => setError(err.message));
  }, []);

  const filterFields = useMemo(() => {
    const frameworks = [...new Set((problems || []).map((p) => p.framework))];
    return {
      difficulty: { label: 'Difficulty', icon: 'gauge', options: DIFFICULTY_OPTIONS },
      framework: {
        label: 'Framework',
        icon: 'code',
        options: frameworks.map((f) => ({ value: f, label: FRAMEWORK_LABELS[f] || f })),
      },
    };
  }, [problems]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (problems || []).filter(
      (p) =>
        (!query || `${p.number}. ${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(query)) &&
        matchesFilters(p, filters),
    );
  }, [problems, search, filters]);

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
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(createFilters())}
          fields={filterFields}
        />
        {filtersActive && (
          <button type="button" className={styles.reset} onClick={resetAll}>
            <Icon name="x" size={14} strokeWidth={2} />
            Reset
          </button>
        )}
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
