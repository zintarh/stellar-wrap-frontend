import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import { WalletConnectModule } from "@creit-tech/stellar-wallets-kit/modules/wallet-connect";
import { transactionObserver } from "../../services/transactionObserver";

// Contract address from environment variable with fallback placeholder
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

if (!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
  console.warn(
    "⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS not set. Using placeholder contract address.",
  );
}

// Initialize StellarWalletsKit for testnet
let isInitialized = false;

export function initWalletKit(): void {
  if (!isInitialized && typeof window !== "undefined") {
    StellarWalletsKit.init({
      modules: [
        ...defaultModules(),
        new WalletConnectModule({
          projectId:
            process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
            "stellar-wrapped-2026",
          metadata: {
            name: "Stellar Wrapped",
            description: "Your blockchain story told like never before",
            icons: ["https://stellar.org/favicon.ico"],
            url: window.location.origin,
          },
        }),
      ],
    });
    isInitialized = true;
  }
}

/**
 * Mint the user's Stellar Wrapped as a Soulbound Token NFT
 * @param userAddress - The connected Stellar wallet address
 * @returns Transaction hash on success
 * @throws Error if minting fails or user rejects transaction
 */
export async function mintWrap(userAddress: string): Promise<string> {
  try {
    // Ensure wallet kit is initialized
    initWalletKit();

    transactionObserver.startTransaction();

    // The actual implementation will construct the transaction here.
    // Transitioning to 'simulating' (this is where we'd call Soroban RPC simulateTransaction)
    transactionObserver.markSimulating();

    // Since contract logic is blocked on Issue #37, this will throw the error.
    // In actual implementation, we'd proceed to markSimulated(), ask for wallet signature (markSigning()),
    // markSigned(), and markSubmitting() -> markSubmitted(txHash).
    const txHash = await invokeMintWrapContract(userAddress);

    return txHash;
  } catch (error) {
    if (error instanceof Error) {
      transactionObserver.markFailed(error);
      throw new Error(`Minting failed: ${error.message}`);
    }
    const genericError = new Error("Minting failed: Unknown error occurred");
    transactionObserver.markFailed(genericError);
    throw genericError;
  }
}

/**
 * Internal function to invoke the mint_wrap contract function
 * This is a placeholder that will be replaced with actual Soroban contract invocation
 */
async function invokeMintWrapContract(userAddress: string): Promise<string> {
  // TODO: Replace this placeholder with actual Soroban contract invocation
  // when the contract engineer provides the contract details

  throw new Error(
    "Contract integration pending. The mint_wrap function will be implemented by the contract engineer. " +
      `Contract address: ${CONTRACT_ADDRESS}, User: ${userAddress}`,
  );
}
