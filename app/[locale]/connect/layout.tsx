/**
 * Connect route layout — Server Component.
 *
 * Provides metadata for the wallet connection page. This page is a
 * transient step in the wrap flow and should not appear in search results.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect Wallet | Stellar Wrap",
  description:
    "Connect your Stellar wallet to start your personalised year-in-review. Supports Freighter, Albedo, and manual address entry.",
  openGraph: {
    title: "Connect Wallet | Stellar Wrap",
    description:
      "Connect your Stellar wallet to start your personalised on-chain year in review.",
    url: "/connect",
  },
  /** Flow pages are not landing pages — keep them out of search indexes. */
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
