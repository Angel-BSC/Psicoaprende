import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createPool, migrate } from '../db.mjs';
import { createApp } from '../app.mjs';
import { defaultProfile, readingMetrics, validProfileChanges } from '../../src/lib/profile-contract.ts';

const schema = `test_profile_${randomUUID().replaceAll('-', '')}`;
const admin = createPool();
let pool, server, base, alice, bob;
async function req(path, body, token = alice?.token) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Psico-Client': 'native', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
async function start() { server = (await createApp(pool, { authLimit: 100 })).listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`; }
// Synthetic rewards only in this disposable schema; never seed a user's real wallet.
async function fund(userId, coins) {
  const id = randomUUID();
  await pool.query('INSERT INTO claw_attempts(id,user_id,capsule_id,question,reward_available,closed_at) VALUES($1,$2,$3,$4,true,now())', [id, userId, randomUUID(), '{}']);
  await pool.query('INSERT INTO claw_case_rewards(user_id,question_id,attempt_id,xp,coins) VALUES($1,$2,$3,100,$4)', [userId, id, id, coins]);
}
before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`); pool = createPool({ options: `-c search_path=${schema}` });
  await migrate(pool); await migrate(pool); await start();
  const register = async (email) => (await req('/auth/register', { name: 'Perfil Prueba', email, password: 'Perfil-prueba-2026!', acceptedPrivacy: true }, null)).data;
  alice = await register('alice-profile@example.test'); bob = await register('bob-profile@example.test');
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (pool) await pool.end();
  // Only this test's randomly named, explicitly created schema is disposable.
  await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end();
});
test('perfil: todas las rutas requieren sesión', async () => {
  for (const [path, body] of [['/profile', undefined], ['/profile', {}], ['/profile/purchase', {}], ['/profile/equip', {}]])
    assert.equal((await req(path, body, null)).status, 401);
});
test('perfil: valores iniciales, sin alterar actividad', async () => {
  assert.deepEqual((await req('/profile')).data, { ...defaultProfile, name: 'Perfil Prueba' });
  assert.equal((await req('/progress')).data.xp, 0);
});
test('perfil: valida nombres, meta, tamaño, booleanos y rechaza campos sensibles', async () => {
  for (const body of [{}, [], null, { name: ' ' }, { name: 'x'.repeat(81) }, { name: 'Ana\nAdmin' },
    { dailyGoal: 0 }, { dailyGoal: 51 }, { dailyGoal: '50' }, { readingSize: 'huge' }, { roomyReading: 'true' },
    { role: 'professional' }, { coins: 999 }, { userId: bob.user.id }, { equippedItem: 'amber' }]) {
    assert.equal(validProfileChanges(body), false);
    assert.equal((await req('/profile', body)).status, 400);
  }
  assert.equal((await req('/profile')).data.name, 'Perfil Prueba');
});
test('perfil: edición parcial y persistencia entre sesiones sin cambiar otra cuenta', async () => {
  const result = await req('/profile', { name: '  Estudiante QA  ', dailyGoal: 100, readingSize: 'extra', roomyReading: true });
  assert.equal(result.status, 200); assert.equal(result.data.name, 'Estudiante QA');
  assert.equal((await req('/auth/me')).data.user.name, 'Estudiante QA');
  assert.equal((await req('/progress')).data.dailyGoal, 100);
  await req('/profile', { dailyGoal: 30 });
  assert.equal((await req('/profile')).data.readingSize, 'extra');
  assert.deepEqual((await req('/profile', undefined, bob.token)).data, { ...defaultProfile, name: 'Perfil Prueba' });
  const login = (await req('/auth/login', { email: 'alice-profile@example.test', password: 'Perfil-prueba-2026!' }, null)).data;
  assert.equal((await req('/profile', undefined, login.token)).data.roomyReading, true);
});
test('perfil: no permite equipar objetos ajenos ni comprar sin saldo', async () => {
  assert.equal((await req('/profile/equip', { itemId: 'sage' })).status, 400);
  assert.equal((await req('/profile/purchase', { itemId: 'sage', price: 0, coins: 999 })).status, 409);
  assert.equal((await req('/profile/purchase', { itemId: 'missing' })).status, 400);
});
test('perfil: compra concurrente idempotente, precio del servidor y saldo común', async () => {
  await fund(alice.user.id, 100);
  const payload = { itemId: 'sage', price: 0, userId: bob.user.id };
  const results = await Promise.all([req('/profile/purchase', payload), req('/profile/purchase', payload)]);
  assert.ok(results.every((r) => r.status === 200 && r.data.coins === 70));
  assert.deepEqual(results[0].data.ownedItems, ['classic', 'sage']);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM profile_purchases WHERE user_id=$1', [alice.user.id])).rows[0].count, 1);
  assert.equal((await req('/progress')).data.coins, 70);
  assert.equal((await req('/claw')).data.wallet.coins, 70);
  assert.equal((await req('/progress')).data.xp, 100);
  assert.equal((await req('/profile', undefined, bob.token)).data.coins, 0);
});
test('perfil: equipar, restaurar clásico y recuperar tras reiniciar API', async () => {
  assert.equal((await req('/profile/equip', { itemId: 'sage' })).data.equippedItem, 'sage');
  await new Promise((resolve) => server.close(resolve)); await start();
  assert.equal((await req('/profile')).data.equippedItem, 'sage');
  assert.equal((await req('/profile/purchase', { itemId: 'sage' })).data.coins, 70);
  assert.equal((await req('/profile/equip', { itemId: 'classic' })).data.coins, 70);
});
test('perfil: compras diferentes simultáneas nunca dejan saldo negativo', async () => {
  await fund(bob.user.id, 60);
  const results = await Promise.all([req('/profile/purchase', { itemId: 'sage' }, bob.token), req('/profile/purchase', { itemId: 'lavender' }, bob.token)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const result = (await req('/profile', undefined, bob.token)).data;
  assert.ok(result.coins >= 0); assert.equal(result.ownedItems.length, 2);
});
test('perfil: fallo transaccional no cobra ni entrega objetos', async () => {
  await pool.query(`CREATE FUNCTION reject_purchase() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test rollback'; END; $$`);
  await pool.query('CREATE TRIGGER fail_purchase AFTER INSERT ON profile_purchases FOR EACH ROW EXECUTE FUNCTION reject_purchase()');
  assert.equal((await req('/profile/purchase', { itemId: 'lavender' })).status, 503);
  const result = (await req('/profile')).data;
  assert.equal(result.coins, 70); assert.deepEqual(result.ownedItems, ['classic', 'sage']);
  await pool.query('DROP TRIGGER fail_purchase ON profile_purchases');
});
test('lectura: escala y espacio preservan tamaño base, sin tocar respuestas', () => {
  assert.deepEqual(readingMetrics('normal', false, 16, 24), { fontSize: 16, lineHeight: 24 });
  const extra = readingMetrics('extra', true, 16, 24);
  assert.equal(extra.fontSize, 20.8); assert.ok(extra.lineHeight >= extra.fontSize * 1.8); assert.equal(extra.letterSpacing, 0.35);
});
