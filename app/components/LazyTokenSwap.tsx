"use client";

/**
 * LazyTokenSwap — Issue #475
 *
 * Code-splits the TokenSwap component using React.lazy + Suspense so it is
 * not included in the initial bundle. The heavy swap logic (form state,
 * validation, asset selectors) is deferred until the component is first
 * rendered.
 *
 * Usage:
 *   import { LazyTokenSwap } from "@/app/components/LazyTokenSwap";
 *   <LazyTokenSwap onSwap={handleSwap} />
 *
 * The Suspense fallback renders a skeleton placeholder that matches the
 * dimensions of the real component so there is no Cumulative Layout Shift
 * (CLS) when the real component loads.
 *
 * Design decisions:
 *   - No inline styles — sizing/spacing uses Tailwind utility classes.
 *   - The skeleton uses aria-hidden="true" because it carries no semantic
 *     content; a polite live-region announces when the real component is ready.
 *   - Strictly typed — no `any`.
 */

import React, { lazy, Suspense } from "react";
import type { TokenSwapProps } from "./TokenSwap";

// Dynamically import the real TokenSwap so bundlers code-split it
const TokenSwap = lazy(() => import("./TokenSwap"));

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function TokenSwapSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl"
      aria-label="Loading Token Swap…"
    >
      {/* Title bar */}
      <div className="mb-5 h-6 w-32 animate-pulse rounded-lg bg-white/10" />

      {/* Asset row */}
      <div className="mb-4 flex items-end gap-3">
        <div className="flex-1">
          <div className="mb-1.5 h-3 w-10 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
        </div>
        <div className="mb-0.5 h-10 w-10 animate-pulse rounded-xl bg-white/5" />
        <div className="flex-1">
          <div className="mb-1.5 h-3 w-8 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-5">
        <div className="mb-1.5 h-3 w-16 animate-pulse rounded bg-white/10" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-white/5" />
      </div>

      {/* Submit button */}
      <div className="h-12 w-full animate-pulse rounded-xl bg-[color:var(--color-theme-primary)] opacity-30" />
    </div>
  );
}

// ─── Lazy wrapper ─────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for `<TokenSwap>` that code-splits the component.
 * Accepts the same props as TokenSwap.
 */
export function LazyTokenSwap(props: TokenSwapProps) {
  return (
    <Suspense fallback={<TokenSwapSkeleton />}>
      <TokenSwap {...props} />
    </Suspense>
  );
}

export default LazyTokenSwap;
