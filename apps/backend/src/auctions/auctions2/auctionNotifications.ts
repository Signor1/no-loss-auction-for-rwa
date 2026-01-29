import { EventEmitter } from 'events';
import { Auction, AuctionStatus, Bid } from './auctionService';

// Enums
export enum NotificationType {
  AUCTION_STARTED = 'auction_started',
  AUCTION_ENDED = 'auction_ended',
  AUCTION_CANCELLED = 'auction_cancelled',
  BID_PLACED = 'bid_placed',
  BID_OUTBID = 'bid_outbid',
  BID_WINNING = 'bid_winning',
  AUCTION_WON = 'auction_won',
  AUCTION_LOST = 'auction_lost',
  RESERVE_NOT_MET = 'reserve_not_met',
  PAYMENT_REQUIRED = 'payment_required',
  PAYMENT_RECEIVED = 'payment_received',
  AUCTION_REMINDER = 'auction_reminder',
  PRICE_ALERT = 'price_alert',
  WATCHLIST_ALERT = 'watchlist_alert',
  SCHEDULED_AUCTION = 'scheduled_auction',
  AUCTION_EXTENDED = 'auction_extended',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  FEATURE_ANNOUNCEMENT = 'feature_announcement'
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
  BROWSER = 'browser'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked'
}

// Interfaces
export interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  
  // Recipients
  recipientId: string;
  recipientType: 'user' | 'seller' | 'bidder' | 'admin';
  recipientEmail?: string;
  recipientPhone?: string;
  
  // Content
  subject: string;
  message: string;
  htmlContent?: string;
  template?: string;
  templateData?: Record<string, any>;
  
  // Context
  auctionId?: string;
  bidId?: string;
  contextData?: Record<string, any>;
  
  // Delivery
  status: DeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  
  // Metadata
  createdAt: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  
  // Template content
  subject: string;
  message: string;
  htmlContent?: string;
  
  // Template variables
  variables: string[];
  defaultValues: Record<string, any>;
  
  // Settings
  enabled: boolean;
  autoSend: boolean;
  priority: NotificationPriority;
  
  // Localization
  translations: Record<string, {
    subject: string;
    message: string;
    htmlContent?: string;
  }>;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  
  // Channel preferences
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  
  // Type preferences
  enabledTypes: NotificationType[];
  disabledTypes: NotificationType[];
  
  // Frequency controls
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quietHours?: {
    start: string; // HH:MM
    end: string;   // HH:MM
    timezone: string;
  };
  
  // Filtering
  minPriceThreshold?: number;
  maxNotificationsPerDay?: number;
  categories?: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Trigger conditions
  triggers: {
    type: NotificationType;
    conditions: NotificationCondition[];
  }[];
  
  // Actions
  actions: NotificationAction[];
  
  // Targeting
  targetUsers: {
    type: 'all' | 'segment' | 'individual' | 'role';
    value: string | string[];
  };
  
  // Scheduling
  schedule?: {
    enabled: boolean;
    timezone: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  };
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
  description?: string;
}

export interface NotificationAction {
  type: 'send_notification' | 'trigger_webhook' | 'update_database' | 'send_email' | 'send_push';
  parameters: Record<string, any>;
  delay?: number; // in minutes
}

export interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  deliveredNotifications: number;
  failedNotifications: number;
  openRate: number;
  clickRate: number;
  
  // By channel
  statsByChannel: Record<NotificationChannel, {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    openRate: number;
    clickRate: number;
  }>;
  
  // By type
  statsByType: Record<NotificationType, {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
  }>;
  
  // Recent activity
  recentActivity: {
    timestamp: Date;
    type: NotificationType;
    channel: NotificationChannel;
    status: DeliveryStatus;
    recipientId: string;
  }[];
  
  // Performance metrics
  averageDeliveryTime: number;
  failureReasons: Record<string, number>;
}

export interface NotificationConfig {
  defaultChannels: NotificationChannel[];
  maxRetries: number;
  retryDelay: number; // in minutes
  batchSize: number;
  rateLimitPerUser: number; // per hour
  rateLimitPerChannel: Record<NotificationChannel, number>; // per minute
  enableWebhooks: boolean;
  webhookTimeout: number; // in seconds
  enableTemplates: boolean;
  enableRules: boolean;
  retentionPeriod: number; // in days
  enableAnalytics: boolean;
}

// Main Auction Notifications Service
export class AuctionNotificationsService extends EventEmitter {
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreference> = new Map();
  private rules: Map<string, NotificationRule> = new Map();
  private deliveryQueue: Notification[] = [];
  private config: NotificationConfig;
  private isProcessing = false;
  private rateLimitTracker: Map<string, number[]> = new Map();

  constructor(config?: Partial<NotificationConfig>) {
    super();
    this.config = {
      defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      maxRetries: 3,
      retryDelay: 5,
      batchSize: 100,
      rateLimitPerUser: 10,
      rateLimitPerChannel: {
        [NotificationChannel.EMAIL]: 60,
        [NotificationChannel.PUSH]: 100,
        [NotificationChannel.SMS]: 30,
        [NotificationChannel.IN_APP]: 1000,
        [NotificationChannel.WEBHOOK]: 10,
        [NotificationChannel.BROWSER]: 50
      },
      enableWebhooks: true,
      webhookTimeout: 30,
      enableTemplates: true,
      enableRules: true,
      retentionPeriod: 90,
      enableAnalytics: true,
      ...config
    };
  }

  // Notification Management
  async createNotification(
    type: NotificationType,
    recipientId: string,
    recipientType: Notification['recipientType'],
    content: {
      subject: string;
      message: string;
      htmlContent?: string;
    },
    options: {
      channel?: NotificationChannel;
      priority?: NotificationPriority;
      auctionId?: string;
      bidId?: string;
      template?: string;
      templateData?: Record<string, any>;
      scheduledFor?: Date;
      expiresAt?: Date;
    } = {}
  ): Promise<Notification> {
    const notificationId = this.generateId();
    
    // Get user preferences
    const preferences = await this.getUserPreferences(recipientId);
    const channels = await this.determineChannels(type, preferences, options.channel);
    
    // Check if user wants this notification type
    if (!this.shouldSendNotification(type, preferences)) {
      throw new Error('User has disabled this notification type');
    }

    // Check rate limits
    if (!(await this.checkRateLimit(recipientId, channels[0]))) {
      throw new Error('Rate limit exceeded');
    }

    const notification: Notification = {
      id: notificationId,
      type,
      channel: channels[0],
      priority: options.priority || NotificationPriority.NORMAL,
      recipientId,
      recipientType,
      subject: content.subject,
      message: content.message,
      htmlContent: content.htmlContent,
      template: options.template,
      templateData: options.templateData,
      auctionId: options.auctionId,
      bidId: options.bidId,
      status: DeliveryStatus.PENDING,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdAt: new Date(),
      scheduledFor: options.scheduledFor,
      expiresAt: options.expiresAt,
      metadata: {}
    };

    this.notifications.set(notificationId, notification);

    // Add to delivery queue
    if (!options.scheduledFor || options.scheduledFor <= new Date()) {
      this.deliveryQueue.push(notification);
      this.processDeliveryQueue();
    } else {
      this.scheduleNotification(notification);
    }

    this.emit('notificationCreated', notification);
    return notification;
  }

  async getNotification(notificationId: string): Promise<Notification | null> {
    return this.notifications.get(notificationId) || null;
  }

  async getUserNotifications(
    userId: string,
    filters: {
      type?: NotificationType;
      channel?: NotificationChannel;
      status?: DeliveryStatus;
      dateRange?: { start: Date; end: Date };
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.recipientId === userId);

    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }

    if (filters.channel) {
      notifications = notifications.filter(n => n.channel === filters.channel);
    }

    if (filters.status) {
      notifications = notifications.filter(n => n.status === filters.status);
    }

    if (filters.dateRange) {
      notifications = notifications.filter(n => 
        n.createdAt >= filters.dateRange!.start && 
        n.createdAt <= filters.dateRange!.end
      );
    }

    return notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));
  }

  // Template Management
  async createTemplate(
    templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      ...templateData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(template.id, template);
    this.emit('templateCreated', template);
    return template;
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getTemplatesByType(type: NotificationType): Promise<NotificationTemplate[]> {
    return Array.from(this.templates.values())
      .filter(template => template.type === type && template.enabled);
  }

  // Preference Management
  async setUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const existing = this.preferences.get(userId) || {
      id: this.generateId(),
      userId,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      enabledTypes: [],
      disabledTypes: [],
      frequency: 'immediate',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedPreferences: NotificationPreference = {
      ...existing,
      ...preferences,
      updatedAt: new Date()
    };

    this.preferences.set(userId, updatedPreferences);
    this.emit('preferencesUpdated', updatedPreferences);
    return updatedPreferences;
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    return this.preferences.get(userId) || {
      id: this.generateId(),
      userId,
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      enabledTypes: [],
      disabledTypes: [],
      frequency: 'immediate',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Rule Management
  async createRule(
    ruleData: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NotificationRule> {
    const rule: NotificationRule = {
      ...ruleData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.set(rule.id, rule);
    this.emit('ruleCreated', rule);
    return rule;
  }

  async evaluateRules(context: {
    auction?: Auction;
    bid?: Bid;
    eventType: NotificationType;
    userId?: string;
  }): Promise<void> {
    if (!this.config.enableRules) return;

    const rules = Array.from(this.rules.values())
      .filter(rule => rule.enabled && this.matchesRule(rule, context));

    for (const rule of rules) {
      await this.executeRuleActions(rule, context);
    }
  }

  // Event Handlers
  async onAuctionStarted(auction: Auction): Promise<void> {
    await this.evaluateRules({
      auction,
      eventType: NotificationType.AUCTION_STARTED
    });

    // Notify bidders on watchlist
    const watchlistUsers = await this.getWatchlistUsers(auction.id);
    for (const userId of watchlistUsers) {
      await this.createNotification(
        NotificationType.AUCTION_STARTED,
        userId,
        'user',
        {
          subject: `Auction Started: ${auction.title}`,
          message: `The auction "${auction.title}" has started. Current price: ${auction.currentPrice}`,
          template: 'auction_started'
        },
        {
          auctionId: auction.id,
          templateData: {
            auctionTitle: auction.title,
            currentPrice: auction.currentPrice,
            endTime: auction.endTime
          }
        }
      );
    }
  }

  async onAuctionEnded(auction: Auction): Promise<void> {
    await this.evaluateRules({
      auction,
      eventType: NotificationType.AUCTION_ENDED
    });

    // Notify winner
    if (auction.winnerId) {
      await this.createNotification(
        NotificationType.AUCTION_WON,
        auction.winnerId,
        'user',
        {
          subject: `Congratulations! You won the auction: ${auction.title}`,
          message: `You have won the auction "${auction.title}" with a bid of ${auction.currentPrice}`,
          template: 'auction_won'
        },
        {
          auctionId: auction.id,
          priority: NotificationPriority.HIGH,
          templateData: {
            auctionTitle: auction.title,
            winningBid: auction.currentPrice
          }
        }
      );
    }

    // Notify other bidders
    const bidders = await this.getAuctionBidders(auction.id);
    for (const bidderId of bidders) {
      if (bidderId !== auction.winnerId) {
        await this.createNotification(
          NotificationType.AUCTION_LOST,
          bidderId,
          'user',
          {
            subject: `Auction Ended: ${auction.title}`,
            message: `The auction "${auction.title}" has ended. You were not the winner.`,
            template: 'auction_lost'
          },
          {
            auctionId: auction.id,
            templateData: {
              auctionTitle: auction.title,
              finalPrice: auction.currentPrice
            }
          }
        );
      }
    }
  }

  async onBidPlaced(bid: Bid, auction: Auction): Promise<void> {
    await this.evaluateRules({
      bid,
      auction,
      eventType: NotificationType.BID_PLACED
    });

    // Notify outbid user
    if (auction.currentBid && auction.currentBid.bidderId !== bid.bidderId) {
      await this.createNotification(
        NotificationType.BID_OUTBID,
        auction.currentBid.bidderId,
        'user',
        {
          subject: `You've been outbid: ${auction.title}`,
          message: `You have been outbid in the auction "${auction.title}". New high bid: ${bid.amount}`,
          template: 'bid_outbid'
        },
        {
          auctionId: auction.id,
          bidId: bid.id,
          priority: NotificationPriority.HIGH,
          templateData: {
            auctionTitle: auction.title,
            newBid: bid.amount,
            yourBid: auction.currentBid.amount
          }
        }
      );
    }

    // Notify seller
    await this.createNotification(
      NotificationType.BID_PLACED,
      auction.sellerId,
      'seller',
      {
        subject: `New bid placed: ${auction.title}`,
        message: `A new bid of ${bid.amount} has been placed on your auction "${auction.title}"`,
        template: 'bid_placed_seller'
      },
      {
        auctionId: auction.id,
        bidId: bid.id,
        recipientType: 'seller',
        templateData: {
          auctionTitle: auction.title,
          bidAmount: bid.amount,
          bidderId: bid.bidderId
        }
      }
    );
  }

  // Delivery Processing
  private async processDeliveryQueue(): Promise<void> {
    if (this.isProcessing || this.deliveryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.deliveryQueue.splice(0, this.config.batchSize);

    try {
      for (const notification of batch) {
        await this.deliverNotification(notification);
      }
    } catch (error) {
      this.emit('deliveryError', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    try {
      notification.status = DeliveryStatus.SENT;
      notification.sentAt = new Date();

      // Send based on channel
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationChannel.PUSH:
          await this.sendPush(notification);
          break;
        case NotificationChannel.SMS:
          await this.sendSMS(notification);
          break;
        case NotificationChannel.IN_APP:
          await this.sendInApp(notification);
          break;
        case NotificationChannel.WEBHOOK:
          await this.sendWebhook(notification);
          break;
        case NotificationChannel.BROWSER:
          await this.sendBrowser(notification);
          break;
      }

      notification.status = DeliveryStatus.DELIVERED;
      notification.deliveredAt = new Date();

    } catch (error) {
      notification.status = DeliveryStatus.FAILED;
      notification.failureReason = error instanceof Error ? error.message : 'Unknown error';
      notification.retryCount++;

      // Schedule retry if needed
      if (notification.retryCount < notification.maxRetries) {
        setTimeout(() => {
          this.deliveryQueue.push(notification);
          this.processDeliveryQueue();
        }, this.config.retryDelay * 60 * 1000);
      }
    }
  }

  // Channel Delivery Methods (placeholders)
  private async sendEmail(notification: Notification): Promise<void> {
    // Placeholder for email sending
    this.emit('emailSent', notification);
  }

  private async sendPush(notification: Notification): Promise<void> {
    // Placeholder for push notification
    this.emit('pushSent', notification);
  }

  private async sendSMS(notification: Notification): Promise<void> {
    // Placeholder for SMS sending
    this.emit('smsSent', notification);
  }

  private async sendInApp(notification: Notification): Promise<void> {
    // Placeholder for in-app notification
    this.emit('inAppSent', notification);
  }

  private async sendWebhook(notification: Notification): Promise<void> {
    // Placeholder for webhook call
    this.emit('webhookSent', notification);
  }

  private async sendBrowser(notification: Notification): Promise<void> {
    // Placeholder for browser notification
    this.emit('browserSent', notification);
  }

  // Utility Methods
  private async determineChannels(
    type: NotificationType,
    preferences: NotificationPreference,
    preferredChannel?: NotificationChannel
  ): Promise<NotificationChannel[]> {
    if (preferredChannel) {
      return [preferredChannel];
    }

    const channels: NotificationChannel[] = [];

    if (preferences.emailEnabled && this.config.defaultChannels.includes(NotificationChannel.EMAIL)) {
      channels.push(NotificationChannel.EMAIL);
    }

    if (preferences.pushEnabled && this.config.defaultChannels.includes(NotificationChannel.PUSH)) {
      channels.push(NotificationChannel.PUSH);
    }

    if (preferences.smsEnabled && this.config.defaultChannels.includes(NotificationChannel.SMS)) {
      channels.push(NotificationChannel.SMS);
    }

    if (preferences.inAppEnabled && this.config.defaultChannels.includes(NotificationChannel.IN_APP)) {
      channels.push(NotificationChannel.IN_APP);
    }

    return channels.length > 0 ? channels : this.config.defaultChannels;
  }

  private shouldSendNotification(type: NotificationType, preferences: NotificationPreference): boolean {
    if (preferences.disabledTypes.includes(type)) {
      return false;
    }

    if (preferences.enabledTypes.length > 0 && !preferences.enabledTypes.includes(type)) {
      return false;
    }

    return true;
  }

  private async checkRateLimit(userId: string, channel: NotificationChannel): Promise<boolean> {
    const now = Date.now();
    const userKey = `${userId}_${channel}`;
    const timestamps = this.rateLimitTracker.get(userKey) || [];

    // Remove old timestamps (outside the rate limit window)
    const recentTimestamps = timestamps.filter(timestamp => 
      now - timestamp < 60 * 1000 // 1 minute window
    );

    const rateLimit = this.config.rateLimitPerChannel[channel] || 100;
    if (recentTimestamps.length >= rateLimit) {
      return false;
    }

    recentTimestamps.push(now);
    this.rateLimitTracker.set(userKey, recentTimestamps);
    return true;
  }

  private matchesRule(rule: NotificationRule, context: any): boolean {
    return rule.triggers.some(trigger => 
      trigger.type === context.eventType && 
      this.evaluateConditions(trigger.conditions, context)
    );
  }

  private evaluateConditions(conditions: NotificationCondition[], context: any): boolean {
    return conditions.every(condition => {
      const value = this.getNestedValue(context, condition.field);
      return this.compareValues(value, condition.operator, condition.value);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      case 'between':
        return Array.isArray(expected) && actual >= expected[0] && actual <= expected[1];
      default:
        return false;
    }
  }

  private async executeRuleActions(rule: NotificationRule, context: any): Promise<void> {
    for (const action of rule.actions) {
      if (action.delay) {
        setTimeout(() => this.executeAction(action, context), action.delay * 60 * 1000);
      } else {
        await this.executeAction(action, context);
      }
    }
  }

  private async executeAction(action: NotificationAction, context: any): Promise<void> {
    switch (action.type) {
      case 'send_notification':
        // Extract parameters and create notification
        break;
      case 'trigger_webhook':
        // Call webhook
        break;
      case 'update_database':
        // Update database
        break;
      default:
        break;
    }
  }

  private scheduleNotification(notification: Notification): void {
    const delay = notification.scheduledFor!.getTime() - Date.now();
    if (delay <= 0) return;

    setTimeout(() => {
      this.deliveryQueue.push(notification);
      this.processDeliveryQueue();
    }, delay);
  }

  // Placeholder methods for data retrieval
  private async getWatchlistUsers(auctionId: string): Promise<string[]> {
    // Placeholder - would fetch from watchlist service
    return [];
  }

  private async getAuctionBidders(auctionId: string): Promise<string[]> {
    // Placeholder - would fetch from auction service
    return [];
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Statistics and Analytics
  async getNotificationStats(): Promise<NotificationStats> {
    const notifications = Array.from(this.notifications.values());
    
    const totalNotifications = notifications.length;
    const sentNotifications = notifications.filter(n => n.status === DeliveryStatus.SENT).length;
    const deliveredNotifications = notifications.filter(n => n.status === DeliveryStatus.DELIVERED).length;
    const failedNotifications = notifications.filter(n => n.status === DeliveryStatus.FAILED).length;
    const openedNotifications = notifications.filter(n => n.status === DeliveryStatus.OPENED).length;
    const clickedNotifications = notifications.filter(n => n.status === DeliveryStatus.CLICKED).length;
    
    const openRate = deliveredNotifications > 0 ? openedNotifications / deliveredNotifications : 0;
    const clickRate = openedNotifications > 0 ? clickedNotifications / openedNotifications : 0;

    // Stats by channel
    const statsByChannel: NotificationStats['statsByChannel'] = {};
    for (const channel of Object.values(NotificationChannel)) {
      const channelNotifications = notifications.filter(n => n.channel === channel);
      statsByChannel[channel] = {
        total: channelNotifications.length,
        sent: channelNotifications.filter(n => n.status === DeliveryStatus.SENT).length,
        delivered: channelNotifications.filter(n => n.status === DeliveryStatus.DELIVERED).length,
        failed: channelNotifications.filter(n => n.status === DeliveryStatus.FAILED).length,
        openRate: 0,
        clickRate: 0
      };
    }

    // Stats by type
    const statsByType: NotificationStats['statsByType'] = {};
    for (const type of Object.values(NotificationType)) {
      const typeNotifications = notifications.filter(n => n.type === type);
      statsByType[type] = {
        total: typeNotifications.length,
        sent: typeNotifications.filter(n => n.status === DeliveryStatus.SENT).length,
        delivered: typeNotifications.filter(n => n.status === DeliveryStatus.DELIVERED).length,
        failed: typeNotifications.filter(n => n.status === DeliveryStatus.FAILED).length
      };
    }

    // Recent activity
    const recentActivity = notifications
      .slice(-100)
      .map(n => ({
        timestamp: n.createdAt,
        type: n.type,
        channel: n.channel,
        status: n.status,
        recipientId: n.recipientId
      }));

    // Performance metrics
    const averageDeliveryTime = this.calculateAverageDeliveryTime(notifications);
    const failureReasons = this.calculateFailureReasons(notifications);

    return {
      totalNotifications,
      sentNotifications,
      deliveredNotifications,
      failedNotifications,
      openRate,
      clickRate,
      statsByChannel,
      statsByType,
      recentActivity,
      averageDeliveryTime,
      failureReasons
    };
  }

  private calculateAverageDeliveryTime(notifications: Notification[]): number {
    const deliveredNotifications = notifications.filter(n => n.sentAt && n.deliveredAt);
    if (deliveredNotifications.length === 0) return 0;

    const totalTime = deliveredNotifications.reduce((sum, n) => 
      sum + (n.deliveredAt!.getTime() - n.sentAt!.getTime()), 0
    );

    return totalTime / deliveredNotifications.length;
  }

  private calculateFailureReasons(notifications: Notification[]): Record<string, number> {
    const reasons: Record<string, number> = {};
    
    for (const notification of notifications) {
      if (notification.status === DeliveryStatus.FAILED && notification.failureReason) {
        reasons[notification.failureReason] = (reasons[notification.failureReason] || 0) + 1;
      }
    }

    return reasons;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Process any pending notifications
    this.processDeliveryQueue();
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.isProcessing = false;
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = await this.getNotificationStats();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (stats.failedNotifications / stats.totalNotifications > 0.2) {
      status = 'unhealthy';
    } else if (stats.failedNotifications / stats.totalNotifications > 0.1) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalNotifications: stats.totalNotifications,
        deliveryRate: Math.round((stats.deliveredNotifications / stats.totalNotifications) * 100),
        queueLength: this.deliveryQueue.length,
        isProcessing: this.isProcessing,
        averageDeliveryTime: Math.round(stats.averageDeliveryTime)
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        notifications: Array.from(this.notifications.values()),
        templates: Array.from(this.templates.values()),
        preferences: Array.from(this.preferences.values()),
        rules: Array.from(this.rules.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for notifications
      const headers = [
        'ID', 'Type', 'Channel', 'Priority', 'Recipient ID', 'Subject',
        'Status', 'Created At', 'Sent At', 'Delivered At'
      ];
      
      const rows = Array.from(this.notifications.values()).map(n => [
        n.id,
        n.type,
        n.channel,
        n.priority,
        n.recipientId,
        n.subject,
        n.status,
        n.createdAt.toISOString(),
        n.sentAt?.toISOString() || '',
        n.deliveredAt?.toISOString() || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
