import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { FormField } from '@/components/form-field';
import { colors, spacing, typography } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { validEmail } from '@/lib/validation';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    if (!validEmail(email) || !password || password.length > 128) {
      setError('Ingresa un correo válido y tu contraseña.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" disabled={loading} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text accessibilityLabel="Cerebro de PsicoAprende" style={styles.icon}>🧠</Text>
          </View>
          <Text style={styles.brand}>PSICOAPRENDE</Text>
          <Text style={styles.title}>Qué bueno verte</Text>
          <Text style={styles.subtitle}>Tu espacio para comprender, practicar y seguir aprendiendo.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Entra a tu espacio de estudio</Text>
          <FormField
            label="Correo electrónico"
            placeholder="nombre@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            maxLength={254}
            autoCorrect={false}
            editable={!loading}
          />
          <FormField
            label="Contraseña"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            maxLength={128}
            editable={!loading}
            onSubmitEditing={submit}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <AppButton label="Iniciar sesión" onPress={submit} loading={loading} />
        </View>

        <Pressable accessibilityRole="button" disabled={loading} onPress={() => router.replace('/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            ¿Aún no tienes cuenta? <Text style={styles.registerStrong}>Regístrate</Text>
          </Text>
        </Pressable>
        <Text style={styles.demoNote}>A tu ritmo, una idea más clara cada día.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: 20, paddingBottom: 32, width: '100%', maxWidth: 520, alignSelf: 'center' },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { color: colors.ink, fontSize: 32, lineHeight: 34, marginTop: -3 },
  header: { alignItems: 'center', marginTop: spacing.md },
  brand: { color: colors.primary, fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 12 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#D8E3D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  icon: { fontSize: 48 },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.7, textAlign: 'center' },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  form: { gap: spacing.md, marginTop: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 20 },
  formTitle: { color: colors.ink, fontSize: 15, fontWeight: '600', lineHeight: 21, marginBottom: 2 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  demoNote: { color: colors.inkFaint, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  registerLink: { marginTop: 8, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.md },
  registerText: { color: colors.inkMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  registerStrong: { color: colors.primaryDark, fontWeight: '800' },
});
