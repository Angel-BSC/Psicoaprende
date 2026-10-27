import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLAW, clampClawX, createCapsules, nearestCapsule, removeCaptured, isClawBusy } from '../../src/lib/claw-machine.ts';

test('garra respeta límites e inputs no finitos', () => {
  assert.equal(clampClawX(-500), CLAW.minX); assert.equal(clampClawX(1000), CLAW.maxX);
  assert.equal(clampClawX(180), 180); assert.equal(clampClawX(NaN), CLAW.homeX); assert.equal(clampClawX(Infinity), CLAW.homeX);
});
test('cápsulas nuevas tienen IDs únicos, colores válidos y posiciones alcanzables', () => {
  const capsules = createCapsules(); assert.equal(capsules.length, 11); assert.equal(new Set(capsules.map(c => c.id)).size, 11);
  assert.notEqual(capsules, createCapsules());
  for (const c of capsules) { assert.ok(c.x >= CLAW.minX && c.x <= CLAW.maxX); assert.ok(c.y - CLAW.gripOffset > CLAW.homeY); assert.ok([0, 1, 2].includes(c.color)); }
});
test('agarre asistido escoge la cápsula más cercana sin mutar la lista', () => {
  const capsules = createCapsules(); const before = structuredClone(capsules);
  assert.equal(nearestCapsule(capsules, 161).x, 160);
  assert.equal(nearestCapsule(capsules, -100).x, 50); assert.equal(nearestCapsule(capsules, 999).x, 270);
  assert.equal(nearestCapsule([], 160), null); assert.deepEqual(capsules, before);
});
test('empate horizontal prefiere cápsula superior', () => {
  const a = { id: 'a', x: 100, y: 240, color: 0 }; const b = { ...a, id: 'b', y: 200 };
  assert.equal(nearestCapsule([a, b], 100).id, 'b');
});
test('recogida elimina solo una cápsula y repetir no duplica consumo', () => {
  const capsules = createCapsules(); const target = nearestCapsule(capsules, 160);
  const next = removeCaptured(capsules, target.id);
  assert.equal(next.length, 10); assert.equal(capsules.length, 11); assert.deepEqual(removeCaptured(next, target.id), next);
  assert.notEqual(nearestCapsule(next, 160).id, target.id);
});
test('controles bloqueados durante todas las fases de extracción', () => {
  for (const phase of ['aligning', 'lowering', 'gripping', 'lifting', 'transporting', 'dropping', 'returning']) assert.equal(isClawBusy(phase), true);
  for (const phase of ['ready', 'delivered', 'opened']) assert.equal(isClawBusy(phase), false);
});
