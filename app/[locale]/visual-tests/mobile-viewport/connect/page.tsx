"use client";

import { Suspense } from "react";
import { ConnectWalletButton } from "@/app/components/ConnectWalletButton";
import { ProgressIndicator } from "@/app/components/ProgressIndicator";
import { MuteToggle } from "@/app/components/MuteToggle";
import { mockData } from "@/app/data/mockData";

function ConnectVisualFixture() {
  return (
    <main
      style={{
        width: "390px",
        minHeight: "844px",
        margin: 0,
        overflow: "hidden",
        backgroundColor: "#020202",
      }}
    >
      <ProgressIndicator currentStep={2} totalSteps={6} showNext={false} />
      <ConnectWalletButton
        address={mockData.address}
        onConnect={() => {}}
        network="mainnet"
        isConnecting={false}
        isConnected={false}
      />
      <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 20 }}>
        <MuteToggle />
      </div>
    </main>
  );
}

export default function ConnectVisualTestPage() {
  return (
    <Suspense fallback={null}>
      <ConnectVisualFixture />
    </Suspense>
  );
}