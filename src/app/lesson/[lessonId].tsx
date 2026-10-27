import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StudyText as Text } from '@/components/study-text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { colors, radii, spacing, typography } from '@/constants/design';
import { useProgress } from '@/context/progress-context';
import { courseSource, formatPages, getLesson, isLessonUnlocked } from '@/data/learning';
import type { Lesson } from '@/data/learning';

function ContrastReferences({ references }: { references: Lesson['references'] }) {
  if (!references.length) return null;
  return <View style={styles.referenceCard}>
    <Text style={styles.feedbackTitle}>Fuentes de contraste · fuera del PDF</Text>
    <Text style={styles.sourceText}>Las páginas indican el pasaje de clase contrastado. Las aclaraciones están identificadas en el texto y no son instrucciones de la docente.</Text>
    {references.map((reference) => <Link key={reference.url} href={reference.url} style={styles.referenceLink}>{reference.title} ↗</Link>)}
  </View>;
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  return <LessonContent key={lessonId} lessonId={lessonId} />;
}

function LessonContent({ lessonId }: { lessonId: string }) {
  const lesson = getLesson(lessonId);
  const { completeLesson, completedLessonIds, loading, error, retry } = useProgress();
  const [reading, setReading] = useState(true);
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [earnedXp, setEarnedXp] = useState(0);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Lección no encontrada</Text>
          <AppButton label="Volver a la ruta" onPress={() => router.replace('/learn')} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading || error || !isLessonUnlocked(lesson.id, completedLessonIds)) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.centered}>
      {loading ? <ActivityIndicator accessibilityLabel="Cargando progreso" /> : error ? <>
        <Text accessibilityRole="alert" style={styles.feedbackText}>{error}</Text>
        <AppButton label="Reintentar" onPress={retry} />
      </> : <>
        <Text style={styles.title}>Lección bloqueada</Text>
        <Text style={styles.feedbackText}>Completa la lección anterior para continuar.</Text>
        <AppButton label="Volver a la ruta" onPress={() => router.replace('/learn')} />
      </>}
    </View></SafeAreaView>;
  }

  if (reading) {
    return <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppButton label="Volver a la ruta" variant="ghost" onPress={() => router.replace('/learn')} />
        <Text style={styles.kicker}>LEE Y COMPRENDE</Text>
        <Text style={styles.prompt}>{lesson.icon} {lesson.title}</Text>
        <Text style={styles.instruction}>{lesson.description}</Text>
        <Text style={styles.sourceText}>{formatPages(lesson.pages)} · {lesson.duration}</Text>
        {lesson.references.length ? <Text style={styles.feedbackText}>Incluye aclaraciones editoriales con fuentes externas, indicadas al final de la lectura.</Text> : null}
        {lesson.concepts.map((concept, index) => <View key={concept.title} style={styles.conceptCard}>
          <Text style={styles.feedbackTitle}>{index + 1}. {concept.title}</Text>
          <Text style={styles.conceptBody}>{concept.body}</Text>
          <Text style={styles.sourceText}>{formatPages(concept.pages)}</Text>
        </View>)}
        <ContrastReferences references={lesson.references} />
        <Text style={styles.sourceText}>Adaptación de {courseSource.title}. {courseSource.author}.</Text>
        <Text style={styles.feedbackText}>{courseSource.note}</Text>
        <Text style={styles.sourceText}>{completedLessonIds.includes(lesson.id) ? 'Repaso: no otorga XP adicional.' : `Completar esta lección por primera vez otorga ${lesson.xp} XP, independientemente de los aciertos.`}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <AppButton label={started ? 'Volver a las preguntas' : `Practicar · ${lesson.questions.length} preguntas`} onPress={() => { setStarted(true); setReading(false); }} />
      </View>
    </SafeAreaView>;
  }

  const question = lesson.questions[questionIndex];
  const isCorrect = selectedIndex === question.correctIndex;
  const progress = finished ? 1 : (questionIndex + 1) / lesson.questions.length;

  const checkAnswer = () => {
    if (selectedIndex === null || checked) return;
    setAnswers((current) => [...current, selectedIndex]);
    setChecked(true);
    if (isCorrect) setCorrectAnswers((current) => current + 1);
  };

  const continueLesson = async () => {
    if (saving) return;
    if (questionIndex === lesson.questions.length - 1) {
      setSaving(true);
      setSaveError('');
      try {
        const result = await completeLesson(lesson.id, answers);
        setEarnedXp(result.earnedXp);
        setCorrectAnswers(result.score);
        setFinished(true);
      } catch (error) { setSaveError(error instanceof Error ? error.message : 'No se pudo guardar. Intenta nuevamente.'); }
      finally { setSaving(false); }
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedIndex(null);
    setChecked(false);
  };

  if (finished) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={styles.resultIcon}>
            <Text style={styles.resultEmoji}>🌟</Text>
          </View>
          <Text style={styles.kicker}>LECCIÓN COMPLETADA</Text>
          <Text style={styles.resultTitle}>{correctAnswers === lesson.questions.length ? '¡Muy bien!' : 'Sigamos practicando'}</Text>
          <Text style={styles.resultText}>
            Acertaste {correctAnswers} de {lesson.questions.length}. Lo importante es recuperar la idea y
            aprender del feedback.
          </Text>
          <View style={styles.rewardCard}>
            <Text style={styles.rewardValue}>+{earnedXp} XP</Text>
            <Text style={styles.rewardLabel}>{earnedXp ? 'por completar la lección' : 'repaso sin XP adicional'}</Text>
          </View>
          <AppButton label="Continuar mi ruta" onPress={() => router.replace('/learn')} style={styles.fullWidth} />
          <AppButton label="Volver al inicio" onPress={() => router.replace('/(app)')} variant="ghost" style={styles.fullWidth} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Salir a la ruta" onPress={() => router.replace('/learn')} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <View accessibilityRole="progressbar" accessibilityLabel="Avance de la lección" accessibilityValue={{ min: 0, max: lesson.questions.length, now: questionIndex + 1 }} style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>{questionIndex + 1}/{lesson.questions.length}</Text>
      </View>

      <ScrollView key={question.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lessonLabelRow}>
          <Text style={styles.lessonIcon}>{lesson.icon}</Text>
          <Text style={styles.lessonLabel}>{lesson.title}</Text>
        </View>

        <Text style={styles.prompt}>{question.prompt}</Text>
        <Text style={styles.instruction}>Selecciona la mejor respuesta</Text>
        <AppButton label="Repasar conceptos" variant="ghost" onPress={() => setReading(true)} />

        <View style={styles.options}>
          {question.options.map((option, index) => {
            const selected = selectedIndex === index;
            const correct = checked && index === question.correctIndex;
            const incorrect = checked && selected && !isCorrect;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: checked }}
                disabled={checked}
                onPress={() => setSelectedIndex(index)}
                style={({ pressed }) => [
                  styles.option,
                  selected && styles.optionSelected,
                  correct && styles.optionCorrect,
                  incorrect && styles.optionIncorrect,
                  pressed && styles.pressed,
                ]}>
                <View
                  style={[
                    styles.optionLetter,
                    selected && styles.optionLetterSelected,
                    correct && styles.optionLetterCorrect,
                    incorrect && styles.optionLetterIncorrect,
                  ]}>
                  <Text style={[styles.optionLetterText, (selected || correct) && styles.optionLetterTextSelected]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {checked ? (
          <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
            <Text style={styles.feedbackTitle}>{isCorrect ? '¡Exacto!' : 'Revisemos la idea.'}</Text>
            {!isCorrect ? <Text style={styles.feedbackText}>Respuesta correcta: {question.options[question.correctIndex]}</Text> : null}
            <Text style={styles.feedbackText}>{question.explanation}</Text>
            <Text style={styles.sourceText}>{formatPages(question.pages)}</Text>
            <ContrastReferences references={lesson.references} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {saveError ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 12 }}>{saveError}</Text> : null}
        <AppButton
          loading={saving}
          label={checked ? (questionIndex === lesson.questions.length - 1 ? 'Guardar resultado' : 'Continuar') : 'Comprobar'}
          onPress={checked ? continueLesson : checkAnswer}
          disabled={selectedIndex === null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  referenceCard: { marginVertical: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.secondarySoft },
  referenceLink: { color: colors.primary, fontSize: 13, lineHeight: 20, textDecorationLine: 'underline', marginTop: spacing.sm },
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 20, paddingTop: spacing.sm, width: '100%', maxWidth: 600, alignSelf: 'center' },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeText: { color: colors.inkMuted, fontSize: 25, lineHeight: 26 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
  stepCount: { color: colors.inkMuted, fontSize: 11, fontWeight: '800' },
  content: { padding: 20, paddingBottom: spacing.xxl, width: '100%', maxWidth: 600, alignSelf: 'center' },
  conceptCard: { padding: 20, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginTop: spacing.md },
  conceptBody: { color: colors.ink, fontSize: 15, lineHeight: 25, marginTop: spacing.sm },
  sourceText: { color: colors.primaryDark, fontSize: 12, lineHeight: 18, marginTop: spacing.sm },
  lessonLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  lessonIcon: { fontSize: 19 },
  lessonLabel: { flex: 1, color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  prompt: { color: colors.ink, fontSize: 25, lineHeight: 33, fontWeight: '700', letterSpacing: -0.5, marginTop: spacing.lg },
  instruction: { color: colors.inkMuted, fontSize: 14, marginTop: spacing.xs },
  options: { gap: spacing.sm, marginTop: spacing.xl },
  option: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  optionSelected: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.successSoft },
  optionIncorrect: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  optionLetter: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F3F2',
  },
  optionLetterSelected: { backgroundColor: colors.secondary },
  optionLetterCorrect: { backgroundColor: colors.success },
  optionLetterIncorrect: { backgroundColor: colors.danger },
  optionLetterText: { color: colors.inkMuted, fontSize: 13, fontWeight: '900' },
  optionLetterTextSelected: { color: colors.white },
  optionText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  feedback: { borderRadius: radii.md, padding: spacing.md, marginTop: spacing.lg },
  feedbackCorrect: { backgroundColor: colors.successSoft },
  feedbackIncorrect: { backgroundColor: colors.dangerSoft },
  feedbackTitle: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  feedbackText: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, marginTop: 4 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, width: '100%', maxWidth: 600, alignSelf: 'center' },
  pressed: { transform: [{ scale: 0.99 }] },
  centered: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  resultContainer: { flexGrow: 1, padding: 20, alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 600, alignSelf: 'center' },
  resultIcon: {
    width: 126,
    height: 126,
    borderRadius: 42,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    transform: [{ rotate: '-4deg' }],
  },
  resultEmoji: { fontSize: 65, transform: [{ rotate: '4deg' }] },
  kicker: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  resultTitle: { color: colors.ink, fontSize: 30, fontWeight: '700', marginTop: spacing.xs, textAlign: 'center' },
  resultText: { color: colors.inkMuted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: spacing.sm, maxWidth: 340 },
  rewardCard: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radii.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginVertical: spacing.xl },
  rewardValue: { color: colors.primaryDark, fontSize: 25, fontWeight: '900' },
  rewardLabel: { color: colors.inkMuted, fontSize: 11, marginTop: 2 },
  fullWidth: { alignSelf: 'stretch', marginTop: spacing.sm },
});
