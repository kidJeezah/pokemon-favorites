import { Fragment } from 'react';
import { useUiStore } from '@/shared/store/uiStore';
import { formatName } from '@/shared/lib/formatName';
import type { EvolutionStages } from '@/shared/types/pokemon';

interface EvolutionChainProps {
  stages: EvolutionStages['stages'];
  currentId: number;
}

export function EvolutionChain({ stages, currentId }: EvolutionChainProps) {
  const selectPokemon = useUiStore((s) => s.selectPokemon);

  if (stages.length === 1) {
    return <div className="mt-2 text-xl text-muted">This Pokémon does not evolve.</div>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {stages.map((stage, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span aria-hidden className="text-2xl text-[#c2b2a0]">
              ➜
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {stage.map((member) => {
              const isCurrent = member.id === currentId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => selectPokemon(member.id)}
                  aria-current={isCurrent || undefined}
                  className={`cursor-pointer border-2 px-2 py-1.5 text-center font-pixel transition-transform duration-100 hover:-translate-y-1 ${
                    isCurrent ? 'border-poke-pink bg-header' : 'border-ink bg-card'
                  }`}
                >
                  <img
                    src={member.spriteUrl}
                    alt={formatName(member.name)}
                    loading="lazy"
                    width={54}
                    height={54}
                    className="mx-auto block w-[54px] [image-rendering:pixelated]"
                  />
                  <div className="mt-0.5 text-base leading-none">{formatName(member.name)}</div>
                </button>
              );
            })}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
