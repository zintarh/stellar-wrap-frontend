"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { signTransaction } from "@stellar/freighter-api";
import { TransactionBuilder, Networks, BASE_FEE, Operation, Asset } from "@stellar/stellar-sdk";
import { getHorizonServer } from "../utils/stellarClient";
import { Network } from "../../src/config";
import { logger } from "../utils/logger";

const log = logger.child("ActivityInteractButton");

interface ActivityInteractButtonProps {
  address: string;
  network: Network;
}

export function ActivityInteractButton({ address, network }: ActivityInteractButtonProps) {
  const t = useTranslations("RecentActivity");
  const [status, setStatus] = useState<"idle" | "simulating" | "signing" | "submitting" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  
  const handleInteract = async () => {
    setStatus("simulating");
    setError(null);
    
    try {
      const server = getHorizonServer(network === "testnet" ? "testnet" : "mainnet");
      const account = await server.loadAccount(address);
      
      const networkPassphrase = network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
      
      // Build a dummy transaction (send 0 XLM to self) to trigger signature
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: address,
            asset: Asset.native(),
            amount: "0.0000001",
          })
        )
        .setTimeout(30)
        .build();
        
      const transactionXdr = transaction.toXDR();
      
      setStatus("signing");
      
      let signedXdr: string;
      try {
        const signResult = await signTransaction(transactionXdr, {
          networkPassphrase,
          address,
        });
        
        if (typeof signResult === "string") {
          signedXdr = signResult;
        } else if (signResult && typeof signResult === "object" && 'signedTxXDR' in signResult) {
          signedXdr = signResult.signedTxXDR as string;
        } else {
          throw new Error("Invalid signature response");
        }
      } catch (signError: unknown) {
        const message = signError instanceof Error ? signError.message.toLowerCase() : String(signError).toLowerCase();
        if (
          message.includes("declined") ||
          message.includes("rejected") ||
          message.includes("cancel") ||
          message.includes("denied")
        ) {
          throw new Error(t("errorSignatureRejected"));
        }
        throw signError;
      }
      
      if (!signedXdr) {
        throw new Error("Empty signature returned.");
      }
      
      setStatus("submitting");
      
      const signedTransaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      await server.submitTransaction(signedTransaction);
      
      setStatus("success");
    } catch (err: unknown) {
      log.error("Interaction failed:", err);
      setStatus("idle");
      
      const errorObj = err as Error;
      if (errorObj.message === t("errorSignatureRejected")) {
        setError(t("errorSignatureRejected"));
      } else {
        const errorMessage = errorObj.message || "Transaction failed";
        setError(`Error: ${errorMessage}`);
      }
    }
  };

  const isWorking = status !== "idle" && status !== "success";

  return (
    <div className="flex flex-col gap-4 w-full">
      <motion.button
        type="button"
        onClick={handleInteract}
        disabled={isWorking}
        className="w-full py-3 px-4 bg-theme-primary/20 text-theme-primary rounded-xl font-bold border border-theme-primary/30 hover:bg-theme-primary hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
        whileHover={isWorking ? undefined : { scale: 1.02 }}
        whileTap={isWorking ? undefined : { scale: 0.98 }}
      >
        {isWorking ? (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{t(status)}</span>
          </div>
        ) : status === "success" ? (
          t("success")
        ) : (
          t("interactWithNFT")
        )}
      </motion.button>
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
