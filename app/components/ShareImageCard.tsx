"use client";

import Image from "next/image";
import { useState, type RefObject } from "react";
import { Download } from "lucide-react";
import { downloadShareImage } from "../utils/imageExport";
import { mockData } from "../data/mockData";

interface ShareImageCardVibe {
  percentage: number;
  label: string;
}

interface ShareImageCardData {
  username: string;
  transactions: number;
  persona: string;
  vibes?: ShareImageCardVibe[];
}

interface ShareImageCardProps {
  themeColor: string;
  archetypeImage?: string | null;
  data?: ShareImageCardData;
  shareUrl?: string;
  /** Pre-rendered QR code data URL. When provided, used directly instead of
   * fetching from an external API, ensuring deterministic visual output.
   * Pass `null` explicitly to suppress the QR section entirely. */
  qrCodeDataUrl?: string | null;
}

export function ShareImageCard({
  themeColor,
  archetypeImage,
  data,
  shareUrl,
  qrCodeDataUrl,
}: ShareImageCardProps) {
  const username = data?.username ?? mockData.username;
  const transactions = data?.transactions ?? mockData.transactions;
  const persona = data?.persona ?? mockData.persona;
  const vibes = data?.vibes ?? mockData.vibes;

  const topVibe = vibes[0];
  const resolvedArchetypeImage =
    archetypeImage === undefined
      ? `/archetypes/${persona.toLowerCase().replace(/^the\s+/, "").replace(/\s+/g, "-")}.png`
      : archetypeImage;
  // Always use a fixed locale so the formatted number is identical across
  // environments regardless of the OS/browser locale setting.
  const formattedTransactions = new Intl.NumberFormat("en-US").format(transactions);

  // Prefer an injected data URL (deterministic, works offline, no external
  // network request).  Fall back to the external API only in production when
  // shareUrl is provided and no pre-rendered data URL was supplied.
  const resolvedQrCodeUrl: string | null = (() => {
    if (qrCodeDataUrl !== undefined) return qrCodeDataUrl; // explicit override (incl. null)
    if (shareUrl) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}`;
    }
    return null;
  })();

  const getRgbValues = (color: string): string => {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
    }
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
    return "29, 185, 84";
  };

  const rgbValues = getRgbValues(themeColor);

  return (
    <div
      style={{
        width: "1080px",
        height: "1080px",
        position: "relative",
        padding: "24px",
        backgroundColor: "#020202",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          aspectRatio: "1",
          borderRadius: "40px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          background: `linear-gradient(to bottom right, rgba(${rgbValues}, 0.2), rgba(0, 0, 0, 0.8))`,
        }}
      >
        <div style={{ padding: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: themeColor,
              }}
            />
            <span
              style={{
                fontSize: "16px",
                fontWeight: "900",
                color: "rgba(255, 255, 255, 0.7)",
                letterSpacing: "0.2em",
                lineHeight: "1",
                marginTop: "-15px",
              }}
            >
              STELLAR WRAPPED 2026
            </span>
          </div>
          <h2
            style={{
              fontSize: "30px",
              fontWeight: "900",
              color: "white",
              marginBottom: "8px",
            }}
          >
            @{username}
          </h2>
        </div>

        <div
          style={{
            paddingLeft: "32px",
            paddingRight: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              backdropFilter: "blur(4px)",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              Total Transactions
            </p>
            <p
              style={{
                fontSize: "60px",
                fontWeight: "900",
                background: `linear-gradient(to right, #ffffff, ${themeColor})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formattedTransactions}
            </p>
          </div>

          <div
            style={{
              backdropFilter: "blur(4px)",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "8px",
              }}
            >
              Persona
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {resolvedArchetypeImage ? (
                <Image
                  src={resolvedArchetypeImage}
                  alt={persona}
                  width={64}
                  height={64}
                  style={{ borderRadius: "12px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "12px",
                    flexShrink: 0,
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  }}
                />
              )}
              <p
                style={{
                  fontSize: "30px",
                  fontWeight: "900",
                  color: "white",
                  margin: 0,
                }}
              >
                {persona}
              </p>
            </div>
          </div>

          <div
            style={{
              backdropFilter: "blur(4px)",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: "8px",
              }}
            >
              Top Vibe
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "white",
              }}
            >
              {topVibe ? `${topVibe.percentage}% ${topVibe.label}` : "No vibe data"}
            </p>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "32px",
            right: "32px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "900",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            stellar.org/wrapped
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {resolvedQrCodeUrl && (
              <>
                <img
                  src={resolvedQrCodeUrl}
                  alt="Scan to view"
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    padding: "8px",
                  }}
                />
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "rgba(255, 255, 255, 0.6)",
                    letterSpacing: "0.05em",
                  }}
                >
                  SCAN TO VIEW
                </div>
              </>
            )}
            {!resolvedQrCodeUrl && (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "8px",
                    backgroundColor: themeColor,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DownloadPngButtonProps {
  cardRef: RefObject<HTMLDivElement | null>;
  address?: string;
}

export function DownloadPngButton({ cardRef, address }: DownloadPngButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadShareImage(cardRef.current);
    } catch {
      // Silently fail
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex cursor-pointer items-center pl-4 w-42 h-15 gap-3 p-2 rounded-xl bg-[#0F0F10] hover:bg-[#1a1a1c] transition-colors group"
    >
      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-black border border-white/10">
        <Download className={`w-5 h-5 text-white ${isDownloading ? "animate-pulse" : ""}`} />
      </div>
      <span className="font-bold text-white tracking-wide">
        {isDownloading ? "Downloading..." : "Download PNG"}
      </span>
    </button>
  );
}
