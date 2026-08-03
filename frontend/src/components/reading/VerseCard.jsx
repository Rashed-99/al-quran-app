import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Volume2, Pause, Bookmark, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerseCard({ 
  arabicText, 
  translation, 
  verseNumber, 
  surahName,
  isFavorite,
  isPlaying,
  onFavoriteToggle,
  onPlayToggle,
  onShare
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden"
    >
      {/* Top actions */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayToggle}
          className="w-10 h-10 rounded-full hover:bg-violet-50"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-violet-600" />
          ) : (
            <Volume2 className="w-5 h-5 text-slate-400" />
          )}
        </Button>
        
        <span className="text-sm font-medium text-slate-500">
          {surahName} : {verseNumber}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onFavoriteToggle}
          className="w-10 h-10 rounded-full hover:bg-rose-50"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} 
          />
        </Button>
      </div>

      {/* Arabic text */}
      <div className="p-6 md:p-10">
        <p 
          className="text-3xl md:text-4xl lg:text-5xl leading-[2.5] md:leading-[2.8] text-right font-arabic text-slate-800"
          style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
          dir="rtl"
        >
          {arabicText}
        </p>
      </div>

      {/* Translation */}
      <div className="bg-slate-50 p-6 md:p-8">
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">
          {translation}
        </p>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-center gap-4 p-4 bg-white border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="text-slate-500 hover:text-violet-600"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-violet-600"
        >
          <Bookmark className="w-4 h-4 mr-2" />
          Bookmark
        </Button>
      </div>
    </motion.div>
  );
}