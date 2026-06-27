import type { Metadata } from "next";
import SharePageClient from "./SharePageClient";

type ShareSearchParams = {
  address?: string;
  period?: string;
  persona?: string;
  transactions?: string;
  username?: string;
  topVibe?: string;
  vibePercentage?: string;
};

type PageProps = {
  searchParams: Promise<ShareSearchParams>;
};

function buildShareUrl(
  origin: string,
  params: ShareSearchParams,
): string {
  const qs = new URLSearchParams();
  if (params.address) qs.set("address", params.address);
  if (params.period) qs.set("period", params.period);
  if (params.persona) qs.set("persona", params.persona);
  if (params.transactions) qs.set("transactions", params.transactions);
  if (params.username) qs.set("username", params.username);
  if (params.topVibe) qs.set("topVibe", params.topVibe);
  if (params.vibePercentage) qs.set("vibePercentage", params.vibePercentage);
  const query = qs.toString();
  return query ? `${origin}/share?${query}` : `${origin}/share`;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://stellar.org/wrapped";

  const persona = params.persona || "Network Pioneer";
  const transactions = params.transactions || "0";
  const username = params.username || "StellarUser";
  const topVibe = params.topVibe || "DeFi";
  const vibePercentage = params.vibePercentage || "0";
  const address = params.address;

  const title = `My Stellar Wrapped 2026 — ${persona}`;
  const description = `${transactions} transactions | ${persona} | Stellar Wrapped`;

  const ogParams = new URLSearchParams({
    username,
    transactions,
    persona,
    topVibe,
    vibePercentage,
  });
  if (address) ogParams.set("address", address);

  const ogImage = `${origin}/api/og?${ogParams.toString()}`;
  const canonicalUrl = buildShareUrl(origin, params);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Stellar Wrapped 2026",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 1200,
          alt: `${persona} — Stellar Wrapped 2026`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function SharePage() {
  return <SharePageClient />;
}
