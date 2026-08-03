import React, { useState, useRef, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef(null);
  const controls = useAnimation();
  
  const THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);
      
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setIsPulling(false);
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto overscroll-y-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-x pan-y' }}
    >
      {/* Pull indicator */}
      <motion.div
        className="flex items-center justify-center overflow-hidden"
        animate={{ height: pullDistance }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <motion.div
          animate={{ 
            rotate: isRefreshing ? 360 : progress * 180,
            scale: isRefreshing ? 1 : progress 
          }}
          transition={{ 
            rotate: isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0.1 },
            scale: { duration: 0.1 }
          }}
          className="text-violet-500 dark:text-violet-400"
        >
          <Loader2 className="w-6 h-6" />
        </motion.div>
      </motion.div>
      
      {children}
    </div>
  );
}