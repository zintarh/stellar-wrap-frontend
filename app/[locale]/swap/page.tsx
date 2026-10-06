"use client";

/**
 * Token Swap page — Issues #475 & #476
 *
 * The TokenSwap component is code-split via React.lazy (see LazyTokenSwap).
 * This keeps it out of the initial bundle and reduces first-load size.
 */

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LazyTokenSwap } from "@/app/components/LazyTokenSwap";
import type { SwapParams } from "@/app/components/TokenSwap";

export default function SwapPage() {
  const router = useRouter();

  async function handleSwap(params: SwapParams): Promise<void> {
    // Integration point: wire this to a real swap service / Soroban contract.
    // Throwing here causes TokenSwap to display the error state.
    console.info("Swap requested:", params);
  }

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center bg-theme-background px-4 py-12"
      id="main-content"
    >
      <div className="w-full max-w-md">
        {/* Page heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Token Swap
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Swap tokens on the Stellar DEX
          </p>
        </div>

        {/* Lazy-loaded swap form */}
        <LazyTokenSwap onSwap={handleSwap} />

        {/* Back navigation */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back to previous page"
          className="mt-6 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-white/60 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-black"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back</span>
        </button>
      </div>
    </main>
  );
}
