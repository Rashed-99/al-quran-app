import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as progressApi from '@/api/progress';
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  Flame,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Loader2
} from 'lucide-react';

export default function Stats() {
  const [progress, setProgress] = useState(null);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentProgress = await progressApi.getProgress();
      setProgress(currentProgress);

      const logs = await progressApi.getDailyLogs();
      setDailyLogs(logs.slice(0, 30));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      icon: Sparkles,
      label: 'Total Hasanat',
      value: (progress?.total_hasanat || 0).toLocaleString(),
      color: 'from-amber-400 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      icon: BookOpen,
      label: 'Total Verses',
      value: progress?.total_verses_read || 0,
      color: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      icon: Clock,
      label: 'Total Time',
      value: `${progress?.total_time_minutes || 0} min`,
      color: 'from-blue-400 to-indigo-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${progress?.current_streak || 0} days`,
      color: 'from-rose-400 to-pink-500',
      bg: 'bg-rose-50 dark:bg-rose-900/20'
    },
  ];

  const achievements = [
    {
      icon: Award,
      title: 'Longest Streak',
      value: `${progress?.longest_streak || 0} days`,
      unlocked: (progress?.longest_streak || 0) > 0
    },
    {
      icon: Target,
      title: '100 Verses',
      value: 'Read 100 verses',
      unlocked: (progress?.total_verses_read || 0) >= 100
    },
    {
      icon: Sparkles,
      title: '10,000 Hasanat',
      value: 'Earn 10K hasanat',
      unlocked: (progress?.total_hasanat || 0) >= 10000
    },
    {
      icon: Calendar,
      title: '7 Day Streak',
      value: 'Read for 7 days',
      unlocked: (progress?.longest_streak || 0) >= 7
    },
  ];

  // Calculate weekly data for chart
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const log = dailyLogs.find(l => l.date === dateStr);
    return {
      day: weekDays[date.getDay()],
      verses: log?.verses_read || 0,
      isToday: i === 6
    };
  });

  const maxVerses = Math.max(...weekData.map(d => d.verses), progress?.daily_goal_verses || 10);

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 select-none">Your Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 select-none">Track your Quran reading journey</p>
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bg} rounded-2xl p-5 border border-slate-100 dark:border-slate-700`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white select-none">{stat.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 select-none">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 mb-8"
      >
        <div className="flex items-center justify-between mb-6 select-none">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">This Week</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Verses read per day</p>
          </div>
          <TrendingUp className="w-5 h-5 text-violet-500" />
        </div>

        <div className="flex items-end justify-between gap-2 h-32">
          {weekData.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '100px' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((day.verses / maxVerses) * 100, 4)}%` }}
                  transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                  className={`w-full rounded-t-lg ${
                    day.isToday 
                      ? 'bg-gradient-to-t from-violet-500 to-purple-400' 
                      : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                  style={{ minHeight: '4px' }}
                />
              </div>
              <span className={`text-xs ${day.isToday ? 'text-violet-600 dark:text-violet-400 font-semibold' : 'text-slate-400'} select-none`}>
                {day.day}
              </span>
            </div>
          ))}
        </div>

        {/* Goal line */}
        <div className="relative mt-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-violet-300 dark:bg-violet-600" style={{ opacity: 0.5 }} />
            <span className="text-xs text-violet-500 dark:text-violet-400 select-none">
              Daily goal: {progress?.daily_goal_verses || 10} verses
            </span>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 select-none">Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={`rounded-2xl p-4 border ${
                achievement.unlocked 
                  ? 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-violet-200 dark:border-violet-700' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                achievement.unlocked 
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                <achievement.icon className={`w-5 h-5 ${achievement.unlocked ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <p className={`font-semibold text-sm ${achievement.unlocked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'} select-none`}>
                {achievement.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 select-none">{achievement.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}