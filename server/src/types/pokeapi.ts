// Minimal upstream shapes — only the fields we read.

export interface UpstreamListResponse {
  results: { name: string; url: string }[];
}

export interface UpstreamPokemon {
  id: number;
  name: string;
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  types: { slot: number; type: { name: string } }[];
  sprites: { front_default: string | null };
  species: { name: string; url: string };
}

/** Layer-1 cached trim of UpstreamPokemon — keeps `species` for the evolution service. */
export type TrimmedPokemon = Pick<
  UpstreamPokemon,
  'id' | 'name' | 'abilities' | 'types' | 'sprites' | 'species'
>;

export interface UpstreamSpecies {
  evolution_chain: { url: string };
}

export interface ChainLink {
  species: { name: string; url: string };
  evolves_to: ChainLink[];
}

export interface UpstreamEvolutionChain {
  id: number;
  chain: ChainLink;
}
