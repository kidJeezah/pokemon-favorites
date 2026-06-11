import pg from 'pg';
import { env } from '../config/env.js';

// SSL is decided by the connection string (`?sslmode=require`, which pg parses
// natively — Neon needs it). Render's internal Postgres URLs don't support SSL,
// so forcing it in production would crash the boot-time migration.
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10_000,
});
