import { useState, useEffect, useMemo } from 'react'

export interface PersonalPerformanceMetrics {
  userId: string
  totalInvested: number
  currentValue: number
  totalProfit: number
  totalProfitPercent: number
  bestPerformingAsset: {
    id: string
    name: string
    return: number
    returnPercent: number
  }
  worstPerformingAsset: {
    id: string
    name: string
    return: number
    returnPercent: number
  }
  averageHoldTime: number
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  successRate: number
  riskScore: number
  diversificationScore: number
  activityScore: number
  overallScore: number
}

export interface BiddingAnalytics {
  totalBids: number
  successfulBids: number
  failedBids: number
  successRate: number
  averageBidAmount: number
  totalBidAmount: number
  wonAuctions: number
  totalWonValue: number
  averageWinRate: number
  bidHistory: Array<{
    id: string
    auctionId: string
    auctionTitle: string
    bidAmount: number
    timestamp: Date
    status: 'won' | 'lost' | 'active' | 'cancelled'
    assetCategory: string
    competitionLevel: 'low' | 'medium' | 'high'
  }>
  categoryPerformance: Array<{
    category: string
    totalBids: number
    successfulBids: number
    successRate: number
    averageBidAmount: number
    totalWonValue: number
  }>
  timeBasedPerformance: Array<{
    period: 'morning' | 'afternoon' | 'evening' | 'night'
    totalBids: number
    successRate: number
    averageBidAmount: number
  }>
}

export interface PortfolioPerformance {
  totalValue: number
  totalInvested: number
  totalReturns: number
  totalReturnsPercent: number
  assetAllocation: Array<{
    category: string
    value: number
    percentage: number
    performance: number
  }>
  assetPerformance: Array<{
    id: string
    name: string
    category: string
    currentValue: number
    investedAmount: number
    returns: number
    returnsPercent: number
    holdings: number
    averageBuyPrice: number
    currentPrice: number
    lastUpdated: Date
  }>
  performanceHistory: Array<{
    date: Date
    portfolioValue: number
    dailyChange: number
    dailyChangePercent: number
  }>
  riskMetrics: {
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    beta: number
    alpha: number
    valueAtRisk: number
  }
  diversificationMetrics: {
    categoryCount: number
    assetCount: number
    herfindahlIndex: number
    diversificationRatio: number
  }
}

export interface ROICalculations {
  overallROI: number
  annualizedROI: number
  monthlyROI: number
  weeklyROI: number
  dailyROI: number
  assetROI: Array<{
    assetId: string
    assetName: string
    investedAmount: number
    currentValue: number
    roi: number
    roiPercent: number
    holdingPeriod: number
    annualizedROI: number
  }>
  categoryROI: Array<{
    category: string
    totalInvested: number
    currentValue: number
    roi: number
    roiPercent: number
    assetCount: number
  }>
  timeBasedROI: Array<{
    period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
    roi: number
    roiPercent: number
    startValue: number
    endValue: number
  }>
  benchmarkComparison: {
    portfolioROI: number
    benchmarkROI: number
    outperformance: number
    outperformancePercent: number
    correlation: number
  }
}

export interface ActivityStatistics {
  totalActivities: number
  loginCount: number
  averageSessionDuration: number
  lastActiveDate: Date
  joinDate: Date
  activityByType: Array<{
    type: 'bid' | 'transaction' | 'portfolio_view' | 'analytics_view' | 'auction_browse' | 'other'
    count: number
    percentage: number
  }>
  activityByTimeOfDay: Array<{
    hour: number
    count: number
    percentage: number
  }>
  activityByDayOfWeek: Array<{
    day: string
    count: number
    percentage: number
  }>
  streakMetrics: {
    currentStreak: number
    longestStreak: number
    totalActiveDays: number
    averageActivitiesPerDay: number
  }
  engagementMetrics: {
    pagesPerSession: number
    bounceRate: number
    returnUserRate: number
    featureAdoptionRate: number
  }
}

export interface EarningsReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time'
  totalEarnings: number
  totalLosses: number
  netEarnings: number
  earningsByCategory: Array<{
    category: string
    earnings: number
    losses: number
    net: number
    percentage: number
  }>
  earningsByAsset: Array<{
    assetId: string
    assetName: string
    earnings: number
    losses: number
    net: number
    percentage: number
    transactions: number
  }>
  earningsTimeline: Array<{
    date: Date
    earnings: number
    losses: number
    net: number
    cumulative: number
  }>
  taxImplications: {
    totalGains: number
    totalLosses: number
    taxableGains: number
    estimatedTax: number
    taxRate: number
  }
  performanceMetrics: {
    winRate: number
    averageWin: number
    averageLoss: number
    profitFactor: number
    recoveryFactor: number
  }
}

export interface UserAnalyticsFilters {
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
  category: string
  assetType: 'all' | 'rwa' | 'defi' | 'nft' | 'gaming'
  minAmount: string
  maxAmount: string
  sortBy: 'performance' | 'volume' | 'roi' | 'activity'
  sortOrder: 'asc' | 'desc'
}

export interface UserAnalyticsStats {
  totalUsers: number
  activeUsers: number
  averagePortfolioValue: number
  averageROI: number
  topPerformer: {
    userId: string
    username: string
    portfolioValue: number
    roi: number
  }
  platformMetrics: {
    totalVolume: number
    totalTransactions: number
    averageTransactionValue: number
    userRetentionRate: number
  }
}

// Mock data
export const mockPersonalPerformanceMetrics: PersonalPerformanceMetrics = {
  userId: 'user-123',
  totalInvested: 250000,
  currentValue: 287500,
  totalProfit: 37500,
  totalProfitPercent: 15.0,
  bestPerformingAsset: {
    id: 'asset-1',
    name: 'Manhattan Tower A',
    return: 12500,
    returnPercent: 25.0
  },
  worstPerformingAsset: {
    id: 'asset-3',
    name: 'Silver Reserve Token',
    return: -2500,
    returnPercent: -5.0
  },
  averageHoldTime: 45,
  totalTransactions: 156,
  successfulTransactions: 142,
  failedTransactions: 14,
  successRate: 91.0,
  riskScore: 6.5,
  diversificationScore: 8.2,
  activityScore: 7.8,
  overallScore: 7.5
}

export const mockBiddingAnalytics: BiddingAnalytics = {
  totalBids: 89,
  successfulBids: 34,
  failedBids: 55,
  successRate: 38.2,
  averageBidAmount: 8500,
  totalBidAmount: 756500,
  wonAuctions: 34,
  totalWonValue: 289000,
  averageWinRate: 38.2,
  bidHistory: Array.from({ length: 20 }, (_, i) => ({
    id: `bid-${i}`,
    auctionId: `auction-${Math.floor(i / 3)}`,
    auctionTitle: `RWA Auction #${Math.floor(i / 3) + 1}`,
    bidAmount: 5000 + Math.random() * 15000,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    status: ['won', 'lost', 'active', 'cancelled'][Math.floor(Math.random() * 4)] as any,
    assetCategory: ['Real Estate', 'Commodities', 'Art & Collectibles'][Math.floor(Math.random() * 3)],
    competitionLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
  })),
  categoryPerformance: [
    {
      category: 'Real Estate',
      totalBids: 35,
      successfulBids: 15,
      successRate: 42.9,
      averageBidAmount: 12000,
      totalWonValue: 180000
    },
    {
      category: 'Commodities',
      totalBids: 28,
      successfulBids: 10,
      successRate: 35.7,
      averageBidAmount: 6500,
      totalWonValue: 65000
    },
    {
      category: 'Art & Collectibles',
      totalBids: 26,
      successfulBids: 9,
      successRate: 34.6,
      averageBidAmount: 5500,
      totalWonValue: 44000
    }
  ],
  timeBasedPerformance: [
    {
      period: 'morning',
      totalBids: 15,
      successRate: 40.0,
      averageBidAmount: 8000
    },
    {
      period: 'afternoon',
      totalBids: 35,
      successRate: 37.1,
      averageBidAmount: 9000
    },
    {
      period: 'evening',
      totalBids: 28,
      successRate: 39.3,
      averageBidAmount: 8500
    },
    {
      period: 'night',
      totalBids: 11,
      successRate: 36.4,
      averageBidAmount: 7000
    }
  ]
}

export const mockPortfolioPerformance: PortfolioPerformance = {
  totalValue: 287500,
  totalInvested: 250000,
  totalReturns: 37500,
  totalReturnsPercent: 15.0,
  assetAllocation: [
    {
      category: 'Real Estate',
      value: 125000,
      percentage: 43.5,
      performance: 18.2
    },
    {
      category: 'Commodities',
      value: 85000,
      percentage: 29.6,
      performance: 12.5
    },
    {
      category: 'Art & Collectibles',
      value: 47500,
      percentage: 16.5,
      performance: 22.8
    },
    {
      category: 'Intellectual Property',
      value: 30000,
      percentage: 10.4,
      performance: 8.3
    }
  ],
  assetPerformance: [
    {
      id: 'asset-1',
      name: 'Manhattan Tower A',
      category: 'Real Estate',
      currentValue: 62500,
      investedAmount: 50000,
      returns: 12500,
      returnsPercent: 25.0,
      holdings: 0.5,
      averageBuyPrice: 100000,
      currentPrice: 125000,
      lastUpdated: new Date()
    },
    {
      id: 'asset-2',
      name: 'Gold Reserve Token',
      category: 'Commodities',
      currentValue: 52500,
      investedAmount: 45000,
      returns: 7500,
      returnsPercent: 16.7,
      holdings: 25,
      averageBuyPrice: 1800,
      currentPrice: 2100,
      lastUpdated: new Date()
    },
    {
      id: 'asset-3',
      name: 'Rare Painting #42',
      category: 'Art & Collectibles',
      currentValue: 47500,
      investedAmount: 40000,
      returns: 7500,
      returnsPercent: 18.8,
      holdings: 1,
      averageBuyPrice: 40000,
      currentPrice: 47500,
      lastUpdated: new Date()
    }
  ],
  performanceHistory: Array.from({ length: 90 }, (_, i) => ({
    date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000),
    portfolioValue: 250000 + Math.random() * 50000,
    dailyChange: (Math.random() - 0.5) * 5000,
    dailyChangePercent: (Math.random() - 0.5) * 2
  })),
  riskMetrics: {
    volatility: 12.5,
    sharpeRatio: 1.2,
    maxDrawdown: -8.3,
    beta: 0.85,
    alpha: 2.1,
    valueAtRisk: 15000
  },
  diversificationMetrics: {
    categoryCount: 4,
    assetCount: 8,
    herfindahlIndex: 0.28,
    diversificationRatio: 3.6
  }
}

export const mockROICalculations: ROICalculations = {
  overallROI: 15.0,
  annualizedROI: 18.5,
  monthlyROI: 1.2,
  weeklyROI: 0.3,
  dailyROI: 0.04,
  assetROI: [
    {
      assetId: 'asset-1',
      assetName: 'Manhattan Tower A',
      investedAmount: 50000,
      currentValue: 62500,
      roi: 12500,
      roiPercent: 25.0,
      holdingPeriod: 180,
      annualizedROI: 50.7
    },
    {
      assetId: 'asset-2',
      assetName: 'Gold Reserve Token',
      investedAmount: 45000,
      currentValue: 52500,
      roi: 7500,
      roiPercent: 16.7,
      holdingPeriod: 120,
      annualizedROI: 50.8
    },
    {
      assetId: 'asset-3',
      assetName: 'Rare Painting #42',
      investedAmount: 40000,
      currentValue: 47500,
      roi: 7500,
      roiPercent: 18.8,
      holdingPeriod: 90,
      annualizedROI: 76.4
    }
  ],
  categoryROI: [
    {
      category: 'Real Estate',
      totalInvested: 125000,
      currentValue: 145000,
      roi: 20000,
      roiPercent: 16.0,
      assetCount: 3
    },
    {
      category: 'Commodities',
      totalInvested: 85000,
      currentValue: 95000,
      roi: 10000,
      roiPercent: 11.8,
      assetCount: 2
    },
    {
      category: 'Art & Collectibles',
      totalInvested: 40000,
      currentValue: 47500,
      roi: 7500,
      roiPercent: 18.8,
      assetCount: 1
    }
  ],
  timeBasedROI: [
    {
      period: '1D',
      roi: 500,
      roiPercent: 0.2,
      startValue: 287000,
      endValue: 287500
    },
    {
      period: '1W',
      roi: 2500,
      roiPercent: 0.9,
      startValue: 285000,
      endValue: 287500
    },
    {
      period: '1M',
      roi: 7500,
      roiPercent: 2.7,
      startValue: 280000,
      endValue: 287500
    },
    {
      period: '3M',
      roi: 15000,
      roiPercent: 5.5,
      startValue: 272500,
      endValue: 287500
    },
    {
      period: '6M',
      roi: 22500,
      roiPercent: 8.5,
      startValue: 265000,
      endValue: 287500
    },
    {
      period: '1Y',
      roi: 37500,
      roiPercent: 15.0,
      startValue: 250000,
      endValue: 287500
    },
    {
      period: 'ALL',
      roi: 37500,
      roiPercent: 15.0,
      startValue: 250000,
      endValue: 287500
    }
  ],
  benchmarkComparison: {
    portfolioROI: 15.0,
    benchmarkROI: 12.5,
    outperformance: 2.5,
    outperformancePercent: 20.0,
    correlation: 0.75
  }
}

export const mockActivityStatistics: ActivityStatistics = {
  totalActivities: 1247,
  loginCount: 289,
  averageSessionDuration: 18.5,
  lastActiveDate: new Date(),
  joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
  activityByType: [
    {
      type: 'bid',
      count: 423,
      percentage: 33.9
    },
    {
      type: 'transaction',
      count: 312,
      percentage: 25.0
    },
    {
      type: 'portfolio_view',
      count: 234,
      percentage: 18.8
    },
    {
      type: 'analytics_view',
      count: 156,
      percentage: 12.5
    },
    {
      type: 'auction_browse',
      count: 89,
      percentage: 7.1
    },
    {
      type: 'other',
      count: 33,
      percentage: 2.7
    }
  ],
  activityByTimeOfDay: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: Math.floor(Math.random() * 50) + 10,
    percentage: 0
  })),
  activityByDayOfWeek: [
    { day: 'Monday', count: 189, percentage: 15.2 },
    { day: 'Tuesday', count: 203, percentage: 16.3 },
    { day: 'Wednesday', count: 178, percentage: 14.3 },
    { day: 'Thursday', count: 195, percentage: 15.6 },
    { day: 'Friday', count: 167, percentage: 13.4 },
    { day: 'Saturday', count: 145, percentage: 11.6 },
    { day: 'Sunday', count: 170, percentage: 13.6 }
  ],
  streakMetrics: {
    currentStreak: 12,
    longestStreak: 45,
    totalActiveDays: 289,
    averageActivitiesPerDay: 4.3
  },
  engagementMetrics: {
    pagesPerSession: 3.2,
    bounceRate: 28.5,
    returnUserRate: 78.9,
    featureAdoptionRate: 65.4
  }
}

export const mockEarningsReport: EarningsReport = {
  period: 'yearly',
  totalEarnings: 45000,
  totalLosses: 7500,
  netEarnings: 37500,
  earningsByCategory: [
    {
      category: 'Real Estate',
      earnings: 20000,
      losses: 2000,
      net: 18000,
      percentage: 48.0
    },
    {
      category: 'Commodities',
      earnings: 12000,
      losses: 2000,
      net: 10000,
      percentage: 26.7
    },
    {
      category: 'Art & Collectibles',
      earnings: 13000,
      losses: 3500,
      net: 9500,
      percentage: 25.3
    }
  ],
  earningsByAsset: [
    {
      assetId: 'asset-1',
      assetName: 'Manhattan Tower A',
      earnings: 12500,
      losses: 0,
      net: 12500,
      percentage: 33.3,
      transactions: 3
    },
    {
      assetId: 'asset-2',
      assetName: 'Gold Reserve Token',
      earnings: 8000,
      losses: 500,
      net: 7500,
      percentage: 20.0,
      transactions: 5
    },
    {
      assetId: 'asset-3',
      assetName: 'Rare Painting #42',
      earnings: 7500,
      losses: 0,
      net: 7500,
      percentage: 20.0,
      transactions: 1
    }
  ],
  earningsTimeline: Array.from({ length: 12 }, (_, i) => ({
    date: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000),
    earnings: 2000 + Math.random() * 3000,
    losses: Math.random() * 1000,
    net: 2000 + Math.random() * 2000,
    cumulative: 0
  })).map((item, index, array) => ({
    ...item,
    cumulative: array.slice(0, index + 1).reduce((sum, curr) => sum + curr.net, 0)
  })),
  taxImplications: {
    totalGains: 45000,
    totalLosses: 7500,
    taxableGains: 37500,
    estimatedTax: 7500,
    taxRate: 20.0
  },
  performanceMetrics: {
    winRate: 85.7,
    averageWin: 5250,
    averageLoss: 1500,
    profitFactor: 2.8,
    recoveryFactor: 5.0
  }
}

export const mockUserAnalyticsStats: UserAnalyticsStats = {
  totalUsers: 12500,
  activeUsers: 3500,
  averagePortfolioValue: 125000,
  averageROI: 12.5,
  topPerformer: {
    userId: 'user-456',
    username: 'crypto_whale',
    portfolioValue: 2500000,
    roi: 45.2
  },
  platformMetrics: {
    totalVolume: 85000000,
    totalTransactions: 15600,
    averageTransactionValue: 5449,
    userRetentionRate: 78.5
  }
}

// Hook for user analytics
export function useUserAnalytics() {
  const [personalMetrics, setPersonalMetrics] = useState<PersonalPerformanceMetrics>(mockPersonalPerformanceMetrics)
  const [biddingAnalytics, setBiddingAnalytics] = useState<BiddingAnalytics>(mockBiddingAnalytics)
  const [portfolioPerformance, setPortfolioPerformance] = useState<PortfolioPerformance>(mockPortfolioPerformance)
  const [roiCalculations, setROICalculations] = useState<ROICalculations>(mockROICalculations)
  const [activityStatistics, setActivityStatistics] = useState<ActivityStatistics>(mockActivityStatistics)
  const [earningsReport, setEarningsReport] = useState<EarningsReport>(mockEarningsReport)
  const [stats, setStats] = useState<UserAnalyticsStats>(mockUserAnalyticsStats)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UserAnalyticsFilters>({
    timeframe: '1Y',
    category: 'all',
    assetType: 'all',
    minAmount: '',
    maxAmount: '',
    sortBy: 'performance',
    sortOrder: 'desc'
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioPerformance(prev => ({
        ...prev,
        totalValue: prev.totalValue * (1 + (Math.random() - 0.5) * 0.002),
        totalReturns: prev.totalReturns * (1 + (Math.random() - 0.5) * 0.002),
        performanceHistory: prev.performanceHistory.slice(1).concat({
          date: new Date(),
          portfolioValue: prev.totalValue * (1 + (Math.random() - 0.5) * 0.002),
          dailyChange: (Math.random() - 0.5) * 1000,
          dailyChangePercent: (Math.random() - 0.5) * 0.5
        })
      }))

      setPersonalMetrics(prev => ({
        ...prev,
        currentValue: prev.currentValue * (1 + (Math.random() - 0.5) * 0.002),
        totalProfit: prev.totalProfit * (1 + (Math.random() - 0.5) * 0.002),
        totalProfitPercent: prev.totalProfitPercent + (Math.random() - 0.5) * 0.1
      }))
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  // Update filters
  const updateFilters = (newFilters: Partial<UserAnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      timeframe: '1Y',
      category: 'all',
      assetType: 'all',
      minAmount: '',
      maxAmount: '',
      sortBy: 'performance',
      sortOrder: 'desc'
    })
  }

  // Get performance score
  const getPerformanceScore = () => {
    const { overallScore, successRate, totalProfitPercent } = personalMetrics
    return Math.round((overallScore + successRate / 10 + totalProfitPercent / 10) / 3 * 10) / 10
  }

  // Get risk level
  const getRiskLevel = () => {
    const { riskScore } = personalMetrics
    if (riskScore <= 3) return 'Low'
    if (riskScore <= 7) return 'Medium'
    return 'High'
  }

  // Get activity level
  const getActivityLevel = () => {
    const { activityScore } = personalMetrics
    if (activityScore <= 3) return 'Low'
    if (activityScore <= 7) return 'Medium'
    return 'High'
  }

  // Export analytics data
  const exportAnalytics = async (format: 'csv' | 'json' | 'pdf') => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const data = {
        personalMetrics,
        biddingAnalytics,
        portfolioPerformance,
        roiCalculations,
        activityStatistics,
        earningsReport
      }
      
      console.log(`Exporting analytics data as ${format}:`, data)
    } catch (err) {
      setError('Failed to export analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    personalMetrics,
    biddingAnalytics,
    portfolioPerformance,
    roiCalculations,
    activityStatistics,
    earningsReport,
    stats,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getPerformanceScore,
    getRiskLevel,
    getActivityLevel,
    exportAnalytics
  }
}
