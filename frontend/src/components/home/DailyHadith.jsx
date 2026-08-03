import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, BookOpen, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const HADITHS = [
  {
    text: "The most beloved deed to Allah is that which is regular and constant even if it is little.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "6464",
    book: "Book of Riqaq (Softening the Hearts)",
    grade: "Sahih (Authentic)",
    narratedBy: "Aisha (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The best among you are those who learn the Quran and teach it.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "5027",
    book: "Book of the Virtues of the Quran",
    grade: "Sahih (Authentic)",
    narratedBy: "Uthman ibn Affan (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Read the Quran, for it will come as an intercessor for its reciters on the Day of Resurrection.",
    collection: "Sahih Muslim",
    hadithNumber: "804",
    book: "Book of Prayer (Kitab al-Salat)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Umaama (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Whoever recites a letter from the Book of Allah will be credited with a good deed, and a good deed is multiplied into ten.",
    collection: "Jami at-Tirmidhi",
    hadithNumber: "2910",
    book: "Chapters on the Virtues of the Quran",
    grade: "Sahih (Authentic)",
    narratedBy: "Abdullah ibn Mas'ud (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The one who is proficient in the recitation of the Quran will be in the company of the honorable and obedient scribes (angels).",
    collection: "Sahih al-Bukhari",
    hadithNumber: "4937",
    book: "Book of the Virtues of the Quran",
    grade: "Sahih (Authentic)",
    narratedBy: "Aisha (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Verily the one who recites the Quran beautifully, smoothly, and precisely, will be in the company of noble angels.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "4937",
    book: "Book of the Virtues of the Quran",
    grade: "Sahih (Authentic)",
    narratedBy: "Aisha (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The heart that has no Quran in it is like an abandoned ruined dwelling.",
    collection: "Jami at-Tirmidhi",
    hadithNumber: "2913",
    book: "Chapters on the Virtues of the Quran",
    grade: "Hasan (Good)",
    narratedBy: "Abu Musa al-Ash'ari (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Fasting and the Quran will intercede for the servant on the Day of Resurrection.",
    collection: "Musnad Ahmad",
    hadithNumber: "6626",
    book: "Musnad al-Mukthireen",
    grade: "Sahih (Authentic)",
    narratedBy: "Abdullah ibn Amr (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Indeed Allah raises some people with this Book and lowers others with it.",
    collection: "Sahih Muslim",
    hadithNumber: "817",
    book: "Book of Prayer (Kitab al-Salat)",
    grade: "Sahih (Authentic)",
    narratedBy: "Umar ibn al-Khattab (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The example of the one who remembers his Lord and the one who does not is like the example of the living and the dead.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "6407",
    book: "Book of Supplications",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Musa al-Ash'ari (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Make things easy and do not make them difficult, cheer people up and do not put them off.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "69",
    book: "Book of Knowledge",
    grade: "Sahih (Authentic)",
    narratedBy: "Anas ibn Malik (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Whoever travels a path in search of knowledge, Allah makes easy for him a path to Paradise.",
    collection: "Sahih Muslim",
    hadithNumber: "2699",
    book: "Book of Knowledge and Etiquette",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The strong believer is better and more beloved to Allah than the weak believer, while there is good in both.",
    collection: "Sahih Muslim",
    hadithNumber: "2664",
    book: "Book of Destiny (Qadar)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Take advantage of five before five: your youth before your old age, your health before your illness, your wealth before your poverty, your free time before your busyness, and your life before your death.",
    collection: "Shu'ab al-Iman",
    hadithNumber: "9575",
    book: "Book of the Branches of Faith",
    grade: "Sahih (Authentic)",
    narratedBy: "Abdullah ibn Abbas (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Do not belittle any good deed, even meeting your brother with a cheerful face.",
    collection: "Sahih Muslim",
    hadithNumber: "2626",
    book: "Book of Faith (Kitab al-Iman)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Dharr al-Ghifari (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "6018",
    book: "Book of Manners",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Part of the perfection of one's Islam is leaving that which does not concern him.",
    collection: "Jami at-Tirmidhi",
    hadithNumber: "2317",
    book: "Book of Knowledge",
    grade: "Hasan Sahih (Good & Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "13",
    book: "Book of Faith (Kitab al-Iman)",
    grade: "Sahih (Authentic)",
    narratedBy: "Anas ibn Malik (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Be in this world as if you were a stranger or a traveler along a path.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "6416",
    book: "Book of Supplications",
    grade: "Sahih (Authentic)",
    narratedBy: "Abdullah ibn Umar (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Allah does not look at your appearance or wealth, but rather He looks at your hearts and actions.",
    collection: "Sahih Muslim",
    hadithNumber: "2564",
    book: "Book of Righteousness (Birr)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The world is a prison for the believer and a paradise for the disbeliever.",
    collection: "Sahih Muslim",
    hadithNumber: "2956",
    book: "Book of Zuhd (Asceticism)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Whoever is not grateful for small things will not be grateful for big things.",
    collection: "Musnad Ahmad",
    hadithNumber: "17387",
    book: "Musnad al-Basriyyin",
    grade: "Hasan (Good)",
    narratedBy: "An-Nu'man ibn Bashir (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The most complete of the believers in faith are those with the best character.",
    collection: "Jami at-Tirmidhi",
    hadithNumber: "1162",
    book: "Book of Faith (Kitab al-Iman)",
    grade: "Hasan (Good)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "There is no disease that Allah has created, except that He also has created its remedy.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "5678",
    book: "Book of Medicine",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Whoever humbles himself for Allah, Allah will raise him.",
    collection: "Sahih Muslim",
    hadithNumber: "2588",
    book: "Book of Righteousness (Birr)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Sa'id al-Khudri (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The supplication of a Muslim for his brother in his absence is answered.",
    collection: "Sahih Muslim",
    hadithNumber: "2733",
    book: "Book of Righteousness (Birr)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu ad-Darda (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "The best of people are those who are most beneficial to people.",
    collection: "al-Mu'jam al-Awsat",
    hadithNumber: "5787",
    book: "Tabarani's Mu'jam al-Awsat",
    grade: "Hasan (Good)",
    narratedBy: "Jabir ibn Abdullah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "When Allah loves a servant, He tests him.",
    collection: "Jami at-Tirmidhi",
    hadithNumber: "2396",
    book: "Book of Trials (Fitan)",
    grade: "Sahih (Authentic)",
    narratedBy: "Anas ibn Malik (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Richness is not having many belongings, but richness is the richness of the soul.",
    collection: "Sahih al-Bukhari",
    hadithNumber: "6446",
    book: "Book of Riqaq (Softening the Hearts)",
    grade: "Sahih (Authentic)",
    narratedBy: "Abu Hurairah (RA)",
    speaker: "Prophet Muhammad ﷺ",
    isQuran: false
  },
  {
    text: "Verily, with hardship comes ease.",
    collection: "The Noble Quran",
    hadithNumber: "94:5-6",
    book: "Surah Ash-Sharh (The Relief)",
    grade: "Word of Allah",
    narratedBy: "—",
    speaker: "Allah ﷻ",
    isQuran: true
  },
  {
    text: "And whoever relies upon Allah, then He is sufficient for him.",
    collection: "The Noble Quran",
    hadithNumber: "65:3",
    book: "Surah At-Talaq (The Divorce)",
    grade: "Word of Allah",
    narratedBy: "—",
    speaker: "Allah ﷻ",
    isQuran: true
  }
];

export default function DailyHadith() {
  const [copied, setCopied] = React.useState(false);

  // Get hadith based on current date (changes daily)
  const hadith = useMemo(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return HADITHS[dayOfYear % HADITHS.length];
  }, []);

  const copyHadith = () => {
    let text;
    if (hadith.isQuran) {
      text =
`❝${hadith.text}❞

— ${hadith.speaker}

📖 ${hadith.collection}
📍 ${hadith.book} · ${hadith.hadithNumber}
✦ ${hadith.grade}`;
    } else {
      text =
`❝${hadith.text}❞

— ${hadith.speaker}
Narrated by: ${hadith.narratedBy}

📚 ${hadith.collection} ${hadith.hadithNumber}
📖 ${hadith.book}
✦ Grade: ${hadith.grade}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(hadith.isQuran ? 'Verse copied with reference!' : 'Hadith copied with reference!');
    setTimeout(() => setCopied(false), 2000);
  };

  const referenceLabel = hadith.isQuran
    ? `${hadith.collection} · ${hadith.hadithNumber}`
    : `${hadith.collection} ${hadith.hadithNumber}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />

      {/* Copy button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={copyHadith}
        className="absolute top-4 right-4 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
      >
        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
      </Button>

      <div className="relative">
        {/* Daily badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-medium text-white/80 select-none">
            {hadith.isQuran ? 'Verse of the Day' : 'Daily Hadith'}
          </span>
        </div>

        <p className="text-lg font-medium leading-relaxed mb-5 select-none">
          "{hadith.text}"
        </p>

        {/* Speaker */}
        <p className="text-sm text-slate-300 mb-4 select-none">— {hadith.speaker}</p>

        {/* Reference details card */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {/* Collection + number */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate select-none">{hadith.collection}</p>
                <p className="text-xs text-slate-400 select-none">{hadith.hadithNumber}</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 font-medium shrink-0 select-none">
              {referenceLabel}
            </span>
          </div>

          <div className="h-px bg-white/10" />

          {/* Book / Surah */}
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 select-none">{hadith.isQuran ? 'Surah' : 'Book'}</p>
              <p className="text-sm text-white/90 select-none">{hadith.book}</p>
            </div>
          </div>

          {/* Narrator */}
          {!hadith.isQuran && (
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400 select-none">Narrated by</p>
                <p className="text-sm text-white/90 select-none">{hadith.narratedBy}</p>
              </div>
            </div>
          )}

          {/* Grade */}
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 select-none">Grade</p>
              <p className="text-sm text-white/90 select-none">{hadith.grade}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}