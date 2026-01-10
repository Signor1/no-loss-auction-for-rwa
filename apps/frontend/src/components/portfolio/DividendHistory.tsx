'use client';

import { useState, useMemo } from 'react';
import { AssetToken, Dividend } from '@/lib/asset-portfolio';

interface DividendHistoryProps {
  assetTokens: AssetToken[];
}

export function DividendHistory({ assetTokens }: DividendHistoryProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'claimed'>('all');
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'yield'>('date');

  // Mock dividends data - in real app this would come from the hook
  const dividends: Dividend[] = [
    {
      id: 'div_1',
      assetId: 'asset_1',
      assetTitle: 'Luxury Manhattan Apartment',
      amount: '1250000000000000000',
      currency: 'USD',
      tokenPrice: 2500,
      totalValue: 3125,
      paymentDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      declaredDate: Date.now() - 14 * 24 * 60 * 60 * 1000,
      frequency: 'quarterly',
      status: 'paid',
      txHash: '0xabc1...def2',
      yieldPercentage: 1.25
    },
    {
      id: 'div_2',
      assetId: 'asset_2',
      assetTitle: 'Contemporary Art Piece',
      amount: '250000000000000000',
      currency: 'USD',
      tokenPrice: 75000,
      totalValue: 187.5,
      paymentDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
      declaredDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
      frequency: 'annually',
      status: 'paid',
      txHash: '0xdef3...ghi4',
      yieldPercentage: 0.25
    },
    {
      id: 'div_3',
      assetId: 'asset_1',
      assetTitle: 'Luxury Manhattan Apartment',
      amount: '1250000000000000000',
      currency: 'USD',
      tokenPrice: 2500,
      totalValue: 3125,
      paymentDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      declaredDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      frequency: 'quarterly',
      status: 'pending',
      yieldPercentage: 1.25
    },
    {
      id: 'div_4',
      assetId: 'asset_3',
      assetTitle: 'Gold Bullion Collection',
      amount: '500000000000000000',
      currency: 'USD',
      tokenPrice: 50000,
      totalValue: 250,
      paymentDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      declaredDate: Date.now() - 35 * 24 * 60 * 60 * 1000,
      frequency: 'monthly',
      status: 'claimed',
      txHash: '0xghi5...jkl6',
      yieldPercentage: 0.5
    }
  ];

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

  // Filter and sort dividends
  const filteredDividends = useMemo(() => {
    let filtered = dividends;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(div => div.status === filterStatus);
    }

    // Filter by asset
    if (filterAsset !== 'all') {
      filtered = filtered.filter(div => div.assetId === filterAsset);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.paymentDate - a.paymentDate;
        case 'amount':
          return b.totalValue - a.totalValue;
        case 'yield':
          return b.yieldPercentage - a.yieldPercentage;
        default:
          return 0;
      }
    });

    return filtered;
  }, [filterStatus, filterAsset, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDividends = dividends.reduce((sum, div) => sum + div.totalValue, 0);
    const paidDividends = dividends.filter(d => d.status === 'paid').reduce((sum, div) => sum + div.totalValue, 0);
    const pendingDividends = dividends.filter(d => d.status === 'pending').reduce((sum, div) => sum + div.totalValue, 0);
    const claimedDividends = dividends.filter(d => d.status === 'claimed').reduce((sum, div) => sum + div.totalValue, 0);
    const averageYield = dividends.length > 0 ? dividends.reduce((sum, div) => sum + div.yieldPercentage, 0) / dividends.length : 0;

    return {
      totalDividends,
      paidDividends,
      pendingDividends,
      claimedDividends,
      averageYield,
      totalDividendsCount: dividends.length,
      paidCount: dividends.filter(d => d.status === 'paid').length,
      pendingCount: dividends.filter(d => d.status === 'pending').length,
      claimedCount: dividends.filter(d => d.status === 'claimed').length
    };
  }, [dividends]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'claimed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      case 'annually':
        return 'Annually';
      case 'one-time':
        return 'One-time';
      default:
        return frequency;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Dividend History</h2>
        <p className="text-gray-600">Track and manage your dividend payments from tokenized assets</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Dividends</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalDividends)}</p>
              <p className="text-xs text-gray-500">{stats.totalDividendsCount} payments</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Dividends</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.paidDividends)}</p>
              <p className="text-xs text-gray-500">{stats.paidCount} payments</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Dividends</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.pendingDividends)}</p>
              <p className="text-xs text-gray-500">{stats.pendingCount} payments</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Yield</p>
              <p className="text-xl font-bold text-gray-900">{formatPercentage(stats.averageYield)}</p>
              <p className="text-xs text-gray-500">Annual rate</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="claimed">Claimed</option>
            </select>

            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Assets</option>
              {assetTokens.map(asset => (
                <option key={asset.id} value={asset.assetId}>
                  {asset.assetTitle}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="yield">Sort by Yield</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredDividends.length} of {dividends.length} dividends
          </div>
        </div>
      </div>

      {/* Dividend List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredDividends.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dividends found</h3>
            <p className="text-gray-600">
              {filterStatus !== 'all' || filterAsset !== 'all' 
                ? 'Try adjusting your filters to see more results' 
                : 'Your assets haven\'t distributed any dividends yet'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDividends.map((dividend) => (
              <div key={dividend.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-lg">💰</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{dividend.assetTitle}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dividend.status)}`}>
                          {dividend.status}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {getFrequencyLabel(dividend.frequency)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Declared: {formatDate(dividend.declaredDate)} • Payment: {formatDate(dividend.paymentDate)}
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Yield: {formatPercentage(dividend.yieldPercentage)}</span>
                        <span>Amount: {parseFloat(dividend.amount) / Math.pow(10, 18)} tokens</span>
                        <span>Token Price: {formatCurrency(dividend.tokenPrice)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(dividend.totalValue)}</p>
                    <div className="mt-2 space-x-2">
                      {dividend.status === 'pending' && (
                        <button className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50">
                          Claim
                        </button>
                      )}
                      {dividend.txHash && (
                        <a 
                          href={`https://etherscan.io/tx/${dividend.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          View Transaction
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dividend Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">By Status</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(stats.paidDividends)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Pending</span>
                <span className="font-medium text-yellow-600">{formatCurrency(stats.pendingDividends)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Claimed</span>
                <span className="font-medium text-blue-600">{formatCurrency(stats.claimedDividends)}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">By Frequency</p>
            <div className="space-y-1">
              {Array.from(new Set(dividends.map(d => d.frequency))).map(frequency => {
                const freqDividends = dividends.filter(d => d.frequency === frequency);
                const total = freqDividends.reduce((sum, d) => sum + d.totalValue, 0);
                return (
                  <div key={frequency} className="flex justify-between text-sm">
                    <span className="text-gray-700 capitalize">{getFrequencyLabel(frequency)}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Yield Distribution</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Average Yield</span>
                <span className="font-medium text-gray-900">{formatPercentage(stats.averageYield)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Highest Yield</span>
                <span className="font-medium text-green-600">
                  {formatPercentage(Math.max(...dividends.map(d => d.yieldPercentage)))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Lowest Yield</span>
                <span className="font-medium text-red-600">
                  {formatPercentage(Math.min(...dividends.map(d => d.yieldPercentage)))}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Payment Schedule</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Next Payment</span>
                <span className="font-medium text-gray-900">
                  {stats.pendingCount > 0 ? 'Pending' : 'Scheduled'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Last Payment</span>
                <span className="font-medium text-gray-900">
                  {dividends.length > 0 ? formatDate(Math.max(...dividends.map(d => d.paymentDate))) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Total Payments</span>
                <span className="font-medium text-gray-900">{stats.totalDividendsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
