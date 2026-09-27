'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Loads the problem and starts (or reuses) its container session.
 * phase: "loading" | "ready" | "error"
 */
export function useWorkspaceSession(problemId) {
  const [phase, setPhase] = useState('loading');
  const [problem, setProblem] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [restarting, setRestarting] = useState(false);
  const startedFor = useRef(null);

  const start = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const [{ problem }, { session }] = await Promise.all([
        api.getProblem(problemId),
        api.startSession(problemId),
      ]);
      setProblem(problem);
      setSession(session);
      setPhase('ready');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  }, [problemId]);

  useEffect(() => {
    // Guard against React Strict Mode running this effect twice in development.
    if (startedFor.current === problemId) return;
    startedFor.current = problemId;
    start();
  }, [problemId, start]);

  const restart = useCallback(async () => {
    if (!session) return null;
    setRestarting(true);
    try {
      const { session: updated } = await api.restartSession(session.id);
      setSession(updated);
      return updated;
    } finally {
      setRestarting(false);
    }
  }, [session]);

  return { phase, problem, session, error, retry: start, restart, restarting };
}
