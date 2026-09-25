import {
  formatXlmAmount,
  formatNumberLocale,
  formatPercentLocale,
  formatDateLocale,
} from "../app/utils/formatters";

describe("Locale-aware i18n formatting", () => {
  describe("formatXlmAmount", () => {
    test("formats XLM with exactly 7 fixed decimals", () => {
      expect(formatXlmAmount(4250.5)).toBe("4250.5000000");
      expect(formatXlmAmount(0)).toBe("0.0000000");
      expect(formatXlmAmount(123.456789123)).toBe("123.4567891");
    });

    test("never includes locale grouping separators in XLM decimals", () => {
      const formatted = formatXlmAmount(1000000.1234567);
      expect(formatted).toBe("1000000.1234567");
      expect(formatted).not.toContain(",");
    });
  });

  describe("formatNumberLocale", () => {
    test("formats numbers with explicit English locale", () => {
      expect(formatNumberLocale(1234567, "en")).toBe("1,234,567");
    });

    test("formats numbers with non-English locale (Spanish)", () => {
      const formatted = formatNumberLocale(1234567, "es");
      expect(formatted.replace(/\s/g, " ")).toMatch(/1[.,\s]234[.,\s]567/);
    });

    test("formats numbers with non-English locale (French)", () => {
      const formatted = formatNumberLocale(1234567, "fr");
      expect(formatted.replace(/\u202f|\xa0/g, " ")).toBe("1 234 567");
    });
  });

  describe("formatPercentLocale", () => {
    test("formats percentage with locale", () => {
      expect(formatPercentLocale(0.85, "en")).toBe("85%");
    });
  });

  describe("formatDateLocale", () => {
    test("formats dates with Spanish locale", () => {
      const date = new Date("2026-09-25T12:00:00Z");
      const formatted = formatDateLocale(date, "es", {
        month: "short",
        year: "numeric",
      });
      expect(formatted.toLowerCase()).toContain("2026");
    });

    test("formats dates with French locale", () => {
      const date = new Date("2026-09-25T12:00:00Z");
      const formatted = formatDateLocale(date, "fr", {
        month: "short",
        year: "numeric",
      });
      expect(formatted.toLowerCase()).toContain("2026");
    });
  });
});
