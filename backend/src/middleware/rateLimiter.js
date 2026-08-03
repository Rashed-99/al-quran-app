import rateLimit from 'express-rate-limit';

// General API abuse protection - generous, just guards against runaway clients/bots.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limiter specifically for auth endpoints (login/register/refresh)
// to slow down credential-stuffing / brute-force attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again later.' },
});

export default apiLimiter;
