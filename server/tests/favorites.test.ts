import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { truncateFavorites } from './helpers/test-db.js';

const app = createApp();

beforeAll(async () => {
  await truncateFavorites();
});

beforeEach(async () => {
  await truncateFavorites();
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/favorites', () => {
  it('creates a favorite → 201 with persisted DTO and a row in the table', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .send({ pokemonId: 25, name: 'pikachu' })
      .expect(201);

    expect(res.body).toMatchObject({ pokemonId: 25, name: 'pikachu' });
    expect(res.body.createdAt).toBeTruthy();

    const { rows } = await pool.query('SELECT * FROM favorites WHERE pokemon_id = 25');
    expect(rows).toHaveLength(1);
  });

  it('is idempotent for an existing pokemonId → 200, table count stays 1', async () => {
    await request(app).post('/api/favorites').send({ pokemonId: 25, name: 'pikachu' }).expect(201);
    const res = await request(app)
      .post('/api/favorites')
      .send({ pokemonId: 25, name: 'pikachu' })
      .expect(200);

    expect(res.body).toMatchObject({ pokemonId: 25, name: 'pikachu' });
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM favorites');
    expect(rows[0].n).toBe(1);
  });

  it('rejects invalid bodies → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .send({ pokemonId: 0, name: 'NOT A SLUG!' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/favorites/:pokemonId', () => {
  it('returns 204; repeated DELETE also 204', async () => {
    await request(app).post('/api/favorites').send({ pokemonId: 7, name: 'squirtle' }).expect(201);
    await request(app).delete('/api/favorites/7').expect(204);
    await request(app).delete('/api/favorites/7').expect(204);

    const { rows } = await pool.query('SELECT count(*)::int AS n FROM favorites');
    expect(rows[0].n).toBe(0);
  });
});

describe('GET /api/favorites', () => {
  it('returns favorites ordered created_at DESC', async () => {
    // Explicit timestamps — same-millisecond inserts would make DESC order flaky.
    await pool.query(
      `INSERT INTO favorites (pokemon_id, name, created_at) VALUES
       (1, 'bulbasaur', now() - interval '2 minutes'),
       (700, 'sylveon', now() - interval '1 minute'),
       (25, 'pikachu', now())`,
    );

    const res = await request(app).get('/api/favorites').expect(200);
    expect(res.body.favorites.map((f: { pokemonId: number }) => f.pokemonId)).toEqual([
      25, 700, 1,
    ]);
  });
});
