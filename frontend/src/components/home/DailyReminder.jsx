import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, BookOpen } from 'lucide-react';
import { getSydneyDateString } from '@/components/utils/dateUtils';

// This component previously also rendered a reminder on/off toggle + time
// picker directly here on Home. That's been moved to Settings ->
// Notifications (consolidated with the reflection reminder toggle) - this
// component now only handles the in-app "you haven't read today yet"
// nudge banner, which is contextual to Home and doesn't belong in Settings.
export default function DailyReminder({ progress, onReadClick }) {
  const [showBanner, setShowBanner] = useState(false);

  const hasReadToday = progress?.last_read_date === getSydneyDateString();
  const versesToday = progress?.today_verses_read || 0;
  const dailyGoal = progress?.daily_goal_verses || 10;
  const remaining = Math.max(0, dailyGoal - versesToday);

  useEffect(() => {
    const dismissed = localStorage.getItem('quranReminderDismissed');
    if (!hasReadToday && dismissed !== getSydneyDateString()) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [hasReadToday]);

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('quranReminderDismissed', getSydneyDateString());
  };

  return (
    <AnimatePresence>
      {showBanner && !hasReadToday && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 overflow-hidden"
        >
          <div className="relative rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <button
              onClick={dismissBanner}
              className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-amber-500/10 flex items-center justify-center touch-manipulation"
            >
              <X className="w-4 h-4 text-amber-400" />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <BellRing className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">
                  {versesToday === 0 ? "Time for your daily reading!" : `Almost there — ${remaining} verse(s) to go!`}
                </p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  {versesToday === 0
                    ? `Start your streak today. Goal: ${dailyGoal} verses.`
                    : `You've read ${versesToday}/${dailyGoal} verses today. Keep going!`}
                </p>
                <button
                  onClick={onReadClick}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold touch-manipulation active:scale-95 transition-transform"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Read Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}