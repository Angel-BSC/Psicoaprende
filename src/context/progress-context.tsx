import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './auth-context';

type Progress = { xp: number; coins: number; dailyXp: number; streak: number; dailyGoal: number; completedLessonIds: string[] };
type Completion = { progress: Progress; earnedXp: number; score: number };
type Value = Progress & { loading: boolean; error: string; retry: () => void; refresh: () => Promise<void>; completeLesson: (id: string, answers: number[]) => Promise<Completion> };
const empty: Progress = { xp: 0, coins: 0, dailyXp: 0, streak: 0, dailyGoal: 50, completedLessonIds: [] };
const Context = createContext<Value | null>(null);

// Remount per account: neither delayed responses nor local state can leak between users.
export function ProgressProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  return <AccountProgress key={user?.id ?? 'guest'} authenticated={Boolean(user)}>{children}</AccountProgress>;
}

function AccountProgress({ children, authenticated }: PropsWithChildren<{ authenticated: boolean }>) {
  const [progress, setProgress] = useState<Progress>(empty);
  const [loading, setLoading] = useState(authenticated);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(async () => { const value = await api<Progress>('/progress'); setProgress(value); }, []);
  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    api<Progress>('/progress').then((value) => { if (active) setProgress(value); })
      .catch((failure: Error) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authenticated, attempt]);

  const completeLesson = async (lessonId: string, answers: number[]) => {
    const result = await api<Completion>('/progress/complete', { lessonId, answers });
    setProgress(result.progress);
    return result;
  };
  return <Context.Provider value={{ ...progress, loading, error,
    refresh,
    retry: () => { setLoading(true); setError(''); setAttempt((v) => v + 1); }, completeLesson }}>{children}</Context.Provider>;
}

export function useProgress() {
  const context = useContext(Context);
  if (!context) throw new Error('useProgress debe utilizarse dentro de ProgressProvider');
  return context;
}
