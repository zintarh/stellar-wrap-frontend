import { create } from 'zustand';

interface WrapperStore {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  setAddress: (address: string) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
}

export const useWrapperStore = create<WrapperStore>((set) => ({
  address: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  setAddress: (address: string) =>
    set({ address, isConnected: true, isConnecting: false, error: null }),
  setConnecting: (isConnecting: boolean) => set({ isConnecting, error: null }),
  setError: (error: string | null) => set({ error, isConnecting: false }),
  disconnect: () => set({ address: null, isConnected: false, error: null }),
}));
