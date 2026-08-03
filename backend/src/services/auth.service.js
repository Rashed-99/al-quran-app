import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prismaClient.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL = '30m';

function publicUser(user) {
  return { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt };
}

export async function register({ email, password, username }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, passwordHash, username },
    });
    // Every user gets a default ReadingProgress row up front so the
    // frontend never has to special-case "no progress yet".
    await tx.readingProgress.create({
      data: { userId: created.id },
    });
    return created;
  });

  return issueTokens(user);
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return issueTokens(user);
}

export function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { user: publicUser(user), accessToken, refreshToken };
}

export async function refresh(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Missing refresh token');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // Version mismatch means the token was rotated/invalidated (e.g. logout-everywhere,
  // password reset) since this refresh token was issued.
  if (payload.ver !== user.refreshTokenVersion) {
    throw ApiError.unauthorized('Refresh token has been invalidated');
  }

  return issueTokens(user);
}

export async function logout(userId, { everywhere = false } = {}) {
  if (everywhere) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokenVersion: { increment: 1 } },
    });
  }
  // Nothing else to do server-side for a single-device logout - the client
  // discards its tokens and clears the refresh cookie.
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  return publicUser(user);
}

export async function updateMe(userId, { username }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { username },
  });
  return publicUser(user);
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always resolve successfully regardless of whether the email exists,
  // to avoid leaking which emails are registered.
  if (!user) return { sent: true };

  const resetToken = jwt.sign(
    { sub: user.id, type: 'reset', pwv: user.passwordHash.slice(-8) },
    env.JWT_ACCESS_SECRET,
    { expiresIn: RESET_TOKEN_TTL }
  );

  // Plug in email.service.js here to actually deliver this link.
  return { sent: true, resetToken };
}

export async function resetPassword(resetToken, newPassword) {
  let payload;
  try {
    payload = jwt.verify(resetToken, env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }
  if (payload.type !== 'reset') {
    throw ApiError.badRequest('Invalid reset token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || payload.pwv !== user.passwordHash.slice(-8)) {
    // Password hash changed (or user deleted) since token was issued - token is stale.
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, refreshTokenVersion: { increment: 1 } }, // invalidate existing sessions
  });

  return { success: true };
}

export async function deleteAccount(userId) {
  // onDelete: Cascade on every related table (see schema.prisma) means this
  // single call removes ReadingProgress, FavoriteVerse, DailyLog, GroupMember,
  // GroupProgress, Conversation, Message rows too.
  //
  // KNOWN EDGE CASE: if this user administers a Group, that Group cascades
  // away as well, taking other members' membership with it. Acceptable for
  // launch given group sizes are small/informal, but worth a follow-up
  // (e.g. reassign admin to another member on delete) if groups grow in importance.
  await prisma.user.delete({ where: { id: userId } });
}
