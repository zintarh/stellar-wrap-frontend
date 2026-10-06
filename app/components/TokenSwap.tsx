"use client";

/**
 * TokenSwap
 *
 * A self-contained token-swap form with full keyboard navigation and
 * accessible focus management.
 *
 * Keyboard navigation contract (Issue #476):
 *   Tab / Shift+Tab  – natural DOM order through all interactive elements
 *   Enter / Space    – activate the focused button
 *   Arrow keys       – cycle through asset options in the select dropdowns
 *   Escape           – clears the current input field when one is focused
 *
 * Design decisions:
 *   - No inline styles. All visual styling uses Tailwind CSS utility classes
 *     and the project's CSS custom properties defined in app/globals.css.
 *   - No `any`. All types are explicit.
 *   - Every interactive element carries an explicit aria-label or is paired
 *     with a visible <label> via htmlFor so screen readers announce it.
 *   - A polite live region announces swap direction changes without
 *     interrupting the user.
 *   - The "swap assets" button (⇅) rotates focus back to the "From" select
 *     so keyboard users don't lose their place.
 */

import React, {
  useCallback,
  useId,
  useRef,
  useState,
  KeyboardEvent,
} from "react";
import { ArrowUpDown, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SwapStatus = "idle" | "loading" | "success" | "error";

export interface TokenSwapProps {
  /** Available asset codes. Defaults to the popular Stellar assets. */
  assets?: readonly string[];
  /** Called when the user confirms the swap. */
  onSwap?: (params: SwapParams) => Promise<void>;
  /** Extra Tailwind classes for the root element. */
  className?: string;
}

export interface SwapParams {
  fromAsset: string;
  toAsset: string;
  amount: string;
}

const DEFAULT_ASSETS = ["XLM", "USDC", "AQUA", "yXLM", "BTC", "ETH"] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function TokenSwap({
  assets = DEFAULT_ASSETS,
  onSwap,
  className = "",
}: TokenSwapProps) {
  const fromId = useId();
  const toId = useId();
  const amountId = useId();
  const statusId = useId();
  const liveRegionId = useId();

  const [fromAsset, setFromAsset] = useState<string>(assets[0] ?? "XLM");
  const [toAsset, setToAsset] = useState<string>(assets[1] ?? "USDC");
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [liveMessage, setLiveMessage] = useState<string>("");

  // Refs for programmatic focus management
  const amountRef = useRef<HTMLInputElement>(null);
  const fromSelectRef = useRef<HTMLSelectElement>(null);
  const swapDirectionBtnRef = useRef<HTMLButtonElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Swaps the from/to asset pair and moves focus back to the From selector. */
  const handleSwapDirection = useCallback(() => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setLiveMessage(`Swapped direction: now selling ${toAsset}, buying ${fromAsset}`);
    // Return focus to From selector so keyboard users stay oriented
    fromSelectRef.current?.focus();
  }, [fromAsset, toAsset]);

  /** Clears the amount field when Escape is pressed inside it. */
  const handleAmountKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAmount("");
      }
    },
    [],
  );

  /** Validates and submits the swap. */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrorMessage("");

      if (fromAsset === toAsset) {
        setErrorMessage("From and To assets must be different.");
        errorRef.current?.focus();
        return;
      }

      const parsed = parseFloat(amount);
      if (!amount.trim() || isNaN(parsed) || parsed <= 0) {
        setErrorMessage("Please enter a valid positive amount.");
        amountRef.current?.focus();
        return;
      }

      setStatus("loading");
      try {
        await onSwap?.({ fromAsset, toAsset, amount });
        setStatus("success");
        setLiveMessage(`Swap of ${amount} ${fromAsset} to ${toAsset} submitted successfully.`);
        setAmount("");
        // Return focus to amount input so user can do another swap
        amountRef.current?.focus();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Swap failed. Please try again.";
        setErrorMessage(msg);
        setStatus("error");
        errorRef.current?.focus();
      }
    },
    [fromAsset, toAsset, amount, onSwap],
  );

  const isLoading = status === "loading";

  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      {/* Polite live region for screen-reader announcements */}
      <p
        id={liveRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </p>

      <h2 className="mb-5 text-lg font-extrabold tracking-tight text-white">
        Token Swap
      </h2>

      <form onSubmit={handleSubmit} noValidate aria-describedby={statusId}>
        {/* ── Asset row ─────────────────────────────────────────────── */}
        <div className="mb-4 flex items-end gap-3">
          {/* From asset */}
          <div className="flex-1">
            <label
              htmlFor={fromId}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50"
            >
              From
            </label>
            <select
              id={fromId}
              ref={fromSelectRef}
              value={fromAsset}
              onChange={(e) => {
                setFromAsset(e.target.value);
                setLiveMessage(`Selling asset changed to ${e.target.value}`);
              }}
              disabled={isLoading}
              aria-label="Asset to sell"
              className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-theme-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Swap direction button */}
          <button
            type="button"
            ref={swapDirectionBtnRef}
            onClick={handleSwapDirection}
            disabled={isLoading}
            aria-label={`Swap direction: currently selling ${fromAsset}, buying ${toAsset}`}
            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--color-theme-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* To asset */}
          <div className="flex-1">
            <label
              htmlFor={toId}
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50"
            >
              To
            </label>
            <select
              id={toId}
              value={toAsset}
              onChange={(e) => {
                setToAsset(e.target.value);
                setLiveMessage(`Buying asset changed to ${e.target.value}`);
              }}
              disabled={isLoading}
              aria-label="Asset to buy"
              className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-theme-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {assets.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Amount input ───────────────────────────────────────────── */}
        <div className="mb-5">
          <label
            htmlFor={amountId}
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50"
          >
            Amount
          </label>
          <input
            id={amountId}
            ref={amountRef}
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleAmountKeyDown}
            placeholder="0.0000000"
            disabled={isLoading}
            aria-label={`Amount of ${fromAsset} to swap`}
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? statusId : undefined}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-white/20 transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-theme-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* ── Error / status ─────────────────────────────────────────── */}
        {errorMessage && (
          <p
            id={statusId}
            ref={errorRef}
            role="alert"
            tabIndex={-1}
            className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400/50"
          >
            {errorMessage}
          </p>
        )}

        {status === "success" && !errorMessage && (
          <p
            id={statusId}
            role="status"
            className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300"
          >
            Swap submitted successfully!
          </p>
        )}

        {/* ── Submit ────────────────────────────────────────────────── */}
        <button
          type="submit"
          ref={submitBtnRef}
          disabled={isLoading || !amount.trim()}
          aria-busy={isLoading}
          aria-label={
            isLoading
              ? "Swapping, please wait…"
              : `Swap ${amount || "0"} ${fromAsset} for ${toAsset}`
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--color-theme-primary)] px-5 py-3.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-theme-primary)] focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Swapping…</span>
            </>
          ) : (
            <span>Swap</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default TokenSwap;
