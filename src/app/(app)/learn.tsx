import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/constants/design';
import { useProgress } from '@/context/progress-context';
import { courseSource, countCompletedLessons, editorialNotes, formatPages, isLessonUnlocked, lessons, modules } from '@/data/learning';

export default function LearnScreen() {
  const { completedLessonIds } = useProgress();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>RUTA DE APRENDIZAJE</Text>
        <Text style={styles.title}>Semiología psicológica</Text>
        <Text style={styles.subtitle}>
          Lee, distingue conceptos y practica. {modules.length} bloques · {lessons.length} lecciones · {lessons.reduce((sum, item) => sum + item.questions.length, 0)} preguntas.
        </Text>

        <View style={styles.sourceCard}>
          <Text style={styles.lessonTitle}>{courseSource.title}</Text>
          <Text style={styles.lessonDescription}>{courseSource.author} · {courseSource.institution}</Text>
          <Text style={styles.lessonDescription}>{courseSource.note}</Text>
          <Text style={styles.duration}>{countCompletedLessons(completedLessonIds)}/{lessons.length} lecciones de esta ruta completadas</Text>
        </View>

        {modules.map((module, moduleIndex) => {
          const moduleLessons = lessons.filter((item) => item.moduleId === module.id);
          const completedCount = moduleLessons.filter((item) => completedLessonIds.includes(item.id)).length;
          return <View key={module.id}>
        <View style={styles.moduleCard}>
          <View style={styles.moduleCopy}>
            <Text style={styles.moduleKicker}>BLOQUE {moduleIndex + 1}</Text>
            <Text style={styles.moduleTitle}>{module.title}</Text>
          </View>
          <Text style={styles.moduleProgress}>{completedCount}/{moduleLessons.length}</Text>
        </View>

        <View style={styles.path}>
          {moduleLessons.map((lesson, index) => {
            const completed = completedLessonIds.includes(lesson.id);
            const unlocked = isLessonUnlocked(lesson.id, completedLessonIds);
            return (
              <View key={lesson.id} style={styles.pathItem}>
                {index < moduleLessons.length - 1 ? (
                  <View style={[styles.connector, completed && styles.connectorCompleted]} />
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !unlocked }}
                  disabled={!unlocked}
                  onPress={() =>
                    router.push({ pathname: '/lesson/[lessonId]', params: { lessonId: lesson.id } })
                  }
                  style={({ pressed }) => [
                    styles.lessonRow,
                    completed && styles.lessonCompleted,
                    !unlocked && styles.lessonLocked,
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.node,
                      completed && styles.nodeCompleted,
                      !unlocked && styles.nodeLocked,
                    ]}>
                    <Text style={[styles.nodeText, completed && styles.nodeTextCompleted]}>{completed ? '✓' : String(lessons.indexOf(lesson) + 1).padStart(2, '0')}</Text>
                  </View>
                  <View style={styles.lessonCopy}>
                    <View style={styles.lessonTitleRow}>
                      <Text style={[styles.lessonTitle, !unlocked && styles.muted]}>{lesson.title}</Text>
                      <Text style={styles.xp}>{completed ? 'REPASAR' : `+${lesson.xp} XP`}</Text>
                    </View>
                    <Text style={[styles.lessonDescription, !unlocked && styles.muted]}>
                      {lesson.description}
                    </Text>
                    <Text style={styles.duration}>{lesson.duration} · {formatPages(lesson.pages)}</Text>
                    {!unlocked ? <Text style={styles.duration}>Bloqueada · completa la anterior</Text> : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
          </View>;
        })}

        <Text style={styles.notesHeading}>NOTAS EDITORIALES DE LA APP</Text>
        {editorialNotes.map((topic) => <View key={topic.title} style={styles.nextModule}>
          <Text style={styles.nextModuleIcon}>📖</Text>
          <View style={styles.nextCopy}>
            <Text style={styles.nextTitle}>{topic.title}</Text>
            <Text style={styles.nextText}>{topic.reason}</Text>
            <Text style={styles.duration}>{formatPages(topic.pages)}</Text>
          </View>
        </View>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: spacing.xxl, width: '100%', maxWidth: 600, alignSelf: 'center' },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: typography.title, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6, marginTop: 8 },
  subtitle: { color: colors.inkMuted, fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  sourceCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, marginTop: 20 },
  moduleCopy: { flex: 1, marginRight: spacing.sm },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    padding: 20,
    marginTop: spacing.xl,
  },
  moduleKicker: { color: colors.primaryDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  moduleTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700', marginTop: 6 },
  moduleProgress: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '900',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  path: { marginTop: spacing.lg },
  pathItem: { position: 'relative', paddingBottom: spacing.md },
  connector: {
    position: 'absolute',
    left: 36,
    top: 50,
    bottom: -16,
    width: 3,
    backgroundColor: colors.border,
  },
  connectorCompleted: { backgroundColor: colors.primary },
  lessonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  lessonCompleted: { borderColor: '#CDDCCD', backgroundColor: '#F6F9F3' },
  lessonLocked: { backgroundColor: '#F2F3EF' },
  node: {
    width: 40,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#D8E3D8',
  },
  nodeCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
  nodeLocked: { backgroundColor: '#EEF1F0', borderColor: colors.border },
  nodeText: { color: colors.primaryDark, fontSize: 15, fontWeight: '700' },
  nodeTextCompleted: { color: colors.white },
  lessonCopy: { flex: 1 },
  lessonTitleRow: { alignItems: 'flex-start', gap: 5 },
  lessonTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  lessonDescription: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  duration: { color: colors.inkFaint, fontSize: 11, fontWeight: '700', marginTop: spacing.xs },
  xp: { color: colors.secondary, fontSize: 10, fontWeight: '900', marginTop: 3 },
  muted: { color: colors.inkFaint },
  pressed: { transform: [{ scale: 0.99 }] },
  nextModule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  nextModuleIcon: { fontSize: 28 },
  nextCopy: { flex: 1 },
  notesHeading: { color: colors.inkMuted, fontSize: 12, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  nextTitle: { color: colors.inkMuted, fontSize: 14, fontWeight: '800' },
  nextText: { color: colors.inkMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
});
