import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TransactionState =
  | "idle"
  | "building"
  | "simulating"
  | "simulated"
  | "signing"
  | "signed"
  | "submitting"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "failed";

interface TransactionStoreState {
  transactionState: TransactionState;
  transactionHash: string | null;
  transactionError: string | null;
  // actions
  setTransactionState: (state: TransactionState) => void;
  setTransactionHash: (hash: string | null) => void;
  setTransactionError: (error: string | null) => void;
  resetTransaction: () => void;
}

export const useTransactionStore = create<TransactionStoreState>()(
  persist(
    (set) => ({
      transactionState: "idle",
      transactionHash: null,
      transactionError: null,
      setTransactionState: (state) => set({ transactionState: state }),
      setTransactionHash: (hash) => set({ transactionHash: hash }),
      setTransactionError: (error) => set({ transactionError: error }),
      resetTransaction: () =>
        set({
          transactionState: "idle",
          transactionHash: null,
          transactionError: null,
        }),
    }),
    {
      name: "stellar-wrap-transaction-storage",
      // Only keep relevant state, if the transaction was left in an intermediate state we might want to recover.
      // E.g., if it was confirming, we want to resume polling.
    },
  ),
);
