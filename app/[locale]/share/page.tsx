import type { Metadata } from "next";
import { Horizon } from "stellar-sdk";
import SharePageClient from "./SharePageClient";
import { RPC_ENDPOINTS } from "@/src/config";

type ShareSearchParams = {
  address?: string;
  period?: string;
};

type PageProps = {
  searchParams: Promise<ShareSearchParams>;
};

async function getAccountData(address: string | undefined, network: string) {
  if (!address) {
    return null;
  }

  try {
    const horizon = new Horizon.Server(RPC_ENDPOINTS[network as "testnet" | "mainnet"]);
    const account = await horizon.loadAccount(address);
    const operations = await horizon.operations().forAccount(address).limit(1).call();

    const nativeBalance = account.balances.find(b => b.asset_type === "native");
    const balance = nativeBalance ? parseFloat(nativeBalance.balance).toFixed(0) : "0";
    const txCount = (operations as any)?.total_count || 1;

    return {
      balance,
      txCount,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { address, period = "monthly" } = await searchParams;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stellarwrapped.xyz";
  const shareUrl = `${baseUrl}/share?address=${address}&period=${period}`;

  const accountData = await getAccountData(address, "mainnet");

  const twitterText = accountData
    ? `I'm a Stellar Wrapped 2026! 🧙 ${accountData.txCount} transactions on Stellar. Get your #StellarWrapped → ${baseUrl}`
    : `Check out my Stellar Wrapped 2026! Get yours → ${baseUrl}`;

  const ogImageUrl = `${baseUrl}/api/og?username=StellarUser&transactions=${accountData?.txCount || 0}&persona=Network Pioneer&topVibe=Steady&vibePercentage=100`;
  const twitterImageUrl = `${baseUrl}/api/og/twitter?username=StellarUser&transactions=${accountData?.txCount || 0}&persona=Network Pioneer&topVibe=Steady&vibePercentage=100&address=${address || ""}`;

  return {
    title: "My Stellar Wrapped 2026",
    description: "Check out my Stellar journey and unwrap your 2026 story",
    openGraph: {
      title: "My Stellar Wrapped 2026",
      description: "Check out my Stellar journey and unwrap your 2026 story",
      url: shareUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 1200,
          alt: "Stellar Wrapped 2026",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "My Stellar Wrapped 2026",
      description: twitterText,
      images: [twitterImageUrl],
      creator: "@StellarDevelop",
    },
  };
}

export default async function SharePage({ searchParams }: PageProps) {
  const params = await searchParams;

  return <SharePageClient />;
}
