export const queryKeys = {
  pokemon: {
    list: ['pokemon', 'list'] as const,
    detail: (id: number) => ['pokemon', 'detail', id] as const,
    evolution: (id: number) => ['pokemon', 'evolution', id] as const,
  },
  favorites: {
    all: ['favorites'] as const,
  },
};
