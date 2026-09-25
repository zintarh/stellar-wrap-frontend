"use client";

/**
 * MultiTimeframeStats
 *
 * Displays the indexing progress and results for all three timeframes
 * (1w, 2w, 1m) plus the comparative analysis summary.
 *
 * Issue #46
 */

import React, { lazy, Suspense } from "react";
import { useFormatter } from "next-intl";
import {
  useMultiTimeframeStore,
  selectIsComplete,
  selectFailedTimeframes,
} from "@/app/store/multiTimeframeStore";
import {
  TIMEFRAME_LABELS,
  Timeframe,
} from "@/app/services/multiTimeframeIndexer";
import { useWrapStore } from "@/app/store/wrapStore";

const WeeklyComparisonChart = lazy(() =>
  import("@/app/components/WeeklyComparisonChart").then((m) => ({
    default: m.WeeklyComparisonChart,
  })),
);