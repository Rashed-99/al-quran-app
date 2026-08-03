import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as favoritesApi from '@/api/favorites';
import { Heart, Trash2, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favList = await favoritesApi.listFavorites();
      setFavorites(favList);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await favoritesApi.removeFavorite(id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const handleShare = (verse) => {
    const text = `${verse.arabic_text}\n\n"${verse.translation}"\n\n— ${verse.surah_name} : ${verse.verse_number}`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-200 dark:bg-rose-800" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center select-none">
            <Heart className="w-5 h-5 text-white select-none" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white select-none">Favorites</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 select-none">{favorites.length} saved verses</p>
      </motion.div>

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 select-none">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 select-none" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2 select-none">No favorites yet</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs select-none">
            Tap the heart icon while reading to save your favorite verses
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {favorites.map((verse, index) => (
              <motion.div
                key={verse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 select-none">
                  <span className="text-sm font-medium text-violet-600 dark:text-violet-400 select-none">
                    {verse.surah_name} : {verse.verse_number}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShare(verse)}
                      className="w-8 h-8 rounded-full text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 select-none touch-manipulation"
                    >
                      <Share2 className="w-4 h-4 select-none" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full text-slate-400 hover:text-rose-600 select-none touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4 select-none" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="dark:text-white">Remove from favorites?</AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-slate-400">
                            This verse will be removed from your favorites list.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="dark:bg-slate-700 dark:text-white dark:border-slate-600 select-none touch-manipulation">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(verse.id)}
                            className="bg-rose-600 hover:bg-rose-700 select-none touch-manipulation"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Arabic Text - Selectable */}
                <div className="p-6">
                  <p 
                    className="text-2xl md:text-3xl leading-[2.2] text-right text-slate-800 dark:text-slate-100"
                    style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
                    dir="rtl"
                  >
                    {verse.arabic_text}
                  </p>
                </div>

                {/* Translation - Selectable */}
                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {verse.translation}
                  </p>
                </div>

                {/* Notes */}
                {verse.notes && (
                  <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-medium">Note:</span> {verse.notes}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}