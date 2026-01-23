"use client"
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X } from 'lucide-react';
import { useTheme, themeColors, type ThemeColor } from '../context/ThemeContext';

export const ColorToggle = () => {
  const { color, setColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Exclude 'white' if originally it was 'red' in the new file, but actually 'white' was in the *old* my-code. 
  // Original file had ['green', 'pink', 'yellow', 'red', 'purple'].
  const colorOptions: ThemeColor[] = ['green', 'pink', 'yellow', 'red', 'purple'];

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-black border-2 flex items-center justify-center shadow-lg"
        style={{
          borderColor: `var(--color-theme-primary)`,
          boxShadow: `0 0 20px rgba(var(--color-theme-primary-rgb), 0.4)`,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle color picker"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Palette className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Color Picker Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-0 bg-black/90 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl"
            style={{
              minWidth: '200px',
            }}
          >
            {/* Title */}
            <div className="text-white text-sm font-bold mb-3 text-center tracking-wider">
              CHOOSE YOUR VIBE
            </div>

            {/* Color Options */}
            <div className="flex flex-col gap-2">
              {colorOptions.map((colorOption) => {
                const theme = themeColors[colorOption];
                const isActive = color === colorOption;

                return (
                  <motion.button
                    key={colorOption}
                    onClick={() => {
                      setColor(colorOption);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all relative overflow-hidden"
                    style={{
                      background: isActive
                        ? `linear-gradient(90deg, ${theme.primary}20, transparent)`
                        : 'rgba(255, 255, 255, 0.05)',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: isActive ? theme.primary : 'transparent',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${theme.name} theme`}
                  >
                    {/* Color Circle */}
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      style={{
                        background: theme.gradient,
                        boxShadow: `0 0 15px ${theme.primary}60`,
                      }}
                    />

                    {/* Color Name */}
                    <div className="flex-1 text-left">
                      <div className="text-white text-sm font-bold">
                        {theme.name}
                      </div>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: theme.primary }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Hint Text */}
            <div className="text-white/40 text-xs text-center mt-3">
              Your theme persists across sessions
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
