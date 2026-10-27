import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clawAssets } from '@/constants/claw-assets';
import { colors } from '@/constants/design';

export default function ArcadeScreen() {
  const [failed, setFailed] = useState(false);
  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={s.content}>
      <Pressable accessibilityRole="button" accessibilityLabel="Entrar en la máquina de cápsulas" onPress={() => router.push('/claw')} style={({ pressed }) => [s.entry, pressed && { opacity: 0.85 }]}>
        {failed ? <Text style={s.fallback}>Entrar en la máquina de cápsulas →</Text> : <Image source={clawAssets.exterior} accessible={false} onError={() => setFailed(true)} style={s.art} resizeMode="contain" />}
      </Pressable>
      <Text style={s.note}>CÁPSULAS DE CONOCIMIENTO</Text>
      <Text style={s.body}>Todas las cápsulas guardan una sorpresa. Mueve la garra y ábrela para descubrir su calidad y un caso clínico. A mayor rareza, mayor desafío y recompensa por acertar.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 430, alignSelf: 'center', padding: 16, paddingBottom: 32, gap: 12 },
  // Size the frame, not the image: RN Web otherwise retains the PNG's intrinsic height.
  entry: { width: '100%', aspectRatio: 2 / 3, justifyContent: 'center' },
  art: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  fallback: { color: colors.primaryDark, fontSize: 22, padding: 24 },
  note: { color: colors.primaryDark, fontWeight: '800', fontSize: 10, letterSpacing: 1.5, textAlign: 'center' },
  body: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
