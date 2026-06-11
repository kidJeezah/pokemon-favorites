import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { pokemonRouter } from './routes/pokemon.routes.js';
import { favoritesRouter } from './routes/favorites.routes.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, methods: ['GET', 'POST', 'DELETE'] }));
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger }));
  }
  app.use(express.json());

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/pokemon', pokemonRouter);
  app.use('/api/favorites', favoritesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
