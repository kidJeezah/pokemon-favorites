import type { PokemonType } from '@/shared/types/pokemon';

// Complete literal class strings so the Tailwind scanner sees them — never interpolate fragments.

/** Ink color for the variant-C "● type" dot labels. */
export const typeDotClass: Record<PokemonType, string> = {
  normal: 'text-type-normal-ink',
  fire: 'text-type-fire-ink',
  water: 'text-type-water-ink',
  electric: 'text-type-electric-ink',
  grass: 'text-type-grass-ink',
  ice: 'text-type-ice-ink',
  fighting: 'text-type-fighting-ink',
  poison: 'text-type-poison-ink',
  ground: 'text-type-ground-ink',
  flying: 'text-type-flying-ink',
  psychic: 'text-type-psychic-ink',
  bug: 'text-type-bug-ink',
  rock: 'text-type-rock-ink',
  ghost: 'text-type-ghost-ink',
  dragon: 'text-type-dragon-ink',
  steel: 'text-type-steel-ink',
  dark: 'text-type-dark-ink',
  fairy: 'text-type-fairy-ink',
};

/** Filled chip classes for the detail modal type badges. */
export const typeChipClass: Record<PokemonType, string> = {
  normal: 'bg-type-normal text-type-normal-ink',
  fire: 'bg-type-fire text-type-fire-ink',
  water: 'bg-type-water text-type-water-ink',
  electric: 'bg-type-electric text-type-electric-ink',
  grass: 'bg-type-grass text-type-grass-ink',
  ice: 'bg-type-ice text-type-ice-ink',
  fighting: 'bg-type-fighting text-type-fighting-ink',
  poison: 'bg-type-poison text-type-poison-ink',
  ground: 'bg-type-ground text-type-ground-ink',
  flying: 'bg-type-flying text-type-flying-ink',
  psychic: 'bg-type-psychic text-type-psychic-ink',
  bug: 'bg-type-bug text-type-bug-ink',
  rock: 'bg-type-rock text-type-rock-ink',
  ghost: 'bg-type-ghost text-type-ghost-ink',
  dragon: 'bg-type-dragon text-type-dragon-ink',
  steel: 'bg-type-steel text-type-steel-ink',
  dark: 'bg-type-dark text-type-dark-ink',
  fairy: 'bg-type-fairy text-type-fairy-ink',
};

export const fallbackDotClass = 'text-muted';
export const fallbackChipClass = 'bg-type-normal text-type-normal-ink';
