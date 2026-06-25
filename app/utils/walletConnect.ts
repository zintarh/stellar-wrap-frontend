import { isConnected, getAddress, requestAccess } from "@stellar/freighter-api";
import { Network } from "../../src/config";

interface AlbedoPublicKeyResult {
  publicKey: string;
}

interface Albedo {
  publicKey: (params?: Record<string, unknown>) => Promise<AlbedoPublicKeyResult>;
}

declare global {
  interface Window {
    albedo?: Albedo;
  }
}

/**
 * Checks if Freighter wallet extension is installed
 */
export const isFreighterInstalled = async (): Promise<boolean> => {
  try {
    const result = await isConnected();
    return !result.error && result.isConnected;
  } catch {
    return false;
  }
};

/**
 * Connects to Freighter wallet and returns the user's public key
 * @param _network - The network to connect to (mainnet or testnet)
 * @throws {Error} If wallet is not installed, user rejects connection, or any other error occurs
 */
export const connectFreighter = async (_network: Network): Promise<string> => {
  // Check if Freighter is installed
  const installed = await isFreighterInstalled();

  if (!installed) {
    throw new Error(
      "Freighter wallet not found. Please install the Freighter browser extension.",
    );
  }

  try {
    // Request access to the wallet
    // Note: Freighter API doesn't directly support network parameter in requestAccess,
    // but the network context is available for future network-specific operations
    const accessResult = await requestAccess();

    if (accessResult.error || !accessResult.address) {
      throw new Error(
        "Connection rejected. Please approve the connection in Freighter.",
      );
    }

    // Return the address from requestAccess (it already provides the address)
    // The network parameter can be used for subsequent operations like transaction signing
    return accessResult.address;
  } catch (error: unknown) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message?.includes("User declined")) {
        throw new Error("Connection rejected by user.");
      }
      throw error;
    }

    throw new Error("Failed to connect to Freighter wallet. Please try again.");
  }
};

/**
 * Gets the currently connected public key without requesting access
 * Returns null if not connected or if Freighter is not installed
 */
export const getCurrentPublicKey = async (): Promise<string | null> => {
  try {
    const installed = await isFreighterInstalled();
    if (!installed) {
      return null;
    }

    const addressResult = await getAddress();
    return addressResult.error ? null : addressResult.address;
  } catch {
    return null;
  }
};

/**
 * Checks if Albedo wallet is available (SDK loaded via script tag)
 */
export const isAlbedoInstalled = (): boolean => {
  return typeof window !== "undefined" && typeof (window as unknown as Record<string, unknown>).albedo !== "undefined";
};

/**
 * Connects to Albedo wallet and returns the user's public key
 * Albedo uses a popup-based flow at https://albedo.link
 * @throws {Error} If Albedo is not available, popup is blocked, or user rejects
 */
export const connectAlbedo = async (_network: Network): Promise<string> => {
  if (!isAlbedoInstalled()) {
    throw new Error(
      "Albedo wallet not found. Please ensure the Albedo SDK script is loaded.",
    );
  }

  try {
    const albedo = (window as unknown as Record<string, { publicKey: (opts?: Record<string, unknown>) => Promise<{ publicKey: string }> }>).albedo;
    const result = await albedo.publicKey();
    return result.publicKey;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message?.includes("blocked") || error.message?.includes("popup")) {
        throw new Error(
          "Albedo popup was blocked. Please allow popups for this site and try again.",
        );
      }
      if (error.message?.includes("cancel") || error.message?.includes("denied")) {
        throw new Error("Connection rejected by user.");
      }
      throw error;
    }
    throw new Error("Failed to connect to Albedo wallet. Please try again.");
  }
};

/**
 * Validates if a string is a valid Stellar public key address
 * Stellar addresses:
 * - Start with 'G'
 * - Are exactly 56 characters long
 * - Use base32 encoding (characters A-Z and 2-7)
 * @param address The address string to validate
 * @returns True if valid Stellar address, false otherwise
 */
/**
 * Connects to Albedo wallet via browser extension and returns the user's public key
 * @throws {Error} If Albedo is not installed, popup is blocked, or user rejects
 */
export const connectAlbedo = async (): Promise<string> => {
  if (typeof window === "undefined" || !window.albedo) {
    throw new Error(
      "Albedo wallet not found. Please install the Albedo browser extension.",
    );
  }

  try {
    const result = await window.albedo.publicKey();
    return result.publicKey;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message?.toLowerCase().includes("popup") ||
        error.message?.toLowerCase().includes("blocked")
      ) {
        throw new Error(
          "Albedo popup was blocked by your browser. Please allow popups for this site.",
        );
      }
      if (error.message?.toLowerCase().includes("declined")) {
        throw new Error("Connection rejected by user.");
      }
      throw error;
    }
    throw new Error("Failed to connect to Albedo wallet. Please try again.");
  }
};

export const isValidStellarAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmedAddress = address.trim();

  // Check if starts with 'G' and is 56 characters
  if (!trimmedAddress.startsWith("G") || trimmedAddress.length !== 56) {
    return false;
  }

  // Check if all characters are valid base32 (A-Z, 2-7)
  const base32Regex = /^[A-Z2-7]{56}$/;
  return base32Regex.test(trimmedAddress);
};
