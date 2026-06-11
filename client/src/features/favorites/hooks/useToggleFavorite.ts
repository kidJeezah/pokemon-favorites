import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import type { Favorite } from '@/shared/types/pokemon';
import { addFavorite, removeFavorite } from '../api';
import { useFavorites } from './useFavorites';

interface ToggleTarget {
  id: number;
  name: string;
}

/**
 * Both mutations share mutationKey ['favorites']; onSettled only invalidates when
 * it's the LAST in-flight favorites mutation, so rapid toggles of two Pokémon
 * can't clobber each other's optimistic entries.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { isFavorite } = useFavorites();

  const settle = () => {
    if (queryClient.isMutating({ mutationKey: ['favorites'] }) === 1) {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    }
  };

  const addMutation = useMutation({
    mutationKey: ['favorites'],
    mutationFn: (p: ToggleTarget) => addFavorite(p),
    onMutate: async (p) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previous = queryClient.getQueryData<Favorite[]>(queryKeys.favorites.all);
      queryClient.setQueryData<Favorite[]>(queryKeys.favorites.all, (old = []) => [
        { pokemonId: p.id, name: p.name },
        ...old,
      ]);
      return { previous };
    },
    onError: (_e, _p, ctx) => queryClient.setQueryData(queryKeys.favorites.all, ctx?.previous),
    onSettled: settle,
  });

  const removeMutation = useMutation({
    mutationKey: ['favorites'],
    mutationFn: (p: ToggleTarget) => removeFavorite(p.id),
    onMutate: async (p) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previous = queryClient.getQueryData<Favorite[]>(queryKeys.favorites.all);
      queryClient.setQueryData<Favorite[]>(queryKeys.favorites.all, (old = []) =>
        old.filter((f) => f.pokemonId !== p.id),
      );
      return { previous };
    },
    onError: (_e, _p, ctx) => queryClient.setQueryData(queryKeys.favorites.all, ctx?.previous),
    onSettled: settle,
  });

  return {
    toggle: (p: ToggleTarget) => {
      if (isFavorite(p.id)) removeMutation.mutate(p);
      else addMutation.mutate(p);
    },
  };
}
