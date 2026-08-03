import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon, Bell, Quote } from 'lucide-react';
import * as notifications from '@/lib/notifications';

const REFLECTIONS = [
  {
    surah: "Ar-Ra'd 13:28",
    arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    translation: "Verily, in the remembrance of Allah do hearts find rest.",
    question: "What brings your heart true peace today?",
  },
  {
    surah: "Ash-Sharh 94:5-6",
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "For indeed, with hardship comes ease.",
    question: "What difficulty are you facing that might carry hidden ease?",
  },
  {
    surah: "Al-Baqarah 2:153",
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    translation: "O you who believe, seek help through patience and prayer.",
    question: "How can patience reshape your current challenge?",
  },
  {
    surah: "Ad-Duha 93:4",
    arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
    translation: "And your Lord is going to give you, and you will be satisfied.",
    question: "What are you truly seeking satisfaction in?",
  },
  {
    surah: "Al-Ankabut 29:69",
    arabic: "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا",
    translation: "And those who strive for Us — We will surely guide them to Our ways.",
    question: "Where are you putting in effort that Allah sees?",
  },
  {
    surah: "At-Talaq 65:3",
    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    translation: "And whoever places their trust in Allah, He is sufficient for them.",
    question: "What do you need to let go of and trust Allah with today?",
  },
  {
    surah: "Al-Baqarah 2:286",
    arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translation: "Allah does not burden a soul beyond that it can bear.",
    question: "What burden are you carrying that you were made strong enough for?",
  },
  {
    surah: "An-Nahl 16:97",
    arabic: "مَنْ عَمِلَ صَالِحًا وَهُوَ مُؤْمِنٌ فَلَنُحْيِيَنَّهُ حَيَاةً طَيِّبَةً",
    translation: "Whoever does righteousness while being a believer — We will surely cause them to live a good life.",
    question: "What righteous act can you do today to nourish your soul?",
  },
  {
    surah: "Ghafir 40:60",
    arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ",
    translation: "Call upon Me; I will respond to you.",
    question: "What have you been hesitant to ask Allah for?",
  },
  {
    surah: "Ali 'Imran 3:139",
    arabic: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ",
    translation: "So do not weaken and do not grieve, and you will be superior if you are believers.",
    question: "What grief is holding you back from rising?",
  },
  {
    surah: "Ibrahim 14:7",
    arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    translation: "If you are grateful, I will surely increase you.",
    question: "What three blessings can you thank Allah for right now?",
  },
  {
    surah: "Az-Zumar 39:53",
    arabic: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
    translation: "Do not despair of the mercy of Allah.",
    question: "Where have you been holding onto despair instead of hope?",
  },
  {
    surah: "Al-Furqan 25:63",
    arabic: "وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا",
    translation: "The servants of the Most Merciful are those who walk upon the earth gently.",
    question: "How can you carry yourself more gently today?",
  },
  {
    surah: "Al-Mu'minun 23:1",
    arabic: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ",
    translation: "Certainly will the believers have succeeded.",
    question: "What does success mean to you through the lens of faith?",
  },
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

export default function DailyReflection() {
  const dayIndex = getDayOfYear() % REFLECTIONS.length;
  const reflection = REFLECTIONS[dayIndex];

  const [notifyEnabled, setNotifyEnabled] = useState(() => localStorage.getItem('reflectionNotify') === 'true');
  const [permission, setPermission] = useState('prompt');
  const timerRef = useRef(null);
  const canNotify = permission !== 'unsupported';

  useEffect(() => {
    notifications.getPermissionStatus().then(setPermission);
  }, []);

  useEffect(() => {
    if (!notifyEnabled || !canNotify || permission !== 'granted') {
      notifications.cancelReminder(notifications.NOTIFICATION_IDS.DAILY_REFLECTION_REMINDER);
      return;
    }

    if (notifications.isNative()) {
      notifications.scheduleDailyReminder({
        id: notifications.NOTIFICATION_IDS.DAILY_REFLECTION_REMINDER,
        title: "Today's Reflection",
        body: `${reflection.translation}\n\nReflect: ${reflection.question}`,
        hour: 7,
        minute: 0,
      });
      return;
    }

    // Web fallback: foreground-only timer.
    if (timerRef.current) clearTimeout(timerRef.current);

    const scheduleNext = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(7, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const ms = target - now;

      timerRef.current = setTimeout(() => {
        notifications.showImmediateNotification({
          title: "Today's Reflection",
          body: `${reflection.translation}\n\nReflect: ${reflection.question}`,
        });
        scheduleNext();
      }, ms);
    };

    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [notifyEnabled, permission, reflection]);

  const handleToggle = () => {
    if (!canNotify) return;
    const newState = !notifyEnabled;
    setNotifyEnabled(newState);
    localStorage.setItem('reflectionNotify', String(newState));
    if (newState && permission !== 'granted') {
      notifications.requestPermission().then(result => {
        setPermission(result);
        if (result === 'granted') {
          notifications.showImmediateNotification({
            title: 'Reflection Notifications Enabled',
            body: "You'll receive a daily verse and reflection question at 7:00 AM.",
          });
        }
      });
    }
  };

  const isActive = notifyEnabled && permission === 'granted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      {/* Reflection card */}
      <div className="rounded-3xl p-6 mb-3" style={{ background: '#18181A', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(123,97,255,0.15)' }}>
            <Moon className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white text-sm">Today's Reflection</h3>
          <span className="text-xs ml-auto" style={{ color: '#A0A0A5' }}>{reflection.surah}</span>
        </div>

        {/* Arabic verse */}
        <p className="text-2xl text-center text-white mb-4 leading-[2.2]" dir="rtl" style={{ fontFamily: "'Amiri', serif" }}>
          {reflection.arabic}
        </p>

        {/* Translation */}
        <p className="text-sm text-center text-slate-300 mb-5 leading-relaxed">
          "{reflection.translation}"
        </p>

        {/* Reflection question */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(123,97,255,0.08)' }}>
          <div className="flex items-start gap-2">
            <Quote className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-sm text-violet-200 italic leading-relaxed">{reflection.question}</p>
          </div>
        </div>
      </div>

      {/* Notification toggle */}
      <div className="rounded-3xl p-5 flex items-center justify-between" style={{ background: '#18181A', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#2D2D35' }}>
            <Bell className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Reflection Reminders</h3>
            <p className="text-xs" style={{ color: '#A0A0A5' }}>
              {isActive
                ? 'On — daily at 7:00 AM'
                : canNotify
                  ? 'Get a daily verse to ponder'
                  : 'Not supported on this device'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={!canNotify}
          className="relative w-12 h-7 rounded-full transition-colors touch-manipulation disabled:opacity-40 shrink-0"
          style={{ background: isActive ? '#7B61FF' : '#3A3A3E' }}
        >
          <span className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow transition-all ${
            isActive ? 'right-0.5' : 'left-0.5'
          }`} />
        </button>
      </div>
    </motion.div>
  );
}