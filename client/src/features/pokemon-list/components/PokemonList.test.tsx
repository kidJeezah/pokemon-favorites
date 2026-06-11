import { describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { mswServer } from '@/test/msw/server';
import { API } from '@/test/msw/handlers';
import { renderWithProviders } from '@/test/utils';
import { MockIntersectionObserver } from '@/test/intersection-observer';
import { useUiStore } from '@/shared/store/uiStore';
import { PokemonList } from './PokemonList';

describe('PokemonList', () => {
  it('renders the first 20 cards, then more as the sentinel intersects', async () => {
    renderWithProviders(<PokemonList />);
    expect(await screen.findAllByRole('button', { name: /^View .* details$/ })).toHaveLength(20);
    expect(screen.getByTestId('scroll-sentinel')).toBeInTheDocument();

    act(() => MockIntersectionObserver.triggerLatest());
    expect(screen.getAllByRole('button', { name: /^View .* details$/ })).toHaveLength(40);
  });

  it('search filters the full 150 by name, not just the visible page', async () => {
    renderWithProviders(<PokemonList />);
    await screen.findAllByRole('button', { name: /^View .* details$/ });

    // pokemon-42 is outside the first visible page of 20.
    act(() => useUiStore.getState().setSearchQuery('pokemon-42'));
    const cards = screen.getAllByRole('button', { name: /^View .* details$/ });
    expect(cards).toHaveLength(1);
    expect(screen.getByRole('button', { name: /View Pokemon 42 details/ })).toBeInTheDocument();
  });

  it('search by dex number matches and a miss shows the not-found state', async () => {
    renderWithProviders(<PokemonList />);
    await screen.findAllByRole('button', { name: /^View .* details$/ });

    act(() => useUiStore.getState().setSearchQuery('042'));
    expect(screen.getByRole('button', { name: /View Pokemon 42 details/ })).toBeInTheDocument();

    act(() => useUiStore.getState().setSearchQuery('zzz-no-match'));
    expect(screen.getByText('No Pokémon found')).toBeInTheDocument();
  });

  it('shows a spinner while pending', async () => {
    mswServer.use(
      http.get(`${API}/api/pokemon`, async () => {
        await delay(200);
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );
    renderWithProviders(<PokemonList />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows a retryable error on failure', async () => {
    let failed = false;
    mswServer.use(
      http.get(`${API}/api/pokemon`, () => {
        if (!failed) {
          failed = true;
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({
          count: 1,
          results: [{ id: 1, name: 'bulbasaur', spriteUrl: 'https://example.com/1.png' }],
        });
      }),
    );
    renderWithProviders(<PokemonList />);

    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    await screen.findByRole('button', { name: /View Bulbasaur details/ });
  });

  it('favorites-only renders from the favorites query — a favorite with ID > 150 appears', async () => {
    mswServer.use(
      http.get(`${API}/api/favorites`, () =>
        HttpResponse.json({ favorites: [{ pokemonId: 700, name: 'sylveon', createdAt: 'x' }] }),
      ),
    );
    useUiStore.setState({ showFavoritesOnly: true });
    renderWithProviders(<PokemonList />);

    await screen.findByRole('button', { name: /View Sylveon details/ });
    expect(screen.queryByRole('button', { name: /View Pokemon 1 details/ })).not.toBeInTheDocument();
  });

  it('favorites-only with zero favorites shows the empty state', async () => {
    useUiStore.setState({ showFavoritesOnly: true });
    renderWithProviders(<PokemonList />);
    await screen.findByText('No favorites yet');
  });
});
