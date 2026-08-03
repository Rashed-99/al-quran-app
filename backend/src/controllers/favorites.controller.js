import asyncHandler from '../utils/asyncHandler.js';
import * as favoritesService from '../services/favorites.service.js';

export const list = asyncHandler(async (req, res) => {
  const favorites = await favoritesService.listFavorites(req.user.id);
  res.json({ favorites });
});

export const create = asyncHandler(async (req, res) => {
  const favorite = await favoritesService.addFavorite(req.user.id, req.body);
  res.status(201).json({ favorite });
});

export const remove = asyncHandler(async (req, res) => {
  await favoritesService.removeFavorite(req.user.id, req.params.id);
  res.status(204).send();
});
