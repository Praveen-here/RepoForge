'use client';

import { useEffect, useState } from 'react';

function getStorage(kind) {
  return kind === 'session' ? window.sessionStorage : window.localStorage;
}

/**
 * useState that is remembered in this browser.
 *   storage: 'local'   -> kept across visits (localStorage)
 *            'session' -> kept while this tab is open, e.g. when going to a problem and back
 * Falls back to plain state if storage is unavailable (private mode, blocked storage).
 */
export function usePersistentState(key, initialValue, { storage = 'local' } = {}) {
  const [value, setValue] = useState(() => {
    try {
      const stored = getStorage(storage).getItem(key);
      return stored === null ? (typeof initialValue === 'function' ? initialValue() : initialValue) : JSON.parse(stored);
    } catch {
      return typeof initialValue === 'function' ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      getStorage(storage).setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep the in-memory value */
    }
  }, [key, value, storage]);

  return [value, setValue];
}
