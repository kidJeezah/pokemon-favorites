import { create } from 'zustand';

interface UiState {
  showFavoritesOnly: boolean;
  /** null = detail modal closed */
  selectedPokemonId: number | null;
  toggleFavoritesFilter: () => void;
  selectPokemon: (id: number) => void;
  clearSelection: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  showFavoritesOnly: false,
  selectedPokemonId: null,
  toggleFavoritesFilter: () => set((s) => ({ showFavoritesOnly: !s.showFavoritesOnly })),
  selectPokemon: (id) => set({ selectedPokemonId: id }),
  clearSelection: () => set({ selectedPokemonId: null }),
}));
