import { create } from 'zustand';

interface UiState {
  showFavoritesOnly: boolean;
  /** null = detail modal closed */
  selectedPokemonId: number | null;
  searchQuery: string;
  toggleFavoritesFilter: () => void;
  selectPokemon: (id: number) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  showFavoritesOnly: false,
  selectedPokemonId: null,
  searchQuery: '',
  toggleFavoritesFilter: () => set((s) => ({ showFavoritesOnly: !s.showFavoritesOnly })),
  selectPokemon: (id) => set({ selectedPokemonId: id }),
  clearSelection: () => set({ selectedPokemonId: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
