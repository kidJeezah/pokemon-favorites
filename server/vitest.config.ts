import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    globalSetup: ['./tests/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      // Hardcoded test DB — never read from .env, so the dev DB can't be truncated by accident.
      DATABASE_URL: 'postgres://pokemon:pokemon@localhost:5432/pokemon_test',
    },
  },
});
