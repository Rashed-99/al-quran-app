import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

// Express recognizes this as an error handler by its 4-argument signature.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;

  if (!isApiError) {
    // Unexpected error - log full detail server-side (with the request ID
    // for correlation against a user-reported issue), don't leak internals
    // to the client.
    logger.error('Unhandled error', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: err.stack,
    });
  } else if (statusCode >= 500) {
    logger.error(err.message, { requestId: req.id, method: req.method, path: req.originalUrl });
  }

  res.status(statusCode).json({
    error: isApiError ? err.message : 'Internal server error',
    requestId: req.id,
    ...(isApiError && err.details ? { details: err.details } : {}),
  });
}

export default errorHandler;
