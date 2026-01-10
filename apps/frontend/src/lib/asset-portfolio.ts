'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther, formatUnits } from 'viem';

// Types for asset portfolio
export interface AssetToken {
  id: string;
  assetId: string;
  assetTitle: string;
  assetCategory: string;
  assetType: string;
  tokenId: string;
  tokenContract: string;
  balance: string;
  decimals: number;
  valueUSD: number;
  valueETH: number;
  acquisitionPrice: number;
  acquisitionDate: number;
  lastUpdated: number;
  isFractional: boolean;
  totalSupply: string;
  ownerPercentage: number;
}

export interface AssetPerformance {
  assetId: string;
  currentValue: number;
  previousValue: number;
  change24h: number;
  change7d: number;
  change30d: number;
  changeAllTime: number;
  volatility: number;
  volume24h: number;
  marketCap: number;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

export interface Dividend {
  id: string;
  assetId: string;
  assetTitle: string;
  amount: string;
  currency: string;
  tokenPrice: number;
  totalValue: number;
  paymentDate: number;
  declaredDate: number;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  status: 'pending' | 'paid' | 'claimed';
  txHash?: string;
  yieldPercentage: number;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  assetTitle: string;
  from: string;
  to: string;
  amount: string;
  price: number;
  totalValue: number;
  timestamp: number;
  txHash: string;
  status: 'pending' | 'completed' | 'failed';
  gasUsed: string;
  gasCost: number;
  type: 'sale' | 'transfer' | 'fractionalization' | 'defractionalization';
}

export interface PortfolioStats {
  totalValueUSD: number;
  totalValueETH: number;
  totalAssets: number;
  totalDividends: number;
  totalYield: number;
  bestPerformer: string;
  worstPerformer: string;
  portfolioChange24h: number;
  portfolioChange7d: number;
  portfolioChange30d: number;
  assetDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
}

export interface AssetDetails {
  asset: AssetToken;
  performance: AssetPerformance;
  dividends: Dividend[];
  transfers: AssetTransfer[];
  ownershipHistory: OwnershipRecord[];
  metadata: AssetMetadata;
}

export interface OwnershipRecord {
  address: string;
  amount: string;
  percentage: number;
  acquisitionDate: number;
  acquisitionPrice: number;
}

export interface AssetMetadata {
  description: string;
  location?: string;
  specifications: Record<string, any>;
  documents: string[];
  images: string[];
  valuation: {
    estimatedValue: number;
    lastAppraised: number;
    appraisalMethod: string;
  };
  legal: {
    ownershipType: string;
    restrictions: string[];
    encumbrances: string[];
  };
}

// Mock data
export const MOCK_ASSET_TOKENS: AssetToken[] = [
  {
    id: 'token_1',
    assetId: 'asset_1',
    assetTitle: 'Luxury Manhattan Apartment',
    assetCategory: 'real-estate',
    assetType: 'residential',
    tokenId: '1',
    tokenContract: '0x1234...5678',
    balance: '1000000000000000000',
    decimals: 18,
    valueUSD: 250000,
    valueETH: 125,
    acquisitionPrice: 200000,
    acquisitionDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
    lastUpdated: Date.now(),
    isFractional: true,
    totalSupply: '10000000000000000000',
    ownerPercentage: 10
  },
  {
    id: 'token_2',
    assetId: 'asset_2',
    assetTitle: 'Contemporary Art Piece',
    assetCategory: 'art',
    assetType: 'painting',
    tokenId: '2',
    tokenContract: '0x2345...6789',
    balance: '500000000000000000',
    decimals: 18,
    valueUSD: 75000,
    valueETH: 37.5,
    acquisitionPrice: 60000,
    acquisitionDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
    lastUpdated: Date.now(),
    isFractional: true,
    totalSupply: '10000000000000000000',
    ownerPercentage: 5
  },
  {
    id: 'token_3',
    assetId: 'asset_3',
    assetTitle: 'Gold Bullion Collection',
    assetCategory: 'commodities',
    assetType: 'precious-metals',
    tokenId: '3',
    tokenContract: '0x3456...7890',
    balance: '10000000000000000000',
    decimals: 18,
    valueUSD: 50000,
    valueETH: 25,
    acquisitionPrice: 45000,
    acquisitionDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lastUpdated: Date.now(),
    isFractional: false,
    totalSupply: '10000000000000000000',
    ownerPercentage: 100
  }
];

export const MOCK_PERFORMANCE: AssetPerformance[] = [
  {
    assetId: 'asset_1',
    currentValue: 250000,
    previousValue: 240000,
    change24h: 4.17,
    change7d: 8.5,
    change30d: 15.2,
    changeAllTime: 25,
    volatility: 12.5,
    volume24h: 50000,
    marketCap: 2500000,
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      price: 240000 + Math.random() * 10000,
      volume: Math.random() * 100000
    }))
  },
  {
    assetId: 'asset_2',
    currentValue: 75000,
    previousValue: 72000,
    change24h: 4.17,
    change7d: 6.25,
    change30d: 12.5,
    changeAllTime: 25,
    volatility: 18.2,
    volume24h: 15000,
    marketCap: 1500000,
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      price: 72000 + Math.random() * 3000,
      volume: Math.random() * 50000
    }))
  },
  {
    assetId: 'asset_3',
    currentValue: 50000,
    previousValue: 49500,
    change24h: 1.01,
    change7d: 2.04,
    change30d: 5.26,
    changeAllTime: 11.11,
    volatility: 8.5,
    volume24h: 25000,
    marketCap: 500000,
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
      price: 49500 + Math.random() * 500,
      volume: Math.random() * 75000
    }))
  }
];

export const MOCK_DIVIDENDS: Dividend[] = [
  {
    id: 'div_1',
    assetId: 'asset_1',
    assetTitle: 'Luxury Manhattan Apartment',
    amount: '1250000000000000000',
    currency: 'USD',
    tokenPrice: 2500,
    totalValue: 3125,
    paymentDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    declaredDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
    frequency: 'quarterly',
    status: 'paid',
    txHash: '0xabc1...def2',
    yieldPercentage: 1.25
  },
  {
    id: 'div_2',
    assetId: 'asset_2',
    assetTitle: 'Contemporary Art Piece',
    amount: '250000000000000000',
    currency: 'USD',
    tokenPrice: 75000,
    totalValue: 187.5,
    paymentDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    declaredDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
    frequency: 'annually',
    status: 'paid',
    txHash: '0xdef3...ghi4',
    yieldPercentage: 0.25
  },
  {
    id: 'div_3',
    assetId: 'asset_1',
    assetTitle: 'Luxury Manhattan Apartment',
    amount: '1250000000000000000',
    currency: 'USD',
    tokenPrice: 2500,
    totalValue: 3125,
    paymentDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    declaredDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
    frequency: 'quarterly',
    status: 'pending',
    yieldPercentage: 1.25
  }
];

export const MOCK_TRANSFERS: AssetTransfer[] = [
  {
    id: 'transfer_1',
    assetId: 'asset_1',
    assetTitle: 'Luxury Manhattan Apartment',
    from: '0x1111...2222',
    to: '0x3333...4444',
    amount: '1000000000000000000',
    price: 240000,
    totalValue: 24000,
    timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
    txHash: '0x1234...5678',
    status: 'completed',
    gasUsed: '150000',
    gasCost: 0.015,
    type: 'sale'
  },
  {
    id: 'transfer_2',
    assetId: 'asset_2',
    assetTitle: 'Contemporary Art Piece',
    from: '0x5555...6666',
    to: '0x7777...8888',
    amount: '500000000000000000',
    price: 72000,
    totalValue: 3600,
    timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    txHash: '0x2345...6789',
    status: 'completed',
    gasUsed: '120000',
    gasCost: 0.012,
    type: 'sale'
  }
];

// Main hook for asset portfolio management
export function useAssetPortfolio() {
  const { address } = useAccount();
  const [assetTokens, setAssetTokens] = useState<AssetToken[]>([]);
  const [performance, setPerformance] = useState<AssetPerformance[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  // Load portfolio data
  const loadPortfolio = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAssetTokens(MOCK_ASSET_TOKENS);
      setPerformance(MOCK_PERFORMANCE);
      setDividends(MOCK_DIVIDENDS);
      setTransfers(MOCK_TRANSFERS);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate portfolio statistics
  const portfolioStats = useMemo((): PortfolioStats => {
    const totalValueUSD = assetTokens.reduce((sum, token) => sum + token.valueUSD, 0);
    const totalValueETH = assetTokens.reduce((sum, token) => sum + token.valueETH, 0);
    const totalAssets = assetTokens.length;
    
    const paidDividends = dividends.filter(d => d.status === 'paid');
    const totalDividends = paidDividends.reduce((sum, div) => sum + div.totalValue, 0);
    const totalYield = totalDividends / totalValueUSD * 100;
    
    // Calculate portfolio changes
    const portfolioChange24h = performance.reduce((sum, perf) => {
      const token = assetTokens.find(t => t.assetId === perf.assetId);
      if (!token) return sum;
      const weight = token.valueUSD / totalValueUSD;
      return sum + (perf.change24h * weight);
    }, 0);
    
    const portfolioChange7d = performance.reduce((sum, perf) => {
      const token = assetTokens.find(t => t.assetId === perf.assetId);
      if (!token) return sum;
      const weight = token.valueUSD / totalValueUSD;
      return sum + (perf.change7d * weight);
    }, 0);
    
    const portfolioChange30d = performance.reduce((sum, perf) => {
      const token = assetTokens.find(t => t.assetId === perf.assetId);
      if (!token) return sum;
      const weight = token.valueUSD / totalValueUSD;
      return sum + (perf.change30d * weight);
    }, 0);
    
    // Find best and worst performers
    const bestPerformer = performance.reduce((best, perf) => 
      perf.change30d > (best?.change30d || 0) ? perf.assetId : best?.assetId || perf.assetId, 
      undefined as string | undefined
    );
    
    const worstPerformer = performance.reduce((worst, perf) => 
      perf.change30d < (worst?.change30d || 0) ? perf.assetId : worst?.assetId || perf.assetId, 
      undefined as string | undefined
    );
    
    // Calculate distributions
    const assetDistribution = assetTokens.reduce((dist, token) => {
      dist[token.assetId] = token.valueUSD;
      return dist;
    }, {} as Record<string, number>);
    
    const categoryDistribution = assetTokens.reduce((dist, token) => {
      dist[token.assetCategory] = (dist[token.assetCategory] || 0) + token.valueUSD;
      return dist;
    }, {} as Record<string, number>);
    
    return {
      totalValueUSD,
      totalValueETH,
      totalAssets,
      totalDividends,
      totalYield,
      bestPerformer,
      worstPerformer,
      portfolioChange24h,
      portfolioChange7d,
      portfolioChange30d,
      assetDistribution,
      categoryDistribution
    };
  }, [assetTokens, performance, dividends]);

  // Get asset details
  const getAssetDetails = (assetId: string): AssetDetails | null => {
    const asset = assetTokens.find(t => t.assetId === assetId);
    const assetPerformance = performance.find(p => p.assetId === assetId);
    const assetDividends = dividends.filter(d => d.assetId === assetId);
    const assetTransfers = transfers.filter(t => t.assetId === assetId);
    
    if (!asset || !assetPerformance) return null;
    
    // Mock ownership history
    const ownershipHistory: OwnershipRecord[] = [
      {
        address: address || '',
        amount: asset.balance,
        percentage: asset.ownerPercentage,
        acquisitionDate: asset.acquisitionDate,
        acquisitionPrice: asset.acquisitionPrice
      }
    ];
    
    // Mock metadata
    const metadata: AssetMetadata = {
      description: `Detailed description for ${asset.assetTitle}`,
      location: asset.assetCategory === 'real-estate' ? 'New York, NY' : undefined,
      specifications: {
        bedrooms: asset.assetCategory === 'real-estate' ? 2 : undefined,
        squareFootage: asset.assetCategory === 'real-estate' ? 1200 : undefined,
        artist: asset.assetCategory === 'art' ? 'Unknown Artist' : undefined,
        medium: asset.assetCategory === 'art' ? 'Oil on Canvas' : undefined
      },
      documents: [],
      images: [],
      valuation: {
        estimatedValue: asset.valueUSD,
        lastAppraised: Date.now() - 30 * 24 * 60 * 60 * 1000,
        appraisalMethod: 'Market Comparison'
      },
      legal: {
        ownershipType: 'Fractional',
        restrictions: [],
        encumbrances: []
      }
    };
    
    return {
      asset,
      performance: assetPerformance,
      dividends: assetDividends,
      transfers: assetTransfers,
      ownershipHistory,
      metadata
    };
  };

  // Transfer asset
  const transferAsset = async (assetId: string, to: string, amount: string) => {
    setIsTransferring(true);
    try {
      // Simulate transfer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update token balance
      setAssetTokens(prev => prev.map(token => {
        if (token.assetId === assetId) {
          const currentBalance = BigInt(token.balance);
          const transferAmount = BigInt(amount);
          const newBalance = currentBalance - transferAmount;
          
          return {
            ...token,
            balance: newBalance.toString(),
            ownerPercentage: Number(newBalance) / Number(token.totalSupply) * 100
          };
        }
        return token;
      }));
      
      // Add transfer record
      const newTransfer: AssetTransfer = {
        id: `transfer_${Date.now()}`,
        assetId,
        assetTitle: assetTokens.find(t => t.assetId === assetId)?.assetTitle || '',
        from: address || '',
        to,
        amount,
        price: performance.find(p => p.assetId === assetId)?.currentValue || 0,
        totalValue: 0, // Calculate based on amount percentage
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substr(2, 8)}...`,
        status: 'completed',
        gasUsed: '150000',
        gasCost: 0.015,
        type: 'transfer'
      };
      
      setTransfers(prev => [newTransfer, ...prev]);
      
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      return false;
    } finally {
      setIsTransferring(false);
    }
  };

  // Claim dividend
  const claimDividend = async (dividendId: string) => {
    try {
      // Simulate claim
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setDividends(prev => prev.map(div => 
        div.id === dividendId 
          ? { ...div, status: 'claimed', txHash: `0x${Math.random().toString(16).substr(2, 8)}...` }
          : div
      ));
      
      return true;
    } catch (error) {
      console.error('Claim failed:', error);
      return false;
    }
  };

  // Utility functions
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatTokenBalance = (balance: string, decimals: number) => {
    return formatUnits(BigInt(balance), decimals);
  };

  useEffect(() => {
    if (address) {
      loadPortfolio();
    }
  }, [address]);

  return {
    // Data
    assetTokens,
    performance,
    dividends,
    transfers,
    portfolioStats,
    selectedAsset,
    isLoading,
    isTransferring,

    // Actions
    loadPortfolio,
    getAssetDetails,
    transferAsset,
    claimDividend,
    setSelectedAsset,

    // Utilities
    formatCurrency,
    formatPercentage,
    formatTokenBalance
  };
}
