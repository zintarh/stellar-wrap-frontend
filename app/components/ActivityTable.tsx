"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { ServerApi } from "@stellar/stellar-sdk";
import { getHorizonServer } from "../utils/stellarClient";
import { stroopToXlm } from "../utils/walletConnectManager";
import { Network } from "../../src/config";
import { logger } from "../utils/logger";
import { ChevronLeft, ChevronRight } from "lucide-react";

const log = logger.child("ActivityTable");

interface ActivityTableProps {
  address: string;
  network: Network;
}

const ITEMS_PER_PAGE = 5;

// Simple cache to prevent rate-limiting on quick remounts
const activityCache: Record<string, { data: ServerApi.TransactionRecord[]; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds

export function ActivityTable({ address, network }: ActivityTableProps) {
  const t = useTranslations("RecentActivity");
  
  const [transactions, setTransactions] = useState<ServerApi.TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      const cacheKey = `${network}-${address}`;
      const cached = activityCache[cacheKey];
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (isMounted) {
          setTransactions(cached.data);
          setIsLoading(false);
        }
        return;
      }
      
      try {
        const server = getHorizonServer(network === "testnet" ? "testnet" : "mainnet");
        
        // Wrap with simple timeout logic for network resiliency
        const fetchPromise = server.transactions().forAccount(address).limit(20).order("desc").call();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 15000);
        });
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (isMounted && response && response.records) {
          activityCache[cacheKey] = { data: response.records, timestamp: Date.now() };
          setTransactions(response.records);
        }
      } catch (err: unknown) {
        if (isMounted) {
          log.error("Failed to fetch transactions:", err);
          const errorObj = err as Error;
          setError(errorObj.message || "Failed to load activity");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchTransactions();
    
    return () => {
      isMounted = false;
    };
  }, [address, network]);

  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE) || 1;
  const currentItems = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  const shortenHash = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-white/5 text-white/50 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">{t("table.id")}</th>
                <th className="p-4 font-medium">{t("table.date")}</th>
                <th className="p-4 font-medium text-right">{t("table.fee")}</th>
                <th className="p-4 font-medium text-center">{t("table.status")}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={4} className="p-8 text-center text-white/50">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("connecting")}
                      </div>
                    </td>
                  </motion.tr>
                ) : error ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={4} className="p-8 text-center text-red-400 bg-red-500/5">
                      {error}
                    </td>
                  </motion.tr>
                ) : currentItems.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={4} className="p-8 text-center text-white/50">
                      No activity found.
                    </td>
                  </motion.tr>
                ) : (
                  currentItems.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 font-mono text-theme-primary">
                        <a 
                          href={`https://stellar.expert/explorer/${network === "testnet" ? "testnet" : "public"}/tx/${tx.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {shortenHash(tx.id)}
                        </a>
                      </td>
                      <td className="p-4 text-white/70 text-sm whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="p-4 text-right font-mono text-white/90">
                        {stroopToXlm(BigInt(tx.fee_charged))} XLM
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          tx.successful ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {tx.successful ? t("table.successful") : t("table.failed")}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      
      {!isLoading && !error && transactions.length > 0 && (
        <div className="flex items-center justify-between px-2 text-sm text-white/60">
          <span>{t("pagination.page", { current: currentPage, total: totalPages })}</span>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
              aria-label={t("pagination.previous")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
              aria-label={t("pagination.next")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
