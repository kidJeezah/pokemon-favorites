import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { useUiStore } from '@/shared/store/uiStore';
import { PokemonDetailModal } from './PokemonDetailModal';

describe('PokemonDetailModal', () => {
  it('renders types, abilities, and the branched evolution strip', async () => {
    renderWithProviders(<PokemonDetailModal pokemonId={133} />);

    await screen.findByRole('dialog', { name: 'Eevee details' });
    expect(screen.getByText('normal')).toBeInTheDocument();
    expect(screen.getByText('Run Away')).toBeInTheDocument();
    expect(screen.getByText('(hidden)')).toBeInTheDocument();

    // All 8 branches of the second stage render and are clickable.
    for (const name of ['Vaporeon', 'Jolteon', 'Flareon', 'Espeon', 'Umbreon', 'Leafeon', 'Glaceon', 'Sylveon']) {
      expect(await screen.findByText(name)).toBeInTheDocument();
    }
  });

  it('clicking an evolution member re-selects it', async () => {
    useUiStore.setState({ selectedPokemonId: 133 });
    renderWithProviders(<PokemonDetailModal pokemonId={133} />);

    const sylveon = await screen.findByText('Sylveon');
    await userEvent.click(sylveon);
    expect(useUiStore.getState().selectedPokemonId).toBe(700);
  });

  it('closes on Escape', async () => {
    useUiStore.setState({ selectedPokemonId: 133 });
    renderWithProviders(<PokemonDetailModal pokemonId={133} />);
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');
    expect(useUiStore.getState().selectedPokemonId).toBeNull();
  });
});
