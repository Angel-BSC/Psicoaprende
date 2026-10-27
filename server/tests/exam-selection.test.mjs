import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectRandomQuestions } from '../../src/lib/exam-selection.ts';
import { lessons } from '../../src/data/learning.ts';

const bank = lessons.flatMap((l) => l.questions.map((q) => ({ id: q.id, moduleId: l.moduleId })));

test('selección automática usa solo temas elegidos y no repite preguntas', () => {
  for (let run = 0; run < 50; run++) {
    const ids = selectRandomQuestions(bank, ['conciencia', 'atencion'], 10);
    assert.equal(ids.length, 10);
    assert.equal(new Set(ids).size, 10);
    assert.ok(ids.every((id) => ['conciencia', 'atencion'].includes(bank.find((q) => q.id === id).moduleId)));
  }
});

test('rechaza cantidad inválida, exceso y temas vacíos o inexistentes', () => {
  for (const count of [0, -1, 1.5, NaN, Infinity, '2', 76]) {
    assert.throws(() => selectRandomQuestions(bank, ['conciencia'], count), RangeError);
  }
  assert.throws(() => selectRandomQuestions(bank, [], 1), RangeError);
  assert.throws(() => selectRandomQuestions(bank, ['inexistente'], 1), RangeError);
});

test('permite una o todas las preguntas y no modifica el catálogo', () => {
  const original = structuredClone(bank);
  const topics = [...new Set(bank.map((q) => q.moduleId))];
  assert.equal(selectRandomQuestions(bank, topics, 1).length, 1);
  assert.deepEqual(selectRandomQuestions(bank, topics, 75).sort(), bank.map((q) => q.id).sort());
  assert.deepEqual(bank, original);
});

test('el sorteo depende del azar y deduplica IDs y temas', () => {
  const items = [{ id: 'a', moduleId: 'x' }, { id: 'b', moduleId: 'x' }, { id: 'b', moduleId: 'x' }, { id: 'c', moduleId: 'x' }];
  assert.deepEqual(selectRandomQuestions(items, ['x', 'x'], 2, () => 0), ['a', 'b']);
  assert.deepEqual(selectRandomQuestions(items, ['x'], 2, () => 0.999), ['c', 'a']);
  assert.throws(() => selectRandomQuestions(items, ['x'], 4), RangeError);
});
