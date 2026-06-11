import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchPokemonList } from '../api';

export function usePokemonList() {
  return useQuery({
    queryKey: queryKeys.pokemon.list,
    queryFn: fetchPokemonList,
  });
}
