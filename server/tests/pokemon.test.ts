import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { clearCache } from '../src/lib/cache.js';
import { mswServer, resetUpstreamCalls, upstreamCalls } from './helpers/msw-server.js';

const app = createApp();

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => {
  clearCache();
  resetUpstreamCalls();
});
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());

describe('GET /api/pokemon', () => {
  it('returns the mapped list with ids and sprite urls derived from upstream urls', async () => {
    const res = await request(app).get('/api/pokemon?limit=150').expect(200);
    expect(res.body.count).toBe(150);
    expect(res.body.results[0]).toEqual({
      id: 1,
      name: 'pokemon-1',
      spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    });
  });

  it('rejects out-of-range limit → 400', async () => {
    const res = await request(app).get('/api/pokemon?limit=9999').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/pokemon/:idOrName', () => {
  it('returns the slimmed DTO', async () => {
    const res = await request(app).get('/api/pokemon/pikachu').expect(200);
    expect(res.body).toEqual({
      id: 25,
      name: 'pikachu',
      spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      types: ['electric'],
      abilities: [
        { name: 'static', isHidden: false },
        { name: 'lightning-rod', isHidden: true },
      ],
    });
    expect(res.headers['cache-control']).toBe('public, max-age=86400');
  });

  it('serves the second request from cache (one upstream call)', async () => {
    await request(app).get('/api/pokemon/pikachu').expect(200);
    await request(app).get('/api/pokemon/pikachu').expect(200);
    expect(upstreamCalls.pokemon).toBe(1);
  });

  it('maps upstream 404 → 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/pokemon/notapokemon').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('maps upstream 500 → 502 UPSTREAM_ERROR', async () => {
    const res = await request(app).get('/api/pokemon/servererror').expect(502);
    expect(res.body.error.code).toBe('UPSTREAM_ERROR');
  });

  it('does not cache errors — a failing fetch is retried upstream', async () => {
    await request(app).get('/api/pokemon/servererror').expect(502);
    await request(app).get('/api/pokemon/servererror').expect(502);
    expect(upstreamCalls.pokemon).toBe(2);
  });
});
