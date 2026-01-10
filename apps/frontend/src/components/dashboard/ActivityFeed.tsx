'use client';

import { useState, useMemo } from 'react';
import { useUserProfile } from '@/lib/user-profile';

interface ActivityItem {
  id: string;
  type: 'transaction' | 'auction' | 'bid' | 'profile_update' | 'verification' | 'achievement';
  title: string;
  description: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  icon: string;
  color: string;
  metadata?: any;
}

export function ActivityFeed() {
  const { profile, transactions, formatDateTime, formatCurrency } = useUserProfile();
  const [filter, setFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');

  // Mock activity data - in real app this would come from the hook
  const mockActivities: ActivityItem[] = [
    {
      id: 'activity_1',
      type: 'auction',
      title: 'New Auction Created',
      description: 'Luxury Manhattan Apartment listed for auction',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      status: 'success',
      icon: '🏠',
      color: '#10B981',
      metadata: {
        auctionId: 'auction_1',
        assetTitle: 'Luxury Manhattan Apartment',
        startingBid: 100000
      }
    },
    {
      id: 'activity_2',
      type: 'bid',
      title: 'Bid Placed',
      description: 'You placed a bid of 2.5 ETH on Contemporary Art Piece',
      timestamp: Date.now() - 4 * 60 * 60 * 1000,
      status: 'success',
      icon: '🎯',
      color: '#3B82F6',
      metadata: {
        auctionId: 'auction_2',
        assetTitle: 'Contemporary Art Piece',
        bidAmount: 2.5,
        isWinning: true
      }
    },
    {
      id: 'activity_3',
      type: 'transaction',
      title: 'Transaction Confirmed',
      description: 'Received 1.0 ETH from external wallet',
      timestamp: Date.now() - 6 * 60 * 60 * 1000,
      status: 'success',
      icon: '💳',
      color: '#8B5CF6',
      metadata: {
        transactionHash: '0x1234...5678',
        amount: 1.0,
        from: '0x1234...5678',
        to: profile?.address
      }
    },
    {
      id: 'activity_4',
      type: 'verification',
      title: 'Verification Level Updated',
      description: 'Your KYC verification has been upgraded to Enhanced',
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      status: 'success',
      icon: '✅',
      color: '#059669',
      metadata: {
        previousLevel: 'basic',
        newLevel: 'enhanced',
        verifiedBy: 'Compliance Team'
      }
    },
    {
      id: 'activity_5',
      type: 'achievement',
      title: 'Achievement Unlocked',
      description: 'You\'ve completed 100 successful transactions!',
      timestamp: Date.now() - 48 * 60 * 60 * 1000,
      status: 'success',
      icon: '🏆',
      color: '#F59E0B',
      metadata: {
        achievementId: 'tx_100',
        achievementName: 'Transaction Master',
        description: 'Complete 100 transactions'
      }
    },
    {
      id: 'activity_6',
      type: 'profile_update',
      title: 'Profile Updated',
      description: 'You updated your profile information',
      timestamp: Date.now() - 72 * 60 * 60 * 1000,
      status: 'success',
      icon: '👤',
      color: '#6B7280',
      metadata: {
        updatedFields: ['displayName', 'bio', 'location']
      }
    }
  ];

  // Combine transactions and activities
  const allActivities = useMemo(() => {
    const activities: ActivityItem[] = [...mockActivities];

    // Convert transactions to activities
    transactions.forEach(tx => {
      activities.push({
        id: `tx_${tx.id}`,
        type: 'transaction',
        title: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Transaction`,
        description: tx.description,
        timestamp: tx.timestamp,
        status: tx.status === 'confirmed' ? 'success' : tx.status === 'pending' ? 'pending' : 'failed',
        icon: '💳',
        color: tx.status === 'confirmed' ? '#10B981' : tx.status === 'pending' ? '#F59E0B' : '#EF4444',
        metadata: {
          transactionHash: tx.hash,
          amount: parseFloat(tx.value) / Math.pow(10, 18),
          type: tx.type
        }
      });
    });

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = [...allActivities];

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.type === filter);
    }

    // Filter by time range
    const now = Date.now();
    switch (timeRange) {
      case '24h':
        filtered = filtered.filter(activity => activity.timestamp >= now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        filtered = filtered.filter(activity => activity.timestamp >= now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        filtered = filtered.filter(activity => activity.timestamp >= now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        // 'all' - no time filtering
        break;
    }

    return filtered;
  }, [allActivities, filter, timeRange]);

  const filters = [
    { value: 'all', label: 'All Activity' },
    { value: 'transaction', label: 'Transactions' },
    { value: 'auction', label: 'Auctions' },
    { value: 'bid', label: 'Bids' },
    { value: 'verification', label: 'Verification' },
    { value: 'achievement', label: 'Achievements' }
  ];

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'success': '#10B981',
      'pending': '#F59E0B',
      'failed': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'success': '✅',
      'pending': '⏳',
      'failed': '❌'
    };
    return icons[status] || '❓';
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Activity Feed</h2>
        <p className="text-gray-600">Track your recent transactions, auctions, and platform activities</p>
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{allActivities.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {allActivities.filter(a => a.type === 'transaction').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">💳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Auctions</p>
              <p className="text-2xl font-bold text-gray-900">
                {allActivities.filter(a => a.type === 'auction' || a.type === 'bid').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">🏠</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Achievements</p>
              <p className="text-2xl font-bold text-gray-900">
                {allActivities.filter(a => a.type === 'achievement').length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
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
            Showing {filteredActivities.length} of {allActivities.length} activities
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
            <p className="text-gray-600">
              {filter !== 'all' || timeRange !== 'all' 
                ? 'Try adjusting your filters to see more results' 
                : 'Your activity will appear here once you start using the platform'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  {/* Activity Icon */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: activity.color }}
                    >
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{activity.title}</h4>
                        <p className="text-gray-600">{activity.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{ 
                            backgroundColor: getStatusColor(activity.status) + '20',
                            color: getStatusColor(activity.status)
                          }}
                        >
                          {getStatusIcon(activity.status)} {activity.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Activity Metadata */}
                    {activity.metadata && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        {activity.type === 'transaction' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                {activity.metadata.amount} ETH
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium text-gray-900 ml-2 capitalize">
                                {activity.metadata.type}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Hash:</span>
                              <span className="font-medium text-gray-900 ml-2 font-mono">
                                {activity.metadata.transactionHash.slice(0, 10)}...
                              </span>
                            </div>
                          </div>
                        )}

                        {activity.type === 'auction' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Asset:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                {activity.metadata.assetTitle}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Starting Bid:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                {formatCurrency(activity.metadata.startingBid)}
                              </span>
                            </div>
                          </div>
                        )}

                        {activity.type === 'bid' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Asset:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                {activity.metadata.assetTitle}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Bid Amount:</span>
                              <span className="font-medium text-gray-900 ml-2">
                                {activity.metadata.bidAmount} ETH
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <span className={`font-medium ml-2 ${
                                activity.metadata.isWinning ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {activity.metadata.isWinning ? 'Winning' : 'Outbid'}
                              </span>
                            </div>
                          </div>
                        )}

                        {activity.type === 'verification' && (
                          <div className="text-sm">
                            <span className="text-gray-600">Level:</span>
                            <span className="font-medium text-gray-900 ml-2">
                              {activity.metadata.previousLevel} → {activity.metadata.newLevel}
                            </span>
                            <span className="text-gray-600 ml-4">Verified by:</span>
                            <span className="font-medium text-gray-900 ml-2">
                              {activity.metadata.verifiedBy}
                            </span>
                          </div>
                        )}

                        {activity.type === 'achievement' && (
                          <div className="text-sm">
                            <span className="text-gray-600">Achievement:</span>
                            <span className="font-medium text-gray-900 ml-2">
                              {activity.metadata.achievementName}
                            </span>
                            <p className="text-gray-600 mt-1">{activity.metadata.description}</p>
                          </div>
                        )}

                        {activity.type === 'profile_update' && (
                          <div className="text-sm">
                            <span className="text-gray-600">Updated:</span>
                            <span className="font-medium text-gray-900 ml-2">
                              {activity.metadata.updatedFields.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredActivities.length > 0 && (
        <div className="mt-6 text-center">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
}
