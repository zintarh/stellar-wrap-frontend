"use client"
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const DarkLightToggle = () => {
  const { mode, toggleMode } = useTheme();

  return (
    <motion.button
      onClick={toggleMode}
      className="w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors"
      style={{
        backgroundColor: mode === 'dark' ? '#000' : '#fff',
        borderColor: `var(--color-theme-primary)`,
        boxShadow: `0 0 15px rgba(var(--color-theme-primary-rgb), 0.3)`,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle dark/light mode"
    >
      {mode === 'dark' ? (
        <Sun className="w-5 h-5 text-white" />
      ) : (
        <Moon className="w-5 h-5 text-black" />
      )}
    </motion.button>
  );
};