import type { Request, Response } from 'express';
import * as favoritesService from '../services/favorites.service.js';

export async function list(_req: Request, res: Response) {
  const favorites = await favoritesService.listFavorites();
  res.json({ favorites });
}

export async function add(_req: Request, res: Response) {
  const { pokemonId, name } = res.locals.validated.body as { pokemonId: number; name: string };
  const { favorite, created } = await favoritesService.addFavorite(pokemonId, name);
  res.status(created ? 201 : 200).json(favorite);
}

export async function remove(_req: Request, res: Response) {
  const { pokemonId } = res.locals.validated.params as { pokemonId: number };
  await favoritesService.removeFavorite(pokemonId);
  res.status(204).end();
}
