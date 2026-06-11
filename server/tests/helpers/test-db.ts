import { pool } from '../../src/db/pool.js';

/** Refuses to truncate anything that isn't a *_test database. */
export async function truncateFavorites(): Promise<void> {
  const { rows } = await pool.query<{ db: string }>('SELECT current_database() AS db');
  const db = rows[0]?.db ?? '';
  if (!db.endsWith('_test')) {
    throw new Error(`Refusing to truncate non-test database "${db}"`);
  }
  await pool.query('TRUNCATE favorites');
}
