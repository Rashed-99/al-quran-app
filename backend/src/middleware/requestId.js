import crypto from 'node:crypto';

// Attaches a short correlation ID to every request. Included in the
// response header (so a user/support ticket can quote it) and available
// to the error handler for structured log correlation - useful once
// requests are flowing through Railway/Render's aggregated logs and a
// single "500 error" line isn't enough to find what happened.
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export default requestId;
