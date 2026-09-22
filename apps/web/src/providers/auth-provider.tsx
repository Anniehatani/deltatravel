'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthResult, User } from '@tour/shared';
import { authApi, onSessionExpired, refreshSession, setAccessToken } from '@/lib/api';
type AuthState = {
  user: User | null;
  loading: boolean;
  accept: (result: AuthResult) => void;
  logout: () => Promise<void>;
};
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  const accept = useCallback((result: AuthResult) => {
    setAccessToken(result.accessToken);
    setUser(result.user);
  }, []);
  useEffect(() => {
    let active = true;
    void refreshSession()
      .then((result) => {
        if (active) accept(result);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    const off = onSessionExpired(() => setUser(null));
    return () => {
      active = false;
      off();
    };
  }, [accept]);
  const logout = async () => {
    await authApi.logout();
    setAccessToken(null);
    setUser(null);
  };
  return <Context.Provider value={{ user, loading, accept, logout }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
