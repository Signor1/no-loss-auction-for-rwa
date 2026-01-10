'use client';

import { useState, useEffect, useMemo } from 'react';

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  amountUSD: number;
  amountETH: number;
  from: string;
  to: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  gasFee: string;
  confirmations: number;
  metadata: TransactionMetadata;
  relatedAsset?: AssetInfo;
  relatedAuction?: AuctionInfo;
  relatedBid?: BidInfo;
  error?: TransactionError;
  retryCount: number;
  maxRetries: number;
}

export interface TransactionMetadata {
  description?: string;
  category: TransactionCategory;
  tags: string[];
  notes?: string;
  attachments?: string[];
  internalId?: string;
  batchId?: string;
  priority: TransactionPriority;
  source: TransactionSource;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
}

export interface AssetInfo {
  id: string;
  name: string;
  symbol: string;
  imageUrl: string;
  category: string;
  decimals: number;
  contractAddress: string;
}

export interface AuctionInfo {
  id: string;
  title: string;
  assetId: string;
  currentBid: string;
  endTime: number;
  status: 'active' | 'ended' | 'cancelled';
  winner?: string;
}

export interface BidInfo {
  id: string;
  auctionId: string;
  bidAmount: string;
  bidder: string;
  timestamp: number;
  isWinning: boolean;
  autoBid: boolean;
}

export interface TransactionError {
  code: string;
  message: string;
  details?: string;
  timestamp: number;
  retryable: boolean;
  suggestedAction?: string;
}

export interface DeviceInfo {
  platform: string;
  browser: string;
  version: string;
  isMobile: boolean;
  fingerprint: string;
}

export interface TransactionFilter {
  types: TransactionType[];
  statuses: TransactionStatus[];
  categories: TransactionCategory[];
  dateRange: DateRange;
  amountRange: AmountRange;
  address: string;
  assetId: string;
  auctionId: string;
  searchQuery: string;
  priority: TransactionPriority[];
  source: TransactionSource[];
  hasError: boolean;
  isPending: boolean;
}

export interface DateRange {
  preset: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  startDate?: number;
  endDate?: number;
}

export interface AmountRange {
  min?: number;
  max?: number;
  currency: 'USD' | 'ETH';
}

export interface TransactionStats {
  totalTransactions: number;
  totalVolumeUSD: number;
  totalVolumeETH: number;
  totalGasFees: number;
  averageTransactionSize: number;
  successRate: number;
  failedTransactions: number;
  pendingTransactions: number;
  mostActiveDay: string;
  topTransactionType: TransactionType;
  monthlyVolume: MonthlyVolume[];
  categoryBreakdown: CategoryBreakdown[];
  statusBreakdown: StatusBreakdown[];
}

export interface MonthlyVolume {
  month: string;
  volumeUSD: number;
  volumeETH: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  count: number;
  volumeUSD: number;
  percentage: number;
}

export interface StatusBreakdown {
  status: TransactionStatus;
  count: number;
  percentage: number;
}

export interface TransactionExport {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  includeMetadata: boolean;
  includeErrors: boolean;
  dateRange: DateRange;
  filters: Partial<TransactionFilter>;
  columns: ExportColumn[];
}

export interface ExportColumn {
  key: keyof Transaction | string;
  label: string;
  width: number;
  format?: string;
}

export type TransactionType = 
  | 'bid'
  | 'transfer'
  | 'claim'
  | 'deposit'
  | 'withdrawal'
  | 'approve'
  | 'mint'
  | 'burn'
  | 'swap'
  | 'stake'
  | 'unstake'
  | 'reward'
  | 'refund'
  | 'penalty'
  | 'fee_payment'
  | 'gas_refund'
  | 'auction_create'
  | 'auction_cancel'
  | 'auction_end'
  | 'asset_create'
  | 'asset_update'
  | 'verification_fee'
  | 'compliance_fee'
  | 'royalty_payment'
  | 'dividend_payment'
  | 'governance_vote'
  | 'governance_propose'
  | 'multisig_execute'
  | 'multisig_approve'
  | 'upgrade_contract'
  | 'emergency_pause'
  | 'emergency_unpause';

export type TransactionStatus = 
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'reverted'
  | 'expired'
  | 'replaced'
  | 'speedup'
  | 'cancelled_by_user'
  | 'out_of_gas'
  | 'nonce_too_low'
  | 'nonce_too_high'
  | 'insufficient_funds'
  | 'gas_limit_exceeded'
  | 'contract_execution_failed';

export type TransactionCategory = 
  | 'auction'
  | 'payment'
  | 'transfer'
  | 'governance'
  | 'staking'
  | 'trading'
  | 'fees'
  | 'rewards'
  | 'compliance'
  | 'verification'
  | 'asset_management'
  | 'multisig'
  | 'emergency'
  | 'system'
  | 'other';

export type TransactionPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
export type TransactionSource = 'web' | 'mobile' | 'api' | 'system' | 'bot' | 'import' | 'batch';

// Mock data
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    type: 'bid',
    status: 'confirmed',
    amount: '2.5',
    amountUSD: 5000,
    amountETH: 2.5,
    from: '0xabcdef1234567890abcdef1234567890abcdef12',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    blockNumber: 18500000,
    gasUsed: '21000',
    gasPrice: '20000000000',
    gasFee: '0.00042',
    confirmations: 15,
    metadata: {
      description: 'Bid on Luxury Manhattan Apartment',
      category: 'auction',
      tags: ['real-estate', 'luxury', 'manhattan'],
      priority: 'high',
      source: 'web',
      deviceInfo: {
        platform: 'Web',
        browser: 'Chrome',
        version: '120.0.0.0',
        isMobile: false,
        fingerprint: 'fp_123456'
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    relatedAuction: {
      id: 'auction_1',
      title: 'Luxury Manhattan Apartment',
      assetId: 'asset_1',
      currentBid: '2.5',
      endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
      status: 'active'
    },
    relatedBid: {
      id: 'bid_1',
      auctionId: 'auction_1',
      bidAmount: '2.5',
      bidder: '0xabcdef1234567890abcdef1234567890abcdef12',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      isWinning: true,
      autoBid: false
    },
    retryCount: 0,
    maxRetries: 3
  },
  {
    id: 'tx_2',
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
    type: 'transfer',
    status: 'completed',
    amount: '1.0',
    amountUSD: 2000,
    amountETH: 1.0,
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0x9876543210fedcba9876543210fedcba98765432',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    blockNumber: 18499950,
    gasUsed: '21000',
    gasPrice: '18000000000',
    gasFee: '0.000378',
    confirmations: 65,
    metadata: {
      description: 'Transfer to external wallet',
      category: 'transfer',
      tags: ['external', 'wallet'],
      priority: 'medium',
      source: 'mobile',
      deviceInfo: {
        platform: 'iOS',
        browser: 'Safari',
        version: '17.1',
        isMobile: true,
        fingerprint: 'fp_789012'
      }
    },
    retryCount: 0,
    maxRetries: 3
  },
  {
    id: 'tx_3',
    hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fed',
    type: 'claim',
    status: 'failed',
    amount: '0.5',
    amountUSD: 1000,
    amountETH: 0.5,
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xabcdef1234567890abcdef1234567890abcdef12',
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    blockNumber: 18499900,
    gasUsed: '50000',
    gasPrice: '22000000000',
    gasFee: '0.0011',
    confirmations: 0,
    error: {
      code: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient funds for gas',
      details: 'Account balance too low to cover gas fees',
      timestamp: Date.now() - 12 * 60 * 60 * 1000,
      retryable: true,
      suggestedAction: 'Add more ETH to cover gas fees'
    },
    metadata: {
      description: 'Claim auction winnings',
      category: 'auction',
      tags: ['claim', 'winnings', 'failed'],
      priority: 'high',
      source: 'web'
    },
    relatedAuction: {
      id: 'auction_2',
      title: 'Contemporary Art Piece',
      assetId: 'asset_2',
      currentBid: '0.5',
      endTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
      status: 'ended',
      winner: '0x1234567890abcdef1234567890abcdef12345678'
    },
    retryCount: 2,
    maxRetries: 3
  },
  {
    id: 'tx_4',
    hash: '0x5555555555555555555555555555555555555555555555555555555555555',
    type: 'deposit',
    status: 'confirmed',
    amount: '5.0',
    amountUSD: 10000,
    amountETH: 5.0,
    from: '0x1111111111111111111111111111111111111111',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    blockNumber: 18499800,
    gasUsed: '21000',
    gasPrice: '15000000000',
    gasFee: '0.000315',
    confirmations: 120,
    metadata: {
      description: 'Deposit from exchange',
      category: 'payment',
      tags: ['deposit', 'exchange', 'funding'],
      priority: 'medium',
      source: 'api'
    },
    retryCount: 0,
    maxRetries: 3
  },
  {
    id: 'tx_5',
    hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    type: 'verification_fee',
    status: 'completed',
    amount: '0.1',
    amountUSD: 200,
    amountETH: 0.1,
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0x2222222222222222222222222222222222222222',
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    blockNumber: 18499600,
    gasUsed: '45000',
    gasPrice: '16000000000',
    gasFee: '0.00072',
    confirmations: 240,
    metadata: {
      description: 'KYC verification fee payment',
      category: 'compliance',
      tags: ['verification', 'kyc', 'fee'],
      priority: 'medium',
      source: 'web'
    },
    retryCount: 0,
    maxRetries: 3
  }
];

export const MOCK_TRANSACTION_STATS: TransactionStats = {
  totalTransactions: 156,
  totalVolumeUSD: 1250000,
  totalVolumeETH: 625,
  totalGasFees: 2.5,
  averageTransactionSize: 8012.82,
  successRate: 94.2,
  failedTransactions: 9,
  pendingTransactions: 3,
  mostActiveDay: '2024-01-15',
  topTransactionType: 'bid',
  monthlyVolume: [
    { month: '2024-01', volumeUSD: 450000, volumeETH: 225, transactionCount: 58 },
    { month: '2023-12', volumeUSD: 380000, volumeETH: 190, transactionCount: 52 },
    { month: '2023-11', volumeUSD: 420000, volumeETH: 210, transactionCount: 46 }
  ],
  categoryBreakdown: [
    { category: 'auction', count: 45, volumeUSD: 560000, percentage: 44.8 },
    { category: 'transfer', count: 38, volumeUSD: 280000, percentage: 22.4 },
    { category: 'payment', count: 28, volumeUSD: 180000, percentage: 14.4 },
    { category: 'compliance', count: 25, volumeUSD: 120000, percentage: 9.6 },
    { category: 'trading', count: 20, volumeUSD: 110000, percentage: 8.8 }
  ],
  statusBreakdown: [
    { status: 'completed', count: 134, percentage: 85.9 },
    { status: 'confirmed', count: 13, percentage: 8.3 },
    { status: 'failed', count: 9, percentage: 5.8 }
  ]
};

export function useTransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter>({
    types: [],
    statuses: [],
    categories: [],
    dateRange: { preset: 'this_month' },
    amountRange: { currency: 'USD' },
    address: '',
    assetId: '',
    auctionId: '',
    searchQuery: '',
    priority: [],
    source: [],
    hasError: false,
    isPending: false
  });

  // Load transactions
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTransactions(MOCK_TRANSACTIONS);
      setStats(MOCK_TRANSACTION_STATS);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by types
    if (filter.types.length > 0) {
      filtered = filtered.filter(tx => filter.types.includes(tx.type));
    }

    // Filter by statuses
    if (filter.statuses.length > 0) {
      filtered = filtered.filter(tx => filter.statuses.includes(tx.status));
    }

    // Filter by categories
    if (filter.categories.length > 0) {
      filtered = filtered.filter(tx => filter.categories.includes(tx.metadata.category));
    }

    // Filter by date range
    if (filter.dateRange.preset !== 'all') {
      const now = Date.now();
      let startDate: number;

      switch (filter.dateRange.preset) {
        case 'today':
          startDate = new Date(now).setHours(0, 0, 0, 0);
          break;
        case 'yesterday':
          startDate = new Date(now).setDate(new Date(now).getDate() - 1);
          startDate = new Date(startDate).setHours(0, 0, 0, 0);
          break;
        case 'this_week':
          startDate = new Date(now).setDate(new Date(now).getDate() - new Date(now).getDay());
          startDate = new Date(startDate).setHours(0, 0, 0, 0);
          break;
        case 'last_week':
          startDate = new Date(now).setDate(new Date(now).getDate() - 7 - new Date(now).getDay());
          startDate = new Date(startDate).setHours(0, 0, 0, 0);
          break;
        case 'this_month':
          startDate = new Date(now).setDate(1);
          startDate = new Date(startDate).setHours(0, 0, 0, 0);
          break;
        case 'last_month':
          startDate = new Date(now).setMonth(new Date(now).getMonth() - 1);
          startDate = new Date(startDate).setDate(1);
          startDate = new Date(startDate).setHours(0, 0, 0, 0);
          break;
        case 'this_year':
          startDate = new Date(now).setMonth(0, 1);
          startDate = new Date(startDate).setHours(0, 0, 0, 0);
          break;
        default:
          startDate = 0;
      }

      if (filter.dateRange.startDate) {
        startDate = filter.dateRange.startDate;
      }

      filtered = filtered.filter(tx => tx.timestamp >= startDate);

      if (filter.dateRange.endDate) {
        filtered = filtered.filter(tx => tx.timestamp <= filter.dateRange.endDate!);
      }
    }

    // Filter by amount range
    if (filter.amountRange.min !== undefined || filter.amountRange.max !== undefined) {
      filtered = filtered.filter(tx => {
        const amount = filter.amountRange.currency === 'USD' ? tx.amountUSD : parseFloat(tx.amountETH);
        if (filter.amountRange.min !== undefined && amount < filter.amountRange.min) return false;
        if (filter.amountRange.max !== undefined && amount > filter.amountRange.max) return false;
        return true;
      });
    }

    // Filter by address
    if (filter.address) {
      const address = filter.address.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.from.toLowerCase().includes(address) || 
        tx.to.toLowerCase().includes(address)
      );
    }

    // Filter by asset ID
    if (filter.assetId) {
      filtered = filtered.filter(tx => 
        tx.relatedAsset?.id === filter.assetId
      );
    }

    // Filter by auction ID
    if (filter.auctionId) {
      filtered = filtered.filter(tx => 
        tx.relatedAuction?.id === filter.auctionId
      );
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query) ||
        tx.metadata.description?.toLowerCase().includes(query) ||
        tx.relatedAsset?.name.toLowerCase().includes(query) ||
        tx.relatedAuction?.title.toLowerCase().includes(query)
      );
    }

    // Filter by priority
    if (filter.priority.length > 0) {
      filtered = filtered.filter(tx => filter.priority.includes(tx.metadata.priority));
    }

    // Filter by source
    if (filter.source.length > 0) {
      filtered = filtered.filter(tx => filter.source.includes(tx.metadata.source));
    }

    // Filter by error status
    if (filter.hasError) {
      filtered = filtered.filter(tx => tx.error !== undefined);
    }

    // Filter by pending status
    if (filter.isPending) {
      filtered = filtered.filter(tx => ['pending', 'processing'].includes(tx.status));
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, filter]);

  // Update filter
  const updateFilter = (newFilter: Partial<TransactionFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  // Clear filter
  const clearFilter = () => {
    setFilter({
      types: [],
      statuses: [],
      categories: [],
      dateRange: { preset: 'this_month' },
      amountRange: { currency: 'USD' },
      address: '',
      assetId: '',
      auctionId: '',
      searchQuery: '',
      priority: [],
      source: [],
      hasError: false,
      isPending: false
    });
  };

  // Select transaction
  const selectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTransaction(null);
  };

  // Export transactions
  const exportTransactions = async (exportConfig: TransactionExport) => {
    try {
      const filtered = filteredTransactions.filter(tx => {
        // Apply export filters
        if (exportConfig.filters.types && exportConfig.filters.types.length > 0) {
          if (!exportConfig.filters.types.includes(tx.type)) return false;
        }
        if (exportConfig.filters.statuses && exportConfig.filters.statuses.length > 0) {
          if (!exportConfig.filters.statuses.includes(tx.status)) return false;
        }
        if (exportConfig.filters.hasError && !tx.error) return false;
        return true;
      });

      // Format data based on export format
      let exportData: any;
      
      switch (exportConfig.format) {
        case 'csv':
          exportData = formatAsCSV(filtered, exportConfig);
          break;
        case 'json':
          exportData = formatAsJSON(filtered, exportConfig);
          break;
        case 'xlsx':
          exportData = formatAsXLSX(filtered, exportConfig);
          break;
        case 'pdf':
          exportData = formatAsPDF(filtered, exportConfig);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Download file
      downloadFile(exportData, `transactions.${exportConfig.format}`);
      
      return true;
    } catch (error) {
      console.error('Error exporting transactions:', error);
      return false;
    }
  };

  // Utility functions
  const formatAsCSV = (transactions: Transaction[], config: TransactionExport) => {
    const headers = config.columns.map(col => col.label).join(',');
    const rows = transactions.map(tx => {
      return config.columns.map(col => {
        const value = getTransactionValue(tx, col.key as keyof Transaction);
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',');
    });
    return [headers, ...rows].join('\n');
  };

  const formatAsJSON = (transactions: Transaction[], config: TransactionExport) => {
    const data = transactions.map(tx => {
      const result: any = {};
      config.columns.forEach(col => {
        result[col.key] = getTransactionValue(tx, col.key as keyof Transaction);
      });
      if (config.includeMetadata) {
        result.metadata = tx.metadata;
      }
      if (config.includeErrors && tx.error) {
        result.error = tx.error;
      }
      return result;
    });
    return JSON.stringify(data, null, 2);
  };

  const formatAsXLSX = (transactions: Transaction[], config: TransactionExport) => {
    // This would require a library like xlsx
    // For now, return CSV format as placeholder
    return formatAsCSV(transactions, config);
  };

  const formatAsPDF = (transactions: Transaction[], config: TransactionExport) => {
    // This would require a library like jsPDF
    // For now, return JSON format as placeholder
    return formatAsJSON(transactions, config);
  };

  const getTransactionValue = (tx: Transaction, key: keyof Transaction) => {
    const value = tx[key];
    if (typeof value === 'number' && key === 'timestamp') {
      return new Date(value).toLocaleString();
    }
    if (typeof value === 'string' && key === 'hash') {
      return value;
    }
    return value;
  };

  const downloadFile = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Retry transaction
  const retryTransaction = async (transactionId: string) => {
    try {
      // Simulate retry logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId 
          ? { 
              ...tx, 
              status: 'pending' as TransactionStatus, 
              retryCount: tx.retryCount + 1,
              error: undefined 
            }
          : tx
      ));
      
      return true;
    } catch (error) {
      console.error('Error retrying transaction:', error);
      return false;
    }
  };

  // Cancel transaction
  const cancelTransaction = async (transactionId: string) => {
    try {
      // Simulate cancel logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransactions(prev => prev.map(tx => 
        tx.id === transactionId 
          ? { ...tx, status: 'cancelled' as TransactionStatus }
          : tx
      ));
      
      return true;
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      return false;
    }
  };

  // Get blockchain explorer URL
  const getExplorerUrl = (hash: string, network: string = 'ethereum') => {
    const explorers: Record<string, string> = {
      ethereum: `https://etherscan.io/tx/${hash}`,
      polygon: `https://polygonscan.com/tx/${hash}`,
      arbitrum: `https://arbiscan.io/tx/${hash}`,
      optimism: `https://optimistic.etherscan.io/tx/${hash}`
    };
    return explorers[network] || explorers.ethereum;
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    // Data
    transactions,
    filteredTransactions,
    stats,
    selectedTransaction,
    isLoading,
    showDetailsModal,
    filter,

    // Actions
    loadTransactions,
    updateFilter,
    clearFilter,
    selectTransaction,
    closeDetailsModal,
    exportTransactions,
    retryTransaction,
    cancelTransaction,
    getExplorerUrl
  };
}
