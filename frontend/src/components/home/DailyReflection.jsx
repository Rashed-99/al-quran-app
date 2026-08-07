import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Quote } from 'lucide-react';

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

// The notification toggle previously rendered here has moved to Settings
// -> Notifications (consolidated with the reading reminder toggle). This
// component now only shows the day's reflection content.
export default function DailyReflection() {
  const dayIndex = getDayOfYear() % REFLECTIONS.length;
  const reflection = REFLECTIONS[dayIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      <div className="rounded-3xl p-6" style={{ background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)', boxShadow: 'var(--app-shadow-card)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--app-accent-soft)' }}>
            <Moon className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--app-text-primary)' }}>Today's Reflection</h3>
          <span className="text-xs ml-auto" style={{ color: 'var(--app-text-secondary)' }}>{reflection.surah}</span>
        </div>

        {/* Arabic verse */}
        <p className="text-2xl text-center mb-4 leading-[2.2]" dir="rtl" style={{ fontFamily: "'Amiri', serif", color: 'var(--app-text-primary)' }}>
          {reflection.arabic}
        </p>

        {/* Translation */}
        <p className="text-sm text-center mb-5 leading-relaxed" style={{ color: 'var(--app-text-secondary)' }}>
          "{reflection.translation}"
        </p>

        {/* Reflection question */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--app-accent-soft)' }}>
          <div className="flex items-start gap-2">
            <Quote className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--app-text-primary)', opacity: 0.85 }}>{reflection.question}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}