'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import { markdownToHtml } from '@/lib/markdown';
import styles from './CoachPanel.module.css';

const QUICK_ACTIONS = [
  { action: 'explain', label: 'Explain the problem' },
  { action: 'start', label: 'Where do I start?' },
  { action: 'failing', label: 'Check my test results' },
];

function CoachMessage({ message }) {
  const html = useMemo(() => markdownToHtml(message.content), [message.content]);

  if (message.role === 'user') {
    return <div className={`${styles.message} ${styles.user}`}>{message.content}</div>;
  }
  return (
    <div className={`${styles.message} ${styles.coach}`}>
      {message.hintLevel && <span className={styles.hintBadge}>Hint {message.hintLevel}</span>}
      {/* markdownToHtml escapes all text first, so this is safe to render. */}
      <div className={styles.markdown} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

/**
 * The AI debugging coach: a chat that guides the user without giving the answer.
 * beforeAsk saves open files first, so the coach sees the code as it is on screen.
 */
export default function CoachPanel({ sessionId, problemId, activeFile, beforeAsk }) {
  const [state, setState] = useState(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(null); // the question being answered
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .getCoach(problemId)
      .then(setState)
      .catch((err) => setError(err.message));
  }, [problemId]);

  const messageCount = state?.messages.length;
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messageCount, pending]);

  const ask = async (question, label) => {
    if (pending) return;
    setError(null);
    setPending(label);
    try {
      await beforeAsk();
      const answer = await api.askCoach(sessionId, { ...question, activeFile });
      setState((current) => ({
        ...current,
        messages: [...current.messages, ...answer.messages],
        hintLevel: answer.hintLevel,
        remainingToday: answer.remainingToday,
      }));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setPending(null);
    }
  };

  const sendDraft = async () => {
    const message = draft.trim();
    if (!message || pending) return;
    setDraft('');
    const sent = await ask({ message }, message);
    if (!sent) setDraft(message); // keep what they typed so they can try again
  };

  const startNewChat = async () => {
    setError(null);
    try {
      await api.clearCoach(problemId);
      setState((current) => ({ ...current, messages: [], hintLevel: 0 }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (!state) {
    return (
      <div className={styles.center}>
        {error ? <p className={styles.error}>{error}</p> : <Spinner size={18} color="var(--text-muted)" />}
      </div>
    );
  }
  if (!state.enabled) {
    return (
      <div className={styles.center}>
        <p className={styles.muted}>The AI coach isn&apos;t set up on this server yet.</p>
      </div>
    );
  }

  const { hintLevel, maxHintLevel, remainingToday, messages } = state;
  const hintsLeft = hintLevel < maxHintLevel;
  const outOfQuestions = remainingToday <= 0;
  const busy = Boolean(pending) || outOfQuestions;

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <span className={styles.progress}>
          Hints used: <strong>{hintLevel}</strong> / {maxHintLevel}
        </span>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={startNewChat} disabled={Boolean(pending)}>
            New chat
          </Button>
        )}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && !pending && (
          <div className={styles.welcome}>
            <h3>Your debugging coach</h3>
            <p>
              Stuck? I&apos;ll help you find the bug yourself with questions and hints that get more specific each time.
              I won&apos;t give you the answer.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <CoachMessage key={message.id} message={message} />
        ))}
        {pending && (
          <>
            <div className={`${styles.message} ${styles.user}`}>{pending}</div>
            <div className={`${styles.message} ${styles.coach} ${styles.thinking}`}>
              <Spinner size={14} color="var(--text-muted)" />
              Thinking…
            </div>
          </>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className={styles.composer}>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.chip} ${styles.hintChip}`}
            disabled={busy || !hintsLeft}
            onClick={() => ask({ action: 'hint' }, 'Give me a hint.')}
            title={hintsLeft ? 'Each hint is more specific than the last' : 'You have used every hint for this problem'}
          >
            {hintsLeft ? `Give me hint ${hintLevel + 1}` : 'All hints used'}
          </button>
          {QUICK_ACTIONS.map(({ action, label }) => (
            <button
              key={action}
              type="button"
              className={styles.chip}
              disabled={busy}
              onClick={() => ask({ action }, label)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.inputRow}>
          <textarea
            className={styles.input}
            rows={2}
            maxLength={1000}
            value={draft}
            placeholder={outOfQuestions ? "You've reached today's coach limit" : 'Ask about this bug…'}
            aria-label="Ask the coach"
            disabled={outOfQuestions}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendDraft();
              }
            }}
          />
          <Button variant="primary" size="sm" icon="send" title="Send" disabled={busy || !draft.trim()} onClick={sendDraft} />
        </div>

        <p className={styles.notice}>
          AI can make mistakes. Your messages and code are sent to Google Gemini, so don&apos;t share anything private.
          {' '}
          {remainingToday} questions left today.
        </p>
      </div>
    </div>
  );
}
