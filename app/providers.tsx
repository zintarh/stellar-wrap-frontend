"use client";

import { ThemeProvider } from "./context/ThemeContext";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize wallet kit on client side
    if (typeof window !== "undefined") {
      void import("./utils/walletKit").then(({ initWalletKit }) => {
        initWalletKit();
      });
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
