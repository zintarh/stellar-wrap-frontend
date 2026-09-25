export const connectAlbedo = async (_network: Network): Promise<string> => {
  if (!isAlbedoInstalled() || !window.albedo) {
    throw new Error(
      "Albedo wallet not found. Please install the Albedo browser extension.",
    );
  }

  try {
    const result = await window.albedo.publicKey({});

    if (!result?.publicKey) {
      throw new Error(
        "Connection rejected. Please approve the connection in Albedo.",
      );
    }

    return result.publicKey;
  } catch (error: unknown) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("popup") || message.includes("blocked")) {
        throw new Error(
          "Albedo popup was blocked by your browser. Please allow popups for this site.",
        );
      }

      if (
        message.includes("cancel") ||
        message.includes("declined") ||
        message.includes("rejected")
      ) {
        throw new Error("Connection rejected by user.");
      }

      throw error;
    }

    throw new Error("Failed to connect to Albedo wallet. Please try again.");
  }
};