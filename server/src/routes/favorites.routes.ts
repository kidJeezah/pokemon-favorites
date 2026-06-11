import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as favoritesController from '../controllers/favorites.controller.js';

const addBodySchema = z.object({
  pokemonId: z.number().int().min(1).max(1025),
  name: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'must be a lowercase slug'),
});

const pokemonIdParamSchema = z.object({
  pokemonId: z.coerce.number().int().min(1),
});

export const favoritesRouter = Router();

favoritesRouter.get('/', favoritesController.list);
favoritesRouter.post('/', validate(addBodySchema, 'body'), favoritesController.add);
favoritesRouter.delete(
  '/:pokemonId',
  validate(pokemonIdParamSchema, 'params'),
  favoritesController.remove,
);
