export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'steel'
  | 'dark'
  | 'fairy';

export interface PokemonListItem {
  id: number;
  name: string;
  spriteUrl: string;
}

export interface Pokemon extends PokemonListItem {
  types: PokemonType[];
  abilities: { name: string; isHidden: boolean }[];
}

export interface EvolutionStages {
  chainId: number;
  stages: PokemonListItem[][];
}

export interface Favorite {
  pokemonId: number;
  name: string;
  createdAt?: string;
}
