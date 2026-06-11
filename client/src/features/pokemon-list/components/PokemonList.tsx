import { useDisplayedPokemon } from '../hooks/useDisplayedPokemon';
import { useUiStore } from '@/shared/store/uiStore';
import { Spinner } from '@/shared/components/Spinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { EmptyState } from '@/shared/components/EmptyState';
import { PokemonCard } from './PokemonCard';

export function PokemonList() {
  const { items, isPending, isError, error, refetch, showingFavorites } = useDisplayedPokemon();
  const selectPokemon = useUiStore((s) => s.selectPokemon);

  if (isPending) return <Spinner />;
  if (isError) {
    return <ErrorMessage message={error?.message ?? 'Request failed'} onRetry={refetch} />;
  }
  if (showingFavorites && items.length === 0) {
    return (
      <EmptyState title="No favorites yet" hint="Tap the heart on any Pokémon to keep it here." />
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-5 gap-y-8">
      {items.map((p) => (
        <PokemonCard
          key={p.id}
          id={p.id}
          name={p.name}
          spriteUrl={p.spriteUrl}
          onSelect={selectPokemon}
        />
      ))}
    </div>
  );
}
