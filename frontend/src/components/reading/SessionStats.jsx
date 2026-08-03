import React from 'react';
import { Sparkles, BookOpen, Clock } from 'lucide-react';

export default function SessionStats({ hasanat, verses, timeMinutes }) {
  const stats = [
    { icon: Sparkles, value: hasanat.toLocaleString() },
    { icon: BookOpen, value: verses },
    { icon: Clock, value: `${timeMinutes}m` },
  ];

  return (
    <div className="flex items-center gap-2.5 select-none">
      {stats.map((stat, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-white/15 select-none">|</span>}
          <div className="flex items-center gap-1.5">
            <stat.icon className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white text-sm font-medium select-none">{stat.value}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}