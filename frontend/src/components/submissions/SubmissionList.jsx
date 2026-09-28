'use client';

import { useEffect, useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import styles from './SubmissionList.module.css';

const STATUS_LABELS = {
  accepted: 'Accepted',
  failed: 'Wrong Answer',
  error: 'Runtime Error',
  timeout: 'Time Limit Exceeded',
};

function formatWhen(isoDate) {
  const seconds = Math.round((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(isoDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The user's past submissions for one problem. Reloads when refreshKey changes. */
export default function SubmissionList({ problemId, refreshKey }) {
  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listSubmissions(problemId)
      .then(({ submissions }) => setSubmissions(submissions))
      .catch((err) => setError(err.message));
  }, [problemId, refreshKey]);

  if (error) return <p className={styles.message}>{error}</p>;
  if (!submissions) {
    return (
      <div className={styles.message}>
        <Spinner size={18} color="var(--text-muted)" />
      </div>
    );
  }
  if (submissions.length === 0) {
    return <p className={styles.message}>No submissions yet. Fix the bug and click Submit.</p>;
  }

  return (
    <div className={styles.list}>
      <div className={`${styles.row} ${styles.head}`}>
        <span>Status</span>
        <span>Tests</span>
        <span>Runtime</span>
      </div>
      {submissions.map((submission) => (
        <div key={submission.id} className={styles.row}>
          <span className={styles.statusCell}>
            <span className={submission.status === 'accepted' ? styles.accepted : styles.rejected}>
              {STATUS_LABELS[submission.status] || submission.status}
            </span>
            <span className={styles.when}>{formatWhen(submission.createdAt)}</span>
          </span>
          <span className={styles.muted}>
            {submission.passed} / {submission.total}
          </span>
          <span className={styles.muted}>{(submission.durationMs / 1000).toFixed(2)} s</span>
        </div>
      ))}
    </div>
  );
}
