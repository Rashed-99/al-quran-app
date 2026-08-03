import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Clock } from 'lucide-react';

export default function ReadingProgress({ hasanat = 0, verses = 0, timeMinutes = 0 }) {
  const stats = [
    { 
      icon: Sparkles, 
      value: hasanat.toLocaleString(), 
      label: 'Hasanat',
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    },
    { 
      icon: BookOpen, 
      value: verses, 
      label: 'Verses',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    { 
      icon: Clock, 
      value: `${timeMinutes}m`, 
      label: 'Time',
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
  ];

  return (
    <div className="flex items-center justify-around py-4 px-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center"
        >
          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-2`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <span className="text-lg font-bold text-slate-800">{stat.value}</span>
          <span className="text-xs text-slate-500">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
}