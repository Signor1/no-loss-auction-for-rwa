'use client';

import { AssetToken, PortfolioStats } from '@/lib/asset-portfolio';

interface PortfolioOverviewProps {
  portfolioStats: PortfolioStats;
  assetTokens: AssetToken[];
  onAssetSelect: (assetId: string) => void;
}

export function PortfolioOverview({ portfolioStats, assetTokens, onAssetSelect }: PortfolioOverviewProps) {
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

  // Top performing assets
  const topAssets = assetTokens
    .sort((a, b) => b.valueUSD - a.valueUSD)
    .slice(0, 5);

  // Category distribution for pie chart
  const categoryData = Object.entries(portfolioStats.categoryDistribution).map(([category, value]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
    value,
    percentage: (value / portfolioStats.totalValueUSD) * 100
  }));

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Portfolio Overview</h2>
        <p className="text-gray-600">A comprehensive view of your asset portfolio performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Allocation */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Allocation</h3>
          
          {/* Simple Pie Chart Visualization */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-48 h-48 transform -rotate-90">
                {categoryData.map((category, index) => {
                  const percentage = category.percentage;
                  const strokeDasharray = `${percentage} ${100 - percentage}`;
                  const strokeDashoffset = index === 0 ? 0 : 
                    -categoryData.slice(0, index).reduce((sum, cat) => sum + cat.percentage, 0);
                  
                  return (
                    <circle
                      key={category.name}
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke={colors[index % colors.length]}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(portfolioStats.totalValueUSD)}
                  </p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Legend */}
          <div className="space-y-2">
            {categoryData.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(category.value)}
                  </p>
                  <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm text-gray-600">24h Change</p>
                <p className={`text-lg font-semibold ${portfolioStats.portfolioChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(portfolioStats.portfolioChange24h)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Value</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolioStats.totalValueUSD * Math.abs(portfolioStats.portfolioChange24h) / 100)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm text-gray-600">7d Change</p>
                <p className={`text-lg font-semibold ${portfolioStats.portfolioChange7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(portfolioStats.portfolioChange7d)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Value</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolioStats.totalValueUSD * Math.abs(portfolioStats.portfolioChange7d) / 100)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm text-gray-600">30d Change</p>
                <p className={`text-lg font-semibold ${portfolioStats.portfolioChange30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(portfolioStats.portfolioChange30d)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Value</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolioStats.totalValueUSD * Math.abs(portfolioStats.portfolioChange30d) / 100)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Yield</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatPercentage(portfolioStats.totalYield)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Dividends</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(portfolioStats.totalDividends)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Assets */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Assets by Value</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ownership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
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
