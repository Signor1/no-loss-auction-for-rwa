'use client';

import { useState } from 'react';
import { usePortfolioOverview } from '@/lib/portfolio-overview';

export function PortfolioOverview() {
  const {
    portfolioData,
    metrics,
    filteredTimeSeriesData,
    filteredCategoryData,
    isLoading,
    selectedTimeRange,
    selectedCategory,
    portfolioHealthScore,
    performanceRating,
    riskRating,
    setSelectedTimeRange,
    setSelectedCategory,
    acknowledgeWarning,
    dismissOpportunity,
    formatCurrency,
    formatPercentage,
    formatLargeNumber,
    formatDate
  } = usePortfolioOverview();

  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'allocation' | 'activity' | 'warnings' | 'opportunities'>('overview');

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'art', label: 'Art' },
    { value: 'precious-metals', label: 'Precious Metals' },
    { value: 'digital-assets', label: 'Digital Assets' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'allocation', label: 'Allocation', icon: '🎯' },
    { id: 'activity', label: 'Activity', icon: '📋' },
    { id: 'warnings', label: 'Warnings', icon: '⚠️' },
    { id: 'opportunities', label: 'Opportunities', icon: '💡' }
  ];

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#EF4444';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getPerformanceColor = (rating: string) => {
    const colors: Record<string, string> = {
      'Excellent': '#10B981',
      'Good': '#059669',
      'Average': '#F59E0B',
      'Poor': '#EF4444'
    };
    return colors[rating] || '#6B7280';
  };

  const getRiskColor = (rating: string) => {
    const colors: Record<string, string> = {
      'Low': '#10B981',
      'Medium': '#F59E0B',
      'High': '#EF4444'
    };
    return colors[rating] || '#6B7280';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Data</h3>
          <p className="text-gray-600">Unable to load portfolio information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio Overview</h1>
              <p className="text-gray-600">Comprehensive view of your investment portfolio performance and allocation</p>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showDetails ? 'Simple View' : 'Detailed View'}
            </button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(portfolioData.totalValueUSD)}
                </p>
                <p className="text-sm text-gray-600">
                  {portfolioData.totalValueETH.toFixed(2)} ETH
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-blue-600">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">24h Change</p>
                <p className={`text-3xl font-bold ${
                  portfolioData.totalValueChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(portfolioData.totalValueChange24h)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(Math.abs(portfolioData.totalValueChange24h * portfolioData.totalValueUSD / 100))}
                </p>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-green-600">📈</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900">
                  {portfolioData.assetCount}
                </p>
                <p className="text-sm text-gray-600">Assets</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-purple-600">🏠</span>
              </div>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topAssets.map((asset) => {
                const returnPercentage = ((asset.valueUSD - asset.acquisitionPrice) / asset.acquisitionPrice) * 100;
                
                return (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{asset.assetTitle}</p>
                        <p className="text-xs text-gray-500">{asset.isFractional ? 'Fractional' : 'Whole'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {asset.assetCategory.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(asset.valueUSD)}
                        </p>
                        <p className="text-xs text-gray-500">{asset.valueETH} ETH</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {asset.ownerPercentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(returnPercentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => onAssetSelect(asset.assetId)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">📈</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Best Performer</p>
              <p className="text-xs text-blue-700">
                {portfolioStats.bestPerformer ? 
                  assetTokens.find(a => a.assetId === portfolioStats.bestPerformer)?.assetTitle : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600">📉</span>
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">Needs Attention</p>
              <p className="text-xs text-red-700">
                {portfolioStats.worstPerformer ? 
                  assetTokens.find(a => a.assetId === portfolioStats.worstPerformer)?.assetTitle : 
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">💰</span>
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">Yield Rate</p>
              <p className="text-xs text-green-700">
                {formatPercentage(portfolioStats.totalYield)} annual
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
