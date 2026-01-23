import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useRouter } from "next/navigation";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  showNext?: boolean;
}

export function ProgressIndicator({ currentStep, totalSteps, onNext, showNext = false }: ProgressIndicatorProps) {
 const router = useRouter();

  return (
    <>
      {/* Home button */}
      <motion.button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-30 group"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl backdrop-blur-xl border border-white/20"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <Home className="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors" />
          <span className="text-xs md:text-sm font-black text-white/80 group-hover:text-white transition-colors hidden sm:inline">
            HOME
          </span>
        </div>
      </motion.button>

      {/* Progress dots */}
      <div className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 md:gap-3">
        {[...Array(totalSteps)].map((_, index) => (
          <motion.div
            key={index}
            className="relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Active indicator */}
            {index + 1 === currentStep ? (
              <motion.div
                className="h-1.5 md:h-2 rounded-full"
                style={{ 
                  width: window.innerWidth < 768 ? '40px' : '60px',
                  backgroundColor: 'var(--color-theme-primary)',
                  boxShadow: `0 0 20px rgba(var(--color-theme-primary-rgb), 0.6)`,
                }}
                layoutId="active-indicator"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            ) : (
              /* Inactive indicator */
              <div
                className="h-1.5 md:h-2 rounded-full"
                style={{ 
                  width: index + 1 < currentStep ? (window.innerWidth < 768 ? '30px' : '40px') : (window.innerWidth < 768 ? '20px' : '30px'),
                  backgroundColor: index + 1 < currentStep ? `rgba(var(--color-theme-primary-rgb), 0.4)` : 'rgba(255, 255, 255, 0.2)',
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Next button */}
      {showNext && onNext && (
        <motion.button
          onClick={onNext}
          className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-30 group"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-2 rounded-full blur-lg"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
              animate={{
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <div 
              className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all"
              style={{ 
                backgroundColor: '#000000',
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </motion.button>
      )}
    </>
  );
}