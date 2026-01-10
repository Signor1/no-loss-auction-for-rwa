'use client';

import { useState } from 'react';
import { AssetDetails as AssetDetailsType, AssetToken, AssetPerformance, Dividend, AssetTransfer } from '@/lib/asset-portfolio';

interface AssetDetailsProps {
  asset: AssetToken;
  performance: AssetPerformance;
  dividends: Dividend[];
  transfers: AssetTransfer[];
  onClaimDividend?: (dividendId: string) => void;
  onTransferAsset?: (assetId: string, to: string, amount: string) => void;
}

export function AssetDetails({ 
  asset, 
  performance, 
  dividends, 
  transfers, 
  onClaimDividend, 
  onTransferAsset 
}: AssetDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'dividends' | 'transfers' | 'details'>('overview');

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

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const returnPercentage = ((asset.valueUSD - asset.acquisitionPrice) / asset.acquisitionPrice) * 100;
  const totalReturn = asset.valueUSD - asset.acquisitionPrice;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '📈' },
    { id: 'dividends', label: 'Dividends', icon: '💰' },
    { id: 'transfers', label: 'Transfers', icon: '🔄' },
    { id: 'details', label: 'Details', icon: '📋' }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{asset.assetTitle}</h2>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                {asset.assetCategory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                {asset.isFractional ? 'Fractional' : 'Whole'}
              </span>
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                {asset.assetType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(asset.valueUSD)}</p>
            <p className={`text-lg font-semibold ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(returnPercentage)} ({formatCurrency(totalReturn)})
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Current Value</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(asset.valueUSD)}</p>
          <p className="text-sm text-gray-500">{asset.valueETH} ETH</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Ownership</p>
          <p className="text-xl font-bold text-gray-900">{asset.ownerPercentage.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">
            {parseFloat(asset.balance) / Math.pow(10, asset.decimals)} tokens
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Acquisition Price</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(asset.acquisitionPrice)}</p>
          <p className="text-sm text-gray-500">{formatDate(asset.acquisitionDate)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Dividend Yield</p>
          <p className="text-xl font-bold text-gray-900">
            {dividends.length > 0 ? 
              formatPercentage(dividends.reduce((sum, d) => sum + d.yieldPercentage, 0) / dividends.length) : 
              '0%'
            }
          </p>
          <p className="text-sm text-gray-500">{dividends.filter(d => d.status === 'paid').length} paid</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
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

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Token Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Token Contract</span>
                        <span className="text-sm font-mono text-gray-900">{asset.tokenContract}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Token ID</span>
                        <span className="text-sm font-mono text-gray-900">{asset.tokenId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Supply</span>
                        <span className="text-sm text-gray-900">
                          {parseFloat(asset.totalSupply) / Math.pow(10, asset.decimals)} tokens
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Your Balance</span>
                        <span className="text-sm text-gray-900">
                          {parseFloat(asset.balance) / Math.pow(10, asset.decimals)} tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">24h Change</span>
                        <span className={`text-sm font-medium ${performance.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(performance.change24h)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">7d Change</span>
                        <span className={`text-sm font-medium ${performance.change7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(performance.change7d)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">30d Change</span>
                        <span className={`text-sm font-medium ${performance.change30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(performance.change30d)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">All Time Return</span>
                        <span className={`text-sm font-medium ${performance.changeAllTime >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(performance.changeAllTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h4>
                <div className="space-y-3">
                  {dividends.slice(0, 3).map((dividend) => (
                    <div key={dividend.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600">💰</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Dividend Payment</p>
                          <p className="text-xs text-gray-500">{formatDate(dividend.paymentDate)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(dividend.totalValue)}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          dividend.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {dividend.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Market Cap</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(performance.marketCap)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">24h Volume</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(performance.volume24h)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Volatility</p>
                    <p className="text-xl font-bold text-gray-900">{formatPercentage(performance.volatility)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Current Price</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(performance.currentValue)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price History (30 days)</h4>
                <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>Price chart visualization would be implemented here</p>
                    <p className="text-sm mt-2">Showing {performance.priceHistory.length} data points</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dividends' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Dividend History</h3>
                <div className="text-sm text-gray-600">
                  Total: {formatCurrency(dividends.reduce((sum, d) => sum + d.totalValue, 0))}
                </div>
              </div>

              {dividends.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No dividends yet</h3>
                  <p className="text-gray-600">This asset hasn't distributed any dividends</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dividends.map((dividend) => (
                    <div key={dividend.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600">💰</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {dividend.frequency === 'one-time' ? 'One-time' : `${dividend.frequency}`} Dividend
                            </p>
                            <p className="text-sm text-gray-600">
                              Declared: {formatDate(dividend.declaredDate)} • Paid: {formatDate(dividend.paymentDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(dividend.totalValue)}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              dividend.status === 'paid' ? 'bg-green-100 text-green-800' : 
                              dividend.status === 'claimed' ? 'bg-blue-100 text-blue-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {dividend.status}
                            </span>
                            {dividend.status === 'pending' && onClaimDividend && (
                              <button
                                onClick={() => onClaimDividend(dividend.id)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                              >
                                Claim
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Yield: {formatPercentage(dividend.yieldPercentage)}</span>
                          <span>Amount: {parseFloat(dividend.amount) / Math.pow(10, 18)} tokens</span>
                          <span>Token Price: {formatCurrency(dividend.tokenPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Transfer History</h3>
                <div className="text-sm text-gray-600">
                  Total: {transfers.length} transfers
                </div>
              </div>

              {transfers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔄</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers yet</h3>
                  <p className="text-gray-600">This asset hasn't been transferred</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transfers.map((transfer) => (
                    <div key={transfer.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600">🔄</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{transfer.type} Transfer</p>
                            <p className="text-sm text-gray-600">
                              From: {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)} → 
                              To: {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDateTime(transfer.timestamp)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{formatCurrency(transfer.totalValue)}</p>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              transfer.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {transfer.status}
                            </span>
                            <a 
                              href={`https://etherscan.io/tx/${transfer.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View Tx
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Amount: {parseFloat(transfer.amount) / Math.pow(10, 18)} tokens</span>
                          <span>Price: {formatCurrency(transfer.price)}</span>
                          <span>Gas: {transfer.gasCost} ETH</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Asset ID</span>
                        <span className="text-sm font-mono text-gray-900">{asset.assetId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Category</span>
                        <span className="text-sm text-gray-900">{asset.assetCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Type</span>
                        <span className="text-sm text-gray-900">{asset.assetType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fractional</span>
                        <span className="text-sm text-gray-900">{asset.isFractional ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Ownership Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Owner Percentage</span>
                        <span className="text-sm text-gray-900">{asset.ownerPercentage.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Token Balance</span>
                        <span className="text-sm text-gray-900">
                          {parseFloat(asset.balance) / Math.pow(10, asset.decimals)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Acquisition Date</span>
                        <span className="text-sm text-gray-900">{formatDate(asset.acquisitionDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Acquisition Price</span>
                        <span className="text-sm text-gray-900">{formatCurrency(asset.acquisitionPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Contract Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Token Contract</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-gray-900">{asset.tokenContract}</span>
                        <a 
                          href={`https://etherscan.io/address/${asset.tokenContract}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Token ID</span>
                      <span className="text-sm font-mono text-gray-900">{asset.tokenId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Decimals</span>
                      <span className="text-sm text-gray-900">{asset.decimals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Supply</span>
                      <span className="text-sm text-gray-900">
                        {parseFloat(asset.totalSupply) / Math.pow(10, asset.decimals)} tokens
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
