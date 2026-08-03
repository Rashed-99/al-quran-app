import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  Volume2,
  Pause,
  Loader2,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as favoritesApi from '@/api/favorites';
import QuranAPI from '@/components/reading/QuranAPI';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import FontPicker, { getFontStyle } from '@/components/reading/FontPicker';

export default function QuranReader() {
  const navigate = useNavigate();
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [surahData, setSurahData] = useState(null);
  const [surahList, setSurahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem('quranFont') || 'kitab');
  const [showFontPicker, setShowFontPicker] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surah = parseInt(params.get('surah')) || 1;
    const verse = parseInt(params.get('verse')) || 1;
    setCurrentSurah(surah);
    setCurrentVerse(verse);
    loadSurahList();
    loadFavorites();
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

  const loadFavorites = async () => {
    try {
      const favList = await favoritesApi.listFavorites();
      setFavorites(favList);
    } catch (error) {
      console.error('Error loading favorites:', error);
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

  const isFavorite = favorites.some(
    f => f.surah_number === currentSurah && f.verse_number === currentVerse
  );

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

  const toggleFavorite = async () => {
    if (!verse || !surahData) return;
    if (isFavorite) {
      const fav = favorites.find(
        f => f.surah_number === currentSurah && f.verse_number === currentVerse
      );
      if (fav) {
        await favoritesApi.removeFavorite(fav.id);
        setFavorites(prev => prev.filter(f => f.id !== fav.id));
      }
    } else {
      const newFav = await favoritesApi.addFavorite({
        surah_number: currentSurah,
        surah_name: surahData.englishName,
        verse_number: currentVerse,
        arabic_text: verse.arabic,
        translation: verse.translation
      });
      setFavorites(prev => [...prev, newFav]);
    }
  };

  const goToSurah = (surahNum) => {
    setCurrentSurah(surahNum);
    setCurrentVerse(1);
  };

  const handleFontChange = (fontId) => {
    setSelectedFont(fontId);
    localStorage.setItem('quranFont', fontId);
  };

  if (loading || !surahData || !verse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-500 dark:text-violet-400 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 select-none">Loading Quran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 py-3 select-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Home'))}
            className="rounded-full select-none touch-manipulation"
          >
            <ChevronLeft className="w-6 h-6 dark:text-white select-none" />
          </Button>

          <div className="text-center select-none">
            <p className="font-semibold text-slate-800 dark:text-white select-none">{surahData.englishName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 select-none">Verse {currentVerse} of {surahData.numberOfAyahs}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFontPicker(true)}
              className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-white touch-manipulation select-none"
            >
              Aa
            </button>
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
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' 
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
            <div className="flex items-center justify-between mb-6 select-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAudio}
                className="rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/30 select-none touch-manipulation"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-violet-600 dark:text-violet-400 select-none" />
                ) : (
                  <Volume2 className="w-5 h-5 text-slate-400 select-none" />
                )}
              </Button>

              <span className="text-sm font-medium text-violet-600 dark:text-violet-400 select-none">
                {surahData.englishName} : {currentVerse}
              </span>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className="rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 select-none touch-manipulation"
              >
                <Heart 
                  className={`w-5 h-5 transition-colors select-none ${
                    isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                  }`} 
                />
              </Button>
            </div>

            {/* Arabic Text */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-6">
              {currentVerse === 1 && currentSurah !== 1 && currentSurah !== 9 && (
                <p
                  className="text-2xl md:text-3xl text-center text-slate-900 pb-6 select-none"
                  style={getFontStyle(selectedFont)}
                  dir="rtl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                </p>
              )}
              <p
                className="text-3xl md:text-4xl lg:text-5xl text-center text-slate-900 leading-[2.8] select-none"
                style={getFontStyle(selectedFont)}
                dir="rtl"
              >
                {verse.arabic}
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
            className="flex-1 rounded-xl py-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 select-none touch-manipulation"
          >
            <span className="select-none">Next</span>
            <ChevronRight className="w-5 h-5 ml-2 select-none" />
          </Button>
        </div>
      </footer>

      <FontPicker
        open={showFontPicker}
        onOpenChange={setShowFontPicker}
        currentFont={selectedFont}
        onFontChange={handleFontChange}
      />
    </div>
  );
}