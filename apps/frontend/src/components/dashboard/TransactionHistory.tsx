'use client';

import { useState, useMemo } from 'react';
import { useUserProfile } from '@/lib/user-profile';

export function TransactionHistory() {
  const { 
    transactions, 
    getTransactionHistory, 
    getTransactionsByType, 
    formatAddress, 
    formatCurrency, 
    formatDateTime 
  } = useUserProfile();

  const [filter, setFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type === filter);
    }

    // Filter by time range
    const now = Date.now();
    switch (timeRange) {
      case '24h':
        filtered = filtered.filter(tx => tx.timestamp >= now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        filtered = filtered.filter(tx => tx.timestamp >= now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        filtered = filtered.filter(tx => tx.timestamp >= now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        // 'all' - no time filtering
        break;
    }

    // Search by hash, description, or address
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchLower) ||
        tx.description.toLowerCase().includes(searchLower) ||
        tx.from.toLowerCase().includes(searchLower) ||
        tx.to.toLowerCase().includes(searchLower) ||
        (tx.tokenSymbol && tx.tokenSymbol.toLowerCase().includes(searchLower))
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, filter, timeRange, searchTerm]);

  const filters = [
    { value: 'all', label: 'All Transactions' },
    { value: 'send', label: 'Sent' },
    { value: 'receive', label: 'Received' },
    { value: 'swap', label: 'Swaps' },
    { value: 'approve', label: 'Approvals' },
    { value: 'auction_bid', label: 'Auction Bids' },
    { value: 'auction_win', label: 'Auction Wins' },
    { value: 'auction_create', label: 'Auction Creations' }
  ];

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#F59E0B',
      'confirmed': '#10B981',
      'failed': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'pending': '⏳',
      'confirmed': '✅',
      'failed': '❌'
    };
    return icons[status] || '❓';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'send': '📤',
      'receive': '📥',
      'swap': '🔄',
      'approve': '✅',
      'mint': '🎨',
      'burn': '🔥',
      'auction_bid': '🎯',
      'auction_win': '🏆',
      'auction_create': '🏠'
    };
    return icons[type] || '💳';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'send': '#EF4444',
      'receive': '#10B981',
      'swap': '#8B5CF6',
      'approve': '#3B82F6',
      'mint': '#F59E0B',
      'burn': '#DC2626',
      'auction_bid': '#059669',
      'auction_win': '#10B981',
      'auction_create': '#7C3AED'
    };
    return colors[type] || '#6B7280';
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 30) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return formatDateTime(timestamp);
    }
  };

  const openEtherscan = (hash: string) => {
    window.open(`https://etherscan.io/tx/${hash}`, '_blank');
  };

  const selectedTx = transactions.find(tx => tx.id === selectedTransaction);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalVolume = filteredTransactions.reduce((sum, tx) => sum + tx.valueUSD, 0);
    const successfulTxs = filteredTransactions.filter(tx => tx.status === 'confirmed');
    const pendingTxs = filteredTransactions.filter(tx => tx.status === 'pending');
    const failedTxs = filteredTransactions.filter(tx => tx.status === 'failed');

    return {
      totalTransactions: filteredTransactions.length,
      totalVolume,
      successful: successfulTxs.length,
      pending: pendingTxs.length,
      failed: failedTxs.length
    };
  }, [filteredTransactions]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Transaction History</h2>
        <p className="text-gray-600">View and track all your blockchain transactions</p>
      </div>

      {/* Transaction Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalVolume)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {filters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-gray-600">
              {filter !== 'all' || timeRange !== 'all' || searchTerm
                ? 'Try adjusting your filters or search terms'
                : 'Your transaction history will appear here once you start using the platform'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Transaction Icon */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: getTypeColor(transaction.type) }}
                    >
                      <span className="text-lg">{getTypeIcon(transaction.type)}</span>
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {transaction.description}
                        </h4>
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{ 
                            backgroundColor: getStatusColor(transaction.status) + '20',
                            color: getStatusColor(transaction.status)
                          }}
                        >
                          {getStatusIcon(transaction.status)} {transaction.status}
                        </span>
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: getTypeColor(transaction.type) }}
                        >
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">From:</span>
                          <span className="font-medium text-gray-900 ml-2 font-mono">
                            {formatAddress(transaction.from)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">To:</span>
                          <span className="font-medium text-gray-900 ml-2 font-mono">
                            {formatAddress(transaction.to)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {transaction.tokenSymbol ? `${(parseFloat(transaction.value) / Math.pow(10, 18)).toFixed(4)} ${transaction.tokenSymbol}` : 'ETH'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Value:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {formatCurrency(transaction.valueUSD)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Gas Cost:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {transaction.gasCost.toFixed(6)} ETH
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium text-gray-900 ml-2">
                            {formatRelativeTime(transaction.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Auction Details */}
                      {transaction.auction && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Asset:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                {transaction.auction.assetTitle}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Bid Amount:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                {transaction.auction.bidAmount} ETH
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <span className={`font-medium ml-2 ${
                                transaction.auction.isWinning ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {transaction.auction.isWinning ? 'Winning' : 'Outbid'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NFT Details */}
                      {transaction.nft && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <img 
                              src={transaction.nft.tokenImage} 
                              alt={transaction.nft.tokenName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {transaction.nft.tokenName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {transaction.nft.collectionName}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedTransaction(transaction.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => openEtherscan(transaction.hash)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Etherscan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && selectedTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: getTypeColor(selectedTx.type) }}
                >
                  <span className="text-xl">{getTypeIcon(selectedTx.type)}</span>
                </div>
                <div>
                  <h4 className="text-xl font-medium text-gray-900">{selectedTx.description}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: getStatusColor(selectedTx.status) + '20',
                        color: getStatusColor(selectedTx.status)
                      }}
                    >
                      {getStatusIcon(selectedTx.status)} {selectedTx.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDateTime(selectedTx.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Hash</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono">
                        {selectedTx.hash}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedTx.hash)}
                        className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono">
                        {selectedTx.from}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedTx.from)}
                        className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 p-2 bg-gray-50 rounded text-sm font-mono">
                        {selectedTx.to}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedTx.to)}
                        className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-lg font-medium text-gray-900">
                        {selectedTx.tokenSymbol ? `${(parseFloat(selectedTx.value) / Math.pow(10, 18)).toFixed(6)} ${selectedTx.tokenSymbol}` : 'ETH'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">USD Value</label>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-lg font-medium text-gray-900">
                        {formatCurrency(selectedTx.valueUSD)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Used</label>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-lg font-medium text-gray-900">
                        {selectedTx.gasUsed} gas
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Cost</label>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-lg font-medium text-gray-900">
                        {selectedTx.gasCost.toFixed(6)} ETH
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Block Number</label>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-900">
                      {selectedTx.blockNumber.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmations</label>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-900">
                      {selectedTx.confirmations.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <div className="p-2 bg-gray-50 rounded">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: getTypeColor(selectedTx.type) }}
                    >
                      {selectedTx.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => openEtherscan(selectedTx.hash)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View on Etherscan
                </button>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
