import { mockData } from "@/app/data/mockData";
import type { DappInfo, IndexerResult } from "@/app/utils/indexer";
import type { WrapResult } from "@/app/store/wrapStore";

function mapIndexerDapps(dapps: DappInfo[]) {
  return dapps.map((dapp) => ({
    name: dapp.name,
    interactions: dapp.transactionCount,
  }));
}

function mapMockDapps() {
  return mockData.dapps.map((dapp) => ({
    name: dapp.name,
    interactions: dapp.transactions,
    color: dapp.color,
    gradient: dapp.gradient,
  }));
}

export function mapIndexerResultToWrapResult(
  indexerResult: IndexerResult,
): WrapResult {
  return {
    username: mockData.username,
    totalTransactions: indexerResult.totalTransactions || mockData.transactions,
    percentile: mockData.percentile,
    dapps: indexerResult.dapps?.length
      ? mapIndexerDapps(indexerResult.dapps)
      : mapMockDapps(),
    vibes: mockData.vibes,
    persona: mockData.persona,
    personaDescription: mockData.personaDescription,
    portfolioDiversitySummary: indexerResult.portfolioDiversitySummary,
    biggestDaySummary: indexerResult.biggestDaySummary,
    dexTradingSummary: indexerResult.dexTradingSummary,
    sorobanBuilderSummary: indexerResult.sorobanBuilderSummary,
    largestTransaction: indexerResult.largestTransaction,
  };
}

export function getMockWrapResult(): WrapResult {
  return {
    username: mockData.username,
    totalTransactions: mockData.transactions,
    percentile: mockData.percentile,
    dapps: mapMockDapps(),
    vibes: mockData.vibes,
    persona: mockData.persona,
    personaDescription: mockData.personaDescription,
    largestTransaction: { amount: 4250.5, assetCode: "XLM" },
  };
}
