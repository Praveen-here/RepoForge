'use client';

import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';
import { languageFor } from '@/lib/files';
import EditorTabs from './EditorTabs';
import { defineEditorTheme, EDITOR_THEME, monoFontFamily } from './editorTheme';
import styles from './EditorPane.module.css';

export default function EditorPane({ files, activeFile, savingPath, onSelect, onClose, onChange, onSave }) {
  const monacoRef = useRef(null);
  const activePathRef = useRef(null);
  const onSaveRef = useRef(onSave);
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
  };

  return (
    <div className={styles.pane}>
      <EditorTabs
        files={files}
        activePath={activeFile?.path}
        savingPath={savingPath}
        onSelect={onSelect}
        onClose={onClose}
      />

      {activeFile && (
        <div className={styles.breadcrumbs}>
          {activeFile.path.split('/').map((part, index, parts) => (
            <span key={index} className={`${styles.crumb} ${index === parts.length - 1 ? styles.crumbCurrent : ''}`}>
              {part}
              {index < parts.length - 1 && <Icon name="chevronRight" size={11} />}
            </span>
          ))}
          {!activeFile.editable && (
            <span className={styles.readOnly}>
              <Icon name="lock" size={11} />
              Read-only
            </span>
          )}
        </div>
      )}

      <div className={styles.body}>
        {!activeFile && <EmptyEditor />}

        {activeFile?.status === 'loading' && (
          <div className={styles.centered}>
            <Spinner size={18} color="var(--accent)" />
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
            loading={<Spinner size={18} color="var(--accent)" />}
            options={{
              readOnly: !activeFile.editable,
              readOnlyMessage: { value: 'This file is read-only. You can edit files in the highlighted folders.' },
              fontFamily: monoFontFamily(),
              fontSize: 13.5,
              lineHeight: 22,
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              padding: { top: 14, bottom: 14 },
              tabSize: 2,
              automaticLayout: true,
              stickyScroll: { enabled: false },
              guides: { indentation: true },
              scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
            }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyEditor() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyLogo}>
        <Logo size={56} />
      </div>
      <p className={styles.emptyTitle}>Open a file to start fixing</p>
      <div className={styles.shortcuts}>
        <span>Save file</span>
        <kbd>Ctrl</kbd>
        <kbd>S</kbd>
      </div>
    </div>
  );
}
