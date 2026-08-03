import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { requestId } from './middleware/requestId.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Required behind Railway/Render/any reverse proxy so express-rate-limit
  // sees the real client IP (not the proxy's) and secure cookies work
  // correctly over the proxy's terminated TLS connection.
  app.set('trust proxy', 1);

  app.use(requestId);

  // CSP is for HTML/browser responses; this is a pure JSON API serving no
  // markup, so the default helmet CSP adds no protection here and only
  // risks blocking something unexpectedly - disabled, other helmet
  // protections (HSTS, X-Content-Type-Options, etc.) stay on.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true, // required so the refresh-token cookie is sent/received
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  morgan.token('id', (req) => req.id);
  app.use(
    morgan(
      env.NODE_ENV === 'production'
        ? ':id :method :url :status :res[content-length] - :response-time ms'
        : 'dev'
    )
  );

  app.use(apiLimiter);

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
