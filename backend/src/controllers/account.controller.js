import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { env } from '../config/env.js';

export const deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user.id);
  res.clearCookie(env.REFRESH_COOKIE_NAME, { path: '/auth/refresh' });
  res.status(204).send();
});
