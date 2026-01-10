'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

// Types for portfolio overview
export interface PortfolioOverview {
  totalValueUSD: number;
  totalValueETH: number;
  totalValueChange24h: number;
  totalValueChange7d: number;
  totalValueChange30d: number;
  totalValueChangeAllTime: number;
  assetCount: number;
  categoryDistribution: CategoryDistribution[];
  topPerformers: AssetPerformer[];
  recentActivity: PortfolioActivity[];
  warnings: PortfolioWarning[];
  opportunities: PortfolioOpportunity[];
  lastUpdated: number;
}

export interface CategoryDistribution {
  category: string;
  value: number;
  percentage: number;
  assetCount: number;
  color: string;
  icon: string;
  change24h: number;
  change7d: number;
}

export interface AssetPerformer {
  assetId: string;
  assetTitle: string;
  assetImage: string;
  currentValue: number;
  acquisitionPrice: number;
  totalReturn: number;
  returnPercentage: number;
  rank: number;
  category: string;
  lastUpdated: number;
}

export interface PortfolioActivity {
  id: string;
  type: 'transaction' | 'auction' | 'dividend' | 'verification' | 'price_alert';
  title: string;
  description: string;
  timestamp: number;
  value?: number;
  status: 'success' | 'pending' | 'warning' | 'error';
  icon: string;
  color: string;
  metadata?: any;
}

export interface PortfolioWarning {
  id: string;
  type: 'price_drop' | 'high_volatility' | 'verification_expiry' | 'gas_spike' | 'liquidity_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedAssets: string[];
  recommendedAction: string;
  createdAt: number;
  acknowledged: boolean;
}

export interface PortfolioOpportunity {
  id: string;
  type: 'buy_dip' | 'dividend_yield' | 'arbitrage' | 'new_listing' | 'upgrade_opportunity';
  title: string;
  description: string;
  potentialValue: number;
  confidence: number;
  timeHorizon: string;
  riskLevel: 'low' | 'medium' | 'high';
  actionUrl?: string;
  expiresAt?: number;
  createdAt: number;
}

export interface PortfolioMetrics {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  averageHoldTime: number;
  diversificationScore: number;
  riskScore: number;
}

export interface AssetAllocation {
  assetId: string;
  assetTitle: string;
  category: string;
  currentValue: number;
  targetAllocation: number;
  currentAllocation: number;
  allocationDifference: number;
  rebalanceRecommendation: string;
}

export interface TimeSeriesData {
  timestamp: number;
  value: number;
  category?: string;
  assetId?: string;
}

export interface PortfolioSettings {
  autoRebalance: boolean;
  rebalanceThreshold: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  targetAllocation: Record<string, number>;
  alertsEnabled: boolean;
  alertTypes: string[];
  currency: string;
  timezone: string;
}

// Mock data
export const MOCK_PORTFOLIO_OVERVIEW: PortfolioOverview = {
  totalValueUSD: 2847500,
  totalValueETH: 1450.25,
  totalValueChange24h: 2.5,
  totalValueChange7d: 8.2,
  totalValueChange30d: 15.7,
  totalValueChangeAllTime: 45.3,
  assetCount: 12,
  categoryDistribution: [
    {
      category: 'real-estate',
      value: 1250000,
      percentage: 43.9,
      assetCount: 4,
      color: '#10B981',
      icon: '🏠',
      change24h: 1.2,
      change7d: 5.8
    },
    {
      category: 'art',
      value: 750000,
      percentage: 26.3,
      assetCount: 3,
      color: '#8B5CF6',
      icon: '🎨',
      change24h: 3.5,
      change7d: 12.1
    },
    {
      category: 'precious-metals',
      value: 500000,
      percentage: 17.6,
      assetCount: 2,
      color: '#F59E0B',
      icon: '🥇',
      change24h: -0.8,
      change7d: 2.3
    },
    {
      category: 'digital-assets',
      value: 347500,
      percentage: 12.2,
      assetCount: 3,
      color: '#3B82F6',
      icon: '💎',
      change24h: 5.2,
      change7d: 18.7
    }
  ],
  topPerformers: [
    {
      assetId: 'asset_1',
      assetTitle: 'Luxury Manhattan Apartment',
      assetImage: '/assets/apartment.jpg',
      currentValue: 650000,
      acquisitionPrice: 500000,
      totalReturn: 150000,
      returnPercentage: 30.0,
      rank: 1,
      category: 'real-estate',
      lastUpdated: Date.now() - 2 * 60 * 60 * 1000
    },
    {
      assetId: 'asset_2',
      assetTitle: 'Contemporary Art Piece',
      assetImage: '/assets/art.jpg',
      currentValue: 425000,
      acquisitionPrice: 350000,
      totalReturn: 75000,
      returnPercentage: 21.4,
      rank: 2,
      category: 'art',
      lastUpdated: Date.now() - 5 * 60 * 60 * 1000
    },
    {
      assetId: 'asset_3',
      assetTitle: 'Gold Bullion Collection',
      assetImage: '/assets/gold.jpg',
      currentValue: 275000,
      acquisitionPrice: 250000,
      totalReturn: 25000,
      returnPercentage: 10.0,
      rank: 3,
      category: 'precious-metals',
      lastUpdated: Date.now() - 1 * 60 * 60 * 1000
    }
  ],
  recentActivity: [
    {
      id: 'activity_1',
      type: 'dividend',
      title: 'Dividend Received',
      description: 'Received $1,250 in dividends from your assets',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      value: 1250,
      status: 'success',
      icon: '💰',
      color: '#10B981'
    },
    {
      id: 'activity_2',
      type: 'auction',
      title: 'Auction Won',
      description: 'Successfully won auction for Contemporary Art Piece',
      timestamp: Date.now() - 6 * 60 * 60 * 1000,
      value: 425000,
      status: 'success',
      icon: '🏆',
      color: '#8B5CF6'
    },
    {
      id: 'activity_3',
      type: 'price_alert',
      title: 'Price Alert',
      description: 'Gold price dropped 5% - potential buying opportunity',
      timestamp: Date.now() - 12 * 60 * 60 * 1000,
      status: 'warning',
      icon: '📊',
      color: '#F59E0B'
    },
    {
      id: 'activity_4',
      type: 'verification',
      title: 'Asset Verified',
      description: 'Luxury Manhattan Apartment verification upgraded to Premium',
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      status: 'success',
      icon: '✅',
      color: '#059669'
    }
  ],
  warnings: [
    {
      id: 'warning_1',
      type: 'high_volatility',
      severity: 'medium',
      title: 'High Volatility Detected',
      description: 'Digital assets showing increased volatility - consider rebalancing',
      affectedAssets: ['asset_4', 'asset_5'],
      recommendedAction: 'Review portfolio allocation and consider reducing exposure',
      createdAt: Date.now() - 6 * 60 * 60 * 1000,
      acknowledged: false
    },
    {
      id: 'warning_2',
      type: 'verification_expiry',
      severity: 'high',
      title: 'Verification Expiring',
      description: 'KYC verification for 2 assets expiring in 30 days',
      affectedAssets: ['asset_1', 'asset_3'],
      recommendedAction: 'Renew verification to maintain compliance',
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      acknowledged: false
    }
  ],
  opportunities: [
    {
      id: 'opp_1',
      type: 'buy_dip',
      title: 'Gold Price Dip',
      description: 'Gold prices down 8% - good entry point for precious metals',
      potentialValue: 50000,
      confidence: 75,
      timeHorizon: '3-6 months',
      riskLevel: 'low',
      actionUrl: '/opportunities/gold-dip',
      createdAt: Date.now() - 12 * 60 * 60 * 1000,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    },
    {
      id: 'opp_2',
      type: 'dividend_yield',
      title: 'High Dividend Yield',
      description: 'New real-estate offering 12% annual dividend yield',
      potentialValue: 25000,
      confidence: 85,
      timeHorizon: '1-2 years',
      riskLevel: 'medium',
      actionUrl: '/opportunities/real-estate-dividend',
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
    }
  ],
  lastUpdated: Date.now()
};

export const MOCK_PORTFOLIO_METRICS: PortfolioMetrics = {
  totalInvested: 2000000,
  currentValue: 2847500,
  totalReturn: 847500,
  returnPercentage: 42.4,
  annualizedReturn: 18.7,
  volatility: 15.2,
  sharpeRatio: 1.23,
  maxDrawdown: -12.5,
  winRate: 78.5,
  averageHoldTime: 180,
  diversificationScore: 85,
  riskScore: 65
};

export const MOCK_TIME_SERIES_DATA: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => ({
  timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
  value: 2000000 + Math.random() * 500000 - 250000 + (i * 16667)
}));

// Main hook for portfolio overview
export function usePortfolioOverview() {
  const { address } = useAccount();
  const [portfolioData, setPortfolioData] = useState<PortfolioOverview | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load portfolio data
  const loadPortfolioData = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPortfolioData(MOCK_PORTFOLIO_OVERVIEW);
      setMetrics(MOCK_PORTFOLIO_METRICS);
      setTimeSeriesData(MOCK_TIME_SERIES_DATA);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get filtered time series data
  const getFilteredTimeSeriesData = useMemo(() => {
    if (!timeSeriesData.length) return [];
    
    const now = Date.now();
    let startDate: number;
    
    switch (selectedTimeRange) {
      case '7d':
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
      case '1y':
        startDate = now - 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        return timeSeriesData;
    }
    
    return timeSeriesData.filter(data => data.timestamp >= startDate);
  }, [timeSeriesData, selectedTimeRange]);

  // Get filtered category data
  const getFilteredCategoryData = useMemo(() => {
    if (!portfolioData) return [];
    
    if (selectedCategory === 'all') {
      return portfolioData.categoryDistribution;
    }
    
    return portfolioData.categoryDistribution.filter(cat => cat.category === selectedCategory);
  }, [portfolioData, selectedCategory]);

  // Calculate portfolio health score
  const getPortfolioHealthScore = useMemo(() => {
    if (!metrics) return 0;
    
    const returnScore = Math.min(100, Math.max(0, metrics.returnPercentage * 2));
    const riskScore = 100 - metrics.riskScore;
    const diversificationScore = metrics.diversificationScore;
    const volatilityScore = Math.max(0, 100 - metrics.volatility * 2);
    
    return Math.round((returnScore + riskScore + diversificationScore + volatilityScore) / 4);
  }, [metrics]);

  // Get performance rating
  const getPerformanceRating = useMemo(() => {
    if (!metrics) return 'Unknown';
    
    if (metrics.returnPercentage >= 20) return 'Excellent';
    if (metrics.returnPercentage >= 10) return 'Good';
    if (metrics.returnPercentage >= 0) return 'Average';
    return 'Poor';
  }, [metrics]);

  // Get risk rating
  const getRiskRating = useMemo(() => {
    if (!metrics) return 'Unknown';
    
    if (metrics.riskScore <= 30) return 'Low';
    if (metrics.riskScore <= 60) return 'Medium';
    return 'High';
  }, [metrics]);

  // Acknowledge warning
  const acknowledgeWarning = async (warningId: string) => {
    if (!portfolioData) return;
    
    try {
      setPortfolioData(prev => ({
        ...prev,
        warnings: prev.warnings.map(warning =>
          warning.id === warningId ? { ...warning, acknowledged: true } : warning
        )
      }));
    } catch (error) {
      console.error('Error acknowledging warning:', error);
    }
  };

  // Dismiss opportunity
  const dismissOpportunity = async (opportunityId: string) => {
    if (!portfolioData) return;
    
    try {
      setPortfolioData(prev => ({
        ...prev,
        opportunities: prev.opportunities.filter(opp => opp.id !== opportunityId)
      }));
    } catch (error) {
      console.error('Error dismissing opportunity:', error);
    }
  };

  // Utility functions
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    if (address) {
      loadPortfolioData();
    }
  }, [address]);

  return {
    // Data
    portfolioData,
    metrics,
    timeSeriesData,
    filteredTimeSeriesData: getFilteredTimeSeriesData,
    filteredCategoryData: getFilteredCategoryData,
    isLoading,
    selectedTimeRange,
    selectedCategory,

    // Computed values
    portfolioHealthScore: getPortfolioHealthScore,
    performanceRating: getPerformanceRating,
    riskRating: getRiskRating,

    // Actions
    loadPortfolioData,
    setSelectedTimeRange,
    setSelectedCategory,
    acknowledgeWarning,
    dismissOpportunity,

    // Utilities
    formatCurrency,
    formatPercentage,
    formatLargeNumber,
    formatDate,
    formatDateTime
  };
}
