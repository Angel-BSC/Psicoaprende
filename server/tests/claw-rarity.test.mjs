import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rarityForRoll } from '../claw-rarity.mjs';
import { capsuleOdds } from '../../src/lib/claw-contract.ts';

test('rareza: todos los resultados equiprobables cubren exactamente 70/25/5 sin huecos', () => {
  assert.equal(Object.values(capsuleOdds).reduce((a, b) => a + b, 0), 100);
  const counts = { especial: 0, epica: 0, legendaria: 0 };
  for (let roll = 0; roll < 100; roll++) counts[rarityForRoll(roll)]++;
  assert.deepEqual(counts, capsuleOdds);
  assert.deepEqual(counts, { especial: 70, epica: 25, legendaria: 5 });
});
test('rareza: límites correctos y rechazo de valores fuera del dominio', () => {
  for (const roll of [0, 69]) assert.equal(rarityForRoll(roll), 'especial');
  for (const roll of [70, 94]) assert.equal(rarityForRoll(roll), 'epica');
  for (const roll of [95, 99]) assert.equal(rarityForRoll(roll), 'legendaria');
  for (const roll of [-1, 100, NaN, Infinity, 0.5, '95', null, undefined]) assert.throws(() => rarityForRoll(roll), RangeError);
});
