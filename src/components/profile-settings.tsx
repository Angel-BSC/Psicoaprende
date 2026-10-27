import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '@/constants/design';
import { useProfile } from '@/context/profile-context';
import { dailyGoals, profileItems, readingMetrics, readingSizes, ProfileChanges, ProfileData, ReadingSize } from '@/lib/profile-contract';
import { AppButton } from './app-button';
import { FormField } from './form-field';
import { ProfileAvatar } from './profile-avatar';
import { ReminderSettings } from './reminder-settings';

type Panel = 'name' | 'goal' | 'reading' | 'reminders' | 'shop';
export function ProfileSettings() {
  const { profile, loading, error: loadError, refresh, save, purchase, equip } = useProfile();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const working = useRef(false);
  const run = async (action: () => Promise<void>, message: string) => {
    if (working.current) return false;
    working.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(message); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar. Intenta otra vez.'); return false; }
    finally { working.current = false; setBusy(false); }
  };
  const toggle = (next: Panel) => { setPanel(panel === next ? null : next); setError(''); setNotice(''); };
  const choices: { id: Panel; icon: string; title: string; value: string }[] = [
    { id: 'name', icon: '✎', title: 'Nombre del perfil', value: 'Editar' },
    { id: 'goal', icon: '◎', title: 'Meta diaria', value: `${profile.dailyGoal} XP` },
    { id: 'reading', icon: 'Aa', title: 'Ajustes de lectura', value: readingSizes.find((size) => size.id === profile.readingSize)?.label ?? 'Normal' },
    { id: 'reminders', icon: '◷', title: 'Recordatorios', value: 'Configurar' },
    { id: 'shop', icon: '✧', title: 'Personalizar mi perfil', value: 'Estilos y tienda' },
  ];
  return <View style={{ gap: 12 }}>
    {loading ? <Text style={s.body}>Cargando tus ajustes…</Text> : null}
    {loadError ? <View style={s.panel}><Text accessibilityRole="alert" style={s.error}>{loadError}</Text>
      <AppButton label="Recargar perfil y saldo" variant="ghost" disabled={busy} onPress={() => void refresh()} /></View> : null}
    {choices.map((choice) => <View key={choice.id} style={s.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={choice.title} accessibilityState={{ expanded: panel === choice.id, disabled: busy || loading }}
        disabled={busy || loading} onPress={() => toggle(choice.id)} style={s.row}>
        <Text style={s.icon}>{choice.icon}</Text><Text style={s.label}>{choice.title}</Text>
        <Text style={s.value}>{choice.value} {panel === choice.id ? '−' : '+'}</Text>
      </Pressable>
      {panel === choice.id ? <View style={s.panel}>
        {choice.id === 'reminders' ? <ReminderSettings /> : choice.id === 'shop' ? <Shop profile={profile} busy={busy}
          buy={(id) => run(() => purchase(id), 'Objeto comprado. Ya puedes usarlo en tu perfil.')}
          equip={(id) => run(() => equip(id), 'Estilo aplicado a tu perfil.')} /> :
          <PreferenceEditor key={choice.id} kind={choice.id} profile={profile} busy={busy}
            save={(changes) => run(() => save(changes), 'Cambios guardados en tu cuenta.')} />}
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text> : null}
      </View> : null}
    </View>)}
  </View>;
}
function Choice({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" aria-checked={selected} accessibilityState={{ checked: selected, disabled }} disabled={disabled}
    onPress={onPress} style={[s.choice, selected && s.selected]}><Text style={s.choiceLabel}>{selected ? '✓ ' : ''}{label}</Text></Pressable>;
}
function PreferenceEditor({ kind, profile, busy, save }: { kind: 'name' | 'goal' | 'reading'; profile: ProfileData; busy: boolean; save: (changes: ProfileChanges) => Promise<boolean> }) {
  const [name, setName] = useState(profile.name);
  const [goal, setGoal] = useState(profile.dailyGoal);
  const [size, setSize] = useState<ReadingSize>(profile.readingSize);
  const [roomy, setRoomy] = useState(profile.roomyReading);
  const [nameError, setNameError] = useState('');
  return <View style={{ gap: 14 }}>
    {kind === 'name' ? <FormField label="Tu nombre" value={name} onChangeText={setName} maxLength={80} editable={!busy} autoCapitalize="words" error={nameError} /> :
      kind === 'goal' ? <>
        <Text style={s.body}>Elige un ritmo que puedas mantener. Cambiar la meta no modifica la XP que ya ganaste ni tu racha.</Text>
        <View style={s.choices}>{dailyGoals.map((value) => <Choice key={value} label={`${value} XP`} selected={goal === value} disabled={busy} onPress={() => setGoal(value)} />)}</View>
      </> : <>
        <Text style={s.body}>Se aplica al contenido de las lecciones, exámenes y casos clínicos. También se respeta el tamaño de texto del sistema.</Text>
        <View style={s.choices}>{readingSizes.map((value) => <Choice key={value.id} label={value.label} selected={size === value.id} disabled={busy} onPress={() => setSize(value.id)} />)}</View>
        <View style={s.row}><Text style={s.label}>Más espacio entre líneas</Text><Switch accessibilityLabel="Más espacio entre líneas" value={roomy} disabled={busy} onValueChange={setRoomy} /></View>
        <View style={s.preview}><Text style={[s.body, readingMetrics(size, roomy, 16, 24)]}>Comprender antes que memorizar. Conecta cada concepto con un ejemplo y estudia a tu ritmo.</Text></View>
      </>}
    <AppButton label={kind === 'name' ? 'Guardar nombre' : kind === 'goal' ? 'Guardar meta' : 'Guardar lectura'} loading={busy} onPress={() => {
      if (kind === 'name') {
        if (name.trim().length < 2 || /[\u0000-\u001f\u007f]/.test(name)) { setNameError('Escribe un nombre de 2 a 80 caracteres.'); return; }
        setNameError(''); void save({ name: name.trim() });
      } else void save(kind === 'goal' ? { dailyGoal: goal } : { readingSize: size, roomyReading: roomy });
    }} />
  </View>;
}
function Shop({ profile, busy, buy, equip }: { profile: ProfileData; busy: boolean; buy: (id: string) => Promise<boolean>; equip: (id: string) => Promise<boolean> }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  return <View style={{ gap: 16 }}>
    <Text style={s.balance}>◈ {profile.coins} monedas disponibles</Text>
    <Text style={s.body}>Marcos y colores para tu avatar. Compra una sola vez y cambia de estilo cuando quieras. Monedas ganadas estudiando, sin dinero real.</Text>
    {profileItems.map((item) => {
      const owned = profile.ownedItems.includes(item.id), equipped = profile.equippedItem === item.id;
      return <View key={item.id} style={s.item}>
        <View style={{ alignItems: 'center', gap: 12 }}><ProfileAvatar name={profile.name} itemId={item.id} size={70} /><Text style={s.itemName}>{item.name}</Text></View>
        <Text style={s.body}>{equipped ? '✓ En uso' : owned ? 'En tu colección' : `${item.price} monedas`}</Text>
        {owned ? <AppButton label={equipped ? `${item.name} en uso` : `Usar ${item.name}`} variant="ghost" disabled={busy || equipped} onPress={() => void equip(item.id)} /> : confirm === item.id ? <View style={{ gap: 10 }}>
          <Text style={s.body}>¿Canjear {item.price} monedas por «{item.name}»? Te quedarán {profile.coins - item.price} monedas. No hay devolución automática.</Text>
          <AppButton label={`Confirmar canje: ${item.price} monedas`} loading={busy} disabled={profile.coins < item.price} onPress={() => void buy(item.id).then((ok) => { if (ok) setConfirm(null); })} />
          <AppButton label="Cancelar canje" variant="ghost" disabled={busy} onPress={() => setConfirm(null)} />
        </View> : <>
          <AppButton label={`Conseguir ${item.name}`} disabled={busy || profile.coins < item.price} variant="ghost" onPress={() => setConfirm(item.id)} />
          {profile.coins < item.price ? <Text style={s.body}>Te faltan {item.price - profile.coins} monedas.</Text> : null}
        </>}
      </View>;
    })}
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, minHeight: 60 },
  icon: { width: 26, color: colors.primaryDark, fontSize: 17 },
  label: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '600' },
  value: { color: colors.inkMuted, fontSize: 11, flexShrink: 1, maxWidth: '40%', textAlign: 'right' },
  panel: { padding: 16, borderTopWidth: 1, borderColor: colors.border, gap: 14 },
  body: { color: colors.inkMuted, fontSize: 13, lineHeight: 21 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choiceLabel: { color: colors.primaryDark, fontWeight: '600' },
  preview: { padding: 14, backgroundColor: colors.primarySoft, borderRadius: 12 },
  balance: { color: colors.primaryDark, fontSize: 17, fontWeight: '700' },
  item: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 12 },
  itemName: { color: colors.ink, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 20 },
  notice: { color: colors.primaryDark, fontSize: 13, lineHeight: 20 },
});
