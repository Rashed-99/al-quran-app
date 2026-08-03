import cron from 'node-cron';
import prisma from '../db/prismaClient.js';
import { getLeaderboard } from '../services/groups.service.js';
import { sendWeeklyLeaderboardEmail } from '../services/email.service.js';

// Runs server-side on a schedule, replacing the old client-triggered
// base44.integrations.Core.SendEmail call in WeeklyLeaderboard.jsx.
// Sending now happens exactly once a week regardless of whether any
// member has the app open, and can't be re-triggered by a page refresh.
export async function runWeeklyLeaderboardEmails() {
  const groups = await prisma.group.findMany({
    include: { members: { include: { user: true } } },
  });

  for (const group of groups) {
    if (group.members.length === 0) continue;

    let leaderboard;
    try {
      // Bypass the membership-assertion path used by the HTTP endpoint -
      // this job runs as the system, not on behalf of any one member.
      leaderboard = await getLeaderboard(group.adminId, group.id, { days: 7 });
    } catch (err) {
      console.error(`[weeklyLeaderboardEmail] failed for group ${group.id}:`, err);
      continue;
    }

    if (leaderboard.length === 0) continue;

    await Promise.all(
      leaderboard.map(async (entry, index) => {
        const member = group.members.find((m) => m.userId === entry.userId);
        if (!member) return;
        try {
          await sendWeeklyLeaderboardEmail({
            to: member.user.email,
            username: member.user.username,
            groupName: group.name,
            rank: index + 1,
            versesRead: entry.versesRead,
          });
        } catch (err) {
          console.error(`[weeklyLeaderboardEmail] send failed for ${member.user.email}:`, err);
        }
      })
    );
  }
}

// Every Sunday at 09:00 UTC.
export function scheduleWeeklyLeaderboardEmails() {
  cron.schedule('0 9 * * 0', () => {
    runWeeklyLeaderboardEmails().catch((err) =>
      console.error('[weeklyLeaderboardEmail] job crashed:', err)
    );
  });
}
