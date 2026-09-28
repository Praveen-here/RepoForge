'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ProblemDescription from '@/components/description/ProblemDescription';
import EditorPane from '@/components/editor/EditorPane';
import FileExplorer from '@/components/explorer/FileExplorer';
import TopBar from '@/components/layout/TopBar';
import BottomPanel from '@/components/panel/BottomPanel';
import PreviewPane from '@/components/preview/PreviewPane';
import SubmissionList from '@/components/submissions/SubmissionList';
import Button from '@/components/ui/Button';
import PanelHeader from '@/components/ui/PanelHeader';
import Resizer from '@/components/ui/Resizer';
import { useFileTree } from '@/hooks/useFileTree';
import { useOpenFiles } from '@/hooks/useOpenFiles';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useResizable } from '@/hooks/useResizable';
import { useWorkspaceSession } from '@/hooks/useWorkspaceSession';
import { api } from '@/lib/api';
import LaunchScreen from './LaunchScreen';
import styles from './Workspace.module.css';

// How long to wait after a save before reloading the preview (nodemon restart time).
const PREVIEW_RELOAD_DELAY_MS = 1200;

const LEFT_TABS = [
  { id: 'description', label: 'Description', icon: 'description', iconColor: 'var(--icon-blue)' },
  { id: 'explorer', label: 'Explorer', icon: 'files', iconColor: 'var(--accent)' },
  { id: 'submissions', label: 'Submissions', icon: 'history', iconColor: 'var(--icon-blue)' },
];

export default function Workspace({ problemId }) {
  const { phase, problem, session, error, retry, restart, restarting } = useWorkspaceSession(problemId);

  if (phase !== 'ready') {
    return <LaunchScreen problemId={problemId} error={phase === 'error' ? error : null} onRetry={retry} />;
  }

  return <WorkspaceLayout problem={problem} session={session} restart={restart} restarting={restarting} />;
}

function WorkspaceLayout({ problem, session, restart, restarting }) {
  const fileTree = useFileTree(session.id);
  const editor = useOpenFiles(session.id);

  const left = useResizable({ initial: 340, min: 240, max: 560, axis: 'x' });
  const preview = useResizable({ initial: 440, min: 300, max: 900, axis: 'x', reverse: true });
  const panel = useResizable({ initial: 250, min: 120, max: 600, axis: 'y', reverse: true });

  const [leftTab, setLeftTab] = useState('description');
  const [panelTab, setPanelTab] = useState('terminal');
  const [submission, setSubmission] = useState({ status: 'idle' });
  const [previewReload, setPreviewReload] = useState(0);
  const [saveState, setSaveState] = useState('');
  const [submissionsVersion, setSubmissionsVersion] = useState(0);
  const terminalRef = useRef(null);

  // Hidden panels stay mounted, so the terminal keeps its history and the preview keeps its page.
  const [showPanel, setShowPanel] = usePersistentState('repo-forge.showPanel', true);
  const [showPreview, setShowPreview] = usePersistentState('repo-forge.showPreview', true);

  // Ctrl+` toggles the terminal panel, like in VS Code.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.ctrlKey && event.key === '`') {
        event.preventDefault();
        setShowPanel((shown) => !shown);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setShowPanel]);

  // Start with the app's entry file open, like LeetCode opening the code template.
  const { openFile } = editor;
  useEffect(() => {
    if (problem.entryFile) openFile(problem.entryFile);
  }, [openFile, problem.entryFile]);

  const dirtyPaths = useMemo(
    () => new Set(editor.files.filter((f) => f.content !== f.savedContent).map((f) => f.path)),
    [editor.files],
  );

  const reloadPreviewSoon = () => setTimeout(() => setPreviewReload((n) => n + 1), PREVIEW_RELOAD_DELAY_MS);

  const handleSave = async (path) => {
    try {
      const saved = await editor.saveFile(path);
      if (saved) {
        setSaveState('Saved');
        reloadPreviewSoon();
      }
    } catch (err) {
      setSaveState(`Save failed: ${err.message}`);
    }
  };

  const handleRunTests = async () => {
    if (await editor.saveAll()) reloadPreviewSoon();
    setShowPanel(true);
    setPanelTab('terminal');
    terminalRef.current?.send(`${problem.sampleTestCommand}\r`);
    terminalRef.current?.focus();
  };

  const handleSubmit = async () => {
    await editor.saveAll();
    setShowPanel(true);
    setPanelTab('results');
    setSubmission({ status: 'running' });
    try {
      const { submission: saved } = await api.submit(session.id);
      setSubmission({ status: 'done', result: saved });
      setSubmissionsVersion((n) => n + 1);
    } catch (err) {
      setSubmission({ status: 'error', error: err.message });
    }
  };

  const handleRestart = async () => {
    await editor.saveAll();
    try {
      await restart();
      setPreviewReload((n) => n + 1);
    } catch (err) {
      setSaveState(`Restart failed: ${err.message}`);
    }
  };

  return (
    <div className={styles.shell}>
      <TopBar
        sessionStatus={restarting ? 'restarting' : 'running'}
        containerName={session.containerName}
        onRestart={handleRestart}
        onRunTests={handleRunTests}
        onSubmit={handleSubmit}
        restarting={restarting}
        submitting={submission.status === 'running'}
        showPanel={showPanel}
        showPreview={showPreview}
        onTogglePanel={() => setShowPanel((shown) => !shown)}
        onTogglePreview={() => setShowPreview((shown) => !shown)}
      />

      <div className={styles.body}>
        <aside className={styles.card} style={{ width: left.size }}>
          <PanelHeader tabs={LEFT_TABS} activeTab={leftTab} onTabChange={setLeftTab}>
            {leftTab === 'explorer' && (
              <Button variant="ghost" size="sm" icon="refresh" onClick={fileTree.refresh} title="Refresh files" />
            )}
          </PanelHeader>
          <div className={styles.cardBody}>
            <div className={styles.view} hidden={leftTab !== 'description'}>
              <ProblemDescription sessionId={session.id} problem={problem} />
            </div>
            <div className={styles.view} hidden={leftTab !== 'explorer'}>
              <FileExplorer
                title={problem.id}
                tree={fileTree.tree}
                loading={fileTree.loading}
                error={fileTree.error}
                editableDirs={problem.editable}
                activePath={editor.activePath}
                dirtyPaths={dirtyPaths}
                onOpen={editor.openFile}
              />
            </div>
            {leftTab === 'submissions' && (
              <div className={styles.view}>
                <SubmissionList problemId={problem.id} refreshKey={submissionsVersion} />
              </div>
            )}
          </div>
        </aside>

        <Resizer axis="x" onPointerDown={left.onPointerDown} />

        <main className={styles.center}>
          <section className={`${styles.card} ${styles.editor}`}>
            <EditorPane
              files={editor.files}
              activeFile={editor.activeFile}
              savingPath={editor.savingPath}
              saveState={saveState}
              onSelect={editor.setActivePath}
              onClose={editor.closeFile}
              onChange={editor.updateContent}
              onSave={handleSave}
            />
          </section>
          {showPanel && <Resizer axis="y" onPointerDown={panel.onPointerDown} />}
          <section className={`${styles.card} ${styles.panel}`} style={{ height: panel.size }} hidden={!showPanel}>
            <BottomPanel
              sessionId={session.id}
              activeTab={panelTab}
              onTabChange={setPanelTab}
              submission={submission}
              onTerminalReady={(terminalApi) => {
                terminalRef.current = terminalApi;
              }}
              onClose={() => setShowPanel(false)}
            />
          </section>
        </main>

        {showPreview && <Resizer axis="x" onPointerDown={preview.onPointerDown} />}

        <section className={styles.card} style={{ width: preview.size }} hidden={!showPreview}>
          <PreviewPane
            baseUrl={session.previewUrl}
            reloadSignal={previewReload}
            busy={restarting}
            onClose={() => setShowPreview(false)}
          />
        </section>
      </div>
    </div>
  );
}
