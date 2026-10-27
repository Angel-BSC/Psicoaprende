import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ClawMachine } from '@/components/claw-machine';
import { AppButton } from '@/components/app-button';
import { colors } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import type { ClawStatus } from '@/lib/claw-contract';

export default function ClawScreen() {
  const { user } = useAuth();
  return <AccountClaw key={user?.id} />;
}
function AccountClaw() {
  const [attempt, setAttempt] = useState(0);
  const [manualReduced, setManualReduced] = useState<boolean | null>(null);
  return <Session key={attempt} retry={() => setAttempt((value) => value + 1)} manualReduced={manualReduced} setManualReduced={setManualReduced} />;
}

type SessionProps = { retry: () => void; manualReduced: boolean | null; setManualReduced: (value: boolean) => void };
function Session({ retry, manualReduced, setManualReduced }: SessionProps) {
  const [status, setStatus] = useState<ClawStatus | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api<ClawStatus>('/claw').then((value) => { if (active) setStatus(value); }).catch((failure: Error) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []);
  if (status) return <ClawMachine retry={retry} initial={status} manualReduced={manualReduced} setManualReduced={setManualReduced} />;
  return <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background }}>
    {error ? <><Text accessibilityRole="alert">{error}</Text><AppButton label="Reintentar conexión" onPress={retry} /></> : <ActivityIndicator accessibilityLabel="Recuperando cápsulas" color={colors.primary} />}
    <AppButton label="Volver a Jugar" variant="ghost" onPress={() => router.replace('/arcade')} />
  </View>;
}
