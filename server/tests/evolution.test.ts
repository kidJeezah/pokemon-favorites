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

describe('GET /api/pokemon/eevee/evolution', () => {
  it('flattens the real 8-branch chain (fixture = actual evolution-chain/67 payload)', async () => {
    const res = await request(app).get('/api/pokemon/eevee/evolution').expect(200);

    expect(res.body.chainId).toBe(67);
    expect(res.body.stages).toHaveLength(2);
    expect(res.body.stages[0]).toHaveLength(1);
    expect(res.body.stages[0][0]).toMatchObject({ id: 133, name: 'eevee' });
    expect(res.body.stages[1]).toHaveLength(8);
    expect(res.body.stages[1].map((p: { name: string }) => p.name)).toEqual([
      'vaporeon',
      'jolteon',
      'flareon',
      'espeon',
      'umbreon',
      'leafeon',
      'glaceon',
      'sylveon',
    ]);
    // Sprite urls resolve by id even for members outside 1–150 (sylveon 700).
    expect(res.body.stages[1][7].spriteUrl).toContain('/700.png');
  });

  it('caches the composed chain — three upstream fetches total, then zero', async () => {
    await request(app).get('/api/pokemon/eevee/evolution').expect(200);
    expect(upstreamCalls.pokemon + upstreamCalls.species + upstreamCalls.chain).toBe(3);

    await request(app).get('/api/pokemon/eevee/evolution').expect(200);
    expect(upstreamCalls.pokemon + upstreamCalls.species + upstreamCalls.chain).toBe(3);
  });
});
