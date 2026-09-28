'use client';

import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/Icon';
import PanelHeader from '@/components/ui/PanelHeader';
import Spinner from '@/components/ui/Spinner';
import { languageFor, languageLabel } from '@/lib/files';
import EditorTabs from './EditorTabs';
import { defineEditorTheme, EDITOR_THEME, monoFontFamily } from './editorTheme';
import styles from './EditorPane.module.css';

const HEADER_TABS = [{ id: 'code', label: 'Code', icon: 'code', iconColor: 'var(--icon-green)' }];

export default function EditorPane({ files, activeFile, savingPath, saveState, onSelect, onClose, onChange, onSave }) {
  const monacoRef = useRef(null);
  const activePathRef = useRef(null);
  const onSaveRef = useRef(onSave);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  activePathRef.current = activeFile?.path ?? null;
  onSaveRef.current = onSave;

  // Dispose editor models of closed tabs, so reopening a file starts fresh.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    const open = new Set(files.map((file) => monaco.Uri.parse(file.path).toString()));
    for (const model of monaco.editor.getModels()) {
      if (!open.has(model.uri.toString())) model.dispose();
    }
  }, [files]);

  const handleMount = (editor, monaco) => {
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activePathRef.current) onSaveRef.current(activePathRef.current);
    });
    editor.onDidChangeCursorPosition(({ position }) => {
      setCursor({ line: position.lineNumber, column: position.column });
    });
  };

  const isDirty = activeFile && activeFile.content !== activeFile.savedContent;

  return (
    <div className={styles.pane}>
      <PanelHeader tabs={HEADER_TABS} />

      <EditorTabs
        files={files}
        activePath={activeFile?.path}
        savingPath={savingPath}
        onSelect={onSelect}
        onClose={onClose}
      />

      <div className={styles.body}>
        {!activeFile && (
          <div className={styles.centered}>
            <p className={styles.empty}>Open a file from the Explorer to start fixing.</p>
          </div>
        )}

        {activeFile?.status === 'loading' && (
          <div className={styles.centered}>
            <Spinner size={18} color="var(--text-muted)" />
          </div>
        )}

        {activeFile?.status === 'error' && (
          <div className={styles.centered}>
            <p className={styles.error}>{activeFile.error}</p>
          </div>
        )}

        {activeFile?.status === 'ready' && (
          <Editor
            path={activeFile.path}
            defaultValue={activeFile.savedContent}
            defaultLanguage={languageFor(activeFile.path)}
            theme={EDITOR_THEME}
            beforeMount={defineEditorTheme}
            onMount={handleMount}
            onChange={(value) => onChange(activeFile.path, value ?? '')}
            loading={<Spinner size={18} color="var(--text-muted)" />}
            options={{
              readOnly: !activeFile.editable,
              readOnlyMessage: { value: 'This file is read-only. You can edit files in the highlighted folders.' },
              fontFamily: monoFontFamily(),
              fontSize: 14,
              lineHeight: 21,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              renderLineHighlight: 'all',
              padding: { top: 8, bottom: 8 },
              tabSize: 2,
              automaticLayout: true,
              stickyScroll: { enabled: false },
              overviewRulerBorder: false,
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
          />
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.footerLeft}>
          {activeFile && !activeFile.editable && (
            <span className={styles.readOnly}>
              <Icon name="lock" size={12} />
              Read-only
            </span>
          )}
          {activeFile?.editable && (isDirty ? 'Unsaved changes · Ctrl+S to save' : saveState)}
        </span>
        {activeFile?.status === 'ready' && (
          <span>
            {languageLabel(activeFile.path)} · Ln {cursor.line}, Col {cursor.column}
          </span>
        )}
      </div>
    </div>
  );
}
