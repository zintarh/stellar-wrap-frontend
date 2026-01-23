"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-theme-primary)] rounded-full blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-theme-primary)] rounded-full blur-[150px] opacity-10" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/50 border border-neutral-800 backdrop-blur-sm text-sm text-neutral-400 mb-4"
        >
          <Sparkles className="w-4 h-4 text-[var(--color-theme-primary)]" />
          <span>Your 2026 Year in Review is here</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter"
        >
          STELLAR
          <br />
          <span 
            className="bg-clip-text text-transparent bg-gradient-to-b from-white to-[var(--color-theme-primary)]"
            style={{ 
              textShadow: '0 0 40px rgba(var(--color-theme-primary-rgb), 0.2)'
            }}
          >
            WRAPPED
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-neutral-400 max-w-2xl mx-auto"
        >
          Disconnect from the noise. Reconnect with your journey. 
          Discover your top moments, favorite dApps, and network impact in a beautifully crafted experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <Link
            href="/wrapped"
            className="group relative px-8 py-4 bg-[var(--color-theme-primary)] text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(var(--color-theme-primary-rgb),0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Your Wrapped
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          
          <button className="px-8 py-4 rounded-full border border-neutral-800 hover:bg-neutral-900 transition-colors text-white font-medium">
            View Leaderboard
          </button>
        </motion.div>
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
    </section>
  )
}
