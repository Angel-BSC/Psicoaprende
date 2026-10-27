import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { colors, radii, spacing } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/context/profile-context';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useProgress } from '@/context/progress-context';
import { countCompletedLessons, formatPages, lessons, modules } from '@/data/learning';

export default function HomeScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { xp, dailyXp, streak, dailyGoal, completedLessonIds } = useProgress();
  const completedCount = countCompletedLessons(completedLessonIds);
  const nextLesson = lessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? lessons[0];
  const courseComplete = completedCount === lessons.length;
  const firstName = user?.name.trim().split(/\s+/)[0] || 'Estudiante';
  const goalProgress = dailyGoal > 0 ? Math.min(Math.max(dailyXp / dailyGoal, 0), 1) : 0;
  const nextModule = modules.find((module) => module.id === nextLesson.moduleId);
  const lessonNumber = lessons.indexOf(nextLesson) + 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.brand}>PSICOAPRENDE</Text>
            <Text style={styles.greeting}>Hola, {firstName}.</Text>
            <Text style={styles.headerSubtitle}>Qué bueno volver a aprender.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
            <ProfileAvatar name={user?.name ?? ''} itemId={profile.equippedItem} size={48} />
          </Pressable>
        </View>

        <View style={styles.studyCard}>
          <View style={styles.studyTop}>
            <View style={styles.studyLabel}>
              <View style={styles.dot} />
              <Text style={styles.eyebrow}>{courseComplete ? 'TU ESPACIO DE REPASO' : 'TU MOMENTO DE ESTUDIO'}</Text>
            </View>
            <Text accessible={false} style={styles.spark}>✧</Text>
          </View>
          <Text style={styles.studyTitle}>{courseComplete ? 'Lo aprendido\nmerece volver.' : 'Hoy, una idea\nmás clara.'}</Text>
          <Text style={styles.studySubtitle}>Pequeñas sesiones para comprender mejor la psicología.</Text>

          <View style={styles.lessonCard}>
            <View style={styles.lessonHeading}>
              <View style={styles.lessonNumber}><Text style={styles.lessonNumberText}>{String(lessonNumber).padStart(2, '0')}</Text></View>
              <View style={styles.lessonCopy}>
                <Text style={styles.lessonEyebrow}>{courseComplete ? 'VUELVE A LOS CONCEPTOS' : 'CONTINÚA DONDE TE QUEDASTE'}</Text>
                <Text style={styles.moduleName}>{nextModule?.title}</Text>
              </View>
            </View>
            <Text style={styles.lessonTitle}>{nextLesson.title}</Text>
            <Text style={styles.lessonDescription}>{nextLesson.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{nextLesson.duration}</Text>
              <Text style={styles.meta}>{nextLesson.questions.length} preguntas</Text>
              <Text style={styles.xpBadge}>{courseComplete ? 'Repaso' : `✦ ${nextLesson.xp} XP`}</Text>
            </View>
            <AppButton label={courseComplete ? 'Repasar la primera lección' : 'Continuar mi aprendizaje'}
              onPress={() => router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: nextLesson.id } })} />
            <Text style={styles.source}>{formatPages(nextLesson.pages)} · Material de clase</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cada paso cuenta</Text>
          <Text style={styles.sectionAside}>Tu progreso</Text>
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="✦" value={`${xp}`} label="XP acumulada" tone="purple" />
          <StatCard icon="↗" value={`${streak}`} label={streak === 1 ? 'día de racha' : 'días de racha'} tone="amber" />
          <StatCard icon="✓" value={`${completedCount}/${lessons.length}`} label="lecciones" tone="green" />
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalTop}>
            <Text style={styles.goalTitle}>Tu objetivo de hoy</Text>
            <Text style={styles.goalValue}>{dailyXp} / {dailyGoal} XP</Text>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel="Objetivo diario"
            accessibilityValue={{ min: 0, max: Math.max(dailyGoal, 1), now: Math.min(Math.max(dailyXp, 0), Math.max(dailyGoal, 1)), text: `${dailyXp} de ${dailyGoal} XP` }}
            style={styles.track}>
            <View style={[styles.trackFill, { width: `${goalProgress * 100}%` }]} />
          </View>
          <Text style={styles.goalHint}>{dailyXp >= dailyGoal ? 'Objetivo cumplido. Puedes seguir a tu ritmo.' : `Faltan ${dailyGoal - dailyXp} XP. Avanza a tu ritmo.`}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu ruta de estudio</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Explorar la ruta de semiología"
          onPress={() => router.push('/learn')}
          style={({ pressed }) => [styles.routeCard, pressed && styles.pressed]}>
          <View style={styles.routeTop}>
            <Text style={styles.routeEyebrow}>MATERIAL DE TU ASIGNATURA</Text>
            <Text accessible={false} style={styles.routeArrow}>↗</Text>
          </View>
          <Text style={styles.routeTitle}>Semiología psicológica</Text>
          <Text style={styles.routeDescription}>{modules.length} bloques · {lessons.length} lecciones para conectar conceptos y practicar.</Text>
          <View style={styles.moduleTrack} accessible accessibilityLabel={`Progreso por bloques: ${modules.map((module) => {
            const items = lessons.filter((lesson) => lesson.moduleId === module.id);
            return `${module.title}, ${items.filter((lesson) => completedLessonIds.includes(lesson.id)).length} de ${items.length}`;
          }).join('; ')}`}>
            {modules.map((module) => {
              const items = lessons.filter((lesson) => lesson.moduleId === module.id);
              const done = items.filter((lesson) => completedLessonIds.includes(lesson.id)).length;
              return <View key={module.id} style={styles.moduleSegment}>
                <View style={[styles.moduleFill, { width: `${items.length ? done / items.length * 100 : 0}%` }]} />
              </View>;
            })}
          </View>
          <Text style={styles.routeLink}>Explorar los bloques →</Text>
        </Pressable>

        <View style={styles.studyNote}>
          <Text accessible={false} style={styles.noteMark}>“</Text>
          <View style={styles.noteCopy}>
            <Text style={styles.noteTitle}>Comprender antes que memorizar.</Text>
            <Text style={styles.noteBody}>Lee, intenta responder y vuelve a la explicación. Equivocarte también forma parte del estudio.</Text>
          </View>
        </View>
        <Text style={styles.disclaimer}>Apoyo académico, no herramienta diagnóstica. Encontrarás las referencias y aclaraciones editoriales dentro de cada lección.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, tone }: { icon: string; value: string; label: string; tone: 'purple' | 'amber' | 'green' }) {
  return <View style={styles.statCard}>
    <Text accessible={false} style={[styles.statIcon, styles[tone]]}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: spacing.xxl, width: '100%', maxWidth: 600, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs, marginBottom: spacing.lg },
  headerCopy: { flex: 1 },
  brand: { color: colors.primary, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  greeting: { color: colors.ink, fontSize: 26, letterSpacing: -0.6, fontWeight: '700', marginTop: 8 },
  headerSubtitle: { color: colors.inkMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.secondarySoft, borderColor: '#DDD5E7', borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.secondary, fontSize: 18, fontWeight: '700' },
  studyCard: { backgroundColor: colors.primarySoft, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: '#D8E3D8' },
  studyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  studyLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  eyebrow: { color: colors.primaryDark, fontSize: 9, letterSpacing: 1, fontWeight: '800', flexShrink: 1 },
  spark: { color: colors.primary, fontSize: 28 },
  studyTitle: { color: colors.ink, fontSize: 33, lineHeight: 38, letterSpacing: -1.2, fontWeight: '700', marginTop: 8 },
  studySubtitle: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 20, maxWidth: 300 },
  lessonCard: { backgroundColor: '#FFFEFA', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#DCE5D9' },
  lessonHeading: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  lessonNumber: { minWidth: 36, minHeight: 38, padding: 6, borderRadius: 10, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  lessonNumberText: { color: colors.primaryDark, fontSize: 16, fontWeight: '700' },
  lessonCopy: { flex: 1 },
  lessonEyebrow: { color: colors.primaryDark, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  moduleName: { color: colors.inkMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  lessonTitle: { color: colors.ink, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, fontWeight: '700', marginTop: 18 },
  lessonDescription: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginVertical: 18 },
  meta: { color: colors.inkMuted, fontSize: 11, fontWeight: '500' },
  xpBadge: { color: colors.secondary, backgroundColor: colors.secondarySoft, fontSize: 11, fontWeight: '700', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8 },
  source: { color: colors.inkMuted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  sectionAside: { color: colors.inkMuted, fontSize: 11 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center' },
  statIcon: { width: 28, height: 28, textAlign: 'center', lineHeight: 28, borderRadius: 9, overflow: 'hidden', fontSize: 17, fontWeight: '700' },
  purple: { color: colors.secondary, backgroundColor: colors.secondarySoft },
  amber: { color: '#86622C', backgroundColor: colors.accentSoft },
  green: { color: colors.primary, backgroundColor: colors.primarySoft },
  statValue: { color: colors.ink, fontSize: 21, fontWeight: '700', letterSpacing: -0.5, marginTop: 8 },
  statLabel: { color: colors.inkMuted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 3 },
  goalCard: { padding: 18, borderRadius: radii.md, backgroundColor: '#F0EFE8', marginTop: 12 },
  goalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  goalTitle: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  goalValue: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#DDE2D6', marginTop: 12, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  goalHint: { color: colors.inkMuted, fontSize: 11, lineHeight: 17, marginTop: 9 },
  routeCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20 },
  routeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  routeEyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 0.9, flexShrink: 1 },
  routeArrow: { color: colors.primary, fontSize: 23 },
  routeTitle: { color: colors.ink, fontSize: 20, fontWeight: '700', marginTop: 6 },
  routeDescription: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  moduleTrack: { flexDirection: 'row', gap: 5, marginTop: 18, marginBottom: 14 },
  moduleSegment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  moduleFill: { height: '100%', backgroundColor: colors.primary },
  routeLink: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  studyNote: { flexDirection: 'row', gap: 12, paddingHorizontal: 4, marginTop: 26 },
  noteMark: { color: colors.secondary, fontSize: 40, lineHeight: 42 },
  noteCopy: { flex: 1 },
  noteTitle: { color: colors.ink, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  noteBody: { color: colors.inkMuted, fontSize: 12, lineHeight: 19, marginTop: 4 },
  disclaimer: { color: colors.inkMuted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 26, paddingHorizontal: 12 },
  pressed: { opacity: 0.8 },
});
