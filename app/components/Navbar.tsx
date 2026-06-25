"use client";

import { useRouter } from "next/navigation";
import { ColorToggle } from "./ColorToggle";
import { motion } from "framer-motion";
import { useWrapStore } from "@/app/store/wrapStore";
import { LogOut } from "lucide-react";

function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function Navbar() {
  const router = useRouter();
  const { address, reset } = useWrapStore();

  const handleDisconnect = () => {
    reset();
    router.push("/");
  };

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

      <div className="flex items-center gap-3">
        <ColorToggle />

        {address && (
          <>
            <span className="text-xs font-mono text-neutral-300 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              {truncate(address)}
            </span>
            <button
              onClick={handleDisconnect}
              aria-label="Disconnect wallet"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white border border-white/10 rounded-full px-3 py-1 hover:bg-white/5 transition-colors"
            >
              <LogOut size={12} />
              Disconnect
            </button>
          </>
        )}
      </div>
    </motion.nav>
  );
}
