'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import PanelHeader from '@/components/ui/PanelHeader';
import TestResults from '@/components/results/TestResults';
import TerminalView from '@/components/terminal/TerminalView';
import { socketUrl } from '@/lib/api';
import styles from './BottomPanel.module.css';

const VERDICT_DOT = {
  accepted: 'dotSuccess',
  failed: 'dotDanger',
  error: 'dotDanger',
  timeout: 'dotDanger',
};

export default function BottomPanel({ sessionId, activeTab, onTabChange, submission, onTerminalReady, onClose }) {
  const [terminalStatus, setTerminalStatus] = useState('connecting');

  const resultDot =
    submission.status === 'running'
      ? styles.dotPending
      : submission.result && styles[VERDICT_DOT[submission.result.status]];

  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: 'terminal', iconColor: 'var(--icon-green)' },
    { id: 'logs', label: 'App Logs', icon: 'logs', iconColor: 'var(--icon-blue)' },
    {
      id: 'results',
      label: 'Test Result',
      icon: 'checkSquare',
      iconColor: 'var(--icon-green)',
      badge: resultDot && <span className={`${styles.dot} ${resultDot}`} />,
    },
  ];

  return (
    <div className={styles.panel}>
      <PanelHeader tabs={tabs} activeTab={activeTab} onTabChange={onTabChange}>
        {activeTab === 'terminal' && (
          <span className={`${styles.connection} ${styles[terminalStatus]}`}>
            <span className={styles.connectionDot} />
            {terminalStatus}
          </span>
        )}
        <Button variant="ghost" size="sm" icon="x" onClick={onClose} title="Hide panel (Ctrl+`)" />
      </PanelHeader>

      {/* Terminals stay mounted while hidden so their history and connection survive tab switches. */}
      <div className={styles.body}>
        <div className={styles.view} hidden={activeTab !== 'terminal'}>
          <TerminalView
            url={socketUrl('terminal', sessionId)}
            interactive
            onReady={onTerminalReady}
            onStatus={setTerminalStatus}
          />
        </div>
        <div className={styles.view} hidden={activeTab !== 'logs'}>
          <TerminalView url={socketUrl('logs', sessionId)} interactive={false} />
        </div>
        <div className={styles.view} hidden={activeTab !== 'results'}>
          <TestResults submission={submission} />
        </div>
      </div>
    </div>
  );
}
