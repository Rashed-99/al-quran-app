import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Mail,
  Loader2
} from 'lucide-react';
import * as groupsApi from '@/api/groups';

// Weekly leaderboard emails are now sent automatically server-side (a
// Sunday cron job - see backend/src/jobs/weeklyLeaderboardEmail.job.js)
// rather than on-demand from the client via base44's SendEmail
// integration. This removes the old "Email Report" trigger button and
// replaces it with a short note, since sending is no longer a client
// action to take.
export default function WeeklyLeaderboard({ group }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (group) {
      loadWeeklyLeaderboard();
    }
  }, [group]);

  const loadWeeklyLeaderboard = async () => {
    try {
      const data = await groupsApi.getLeaderboard(group.id, { days: 7 });

      // Include members with zero activity this week too, matching the
      // original behavior of showing every group member on the board.
      const byUserId = Object.fromEntries(data.map((d) => [d.user_id, d]));
      const withZeros = (group.members || []).map((m) => {
        const existing = byUserId[m.user_id];
        return (
          existing || {
            user_id: m.user_id,
            user_name: m.username || 'Reader',
            verses_read: 0,
            time_minutes: 0,
          }
        );
      });

      withZeros.sort((a, b) => b.verses_read - a.verses_read);
      setLeaderboard(withZeros);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-medium text-slate-400">{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Trophy className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Weekly Leaderboard</h3>
              <p className="text-sm text-white/70">Past 7 days</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/70 bg-white/10 rounded-full px-3 py-1.5">
            <Mail className="w-3.5 h-3.5" />
            Emailed weekly
          </div>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {leaderboard.map((member, index) => (
          <motion.div
            key={member.user_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 flex items-center gap-4 ${
              index < 3 ? 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10' : ''
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              {getMedalIcon(index)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800 dark:text-white">{member.user_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {member.time_minutes} min reading
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-violet-600 dark:text-violet-400">{member.verses_read}</p>
              <p className="text-xs text-slate-400">verses</p>
            </div>
          </motion.div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          No reading activity this week
        </div>
      )}
    </div>
  );
}
