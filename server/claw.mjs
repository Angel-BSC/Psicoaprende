import { randomInt, randomUUID } from 'node:crypto';
import { capsuleRarities } from '../src/lib/claw-contract.ts';
import { createCapsules } from '../src/lib/claw-machine.ts';
import { clinicalCases } from './data/claw-cases.mjs';
import { drawCapsuleRarity } from './claw-rarity.mjs';
import { coinBalance } from './profile.mjs';

const uuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function board() {
  return createCapsules().map(({ x, y }) => ({ id: randomUUID(), x, y, color: 0 }));
}
function publicAttempt(row) {
  const { id, topic, title, stem, options, rarity } = row.question;
  const rewards = capsuleRarities[rarity];
  return { id: row.id, capsuleId: row.capsule_id, rarity, question: { id, topic, title, stem, options },
    rewardAvailable: row.reward_available, potentialXp: row.reward_available ? rewards.xp : 0,
    potentialCoins: row.reward_available ? rewards.coins : 0, result: row.result };
}
const reject = (status, message) => { const error = new Error(message); error.status = status; throw error; };

export function registerClawRoutes(app, pool, requireAuth) {
  // One user-row lock serializes board creation, capture, answer, reward and acknowledgement.
  const action = (handler) => async (req, res) => {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [req.user.id]);
      const output = await handler(db, req);
      await db.query('COMMIT'); res.json(output);
    } catch (error) {
      await db.query('ROLLBACK');
      if (error.status) return res.status(error.status).json({ error: error.message });
      throw error;
    } finally { db.release(); }
  };
  async function status(db, userId) {
    await db.query('INSERT INTO claw_boards(user_id,capsules) VALUES($1,$2) ON CONFLICT DO NOTHING', [userId, JSON.stringify(board())]);
    const inventory = await db.query('SELECT capsules FROM claw_boards WHERE user_id=$1', [userId]);
    const active = await db.query('SELECT * FROM claw_attempts WHERE user_id=$1 AND closed_at IS NULL', [userId]);
    const wallet = await db.query('SELECT COALESCE(sum(coins),0)::integer AS coins, COALESCE(sum(xp),0)::integer AS xp FROM claw_case_rewards WHERE user_id=$1', [userId]);
    const lessons = await db.query('SELECT COALESCE(sum(xp),0)::integer AS xp FROM completions WHERE user_id=$1', [userId]);
    // Old boards may contain rarity/color fields. Never expose or use those assignments.
    // Keep IDs/positions and already-opened attempts intact; no destructive migration needed.
    return { capsules: inventory.rows[0].capsules.map(({ id, x, y }) => ({ id, x, y, color: 0 })), activeAttempt: active.rows[0] ? publicAttempt(active.rows[0]) : null,
      wallet: { coins: await coinBalance(db, userId), xp: wallet.rows[0].xp + lessons.rows[0].xp } };
  }
  app.get('/claw', requireAuth, action((db, req) => status(db, req.user.id)));
  app.post('/claw/refill', requireAuth, action(async (db, req) => {
    const current = await status(db, req.user.id);
    if (current.activeAttempt || current.capsules.length) reject(409, 'Termina el caso y vacía la máquina antes de rellenarla.');
    await db.query('UPDATE claw_boards SET capsules=$2 WHERE user_id=$1', [req.user.id, JSON.stringify(board())]);
    return status(db, req.user.id);
  }));
  app.post('/claw/attempts', requireAuth, action(async (db, req) => {
    const { capsuleId } = req.body ?? {};
    if (!uuid(capsuleId)) reject(400, 'Cápsula inválida.');
    const existing = await db.query('SELECT * FROM claw_attempts WHERE user_id=$1 AND capsule_id=$2', [req.user.id, capsuleId]);
    if (existing.rows[0]) {
      if (existing.rows[0].closed_at) reject(409, 'Esta cápsula ya se completó. Actualiza la máquina.');
      return { attempt: publicAttempt(existing.rows[0]) };
    }
    const current = await status(db, req.user.id);
    if (current.activeAttempt) reject(409, 'Tienes un caso pendiente. Actualiza la máquina para continuarlo.');
    const capsule = current.capsules.find((item) => item.id === capsuleId);
    if (!capsule) reject(404, 'Esta cápsula ya no está disponible. Actualiza la máquina.');
    const seen = await db.query("SELECT question->>'id' AS id, count(*)::integer AS count FROM claw_attempts WHERE user_id=$1 GROUP BY question->>'id'", [req.user.id]);
    const counts = new Map(seen.rows.map((row) => [row.id, row.count]));
    // Draw after ownership and pending-attempt checks, and only for a NEW opening.
    // The selected question snapshots the rarity in the same transaction as consumption.
    const rarity = drawCapsuleRarity();
    const candidates = clinicalCases.filter((item) => item.rarity === rarity);
    const min = Math.min(...candidates.map((item) => counts.get(item.id) ?? 0));
    const fresh = candidates.filter((item) => (counts.get(item.id) ?? 0) === min);
    const question = fresh[randomInt(fresh.length)];
    const rewarded = await db.query('SELECT 1 FROM claw_case_rewards WHERE user_id=$1 AND question_id=$2', [req.user.id, question.id]);
    const row = await db.query('INSERT INTO claw_attempts(id,user_id,capsule_id,question,reward_available) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [randomUUID(), req.user.id, capsuleId, JSON.stringify(question), !rewarded.rowCount]);
    await db.query('UPDATE claw_boards SET capsules=$2 WHERE user_id=$1', [req.user.id, JSON.stringify(current.capsules.filter((item) => item.id !== capsuleId))]);
    return { attempt: publicAttempt(row.rows[0]) };
  }));
  app.post('/claw/attempts/:id/answer', requireAuth, action(async (db, req) => {
    if (!uuid(req.params.id)) reject(404, 'Caso no encontrado.');
    const { rows } = await db.query('SELECT * FROM claw_attempts WHERE user_id=$1 AND id=$2', [req.user.id, req.params.id]);
    const row = rows[0];
    if (!row) reject(404, 'Caso no encontrado.');
    const { answer } = req.body ?? {};
    const q = row.question;
    if (!Number.isInteger(answer) || answer < 0 || answer >= q.options.length) reject(400, 'Selecciona una respuesta válida.');
    if (row.result) {
      if (row.result.answer !== answer) reject(409, 'Este caso ya fue respondido. Actualiza para ver el resultado guardado.');
      return { attempt: publicAttempt(row) };
    }
    const correct = answer === q.correctIndex;
    let earnedXp = 0, earnedCoins = 0;
    if (correct) {
      const reward = capsuleRarities[q.rarity];
      const awarded = await db.query('INSERT INTO claw_case_rewards(user_id,question_id,attempt_id,xp,coins) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,question_id) DO NOTHING',
        [req.user.id, q.id, row.id, reward.xp, reward.coins]);
      if (awarded.rowCount) { earnedXp = reward.xp; earnedCoins = reward.coins; }
    }
    const result = { answer, correct, correctIndex: q.correctIndex, explanation: q.explanation, optionExplanations: q.optionExplanations,
      pdfPages: q.pdfPages, sources: q.sources, editorialNote: q.editorialNote, earnedXp, earnedCoins };
    await db.query('UPDATE claw_attempts SET result=$2 WHERE id=$1', [row.id, JSON.stringify(result)]);
    return { attempt: publicAttempt({ ...row, result }) };
  }));
  app.post('/claw/attempts/:id/close', requireAuth, action(async (db, req) => {
    if (!uuid(req.params.id)) reject(404, 'Caso no encontrado.');
    const { rows } = await db.query('SELECT * FROM claw_attempts WHERE user_id=$1 AND id=$2', [req.user.id, req.params.id]);
    if (!rows[0]) reject(404, 'Caso no encontrado.');
    if (!rows[0].result) reject(409, 'Responde el caso antes de recoger otra cápsula.');
    await db.query('UPDATE claw_attempts SET closed_at=COALESCE(closed_at,now()) WHERE id=$1', [req.params.id]);
    return status(db, req.user.id);
  }));
}
