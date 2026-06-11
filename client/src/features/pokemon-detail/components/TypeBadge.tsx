import type { PokemonType } from '@/shared/types/pokemon';
import { typeChipClass, fallbackChipClass } from '@/shared/lib/typeColors';

export function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className={`border-2 border-ink px-2.5 py-px text-base uppercase ${
        typeChipClass[type] ?? fallbackChipClass
      }`}
    >
      {type}
    </span>
  );
}
