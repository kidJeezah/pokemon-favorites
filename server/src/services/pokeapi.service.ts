import { env } from '../config/env.js';
import { cached } from '../lib/cache.js';
import { spriteUrl } from '../lib/sprites.js';
import { HttpError } from '../lib/http-error.js';
import type {
  TrimmedPokemon,
  UpstreamListResponse,
  UpstreamPokemon,
} from '../types/pokeapi.js';
import type { PokemonListDto } from '../types/dto.js';

/** Tolerates a trailing slash: ".../pokemon-species/25/" → 25 */
export const idFromUrl = (url: string): number => {
  const match = url.match(/\/(\d+)\/?$/);
  if (!match) throw new HttpError(502, 'UPSTREAM_ERROR', `Unparseable upstream URL: ${url}`);
  return Number(match[1]);
};

export async function fetchUpstream<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.POKEAPI_BASE_URL}${path}`, {
      signal: AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS),
      headers: { 'User-Agent': 'pokemon-favorites-takehome (github.com/kidJeezah)' },
    });
  } catch {
    throw new HttpError(502, 'UPSTREAM_ERROR', 'PokéAPI is unreachable or timed out');
  }
  if (res.status === 404) throw new HttpError(404, 'NOT_FOUND', 'Pokémon not found');
  if (!res.ok) throw new HttpError(502, 'UPSTREAM_ERROR', `PokéAPI responded ${res.status}`);
  return res.json() as Promise<T>;
}

export function getPokemonList(limit: number, offset: number): Promise<PokemonListDto> {
  // No second consumer of the raw list — safe to cache the final shape.
  return cached(`list:${limit}:${offset}`, async () => {
    const data = await fetchUpstream<UpstreamListResponse>(
      `/pokemon?limit=${limit}&offset=${offset}`,
    );
    const results = data.results.map((r) => {
      const id = idFromUrl(r.url);
      return { id, name: r.name, spriteUrl: spriteUrl(id) };
    });
    return { count: results.length, results };
  });
}

/** Layer-1 cache: trimmed upstream pokemon (~1KB). Keeps `species` for the evolution service. */
export function getUpstreamPokemon(idOrName: string): Promise<TrimmedPokemon> {
  return cached(`up:pokemon:${idOrName.toLowerCase()}`, async () => {
    const p = await fetchUpstream<UpstreamPokemon>(`/pokemon/${idOrName.toLowerCase()}`);
    return {
      id: p.id,
      name: p.name,
      abilities: p.abilities.map((a) => ({
        ability: { name: a.ability.name },
        is_hidden: a.is_hidden,
      })),
      types: p.types.map((t) => ({ slot: t.slot, type: { name: t.type.name } })),
      sprites: { front_default: p.sprites.front_default },
      species: { name: p.species.name, url: p.species.url },
    };
  });
}
