import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mswServer } from './msw/server';
import { MockIntersectionObserver } from './intersection-observer';
import { useUiStore } from '@/shared/store/uiStore';

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  mswServer.resetHandlers();
  MockIntersectionObserver.reset();
  useUiStore.setState({ showFavoritesOnly: false, selectedPokemonId: null, searchQuery: '' });
});

afterAll(() => mswServer.close());
