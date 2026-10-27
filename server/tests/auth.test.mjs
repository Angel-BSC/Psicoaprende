import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createPool, migrate } from '../db.mjs';
import { createApp } from '../app.mjs';
import { hashToken } from '../security.mjs';
import { lessons, countCompletedLessons, isLessonUnlocked } from '../../src/data/learning.ts';

const first = lessons[0];
const second = lessons[1];
const correct = (lesson) => lesson.questions.map((q) => q.correctIndex);

const schema = `test_${randomUUID().replaceAll('-', '')}`;
const admin = createPool();
let pool, server, base;
const password = 'Una frase de prueba 2026!';
let alice, bob;
const input = (email, extra = {}) => ({ name: 'Ana Prueba', email, password, role: 'student', acceptedPrivacy: true, ...extra });
async function request(path, body, token, extraHeaders = {}) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Psico-Client': 'native', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, headers: response.headers, data: response.status === 204 ? null : await response.json() };
}
async function start() {
  server = (await createApp(pool, { authLimit: 100 })).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
}
async function stop() { await new Promise((resolve) => server.close(resolve)); }
before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  pool = createPool({ options: `-c search_path=${schema}` });
  await migrate(pool);
  await migrate(pool); // Idempotent schema bootstrap.
  await start();
});
after(async () => {
  if (server) await stop();
  if (pool) await pool.end();
  // Only this run's random, explicitly generated test schema is removed.
  await admin.query(`DROP SCHEMA ${schema} CASCADE`);
  await admin.end();
});

test('rechaza campos inválidos, roles inventados, contraseñas cortas y falta de consentimiento', async () => {
  for (const invalid of [null, {}, input('bad'), input('valid@example.test', { role: 'admin' }), input('valid@example.test', { role: 'professional' }),
    input('valid@example.test', { password: '123' }), input('valid@example.test', { acceptedPrivacy: false }),
    input('valid@example.test', { name: ' ' }), input('valid@example.test', { password: 'x'.repeat(129) }),
    input('valid@example.test', { password: ' '.repeat(12) })]) {
    assert.equal((await request('/auth/register', invalid)).status, 400);
  }
  assert.equal((await pool.query('SELECT count(*) FROM users')).rows[0].count, '0');
});
test('registro real, normalización y almacenamiento seguro', async () => {
  const result = await request('/auth/register', input('  ANA@example.test ', { role: undefined }));
  assert.equal(result.status, 201);
  alice = result.data;
  assert.equal(alice.user.email, 'ana@example.test');
  assert.equal(alice.user.name, 'Ana Prueba');
  assert.equal(alice.user.role, 'student');
  assert.match(alice.token, /^[\w-]{43}$/);
  assert.equal(alice.user.password_hash, undefined);
  const row = (await pool.query('SELECT * FROM users WHERE id=$1', [alice.user.id])).rows[0];
  assert.match(row.password_hash, /^scrypt\$131072\$8\$1\$/);
  assert.ok(!row.password_hash.includes(password));
  assert.equal(row.privacy_version, 'local-v4');
  const session = (await pool.query('SELECT * FROM sessions WHERE user_id=$1', [alice.user.id])).rows[0];
  assert.equal(session.token_hash, hashToken(alice.token));
  assert.notEqual(session.token_hash, alice.token);
});
test('correos duplicados incluso con mayúsculas no crean otra cuenta', async () => {
  assert.equal((await request('/auth/register', input('ANA@EXAMPLE.TEST'))).status, 409);
  assert.equal((await pool.query('SELECT count(*) FROM users')).rows[0].count, '1');
});
test('dos registros simultáneos del mismo correo crean una sola cuenta', async () => {
  const results = await Promise.all([request('/auth/register', input('race@example.test')), request('/auth/register', input('RACE@example.test'))]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
});
test('login falso y cuenta inexistente reciben el mismo error', async () => {
  const wrong = await request('/auth/login', { email: 'ana@example.test', password: 'incorrecta123' });
  const missing = await request('/auth/login', { email: 'missing@example.test', password });
  assert.equal(wrong.status, 401);
  assert.equal(missing.status, 401);
  assert.equal(wrong.data.error, missing.data.error);
});
test('login válido conserva identidad y permite recuperar la sesión', async () => {
  const result = await request('/auth/login', { email: ' ANA@example.test ', password });
  assert.equal(result.status, 200);
  assert.equal(result.data.user.id, alice.user.id);
  assert.notEqual(result.data.token, alice.token);
  assert.deepEqual((await request('/auth/me', undefined, alice.token)).data.user, alice.user);
});
test('rutas protegidas rechazan sesión ausente o manipulada', async () => {
  for (const path of ['/auth/me', '/progress']) {
    assert.equal((await request(path)).status, 401);
    assert.equal((await request(path, undefined, 'fake')).status, 401);
  }
});
test('progreso empieza en cero y queda aislado entre usuarios', async () => {
  bob = (await request('/auth/register', input('bob@example.test'))).data;
  assert.equal((await request('/progress', undefined, alice.token)).data.xp, 0);
  const result = await request('/progress/complete', { lessonId: first.id, answers: correct(first), xp: 9999, userId: bob.user.id }, alice.token);
  assert.equal(result.status, 200);
  assert.equal(result.data.progress.xp, 30);
  assert.equal(result.data.progress.dailyXp, 30);
  assert.equal(result.data.progress.streak, 1);
  assert.equal(result.data.score, 3);
  assert.equal((await request('/progress', undefined, bob.token)).data.xp, 0);
});
test('repetir una lección concurrentemente no duplica XP', async () => {
  const results = await Promise.all([1, 2].map(() => request('/progress/complete', { lessonId: first.id, answers: correct(first) }, alice.token)));
  for (const result of results) { assert.equal(result.data.progress.xp, 30); assert.equal(result.data.earnedXp, 0); }
});
test('valida respuestas y prerrequisitos del lado del servidor', async () => {
  assert.equal((await request('/progress/complete', { lessonId: second.id, answers: correct(second) }, bob.token)).status, 403);
  for (const answers of [[99], [0, 0, 99], [0, 0, -1], [0, 0, 0.5], ['0', 0, 0]]) {
    assert.equal((await request('/progress/complete', { lessonId: first.id, answers }, bob.token)).status, 400);
  }
  assert.equal((await request('/progress/complete', { lessonId: 'bases-psicologia', answers: [1, 2, 2] }, bob.token)).status, 400);
});

test('historial anterior conserva XP sin completar ni desbloquear el nuevo temario', async () => {
  await pool.query('INSERT INTO completions(user_id,lesson_id,xp,answers,score) VALUES($1,$2,30,$3,3)', [bob.user.id, 'bases-psicologia', '[1,2,2]']);
  const result = (await request('/progress', undefined, bob.token)).data;
  assert.equal(result.xp, 30);
  assert.equal(countCompletedLessons(result.completedLessonIds), 0);
  assert.equal(isLessonUnlocked(second.id, result.completedLessonIds), false);
  assert.equal((await request('/progress/complete', { lessonId: second.id, answers: correct(second) }, bob.token)).status, 403);
});

test('completar toda la ruta y repasarla calcula aciertos y no duplica recompensas', async () => {
  for (const lesson of lessons) {
    const answers = lesson.questions.map((q) => (q.correctIndex + 1) % q.options.length);
    const result = await request('/progress/complete', { lessonId: lesson.id, answers, score: 999 }, bob.token);
    assert.equal(result.status, 200);
    assert.equal(result.data.score, 0);
    assert.equal(result.data.earnedXp, lesson.xp); // XP por finalización, no por aciertos en esta versión.
  }
  const expectedXp = 30 + lessons.reduce((sum, lesson) => sum + lesson.xp, 0);
  const repeat = await request('/progress/complete', { lessonId: first.id, answers: correct(first) }, bob.token);
  assert.equal(repeat.data.score, first.questions.length);
  assert.equal(repeat.data.earnedXp, 0);
  assert.equal(repeat.data.progress.xp, expectedXp);
  assert.equal(countCompletedLessons(repeat.data.progress.completedLessonIds), lessons.length);
  const saved = (await pool.query('SELECT score FROM completions WHERE user_id=$1 AND lesson_id=$2', [bob.user.id, first.id])).rows[0];
  assert.equal(saved.score, 0); // Se conserva el primer intento; no es una medida de dominio.
});
test('cuenta, sesión y progreso sobreviven al reinicio de API y reconexión PostgreSQL', async () => {
  await stop();
  await pool.end();
  pool = createPool({ options: `-c search_path=${schema}` });
  await start();
  assert.equal((await request('/auth/me', undefined, alice.token)).data.user.id, alice.user.id);
  assert.equal((await request('/progress', undefined, alice.token)).data.xp, 30);
});
test('sesiones caducadas no permiten acceder', async () => {
  const session = (await request('/auth/login', { email: 'ana@example.test', password })).data;
  await pool.query('UPDATE sessions SET expires_at=now()-interval \'1 second\' WHERE token_hash=$1', [hashToken(session.token)]);
  assert.equal((await request('/auth/me', undefined, session.token)).status, 401);
});
test('cookies web HttpOnly, CORS y cierre de sesión revocable', async () => {
  const result = await request('/auth/login', { email: 'ana@example.test', password }, null, { Origin: 'http://localhost:8081', 'X-Psico-Client': 'web' });
  assert.equal(result.status, 200);
  assert.equal(result.data.token, undefined);
  const cookie = result.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(result.headers.get('access-control-allow-origin'), 'http://localhost:8081');
  const headers = { Cookie: cookie.split(';')[0], Origin: 'http://localhost:8081', 'X-Psico-Client': 'web' };
  assert.equal((await request('/auth/me', undefined, null, headers)).status, 200);
  assert.equal((await request('/auth/logout', {}, null, headers)).status, 204);
  assert.equal((await request('/auth/me', undefined, null, headers)).status, 401);
});
test('origen externo y petición sin encabezado de cliente son rechazados', async () => {
  assert.equal((await request('/auth/login', { email: 'ana@example.test', password }, null, { Origin: 'https://evil.example' })).status, 403);
  const result = await fetch(base + '/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(result.status, 403);
});
test('logout nativo revoca token y es idempotente', async () => {
  assert.equal((await request('/auth/logout', {}, alice.token)).status, 204);
  assert.equal((await request('/auth/me', undefined, alice.token)).status, 401);
  assert.equal((await request('/auth/logout', {}, alice.token)).status, 204);
});
test('límite de intentos contra fuerza bruta', async () => {
  let result;
  for (let i = 0; i < 11; i++) result = await request('/auth/login', { email: 'limit@example.test', password: '' });
  assert.equal(result.status, 429);
  assert.ok(result.headers.get('retry-after'));
});
