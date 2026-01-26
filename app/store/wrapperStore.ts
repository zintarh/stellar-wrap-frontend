import { create } from 'zustand';

interface MonthlyStats {
  month: string;
  count: number;
}

interface WrapperStore {
  totalTransactions: number;
  percentile: number;
  monthlyStats: MonthlyStats[];
  setTotalTransactions: (count: number) => void;
  setPercentile: (percentile: number) => void;
  setMonthlyStats: (stats: MonthlyStats[]) => void;
}

// Mock data for development
const mockMonthlyStats: MonthlyStats[] = [
  { month: 'Jan', count: 25 },
  { month: 'Feb', count: 32 },
  { month: 'Mar', count: 45 },
  { month: 'Apr', count: 38 },
  { month: 'May', count: 52 },
  { month: 'Jun', count: 48 },
  { month: 'Jul', count: 55 },
  { month: 'Aug', count: 42 },
  { month: 'Sep', count: 58 },
  { month: 'Oct', count: 51 },
  { month: 'Nov', count: 47 },
  { month: 'Dec', count: 67 }, // Peak month
];

export const useWrapperStore = create<WrapperStore>((set) => ({
  totalTransactions: 420,
  percentile: 80,
  monthlyStats: mockMonthlyStats,
  setTotalTransactions: (count) => set({ totalTransactions: count }),
  setPercentile: (percentile) => set({ percentile }),
  setMonthlyStats: (stats) => set({ monthlyStats: stats }),
}));