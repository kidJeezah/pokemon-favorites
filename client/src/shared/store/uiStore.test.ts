import { describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

describe('uiStore', () => {
  it('flips the favorites filter', () => {
    expect(useUiStore.getState().showFavoritesOnly).toBe(false);
    useUiStore.getState().toggleFavoritesFilter();
    expect(useUiStore.getState().showFavoritesOnly).toBe(true);
    useUiStore.getState().toggleFavoritesFilter();
    expect(useUiStore.getState().showFavoritesOnly).toBe(false);
  });

  it('selection lifecycle: select → reselect → clear', () => {
    expect(useUiStore.getState().selectedPokemonId).toBeNull();
    useUiStore.getState().selectPokemon(25);
    expect(useUiStore.getState().selectedPokemonId).toBe(25);
    useUiStore.getState().selectPokemon(133);
    expect(useUiStore.getState().selectedPokemonId).toBe(133);
    useUiStore.getState().clearSelection();
    expect(useUiStore.getState().selectedPokemonId).toBeNull();
  });
});
