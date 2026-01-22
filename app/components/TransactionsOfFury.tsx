"use client";

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useWrapperStore } from '../store/wrapperStore';
import { StoryShell } from './StoryShell';
import { Home, Share2, ChevronRight, Palette } from 'lucide-react';

interface MonthlyStats {
  month: string;
  count: number;
}

const TransactionsOfFury: React.FC = () => {
  const { totalTransactions, percentile, monthlyStats } = useWrapperStore();
  const [isVisible, setIsVisible] = useState(false);
  const [showPercentile, setShowPercentile] = useState(false);

  // Spring-based count-up animation
  const count = useSpring(0, {
    stiffness: 50,
    damping: 30,
    mass: 1,
  });

  const displayCount = useTransform(count, (latest) => Math.floor(latest));

  useEffect(() => {
    setIsVisible(true);
    // Start count-up animation
    const timer = setTimeout(() => {
      count.set(totalTransactions || 420);
    }, 300);

    // Show percentile after count-up completes
    const percentileTimer = setTimeout(() => {
      setShowPercentile(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(percentileTimer);
    };
  }, [totalTransactions, count]);

  return (
    <StoryShell>
      <div className="relative w-full h-screen overflow-hidden bg-[#030b0a]">
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-[1px]"
              style={{
                top: `${(i * 100) / 80}%`,
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
              }}
              animate={{
                opacity: [0.2, 0.7, 0.2],
                x: [-20, 0, -20],
              }}
              transition={{
                duration: 2 + (Math.random() * 1.5),
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Additional moving speed lines for extra motion */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`speed-${i}`}
              className="absolute h-[2px]"
              style={{
                top: `${Math.random() * 100}%`,
                width: `${100 + Math.random() * 200}px`,
                backgroundColor: 'rgba(16, 185, 129, 0.3)',
                left: '-200px',
              }}
              animate={{
                x: [0, 1600],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Pulsing overlay for extra visibility */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-emerald-500/8 via-transparent to-emerald-500/8 pointer-events-none"
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Radial gradient overlay for center focus */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, rgba(3, 11, 10, 0.7) 70%)',
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 md:px-12">
          {/* Home Button */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8">
            <button className="flex items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6 sm:py-3 md:gap-4 md:px-10 md:py-5 text-sm sm:text-base md:text-lg font-bold text-white bg-white/5 border border-white/20 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm shadow-lg">
              <Home className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7" />
              <span>HOME</span>
            </button>
          </div>

          {/* Paint Brush Icon (top right) */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8">
            <button 
              className="relative p-4 sm:p-6 md:p-9 text-white bg-white/5 border-2 border-emerald-500 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm"
              style={{
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Palette className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 -mt-12 sm:-mt-16 md:-mt-20 px-4 sm:px-6">
            <motion.div
              className="relative"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: 0.1
              }}
            >
              {/* Glow effect behind number */}
              <div className="absolute inset-0 blur-[60px] sm:blur-[80px] bg-emerald-500/30 animate-pulse" />
              
              <motion.h1 className="relative text-[6rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] xl:text-[20rem] font-black tracking-tighter leading-none">
                <span 
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(to bottom, #f0fdf4 0%, #6ee7b7 50%, #10b981 100%)',
                    textShadow: '0 0 40px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <motion.span>
                    {displayCount}
                  </motion.span>
                </span>
              </motion.h1>
            </motion.div>

            {/* Title */}
            <motion.div
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-[0.15em] sm:tracking-[0.2em] text-white uppercase px-4">
                Transactions of Fury
              </h2>
            </motion.div>

            {/* Speed Stat Card */}
            <AnimatePresence>
              {showPercentile && (
                <motion.div
                  className="relative mt-4 sm:mt-6 md:mt-8 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl px-4"
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 20
                  }}
                >
                  <div className="relative px-8 py-6 sm:px-12 sm:py-8 md:px-16 md:py-10 bg-gradient-to-br from-[#030b0a]/90 via-[#041411]/90 to-[#030b0a]/90 border border-emerald-500/30 rounded-3xl md:rounded-[2rem] backdrop-blur-xl shadow-2xl">
                    {/* Left accent line */}
                    
                    <div className="text-center space-y-1 sm:space-y-2">
                      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-medium">
                        Speed faster than
                      </p>
                      {/* Percentile number with alternating colors */}
                      <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black flex items-center justify-center">
                        {String(percentile || 80).split('').map((digit, index, arr) => {
                          const isEven = index % 2 === 0;
                          return (
                            <span 
                              key={index}
                              className={isEven ? 'text-white' : 'text-emerald-300'}
                            >
                              {digit}
                            </span>
                          );
                        })}
                        <span className="text-emerald-400">%</span>
                      </div>
                      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-medium">
                        of the network
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Share Button (bottom left) */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8">
            <button className="p-4 sm:p-5 md:p-7 text-white bg-white/5 border border-white/20 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm shadow-lg">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </button>
          </div>

          {/* Next Arrow (bottom right) */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8">
            <button className="p-4 sm:p-5 md:p-7 text-white bg-white/5 border border-white/20 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm hover:border-emerald-500/40 shadow-lg">
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </button>
          </div>
        </div>

        {/* Subtle Particle effects */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/60 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1.2, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>
    </StoryShell>
  );
};

export default TransactionsOfFury;