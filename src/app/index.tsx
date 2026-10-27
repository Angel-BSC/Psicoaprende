import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { colors, radii, spacing, typography } from '@/constants/design';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundShapeOne} />
      <View style={styles.backgroundShapeTwo} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>ψ</Text>
        </View>
        <Text style={styles.brand}>PsicoAprende</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.illustration}>
          <View style={styles.brainBubble}>
            <Text style={styles.brain}>🧠</Text>
          </View>
          <View style={styles.sparkOne} />
          <View style={styles.sparkTwo} />
        </View>

        <Text style={styles.eyebrow}>ESTUDIA A TU RITMO</Text>
        <Text style={styles.title}>Semiología que se{`\n`}entiende y se practica</Text>
        <Text style={styles.subtitle}>
          Repasa tu material de clase con conceptos breves, preguntas explicadas y referencias al PDF de semiología.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="Crear mi cuenta" onPress={() => router.push('/register')} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
          <Text style={styles.loginText}>Ya tengo una cuenta</Text>
        </Pressable>
        <Text style={styles.disclaimer}>Contenido educativo. No reemplaza atención profesional.</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  content: { flexGrow: 1, paddingHorizontal: 24, width: '100%', maxWidth: 540, alignSelf: 'center' },
  backgroundShapeOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.mintSoft,
    top: -110,
    right: -100,
  },
  backgroundShapeTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.lilacSoft,
    bottom: 40,
    left: -110,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  logoText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  brand: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg },
  illustration: {
    width: 164,
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  brainBubble: {
    width: 144,
    height: 144,
    borderRadius: 48,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
    transform: [{ rotate: '-3deg' }],
  },
  brain: { fontSize: 72, transform: [{ rotate: '3deg' }] },
  sparkOne: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    top: 2,
    right: 4,
  },
  sparkTwo: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    bottom: 12,
    left: 2,
    transform: [{ rotate: '35deg' }],
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: typography.hero,
    lineHeight: 39,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 350,
  },
  actions: { gap: spacing.sm, paddingBottom: spacing.lg },
  loginButton: {
    minHeight: 54,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  loginText: { color: colors.primaryDark, fontSize: typography.body, fontWeight: '800' },
  disclaimer: {
    color: colors.inkFaint,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.75 },
});
