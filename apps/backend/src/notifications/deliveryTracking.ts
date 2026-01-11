import { EventEmitter } from 'events';
import { NotificationChannel, NotificationStatus } from './notificationEngine';

export enum TrackingEvent {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PROCESSED = 'processed'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  RETURNED = 'returned'
}

export interface DeliveryTracking {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  status: DeliveryStatus;
  events: TrackingEventRecord[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastEventAt?: Date;
  deliveryAttempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  providerResponse?: Record<string, any>;
  errorDetails?: ErrorDetail[];
  trackingId?: string;
  externalTrackingUrl?: string;
}

export interface TrackingEventRecord {
  id: string;
  event: TrackingEvent;
  timestamp: Date;
  provider: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  metadata?: Record<string, any>;
}

export interface ErrorDetail {
  code: string;
  message: string;
  category: 'permanent' | 'temporary' | 'rate_limit' | 'authentication' | 'configuration';
  provider?: string;
  timestamp: Date;
  retryable: boolean;
  suggestedAction?: string;
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  deliveriesByChannel: Record<NotificationChannel, number>;
  deliveriesByStatus: Record<DeliveryStatus, number>;
  deliveryRate: number;
  averageDeliveryTime: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  failureRate: number;
  retryRate: number;
  topFailureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  performanceByChannel: Array<{
    channel: NotificationChannel;
    totalDeliveries: number;
    successRate: number;
    averageTime: number;
    openRate: number;
    clickRate: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
    averageTime: number;
  }>;
  geographicData: Array<{
    country: string;
    deliveries: number;
    opens: number;
    clicks: number;
    percentage: number;
  }>;
}

export interface TrackingConfig {
  enableRealTimeTracking: boolean;
  trackingExpiration: number; // days
  enableGeographicTracking: boolean;
  enableDeviceTracking: boolean;
  enableWebhooks: boolean;
  webhookEndpoints: string[];
  webhookRetryAttempts: number;
  webhookTimeout: number;
  enableProviderIntegration: boolean;
  providers: ProviderTrackingConfig[];
  enableAnalytics: boolean;
  analyticsRetentionDays: number;
  enableBatchProcessing: boolean;
  batchSize: number;
  batchInterval: number; // seconds
}

export interface ProviderTrackingConfig {
  channel: NotificationChannel;
  provider: string;
  enabled: boolean;
  trackingSupported: boolean;
  webhookUrl?: string;
  authentication: {
    type: 'api_key' | 'oauth' | 'basic';
    credentials: Record<string, string>;
  };
  eventMapping: Record<TrackingEvent, string>;
}

export interface WebhookPayload {
  notificationId: string;
  channel: NotificationChannel;
  recipient: string;
  event: TrackingEvent;
  timestamp: Date;
  details: Record<string, any>;
  signature?: string;
}

export class DeliveryTrackingService extends EventEmitter {
  private tracking: Map<string, DeliveryTracking> = new Map();
  private config: TrackingConfig;
  private analytics: DeliveryAnalytics;
  private eventQueue: TrackingEventRecord[] = [];
  private isProcessingEvents = false;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.analytics = this.initializeAnalytics();
    this.initializeDefaultProviders();
    this.startEventProcessor();
    this.startAnalyticsUpdater();
  }

  private initializeDefaultConfig(): TrackingConfig {
    return {
      enableRealTimeTracking: true,
      trackingExpiration: 90,
      enableGeographicTracking: true,
      enableDeviceTracking: true,
      enableWebhooks: true,
      webhookEndpoints: [],
      webhookRetryAttempts: 3,
      webhookTimeout: 10000,
      enableProviderIntegration: true,
      providers: [],
      enableAnalytics: true,
      analyticsRetentionDays: 90,
      enableBatchProcessing: true,
      batchSize: 100,
      batchInterval: 30
    };
  }

  private initializeAnalytics(): DeliveryAnalytics {
    return {
      totalDeliveries: 0,
      deliveriesByChannel: {
        email: 0,
        sms: 0,
        push: 0,
        webhook: 0,
        slack: 0,
        microsoft_teams: 0,
        discord: 0,
        in_app: 0
      },
      deliveriesByStatus: {
        pending: 0,
        in_transit: 0,
        delivered: 0,
        failed: 0,
        bounced: 0,
        returned: 0
      },
      deliveryRate: 0,
      averageDeliveryTime: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      failureRate: 0,
      retryRate: 0,
      topFailureReasons: [],
      performanceByChannel: [],
      timeSeriesData: [],
      geographicData: []
    };
  }

  private initializeDefaultProviders(): void {
    const providers: ProviderTrackingConfig[] = [
      {
        channel: NotificationChannel.EMAIL,
        provider: 'sendgrid',
        enabled: true,
        trackingSupported: true,
        webhookUrl: '/webhooks/sendgrid',
        authentication: {
          type: 'api_key',
          credentials: { key: 'sendgrid_verification_key' }
        },
        eventMapping: {
          [TrackingEvent.SENT]: 'delivered',
          [TrackingEvent.DELIVERED]: 'delivered',
          [TrackingEvent.OPENED]: 'open',
          [TrackingEvent.CLICKED]: 'click',
          [TrackingEvent.BOUNCED]: 'bounce',
          [TrackingEvent.FAILED]: 'dropped'
        }
      },
      {
        channel: NotificationChannel.SMS,
        provider: 'twilio',
        enabled: true,
        trackingSupported: true,
        webhookUrl: '/webhooks/twilio',
        authentication: {
          type: 'basic',
          credentials: { accountSid: 'twilio_account', authToken: 'twilio_token' }
        },
        eventMapping: {
          [TrackingEvent.SENT]: 'sent',
          [TrackingEvent.DELIVERED]: 'delivered',
          [TrackingEvent.FAILED]: 'undelivered',
          [TrackingEvent.BOUNCED]: 'failed'
        }
      },
      {
        channel: NotificationChannel.PUSH,
        provider: 'fcm',
        enabled: true,
        trackingSupported: true,
        webhookUrl: '/webhooks/fcm',
        authentication: {
          type: 'api_key',
          credentials: { serverKey: 'fcm_server_key' }
        },
        eventMapping: {
          [TrackingEvent.SENT]: 'sent',
          [TrackingEvent.DELIVERED]: 'delivered',
          [TrackingEvent.OPENED]: 'opened',
          [TrackingEvent.FAILED]: 'failed'
        }
      }
    ];

    this.config.providers = providers;
  }

  async createTracking(data: {
    notificationId: string;
    channel: NotificationChannel;
    recipient: string;
    maxAttempts?: number;
    trackingId?: string;
    externalTrackingUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<DeliveryTracking> {
    const tracking: DeliveryTracking = {
      id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notificationId: data.notificationId,
      channel: data.channel,
      recipient: data.recipient,
      status: DeliveryStatus.PENDING,
      events: [],
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveryAttempts: 0,
      maxAttempts: data.maxAttempts || 3,
      trackingId: data.trackingId,
      externalTrackingUrl: data.externalTrackingUrl
    };

    this.tracking.set(tracking.id, tracking);
    this.updateAnalytics();
    this.emit('trackingCreated', tracking);

    return tracking;
  }

  async updateTrackingStatus(
    trackingId: string,
    status: DeliveryStatus,
    event?: TrackingEvent,
    details?: Record<string, any>,
    providerResponse?: Record<string, any>,
    errorDetails?: ErrorDetail[]
  ): Promise<DeliveryTracking | null> {
    const tracking = this.tracking.get(trackingId);
    if (!tracking) return null;

    tracking.status = status;
    tracking.updatedAt = new Date();

    if (event) {
      const eventRecord: TrackingEventRecord = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event,
        timestamp: new Date(),
        provider: this.getProviderForChannel(tracking.channel),
        details: details || {},
        metadata: {}
      };

      tracking.events.push(eventRecord);
      tracking.lastEventAt = eventRecord.timestamp;

      // Add to event queue for processing
      if (this.config.enableRealTimeTracking) {
        this.eventQueue.push(eventRecord);
      }
    }

    if (providerResponse) {
      tracking.providerResponse = providerResponse;
    }

    if (errorDetails) {
      tracking.errorDetails = [...(tracking.errorDetails || []), ...errorDetails];
    }

    this.tracking.set(trackingId, tracking);
    this.updateAnalytics();
    this.emit('trackingUpdated', tracking);

    return tracking;
  }

  async recordEvent(data: {
    trackingId: string;
    event: TrackingEvent;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
  }): Promise<TrackingEventRecord | null> {
    const tracking = this.tracking.get(data.trackingId);
    if (!tracking) return null;

    const eventRecord: TrackingEventRecord = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: data.event,
      timestamp: new Date(),
      provider: this.getProviderForChannel(tracking.channel),
      details: data.details || {},
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      metadata: {}
    };

    tracking.events.push(eventRecord);
    tracking.lastEventAt = eventRecord.timestamp;
    tracking.updatedAt = new Date();

    // Update tracking status based on event
    this.updateStatusFromEvent(tracking, data.event);

    this.tracking.set(data.trackingId, tracking);
    this.eventQueue.push(eventRecord);
    this.updateAnalytics();
    this.emit('eventRecorded', tracking, eventRecord);

    return eventRecord;
  }

  private updateStatusFromEvent(tracking: DeliveryTracking, event: TrackingEvent): void {
    switch (event) {
      case TrackingEvent.SENT:
        if (tracking.status === DeliveryStatus.PENDING) {
          tracking.status = DeliveryStatus.IN_TRANSIT;
        }
        break;
      case TrackingEvent.DELIVERED:
        tracking.status = DeliveryStatus.DELIVERED;
        break;
      case TrackingEvent.BOUNCED:
        tracking.status = DeliveryStatus.BOUNCED;
        break;
      case TrackingEvent.FAILED:
        tracking.status = DeliveryStatus.FAILED;
        break;
    }
  }

  async processWebhook(channel: NotificationChannel, payload: WebhookPayload): Promise<boolean> {
    const providerConfig = this.config.providers.find(p => p.channel === channel);
    if (!providerConfig || !providerConfig.enabled) {
      return false;
    }

    // Verify webhook signature if configured
    if (payload.signature && !this.verifyWebhookSignature(providerConfig, payload)) {
      return false;
    }

    // Find tracking record
    let tracking: DeliveryTracking | undefined;
    for (const track of this.tracking.values()) {
      if (track.channel === channel && 
          (track.trackingId === payload.notificationId || 
           track.notificationId === payload.notificationId)) {
        tracking = track;
        break;
      }
    }

    if (!tracking) {
      return false;
    }

    // Record the event
    await this.recordEvent({
      trackingId: tracking.id,
      event: payload.event,
      details: payload.details,
      ipAddress: payload.details.ipAddress,
      userAgent: payload.details.userAgent,
      location: payload.details.location
    });

    this.emit('webhookProcessed', channel, payload);
    return true;
  }

  private verifyWebhookSignature(providerConfig: ProviderTrackingConfig, payload: WebhookPayload): boolean {
    // Implement signature verification based on provider
    // This is a simplified implementation
    return true;
  }

  private getProviderForChannel(channel: NotificationChannel): string {
    const provider = this.config.providers.find(p => p.channel === channel && p.enabled);
    return provider?.provider || 'unknown';
  }

  private startEventProcessor(): void {
    setInterval(() => {
      this.processEventQueue();
    }, this.config.batchInterval * 1000);
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessingEvents || this.eventQueue.length === 0) return;

    this.isProcessingEvents = true;

    try {
      const batch = this.eventQueue.splice(0, this.config.batchSize);
      
      // Process events in parallel
      const promises = batch.map(event => this.processEvent(event));
      await Promise.allSettled(promises);

    } finally {
      this.isProcessingEvents = false;
    }
  }

  private async processEvent(event: TrackingEventRecord): Promise<void> {
    // Send webhooks if configured
    if (this.config.enableWebhooks && this.config.webhookEndpoints.length > 0) {
      await this.sendWebhooks(event);
    }

    // Update analytics in real-time
    this.updateEventAnalytics(event);
  }

  private async sendWebhooks(event: TrackingEventRecord): Promise<void> {
    const webhookPromises = this.config.webhookEndpoints.map(async (endpoint) => {
      try {
        // Simulate webhook call
        await new Promise(resolve => setTimeout(resolve, 100));
        this.emit('webhookSent', endpoint, event);
      } catch (error) {
        this.emit('webhookFailed', endpoint, event, error);
      }
    });

    await Promise.allSettled(webhookPromises);
  }

  private updateEventAnalytics(event: TrackingEventRecord): void {
    // Update real-time analytics based on event
    switch (event.event) {
      case TrackingEvent.DELIVERED:
        // Update delivery metrics
        break;
      case TrackingEvent.OPENED:
        // Update open metrics
        break;
      case TrackingEvent.CLICKED:
        // Update click metrics
        break;
      case TrackingEvent.BOUNCED:
      case TrackingEvent.FAILED:
        // Update failure metrics
        break;
    }
  }

  private startAnalyticsUpdater(): void {
    setInterval(() => {
      this.updateAnalytics();
    }, 60000); // Update every minute
  }

  private updateAnalytics(): void {
    const trackingRecords = Array.from(this.tracking.values());

    this.analytics.totalDeliveries = trackingRecords.length;

    this.analytics.deliveriesByChannel = {
      email: trackingRecords.filter(t => t.channel === NotificationChannel.EMAIL).length,
      sms: trackingRecords.filter(t => t.channel === NotificationChannel.SMS).length,
      push: trackingRecords.filter(t => t.channel === NotificationChannel.PUSH).length,
      webhook: trackingRecords.filter(t => t.channel === NotificationChannel.WEBHOOK).length,
      slack: trackingRecords.filter(t => t.channel === NotificationChannel.SLACK).length,
      microsoft_teams: trackingRecords.filter(t => t.channel === NotificationChannel.MICROSOFT_TEAMS).length,
      discord: trackingRecords.filter(t => t.channel === NotificationChannel.DISCORD).length,
      in_app: trackingRecords.filter(t => t.channel === NotificationChannel.IN_APP).length
    };

    this.analytics.deliveriesByStatus = {
      pending: trackingRecords.filter(t => t.status === DeliveryStatus.PENDING).length,
      in_transit: trackingRecords.filter(t => t.status === DeliveryStatus.IN_TRANSIT).length,
      delivered: trackingRecords.filter(t => t.status === DeliveryStatus.DELIVERED).length,
      failed: trackingRecords.filter(t => t.status === DeliveryStatus.FAILED).length,
      bounced: trackingRecords.filter(t => t.status === DeliveryStatus.BOUNCED).length,
      returned: trackingRecords.filter(t => t.status === DeliveryStatus.RETURNED).length
    };

    // Calculate rates
    const totalDelivered = this.analytics.deliveriesByStatus.delivered;
    const totalFailed = this.analytics.deliveriesByStatus.failed + this.analytics.deliveriesByStatus.bounced;
    const totalProcessed = totalDelivered + totalFailed;

    this.analytics.deliveryRate = totalProcessed > 0 ? totalDelivered / totalProcessed : 0;
    this.analytics.failureRate = totalProcessed > 0 ? totalFailed / totalProcessed : 0;

    // Calculate open and click rates
    const totalEvents = trackingRecords.flatMap(t => t.events);
    const openEvents = totalEvents.filter(e => e.event === TrackingEvent.OPENED);
    const clickEvents = totalEvents.filter(e => e.event === TrackingEvent.CLICKED);

    this.analytics.openRate = totalDelivered > 0 ? openEvents.length / totalDelivered : 0;
    this.analytics.clickRate = openEvents.length > 0 ? clickEvents.length / openEvents.length : 0;

    // Calculate average delivery time
    const deliveredTracking = trackingRecords.filter(t => t.status === DeliveryStatus.DELIVERED);
    if (deliveredTracking.length > 0) {
      const totalTime = deliveredTracking.reduce((sum, t) => {
        const sentEvent = t.events.find(e => e.event === TrackingEvent.SENT);
        const deliveredEvent = t.events.find(e => e.event === TrackingEvent.DELIVERED);
        if (sentEvent && deliveredEvent) {
          return sum + (deliveredEvent.timestamp.getTime() - sentEvent.timestamp.getTime());
        }
        return sum;
      }, 0);
      this.analytics.averageDeliveryTime = totalTime / deliveredTracking.length;
    }

    // Performance by channel
    this.analytics.performanceByChannel = Object.values(NotificationChannel).map(channel => {
      const channelTracking = trackingRecords.filter(t => t.channel === channel);
      const channelDelivered = channelTracking.filter(t => t.status === DeliveryStatus.DELIVERED).length;
      const channelTotal = channelTracking.length;
      const channelEvents = channelTracking.flatMap(t => t.events);
      const channelOpens = channelEvents.filter(e => e.event === TrackingEvent.OPENED).length;
      const channelClicks = channelEvents.filter(e => e.event === TrackingEvent.CLICKED).length;

      return {
        channel,
        totalDeliveries: channelTotal,
        successRate: channelTotal > 0 ? channelDelivered / channelTotal : 0,
        averageTime: this.calculateChannelAverageTime(channelTracking),
        openRate: channelDelivered > 0 ? channelOpens / channelDelivered : 0,
        clickRate: channelOpens > 0 ? channelClicks / channelOpens : 0
      };
    });

    // Top failure reasons
    const failureReasons = new Map<string, number>();
    trackingRecords.forEach(t => {
      if (t.errorDetails) {
        t.errorDetails.forEach(error => {
          failureReasons.set(error.message, (failureReasons.get(error.message) || 0) + 1);
        });
      }
    });

    this.analytics.topFailureReasons = Array.from(failureReasons.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: (count / trackingRecords.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateChannelAverageTime(channelTracking: DeliveryTracking[]): number {
    const delivered = channelTracking.filter(t => t.status === DeliveryStatus.DELIVERED);
    if (delivered.length === 0) return 0;

    const totalTime = delivered.reduce((sum, t) => {
      const sentEvent = t.events.find(e => e.event === TrackingEvent.SENT);
      const deliveredEvent = t.events.find(e => e.event === TrackingEvent.DELIVERED);
      if (sentEvent && deliveredEvent) {
        return sum + (deliveredEvent.timestamp.getTime() - sentEvent.timestamp.getTime());
      }
      return sum;
    }, 0);

    return totalTime / delivered.length;
  }

  async getTracking(trackingId: string): Promise<DeliveryTracking | null> {
    return this.tracking.get(trackingId) || null;
  }

  async getTrackingByNotification(notificationId: string): Promise<DeliveryTracking[]> {
    return Array.from(this.tracking.values())
      .filter(t => t.notificationId === notificationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTrackingHistory(filters?: {
    channel?: NotificationChannel;
    status?: DeliveryStatus;
    recipient?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<DeliveryTracking[]> {
    let tracking = Array.from(this.tracking.values());

    if (filters) {
      if (filters.channel) {
        tracking = tracking.filter(t => t.channel === filters.channel);
      }
      if (filters.status) {
        tracking = tracking.filter(t => t.status === filters.status);
      }
      if (filters.recipient) {
        tracking = tracking.filter(t => t.recipient === filters.recipient);
      }
      if (filters.startDate) {
        tracking = tracking.filter(t => t.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        tracking = tracking.filter(t => t.createdAt <= filters.endDate!);
      }
    }

    tracking.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 100;
    
    return tracking.slice(offset, offset + limit);
  }

  async getAnalytics(): Promise<DeliveryAnalytics> {
    this.updateAnalytics();
    return { ...this.analytics };
  }

  async updateConfig(updates: Partial<TrackingConfig>): Promise<TrackingConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<TrackingConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalTracking: number;
    eventQueueSize: number;
    failureRate: number;
    lastUpdated: Date;
  }> {
    this.updateAnalytics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (this.analytics.failureRate > 0.2 || this.eventQueue.length > 100) {
      status = 'critical';
    } else if (this.analytics.failureRate > 0.1 || this.eventQueue.length > 50) {
      status = 'warning';
    }

    return {
      status,
      totalTracking: this.tracking.size,
      eventQueueSize: this.eventQueue.length,
      failureRate: this.analytics.failureRate,
      lastUpdated: new Date()
    };
  }
}
