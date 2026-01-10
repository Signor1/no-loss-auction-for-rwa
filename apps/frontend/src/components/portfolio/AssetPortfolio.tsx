'use client';

import { useState, useEffect } from 'react';
import { useAssetPortfolio } from '@/lib/asset-portfolio';
import { PortfolioOverview } from './PortfolioOverview';
import { AssetList } from './AssetList';
import { AssetDetails } from './AssetDetails';
import { DividendHistory } from './DividendHistory';
import { PerformanceMetrics } from './PerformanceMetrics';
import { AssetTransfer } from './AssetTransfer';

export function AssetPortfolio() {
  const {
    assetTokens,
    portfolioStats,
    selectedAsset,
    isLoading,
    getAssetDetails,
    setSelectedAsset,
    formatCurrency,
    formatPercentage
  } = useAssetPortfolio();

  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'performance' | 'dividends' | 'transfer'>('overview');
  const [assetDetails, setAssetDetails] = useState<any>(null);

  useEffect(() => {
    if (selectedAsset) {
      const details = getAssetDetails(selectedAsset);
      setAssetDetails(details);
    }
  }, [selectedAsset, getAssetDetails]);

  const handleAssetSelect = (assetId: string) => {
    setSelectedAsset(assetId);
    setActiveTab('assets');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'assets', label: 'Assets', icon: '🏠' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'dividends', label: 'Dividends', icon: '💰' },
    { id: 'transfer', label: 'Transfer', icon: '🔄' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your asset portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Portfolio</h1>
          <p className="text-gray-600">
            Manage and track your tokenized asset investments
          </p>
        </div>

        {/* Portfolio Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(portfolioStats.totalValueUSD)}
                </p>
                <p className={`text-sm mt-1 ${portfolioStats.portfolioChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(portfolioStats.portfolioChange24h)} (24h)
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{portfolioStats.totalAssets}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {assetTokens.filter(t => t.isFractional).length} fractional
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dividends</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(portfolioStats.totalDividends)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatPercentage(portfolioStats.totalYield)} yield
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">30D Change</p>
                <p className={`text-2xl font-bold ${portfolioStats.portfolioChange30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(portfolioStats.portfolioChange30d)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(portfolioStats.totalValueUSD * Math.abs(portfolioStats.portfolioChange30d) / 100)} 
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'overview' && (
            <PortfolioOverview 
              portfolioStats={portfolioStats}
              assetTokens={assetTokens}
              onAssetSelect={handleAssetSelect}
            />
          )}

          {activeTab === 'assets' && (
            <AssetList 
              assetTokens={assetTokens}
              selectedAsset={selectedAsset}
              onAssetSelect={setSelectedAsset}
              assetDetails={assetDetails}
            />
          )}

          {activeTab === 'performance' && (
            <PerformanceMetrics 
              assetTokens={assetTokens}
              portfolioStats={portfolioStats}
            />
          )}

          {activeTab === 'dividends' && (
            <DividendHistory 
              assetTokens={assetTokens}
            />
          )}

          {activeTab === 'transfer' && (
            <AssetTransfer 
              assetTokens={assetTokens}
            />
          )}
        </div>
      </div>
    </div>
  );
}
