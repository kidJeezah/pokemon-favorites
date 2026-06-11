import { useEffect, useRef } from 'react';
import { useUiStore } from '@/shared/store/uiStore';
import { usePokemonDetail } from '../hooks/usePokemonDetail';
import { useEvolutionChain } from '../hooks/useEvolutionChain';
import { Spinner } from '@/shared/components/Spinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { artworkUrl } from '@/shared/lib/sprites';
import { formatName } from '@/shared/lib/formatName';
import { typePanelClass, fallbackPanelClass } from '@/shared/lib/typeColors';
import { TypeBadge } from './TypeBadge';
import { AbilityList } from './AbilityList';
import { EvolutionChain } from './EvolutionChain';

function SectionHeading({ children }: { children: string }) {
  return <div className="text-lg tracking-[2px] text-accent">{children}</div>;
}

export function PokemonDetailModal({ pokemonId }: { pokemonId: number }) {
  const clearSelection = useUiStore((s) => s.clearSelection);
  const detail = usePokemonDetail(pokemonId);
  const evolution = useEvolutionChain(pokemonId);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }
      // Minimal focus trap: keep Tab cycling inside the dialog.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [clearSelection]);

  const panelTint = detail.data
    ? (typePanelClass[detail.data.types[0] ?? 'normal'] ?? fallbackPanelClass)
    : fallbackPanelClass;

  return (
    <div
      onClick={clearSelection}
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-[#2a1f33b0] p-5 [perspective:1200px]"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={detail.data ? `${formatName(detail.data.name)} details` : 'Pokémon details'}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-[min(470px,94vw)] max-h-[92vh] origin-center animate-flip-pop overflow-auto border-4 border-ink bg-card shadow-[12px_14px_0_#00000040] outline-none"
      >
        {detail.isPending && <Spinner label="opening…" />}
        {detail.isError && (
          <ErrorMessage message={detail.error.message} onRetry={() => detail.refetch()} />
        )}
        {detail.data && (
          <>
            <div className={`relative overflow-hidden border-b-4 border-ink p-5 ${panelTint}`}>
              <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(#0000_0_3px,#4a3b4f14_3px_4px)]" />
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Close"
                className="absolute top-3 right-3 z-10 h-8 w-8 cursor-pointer border-[3px] border-ink bg-cream p-0 text-lg leading-none shadow-[2px_2px_0_#00000022] transition-transform duration-100 hover:scale-110"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                <div className="border-[3px] border-ink bg-card/80 p-2 shadow-[3px_3px_0_#00000018]">
                  <img
                    src={artworkUrl(detail.data.id)}
                    alt={formatName(detail.data.name)}
                    width={108}
                    height={108}
                    className="block w-28 animate-bob [image-rendering:pixelated]"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-lg text-ink/60">
                    #{String(detail.data.id).padStart(3, '0')}
                  </div>
                  <div className="text-4xl leading-[0.85]">{formatName(detail.data.name)}</div>
                  <div className="mt-2 flex gap-1.5">
                    {detail.data.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pt-4 pb-5">
              <SectionHeading>ABILITIES</SectionHeading>
              <AbilityList abilities={detail.data.abilities} />

              <div className="mt-5">
                <SectionHeading>EVOLUTION</SectionHeading>
                {evolution.isPending && <div className="mt-2 text-xl text-muted">loading…</div>}
                {evolution.isError && (
                  <div className="mt-2 text-xl text-muted">Could not load the evolution chain.</div>
                )}
                {evolution.data && (
                  <EvolutionChain stages={evolution.data.stages} currentId={detail.data.id} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
