'use client'

import React, { useState } from 'react'
import { useRecommendations } from '@/lib/recommendations'

export default function Recommendations() {
  const {
    personalizedRecommendations,
    similarAssetRecommendations,
    trendingAssets,
    recommendedForYou,
    recentlyViewedAssets,
    recommendationEngine,
    analytics,
    isLoading,
    error,
    recordInteraction,
    provideFeedback,
    refreshRecommendations
  } = useRecommendations()

  const [activeTab, setActiveTab] = useState<'personalized' | 'similar' | 'trending' | 'recommended' | 'recently_viewed'>('personalized')

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'real_estate': return '🏠'
      case 'collectibles': return '🏺'
      case 'art': return '🎨'
      case 'vehicles': return '🚗'
      case 'jewelry': return '💎'
      default: return '📦'
    }
  }

  const handleAssetClick = (assetId: string, assetType: string) => {
    recordInteraction(assetId, 'click')
  }

  const handleFeedback = (assetId: string, feedback: 'positive' | 'negative' | 'neutral') => {
    provideFeedback(assetId, feedback)
  }

  const renderRecommendationCard = (recommendation: any, type: string) => (
    <div key={recommendation.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-2xl">{getCategoryIcon(recommendation.category)}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 
                className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                onClick={() => handleAssetClick(recommendation.id, type)}
              >
                {recommendation.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{recommendation.description}</p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span className="capitalize">{recommendation.category.replace('_', ' ')}</span>
                <span className="font-medium text-gray-900">{formatCurrency(recommendation.price)}</span>
                {recommendation.metadata.rating && (
                  <span>⭐ {recommendation.metadata.rating.toFixed(1)} ({recommendation.metadata.reviews})</span>
                )}
                {recommendation.metadata.views && (
                  <span>👁 {recommendation.metadata.views.toLocaleString()} views</span>
                )}
              </div>
              
              {/* Type-specific metadata */}
              {type === 'personalized' && recommendation.reason && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  💡 {recommendation.reason}
                </div>
              )}
              
              {type === 'similar' && recommendation.similarityFactors && (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                  🎯 {recommendation.reason}
                </div>
              )}
              
              {type === 'trending' && recommendation.trendingMetrics && (
                <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
                  📈 {recommendation.reason}
                </div>
              )}
              
              {type === 'recommended' && recommendation.personalizationFactors && (
                <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-700">
                  ⭐ {recommendation.reason}
                </div>
              )}
              
              {type === 'recently_viewed' && recommendation.lastViewed && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                  🕐 Last viewed: {formatTime(recommendation.lastViewed)}
                </div>
              )}

              {/* Tags */}
              {recommendation.metadata.tags && recommendation.metadata.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {recommendation.metadata.tags.slice(0, 4).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleAssetClick(recommendation.id, type)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details
                </button>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleFeedback(recommendation.id, 'positive')}
                    className="text-green-600 hover:text-green-800"
                    title="Good recommendation"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleFeedback(recommendation.id, 'negative')}
                    className="text-red-600 hover:text-red-800"
                    title="Not relevant"
                  >
                    👎
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Personalized discoveries based on your preferences and activity
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={refreshRecommendations}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Recommendation Engine Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Recommendation Engine</h3>
            <p className="text-xs text-blue-700 mt-1">
              Algorithm: {recommendationEngine.algorithm} v{recommendationEngine.version} | 
              Accuracy: {(recommendationEngine.performance.accuracy * 100).toFixed(1)}% | 
              CTR: {(recommendationEngine.performance.clickThroughRate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs text-blue-700">
            <span>🎯 {(recommendationEngine.performance.userSatisfaction * 100).toFixed(1)}% satisfaction</span>
            <span>💰 {(recommendationEngine.performance.conversionRate * 100).toFixed(1)}% conversion</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'personalized', label: 'Personalized', count: personalizedRecommendations.length },
            { key: 'similar', label: 'Similar Assets', count: similarAssetRecommendations.length },
            { key: 'trending', label: 'Trending', count: trendingAssets.length },
            { key: 'recommended', label: 'For You', count: recommendedForYou.length },
            { key: 'recently_viewed', label: 'Recently Viewed', count: recentlyViewedAssets.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Personalized Recommendations */}
          {activeTab === 'personalized' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Personalized for You</h3>
                <p className="text-sm text-gray-600">
                  Based on your viewing history, preferences, and similar users' behavior
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {personalizedRecommendations.map((rec) => renderRecommendationCard(rec, 'personalized'))}
              </div>
            </div>
          )}

          {/* Similar Assets */}
          {activeTab === 'similar' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Similar Assets</h3>
                <p className="text-sm text-gray-600">
                  Assets similar to what you've recently viewed or bid on
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {similarAssetRecommendations.map((rec) => renderRecommendationCard(rec, 'similar'))}
              </div>
            </div>
          )}

          {/* Trending Assets */}
          {activeTab === 'trending' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Trending Now</h3>
                <p className="text-sm text-gray-600">
                  Hot assets gaining traction in the community
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {trendingAssets.map((rec) => (
                  <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{getCategoryIcon(rec.category)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 
                                className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                                onClick={() => handleAssetClick(rec.id, 'trending')}
                              >
                                {rec.title}
                              </h3>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                🔥 #{rec.trendingRank}
                              </span>
                              {rec.rankChange > 0 && (
                                <span className="text-green-600 text-xs">↑{rec.rankChange}</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="capitalize">{rec.category.replace('_', ' ')}</span>
                              <span className="font-medium text-gray-900">{formatCurrency(rec.price)}</span>
                              <span>👁 {rec.trendingMetrics.viewCount.toLocaleString()} views</span>
                              <span className="text-green-600">{formatPercent(rec.trendingMetrics.viewGrowth)}</span>
                            </div>
                            <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
                              📈 {rec.reason}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                              <div>Views: {rec.trendingMetrics.viewCount.toLocaleString()} ({formatPercent(rec.trendingMetrics.viewGrowth)})</div>
                              <div>Bids: {rec.trendingMetrics.bidCount} ({formatPercent(rec.trendingMetrics.bidGrowth)})</div>
                              <div>Price: {formatCurrency(rec.trendingMetrics.priceChange)} ({formatPercent(rec.trendingMetrics.priceChangePercent)})</div>
                              <div>Social: {rec.trendingMetrics.socialMentions} mentions</div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <button
                              onClick={() => handleAssetClick(rec.id, 'trending')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended for You */}
          {activeTab === 'recommended' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recommended for You</h3>
                <p className="text-sm text-gray-600">
                  Curated selections matching your profile and preferences
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {recommendedForYou.map((rec) => renderRecommendationCard(rec, 'recommended'))}
              </div>
            </div>
          )}

          {/* Recently Viewed */}
          {activeTab === 'recently_viewed' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recently Viewed</h3>
                <p className="text-sm text-gray-600">
                  Assets you've recently explored
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {recentlyViewedAssets.map((rec) => (
                  <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{getCategoryIcon(rec.category)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 
                              className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                              onClick={() => handleAssetClick(rec.id, 'recently_viewed')}
                            >
                              {rec.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="capitalize">{rec.category.replace('_', ' ')}</span>
                              <span className="font-medium text-gray-900">{formatCurrency(rec.price)}</span>
                              <span>👁 {rec.viewCount} views</span>
                              <span>⏱ {rec.totalViewTime}s total</span>
                            </div>
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                              🕐 Last viewed: {formatTime(rec.lastViewed)} | 
                              Engagement: {(rec.engagementScore * 100).toFixed(0)}%
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {rec.relatedActions.slice(0, 3).map((action: string, index: number) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {action.replace('-', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <button
                              onClick={() => handleAssetClick(rec.id, 'recently_viewed')}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Again
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendation Performance</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalRecommendations.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Recommendations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.clickThroughRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Click-Through Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.conversionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.averageOrderValue)}</div>
            <div className="text-sm text-gray-600">Avg Order Value</div>
          </div>
        </div>
      </div>
    </div>
  )
}
