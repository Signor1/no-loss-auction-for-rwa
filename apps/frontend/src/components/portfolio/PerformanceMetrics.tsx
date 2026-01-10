'use client';

import { useState, useMemo } from 'react';
import { AssetToken, PortfolioStats } from '@/lib/asset-portfolio';

interface PerformanceMetricsProps {
  assetTokens: AssetToken[];
  portfolioStats: PortfolioStats;
}

export function PerformanceMetrics({ assetTokens, portfolioStats }: PerformanceMetricsProps) {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Mock performance data for each asset
  const assetPerformance = useMemo(() => {
    return assetTokens.map(asset => ({
      assetId: asset.assetId,
      assetTitle: asset.assetTitle,
      category: asset.assetCategory,
      currentValue: asset.valueUSD,
      acquisitionPrice: asset.acquisitionPrice,
      change24h: Math.random() * 10 - 5, // -5% to +5%
      change7d: Math.random() * 20 - 10, // -10% to +10%
      change30d: Math.random() * 40 - 20, // -20% to +20%
      changeAllTime: ((asset.valueUSD - asset.acquisitionPrice) / asset.acquisitionPrice) * 100,
      volatility: Math.random() * 30, // 0-30%
      volume24h: Math.random() * 100000, // $0-$100k
      marketCap: asset.valueUSD * 10, // Mock market cap
      priceHistory: Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        price: asset.acquisitionPrice + (asset.valueUSD - asset.acquisitionPrice) * (i / 29) + (Math.random() - 0.5) * 1000,
        volume: Math.random() * 50000
      }))
    }));
  }, [assetTokens]);

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Calculate portfolio performance metrics
  const portfolioMetrics = useMemo(() => {
    const totalValue = assetTokens.reduce((sum, token) => sum + token.valueUSD, 0);
    const totalAcquisitionValue = assetTokens.reduce((sum, token) => sum + token.acquisitionPrice, 0);
    const totalReturn = totalValue - totalAcquisitionValue;
    const totalReturnPercentage = (totalReturn / totalAcquisitionValue) * 100;

    // Calculate weighted performance
    const weighted24h = assetPerformance.reduce((sum, perf) => {
      const asset = assetTokens.find(t => t.assetId === perf.assetId);
      if (!asset) return sum;
      const weight = asset.valueUSD / totalValue;
      return sum + (perf.change24h * weight);
    }, 0);

    const weighted7d = assetPerformance.reduce((sum, perf) => {
      const asset = assetTokens.find(t => t.assetId === perf.assetId);
      if (!asset) return sum;
      const weight = asset.valueUSD / totalValue;
      return sum + (perf.change7d * weight);
    }, 0);

    const weighted30d = assetPerformance.reduce((sum, perf) => {
      const asset = assetTokens.find(t => t.assetId === perf.assetId);
      if (!asset) return sum;
      const weight = asset.valueUSD / totalValue;
      return sum + (perf.change30d * weight);
    }, 0);

    // Calculate best and worst performers
    const sortedByReturn = [...assetPerformance].sort((a, b) => b.change30d - a.change30d);
    const bestPerformer = sortedByReturn[0];
    const worstPerformer = sortedByReturn[sortedByReturn.length - 1];

    // Calculate volatility
    const avgVolatility = assetPerformance.reduce((sum, perf) => sum + perf.volatility, 0) / assetPerformance.length;

    return {
      totalValue,
      totalReturn,
      totalReturnPercentage,
      weighted24h,
      weighted7d,
      weighted30d,
      bestPerformer,
      worstPerformer,
      avgVolatility,
      totalVolume24h: assetPerformance.reduce((sum, perf) => sum + perf.volume24h, 0)
    };
  }, [assetTokens, assetPerformance]);

  const getChangeForTimeframe = (perf: typeof assetPerformance[0]) => {
    switch (timeframe) {
      case '24h':
        return perf.change24h;
      case '7d':
        return perf.change7d;
      case '30d':
        return perf.change30d;
      case 'all':
        return perf.changeAllTime;
      default:
        return perf.change30d;
    }
  };

  const getPortfolioChangeForTimeframe = () => {
    switch (timeframe) {
      case '24h':
        return portfolioMetrics.weighted24h;
      case '7d':
        return portfolioMetrics.weighted7d;
      case '30d':
        return portfolioMetrics.weighted30d;
      case 'all':
        return portfolioMetrics.totalReturnPercentage;
      default:
        return portfolioMetrics.weighted30d;
    }
  };

  const sortedAssets = useMemo(() => {
    return [...assetPerformance].sort((a, b) => getChangeForTimeframe(b) - getChangeForTimeframe(a));
  }, [assetPerformance, timeframe]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Performance Metrics</h2>
        <p className="text-gray-600">Detailed performance analysis of your asset portfolio</p>
      </div>

      {/* Portfolio Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Return</p>
              <p className={`text-xl font-bold ${portfolioMetrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioMetrics.totalReturn)}
              </p>
              <p className={`text-sm ${portfolioMetrics.totalReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(portfolioMetrics.totalReturnPercentage)}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{timeframe.toUpperCase()} Change</p>
              <p className={`text-xl font-bold ${getPortfolioChangeForTimeframe() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(getPortfolioChangeForTimeframe())}
              </p>
              <p className="text-sm text-gray-500">
                {formatCurrency(portfolioMetrics.totalValue * Math.abs(getPortfolioChangeForTimeframe()) / 100)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">24h Volume</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(portfolioMetrics.totalVolume24h)}</p>
              <p className="text-sm text-gray-500">All assets</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">💹</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Volatility</p>
              <p className="text-xl font-bold text-gray-900">{formatPercentage(portfolioMetrics.avgVolatility)}</p>
              <p className="text-sm text-gray-500">30-day average</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('chart')}
              className={`p-2 rounded-lg ${viewMode === 'chart' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      {viewMode === 'chart' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Performance Chart</h3>
          <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>Interactive performance chart would be implemented here</p>
              <p className="text-sm mt-2">Showing {timeframe} performance for all assets</p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Performance</h3>
          
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acquisition Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {timeframe === 'all' ? 'Total Return' : timeframe.toUpperCase() + ' Change'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volatility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      24h Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Cap
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedAssets.map((perf) => {
                    const change = getChangeForTimeframe(perf);
                    const asset = assetTokens.find(t => t.assetId === perf.assetId);
                    
                    return (
                      <tr key={perf.assetId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{perf.assetTitle}</p>
                            <p className="text-xs text-gray-500">{perf.category.replace('-', ' ')}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(perf.currentValue)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{formatCurrency(perf.acquisitionPrice)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(change)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({formatCurrency(perf.currentValue * Math.abs(change) / 100)})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatPercentage(perf.volatility)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{formatCurrency(perf.volume24h)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{formatCurrency(perf.marketCap)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">🏆</span>
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Best Performer</p>
                <p className="text-xs text-green-700">{portfolioMetrics.bestPerformer?.assetTitle}</p>
                <p className="text-sm font-semibold text-green-800">
                  {formatPercentage(getChangeForTimeframe(portfolioMetrics.bestPerformer))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">📉</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Needs Attention</p>
                <p className="text-xs text-red-700">{portfolioMetrics.worstPerformer?.assetTitle}</p>
                <p className="text-sm font-semibold text-red-800">
                  {formatPercentage(getChangeForTimeframe(portfolioMetrics.worstPerformer))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">📊</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Risk Assessment</p>
                <p className="text-xs text-blue-700">Portfolio Volatility</p>
                <p className="text-sm font-semibold text-blue-800">
                  {formatPercentage(portfolioMetrics.avgVolatility)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {portfolioMetrics.avgVolatility > 20 && (
              <div className="flex items-center space-x-2 text-sm text-yellow-700">
                <span>⚠️</span>
                <span>High portfolio volatility detected. Consider diversifying to reduce risk.</span>
              </div>
            )}
            {getPortfolioChangeForTimeframe() < -10 && (
              <div className="flex items-center space-x-2 text-sm text-red-700">
                <span>📉</span>
                <span>Portfolio underperforming in current timeframe. Review asset allocation.</span>
              </div>
            )}
            {portfolioMetrics.totalReturnPercentage > 15 && (
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <span>🎉</span>
                <span>Strong portfolio performance! Consider rebalancing to lock in gains.</span>
              </div>
            )}
            {portfolioMetrics.totalVolume24h < 10000 && (
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <span>ℹ️</span>
                <span>Low trading volume. Assets may be less liquid.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
