import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function SurahCard({ 
  number, 
  nameArabic, 
  nameEnglish, 
  nameTranslation, 
  totalVerses, 
  revelationType,
  onClick,
  delay = 0
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all flex items-center gap-4 group select-none touch-manipulation"
    >
      {/* Number badge */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 select-none">
        <span className="text-white font-bold select-none">{number}</span>
      </div>

      {/* Info */}
      <div className="flex-1 text-left select-none">
        <div className="flex items-center gap-2 select-none">
          <h3 className="font-semibold text-slate-800 dark:text-white select-none">{nameEnglish}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 select-none">
            {revelationType}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 select-none">{nameTranslation} • {totalVerses} verses</p>
      </div>

      {/* Arabic name */}
      <div className="text-right flex-shrink-0 select-none">
        <p 
          className="text-xl font-arabic text-violet-600 dark:text-violet-400 select-none"
          style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
        >
          {nameArabic}
        </p>
      </div>

      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors select-none" />
    </motion.button>
  );
}