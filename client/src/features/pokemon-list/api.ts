import { apiFetch } from '@/shared/api/client';
import type { PokemonListItem } from '@/shared/types/pokemon';

interface PokemonListResponse {
  count: number;
  results: PokemonListItem[];
}

export const fetchPokemonList = () =>
  apiFetch<PokemonListResponse>('/api/pokemon?limit=150').then((d) => d.results);
