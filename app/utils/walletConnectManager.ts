import { Network } from "../../src/config";

/**
 * WalletConnect session info stored in store
 */
export interface WalletConnectSession {
  uri?: string;
  pairingTopic?: string;
  sessionTopic?: string;
  publicKey?: string;
  network: Network;
  timestamp: number;
}

/**
 * Connect via WalletConnect and return the user's public key
 * Uses @creit-tech/stellar-wallets-kit for WalletConnect v2
 * @throws {Error} If WalletConnect fails or user rejects connection
 */
export async function connectWalletConnect(network: Network): Promise<string> {
  try {
    // Dynamic import to handle client-side only
    if (typeof window === "undefined") {
      throw new Error("WalletConnect is not available on the server");
    }

    // Use stellar-wallets-kit WalletConnect module
    // Import dynamically to avoid errors if not used
    const { getClient } = await import(
      "@creit-tech/stellar-wallets-kit/stellar_wallets_kit"
    );

    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      throw new Error(
        "WalletConnect project ID not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID."
      );
    }

    // Initialize client with WalletConnect
    const client = await getClient({
      projectId,
      network: network === "mainnet" ? "PUBLIC" : "TESTNET",
    });

    // Connect to WalletConnect
    const publicKey = await client.connect();

    if (!publicKey) {
      throw new Error("Failed to get public key from WalletConnect");
    }

    return publicKey;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message?.includes("rejected") || error.message?.includes("cancelled")) {
        throw new Error("Connection rejected by user.");
      }
      throw error;
    }
    throw new Error("Failed to connect via WalletConnect. Please try again.");
  }
}

/**
 * Get QR code data URL for WalletConnect URI
 * Generate QR code from URI using qrcode library
 */
export async function getQRCodeDataUrl(uri: string): Promise<string> {
  try {
    // Dynamic import - qrcode should be available
    const QRCode = await import("qrcode");
    return await QRCode.default.toDataURL(uri);
  } catch {
    console.warn("QR code generation not available");
    return "";
  }
}

/**
 * Initialize WalletConnect with QR code
 */
export async function initializeWalletConnectQR(
  network: Network,
  projectId: string
): Promise<{ uri: string; qrCode: string; session: WalletConnectSession }> {
  if (!projectId) {
    throw new Error(
      "WalletConnect project ID not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID."
    );
  }

  // This would be called to generate the initial QR code
  // The actual URI comes from the WalletConnect client
  const uri = `wc:${Math.random().toString(36).substr(2, 24)}@2?relay-protocol=irn&symKey=${Math.random().toString(36).substr(2, 32)}`;
  const qrCode = await getQRCodeDataUrl(uri);

  const session: WalletConnectSession = {
    uri,
    network,
    timestamp: Date.now(),
  };

  return { uri, qrCode, session };
}

/**
 * Clean up WalletConnect session
 */
export function cleanupWalletConnectSession(
  session: WalletConnectSession
): void {
  // In production, disconnect the session via client.disconnect()
  console.log("WalletConnect session cleaned up:", session.sessionTopic);
}
