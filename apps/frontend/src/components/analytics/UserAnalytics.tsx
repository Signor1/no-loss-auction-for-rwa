'use client'

import React, { useState, useMemo } from 'react'
import { useUserAnalytics } from '@/lib/user-analytics'

export default function UserAnalytics() {
  const {
    personalMetrics,
    biddingAnalytics,
    portfolioPerformance,
    roiCalculations,
    activityStatistics,
    earningsReport,
    stats,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    getPerformanceScore,
    getRiskLevel,
    getActivityLevel,
    exportAnalytics
  } = useUserAnalytics()

  const [activeTab, setActiveTab] = useState<'performance' | 'bidding' | 'portfolio' | 'roi' | 'activity' | 'earnings'>('performance')

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
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
          <h1 className="text-2xl font-bold text-gray-900">User Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Personal performance insights and analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <select
            value={filters.timeframe}
            onChange={(e) => updateFilters({ timeframe: e.target.value as any })}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="1D">1 Day</option>
            <option value="1W">1 Week</option>
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="ALL">All Time</option>
          </select>
          <button
            onClick={() => exportAnalytics('csv')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Export
          </button>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Portfolio Value</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(personalMetrics.currentValue)}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Returns</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(personalMetrics.totalProfit)}</dd>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{personalMetrics.successRate.toFixed(1)}%</dd>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Performance Score</dt>
                  <dd className="text-lg font-medium text-gray-900">{getPerformanceScore()}/10</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['performance', 'bidding', 'portfolio', 'roi', 'activity', 'earnings'].map((tab) => (
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
        {/* Personal Performance Metrics */}
        {activeTab === 'performance' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Performance Metrics</h3>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Performance Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Invested</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(personalMetrics.totalInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Value</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(personalMetrics.currentValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Profit</span>
                    <span className={`text-sm font-medium ${personalMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(personalMetrics.totalProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Return %</span>
                    <span className={`text-sm font-medium ${personalMetrics.totalProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(personalMetrics.totalProfitPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium text-gray-900">{personalMetrics.successRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Risk & Scores</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(personalMetrics.riskScore)}`}>
                      {getRiskLevel()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Score</span>
                    <span className="text-sm font-medium text-gray-900">{personalMetrics.riskScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Diversification Score</span>
                    <span className="text-sm font-medium text-gray-900">{personalMetrics.diversificationScore.toFixed(1)}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Activity Level</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(personalMetrics.activityScore)}`}>
                      {getActivityLevel()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overall Score</span>
                    <span className="text-sm font-medium text-gray-900">{personalMetrics.overallScore.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Best Performing Asset</h5>
                <p className="text-lg font-semibold text-gray-900">{personalMetrics.bestPerformingAsset.name}</p>
                <p className="text-sm text-green-600">{formatCurrency(personalMetrics.bestPerformingAsset.return)} ({formatPercent(personalMetrics.bestPerformingAsset.returnPercent)})</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Worst Performing Asset</h5>
                <p className="text-lg font-semibold text-gray-900">{personalMetrics.worstPerformingAsset.name}</p>
                <p className="text-sm text-red-600">{formatCurrency(personalMetrics.worstPerformingAsset.return)} ({formatPercent(personalMetrics.worstPerformingAsset.returnPercent)})</p>
              </div>
            </div>
          </div>
        )}

        {/* Bidding Analytics */}
        {activeTab === 'bidding' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bidding Analytics</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Bids</p>
                <p className="text-lg font-semibold text-gray-900">{biddingAnalytics.totalBids}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-lg font-semibold text-gray-900">{biddingAnalytics.successRate.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Average Bid</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(biddingAnalytics.averageBidAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Won</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(biddingAnalytics.totalWonValue)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Category Performance</h4>
                <div className="space-y-2">
                  {biddingAnalytics.categoryPerformance.map((category) => (
                    <div key={category.category} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900">{category.category}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{category.successRate.toFixed(1)}%</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(category.totalWonValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Time-based Performance</h4>
                <div className="space-y-2">
                  {biddingAnalytics.timeBasedPerformance.map((time) => (
                    <div key={time.period} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900 capitalize">{time.period}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{time.successRate.toFixed(1)}%</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(time.averageBidAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Performance */}
        {activeTab === 'portfolio' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Performance</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(portfolioPerformance.totalValue)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Returns</p>
                <p className={`text-lg font-semibold ${portfolioPerformance.totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(portfolioPerformance.totalReturns)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Return %</p>
                <p className={`text-lg font-semibold ${portfolioPerformance.totalReturnsPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(portfolioPerformance.totalReturnsPercent)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Asset Allocation</h4>
                <div className="space-y-2">
                  {portfolioPerformance.assetAllocation.map((allocation) => (
                    <div key={allocation.category} className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-900">{allocation.category}</span>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${allocation.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{allocation.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Volatility</span>
                    <span className="text-sm font-medium text-gray-900">{portfolioPerformance.riskMetrics.volatility.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sharpe Ratio</span>
                    <span className="text-sm font-medium text-gray-900">{portfolioPerformance.riskMetrics.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Max Drawdown</span>
                    <span className="text-sm font-medium text-red-600">{formatPercent(portfolioPerformance.riskMetrics.maxDrawdown)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Beta</span>
                    <span className="text-sm font-medium text-gray-900">{portfolioPerformance.riskMetrics.beta.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROI Calculations */}
        {activeTab === 'roi' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ROI Calculations</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Overall ROI</p>
                <p className={`text-lg font-semibold ${roiCalculations.overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(roiCalculations.overallROI)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Annualized ROI</p>
                <p className={`text-lg font-semibold ${roiCalculations.annualizedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(roiCalculations.annualizedROI)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Monthly ROI</p>
                <p className={`text-lg font-semibold ${roiCalculations.monthlyROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(roiCalculations.monthlyROI)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Asset ROI</h4>
                <div className="space-y-2">
                  {roiCalculations.assetROI.map((asset) => (
                    <div key={asset.assetId} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900">{asset.assetName}</span>
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium ${asset.roiPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(asset.roiPercent)}
                        </span>
                        <span className="text-sm text-gray-600">{formatCurrency(asset.roi)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Time-based ROI</h4>
                <div className="space-y-2">
                  {roiCalculations.timeBasedROI.map((time) => (
                    <div key={time.period} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900">{time.period}</span>
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium ${time.roiPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(time.roiPercent)}
                        </span>
                        <span className="text-sm text-gray-600">{formatCurrency(time.roi)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Statistics */}
        {activeTab === 'activity' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Statistics</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-lg font-semibold text-gray-900">{activityStatistics.totalActivities.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Login Count</p>
                <p className="text-lg font-semibold text-gray-900">{activityStatistics.loginCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Session</p>
                <p className="text-lg font-semibold text-gray-900">{activityStatistics.averageSessionDuration.toFixed(1)}m</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Active Days</p>
                <p className="text-lg font-semibold text-gray-900">{activityStatistics.streakMetrics.totalActiveDays}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Activity by Type</h4>
                <div className="space-y-2">
                  {activityStatistics.activityByType.map((activity) => (
                    <div key={activity.type} className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-900 capitalize">{activity.type.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-4">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${activity.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{activity.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Streak Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Streak</span>
                    <span className="text-sm font-medium text-gray-900">{activityStatistics.streakMetrics.currentStreak} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Longest Streak</span>
                    <span className="text-sm font-medium text-gray-900">{activityStatistics.streakMetrics.longestStreak} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Activities/Day</span>
                    <span className="text-sm font-medium text-gray-900">{activityStatistics.streakMetrics.averageActivitiesPerDay.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Reports */}
        {activeTab === 'earnings' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Reports</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(earningsReport.totalEarnings)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Losses</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(earningsReport.totalLosses)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Net Earnings</p>
                <p className={`text-lg font-semibold ${earningsReport.netEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(earningsReport.netEarnings)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-lg font-semibold text-gray-900">{earningsReport.performanceMetrics.winRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Earnings by Category</h4>
                <div className="space-y-2">
                  {earningsReport.earningsByCategory.map((category) => (
                    <div key={category.category} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-900">{category.category}</span>
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium ${category.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(category.net)}
                        </span>
                        <span className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Tax Implications</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Gains</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(earningsReport.taxImplications.totalGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Taxable Gains</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(earningsReport.taxImplications.taxableGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estimated Tax</span>
                    <span className="text-sm font-medium text-red-600">{formatCurrency(earningsReport.taxImplications.estimatedTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax Rate</span>
                    <span className="text-sm font-medium text-gray-900">{earningsReport.taxImplications.taxRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
