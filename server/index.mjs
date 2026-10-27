import { createApp } from './app.mjs';
import { createPool, migrate } from './db.mjs';

const pool = createPool();
await migrate(pool);
const origins = (process.env.WEB_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081').split(',').map((s) => s.trim());
const app = await createApp(pool, { origins });
const port = Number(process.env.API_PORT || 3001);
const server = app.listen(port, process.env.API_HOST || '127.0.0.1', () => console.log(`PsicoAprende API lista en puerto ${port}; PostgreSQL conectado.`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
}
