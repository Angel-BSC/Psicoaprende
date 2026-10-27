import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { colors, radii, spacing, typography } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useProgress } from '@/context/progress-context';
import { countCompletedLessons } from '@/data/learning';
import { useProfile } from '@/context/profile-context';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ProfileSettings } from '@/components/profile-settings';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, refresh } = useProfile();
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const signOut = async () => {
    setLoggingOut(true);
    setLogoutError('');
    try { await logout(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : 'No se pudo cerrar sesión.'); }
    finally { setLoggingOut(false); }
  };
  const { xp, streak, completedLessonIds } = useProgress();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>TU ESPACIO PERSONAL</Text>
        <Text style={styles.pageTitle}>Tu perfil</Text>
        <Text style={styles.subtitle}>Un registro de lo que vas construyendo.</Text>

        <View style={styles.profileCard}>
          <ProfileAvatar name={user?.name ?? ''} itemId={profile.equippedItem} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user?.role === 'professional' ? 'Profesional' : 'Estudiante'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tu actividad</Text>
        <View style={styles.statsCard}>
          <ProfileStat value={`${xp}`} label="Experiencia total" suffix="XP" />
          <View style={styles.divider} />
          <ProfileStat value={`${streak}`} label="Racha actual" suffix="días" />
          <View style={styles.divider} />
          <ProfileStat value={`${countCompletedLessons(completedLessonIds)}`} label="De esta ruta" suffix="lecciones" />
        </View>

        <Text style={styles.educationText}>La experiencia total incluye las lecciones y los retos clínicos de la máquina.</Text>
        <Text style={styles.sectionTitle}>◈ {profile.coins} monedas</Text>
        <Text style={styles.educationText}>Tu saldo disponible para personalizar el perfil. Consigue monedas resolviendo casos clínicos en la máquina.</Text>
        <Text style={styles.sectionTitle}>Tu espacio de estudio</Text>
        <ProfileSettings />

        <View style={styles.educationNote}>
          <Text accessible={false} style={styles.educationIcon}>✧</Text>
          <Text style={styles.educationText}>
            PsicoAprende ofrece educación, no diagnóstico ni tratamiento. Si necesitas ayuda,
            consulta a un profesional de salud mental.
          </Text>
        </View>

        <AppButton label="Uso de mis datos" variant="ghost" onPress={() => router.push('/privacy')} style={{ marginBottom: 12 }} />
        {logoutError ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 12 }}>{logoutError}</Text> : null}
        <AppButton label="Cerrar sesión" onPress={signOut} loading={loggingOut} variant="ghost" />
        <Text style={styles.version}>PsicoAprende · prototipo 0.1</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileStat({ value, label, suffix }: { value: string; label: string; suffix: string }) {
  return (
    <View style={styles.profileStat}>
      <View style={styles.valueRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statSuffix}>{suffix}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: spacing.xxl, width: '100%', maxWidth: 600, alignSelf: 'center' },
  kicker: { color: colors.primary, fontSize: 10, letterSpacing: 1.6, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.inkMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  pageTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '700', letterSpacing: -0.6, marginTop: 8 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.secondary, fontSize: 28, fontWeight: '900' },
  name: { color: colors.ink, fontSize: 22, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  email: { color: colors.inkMuted, fontSize: 13, marginTop: 5, textAlign: 'center' },
  roleBadge: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 13,
    paddingVertical: 6,
    marginTop: spacing.sm,
  },
  roleText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
  },
  profileStat: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  valueRow: { alignItems: 'center', gap: 3 },
  statValue: { color: colors.ink, fontSize: 23, fontWeight: '700' },
  statSuffix: { color: colors.secondary, fontSize: 11, fontWeight: '600' },
  statLabel: { color: colors.inkMuted, fontSize: 10, textAlign: 'center', marginTop: 5 },
  divider: { width: 1, backgroundColor: colors.border },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  settingIcon: { fontSize: 15, width: 31, color: colors.primaryDark },
  settingLabel: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '600', marginRight: 8 },
  settingValue: { color: colors.inkMuted, fontSize: 11, flexShrink: 1 },
  horizontalDivider: { height: 1, backgroundColor: colors.border, marginLeft: 47 },
  educationNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginVertical: spacing.lg,
  },
  educationIcon: { fontSize: 22, color: colors.secondary },
  educationText: { flexShrink: 1, color: colors.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  version: { color: colors.inkFaint, fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
