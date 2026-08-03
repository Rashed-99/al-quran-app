import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeeklyTracker({ weeklyProgress = [] }) {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="flex items-center justify-between gap-2 select-none">
      {DAYS.map((day, index) => {
        const dayData = weeklyProgress[index];
        const isToday = index === todayIndex;
        const isCompleted = dayData?.completed;

        return (
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center gap-1.5 select-none"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all select-none"
              style={{
                background: isCompleted ? '#7B61FF' : isToday ? '#ffffff' : 'transparent',
                border: isCompleted
                  ? '2px solid #7B61FF'
                  : isToday
                  ? '2px solid #7B61FF'
                  : '2px solid #4D4D4D',
                color: isCompleted ? '#ffffff' : isToday ? '#7B61FF' : '#6B6B6B',
              }}
            >
              {isCompleted ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                  <Check className="w-4 h-4 select-none" strokeWidth={3} />
                </motion.div>
              ) : (
                <span className="text-sm font-medium select-none">{day}</span>
              )}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}