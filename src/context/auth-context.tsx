import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { api, ApiError, onSessionExpired, setApiToken } from '@/lib/api';
import { readSession, removeSession, saveSession } from '@/lib/session-storage';
import { studyReminders } from '@/lib/study-reminders';
import type { LoginInput, RegisterInput, UserRole } from '@/lib/validation';
export type { UserRole } from '@/lib/validation';

export type AppUser = { id: string; name: string; email: string; role: UserRole };
type Session = { user: AppUser; token?: string };
type AuthContextValue = {
  user: AppUser | null;
  initializing: boolean;
  initializationError: string;
  restore: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (userId: string, name: string) => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState('');
  const busy = useRef(false);
  const updateName = useCallback((userId: string, name: string) => {
    setUser((current) => current?.id === userId && current.name !== name ? { ...current, name } : current);
  }, []);

  const restore = useCallback(async () => {
    try {
      const token = await readSession();
      setApiToken(token);
      if (Platform.OS !== 'web' && !token) { setUser(null); return; }
      const session = await api<Session>('/auth/me');
      setUser(session.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await removeSession();
        setApiToken(null);
        setUser(null);
      } else {
        setInitializationError(error instanceof Error ? error.message : 'No se pudo recuperar la sesión.');
      }
    } finally { setInitializing(false); }
  }, []);

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
      setApiToken(null);
      void removeSession().catch(() => setInitializationError('No pudimos limpiar la sesión guardada. Intenta nuevamente.'));
    });
    // Restores an external session asynchronously; loading is initialized before this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void restore();
    return unsubscribe;
  }, [restore]);

  const authenticate = async (path: string, input: RegisterInput | LoginInput) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const session = await api<Session>(path, input, false);
      setApiToken(session.token ?? null);
      try {
        if (Platform.OS !== 'web') {
          if (!session.token) throw new Error('El servicio no devolvió una sesión válida.');
          await saveSession(session.token);
        }
      } catch {
        await api('/auth/logout', {}).catch(() => undefined);
        setApiToken(null);
        throw new Error('No pudimos guardar la sesión de forma segura. Intenta iniciar sesión nuevamente.');
      }
      setUser(session.user);
    } finally { busy.current = false; }
  };

  const logout = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      // Keep the session visible if offline, so the user can retry server revocation.
      await studyReminders.cancel();
      await api('/auth/logout', {});
      await removeSession();
      setApiToken(null);
      setUser(null);
    } finally { busy.current = false; }
  };

  return <AuthContext.Provider value={{ user, initializing, initializationError,
    restore: async () => { setInitializing(true); setInitializationError(''); await restore(); },
    register: (input) => authenticate('/auth/register', input),
    login: (input) => authenticate('/auth/login', input), logout, updateName }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
}
