import crypto from 'node:crypto';
import prisma from '../db/prismaClient.js';
import { ApiError } from '../utils/ApiError.js';
import { todayUTC } from '../utils/date.js';

function generateInviteCode() {
  // 6-char, uppercase, unambiguous alphabet (no 0/O/1/I) - easy to read aloud/type.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
}

export async function createGroup(userId, { name, description }) {
  let inviteCode;
  let attempts = 0;
  // Extremely unlikely to collide, but loop defensively rather than trust one shot.
  do {
    inviteCode = generateInviteCode();
    attempts += 1;
    const existing = await prisma.group.findUnique({ where: { inviteCode } });
    if (!existing) break;
  } while (attempts < 5);

  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: { name, description, inviteCode, adminId: userId },
    });
    await tx.groupMember.create({ data: { groupId: group.id, userId } });
    return group;
  });
}

export async function listMyGroups(userId) {
  return prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function joinGroup(userId, inviteCode) {
  const group = await prisma.group.findUnique({ where: { inviteCode } });
  if (!group) {
    throw ApiError.notFound('Invalid invite code');
  }

  await prisma.groupMember.upsert({
    where: { unique_group_member: { groupId: group.id, userId } },
    create: { groupId: group.id, userId },
    update: {},
  });

  return group;
}

async function assertMember(groupId, userId) {
  const membership = await prisma.groupMember.findUnique({
    where: { unique_group_member: { groupId, userId } },
  });
  if (!membership) {
    throw ApiError.forbidden('You are not a member of this group');
  }
}

export async function getGroupDetail(userId, groupId) {
  await assertMember(groupId, userId);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, username: true } } } },
      admin: { select: { id: true, username: true } },
    },
  });
  if (!group) throw ApiError.notFound('Group not found');
  return group;
}

export async function getGroupProgress(userId, groupId, { days = 7 } = {}) {
  await assertMember(groupId, userId);
  const since = new Date(todayUTC().getTime() - days * 24 * 60 * 60 * 1000);

  return prisma.groupProgress.findMany({
    where: { groupId, date: { gte: since } },
    include: { user: { select: { id: true, username: true } } },
    orderBy: { date: 'desc' },
  });
}

export async function getLeaderboard(userId, groupId, { days = 7 } = {}) {
  await assertMember(groupId, userId);
  const since = new Date(todayUTC().getTime() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.groupProgress.groupBy({
    by: ['userId'],
    where: { groupId, date: { gte: since } },
    _sum: { versesRead: true, timeMinutes: true },
  });

  const userIds = rows.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true },
  });
  const usernameById = Object.fromEntries(users.map((u) => [u.id, u.username]));

  return rows
    .map((r) => ({
      userId: r.userId,
      username: usernameById[r.userId] ?? 'Unknown',
      versesRead: r._sum.versesRead ?? 0,
      timeMinutes: r._sum.timeMinutes ?? 0,
    }))
    .sort((a, b) => b.versesRead - a.versesRead);
}
