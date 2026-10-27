import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { StudyText as Text } from './study-text';
import { AppButton } from '@/components/app-button';
import { colors } from '@/constants/design';
import { capsuleRarities } from '@/lib/claw-contract';
import type { ClawAttempt } from '@/lib/claw-contract';

export const rarityColors = ['#426B5D', '#75618E', '#91601F'];
export function ClawChallenge({ attempt, busy, onAnswer, onContinue }: {
  attempt: ClawAttempt; busy: boolean; onAnswer: (answer: number) => void; onContinue: () => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  // An ambiguous network failure must retry the same answer, never silently switch it.
  const [submitted, setSubmitted] = useState(false);
  const [sourceError, setSourceError] = useState('');
  const rarity = capsuleRarities[attempt.rarity];
  const result = attempt.result;
  return <View style={s.content}>
    <Text style={[s.badge, { color: rarityColors[rarity.color] }]}>✦ CÁPSULA {rarity.label.toLocaleUpperCase('es')}</Text>
    <Text style={s.meta}>{rarity.description} · {attempt.question.topic}</Text>
    <Text style={s.reward}>{attempt.rewardAvailable ? `Acierto: +${attempt.potentialXp} XP · +${attempt.potentialCoins} monedas` : 'Repaso sin premio: ya ganaste la recompensa de este caso.'}</Text>
    <Text style={s.meta}>Caso ficticio · Una respuesta · Sin límite de tiempo</Text>
    <Text accessibilityRole="header" style={s.stem}>{attempt.question.stem}</Text>
    {attempt.question.options.map((option, index) => {
      const selected = (result?.answer ?? choice) === index;
      const correct = result?.correctIndex === index;
      return <Pressable key={option} accessibilityRole="radio" aria-checked={selected} accessibilityState={{ checked: selected, disabled: busy || submitted || Boolean(result) }}
        disabled={busy || submitted || Boolean(result)} onPress={() => setChoice(index)}
        style={[s.option, selected && s.selected, correct && s.correct, result && selected && !correct && s.incorrect]}>
        <Text style={s.optionText}>{String.fromCharCode(65 + index)}. {option}</Text>
        {result ? <><Text style={s.optionLabel}>{correct ? '✓ Respuesta correcta' : selected ? 'Tu respuesta' : 'Por qué no'}</Text><Text style={s.meta}>{result.optionExplanations[index]}</Text></> : null}
      </Pressable>;
    })}
    {result ? <>
      <View accessibilityLiveRegion="polite" style={s.feedback}>
        <Text style={s.feedbackTitle}>{result.correct ? '¡Buen razonamiento!' : 'Una oportunidad para afinar conceptos'}</Text>
        <Text style={s.reward}>{result.earnedXp ? `+${result.earnedXp} XP · +${result.earnedCoins} monedas` : result.correct ? 'Repaso completado · Sin recompensa adicional' : '0 XP · 0 monedas · No pierdes puntos'}</Text>
        <Text style={s.explanation}>{result.explanation}</Text>
      </View>
      <Text style={s.meta}>Base del temario: PDF de Semiología, pp. {result.pdfPages.join(', ')}.</Text>
      <Text style={s.meta}>{result.editorialNote}</Text>
      {result.sources.map((source) => <Pressable key={source.url} accessibilityRole="link" onPress={() => {
        setSourceError(''); void Linking.openURL(source.url).catch(() => setSourceError('No se pudo abrir la fuente en el navegador.'));
      }} style={s.source}><Text style={s.sourceText}>{source.label} ↗</Text></Pressable>)}
      {sourceError ? <Text accessibilityRole="alert" style={s.meta}>{sourceError}</Text> : null}
      <AppButton label="Volver a la máquina" loading={busy} onPress={onContinue} />
    </> : <AppButton label={submitted ? 'Reintentar envío de mi respuesta' : 'Confirmar respuesta'} disabled={choice === null} loading={busy} onPress={() => {
      if (choice !== null) { setSubmitted(true); onAnswer(choice); }
    }} />}
  </View>;
}
const s = StyleSheet.create({
  content: { alignSelf: 'stretch', gap: 14 },
  badge: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  meta: { color: colors.inkMuted, fontSize: 12, lineHeight: 19 },
  reward: { color: colors.primaryDark, fontSize: 14, lineHeight: 21, fontWeight: '700' },
  stem: { color: colors.ink, fontSize: 16, lineHeight: 25, fontWeight: '500' },
  option: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#FFFFFF', padding: 14, gap: 6, borderRadius: 10, minHeight: 52 },
  selected: { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
  correct: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  incorrect: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  optionText: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  optionLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  feedback: { padding: 16, backgroundColor: colors.primarySoft, gap: 10, borderRadius: 10 },
  feedbackTitle: { color: colors.primaryDark, fontSize: 18, fontWeight: '800' },
  explanation: { color: colors.ink, fontSize: 14, lineHeight: 23 },
  source: { minHeight: 44, justifyContent: 'center' },
  sourceText: { color: colors.primaryDark, fontSize: 12, lineHeight: 19, textDecorationLine: 'underline' },
});
