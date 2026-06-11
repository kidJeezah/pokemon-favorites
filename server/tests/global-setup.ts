// Runs in the Vitest main process — test.env from vitest.config does not apply here,
// so the test DATABASE_URL is pinned explicitly before importing anything env-dependent.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://pokemon:pokemon@localhost:5432/pokemon_test';

export default async function globalSetup() {
  const { migrate } = await import('../src/db/migrate.js');
  const { pool } = await import('../src/db/pool.js');
  await migrate();
  await pool.end();
}
