import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700 select-none hover:shadow-xl transition-shadow"
    >
      <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center mb-3 select-none shadow-lg`}>
        <Icon className="w-6 h-6 text-white select-none" />
      </div>
      <motion.p 
        key={value}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        className="text-2xl font-bold text-slate-800 dark:text-white select-none"
      >
        {typeof value === 'number' ? value.toLocaleString() : value || 0}
      </motion.p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 select-none">{label}</p>
    </motion.div>
  );
}