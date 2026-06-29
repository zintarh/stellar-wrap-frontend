"use client";

import Image from "next/image";
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
  archetypeImage?: string | null; // e.g. '/archetypes/wizard.png'; null hides the image fallback.
  data?: ShareImageCardData;
}

export function ShareImageCard({ themeColor, archetypeImage, data }: ShareImageCardProps) {
  const { persona, transactions, username, vibes = [] } = data ?? mockData;
  const topVibe = vibes[0];
  // Derive image from persona name if not explicitly provided: "The Wizard" -> /archetypes/wizard.png
  const resolvedArchetypeImage =
    archetypeImage === undefined
      ? `/archetypes/${persona.toLowerCase().replace(/^the\s+/, "").replace(/\s+/g, "-")}.png`
      : archetypeImage;
  const formattedTransactions = new Intl.NumberFormat("en-US").format(transactions);

  // Convert any color format to rgb values for gradient
  const getRgbValues = (color: string): string => {
    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
    }

    // Handle hex format
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }

    // Fallback
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
      {/* Main card container matching ShareCard preview  */}
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
        {/* Card header */}
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

        {/* Stats */}
        <div
          style={{
            paddingLeft: "32px",
            paddingRight: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Total Transactions */}
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

          {/* Persona */}
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

          {/* Top Vibe */}
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

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "32px",
            right: "32px",
            display: "flex",
            alignItems: "center",
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
        </div>
      </div>
    </div>
  );
}
