import { apiFetch } from '@/shared/api/client';
import type { Favorite } from '@/shared/types/pokemon';

export const fetchFavorites = () =>
  apiFetch<{ favorites: Favorite[] }>('/api/favorites').then((d) => d.favorites);

export const addFavorite = (p: { id: number; name: string }) =>
  apiFetch<Favorite>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ pokemonId: p.id, name: p.name }),
  });

export const removeFavorite = (pokemonId: number) =>
  apiFetch<void>(`/api/favorites/${pokemonId}`, { method: 'DELETE' });
