import { http, HttpResponse } from 'msw';
import type { Favorite } from '@/shared/types/pokemon';

// Absolute URLs — vitest env pins VITE_API_URL=http://localhost:3001 so apiFetch
// builds these exact URLs and there is no relative-URL interception ambiguity.
export const API = 'http://localhost:3001';

const spriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export const eeveeDetail = {
  id: 133,
  name: 'eevee',
  spriteUrl: spriteUrl(133),
  types: ['normal'],
  abilities: [
    { name: 'run-away', isHidden: false },
    { name: 'anticipation', isHidden: true },
  ],
};

export const eeveeEvolution = {
  chainId: 67,
  stages: [
    [{ id: 133, name: 'eevee', spriteUrl: spriteUrl(133) }],
    [
      { id: 134, name: 'vaporeon', spriteUrl: spriteUrl(134) },
      { id: 135, name: 'jolteon', spriteUrl: spriteUrl(135) },
      { id: 136, name: 'flareon', spriteUrl: spriteUrl(136) },
      { id: 196, name: 'espeon', spriteUrl: spriteUrl(196) },
      { id: 197, name: 'umbreon', spriteUrl: spriteUrl(197) },
      { id: 470, name: 'leafeon', spriteUrl: spriteUrl(470) },
      { id: 471, name: 'glaceon', spriteUrl: spriteUrl(471) },
      { id: 700, name: 'sylveon', spriteUrl: spriteUrl(700) },
    ],
  ],
};

export const handlers = [
  http.get(`${API}/api/pokemon`, () => {
    const results = Array.from({ length: 150 }, (_, i) => ({
      id: i + 1,
      name: `pokemon-${i + 1}`,
      spriteUrl: spriteUrl(i + 1),
    }));
    return HttpResponse.json({ count: 150, results });
  }),
  http.get(`${API}/api/pokemon/:id`, () => HttpResponse.json(eeveeDetail)),
  http.get(`${API}/api/pokemon/:id/evolution`, () => HttpResponse.json(eeveeEvolution)),
  http.get(`${API}/api/favorites`, () => HttpResponse.json({ favorites: [] as Favorite[] })),
  http.post(`${API}/api/favorites`, async ({ request }) => {
    const body = (await request.json()) as { pokemonId: number; name: string };
    return HttpResponse.json(
      { pokemonId: body.pokemonId, name: body.name, createdAt: new Date().toISOString() },
      { status: 201 },
    );
  }),
  http.delete(`${API}/api/favorites/:pokemonId`, () => new HttpResponse(null, { status: 204 })),
];
