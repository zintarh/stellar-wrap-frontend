/**
 * Type definitions for the Achievement Calculator Service
 * 
 * These types define the structure of achievement data and the interfaces
 * that the achievement calculator service will implement.
 */

import { IndexedTransaction, Timeframe } from './horizonTypes';

/**
 * Asset information extracted from transactions
 */
export interface AssetInfo {
  code: string;
  issuer?: string;
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
}

/**
 * Volume calculation result
 */
export interface VolumeResult {
  total: number;
  byAsset: Map<string, number>;
  nativeVolume: number;
}

/**
 * Achievement metrics calculated from transactions
 */
export interface AchievementMetrics {
  totalVolume: number;
  volumeByAsset: Map<string, number>;
  uniqueAssets: AssetInfo[];
  contractCalls: number;
  contractCallsByType: Map<string, number>;
  timeframe: Timeframe;
  transactionCount: number;
}

/**
 * Achievement calculation options
 */
export interface CalculateAchievementsOptions {
  transactions: IndexedTransaction[];
  timeframe: Timeframe;
}

/**
 * Achievement Calculator Service Interface
 * 
 * This interface defines the contract that the achievement calculator service must implement.
 * The actual implementation will be created in issue #40.
 */
export interface AchievementCalculator {
  /**
   * Calculates achievement metrics from indexed transactions
   * 
   * @param options - Configuration for calculating achievements
   * @returns Promise resolving to achievement metrics
   */
  calculateAchievements(
    options: CalculateAchievementsOptions
  ): Promise<AchievementMetrics>;

  /**
   * Calculates total volume from transactions
   * 
   * @param transactions - Array of indexed transactions
   * @returns Volume calculation result
   */
  calculateVolume(transactions: IndexedTransaction[]): VolumeResult;

  /**
   * Identifies unique assets from transactions
   * 
   * @param transactions - Array of indexed transactions
   * @returns Array of unique asset information
   */
  identifyAssets(transactions: IndexedTransaction[]): AssetInfo[];

  /**
   * Counts contract calls from transactions
   * 
   * @param transactions - Array of indexed transactions
   * @returns Map of operation type to count
   */
  countContractCalls(transactions: IndexedTransaction[]): Map<string, number>;
}
