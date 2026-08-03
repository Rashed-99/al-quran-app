import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import * as progressApi from '@/api/progress';

// Today's verses/time for this member are already fetched once by the
// parent (GroupDetail.jsx, via groupsApi.getGroupProgress) and passed in
// as member.verses/member.time - no separate per-card fetch or realtime
// subscription needed anymore (GroupDetail's polling refresh covers it).
export default function MemberProgressCard({ member, groupId, isCurrentUser }) {
  const [dailyGoal, setDailyGoal] = useState(10);

  useEffect(() => {
    if (isCurrentUser) {
      progressApi.getProgress()
        .then((p) => setDailyGoal(p?.daily_goal_verses || 10))
        .catch((error) => console.error('Error loading daily goal:', error));
    }
  }, [isCurrentUser]);

  const versesRead = member.verses || 0;
  const progressPercent = Math.min((versesRead / dailyGoal) * 100, 100);
  const isGoalComplete = versesRead >= dailyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${
        isCurrentUser 
          ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' 
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isGoalComplete 
              ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
              : 'bg-gradient-to-br from-violet-400 to-purple-500'
          }`}>
            <span className="text-white font-bold text-sm">
              {member.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
              {member.name}
              {isCurrentUser && <span className="text-xs text-violet-600 dark:text-violet-400">(You)</span>}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <BookOpen className="w-3 h-3" />
              <span>{versesRead} verses today</span>
            </div>
          </div>
        </div>

        {isGoalComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold">Goal Complete!</span>
          </motion.div>
        ) : (
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Target className="w-4 h-4" />
            <span className="text-xs">{versesRead}/{dailyGoal}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isGoalComplete && (
        <div className="space-y-1">
          <Progress 
            value={progressPercent} 
            className="h-2 bg-slate-100 dark:bg-slate-700"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
            {Math.round(progressPercent)}% complete
          </p>
        </div>
      )}
    </motion.div>
  );
}
