/**
 * Freighter service - re-exports wallet connection helpers from walletConnect utils.
 * This shim keeps connect/page.tsx imports stable while the underlying implementation
 * lives in app/utils/walletConnect.ts.
 */
export {
  connectFreighter,
  isFreighterInstalled,
  getCurrentPublicKey,
} from "@/app/utils/walletConnect";

/**
 * Persists the most-recently used Stellar address in localStorage so the
 * connect page can offer a quick "Continue as …" shortcut on next visit.
 */
export function saveAddressToLocalStorage(address: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("lastUsedStellarAddress", address);
  }
}

/**
 * Removes the persisted address from localStorage.
 */
export function clearSavedAddress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("lastUsedStellarAddress");
  }
}
