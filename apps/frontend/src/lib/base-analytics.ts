'use client';

import { type Address, type Hash } from 'viem';
import { useState, useEffect, useCallback } from 'react';

// Analytics event types
export enum AnalyticsEventType {
  // Transaction events
  TRANSACTION_INITIATED = 'transaction_initiated',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',
  
  // Contract events
  CONTRACT_READ = 'contract_read',
  CONTRACT_WRITE = 'contract_write',
  CONTRACT_DEPLOY = 'contract_deploy',
  
  // User events
  WALLET_CONNECTED = 'wallet_connected',
  WALLET_DISCONNECTED = 'wallet_disconnected',
  NETWORK_SWITCHED = 'network_switched',
  
  // Auction events
  AUCTION_VIEWED = 'auction_viewed',
  BID_PLACED = 'bid_placed',
  AUCTION_WON = 'auction_won',
  AUCTION_LOST = 'auction_lost',
  
  // Asset events
  ASSET_VIEWED = 'asset_viewed',
  ASSET_LISTED = 'asset_listed',
  ASSET_PURCHASED = 'asset_purchased',
  
  // Gas events
  GAS_ESTIMATED = 'gas_estimated',
  GAS_OPTIMIZED = 'gas_optimized',
  
  // Error events
  ERROR_OCCURRED = 'error_occurred',
  RPC_ERROR = 'rpc_error',
}

// Analytics event data
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  userId?: string;
  address?: Address;
  chainId?: number;
  data?: Record<string, any>;
  metadata?: {
    userAgent?: string;
    screen?: { width: number; height: number };
    referrer?: string;
  };
}

// Transaction analytics
export interface TransactionAnalytics {
  hash: Hash;
  from: Address;
  to?: Address;
  value: string;
  gasUsed: string;
  gasPrice: string;
  gasCost: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  blockNumber?: number;
  confirmations?: number;
  method?: string;
}

// Gas analytics
export interface GasAnalytics {
  timestamp: number;
  chainId: number;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  baseFee?: string;
  estimatedCost?: string;
  actualCost?: string;
  savings?: string;
}

// User analytics
export interface UserAnalytics {
  address: Address;
  chainId: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalGasSpent: string;
  averageGasPrice: string;
  firstSeen: number;
  lastSeen: number;
  preferredChain?: number;
}

// Base Analytics Class
export class BaseAnalytics {
  private events: AnalyticsEvent[] = [];
  private transactions: Map<Hash, TransactionAnalytics> = new Map();
  private gasHistory: GasAnalytics[] = [];
  private userStats: Map<Address, UserAnalytics> = new Map();
  private enabled: boolean = true;
  private persistToStorage: boolean = true;
  private maxStoredEvents: number = 1000;

  constructor(options?: {
    enabled?: boolean;
    persistToStorage?: boolean;
    maxStoredEvents?: number;
  }) {
    this.enabled = options?.enabled ?? true;
    this.persistToStorage = options?.persistToStorage ?? true;
    this.maxStoredEvents = options?.maxStoredEvents ?? 1000;

    if (this.persistToStorage && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  // Track event
  trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'metadata'>): void {
    if (!this.enabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      metadata: this.collectMetadata(),
    };

    this.events.push(fullEvent);

    // Limit stored events
    if (this.events.length > this.maxStoredEvents) {
      this.events = this.events.slice(-this.maxStoredEvents);
    }

    // Persist to storage
    if (this.persistToStorage) {
      this.saveToStorage();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Base Analytics]', fullEvent);
    }

    // Send to analytics service (implement based on your needs)
    this.sendToAnalyticsService(fullEvent);
  }

  // Track transaction
  trackTransaction(tx: TransactionAnalytics): void {
    this.transactions.set(tx.hash, tx);

    this.trackEvent({
      type: tx.status === 'success' 
        ? AnalyticsEventType.TRANSACTION_CONFIRMED 
        : tx.status === 'failed'
        ? AnalyticsEventType.TRANSACTION_FAILED
        : AnalyticsEventType.TRANSACTION_INITIATED,
      address: tx.from,
      data: {
        hash: tx.hash,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasCost: tx.gasCost,
        method: tx.method,
      },
    });

    // Update user stats
    if (tx.status !== 'pending') {
      this.updateUserStats(tx);
    }
  }

  // Track gas usage
  trackGas(gas: GasAnalytics): void {
    this.gasHistory.push(gas);

    // Keep last 100 gas records
    if (this.gasHistory.length > 100) {
      this.gasHistory = this.gasHistory.slice(-100);
    }

    this.trackEvent({
      type: AnalyticsEventType.GAS_ESTIMATED,
      chainId: gas.chainId,
      data: {
        gasPrice: gas.gasPrice,
        estimatedCost: gas.estimatedCost,
      },
    });
  }

  // Update user statistics
  private updateUserStats(tx: TransactionAnalytics): void {
    const existing = this.userStats.get(tx.from) || {
      address: tx.from,
      chainId: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalGasSpent: '0',
      averageGasPrice: '0',
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };

    existing.totalTransactions++;
    if (tx.status === 'success') {
      existing.successfulTransactions++;
    } else {
      existing.failedTransactions++;
    }

    existing.totalGasSpent = (
      BigInt(existing.totalGasSpent) + BigInt(tx.gasCost)
    ).toString();

    existing.averageGasPrice = (
      BigInt(existing.totalGasSpent) / BigInt(existing.totalTransactions)
    ).toString();

    existing.lastSeen = Date.now();

    this.userStats.set(tx.from, existing);
  }

  // Get user analytics
  getUserAnalytics(address: Address): UserAnalytics | null {
    return this.userStats.get(address) || null;
  }

  // Get transaction analytics
  getTransactionAnalytics(hash: Hash): TransactionAnalytics | null {
    return this.transactions.get(hash) || null;
  }

  // Get gas analytics
  getGasAnalytics(options?: {
    chainId?: number;
    startTime?: number;
    endTime?: number;
  }): GasAnalytics[] {
    let filtered = this.gasHistory;

    if (options?.chainId) {
      filtered = filtered.filter(g => g.chainId === options.chainId);
    }

    if (options?.startTime) {
      filtered = filtered.filter(g => g.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      filtered = filtered.filter(g => g.timestamp <= options.endTime!);
    }

    return filtered;
  }

  // Get events
  getEvents(options?: {
    type?: AnalyticsEventType;
    address?: Address;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): AnalyticsEvent[] {
    let filtered = this.events;

    if (options?.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }

    if (options?.address) {
      filtered = filtered.filter(e => e.address === options.address);
    }

    if (options?.startTime) {
      filtered = filtered.filter(e => e.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      filtered = filtered.filter(e => e.timestamp <= options.endTime!);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  // Get analytics summary
  getAnalyticsSummary(address?: Address): {
    totalEvents: number;
    totalTransactions: number;
    successRate: number;
    totalGasSpent: string;
    averageGasPrice: string;
    mostUsedChain?: number;
  } {
    const events = address 
      ? this.events.filter(e => e.address === address)
      : this.events;

    const txs = address
      ? Array.from(this.transactions.values()).filter(tx => tx.from === address)
      : Array.from(this.transactions.values());

    const successfulTxs = txs.filter(tx => tx.status === 'success').length;
    const failedTxs = txs.filter(tx => tx.status === 'failed').length;
    const totalTxs = successfulTxs + failedTxs;

    const totalGasSpent = txs.reduce(
      (sum, tx) => sum + BigInt(tx.gasCost || '0'),
      BigInt(0)
    ).toString();

    const avgGasPrice = totalTxs > 0
      ? (BigInt(totalGasSpent) / BigInt(totalTxs)).toString()
      : '0';

    const chainCounts = events.reduce((acc, e) => {
      if (e.chainId) {
        acc[e.chainId] = (acc[e.chainId] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const mostUsedChain = Object.entries(chainCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      totalEvents: events.length,
      totalTransactions: totalTxs,
      successRate: totalTxs > 0 ? (successfulTxs / totalTxs) * 100 : 0,
      totalGasSpent,
      averageGasPrice: avgGasPrice,
      mostUsedChain: mostUsedChain ? parseInt(mostUsedChain) : undefined,
    };
  }

  // Collect metadata
  private collectMetadata(): AnalyticsEvent['metadata'] {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      referrer: document.referrer,
    };
  }

  // Save to localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('base_analytics_events', JSON.stringify(this.events.slice(-100)));
      localStorage.setItem('base_analytics_gas', JSON.stringify(this.gasHistory.slice(-50)));
    } catch (error) {
      console.error('Failed to save analytics to storage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const events = localStorage.getItem('base_analytics_events');
      const gas = localStorage.getItem('base_analytics_gas');

      if (events) {
        this.events = JSON.parse(events);
      }

      if (gas) {
        this.gasHistory = JSON.parse(gas);
      }
    } catch (error) {
      console.error('Failed to load analytics from storage:', error);
    }
  }

  // Send to analytics service (placeholder - implement based on your service)
  private sendToAnalyticsService(event: AnalyticsEvent): void {
    // Implement integration with your analytics service
    // Examples: Google Analytics, Mixpanel, Segment, etc.
    
    // Example for custom endpoint:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // });
  }

  // Clear analytics data
  clear(): void {
    this.events = [];
    this.transactions.clear();
    this.gasHistory = [];
    this.userStats.clear();

    if (this.persistToStorage && typeof window !== 'undefined') {
      localStorage.removeItem('base_analytics_events');
      localStorage.removeItem('base_analytics_gas');
    }
  }

  // Export analytics data
  export(): {
    events: AnalyticsEvent[];
    transactions: TransactionAnalytics[];
    gasHistory: GasAnalytics[];
    userStats: UserAnalytics[];
  } {
    return {
      events: this.events,
      transactions: Array.from(this.transactions.values()),
      gasHistory: this.gasHistory,
      userStats: Array.from(this.userStats.values()),
    };
  }
}

// Global analytics instance
let analyticsInstance: BaseAnalytics | null = null;

export function getAnalyticsInstance(): BaseAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new BaseAnalytics();
  }
  return analyticsInstance;
}

// React Hook for Base Analytics
export function useBaseAnalytics(address?: Address) {
  const [analytics] = useState(() => getAnalyticsInstance());
  const [summary, setSummary] = useState(() => analytics.getAnalyticsSummary(address));

  useEffect(() => {
    // Update summary periodically
    const interval = setInterval(() => {
      setSummary(analytics.getAnalyticsSummary(address));
    }, 5000);

    return () => clearInterval(interval);
  }, [analytics, address]);

  const trackEvent = useCallback(
    (event: Omit<AnalyticsEvent, 'timestamp' | 'metadata'>) => {
      analytics.trackEvent(event);
    },
    [analytics]
  );

  const trackTransaction = useCallback(
    (tx: TransactionAnalytics) => {
      analytics.trackTransaction(tx);
    },
    [analytics]
  );

  const trackGas = useCallback(
    (gas: GasAnalytics) => {
      analytics.trackGas(gas);
    },
    [analytics]
  );

  return {
    analytics,
    summary,
    trackEvent,
    trackTransaction,
    trackGas,
    getUserAnalytics: (addr: Address) => analytics.getUserAnalytics(addr),
    getTransactionAnalytics: (hash: Hash) => analytics.getTransactionAnalytics(hash),
    getGasAnalytics: (options?: any) => analytics.getGasAnalytics(options),
    getEvents: (options?: any) => analytics.getEvents(options),
  };
}

export default BaseAnalytics;
