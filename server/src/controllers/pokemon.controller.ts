import type { Request, Response } from 'express';
import { getPokemonList, getUpstreamPokemon } from '../services/pokeapi.service.js';
import { getEvolutionStages } from '../services/evolution.service.js';
import { spriteUrl } from '../lib/sprites.js';
import type { PokemonDetailDto } from '../types/dto.js';

const DAY_SECONDS = 86_400;

export async function list(_req: Request, res: Response) {
  const { limit, offset } = res.locals.validated.query as { limit: number; offset: number };
  const dto = await getPokemonList(limit, offset);
  res.setHeader('Cache-Control', `public, max-age=${DAY_SECONDS}`).json(dto);
}

export async function detail(_req: Request, res: Response) {
  const { idOrName } = res.locals.validated.params as { idOrName: string };
  const p = await getUpstreamPokemon(idOrName);
  // Map the cached trimmed shape to the public DTO per response — `species` never leaves.
  const dto: PokemonDetailDto = {
    id: p.id,
    name: p.name,
    spriteUrl: spriteUrl(p.id),
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    abilities: p.abilities.map((a) => ({ name: a.ability.name, isHidden: a.is_hidden })),
  };
  res.setHeader('Cache-Control', `public, max-age=${DAY_SECONDS}`).json(dto);
}

export async function evolution(_req: Request, res: Response) {
  const { idOrName } = res.locals.validated.params as { idOrName: string };
  const dto = await getEvolutionStages(idOrName);
  res.setHeader('Cache-Control', `public, max-age=${DAY_SECONDS}`).json(dto);
}
