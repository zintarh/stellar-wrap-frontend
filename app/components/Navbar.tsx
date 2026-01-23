"use client"

import Link from "next/link"
import { ColorToggle } from "./ColorToggle"
import { motion } from "framer-motion"

export function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/20 border-b border-white/5"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-theme-primary)] flex items-center justify-center font-bold text-black shadow-[0_0_10px_rgba(var(--color-theme-primary-rgb),0.5)]">
          Z
        </div>
        <span className="font-bold text-lg tracking-tight">Zimma</span>
      </div>

      <div className="flex items-center gap-6">
        <Link href="/features" className="text-sm text-neutral-400 hover:text-white transition-colors hidden sm:block">Features</Link>
        <Link href="/about" className="text-sm text-neutral-400 hover:text-white transition-colors hidden sm:block">About</Link>
        <ColorToggle />
      </div>
    </motion.nav>
  )
}
