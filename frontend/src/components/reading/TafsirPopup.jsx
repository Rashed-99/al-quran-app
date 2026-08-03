import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as tafsirApi from '@/api/tafsir';
import QuranAPI from '@/components/reading/QuranAPI';

const SOURCES = [
  { id: 'maududi', name: 'Tafheem-ul-Quran', scholar: "Abul A'la Maududi", type: 'api' },
  { id: 'ibnkathir', name: 'Tafsir Ibn Kathir', scholar: 'Ibn Kathir', type: 'precomputed' },
  { id: 'jalalayn', name: 'Tafsir al-Jalalayn', scholar: 'Al-Mahalli & Al-Suyuti', type: 'precomputed' },
  { id: 'saadi', name: 'Taysir al-Karim', scholar: "Al-Sa'di", type: 'precomputed' },
];
// The ibnkathir/jalalayn/saadi prompts that used to run live via
// base44.integrations.Core.InvokeLLM on every open now run ONCE, in
// advance, via backend/prisma/seed/precompute-tafsir.js (same prompts,
// verbatim) - this component just reads the stored result.

export default function TafsirPopup({ open, onOpenChange, surahNumber, verseNumber, surahName, arabicText, translation }) {
  const [activeSource, setActiveSource] = useState('maududi');
  const [tafsirData, setTafsirData] = useState({});
  const [loading, setLoading] = useState({});

  // Reset when popup reopens with a new verse
  useEffect(() => {
    if (open) {
      setTafsirData({});
      setLoading({});
      setActiveSource('maududi');
    }
  }, [open, surahNumber, verseNumber]);

  // Lazy-load tafsir for active source
  useEffect(() => {
    if (open && !tafsirData[activeSource] && !loading[activeSource]) {
      loadTafsir(activeSource);
    }
  }, [open, activeSource]);

  const loadTafsir = async (sourceId) => {
    const source = SOURCES.find(s => s.id === sourceId);
    if (!source) return;

    setLoading(prev => ({ ...prev, [sourceId]: true }));

    try {
      if (source.type === 'api') {
        const data = await QuranAPI.getTafsir(surahNumber, verseNumber);
        setTafsirData(prev => ({ ...prev, [sourceId]: data.text }));
      } else {
        // One request returns all 3 precomputed sources - populate the
        // cache for all of them at once so switching tabs doesn't refetch.
        const all = await tafsirApi.getTafsir(surahNumber, verseNumber);
        setTafsirData(prev => ({
          ...prev,
          ibnkathir: all.ibnkathir || '_Not yet available for this verse._',
          jalalayn: all.jalalayn || '_Not yet available for this verse._',
          saadi: all.saadi || '_Not yet available for this verse._',
        }));
        setLoading(prev => ({ ...prev, ibnkathir: false, jalalayn: false, saadi: false }));
        return;
      }
    } catch (err) {
      setTafsirData(prev => ({ ...prev, [sourceId]: `**Error:** ${err.message || 'Could not load tafsir. Please try again.'}` }));
    } finally {
      setLoading(prev => ({ ...prev, [sourceId]: false }));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Popup */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full sm:max-w-lg max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white text-sm">Tafsir</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{surahName} : {verseNumber}</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Verse preview */}
        <div className="px-4 py-3 bg-amber-50/60 dark:bg-amber-900/10 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <p
            className="text-lg text-center text-slate-800 dark:text-slate-200 leading-loose"
            dir="rtl"
            style={{ fontFamily: "'Kitab', 'Amiri', serif", lineHeight: 2.2 }}
          >
            {arabicText}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 italic">"{translation}"</p>
        </div>

        {/* Source tabs */}
        <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-slate-100 dark:border-slate-800 shrink-0" style={{ scrollbarWidth: 'none' }}>
          {SOURCES.map(source => (
            <button
              key={source.id}
              onClick={() => setActiveSource(source.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors touch-manipulation ${
                activeSource === source.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {source.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading[activeSource] ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading {SOURCES.find(s => s.id === activeSource)?.name}…
              </p>
            </div>
          ) : tafsirData[activeSource] ? (
            <ReactMarkdown
              components={{
                h1: ({node, ...p}) => <h3 className="text-base font-bold mt-3 mb-2 text-slate-800 dark:text-white" {...p} />,
                h2: ({node, ...p}) => <h4 className="text-sm font-bold mt-3 mb-1 text-slate-800 dark:text-white" {...p} />,
                h3: ({node, ...p}) => <h4 className="text-sm font-semibold mt-2 mb-1 text-slate-800 dark:text-white" {...p} />,
                p: ({node, ...p}) => <p className="text-sm my-2 leading-relaxed text-slate-700 dark:text-slate-200" {...p} />,
                ul: ({node, ...p}) => <ul className="text-sm my-2 ml-4 list-disc space-y-1 text-slate-700 dark:text-slate-200" {...p} />,
                ol: ({node, ...p}) => <ol className="text-sm my-2 ml-4 list-decimal space-y-1 text-slate-700 dark:text-slate-200" {...p} />,
                li: ({node, ...p}) => <li className="text-sm text-slate-700 dark:text-slate-200" {...p} />,
                strong: ({node, ...p}) => <strong className="font-semibold text-slate-800 dark:text-white" {...p} />,
                blockquote: ({node, ...p}) => <blockquote className="border-l-2 border-amber-400 pl-3 my-2 italic text-slate-600 dark:text-slate-300" {...p} />,
              }}
            >
              {tafsirData[activeSource]}
            </ReactMarkdown>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-slate-400">No tafsir available.</p>
            </div>
          )}
        </div>

        {/* Scholar attribution */}
        {!loading[activeSource] && tafsirData[activeSource] && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <p className="text-xs text-slate-400 text-center">
              Source: {SOURCES.find(s => s.id === activeSource)?.scholar}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}