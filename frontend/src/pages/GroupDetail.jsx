import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import * as groupsApi from '@/api/groups';
import { createPageUrl } from '@/utils';
import { 
  ChevronLeft, 
  Trophy, 
  Copy, 
  Flame,
  BookOpen,
  Clock,
  Loader2,
  Crown,
  Medal,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WeeklyLeaderboard from '@/components/groups/WeeklyLeaderboard';
import MemberProgressCard from '@/components/groups/MemberProgressCard';
import { toast } from 'sonner';

// How often to refetch while this screen is open, to approximate the old
// base44 .subscribe() realtime feel without running a websocket server.
// See Phase 2 "Realtime Strategy" notes.
const GROUP_POLL_INTERVAL_MS = 20000;

export default function GroupDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  const groupId = new URLSearchParams(window.location.search).get('id');

  const loadData = useCallback(async () => {
    if (!groupId) {
      navigate(createPageUrl('Groups'));
      return;
    }

    try {
      const foundGroup = await groupsApi.getGroup(groupId);
      setGroup(foundGroup);

      // Today's progress for every member, in one call.
      const todaysProgress = await groupsApi.getGroupProgress(groupId, { days: 1 });

      const members = foundGroup.members || [];
      const leaderboardData = members.map((m) => {
        const p = todaysProgress.find((row) => row.user_id === m.user_id);
        return {
          userId: m.user_id,
          name: m.username || 'Reader',
          verses: p?.verses_read || 0,
          time: p?.time_minutes || 0,
          isCurrentUser: m.user_id === user?.id,
          isAdmin: m.user_id === foundGroup.admin_id,
        };
      });

      leaderboardData.sort((a, b) => b.verses - a.verses);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading group:', error);
      navigate(createPageUrl('Groups'));
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll while the tab is open/visible.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, GROUP_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  const copyInviteCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    toast.success('Invite code copied!');
  };

  const getMedalBg = (rank) => {
    switch (rank) {
      case 0: return 'bg-gradient-to-br from-amber-400 to-amber-600';
      case 1: return 'bg-gradient-to-br from-slate-300 to-slate-500';
      case 2: return 'bg-gradient-to-br from-amber-600 to-amber-800';
      default: return 'bg-slate-200 dark:bg-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg-gradient)' }}>
        <Loader2 className="w-8 h-8 text-[var(--app-accent)] animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg-gradient)' }}>
      {/* Header */}
      <header className="bg-[image:var(--app-accent-gradient)] text-white p-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('Groups'))}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">{group.name}</h1>
          </div>
          
          <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              <span className="text-sm">Invite Code: <span className="font-mono font-bold">{group.invite_code}</span></span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyInviteCode}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Leaderboard Tabs */}
      <div className="max-w-lg mx-auto p-4 -mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[var(--app-card-bg)] rounded-xl p-1 mb-4 border border-[var(--app-card-border)]">
            <TabsTrigger 
              value="today" 
              className="flex-1 rounded-lg data-[state=active]:bg-[var(--app-accent-soft)] data-[state=active]:text-[var(--app-accent)]"
            >
              <Flame className="w-4 h-4 mr-2" />
              Today
            </TabsTrigger>
            <TabsTrigger 
              value="weekly"
              className="flex-1 rounded-lg data-[state=active]:bg-[var(--app-accent-soft)] data-[state=active]:text-[var(--app-accent)]"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Weekly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {/* Member Progress Cards */}
            <div className="space-y-3 mb-4">
              {leaderboard.map((member) => (
                <MemberProgressCard
                  key={member.userId}
                  member={member}
                  groupId={group.id}
                  isCurrentUser={member.isCurrentUser}
                />
              ))}
            </div>

            {/* Leaderboard */}
            <div className="bg-[var(--app-card-bg)] rounded-2xl shadow-lg border border-[var(--app-card-border)] overflow-hidden">
              <div className="p-4 border-b border-[var(--app-card-border)]">
                <h2 className="font-semibold text-[var(--app-text-primary)] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Today's Leaderboard
                </h2>
                <p className="text-sm text-[var(--app-text-secondary)] mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {leaderboard.map((member, index) => (
                  <motion.div
                    key={member.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 flex items-center gap-4 ${
                      member.isCurrentUser ? 'bg-[var(--app-accent-soft)]' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getMedalBg(index)}`}>
                      {index < 3 ? (
                        <Medal className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-sm font-bold text-[var(--app-text-secondary)]">{index + 1}</span>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--app-text-primary)]">
                          {member.name}
                          {member.isCurrentUser && <span className="text-[var(--app-accent)] ml-1">(You)</span>}
                        </p>
                        {member.isAdmin && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[var(--app-text-secondary)] flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {member.verses} verses
                        </span>
                        <span className="text-xs text-[var(--app-text-secondary)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {member.time} min
                        </span>
                      </div>
                    </div>

                    {/* Score highlight for top 3 */}
                    {index < 3 && member.verses > 0 && (
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                        'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500'
                      }`}>
                        {member.verses}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {leaderboard.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[var(--app-text-secondary)]">No members yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="weekly">
            <WeeklyLeaderboard group={group} />
          </TabsContent>
        </Tabs>

        {/* Motivational Card */}
        <div className="mt-4 bg-[image:var(--app-accent-gradient)] rounded-2xl p-5 text-white shadow-lg">
          <p className="text-sm font-medium opacity-95">🤲 Keep reading! Every verse counts towards your daily goal and helps you climb the leaderboard.</p>
        </div>
      </div>
    </div>
  );
}