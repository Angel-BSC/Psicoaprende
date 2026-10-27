import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, View } from 'react-native';
import { StudyText as Text } from '@/components/study-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { examStyles as s } from '@/constants/exam-styles';
import { useAuth } from '@/context/auth-context';
import { formatPages } from '@/data/learning';
import { api } from '@/lib/api';
import { formatExamTime } from '@/lib/exams';
import type { ExamAttempt } from '@/lib/exams';

export default function ExamScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const { user } = useAuth();
  return <ExamContent key={`${user?.id}-${examId}`} id={examId} />;
}

function ExamContent({ id }: { id: string }) {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const latest = useRef<ExamAttempt | null>(null);
  const working = useRef(false);
  const alive = useRef(false);
  const time = useRef({ server: 0, local: 0 });
  const lastRead = useRef(0);
  const remaining = useCallback(() => {
    const value = latest.current;
    if (!value || value.finishedAt) return 0;
    const estimatedServerTime = time.current.server + (performance.now() - time.current.local);
    return Math.max(0, Math.ceil((Date.parse(value.expiresAt) - estimatedServerTime) / 1000));
  }, []);
  const accept = useCallback((value: ExamAttempt) => {
    if (!alive.current || (latest.current && latest.current.revision > value.revision)) return;
    time.current = { server: Date.parse(value.serverTime), local: performance.now() };
    latest.current = value;
    setAttempt(value); setSeconds(remaining());
  }, [remaining]);
  const read = useCallback(async () => {
    if (working.current) return;
    working.current = true; setBusy(true); lastRead.current = performance.now();
    try { accept(await api<ExamAttempt>(`/exams/${id}`)); if (alive.current) setError(''); }
    catch (e) { if (alive.current) setError(e instanceof Error ? e.message : 'No se pudo recuperar el examen.'); }
    finally { working.current = false; if (alive.current) setBusy(false); }
  }, [accept, id]);
  useEffect(() => {
    alive.current = true;
    // Initial server synchronization also marks controls busy until it completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void read();
    const interval = setInterval(() => {
      const value = latest.current;
      if (!value || value.finishedAt) return;
      const left = remaining();
      setSeconds(left);
      const sinceRead = performance.now() - lastRead.current;
      if (sinceRead >= (left === 0 ? 5000 : 15000)) void read();
    }, 1000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void read(); });
    return () => { alive.current = false; clearInterval(interval); subscription.remove(); };
  }, [read, remaining]);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [index, attempt?.finishedAt]);
  const mutate = async (path: string, body: unknown) => {
    if (working.current) return;
    working.current = true; setBusy(true); setError('');
    try { accept(await api<ExamAttempt>(`/exams/${id}/${path}`, body)); }
    catch (e) { if (alive.current) setError(`${e instanceof Error ? e.message : 'No se pudo guardar.'} Revisa el estado guardado antes de continuar.`); }
    finally { working.current = false; if (alive.current) { setBusy(false); setConfirming(false); } }
  };
  const question = attempt?.questions[index];
  const answered = attempt ? Object.keys(attempt.answers).length : 0;
  const frozen = busy || seconds === 0;

  return <SafeAreaView style={s.safe}>
    <ScrollView ref={scroll} contentContainerStyle={s.content}>
      <AppButton label="Volver a mis exámenes" variant="ghost" disabled={busy} onPress={() => router.replace('/exams')} />
      <Text style={s.kicker}>{attempt?.finishedAt ? 'TU RESULTADO' : 'EXAMEN PERSONALIZADO'}</Text>
      {error ? <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text><AppButton label="Recargar estado guardado" variant="ghost" disabled={busy} onPress={() => void read()} /></View> : null}
      {!attempt && !error ? <ActivityIndicator accessibilityLabel="Recuperando examen" /> : null}
      {attempt?.finishedAt ? <>
        <View style={[s.card, s.soft]}>
          <Text style={s.title}>Una oportunidad para repasar</Text>
          <Text style={s.score}>{attempt.score} / {attempt.questionCount}</Text>
          <Text style={s.body}>{Math.round((attempt.score ?? 0) / attempt.questionCount * 100)} % de aciertos · {attempt.questionCount - answered} sin responder</Text>
          <Text style={s.small}>{attempt.finishReason === 'expired' ? 'El tiempo terminó. Se corrigieron las respuestas recibidas antes del vencimiento.' : 'Examen entregado. Resultado guardado en tu cuenta.'} No modifica tu XP ni la ruta.</Text>
        </View>
        <Text style={s.heading}>Revisa tus respuestas</Text>
        {attempt.questions.map((q, i) => {
          const response = attempt.answers[q.id];
          return <View key={q.id} style={s.card}>
            <Text style={s.small}>{i + 1}. {q.lessonTitle}</Text>
            <Text style={s.questionText}>{q.prompt}</Text>
            <Text style={response === q.correctIndex ? s.success : s.error}>{response === undefined ? 'Sin responder' : response === q.correctIndex ? 'Respuesta correcta' : 'Respuesta incorrecta'}</Text>
            <Text style={s.body}>Tu respuesta: {response === undefined ? '—' : q.options[response]}</Text>
            <Text style={s.success}>Correcta: {q.correctIndex === undefined ? '—' : q.options[q.correctIndex]}</Text>
            <Text style={s.body}>{q.explanation}</Text>
            {q.pages ? <Text style={s.small}>{formatPages(q.pages)}</Text> : null}
            {q.references?.length ? <Text style={s.small}>Fuentes de contraste fuera del PDF; las páginas identifican el pasaje de clase.</Text> : null}
            {q.references?.map((ref) => <Link key={ref.url} href={ref.url} style={s.link}>{ref.title} ↗</Link>)}
          </View>;
        })}
      </> : attempt && question ? <>
        <View style={[s.card, s.soft]}>
          <Text style={s.heading}>Tu tiempo de práctica</Text>
          <Text style={s.timer} accessibilityLabel={`Tiempo restante: ${formatExamTime(seconds)}`}>{formatExamTime(seconds)}</Text>
          <Text style={s.small}>{answered}/{attempt.questionCount} respuestas guardadas · El reloj no se pausa al salir.</Text>
          {seconds === 0 ? <Text accessibilityRole="alert" style={s.body}>Tiempo agotado. Confirmando el resultado con el servidor… Si estás sin conexión, vuelve a conectarte y recarga el estado.</Text> : null}
        </View>
        <View style={s.row}>{attempt.questions.map((q, i) => <Pressable key={q.id} accessibilityRole="button"
          accessibilityLabel={`Pregunta ${i + 1}${attempt.answers[q.id] !== undefined ? ', respondida' : ', sin responder'}`}
          aria-selected={index === i} accessibilityState={{ selected: index === i, disabled: busy }} disabled={busy}
          onPress={() => { setIndex(i); setConfirming(false); }} style={[s.chip, index === i && s.selected]}>
          <Text style={s.chipText}>{i + 1}{attempt.answers[q.id] !== undefined ? ' ✓' : ''}</Text>
        </Pressable>)}</View>
        <Text style={s.small}>Pregunta {index + 1} de {attempt.questionCount} · {question.lessonTitle}</Text>
        <Text style={s.heading}>{question.prompt}</Text>
        <Text style={s.small}>Selecciona una respuesta. Se confirmará cuando esté guardada.</Text>
        {question.options.map((option, i) => <Pressable key={i} accessibilityRole="radio"
          aria-checked={attempt.answers[question.id] === i} accessibilityState={{ checked: attempt.answers[question.id] === i, disabled: frozen }} disabled={frozen}
          onPress={() => void mutate('answer', { questionId: question.id, answer: i, revision: attempt.revision })}
          style={[s.answer, attempt.answers[question.id] === i && s.selected, frozen && s.disabled]}>
          <Text style={s.letter}>{String.fromCharCode(65 + i)}</Text><Text style={s.answerText}>{option}</Text>
        </Pressable>)}
        {busy ? <ActivityIndicator accessibilityLabel="Sincronizando examen" /> : <Text style={s.small}>{attempt.answers[question.id] === undefined ? 'Esta pregunta está sin responder.' : 'Respuesta guardada en tu cuenta.'}</Text>}
        <View style={s.row}>
          <AppButton label="Anterior" variant="ghost" disabled={index === 0 || busy} onPress={() => { setIndex((i) => i - 1); setConfirming(false); }} />
          <AppButton label="Siguiente" variant="ghost" disabled={index === attempt.questionCount - 1 || busy} onPress={() => { setIndex((i) => i + 1); setConfirming(false); }} />
        </View>
        <AppButton label="Dejar sin responder" variant="ghost" disabled={attempt.answers[question.id] === undefined || frozen} onPress={() => void mutate('answer', { questionId: question.id, answer: null, revision: attempt.revision })} />
        {confirming ? <View style={s.card}>
          <Text style={s.heading}>¿Entregar este examen?</Text>
          <Text style={s.body}>{attempt.questionCount - answered === 1 ? 'Queda 1 pregunta sin responder.' : `Quedan ${attempt.questionCount - answered} preguntas sin responder.`} La entrega es definitiva y corrige las respuestas guardadas.</Text>
          <AppButton label="Entregar ahora" disabled={frozen} loading={busy} onPress={() => void mutate('submit', {})} />
          <AppButton label="Seguir revisando" variant="ghost" disabled={busy} onPress={() => setConfirming(false)} />
        </View> : <AppButton label="Entregar examen" disabled={frozen} onPress={() => setConfirming(true)} />}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}
