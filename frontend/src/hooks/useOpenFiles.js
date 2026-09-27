'use client';

import { useCallback, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Tracks the editor tabs.
 * Each file: { path, content, savedContent, editable, status: "loading" | "ready" | "error", error }
 * A file is "dirty" when content !== savedContent.
 */
export function useOpenFiles(sessionId) {
  const [files, setFiles] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [savingPath, setSavingPath] = useState(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const openingRef = useRef(new Set()); // paths being fetched right now

  const patchFile = useCallback((path, patch) => {
    setFiles((current) => current.map((file) => (file.path === path ? { ...file, ...patch } : file)));
  }, []);

  const openFile = useCallback(
    async (path) => {
      setActivePath(path);
      if (openingRef.current.has(path) || filesRef.current.some((file) => file.path === path)) return;

      openingRef.current.add(path);
      setFiles((current) => [...current, { path, content: '', savedContent: '', editable: false, status: 'loading' }]);
      try {
        const { file } = await api.readFile(sessionId, path);
        patchFile(path, {
          content: file.content,
          savedContent: file.content,
          editable: file.editable,
          status: 'ready',
        });
      } catch (err) {
        patchFile(path, { status: 'error', error: err.message });
      } finally {
        openingRef.current.delete(path);
      }
    },
    [sessionId, patchFile],
  );

  const closeFile = useCallback((path) => {
    const current = filesRef.current;
    const index = current.findIndex((file) => file.path === path);
    const next = current.filter((file) => file.path !== path);
    const neighbour = next[Math.min(index, next.length - 1)];

    setFiles(next);
    setActivePath((active) => (active === path ? neighbour?.path ?? null : active));
  }, []);

  const updateContent = useCallback((path, content) => patchFile(path, { content }), [patchFile]);

  const saveFile = useCallback(
    async (path) => {
      const file = filesRef.current.find((f) => f.path === path);
      if (!file || !file.editable || file.content === file.savedContent) return false;

      setSavingPath(path);
      try {
        await api.writeFile(sessionId, path, file.content);
        patchFile(path, { savedContent: file.content });
        return true;
      } finally {
        setSavingPath(null);
      }
    },
    [sessionId, patchFile],
  );

  const saveAll = useCallback(async () => {
    const dirty = filesRef.current.filter((f) => f.editable && f.content !== f.savedContent);
    for (const file of dirty) await saveFile(file.path);
    return dirty.length;
  }, [saveFile]);

  const activeFile = files.find((file) => file.path === activePath) || null;
  const dirtyCount = files.filter((file) => file.content !== file.savedContent).length;

  return {
    files,
    activeFile,
    activePath,
    setActivePath,
    savingPath,
    dirtyCount,
    openFile,
    closeFile,
    updateContent,
    saveFile,
    saveAll,
  };
}
