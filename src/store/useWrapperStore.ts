import { create } from 'zustand';
import { WrappedData } from '../types';
import { GOLDEN_USER } from '../data/mockData';

interface WrapperStore {
    data: WrappedData | null;
    isLoading: boolean;
    isMock: boolean;
    error: string | null;
    fetchData: (address: string) => Promise<void>;
    toggleMockMode: () => void;
    setLoading: (isLoading: boolean) => void;
    setData: (data: WrappedData | null) => void;
    setError: (error: string | null) => void;
}

export const useWrapperStore = create<WrapperStore>((set, get) => ({
    data: null,
    isLoading: false,
    isMock: false,
    error: null,

    setLoading: (isLoading) => set({ isLoading }),

    setData: (data) => set({ data }),

    setError: (error) => set({ error }),

    toggleMockMode: () => {
        const nextMockValue = !get().isMock;
        set({ isMock: nextMockValue });

        if (nextMockValue) {
            set({ data: GOLDEN_USER, error: null });
        } else {
            set({ data: null });
        }
    },

    fetchData: async (_address: string) => {
        set({ isLoading: true, error: null });

        try {
            if (get().isMock) {
                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 1000));
                set({ data: GOLDEN_USER, isLoading: false });
            } else {
                // Placeholder for future API integration
                // const response = await fetch(`/api/wrapped/${address}`);
                // const result = await response.json();
                // set({ data: result, isLoading: false });

                // Temporarily default to error if not in mock mode since API isn't built
                set({
                    isLoading: false,
                    error: "API integration pending. Please enable Mock Mode in dev tool."
                });
            }
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : 'Failed to fetch data',
                isLoading: false
            });
        }
    },
}));
