"use client";

import { ThemeProvider } from "./context/ThemeContext";
import { useEffect } from "react";
import { initWalletKit } from "./utils/walletKit";
import { OfflineBanner } from "./components/OfflineBanner";
import { OfflineWrapHydrator } from "./components/OfflineWrapHydrator";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";
import { ServiceWorkerManager } from "./components/ServiceWorkerManager";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize wallet kit on client side
    if (typeof window !== "undefined") {
      initWalletKit();
    }
  }, []);

  return (
    <ThemeProvider>
      <ServiceWorkerManager />
      <OfflineWrapHydrator />
      <OfflineBanner />
      {children}
      <PwaInstallPrompt />
    </ThemeProvider>
  );
}
