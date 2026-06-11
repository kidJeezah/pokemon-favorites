import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchEvolutionChain } from '../api';

export function useEvolutionChain(id: number | null) {
  return useQuery({
    queryKey: queryKeys.pokemon.evolution(id ?? -1),
    queryFn: () => fetchEvolutionChain(id!),
    enabled: id !== null,
  });
}
