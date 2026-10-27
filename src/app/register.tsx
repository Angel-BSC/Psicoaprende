import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { FormField } from '@/components/form-field';
import { colors, spacing, typography } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { registrationErrors } from '@/lib/validation';
import { ApiError } from '@/lib/api';

type Errors = Record<string, string>;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    const nextErrors = registrationErrors({ name, email, password, acceptedPrivacy: acceptedTerms });
    if (password !== confirmation) nextErrors.confirmation = 'Las contraseñas no coinciden.';
    setSubmitError('');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await register({ name, email, password, acceptedPrivacy: acceptedTerms });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" disabled={loading} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <Text style={styles.kicker}>TU PRIMER PASO</Text>
          <Text style={styles.title}>Crea tu perfil</Text>
          <Text style={styles.subtitle}>
            Tu cuenta de estudiante para guardar el progreso y preparar tus propios exámenes.
          </Text>

          <View style={styles.form}>
            <FormField
              label="Nombre"
              placeholder="¿Cómo quieres que te llamemos?"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              maxLength={80}
              editable={!loading}
              error={errors.name}
            />
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
              error={errors.email}
            />
            <FormField
              label="Contraseña"
              placeholder="De 12 a 128 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              maxLength={128}
              editable={!loading}
              error={errors.password}
            />
            <FormField label="Confirmar contraseña" placeholder="Repite tu contraseña"
              value={confirmation} onChangeText={setConfirmation} secureTextEntry
              autoComplete="new-password" maxLength={128} editable={!loading} error={errors.confirmation} />

            <Pressable
              accessibilityRole="checkbox"
              aria-checked={acceptedTerms}
              accessibilityState={{ checked: acceptedTerms }}
              disabled={loading}
              onPress={() => setAcceptedTerms((current) => !current)}
              style={styles.termsRow}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]}>
                {acceptedTerms ? <Text style={styles.check}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>
                He leído y acepto el uso de mis datos para crear la cuenta y guardar mi aprendizaje.
              </Text>
            </Pressable>
            <Pressable accessibilityRole="link" disabled={loading} onPress={() => router.push('/privacy')}>
              <Text style={styles.loginLinkStrong}>Leer el uso de datos</Text>
            </Pressable>
            {errors.terms ? <Text style={styles.termsError}>{errors.terms}</Text> : null}

            {submitError ? <Text accessibilityRole="alert" style={styles.termsError}>{submitError}</Text> : null}
            <AppButton label="Crear cuenta" onPress={submit} loading={loading} />
          </View>

          <Pressable disabled={loading} onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta? <Text style={styles.loginLinkStrong}>Inicia sesión</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: spacing.xxl, width: '100%', maxWidth: 520, alignSelf: 'center' },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  backText: { color: colors.ink, fontSize: 32, lineHeight: 34, marginTop: -3 },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '700', marginTop: spacing.xs },
  subtitle: { color: colors.inkMuted, fontSize: typography.body, lineHeight: 23, marginTop: spacing.xs },
  form: { gap: spacing.md, marginTop: spacing.xl },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  check: { color: colors.white, fontSize: 14, fontWeight: '900' },
  termsText: { flex: 1, color: colors.inkMuted, fontSize: 13, lineHeight: 19 },
  termsError: { color: colors.danger, fontSize: 12, marginTop: -spacing.xs },
  loginLink: { alignItems: 'center', paddingVertical: spacing.lg },
  loginLinkText: { color: colors.inkMuted, fontSize: 14 },
  loginLinkStrong: { color: colors.primaryDark, fontWeight: '800' },
});
