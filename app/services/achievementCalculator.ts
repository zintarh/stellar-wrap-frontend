/**
 * Achievement calculator
 * Processes transaction data to calculate user metrics and achievements
 * 
 * Categories transactions by type (payments, swaps, contract calls)
 * Calculates volumes, tracks assets, detects contract interactions
 * Groups transactions by timeframe for analysis
 */

import { IndexerResult, DappInfo, VibeTag, DexTradingSummary, SorobanDeployment, SorobanBuilderSummary } from "@/app/utils/indexer";

/**
 * Raw transaction from Horizon API
 */
interface Transaction {
  id?: string;
  created_at: string;
  memo?: string;
  memo_type?: string;
  operations?: Operation[];
  successful?: boolean;
  fee_charged?: string;
}

/**
 * Operation within a transaction
 */
interface Operation {
  type: string;
  amount?: string;
  asset_code?: string;
  asset_type?: string;
  from?: string;
  to?: string;
  asset_issuer?: string;
  source_amount?: string;
  destination_amount?: string;
  destination_asset_code?: string;
  source_asset_code?: string;
  memo?: string;
  contract?: string;
  contract_id?: string;
  function?: string;
}

/**
 * Transaction categorization by type
 */
interface TransactionCategories {
  payments: number;
  swaps: number;
  contractCalls: number;
  offers: number;
  trustlines: number;
  other: number;
}

export type PersonaArchetype =
  | "The Architect"
  | "The Patron"
  | "The Collector"
  | "The Trader"
  | "The Wizard"
  | "The Explorer";

export interface PersonaAssignmentInput {
  categories: TransactionCategories;
  deploymentCount: number;
  contractCallCount: number;
  defiTraderCount: number;
  dexTradeCount: number;
  totalVolume: number;
  txCount: number;
}

/**
 * DApp detection keywords for common platforms
 */
const DAPP_KEYWORDS = {
  "stellar.expert": { name: "Stellar Expert", icon: "📊" },
  "stellarx": { name: "StellarX", icon: "📈" },
  "aqua": { name: "Aqua", icon: "💧" },
  "lobstr": { name: "LOBSTR", icon: "🦞" },
  soroban: { name: "Soroban", icon: "⚡" },
  swap: { name: "DEX", icon: "🔄" },
  lp: { name: "Liquidity Pool", icon: "💧" },
  bridge: { name: "Bridge", icon: "🌉" },
  payment: { name: "Payments", icon: "💳" },
};

/**
 * Main achievement calculation function
 * Analyzes transactions and returns comprehensive metrics
 * 
 * @param transactions Array of transaction records from Horizon API
 * @returns IndexerResult with calculated achievements and metrics
 */
export function calculateAchievements(
  transactions: Transaction[],
): IndexerResult {
  // Handle empty transaction array
  if (!transactions || transactions.length === 0) {
    return {
      accountId: "",
      totalTransactions: 0,
      totalVolume: 0,
      mostActiveAsset: "XLM",
      contractCalls: 0,
      gasSpent: 0,
      dapps: [],
      vibes: [{ tag: "Getting Started", count: 0 }],
      persona: "The Explorer",
      dexTradingSummary: {
        totalVolume: 0,
        tradeCount: 0,
        buyCount: 0,
        sellCount: 0,
      },
      sorobanBuilderSummary: {
        deployments: [],
        deploymentCount: 0,
        contractCallCount: 0,
        builderScore: 0,
      },
      portfolioDiversitySummary: {
        score: 0,
        label: "Mono-asset",
        uniqueAssetsCount: 0,
        topAssets: [],
      },
      biggestDaySummary: {
        date: "",
        transactionCount: 0,
        typeBreakdown: {},
        topActivity: "None",
        tagline: "A chill day on Stellar",
        busiestDayOfWeek: "None",
      }
    };
  }

  // Initialize trackers
  let totalVolume = 0;
  let totalGasSpent = 0;
  const assetMap = new Map<string, number>(); // asset -> operation count
  const assetVolumeMap = new Map<string, number>(); // asset -> total volume
  const dappMap = new Map<string, DappInfo>();
  const vibeMap = new Map<string, number>();
  const categories: TransactionCategories = {
    payments: 0,
    swaps: 0,
    contractCalls: 0,
    offers: 0,
    trustlines: 0,
    other: 0,
  };

  // DEX trading summary trackers
  const dexTrackers = {
    totalVolume: 0,
    tradeCount: 0,
    buyCount: 0,
    sellCount: 0,
    pairMap: new Map<string, number>(), // pair -> trade count
  };

  // Soroban builder summary trackers
  const sorobanTrackers = {
    deployments: [] as SorobanDeployment[],
    contractCallCount: 0,
  };

  // Additional metrics tracking
  let largestTransaction = 0;
  let largestTransactionAsset = "XLM";
  const counterparties = new Set<string>();
  
  const dailyStats = new Map<string, DailyStats>();
  const dayOfWeekCount = new Array(7).fill(0);

  // Process each transaction
  transactions.forEach((tx: Transaction) => {
    // Skip invalid or failed transactions
    if (tx.successful === false) return;
    if (!tx.operations || tx.operations.length === 0) return;

    // Track gas spent
    if (tx.fee_charged) {
      totalGasSpent += parseFloat(tx.fee_charged) / 10000000; // Convert stroops to XLM
    }

    // Track daily activity
    const dateObj = new Date(tx.created_at);
    const txDate = dateObj.toISOString().split('T')[0];
    if (!dailyStats.has(txDate)) {
      dailyStats.set(txDate, { txCount: 0, categories: {} });
    }
    const dayStat = dailyStats.get(txDate)!;
    dayStat.txCount++;
    dayOfWeekCount[dateObj.getDay()]++;

    // Process each operation in the transaction
    tx.operations.forEach((op: Operation) => {
      const operationType = op.type;

      // Categorize operation type
      switch (operationType) {
        case "payment":
        case "create_account":
          categories.payments++;
          dayStat.categories.payments = (dayStat.categories.payments || 0) + 1;
          processPaymentOperation(op, tx, assetMap, assetVolumeMap, dappMap, counterparties);
          break;

        case "path_payment_strict_receive":
        case "path_payment_strict_send":
          categories.swaps++;
          dayStat.categories.swaps = (dayStat.categories.swaps || 0) + 1;
          processPathPaymentOperation(op, assetMap, assetVolumeMap, vibeMap, dexTrackers);
          break;

        case "invoke_host_function":
          categories.contractCalls++;
          // Check if this is a contract deployment (HostFunctionTypeCreateContract)
          // We'll assume the function field or asset/contract field indicates deployment
          processContractOperation(op, dappMap, isDeployment, sorobanTrackers, tx);
          if (isDeployment) {
            vibeMap.set("soroban-user", (vibeMap.get("soroban-user") || 0) + 5); // Boost for deployments
          } else {
            vibeMap.set("soroban-user", (vibeMap.get("soroban-user") || 0) + 1);
          }
          break;

        case "extend_footprint_ttl":
        case "restore_footprint":
          categories.contractCalls++;
          dayStat.categories.contractCalls = (dayStat.categories.contractCalls || 0) + 1;
          sorobanTrackers.contractCallCount++;
          vibeMap.set("soroban-user", (vibeMap.get("soroban-user") || 0) + 1);
          break;

        case "manage_buy_offer":
        case "manage_sell_offer":
        case "create_passive_sell_offer":
          categories.offers++;
          dayStat.categories.offers = (dayStat.categories.offers || 0) + 1;
          processOfferOperation(op, assetMap, vibeMap, dexTrackers);
          break;

        case "change_trust":
        case "allow_trust":
        case "set_trust_line_flags":
          categories.trustlines++;
          dayStat.categories.trustlines = (dayStat.categories.trustlines || 0) + 1;
          break;

        default:
          categories.other++;
          dayStat.categories.other = (dayStat.categories.other || 0) + 1;
      }

      // Track largest transaction
      const amount = parseFloat(op.amount || op.source_amount || op.destination_amount || "0");
      if (amount > largestTransaction) {
        largestTransaction = amount;
        largestTransactionAsset =
          op.asset_code || op.destination_asset_code || op.source_asset_code || "XLM";
      }
    });
  });

  // Calculate total volume from asset volumes
  assetVolumeMap.forEach((volume) => {
    totalVolume += volume;
  });

  // Determine most active asset by operation count
  let mostActiveAsset = "XLM";
  let maxCount = 0;
  assetMap.forEach((count, asset) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveAsset = asset;
    }
  });

  // Generate vibe tags based on activity patterns
  const vibes = generateVibes(
    transactions.length,
    totalVolume,
    categories.contractCalls,
    vibeMap,
    assetMap,
  );


  return {
    accountId: "",
    totalTransactions: transactions.length,
    totalVolume,
    mostActiveAsset,
    contractCalls: categories.contractCalls,
    gasSpent: totalGasSpent,
    dapps: Array.from(dappMap.values()).sort(
      (a, b) => b.transactionCount - a.transactionCount || b.volume - a.volume,
    ),
    vibes,
  };
}

/**
 * Track Soroban contract interactions as dApp entries (address used when name is unknown).
 */
function processContractOperation(
  op: Operation,
  dappMap: Map<string, DappInfo>,
  isDeployment: boolean,
  sorobanTrackers: { deployments: SorobanDeployment[], contractCallCount: number },
  tx: Transaction,
): void {
  const contractId = op.contract_id || op.contract;
  if (!contractId) {
    if (!isDeployment) sorobanTrackers.contractCallCount++;
    return;
  }

  const existing = dappMap.get(contractId) || {
    name: contractId,
    icon: "📜",
    volume: 0,
    transactionCount: 0,
  };
  existing.transactionCount += 1;
  dappMap.set(contractId, existing);

  if (isDeployment) {
    sorobanTrackers.deployments.push({
      contractId: contractId,
      deploymentDate: tx.created_at,
      transactionHash: tx.id || "",
    });
  } else {
    sorobanTrackers.contractCallCount++;
  }
}

/**
 * Process payment operation to track volume and assets
 */
function processPaymentOperation(
  op: Operation,
  tx: Transaction,
  assetMap: Map<string, number>,
  assetVolumeMap: Map<string, number>,
  dappMap: Map<string, DappInfo>,
  counterparties: Set<string>,
): void {
  const amount = op.amount ? parseFloat(op.amount) : 0;
  const asset = op.asset_code || "XLM";

  // Track asset usage
  assetMap.set(asset, (assetMap.get(asset) || 0) + 1);
  assetVolumeMap.set(asset, (assetVolumeMap.get(asset) || 0) + amount);

  // Track counterparties
  if (op.from) counterparties.add(op.from);
  if (op.to) counterparties.add(op.to);

  // Detect dapps from memo
  const memo = (op.memo || tx.memo || "").toLowerCase();
  if (memo) {
    Object.entries(DAPP_KEYWORDS).forEach(([keyword, dapp]) => {
      if (memo.includes(keyword)) {
        const key = dapp.name;
        const existing = dappMap.get(key) || {
          name: key,
          icon: dapp.icon,
          volume: 0,
          transactionCount: 0,
        };
        existing.volume += amount;
        existing.transactionCount += 1;
        dappMap.set(key, existing);
      }
    });
  }
}

/**
 * Process path payment (swap) operation
 */
function processPathPaymentOperation(
  op: Operation,
  assetMap: Map<string, number>,
  assetVolumeMap: Map<string, number>,
  vibeMap: Map<string, number>,
  dexTrackers: { totalVolume: number; tradeCount: number; buyCount: number; sellCount: number; pairMap: Map<string, number> },
): void {
  const sourceAmount = op.source_amount ? parseFloat(op.source_amount) : 0;
  const destAmount = op.destination_amount ? parseFloat(op.destination_amount) : 0;
  const sourceAsset = op.source_asset_code || "XLM";
  const destAsset = op.destination_asset_code || "XLM";

  // Track both assets involved in swap
  assetMap.set(sourceAsset, (assetMap.get(sourceAsset) || 0) + 1);
  assetMap.set(destAsset, (assetMap.get(destAsset) || 0) + 1);
  assetVolumeMap.set(sourceAsset, (assetVolumeMap.get(sourceAsset) || 0) + sourceAmount);
  assetVolumeMap.set(destAsset, (assetVolumeMap.get(destAsset) || 0) + destAmount);

  // Track DEX summary
  const pair = [sourceAsset, destAsset].sort().join("/");
  dexTrackers.pairMap.set(pair, (dexTrackers.pairMap.get(pair) || 0) + 1);
  // For simplicity, we'll use sourceAmount as part of volume (assume source asset is XLM if possible)
  dexTrackers.totalVolume += sourceAmount;
  dexTrackers.tradeCount += 1;
  dexTrackers.buyCount += 1;
  dexTrackers.sellCount += 1;

  vibeMap.set("bridge-warrior", (vibeMap.get("bridge-warrior") || 0) + 1);
}

/**
 * Process offer (trading) operation
 */
function processOfferOperation(
  op: Operation,
  assetMap: Map<string, number>,
  vibeMap: Map<string, number>,
  dexTrackers: { totalVolume: number; tradeCount: number; buyCount: number; sellCount: number; pairMap: Map<string, number> },
): void {
  const asset = op.asset_code || "XLM";
  assetMap.set(asset, (assetMap.get(asset) || 0) + 1);
  vibeMap.set("defi-trader", (vibeMap.get("defi-trader") || 0) + 1);

  // Track DEX summary
  dexTrackers.tradeCount += 1;
  if (op.type === "manage_buy_offer") {
    dexTrackers.buyCount += 1;
  } else {
    dexTrackers.sellCount += 1;
  }
  // Since we don't have counter asset or price data for offers, skip volume and pair tracking for now
}

/**
 * Assign a persona archetype based on dominant on-chain activity patterns.
 */
export function assignPersona(input: PersonaAssignmentInput): PersonaArchetype {
  const {
    categories,
    deploymentCount,
    contractCallCount,
    defiTraderCount,
    dexTradeCount,
    totalVolume,
    txCount,
  } = input;

  // Soroban Architect: contract deployments or sustained Soroban builder activity
  if (deploymentCount > 0 || contractCallCount >= 5) {
    return "The Architect";
  }

  // DeFi Patron: sustained liquidity and DEX offer activity
  if (defiTraderCount > 10 || dexTradeCount > 8) {
    return "The Patron";
  }

  // Diamond Hand / Collector: trustline accumulation with minimal trading
  if (
    categories.trustlines >= 3 &&
    categories.swaps + categories.offers < categories.trustlines
  ) {
    return "The Collector";
  }

  // Active swap and offer activity
  if (categories.swaps + categories.offers >= 5) {
    return "The Trader";
  }

  // High-volume or very active accounts
  if (totalVolume > 100_000 || txCount > 100) {
    return "The Wizard";
  }

  return "The Explorer";
}

function buildDexTradingSummary(
  dexTrackers: {
    totalVolume: number;
    tradeCount: number;
    buyCount: number;
    sellCount: number;
    pairMap: Map<string, number>;
  },
): DexTradingSummary {
  let mostTradedPair: string | undefined;
  let maxPairCount = 0;
  dexTrackers.pairMap.forEach((count, pair) => {
    if (count > maxPairCount) {
      maxPairCount = count;
      mostTradedPair = pair;
    }
  });

  return {
    totalVolume: dexTrackers.totalVolume,
    tradeCount: dexTrackers.tradeCount,
    buyCount: dexTrackers.buyCount,
    sellCount: dexTrackers.sellCount,
    ...(mostTradedPair ? { mostTradedPair } : {}),
  };
}

function buildSorobanBuilderSummary(
  sorobanTrackers: {
    deployments: SorobanDeployment[];
    contractCallCount: number;
  },
): SorobanBuilderSummary {
  const deploymentCount = sorobanTrackers.deployments.length;
  const contractCallCount = sorobanTrackers.contractCallCount;
  const builderScore = deploymentCount * 100 + Math.floor(contractCallCount / 10);

  return {
    deployments: sorobanTrackers.deployments,
    deploymentCount,
    contractCallCount,
    builderScore,
  };
}

/**
 * Generate vibe tags based on user activity patterns
 */
export function generateVibes(
  txCount: number,
  totalVolume: number,
  contractCalls: number,
  vibeMap: Map<string, number>,
  assetMap: Map<string, number>,
): VibeTag[] {
  const vibes: VibeTag[] = [];

  // Volume-based vibes
  if (totalVolume > 1000000) {
    vibes.push({ tag: "Whale", count: txCount });
  } else if (totalVolume > 100000) {
    vibes.push({ tag: "High Roller", count: txCount });
  } else if (totalVolume > 10000) {
    vibes.push({ tag: "Active Trader", count: txCount });
  }

  // Transaction frequency vibes
  if (txCount > 500) {
    vibes.push({ tag: "Power User", count: txCount });
  } else if (txCount > 100) {
    vibes.push({ tag: "Active", count: txCount });
  } else if (txCount > 10) {
    vibes.push({ tag: "Regular", count: txCount });
  } else if (txCount > 0) {
    vibes.push({ tag: "Selective", count: txCount });
  }

  // Contract interaction vibes
  if (contractCalls > 50) {
    vibes.push({ tag: "Soroban Power User", count: contractCalls });
  } else if (contractCalls > 10) {
    vibes.push({ tag: "Soroban Explorer", count: contractCalls });
  } else if (contractCalls > 0) {
    vibes.push({ tag: "Contract Curious", count: contractCalls });
  }

  // Special activity vibes
  if (vibeMap.has("bridge-warrior") && (vibeMap.get("bridge-warrior") || 0) > 5) {
    vibes.push({
      tag: "Bridge Master",
      count: vibeMap.get("bridge-warrior") || 0,
    });
  }

  if (vibeMap.has("defi-trader") && (vibeMap.get("defi-trader") || 0) > 10) {
    vibes.push({
      tag: "DeFi Enthusiast",
      count: vibeMap.get("defi-trader") || 0,
    });
  }

  // Multi-asset user
  if (assetMap.size > 5) {
    vibes.push({ tag: "Asset Diversifier", count: assetMap.size });
  }

  // Return at least one vibe
  if (vibes.length === 0) {
    vibes.push({ tag: "Stellar Explorer", count: txCount });
  }

  return vibes;
}
