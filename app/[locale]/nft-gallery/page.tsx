"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut } from "lucide-react";
import { useWalletStore } from "../../../store/walletStore";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { ConnectWalletButton } from "../../../components/ConnectWalletButton";
import { connectFreighter } from "../../../utils/walletConnect";
import { getHorizonServer } from "../../../utils/stellarClient";
import { xlmToStroopBigInt, stroopToXlm } from "../../../utils/walletConnectManager";
import { NFTGalleryInteractButton } from "../../../components/NFTGalleryInteractButton";

export default function NFTGalleryPage() {
  const t = useTranslations("NFTGallery");
  
  const { address, connect, disconnect, networkLabel } = useWalletStore();
  const isOnline = useOnlineStatus();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  
  // Default to mainnet if no network is set in the store
  const network = (networkLabel as "mainnet" | "testnet") || "mainnet";

  const fetchBalance = async (walletAddress: string) => {
    try {
      const server = getHorizonServer(network);
      const account = await server.loadAccount(walletAddress);
      
      const nativeBalance = account.balances.find((b: Record<string, unknown>) => b.asset_type === "native");
      if (nativeBalance) {
        // Acceptance criteria: Correctly parses and formats Stellar amounts
        // Handle 7 decimal precision / Stroops appropriately
        const stroops = xlmToStroopBigInt(nativeBalance.balance);
        const formattedXlm = stroopToXlm(stroops);
        setBalance(formattedXlm);
      } else {
        setBalance("0.0000000");
      }
    } catch (err: unknown) {
      console.error("Failed to fetch balance:", err);
      setBalance("0.0000000"); // Fallback
    }
  };

  useEffect(() => {
    if (address && isOnline) {
      fetchBalance(address);
    }
  }, [address, isOnline, network]);

  const handleConnect = async () => {
    if (!isOnline) {
      setError("You are offline.");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Uses withTimeout internally in getFreighterNetwork checks or simply connects
      const publicKey = await connectFreighter(network);
      connect(publicKey, "freighter", network);
      await fetchBalance(publicKey);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || "Failed to connect to Freighter.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setBalance(null);
    setError(null);
  };

  // Truncate public key for display
  const shortAddress = address ? `${address.slice(0, 5)}...${address.slice(-4)}` : "";

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-theme-background p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-theme-primary/20 opacity-80" />
      
      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-black/60 border border-theme-primary/30 rounded-2xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-theme-primary mb-2">
              {t("title")}
            </h1>
            <p className="text-white/60">
              {t("subtitle")}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!address ? (
              <motion.div
                key="connect"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-4"
              >
                <ConnectWalletButton
                  walletName="Freighter"
                  icon={<Wallet className="w-5 h-5" />}
                  onConnect={handleConnect}
                  isConnecting={isConnecting}
                  connectingLabel={t("connecting")}
                />
                
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-6"
              >
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 bg-theme-primary/20 rounded-full flex items-center justify-center mb-2 text-theme-primary">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="text-xl font-mono font-bold text-white tracking-wider">
                    {shortAddress}
                  </div>
                  {balance !== null && (
                    <div className="text-sm font-medium text-white/70">
                      {t("balance", { amount: balance })}
                    </div>
                  )}
                </div>

                <NFTGalleryInteractButton address={address} network={network} />

                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 px-4 bg-transparent border border-white/20 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/40 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t("disconnect")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
