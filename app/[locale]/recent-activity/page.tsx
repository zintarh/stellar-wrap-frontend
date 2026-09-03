"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut } from "lucide-react";
import { useWalletStore } from "../../../store/walletStore";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { ConnectWalletButton } from "../../../components/ConnectWalletButton";
import { connectFreighter } from "../../../utils/walletConnect";
import { ActivityTable } from "../../../components/ActivityTable";
import { ActivityInteractButton } from "../../../components/ActivityInteractButton";

export default function RecentActivityPage() {
  const t = useTranslations("RecentActivity");
  
  const { address, connect, disconnect, networkLabel } = useWalletStore();
  const isOnline = useOnlineStatus();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const network = (networkLabel as "mainnet" | "testnet") || "mainnet";

  const handleConnect = async () => {
    if (!isOnline) {
      setError("You are offline.");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const publicKey = await connectFreighter(network);
      connect(publicKey, "freighter", network);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || "Failed to connect to Freighter.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setError(null);
  };

  const shortAddress = address ? `${address.slice(0, 5)}...${address.slice(-4)}` : "";

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-theme-background p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-theme-primary/20 opacity-80" />
      
      <div className="relative z-10 w-full max-w-4xl">
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
                className="flex flex-col gap-4 max-w-sm mx-auto"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-theme-primary/20 rounded-full flex items-center justify-center text-theme-primary">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-lg font-mono font-bold text-white tracking-wider">
                      {shortAddress}
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="py-2 px-4 bg-transparent border border-white/20 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/40 rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("disconnect")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3">
                    <ActivityTable address={address} network={network} />
                  </div>
                  <div className="md:col-span-1 flex flex-col gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl h-full flex flex-col justify-center">
                      <p className="text-sm text-white/60 mb-4 text-center">
                        Verify your network connection by signing a zero-fee ping transaction.
                      </p>
                      <ActivityInteractButton address={address} network={network} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
