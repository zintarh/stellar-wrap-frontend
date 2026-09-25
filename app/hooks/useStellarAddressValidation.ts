"use client";

import { useState, useCallback } from "react";
import { isValidStellarAddress } from "@/app/utils/walletConnect";

type Network = "mainnet" | "testnet";

type ValidationState =
  | "idle"
  | "validating"
  | "valid"
  | "invalid-format"
  | "invalid"
  | "wrong-network"
  | "not-found"
  | "indexing"
  | "error";

interface UseStellarAddressValidationOptions {
  network?: Network;
}

interface UseStellarAddressValidationReturn {
  address: string;
  validationState: ValidationState;
  errorMessage: string | null;
  isValid: boolean;
  handleAddressChange: (value: string) => void;
}

/**
 * Hook that validates a Stellar address as the user types.
 *
 * Validation is purely format-based (G + 56 base-32 chars) for a fast
 * synchronous result.  Down-stream hooks / services handle deeper network
 * checks after submission.
 */
export function useStellarAddressValidation(
  { network: _network = "mainnet" }: UseStellarAddressValidationOptions = {},
): UseStellarAddressValidationReturn {
  const [address, setAddress] = useState("");
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddressChange = useCallback((value: string) => {
    setAddress(value);

    if (!value.trim()) {
      setValidationState("idle");
      setErrorMessage(null);
      return;
    }

    setValidationState("validating");
    const trimmed = value.trim();

    if (!isValidStellarAddress(trimmed)) {
      setValidationState("invalid-format");
      setErrorMessage(
        "Address must start with 'G' and be exactly 56 characters.",
      );
      return;
    }

    setValidationState("valid");
    setErrorMessage(null);
  }, []);

  const isValid = validationState === "valid";

  return { address, validationState, errorMessage, isValid, handleAddressChange };
}
