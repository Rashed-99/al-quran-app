import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import * as progressApi from '@/api/progress';
import { createPageUrl } from '@/utils';
import { Sparkles, BookOpen, Clock, BookMarked, Flame, MessageCircleHeart } from 'lucide-react';
import WeeklyTracker from '@/components/home/WeeklyTracker';
import StatCard from '@/components/home/StatCard';
import GoalCard from '@/components/home/GoalCard';
import DailyHadith from '@/components/home/DailyHadith';
import DailyReminder from '@/components/home/DailyReminder';
import DailyReflection from '@/components/home/DailyReflection';
import PullToRefresh from '@/components/common/PullToRefresh';

// Sample Quran data for the first surah
const SURAH_NAMES = {
  1: "Al-Fatiha",
  2: "Al-Baqarah",
  3: "Ali 'Imran",
  4: "An-Nisa",
  5: "Al-Ma'idah"
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Daily/weekly reset logic that used to run here on every load now
      // happens server-side in getOrCreateProgress - this is just a fetch.
      const currentProgress = await progressApi.getProgress();
      setProgress(currentProgress);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Refetch when the tab regains focus, approximating the "feels live"
  // experience the old base44 .subscribe() realtime call gave us, without
  // running a websocket server. See Phase 2 Realtime Strategy notes.
  useEffect(() => {
    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadData]);

  const handleReadClick = () => {
    navigate(createPageUrl('Reading'));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl" style={{ background: 'rgba(123,97,255,0.3)' }} />
          <div className="h-4 w-32 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>
      </div>
    );
  }

  const displayName = user?.username || 'Reader';
  const currentSurahName = SURAH_NAMES[progress?.current_surah || 1] || "Al-Fatiha";

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen px-4 py-6 max-w-lg mx-auto" style={{ background: '#121212' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between mb-4 select-none">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: '#75E6DA' }}>
                <span className="text-black text-xl font-bold select-none">{displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm text-slate-400 select-none">Asalam Alaykum,</p>
                <h1 className="text-xl font-bold text-white select-none">{displayName}</h1>
              </div>
            </div>

            {/* Stats container */}
            <div className="flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: '#1C1C1E', border: '1px solid #3A3A3C' }}>
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-white select-none">{progress?.current_streak || 0}</span>
              <div className="w-px h-4" style={{ background: '#3A3A3C' }} />
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-white select-none">{progress?.today_verses_read || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Weekly Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <WeeklyTracker weeklyProgress={progress?.weekly_progress || []} />
        </motion.div>

        {/* Goal Card */}
        <div className="mb-6">
          <GoalCard
            currentSurah={currentSurahName}
            currentVerse={progress?.current_verse || 1}
            todayProgress={progress?.today_verses_read || 0}
            dailyGoal={progress?.daily_goal_verses || 10}
            onReadClick={handleReadClick}
          />
        </div>

        {/* Daily Reminder */}
        <DailyReminder progress={progress} onReadClick={handleReadClick} />

        {/* Daily Reflection */}
        <DailyReflection />

        {/* Stats Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 select-none">
            <h2 className="text-base font-bold text-white select-none">Today's Progress</h2>
            <button
              onClick={() => navigate(createPageUrl('Stats'))}
              className="text-sm text-violet-400 font-semibold hover:text-violet-300 select-none touch-manipulation flex items-center gap-1"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={Sparkles} label="Hasanat" value={(progress?.total_hasanat || 0).toLocaleString()} gradient="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400" delay={0.2} />
            <StatCard icon={BookOpen} label="Verses Today" value={progress?.today_verses_read || 0} gradient="bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400" delay={0.25} />
            <StatCard icon={Clock} label="Time (min)" value={progress?.today_time_minutes || 0} gradient="bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400" delay={0.3} />
            <StatCard icon={BookMarked} label="Total Pages" value={progress?.total_pages_read || 0} gradient="bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-400" delay={0.35} />
          </div>
        </div>

        {/* Quran Companion */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate(createPageUrl('Companion'))}
          className="w-full mb-6 flex items-center gap-4 p-5 rounded-3xl text-left touch-manipulation active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #6E5DCF 0%, #7B61FF 100%)' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <MessageCircleHeart className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Quran Companion</h3>
            <p className="text-sm text-white/80">Get encouragement, goal suggestions & verse tafsir</p>
          </div>
          <Sparkles className="w-5 h-5 text-white/70 shrink-0" />
        </motion.button>

        {/* Daily Hadith */}
        <DailyHadith />
      </div>
    </PullToRefresh>
  );
}
