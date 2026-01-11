import { EventEmitter } from 'events';
import { EventTrackingService, TrackedEvent, EventType, EventCategory } from './eventTracking';

export enum BehaviorType {
  NAVIGATION = 'navigation',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  RETENTION = 'retention',
  CHURN = 'churn',
  ACTIVITY_PATTERN = 'activity_pattern',
  PREFERENCE = 'preference',
  SEGMENTATION = 'segmentation',
  JOURNEY = 'journey',
  FUNNEL = 'funnel'
}

export enum UserSegment {
  NEW_USER = 'new_user',
  ACTIVE_USER = 'active_user',
  POWER_USER = 'power_user',
  INACTIVE_USER = 'inactive_user',
  CHURNED_USER = 'churned_user',
  PREMIUM_USER = 'premium_user',
  FREE_USER = 'free_user',
  MOBILE_USER = 'mobile_user',
  DESKTOP_USER = 'desktop_user'
}

export enum EngagementLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export interface UserBehavior {
  userId: string;
  sessionId?: string;
  events: TrackedEvent[];
  patterns: BehaviorPattern[];
  segments: UserSegment[];
  metrics: BehaviorMetrics;
  journey: UserJourney;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface BehaviorPattern {
  id: string;
  type: BehaviorType;
  name: string;
  description: string;
  frequency: number;
  confidence: number;
  conditions: PatternCondition[];
  actions: PatternAction[];
  isActive: boolean;
  createdAt: Date;
}

export interface PatternCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range' | 'time_between';
  value: any;
  weight: number;
}

export interface PatternAction {
  type: 'trigger_campaign' | 'send_notification' | 'update_segment' | 'log_alert' | 'recommend_content';
  config: Record<string, any>;
  priority: number;
}

export interface BehaviorMetrics {
  sessionCount: number;
  totalSessionTime: number;
  averageSessionTime: number;
  pageViews: number;
  uniquePages: number;
  bounceRate: number;
  conversionRate: number;
  retentionRate: number;
  churnProbability: number;
  lifetimeValue: number;
  engagementScore: number;
  activityLevel: EngagementLevel;
  lastActivity: Date;
  preferredTimeOfDay: string;
  preferredDayOfWeek: string;
  deviceUsage: Record<string, number>;
  featureUsage: Record<string, number>;
  contentPreferences: Record<string, number>;
}

export interface UserJourney {
  id: string;
  userId: string;
  steps: JourneyStep[];
  currentStep?: number;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  startDate: Date;
  endDate?: Date;
  duration?: number;
  conversionValue?: number;
  metadata: Record<string, any>;
}

export interface JourneyStep {
  id: string;
  name: string;
  type: 'page_view' | 'action' | 'decision' | 'conversion';
  timestamp: Date;
  duration?: number;
  data: Record<string, any>;
  nextStepId?: string;
  isCompleted: boolean;
}

export interface UserPreferences {
  communication: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
  };
  content: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
  };
  features: {
    betaFeatures: boolean;
    analytics: boolean;
    personalization: boolean;
    notifications: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    marketing: boolean;
    thirdParty: boolean;
  };
}

export interface BehaviorAnalytics {
  totalUsers: number;
  usersBySegment: Record<UserSegment, number>;
  usersByEngagement: Record<EngagementLevel, number>;
  averageSessionTime: number;
  bounceRate: number;
  conversionRate: number;
  retentionRate: number;
  churnRate: number;
  topPatterns: Array<{
    patternId: string;
    patternName: string;
    type: BehaviorType;
    frequency: number;
    confidence: number;
  }>;
  journeyAnalytics: {
    totalJourneys: number;
    averageSteps: number;
    completionRate: number;
    abandonmentRate: number;
    averageDuration: number;
    conversionValue: number;
    topFunnels: Array<{
      funnelName: string;
      totalUsers: number;
      completionRate: number;
      dropOffPoints: Array<{
        step: number;
        dropOffRate: number;
        reason: string;
      }>;
    }>;
  };
  segmentAnalytics: {
    segmentSize: number;
    segmentGrowth: number;
    segmentChurn: number;
    segmentValue: Record<string, number>;
    segmentBehavior: Record<string, any>;
  };
}

export interface AnalyticsConfig {
  enableRealTime: boolean;
  updateFrequency: number; // minutes
  retentionDays: number;
  enableSegmentation: boolean;
  enableJourneyTracking: boolean;
  enablePatternDetection: boolean;
  enablePredictiveAnalytics: boolean;
  privacyMode: 'strict' | 'standard' | 'relaxed';
  dataAnonymization: {
    hashUserIds: boolean;
    anonymizeIPs: boolean;
    excludeSensitiveData: boolean;
  };
  mlModels: {
    churnPrediction: boolean;
    recommendationEngine: boolean;
    clustering: boolean;
    classification: boolean;
  };
}

export class UserBehaviorAnalyticsService extends EventEmitter {
  private eventTrackingService: EventTrackingService;
  private userBehaviors: Map<string, UserBehavior> = new Map();
  private patterns: Map<string, BehaviorPattern> = new Map();
  private journeys: Map<string, UserJourney> = new Map();
  private config: AnalyticsConfig;
  private analytics: BehaviorAnalytics;
  private updateInterval?: NodeJS.Timeout;

  constructor(eventTrackingService: EventTrackingService, config: AnalyticsConfig) {
    super();
    this.eventTrackingService = eventTrackingService;
    this.config = this.validateConfig(config);
    this.analytics = this.initializeAnalytics();
    this.setupEventListeners();
    this.startUpdateProcessor();
  }

  private validateConfig(config: AnalyticsConfig): AnalyticsConfig {
    return {
      enableRealTime: config.enableRealTime !== false,
      updateFrequency: config.updateFrequency || 5,
      retentionDays: config.retentionDays || 90,
      enableSegmentation: config.enableSegmentation !== false,
      enableJourneyTracking: config.enableJourneyTracking !== false,
      enablePatternDetection: config.enablePatternDetection !== false,
      enablePredictiveAnalytics: config.enablePredictiveAnalytics !== false,
      privacyMode: config.privacyMode || 'standard',
      dataAnonymization: {
        hashUserIds: config.dataAnonymization?.hashUserIds || false,
        anonymizeIPs: config.dataAnonymization?.anonymizeIPs || false,
        excludeSensitiveData: config.dataAnonymization?.excludeSensitiveData || false
      },
      mlModels: {
        churnPrediction: config.mlModels?.churnPrediction || false,
        recommendationEngine: config.mlModels?.recommendationEngine || false,
        clustering: config.mlModels?.clustering || false,
        classification: config.mlModels?.classification || false
      }
    };
  }

  private initializeAnalytics(): BehaviorAnalytics {
    return {
      totalUsers: 0,
      usersBySegment: {
        new_user: 0,
        active_user: 0,
        power_user: 0,
        inactive_user: 0,
        churned_user: 0,
        premium_user: 0,
        free_user: 0,
        mobile_user: 0,
        desktop_user: 0
      },
      usersByEngagement: {
        low: 0,
        medium: 0,
        high: 0,
        very_high: 0
      },
      averageSessionTime: 0,
      bounceRate: 0,
      conversionRate: 0,
      retentionRate: 0,
      churnRate: 0,
      topPatterns: [],
      journeyAnalytics: {
        totalJourneys: 0,
        averageSteps: 0,
        completionRate: 0,
        abandonmentRate: 0,
        averageDuration: 0,
        conversionValue: 0,
        topFunnels: []
      },
      segmentAnalytics: {
        segmentSize: 0,
        segmentGrowth: 0,
        segmentChurn: 0,
        segmentValue: {},
        segmentBehavior: {}
      }
    };
  }

  private setupEventListeners(): void {
    this.eventTrackingService.on('eventTracked', (event: TrackedEvent) => {
      this.processEvent(event);
    });

    this.eventTrackingService.on('batchProcessed', (events: TrackedEvent[]) => {
      this.processBatchEvents(events);
    });
  }

  private async processEvent(event: TrackedEvent): Promise<void> {
    if (!event.userId) return;

    let userBehavior = this.userBehaviors.get(event.userId);
    
    if (!userBehavior) {
      userBehavior = await this.createUserBehavior(event.userId);
    }

    // Add event to user behavior
    userBehavior.events.push(event);
    userBehavior.updatedAt = new Date();

    // Update metrics
    this.updateUserMetrics(userBehavior, event);

    // Detect patterns
    if (this.config.enablePatternDetection) {
      await this.detectPatterns(userBehavior);
    }

    // Update segments
    if (this.config.enableSegmentation) {
      await this.updateUserSegments(userBehavior);
    }

    // Update journey
    if (this.config.enableJourneyTracking) {
      await this.updateUserJourney(userBehavior, event);
    }

    this.userBehaviors.set(event.userId, userBehavior);
    this.emit('userBehaviorUpdated', userBehavior);
  }

  private async processBatchEvents(events: TrackedEvent[]): Promise<void> {
    const userEvents = new Map<string, TrackedEvent[]>();

    // Group events by user
    events.forEach(event => {
      if (event.userId) {
        const userEventList = userEvents.get(event.userId) || [];
        userEventList.push(event);
        userEvents.set(event.userId, userEventList);
      }
    });

    // Process each user's events
    for (const [userId, userEventList] of userEvents.entries()) {
      let userBehavior = this.userBehaviors.get(userId);
      
      if (!userBehavior) {
        userBehavior = await this.createUserBehavior(userId);
      }

      userBehavior.events.push(...userEventList);
      userBehavior.updatedAt = new Date();

      // Update metrics for all events
      userEventList.forEach(event => {
        this.updateUserMetrics(userBehavior, event);
      });

      // Detect patterns from batch
      if (this.config.enablePatternDetection) {
        await this.detectPatterns(userBehavior);
      }

      // Update segments
      if (this.config.enableSegmentation) {
        await this.updateUserSegments(userBehavior);
      }

      this.userBehaviors.set(userId, userBehavior);
    }
  }

  private async createUserBehavior(userId: string): Promise<UserBehavior> {
    const userBehavior: UserBehavior = {
      userId,
      events: [],
      patterns: [],
      segments: [],
      metrics: this.initializeUserMetrics(),
      journey: this.initializeUserJourney(userId),
      preferences: this.initializeUserPreferences(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.userBehaviors.set(userId, userBehavior);
    return userBehavior;
  }

  private initializeUserMetrics(): BehaviorMetrics {
    return {
      sessionCount: 0,
      totalSessionTime: 0,
      averageSessionTime: 0,
      pageViews: 0,
      uniquePages: 0,
      bounceRate: 0,
      conversionRate: 0,
      retentionRate: 0,
      churnProbability: 0,
      lifetimeValue: 0,
      engagementScore: 0,
      activityLevel: EngagementLevel.LOW,
      lastActivity: new Date(),
      preferredTimeOfDay: '',
      preferredDayOfWeek: '',
      deviceUsage: {},
      featureUsage: {},
      contentPreferences: {}
    };
  }

  private initializeUserJourney(userId: string): UserJourney {
    return {
      id: this.generateJourneyId(),
      userId,
      steps: [],
      status: 'active',
      startDate: new Date(),
      metadata: {}
    };
  }

  private initializeUserPreferences(): UserPreferences {
    return {
      communication: {
        email: true,
        sms: true,
        push: true,
        inApp: true,
        frequency: 'immediate'
      },
      content: {
        language: 'en',
        timezone: 'UTC',
        theme: 'auto',
        fontSize: 'medium'
      },
      features: {
        betaFeatures: false,
        analytics: true,
        personalization: true,
        notifications: true
      },
      privacy: {
        dataSharing: true,
        analytics: true,
        marketing: false,
        thirdParty: false
      }
    };
  }

  private updateUserMetrics(userBehavior: UserBehavior, event: TrackedEvent): void {
    const metrics = userBehavior.metrics;

    switch (event.type) {
      case EventType.PAGE_VIEW:
        metrics.pageViews++;
        const pages = new Set(metrics.featureUsage.pages || []);
        pages.add(event.data.page || 'unknown');
        metrics.featureUsage.pages = Array.from(pages);
        break;

      case EventType.FORM_SUBMIT:
        if (event.data.success) {
          metrics.conversionRate = (metrics.conversionRate * metrics.sessionCount + 1) / (metrics.sessionCount + 1);
        }
        break;

      case EventType.USER_LOGIN:
        metrics.sessionCount++;
        metrics.lastActivity = event.timestamp;
        break;

      case EventType.CLICK:
        metrics.featureUsage.clicks = (metrics.featureUsage.clicks || 0) + 1;
        break;

      case EventType.FILE_DOWNLOAD:
        metrics.featureUsage.downloads = (metrics.featureUsage.downloads || 0) + 1;
        break;

      case EventType.SEARCH:
        metrics.featureUsage.searches = (metrics.featureUsage.searches || 0) + 1;
        break;
    }

    // Update engagement score
    this.updateEngagementScore(metrics);

    // Update activity level
    this.updateActivityLevel(metrics);

    // Update time preferences
    this.updateTimePreferences(metrics, event);

    // Update device usage
    this.updateDeviceUsage(metrics, event);
  }

  private updateEngagementScore(metrics: BehaviorMetrics): void {
    let score = 0;

    // Page views contribute to score
    score += Math.min(metrics.pageViews * 0.1, 2);

    // Session time contributes to score
    score += Math.min(metrics.averageSessionTime / 60 * 0.5, 2);

    // Conversions contribute to score
    score += metrics.conversionRate * 3;

    // Feature usage contributes to score
    const featureScore = Object.values(metrics.featureUsage).reduce((sum, count) => sum + count, 0);
    score += Math.min(featureScore * 0.1, 2);

    metrics.engagementScore = Math.min(score, 10);

    // Update engagement level
    if (metrics.engagementScore >= 8) {
      metrics.activityLevel = EngagementLevel.VERY_HIGH;
    } else if (metrics.engagementScore >= 6) {
      metrics.activityLevel = EngagementLevel.HIGH;
    } else if (metrics.engagementScore >= 4) {
      metrics.activityLevel = EngagementLevel.MEDIUM;
    } else {
      metrics.activityLevel = EngagementLevel.LOW;
    }
  }

  private updateActivityLevel(metrics: BehaviorMetrics): void {
    const hoursSinceLastActivity = (Date.now() - metrics.lastActivity.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastActivity > 30) {
      metrics.activityLevel = EngagementLevel.LOW;
    } else if (hoursSinceLastActivity > 7) {
      metrics.churnProbability = Math.min(metrics.churnProbability + 0.1, 1.0);
    }
  }

  private updateTimePreferences(metrics: BehaviorMetrics, event: TrackedEvent): void {
    const hour = event.timestamp.getHours();
    const dayOfWeek = event.timestamp.getDay();
    
    // Simple tracking of most common time/day
    // In a real implementation, this would be more sophisticated
    metrics.preferredTimeOfDay = `${hour}:00`;
    metrics.preferredDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
  }

  private updateDeviceUsage(metrics: BehaviorMetrics, event: TrackedEvent): void {
    if (event.metadata?.customDimensions?.deviceInfo) {
      const deviceType = event.metadata.customDimensions.deviceInfo.type;
      metrics.deviceUsage[deviceType] = (metrics.deviceUsage[deviceType] || 0) + 1;
    }
  }

  private async detectPatterns(userBehavior: UserBehavior): Promise<void> {
    const recentEvents = userBehavior.events.slice(-100); // Last 100 events
    
    // Detect navigation patterns
    const navigationPattern = await this.detectNavigationPattern(recentEvents);
    if (navigationPattern) {
      this.addOrUpdatePattern(userBehavior, navigationPattern);
    }

    // Detect engagement patterns
    const engagementPattern = await this.detectEngagementPattern(recentEvents);
    if (engagementPattern) {
      this.addOrUpdatePattern(userBehavior, engagementPattern);
    }

    // Detect conversion patterns
    const conversionPattern = await this.detectConversionPattern(recentEvents);
    if (conversionPattern) {
      this.addOrUpdatePattern(userBehavior, conversionPattern);
    }
  }

  private async detectNavigationPattern(events: TrackedEvent[]): Promise<BehaviorPattern | null> {
    const pageViewEvents = events.filter(e => e.type === EventType.PAGE_VIEW);
    if (pageViewEvents.length < 5) return null;

    // Analyze page sequence patterns
    const pageSequences = new Map<string, number>();
    
    for (let i = 0; i < pageViewEvents.length - 1; i++) {
      const sequence = `${pageViewEvents[i].data.page} -> ${pageViewEvents[i + 1].data.page}`;
      pageSequences.set(sequence, (pageSequences.get(sequence) || 0) + 1);
    }

    // Find most common sequence
    const mostCommonSequence = Array.from(pageSequences.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (mostCommonSequence[1] >= 3) {
      return {
        id: this.generatePatternId(),
        type: BehaviorType.NAVIGATION,
        name: 'Common Page Navigation',
        description: `Users commonly navigate from ${mostCommonSequence[0]}`,
        frequency: mostCommonSequence[1],
        confidence: Math.min(mostCommonSequence[1] / pageViewEvents.length, 1.0),
        conditions: [],
        actions: [{
          type: 'recommend_content',
          config: { type: 'navigation', sequence: mostCommonSequence[0] },
          priority: 1
        }],
        isActive: true,
        createdAt: new Date()
      };
    }

    return null;
  }

  private async detectEngagementPattern(events: TrackedEvent[]): Promise<BehaviorPattern | null> {
    const engagementEvents = events.filter(e => 
      e.type === EventType.CLICK || 
      e.type === EventType.FORM_SUBMIT || 
      e.type === EventType.FILE_DOWNLOAD
    );

    if (engagementEvents.length < 10) return null;

    // Analyze time-based engagement patterns
    const hourlyEngagement = new Map<number, number>();
    
    engagementEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      hourlyEngagement.set(hour, (hourlyEngagement.get(hour) || 0) + 1);
    });

    // Find peak engagement hours
    const peakHours = Array.from(hourlyEngagement.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    if (peakHours.length > 0) {
      return {
        id: this.generatePatternId(),
        type: BehaviorType.ENGAGEMENT,
        name: 'Peak Engagement Hours',
        description: `Users are most active during hours: ${peakHours.join(', ')}`,
        frequency: peakHours.length,
        confidence: 0.8,
        conditions: [],
        actions: [{
          type: 'send_notification',
          config: { 
            type: 'engagement_optimization',
            hours: peakHours,
            message: 'Peak activity time detected'
          },
          priority: 2
        }],
        isActive: true,
        createdAt: new Date()
      };
    }

    return null;
  }

  private async detectConversionPattern(events: TrackedEvent[]): Promise<BehaviorPattern | null> {
    const conversionEvents = events.filter(e => e.type === EventType.FORM_SUBMIT && e.data.success);
    
    if (conversionEvents.length < 5) return null;

    // Analyze conversion paths
    const conversionPaths = new Map<string, number>();
    
    for (const conversion of conversionEvents) {
      const path = conversion.data.page || conversion.data.form;
      conversionPaths.set(path, (conversionPaths.get(path) || 0) + 1);
    }

    // Find most successful conversion path
    const topConversionPath = Array.from(conversionPaths.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (topConversionPath[1] >= 3) {
      return {
        id: this.generatePatternId(),
        type: BehaviorType.CONVERSION,
        name: 'High-Conversion Path',
        description: `Most successful conversion path: ${topConversionPath[0]}`,
        frequency: topConversionPath[1],
        confidence: topConversionPath[1] / conversionEvents.length,
        conditions: [],
        actions: [{
          type: 'trigger_campaign',
          config: {
            type: 'conversion_optimization',
            path: topConversionPath[0],
            success_rate: topConversionPath[1] / conversionEvents.length
          },
          priority: 3
        }],
        isActive: true,
        createdAt: new Date()
      };
    }

    return null;
  }

  private addOrUpdatePattern(userBehavior: UserBehavior, pattern: BehaviorPattern): void {
    const existingPattern = userBehavior.patterns.find(p => p.type === pattern.type);
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.frequency = pattern.frequency;
      existingPattern.confidence = (existingPattern.confidence + pattern.confidence) / 2;
    } else {
      // Add new pattern
      userBehavior.patterns.push(pattern);
    }
  }

  private async updateUserSegments(userBehavior: UserBehavior): Promise<void> {
    const segments: UserSegment[] = [];

    // Segment by activity level
    if (userBehavior.metrics.activityLevel === EngagementLevel.VERY_HIGH) {
      segments.push(UserSegment.POWER_USER);
    } else if (userBehavior.metrics.activityLevel === EngagementLevel.HIGH) {
      segments.push(UserSegment.ACTIVE_USER);
    } else if (userBehavior.metrics.activityLevel === EngagementLevel.LOW) {
      segments.push(UserSegment.INACTIVE_USER);
    }

    // Segment by registration date
    const daysSinceRegistration = (Date.now() - userBehavior.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRegistration <= 7) {
      segments.push(UserSegment.NEW_USER);
    }

    // Segment by device usage
    const deviceUsage = userBehavior.metrics.deviceUsage;
    if (deviceUsage.mobile > deviceUsage.desktop) {
      segments.push(UserSegment.MOBILE_USER);
    } else if (deviceUsage.desktop > deviceUsage.mobile) {
      segments.push(UserSegment.DESKTOP_USER);
    }

    // Segment by churn probability
    if (userBehavior.metrics.churnProbability > 0.7) {
      segments.push(UserSegment.CHURNED_USER);
    }

    userBehavior.segments = segments;
  }

  private async updateUserJourney(userBehavior: UserBehavior, event: TrackedEvent): Promise<void> {
    let journey = userBehavior.journey;

    // Create new journey if needed
    if (journey.status === 'completed' || journey.status === 'abandoned') {
      journey = this.initializeUserJourney(userBehavior.userId);
      userBehavior.journey = journey;
    }

    // Add step to journey
    const step: JourneyStep = {
      id: this.generateStepId(),
      name: this.getStepName(event),
      type: this.getStepType(event),
      timestamp: event.timestamp,
      data: event.data,
      isCompleted: true
    };

    journey.steps.push(step);
    journey.currentStep = journey.steps.length - 1;

    // Check for conversion
    if (event.type === EventType.FORM_SUBMIT && event.data.success) {
      journey.status = 'completed';
      journey.endDate = event.timestamp;
      journey.duration = journey.endDate.getTime() - journey.startDate.getTime();
      journey.conversionValue = event.data.value || 1;
    }
  }

  private getStepName(event: TrackedEvent): string {
    switch (event.type) {
      case EventType.PAGE_VIEW:
        return `Page: ${event.data.page || 'Unknown'}`;
      case EventType.CLICK:
        return `Click: ${event.data.element || 'Unknown'}`;
      case EventType.FORM_SUBMIT:
        return `Form: ${event.data.form || 'Unknown'}`;
      default:
        return `Action: ${event.type}`;
    }
  }

  private getStepType(event: TrackedEvent): JourneyStep['type'] {
    switch (event.type) {
      case EventType.PAGE_VIEW:
        return 'page_view';
      case EventType.CLICK:
        return 'action';
      case EventType.FORM_SUBMIT:
        return event.data.success ? 'conversion' : 'action';
      default:
        return 'action';
    }
  }

  private startUpdateProcessor(): void {
    this.updateInterval = setInterval(() => {
      this.updateAnalytics();
    }, this.config.updateFrequency * 60 * 1000);
  }

  private updateAnalytics(): void {
    const behaviors = Array.from(this.userBehaviors.values());
    
    this.analytics.totalUsers = behaviors.length;

    // Update segment counts
    this.analytics.usersBySegment = {
      new_user: behaviors.filter(b => b.segments.includes(UserSegment.NEW_USER)).length,
      active_user: behaviors.filter(b => b.segments.includes(UserSegment.ACTIVE_USER)).length,
      power_user: behaviors.filter(b => b.segments.includes(UserSegment.POWER_USER)).length,
      inactive_user: behaviors.filter(b => b.segments.includes(UserSegment.INACTIVE_USER)).length,
      churned_user: behaviors.filter(b => b.segments.includes(UserSegment.CHURNED_USER)).length,
      premium_user: behaviors.filter(b => b.segments.includes(UserSegment.PREMIUM_USER)).length,
      free_user: behaviors.filter(b => b.segments.includes(UserSegment.FREE_USER)).length,
      mobile_user: behaviors.filter(b => b.segments.includes(UserSegment.MOBILE_USER)).length,
      desktop_user: behaviors.filter(b => b.segments.includes(UserSegment.DESKTOP_USER)).length
    };

    // Update engagement counts
    this.analytics.usersByEngagement = {
      low: behaviors.filter(b => b.metrics.activityLevel === EngagementLevel.LOW).length,
      medium: behaviors.filter(b => b.metrics.activityLevel === EngagementLevel.MEDIUM).length,
      high: behaviors.filter(b => b.metrics.activityLevel === EngagementLevel.HIGH).length,
      very_high: behaviors.filter(b => b.metrics.activityLevel === EngagementLevel.VERY_HIGH).length
    };

    // Calculate averages
    const totalSessionTime = behaviors.reduce((sum, b) => sum + b.metrics.totalSessionTime, 0);
    const totalPageViews = behaviors.reduce((sum, b) => sum + b.metrics.pageViews, 0);
    this.analytics.averageSessionTime = behaviors.length > 0 ? totalSessionTime / behaviors.length : 0;
    this.analytics.bounceRate = behaviors.reduce((sum, b) => sum + b.metrics.bounceRate, 0) / behaviors.length;
    this.analytics.conversionRate = behaviors.reduce((sum, b) => sum + b.metrics.conversionRate, 0) / behaviors.length;
    this.analytics.retentionRate = behaviors.reduce((sum, b) => sum + b.metrics.retentionRate, 0) / behaviors.length;
    this.analytics.churnRate = behaviors.reduce((sum, b) => sum + b.metrics.churnProbability, 0) / behaviors.length;

    // Update top patterns
    const allPatterns = behaviors.flatMap(b => b.patterns);
    const patternCounts = new Map<string, { count: number; confidence: number; }>();
    
    allPatterns.forEach(pattern => {
      const existing = patternCounts.get(pattern.name) || { count: 0, confidence: 0 };
      patternCounts.set(pattern.name, {
        count: existing.count + 1,
        confidence: (existing.confidence + pattern.confidence) / 2
      });
    });

    this.analytics.topPatterns = Array.from(patternCounts.entries())
      .map(([name, data]) => ({
        patternId: name,
        patternName: name,
        type: allPatterns.find(p => p.name === name)?.type || BehaviorType.NAVIGATION,
        frequency: data.count,
        confidence: data.confidence
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Update journey analytics
    this.updateJourneyAnalytics(behaviors);

    this.emit('analyticsUpdated', this.analytics);
  }

  private updateJourneyAnalytics(behaviors: UserBehavior[]): void {
    const journeys = behaviors.map(b => b.journey);
    
    this.analytics.journeyAnalytics.totalJourneys = journeys.length;
    
    const completedJourneys = journeys.filter(j => j.status === 'completed');
    const abandonedJourneys = journeys.filter(j => j.status === 'abandoned');
    
    this.analytics.journeyAnalytics.completionRate = journeys.length > 0 ? completedJourneys.length / journeys.length : 0;
    this.analytics.journeyAnalytics.abandonmentRate = journeys.length > 0 ? abandonedJourneys.length / journeys.length : 0;
    
    const totalDuration = completedJourneys.reduce((sum, j) => sum + (j.duration || 0), 0);
    this.analytics.journeyAnalytics.averageDuration = completedJourneys.length > 0 ? totalDuration / completedJourneys.length : 0;
    
    const totalConversionValue = completedJourneys.reduce((sum, j) => sum + (j.conversionValue || 0), 0);
    this.analytics.journeyAnalytics.conversionValue = totalConversionValue;

    // Analyze funnel performance
    this.updateFunnelAnalytics(journeys);
  }

  private updateFunnelAnalytics(journeys: UserJourney[]): void {
    // Group journeys by funnel type (simplified)
    const funnelGroups = new Map<string, UserJourney[]>();
    
    journeys.forEach(journey => {
      const funnelType = journey.metadata.funnelType || 'default';
      const group = funnelGroups.get(funnelType) || [];
      group.push(journey);
      funnelGroups.set(funnelType, group);
    });

    this.analytics.journeyAnalytics.topFunnels = Array.from(funnelGroups.entries())
      .map(([funnelType, group]) => {
        const totalUsers = group.length;
        const completedUsers = group.filter(j => j.status === 'completed').length;
        const completionRate = totalUsers > 0 ? completedUsers / totalUsers : 0;
        
        // Analyze drop-off points
        const dropOffPoints = this.analyzeDropOffPoints(group);
        
        return {
          funnelName: funnelType,
          totalUsers,
          completionRate,
          dropOffPoints
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);
  }

  private analyzeDropOffPoints(journeys: UserJourney[]): Array<{
    step: number;
    dropOffRate: number;
    reason: string;
  }> {
    const dropOffPoints = new Map<number, { count: number; total: number; }>();
    
    journeys.forEach(journey => {
      journey.steps.forEach((step, index) => {
        const stepKey = index + 1;
        const stats = dropOffPoints.get(stepKey) || { count: 0, total: 0 };
        stats.total++;
        
        // Check if this is a drop-off point (user didn't complete subsequent steps)
        if (index === journey.steps.length - 1 && journey.status === 'abandoned') {
          stats.count++;
        }
        
        dropOffPoints.set(stepKey, stats);
      });
    });

    return Array.from(dropOffPoints.entries())
      .map(([step, stats]) => ({
        step,
        dropOffRate: stats.total > 0 ? stats.count / stats.total : 0,
        reason: stats.count > 0 ? 'High abandonment rate' : 'Normal completion'
      }))
      .sort((a, b) => a.step - b.step);
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJourneyId(): string {
    return `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  async getUserBehavior(userId: string): Promise<UserBehavior | null> {
    return this.userBehaviors.get(userId) || null;
  }

  async getAllUserBehaviors(): Promise<UserBehavior[]> {
    return Array.from(this.userBehaviors.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getUserSegments(userId: string): Promise<UserSegment[]> {
    const behavior = this.userBehaviors.get(userId);
    return behavior ? behavior.segments : [];
  }

  async getUsersBySegment(segment: UserSegment): Promise<string[]> {
    return Array.from(this.userBehaviors.values())
      .filter(behavior => behavior.segments.includes(segment))
      .map(behavior => behavior.userId);
  }

  async getPattern(patternId: string): Promise<BehaviorPattern | null> {
    return this.patterns.get(patternId) || null;
  }

  async getAllPatterns(): Promise<BehaviorPattern[]> {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getJourney(journeyId: string): Promise<UserJourney | null> {
    return this.journeys.get(journeyId) || null;
  }

  async getUserJourneys(userId: string): Promise<UserJourney[]> {
    return Array.from(this.journeys.values())
      .filter(journey => journey.userId === userId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  async getAnalytics(): Promise<BehaviorAnalytics> {
    this.updateAnalytics();
    return { ...this.analytics };
  }

  async updateConfig(updates: Partial<AnalyticsConfig>): Promise<AnalyticsConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<AnalyticsConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.emit('shutdown');
  }
}
