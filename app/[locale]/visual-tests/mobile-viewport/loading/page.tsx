"use client";

import { Suspense } from "react";
import { ProgressIndicator } from "@/app/components/ProgressIndicator";
import { StepProgressDisplay } from "@/app/components/StepProgressDisplay";
import { CacheStatusBadge } from "@/app/components/CacheStatusBadge";
import { MuteToggle } from "@/app/components/MuteToggle";
import { ProgressRecoveryBanner } from "@/app/components/ProgressRecoveryBanner";

function LoadingVisualFixture() {
  return (
    <div
      className="relative w-full min-h-screen h-screen overflow-hidden flex items-center justify-center bg-theme-background"
      style={{ width: "390px", minHeight: "844px", margin: 0, overflow: "hidden", backgroundColor: "#020202" }}
    >
      <ProgressRecoveryBanner />
      <ProgressIndicator currentStep={3} totalSteps={6} showNext={false} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-6xl px-4 pointer-events-auto" style={{ width: "390px" }}>
        <div className="flex items-center justify-between gap-8">
          <div className="w-full md:w-full lg:max-w-3xl pointer-events-auto space-y-4">
            <StepProgressDisplay onCancel={() => {}} onRetry={() => {}} />
            <CacheStatusBadge />
          </div>
        </div>
      </div>
      <div className="absolute inset-0 from-black via-black to-black opacity-60" />
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-30">
        <MuteToggle />
      </div>
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-30">
        <button className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: "#000000", borderColor: "rgba(255, 255, 255, 0.3)" }}>
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></path></svg>
            </div>
          </div>
          <span className="text-xs font-black text-white/60">SKIP</span>
        </button>
      </div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-4 w-full max-w-6xl" style={{ width: "390px" }}>
        <div className="flex items-center justify-between gap-8">
          <div className="w-80 md:w-96" style={{ width: "120px" }} />
          <div className="flex-1">
            <div className="text-center">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4 md:mb-6 tracking-tighter leading-none">WRAPPING</h1>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white/80 mb-6 md:mb-10 tracking-tight leading-none">YOUR JOURNEY</h2>
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-lg md:blur-xl rounded-xl md:rounded-2xl" style={{ backgroundColor: "rgba(var(--color-theme-primary-rgb), 0.4)" }} />
                <div className="relative backdrop-blur-sm px-6 py-3 sm:px-8 sm:py-4 md:px-12 md:py-6 rounded-xl md:rounded-2xl" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", borderColor: "rgba(var(--color-theme-primary-rgb), 0.5)", borderWidth: "1px" }}>
                  <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black" style={{ background: "linear-gradient(to right, #ffffff, var(--color-theme-primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>STELLAR</h3>
                </div>
              </div>
            </div>
            <div className="mt-12 md:mt-16 w-48 sm:w-56 md:w-64 h-1 bg-white/10 rounded-full mx-auto overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-label="Loading progress">
              <div className="h-full" style={{ backgroundColor: "var(--color-theme-primary)", width: "60%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoadingVisualTestPage() {
  return (
    <Suspense fallback={null}>
      <LoadingVisualFixture />
    </Suspense>
  );
}