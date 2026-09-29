# Token Swap (DEX Offers) Architecture

> Covers the Token Swap / DEX Offers feature (`/[locale]/offers`).
> This is the **Manage Sell Offer** flow that lets a connected wallet place,
> track, and dismiss limit-sell orders on the Stellar DEX.

---

## Overview

The Token Swap feature exposes a simplified DEX trading interface built on top
of Stellar's native `manage_sell_offer` operation. Users pick a selling asset, a
buying asset, enter an amount and limit price, and submit. The UI optimistically
reflects the pending offer immediately; the on-chain result is reconciled once
the Horizon submission resolves.

---

## File Map

| Path | Role |
|------|------|
| `app/[locale]/offers/page.tsx` | Page entry-point — form + offer list |
| `app/store/offerStore.ts` | Zustand store — optimistic state management |
| `src/services/offerService.ts` | Service layer — validation, Horizon submission |
| `src/utils/stellarAmount.ts` | Stroop ↔ decimal conversion utilities |
| `app/store/wrapStore.ts` | Provides `address` + `network` to the page |

---

## Data Flow

```
User fills form
  └─ handleSubmit()
       ├─ 1. Validate locally (amount > 0, assets differ, wallet connected)
       ├─ 2. addOptimisticOffer(tempId, status: "pending")  ← store
       ├─ 3. createOffer(input)  ← offerService
       │       ├─ Re-validate on the service layer
       │       ├─ Build ManageSellOffer operation (TODO: real Horizon tx)
       │       └─ Return { onChainId, txHash }
       ├─ 4a. SUCCESS → confirmOffer(tempId, onChainId)  ← store
       └─ 4b. FAILURE → rollbackOffer(tempId, errorMessage)  ← store
```

Dismissed failed offers are removed via `dismissFailedOffer(id)`.

---

## State Shape (`offerStore`)

```ts
interface Offer {
  id: string;          // temporary client-side ID (optimistic-<timestamp>)
  side: "sell";
  sellingAsset: string;
  buyingAsset: string;
  amount: string;
  price: string;
  status: "pending" | "confirmed" | "failed";
  onChainId?: string;  // set on confirmation
  error?: string;      // set on rollback
}

interface OfferStore {
  offers: Offer[];
  addOptimisticOffer: (offer: Omit<Offer, "status">) => void;
  confirmOffer: (tempId: string, onChainId: string) => void;
  rollbackOffer: (tempId: string, error: string) => void;
  dismissFailedOffer: (id: string) => void;
}
```

---

## Optimistic Update Pattern

The page applies an **optimistic UI** strategy so users see instant feedback
while the blockchain round-trip completes (800 ms – 2.4 s in simulation;
real Horizon latency varies):

1. A `pending` offer entry appears in the list immediately after submit.
2. On success the `status` transitions to `confirmed` and the real on-chain ID
   is stored.
3. On failure the `status` transitions to `failed` with an error message; a
   dismiss button allows the user to remove it from the list.

This avoids blocking the UI on the Horizon submission and gives the user a
clear status trail without page reloads.

---

## Service Layer (`offerService.ts`)

`createOffer(input: CreateOfferInput)` is the single public mutation:

- **Input validation** — re-checked server-side to prevent bad calls reaching Horizon.
- **Horizon submission** — currently simulated via `simulateBlockchainCall()`.
  To wire up a real Stellar transaction, replace the simulation body with:
  1. Build a `TransactionBuilder` with a `ManageSellOfferBuilder` operation.
  2. Sign via `signTransaction` (Freighter / Albedo / WalletConnect).
  3. Submit to Horizon and poll `loadTransaction` for `SUCCESS` / `FAILED`.
- **Error codes** — `VALIDATION`, `TIMEOUT`, `REJECTED`, `NETWORK_ERROR`, `UNKNOWN`.

```ts
export async function createOffer(input: CreateOfferInput): Promise<CreateOfferResult>
export async function cancelOffer(offerId: string, accountAddress: string, network: Network): Promise<void>
```

---

## Asset Handling

- Amounts are held as plain decimal strings (e.g. `"12.5000000"`) throughout
  the offer store to preserve 7-decimal Stellar precision.
- Conversion to Stroops for actual transaction building must use
  `toStroops(amount)` from `src/utils/stellarAmount.ts`.
- Display formatting uses `formatStellarAmount(amount)` from the same module.

---

## Virtualized Offer List

The offer history list renders with `@tanstack/react-virtual`
(`useVirtualizer`) to keep DOM node count constant regardless of how many
offers accumulate in the session. The virtual container is a fixed-height
`<ul>` with `overflow-y-auto`; only visible rows are mounted.

---

## How to Maintain

### Adding a new asset

Add the asset code to the `POPULAR_ASSETS` constant in `app/[locale]/offers/page.tsx`:

```ts
const POPULAR_ASSETS = ["XLM", "USDC", "AQUA", "yXLM", "BTC", "ETH", "NEW_ASSET"] as const;
```

### Wiring up real Horizon transactions

Replace the `simulateBlockchainCall()` stub in `src/services/offerService.ts`
with a real Stellar SDK transaction following these steps:

```ts
import { TransactionBuilder, ManageSellOfferBuilder, Networks } from "@stellar/stellar-sdk";

// 1. Load source account
const account = await server.loadAccount(input.accountAddress);

// 2. Build the transaction
const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
  .addOperation(
    ManageSellOfferBuilder.manageSellOffer({
      selling: new Asset(input.sellingAsset, issuer),
      buying: new Asset(input.buyingAsset, buyingIssuer),
      amount: input.amount,
      price: input.price,
    })
  )
  .setTimeout(30)
  .build();

// 3. Sign
const signed = await signTransaction(tx.toXDR(), { network: input.network });

// 4. Submit
const result = await server.submitTransaction(TransactionBuilder.fromXDR(signed, networkPassphrase));
```

### Adding buy-side offers

The store and service types already include a `side` field. To add a buy offer:

1. Add a `"buy"` option to the `side` union in `offerStore.ts`.
2. Add a `createBuyOffer` function in `offerService.ts` using `manageBuyOffer`.
3. Add a form toggle in the page and branch on `form.side` in `handleSubmit`.

---

## TypeScript Constraints

- The `any` type is prohibited. All Horizon response shapes must be typed via
  the `@stellar/stellar-sdk` types or local interfaces.
- The `OfferServiceError` discriminated union uses a `code` literal union —
  always add new error codes to that union rather than using `string`.

---

## Related Documentation

- [Stellar DEX documentation](https://developers.stellar.org/docs/build/guides/dex)
- `docs/export-csv-architecture.md` — CSV export pattern (similar service layer structure)
- `docs/contact-list-architecture.md` — contact list pattern (similar Zustand store shape)
