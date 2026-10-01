"use client";

/**
 * Withdraw Page — Issue #477
 *
 * Keyboard navigation contract:
 *   - On wallet connect:  focus moves to the amount input automatically.
 *   - On validation/submission error: focus moves to the error alert so
 *     screen-reader and keyboard users are notified without polling.
 *   - On successful withdrawal: focus moves to the "Withdraw Again" button.
 *   - Enter in the amount field triggers the withdraw action (same as click).
 *   - Tab / Shift+Tab traverse: Back button → amount input → Withdraw button.
 *   - Escape in the amount field clears it (convenience shortcut).
 *   - All interactive elements carry explicit aria-labels.
 *   - The submit button is aria-busy during the in-flight request.
 *
 * Design decisions:
 *   - No inline styles — all sizing/colours use Tailwind utility classes and
 *     the project's CSS custom properties (app/globals.css).
 *   - Strictly typed — no `any`.
 */

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useWrapStore } from "../../store/wrapStore";
import { useWalletStore } from "../../store/walletStore";
import { ConnectWalletButton } from "../../components/ConnectWalletButton";
import { invokeSorobanContract } from "@/src/utils/sorobanConverter";
import { getContractNetworkConfig } from "@/config/contracts";
import { stellarToStroops } from "../../utils/walletConnect";

export default function WithdrawPage() {
  const router = useRouter();
  const network = useWrapStore((s) => s.network);
  const { address, provider, isConnected } = useWalletStore();

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "withdrawing" | "success" | "failed"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Refs for programmatic focus management
  const amountInputRef = useRef<HTMLInputElement>(null);
  const withdrawButtonRef = useRef<HTMLButtonElement>(null);
  const withdrawAgainButtonRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // ── Withdraw logic ─────────────────────────────────────────────────────────
  const handleWithdraw = useCallback(async () => {
    setError(null);
    setTxHash(null);

    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    const stroops = stellarToStroops(amount);
    if (stroops <= 0n) {
      setError("Please enter a valid amount.");
      return;
    }

    setStatus("withdrawing");

    try {
      const { contractAddress, rpcUrl, networkPassphrase } =
        getContractNetworkConfig(network);

      const result = await invokeSorobanContract({
        rpcUrl,
        networkPassphrase,
        sourceAddress: address,
        contractId: contractAddress,
        method: "withdraw",
        args: [stroops.toString()],
        argTypes: ["i128"],
        simulationTimeoutMs: 15_000,
        sendTimeoutMs: 15_000,
      });

      setTxHash(result.transactionHash);
      setStatus("success");
      toast.success("Withdrawal submitted successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Withdrawal failed. Please try again.";
      setError(message);
      setStatus("failed");
    }
  }, [amount, isConnected, address, network]);

  const isWithdrawing = status === "withdrawing";

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  /** Enter in the amount field triggers the withdraw; Escape clears it. */
  const handleAmountKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isWithdrawing && amount.trim()) {
        e.preventDefault();
        void handleWithdraw();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setAmount("");
      }
    },
    [amount, isWithdrawing, handleWithdraw],
  );

  // ── Focus management effects ───────────────────────────────────────────────

  // Move focus to the amount input as soon as the wallet connects so keyboard
  // users land on the first actionable control of the flow.
  useEffect(() => {
    if (isConnected) {
      amountInputRef.current?.focus();
    }
  }, [isConnected]);

  // Move focus to the error alert when validation or submission fails so
  // screen-reader and keyboard users are notified immediately.
  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  // Move focus to the "Withdraw Again" action once the withdrawal succeeds so
  // the keyboard user can immediately restart the flow without re-tabbing.
  useEffect(() => {
    if (status === "success") {
      withdrawAgainButtonRef.current?.focus();
    }
  }, [status]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-theme-background">
      {/* Decorative overlay — no semantic content */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black via-black to-black opacity-60"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-xl px-4 sm:px-6 md:px-8">
        {/* ── Page heading ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-3 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Withdraw
          </h1>
          <p className="text-base font-medium text-white/60">
            Withdraw funds from your Soroban smart contract
          </p>
        </motion.div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl border border-theme-primary/30 bg-black/70 p-6 backdrop-blur-xl sm:p-8">
          {!isConnected ? (
            /* ── Wallet not connected ────────────────────────────── */
            <div className="space-y-4">
              <p className="text-center text-sm text-white/60">
                Connect your wallet to withdraw
              </p>
              <ConnectWalletButton
                walletName={provider ?? "Freighter"}
                icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
                onConnect={() => {}}
              />
            </div>
          ) : (
            /* ── Wallet connected ─────────────────────────────────── */
            <div className="space-y-6">
              {/* Amount field */}
              <div>
                <label
                  htmlFor="withdraw-amount"
                  className="mb-2 block text-sm font-black tracking-wider text-white/70"
                >
                  Amount (XLM)
                </label>
                <input
                  id="withdraw-amount"
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={handleAmountKeyDown}
                  placeholder="0.0000000"
                  disabled={isWithdrawing}
                  aria-label="Withdrawal amount in XLM"
                  aria-invalid={!!error}
                  aria-describedby={error ? "withdraw-error" : undefined}
                  className={[
                    "w-full rounded-xl border-2 bg-black/50 px-5 py-4 font-mono text-sm text-white transition-all duration-200",
                    "placeholder:text-white/20",
                    "focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-black",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error
                      ? "border-red-500/50"
                      : "border-white/10 hover:border-white/20",
                  ].join(" ")}
                />
              </div>

              {/* Error alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  id="withdraw-error"
                  ref={errorRef}
                  tabIndex={-1}
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-2 rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 text-sm font-medium text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                  <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Success banner */}
              {status === "success" && txHash && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400"
                >
                  <CheckCircle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-bold">Withdrawal submitted</p>
                    <p className="mt-1 break-all font-mono text-xs opacity-80">
                      Hash: {txHash}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Withdraw button */}
              <motion.button
                ref={withdrawButtonRef}
                type="button"
                onClick={() => void handleWithdraw()}
                disabled={isWithdrawing || !amount.trim()}
                aria-busy={isWithdrawing}
                aria-label={
                  isWithdrawing
                    ? "Withdrawal in progress, please wait"
                    : `Withdraw ${amount || "0"} XLM`
                }
                whileHover={isWithdrawing ? undefined : { scale: 1.02 }}
                whileTap={isWithdrawing ? undefined : { scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-theme-primary px-6 py-4 font-bold text-black transition-colors hover:bg-theme-primary/90 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isWithdrawing && (
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />
                )}
                <span>{isWithdrawing ? "Withdrawing…" : "Withdraw"}</span>
              </motion.button>

              {/* Withdraw again (visible after success) */}
              {status === "success" && (
                <motion.button
                  ref={withdrawAgainButtonRef}
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  aria-label="Start another withdrawal"
                  onClick={() => {
                    setStatus("idle");
                    setAmount("");
                    setTxHash(null);
                    setError(null);
                    amountInputRef.current?.focus();
                  }}
                  className="w-full rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-white/70 transition-colors hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-black"
                >
                  Withdraw Again
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* ── Back button ───────────────────────────────────────────────── */}
        <motion.button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back to previous page"
          className="mt-6 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-white/60 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-black"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back</span>
        </motion.button>
      </div>
    </main>
  );
}
