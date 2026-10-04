'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, SESSION_LOST_EVENT } from '@/lib/api';

const HEARTBEAT_MS = 60_000;
const ACTIVITY_EVENTS = ['keydown', 'pointerdown', 'wheel'];

/**
 * Loads the problem and starts (or reuses) its container session.
 * phase: "loading" | "ready" | "lost" | "error"
 *   lost = the container was stopped (idle cleanup or too many open problems); the
 *          user's files are still saved, so restarting brings everything back.
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

  // A request for the CURRENT session that finds the container gone switches to the
  // "lost" screen (late replies for an older session, e.g. after a reset, are ignored).
  const sessionIdRef = useRef(null);
  sessionIdRef.current = session?.id ?? null;
  useEffect(() => {
    const onLost = (event) => {
      if (!sessionIdRef.current || !event.detail.path.includes(sessionIdRef.current)) return;
      setPhase((current) => (current === 'ready' ? 'lost' : current));
    };
    window.addEventListener(SESSION_LOST_EVENT, onLost);
    return () => window.removeEventListener(SESSION_LOST_EVENT, onLost);
  }, []);

  // Heartbeat: once a minute, if the user typed, clicked or scrolled since the last one
  // and the tab is visible, tell the server they are still working.
  useEffect(() => {
    if (phase !== 'ready' || !session) return undefined;
    let active = false;
    const markActive = () => {
      active = true;
    };
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, markActive, { passive: true }));

    const timer = setInterval(() => {
      if (!active || document.visibilityState !== 'visible') return;
      active = false;
      api.heartbeat(session.id).catch(() => {});
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, markActive));
    };
  }, [phase, session]);

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

  /** Deletes the user's changes and starts again from the original code. */
  const resetProblem = useCallback(async () => {
    if (!session) return;
    setPhase('loading');
    try {
      const { session: fresh } = await api.resetSession(session.id);
      setSession(fresh);
      setPhase('ready');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  }, [session]);

  return { phase, problem, session, error, retry: start, restart, restarting, resetProblem };
}
