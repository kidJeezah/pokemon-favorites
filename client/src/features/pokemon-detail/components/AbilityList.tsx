import { formatName } from '@/shared/lib/formatName';
import type { Pokemon } from '@/shared/types/pokemon';

export function AbilityList({ abilities }: { abilities: Pokemon['abilities'] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {abilities.map((a) => (
        <span
          key={a.name}
          className="border-2 border-ink bg-frame px-3 py-0.5 text-xl shadow-pixel-sm"
        >
          {formatName(a.name)}
          {a.isHidden && <span className="ml-1.5 text-sm text-muted">(hidden)</span>}
        </span>
      ))}
    </div>
  );
}
