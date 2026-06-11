import { useUiStore } from '@/shared/store/uiStore';
import { spriteUrl } from '@/shared/lib/sprites';
import { useFavorites } from '@/features/favorites';
import type { PokemonListItem } from '@/shared/types/pokemon';
import { usePokemonList } from './usePokemonList';

interface DisplayedPokemon {
  items: PokemonListItem[];
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  showingFavorites: boolean;
}

/**
 * Favorites-only renders DIRECTLY from the favorites query (not list ∩ favoriteIds):
 * evolution members with IDs > 150 (Sylveon 700, Pichu 172…) can be favorited and
 * must appear here — intersection filtering would silently drop them.
 */
export function useDisplayedPokemon(): DisplayedPokemon {
  const showFavoritesOnly = useUiStore((s) => s.showFavoritesOnly);
  const list = usePokemonList();
  const favorites = useFavorites();

  if (showFavoritesOnly) {
    return {
      items: (favorites.data ?? []).map((f) => ({
        id: f.pokemonId,
        name: f.name,
        spriteUrl: spriteUrl(f.pokemonId),
      })),
      isPending: favorites.isPending,
      isError: favorites.isError,
      error: favorites.error,
      refetch: favorites.refetch,
      showingFavorites: true,
    };
  }

  return {
    items: list.data ?? [],
    isPending: list.isPending,
    isError: list.isError,
    error: list.error,
    refetch: list.refetch,
    showingFavorites: false,
  };
}
