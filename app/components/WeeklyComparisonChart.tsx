"use client";

/**
 * WeeklyComparisonChart
 *
 * Pure-SVG responsive bar chart comparing weekly transaction activity
 * derived from the 1w / 2w / 1m multi-timeframe results.
 *
 * Data derivation:
 *   week1 (current)  = 1w.totalTransactions
 *   week2            = 2w.totalTransactions - 1w.totalTransactions
 *   week3+4          = (1m.totalTransactions - 2w.totalTransactions) / 2  (estimated)
 *
 * Zero-data weeks render as empty bars (height 0) with no errors.
 */

import React from "react";

interface WeekData {
  label: string;
  value: number;
  isCurrent: boolean;
}

interface WeeklyComparisonChartProps {
  tx1w: number;
  tx2w: number;
  tx1m: number;
}

export function WeeklyComparisonChart({ tx1w, tx2w, tx1m }: WeeklyComparisonChartProps) {
  const week2 = Math.max(0, tx2w - tx1w);
  const remaining = Math.max(0, tx1m - tx2w);
  const week3 = Math.round(remaining / 2);
  const week4 = remaining - week3;

  const weeks: WeekData[] = [
    { label: "4w ago", value: week4, isCurrent: false },
    { label: "3w ago", value: week3, isCurrent: false },
    { label: "2w ago", value: week2, isCurrent: false },
    { label: "This week", value: tx1w, isCurrent: true },
  ];

  const max = Math.max(...weeks.map((w) => w.value), 1);

  const BAR_W = 18; // % width per bar
  const GAP = (100 - weeks.length * BAR_W) / (weeks.length + 1); // % gap

  return (
    <div className="w-full" aria-label="Weekly transaction comparison chart">
      {/* SVG chart — uses viewBox so it scales at all breakpoints */}
      <svg
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        className="w-full h-32 sm:h-40"
        role="img"
        aria-label="Bar chart showing weekly transactions"
      >
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = 140 - ratio * 120;
          return (
            <line
              key={ratio}
              x1={0}
              y1={y}
              x2={400}
              y2={y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
          );
        })}

        {/* Bars */}
        {weeks.map((week, i) => {
          const barHeight = week.value === 0 ? 0 : Math.max(4, (week.value / max) * 120);
          const x = (GAP + i * (BAR_W + GAP)) * 4; // scale to 400-wide viewBox
          const barW = BAR_W * 4;
          const y = 140 - barHeight;

          return (
            <g key={week.label}>
              {/* Empty bar outline always visible */}
              <rect
                x={x}
                y={20}
                width={barW}
                height={120}
                rx={6}
                fill="rgba(255,255,255,0.04)"
              />
              {/* Filled bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={barHeight}
                rx={6}
                fill={week.isCurrent ? "#10b981" : "rgba(16,185,129,0.4)"}
              />
              {/* Value label */}
              {week.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="rgba(255,255,255,0.7)"
                >
                  {week.value}
                </text>
              )}
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={0} y1={140} x2={400} y2={140} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-around mt-1">
        {weeks.map((week) => (
          <span
            key={week.label}
            className={`text-[10px] sm:text-xs text-center ${
              week.isCurrent ? "text-emerald-400 font-semibold" : "text-gray-500"
            }`}
          >
            {week.label}
          </span>
        ))}
      </div>
    </div>
  );
}
