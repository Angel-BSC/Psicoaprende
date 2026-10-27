import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { clawAssets } from '@/constants/claw-assets';
import { colors } from '@/constants/design';
import { useClawMachine } from '@/hooks/use-claw-machine';
import { CLAW, clawMessages } from '@/lib/claw-machine';
import type { Capsule } from '@/lib/claw-machine';
import { api } from '@/lib/api';
import { capsuleOdds, capsuleRarities } from '@/lib/claw-contract';
import type { ClawAttempt, ClawStatus } from '@/lib/claw-contract';
import { ClawChallenge } from '@/components/claw-challenge';
import { useProgress } from '@/context/progress-context';

function CapsuleSprite({ color, size = 64, onLoad, onError }: { color: Capsule['color']; size?: number; onLoad?: () => void; onError?: () => void }) {
  // The generated atlas has three equal square cells. Clipping does not modify the source PNG.
  return <View style={{ width: size, height: size, overflow: 'hidden' }} pointerEvents="none" accessible={false}>
    <Image source={clawAssets.capsules} accessible={false} resizeMode="stretch" onLoad={onLoad} onError={onError}
      style={{ width: size * 3, height: size, position: 'absolute', left: -color * size, top: 0 }} />
  </View>;
}

function ArticulatedClaw({ grip, onLoad, onError }: { grip: Animated.Value; onLoad: () => void; onError: () => void }) {
  // Runtime clipping of the existing sprite: real hinged arms instead of ghosting two poses.
  return <View pointerEvents="none" style={s.claw}>
    <View style={s.rearProng}><Image source={clawAssets.open} accessible={false} style={[s.claw, { left: -28, top: -34 }]} /></View>
    <Animated.View style={[s.leftProng, { transform: [{ rotate: grip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-18deg'] }) }] }]}>
      <Image source={clawAssets.open} accessible={false} style={[s.claw, { top: -30 }]} />
    </Animated.View>
    <Animated.View style={[s.rightProng, { transform: [{ rotate: grip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '18deg'] }) }] }]}>
      <Image source={clawAssets.open} accessible={false} style={[s.claw, { left: -47, top: -30 }]} />
    </Animated.View>
    <View style={s.clawHead}><Image source={clawAssets.open} accessible={false} onLoad={onLoad} onError={onError} style={s.claw} /></View>
  </View>;
}

export function ClawMachine({ retry, initial, manualReduced, setManualReduced }: {
  retry: () => void; initial: ClawStatus; manualReduced: boolean | null; setManualReduced: (value: boolean) => void;
}) {
  const [systemReduced, setSystemReduced] = useState(false);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [assetError, setAssetError] = useState(false);
  const [sceneWidth, setSceneWidth] = useState(288);
  const scale = sceneWidth / CLAW.size;
  const reducedMotion = manualReduced ?? systemReduced;
  const game = useClawMachine(reducedMotion, initial.capsules);
  const [attempt, setAttempt] = useState<ClawAttempt | null>(initial.activeAttempt);
  const [networkBusy, setNetworkBusy] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const lock = useRef(false);
  const alive = useRef(true);
  const progress = useProgress();
  const { refresh } = progress;
  useEffect(() => { void refresh().catch(() => undefined); }, [refresh]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const request = async (operation: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setNetworkBusy(true); setNetworkError('');
    try { await operation(); }
    catch (error) { if (alive.current) setNetworkError(error instanceof Error ? error.message : 'No se pudo guardar. Reintenta.'); }
    finally { lock.current = false; if (alive.current) setNetworkBusy(false); }
  };
  const openChallenge = () => void request(async () => {
    if (!game.selected) return;
    const response = await api<{ attempt: ClawAttempt }>('/claw/attempts', { capsuleId: game.selected.id });
    if (alive.current) { game.open(); setAttempt(response.attempt); }
  });
  const answerChallenge = (answer: number) => void request(async () => {
    if (!attempt) return;
    const response = await api<{ attempt: ClawAttempt }>(`/claw/attempts/${attempt.id}/answer`, { answer });
    if (!alive.current) return;
    setAttempt(response.attempt);
    try { await progress.refresh(); } catch { if (alive.current) setNetworkError('Respuesta guardada. No se pudo actualizar el saldo general; actualiza el estado cuando vuelva la conexión.'); }
  });
  const closeChallenge = () => void request(async () => {
    if (!attempt?.result) return;
    await api<ClawStatus>(`/claw/attempts/${attempt.id}/close`, {});
    await progress.refresh();
    if (alive.current) retry();
  });
  const modalVisible = Boolean(attempt);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setSystemReduced(value); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced);
    return () => { alive = false; sub.remove(); };
  }, []);
  const ready = loaded.includes('chamber') && loaded.includes('open') && (loaded.includes('capsules') || initial.capsules.length === 0) && !assetError;
  const markLoaded = (name: string) => setLoaded((items) => items.includes(name) ? items : [...items, name]);
  const failed = () => setAssetError(true);
  const canMove = ready && !attempt && !networkBusy && game.phase === 'ready' && game.capsules.length > 0;
  const status = !ready ? (assetError ? 'No se pudo cargar el arte.' : 'Preparando la máquina…') : !game.capsules.length && game.phase === 'ready' ? 'La máquina está vacía. Puedes rellenarla.' : clawMessages[game.phase];
  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.content} aria-hidden={modalVisible} importantForAccessibility={modalVisible ? 'no-hide-descendants' : 'auto'}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Salir de la máquina" onPress={() => router.replace('/arcade')} style={s.back}><Text style={s.backText}>‹</Text></Pressable>
        <View style={s.headerCopy}><Text style={s.kicker}>RETOS CLÍNICOS</Text><Text style={s.title}>Elige tu cápsula</Text></View>
      </View>
      <Text style={s.small}>Mueve la garra manualmente. El agarre se ajusta a la cápsula más cercana.</Text>
      <Text style={s.balance}>✦ {initial.wallet.xp} XP totales · ◈ {initial.wallet.coins} monedas</Text>
      <Text style={s.small}>Todas son una sorpresa. Descubre su calidad al abrirla.</Text>
      <View onLayout={(event) => setSceneWidth(event.nativeEvent.layout.width)} style={{ width: '100%', aspectRatio: 1, alignSelf: 'center', overflow: 'hidden' }}>
        <View testID="claw-scene" style={{ width: 320, height: 320, transform: [{ translateX: (sceneWidth - 320) / 2 }, { translateY: (sceneWidth - 320) / 2 }, { scale }] }}>
          <Image source={clawAssets.chamber} accessible={false} onLoad={() => markLoaded('chamber')} onError={failed} style={s.sceneImage} />
          {game.capsules.filter((capsule) => capsule.id !== game.selected?.id).map((capsule) => <View key={capsule.id} testID={`pile-${capsule.id}`} style={{ position: 'absolute', left: capsule.x - 32, top: capsule.y - 32 }}>
            <CapsuleSprite color={0} onLoad={() => markLoaded('capsules')} onError={failed} />
          </View>)}
          <Animated.View pointerEvents="none" style={[s.landingGlow, { opacity: game.arrival.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 0] }), transform: [{ scale: game.arrival.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.4] }) }] }]} />
          {game.selected && game.phase !== 'opened' ? <Animated.View pointerEvents="none" testID="moving-capsule" style={{ position: 'absolute', left: -32, top: -32, width: 64, height: 64,
            transform: [{ translateX: game.capsuleX }, { translateY: game.capsuleY }, { rotate: game.capsuleTilt.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) }, { scale: game.capsuleScale }] }}>
            <CapsuleSprite color={0} />
          </Animated.View> : null}
          <Animated.View pointerEvents="none" testID="claw-rig" style={{ position: 'absolute', left: -36, top: 0, width: 72, height: 320, transform: [{ translateX: game.x }] }}>
            <Animated.View style={[s.cable, { transform: [
              { translateY: Animated.multiply(Animated.subtract(game.y, 33), 0.5) },
              { scaleY: Animated.subtract(game.y, 32) },
            ] }]} />
            <View style={s.trolley}><View style={s.trolleyShine} /></View>
            <Animated.View testID="claw-head" style={{ position: 'absolute', left: 0, top: 0, width: 72, height: 72, transformOrigin: 'top',
              transform: [{ translateY: game.y }, { rotate: game.sway.interpolate({ inputRange: [-5, 5], outputRange: ['-5deg', '5deg'] }) }] }}>
              <ArticulatedClaw grip={game.grip} onLoad={() => markLoaded('open')} onError={failed} />
            </Animated.View>
          </Animated.View>
          {game.phase === 'delivered' ? <Pressable testID="delivered-capsule" accessibilityRole="button" accessibilityLabel="Abrir cápsula clínica" disabled={networkBusy} onPress={openChallenge} style={s.hatchCapsule} /> : null}
        </View>
      </View>
      <View style={s.console}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mover garra a la izquierda" accessibilityHint="Toca para un paso o mantén pulsado para mover" disabled={!canMove}
          onPress={() => game.move(-1, false)} onLongPress={() => game.move(-1, true)} delayLongPress={180} onPressOut={() => game.stopMove(-1)} onBlur={() => game.stopMove(-1)}
          style={({ pressed }) => [s.arrow, pressed && s.pressed, !canMove && s.disabled]}><Text style={s.arrowText}>◀</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Agarrar cápsula" disabled={!canMove} onPress={game.grab}
          style={({ pressed }) => [s.grab, pressed && s.pressed, !canMove && s.disabled]}><Text style={s.grabText}>AGARRAR</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Mover garra a la derecha" accessibilityHint="Toca para un paso o mantén pulsado para mover" disabled={!canMove}
          onPress={() => game.move(1, false)} onLongPress={() => game.move(1, true)} delayLongPress={180} onPressOut={() => game.stopMove(1)} onBlur={() => game.stopMove(1)}
          style={({ pressed }) => [s.arrow, pressed && s.pressed, !canMove && s.disabled]}><Text style={s.arrowText}>▶</Text></Pressable>
      </View>
      <Text style={s.instructions}>Toca para ajustar · Mantén para mover</Text>
      <Text testID="claw-status" accessible={false} aria-hidden style={s.status}>{status}</Text>
      <Text accessibilityLiveRegion="polite" aria-live="polite" style={s.srOnly}>{game.busy ? 'Recogiendo la cápsula.' : status}</Text>
      {game.interrupted ? <Text style={s.small}>Movimiento interrumpido. La cápsula sigue dentro; puedes intentarlo de nuevo.</Text> : null}
      {assetError ? <AppButton label="Volver a cargar la máquina" onPress={retry} /> : null}
      {game.phase === 'delivered' ? <AppButton label="Abrir cápsula clínica" loading={networkBusy} onPress={openChallenge} /> : null}
      {networkError && !modalVisible ? <><Text accessibilityRole="alert" style={s.small}>{networkError}</Text><AppButton label="Actualizar estado guardado" variant="ghost" onPress={retry} disabled={networkBusy} /></> : null}

      {!game.capsules.length && game.phase === 'ready' ? <AppButton label="Rellenar máquina" loading={networkBusy} onPress={() => void request(async () => { await api('/claw/refill', {}); if (alive.current) retry(); })} /> : null}
      <View style={s.options}>
        <Text style={s.small}>Cápsulas sorpresa disponibles: {game.capsules.length}</Text>
        <View style={s.toggle}><Text style={s.small}>Reducir movimiento</Text>
          <Switch accessibilityLabel="Reducir movimiento" disabled={game.busy} value={reducedMotion} onValueChange={setManualReduced} trackColor={{ true: colors.primary }} />
        </View>
        {systemReduced && manualReduced === null ? <Text style={s.small}>Activado según la preferencia de tu dispositivo. Puedes cambiarlo para esta visita.</Text> : null}
        <Text style={s.small}>Probabilidades en cada apertura: especial {capsuleOdds.especial}%, épica {capsuleOdds.epica}% y legendaria {capsuleOdds.legendaria}%. La posición no cambia la probabilidad y ninguna carga garantiza una legendaria. El sorteo queda guardado al abrir.</Text>
        <Text style={s.small}>El acierto entrega XP y monedas una sola vez por caso. Repetirlo sirve de repaso; equivocarse no resta puntos.</Text>
        <Text style={s.small}>Casos ficticios para estudiar. Dificultad pendiente de validación docente. Monedas internas sin valor real; canjéalas por estilos de avatar en Perfil.</Text>
      </View>
    </ScrollView>
      <Modal transparent visible={modalVisible} animationType="none" onRequestClose={() => router.replace('/arcade')}>
        <Animated.View style={[s.modalBackdrop, { opacity: game.phase === 'opened' ? game.resultEntry : 1 }]}>
          <ScrollView contentContainerStyle={s.modalScroll}>
            {attempt ? <Animated.View accessibilityViewIsModal style={[s.result, { transform: [{ translateY: game.phase === 'opened' ? game.resultEntry.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) : 0 }] }]}>
              {game.selected ? <View style={s.openCapsule}>
                <Animated.View style={[s.revealGlow, { opacity: game.reveal, transform: [{ scale: game.reveal.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) }] }]} />
                <Animated.View style={{ height: 60, overflow: 'hidden', transform: [{ translateY: Animated.multiply(game.reveal, -18) }, { rotate: game.reveal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) }] }}><CapsuleSprite color={capsuleRarities[attempt.rarity].color} size={120} /></Animated.View>
                <Animated.Text style={[s.spark, { opacity: game.reveal, transform: [{ scale: game.reveal.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>✦</Animated.Text>
                <Animated.View style={{ height: 60, overflow: 'hidden', transform: [{ translateY: Animated.multiply(game.reveal, 14) }, { rotate: game.reveal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '6deg'] }) }] }}><View style={{ top: -60 }}><CapsuleSprite color={capsuleRarities[attempt.rarity].color} size={120} /></View></Animated.View>
              </View> : <Text style={s.kicker}>CASO GUARDADO · CONTINÚA DONDE QUEDASTE</Text>}
              {networkError ? <><Text accessibilityRole="alert" style={s.small}>{networkError}</Text><AppButton label="Actualizar estado guardado" variant="ghost" onPress={retry} disabled={networkBusy} /></> : null}
              <ClawChallenge key={attempt.id} attempt={attempt} busy={networkBusy} onAnswer={answerChallenge} onContinue={closeChallenge} />
              <AppButton label="Salir y continuar luego" variant="ghost" onPress={() => router.replace('/arcade')} style={{ alignSelf: 'stretch' }} />
            </Animated.View> : null}
          </ScrollView>
        </Animated.View>
      </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 12, width: '100%', maxWidth: 452, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, headerCopy: { flex: 1, gap: 4 },
  back: { width: 44, height: 44, borderWidth: 2, borderColor: colors.primaryDark, backgroundColor: '#FFFBEE', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 30, color: colors.primaryDark },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, color: colors.primary },
  title: { color: colors.ink, fontWeight: '800', fontSize: 22, lineHeight: 28 },
  body: { color: colors.inkMuted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  small: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },
  balance: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  sceneImage: { width: 320, height: 320, position: 'absolute' },
  claw: { position: 'absolute', width: 72, height: 72, left: 0, top: 0 },
  clawHead: { width: 72, height: 35, overflow: 'hidden' },
  rearProng: { position: 'absolute', left: 28, top: 34, width: 16, height: 14, overflow: 'hidden' },
  leftProng: { position: 'absolute', left: 0, top: 30, width: 25, height: 36, overflow: 'hidden', transformOrigin: [24, 0, 0] },
  rightProng: { position: 'absolute', left: 47, top: 30, width: 25, height: 36, overflow: 'hidden', transformOrigin: [1, 0, 0] },
  cable: { position: 'absolute', top: 35, left: 34, width: 4, height: 1, backgroundColor: colors.ink, borderLeftWidth: 1, borderLeftColor: '#9DA7A0' },
  trolley: { position: 'absolute', top: 17, left: 21, width: 30, height: 27, backgroundColor: '#527D67', borderWidth: 3, borderColor: '#273C34', borderBottomWidth: 5 },
  trolleyShine: { height: 3, backgroundColor: '#8BAC94', margin: 2 },
  hatchCapsule: { position: 'absolute', left: 136, top: 272, width: 48, height: 48 },
  landingGlow: { position: 'absolute', left: 135, top: 274, width: 50, height: 42, borderWidth: 3, borderColor: colors.accent, borderRadius: 12 },
  console: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 3, borderColor: colors.primaryDark, borderBottomWidth: 6, backgroundColor: '#D9CDE5', padding: 14, marginTop: -14 },
  arrow: { minWidth: 56, minHeight: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEE', borderWidth: 3, borderBottomWidth: 6, borderColor: colors.primaryDark },
  arrowText: { fontSize: 27, color: colors.primaryDark },
  grab: { flex: 1, maxWidth: 144, minHeight: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderBottomWidth: 7, borderColor: '#8E6427', backgroundColor: '#F2B85B' },
  grabText: { fontWeight: '900', fontSize: 12, color: '#3D341F', letterSpacing: 0.5 },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 3 }, disabled: { opacity: 0.45 },
  instructions: { fontSize: 12, color: colors.inkMuted, textAlign: 'center' },
  status: { color: colors.primaryDark, fontWeight: '700', textAlign: 'center', fontSize: 14, lineHeight: 20, minHeight: 40 },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(25, 45, 37, 0.6)' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 16, paddingVertical: 40 },
  result: { width: '100%', maxWidth: 520, alignSelf: 'center', borderWidth: 3, borderBottomWidth: 7, borderColor: colors.primary, backgroundColor: '#FFFBEE', padding: 18, gap: 16, alignItems: 'center' },
  openCapsule: { width: 120, height: 140, alignSelf: 'center', marginTop: 24 },
  revealGlow: { position: 'absolute', left: -16, top: -8, width: 152, height: 136, backgroundColor: '#FFF0C9', borderRadius: 70 },
  spark: { position: 'absolute', top: 39, width: 120, textAlign: 'center', fontSize: 30, color: '#A46B18' },
  options: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 10 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
