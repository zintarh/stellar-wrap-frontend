/**
 * Stellar Horizon client factory
 * Creates and manages Horizon server instances for different networks
 */

import { Horizon } from "@stellar/stellar-sdk";
import { NEXT_PUBLIC_RPC_ENDPOINTS } from "./indexer";
import { getIndexingAbortSignal } from "./indexingAbort";

type NetworkType = "mainnet" | "testnet";

function createServer(network: NetworkType): Horizon.Server {
  const url = NEXT_PUBLIC_RPC_ENDPOINTS[network];
  const signal = getIndexingAbortSignal();
  return new Horizon.Server(url, {
    allowHttp: url.startsWith("http://"),
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal: signal ?? init?.signal,
      }),
  });
}

const horizonServers: Record<NetworkType, Horizon.Server> = {
  mainnet: createServer("mainnet"),
  testnet: createServer("testnet"),
};

export function getHorizonServer(
  network: NetworkType = "mainnet",
): Horizon.Server {
  // Re-create when abort signal is active so fetch uses current signal
  if (getIndexingAbortSignal()) {
    return createServer(network);
  }
  return horizonServers[network];
}

export function validateAccountId(accountId: string): boolean {
  try {
    // Stellar account IDs start with 'G' and are 56 characters long
    return accountId.startsWith("G") && accountId.length === 56;
  } catch {
    return false;
  }
}
