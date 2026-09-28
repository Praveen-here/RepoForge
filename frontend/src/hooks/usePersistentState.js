'use client';

import { useEffect, useState } from 'react';

/**
 * useState that is remembered in this browser (localStorage).
 * Falls back to plain state if storage is unavailable (private mode, blocked storage).
 */
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep the in-memory value */
    }
  }, [key, value]);

  return [value, setValue];
}
