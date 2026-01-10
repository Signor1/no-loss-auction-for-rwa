'use client';

import { useState, useMemo } from 'react';
import { useActivityFeed } from '@/lib/activity-feed';

export function ActivityFeed() {
  const {
    activities,
    filteredActivities,
    stats,
    filter,
    isLoading,
    isRefreshing,
    markAsRead,
    markAllAsRead,
    deleteActivity,
    updateFilter,
    formatRelativeTime,
    getActivityIcon,
    getActivityColor,
    getPriorityColor
  } = useActivityFeed();

  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Activity types for filtering
  const activityTypes = [
    { value: 'transaction', label: 'Transactions', icon: '💳' },
    { value: 'auction_created', label: 'New Auctions', icon: '🏠' },
    { value: 'bid_placed', label: 'Bids Placed', icon: '🎯' },
    { value: 'bid_outbid', label: 'Outbid Alerts', icon: '⚠️' },
    { value: 'auction_won', label: 'Auctions Won', icon: '🏆' },
    { value: 'asset_updated', label: 'Asset Updates', icon: '✏️' },
    { value: 'verification_updated', label: 'Verification', icon: '✅' },
    { value: 'achievement_unlocked', label: 'Achievements', icon: '🏆' },
    { value: 'system_update', label: 'System Updates', icon: '🔄' },
    { value: 'security_alert', label: 'Security Alerts', icon: '🚨' }
  ];

  // Activity categories
  const categories = [
    { value: 'transactions', label: 'Transactions' },
    { value: 'auctions', label: 'Auctions' },
    { value: 'assets', label: 'Assets' },
    { value: 'profile', label: 'Profile' },
    { value: 'system', label: 'System' },
    { value: 'security', label: 'Security' },
    { value: 'rewards', label: 'Rewards' }
  ];

  // Date range presets
  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'all_time', label: 'All Time' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#F59E0B',
      'active': '#3B82F6',
      'completed': '#10B981',
      'failed': '#EF4444',
      'cancelled': '#6B7280',
      'expired': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity.id);
    if (!activity.isRead) {
      markAsRead(activity.id);
    }
  };

  const handleFilterChange = (filterType: string, value: any) => {
    updateFilter({ [filterType]: value });
  };

  const clearFilters = () => {
    updateFilter({
      types: [],
      categories: [],
      status: [],
      priority: [],
      dateRange: { preset: 'this_week' },
      searchQuery: '',
      unreadOnly: false,
      hasAction: false
    });
  };

  const selectedActivityData = activities.find(a => a.id === selectedActivity);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Feed</h1>
              <p className="text-gray-600">
                Stay updated with your recent transactions, auctions, and platform activities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => loadActivities(true)}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <div className={isRefreshing ? 'animate-spin' : ''}>
                  🔄
                </div>
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <span>🔍</span>
                <span>Filters</span>
                {filter.types.length > 0 || filter.categories.length > 0 || filter.unreadOnly ? (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600">🔔</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.filter(a => a.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {activities.filter(a => a.priority === 'high' || a.priority === 'urgent').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600">🚨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Activity Filters</h3>
              <div className="flex space-x-2">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filter.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  placeholder="Search activities..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Activity Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Types</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activityTypes.map((type) => (
                    <label key={type.value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={filter.types.includes(type.value)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...filter.types, type.value]
                            : filter.types.filter(t => t !== type.value);
                          handleFilterChange('types', newTypes);
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{type.icon} {type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category.value} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={filter.categories.includes(category.value)}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...filter.categories, category.value]
                            : filter.categories.filter(c => c !== category.value);
                          handleFilterChange('categories', newCategories);
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filter.dateRange.preset}
                  onChange={(e) => handleFilterChange('dateRange', { preset: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {dateRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Filters</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={filter.unreadOnly}
                      onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Unread only</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={filter.hasAction}
                      onChange={(e) => handleFilterChange('hasAction', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Has action required</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Feed Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <span className="text-sm text-gray-600">
                  Showing {filteredActivities.length} of {stats.total} activities
                </span>
              </div>
              <div className="flex space-x-2">
                {stats.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    Mark All Read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Activity List */}
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📭</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
              <p className="text-gray-600">
                {filter.types.length > 0 || filter.categories.length > 0 || filter.searchQuery
                  ? 'Try adjusting your filters to see more results'
                  : 'Your activity will appear here once you start using the platform'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !activity.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Activity Icon */}
                    <div className="flex-shrink-0">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: getActivityColor(activity.type) }}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">{activity.title}</h4>
                          <span 
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              activity.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {activity.priority.toUpperCase()}
                          </span>
                          <span 
                            className={`px-2 py-1 text-xs font-medium rounded-full ${!activity.isRead ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {!activity.isRead ? 'NEW' : 'READ'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getStatusColor(activity.status) }}
                          />
                        </div>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{activity.description}</p>

                      {/* Activity Metadata */}
                      {activity.metadata && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          {activity.type === 'transaction' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {activity.metadata.transactionAmount} {activity.metadata.transactionToken}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Hash:</span>
                                <span className="font-medium text-gray-900 ml-2 font-mono">
                                  {activity.metadata.transactionHash?.slice(0, 10)}...
                                </span>
                              </div>
                            </div>
                          )}

                          {activity.type === 'bid_placed' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Auction:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {activity.metadata.auctionTitle}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Bid Amount:</span>
                                <span className="font-medium text-gray-900 ml-2">
                                  {activity.metadata.bidAmount} {activity.metadata.bidCurrency}
                                </span>
                              </div>
                              <div className="md:col-span-2">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-medium ml-2 ${
                                  activity.metadata.isWinning ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {activity.metadata.isWinning ? 'Currently Winning' : 'Outbid'}
                                </span>
                              </div>
                            </div>
                          )}

                          {activity.type === 'achievement_unlocked' && (
                            <div className="text-sm">
                              <span className="text-gray-600">Achievement:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                🏆 {activity.metadata.achievementName}
                              </span>
                              <p className="text-gray-600 mt-1">{activity.metadata.achievementDescription}</p>
                              {activity.metadata.pointsAwarded && (
                                <div className="mt-2">
                                  <span className="text-gray-600">Points Awarded:</span>
                                  <span className="font-medium text-gray-900 ml-2">
                                    +{activity.metadata.pointsAwarded}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {activity.type === 'security_alert' && (
                            <div className="text-sm">
                              <span className="text-gray-600">Alert Type:</span>
                              <span className="font-medium text-red-600 ml-2">
                                🚨 {activity.metadata.notificationType?.replace('_', ' ').toUpperCase()}
                              </span>
                              <p className="text-gray-600 mt-1">Please review your account security settings</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {activity.actionUrl && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = activity.actionUrl;
                            }}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50"
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteActivity(activity.id);
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Detail Modal */}
        {selectedActivity && selectedActivityData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Activity Header */}
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: getActivityColor(selectedActivityData.type) }}
                  >
                    {getActivityIcon(selectedActivityData.type)}
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-gray-900">{selectedActivityData.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-gray-600">
                        {formatRelativeTime(selectedActivityData.timestamp)}
                      </span>
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          selectedActivityData.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          selectedActivityData.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          selectedActivityData.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedActivityData.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activity Description */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Description</h5>
                  <p className="text-gray-900">{selectedActivityData.description}</p>
                </div>

                {/* Detailed Metadata */}
                {selectedActivityData.metadata && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Details</h5>
                    {/* Render detailed metadata based on activity type */}
                    <div className="text-sm space-y-2">
                      {Object.entries(selectedActivityData.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium text-gray-900">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                  {selectedActivityData.actionUrl && (
                    <button
                      onClick={() => window.location.href = selectedActivityData.actionUrl}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Take Action
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedActivity(null)}
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
    </div>
  );
}
