import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as pokemonController from '../controllers/pokemon.controller.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(150).default(150),
  offset: z.coerce.number().int().min(0).default(0),
});

const idOrNameSchema = z.object({
  idOrName: z.string().regex(/^[a-z0-9-]+$/i, 'must match /^[a-z0-9-]+$/i'),
});

export const pokemonRouter = Router();

pokemonRouter.get('/', validate(listQuerySchema, 'query'), pokemonController.list);
pokemonRouter.get('/:idOrName', validate(idOrNameSchema, 'params'), pokemonController.detail);
pokemonRouter.get(
  '/:idOrName/evolution',
  validate(idOrNameSchema, 'params'),
  pokemonController.evolution,
);
