import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') {
      return next(ApiError.unauthorized('Invalid token type'));
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired access token'));
  }
}

export default requireAuth;
