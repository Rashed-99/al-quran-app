import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Play, CheckCircle2 } from 'lucide-react';

export default function GoalCard({
  currentSurah = "Al-Fatiha",
  currentVerse = 1,
  todayProgress = 0,
  dailyGoal = 10,
  onReadClick,
}) {

  const progressPercent = Math.min((todayProgress / dailyGoal) * 100, 100);
  const isGoalComplete = todayProgress >= dailyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 150 }}
      className="rounded-3xl p-6 relative overflow-hidden select-none shadow-2xl"
      style={{ background: 'linear-gradient(160deg, #B39DDB 0%, #C5B3E6 50%, #D1C4E9 100%)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-white select-none">Goal</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-sm select-none" style={{ color: '#E1D5F5' }}>
              {currentVerse} {currentSurah} | {todayProgress}/{dailyGoal}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white select-none">{Math.round(progressPercent)}%</span>
          <button className="w-7 h-7 rounded-full flex items-center justify-center touch-manipulation" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Pencil className="w-3.5 h-3.5 text-white/80" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(75,62,140,0.5)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: isGoalComplete ? '#10b981' : 'rgba(255,255,255,0.9)' }}
        />
      </div>

      <p className="text-xs text-white/80 mb-4 select-none">
        {todayProgress}/{dailyGoal} verses per day
      </p>

      {/* Read Quran button */}
      <button
        onClick={onReadClick}
        className="w-full rounded-full py-3.5 font-bold text-base select-none touch-manipulation active:scale-[0.98] transition-transform"
        style={{ background: '#1a1a1a', color: '#ffffff' }}
      >
        <span className="select-none">Read Quran</span>
      </button>

      {isGoalComplete && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full mb-2 w-fit"
          style={{ background: 'rgba(16,185,129,0.2)' }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-xs font-bold text-emerald-300 select-none">Goal Complete!</span>
        </motion.div>
      )}
    </motion.div>
  );
}