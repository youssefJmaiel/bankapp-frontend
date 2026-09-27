import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { initAuth, login as kcLogin, logout as kcLogout, isAuthenticated, getCurrentUser, type AuthUserInfo } from '@/api/auth';

type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUserInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<AuthUserInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    initAuth().then((authenticated) => {
      if (!mounted) return;
      if (authenticated) {
        setUser(getCurrentUser());
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async () => {
    await kcLogin();
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setStatus('unauthenticated');
    await kcLogout();
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
