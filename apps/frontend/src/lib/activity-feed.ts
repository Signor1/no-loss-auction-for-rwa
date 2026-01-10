'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

// Types for activity feed
export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: number;
  status: ActivityStatus;
  priority: ActivityPriority;
  category: ActivityCategory;
  icon: string;
  color: string;
  metadata?: ActivityMetadata;
  isRead: boolean;
  userId: string;
  relatedEntityId?: string;
  relatedEntityType?: 'auction' | 'asset' | 'transaction' | 'user' | 'bid';
  actionUrl?: string;
  expiresAt?: number;
}

export interface ActivityMetadata {
  // Transaction metadata
  transactionHash?: string;
  transactionAmount?: string;
  transactionToken?: string;
  transactionFrom?: string;
  transactionTo?: string;
  
  // Auction metadata
  auctionId?: string;
  auctionTitle?: string;
  assetImage?: string;
  bidAmount?: string;
  bidCurrency?: string;
  isWinning?: boolean;
  currentBid?: string;
  reservePrice?: string;
  timeRemaining?: number;
  
  // Asset metadata
  assetId?: string;
  assetTitle?: string;
  assetType?: string;
  assetValue?: number;
  priceChange?: number;
  
  // User metadata
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userAction?: string;
  
  // System metadata
  systemVersion?: string;
  featureName?: string;
  changeDescription?: string;
  affectedArea?: string;
  
  // Achievement metadata
  achievementId?: string;
  achievementName?: string;
  achievementDescription?: string;
  achievementIcon?: string;
  pointsAwarded?: number;
  
  // Notification metadata
  notificationType?: string;
  deliveryMethod?: 'in_app' | 'email' | 'push' | 'sms';
  scheduledFor?: number;
  retryCount?: number;
}

export type ActivityType = 
  | 'transaction'
  | 'auction_created'
  | 'auction_ended'
  | 'bid_placed'
  | 'bid_outbid'
  | 'auction_won'
  | 'auction_lost'
  | 'asset_created'
  | 'asset_updated'
  | 'asset_verified'
  | 'profile_updated'
  | 'verification_updated'
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'achievement_unlocked'
  | 'system_maintenance'
  | 'system_update'
  | 'security_alert'
  | 'price_alert'
  | 'milestone_reached'
  | 'referral_joined'
  | 'reward_claimed'
  | 'governance_proposal'
  | 'governance_vote'
  | 'stake_started'
  | 'stake_ended'
  | 'dividend_received'
  | 'fee_rebate'
  | 'network_congestion'
  | 'gas_price_alert';

export type ActivityStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled' | 'expired';
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityCategory = 'transactions' | 'auctions' | 'assets' | 'profile' | 'system' | 'security' | 'rewards' | 'governance' | 'staking';

export interface ActivityFilter {
  types: ActivityType[];
  categories: ActivityCategory[];
  status: ActivityStatus[];
  priority: ActivityPriority[];
  dateRange: DateRange;
  searchQuery: string;
  unreadOnly: boolean;
  hasAction: boolean;
}

export interface DateRange {
  start?: number;
  end?: number;
  preset: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'all_time';
}

export interface ActivityStats {
  total: number;
  unread: number;
  byType: Record<ActivityType, number>;
  byCategory: Record<ActivityCategory, number>;
  byPriority: Record<ActivityPriority, number>;
  recentActivity: ActivityItem[];
  trendingTopics: string[];
}

export interface NotificationPreferences {
  enabled: boolean;
  types: ActivityType[];
  categories: ActivityCategory[];
  priorities: ActivityPriority[];
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  deliveryMethods: ('in_app' | 'email' | 'push' | 'sms')[];
}

// Mock data
export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 'activity_1',
    type: 'auction_created',
    title: 'New Auction Created',
    description: 'Luxury Manhattan Apartment has been listed for auction',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    status: 'active',
    priority: 'medium',
    category: 'auctions',
    icon: '🏠',
    color: '#10B981',
    isRead: false,
    userId: 'user_1',
    relatedEntityId: 'auction_1',
    relatedEntityType: 'auction',
    actionUrl: '/auction/auction_1',
    metadata: {
      auctionId: 'auction_1',
      auctionTitle: 'Luxury Manhattan Apartment',
      assetImage: '/assets/apartment.jpg',
      reservePrice: '100000',
      timeRemaining: 7 * 24 * 60 * 60 * 1000
    }
  },
  {
    id: 'activity_2',
    type: 'bid_placed',
    title: 'Bid Placed Successfully',
    description: 'Your bid of 2.5 ETH has been placed on Contemporary Art Piece',
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    status: 'completed',
    priority: 'high',
    category: 'auctions',
    icon: '🎯',
    color: '#3B82F6',
    isRead: false,
    userId: 'user_1',
    relatedEntityId: 'auction_2',
    relatedEntityType: 'auction',
    actionUrl: '/auction/auction_2',
    metadata: {
      auctionId: 'auction_2',
      auctionTitle: 'Contemporary Art Piece',
      assetImage: '/assets/art.jpg',
      bidAmount: '2.5',
      bidCurrency: 'ETH',
      isWinning: true,
      currentBid: '2.5'
    }
  },
  {
    id: 'activity_3',
    type: 'transaction',
    title: 'Transaction Confirmed',
    description: 'Received 1.0 ETH from external wallet',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    status: 'completed',
    priority: 'medium',
    category: 'transactions',
    icon: '💳',
    color: '#8B5CF6',
    isRead: true,
    userId: 'user_1',
    relatedEntityId: 'tx_1',
    relatedEntityType: 'transaction',
    actionUrl: '/transaction/tx_1',
    metadata: {
      transactionHash: '0x1234...5678',
      transactionAmount: '1.0',
      transactionToken: 'ETH',
      transactionFrom: '0xabcdef...1234',
      transactionTo: '0x1234...5678'
    }
  },
  {
    id: 'activity_4',
    type: 'bid_outbid',
    title: 'You\'ve Been Outbid',
    description: 'Someone placed a higher bid on Luxury Manhattan Apartment',
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
    status: 'active',
    priority: 'high',
    category: 'auctions',
    icon: '⚠️',
    color: '#F59E0B',
    isRead: false,
    userId: 'user_1',
    relatedEntityId: 'auction_1',
    relatedEntityType: 'auction',
    actionUrl: '/auction/auction_1',
    metadata: {
      auctionId: 'auction_1',
      auctionTitle: 'Luxury Manhattan Apartment',
      assetImage: '/assets/apartment.jpg',
      currentBid: '3.0',
      timeRemaining: 6 * 60 * 60 * 1000
    }
  },
  {
    id: 'activity_5',
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked!',
    description: 'You\'ve completed 100 successful transactions!',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    status: 'completed',
    priority: 'medium',
    category: 'rewards',
    icon: '🏆',
    color: '#F59E0B',
    isRead: false,
    userId: 'user_1',
    actionUrl: '/achievements',
    metadata: {
      achievementId: 'tx_master_100',
      achievementName: 'Transaction Master',
      achievementDescription: 'Complete 100 successful transactions',
      achievementIcon: '💳',
      pointsAwarded: 100
    }
  },
  {
    id: 'activity_6',
    type: 'verification_updated',
    title: 'Verification Level Updated',
    description: 'Your KYC verification has been upgraded to Enhanced',
    timestamp: Date.now() - 48 * 60 * 60 * 1000,
    status: 'completed',
    priority: 'high',
    category: 'profile',
    icon: '✅',
    color: '#059669',
    isRead: true,
    userId: 'user_1',
    actionUrl: '/profile/verification',
    metadata: {
      previousLevel: 'basic',
      newLevel: 'enhanced',
      verifiedBy: 'Compliance Team'
    }
  },
  {
    id: 'activity_7',
    type: 'system_update',
    title: 'Platform Update Available',
    description: 'New features and improvements are now available',
    timestamp: Date.now() - 72 * 60 * 60 * 1000,
    status: 'pending',
    priority: 'low',
    category: 'system',
    icon: '🔄',
    color: '#6B7280',
    isRead: false,
    userId: 'user_1',
    actionUrl: '/updates',
    metadata: {
      systemVersion: 'v2.1.0',
      featureName: 'Enhanced Dashboard',
      changeDescription: 'New dashboard with improved analytics',
      affectedArea: 'User Interface'
    }
  },
  {
    id: 'activity_8',
    type: 'security_alert',
    title: 'Security Alert',
    description: 'New login detected from unrecognized device',
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    status: 'active',
    priority: 'urgent',
    category: 'security',
    icon: '🚨',
    color: '#EF4444',
    isRead: false,
    userId: 'user_1',
    actionUrl: '/security',
    metadata: {
      notificationType: 'suspicious_login',
      deliveryMethod: 'email',
      affectedArea: 'Account Security'
    }
  },
  {
    id: 'activity_9',
    type: 'dividend_received',
    title: 'Dividend Received',
    description: 'You received $125.00 in dividends from your assets',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    status: 'completed',
    priority: 'medium',
    category: 'rewards',
    icon: '💰',
    color: '#10B981',
    isRead: false,
    userId: 'user_1',
    relatedEntityId: 'div_1',
    relatedEntityType: 'transaction',
    actionUrl: '/portfolio/dividends',
    metadata: {
      transactionAmount: '125.00',
      transactionToken: 'USD',
      assetId: 'asset_1',
      assetTitle: 'Luxury Manhattan Apartment'
    }
  },
  {
    id: 'activity_10',
    type: 'gas_price_alert',
    title: 'Gas Price Alert',
    description: 'Gas prices are currently low - optimal time for transactions',
    timestamp: Date.now() - 30 * 60 * 1000,
    status: 'active',
    priority: 'low',
    category: 'transactions',
    icon: '⛽',
    color: '#3B82F6',
    isRead: false,
    userId: 'user_1',
    actionUrl: '/gas-tracker',
    metadata: {
      notificationType: 'low_gas',
      deliveryMethod: 'push',
      affectedArea: 'Transaction Costs'
    }
  }
];

// Main hook for activity feed management
export function useActivityFeed() {
  const { address } = useAccount();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<ActivityFilter>({
    types: [],
    categories: [],
    status: [],
    priority: [],
    dateRange: { preset: 'this_week' },
    searchQuery: '',
    unreadOnly: false,
    hasAction: false
  });
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    enabled: true,
    types: [],
    categories: [],
    priorities: ['high', 'urgent'],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York'
    },
    frequency: 'immediate',
    deliveryMethods: ['in_app', 'push']
  });

  // Load activities
  const loadActivities = async (refresh = false) => {
    if (!address) return;
    
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setActivities(MOCK_ACTIVITIES);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Filter by types
    if (filter.types.length > 0) {
      filtered = filtered.filter(activity => filter.types.includes(activity.type));
    }

    // Filter by categories
    if (filter.categories.length > 0) {
      filtered = filtered.filter(activity => filter.categories.includes(activity.category));
    }

    // Filter by status
    if (filter.status.length > 0) {
      filtered = filtered.filter(activity => filter.status.includes(activity.status));
    }

    // Filter by priority
    if (filter.priority.length > 0) {
      filtered = filtered.filter(activity => filter.priority.includes(activity.priority));
    }

    // Filter by date range
    const now = Date.now();
    let startTimestamp: number;
    let endTimestamp: number;

    switch (filter.dateRange.preset) {
      case 'today':
        startTimestamp = new Date().setHours(0, 0, 0, 0);
        endTimestamp = now;
        break;
      case 'yesterday':
        startTimestamp = new Date().setDate(new Date().getDate() - 1);
        endTimestamp = new Date().setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        startTimestamp = new Date().setDate(new Date().getDate() - new Date().getDay());
        endTimestamp = now;
        break;
      case 'last_week':
        startTimestamp = now - 7 * 24 * 60 * 60 * 1000;
        endTimestamp = now;
        break;
      case 'this_month':
        startTimestamp = new Date().setDate(1);
        endTimestamp = now;
        break;
      case 'last_month':
        startTimestamp = now - 30 * 24 * 60 * 60 * 1000;
        endTimestamp = now;
        break;
      case 'this_year':
        startTimestamp = new Date().setMonth(0, 1);
        endTimestamp = now;
        break;
      case 'all_time':
      default:
        startTimestamp = 0;
        endTimestamp = now;
        break;
    }

    if (filter.dateRange.start) {
      startTimestamp = filter.dateRange.start;
    }
    if (filter.dateRange.end) {
      endTimestamp = filter.dateRange.end;
    }

    filtered = filtered.filter(activity => 
      activity.timestamp >= startTimestamp && activity.timestamp <= endTimestamp
    );

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        (activity.metadata?.auctionTitle && activity.metadata.auctionTitle.toLowerCase().includes(query)) ||
        (activity.metadata?.assetTitle && activity.metadata.assetTitle.toLowerCase().includes(query))
      );
    }

    // Filter unread only
    if (filter.unreadOnly) {
      filtered = filtered.filter(activity => !activity.isRead);
    }

    // Filter has action
    if (filter.hasAction) {
      filtered = filtered.filter(activity => activity.actionUrl);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [activities, filter]);

  // Calculate statistics
  const stats = useMemo((): ActivityStats => {
    const total = activities.length;
    const unread = activities.filter(a => !a.isRead).length;
    
    const byType = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<ActivityType, number>);

    const byCategory = activities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + 1;
      return acc;
    }, {} as Record<ActivityCategory, number>);

    const byPriority = activities.reduce((acc, activity) => {
      acc[activity.priority] = (acc[activity.priority] || 0) + 1;
      return acc;
    }, {} as Record<ActivityPriority, number>);

    const recentActivity = activities
      .filter(a => a.timestamp >= Date.now() - 24 * 60 * 60 * 1000)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    const trendingTopics = [
      'Luxury Manhattan Apartment',
      'Contemporary Art Piece',
      'Gas Prices',
      'KYC Verification'
    ];

    return {
      total,
      unread,
      byType,
      byCategory,
      byPriority,
      recentActivity,
      trendingTopics
    };
  }, [activities]);

  // Mark activity as read
  const markAsRead = async (activityId: string) => {
    try {
      setActivities(prev =>
        prev.map(activity =>
          activity.id === activityId ? { ...activity, isRead: true } : activity
        )
      );
    } catch (error) {
      console.error('Error marking activity as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setActivities(prev =>
        prev.map(activity => ({ ...activity, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all activities as read:', error);
    }
  };

  // Delete activity
  const deleteActivity = async (activityId: string) => {
    try {
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  // Update filter
  const updateFilter = (newFilter: Partial<ActivityFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  // Update notification preferences
  const updateNotificationPreferences = async (prefs: Partial<NotificationPreferences>) => {
    try {
      setNotificationPrefs(prev => ({ ...prev, ...prefs }));
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  // Utility functions
  const formatRelativeTime = (timestamp: number): string => {
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
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const getActivityIcon = (type: ActivityType): string => {
    const icons: Record<ActivityType, string> = {
      'transaction': '💳',
      'auction_created': '🏠',
      'auction_ended': '🏁',
      'bid_placed': '🎯',
      'bid_outbid': '⚠️',
      'auction_won': '🏆',
      'auction_lost': '😔',
      'asset_created': '🎨',
      'asset_updated': '✏️',
      'asset_verified': '✅',
      'profile_updated': '👤',
      'verification_updated': '🔐',
      'wallet_connected': '🔗',
      'wallet_disconnected': '🔌',
      'achievement_unlocked': '🏆',
      'system_maintenance': '🔧',
      'system_update': '🔄',
      'security_alert': '🚨',
      'price_alert': '📊',
      'milestone_reached': '🎯',
      'referral_joined': '👥',
      'reward_claimed': '🎁',
      'governance_proposal': '🗳️',
      'governance_vote': '🗳️',
      'stake_started': '🔒',
      'stake_ended': '🔓',
      'dividend_received': '💰',
      'fee_rebate': '💸',
      'network_congestion': '🚦',
      'gas_price_alert': '⛽'
    };
    return icons[type] || '📢';
  };

  const getActivityColor = (type: ActivityType): string => {
    const colors: Record<ActivityType, string> = {
      'transaction': '#8B5CF6',
      'auction_created': '#10B981',
      'auction_ended': '#F59E0B',
      'bid_placed': '#3B82F6',
      'bid_outbid': '#F59E0B',
      'auction_won': '#10B981',
      'auction_lost': '#EF4444',
      'asset_created': '#8B5CF6',
      'asset_updated': '#F59E0B',
      'asset_verified': '#10B981',
      'profile_updated': '#6B7280',
      'verification_updated': '#059669',
      'wallet_connected': '#10B981',
      'wallet_disconnected': '#EF4444',
      'achievement_unlocked': '#F59E0B',
      'system_maintenance': '#F59E0B',
      'system_update': '#6B7280',
      'security_alert': '#EF4444',
      'price_alert': '#3B82F6',
      'milestone_reached': '#10B981',
      'referral_joined': '#10B981',
      'reward_claimed': '#F59E0B',
      'governance_proposal': '#8B5CF6',
      'governance_vote': '#8B5CF6',
      'stake_started': '#059669',
      'stake_ended': '#059669',
      'dividend_received': '#10B981',
      'fee_rebate': '#10B981',
      'network_congestion': '#F59E0B',
      'gas_price_alert': '#3B82F6'
    };
    return colors[type] || '#6B7280';
  };

  const getPriorityColor = (priority: ActivityPriority): string => {
    const colors: Record<ActivityPriority, string> = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'urgent': '#DC2626'
    };
    return colors[priority] || '#6B7280';
  };

  useEffect(() => {
    if (address) {
      loadActivities();
    }
  }, [address]);

  return {
    // Data
    activities,
    filteredActivities,
    stats,
    filter,
    notificationPrefs,
    isLoading,
    isRefreshing,

    // Actions
    loadActivities,
    markAsRead,
    markAllAsRead,
    deleteActivity,
    updateFilter,
    updateNotificationPreferences,

    // Utilities
    formatRelativeTime,
    getActivityIcon,
    getActivityColor,
    getPriorityColor
  };
}
