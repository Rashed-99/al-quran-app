import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, 80], [0, 1]);
  const opacity = useTransform(y, [0, 40, 80], [0, 0.5, 1]);
  const scale = useTransform(y, [0, 80], [0.5, 1]);
  const rotation = useTransform(y, [0, 80], [0, 180]);

  const handleTouchStart = useRef({ y: 0, scrollTop: 0 });

  const handleTouchStartEvent = (e) => {
    if (containerRef.current) {
      handleTouchStart.current = {
        y: e.touches[0].clientY,
        scrollTop: containerRef.current.scrollTop || window.scrollY
      };
    }
  };

  const handleTouchMove = (e) => {
    if (refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - handleTouchStart.current.y;
    const scrollTop = containerRef.current?.scrollTop || window.scrollY;

    // Only pull if at top of scroll
    if (scrollTop <= 0 && deltaY > 0) {
      const resistance = 0.4;
      const newY = Math.min(deltaY * resistance, 100);
      y.set(newY);
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    
    const currentY = y.get();
    
    if (currentY >= 60) {
      setRefreshing(true);
      animate(y, 60, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        animate(y, 0, { duration: 0.3 });
      }
    } else {
      animate(y, 0, { duration: 0.3 });
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStartEvent}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen"
    >
      {/* Pull indicator */}
      <motion.div
        style={{ opacity, y: useTransform(y, [0, 80], [-40, 20]) }}
        className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
      >
        <motion.div
          style={{ scale, rotate: refreshing ? undefined : rotation }}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center"
        >
          <Loader2 
            className={`w-5 h-5 text-violet-600 dark:text-violet-400 ${refreshing ? 'animate-spin' : ''}`} 
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}