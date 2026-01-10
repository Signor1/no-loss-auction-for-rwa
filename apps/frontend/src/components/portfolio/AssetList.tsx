'use client';

import { useState } from 'react';
import { AssetToken, AssetDetails } from '@/lib/asset-portfolio';

interface AssetListProps {
  assetTokens: AssetToken[];
  selectedAsset: string | null;
  onAssetSelect: (assetId: string) => void;
  assetDetails: AssetDetails | null;
}

export function AssetList({ assetTokens, selectedAsset, onAssetSelect, assetDetails }: AssetListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'value' | 'return' | 'acquired' | 'category'>('value');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  // Filter and sort assets
  const filteredAssets = assetTokens
    .filter(asset => filterCategory === 'all' || asset.assetCategory === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.valueUSD - a.valueUSD;
        case 'return':
          const returnA = ((a.valueUSD - a.acquisitionPrice) / a.acquisitionPrice) * 100;
          const returnB = ((b.valueUSD - b.acquisitionPrice) / b.acquisitionPrice) * 100;
          return returnB - returnA;
        case 'acquired':
          return b.acquisitionDate - a.acquisitionDate;
        case 'category':
          return a.assetCategory.localeCompare(b.assetCategory);
        default:
          return 0;
      }
    });

  const categories = Array.from(new Set(assetTokens.map(asset => asset.assetCategory)));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Assets</h2>
        <p className="text-gray-600">Manage and view your tokenized asset portfolio</p>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="value">Sort by Value</option>
            <option value="return">Sort by Return</option>
            <option value="acquired">Sort by Date Acquired</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Asset Details Panel */}
      {selectedAsset && assetDetails && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{assetDetails.asset.assetTitle}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {assetDetails.asset.assetCategory.replace('-', ' ')}
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {assetDetails.asset.isFractional ? 'Fractional' : 'Whole'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onAssetSelect('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Current Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(assetDetails.asset.valueUSD)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ownership</p>
              <p className="text-lg font-semibold text-gray-900">
                {assetDetails.asset.ownerPercentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Return</p>
              <p className={`text-lg font-semibold ${assetDetails.performance.changeAllTime >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(assetDetails.performance.changeAllTime)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Performance</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">24h Change</span>
                  <span className={assetDetails.performance.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(assetDetails.performance.change24h)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">7d Change</span>
                  <span className={assetDetails.performance.change7d >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(assetDetails.performance.change7d)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">30d Change</span>
                  <span className={assetDetails.performance.change30d >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(assetDetails.performance.change30d)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Asset Details</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Token Balance</span>
                  <span className="text-gray-900">
                    {parseFloat(assetDetails.asset.balance) / Math.pow(10, assetDetails.asset.decimals)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Acquired</span>
                  <span className="text-gray-900">{formatDate(assetDetails.asset.acquisitionDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dividend Yield</span>
                  <span className="text-gray-900">
                    {assetDetails.dividends.length > 0 ? 
                      formatPercentage(assetDetails.dividends.reduce((sum, d) => sum + d.yieldPercentage, 0) / assetDetails.dividends.length) : 
                      '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const returnPercentage = ((asset.valueUSD - asset.acquisitionPrice) / asset.acquisitionPrice) * 100;
            const isSelected = selectedAsset === asset.assetId;
            
            return (
              <div
                key={asset.id}
                onClick={() => onAssetSelect(asset.assetId)}
                className={`bg-white border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{asset.assetTitle}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {asset.assetCategory.replace('-', ' ')}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {asset.isFractional ? 'Fractional' : 'Whole'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">
                      {asset.assetCategory === 'real-estate' ? '🏠' : 
                       asset.assetCategory === 'art' ? '🎨' : 
                       asset.assetCategory === 'commodities' ? '🪙' : '📄'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Current Value</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(asset.valueUSD)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Return</p>
                      <p className={`font-semibold ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(returnPercentage)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Ownership</p>
                      <p className="font-semibold text-gray-900">
                        {asset.ownerPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Acquired: {formatDate(asset.acquisitionDate)}</span>
                      <span>{asset.valueETH} ETH</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
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
                  Return
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ownership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acquired
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssets.map((asset) => {
                const returnPercentage = ((asset.valueUSD - asset.acquisitionPrice) / asset.acquisitionPrice) * 100;
                const isSelected = selectedAsset === asset.assetId;
                
                return (
                  <tr 
                    key={asset.id} 
                    className={`${isSelected ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => onAssetSelect(asset.assetId)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{asset.assetTitle}</p>
                        <p className="text-xs text-gray-500">
                          {asset.isFractional ? 'Fractional' : 'Whole'}
                        </p>
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
                      <span className={`text-sm font-medium ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(returnPercentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {asset.ownerPercentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(asset.acquisitionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssetSelect(asset.assetId);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
          <p className="text-gray-600">
            {filterCategory !== 'all' 
              ? `No assets in the ${filterCategory} category` 
              : 'You haven\'t acquired any assets yet'
            }
          </p>
        </div>
      )}
    </div>
  );
}
