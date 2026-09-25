interface ShareImageCardProps {
  themeColor: string;
  archetypeImage?: string | null;
  data?: ShareImageCardData;
  shareUrl?: string;

  /** Pre-rendered QR code data URL. When provided, used directly instead of
   * fetching from an external API, ensuring deterministic visual output.
   * Pass `null` explicitly to suppress the QR section entirely. */
  qrCodeDataUrl?: string | null;

  locale?: string;
  labels?: ShareCardLabels;
}