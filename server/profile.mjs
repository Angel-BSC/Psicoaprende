import { profileItems, validProfileChanges } from '../src/lib/profile-contract.ts';

export async function coinBalance(db, userId) {
  const { rows } = await db.query(`SELECT
    COALESCE((SELECT sum(coins) FROM claw_case_rewards WHERE user_id=$1),0) -
    COALESCE((SELECT sum(price) FROM profile_purchases WHERE user_id=$1),0) AS balance`, [userId]);
  return Number(rows[0].balance);
}
export function registerProfileRoutes(app, pool, requireAuth) {
  async function read(db, userId) {
    await db.query('INSERT INTO profile_preferences(user_id) VALUES($1) ON CONFLICT DO NOTHING', [userId]);
    const { rows } = await db.query(`SELECT u.name,p.* FROM users u JOIN profile_preferences p ON p.user_id=u.id WHERE u.id=$1`, [userId]);
    const owned = await db.query('SELECT item_id FROM profile_purchases WHERE user_id=$1 ORDER BY item_id', [userId]);
    const p = rows[0];
    return { name: p.name, dailyGoal: p.daily_goal, readingSize: p.reading_size, roomyReading: p.roomy_reading,
      equippedItem: p.equipped_item, ownedItems: ['classic', ...owned.rows.map((row) => row.item_id)], coins: await coinBalance(db, userId) };
  }
  // Same lock as arcade rewards: purchases cannot race each other or award updates.
  const action = (handler) => async (req, res) => {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      await db.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [req.user.id]);
      const current = await read(db, req.user.id);
      await handler(db, req, current);
      const profile = await read(db, req.user.id);
      await db.query('COMMIT'); res.json(profile);
    } catch (error) {
      await db.query('ROLLBACK');
      if (error.status) return res.status(error.status).json({ error: error.message });
      throw error;
    } finally { db.release(); }
  };
  const reject = (status, message) => { const e = new Error(message); e.status = status; throw e; };
  app.get('/profile', requireAuth, action(async () => {}));
  app.post('/profile', requireAuth, action(async (db, req, current) => {
    if (!validProfileChanges(req.body)) reject(400, 'Revisa el nombre y los ajustes seleccionados.');
    const next = { ...current, ...req.body };
    if ('name' in req.body) await db.query('UPDATE users SET name=$2 WHERE id=$1', [req.user.id, next.name.trim()]);
    await db.query('UPDATE profile_preferences SET daily_goal=$2,reading_size=$3,roomy_reading=$4 WHERE user_id=$1',
      [req.user.id, next.dailyGoal, next.readingSize, next.roomyReading]);
  }));
  app.post('/profile/purchase', requireAuth, action(async (db, req, current) => {
    const item = profileItems.find((item) => item.id === req.body?.itemId);
    if (!item) reject(400, 'Objeto no disponible.');
    if (current.ownedItems.includes(item.id)) return; // Network retries never charge twice.
    if (current.coins < item.price) reject(409, 'No tienes suficientes monedas para este objeto.');
    await db.query('INSERT INTO profile_purchases(user_id,item_id,price) VALUES($1,$2,$3)', [req.user.id, item.id, item.price]);
  }));
  app.post('/profile/equip', requireAuth, action(async (db, req, current) => {
    const item = profileItems.find((item) => item.id === req.body?.itemId);
    if (!item || !current.ownedItems.includes(item.id)) reject(400, 'Primero debes conseguir este objeto.');
    await db.query('UPDATE profile_preferences SET equipped_item=$2 WHERE user_id=$1', [req.user.id, item.id]);
  }));
}
