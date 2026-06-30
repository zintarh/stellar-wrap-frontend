import {
  Compass,
  Crown,
  Gem,
  Hammer,
  Leaf,
  Sparkles,
  Vault,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface ArchetypeStyle {
  color: string;
  gradient: string;
  icon: LucideIcon;
}

const DEFAULT_STYLE: ArchetypeStyle = {
  color: "#8AB4F8",
  gradient: "linear-gradient(135deg, #8AB4F8 0%, #4A6CF7 100%)",
  icon: Sparkles,
};

export const ARCHETYPE_STYLES: Record<string, ArchetypeStyle> = {
  "The Wizard": {
    color: "#B794F6",
    gradient: "linear-gradient(135deg, #B794F6 0%, #6B46C1 100%)",
    icon: Wand2,
  },
  "The Explorer": {
    color: "#4FACFE",
    gradient: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
    icon: Compass,
  },
  "The Architect": {
    color: "#43E97B",
    gradient: "linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)",
    icon: Hammer,
  },
  "The Patron": {
    color: "#FF6B9D",
    gradient: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
    icon: Crown,
  },
  "The Collector": {
    color: "#FFD93D",
    gradient: "linear-gradient(135deg, #FFD93D 0%, #FF6B35 100%)",
    icon: Gem,
  },
  "The Trader": {
    color: "#00D4FF",
    gradient: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
    icon: Sparkles,
  },
  /** Yield Farmer: active on DEX with high swap/offer volume and LP positions */
  "The Yield Farmer": {
    color: "#22C55E",
    gradient: "linear-gradient(135deg, #22C55E 0%, #15803D 100%)",
    icon: Leaf,
  },
  /** Hodler: long-term, low-activity wallet that prefers holding over trading */
  "The Hodler": {
    color: "#EAB308",
    gradient: "linear-gradient(135deg, #EAB308 0%, #92400E 100%)",
    icon: Vault,
  },
};

export function getArchetypeStyle(name: string): ArchetypeStyle {
  return ARCHETYPE_STYLES[name] ?? DEFAULT_STYLE;
}

export function archetypeImagePath(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/\s+/g, "-");
  return `/archetypes/${slug}.png`;
}
