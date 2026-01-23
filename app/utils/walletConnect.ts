import { isConnected, getPublicKey, requestAccess } from '@stellar/freighter-api';

/**
 * Checks if Freighter wallet extension is installed
 */
export const isFreighterInstalled = async (): Promise<boolean> => {
  try {
    return await isConnected();
  } catch (error) {
    return false;
  }
};

/**
 * Connects to Freighter wallet and returns the user's public key
 * @throws {Error} If wallet is not installed, user rejects connection, or any other error occurs
 */
export const connectFreighter = async (): Promise<string> => {
  // Check if Freighter is installed
  const installed = await isFreighterInstalled();
  
  if (!installed) {
    throw new Error(
      'Freighter wallet not found. Please install the Freighter browser extension.'
    );
  }

  try {
    // Request access to the wallet
    const accessGranted = await requestAccess();
    
    if (!accessGranted) {
      throw new Error('Connection rejected. Please approve the connection in Freighter.');
    }

    // Get the public key
    const publicKey = await getPublicKey();
    
    if (!publicKey) {
      throw new Error('Failed to retrieve wallet address. Please try again.');
    }

    return publicKey;
  } catch (error: any) {
    // Handle specific error cases
    if (error.message?.includes('User declined')) {
      throw new Error('Connection rejected by user.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to connect to Freighter wallet. Please try again.');
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
    
    return await getPublicKey();
  } catch (error) {
    return null;
  }
};
