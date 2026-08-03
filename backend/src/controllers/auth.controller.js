import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { env } from '../config/env.js';

const REFRESH_COOKIE_NAME = env.REFRESH_COOKIE_NAME;
const isProd = env.NODE_ENV === 'production';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    // 'None' is required in production so this cookie is sent on requests
    // from the Capacitor iOS app (origin `capacitor://localhost`), which
    // browsers/WKWebView treat as cross-site relative to the API domain -
    // 'Lax' would silently drop the cookie there. 'None' requires
    // `secure: true`, which is only true in production (HTTPS) - fine,
    // since local dev only needs to support the browser, where 'Lax' is
    // the safer default and works without HTTPS.
    sameSite: isProd ? 'none' : 'lax',
    path: '/auth/refresh',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, matches JWT_REFRESH_TTL default
  };
}

function sendAuthResponse(res, { user, accessToken, refreshToken }) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.json({ user, accessToken });
}

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  sendAuthResponse(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendAuthResponse(res, result);
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  const result = await authService.refresh(token);
  sendAuthResponse(res, result);
});

export const logout = asyncHandler(async (req, res) => {
  const everywhere = Boolean(req.body?.everywhere);
  if (req.user) {
    await authService.logout(req.user.id, { everywhere });
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth/refresh' });
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateMe(req.user.id, req.body);
  res.json({ user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  // Deliberately generic response - see service for why.
  res.json({ message: 'If that email is registered, a reset link has been sent.', ...(!isProd ? result : {}) });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res.json({ message: 'Password updated successfully.' });
});
