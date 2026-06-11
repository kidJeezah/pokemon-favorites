import { useEffect, useRef, useState } from 'react';
import { useDisplayedPokemon } from '../hooks/useDisplayedPokemon';
import { useUiStore } from '@/shared/store/uiStore';
import { Spinner } from '@/shared/components/Spinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { EmptyState } from '@/shared/components/EmptyState';
import { PokemonCard } from './PokemonCard';

const PAGE_SIZE = 20;

export function PokemonList() {
  const { items, isPending, isError, error, refetch, showingFavorites } = useDisplayedPokemon();
  const selectPokemon = useUiStore((s) => s.selectPokemon);
  const searchQuery = useUiStore((s) => s.searchQuery);

  // Infinite scroll is purely client-side: the 150-item list is one cheap request,
  // but only PAGE_SIZE cards mount at a time, growing as the sentinel scrolls into view.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, showingFavorites]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, items.length]);

  if (isPending) return <Spinner />;
  if (isError) {
    return <ErrorMessage message={error?.message ?? 'Request failed'} onRetry={refetch} />;
  }
  if (items.length === 0) {
    if (showingFavorites && !searchQuery.trim()) {
      return (
        <EmptyState title="No favorites yet" hint="Tap the heart on any Pokémon to keep it here." />
      );
    }
    return (
      <EmptyState
        title="No Pokémon found"
        hint="Try a different name or number — or switch off the favorites filter."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-5 gap-y-8">
        {items.slice(0, visibleCount).map((p) => (
          <PokemonCard
            key={p.id}
            id={p.id}
            name={p.name}
            spriteUrl={p.spriteUrl}
            onSelect={selectPokemon}
          />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} data-testid="scroll-sentinel" className="flex justify-center pt-10">
          <div className="h-8 w-8 animate-[spin_1.1s_steps(8)_infinite] rounded-full border-4 border-ink bg-[linear-gradient(#ff9fb0_0_44%,#4a3b4f_44%_56%,#fff6ee_56%_100%)]" />
        </div>
      )}
    </>
  );
}
