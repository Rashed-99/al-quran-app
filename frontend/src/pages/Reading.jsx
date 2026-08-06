import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as progressApi from '@/api/progress';
import * as favoritesApi from '@/api/favorites';
import * as groupsApi from '@/api/groups';
import { haptics } from '@/lib/haptics';
import { createPageUrl } from '@/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart,
  Volume2,
  Pause,
  List,
  Loader2,
  Save,
  Check,
  Share2,
  BookOpen,
  Pencil,
  Type,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import VerseEndMarker from '@/components/reading/VerseEndMarker';
import TafsirPopup from '@/components/reading/TafsirPopup';
import SessionStats from '@/components/reading/SessionStats';
import ReadingLevel from '@/components/reading/ReadingLevel';
import QuranAPI from '@/components/reading/QuranAPI';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import FontPicker, { getFontStyle } from '@/components/reading/FontPicker';

// Four-step size scales for each independently-controllable text type.
// Arabic font-size is layered on top of getFontStyle()'s fontFamily/lineHeight
// (which stays font-specific, e.g. IndoPak needs taller line-height) rather
// than replacing it.
const ARABIC_SIZES = [
  { id: 'sm', label: 'Small', fontSize: '1.75rem' },
  { id: 'md', label: 'Medium', fontSize: '2.25rem' },
  { id: 'lg', label: 'Large', fontSize: '2.75rem' },
  { id: 'xl', label: 'X-Large', fontSize: '3.25rem' },
];
const TRANSLITERATION_SIZES = [
  { id: 'sm', label: 'Small', fontSize: '0.9375rem' },
  { id: 'md', label: 'Medium', fontSize: '1.0625rem' },
  { id: 'lg', label: 'Large', fontSize: '1.1875rem' },
  { id: 'xl', label: 'X-Large', fontSize: '1.3125rem' },
];
const TRANSLATION_SIZES = [
  { id: 'sm', label: 'Small', fontSize: '0.9375rem' },
  { id: 'md', label: 'Medium', fontSize: '1.0625rem' },
  { id: 'lg', label: 'Large', fontSize: '1.1875rem' },
  { id: 'xl', label: 'X-Large', fontSize: '1.3125rem' },
];

export default function Reading() {
  const navigate = useNavigate();
  const [showTafsir, setShowTafsir] = useState(false);
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoadError, setProgressLoadError] = useState(false);
  const [progress, setProgress] = useState(null);
  const [sessionHasanat, setSessionHasanat] = useState(0);
  const [sessionVerses, setSessionVerses] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [surahList, setSurahList] = useState([]);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const audioRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const progressRef = useRef(null); // Track latest progress for auto-save
  const myGroupIdsRef = useRef([]); // all groups this user belongs to, for session logging
  // Tracks what's already been persisted to the backend this session, so
  // we only ever send *deltas* to logReadingSession (which increments
  // server-side totals) instead of re-sending absolute counts.
  const persistedVersesRef = useRef(0);
  const persistedTimeRef = useRef(0);
  // Mirror the latest state into refs so the stable (mount-once) autosave
  // interval and page-unload listeners always read CURRENT values instead
  // of a frozen closure from whenever they were set up. This is the fix
  // for the real bug: previously these were plain state closures, and the
  // autosave interval's useEffect had [sessionVerses, sessionTime,
  // currentSurah, currentVerse] as deps - meaning it was torn down and
  // recreated on every single verse turn, so the 30s timer almost never
  // actually reached 30 seconds during active reading.
  const currentSurahRef = useRef(1);
  const currentVerseRef = useRef(1);
  const sessionVersesRef = useRef(0);
  const sessionTimeRef = useRef(0);
  const sessionHasanatRef = useRef(0);
  useEffect(() => { currentSurahRef.current = currentSurah; }, [currentSurah]);
  useEffect(() => { currentVerseRef.current = currentVerse; }, [currentVerse]);
  useEffect(() => { sessionVersesRef.current = sessionVerses; }, [sessionVerses]);
  useEffect(() => { sessionTimeRef.current = sessionTime; }, [sessionTime]);
  useEffect(() => { sessionHasanatRef.current = sessionHasanat; }, [sessionHasanat]);
  const [selectedFont, setSelectedFont] = useState(() => localStorage.getItem('quranFont') || 'kitab');
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showTextSizePicker, setShowTextSizePicker] = useState(false);
  // Independent size index (0-3) for each text type - previously
  // transliteration/translation were hardcoded at a single small size with
  // no user control at all. Defaults: arabic 'md' matches the previous
  // fixed size; transliteration defaults one step up from the old
  // hardcoded text-sm since that was reported as too small; translation
  // stays close to its previous size as the default.
  const [arabicSizeIndex, setArabicSizeIndex] = useState(() => {
    const saved = localStorage.getItem('arabicSizeIndex');
    return saved !== null ? Number(saved) : 1;
  });
  const [transliterationSizeIndex, setTransliterationSizeIndex] = useState(() => {
    const saved = localStorage.getItem('transliterationSizeIndex');
    return saved !== null ? Number(saved) : 1;
  });
  const [translationSizeIndex, setTranslationSizeIndex] = useState(() => {
    const saved = localStorage.getItem('translationSizeIndex');
    return saved !== null ? Number(saved) : 1;
  });

  useEffect(() => { localStorage.setItem('arabicSizeIndex', String(arabicSizeIndex)); }, [arabicSizeIndex]);
  useEffect(() => { localStorage.setItem('transliterationSizeIndex', String(transliterationSizeIndex)); }, [transliterationSizeIndex]);
  useEffect(() => { localStorage.setItem('translationSizeIndex', String(translationSizeIndex)); }, [translationSizeIndex]);

  // Get URL params for surah/verse navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surah = parseInt(params.get('surah')) || null;
    const verse = parseInt(params.get('verse')) || 1;
    if (surah) {
      setCurrentSurah(surah);
      setCurrentVerse(verse);
    }
  }, []);

  useEffect(() => {
    loadProgress();
    loadFavorites();
    loadSurahList();
    loadMyGroupIds();

    // Timer for session time (updates every second for smooth display)
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
      setSessionTime(Math.floor((Date.now() - startTime) / 60000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const loadSurahList = async () => {
    try {
      const list = await QuranAPI.getSurahList();
      setSurahList(list);
    } catch (error) {
      console.error('Error loading surah list:', error);
    }
  };

  const loadMyGroupIds = async () => {
    try {
      const groups = await groupsApi.listGroups();
      myGroupIdsRef.current = groups.map(g => g.id);
    } catch (error) {
      console.error('Error loading groups:', error);
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

  const shareVerse = async () => {
    if (!verse || !surahData) return;
    
    const shareText = `${verse.arabic}\n\n"${verse.translation}"\n\n- Surah ${surahData.englishName}, Verse ${currentVerse}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Surah ${surahData.englishName}:${currentVerse}`,
          text: shareText
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Verse copied to clipboard!');
    }
  };

  // Fetch surah data when surah changes
  useEffect(() => {
    fetchSurahData(currentSurah);
  }, [currentSurah]);

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

  const loadProgress = async () => {
    try {
      // Daily/weekly reset now happens server-side (see backend
      // getOrCreateProgress) - this is just a fetch of current state.
      // httpClient automatically retries transient failures (~45s window,
      // covers a full Render cold-start cycle) before this even sees an error.
      const p = await progressApi.getProgress();
      setProgress(p);
      progressRef.current = p;
      setProgressLoadError(false);

      const params = new URLSearchParams(window.location.search);
      if (!params.get('surah')) {
        setCurrentSurah(p.current_surah || 1);
        setCurrentVerse(p.current_verse || 1);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      // Genuine failure after retries are exhausted - previously this fell
      // through silently, leaving currentSurah/currentVerse at their
      // hardcoded default (1, 1) with zero indication to the user that
      // their real progress wasn't actually loaded. Surfacing this clearly
      // instead, so a load failure never masquerades as "my progress reset."
      setProgressLoadError(true);
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

  const calculateHasanat = (arabicText) => {
    // Each Arabic letter = 10 hasanat
    const arabicLetters = arabicText.replace(/[\s\u0640\u064B-\u0652]/g, '').length;
    return arabicLetters * 10;
  };

  const verse = surahData?.verses?.[currentVerse - 1];

  const isFavorite = favorites.some(
    f => f.surah_number === currentSurah && f.verse_number === currentVerse
  );

  // Auto-save progress every 30 seconds. Set up ONCE (empty deps) so it's
  // never torn down/recreated by verse navigation - reads current values
  // via refs (see above) rather than closing over state directly, which is
  // what makes a mount-once interval safe from stale data.
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (progressRef.current) {
        flushProgress();
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Save position (bookmark only, no totals change) immediately on verse
  // change - no debounce. Position saves are a single cheap PATCH with two
  // integers; the previous debounce-with-cleanup approach meant navigating
  // away within 2 seconds of the last verse change (a completely normal
  // "read last verse, tap back" flow) silently cancelled the save before
  // it ever fired.
  useEffect(() => {
    if (progressRef.current && currentSurah && currentVerse) {
      saveCurrentPosition();
    }
  }, [currentSurah, currentVerse]);

  // Save on page unload/visibility change/backgrounding. 'pagehide' is
  // included alongside 'beforeunload' because beforeunload is unreliable
  // on mobile browsers and Capacitor WebViews (the exact environment this
  // app runs in as an iOS app) - pagehide fires much more consistently
  // when an app is backgrounded or a tab is closed on mobile.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && progressRef.current) {
        flushProgress();
      }
    };

    const handleUnload = () => {
      if (progressRef.current) {
        flushProgress();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  const saveCurrentPosition = async () => {
    if (!progressRef.current) return;
    try {
      const updated = await progressApi.savePosition({
        current_surah: currentSurahRef.current,
        current_verse: currentVerseRef.current,
      });
      progressRef.current = updated;
    } catch (error) {
      console.error('Error saving position:', error);
    }
  };

  /**
   * Persists whatever verses/time have accrued since the last save as a
   * delta via logReadingSession - which atomically bumps ReadingProgress
   * totals + streak, today's DailyLog, and GroupProgress for every group
   * this user belongs to, all server-side in one transaction.
   *
   * Reads from refs (not state directly) so it's safe to call from the
   * mount-once autosave interval and page-unload listeners without a
   * stale-closure risk.
   */
  const persistSessionDelta = async () => {
    const deltaVerses = sessionVersesRef.current - persistedVersesRef.current;
    const deltaTime = sessionTimeRef.current - persistedTimeRef.current;

    if (deltaVerses <= 0 && deltaTime <= 0) return null;

    const updated = await progressApi.logReadingSession({
      verses_read: Math.max(deltaVerses, 0),
      time_minutes: Math.max(deltaTime, 0),
      hasanat_earned: deltaVerses > 0 ? sessionHasanatRef.current : undefined,
      current_surah: currentSurahRef.current,
      current_verse: currentVerseRef.current,
      group_ids: myGroupIdsRef.current,
    });

    persistedVersesRef.current = sessionVersesRef.current;
    persistedTimeRef.current = sessionTimeRef.current;

    setProgress(updated);
    progressRef.current = updated;
    return updated;
  };

  /**
   * The single entrypoint used by the autosave timer, visibility/unload
   * listeners, and the close button: persist a verses/time delta if there
   * is one, and if there isn't (e.g. the user only browsed backward to
   * review verses without reading forward), still bookmark the current
   * position so re-opening the app resumes in the right place. Previously
   * handleClose only called persistSessionDelta and only when
   * sessionVerses > 0, which meant browsing backward then closing saved
   * nothing at all - not even the position.
   */
  const flushProgress = async () => {
    if (!progressRef.current) return;
    try {
      const result = await persistSessionDelta();
      if (!result) {
        await saveCurrentPosition();
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error flushing progress:', error);
    }
  };

  const handleManualSave = async () => {
    if (!progressRef.current) return;

    setIsSaving(true);
    try {
      await persistSessionDelta();

      // Reset session counters after saving (matches old behavior - the
      // "session" stats shown in the header restart after a save).
      setSessionHasanat(0);
      setSessionVerses(0);
      persistedVersesRef.current = 0;
      persistedTimeRef.current = sessionTime;
      setLastSaved(new Date());

      toast.success('Progress saved successfully!');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = async () => {
    await handleManualSave();
    navigate(createPageUrl('Home'));
  };

  const handleNextVerse = async () => {
    if (!surahData) return;
    haptics.light();

    const newHasanat = calculateHasanat(verse?.arabic || '');
    setSessionHasanat(prev => prev + newHasanat);
    setSessionVerses(prev => prev + 1);

    let nextSurah = currentSurah;
    let nextVerse = currentVerse;

    if (currentVerse < surahData.numberOfAyahs) {
      nextVerse = currentVerse + 1;
      setCurrentVerse(nextVerse);
    } else if (currentSurah < 114) {
      // Move to next surah
      nextSurah = currentSurah + 1;
      nextVerse = 1;
      setCurrentSurah(nextSurah);
      setCurrentVerse(nextVerse);
    }

    // Direct, explicit-value position save - belt-and-suspenders alongside
    // the effect-based save above. Doesn't wait on React's render/effect
    // cycle at all, so there's no dependency-timing path where this can
    // get skipped or delayed.
    if (progressRef.current) {
      progressApi.savePosition({ current_surah: nextSurah, current_verse: nextVerse }).catch((err) =>
        console.error('Error saving position on next:', err)
      );
    }
  };

  const handlePrevVerse = async () => {
    let prevSurahTarget = currentSurah;
    let prevVerseTarget = currentVerse;

    if (currentVerse > 1) {
      prevVerseTarget = currentVerse - 1;
      setCurrentVerse(prevVerseTarget);
    } else if (currentSurah > 1) {
      // Go to previous surah's last verse
      const prevSurahNum = currentSurah - 1;
      prevSurahTarget = prevSurahNum;
      setCurrentSurah(prevSurahNum);
      // Fetch previous surah to get verse count
      try {
        const prevSurah = await QuranAPI.getSurah(prevSurahNum);
        prevVerseTarget = prevSurah.numberOfAyahs;
        setCurrentVerse(prevVerseTarget);
      } catch (error) {
        prevVerseTarget = 1;
        setCurrentVerse(1);
      }
    }

    if (progressRef.current) {
      progressApi.savePosition({ current_surah: prevSurahTarget, current_verse: prevVerseTarget }).catch((err) =>
        console.error('Error saving position on prev:', err)
      );
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
    haptics.medium();

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

  const handleClose = async () => {
    // Always flush - previously this only ran when sessionVerses > 0,
    // which meant browsing backward through verses to review them (which
    // doesn't increment sessionVerses) then closing saved nothing at all,
    // not even the current position.
    await flushProgress();
    navigate(createPageUrl('Home'));
  };

  if (loading || !surahData || !verse) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg-gradient)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
          <p className="select-none" style={{ color: 'var(--app-text-secondary)' }}>Loading Quran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--app-bg-gradient)', overscrollBehaviorY: 'none' }}>
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onError={() => setIsPlaying(false)} />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)', background: 'var(--app-bar-bg)', borderBottom: '1px solid var(--app-divider)' }}>
        <div className="flex items-center justify-between px-4 py-3 select-none">
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 select-none touch-manipulation">
            <ChevronLeft className="w-6 h-6 select-none" style={{ color: 'var(--app-text-primary)' }} />
          </Button>

          {/* Pill stats container */}
          <div className="flex items-center rounded-full px-4 py-1.5" style={{ background: 'var(--app-pill-bg)' }}>
            <SessionStats hasanat={sessionHasanat} verses={sessionVerses} timeMinutes={sessionTime} />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTextSizePicker(true)}
              className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center touch-manipulation select-none"
              aria-label="Text size"
            >
              <Type className="w-4.5 h-4.5" style={{ color: 'var(--app-text-primary)' }} />
            </button>
            <button onClick={() => setShowFontPicker(true)} className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-sm font-bold touch-manipulation select-none" style={{ color: 'var(--app-text-primary)' }}>Aa</button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 dark:hover:bg-white/10 select-none touch-manipulation">
                  <List className="w-5 h-5 select-none" style={{ color: 'var(--app-text-primary)' }} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" style={{ background: 'var(--app-card-bg)', borderLeft: '1px solid var(--app-card-border)' }}>
                <SheetHeader><SheetTitle style={{ color: 'var(--app-text-primary)' }}>Surahs</SheetTitle></SheetHeader>
                <div className="mt-4 max-h-[80vh] overflow-y-auto">
                  {surahList.map((s) => (
                    <button key={s.number} onClick={() => goToSurah(s.number)} className={`w-full text-left px-4 py-3 rounded-xl mb-1 transition-colors ${s.number === currentSurah ? 'bg-violet-600/20 text-violet-500 dark:text-violet-300' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={s.number !== currentSurah ? { color: 'var(--app-text-secondary)' } : undefined}>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium" style={{ background: 'var(--app-pill-bg)', color: 'var(--app-text-primary)' }}>{s.number}</span>
                        <div><p className="font-medium" style={{ color: 'var(--app-text-primary)' }}>{s.englishName}</p><p className="text-xs" style={{ color: 'var(--app-text-tertiary)' }}>{s.numberOfAyahs} verses</p></div>
                      </div>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {progressLoadError && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-2xl flex items-center justify-between gap-3" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-sm text-rose-200">
            Couldn't load your saved progress - reading still works, but your position/streak won't save until this reconnects.
          </p>
          <button
            onClick={loadProgress}
            className="shrink-0 text-sm font-semibold text-white bg-rose-500/80 hover:bg-rose-500 rounded-full px-3 py-1.5 touch-manipulation"
          >
            Retry
          </button>
        </div>
      )}

      {/* Verse Content */}
      <main className="flex-1 px-4 py-5 flex flex-col items-center justify-center">
        {/* Reading Level */}
        <div className="w-full max-w-2xl mb-5">
          <ReadingLevel timeMinutes={sessionTime} secondsElapsed={secondsElapsed} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${currentSurah}-${currentVerse}`} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-2xl">
            {/* White verse card - stays white in both themes by design (a
                "paper page" look reads correctly on either a dark or light
                page background), only the surrounding page/buttons change. */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-5">
              {/* Top row: audio (left), surah name (center), favorite (right) */}
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <button onClick={toggleAudio} className="w-10 h-10 rounded-full flex items-center justify-center touch-manipulation" style={{ background: '#E6E0F8' }}>
                  {isPlaying ? <Pause className="w-5 h-5 text-slate-800" /> : <Volume2 className="w-5 h-5 text-slate-800" />}
                </button>
                <div className="text-center">
                  <p className="font-bold text-slate-900 select-none">{currentSurah}. {surahData.englishName}</p>
                  <p className="text-sm text-slate-500 select-none">{currentVerse}/{surahData.numberOfAyahs}</p>
                </div>
                <button onClick={toggleFavorite} className="w-10 h-10 flex items-center justify-center touch-manipulation">
                  <Heart className={`w-6 h-6 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-800'}`} />
                </button>
              </div>

              {/* Arabic verse */}
              <div className="px-6 py-8">
                {currentVerse === 1 && currentSurah !== 1 && currentSurah !== 9 && (
                  <p
                    className="text-center text-slate-900 pb-6 select-none"
                    style={{ ...getFontStyle(selectedFont), fontSize: `calc(${ARABIC_SIZES[arabicSizeIndex].fontSize} * 0.72)` }}
                    dir="rtl"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </p>
                )}
                <p
                  className="text-center text-slate-900 select-none"
                  style={{ ...getFontStyle(selectedFont), fontSize: ARABIC_SIZES[arabicSizeIndex].fontSize }}
                  dir="rtl"
                >
                  {verse.arabic}
                  <VerseEndMarker verseNumber={currentVerse} />
                </p>
              </div>

              {/* Bottom row: share (left), tafsir + save (right) */}
              <div className="flex items-center justify-between px-5 pb-5 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                <button onClick={shareVerse} className="w-10 h-10 rounded-full flex items-center justify-center touch-manipulation" style={{ background: '#E6E0F8' }}>
                  <Share2 className="w-5 h-5 text-slate-800" />
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowTafsir(true)} className="w-10 h-10 rounded-full flex items-center justify-center touch-manipulation">
                    <BookOpen className="w-5 h-5 text-slate-800" />
                  </button>
                  <button onClick={handleManualSave} disabled={isSaving} className="w-10 h-10 rounded-full flex items-center justify-center touch-manipulation">
                    {isSaving ? <Loader2 className="w-5 h-5 text-slate-800 animate-spin" /> : lastSaved ? <Check className="w-5 h-5 text-emerald-600" /> : <Pencil className="w-5 h-5 text-slate-800" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Transliteration - now its own clearly-bordered card instead of
                floating text with no background, at a bigger default size
                (was a fixed, small text-sm with no size control at all). */}
            {verse.transliteration && (
              <div
                className="rounded-2xl px-5 py-4 mb-4"
                style={{ background: 'var(--app-card-bg)', border: '1px solid var(--app-card-border)' }}
              >
                <p
                  className="text-left italic select-none leading-relaxed"
                  style={{ color: 'var(--app-text-secondary)', fontSize: TRANSLITERATION_SIZES[transliterationSizeIndex].fontSize }}
                >
                  {verse.transliteration}
                </p>
              </div>
            )}

            {/* Translation - previously floating text directly on the page
                background with no card at all ("floating in mid air").
                Now styled to match the transliteration card above it, with
                a subtle accent tint to stay visually distinct as the
                "meaning" section rather than looking identical to it. */}
            <div
              className="rounded-2xl px-5 py-4 mb-4"
              style={{ background: 'var(--app-accent-soft)', border: '1px solid var(--app-card-border)' }}
            >
              <p
                className="text-center leading-relaxed select-none"
                style={{ color: 'var(--app-text-primary)', fontSize: TRANSLATION_SIZES[translationSizeIndex].fontSize }}
              >
                {verse.translation}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <footer className="sticky bottom-0 px-4 py-4 safe-area-pb" style={{ background: 'var(--app-bar-bg)', borderTop: '1px solid var(--app-divider)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3 select-none">
          <Button
            variant="outline"
            onClick={handlePrevVerse}
            disabled={currentSurah === 1 && currentVerse === 1}
            className="rounded-full py-6 px-5 bg-transparent select-none touch-manipulation"
            style={{ borderColor: 'var(--app-card-border)', color: 'var(--app-text-primary)' }}
          >
            <ChevronLeft className="w-5 h-5 select-none" />
          </Button>

          <Button
            onClick={handleDone}
            className="flex-1 rounded-full py-6 font-bold select-none touch-manipulation shadow-lg border"
            style={{ background: 'var(--app-card-bg)', color: 'var(--app-text-primary)', borderColor: 'var(--app-card-border)' }}
          >
            <span className="select-none">I'm Done</span>
          </Button>

          <div className="relative">
            <Button onClick={handleNextVerse} disabled={currentSurah === 114 && currentVerse === surahData?.numberOfAyahs} className="rounded-full py-6 px-5 bg-violet-600 hover:bg-violet-700 text-white select-none touch-manipulation shadow-lg">
              <ChevronRight className="w-5 h-5 select-none" />
            </Button>
            <span className="absolute -top-2 -right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full select-none">+550</span>
          </div>
        </div>
      </footer>

      <FontPicker open={showFontPicker} onOpenChange={setShowFontPicker} currentFont={selectedFont} onFontChange={handleFontChange} />

      <Sheet open={showTextSizePicker} onOpenChange={setShowTextSizePicker}>
        <SheetContent side="bottom" style={{ background: 'var(--app-card-bg)', borderTop: '1px solid var(--app-card-border)' }}>
          <SheetHeader>
            <SheetTitle style={{ color: 'var(--app-text-primary)' }}>Text Size</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5 pb-4">
            {[
              { label: 'Arabic Script', sizes: ARABIC_SIZES, index: arabicSizeIndex, setIndex: setArabicSizeIndex },
              { label: 'Transliteration', sizes: TRANSLITERATION_SIZES, index: transliterationSizeIndex, setIndex: setTransliterationSizeIndex },
              { label: 'Translation', sizes: TRANSLATION_SIZES, index: translationSizeIndex, setIndex: setTranslationSizeIndex },
            ].map(({ label, sizes, index, setIndex }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--app-text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--app-text-tertiary)' }}>{sizes[index].label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                    className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation disabled:opacity-30"
                    style={{ background: 'var(--app-pill-bg)' }}
                  >
                    <Minus className="w-4 h-4" style={{ color: 'var(--app-text-primary)' }} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold" style={{ color: 'var(--app-text-primary)' }}>
                    {index + 1}
                  </span>
                  <button
                    onClick={() => setIndex((i) => Math.min(sizes.length - 1, i + 1))}
                    disabled={index === sizes.length - 1}
                    className="w-9 h-9 rounded-full flex items-center justify-center touch-manipulation disabled:opacity-30"
                    style={{ background: 'var(--app-pill-bg)' }}
                  >
                    <Plus className="w-4 h-4" style={{ color: 'var(--app-text-primary)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <TafsirPopup open={showTafsir} onOpenChange={setShowTafsir} surahNumber={currentSurah} verseNumber={currentVerse} surahName={surahData?.englishName} arabicText={verse?.arabic} translation={verse?.translation} />
    </div>
  );
}
