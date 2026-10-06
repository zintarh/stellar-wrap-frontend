"use client";

import { motion } from "framer-motion";
import type { KeyboardEvent } from "react";
import { formatDappDisplayName } from "@/app/utils/formatDappLabel";
import { DappIcon } from "@/app/components/DappIcon";

interface DappCardProps {
  rank: number;
  name: string;
  interactions: number;
  icon?: string;
  logo?: string;
  delay?: number;
}

export function DappCard({
  rank,
  name,
  interactions,
  icon,
  logo,
  delay = 0,
}: DappCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();

    const cards = Array.from<HTMLElement>(
      document.querySelectorAll('[data-dapp-card="true"]'),
    );
    const currentIndex = cards.indexOf(event.currentTarget);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex =
      event.key === "ArrowRight"
        ? Math.min(currentIndex + 1, cards.length - 1)
        : Math.max(currentIndex - 1, 0);

    cards[nextIndex]?.focus();
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.23, 1, 0.32, 1],
      }}
      role="button"
      tabIndex={0}
      aria-label={`${formatDappDisplayName(name)}. ${interactions} transactions.`}
      data-dapp-card="true"
      onKeyDown={handleKeyDown}
      className="group relative w-full rounded-[20px] sm:rounded-[24px] overflow-hidden flex flex-col justify-end cursor-pointer border border-[#1DB954]/20 hover:border-[#1DB954]/50 transition-all duration-300 hover:shadow-[0_0_50px_rgba(29,185,84,0.25)] will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      style={{
        aspectRatio: "1 / 1",
        background:
          "linear-gradient(145deg, rgba(29,185,84,0.08) 0%, rgba(10,20,10,0.95) 100%)",
        transform: "translateZ(0)",
      }}
    >
      {/* Hover scale overlay */}
      <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02] origin-center pointer-events-none" />

      {/* Hover background fill */}
      <div className="absolute inset-0 bg-[#1DB954] opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      {/* Diagonal stripe texture */}
      <div
        className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.12] transition-opacity duration-500"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #1DB954 10px, #1DB954 11px)`,
        }}
        aria-hidden="true"
      />

      {/* Inner glow */}
      <div
        className="absolute inset-0 rounded-[20px] sm:rounded-[24px] shadow-[inset_0_0_60px_rgba(29,185,84,0.05)] group-hover:shadow-[inset_0_0_40px_rgba(255,255,255,0.05)] transition-all duration-500"
        aria-hidden="true"
      />

      {/* Padded content wrapper — scales with card size on all breakpoints */}
      <div className="absolute inset-0 p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-between">
        {/* Top row: rank badge + dapp icon */}
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-black/80 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-lg shrink-0">
            <span className="text-sm xs:text-base sm:text-lg font-black text-white leading-none">
              {rank}
            </span>
          </div>

          <DappIcon name={name} icon={icon} logo={logo} size="sm" />
        </div>

        {/* Bottom: dapp name + interaction count */}
        <div className="space-y-0.5 sm:space-y-1 min-w-0">
          <h3
            className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-[28px] font-black tracking-tight leading-none text-white drop-shadow-lg group-hover:drop-shadow-xl transition-all truncate"
            title={formatDappDisplayName(name)}
          >
            {formatDappDisplayName(name)}
          </h3>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm xs:text-base sm:text-lg md:text-xl font-black text-[#1DB954] group-hover:text-white transition-colors duration-300 tabular-nums shrink-0">
              {interactions.toLocaleString()}
            </span>
            <span className="text-[10px] xs:text-xs sm:text-sm font-semibold text-white/40 group-hover:text-white/60 transition-colors duration-300 truncate">
              transactions
            </span>
          </div>
        </div>
      </div>

      {/* Bottom glow */}
      <div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-[#1DB954]/20 blur-[40px] rounded-full pointer-events-none opacity-60 group-hover:opacity-0 transition-opacity duration-500"
        aria-hidden="true"
      />
    </motion.div>
  );
}
