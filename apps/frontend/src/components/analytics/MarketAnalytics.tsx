'use client'

import React, { useState, useMemo } from 'react'
import { useMarketAnalytics } from '@/lib/market-analytics'

export default function MarketAnalytics() {
  const {
    trends,
    categories,
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
  } = useMarketAnalytics()

  const [activeTab, setActiveTab] = useState<'trends' | 'categories' | 'charts' | 'volume' | 'historical' | 'comparative'>('trends')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600 bg-green-50'
      case 'down': return 'text-red-600 bg-red-50'
      case 'stable': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-50'
      case 'bearish': return 'text-red-600 bg-red-50'
      case 'neutral': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive market insights and performance analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(getMarketSentiment())}`}>
            Market: {getMarketSentiment()}
          </span>
        </div>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Market Cap</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalMarketCap)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">24h Volume</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalVolume24h)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Assets</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeAssets}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Movers */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Gainer</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{stats.topGainer.name}</p>
              <p className="text-sm text-gray-500">24h change</p>
            </div>
            <span className="text-lg font-semibold text-green-600">
              {formatPercent(stats.topGainer.change)}
            </span>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Loser</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{stats.topLoser.name}</p>
              <p className="text-sm text-gray-500">24h change</p>
            </div>
            <span className="text-lg font-semibold text-red-600">
              {formatPercent(stats.topLoser.change)}
            </span>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Most Active</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{stats.mostActive.name}</p>
              <p className="text-sm text-gray-500">24h volume</p>
            </div>
            <span className="text-lg font-semibold text-blue-600">
              {formatCurrency(stats.mostActive.volume)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['trends', 'categories', 'charts', 'volume', 'historical', 'comparative'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Market Trends */}
        {activeTab === 'trends' && (
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Market Trends</h3>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {getTrendData(selectedTimeframe).map((trend) => (
                <div key={trend.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trend.name}</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(trend.value)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTrendColor(trend.trend)}`}>
                        {formatPercent(trend.changePercent)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{trend.timeframe}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Asset Categories */}
        {activeTab === 'categories' && (
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Asset Categories</h3>
              <div className="flex space-x-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="performance">Performance</option>
                  <option value="volume">Volume</option>
                  <option value="marketCap">Market Cap</option>
                  <option value="liquidity">Liquidity</option>
                </select>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(category.riskLevel)}`}>
                      {category.riskLevel}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Value</p>
                      <p className="font-medium text-gray-900">{formatCurrency(category.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Volume</p>
                      <p className="font-medium text-gray-900">{formatCurrency(category.totalVolume)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Assets</p>
                      <p className="font-medium text-gray-900">{category.assetCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Monthly Performance</p>
                      <p className={`font-medium ${category.performance.monthly >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(category.performance.monthly)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-gray-500">
                    <span>Liquidity: {category.liquidityScore}/10</span>
                    <span>Popularity: {category.popularityScore}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Charts */}
        {activeTab === 'charts' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Price Charts</h3>
            <div className="space-y-6">
              {priceHistory.map((asset) => (
                <div key={asset.assetId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{asset.assetName}</h4>
                      <p className="text-sm text-gray-500">{asset.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(asset.currentPrice)}</p>
                      <p className="text-sm text-gray-500">Market Cap: {formatCurrency(asset.marketCap)}</p>
                    </div>
                  </div>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">24h Volume</p>
                      <p className="font-medium text-gray-900">{formatCurrency(asset.volume24h)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">High</p>
                      <p className="font-medium text-gray-900">{formatCurrency(Math.max(...asset.priceHistory.map(p => p.high)))}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Low</p>
                      <p className="font-medium text-gray-900">{formatCurrency(Math.min(...asset.priceHistory.map(p => p.low)))}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Timeframe</p>
                      <p className="font-medium text-gray-900">{asset.timeframe}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volume Statistics */}
        {activeTab === 'volume' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Volume Statistics</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Volume by Category</h4>
                <div className="space-y-2">
                  {volumeStats.volumeByCategory.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-16 text-right">
                          {formatCurrency(item.volume)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Volume by Network</h4>
                <div className="space-y-2">
                  {volumeStats.volumeByNetwork.map((item) => (
                    <div key={item.network} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.network}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-16 text-right">
                          {formatCurrency(item.volume)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Top Assets by Volume</h4>
              <div className="space-y-2">
                {volumeStats.topAssets.map((asset) => (
                  <div key={asset.assetId} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-900">{asset.assetName}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{asset.percentage}%</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(asset.volume)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Historical Data */}
        {activeTab === 'historical' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historical Data</h3>
            <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center mb-6">
              <p className="text-gray-500">Historical chart visualization would go here</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Avg Market Cap</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(historicalData.data.reduce((sum, d) => sum + d.totalMarketCap, 0) / historicalData.data.length)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Avg Volume</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(historicalData.data.reduce((sum, d) => sum + d.totalVolume, 0) / historicalData.data.length)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-lg font-semibold text-gray-900">
                  {historicalData.data[historicalData.data.length - 1]?.activeUsers.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Avg Transaction</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(historicalData.data.reduce((sum, d) => sum + d.averageTransactionValue, 0) / historicalData.data.length)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparative Analysis */}
        {activeTab === 'comparative' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comparative Analysis</h3>
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Market Metrics</h4>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Return</p>
                  <p className={`text-lg font-semibold ${comparativeAnalysis.marketMetrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(comparativeAnalysis.marketMetrics.totalReturn)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Volatility</p>
                  <p className="text-lg font-semibold text-gray-900">{formatPercent(comparativeAnalysis.marketMetrics.volatility)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Sharpe Ratio</p>
                  <p className="text-lg font-semibold text-gray-900">{comparativeAnalysis.marketMetrics.sharpeRatio.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Max Drawdown</p>
                  <p className="text-lg font-semibold text-red-600">{formatPercent(comparativeAnalysis.marketMetrics.maxDrawdown)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Beta</p>
                  <p className="text-lg font-semibold text-gray-900">{comparativeAnalysis.marketMetrics.beta.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Alpha</p>
                  <p className={`text-lg font-semibold ${comparativeAnalysis.marketMetrics.alpha >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(comparativeAnalysis.marketMetrics.alpha)}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Category Performance</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volatility</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sharpe Ratio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Drawdown</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparativeAnalysis.categories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${category.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(category.performance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(category.volume)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercent(category.volatility)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.sharpeRatio.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatPercent(category.maxDrawdown)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
