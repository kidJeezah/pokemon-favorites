import { useUiStore } from '@/shared/store/uiStore';
import { useFavorites } from '../hooks/useFavorites';

export function FavoritesFilter() {
  const showFavoritesOnly = useUiStore((s) => s.showFavoritesOnly);
  const toggleFavoritesFilter = useUiStore((s) => s.toggleFavoritesFilter);
  const { data } = useFavorites();
  const count = data?.length ?? 0;

  return (
    <button
      type="button"
      aria-pressed={showFavoritesOnly}
      onClick={toggleFavoritesFilter}
      className={`flex cursor-pointer items-center gap-2 border-[3px] border-ink px-3.5 py-1 font-pixel text-xl whitespace-nowrap shadow-pixel transition-transform duration-100 hover:-translate-y-0.5 ${
        showFavoritesOnly ? 'bg-[#ff8aa6] text-white' : 'bg-card text-ink'
      }`}
    >
      {showFavoritesOnly ? '★' : '♡'} Favorites only
      <span
        className={`border-2 px-1.5 text-base leading-tight ${
          showFavoritesOnly ? 'border-white/70 bg-white/20' : 'border-ink bg-cream'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
