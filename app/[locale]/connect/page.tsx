"use client";

import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
  FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  XCircle,
  Copy,
  ChevronRight,
  QrCode,
} from "lucide-react";
import { logger } from "@/app/utils/logger";
import { Horizon } from "stellar-sdk";
import { useTranslations } from "next-intl";
import { useWrapStore } from "../../store/wrapStore";
import { useTransactionStore } from "../../store/transactionStore";
import { useMultiTimeframeStore } from "../../store/multiTimeframeStore";
import { useWalletStore } from "../../store/walletStore";
import { useSound } from "../../hooks/useSound";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useStellarAddressValidation } from "../../../src/hooks/useStellarAddressValidation";
import { ProgressIndicator } from "../../components/ProgressIndicator";
import { MuteToggle } from "../../components/MuteToggle";
import {
  connectFreighter,
  getFreighterNetwork,
  connectAlbedo,
  connectXBull,
  isXBullInstalled,
  NetworkMismatchError,
} from "../../utils/walletConnect";
import { connectWalletConnect } from "../../utils/walletConnectManager";
import { getHorizonServer } from "../../utils/stellarClient";
import { SOUND_NAMES } from "../../utils/soundManager";
import {
  DEMO_STELLAR_ADDRESS,
  markDemoMode,
  clearDemoMode,
} from "@/app/data/demoAccount";
import { useRouter } from "next/navigation";

const log = logger.child("connect");