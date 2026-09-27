'use client';

import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import TestResults from '@/components/results/TestResults';
import TerminalView from '@/components/terminal/TerminalView';
import { socketUrl } from '@/lib/api';
import styles from './BottomPanel.module.css';

const TABS = [
  { id: 'terminal', label: 'Terminal', icon: 'terminal' },
  { id: 'logs', label: 'App Logs', icon: 'logs' },
  { id: 'results', label: 'Test Results', icon: 'beaker' },
];

const VERDICT_BADGE = {
  accepted: { label: 'Passed', className: 'badgeSuccess' },
  failed: { label: 'Failed', className: 'badgeDanger' },
  error: { label: 'Error', className: 'badgeDanger' },
  timeout: { label: 'Timeout', className: 'badgeDanger' },
};

export default function BottomPanel({ sessionId, activeTab, onTabChange, submission, onTerminalReady }) {
  const [terminalStatus, setTerminalStatus] = useState('connecting');
  const verdict = submission.result && VERDICT_BADGE[submission.result.status];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.tabs} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
              {tab.id === 'results' && submission.status === 'running' && <span className={styles.pulse} />}
              {tab.id === 'results' && verdict && (
                <span className={`${styles.badge} ${styles[verdict.className]}`}>{verdict.label}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'terminal' && (
          <span className={`${styles.connection} ${styles[terminalStatus]}`}>
            <span className={styles.connectionDot} />
            Shell · {terminalStatus}
          </span>
        )}
      </div>

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
