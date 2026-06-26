import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { DevTool } from "./components/DevTool";
import { Toaster } from "sonner";
import { SoundManager } from "./components/SoundManager";
import { RateLimitBanner } from "./components/RateLimitBanner";
import { AppNavbar } from "./components/AppNavbar";
import { SkipNavigation } from "./components/SkipNavigation";

export const metadata: Metadata = {
  title: "Stellar Wrap | Reveal Your On-Chain Persona",
  description: "Your Stellar Year in Review",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <SkipNavigation />
        <Providers>
          <AppNavbar />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <SoundManager />
          <RateLimitBanner />
        </Providers>
        <DevTool />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
