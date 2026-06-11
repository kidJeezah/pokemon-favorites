import { describe, expect, it } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { mswServer } from '@/test/msw/server';
import { API } from '@/test/msw/handlers';
import { createTestQueryClient } from '@/test/utils';
import { queryKeys } from '@/shared/api/queryKeys';
import type { Favorite } from '@/shared/types/pokemon';
import { useFavorites } from './useFavorites';
import { useToggleFavorite } from './useToggleFavorite';

function setup() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => ({ favorites: useFavorites(), toggle: useToggleFavorite() }), {
    wrapper,
  });
  return { queryClient, hook };
}

describe('useToggleFavorite', () => {
  it('optimistically adds to the favorites cache before the POST resolves', async () => {
    mswServer.use(
      http.post(`${API}/api/favorites`, async ({ request }) => {
        await delay(150); // keep the POST pending while we assert
        const body = (await request.json()) as { pokemonId: number; name: string };
        return HttpResponse.json(
          { pokemonId: body.pokemonId, name: body.name, createdAt: 'now' },
          { status: 201 },
        );
      }),
    );
    const { queryClient, hook } = setup();
    await waitFor(() => expect(hook.result.current.favorites.isSuccess).toBe(true));

    act(() => hook.result.current.toggle.toggle({ id: 25, name: 'pikachu' }));

    // Assert synchronously after onMutate — POST is still in flight.
    await waitFor(() => {
      const cache = queryClient.getQueryData<Favorite[]>(queryKeys.favorites.all);
      expect(cache?.some((f) => f.pokemonId === 25)).toBe(true);
    });
  });

  it('rolls back the cache when the backend returns 500', async () => {
    mswServer.use(
      http.post(`${API}/api/favorites`, () => new HttpResponse(null, { status: 500 })),
    );
    const { queryClient, hook } = setup();
    await waitFor(() => expect(hook.result.current.favorites.isSuccess).toBe(true));

    act(() => hook.result.current.toggle.toggle({ id: 25, name: 'pikachu' }));

    await waitFor(() => {
      const cache = queryClient.getQueryData<Favorite[]>(queryKeys.favorites.all);
      expect(cache?.some((f) => f.pokemonId === 25)).toBe(false);
    });
  });
});
