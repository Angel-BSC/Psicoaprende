import { StyleSheet } from 'react-native';
import { colors } from './design';

export const examStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center', gap: 16 },
  kicker: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 8 },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.6 },
  heading: { color: colors.ink, fontSize: 18, lineHeight: 25, fontWeight: '700' },
  body: { color: colors.inkMuted, fontSize: 14, lineHeight: 22 },
  small: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 },
  soft: { backgroundColor: colors.primarySoft },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  chip: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, backgroundColor: colors.surface },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  question: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, backgroundColor: colors.surface, gap: 6 },
  questionText: { color: colors.ink, fontSize: 15, lineHeight: 23, fontWeight: '600' },
  answer: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  answerText: { color: colors.ink, fontSize: 15, lineHeight: 22, flex: 1 },
  letter: { color: colors.primaryDark, fontSize: 15, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, lineHeight: 20 },
  success: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  timer: { color: colors.primaryDark, fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
  link: { color: colors.primaryDark, fontSize: 13, lineHeight: 21, textDecorationLine: 'underline' },
  score: { color: colors.primaryDark, fontSize: 36, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
