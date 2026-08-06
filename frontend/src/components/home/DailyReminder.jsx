import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, Clock, X, BookOpen } from 'lucide-react';
import { getSydneyDateString } from '@/components/utils/dateUtils';
import * as notifications from '@/lib/notifications';

export default function DailyReminder({ progress, onReadClick }) {
  const [reminderEnabled, setReminderEnabled] = useState(() => localStorage.getItem('quranReminderEnabled') === 'true');
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('quranReminderTime') || '08:00');
  const [permission, setPermission] = useState('prompt');
  const [showSettings, setShowSettings] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    notifications.getPermissionStatus().then(setPermission);
  }, []);

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

  // On native platforms, schedule a real repeating OS-level notification
  // once (fires even when backgrounded/closed - this is the actual fix
  // for iOS, where the old setTimeout+Notification() approach silently
  // did nothing). On web, fall back to the original foreground-only
  // timer, since browsers have no ahead-of-time scheduling API.
  useEffect(() => {
    if (!reminderEnabled || permission !== 'granted') {
      notifications.cancelReminder(notifications.NOTIFICATION_IDS.DAILY_READING_REMINDER);
      return;
    }

    if (notifications.isNative()) {
      const [hour, minute] = reminderTime.split(':').map(Number);
      notifications.scheduleDailyReminder({
        id: notifications.NOTIFICATION_IDS.DAILY_READING_REMINDER,
        title: 'Quran Reading Reminder 📖',
        body: `Assalamu Alaikum! Don't forget today's reading goal.`,
        hour,
        minute,
      });
      return;
    }

    // Web fallback: foreground-only timer.
    if (timerRef.current) clearTimeout(timerRef.current);

    const scheduleNext = () => {
      const now = new Date();
      const [h, m] = reminderTime.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const ms = target - now;

      timerRef.current = setTimeout(() => {
        const todayStr = getSydneyDateString();
        const readToday = progress?.last_read_date === todayStr;
        if (!readToday) {
          notifications.showImmediateNotification({
            title: 'Quran Reading Reminder 📖',
            body: `Assalamu Alaikum! You have ${remaining} verse(s) left to reach today's goal of ${dailyGoal}. Tap to start reading.`,
          });
        }
        scheduleNext();
      }, ms);
    };

    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [reminderEnabled, permission, reminderTime, remaining, dailyGoal, progress?.last_read_date]);

  const requestPermission = async () => {
    const result = await notifications.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setReminderEnabled(true);
      localStorage.setItem('quranReminderEnabled', 'true');
      notifications.showImmediateNotification({
        title: 'Reminders Enabled ✅',
        body: 'You will receive daily Quran reading reminders.',
      });
    }
  };

  const handleToggle = () => {
    if (!canNotify) return;
    const newState = !reminderEnabled;
    setReminderEnabled(newState);
    localStorage.setItem('quranReminderEnabled', String(newState));
    if (newState && permission !== 'granted') {
      requestPermission();
    }
  };

  const handleTimeChange = (e) => {
    setReminderTime(e.target.value);
    localStorage.setItem('quranReminderTime', e.target.value);
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('quranReminderDismissed', getSydneyDateString());
  };

  const canNotify = permission !== 'unsupported';

  return (
    <>
      {/* In-app reminder banner */}
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

      {/* Reminder settings card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6 rounded-3xl p-5"
        style={{ background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--app-card-bg-alt)' }}>
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--app-text-primary)' }}>Daily Reminders</h3>
              <p className="text-xs" style={{ color: 'var(--app-text-secondary)' }}>
                {reminderEnabled && permission === 'granted'
                  ? `On — ${reminderTime}`
                  : permission === 'unsupported'
                    ? 'Not supported on this device'
                    : 'Get notified to read daily'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={!canNotify}
            className="relative w-12 h-7 rounded-full transition-colors touch-manipulation disabled:opacity-40 shrink-0"
            style={{ background: reminderEnabled ? 'var(--app-accent)' : 'var(--app-card-bg-alt)' }}
          >
            <span className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow transition-all ${
              reminderEnabled ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Time picker (only when enabled) */}
        <AnimatePresence>
          {reminderEnabled && permission === 'granted' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--app-divider)' }}>
                <Clock className="w-4 h-4" style={{ color: 'var(--app-text-secondary)' }} />
                <label className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>Reminder time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={handleTimeChange}
                  className="ml-auto px-3 py-1.5 rounded-lg text-sm touch-manipulation"
                  style={{ background: 'var(--app-pill-bg)', border: '1px solid var(--app-pill-border)', color: 'var(--app-text-primary)' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}