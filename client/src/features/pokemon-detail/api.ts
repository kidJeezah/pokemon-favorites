import { apiFetch } from '@/shared/api/client';
import type { EvolutionStages, Pokemon } from '@/shared/types/pokemon';

export const fetchPokemonDetail = (id: number) => apiFetch<Pokemon>(`/api/pokemon/${id}`);

export const fetchEvolutionChain = (id: number) =>
  apiFetch<EvolutionStages>(`/api/pokemon/${id}/evolution`);
