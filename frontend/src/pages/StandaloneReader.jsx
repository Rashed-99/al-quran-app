import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Heart,
  Volume2,
  Pause,
  List,
  Loader2,
  Share2,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuranAPI from '@/components/reading/QuranAPI';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function StandaloneReader() {
  const navigate = useNavigate();
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [surahList, setSurahList] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surah = parseInt(params.get('surah')) || 1;
    const verse = parseInt(params.get('verse')) || 1;
    setCurrentSurah(surah);
    setCurrentVerse(verse);
    loadSurahList();
  }, []);

  useEffect(() => {
    fetchSurahData(currentSurah);
  }, [currentSurah]);

  const loadSurahList = async () => {
    try {
      const list = await QuranAPI.getSurahList();
      setSurahList(list);
    } catch (error) {
      console.error('Error loading surah list:', error);
    }
  };

  const fetchSurahData = async (surahNumber) => {
    setLoading(true);
    try {
      const data = await QuranAPI.getSurah(surahNumber);
      setSurahData(data);
    } catch (error) {
      console.error('Error fetching surah:', error);
    } finally {
      setLoading(false);
    }
  };

  const verse = surahData?.verses?.[currentVerse - 1];

  const goToSurah = (surahNum) => {
    setCurrentSurah(surahNum);
    setCurrentVerse(1);
  };

  const shareVerse = async () => {
    if (!verse || !surahData) return;
    
    const shareText = `${verse.arabic}\n\n"${verse.translation}"\n\n- Surah ${surahData.englishName}, Verse ${currentVerse}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Surah ${surahData.englishName}:${currentVerse}`,
          text: shareText
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Verse copied to clipboard!');
    }
  };

  const handleNextVerse = () => {
    if (!surahData) return;
    if (currentVerse < surahData.numberOfAyahs) {
      setCurrentVerse(prev => prev + 1);
    } else if (currentSurah < 114) {
      setCurrentSurah(prev => prev + 1);
      setCurrentVerse(1);
    }
  };

  const handlePrevVerse = async () => {
    if (currentVerse > 1) {
      setCurrentVerse(prev => prev - 1);
    } else if (currentSurah > 1) {
      const prevSurahNum = currentSurah - 1;
      setCurrentSurah(prevSurahNum);
      try {
        const prevSurah = await QuranAPI.getSurah(prevSurahNum);
        setCurrentVerse(prevSurah.numberOfAyahs);
      } catch (error) {
        setCurrentVerse(1);
      }
    }
  };

  const toggleAudio = () => {
    if (!verse?.audio) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = verse.audio;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  if (loading || !surahData || !verse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 select-none">Loading Quran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col" style={{ overscrollBehaviorY: 'none' }}>
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 select-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Explore'))}
            className="rounded-full select-none touch-manipulation"
          >
            <X className="w-5 h-5 dark:text-white select-none" />
          </Button>

          <div className="text-center select-none">
            <div className="flex items-center gap-2 justify-center">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">Standalone Mode</span>
            </div>
            <p className="font-semibold text-slate-800 dark:text-white select-none mt-1">{surahData.englishName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 select-none">Verse {currentVerse} of {surahData.numberOfAyahs}</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full select-none touch-manipulation"
              >
                <List className="w-5 h-5 dark:text-white select-none" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 dark:bg-slate-900">
              <SheetHeader>
                <SheetTitle className="dark:text-white">Surahs</SheetTitle>
              </SheetHeader>
              <div className="mt-4 max-h-[80vh] overflow-y-auto">
                {surahList.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => goToSurah(s.number)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                      s.number === currentSurah 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full text-sm font-medium">
                        {s.number}
                      </span>
                      <div>
                        <p className="font-medium">{s.englishName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.numberOfAyahs} verses</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Verse Content */}
      <main className="flex-1 px-4 py-8 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentSurah}-${currentVerse}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl"
          >
            {/* Top actions */}
            <div className="flex items-center justify-between mb-6 select-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAudio}
                className="rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 select-none touch-manipulation"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-emerald-600 dark:text-emerald-400 select-none" />
                ) : (
                  <Volume2 className="w-5 h-5 text-slate-400 select-none" />
                )}
              </Button>

              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 select-none">
                {surahData.englishName} : {currentVerse}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={shareVerse}
                className="rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 select-none touch-manipulation"
              >
                <Share2 className="w-5 h-5 text-slate-400 select-none" />
              </Button>
            </div>

            {/* Arabic Text - IndoPak Style (PDMS Saleem QuranFont) */}
            <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl shadow-lg border border-slate-800 p-8 md:p-12 mb-6">
              {currentVerse === 1 && currentSurah !== 1 && currentSurah !== 9 && (
                <p
                  className="text-xl md:text-2xl text-center text-white/70 pb-6 select-none"
                  style={{ fontFamily: "'PDMS Saleem QuranFont', 'Al Mushaf', serif" }}
                  dir="rtl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                </p>
              )}
              <p 
                className="text-3xl md:text-4xl lg:text-5xl text-center text-white leading-[2.5]"
                style={{ 
                  fontFamily: "'PDMS Saleem QuranFont', 'Al Mushaf', serif",
                  lineHeight: 2.5
                }}
                dir="rtl"
              >
                {verse.arabic}
                <span className="text-amber-500 text-2xl mx-2">۝</span>
                <span className="text-amber-500 text-xl">{currentVerse}</span>
              </p>
            </div>

            {/* Translation */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
              <p className="text-lg text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                {verse.translation}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4 select-none">
          <Button
            variant="outline"
            onClick={handlePrevVerse}
            disabled={currentSurah === 1 && currentVerse === 1}
            className="flex-1 rounded-xl py-6 dark:border-slate-700 dark:text-white select-none touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 mr-2 select-none" />
            <span className="select-none">Previous</span>
          </Button>

          <Button
            onClick={handleNextVerse}
            disabled={currentSurah === 114 && currentVerse === surahData?.numberOfAyahs}
            className="flex-1 rounded-xl py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 select-none touch-manipulation"
          >
            <span className="select-none">Next</span>
            <ChevronRight className="w-5 h-5 ml-2 select-none" />
          </Button>
        </div>
      </footer>
    </div>
  );
}