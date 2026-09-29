"use client";

import { Suspense } from "react";
import { ProgressIndicator } from "@/app/components/ProgressIndicator";
import { MuteToggle } from "@/app/components/MuteToggle";
import { ShareCard } from "@/app/components/ShareCard";
import { ShareImageCard } from "@/app/components/ShareImageCard";
import { GOLDEN_USER } from "@/src/data/mockData";
import { themeColors } from "@/app/context/theme-constants";

function ShareVisualFixture() {
  const mockData = {
    username: "stellar_legend",
    transactions: 100,
    persona: "The Wizard",
    topVibe: "DeFi Sorcerer",
    vibePercentage: 60,
  };

  const themeColor = themeColors.green.primary;
  const shareUrl = "https://example.com/share?test=1";

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ width: "390px", minHeight: "844px", margin: 0, overflow: "hidden" }}>
      <div ref={(el) => {}} className="absolute" style={{ left: "-9999px", top: 0 }}>
        <ShareImageCard themeColor={themeColor} archetypeImage={GOLDEN_USER.archetype.image} shareUrl={shareUrl} locale="en" labels={{
          stellarWrapped: "STELLAR WRAPPED",
          totalTransactions: "TOTAL TRANSACTIONS",
          persona: "PERSONA",
          topVibe: "TOP VIBE",
          scanToView: "SCAN TO VIEW",
          scanToViewAlt: "Scan to view on Stellar Wrap",
          noVibeData: "No vibe data",
        }} />
      </div>

      <ShareCard
        username={mockData.username}
        transactions={mockData.transactions}
        persona={mockData.persona}
        topVibe={mockData.topVibe}
        vibePercentage={mockData.vibePercentage}
        shareImageRef={null}
        themeColor={themeColor}
        cardFormat="square"
        onFormatChange={() => {}}
      />

      <ProgressIndicator currentStep={6} totalSteps={6} showNext={false} />

      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-30">
        <MuteToggle />
      </div>

      <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-30 flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-xl border border-white/10 text-white/60 hover:text-white/90 hover:border-white/30 transition-all text-xs font-medium" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        View full history on Stellar.expert
      </div>

      <div className="absolute bottom-6 left-6 z-30">
        <button className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/5">
          <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function ShareVisualTestPage() {
  return (
    <Suspense fallback={null}>
      <ShareVisualFixture />
    </Suspense>
  );
}