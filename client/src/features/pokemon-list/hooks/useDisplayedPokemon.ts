import { useUiStore } from '@/shared/store/uiStore';
import { spriteUrl } from '@/shared/lib/sprites';
import { formatName } from '@/shared/lib/formatName';
import { useFavorites } from '@/features/favorites';
import type { PokemonListItem } from '@/shared/types/pokemon';
import { usePokemonList } from './usePokemonList';

/** Mockup-style match: name (slug or display form) or dex number ("25" / "025"). */
function matchesQuery(p: PokemonListItem, q: string): boolean {
  if (!q) return true;
  return (
    p.name.includes(q) ||
    formatName(p.name).toLowerCase().includes(q) ||
    String(p.id) === q ||
    String(p.id).padStart(3, '0').includes(q)
  );
}

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
  const searchQuery = useUiStore((s) => s.searchQuery);
  const list = usePokemonList();
  const favorites = useFavorites();
  const q = searchQuery.trim().toLowerCase();

  if (showFavoritesOnly) {
    return {
      items: (favorites.data ?? [])
        .map((f) => ({
          id: f.pokemonId,
          name: f.name,
          spriteUrl: spriteUrl(f.pokemonId),
        }))
        .filter((p) => matchesQuery(p, q)),
      isPending: favorites.isPending,
      isError: favorites.isError,
      error: favorites.error,
      refetch: favorites.refetch,
      showingFavorites: true,
    };
  }

  return {
    items: (list.data ?? []).filter((p) => matchesQuery(p, q)),
    isPending: list.isPending,
    isError: list.isError,
    error: list.error,
    refetch: list.refetch,
    showingFavorites: false,
  };
}
