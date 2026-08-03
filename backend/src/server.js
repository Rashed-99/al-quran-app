import 'dotenv/config';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import createApp from './app.js';
import prisma from './db/prismaClient.js';
import { scheduleWeeklyLeaderboardEmails } from './jobs/weeklyLeaderboardEmail.job.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on port ${env.PORT}`, { env: env.NODE_ENV });
  scheduleWeeklyLeaderboardEmails();
});

// Catch anything that slips past route-level error handling - log it and
// exit rather than continuing in a possibly-corrupted state. Process
// managers (Railway/Render, PM2, systemd) are expected to restart the
// process automatically.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason?.stack || String(reason) });
  shutdown(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  shutdown(1);
});

// Graceful shutdown on deploy/restart signals: stop accepting new
// connections, let in-flight requests finish, then close the DB pool.
let shuttingDown = false;
function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info('Shutting down...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(exitCode);
  });

  // Force-exit if shutdown hangs (e.g. a stuck connection).
  setTimeout(() => process.exit(exitCode), 10000).unref();
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
