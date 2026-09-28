"use client";

import { motion } from "framer-motion";
import { Palette } from "lucide-react";
import type { NftActivitySummary } from "@/app/utils/indexer";

interface NftActivityCardProps {
  summary?: NftActivitySummary;
}

export function NftActivityCard({ summary }: NftActivityCardProps) {
  if (!summary || summary.mintCount === 0) return null;

  const creator = summary.topCreatorAddress;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.0, type: "spring", stiffness: 100 }}
      className="mt-8 sm:mt-10 md:mt-12"
    >
      <h3 className="mb-3 text-xs font-black tracking-[0.25em] text-white/50 sm:mb-4 sm:text-sm">
        YOUR NFT ACTIVITY
      </h3>
      <div
        className="rounded-2xl border border-white/10 p-5 backdrop-blur-md sm:rounded-3xl sm:p-6 md:p-8"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
      >
        <div className="mb-4 flex items-end gap-3">
          <Palette
            className="h-8 w-8 shrink-0"
            style={{ color: "var(--color-theme-primary)" }}
            aria-hidden="true"
          />
          <span className="text-4xl leading-none font-black text-white sm:text-5xl">
            {summary.mintCount.toLocaleString()}
          </span>
          <span className="mb-1 font-medium text-white/50">
            {summary.mintCount === 1 ? "NFT minted" : "NFTs minted"}
          </span>
        </div>

        {creator && (
          <p className="text-sm text-white/70 sm:text-base">
            Top creator{" "}
            <span className="font-mono text-white" title={creator}>
              {creator.slice(0, 4)}…{creator.slice(-4)}
            </span>{" "}
            ({summary.topCreatorMintCount.toLocaleString()})
          </p>
        )}
      </div>
    </motion.div>
  );
}
