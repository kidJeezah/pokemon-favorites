import { cached } from '../lib/cache.js';
import { spriteUrl } from '../lib/sprites.js';
import { fetchUpstream, getUpstreamPokemon, idFromUrl } from './pokeapi.service.js';
import type { ChainLink, UpstreamEvolutionChain, UpstreamSpecies } from '../types/pokeapi.js';
import type { EvolutionDto, PokemonSummary } from '../types/dto.js';

function flattenChain(root: ChainLink): PokemonSummary[][] {
  const stages: PokemonSummary[][] = [];
  const walk = (node: ChainLink, depth: number) => {
    const id = idFromUrl(node.species.url);
    (stages[depth] ??= []).push({ id, name: node.species.name, spriteUrl: spriteUrl(id) });
    for (const child of node.evolves_to) walk(child, depth + 1);
  };
  walk(root, 0);
  return stages;
}

export async function getEvolutionStages(idOrName: string): Promise<EvolutionDto> {
  // Reuses the layer-1 pokemon fetch so `25` and `pikachu` resolve uniformly.
  const pokemon = await getUpstreamPokemon(idOrName);
  const speciesId = idFromUrl(pokemon.species.url);

  const chainId = await cached(`up:species:${speciesId}`, async () => {
    const species = await fetchUpstream<UpstreamSpecies>(`/pokemon-species/${speciesId}`);
    return idFromUrl(species.evolution_chain.url);
  });

  // Layer-2 cache keyed by chainId — pikachu, raichu, and pichu share one entry.
  return cached(`chain:${chainId}`, async () => {
    const chain = await fetchUpstream<UpstreamEvolutionChain>(`/evolution-chain/${chainId}`);
    return { chainId, stages: flattenChain(chain.chain) };
  });
}
