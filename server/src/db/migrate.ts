import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

export async function migrate(): Promise<void> {
  const sql = await readFile(fileURLToPath(new URL('./sql/001_init.sql', import.meta.url)), 'utf8');
  await pool.query(sql);
}

// Allow `npm run db:migrate` to run this file directly.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  migrate()
    .then(() => {
      console.log('Migration applied');
      return pool.end();
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
