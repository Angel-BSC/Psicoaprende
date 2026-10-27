import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword, newToken, hashToken } from './security.mjs';
import { registrationErrors, normalizeEmail, validEmail, PRIVACY_VERSION } from '../src/lib/validation.ts';
import { lessons } from '../src/data/learning.ts';
import { registerExamRoutes } from './exams.mjs';
import { registerClawRoutes } from './claw.mjs';
import { registerProfileRoutes, coinBalance } from './profile.mjs';

const cookieName = 'psico_session';
const ttl = 30 * 24 * 60 * 60 * 1000;
const publicUser = ({ id, name, email, role }) => ({ id, name, email, role });
const unauthorized = (res) => res.status(401).json({ error: 'La sesión terminó. Inicia sesión nuevamente.' });

export async function createApp(pool, { origins = ['http://localhost:8081', 'http://127.0.0.1:8081'], authLimit = 30 } = {}) {
  const app = express();
  const dummyHash = await hashPassword(newToken());
  const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/auth' };
  // Cookie must also accompany progress endpoints.
  cookieOptions.path = '/';
  app.disable('x-powered-by');
  app.use(helmet());
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.headers.origin && !origins.includes(req.headers.origin))
      return res.status(403).json({ error: 'Origen no permitido.' });
    next();
  });
  app.use(cors({ origin: origins, credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'X-Psico-Client'] }));
  app.use(express.json({ limit: '8kb' }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !['web', 'native'].includes(req.get('X-Psico-Client')))
      return res.status(403).json({ error: 'Solicitud no permitida.' });
    next();
  });
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: authLimit, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Demasiados intentos. Vuelve a intentar en 15 minutos.' } });
  const accountLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    keyGenerator: (req) => hashToken(typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : 'invalid'),
    message: { error: 'Demasiados intentos. Vuelve a intentar en 15 minutos.' } });
  app.use(['/auth/register', '/auth/login'], limiter, accountLimiter);

  async function issueSession(db, user) {
    const token = newToken();
    await db.query('DELETE FROM sessions WHERE user_id = $1 AND expires_at <= now()', [user.id]);
    await db.query('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1,$2,$3)',
      [hashToken(token), user.id, new Date(Date.now() + ttl)]);
    return token;
  }
  function sendSession(req, res, user, token, status = 200) {
    // Browsers receive HttpOnly cookies; native clients use Keychain/Keystore bearer tokens.
    if (req.headers.origin || req.get('X-Psico-Client') === 'web') {
      res.cookie(cookieName, token, { ...cookieOptions, maxAge: ttl });
      return res.status(status).json({ user: publicUser(user) });
    }
    return res.status(status).json({ user: publicUser(user), token });
  }
  async function requireAuth(req, res, next) {
    const token = req.get('Authorization')?.replace(/^Bearer /, '') || req.cookies[cookieName];
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return unauthorized(res);
    const result = await pool.query(
      'SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at > now()', [hashToken(token)]);
    if (!result.rows[0]) return unauthorized(res);
    req.user = publicUser(result.rows[0]);
    req.tokenHash = hashToken(token);
    next();
  }

  app.get('/health', async (_req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'postgresql' }); });
  app.post('/auth/register', async (req, res) => {
    const fields = registrationErrors(req.body);
    if (Object.keys(fields).length) return res.status(400).json({ error: 'Revisa los campos indicados.', fields });
    const { name, email, password } = req.body;
    const passwordHash = await hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO users(id,name,email,password_hash,role,privacy_version) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,name,email,role',
        [randomUUID(), name.trim(), normalizeEmail(email), passwordHash, 'student', PRIVACY_VERSION]);
      const token = await issueSession(client, rows[0]);
      await client.query('COMMIT');
      sendSession(req, res, rows[0], token, 201);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') return res.status(409).json({ error: 'Este correo ya tiene una cuenta. Inicia sesión.' });
      throw error;
    } finally { client.release(); }
  });
  app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!validEmail(email) || typeof password !== 'string' || !password.length || password.length > 128)
      return res.status(400).json({ error: 'Ingresa un correo válido y tu contraseña.' });
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [normalizeEmail(email)]);
    const valid = await verifyPassword(password, rows[0]?.password_hash ?? dummyHash);
    if (!valid || !rows[0]) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    const token = await issueSession(pool, rows[0]);
    sendSession(req, res, rows[0], token);
  });
  app.get('/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));
  app.post('/auth/logout', async (req, res) => {
    const token = req.get('Authorization')?.replace(/^Bearer /, '') || req.cookies[cookieName];
    if (typeof token === 'string') await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).end();
  });

  async function progress(userId) {
    const { rows } = await pool.query('SELECT lesson_id, xp, to_char(completed_at AT TIME ZONE $2, \'YYYY-MM-DD\') AS day FROM completions WHERE user_id=$1 ORDER BY completed_at', [userId, 'America/Guayaquil']);
    const rewards = await pool.query("SELECT xp, coins, to_char(earned_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day FROM claw_case_rewards WHERE user_id=$1", [userId, 'America/Guayaquil']);
    const activity = [...rows, ...rewards.rows];
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const days = new Set(activity.map((r) => r.day));
    const cursor = new Date(`${today}T12:00:00Z`);
    if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
    let streak = 0;
    while (days.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
    const preferences = await pool.query('SELECT daily_goal FROM profile_preferences WHERE user_id=$1', [userId]);
    return { xp: activity.reduce((sum, r) => sum + r.xp, 0), dailyXp: activity.filter((r) => r.day === today).reduce((sum, r) => sum + r.xp, 0),
      coins: await coinBalance(pool, userId),
      streak, dailyGoal: preferences.rows[0]?.daily_goal ?? 50, completedLessonIds: rows.map((r) => r.lesson_id) };
  }
  app.get('/progress', requireAuth, async (req, res) => res.json(await progress(req.user.id)));
  app.post('/progress/complete', requireAuth, async (req, res) => {
    const { lessonId, answers } = req.body ?? {};
    const index = lessons.findIndex((l) => l.id === lessonId);
    const lesson = lessons[index];
    if (!lesson || !Array.isArray(answers) || answers.length !== lesson.questions.length ||
      answers.some((answer, i) => !Number.isInteger(answer) || answer < 0 || answer >= lesson.questions[i].options.length))
      return res.status(400).json({ error: 'Respuestas de lección inválidas.' });
    if (index > 0) {
      const prerequisite = await pool.query('SELECT 1 FROM completions WHERE user_id=$1 AND lesson_id=$2', [req.user.id, lessons[index - 1].id]);
      if (!prerequisite.rowCount) return res.status(403).json({ error: 'Completa la lección anterior primero.' });
    }
    const score = answers.filter((answer, i) => answer === lesson.questions[i].correctIndex).length;
    const result = await pool.query('INSERT INTO completions(user_id,lesson_id,xp,answers,score) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
      [req.user.id, lesson.id, lesson.xp, JSON.stringify(answers), score]);
    res.json({ progress: await progress(req.user.id), earnedXp: result.rowCount ? lesson.xp : 0, score });
  });
  registerExamRoutes(app, pool, requireAuth);
  registerClawRoutes(app, pool, requireAuth);
  registerProfileRoutes(app, pool, requireAuth);
  app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Solicitud demasiado grande.' });
    console.error('API error:', error.code || error.name); // Never log request bodies or credentials.
    res.status(503).json({ error: 'El servicio no está disponible. Intenta nuevamente.' });
  });
  return app;
}
