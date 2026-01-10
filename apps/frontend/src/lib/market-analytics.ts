import { useState, useEffect, useMemo } from 'react'

export interface MarketTrend {
  id: string
  name: string
  value: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
  category: 'price' | 'volume' | 'liquidity' | 'participants'
  timeframe: '1h' | '24h' | '7d' | '30d' | '90d'
  timestamp: Date
}

export interface AssetCategory {
  id: string
  name: string
  description: string
  icon: string
  totalValue: number
  totalVolume: number
  assetCount: number
  performance: {
    daily: number
    weekly: number
    monthly: number
    yearly: number
  }
  riskLevel: 'low' | 'medium' | 'high'
  liquidityScore: number
  popularityScore: number
}

export interface PriceData {
  timestamp: Date
  price: number
  volume: number
  high: number
  low: number
  open: number
  close: number
}

export interface AssetPriceHistory {
  assetId: string
  assetName: string
  symbol: string
  currentPrice: number
  marketCap: number
  volume24h: number
  priceHistory: PriceData[]
  timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
}

export interface VolumeStatistics {
  totalVolume: number
  volume24h: number
  volume7d: number
  volume30d: number
  averageVolume: number
  volumeByCategory: Array<{
    category: string
    volume: number
    percentage: number
  }>
  volumeByNetwork: Array<{
    network: string
    volume: number
    percentage: number
  }>
  topAssets: Array<{
    assetId: string
    assetName: string
    volume: number
    percentage: number
  }>
}

export interface HistoricalData {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  data: Array<{
    date: Date
    totalMarketCap: number
    totalVolume: number
    activeUsers: number
    newUsers: number
    totalTransactions: number
    averageTransactionValue: number
    topPerformingCategory: string
    worstPerformingCategory: string
  }>
}

export interface ComparativeAnalysis {
  timeframe: '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
  categories: Array<{
    id: string
    name: string
    performance: number
    volume: number
    volatility: number
    riskAdjustedReturn: number
    sharpeRatio: number
    maxDrawdown: number
  }>
  assets: Array<{
    id: string
    name: string
    category: string
    performance: number
    volume: number
    volatility: number
    correlation: number
  }>
  marketMetrics: {
    totalReturn: number
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    beta: number
    alpha: number
  }
}

export interface MarketFilters {
  timeframe: '1h' | '24h' | '7d' | '30d' | '90d' | '1y'
  category: string
  network: string
  assetType: 'all' | 'rwa' | 'defi' | 'nft' | 'gaming'
  minMarketCap: string
  maxMarketCap: string
  minVolume: string
  maxVolume: string
  sortBy: 'performance' | 'volume' | 'marketCap' | 'liquidity'
  sortOrder: 'asc' | 'desc'
}

export interface MarketAnalyticsStats {
  totalMarketCap: number
  totalVolume24h: number
  activeAssets: number
  totalUsers: number
  averageReturn: number
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
  topGainer: {
    name: string
    change: number
  }
  topLoser: {
    name: string
    change: number
  }
  mostActive: {
    name: string
    volume: number
  }
}

// Mock data
export const mockMarketTrends: MarketTrend[] = [
  {
    id: 'trend-1',
    name: 'Total Market Cap',
    value: 1250000000,
    change: 25000000,
    changePercent: 2.04,
    trend: 'up',
    category: 'price',
    timeframe: '24h',
    timestamp: new Date()
  },
  {
    id: 'trend-2',
    name: 'Trading Volume',
    value: 85000000,
    change: -5000000,
    changePercent: -5.56,
    trend: 'down',
    category: 'volume',
    timeframe: '24h',
    timestamp: new Date()
  },
  {
    id: 'trend-3',
    name: 'Active Users',
    value: 12500,
    change: 750,
    changePercent: 6.38,
    trend: 'up',
    category: 'participants',
    timeframe: '24h',
    timestamp: new Date()
  },
  {
    id: 'trend-4',
    name: 'Total Liquidity',
    value: 420000000,
    change: 15000000,
    changePercent: 3.70,
    trend: 'up',
    category: 'liquidity',
    timeframe: '24h',
    timestamp: new Date()
  }
]

export const mockAssetCategories: AssetCategory[] = [
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Tokenized real estate properties and REITs',
    icon: '🏢',
    totalValue: 450000000,
    totalVolume: 12000000,
    assetCount: 45,
    performance: {
      daily: 1.2,
      weekly: 3.8,
      monthly: 8.5,
      yearly: 24.3
    },
    riskLevel: 'medium',
    liquidityScore: 7.2,
    popularityScore: 8.5
  },
  {
    id: 'commodities',
    name: 'Commodities',
    description: 'Precious metals, energy, and agricultural commodities',
    icon: '🥇',
    totalValue: 280000000,
    totalVolume: 8500000,
    assetCount: 28,
    performance: {
      daily: -0.8,
      weekly: 1.2,
      monthly: 4.3,
      yearly: 12.7
    },
    riskLevel: 'low',
    liquidityScore: 8.1,
    popularityScore: 7.8
  },
  {
    id: 'art-collectibles',
    name: 'Art & Collectibles',
    description: 'Fine art, rare collectibles, and luxury items',
    icon: '🎨',
    totalValue: 180000000,
    totalVolume: 3200000,
    assetCount: 62,
    performance: {
      daily: 2.5,
      weekly: 5.2,
      monthly: 12.8,
      yearly: 35.6
    },
    riskLevel: 'high',
    liquidityScore: 5.8,
    popularityScore: 9.2
  },
  {
    id: 'intellectual-property',
    name: 'Intellectual Property',
    description: 'Patents, trademarks, and digital assets',
    icon: '💡',
    totalValue: 150000000,
    totalVolume: 2800000,
    assetCount: 38,
    performance: {
      daily: 0.5,
      weekly: 2.1,
      monthly: 6.7,
      yearly: 18.9
    },
    riskLevel: 'high',
    liquidityScore: 6.2,
    popularityScore: 7.5
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Transport, utilities, and communication assets',
    icon: '🏗️',
    totalValue: 190000000,
    totalVolume: 5500000,
    assetCount: 22,
    performance: {
      daily: 1.8,
      weekly: 4.3,
      monthly: 9.2,
      yearly: 22.1
    },
    riskLevel: 'low',
    liquidityScore: 7.8,
    popularityScore: 6.9
  }
]

export const mockAssetPriceHistory: AssetPriceHistory[] = [
  {
    assetId: 'asset-1',
    assetName: 'Manhattan Tower A',
    symbol: 'MTA',
    currentPrice: 125000,
    marketCap: 125000000,
    volume24h: 2500000,
    timeframe: '30d',
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      price: 120000 + Math.random() * 10000,
      volume: 2000000 + Math.random() * 1000000,
      high: 125000 + Math.random() * 5000,
      low: 118000 + Math.random() * 2000,
      open: 120000 + Math.random() * 3000,
      close: 120000 + Math.random() * 8000
    }))
  },
  {
    assetId: 'asset-2',
    assetName: 'Gold Reserve Token',
    symbol: 'GRT',
    currentPrice: 2100,
    marketCap: 105000000,
    volume24h: 1800000,
    timeframe: '30d',
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      price: 2000 + Math.random() * 200,
      volume: 1500000 + Math.random() * 500000,
      high: 2100 + Math.random() * 100,
      low: 1950 + Math.random() * 50,
      open: 2000 + Math.random() * 100,
      close: 2000 + Math.random() * 150
    }))
  }
]

export const mockVolumeStatistics: VolumeStatistics = {
  totalVolume: 320000000,
  volume24h: 85000000,
  volume7d: 420000000,
  volume30d: 1800000000,
  averageVolume: 60000000,
  volumeByCategory: [
    { category: 'Real Estate', volume: 12000000, percentage: 14.1 },
    { category: 'Commodities', volume: 8500000, percentage: 10.0 },
    { category: 'Art & Collectibles', volume: 3200000, percentage: 3.8 },
    { category: 'Intellectual Property', volume: 2800000, percentage: 3.3 },
    { category: 'Infrastructure', volume: 5500000, percentage: 6.5 }
  ],
  volumeByNetwork: [
    { network: 'Ethereum', volume: 45000000, percentage: 52.9 },
    { network: 'Polygon', volume: 20000000, percentage: 23.5 },
    { network: 'Arbitrum', volume: 12000000, percentage: 14.1 },
    { network: 'Base', volume: 8000000, percentage: 9.4 }
  ],
  topAssets: [
    { assetId: 'asset-1', assetName: 'Manhattan Tower A', volume: 2500000, percentage: 2.9 },
    { assetId: 'asset-2', assetName: 'Gold Reserve Token', volume: 1800000, percentage: 2.1 },
    { assetId: 'asset-3', assetName: 'Rare Painting #42', volume: 1200000, percentage: 1.4 }
  ]
}

export const mockHistoricalData: HistoricalData = {
  period: 'daily',
  data: Array.from({ length: 90 }, (_, i) => ({
    date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000),
    totalMarketCap: 1000000000 + Math.random() * 500000000,
    totalVolume: 50000000 + Math.random() * 50000000,
    activeUsers: 10000 + Math.random() * 5000,
    newUsers: 100 + Math.random() * 200,
    totalTransactions: 500 + Math.random() * 300,
    averageTransactionValue: 50000 + Math.random() * 25000,
    topPerformingCategory: ['Real Estate', 'Commodities', 'Art & Collectibles'][Math.floor(Math.random() * 3)],
    worstPerformingCategory: ['Real Estate', 'Commodities', 'Art & Collectibles'][Math.floor(Math.random() * 3)]
  }))
}

export const mockComparativeAnalysis: ComparativeAnalysis = {
  timeframe: '1m',
  categories: [
    {
      id: 'real-estate',
      name: 'Real Estate',
      performance: 8.5,
      volume: 12000000,
      volatility: 12.3,
      riskAdjustedReturn: 0.69,
      sharpeRatio: 1.24,
      maxDrawdown: -8.2
    },
    {
      id: 'commodities',
      name: 'Commodities',
      performance: 4.3,
      volume: 8500000,
      volatility: 8.7,
      riskAdjustedReturn: 0.49,
      sharpeRatio: 0.89,
      maxDrawdown: -5.1
    },
    {
      id: 'art-collectibles',
      name: 'Art & Collectibles',
      performance: 12.8,
      volume: 3200000,
      volatility: 18.9,
      riskAdjustedReturn: 0.68,
      sharpeRatio: 1.18,
      maxDrawdown: -12.5
    }
  ],
  assets: [
    {
      id: 'asset-1',
      name: 'Manhattan Tower A',
      category: 'Real Estate',
      performance: 9.2,
      volume: 2500000,
      volatility: 11.5,
      correlation: 0.75
    },
    {
      id: 'asset-2',
      name: 'Gold Reserve Token',
      category: 'Commodities',
      performance: 3.8,
      volume: 1800000,
      volatility: 7.2,
      correlation: 0.45
    }
  ],
  marketMetrics: {
    totalReturn: 7.8,
    volatility: 13.2,
    sharpeRatio: 1.05,
    maxDrawdown: -9.3,
    beta: 1.12,
    alpha: 0.8
  }
}

export const mockMarketAnalyticsStats: MarketAnalyticsStats = {
  totalMarketCap: 1250000000,
  totalVolume24h: 85000000,
  activeAssets: 195,
  totalUsers: 12500,
  averageReturn: 7.8,
  marketSentiment: 'bullish',
  topGainer: {
    name: 'Rare Painting #42',
    change: 15.8
  },
  topLoser: {
    name: 'Silver Reserve Token',
    change: -8.2
  },
  mostActive: {
    name: 'Manhattan Tower A',
    volume: 2500000
  }
}

// Hook for market analytics
export function useMarketAnalytics() {
  const [trends, setTrends] = useState<MarketTrend[]>(mockMarketTrends)
  const [categories, setCategories] = useState<AssetCategory[]>(mockAssetCategories)
  const [priceHistory, setPriceHistory] = useState<AssetPriceHistory[]>(mockAssetPriceHistory)
  const [volumeStats, setVolumeStats] = useState<VolumeStatistics>(mockVolumeStatistics)
  const [historicalData, setHistoricalData] = useState<HistoricalData>(mockHistoricalData)
  const [comparativeAnalysis, setComparativeAnalysis] = useState<ComparativeAnalysis>(mockComparativeAnalysis)
  const [stats, setStats] = useState<MarketAnalyticsStats>(mockMarketAnalyticsStats)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MarketFilters>({
    timeframe: '24h',
    category: 'all',
    network: 'all',
    assetType: 'all',
    minMarketCap: '',
    maxMarketCap: '',
    minVolume: '',
    maxVolume: '',
    sortBy: 'performance',
    sortOrder: 'desc'
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrends(prev => prev.map(trend => ({
        ...trend,
        value: trend.value * (1 + (Math.random() - 0.5) * 0.01),
        change: trend.change + (Math.random() - 0.5) * trend.value * 0.001,
        changePercent: trend.changePercent + (Math.random() - 0.5) * 0.1,
        timestamp: new Date()
      })))

      setStats(prev => ({
        ...prev,
        totalMarketCap: prev.totalMarketCap * (1 + (Math.random() - 0.5) * 0.005),
        totalVolume24h: prev.totalVolume24h * (1 + (Math.random() - 0.5) * 0.02),
        activeUsers: prev.activeUsers + Math.floor((Math.random() - 0.5) * 10)
      }))
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Filter categories based on filters
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      if (filters.category !== 'all' && category.id !== filters.category) return false
      if (filters.minMarketCap && category.totalValue < parseFloat(filters.minMarketCap)) return false
      if (filters.maxMarketCap && category.totalValue > parseFloat(filters.maxMarketCap)) return false
      if (filters.minVolume && category.totalVolume < parseFloat(filters.minVolume)) return false
      if (filters.maxVolume && category.totalVolume > parseFloat(filters.maxVolume)) return false
      return true
    }).sort((a, b) => {
      let aValue: number, bValue: number
      
      switch (filters.sortBy) {
        case 'performance':
          aValue = a.performance.monthly
          bValue = b.performance.monthly
          break
        case 'volume':
          aValue = a.totalVolume
          bValue = b.totalVolume
          break
        case 'marketCap':
          aValue = a.totalValue
          bValue = b.totalValue
          break
        case 'liquidity':
          aValue = a.liquidityScore
          bValue = b.liquidityScore
          break
        default:
          aValue = a.performance.monthly
          bValue = b.performance.monthly
      }
      
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })
  }, [categories, filters])

  // Update filters
  const updateFilters = (newFilters: Partial<MarketFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      timeframe: '24h',
      category: 'all',
      network: 'all',
      assetType: 'all',
      minMarketCap: '',
      maxMarketCap: '',
      minVolume: '',
      maxVolume: '',
      sortBy: 'performance',
      sortOrder: 'desc'
    })
  }

  // Get trend data for specific timeframe
  const getTrendData = (timeframe: string) => {
    return trends.filter(trend => trend.timeframe === timeframe)
  }

  // Get category performance data
  const getCategoryPerformance = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.performance : null
  }

  // Get market sentiment indicator
  const getMarketSentiment = () => {
    const positiveTrends = trends.filter(t => t.trend === 'up').length
    const totalTrends = trends.length
    const ratio = positiveTrends / totalTrends
    
    if (ratio > 0.6) return 'bullish'
    if (ratio < 0.4) return 'bearish'
    return 'neutral'
  }

  return {
    trends,
    categories: filteredCategories,
    priceHistory,
    volumeStats,
    historicalData,
    comparativeAnalysis,
    stats,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getTrendData,
    getCategoryPerformance,
    getMarketSentiment
  }
}
