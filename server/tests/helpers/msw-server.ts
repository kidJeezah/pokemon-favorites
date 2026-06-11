import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const POKEAPI = 'https://pokeapi.co/api/v2';

const eeveeChain = JSON.parse(
  readFileSync(fileURLToPath(new URL('../fixtures/evolution-chain-67.json', import.meta.url)), 'utf8'),
) as unknown;

export const upstreamCalls = { pokemon: 0, species: 0, chain: 0, list: 0 };

export function resetUpstreamCalls() {
  upstreamCalls.pokemon = 0;
  upstreamCalls.species = 0;
  upstreamCalls.chain = 0;
  upstreamCalls.list = 0;
}

const pikachu = {
  id: 25,
  name: 'pikachu',
  abilities: [
    { ability: { name: 'static' }, is_hidden: false },
    { ability: { name: 'lightning-rod' }, is_hidden: true },
  ],
  types: [{ slot: 1, type: { name: 'electric' } }],
  sprites: { front_default: 'https://example.com/25.png' },
  species: { name: 'pikachu', url: `${POKEAPI}/pokemon-species/25/` },
};

const eevee = {
  id: 133,
  name: 'eevee',
  abilities: [{ ability: { name: 'run-away' }, is_hidden: false }],
  types: [{ slot: 1, type: { name: 'normal' } }],
  sprites: { front_default: 'https://example.com/133.png' },
  species: { name: 'eevee', url: `${POKEAPI}/pokemon-species/133/` },
};

export const mswServer = setupServer(
  http.get(`${POKEAPI}/pokemon`, ({ request }) => {
    upstreamCalls.list += 1;
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const results = Array.from({ length: limit }, (_, i) => ({
      name: `pokemon-${offset + i + 1}`,
      url: `${POKEAPI}/pokemon/${offset + i + 1}/`,
    }));
    return HttpResponse.json({ count: 1350, results });
  }),
  http.get(`${POKEAPI}/pokemon/:idOrName`, ({ params }) => {
    upstreamCalls.pokemon += 1;
    const key = String(params.idOrName);
    if (key === 'pikachu' || key === '25') return HttpResponse.json(pikachu);
    if (key === 'eevee' || key === '133') return HttpResponse.json(eevee);
    if (key === 'servererror') return new HttpResponse(null, { status: 500 });
    return new HttpResponse(null, { status: 404 });
  }),
  http.get(`${POKEAPI}/pokemon-species/:id`, ({ params }) => {
    upstreamCalls.species += 1;
    if (String(params.id) === '133') {
      return HttpResponse.json({ evolution_chain: { url: `${POKEAPI}/evolution-chain/67/` } });
    }
    return new HttpResponse(null, { status: 404 });
  }),
  http.get(`${POKEAPI}/evolution-chain/:id`, ({ params }) => {
    upstreamCalls.chain += 1;
    if (String(params.id) === '67') return HttpResponse.json(eeveeChain);
    return new HttpResponse(null, { status: 404 });
  }),
);
