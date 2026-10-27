import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/app-button';
import { FormField } from '@/components/form-field';
import { examStyles as s } from '@/constants/exam-styles';
import { api } from '@/lib/api';
import { selectRandomQuestions } from '@/lib/exam-selection';
import type { ExamAttempt, ExamCatalog, ExamSummary } from '@/lib/exams';
import { useAuth } from '@/context/auth-context';

export default function ExamsScreen() {
  const { user } = useAuth();
  return <ExamBuilder key={user?.id} />;
}

function ExamBuilder() {
  const [catalog, setCatalog] = useState<ExamCatalog | null>(null);
  const [history, setHistory] = useState<ExamSummary[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [minutes, setMinutes] = useState('10');
  const [query, setQuery] = useState('');
  const [automaticCount, setAutomaticCount] = useState('5');
  const [selectionNotice, setSelectionNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const requestKey = useRef('');
  const creatingRef = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([api<ExamCatalog>('/exams/catalog'), api<{ attempts: ExamSummary[] }>('/exams')])
      .then(([bank, result]) => { if (active) { setCatalog(bank); setHistory(result.attempts); } })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // This counter intentionally reloads the focused screen when the user retries.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]));
  const open = (id: string) => router.push({ pathname: '/exam/[examId]', params: { examId: id } });
  const available = catalog?.questions.filter((q) => topics.includes(q.moduleId)) ?? [];
  const filtered = available.filter((q) => `${q.prompt} ${q.lessonTitle}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const automaticAmount = Number(automaticCount);
  const canSelectAutomatically = /^\d+$/.test(automaticCount) && automaticAmount >= 1 && automaticAmount <= available.length;
  const activeAttempt = history.find((item) => !item.finishedAt);
  const duration = Number(minutes);
  const valid = /^\d+$/.test(minutes) && duration >= 1 && duration <= 120 && selected.length > 0;
  const change = () => { requestKey.current = ''; setSelectionNotice(''); };
  const autoSelect = () => {
    if (!catalog || !canSelectAutomatically || creating) return;
    change();
    setSelected(selectRandomQuestions(catalog.questions, topics, automaticAmount));
    setQuery('');
    setSelectionNotice(`Selección lista: ${automaticAmount} ${automaticAmount === 1 ? 'pregunta elegida' : 'preguntas elegidas'} al azar. Puedes revisarla o volver a sortear.`);
  };
  const toggleTopic = (id: string) => {
    change();
    setTopics((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    if (topics.includes(id)) setSelected((current) => current.filter((qid) => catalog?.questions.find((q) => q.id === qid)?.moduleId !== id));
  };
  const start = async () => {
    if (!valid || creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true); setError('');
    // Retry the same creation safely if the server responded but the connection was lost.
    if (!requestKey.current) requestKey.current = `exam_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
    try {
      const attempt = await api<ExamAttempt>('/exams', { questionIds: selected, durationMinutes: duration, requestKey: requestKey.current });
      requestKey.current = '';
      open(attempt.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo iniciar el examen.'); }
    finally { creatingRef.current = false; setCreating(false); }
  };

  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.kicker}>PRÁCTICA A TU MEDIDA</Text>
      <Text style={s.title}>Mi propio examen</Text>
      <Text style={s.body}>Elige qué estudiar y cuánto tiempo dedicarle. Usa preguntas de cualquier bloque, aunque todavía no lo hayas completado.</Text>
      {loading ? <ActivityIndicator accessibilityLabel="Cargando exámenes" /> : null}
      {error ? <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text><AppButton label="Actualizar intentos" variant="ghost" onPress={() => setRefresh((v) => v + 1)} disabled={creating} /></View> : null}
      {activeAttempt ? <View style={[s.card, s.soft]}>
        <Text style={s.heading}>Tienes un examen en curso</Text>
        <Text style={s.body}>El tiempo sigue corriendo. Puedes retomarlo con tus respuestas guardadas.</Text>
        <AppButton label="Retomar examen" onPress={() => open(activeAttempt.id)} />
      </View> : null}
      {catalog && !activeAttempt ? <>
        <Text style={s.heading}>1. Elige los temas</Text>
        <View style={s.row}>{catalog.modules.map((topic) => <Pressable key={topic.id} accessibilityRole="checkbox"
          aria-checked={topics.includes(topic.id)} accessibilityState={{ checked: topics.includes(topic.id), disabled: creating }} disabled={creating} onPress={() => toggleTopic(topic.id)}
          style={[s.chip, topics.includes(topic.id) && s.selected]}><Text style={s.chipText}>{topics.includes(topic.id) ? '✓ ' : ''}{topic.title}</Text></Pressable>)}</View>
        <Text style={s.heading}>2. Selecciona tus preguntas</Text>
        <View style={[s.card, s.soft]}>
          <Text style={s.heading}>Que la app elija por mí</Text>
          <Text style={s.small}>{available.length} preguntas disponibles en los temas elegidos. Sortea sin repetir; reemplaza la selección anterior y limpia la búsqueda. Después puedes cambiar cualquier pregunta.</Text>
          <FormField label="Cantidad de preguntas automáticas" value={automaticCount}
            onChangeText={(value) => { setAutomaticCount(value); setSelectionNotice(''); }}
            keyboardType="number-pad" maxLength={3} editable={!creating && available.length > 0}
            error={available.length > 0 && !canSelectAutomatically ? `Escribe un número entero entre 1 y ${available.length}.` : undefined} />
          <AppButton label="Elegir automáticamente" onPress={autoSelect} disabled={!canSelectAutomatically || creating || loading} />
          {!topics.length ? <Text style={s.small}>Primero selecciona uno o más temas.</Text> : null}
          {selectionNotice ? <Text style={s.success}>{selectionNotice}</Text> : null}
        </View>
        <Text style={s.small}>{selected.length} seleccionadas · {filtered.length} visibles. Cambiar la búsqueda conserva la selección; quitar un tema elimina sus preguntas.</Text>
        <FormField label="Buscar una pregunta" placeholder="Palabra o nombre de lección" value={query} onChangeText={setQuery} editable={!creating} />
        <View style={s.row}>
          <AppButton label="Elegir las visibles" variant="ghost" disabled={!filtered.length || creating} onPress={() => { change(); setSelected((items) => [...new Set([...items, ...filtered.map((q) => q.id)])]); }} />
          <AppButton label="Vaciar selección" variant="ghost" disabled={!selected.length || creating} onPress={() => { change(); setSelected([]); }} />
        </View>
        {!topics.length ? <Text style={s.body}>Selecciona al menos un tema para ver sus preguntas.</Text> : !filtered.length ? <Text style={s.body}>No hay preguntas con esa búsqueda.</Text> : filtered.map((q) => <Pressable key={q.id} accessibilityRole="checkbox"
          accessibilityLabel={q.prompt} aria-checked={selected.includes(q.id)} accessibilityState={{ checked: selected.includes(q.id), disabled: creating }} disabled={creating}
          onPress={() => { change(); setSelected((items) => items.includes(q.id) ? items.filter((id) => id !== q.id) : [...items, q.id]); }}
          style={[s.question, selected.includes(q.id) && s.selected]}>
          <Text style={s.small}>{selected.includes(q.id) ? '✓ Seleccionada' : 'Seleccionar'} · {q.lessonTitle}</Text><Text style={s.questionText}>{q.prompt}</Text>
        </Pressable>)}
        <View style={s.card}>
          <Text style={s.heading}>3. Tiempo y resumen</Text>
          <FormField label="Duración en minutos (1–120)" value={minutes} onChangeText={(value) => { change(); setMinutes(value); }} keyboardType="number-pad" maxLength={3} editable={!creating} />
          <Text style={s.body}>{selected.length} preguntas · {topics.length} temas seleccionados</Text>
          <Text style={s.small}>Al comenzar se inicia el reloj. No se pausa al salir. Cada respuesta se guarda con conexión; al vencer el plazo cuentan solo las guardadas. Podrás revisar respuestas y explicaciones al finalizar. No otorga XP ni desbloquea la ruta.</Text>
          <AppButton label="Comenzar examen" loading={creating} disabled={!valid || loading} onPress={start} />
        </View>
      </> : null}
      <Text style={s.heading}>Mis intentos</Text>
      <Text style={s.small}>Hasta 50 intentos recientes, guardados en tu cuenta.</Text>
      {!loading && !history.length ? <Text style={s.body}>Todavía no tienes exámenes. El primero puede empezar con una sola pregunta.</Text> : history.map((attempt) => <Pressable key={attempt.id} accessibilityRole="button" disabled={creating} onPress={() => open(attempt.id)} style={s.card}>
        <Text style={s.heading}>{attempt.finishedAt ? `${attempt.score}/${attempt.questionCount} aciertos` : 'En curso · retomar'}</Text>
        <Text style={s.small}>{new Date(attempt.startedAt).toLocaleString('es-EC')} · {attempt.durationMinutes} min · {attempt.questionCount} preguntas</Text>
        <Text style={s.chipText}>{attempt.finishedAt ? 'Ver resultado y explicaciones →' : 'Continuar →'}</Text>
      </Pressable>)}
    </ScrollView>
  </SafeAreaView>;
}
