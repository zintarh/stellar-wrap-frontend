/**
 * Utility formatters for locale-aware numbers, dates, percentages, and XLM amounts.
 */

/**
 * XLM amounts must be formatted distinctly from ordinary numbers:
 * exactly 7 decimal places, never locale-grouped with ambiguous separators.
 */
export function formatXlmAmount(amount: number | string | bigint): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return "0.0000000";
  return num.toFixed(7);
}

/**
 * Format a number using the specified locale (or default fallback).
 */
export function formatNumberLocale(
  value: number,
  locale: string = "en",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a percentage using the specified locale.
 */
export function formatPercentLocale(
  value: number,
  locale: string = "en",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}

/**
 * Format a date using the specified locale.
 */
export function formatDateLocale(
  date: Date | number | string,
  locale: string = "en",
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(d);
}
