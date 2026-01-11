import { EventEmitter } from 'events';

// Enums
export enum ActivityType {
  AUCTION_CREATED = 'auction_created',
  AUCTION_UPDATED = 'auction_updated',
  AUCTION_ENDED = 'auction_ended',
  BID_PLACED = 'bid_placed',
  BID_WITHDRAWN = 'bid_withdrawn',
  BID_OUTBID = 'bid_outbid',
  PAYMENT_SENT = 'payment_sent',
  PAYMENT_RECEIVED = 'payment_received',
  WALLET_LINKED = 'wallet_linked',
  WALLET_UNLINKED = 'wallet_unlinked',
  PROFILE_UPDATED = 'profile_updated',
  LOGIN = 'login',
  LOGOUT = 'logout',
  VIEW_AUCTION = 'view_auction',
  WATCH_AUCTION = 'watch_auction',
  SHARE_AUCTION = 'share_auction',
  FAVORITE_AUCTION = 'favorite_auction'
}

export enum ActivityCategory {
  AUCTION = 'auction',
  BIDDING = 'bidding',
  PAYMENT = 'payment',
  PROFILE = 'profile',
  WALLET = 'wallet',
  SOCIAL = 'social',
  SYSTEM = 'system'
}

export enum ActivityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interfaces
export interface UserActivity {
  id: string;
  userId: string;
  type: ActivityType;
  category: ActivityCategory;
  level: ActivityLevel;
  
  // Activity details
  title: string;
  description: string;
  metadata: Record<string, any>;
  
  // Related entities
  auctionId?: string;
  bidId?: string;
  transactionHash?: string;
  walletAddress?: string;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  
  // Geographic data
  country?: string;
  city?: string;
  timezone?: string;
  
  // Timing
  timestamp: Date;
  duration?: number; // in milliseconds
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
  
  // Engagement metrics
  views?: number;
  clicks?: number;
  shares?: number;
  
  // System data
  source: 'web' | 'mobile' | 'api' | 'system';
  version?: string;
  
  // Processing
  processed: boolean;
  processedAt?: Date;
  
  // Indexing
  tags: string[];
  searchableText: string;
}

export interface ActivitySession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  
  // Session details
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  source: 'web' | 'mobile' | 'api';
  
  // Activity summary
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByCategory: Record<ActivityCategory, number>;
  
  // Geographic data
  country?: string;
  city?: string;
  timezone?: string;
  
  // Security
  isNewDevice: boolean;
  isNewLocation: boolean;
  riskScore: number;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface ActivityFilter {
  userId?: string;
  type?: ActivityType[];
  category?: ActivityCategory[];
  level?: ActivityLevel[];
  status?: string[];
  dateRange?: { start: Date; end: Date };
  source?: string[];
  auctionId?: string;
  walletAddress?: string;
  tags?: string[];
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'level' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityAggregation {
  id: string;
  userId: string;
  period: { start: Date; end: Date };
  granularity: 'hour' | 'day' | 'week' | 'month';
  
  // Activity counts
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByCategory: Record<ActivityCategory, number>;
  activitiesByLevel: Record<ActivityLevel, number>;
  
  // Engagement metrics
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  averageEngagementRate: number;
  
  // Time-based data
  timelineData: {
    timestamp: Date;
    activityCount: number;
    uniqueTypes: number;
    engagementScore: number;
  }[];
  
  // Geographic distribution
  geographicData: {
    country: string;
    activityCount: number;
    percentage: number;
  }[];
  
  // Device and source distribution
  sourceDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  
  // Risk metrics
  riskScore: number;
  suspiciousActivities: number;
  securityEvents: number;
}

export interface ActivityTrackingConfig {
  enableRealTimeTracking: boolean;
  enableSessionTracking: boolean;
  enableGeographicTracking: boolean;
  enableDeviceTracking: boolean;
  enableRiskScoring: boolean;
  retentionPeriod: number; // days
  batchSize: number;
  processingInterval: number; // seconds
  enableAggregation: boolean;
  aggregationGranularity: 'hour' | 'day' | 'week' | 'month';
  maxActivitiesPerSession: number;
  sessionTimeout: number; // minutes
  enableIndexing: boolean;
  searchableFields: string[];
  enableCompression: boolean;
}

export interface ActivityAnalytics {
  period: { start: Date; end: Date };
  
  // Volume metrics
  totalActivities: number;
  uniqueUsers: number;
  averageActivitiesPerUser: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByCategory: Record<ActivityCategory, number>;
  activitiesByLevel: Record<ActivityLevel, number>;
  
  // Engagement metrics
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  averageEngagementRate: number;
  
  // Temporal patterns
  hourlyActivity: {
    hour: number;
    activityCount: number;
  }[];
  dailyActivity: {
    date: Date;
    activityCount: number;
  }[];
  
  // Geographic distribution
  topCountries: {
    country: string;
    activityCount: number;
    percentage: number;
  }[];
  
  // Device and source metrics
  sourceDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  
  // Security metrics
  suspiciousActivities: number;
  securityEvents: number;
  averageRiskScore: number;
  
  // Performance metrics
  processingLatency: number;
  indexingLatency: number;
  aggregationLatency: number;
}

// Main Activity Tracking Service
export class ActivityTrackingService extends EventEmitter {
  private activities: Map<string, UserActivity> = new Map();
  private sessions: Map<string, ActivitySession> = new Map();
  private aggregations: Map<string, ActivityAggregation> = new Map();
  private userIdToActivities: Map<string, string[]> = new Map();
  private config: ActivityTrackingConfig;
  private processingQueue: UserActivity[] = [];
  private isProcessing = false;
  private processingTimer?: NodeJS.Timeout;

  constructor(config?: Partial<ActivityTrackingConfig>) {
    super();
    this.config = {
      enableRealTimeTracking: true,
      enableSessionTracking: true,
      enableGeographicTracking: true,
      enableDeviceTracking: true,
      enableRiskScoring: true,
      retentionPeriod: 365,
      batchSize: 1000,
      processingInterval: 60,
      enableAggregation: true,
      aggregationGranularity: 'day',
      maxActivitiesPerSession: 10000,
      sessionTimeout: 30,
      enableIndexing: true,
      searchableFields: ['title', 'description', 'searchableText'],
      enableCompression: true,
      ...config
    };
  }

  // Activity Tracking
  async trackActivity(
    userId: string,
    type: ActivityType,
    data: {
      title: string;
      description?: string;
      metadata?: Record<string, any>;
      auctionId?: string;
      bidId?: string;
      transactionHash?: string;
      walletAddress?: string;
      duration?: number;
      views?: number;
      clicks?: number;
      shares?: number;
      source?: 'web' | 'mobile' | 'api' | 'system';
      version?: string;
      tags?: string[];
    },
    context?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      sessionId?: string;
      country?: string;
      city?: string;
      timezone?: string;
    }
  ): Promise<UserActivity> {
    const activityId = this.generateId();
    const timestamp = new Date();

    // Determine category and level
    const category = this.getActivityCategory(type);
    const level = this.getActivityLevel(type, data);

    const activity: UserActivity = {
      id: activityId,
      userId,
      type,
      category,
      level,
      title: data.title,
      description: data.description || '',
      metadata: data.metadata || {},
      auctionId: data.auctionId,
      bidId: data.bidId,
      transactionHash: data.transactionHash,
      walletAddress: data.walletAddress,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      deviceId: context?.deviceId,
      sessionId: context?.sessionId,
      country: context?.country,
      city: context?.city,
      timezone: context?.timezone,
      timestamp,
      duration: data.duration,
      status: 'completed',
      source: data.source || 'web',
      version: data.version,
      processed: false,
      views: data.views,
      clicks: data.clicks,
      shares: data.shares,
      tags: data.tags || [],
      searchableText: this.createSearchableText(data.title, data.description)
    };

    // Calculate risk score if enabled
    if (this.config.enableRiskScoring) {
      activity.metadata.riskScore = await this.calculateRiskScore(activity, context);
    }

    // Store activity
    this.activities.set(activityId, activity);
    
    // Update user index
    const userActivities = this.userIdToActivities.get(userId) || [];
    userActivities.push(activityId);
    this.userIdToActivities.set(userId, userActivities);

    // Update session if enabled
    if (this.config.enableSessionTracking && context?.sessionId) {
      await this.updateSession(context.sessionId, activity);
    }

    // Add to processing queue
    this.processingQueue.push(activity);

    this.emit('activityTracked', activity);
    return activity;
  }

  async trackBatchActivities(
    activities: Array<{
      userId: string;
      type: ActivityType;
      data: any;
      context?: any;
    }>
  ): Promise<UserActivity[]> {
    const trackedActivities: UserActivity[] = [];
    
    for (const activityData of activities) {
      try {
        const activity = await this.trackActivity(
          activityData.userId,
          activityData.type,
          activityData.data,
          activityData.context
        );
        trackedActivities.push(activity);
      } catch (error) {
        this.emit('trackingError', { activityData, error });
      }
    }

    this.emit('batchActivitiesTracked', trackedActivities);
    return trackedActivities;
  }

  // Session Management
  async startSession(
    userId: string,
    sessionId: string,
    context: {
      ipAddress: string;
      userAgent: string;
      deviceId: string;
      source: 'web' | 'mobile' | 'api';
      country?: string;
      city?: string;
      timezone?: string;
    }
  ): Promise<ActivitySession> {
    const session: ActivitySession = {
      id: this.generateId(),
      userId,
      sessionId,
      startTime: new Date(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceId: context.deviceId,
      source: context.source,
      country: context.country,
      city: context.city,
      timezone: context.timezone,
      totalActivities: 0,
      activitiesByType: {} as Record<ActivityType, number>,
      activitiesByCategory: {} as Record<ActivityCategory, number>,
      isNewDevice: await this.isNewDevice(userId, context.deviceId),
      isNewLocation: await this.isNewLocation(userId, context.country),
      riskScore: 0,
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    this.emit('sessionStarted', session);
    return session;
  }

  async endSession(sessionId: string): Promise<ActivitySession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    this.emit('sessionEnded', session);
    return session;
  }

  // Activity Retrieval
  async getActivities(filter: ActivityFilter): Promise<UserActivity[]> {
    let activities = Array.from(this.activities.values());

    // Apply filters
    if (filter.userId) {
      activities = activities.filter(a => a.userId === filter.userId);
    }

    if (filter.type && filter.type.length > 0) {
      activities = activities.filter(a => filter.type!.includes(a.type));
    }

    if (filter.category && filter.category.length > 0) {
      activities = activities.filter(a => filter.category!.includes(a.category));
    }

    if (filter.level && filter.level.length > 0) {
      activities = activities.filter(a => filter.level!.includes(a.level));
    }

    if (filter.status && filter.status.length > 0) {
      activities = activities.filter(a => filter.status!.includes(a.status));
    }

    if (filter.dateRange) {
      activities = activities.filter(a => 
        a.timestamp >= filter.dateRange!.start && 
        a.timestamp <= filter.dateRange!.end
      );
    }

    if (filter.source && filter.source.length > 0) {
      activities = activities.filter(a => filter.source!.includes(a.source));
    }

    if (filter.auctionId) {
      activities = activities.filter(a => a.auctionId === filter.auctionId);
    }

    if (filter.walletAddress) {
      activities = activities.filter(a => a.walletAddress === filter.walletAddress);
    }

    if (filter.tags && filter.tags.length > 0) {
      activities = activities.filter(a => 
        filter.tags!.some(tag => a.tags.includes(tag))
      );
    }

    if (filter.searchText) {
      const searchTerm = filter.searchText.toLowerCase();
      activities = activities.filter(a => 
        a.searchableText.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (filter.sortBy) {
      activities.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (filter.sortBy) {
          case 'timestamp':
            aVal = a.timestamp;
            bVal = b.timestamp;
            break;
          case 'level':
            const levelOrder = { low: 1, medium: 2, high: 3, critical: 4 };
            aVal = levelOrder[a.level];
            bVal = levelOrder[b.level];
            break;
          case 'type':
            aVal = a.type;
            bVal = b.type;
            break;
          default:
            return 0;
        }

        if (filter.sortOrder === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    // Pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    return activities.slice(offset, offset + limit);
  }

  async getUserActivities(
    userId: string,
    limit = 100,
    offset = 0
  ): Promise<UserActivity[]> {
    return this.getActivities({
      userId,
      limit,
      offset,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }

  async getActivity(activityId: string): Promise<UserActivity | null> {
    return this.activities.get(activityId) || null;
  }

  // Session Retrieval
  async getSessions(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<ActivitySession[]> {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(offset, offset + limit);
  }

  async getSession(sessionId: string): Promise<ActivitySession | null> {
    return this.sessions.get(sessionId) || null;
  }

  // Aggregation
  async createAggregation(
    userId: string,
    period: { start: Date; end: Date },
    granularity: ActivityAggregation['granularity'] = this.config.aggregationGranularity
  ): Promise<ActivityAggregation> {
    const aggregationId = this.generateId();
    
    // Get activities for the period
    const activities = await this.getActivities({
      userId,
      dateRange: period
    });

    // Create aggregation
    const aggregation = await this.processAggregation(
      aggregationId,
      userId,
      activities,
      period,
      granularity
    );

    this.aggregations.set(aggregationId, aggregation);
    this.emit('aggregationCreated', aggregation);
    return aggregation;
  }

  async getAggregations(
    userId: string,
    limit = 50
  ): Promise<ActivityAggregation[]> {
    return Array.from(this.aggregations.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => b.period.start.getTime() - a.period.start.getTime())
      .slice(0, limit);
  }

  // Private Methods
  private async updateSession(sessionId: string, activity: UserActivity): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.totalActivities++;
    session.activitiesByType[activity.type] = (session.activitiesByType[activity.type] || 0) + 1;
    session.activitiesByCategory[activity.category] = (session.activitiesByCategory[activity.category] || 0) + 1;

    // Update risk score
    if (activity.metadata.riskScore) {
      session.riskScore = Math.max(session.riskScore, activity.metadata.riskScore);
    }
  }

  private async processAggregation(
    aggregationId: string,
    userId: string,
    activities: UserActivity[],
    period: { start: Date; end: Date },
    granularity: ActivityAggregation['granularity']
  ): Promise<ActivityAggregation> {
    // Activity counts
    const totalActivities = activities.length;
    
    const activitiesByType: Record<ActivityType, number> = {} as Record<ActivityType, number>;
    const activitiesByCategory: Record<ActivityCategory, number> = {} as Record<ActivityCategory, number>;
    const activitiesByLevel: Record<ActivityLevel, number> = {} as Record<ActivityLevel, number>;

    for (const activity of activities) {
      activitiesByType[activity.type] = (activitiesByType[activity.type] || 0) + 1;
      activitiesByCategory[activity.category] = (activitiesByCategory[activity.category] || 0) + 1;
      activitiesByLevel[activity.level] = (activitiesByLevel[activity.level] || 0) + 1;
    }

    // Engagement metrics
    const totalViews = activities.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalClicks = activities.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const totalShares = activities.reduce((sum, a) => sum + (a.shares || 0), 0);
    const averageEngagementRate = totalViews > 0 ? (totalClicks + totalShares) / totalViews : 0;

    // Timeline data
    const timelineData = this.createTimelineData(activities, granularity);

    // Geographic distribution
    const geographicData = this.createGeographicData(activities);

    // Device and source distribution
    const sourceDistribution: Record<string, number> = {};
    const deviceDistribution: Record<string, number> = {};

    for (const activity of activities) {
      sourceDistribution[activity.source] = (sourceDistribution[activity.source] || 0) + 1;
      if (activity.userAgent) {
        const device = this.extractDevice(activity.userAgent);
        deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
      }
    }

    // Risk metrics
    const riskScores = activities
      .filter(a => a.metadata.riskScore)
      .map(a => a.metadata.riskScore);
    const averageRiskScore = riskScores.length > 0 
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length 
      : 0;

    const suspiciousActivities = activities.filter(a => 
      a.metadata.riskScore && a.metadata.riskScore > 0.7
    ).length;

    const securityEvents = activities.filter(a => 
      a.level === ActivityLevel.CRITICAL
    ).length;

    return {
      id: aggregationId,
      userId,
      period,
      granularity,
      totalActivities,
      activitiesByType,
      activitiesByCategory,
      activitiesByLevel,
      totalViews,
      totalClicks,
      totalShares,
      averageEngagementRate,
      timelineData,
      geographicData,
      sourceDistribution,
      deviceDistribution,
      riskScore: averageRiskScore,
      suspiciousActivities,
      securityEvents
    };
  }

  private createTimelineData(
    activities: UserActivity[],
    granularity: ActivityAggregation['granularity']
  ): ActivityAggregation['timelineData'] {
    const timelineMap = new Map<string, ActivityAggregation['timelineData'][0]>();

    for (const activity of activities) {
      const timeKey = this.getTimeKey(activity.timestamp, granularity);
      const existing = timelineMap.get(timeKey);
      
      if (existing) {
        existing.activityCount++;
        existing.uniqueTypes.add(activity.type);
      } else {
        timelineMap.set(timeKey, {
          timestamp: activity.timestamp,
          activityCount: 1,
          uniqueTypes: new Set([activity.type]),
          engagementScore: 0
        });
      }
    }

    return Array.from(timelineMap.values())
      .map(item => ({
        ...item,
        uniqueTypes: item.uniqueTypes.size,
        engagementScore: 0 // Would calculate based on views, clicks, shares
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private createGeographicData(
    activities: UserActivity[]
  ): ActivityAggregation['geographicData'] {
    const countryCounts = new Map<string, number>();
    let totalActivities = 0;

    for (const activity of activities) {
      if (activity.country) {
        countryCounts.set(activity.country, (countryCounts.get(activity.country) || 0) + 1);
        totalActivities++;
      }
    }

    return Array.from(countryCounts.entries())
      .map(([country, activityCount]) => ({
        country,
        activityCount,
        percentage: totalActivities > 0 ? (activityCount / totalActivities) * 100 : 0
      }))
      .sort((a, b) => b.activityCount - a.activityCount);
  }

  private getTimeKey(date: Date, granularity: ActivityAggregation['granularity']): string {
    switch (granularity) {
      case 'hour':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      case 'day':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
      case 'month':
        return `${date.getFullYear()}-${date.getMonth()}`;
      default:
        return date.toISOString();
    }
  }

  private extractDevice(userAgent: string): string {
    // Simple device extraction
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private getActivityCategory(type: ActivityType): ActivityCategory {
    const categoryMap: Record<ActivityType, ActivityCategory> = {
      [ActivityType.AUCTION_CREATED]: ActivityCategory.AUCTION,
      [ActivityType.AUCTION_UPDATED]: ActivityCategory.AUCTION,
      [ActivityType.AUCTION_ENDED]: ActivityCategory.AUCTION,
      [ActivityType.BID_PLACED]: ActivityCategory.BIDDING,
      [ActivityType.BID_WITHDRAWN]: ActivityCategory.BIDDING,
      [ActivityType.BID_OUTBID]: ActivityCategory.BIDDING,
      [ActivityType.PAYMENT_SENT]: ActivityCategory.PAYMENT,
      [ActivityType.PAYMENT_RECEIVED]: ActivityCategory.PAYMENT,
      [ActivityType.WALLET_LINKED]: ActivityCategory.WALLET,
      [ActivityType.WALLET_UNLINKED]: ActivityCategory.WALLET,
      [ActivityType.PROFILE_UPDATED]: ActivityCategory.PROFILE,
      [ActivityType.LOGIN]: ActivityCategory.SYSTEM,
      [ActivityType.LOGOUT]: ActivityCategory.SYSTEM,
      [ActivityType.VIEW_AUCTION]: ActivityCategory.SOCIAL,
      [ActivityType.WATCH_AUCTION]: ActivityCategory.SOCIAL,
      [ActivityType.SHARE_AUCTION]: ActivityCategory.SOCIAL,
      [ActivityType.FAVORITE_AUCTION]: ActivityCategory.SOCIAL
    };

    return categoryMap[type] || ActivityCategory.SYSTEM;
  }

  private getActivityLevel(type: ActivityType, data: any): ActivityLevel {
    // Default level mapping
    const levelMap: Record<ActivityType, ActivityLevel> = {
      [ActivityType.AUCTION_CREATED]: ActivityLevel.MEDIUM,
      [ActivityType.AUCTION_UPDATED]: ActivityLevel.LOW,
      [ActivityType.AUCTION_ENDED]: ActivityLevel.MEDIUM,
      [ActivityType.BID_PLACED]: ActivityLevel.MEDIUM,
      [ActivityType.BID_WITHDRAWN]: ActivityLevel.LOW,
      [ActivityType.BID_OUTBID]: ActivityLevel.LOW,
      [ActivityType.PAYMENT_SENT]: ActivityLevel.HIGH,
      [ActivityType.PAYMENT_RECEIVED]: ActivityLevel.HIGH,
      [ActivityType.WALLET_LINKED]: ActivityLevel.MEDIUM,
      [ActivityType.WALLET_UNLINKED]: ActivityLevel.MEDIUM,
      [ActivityType.PROFILE_UPDATED]: ActivityLevel.LOW,
      [ActivityType.LOGIN]: ActivityLevel.LOW,
      [ActivityType.LOGOUT]: ActivityLevel.LOW,
      [ActivityType.VIEW_AUCTION]: ActivityLevel.LOW,
      [ActivityType.WATCH_AUCTION]: ActivityLevel.LOW,
      [ActivityType.SHARE_AUCTION]: ActivityLevel.LOW,
      [ActivityType.FAVORITE_AUCTION]: ActivityLevel.LOW
    };

    return levelMap[type] || ActivityLevel.LOW;
  }

  private async calculateRiskScore(
    activity: UserActivity,
    context?: any
  ): Promise<number> {
    let riskScore = 0;

    // Geographic risk
    if (context?.country && this.isHighRiskCountry(context.country)) {
      riskScore += 0.3;
    }

    // Time-based risk
    const hour = activity.timestamp.getHours();
    if (hour < 6 || hour > 23) {
      riskScore += 0.2;
    }

    // Activity type risk
    if (activity.type === ActivityType.PAYMENT_SENT) {
      riskScore += 0.4;
    }

    // Frequency risk
    const recentActivities = await this.getActivities({
      userId: activity.userId,
      dateRange: {
        start: new Date(activity.timestamp.getTime() - 60 * 60 * 1000), // Last hour
        end: activity.timestamp
      }
    });

    if (recentActivities.length > 100) {
      riskScore += 0.3;
    }

    return Math.min(riskScore, 1);
  }

  private async isNewDevice(userId: string, deviceId: string): Promise<boolean> {
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.deviceId === deviceId);
    
    return userSessions.length === 0;
  }

  private async isNewLocation(userId: string, country?: string): Promise<boolean> {
    if (!country) return false;

    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.country);
    
    const previousCountries = new Set(userSessions.map(s => s.country));
    return !previousCountries.has(country);
  }

  private isHighRiskCountry(country: string): boolean {
    // Placeholder for high-risk country detection
    const highRiskCountries = ['XX', 'YY']; // Would use real data
    return highRiskCountries.includes(country);
  }

  private createSearchableText(title: string, description?: string): string {
    return `${title} ${description || ''}`.toLowerCase();
  }

  private generateId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getActivityAnalytics(
    period: { start: Date; end: Date }
  ): Promise<ActivityAnalytics> {
    const activities = Array.from(this.activities.values())
      .filter(a => a.timestamp >= period.start && a.timestamp <= period.end);

    // Basic metrics
    const totalActivities = activities.length;
    const uniqueUsers = new Set(activities.map(a => a.userId)).size;
    const averageActivitiesPerUser = uniqueUsers > 0 ? totalActivities / uniqueUsers : 0;

    // By type
    const activitiesByType: Record<ActivityType, number> = {} as Record<ActivityType, number>;
    for (const activity of activities) {
      activitiesByType[activity.type] = (activitiesByType[activity.type] || 0) + 1;
    }

    // By category
    const activitiesByCategory: Record<ActivityCategory, number> = {} as Record<ActivityCategory, number>;
    for (const activity of activities) {
      activitiesByCategory[activity.category] = (activitiesByCategory[activity.category] || 0) + 1;
    }

    // By level
    const activitiesByLevel: Record<ActivityLevel, number> = {} as Record<ActivityLevel, number>;
    for (const activity of activities) {
      activitiesByLevel[activity.level] = (activitiesByLevel[activity.level] || 0) + 1;
    }

    // Engagement metrics
    const totalViews = activities.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalClicks = activities.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const totalShares = activities.reduce((sum, a) => sum + (a.shares || 0), 0);
    const averageEngagementRate = totalViews > 0 ? (totalClicks + totalShares) / totalViews : 0;

    // Hourly activity
    const hourlyActivity: ActivityAnalytics['hourlyActivity'] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourActivities = activities.filter(a => a.timestamp.getHours() === hour);
      hourlyActivity.push({
        hour,
        activityCount: hourActivities.length
      });
    }

    // Daily activity
    const dailyMap = new Map<string, { date: Date; activityCount: number }>();
    for (const activity of activities) {
      const dateKey = activity.timestamp.toISOString().substring(0, 10);
      const existing = dailyMap.get(dateKey);
      if (existing) {
        existing.activityCount++;
      } else {
        dailyMap.set(dateKey, {
          date: activity.timestamp,
          activityCount: 1
        });
      }
    }

    const dailyActivity = Array.from(dailyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Top countries
    const countryCounts = new Map<string, number>();
    for (const activity of activities) {
      if (activity.country) {
        countryCounts.set(activity.country, (countryCounts.get(activity.country) || 0) + 1);
      }
    }

    const topCountries = Array.from(countryCounts.entries())
      .map(([country, activityCount]) => ({
        country,
        activityCount,
        percentage: (activityCount / totalActivities) * 100
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 10);

    // Source and device distribution
    const sourceDistribution: Record<string, number> = {};
    const deviceDistribution: Record<string, number> = {};

    for (const activity of activities) {
      sourceDistribution[activity.source] = (sourceDistribution[activity.source] || 0) + 1;
      if (activity.userAgent) {
        const device = this.extractDevice(activity.userAgent);
        deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
      }
    }

    // Security metrics
    const suspiciousActivities = activities.filter(a => 
      a.metadata.riskScore && a.metadata.riskScore > 0.7
    ).length;

    const securityEvents = activities.filter(a => a.level === ActivityLevel.CRITICAL).length;

    const riskScores = activities
      .filter(a => a.metadata.riskScore)
      .map(a => a.metadata.riskScore);
    const averageRiskScore = riskScores.length > 0 
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length 
      : 0;

    return {
      period,
      totalActivities,
      uniqueUsers,
      averageActivitiesPerUser,
      activitiesByType,
      activitiesByCategory,
      activitiesByLevel,
      totalViews,
      totalClicks,
      totalShares,
      averageEngagementRate,
      hourlyActivity,
      dailyActivity,
      topCountries,
      sourceDistribution,
      deviceDistribution,
      suspiciousActivities,
      securityEvents,
      averageRiskScore,
      processingLatency: 0, // Would measure from processing times
      indexingLatency: 0,
      aggregationLatency: 0
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    if (this.config.enableRealTimeTracking) {
      this.processingTimer = setInterval(async () => {
        await this.processActivityQueue();
      }, this.config.processingInterval * 1000);
    }

    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }

    this.isProcessing = false;
    this.processingQueue.length = 0;
    this.emit('serviceStopped');
  }

  private async processActivityQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.processingQueue.splice(0, this.config.batchSize);

    try {
      for (const activity of batch) {
        // Process activity (indexing, aggregation, etc.)
        activity.processed = true;
        activity.processedAt = new Date();
      }
    } catch (error) {
      this.emit('processingError', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalActivities = this.activities.size;
    const queueLength = this.processingQueue.length;
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => !s.endTime).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (queueLength > 5000) {
      status = 'unhealthy';
    } else if (queueLength > 2000) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalActivities,
        queueLength,
        activeSessions,
        realTimeTrackingEnabled: this.config.enableRealTimeTracking,
        sessionTrackingEnabled: this.config.enableSessionTracking,
        riskScoringEnabled: this.config.enableRiskScoring
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        activities: Array.from(this.activities.values()),
        sessions: Array.from(this.sessions.values()),
        aggregations: Array.from(this.aggregations.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for activities
      const headers = [
        'ID', 'User ID', 'Type', 'Category', 'Level', 'Title',
        'Timestamp', 'Source', 'Status', 'Country', 'Device'
      ];
      
      const rows = Array.from(this.activities.values()).map(a => [
        a.id,
        a.userId,
        a.type,
        a.category,
        a.level,
        a.title,
        a.timestamp.toISOString(),
        a.source,
        a.status,
        a.country || '',
        this.extractDevice(a.userAgent || '')
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
