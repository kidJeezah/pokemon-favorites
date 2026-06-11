import type { PokemonType } from '@/shared/types/pokemon';
import { typeDotClass, fallbackDotClass } from '@/shared/lib/typeColors';
import { formatName } from '@/shared/lib/formatName';

interface PokemonCardProps {
  id: number;
  name: string;
  spriteUrl: string;
  /** Optional — the list endpoint has no types; cards render dots only when known. */
  types?: PokemonType[];
  isFavorite: boolean;
  onSelect: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}

// Variant C "cozy sticker" from mokup_design/Pokemon Card Styles.dc.html:
// dashed lavender border, warm hard shadow, slight tilt, FAV ★ badge when favorited.
export function PokemonCard({
  id,
  name,
  spriteUrl,
  types = [],
  isFavorite,
  onSelect,
  onToggleFavorite,
}: PokemonCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${formatName(name)} details`}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(id);
        }
      }}
      className="relative -rotate-2 cursor-pointer border-[3px] border-dashed border-sticker bg-card p-4 shadow-sticker transition-transform duration-100 hover:-translate-y-1 hover:rotate-0 focus-visible:rotate-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <button
        type="button"
        aria-label={isFavorite ? `Remove ${formatName(name)} from favorites` : `Add ${formatName(name)} to favorites`}
        aria-pressed={isFavorite}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(id);
        }}
        className={`absolute -top-3 -right-2.5 z-10 h-8 w-8 cursor-pointer border-[3px] border-ink bg-cream p-0 text-[17px] leading-none shadow-pixel-sm transition-transform duration-100 hover:scale-118 hover:rotate-6 ${
          isFavorite ? 'text-heart' : 'text-heart-idle'
        }`}
      >
        {isFavorite ? '♥' : '♡'}
      </button>

      <div className="relative">
        {isFavorite && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 rotate-3 border-2 border-ink bg-badge px-3.5 text-[15px]">
            FAV ★
          </div>
        )}
        <div className="flex justify-center border-[3px] border-ink bg-frame py-5">
          <span className="absolute top-1 left-2 text-[15px] text-ink/60">
            #{String(id).padStart(3, '0')}
          </span>
          <img
            src={spriteUrl}
            alt={formatName(name)}
            loading="lazy"
            width={96}
            height={96}
            className="w-28 [image-rendering:pixelated] animate-bob"
          />
        </div>
      </div>

      <div className="mt-3 truncate text-center text-3xl leading-none">{formatName(name)}</div>

      {types.length > 0 && (
        <div className="mt-2 flex justify-center gap-2">
          {types.map((type) => (
            <span key={type} className={`text-lg ${typeDotClass[type] ?? fallbackDotClass}`}>
              ● {type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
