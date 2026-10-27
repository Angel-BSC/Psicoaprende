import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clinicalCases } from '../data/claw-cases.mjs';
import { capsuleRarities } from '../../src/lib/claw-contract.ts';

test('clínica: 12 casos originales con cuatro preguntas por rareza y premios crecientes', () => {
  assert.equal(clinicalCases.length, 12);
  assert.equal(new Set(clinicalCases.map((q) => q.id)).size, 12);
  let xp = 0, coins = 0;
  for (const [rarity, reward] of Object.entries(capsuleRarities)) {
    assert.equal(clinicalCases.filter((q) => q.rarity === rarity).length, 4);
    assert.ok(reward.xp > xp && reward.coins > coins); xp = reward.xp; coins = reward.coins;
  }
});
test('clínica: cada caso tiene opciones únicas, explicación por opción y trazabilidad al PDF', () => {
  for (const q of clinicalCases) {
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4);
    assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4);
    assert.equal(q.optionExplanations.length, q.options.length);
    assert.ok(q.optionExplanations.every((text) => text.length > 15));
    assert.ok(q.stem.length > 180 && q.explanation.length > 60);
    assert.ok(q.pdfPages.length && q.pdfPages.every((p) => Number.isInteger(p) && p >= 1 && p <= 49));
    assert.ok(q.sources.every((s) => s.label && new URL(s.url).protocol === 'https:'));
    assert.match(q.editorialNote, /ficticio/); assert.match(q.editorialNote, /pendiente de validación docente/);
  }
});
test('clínica: equivalencias problemáticas del PDF tienen aclaración y fuente complementaria', () => {
  for (const id of ['claw-interrupcion-03', 'claw-asociaciones-03']) {
    const q = clinicalCases.find((q) => q.id === id);
    assert.ok(q.sources.length); assert.match(q.editorialNote, /Aclaración editorial/);
  }
});
