"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Share2, Link2, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useNativeShare } from "@/app/hooks/useNativeShare";
import { mockData } from "@/app/data/mockData";
import { GOLDEN_USER } from "@/src/data/mockData";
import { ProgressIndicator } from "@/app/components/ProgressIndicator";
import { MuteToggle } from "@/app/components/MuteToggle";
import { ShareCard } from "@/app/components/ShareCard";
import { ShareImageCard } from "@/app/components/ShareImageCard";
import { ShareImageCardStories } from "@/app/components/ShareImageCardStories";
import { useTheme, themeColors } from "@/app/context/ThemeContext";
import { useWrapStore } from "@/app/store/wrapStore";
import {
  XIcon,
  WhatsAppIcon,
  FacebookIcon,
  LinkedInIcon,
  TelegramIcon,
} from "@/app/components/SocialIcons";
import { trackEvent } from "@/app/utils/plausible";
import {
  buildSharePreviewSearchParams,
  hasSharePreviewParams,
  parseSharePreviewParams,
  type SharePreviewState,
} from "@/app/utils/sharePreviewParams";
import { getStellarExpertAccountUrl } from "@/app/utils/stellarExpert";
import { isZeroActivityResult } from "@/app/utils/zeroActivity";
import { ZeroActivityEmptyState } from "@/app/components/ZeroActivityEmptyState";
import {
  useReducedMotion,
  reducedMotionTransition,
} from "@/app/hooks/useReducedMotion";