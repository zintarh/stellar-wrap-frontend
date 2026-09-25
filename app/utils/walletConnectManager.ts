if (typeof window === "undefined") {
  throw new Error("WalletConnect is not available on the server");
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error(
    "WalletConnect project ID not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
  );
}

const [
  { StellarWalletsKit },
  { WalletConnectModule, WALLET_CONNECT_ID, WalletConnectTargetChain },
  { FreighterModule },
  { Networks },
] = await Promise.all([
  import("@creit-tech/stellar-wallets-kit/sdk"),
  import("@creit-tech/stellar-wallets-kit/modules/wallet-connect"),
  import("@creit-tech/stellar-wallets-kit/modules/freighter"),
  import("@creit-tech/stellar-wallets-kit/types"),
]);export async function getQRCodeDataUrl(uri: string): Promise<string> {
  try {
    // Dynamic import wrapped to bypass Turbopack static analysis.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const QRCode = await (Function("m", "return import(m)") as (
      m: string,
    ) => Promise<typeof import("qrcode")>)("qrcode");

    return await QRCode.default.toDataURL(uri);
  } catch {
    console.warn("QR code generation not available");
    return "";
  }
}