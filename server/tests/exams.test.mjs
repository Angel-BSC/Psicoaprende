import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createPool, migrate } from '../db.mjs';
import { createApp } from '../app.mjs';
import { lessons } from '../../src/data/learning.ts';

const schema = `test_exam_${randomUUID().replaceAll('-', '')}`;
const admin = createPool();
let pool, server, base, alice, bob, attempt;
const qs = [lessons[0].questions[0], lessons[1].questions[0]];
const payload = (extra = {}) => ({ requestKey: randomUUID(), questionIds: qs.map((q) => q.id), durationMinutes: 10, ...extra });
async function req(path, body, token = alice?.token) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Psico-Client': 'native', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
async function start() { server = (await createApp(pool, { authLimit: 100 })).listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`; }
before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  pool = createPool({ options: `-c search_path=${schema}` });
  await migrate(pool); await migrate(pool); await start();
  const register = async (email) => (await req('/auth/register', { name: 'Prueba Examen', email, password: 'Prueba-examen-2026!', acceptedPrivacy: true }, null)).data;
  alice = await register('alice-exam@example.test'); bob = await register('bob-exam@example.test');
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (pool) await pool.end();
  // Exact, randomly named disposable schema created by this run, never the user's tables.
  await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end();
});

test('exámenes requieren sesión; catálogo no expone respuestas ni explicaciones', async () => {
  for (const path of ['/exams', '/exams/catalog']) assert.equal((await req(path, undefined, null)).status, 401);
  assert.equal((await req('/exams', payload(), null)).status, 401);
  const catalog = (await req('/exams/catalog')).data;
  assert.equal(catalog.modules.length, 8); assert.equal(catalog.questions.length, 75);
  assert.ok(catalog.questions.every((q) => q.correctIndex === undefined && q.explanation === undefined));
});
test('valida tiempo, selección vacía, IDs, duplicados y clave de reintento', async () => {
  for (const invalid of [payload({ questionIds: [] }), payload({ questionIds: [qs[0].id, qs[0].id] }),
    payload({ questionIds: ['fake'] }), payload({ questionIds: [null] }), payload({ durationMinutes: 0 }),
    payload({ durationMinutes: 121 }), payload({ durationMinutes: 1.5 }), payload({ durationMinutes: '10' }), payload({ requestKey: 'tiny' })]) {
    assert.equal((await req('/exams', invalid)).status, 400);
  }
  assert.equal((await req('/exams/------------------------------------')).status, 404);
});
test('creación concurrente es idempotente y usa solo preguntas y tiempo del servidor', async () => {
  const input = payload({ score: 999, answers: { [qs[0].id]: qs[0].correctIndex }, userId: bob.user.id });
  const results = await Promise.all([req('/exams', input), req('/exams', input)]);
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(results[0].data.id, results[1].data.id);
  attempt = results[0].data;
  assert.equal(attempt.score, null); assert.deepEqual(attempt.answers, {});
  assert.equal(Date.parse(attempt.expiresAt) - Date.parse(attempt.startedAt), 600000);
  assert.ok(attempt.questions.every((q) => q.correctIndex === undefined && q.explanation === undefined && q.pages === undefined));
  assert.equal((await req('/exams', { ...input, durationMinutes: 11 })).status, 409);
  assert.equal((await req('/exams', payload())).status, 409);
  assert.equal((await pool.query('SELECT count(*) FROM exam_attempts')).rows[0].count, '1');
});
test('los intentos están aislados entre cuentas, incluso al responder o entregar', async () => {
  assert.deepEqual((await req('/exams', undefined, bob.token)).data.attempts, []);
  for (const [path, body] of [[`/exams/${attempt.id}`, undefined], [`/exams/${attempt.id}/answer`, {}], [`/exams/${attempt.id}/submit`, {}]])
    assert.equal((await req(path, body, bob.token)).status, 404);
});
test('respuestas válidas se guardan, rechaza opciones y versiones inválidas', async () => {
  for (const input of [{ questionId: 'fake', answer: 0, revision: 0 }, { questionId: qs[0].id, answer: 5, revision: 0 },
    { questionId: qs[0].id, answer: -1, revision: 0 }, { questionId: qs[0].id, answer: '0', revision: 0 },
    { questionId: qs[0].id, answer: 0 }]) assert.equal((await req(`/exams/${attempt.id}/answer`, input)).status, 400);
  const body = { questionId: qs[0].id, answer: qs[0].correctIndex, revision: 0 };
  const saved = await req(`/exams/${attempt.id}/answer`, body);
  assert.equal(saved.status, 200); assert.equal(saved.data.revision, 1);
  assert.equal(saved.data.answers[qs[0].id], qs[0].correctIndex);
  assert.equal((await req(`/exams/${attempt.id}/answer`, body)).data.revision, 1);
  assert.equal((await req(`/exams/${attempt.id}/answer`, { ...body, answer: (qs[0].correctIndex + 1) % 4 })).status, 409);
});
test('recupera respuestas y plazo tras reiniciar la API y permite borrar una respuesta', async () => {
  await new Promise((resolve) => server.close(resolve)); await start();
  const restored = (await req(`/exams/${attempt.id}`)).data;
  assert.equal(restored.expiresAt, attempt.expiresAt); assert.equal(restored.answers[qs[0].id], qs[0].correctIndex);
  const empty = await req(`/exams/${attempt.id}/answer`, { questionId: qs[0].id, answer: null, revision: restored.revision });
  assert.deepEqual(empty.data.answers, {});
  await req(`/exams/${attempt.id}/answer`, { questionId: qs[0].id, answer: qs[0].correctIndex, revision: empty.data.revision });
});
test('entrega idempotente corrige en servidor, incluye omitidas y no suma XP', async () => {
  const result = await req(`/exams/${attempt.id}/submit`, { score: 999, answers: { [qs[1].id]: qs[1].correctIndex } });
  assert.equal(result.status, 200); assert.equal(result.data.score, 1); assert.equal(result.data.finishReason, 'submitted');
  assert.equal(result.data.questions[0].correctIndex, qs[0].correctIndex); assert.equal(result.data.questions[0].explanation, qs[0].explanation);
  const repeat = (await req(`/exams/${attempt.id}/submit`, {})).data;
  assert.equal(repeat.finishedAt, result.data.finishedAt); assert.equal(repeat.revision, result.data.revision);
  const late = (await req(`/exams/${attempt.id}/answer`, { questionId: qs[1].id, answer: qs[1].correctIndex, revision: repeat.revision })).data;
  assert.equal(late.score, 1); assert.equal(late.answers[qs[1].id], undefined);
  const progress = (await req('/progress')).data;
  assert.equal(progress.xp, 0); assert.deepEqual(progress.completedLessonIds, []);
});
test('vencimiento no acepta una respuesta tardía aunque el cliente falsee el reloj', async () => {
  const timed = (await req('/exams', payload({ durationMinutes: 1 }))).data;
  await pool.query("UPDATE exam_attempts SET expires_at=clock_timestamp()-interval '1 second' WHERE id=$1", [timed.id]);
  const late = (await req(`/exams/${timed.id}/answer`, { questionId: qs[0].id, answer: qs[0].correctIndex, revision: 0, expiresAt: '2099-01-01', serverTime: '2000-01-01' })).data;
  assert.equal(late.finishReason, 'expired'); assert.equal(late.score, 0); assert.deepEqual(late.answers, {});
});
test('historial finaliza intentos vencidos y permite crear el siguiente', async () => {
  const timed = (await req('/exams', payload())).data;
  await pool.query("UPDATE exam_attempts SET expires_at=clock_timestamp()-interval '1 second' WHERE id=$1", [timed.id]);
  const history = (await req('/exams')).data.attempts;
  assert.equal(history.find((item) => item.id === timed.id).finishReason, 'expired');
  const next = await req('/exams', payload({ durationMinutes: 120, questionIds: lessons.flatMap((l) => l.questions.map((q) => q.id)) }));
  assert.equal(next.status, 200); assert.equal(next.data.questionCount, 75);
});
