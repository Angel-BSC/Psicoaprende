import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { defaultProfile, ProfileChanges, ProfileData } from '@/lib/profile-contract';
import { useAuth } from './auth-context';
import { useProgress } from './progress-context';

type Value = { profile: ProfileData; loading: boolean; error: string; refresh: () => Promise<void>;
  save: (changes: ProfileChanges) => Promise<void>; purchase: (itemId: string) => Promise<void>; equip: (itemId: string) => Promise<void> };
const Context = createContext<Value | null>(null);
export function ProfileProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  return <AccountProfile key={user?.id ?? 'guest'} userId={user?.id}>{children}</AccountProfile>;
}
function AccountProfile({ children, userId }: PropsWithChildren<{ userId?: string }>) {
  const { updateName } = useAuth();
  const { refresh: refreshProgress } = useProgress();
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState('');
  const alive = useRef(false);
  const revision = useRef(0);
  const accept = useCallback((value: ProfileData) => {
    if (!alive.current) return;
    setProfile(value); setError('');
    if (userId) updateName(userId, value.name);
  }, [updateName, userId]);
  const refresh = useCallback(async () => {
    if (!userId) return;
    const ticket = ++revision.current;
    try {
      const value = await api<ProfileData>('/profile');
      if (ticket === revision.current) accept(value);
      await refreshProgress();
    }
    catch (e) { if (alive.current && ticket === revision.current) setError(e instanceof Error ? e.message : 'No se pudo cargar tu perfil.'); }
    finally { if (alive.current) setLoading(false); }
  }, [accept, refreshProgress, userId]);
  useEffect(() => { alive.current = true; void refresh(); return () => { alive.current = false; }; }, [refresh]);
  const mutate = async (path: string, body: unknown) => {
    ++revision.current;
    let value: ProfileData;
    try { value = await api<ProfileData>(path, body); }
    catch (error) { if (error instanceof ApiError && error.status === 409) await refresh(); throw error; }
    ++revision.current;
    accept(value);
    // A saved preference/purchase must not be reported as failed if this secondary read fails.
    try { await refreshProgress(); }
    catch { if (alive.current) setError('El cambio está guardado. No pudimos actualizar las estadísticas; vuelve a intentar.'); }
  };
  return <Context.Provider value={{ profile, loading, error, refresh,
    save: (changes) => mutate('/profile', changes), purchase: (itemId) => mutate('/profile/purchase', { itemId }),
    equip: (itemId) => mutate('/profile/equip', { itemId }) }}>{children}</Context.Provider>;
}
export function useProfile() {
  const value = useContext(Context);
  if (!value) throw new Error('useProfile requiere ProfileProvider');
  return value;
}
