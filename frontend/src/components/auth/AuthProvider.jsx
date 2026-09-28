'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Shares "who is signed in" with every page.
// status: "loading" | "authenticated" | "anonymous"
const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.getMe();
      setState(user ? { status: 'authenticated', user } : { status: 'anonymous', user: null });
      return user;
    } catch {
      setState({ status: 'anonymous', user: null });
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setState({ status: 'anonymous', user: null });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <AuthContext.Provider value={{ ...state, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
