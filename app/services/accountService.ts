/**
 * Account preview service — fetches lightweight account metadata (XLM balance
 * and total operation count) for display on the connect screen.
 *
 * Results are stored in module-level state so the connect page can read them
 * back via the `getAccountPreview` helper after the async call completes.
 */

import { getHorizonServer } from "@/app/utils/stellarClient";

export interface AccountPreview {
  balance: string;
  txCount: number;
}

let _preview: AccountPreview | null = null;
let _loading = false;

/** Returns the most recently fetched preview, or null if not yet loaded. */
export function getAccountPreview(): AccountPreview | null {
  return _preview;
}

/** Returns true while a fetch is in progress. */
export function isAccountPreviewLoading(): boolean {
  return _loading;
}

/**
 * Fetches basic Horizon account data for the given Stellar public key and
 * caches the result in module state.  Never throws — errors are swallowed so
 * a Horizon failure doesn't break the connect flow.
 */
export async function fetchAccountPreview(
  publicKey: string,
): Promise<AccountPreview | null> {
  if (!publicKey) return null;

  _loading = true;
  _preview = null;

  try {
    // Default to mainnet; the connect page switches network via the store.
    const server = getHorizonServer("mainnet");
    const account = await server.accounts().accountId(publicKey).call();

    const xlmBalance =
      account.balances.find(
        (b: { asset_type: string; balance: string }) =>
          b.asset_type === "native",
      )?.balance ?? "0";

    // Horizon paginates operations; subentry_count approximates activity level.
    const txCount = account.subentry_count ?? 0;

    _preview = {
      balance: parseFloat(xlmBalance).toFixed(2),
      txCount,
    };
  } catch {
    // Account not found or network error — return null without surfacing to UI.
    _preview = null;
  } finally {
    _loading = false;
  }

  return _preview;
}
