import { useState } from 'react';
import { usePokemonList } from '../hooks/usePokemonList';
import { useUiStore } from '@/shared/store/uiStore';
import { Spinner } from '@/shared/components/Spinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { PokemonCard } from './PokemonCard';

export function PokemonList() {
  const { data, isPending, isError, error, refetch } = usePokemonList();
  const selectPokemon = useUiStore((s) => s.selectPokemon);

  // Temporary local favorites until M5 wires the server-backed optimistic mutations.
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const toggleFavorite = (id: number) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isPending) return <Spinner />;
  if (isError) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-5 gap-y-8">
      {data.map((p) => (
        <PokemonCard
          key={p.id}
          id={p.id}
          name={p.name}
          spriteUrl={p.spriteUrl}
          isFavorite={favorites.has(p.id)}
          onSelect={selectPokemon}
          onToggleFavorite={toggleFavorite}
        />
      ))}
    </div>
  );
}
