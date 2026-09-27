'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import EditorPane from '@/components/editor/EditorPane';
import FileExplorer from '@/components/explorer/FileExplorer';
import StatusBar from '@/components/layout/StatusBar';
import TopBar from '@/components/layout/TopBar';
import BottomPanel from '@/components/panel/BottomPanel';
import PreviewPane from '@/components/preview/PreviewPane';
import Resizer from '@/components/ui/Resizer';
import { useFileTree } from '@/hooks/useFileTree';
import { useOpenFiles } from '@/hooks/useOpenFiles';
import { useResizable } from '@/hooks/useResizable';
import { useWorkspaceSession } from '@/hooks/useWorkspaceSession';
import { api } from '@/lib/api';
import LaunchScreen from './LaunchScreen';
import styles from './Workspace.module.css';

// How long to wait after a save before reloading the preview (nodemon restart time).
const PREVIEW_RELOAD_DELAY_MS = 1200;

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

  const explorer = useResizable({ initial: 250, min: 180, max: 420, axis: 'x' });
  const preview = useResizable({ initial: 460, min: 300, max: 900, axis: 'x', reverse: true });
  const panel = useResizable({ initial: 260, min: 120, max: 600, axis: 'y', reverse: true });

  const [panelTab, setPanelTab] = useState('terminal');
  const [submission, setSubmission] = useState({ status: 'idle' });
  const [previewReload, setPreviewReload] = useState(0);
  const [saveState, setSaveState] = useState('');
  const terminalRef = useRef(null);

  // Open the problem description first, like a real IDE opening the README.
  const { openFile } = editor;
  useEffect(() => {
    openFile(problem.readme);
  }, [openFile, problem.readme]);

  const dirtyPaths = useMemo(
    () => new Set(editor.files.filter((f) => f.content !== f.savedContent).map((f) => f.path)),
    [editor.files],
  );

  const reloadPreviewSoon = () => setTimeout(() => setPreviewReload((n) => n + 1), PREVIEW_RELOAD_DELAY_MS);

  const handleSave = async (path) => {
    try {
      const saved = await editor.saveFile(path);
      if (saved) {
        setSaveState(`Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        reloadPreviewSoon();
      }
    } catch (err) {
      setSaveState(`Save failed: ${err.message}`);
    }
  };

  const handleRunTests = async () => {
    if (await editor.saveAll()) reloadPreviewSoon();
    setPanelTab('terminal');
    terminalRef.current?.send(`${problem.sampleTestCommand}\r`);
    terminalRef.current?.focus();
  };

  const handleSubmit = async () => {
    await editor.saveAll();
    setPanelTab('results');
    setSubmission({ status: 'running' });
    try {
      const { result } = await api.submit(session.id);
      setSubmission({ status: 'done', result });
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
        problem={problem}
        sessionStatus={restarting ? 'restarting' : 'running'}
        onRestart={handleRestart}
        onRunTests={handleRunTests}
        onSubmit={handleSubmit}
        restarting={restarting}
        submitting={submission.status === 'running'}
      />

      <div className={styles.body}>
        <aside className={styles.explorer} style={{ width: explorer.size }}>
          <FileExplorer
            title={problem.id}
            tree={fileTree.tree}
            loading={fileTree.loading}
            error={fileTree.error}
            editableDirs={problem.editable}
            activePath={editor.activePath}
            dirtyPaths={dirtyPaths}
            onOpen={editor.openFile}
            onRefresh={fileTree.refresh}
          />
        </aside>
        <Resizer axis="x" onPointerDown={explorer.onPointerDown} />

        <main className={styles.center}>
          <div className={styles.editor}>
            <EditorPane
              files={editor.files}
              activeFile={editor.activeFile}
              savingPath={editor.savingPath}
              onSelect={editor.setActivePath}
              onClose={editor.closeFile}
              onChange={editor.updateContent}
              onSave={handleSave}
            />
          </div>
          <Resizer axis="y" onPointerDown={panel.onPointerDown} />
          <div className={styles.panel} style={{ height: panel.size }}>
            <BottomPanel
              sessionId={session.id}
              activeTab={panelTab}
              onTabChange={setPanelTab}
              submission={submission}
              onTerminalReady={(api) => {
                terminalRef.current = api;
              }}
            />
          </div>
        </main>

        <Resizer axis="x" onPointerDown={preview.onPointerDown} />
        <section className={styles.preview} style={{ width: preview.size }}>
          <PreviewPane baseUrl={session.previewUrl} reloadSignal={previewReload} busy={restarting} />
        </section>
      </div>

      <StatusBar session={session} problem={problem} activeFile={editor.activeFile} saveState={saveState} />
    </div>
  );
}
