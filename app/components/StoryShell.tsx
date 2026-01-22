import React, { useEffect, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StoryShellProps {
  children: ReactNode;
  duration?: number; 
  onComplete?: () => void;
  showProgress?: boolean;
}

export const StoryShell: React.FC<StoryShellProps> = ({ 
  children, 
  duration = 5000, 
  onComplete,
  showProgress = true 
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 16); 

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
      {children}
    </div>
  );
};