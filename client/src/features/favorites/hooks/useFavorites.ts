import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { fetchFavorites } from '../api';

export function useFavorites() {
  const query = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: fetchFavorites,
    // Favorites are mutable (unlike PokéAPI data) — refresh covers multi-tab drift.
    staleTime: 30_000,
  });

  const favoriteIds = useMemo(
    () => new Set((query.data ?? []).map((f) => f.pokemonId)),
    [query.data],
  );

  return {
    ...query,
    favoriteIds,
    isFavorite: (id: number) => favoriteIds.has(id),
  };
}
