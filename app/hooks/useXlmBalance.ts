"use client";

/**
 * useXlmBalance
 *
 * Fetches the native XLM balance for a given Stellar address via Horizon.
 * Handles loading, error, and timeout states without crashing the UI.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWalletBalances } from "@/app/services/walletBalanceService";
import { formatStellarAmount } from "@/src/utils/stellarAmount";
import type { Network } from "@/src/config";

const FETCH_TIMEOUT_MS = 10_000;
const REFRESH_INTERVAL_MS = 60_000;

export type XlmBalanceStatus = "idle" | "loading" | "success" | "error";

export interface UseXlmBalanceResult {
  /** Formatted XLM balance string (e.g. "1234.5600000"), or null while loading / on error */
  balance: string | null;
  /** Current fetch status */
  status: XlmBalanceStatus;
  /** Human-readable error message, set only when status === "error" */
  error: string | null;
  /** Trigger an immediate manual refresh */
  refresh: () => void;
}

export function useXlmBalance(
  address: string | null | undefined,
  network: Network,
): UseXlmBalanceResult {
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<XlmBalanceStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Incremented on each manual refresh to trigger the effect
  const [refreshCount, setRefreshCount] = useState(0);

  // Track the active fetch so we can ignore stale results
  const abortRef = useRef<AbortController | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setStatus("idle");
      setError(null);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const assets = await fetchWalletBalances({ address, network });
      if (controller.signal.aborted) return;

      const xlmAsset = assets.find((a) => a.assetType === "native");
      if (xlmAsset) {
        setBalance(formatStellarAmount(xlmAsset.balance));
        setStatus("success");
        setError(null);
      } else {
        setBalance("0.0000000");
        setStatus("success");
        setError(null);
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error ? err.message : "Failed to fetch XLM balance";
      setError(message);
      setStatus("error");
      setBalance(null);
    } finally {
      clearTimeout(timeoutId);
    }
  }, [address, network]);

  // Fetch on mount, on address/network change, and on manual refresh
  useEffect(() => {
    void fetchBalance();

    const interval = setInterval(() => {
      void fetchBalance();
    }, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
    // refreshCount intentionally included so manual refresh triggers a re-fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBalance, refreshCount]);

  const refresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
  }, []);

  return { balance, status, error, refresh };
}
