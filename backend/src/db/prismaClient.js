import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

// Reuse a single PrismaClient instance across the app (and across
// module reloads in dev) to avoid exhausting DB connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma__ ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma__ = prisma;
}

export default prisma;
