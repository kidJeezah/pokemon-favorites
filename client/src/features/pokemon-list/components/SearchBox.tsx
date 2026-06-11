import { useUiStore } from '@/shared/store/uiStore';

export function SearchBox() {
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);

  return (
    <div className="flex items-center gap-2 border-[3px] border-ink bg-white px-3 py-1 shadow-pixel">
      <span aria-hidden className="inline-block -rotate-45 text-xl text-heart-idle">
        ⚲
      </span>
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="search name or #…"
        aria-label="Search Pokémon by name or number"
        className="w-44 bg-transparent font-pixel text-xl text-ink outline-none placeholder:text-heart-idle"
      />
    </div>
  );
}
