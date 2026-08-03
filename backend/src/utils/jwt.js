import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_TTL,
  JWT_REFRESH_TTL,
} = env;

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, type: 'access' }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_TTL,
  });
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh', ver: user.refreshTokenVersion },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_TTL }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
