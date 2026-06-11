import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mswServer } from './msw/server';
import { useUiStore } from '@/shared/store/uiStore';

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  mswServer.resetHandlers();
  useUiStore.setState({ showFavoritesOnly: false, selectedPokemonId: null });
});

afterAll(() => mswServer.close());
