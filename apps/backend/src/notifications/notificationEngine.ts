import { EventEmitter } from 'events';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  MICROSOFT_TEAMS = 'microsoft_teams',
  DISCORD = 'discord',
  IN_APP = 'in_app'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationType {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  ALERT = 'alert',
  REMINDER = 'reminder',
  VERIFICATION = 'verification',
  SYSTEM = 'system'
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  attachments?: NotificationAttachment[];
  metadata: Record<string, any>;
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  expiresAt?: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  correlationId?: string;
  campaignId?: string;
  userId?: string;
  tenantId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  contentType: string;
  filename: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  channel: NotificationChannel;
  type: NotificationType;
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: TemplateVariable[];
  isActive: boolean;
  version: number;
  locale: string;
  category: string;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  tags: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
}

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: NotificationType;
  enabled: boolean;
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  maxPerDay?: number;
  maxPerWeek?: number;
  maxPerMonth?: number;
  customRules: PreferenceRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferenceRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'allow' | 'block' | 'delay';
  delayMinutes?: number;
}

export interface DeliveryReport {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  error?: string;
  providerResponse?: Record<string, any>;
  metadata: Record<string, any>;
}

export interface NotificationSchedule {
  id: string;
  name: string;
  description: string;
  templateId: string;
  channel: NotificationChannel;
  recipients: string[];
  schedule: ScheduleConfig;
  isActive: boolean;
  nextRun?: Date;
  lastRun?: Date;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface ScheduleConfig {
  type: 'once' | 'recurring';
  startDate: Date;
  endDate?: Date;
  timezone: string;
  recurring?: {
    frequency: 'minute' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    monthOfYear?: number;
  };
}

export interface NotificationMetrics {
  totalNotifications: number;
  notificationsByChannel: Record<NotificationChannel, number>;
  notificationsByStatus: Record<NotificationStatus, number>;
  notificationsByType: Record<NotificationType, number>;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  averageDeliveryTime: number;
  notificationsToday: number;
  notificationsThisWeek: number;
  notificationsThisMonth: number;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
    successRate: number;
  }>;
  failedNotifications: Array<{
    notificationId: string;
    channel: NotificationChannel;
    error: string;
    timestamp: Date;
  }>;
  performanceTrend: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    deliveryTime: number;
  }>;
}

export interface NotificationConfig {
  defaultChannel: NotificationChannel;
  maxRetries: number;
  retryDelay: number; // milliseconds
  enableQuietHours: boolean;
  quietHoursTimezone: string;
  enableRateLimiting: boolean;
  rateLimitPerSecond: number;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  enableDeduplication: boolean;
  deduplicationWindow: number; // minutes
  enableTracking: boolean;
  trackingExpiration: number; // days
  enableTemplates: boolean;
  templateCacheTimeout: number; // minutes
  enableScheduling: boolean;
  scheduleCheckInterval: number; // seconds
  providers: ProviderConfig[];
}

export interface ProviderConfig {
  channel: NotificationChannel;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  priority: number;
  rateLimit?: {
    perSecond?: number;
    perMinute?: number;
    perHour?: number;
  };
}

export class NotificationEngine extends EventEmitter {
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreference> = new Map();
  private schedules: Map<string, NotificationSchedule> = new Map();
  private deliveryReports: Map<string, DeliveryReport> = new Map();
  private config: NotificationConfig;
  private metrics: NotificationMetrics;
  private sendQueue: Array<{ notificationId: string; priority: number }> = [];
  private isProcessing = false;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultTemplates();
    this.initializeDefaultProviders();
    this.startQueueProcessor();
    this.startScheduleProcessor();
    this.startMetricsUpdater();
  }

  private initializeDefaultConfig(): NotificationConfig {
    return {
      defaultChannel: NotificationChannel.EMAIL,
      maxRetries: 3,
      retryDelay: 5000,
      enableQuietHours: true,
      quietHoursTimezone: 'UTC',
      enableRateLimiting: true,
      rateLimitPerSecond: 10,
      rateLimitPerMinute: 100,
      rateLimitPerHour: 1000,
      enableDeduplication: true,
      deduplicationWindow: 15,
      enableTracking: true,
      trackingExpiration: 90,
      enableTemplates: true,
      templateCacheTimeout: 60,
      enableScheduling: true,
      scheduleCheckInterval: 60,
      providers: []
    };
  }

  private initializeMetrics(): NotificationMetrics {
    return {
      totalNotifications: 0,
      notificationsByChannel: {
        email: 0,
        sms: 0,
        push: 0,
        webhook: 0,
        slack: 0,
        microsoft_teams: 0,
        discord: 0,
        in_app: 0
      },
      notificationsByStatus: {
        pending: 0,
        sending: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        cancelled: 0,
        bounced: 0,
        opened: 0,
        clicked: 0
      },
      notificationsByType: {
        transactional: 0,
        marketing: 0,
        alert: 0,
        reminder: 0,
        verification: 0,
        system: 0
      },
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      averageDeliveryTime: 0,
      notificationsToday: 0,
      notificationsThisWeek: 0,
      notificationsThisMonth: 0,
      topTemplates: [],
      failedNotifications: [],
      performanceTrend: []
    };
  }

  private initializeDefaultTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'template_welcome_email',
        name: 'Welcome Email',
        description: 'Welcome email for new users',
        channel: NotificationChannel.EMAIL,
        type: NotificationType.TRANSACTIONAL,
        subject: 'Welcome to {{companyName}}!',
        content: `
          Dear {{userName}},

          Welcome to {{companyName}}! We're excited to have you on board.

          Your account has been successfully created with the email: {{userEmail}}

          To get started, please click the link below:
          {{verificationLink}}

          If you have any questions, feel free to contact our support team.

          Best regards,
          The {{companyName}} Team
        `,
        htmlContent: `
          <h2>Welcome to {{companyName}}!</h2>
          <p>Dear {{userName}},</p>
          <p>Welcome to {{companyName}}! We're excited to have you on board.</p>
          <p>Your account has been successfully created with the email: <strong>{{userEmail}}</strong></p>
          <p><a href="{{verificationLink}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The {{companyName}} Team</p>
        `,
        variables: [
          { name: 'userName', type: 'string', description: 'User name', required: true },
          { name: 'userEmail', type: 'string', description: 'User email', required: true },
          { name: 'companyName', type: 'string', description: 'Company name', required: true },
          { name: 'verificationLink', type: 'string', description: 'Verification link', required: true }
        ],
        isActive: true,
        version: 1,
        locale: 'en',
        category: 'onboarding',
        createdBy: 'system',
        createdAt: new Date(),
        tags: ['welcome', 'onboarding', 'transactional']
      },
      {
        id: 'template_alert_sms',
        name: 'Security Alert SMS',
        description: 'Security alert for suspicious activity',
        channel: NotificationChannel.SMS,
        type: NotificationType.ALERT,
        content: '{{companyName}}: Security alert - {{alertType}} detected on your account. If this wasn\'t you, please contact support immediately.',
        variables: [
          { name: 'companyName', type: 'string', description: 'Company name', required: true },
          { name: 'alertType', type: 'string', description: 'Type of alert', required: true }
        ],
        isActive: true,
        version: 1,
        locale: 'en',
        category: 'security',
        createdBy: 'system',
        createdAt: new Date(),
        tags: ['security', 'alert', 'sms']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeDefaultProviders(): void {
    const providers: ProviderConfig[] = [
      {
        channel: NotificationChannel.EMAIL,
        name: 'sendgrid',
        config: {
          apiKey: process.env.SENDGRID_API_KEY || '',
          fromEmail: 'noreply@company.com',
          fromName: 'Company Name'
        },
        isActive: true,
        priority: 1,
        rateLimit: {
          perSecond: 5,
          perMinute: 100,
          perHour: 1000
        }
      },
      {
        channel: NotificationChannel.SMS,
        name: 'twilio',
        config: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: process.env.TWILIO_FROM_NUMBER || ''
        },
        isActive: true,
        priority: 1,
        rateLimit: {
          perSecond: 1,
          perMinute: 10,
          perHour: 100
        }
      },
      {
        channel: NotificationChannel.PUSH,
        name: 'fcm',
        config: {
          serverKey: process.env.FCM_SERVER_KEY || ''
        },
        isActive: true,
        priority: 1,
        rateLimit: {
          perSecond: 10,
          perMinute: 100,
          perHour: 1000
        }
      }
    ];

    this.config.providers = providers;
  }

  async sendNotification(data: {
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    content: string;
    htmlContent?: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    templateId?: string;
    templateVariables?: Record<string, any>;
    scheduledAt?: Date;
    expiresAt?: Date;
    userId?: string;
    tenantId?: string;
    correlationId?: string;
    campaignId?: string;
    attachments?: Omit<NotificationAttachment, 'id'>[];
    metadata?: Record<string, any>;
    tags?: string[];
  }): Promise<Notification> {
    // Check user preferences
    if (data.userId) {
      const preference = await this.getUserPreference(data.userId, data.channel, data.type || NotificationType.TRANSACTIONAL);
      if (preference && !preference.enabled) {
        throw new Error(`User has disabled ${data.channel} notifications`);
      }
    }

    // Process template if provided
    let subject = data.subject;
    let content = data.content;
    let htmlContent = data.htmlContent;

    if (data.templateId) {
      const template = this.templates.get(data.templateId);
      if (!template) {
        throw new Error(`Template ${data.templateId} not found`);
      }

      const processed = await this.processTemplate(template, data.templateVariables || {});
      subject = processed.subject || subject;
      content = processed.content;
      htmlContent = processed.htmlContent;
    }

    // Check for deduplication
    if (this.config.enableDeduplication) {
      const duplicate = this.findDuplicateNotification(data.channel, data.recipient, content);
      if (duplicate) {
        return duplicate;
      }
    }

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || NotificationType.TRANSACTIONAL,
      priority: data.priority || NotificationPriority.NORMAL,
      status: data.scheduledAt && data.scheduledAt > new Date() ? NotificationStatus.PENDING : NotificationStatus.SENDING,
      channel: data.channel,
      recipient: data.recipient,
      subject,
      content,
      htmlContent,
      attachments: data.attachments?.map((att, index) => ({
        ...att,
        id: `att_${Date.now()}_${index}`
      })) || [],
      metadata: data.metadata || {},
      templateId: data.templateId,
      templateVariables: data.templateVariables,
      scheduledAt: data.scheduledAt,
      expiresAt: data.expiresAt,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      correlationId: data.correlationId,
      campaignId: data.campaignId,
      userId: data.userId,
      tenantId: data.tenantId,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notifications.set(notification.id, notification);
    this.updateMetrics();

    if (notification.status === NotificationStatus.SENDING) {
      this.sendQueue.push({
        notificationId: notification.id,
        priority: this.getPriorityValue(notification.priority)
      });
    }

    this.emit('notificationCreated', notification);
    return notification;
  }

  private async processTemplate(template: NotificationTemplate, variables: Record<string, any>): Promise<{
    subject?: string;
    content: string;
    htmlContent?: string;
  }> {
    const processedVariables = { ...variables };

    // Apply default values for missing variables
    template.variables.forEach(variable => {
      if (variable.required && !(variable.name in processedVariables)) {
        throw new Error(`Required template variable '${variable.name}' is missing`);
      }
      if (!(variable.name in processedVariables) && variable.defaultValue !== undefined) {
        processedVariables[variable.name] = variable.defaultValue;
      }
    });

    // Simple template variable replacement
    const replaceVariables = (text: string): string => {
      if (!text) return text;
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return processedVariables[key] !== undefined ? String(processedVariables[key]) : match;
      });
    };

    return {
      subject: template.subject ? replaceVariables(template.subject) : undefined,
      content: replaceVariables(template.content),
      htmlContent: template.htmlContent ? replaceVariables(template.htmlContent) : undefined
    };
  }

  private findDuplicateNotification(channel: NotificationChannel, recipient: string, content: string): Notification | null {
    const windowStart = new Date(Date.now() - this.config.deduplicationWindow * 60 * 1000);
    
    for (const notification of this.notifications.values()) {
      if (
        notification.channel === channel &&
        notification.recipient === recipient &&
        notification.content === content &&
        notification.createdAt >= windowStart &&
        notification.status !== NotificationStatus.FAILED
      ) {
        return notification;
      }
    }
    
    return null;
  }

  private getPriorityValue(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT: return 4;
      case NotificationPriority.HIGH: return 3;
      case NotificationPriority.NORMAL: return 2;
      case NotificationPriority.LOW: return 1;
      default: return 2;
    }
  }

  private async processNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    try {
      notification.status = NotificationStatus.SENDING;
      notification.sentAt = new Date();

      const provider = this.getProvider(notification.channel);
      if (!provider) {
        throw new Error(`No provider found for channel ${notification.channel}`);
      }

      // Check rate limits
      if (this.config.enableRateLimiting && !this.checkRateLimit(provider)) {
        throw new Error('Rate limit exceeded');
      }

      // Send notification
      const result = await this.sendViaProvider(notification, provider);

      if (result.success) {
        notification.status = NotificationStatus.SENT;
        notification.deliveredAt = new Date();

        const deliveryReport: DeliveryReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          notificationId: notification.id,
          channel: notification.channel,
          status: NotificationStatus.DELIVERED,
          sentAt: notification.sentAt,
          deliveredAt: notification.deliveredAt,
          providerResponse: result.response,
          metadata: {}
        };

        this.deliveryReports.set(deliveryReport.id, deliveryReport);
        this.emit('notificationDelivered', notification, deliveryReport);

      } else {
        throw new Error(result.error || 'Failed to send notification');
      }

    } catch (error) {
      notification.retryCount++;
      
      if (notification.retryCount < notification.maxRetries) {
        notification.status = NotificationStatus.PENDING;
        notification.nextRetryAt = new Date(Date.now() + this.config.retryDelay);
        
        // Schedule retry
        setTimeout(() => {
          this.sendQueue.push({
            notificationId: notification.id,
            priority: this.getPriorityValue(notification.priority)
          });
        }, this.config.retryDelay);

      } else {
        notification.status = NotificationStatus.FAILED;
        
        const deliveryReport: DeliveryReport = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          notificationId: notification.id,
          channel: notification.channel,
          status: NotificationStatus.FAILED,
          sentAt: notification.sentAt || new Date(),
          error: error instanceof Error ? error.message : String(error),
          metadata: {}
        };

        this.deliveryReports.set(deliveryReport.id, deliveryReport);
        this.emit('notificationFailed', notification, deliveryReport);
      }
    }

    notification.updatedAt = new Date();
    this.updateMetrics();
  }

  private getProvider(channel: NotificationChannel): ProviderConfig | null {
    const providers = this.config.providers
      .filter(p => p.channel === channel && p.isActive)
      .sort((a, b) => a.priority - b.priority);
    
    return providers.length > 0 ? providers[0] : null;
  }

  private checkRateLimit(provider: ProviderConfig): boolean {
    // Simplified rate limiting check
    // In a real implementation, this would track actual usage per time window
    return true;
  }

  private async sendViaProvider(notification: Notification, provider: ProviderConfig): Promise<{
    success: boolean;
    response?: Record<string, any>;
    error?: string;
  }> {
    // Simulate provider-specific sending logic
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success/failure based on random chance
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        response: {
          messageId: `msg_${Date.now()}`,
          provider: provider.name,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: 'Provider error: Temporary failure'
      };
    }
  }

  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.sendQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Sort by priority
      this.sendQueue.sort((a, b) => b.priority - a.priority);

      const batch = this.sendQueue.splice(0, 10); // Process 10 at a time
      const promises = batch.map(item => this.processNotification(item.notificationId));

      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
    }
  }

  private startScheduleProcessor(): void {
    setInterval(() => {
      this.processScheduledNotifications();
    }, this.config.scheduleCheckInterval * 1000);
  }

  private async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    
    for (const notification of this.notifications.values()) {
      if (
        notification.status === NotificationStatus.PENDING &&
        notification.scheduledAt &&
        notification.scheduledAt <= now
      ) {
        notification.status = NotificationStatus.SENDING;
        this.sendQueue.push({
          notificationId: notification.id,
          priority: this.getPriorityValue(notification.priority)
        });
      }
    }
  }

  private startMetricsUpdater(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  private updateMetrics(): void {
    const notifications = Array.from(this.notifications.values());

    this.metrics.totalNotifications = notifications.length;

    this.metrics.notificationsByChannel = {
      email: notifications.filter(n => n.channel === NotificationChannel.EMAIL).length,
      sms: notifications.filter(n => n.channel === NotificationChannel.SMS).length,
      push: notifications.filter(n => n.channel === NotificationChannel.PUSH).length,
      webhook: notifications.filter(n => n.channel === NotificationChannel.WEBHOOK).length,
      slack: notifications.filter(n => n.channel === NotificationChannel.SLACK).length,
      microsoft_teams: notifications.filter(n => n.channel === NotificationChannel.MICROSOFT_TEAMS).length,
      discord: notifications.filter(n => n.channel === NotificationChannel.DISCORD).length,
      in_app: notifications.filter(n => n.channel === NotificationChannel.IN_APP).length
    };

    this.metrics.notificationsByStatus = {
      pending: notifications.filter(n => n.status === NotificationStatus.PENDING).length,
      sending: notifications.filter(n => n.status === NotificationStatus.SENDING).length,
      sent: notifications.filter(n => n.status === NotificationStatus.SENT).length,
      delivered: notifications.filter(n => n.status === NotificationStatus.DELIVERED).length,
      failed: notifications.filter(n => n.status === NotificationStatus.FAILED).length,
      cancelled: notifications.filter(n => n.status === NotificationStatus.CANCELLED).length,
      bounced: notifications.filter(n => n.status === NotificationStatus.BOUNCED).length,
      opened: notifications.filter(n => n.status === NotificationStatus.OPENED).length,
      clicked: notifications.filter(n => n.status === NotificationStatus.CLICKED).length
    };

    this.metrics.notificationsByType = {
      transactional: notifications.filter(n => n.type === NotificationType.TRANSACTIONAL).length,
      marketing: notifications.filter(n => n.type === NotificationType.MARKETING).length,
      alert: notifications.filter(n => n.type === NotificationType.ALERT).length,
      reminder: notifications.filter(n => n.type === NotificationType.REMINDER).length,
      verification: notifications.filter(n => n.type === NotificationType.VERIFICATION).length,
      system: notifications.filter(n => n.type === NotificationType.SYSTEM).length
    };

    // Calculate rates
    const totalSent = notifications.filter(n => n.status === NotificationStatus.SENT || n.status === NotificationStatus.DELIVERED).length;
    const totalDelivered = notifications.filter(n => n.status === NotificationStatus.DELIVERED).length;
    const totalOpened = notifications.filter(n => n.status === NotificationStatus.OPENED).length;
    const totalClicked = notifications.filter(n => n.status === NotificationStatus.CLICKED).length;
    const totalBounced = notifications.filter(n => n.status === NotificationStatus.BOUNCED).length;

    this.metrics.deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
    this.metrics.openRate = totalDelivered > 0 ? totalOpened / totalDelivered : 0;
    this.metrics.clickRate = totalOpened > 0 ? totalClicked / totalOpened : 0;
    this.metrics.bounceRate = totalSent > 0 ? totalBounced / totalSent : 0;

    // Time-based metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    this.metrics.notificationsToday = notifications.filter(n => n.createdAt >= today).length;
    this.metrics.notificationsThisWeek = notifications.filter(n => n.createdAt >= weekAgo).length;
    this.metrics.notificationsThisMonth = notifications.filter(n => n.createdAt >= monthAgo).length;

    // Average delivery time
    const deliveredNotifications = notifications.filter(n => n.sentAt && n.deliveredAt);
    if (deliveredNotifications.length > 0) {
      const totalDeliveryTime = deliveredNotifications.reduce((sum, n) => {
        return sum + (n.deliveredAt!.getTime() - n.sentAt!.getTime());
      }, 0);
      this.metrics.averageDeliveryTime = totalDeliveryTime / deliveredNotifications.length;
    }

    // Update top templates
    const templateUsage = new Map<string, { count: number; success: number; }>();
    notifications.forEach(notification => {
      if (notification.templateId) {
        const usage = templateUsage.get(notification.templateId) || { count: 0, success: 0 };
        usage.count++;
        if (notification.status === NotificationStatus.DELIVERED) {
          usage.success++;
        }
        templateUsage.set(notification.templateId, usage);
      }
    });

    this.metrics.topTemplates = Array.from(templateUsage.entries())
      .map(([templateId, usage]) => {
        const template = this.templates.get(templateId);
        return {
          templateId,
          templateName: template?.name || 'Unknown',
          usageCount: usage.count,
          successRate: usage.count > 0 ? usage.success / usage.count : 0
        };
      })
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Failed notifications
    this.metrics.failedNotifications = notifications
      .filter(n => n.status === NotificationStatus.FAILED)
      .map(n => ({
        notificationId: n.id,
        channel: n.channel,
        error: 'Failed to send',
        timestamp: n.updatedAt
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);
  }

  async getUserPreference(userId: string, channel: NotificationChannel, type: NotificationType): Promise<NotificationPreference | null> {
    const key = `${userId}_${channel}_${type}`;
    return this.preferences.get(key) || null;
  }

  async setUserPreference(data: {
    userId: string;
    channel: NotificationChannel;
    type: NotificationType;
    enabled: boolean;
    quietHours?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
    };
    frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
    maxPerDay?: number;
    maxPerWeek?: number;
    maxPerMonth?: number;
    customRules?: PreferenceRule[];
  }): Promise<NotificationPreference> {
    const key = `${data.userId}_${data.channel}_${data.type}`;
    
    const preference: NotificationPreference = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      channel: data.channel,
      type: data.type,
      enabled: data.enabled,
      quietHours: data.quietHours,
      frequency: data.frequency || 'immediate',
      maxPerDay: data.maxPerDay,
      maxPerWeek: data.maxPerWeek,
      maxPerMonth: data.maxPerMonth,
      customRules: data.customRules || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.preferences.set(key, preference);
    this.emit('preferenceUpdated', preference);

    return preference;
  }

  async getNotification(notificationId: string): Promise<Notification | null> {
    return this.notifications.get(notificationId) || null;
  }

  async getNotifications(filters?: {
    userId?: string;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    type?: NotificationType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values());

    if (filters) {
      if (filters.userId) {
        notifications = notifications.filter(n => n.userId === filters.userId);
      }
      if (filters.channel) {
        notifications = notifications.filter(n => n.channel === filters.channel);
      }
      if (filters.status) {
        notifications = notifications.filter(n => n.status === filters.status);
      }
      if (filters.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }
      if (filters.startDate) {
        notifications = notifications.filter(n => n.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        notifications = notifications.filter(n => n.createdAt <= filters.endDate!);
      }
    }

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 100;
    
    return notifications.slice(offset, offset + limit);
  }

  async getMetrics(): Promise<NotificationMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<NotificationConfig>): Promise<NotificationConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<NotificationConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalNotifications: number;
    queueSize: number;
    failedRate: number;
    lastUpdated: Date;
  }> {
    this.updateMetrics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    const failedRate = this.metrics.totalNotifications > 0 
      ? this.metrics.notificationsByStatus.failed / this.metrics.totalNotifications 
      : 0;

    if (failedRate > 0.2 || this.sendQueue.length > 100) {
      status = 'critical';
    } else if (failedRate > 0.1 || this.sendQueue.length > 50) {
      status = 'warning';
    }

    return {
      status,
      totalNotifications: this.metrics.totalNotifications,
      queueSize: this.sendQueue.length,
      failedRate,
      lastUpdated: new Date()
    };
  }
}
