import { randomUUID } from 'node:crypto';
import { lessons, modules } from '../src/data/learning.ts';

const bank = lessons.flatMap((lesson) => lesson.questions.map((question) => ({
  ...question, moduleId: lesson.moduleId, lessonTitle: lesson.title, references: lesson.references,
})));
const byId = new Map(bank.map((q) => [q.id, q]));
class ExamError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ExamError(status, message); };
const validId = (id) => typeof id === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);

function summary(row, now) {
  return { id: row.id, questionCount: row.questions.length, durationMinutes: row.duration_minutes,
    startedAt: row.started_at.toISOString(), expiresAt: row.expires_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null, finishReason: row.finish_reason,
    score: row.score, revision: row.revision, serverTime: now.toISOString(),
    moduleIds: [...new Set(row.questions.map((q) => q.moduleId))] };
}
function detail(row, now) {
  return { ...summary(row, now), answers: row.answers,
    questions: row.questions.map((q) => row.finished_at ? q : ({ id: q.id, prompt: q.prompt, options: q.options, moduleId: q.moduleId, lessonTitle: q.lessonTitle })) };
}
async function closeAttempt(db, row, now, submitted = false) {
  if (row.finished_at || (!submitted && now < row.expires_at)) return row;
  const expired = now >= row.expires_at;
  const score = row.questions.filter((q) => row.answers[q.id] === q.correctIndex).length;
  const { rows } = await db.query('UPDATE exam_attempts SET finished_at=$2, finish_reason=$3, score=$4, revision=revision+1 WHERE id=$1 RETURNING *',
    [row.id, expired ? row.expires_at : now, expired ? 'expired' : 'submitted', score]);
  return rows[0];
}

export function registerExamRoutes(app, pool, requireAuth) {
  // All mutation/expiry paths serialize through row locks; time comes from PostgreSQL after locking.
  const route = (handler) => async (req, res, next) => {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      const value = await handler(req, db);
      await db.query('COMMIT');
      res.json(value);
    } catch (error) {
      await db.query('ROLLBACK');
      if (error instanceof ExamError) res.status(error.status).json({ error: error.message });
      else next(error);
    } finally { db.release(); }
  };
  const clock = async (db) => (await db.query('SELECT clock_timestamp() AS now')).rows[0].now;
  async function ownAttempt(req, db) {
    if (!validId(req.params.id)) fail(404, 'Examen no encontrado.');
    const { rows } = await db.query('SELECT * FROM exam_attempts WHERE id=$1 AND user_id=$2 FOR UPDATE', [req.params.id, req.user.id]);
    if (!rows[0]) fail(404, 'Examen no encontrado.');
    const now = await clock(db);
    return { row: await closeAttempt(db, rows[0], now), now };
  }
  app.get('/exams/catalog', requireAuth, (_req, res) => res.json({ modules,
    questions: bank.map(({ id, prompt, moduleId, lessonTitle }) => ({ id, prompt, moduleId, lessonTitle })) }));
  app.get('/exams', requireAuth, route(async (req, db) => {
    const { rows } = await db.query('SELECT * FROM exam_attempts WHERE user_id=$1 ORDER BY started_at DESC LIMIT 50 FOR UPDATE', [req.user.id]);
    const now = await clock(db);
    const attempts = [];
    for (const row of rows) attempts.push(summary(await closeAttempt(db, row, now), now));
    return { attempts };
  }));
  app.post('/exams', requireAuth, route(async (req, db) => {
    const { questionIds, durationMinutes, requestKey } = req.body ?? {};
    if (!Array.isArray(questionIds) || !questionIds.length || questionIds.length > bank.length ||
      new Set(questionIds).size !== questionIds.length || questionIds.some((id) => !byId.has(id)))
      fail(400, 'Selecciona preguntas válidas, sin duplicados.');
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 120)
      fail(400, 'El tiempo debe ser un número entero entre 1 y 120 minutos.');
    if (typeof requestKey !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey)) fail(400, 'Identificador de creación inválido.');
    await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [req.user.id]);
    const existing = (await db.query('SELECT * FROM exam_attempts WHERE user_id=$1 AND request_key=$2 FOR UPDATE', [req.user.id, requestKey])).rows[0];
    let now = await clock(db);
    if (existing) {
      if (existing.duration_minutes !== durationMinutes || JSON.stringify(existing.questions.map((q) => q.id)) !== JSON.stringify(questionIds))
        fail(409, 'Este intento de creación ya se utilizó con otra configuración.');
      return detail(await closeAttempt(db, existing, now), now);
    }
    const active = (await db.query('SELECT * FROM exam_attempts WHERE user_id=$1 AND finished_at IS NULL FOR UPDATE', [req.user.id])).rows[0];
    now = await clock(db);
    if (active && !(await closeAttempt(db, active, now)).finished_at) fail(409, 'Ya tienes un examen en curso. Ábrelo desde Mis intentos para continuar o entregarlo.');
    const { rows } = await db.query(`INSERT INTO exam_attempts(id,user_id,request_key,questions,duration_minutes,started_at,expires_at)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [randomUUID(), req.user.id, requestKey, JSON.stringify(questionIds.map((id) => byId.get(id))), durationMinutes, now, new Date(now.getTime() + durationMinutes * 60000)]);
    return detail(rows[0], now);
  }));
  app.get('/exams/:id', requireAuth, route(async (req, db) => {
    const { row, now } = await ownAttempt(req, db); return detail(row, now);
  }));
  app.post('/exams/:id/answer', requireAuth, route(async (req, db) => {
    const { row, now } = await ownAttempt(req, db);
    if (row.finished_at) return detail(row, now); // Never accept answers beyond the deadline.
    const { questionId, answer, revision } = req.body ?? {};
    const question = row.questions.find((q) => q.id === questionId);
    if (!question || (answer !== null && (!Number.isInteger(answer) || answer < 0 || answer >= question.options.length)))
      fail(400, 'Respuesta inválida.');
    if (!Number.isInteger(revision) || revision < 0) fail(400, 'Versión de respuesta inválida.');
    if (row.revision !== revision) {
      if ((row.answers[questionId] ?? null) === answer) return detail(row, now); // Safe replay after lost response.
      fail(409, 'El examen cambió en otra pantalla. Recarga el intento antes de responder.');
    }
    const answers = { ...row.answers };
    if (answer === null) delete answers[questionId]; else answers[questionId] = answer;
    const { rows } = await db.query('UPDATE exam_attempts SET answers=$2, revision=revision+1 WHERE id=$1 RETURNING *', [row.id, JSON.stringify(answers)]);
    return detail(rows[0], now);
  }));
  app.post('/exams/:id/submit', requireAuth, route(async (req, db) => {
    const { row, now } = await ownAttempt(req, db);
    return detail(await closeAttempt(db, row, now, true), now);
  }));
}
