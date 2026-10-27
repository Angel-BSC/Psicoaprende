import { useEffect, useState } from 'react';
import { AppState, Linking, Text, View } from 'react-native';
import { useAuth } from '@/context/auth-context';
import { remindersSupported, studyReminders } from '@/lib/study-reminders';
import { emptyReminder } from '@/lib/reminder-controller';
import { colors } from '@/constants/design';
import { FormField } from './form-field';
import { AppButton } from './app-button';

export function ReminderLifecycle() {
  const { user, initializing } = useAuth();
  const [error, setError] = useState('');
  useEffect(() => {
    if (initializing) return;
    let active = true;
    void studyReminders.bind(user?.id ?? null).then(() => { if (active) setError(''); })
      .catch(() => { if (active) setError('No pudimos revisar los recordatorios del dispositivo. Revisa los permisos en Ajustes.'); });
    return () => { active = false; };
  }, [user?.id, initializing]);
  return error ? <Text accessibilityRole="alert" style={{ padding: 12, color: colors.danger }}>{error}</Text> : null;
}
export function ReminderSettings() {
  const { user } = useAuth();
  const [current, setCurrent] = useState(emptyReminder);
  const [hour, setHour] = useState('19');
  const [minute, setMinute] = useState('00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!user || !remindersSupported) return;
    let active = true;
    const read = () => void studyReminders.read(user.id).then((value) => {
      if (active) { setCurrent(value); setHour(String(value.hour).padStart(2, '0')); setMinute(String(value.minute).padStart(2, '0')); }
    }).catch((e: Error) => { if (active) setError(e.message); });
    read();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') read(); });
    return () => { active = false; subscription.remove(); };
  }, [user]);
  const save = async (enabled: boolean) => {
    if (!user || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (enabled && (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute))) throw new Error('Escribe la hora y los minutos con números.');
      const result = await studyReminders.save(user.id, enabled, enabled ? Number(hour) : current.hour, enabled ? Number(minute) : current.minute);
      setCurrent(result); setNotice(enabled ? 'Recordatorio programado en este dispositivo.' : 'Recordatorio desactivado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo programar el aviso.');
      try { setCurrent(await studyReminders.read(user.id)); } catch { /* Original error remains visible. */ }
    } finally { setBusy(false); }
  };
  if (!remindersSupported) return <Text style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 21 }}>
    Los avisos diarios se configuran en la app para Android o iPhone. Este navegador no enviará notificaciones con la app cerrada.
  </Text>;
  return <View style={{ gap: 14 }}>
    <Text style={{ color: colors.ink, lineHeight: 21 }}>{current.enabled ? `Activo a las ${String(current.hour).padStart(2, '0')}:${String(current.minute).padStart(2, '0')}` : current.blocked ? 'Bloqueado por los permisos del dispositivo.' : 'Desactivado'}</Text>
    <Text style={{ color: colors.inkMuted, lineHeight: 21 }}>Hora local del teléfono, todos los días. Solo en este dispositivo; se cancela al cerrar sesión. El sistema puede retrasar el aviso por ahorro de batería.</Text>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ flex: 1 }}><FormField label="Hora (00–23)" value={hour} onChangeText={setHour} keyboardType="number-pad" maxLength={2} editable={!busy} /></View>
      <View style={{ flex: 1 }}><FormField label="Minutos (00–59)" value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2} editable={!busy} /></View>
    </View>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primaryDark }}>{notice}</Text> : null}
    <AppButton label={current.enabled ? 'Guardar horario' : 'Activar recordatorio'} loading={busy} onPress={() => void save(true)} />
    {(current.enabled || current.blocked) ? <AppButton label="Desactivar recordatorio" variant="ghost" disabled={busy} onPress={() => void save(false)} /> : null}
    <AppButton label="Abrir permisos del teléfono" variant="ghost" disabled={busy} onPress={() => void Linking.openSettings().catch(() => setError('Abre los ajustes del teléfono y busca PsicoAprende.'))} />
  </View>;
}
