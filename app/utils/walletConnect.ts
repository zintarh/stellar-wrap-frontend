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
 * Checks if the Freighter browser extension is available.
 */
export const isFreighterInstalled = async (): Promise<boolean> => {
  if (typeof window === "undefined") {
    return false;
  }

  if ("freighter" in window && window.freighter) {
    return true;
  }

  try {
    const result = await isConnected();
    return !result.error;
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
  const installed = await isFreighterInstalled();

  if (!installed) {
    throw new Error(
      "Freighter wallet not found. Please install the Freighter browser extension.",
    );
  }

  try {
    const accessResult = await requestAccess();

    if (accessResult.error || !accessResult.address) {
      throw new Error(
        "Connection rejected. Please approve the connection in Freighter.",
      );
    }

    return accessResult.address;
  } catch (error: unknown) {
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
 * Checks if Albedo wallet is available
 */
export const isAlbedoInstalled = (): boolean => {
  return typeof window !== "undefined" && typeof window.albedo !== "undefined";
};

/**
 * Connects to Albedo wallet and returns the user's public key
 * @param _network - The network to connect to (mainnet or testnet)
 * @throws {Error} If Albedo is not available, popup is blocked, or user rejects
 */
export const connectAlbedo = async (_network: Network): Promise<string> => {
  if (!isAlbedoInstalled() || !window.albedo) {
    throw new Error(
      "Albedo wallet not found. Please ensure the Albedo extension or script is loaded.",
    );
  }

  try {
    const result = await window.albedo.publicKey();
    return result.publicKey;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("blocked") || msg.includes("popup")) {
        throw new Error(
          "Albedo popup was blocked by your browser. Please allow popups for this site.",
        );
      }
      if (msg.includes("cancel") || msg.includes("denied") || msg.includes("declined")) {
        throw new Error("Connection rejected by user.");
      }
      throw error;
    }
    throw new Error("Failed to connect to Albedo wallet. Please try again.");
  }
};

/**
 * Validates if a string is a valid Stellar public key address
 * @param address The address string to validate
 * @returns True if valid Stellar address, false otherwise
 */
export const isValidStellarAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmedAddress = address.trim();

  if (!trimmedAddress.startsWith("G") || trimmedAddress.length !== 56) {
    return false;
  }

  const base32Regex = /^[A-Z2-7]{56}$/;
  return base32Regex.test(trimmedAddress);
};