import { pool } from '../db/pool.js';
import { logger } from '../lib/logger.js';
import type { FavoriteDto } from '../types/dto.js';

interface FavoriteRow {
  pokemon_id: number;
  name: string;
  created_at: Date;
}

const mapRow = (row: FavoriteRow): FavoriteDto => ({
  pokemonId: row.pokemon_id,
  name: row.name,
  createdAt: row.created_at.toISOString(),
});

export async function listFavorites(): Promise<FavoriteDto[]> {
  const { rows } = await pool.query<FavoriteRow>(
    'SELECT * FROM favorites ORDER BY created_at DESC',
  );
  logger.info({ count: rows.length, source: 'postgres' }, 'favorites listed');
  return rows.map(mapRow);
}

/** Idempotent upsert: `created: true` → 201, false (already existed) → 200. */
export async function addFavorite(
  pokemonId: number,
  name: string,
): Promise<{ favorite: FavoriteDto; created: boolean }> {
  const inserted = await pool.query<FavoriteRow>(
    'INSERT INTO favorites (pokemon_id, name) VALUES ($1, $2) ON CONFLICT (pokemon_id) DO NOTHING RETURNING *',
    [pokemonId, name],
  );
  const row = inserted.rows[0];
  if (row) {
    logger.info({ pokemonId, name, created: true, source: 'postgres' }, 'favorite upserted');
    return { favorite: mapRow(row), created: true };
  }

  const existing = await pool.query<FavoriteRow>('SELECT * FROM favorites WHERE pokemon_id = $1', [
    pokemonId,
  ]);
  // Row deleted between the two queries — retry the race loser as a fresh insert is overkill
  // for a single-user app; treat as created-now via plain upsert semantics.
  const existingRow = existing.rows[0];
  if (!existingRow) {
    const retried = await pool.query<FavoriteRow>(
      'INSERT INTO favorites (pokemon_id, name) VALUES ($1, $2) ON CONFLICT (pokemon_id) DO NOTHING RETURNING *',
      [pokemonId, name],
    );
    const retriedRow = retried.rows[0];
    if (retriedRow) return { favorite: mapRow(retriedRow), created: true };
    throw new Error('Upsert race could not be resolved');
  }
  logger.info({ pokemonId, name, created: false, source: 'postgres' }, 'favorite upserted');
  return { favorite: mapRow(existingRow), created: false };
}

/** Idempotent: rowCount deliberately not checked — DELETE postcondition holds either way. */
export async function removeFavorite(pokemonId: number): Promise<void> {
  await pool.query('DELETE FROM favorites WHERE pokemon_id = $1', [pokemonId]);
  logger.info({ pokemonId, source: 'postgres' }, 'favorite deleted');
}
