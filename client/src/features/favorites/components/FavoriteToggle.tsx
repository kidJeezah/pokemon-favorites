import { useFavorites } from '../hooks/useFavorites';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { formatName } from '@/shared/lib/formatName';

interface FavoriteToggleProps {
  pokemonId: number;
  name: string;
}

/** Corner heart button for cards — sticker-style square pin. */
export function FavoriteToggle({ pokemonId, name }: FavoriteToggleProps) {
  const { isFavorite } = useFavorites();
  const { toggle } = useToggleFavorite();
  const fav = isFavorite(pokemonId);

  return (
    <button
      type="button"
      aria-label={
        fav ? `Remove ${formatName(name)} from favorites` : `Add ${formatName(name)} to favorites`
      }
      aria-pressed={fav}
      onClick={(e) => {
        e.stopPropagation();
        toggle({ id: pokemonId, name });
      }}
      className={`absolute -top-3 -right-2.5 z-10 h-8 w-8 cursor-pointer border-[3px] border-ink bg-cream p-0 text-[17px] leading-none shadow-pixel-sm transition-transform duration-100 hover:scale-118 hover:rotate-6 ${
        fav ? 'text-heart' : 'text-heart-idle'
      }`}
    >
      {fav ? '♥' : '♡'}
    </button>
  );
}
