import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { DevTool } from "./components/DevTool";
import { Toaster } from "sonner";
import { SoundManager } from "./components/SoundManager";
import { RateLimitBanner } from "./components/RateLimitBanner";
import { AppNavbar } from "./components/AppNavbar";
import { JsonLd } from "./components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Base URL used by Next.js to resolve absolute OG/Twitter image URLs. */
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
    : new URL("https://stellarwrap.vercel.app");

export const metadata: Metadata = {
  metadataBase: BASE_URL,
  title: {
    default: "Stellar Wrap | Reveal Your On-Chain Persona",
    template: "%s | Stellar Wrap",
  },
  description:
    "Discover your Stellar blockchain year in review. See your total transactions, top DeFi persona, vibes, and more — then share your wrap with the world.",
  keywords: [
    "Stellar",
    "blockchain",
    "DeFi",
    "year in review",
    "crypto wrap",
    "on-chain activity",
    "Stellar wallet",
    "web3",
  ],
  authors: [{ name: "Stellar Wrap" }],
  creator: "Stellar Wrap",
  openGraph: {
    type: "website",
    siteName: "Stellar Wrap",
    title: "Stellar Wrap | Reveal Your On-Chain Persona",
    description:
      "Discover your Stellar blockchain year in review. See your total transactions, top DeFi persona, vibes, and more.",
    url: BASE_URL.toString(),
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 1200,
        alt: "Stellar Wrap — Your On-Chain Year in Review",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stellar Wrap | Reveal Your On-Chain Persona",
    description:
      "Discover your Stellar blockchain year in review. See your total transactions, top DeFi persona, vibes, and more.",
    images: ["/api/og"],
    creator: "@StellarOrg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/** Sitewide WebApplication structured data (injected on every page via root layout). */
const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Stellar Wrap",
  url: BASE_URL.toString(),
  description:
    "Stellar Wrap is a web application that generates a personalised year-in-review for your Stellar blockchain wallet — showing transactions, DeFi activity, persona archetype, and vibes.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "On-chain transaction history analysis",
    "DeFi persona generation",
    "Vibe check statistics",
    "Shareable wrap card",
    "Testnet and mainnet support",
  ],
  inLanguage: "en",
  isAccessibleForFree: true,
  browserRequirements: "Requires JavaScript. Works in all modern browsers.",
};

/** Sitewide WebSite structured data (enables Google Sitelinks search box). */
const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stellar Wrap",
  url: BASE_URL.toString(),
  description: "Your Stellar blockchain year in review.",
  inLanguage: "en",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Sitewide structured data — injected on every page */}
        <JsonLd data={webApplicationJsonLd} />
        <JsonLd data={webSiteJsonLd} />
        <Providers>
          <AppNavbar />
          {children}
          <SoundManager />
          <RateLimitBanner />
        </Providers>
        <DevTool />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
