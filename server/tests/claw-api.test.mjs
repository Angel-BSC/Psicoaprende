import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createPool, migrate } from '../db.mjs';
import { createApp } from '../app.mjs';
import { clinicalCases } from '../data/claw-cases.mjs';
import { capsuleRarities } from '../../src/lib/claw-contract.ts';

const schema = `test_claw_${randomUUID().replaceAll('-', '')}`;
const admin = createPool();
let pool, server, base, alice, bob, board, attempt;
async function req(path, body, token = alice?.token) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Psico-Client': 'native', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
const correctFor = (attempt) => clinicalCases.find((q) => q.id === attempt.question.id).correctIndex;
const firstReward = () => capsuleRarities[attempt.rarity];
const answer = (item, choice = correctFor(item)) => req(`/claw/attempts/${item.id}/answer`, { answer: choice });
const close = (item) => req(`/claw/attempts/${item.id}/close`, {});
async function start() { server = (await createApp(pool, { authLimit: 100 })).listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`; }
before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`); pool = createPool({ options: `-c search_path=${schema}` });
  await migrate(pool); await migrate(pool); await start();
  const register = async (email) => (await req('/auth/register', { name: 'QA Cápsulas', email, password: 'Prueba-capsulas-2026!', acceptedPrivacy: true }, null)).data;
  alice = await register('alice-claw@example.test'); bob = await register('bob-claw@example.test');
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (pool) await pool.end();
  // Only this run's explicitly named disposable schema is removed; never public/user data.
  await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end();
});
test('garra: requiere autenticación en cada ruta', async () => {
  for (const [path, body] of [['/claw', undefined], ['/claw/refill', {}], ['/claw/attempts', {}], [`/claw/attempts/${randomUUID()}/answer`, {}], [`/claw/attempts/${randomUUID()}/close`, {}]])
    assert.equal((await req(path, body, null)).status, 401);
});
test('garra: carga persistente y concurrente de cápsulas idénticas sin rareza preasignada', async () => {
  const results = await Promise.all([req('/claw'), req('/claw')]);
  board = results[0].data;
  assert.deepEqual(board, results[1].data); assert.equal(board.capsules.length, 11);
  assert.equal(new Set(board.capsules.map((c) => c.id)).size, 11);
  assert.ok(board.capsules.every((c) => c.color === 0 && !Object.hasOwn(c, 'rarity')));
  const stored = (await pool.query('SELECT capsules FROM claw_boards WHERE user_id=$1', [alice.user.id])).rows[0].capsules;
  assert.ok(stored.every((c) => !Object.hasOwn(c, 'rarity')));
  assert.deepEqual(board.wallet, { coins: 0, xp: 0 }); assert.equal(board.activeAttempt, null);
  assert.equal((await req('/claw/refill', {})).status, 409);
  assert.deepEqual((await req('/claw')).data.capsules, board.capsules);
});
test('garra: tableros antiguos conservan IDs y posiciones sin revelar ni usar la rareza anterior', async () => {
  const legacy = board.capsules.map((c) => ({ ...c, color: 2, rarity: 'legacy-ignored' }));
  await pool.query('UPDATE claw_boards SET capsules=$2 WHERE user_id=$1', [alice.user.id, JSON.stringify(legacy)]);
  assert.deepEqual((await req('/claw')).data, board);
});
test('garra: captura válida e idempotente; ignora rareza, XP y usuario manipulados', async () => {
  for (const capsuleId of [null, 123, 'no-uuid']) assert.equal((await req('/claw/attempts', { capsuleId })).status, 400);
  assert.equal((await req('/claw/attempts', { capsuleId: randomUUID() })).status, 404);
  const cap = board.capsules[0];
  const payload = { capsuleId: cap.id, rarity: 'inventada', roll: 99, xp: 9999, userId: bob.user.id };
  const results = await Promise.all([req('/claw/attempts', payload), req('/claw/attempts', payload)]);
  assert.ok(results.every((r) => r.status === 200)); assert.deepEqual(results[0].data, results[1].data);
  attempt = results[0].data.attempt;
  assert.ok(Object.hasOwn(capsuleRarities, attempt.rarity));
  assert.equal(attempt.potentialXp, firstReward().xp); assert.equal(attempt.potentialCoins, firstReward().coins);
  assert.equal(clinicalCases.find((q) => q.id === attempt.question.id).rarity, attempt.rarity);
  assert.equal(attempt.result, null); assert.equal(attempt.question.correctIndex, undefined); assert.equal(attempt.question.explanation, undefined);
  assert.equal(attempt.question.optionExplanations, undefined); assert.equal(attempt.question.pdfPages, undefined);
  const state = (await req('/claw')).data; assert.equal(state.capsules.length, 10); assert.deepEqual(state.activeAttempt, attempt);
  assert.equal((await req('/claw/attempts', { capsuleId: state.capsules[0].id })).status, 409);
  assert.equal((await close(attempt)).status, 409);
});
test('garra: aislamiento entre cuentas y validación de respuestas', async () => {
  assert.equal((await req('/claw/attempts', { capsuleId: board.capsules[0].id }, bob.token)).status, 404);
  for (const action of ['answer', 'close']) assert.equal((await req(`/claw/attempts/${attempt.id}/${action}`, { answer: 0 }, bob.token)).status, 404);
  for (const choice of [null, -1, 4, 0.1, '1', {}, []]) assert.equal((await answer(attempt, choice)).status, 400);
  assert.equal((await req('/claw/attempts/not-a-uuid/answer', { answer: 0 })).status, 404);
});
test('garra: reiniciar la API restaura el caso y la cápsula sin regenerarlos', async () => {
  await new Promise((resolve) => server.close(resolve)); await start();
  const restored = (await req('/claw')).data;
  assert.deepEqual(restored.activeAttempt, attempt); assert.equal(restored.capsules.length, 10);
});
test('garra: respuesta correcta concurrente concede una sola recompensa real', async () => {
  const results = await Promise.all([answer(attempt), answer(attempt), answer(attempt)]);
  assert.ok(results.every((r) => r.status === 200));
  assert.deepEqual(results[0].data, results[1].data);
  const result = results[0].data.attempt.result;
  assert.equal(result.correct, true); assert.equal(result.earnedXp, firstReward().xp); assert.equal(result.earnedCoins, firstReward().coins);
  assert.equal((await pool.query('SELECT count(*) FROM claw_case_rewards')).rows[0].count, '1');
  assert.equal((await answer(attempt, (correctFor(attempt) + 1) % 4)).status, 409);
  const progress = (await req('/progress')).data;
  assert.equal(progress.xp, firstReward().xp); assert.equal(progress.coins, firstReward().coins); assert.equal(progress.dailyXp, firstReward().xp); assert.equal(progress.streak, 1);
  assert.deepEqual(progress.completedLessonIds, []);
  // Results remain resumable until explicitly acknowledged, even if response was lost.
  assert.deepEqual((await req('/claw')).data.activeAttempt.result, result);
  assert.equal((await close(attempt)).status, 200); assert.equal((await close(attempt)).status, 200);
  assert.equal((await req('/claw')).data.activeAttempt, null);
  assert.equal((await req('/claw/attempts', { capsuleId: attempt.capsuleId })).status, 409);
});
test('garra: error no resta puntos; explicación y premio se conservan tras recargar', async () => {
  const current = (await req('/claw')).data;
  const special = current.capsules[0];
  const item = (await req('/claw/attempts', { capsuleId: special.id })).data.attempt;
  const result = (await answer(item, (correctFor(item) + 1) % 4)).data.attempt.result;
  assert.equal(result.correct, false); assert.equal(result.earnedXp, 0); assert.equal(result.earnedCoins, 0);
  assert.equal(result.optionExplanations.length, 4); assert.ok(result.explanation); assert.ok(result.pdfPages.length);
  assert.equal((await req('/progress')).data.xp, firstReward().xp); assert.equal((await req('/progress')).data.coins, firstReward().coins);
  assert.deepEqual((await req('/claw')).data.activeAttempt.result, result);
  await close(item);
});
test('garra: vaciar y rellenar; los casos ya premiados no pueden acumular premios', async () => {
  let repeats = 0, expectedXp = firstReward().xp, expectedCoins = firstReward().coins;
  for (let round = 0; round < 3; round++) {
    const current = (await req('/claw')).data;
    for (const cap of current.capsules) {
      const item = (await req('/claw/attempts', { capsuleId: cap.id })).data.attempt;
      if (!item.rewardAvailable) { repeats++; assert.equal(item.potentialXp, 0); assert.equal(item.potentialCoins, 0); }
      const result = (await answer(item)).data.attempt.result;
      assert.equal(result.earnedXp, item.potentialXp); assert.equal(result.earnedCoins, item.potentialCoins);
      expectedXp += result.earnedXp; expectedCoins += result.earnedCoins;
      await close(item);
    }
    assert.equal((await req('/claw')).data.capsules.length, 0);
    const refilled = await Promise.all([req('/claw/refill', {}), req('/claw/refill', {})]);
    assert.deepEqual(refilled.map((r) => r.status).sort(), [200, 409]);
    assert.equal((await req('/claw')).data.capsules.length, 11);
  }
  assert.ok(repeats > 0);
  const progress = (await req('/progress')).data;
  assert.equal(progress.xp, expectedXp); assert.equal(progress.coins, expectedCoins); assert.deepEqual(progress.completedLessonIds, []);
  assert.equal((await req('/progress', undefined, bob.token)).data.xp, 0);
});
test('garra: una falla durante la entrega revierte premio y respuesta juntos', async () => {
  const fresh = (await req('/claw', undefined, bob.token)).data.capsules[0];
  const item = (await req('/claw/attempts', { capsuleId: fresh.id }, bob.token)).data.attempt;
  await pool.query("CREATE FUNCTION fail_claw_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic failure'; END $$");
  await pool.query('CREATE TRIGGER test_claw_failure BEFORE UPDATE ON claw_attempts FOR EACH ROW EXECUTE FUNCTION fail_claw_update()');
  try {
    assert.equal((await req(`/claw/attempts/${item.id}/answer`, { answer: correctFor(item) }, bob.token)).status, 503);
    assert.equal((await req('/progress', undefined, bob.token)).data.xp, 0);
    assert.equal((await req('/claw', undefined, bob.token)).data.activeAttempt.result, null);
  } finally { await pool.query('DROP TRIGGER test_claw_failure ON claw_attempts'); }
  assert.equal((await req(`/claw/attempts/${item.id}/answer`, { answer: correctFor(item) }, bob.token)).status, 200);
});
