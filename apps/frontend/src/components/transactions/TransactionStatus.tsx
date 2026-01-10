'use client'

import React, { useState, useMemo } from 'react'
import { useTransactionStatus } from '@/lib/transaction-status'

export default function TransactionStatus() {
  const {
    pendingTransactions,
    failedTransactions,
    gasOptimizations,
    networkStatus,
    stats,
    realTimeUpdates,
    isLoading,
    error,
    filters,
    speedupTransaction,
    cancelTransaction,
    retryTransaction,
    applyGasOptimization,
    updateFilters,
    resetFilters,
    clearUpdates
  } = useTransactionStatus()

  const [activeTab, setActiveTab] = useState<'pending' | 'failed' | 'gas' | 'network'>('pending')

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDC' || currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  const formatGasPrice = (gasPrice: string) => {
    const gwei = parseInt(gasPrice) / 1e9
    return `${gwei.toFixed(2)} Gwei`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'ethereum': return 'bg-blue-500'
      case 'polygon': return 'bg-purple-500'
      case 'arbitrum': return 'sky-blue'
      case 'optimism': return 'bg-red-500'
      case 'base': return 'bg-blue-600'
      default: return 'bg-gray-500'
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
          <h1 className="text-2xl font-bold text-gray-900">Transaction Status</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage your transaction status in real-time
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={clearUpdates}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Updates
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalPending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalFailed}</dd>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.successRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Gas Saved</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.gasOptimizationSavings} ETH</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Updates */}
      {realTimeUpdates.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Real-time Updates</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {realTimeUpdates.map((update) => (
              <div key={update.id} className="flex items-center space-x-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  update.severity === 'error' ? 'bg-red-500' :
                  update.severity === 'warning' ? 'bg-yellow-500' :
                  update.severity === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}></span>
                <span className="text-gray-600">{update.timestamp.toLocaleTimeString()}</span>
                <span className="text-gray-900">{update.data.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['pending', 'failed', 'gas', 'network'].map((tab) => (
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
              {tab === 'pending' && stats.totalPending > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs">
                  {stats.totalPending}
                </span>
              )}
              {tab === 'failed' && stats.totalFailed > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 py-0.5 px-2 rounded-full text-xs">
                  {stats.totalFailed}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Pending Transactions */}
        {activeTab === 'pending' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Transactions Queue</h3>
            {pendingTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending transactions</p>
            ) : (
              <div className="space-y-4">
                {pendingTransactions.map((tx) => (
                  <div key={tx.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className={`w-3 h-3 rounded-full ${getNetworkColor(tx.network)}`}></span>
                          <span className="font-medium text-gray-900">{tx.description}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(tx.priority)}`}>
                            {tx.priority}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>Amount: {formatCurrency(tx.amount, tx.currency)}</div>
                          <div>Gas: {formatGasPrice(tx.gasPrice)}</div>
                          <div>Confirmations: {tx.confirmations}/{tx.requiredConfirmations}</div>
                          <div>Submitted: {tx.submittedAt.toLocaleTimeString()}</div>
                        </div>
                        {tx.estimatedConfirmationTime && (
                          <div className="mt-2 text-sm text-blue-600">
                            Est. confirmation: {tx.estimatedConfirmationTime.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {tx.isSpeedupPossible && (
                          <button
                            onClick={() => speedupTransaction(tx.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Speed Up
                          </button>
                        )}
                        {tx.isCancellationPossible && (
                          <button
                            onClick={() => cancelTransaction(tx.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Failed Transactions */}
        {activeTab === 'failed' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Failed Transactions</h3>
            {failedTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No failed transactions</p>
            ) : (
              <div className="space-y-4">
                {failedTransactions.map((tx) => (
                  <div key={tx.id} className="border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className={`w-3 h-3 rounded-full ${getNetworkColor(tx.network)}`}></span>
                          <span className="font-medium text-gray-900">{tx.description}</span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            {tx.error.reason}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>Amount: {formatCurrency(tx.amount, tx.currency)}</div>
                          <div>Gas: {formatGasPrice(tx.gasPrice)}</div>
                          <div>Failed: {tx.failedAt.toLocaleTimeString()}</div>
                          <div>Retries: {tx.retryCount}/{tx.maxRetries}</div>
                        </div>
                        <div className="mt-2 text-sm text-red-600">
                          Error: {tx.error.message}
                        </div>
                        {tx.suggestedGasPrice && (
                          <div className="mt-2 text-sm text-blue-600">
                            Suggested gas: {formatGasPrice(tx.suggestedGasPrice)}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {tx.isRetryable && (
                          <button
                            onClick={() => retryTransaction(tx.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gas Optimization */}
        {activeTab === 'gas' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gas Optimization Suggestions</h3>
            <div className="space-y-4">
              {gasOptimizations.map((opt) => (
                <div key={opt.network} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`w-3 h-3 rounded-full ${getNetworkColor(opt.network)}`}></span>
                        <span className="font-medium text-gray-900 capitalize">{opt.network}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Save {opt.savings.percentage}%
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Current: {formatGasPrice(opt.currentGasPrice)}</div>
                        <div>Suggested: {formatGasPrice(opt.suggestedGasPrice)}</div>
                        <div>Est. time: {opt.estimatedTime}s</div>
                        <div>Confidence: {opt.confidence}%</div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {opt.recommendations.map((rec, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            <span className="font-medium">{rec.type}:</span> {rec.description} ({rec.impact})
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => applyGasOptimization(opt.network, opt)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Network Status */}
        {activeTab === 'network' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Network Status</h3>
            <div className="space-y-4">
              {networkStatus.map((network) => (
                <div key={network.network} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`w-3 h-3 rounded-full ${getNetworkColor(network.network)}`}></span>
                      <span className="font-medium text-gray-900 capitalize">{network.network}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        network.isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {network.isHealthy ? 'Healthy' : 'Issues'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        network.networkCongestion === 'low' ? 'bg-green-100 text-green-800' :
                        network.networkCongestion === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {network.networkCongestion} congestion
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Block: {network.blockNumber.toLocaleString()}</div>
                    <div>Gas: {formatGasPrice(network.gasPrice)}</div>
                    <div>Block time: {network.averageBlockTime}s</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
