import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NFTGallery" });

  return {
    title: `${t("title")} | Stellar Wrap`,
    description: t("subtitle"),
    openGraph: {
      title: `${t("title")} | Stellar Wrap`,
      description: t("subtitle"),
      url: `/${locale}/nft-gallery`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function NFTGalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
