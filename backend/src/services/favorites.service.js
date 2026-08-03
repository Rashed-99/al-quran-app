import prisma from '../db/prismaClient.js';
import { ApiError } from '../utils/ApiError.js';

export async function listFavorites(userId) {
  return prisma.favoriteVerse.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addFavorite(userId, data) {
  try {
    return await prisma.favoriteVerse.create({
      data: { userId, ...data },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw ApiError.conflict('This verse is already in your favorites');
    }
    throw err;
  }
}

export async function removeFavorite(userId, favoriteId) {
  const favorite = await prisma.favoriteVerse.findUnique({ where: { id: favoriteId } });
  if (!favorite || favorite.userId !== userId) {
    throw ApiError.notFound('Favorite not found');
  }
  await prisma.favoriteVerse.delete({ where: { id: favoriteId } });
}
