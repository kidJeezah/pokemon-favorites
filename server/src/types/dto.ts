export interface PokemonSummary {
  id: number;
  name: string;
  spriteUrl: string;
}

export interface PokemonListDto {
  count: number;
  results: PokemonSummary[];
}

export interface PokemonDetailDto {
  id: number;
  name: string;
  spriteUrl: string;
  types: string[];
  abilities: { name: string; isHidden: boolean }[];
}

export interface EvolutionDto {
  chainId: number;
  stages: PokemonSummary[][];
}

export interface FavoriteDto {
  pokemonId: number;
  name: string;
  createdAt: string;
}
