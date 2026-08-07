import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import * as authApi from '@/api/auth';
import * as progressApi from '@/api/progress';
import * as notifications from '@/lib/notifications';
import { 
  User, 
  Target, 
  Bell, 
  Moon, 
  Globe, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  BookOpen,
  Clock,
  Sparkles,
  Trash2,
  AlertTriangle,
  Pencil,
  AtSign,
  Check,
  Palette,
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';

const TRANSLATIONS = [
  { id: 'kanzul-iman', name: 'Kanz-ul-Iman', author: 'Ahmed Raza Khan (English)' },
  { id: 'sahih-international', name: 'Sahih International', author: 'English' },
  { id: 'yusuf-ali', name: 'Yusuf Ali', author: 'English' },
  { id: 'maududi', name: 'Toward Understanding the Quran', author: 'Maududi (English)' },
  { id: 'urdu-kanzul-iman', name: 'Kanz-ul-Iman (Urdu)', author: 'Ahmed Raza Khan (Urdu)' },
];

export default function Settings() {
  const { user, logout: authLogout, checkAppState } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [darkMode, setDarkMode] = useState(() => {
    // Must match Layout.jsx's default exactly (dark unless explicitly set
    // to 'false') - these two were previously contradictory: this toggle
    // defaulted to OFF for a new user while Layout.jsx had already applied
    // dark mode globally, so the Settings toggle didn't reflect what was
    // actually on screen until the user touched it once.
    return localStorage.getItem('darkMode') !== 'false';
  });
  const [themeId, setThemeId] = useState(() => localStorage.getItem('quranTheme') || 'violet');
  const [showThemeDialog, setShowThemeDialog] = useState(false);

  // --- Notification settings, migrated from DailyReminder.jsx and
  // DailyReflection.jsx (previously each had its own toggle embedded
  // directly in the Home page; consolidated here under one Notifications
  // section, same underlying localStorage keys and scheduling logic so
  // existing schedules aren't lost by this refactor). ---
  const [notifPermission, setNotifPermission] = useState('prompt');
  const [readingReminderEnabled, setReadingReminderEnabled] = useState(
    () => localStorage.getItem('quranReminderEnabled') === 'true'
  );
  const [readingReminderTime, setReadingReminderTime] = useState(
    () => localStorage.getItem('quranReminderTime') || '08:00'
  );
  const [reflectionReminderEnabled, setReflectionReminderEnabled] = useState(
    () => localStorage.getItem('reflectionNotify') === 'true'
  );
  const readingReminderTimerRef = useRef(null);
  const reflectionReminderTimerRef = useRef(null);
  const canNotify = notifPermission !== 'unsupported';

  useEffect(() => {
    notifications.getPermissionStatus().then(setNotifPermission);
  }, []);

  // Schedule/cancel the reading reminder whenever its settings change.
  useEffect(() => {
    if (!readingReminderEnabled || notifPermission !== 'granted') {
      notifications.cancelReminder(notifications.NOTIFICATION_IDS.DAILY_READING_REMINDER);
      return;
    }

    if (notifications.isNative()) {
      const [hour, minute] = readingReminderTime.split(':').map(Number);
      notifications.scheduleDailyReminder({
        id: notifications.NOTIFICATION_IDS.DAILY_READING_REMINDER,
        title: 'Quran Reading Reminder 📖',
        body: `Assalamu Alaikum! Don't forget today's reading goal.`,
        hour,
        minute,
      });
      return;
    }

    // Web fallback: foreground-only timer (unchanged behavior from before).
    if (readingReminderTimerRef.current) clearTimeout(readingReminderTimerRef.current);
    const scheduleNext = () => {
      const now = new Date();
      const [h, m] = readingReminderTime.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const ms = target - now;
      readingReminderTimerRef.current = setTimeout(() => {
        notifications.showImmediateNotification({
          title: 'Quran Reading Reminder 📖',
          body: `Assalamu Alaikum! Don't forget today's reading goal.`,
        });
        scheduleNext();
      }, ms);
    };
    scheduleNext();
    return () => { if (readingReminderTimerRef.current) clearTimeout(readingReminderTimerRef.current); };
  }, [readingReminderEnabled, notifPermission, readingReminderTime]);

  // Schedule/cancel the reflection reminder (always 7:00 AM, matching the
  // original DailyReflection.jsx behavior).
  useEffect(() => {
    if (!reflectionReminderEnabled || notifPermission !== 'granted') {
      notifications.cancelReminder(notifications.NOTIFICATION_IDS.DAILY_REFLECTION_REMINDER);
      return;
    }

    if (notifications.isNative()) {
      notifications.scheduleDailyReminder({
        id: notifications.NOTIFICATION_IDS.DAILY_REFLECTION_REMINDER,
        title: "Today's Reflection",
        body: 'Open the app for today\'s verse and reflection question.',
        hour: 7,
        minute: 0,
      });
      return;
    }

    if (reflectionReminderTimerRef.current) clearTimeout(reflectionReminderTimerRef.current);
    const scheduleNext = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(7, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const ms = target - now;
      reflectionReminderTimerRef.current = setTimeout(() => {
        notifications.showImmediateNotification({
          title: "Today's Reflection",
          body: 'Open the app for today\'s verse and reflection question.',
        });
        scheduleNext();
      }, ms);
    };
    scheduleNext();
    return () => { if (reflectionReminderTimerRef.current) clearTimeout(reflectionReminderTimerRef.current); };
  }, [reflectionReminderEnabled, notifPermission]);

  const requestNotifPermission = async () => {
    const result = await notifications.requestPermission();
    setNotifPermission(result);
    return result;
  };

  const handleReadingReminderToggle = async (enabled) => {
    if (!canNotify) return;
    setReadingReminderEnabled(enabled);
    localStorage.setItem('quranReminderEnabled', String(enabled));
    if (enabled && notifPermission !== 'granted') {
      await requestNotifPermission();
    }
  };

  const handleReflectionReminderToggle = async (enabled) => {
    if (!canNotify) return;
    setReflectionReminderEnabled(enabled);
    localStorage.setItem('reflectionNotify', String(enabled));
    if (enabled && notifPermission !== 'granted') {
      await requestNotifPermission();
    }
  };

  const handleReadingReminderTimeChange = (e) => {
    setReadingReminderTime(e.target.value);
    localStorage.setItem('quranReminderTime', e.target.value);
  };

  const THEMES = [
    { id: 'violet', name: 'Royal Violet', accent: '#7B61FF', bg: '#F5F2FF' },
    { id: 'emerald', name: 'Emerald & Gold', accent: '#0F6E56', bg: '#FDFBF3' },
    { id: 'indigo-amber', name: 'Indigo & Amber', accent: '#3C3489', bg: '#F3F1FF' },
    { id: 'terracotta', name: 'Terracotta & Sand', accent: '#C1502B', bg: '#FAF6EE' },
    { id: 'teal-rose', name: 'Teal & Rose', accent: '#128064', bg: '#F0F9F6' },
  ];

  const handleThemeChange = (id) => {
    setThemeId(id);
    localStorage.setItem('quranTheme', id);
    // Layout.jsx's effect only re-runs on mount/navigation - this event
    // lets the theme apply instantly while staying on the Settings page.
    window.dispatchEvent(new Event('app-theme-change'));
  };

  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [username, setUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [showTranslationDrawer, setShowTranslationDrawer] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState('kanzul-iman');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user]);

  const loadData = async () => {
    try {
      const currentProgress = await progressApi.getProgress();
      setProgress(currentProgress);
      setDailyGoal(currentProgress?.daily_goal_verses || 10);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) return;
    
    setIsSavingUsername(true);
    try {
      await authApi.updateMe({ username: username.trim() });
      await checkAppState(); // refresh user in AuthContext
      setShowUsernameDialog(false);
    } catch (error) {
      console.error('Error saving username:', error);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSaveGoal = async () => {
    if (progress) {
      const updated = await progressApi.updateGoals({ daily_goal_verses: dailyGoal });
      setProgress(updated);
    }
    setShowGoalDialog(false);
  };

  const handleLogout = () => {
    authLogout();
  };

  const handleDarkModeChange = (enabled) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', enabled.toString());
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      // Single atomic cascading delete server-side (ReadingProgress,
      // FavoriteVerse, DailyLog, GroupMember, GroupProgress, Conversation,
      // Message all cascade via the FK constraints in schema.prisma) -
      // replaces the old client-side loop over 3 separate entity types.
      await authApi.deleteAccount();
      await authLogout();
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: AtSign,
          label: 'Username',
          value: user?.username ? `@${user.username}` : 'Set username',
          action: () => setShowUsernameDialog(true),
          color: 'text-violet-500',
          bg: 'bg-violet-50'
        },
      ]
    },
    {
      title: 'Reading',
      items: [
        {
          icon: Target,
          label: 'Daily Goal',
          value: `${dailyGoal} verses/day`,
          action: () => setShowGoalDialog(true),
          color: 'text-emerald-500',
          bg: 'bg-emerald-50'
        },
        {
          icon: Globe,
          label: 'Translation',
          value: TRANSLATIONS.find(t => t.id === selectedTranslation)?.name || 'Kanz-ul-Iman',
          action: () => setShowTranslationDrawer(true),
          color: 'text-blue-500',
          bg: 'bg-blue-50'
        },
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Palette,
          label: 'Theme',
          value: THEMES.find(t => t.id === themeId)?.name || 'Royal Violet',
          action: () => setShowThemeDialog(true),
          color: 'text-violet-500',
          bg: 'bg-violet-50'
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          toggle: true,
          value: darkMode,
          onChange: handleDarkModeChange,
          color: 'text-slate-500',
          bg: 'bg-slate-100 dark:bg-slate-700'
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          action: () => {},
          color: 'text-emerald-500',
          bg: 'bg-emerald-50'
        },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 select-none">Settings</h1>

        {/* User Profile Card */}
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-bold">
                {(user?.username)?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{user?.username || 'User'}</h2>
                <button 
                  onClick={() => setShowUsernameDialog(true)}
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-white/70 text-sm">{user?.email}</p>
              {user?.username && (
                <p className="text-white/50 text-xs mt-0.5">@{user.username}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-bold">{(progress?.total_hasanat || 0).toLocaleString()}</p>
              <p className="text-xs text-white/60">Hasanat</p>
            </div>
            <div className="text-center">
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-bold">{progress?.total_verses_read || 0}</p>
              <p className="text-xs text-white/60">Verses</p>
            </div>
            <div className="text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-bold">{progress?.current_streak || 0}</p>
              <p className="text-xs text-white/60">Day Streak</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1 select-none">
            {section.title}
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            {section.items.map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center justify-between p-4 ${
                  index < section.items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''
                }`}
              >
                <div className="flex items-center gap-3 select-none">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center select-none`}>
                    <item.icon className={`w-5 h-5 ${item.color} select-none`} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white select-none">{item.label}</p>
                    {!item.toggle && item.value && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 select-none">{item.value}</p>
                    )}
                  </div>
                </div>

                {item.toggle ? (
                  <Switch
                    checked={item.value}
                    onCheckedChange={item.onChange}
                    className="touch-manipulation"
                  />
                ) : (
                  <button onClick={item.action} className="p-2 -mr-2 select-none touch-manipulation">
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 select-none" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Notifications - consolidated here from what used to be two
          separate toggle cards embedded directly in the Home page
          (DailyReminder.jsx and DailyReflection.jsx). Same underlying
          localStorage keys and scheduling logic, just relocated. */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1 select-none">
          Notifications
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Daily Reading Reminder */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 select-none">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center select-none">
                  <Bell className="w-5 h-5 text-amber-500 select-none" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white select-none">Daily Reading Reminder</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 select-none">
                    {!canNotify
                      ? 'Not supported on this device'
                      : readingReminderEnabled && notifPermission === 'granted'
                        ? `On — ${readingReminderTime}`
                        : 'Get notified to read daily'}
                  </p>
                </div>
              </div>
              <Switch
                checked={readingReminderEnabled && notifPermission === 'granted'}
                onCheckedChange={handleReadingReminderToggle}
                disabled={!canNotify}
                className="touch-manipulation"
              />
            </div>
            {readingReminderEnabled && notifPermission === 'granted' && (
              <div className="mt-3 pt-3 flex items-center gap-3 border-t border-slate-100 dark:border-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                <label className="text-sm text-slate-500 dark:text-slate-400">Reminder time</label>
                <input
                  type="time"
                  value={readingReminderTime}
                  onChange={handleReadingReminderTimeChange}
                  className="ml-auto px-3 py-1.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white touch-manipulation"
                />
              </div>
            )}
          </div>

          {/* Reflection Reminder */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 select-none">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center select-none">
                  <BellRing className="w-5 h-5 text-violet-500 select-none" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white select-none">Reflection Reminder</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 select-none">
                    {!canNotify
                      ? 'Not supported on this device'
                      : reflectionReminderEnabled && notifPermission === 'granted'
                        ? 'On — daily at 7:00 AM'
                        : 'Get a daily verse to ponder'}
                  </p>
                </div>
              </div>
              <Switch
                checked={reflectionReminderEnabled && notifPermission === 'granted'}
                onCheckedChange={handleReflectionReminderToggle}
                disabled={!canNotify}
                className="touch-manipulation"
              />
            </div>
          </div>
        </div>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h3 className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-3 px-1 select-none">
          Danger Zone
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-rose-200 dark:border-rose-900 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 select-none">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center select-none">
                <Trash2 className="w-5 h-5 text-rose-500 select-none" />
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white select-none">Delete Account</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 select-none">Permanently delete all data</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 select-none touch-manipulation"
            >
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full rounded-2xl py-6 text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-900/30 select-none touch-manipulation"
        >
          <LogOut className="w-5 h-5 mr-2 select-none" />
          <span className="select-none">Log Out</span>
        </Button>
      </motion.div>

      {/* Daily Goal Drawer */}
      <Drawer open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DrawerContent className="dark:bg-slate-800 dark:border-slate-700">
          <DrawerHeader className="text-left">
            <DrawerTitle className="dark:text-white">Set Daily Goal</DrawerTitle>
            <DrawerDescription className="dark:text-slate-400">
              Choose how many verses you want to read each day
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-2">
            <div className="text-center mb-6">
              <span className="text-5xl font-bold text-violet-600 dark:text-violet-400">{dailyGoal}</span>
              <p className="text-slate-500 dark:text-slate-400 mt-1">verses per day</p>
            </div>

            <Slider
              value={[dailyGoal]}
              onValueChange={([value]) => setDailyGoal(value)}
              min={1}
              max={50}
              step={1}
              className="w-full touch-manipulation"
            />

            <div className="flex justify-between text-sm text-slate-400 mt-2 select-none">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          <DrawerFooter className="pb-6 safe-area-pb">
            <Button
              onClick={handleSaveGoal}
              className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl select-none touch-manipulation"
            >
              Save Goal
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Username Dialog */}
      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent className="max-w-sm dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Choose a Theme</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Applies instantly, works with both light and dark mode
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors touch-manipulation ${
                  themeId === t.id
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex -space-x-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800" style={{ background: t.bg }} />
                  <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800" style={{ background: t.accent }} />
                </div>
                <span className="flex-1 text-left font-medium text-slate-800 dark:text-white">{t.name}</span>
                {themeId === t.id && <Check className="w-5 h-5 text-violet-500" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent className="max-w-sm dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Set Username</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Choose a unique username that others will see
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_username"
                className="pl-10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Only lowercase letters, numbers, and underscores allowed
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSaveUsername}
              disabled={!username.trim() || isSavingUsername}
              className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl select-none touch-manipulation disabled:opacity-50"
            >
              {isSavingUsername ? 'Saving...' : 'Save Username'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <DialogTitle className="text-center dark:text-white">Delete Account?</DialogTitle>
            <DialogDescription className="text-center dark:text-slate-400">
              This action cannot be undone. All your reading progress, favorites, and data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
              Type <span className="font-bold text-rose-600">DELETE</span> to confirm
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              className="w-full bg-rose-600 hover:bg-rose-700 rounded-xl select-none touch-manipulation disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete My Account'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
              }}
              className="w-full rounded-xl select-none touch-manipulation dark:border-slate-600 dark:text-slate-300"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Translation Drawer */}
      <Drawer open={showTranslationDrawer} onOpenChange={setShowTranslationDrawer}>
        <DrawerContent className="dark:bg-slate-800 dark:border-slate-700">
          <DrawerHeader className="text-left">
            <DrawerTitle className="dark:text-white">Translation</DrawerTitle>
            <DrawerDescription className="dark:text-slate-400">
              Choose your preferred Quran translation
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-2 max-h-[60vh] overflow-y-auto safe-area-pb">
            {TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTranslation(t.id); setShowTranslationDrawer(false); }}
                className={`w-full p-4 rounded-2xl text-left flex items-center justify-between transition-all touch-manipulation ${
                  selectedTranslation === t.id
                    ? 'bg-violet-50 dark:bg-violet-900/30 border-2 border-violet-500'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent'
                }`}
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.author}</p>
                </div>
                {selectedTranslation === t.id && (
                  <Check className="w-5 h-5 text-violet-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}