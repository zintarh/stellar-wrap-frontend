"use client";

import { ThemeProvider } from "./context/ThemeContext";
import { useEffect } from "react";
import { initWalletKit } from "./utils/walletKit";
import { ServiceWorkerManager } from "./components/ServiceWorkerManager";
import { OfflineWrapHydrator } from "./components/OfflineWrapHydrator";
import { OfflineBanner } from "./components/OfflineBanner";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dynamically initialize walletKit client-side
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
