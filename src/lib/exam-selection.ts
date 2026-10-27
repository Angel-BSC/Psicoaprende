/** Draw without replacement from the selected topics; never mutate the catalogue. */
export function selectRandomQuestions(
  questions: readonly { id: string; moduleId: string }[],
  topicIds: readonly string[],
  count: number,
  random: () => number = Math.random,
): string[] {
  const topics = new Set(topicIds);
  const ids = [...new Set(questions.filter((q) => topics.has(q.moduleId)).map((q) => q.id))];
  if (!Number.isInteger(count) || count < 1 || count > ids.length) {
    throw new RangeError('La cantidad debe estar entre 1 y el total de preguntas disponibles.');
  }
  // Partial Fisher–Yates: each available question has the same chance of selection.
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (ids.length - i));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, count);
}
