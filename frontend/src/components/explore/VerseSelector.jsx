import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Loader2, BookOpen, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QuranAPI from '@/components/reading/QuranAPI';

export default function VerseSelector({ 
  surah, 
  onClose, 
  onSelect 
}) {
  const [selectedVerse, setSelectedVerse] = useState(surah?.startVerse || 1);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (surah) {
      setSelectedVerse(surah.startVerse || 1);
      loadSurahData();
    }
  }, [surah]);

  const loadSurahData = async () => {
    setLoading(true);
    try {
      const data = await QuranAPI.getSurah(surah.number);
      setSurahData(data);
    } catch (error) {
      console.error('Error loading surah:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (standalone = false) => {
    onSelect(surah.number, selectedVerse, standalone);
  };

  if (!surah) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">{surah.number}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{surah.englishName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{surah.englishNameTranslation}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5 dark:text-white" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{surah.numberOfAyahs} verses</span>
            <span>•</span>
            <span>{surah.revelationType}</span>
          </div>
        </div>

        {/* Verse Selection */}
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Start from verse
          </label>
          
          <div className="flex items-center gap-4 mb-6">
            <Input
              type="number"
              min={1}
              max={surah.numberOfAyahs}
              value={selectedVerse || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setSelectedVerse('');
                } else {
                  const num = parseInt(val);
                  if (!isNaN(num)) {
                    setSelectedVerse(Math.max(1, Math.min(surah.numberOfAyahs, num)));
                  }
                }
              }}
              onBlur={() => {
                if (selectedVerse === '' || selectedVerse < 1) {
                  setSelectedVerse(1);
                }
              }}
              className="text-center text-xl font-bold py-6 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
            <span className="text-slate-400 dark:text-slate-500">of {surah.numberOfAyahs}</span>
          </div>

          {/* Quick verse buttons */}
          <div className="mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {[1, Math.ceil(surah.numberOfAyahs / 4), Math.ceil(surah.numberOfAyahs / 2), Math.ceil(surah.numberOfAyahs * 3 / 4), surah.numberOfAyahs].filter((v, i, a) => a.indexOf(v) === i).map((v) => (
                <Button
                  key={v}
                  variant={selectedVerse === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVerse(v)}
                  className={`rounded-full ${selectedVerse === v ? 'bg-violet-600' : 'dark:border-slate-700 dark:text-slate-300'}`}
                >
                  Verse {v}
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
            </div>
          ) : surahData?.verses?.[selectedVerse - 1] && (
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 mb-6">
              <p className="text-sm text-slate-400 mb-2">Preview</p>
              <p 
                className="text-2xl text-right text-white leading-[2.5]"
                style={{ 
                  fontFamily: "'PDMS Saleem QuranFont', 'Al Mushaf', serif",
                  lineHeight: 2.5
                }}
                dir="rtl"
              >
                {surahData.verses[selectedVerse - 1].arabic.substring(0, 80)}
                <span className="text-amber-500 mx-1">۝</span>
              </p>
            </div>
          )}

          {/* Start Buttons */}
          <div className="space-y-3 pb-4">
            <Button
              onClick={() => handleStart(false)}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-lg font-semibold"
            >
              <Bookmark className="w-5 h-5 mr-2" />
              Continue Reading (Track Progress)
            </Button>
            <Button
              onClick={() => handleStart(true)}
              variant="outline"
              className="w-full py-5 rounded-2xl border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Standalone Mode (No Tracking)
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}