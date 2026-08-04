import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Search, BookOpen, Bookmark, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SurahCard from '@/components/explore/SurahCard';
import VerseSelector from '@/components/explore/VerseSelector';
import QuranAPI from '@/components/reading/QuranAPI';

// Juz data (30 parts)
const JUZ = [
  { number: 1, name: "Alif Lam Meem", startSurah: 1, startVerse: 1 },
  { number: 2, name: "Sayaqool", startSurah: 2, startVerse: 142 },
  { number: 3, name: "Tilka Ar-Rusul", startSurah: 2, startVerse: 253 },
  { number: 4, name: "Lan Tanaloo", startSurah: 3, startVerse: 92 },
  { number: 5, name: "Wal Muhsanat", startSurah: 4, startVerse: 24 },
  { number: 6, name: "La Yuhibbullah", startSurah: 4, startVerse: 148 },
  { number: 7, name: "Wa Iza Samiu", startSurah: 5, startVerse: 82 },
  { number: 8, name: "Wa Lau Annana", startSurah: 6, startVerse: 111 },
  { number: 9, name: "Qalal Mala", startSurah: 7, startVerse: 88 },
  { number: 10, name: "Wa A'lamu", startSurah: 8, startVerse: 41 },
  { number: 11, name: "Ya'tazirun", startSurah: 9, startVerse: 93 },
  { number: 12, name: "Wa Ma Min Dabbah", startSurah: 11, startVerse: 6 },
  { number: 13, name: "Wa Ma Ubarri'u", startSurah: 12, startVerse: 53 },
  { number: 14, name: "Rubama", startSurah: 15, startVerse: 1 },
  { number: 15, name: "Subhanallazi", startSurah: 17, startVerse: 1 },
  { number: 16, name: "Qal Alam", startSurah: 18, startVerse: 75 },
  { number: 17, name: "Iqtaraba", startSurah: 21, startVerse: 1 },
  { number: 18, name: "Qad Aflaha", startSurah: 23, startVerse: 1 },
  { number: 19, name: "Wa Qalallazina", startSurah: 25, startVerse: 21 },
  { number: 20, name: "Amman Khalaq", startSurah: 27, startVerse: 56 },
  { number: 21, name: "Utlu Ma Uhiya", startSurah: 29, startVerse: 45 },
  { number: 22, name: "Wa Man Yaqnut", startSurah: 33, startVerse: 31 },
  { number: 23, name: "Wa Mali", startSurah: 36, startVerse: 22 },
  { number: 24, name: "Faman Azlamu", startSurah: 39, startVerse: 32 },
  { number: 25, name: "Ilayhi Yuraddu", startSurah: 41, startVerse: 47 },
  { number: 26, name: "Ha Mim", startSurah: 46, startVerse: 1 },
  { number: 27, name: "Qala Fama Khatbukum", startSurah: 51, startVerse: 31 },
  { number: 28, name: "Qad Sami Allah", startSurah: 58, startVerse: 1 },
  { number: 29, name: "Tabarakallazi", startSurah: 67, startVerse: 1 },
  { number: 30, name: "Amma", startSurah: 78, startVerse: 1 },
];

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('surahs');
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState(null);

  useEffect(() => {
    fetchSurahList();
  }, []);

  const fetchSurahList = async () => {
    try {
      const surahList = await QuranAPI.getSurahList();
      setSurahs(surahList);
    } catch (error) {
      console.error('Error fetching surahs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSurahs = surahs.filter(surah =>
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.name.includes(searchQuery) ||
    surah.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.number.toString() === searchQuery
  );

  const handleSurahClick = (surah) => {
    setSelectedSurah(surah);
  };

  const handleJuzClick = (juz) => {
    // Find the surah data for the juz
    const surah = surahs.find(s => s.number === juz.startSurah);
    if (surah) {
      setSelectedSurah({ ...surah, startVerse: juz.startVerse });
    }
  };

  const handleVerseSelect = (surahNumber, verseNumber) => {
    setSelectedSurah(null);
    // Explore is a lookup/search tool, not the tracked daily-reading flow -
    // it always opens the standalone reader (no progress/streak/hasanat
    // side effects). Continuous tracked reading still lives on Home -> Reading.
    navigate(createPageUrl(`StandaloneReader?surah=${surahNumber}&verse=${verseNumber}`));
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 select-none">Explore</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 select-none" />
          <Input
            type="text"
            placeholder="Search surahs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-6 rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-violet-300 dark:focus:border-violet-600 focus:ring-violet-200 dark:focus:ring-violet-800"
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 select-none">
          <TabsTrigger 
            value="surahs" 
            className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm select-none touch-manipulation"
          >
            <BookOpen className="w-4 h-4 mr-2 select-none" />
            <span className="select-none">Surahs</span>
          </TabsTrigger>
          <TabsTrigger 
            value="juz"
            className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm select-none touch-manipulation"
          >
            <Bookmark className="w-4 h-4 mr-2 select-none" />
            <span className="select-none">Juz</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="surahs" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-500 dark:text-violet-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSurahs.map((surah, index) => (
                <SurahCard
                  key={surah.number}
                  number={surah.number}
                  nameArabic={surah.name}
                  nameEnglish={surah.englishName}
                  nameTranslation={surah.englishNameTranslation}
                  totalVerses={surah.numberOfAyahs}
                  revelationType={surah.revelationType}
                  onClick={() => handleSurahClick(surah)}
                  delay={index * 0.02}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="juz" className="mt-6">
          <div className="space-y-3">
            {JUZ.map((juz, index) => (
              <motion.button
                key={juz.number}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleJuzClick(juz)}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all flex items-center gap-4 select-none touch-manipulation"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 select-none">
                  <span className="text-white font-bold select-none">{juz.number}</span>
                </div>
                <div className="flex-1 text-left select-none">
                  <h3 className="font-semibold text-slate-800 dark:text-white select-none">Juz {juz.number}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 select-none">{juz.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Verse Selector Modal */}
      <AnimatePresence>
        {selectedSurah && (
          <VerseSelector
            surah={selectedSurah}
            onClose={() => setSelectedSurah(null)}
            onSelect={handleVerseSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}