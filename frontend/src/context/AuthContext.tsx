import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/auth';
import { tokens } from '../api/axios';

interface Ctx {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestLoginOtp: (email: string, password: string) => Promise<void>;
  confirmLoginOtp: (email: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...r: UserRole[]) => boolean;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tokens.access) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => tokens.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const requestLoginOtp = useCallback(async (email: string, password: string) => {
    await authApi.requestLoginOtp(email, password);
  }, []);

  const confirmLoginOtp = useCallback(async (email: string, otp: string) => {
    const t = await authApi.confirmLoginOtp(email, otp);
    tokens.set(t.access_token, t.refresh_token);
    localStorage.setItem('user', JSON.stringify(t.user));
    setUser(t.user);
    return t.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokens.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authApi.me();
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user],
  );

  return (
    <AuthCtx.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        requestLoginOtp,
        confirmLoginOtp,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
