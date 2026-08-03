import httpClient from './httpClient';

// Base44's Group entity stored `members` as an array of email strings and
// `admin_email`. The new backend normalizes membership into a proper
// GroupMember join table (see Phase 3 schema) - translating field names
// here so Groups.jsx / GroupDetail.jsx need minimal changes, but note the
// admin check now compares user IDs, not emails (see callers).
function toSnakeGroup(g) {
  if (!g) return g;
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    invite_code: g.inviteCode,
    admin_id: g.adminId,
    member_count: g._count?.members ?? g.members?.length ?? undefined,
    members: g.members?.map((m) => ({
      user_id: m.userId,
      username: m.user?.username,
      joined_at: m.joinedAt,
    })),
    admin: g.admin ? { id: g.admin.id, username: g.admin.username } : undefined,
    created_at: g.createdAt,
  };
}

export async function listGroups() {
  const data = await httpClient.get('/api/groups');
  return data.groups.map(toSnakeGroup);
}

export async function createGroup({ name, description }) {
  const data = await httpClient.post('/api/groups', { name, description });
  return toSnakeGroup(data.group);
}

export async function joinGroup(inviteCode) {
  const data = await httpClient.post('/api/groups/join', { inviteCode });
  return toSnakeGroup(data.group);
}

export async function getGroup(id) {
  const data = await httpClient.get(`/api/groups/${id}`);
  return toSnakeGroup(data.group);
}

export async function getGroupProgress(id, { days } = {}) {
  const qs = days ? `?days=${days}` : '';
  const data = await httpClient.get(`/api/groups/${id}/progress${qs}`);
  return data.progress.map((p) => ({
    id: p.id,
    group_id: p.groupId,
    user_id: p.userId,
    user_name: p.user?.username,
    date: p.date,
    verses_read: p.versesRead,
    time_minutes: p.timeMinutes,
  }));
}

export async function getLeaderboard(id, { days } = {}) {
  const qs = days ? `?days=${days}` : '';
  const data = await httpClient.get(`/api/groups/${id}/leaderboard${qs}`);
  return data.leaderboard.map((l) => ({
    user_id: l.userId,
    user_name: l.username,
    verses_read: l.versesRead,
    time_minutes: l.timeMinutes,
  }));
}
