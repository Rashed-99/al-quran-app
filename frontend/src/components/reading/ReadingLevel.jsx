import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Egg, Zap, Crown, Rocket } from 'lucide-react';

const LEVELS = [
  { name: 'Break the Egg', minMinutes: 0, icon: Egg, color: '#f59e0b' },
  { name: 'Getting Started', minMinutes: 2, icon: Flame, color: '#f97316' },
  { name: 'Warming Up', minMinutes: 5, icon: Zap, color: '#a78bfa' },
  { name: 'On Fire', minMinutes: 10, icon: Rocket, color: '#fb7185' },
  { name: 'Beast Mode', minMinutes: 30, icon: Crown, color: '#fbbf24' },
];

export default function ReadingLevel({ timeMinutes, secondsElapsed = 0 }) {
  const currentLevel = [...LEVELS].reverse().find(l => timeMinutes >= l.minMinutes) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.minMinutes > timeMinutes);

  const progressToNext = nextLevel
    ? ((timeMinutes - currentLevel.minMinutes) / (nextLevel.minMinutes - currentLevel.minMinutes)) * 100
    : 100;

  const levelIndex = LEVELS.indexOf(currentLevel) + 1;

  // Real-time countdown using secondsElapsed
  const remainingSec = nextLevel
    ? Math.max(0, (nextLevel.minMinutes * 60) - secondsElapsed)
    : 0;
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="select-none"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm select-none" style={{ color: 'var(--app-text-primary)' }}>{currentLevel.name}</h3>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full select-none"
            style={{ background: 'rgba(123,97,255,0.2)', color: '#a78bfa' }}
          >
            Lvl {String(levelIndex).padStart(2, '0')}
          </span>
        </div>
        <p className="text-xs select-none" style={{ color: 'var(--app-text-tertiary)' }}>Total: {timeMinutes} min</p>
      </div>

      {/* Digital countdown timer */}
      {nextLevel ? (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {timeStr.split('').map((char, i) => (
            char === ':' ? (
              <span key={i} className="text-xl font-bold text-violet-400/60 select-none px-0.5">:</span>
            ) : (
              <span
                key={i}
                className="w-9 h-11 flex items-center justify-center rounded-lg text-xl font-bold font-mono select-none"
                style={{ background: 'rgba(123,97,255,0.15)', color: '#c4b5fd' }}
              >
                {char}
              </span>
            )
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Crown className="w-6 h-6 text-amber-400" />
          <span className="text-sm font-bold text-amber-400 select-none">Max level reached!</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--app-pill-bg)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progressToNext, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #7B61FF, #a78bfa)' }}
        />
      </div>

      {/* Progress labels */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs select-none" style={{ color: 'var(--app-text-tertiary)' }}>{timeMinutes}/{nextLevel?.minMinutes || timeMinutes}</span>
        <span className="text-xs select-none" style={{ color: 'var(--app-text-tertiary)' }}>{Math.round(progressToNext)}%</span>
      </div>
    </motion.div>
  );
}