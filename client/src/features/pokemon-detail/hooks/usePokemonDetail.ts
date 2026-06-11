import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchPokemonDetail } from '../api';

export function usePokemonDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.pokemon.detail(id ?? -1),
    queryFn: () => fetchPokemonDetail(id!),
    enabled: id !== null,
  });
}
