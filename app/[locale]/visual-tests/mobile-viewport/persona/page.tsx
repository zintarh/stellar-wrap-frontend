"use client";

import { Suspense } from "react";
import { ProgressIndicator } from "@/app/components/ProgressIndicator";
import { MuteToggle } from "@/app/components/MuteToggle";
import { mockData } from "@/app/data/mockData";
import { archetypeImagePath } from "@/src/data/archetypeConfig";
import Image from "next/image";

function PersonaVisualFixture() {
  const archetypeKey = mockData.persona;
  const translatedArchetypeName = archetypeKey;

  return (
    <div
      className="flex w-full items-center justify-center bg-[#020202] selection:bg-[var(--selection-color)] md:min-h-screen"
      style={{ width: "390px", minHeight: "844px", margin: 0, overflow: "hidden", backgroundColor: "#020202", WebkitTapHighlightColor: "transparent", touchAction: "pan-y" }}
    >
      <ProgressIndicator currentStep={5} totalSteps={6} showNext={false} />
      <main id="main-content">
        <div className="flex min-h-screen w-96 flex-col items-center justify-center gap-4 overflow-hidden bg-[#020202] p-4 text-white sm:min-h-0 sm:gap-8 sm:p-12 md:w-full md:max-w-[1330px]" style={{ width: "390px", minHeight: "844px" }}>
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px] sm:h-[900px] sm:w-[900px]" style={{ background: "var(--accent-dark)" }} />
            <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[80px] sm:h-[500px] sm:w-[500px]" style={{ background: "var(--accent-dark)" }} />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay" />
          </div>

          <div className="absolute top-6 left-6 z-30 md:top-8 md:left-8">
            <button className="group flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 backdrop-blur-xl md:px-4 md:py-3" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
              <svg className="h-4 w-4 text-white/80 transition-colors group-hover:text-white md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              <span className="hidden text-xs font-black text-white/80 transition-colors group-hover:text-white sm:inline md:text-sm">HOME</span>
            </button>
          </div>

          <div className="absolute top-6 right-6 z-30 md:top-8 md:right-8">
            <MuteToggle />
          </div>

          <div className="absolute top-16 left-1/2 z-30 -translate-x-1/2 md:top-20">
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1.5 opacity-95 sm:gap-3">
                <div className="h-[3px] w-8 rounded-full sm:h-[4px] sm:w-14" style={{ background: "var(--color-theme-primary)", boxShadow: `0 6px 20px rgba(var(--color-theme-primary-rgb), 0.4)` }} />
                <div className="h-[3px] w-12 rounded-full sm:h-[4px] sm:w-20" style={{ background: "var(--color-theme-primary)", boxShadow: `0 6px 20px rgba(var(--color-theme-primary-rgb), 0.4)` }} />
                <div className="h-[3px] w-6 rounded-full sm:h-[4px] sm:w-10" style={{ background: "var(--color-theme-primary)", boxShadow: `0 6px 20px rgba(var(--color-theme-primary-rgb), 0.4)` }} />
              </div>
              <h3 className="relative text-xs font-bold tracking-[0.3em] whitespace-nowrap text-gray-200 uppercase mix-blend-screen sm:text-2xl sm:tracking-[0.7em]">ORACLE REVEAL</h3>
            </div>
          </div>

          <div className="relative z-10 flex w-full flex-1 items-center justify-center" style={{ perspective: "1500px" }}>
            <div className="relative h-[200px] w-full max-w-[800px] cursor-pointer sm:h-[280px]" style={{ transformStyle: "preserve-3d", transform: "rotateY(180deg)" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl border px-2 sm:rounded-[48px] sm:px-4" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(to bottom right, rgba(var(--color-theme-primary-rgb), 0.2), rgba(var(--color-theme-primary-rgb), 0.05), rgba(0,0,0,0.12))", boxShadow: "0 0 100px rgba(var(--color-theme-primary-rgb), 0.4)" }}>
                <div className="z-10 flex flex-col items-center justify-center gap-3 px-4 sm:flex-row sm:gap-6">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-sm sm:h-20 sm:w-20 md:h-24 md:w-24">
                    <Image src={archetypeImagePath(archetypeKey)} alt={`${translatedArchetypeName} persona emblem`} fill sizes="(max-width: 640px) 56px, (max-width: 768px) 80px, 96px" priority className="object-cover" />
                  </div>
                  <h1 className="bg-clip-text text-center text-4xl leading-none font-black tracking-tighter text-transparent drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] filter focus:outline-none sm:text-left sm:text-7xl md:text-8xl" style={{ backgroundImage: "linear-gradient(to bottom, #fff, var(--color-theme-primary), rgba(var(--color-theme-primary-rgb), 0.6))" }}>
                    {translatedArchetypeName}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 z-10 w-[280px] max-w-[65vw] -translate-x-1/2 translate-y-[200px] sm:w-[740px] sm:max-w-[56vw] sm:translate-y-[240px] md:translate-y-[280px]" style={{ opacity: 1, transform: "translate(-50%, calc(50% + 200px))" }}>
            <div className="relative rounded-xl border border-white/5 bg-black/40 px-6 py-4 shadow-2xl backdrop-blur-sm sm:px-8 sm:py-5 md:rounded-2xl md:px-12 md:py-6">
              <p className="px-4 text-center text-sm leading-relaxed font-semibold text-gray-100 drop-shadow-md sm:px-8 sm:text-lg md:text-xl">
                Like Gandalf in Middle-earth, you wield DeFi magic with wisdom. The blockchain bends to your will.
                <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-[var(--color-theme-primary)] align-middle sm:h-6 sm:w-1" />
              </p>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-30 md:bottom-8 md:left-8">
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/5 sm:h-16 sm:w-16">
              <svg className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.632l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>

          <div className="absolute right-6 bottom-6 z-30 md:right-8 md:bottom-8">
            <button className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md transition hover:bg-white/5 sm:h-16 sm:w-16">
              <svg className="h-6 w-6 sm:h-9 sm:w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PersonaVisualTestPage() {
  return (
    <Suspense fallback={null}>
      <PersonaVisualFixture />
    </Suspense>
  );
}