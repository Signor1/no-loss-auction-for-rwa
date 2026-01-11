import { EventEmitter } from 'events';
import { NotificationChannel, NotificationType, NotificationStatus, NotificationPriority } from './notificationEngine';

export enum HistoryEventType {
  NOTIFICATION_CREATED = 'notification_created',
  NOTIFICATION_SENT = 'notification_sent',
  NOTIFICATION_DELIVERED = 'notification_delivered',
  NOTIFICATION_OPENED = 'notification_opened',
  NOTIFICATION_CLICKED = 'notification_clicked',
  NOTIFICATION_FAILED = 'notification_failed',
  NOTIFICATION_CANCELLED = 'notification_cancelled',
  NOTIFICATION_RETRY = 'notification_retry'
}

export interface NotificationHistory {
  id: string;
  notificationId: string;
  userId?: string;
  tenantId?: string;
  channel: NotificationChannel;
  type: NotificationType;
  priority: NotificationPriority;
  recipient: string;
  subject?: string;
  content: string;
  status: NotificationStatus;
  events: HistoryEvent[];
  metadata: Record<string, any>;
  templateId?: string;
  campaignId?: string;
  correlationId?: string;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failedAt?: Date;
  retryCount: number;
  maxRetries: number;
  expiresAt?: Date;
  tags: string[];
}

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  timestamp: Date;
  details: Record<string, any>;
  provider?: string;
  error?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface HistoryAnalytics {
  totalNotifications: number;
  notificationsByChannel: Record<NotificationChannel, number>;
  notificationsByType: Record<NotificationType, number>;
  notificationsByStatus: Record<NotificationStatus, number>;
  notificationsByPriority: Record<NotificationPriority, number>;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failureRate: number;
  averageDeliveryTime: number;
  notificationsToday: number;
  notificationsThisWeek: number;
  notificationsThisMonth: number;
  topRecipients: Array<{
    recipient: string;
    count: number;
    lastNotification: Date;
  }>;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
    successRate: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
  }>;
  dailyDistribution: Array<{
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  }>;
  performanceMetrics: Array<{
    channel: NotificationChannel;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    averageTime: number;
  }>;
  trends: Array<{
    period: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  }>;
}

export interface HistoryQuery {
  userId?: string;
  tenantId?: string;
  channel?: NotificationChannel;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  recipient?: string;
  templateId?: string;
  campaignId?: string;
  correlationId?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'sentAt' | 'deliveredAt' | 'openedAt' | 'clickedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface HistoryExport {
  id: string;
  query: HistoryQuery;
  format: 'csv' | 'excel' | 'json' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  recordCount?: number;
  error?: string;
  createdBy: string;
  expiresAt?: Date;
}

export interface HistoryConfig {
  enableHistory: boolean;
  retentionDays: number;
  enableRealTimeUpdates: boolean;
  enableExport: boolean;
  exportFormats: string[];
  maxExportRecords: number;
  enableAnalytics: boolean;
  analyticsCacheTimeout: number;
  enableSearch: boolean;
  searchFields: string[];
  enableIndexing: boolean;
  indexedFields: string[];
  enableCompression: boolean;
  compressionLevel: number;
}

export class NotificationHistoryService extends EventEmitter {
  private history: Map<string, NotificationHistory> = new Map();
  private exports: Map<string, HistoryExport> = new Map();
  private config: HistoryConfig;
  private analytics: HistoryAnalytics;
  private searchIndex: Map<string, string[]> = new Map();

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.analytics = this.initializeAnalytics();
    this.startAnalyticsUpdater();
    this.startCleanupProcessor();
  }

  private initializeDefaultConfig(): HistoryConfig {
    return {
      enableHistory: true,
      retentionDays: 365,
      enableRealTimeUpdates: true,
      enableExport: true,
      exportFormats: ['csv', 'excel', 'json', 'pdf'],
      maxExportRecords: 100000,
      enableAnalytics: true,
      analyticsCacheTimeout: 300, // 5 minutes
      enableSearch: true,
      searchFields: ['subject', 'content', 'recipient', 'tags'],
      enableIndexing: true,
      indexedFields: ['userId', 'recipient', 'channel', 'type', 'status'],
      enableCompression: true,
      compressionLevel: 6
    };
  }

  private initializeAnalytics(): HistoryAnalytics {
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
      notificationsByType: {
        transactional: 0,
        marketing: 0,
        alert: 0,
        reminder: 0,
        verification: 0,
        system: 0
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
      notificationsByPriority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0
      },
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      failureRate: 0,
      averageDeliveryTime: 0,
      notificationsToday: 0,
      notificationsThisWeek: 0,
      notificationsThisMonth: 0,
      topRecipients: [],
      topTemplates: [],
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
      dailyDistribution: [],
      performanceMetrics: [],
      trends: []
    };
  }

  async addToHistory(data: {
    notificationId: string;
    userId?: string;
    tenantId?: string;
    channel: NotificationChannel;
    type: NotificationType;
    priority: NotificationPriority;
    recipient: string;
    subject?: string;
    content: string;
    status: NotificationStatus;
    templateId?: string;
    campaignId?: string;
    correlationId?: string;
    expiresAt?: Date;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<NotificationHistory> {
    const history: NotificationHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notificationId: data.notificationId,
      userId: data.userId,
      tenantId: data.tenantId,
      channel: data.channel,
      type: data.type,
      priority: data.priority,
      recipient: data.recipient,
      subject: data.subject,
      content: data.content,
      status: data.status,
      events: [],
      metadata: data.metadata || {},
      templateId: data.templateId,
      campaignId: data.campaignId,
      correlationId: data.correlationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      expiresAt: data.expiresAt,
      tags: data.tags || []
    };

    this.history.set(history.id, history);

    // Update search index
    if (this.config.enableIndexing) {
      this.updateSearchIndex(history);
    }

    this.updateAnalytics();
    this.emit('historyAdded', history);

    return history;
  }

  async addEvent(historyId: string, eventType: HistoryEventType, details: Record<string, any>): Promise<HistoryEvent | null> {
    const history = this.history.get(historyId);
    if (!history) return null;

    const event: HistoryEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: new Date(),
      details,
      metadata: {}
    };

    history.events.push(event);
    history.updatedAt = new Date();

    // Update history timestamps based on event
    this.updateHistoryFromEvent(history, event);

    this.history.set(historyId, history);
    this.updateAnalytics();
    this.emit('eventAdded', history, event);

    return event;
  }

  private updateHistoryFromEvent(history: NotificationHistory, event: HistoryEvent): void {
    switch (event.type) {
      case HistoryEventType.NOTIFICATION_SENT:
        history.sentAt = event.timestamp;
        history.status = NotificationStatus.SENT;
        break;
      case HistoryEventType.NOTIFICATION_DELIVERED:
        history.deliveredAt = event.timestamp;
        history.status = NotificationStatus.DELIVERED;
        break;
      case HistoryEventType.NOTIFICATION_OPENED:
        history.openedAt = event.timestamp;
        history.status = NotificationStatus.OPENED;
        break;
      case HistoryEventType.NOTIFICATION_CLICKED:
        history.clickedAt = event.timestamp;
        history.status = NotificationStatus.CLICKED;
        break;
      case HistoryEventType.NOTIFICATION_FAILED:
        history.failedAt = event.timestamp;
        history.status = NotificationStatus.FAILED;
        break;
      case HistoryEventType.NOTIFICATION_RETRY:
        history.retryCount++;
        break;
    }
  }

  private updateSearchIndex(history: NotificationHistory): void {
    const searchableText = this.getSearchableText(history);
    const words = searchableText.toLowerCase().split(/\s+/);

    words.forEach(word => {
      if (word.length > 2) { // Only index words longer than 2 characters
        const existing = this.searchIndex.get(word) || [];
        existing.push(history.id);
        this.searchIndex.set(word, existing);
      }
    });
  }

  private getSearchableText(history: NotificationHistory): string {
    const fields = this.config.searchFields;
    const values: string[] = [];

    fields.forEach(field => {
      const value = (history as any)[field];
      if (value) {
        if (Array.isArray(value)) {
          values.push(value.join(' '));
        } else {
          values.push(String(value));
        }
      }
    });

    return values.join(' ');
  }

  async searchHistory(query: HistoryQuery): Promise<{
    history: NotificationHistory[];
    total: number;
    hasMore: boolean;
  }> {
    let history = Array.from(this.history.values());

    // Apply filters
    if (query.userId) {
      history = history.filter(h => h.userId === query.userId);
    }
    if (query.tenantId) {
      history = history.filter(h => h.tenantId === query.tenantId);
    }
    if (query.channel) {
      history = history.filter(h => h.channel === query.channel);
    }
    if (query.type) {
      history = history.filter(h => h.type === query.type);
    }
    if (query.status) {
      history = history.filter(h => h.status === query.status);
    }
    if (query.priority) {
      history = history.filter(h => h.priority === query.priority);
    }
    if (query.recipient) {
      history = history.filter(h => h.recipient === query.recipient);
    }
    if (query.templateId) {
      history = history.filter(h => h.templateId === query.templateId);
    }
    if (query.campaignId) {
      history = history.filter(h => h.campaignId === query.campaignId);
    }
    if (query.correlationId) {
      history = history.filter(h => h.correlationId === query.correlationId);
    }
    if (query.tags && query.tags.length > 0) {
      history = history.filter(h => 
        query.tags!.some(tag => h.tags.includes(tag))
      );
    }
    if (query.startDate) {
      history = history.filter(h => h.createdAt >= query.startDate!);
    }
    if (query.endDate) {
      history = history.filter(h => h.createdAt <= query.endDate!);
    }

    // Text search
    if (query.searchText && this.config.enableSearch) {
      const searchWords = query.searchText.toLowerCase().split(/\s+/);
      const matchingIds = new Set<string>();

      searchWords.forEach(word => {
        if (word.length > 2) {
          const ids = this.searchIndex.get(word) || [];
          ids.forEach(id => matchingIds.add(id));
        }
      });

      if (matchingIds.size > 0) {
        history = history.filter(h => matchingIds.has(h.id));
      }
    }

    // Sort
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    history.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'sentAt':
          const aSent = a.sentAt?.getTime() || 0;
          const bSent = b.sentAt?.getTime() || 0;
          comparison = aSent - bSent;
          break;
        case 'deliveredAt':
          const aDelivered = a.deliveredAt?.getTime() || 0;
          const bDelivered = b.deliveredAt?.getTime() || 0;
          comparison = aDelivered - bDelivered;
          break;
        case 'openedAt':
          const aOpened = a.openedAt?.getTime() || 0;
          const bOpened = b.openedAt?.getTime() || 0;
          comparison = aOpened - bOpened;
          break;
        case 'clickedAt':
          const aClicked = a.clickedAt?.getTime() || 0;
          const bClicked = b.clickedAt?.getTime() || 0;
          comparison = aClicked - bClicked;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = history.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedHistory = history.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      history: paginatedHistory,
      total,
      hasMore
    };
  }

  async exportHistory(query: HistoryQuery, format: HistoryExport['format'], createdBy: string): Promise<HistoryExport> {
    const exportRecord: HistoryExport = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      format,
      status: 'pending',
      createdAt: new Date(),
      createdBy: createdBy,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.exports.set(exportRecord.id, exportRecord);

    // Process export asynchronously
    this.processExport(exportRecord);

    return exportRecord;
  }

  private async processExport(exportRecord: HistoryExport): Promise<void> {
    try {
      exportRecord.status = 'processing';

      // Get history data
      const { history } = await this.searchHistory({
        ...exportRecord.query,
        limit: this.config.maxExportRecords
      });

      exportRecord.recordCount = history.length;

      // Convert to requested format
      const exportData = await this.convertToFormat(history, exportRecord.format);
      exportRecord.fileSize = exportData.length;

      // Save file (simulated)
      const fileName = `notifications_export_${Date.now()}.${exportRecord.format}`;
      const fileUrl = `/exports/${fileName}`;
      exportRecord.fileUrl = fileUrl;

      exportRecord.status = 'completed';
      exportRecord.completedAt = new Date();

      this.emit('exportCompleted', exportRecord);

    } catch (error) {
      exportRecord.status = 'failed';
      exportRecord.error = error instanceof Error ? error.message : String(error);
      this.emit('exportFailed', exportRecord, error);
    }

    this.exports.set(exportRecord.id, exportRecord);
  }

  private async convertToFormat(history: NotificationHistory[], format: string): Promise<Buffer> {
    switch (format) {
      case 'csv':
        return this.convertToCSV(history);
      case 'json':
        return this.convertToJSON(history);
      case 'excel':
        return this.convertToExcel(history);
      case 'pdf':
        return this.convertToPDF(history);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertToCSV(history: NotificationHistory[]): Buffer {
    const headers = ['ID', 'Channel', 'Type', 'Recipient', 'Subject', 'Status', 'Created', 'Sent', 'Delivered'];
    const rows = history.map(h => [
      h.id,
      h.channel,
      h.type,
      h.recipient,
      h.subject || '',
      h.status,
      h.createdAt.toISOString(),
      h.sentAt?.toISOString() || '',
      h.deliveredAt?.toISOString() || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return Buffer.from(csvContent, 'utf8');
  }

  private convertToJSON(history: NotificationHistory[]): Buffer {
    return Buffer.from(JSON.stringify(history, null, 2), 'utf8');
  }

  private convertToExcel(history: NotificationHistory[]): Buffer {
    // Simplified Excel conversion
    return Buffer.from('Excel export data', 'utf8');
  }

  private convertToPDF(history: NotificationHistory[]): Buffer {
    // Simplified PDF conversion
    return Buffer.from('PDF export data', 'utf8');
  }

  private startAnalyticsUpdater(): void {
    setInterval(() => {
      this.updateAnalytics();
    }, this.config.analyticsCacheTimeout * 1000);
  }

  private updateAnalytics(): void {
    const history = Array.from(this.history.values());

    this.analytics.totalNotifications = history.length;

    this.analytics.notificationsByChannel = {
      email: history.filter(h => h.channel === NotificationChannel.EMAIL).length,
      sms: history.filter(h => h.channel === NotificationChannel.SMS).length,
      push: history.filter(h => h.channel === NotificationChannel.PUSH).length,
      webhook: history.filter(h => h.channel === NotificationChannel.WEBHOOK).length,
      slack: history.filter(h => h.channel === NotificationChannel.SLACK).length,
      microsoft_teams: history.filter(h => h.channel === NotificationChannel.MICROSOFT_TEAMS).length,
      discord: history.filter(h => h.channel === NotificationChannel.DISCORD).length,
      in_app: history.filter(h => h.channel === NotificationChannel.IN_APP).length
    };

    this.analytics.notificationsByType = {
      transactional: history.filter(h => h.type === NotificationType.TRANSACTIONAL).length,
      marketing: history.filter(h => h.type === NotificationType.MARKETING).length,
      alert: history.filter(h => h.type === NotificationType.ALERT).length,
      reminder: history.filter(h => h.type === NotificationType.REMINDER).length,
      verification: history.filter(h => h.type === NotificationType.VERIFICATION).length,
      system: history.filter(h => h.type === NotificationType.SYSTEM).length
    };

    this.analytics.notificationsByStatus = {
      pending: history.filter(h => h.status === NotificationStatus.PENDING).length,
      sending: history.filter(h => h.status === NotificationStatus.SENDING).length,
      sent: history.filter(h => h.status === NotificationStatus.SENT).length,
      delivered: history.filter(h => h.status === NotificationStatus.DELIVERED).length,
      failed: history.filter(h => h.status === NotificationStatus.FAILED).length,
      cancelled: history.filter(h => h.status === NotificationStatus.CANCELLED).length,
      bounced: history.filter(h => h.status === NotificationStatus.BOUNCED).length,
      opened: history.filter(h => h.status === NotificationStatus.OPENED).length,
      clicked: history.filter(h => h.status === NotificationStatus.CLICKED).length
    };

    this.analytics.notificationsByPriority = {
      low: history.filter(h => h.priority === NotificationPriority.LOW).length,
      normal: history.filter(h => h.priority === NotificationPriority.NORMAL).length,
      high: history.filter(h => h.priority === NotificationPriority.HIGH).length,
      urgent: history.filter(h => h.priority === NotificationPriority.URGENT).length
    };

    // Calculate rates
    const totalDelivered = this.analytics.notificationsByStatus.delivered;
    const totalFailed = this.analytics.notificationsByStatus.failed + this.analytics.notificationsByStatus.bounced;
    const totalProcessed = totalDelivered + totalFailed;

    this.analytics.deliveryRate = totalProcessed > 0 ? totalDelivered / totalProcessed : 0;
    this.analytics.failureRate = totalProcessed > 0 ? totalFailed / totalProcessed : 0;
    this.analytics.openRate = totalDelivered > 0 ? this.analytics.notificationsByStatus.opened / totalDelivered : 0;
    this.analytics.clickRate = this.analytics.notificationsByStatus.opened > 0 ? this.analytics.notificationsByStatus.clicked / this.analytics.notificationsByStatus.opened : 0;

    // Time-based metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    this.analytics.notificationsToday = history.filter(h => h.createdAt >= today).length;
    this.analytics.notificationsThisWeek = history.filter(h => h.createdAt >= weekAgo).length;
    this.analytics.notificationsThisMonth = history.filter(h => h.createdAt >= monthAgo).length;

    // Top recipients
    const recipientCounts = new Map<string, { count: number; lastDate: Date }>();
    history.forEach(h => {
      const existing = recipientCounts.get(h.recipient) || { count: 0, lastDate: h.createdAt };
      existing.count++;
      if (h.createdAt > existing.lastDate) {
        existing.lastDate = h.createdAt;
      }
      recipientCounts.set(h.recipient, existing);
    });

    this.analytics.topRecipients = Array.from(recipientCounts.entries())
      .map(([recipient, data]) => ({
        recipient,
        count: data.count,
        lastNotification: data.lastDate
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Performance metrics by channel
    this.analytics.performanceMetrics = Object.values(NotificationChannel).map(channel => {
      const channelHistory = history.filter(h => h.channel === channel);
      const sent = channelHistory.length;
      const delivered = channelHistory.filter(h => h.status === NotificationStatus.DELIVERED).length;
      const opened = channelHistory.filter(h => h.status === NotificationStatus.OPENED).length;
      const clicked = channelHistory.filter(h => h.status === NotificationStatus.CLICKED).length;

      return {
        channel,
        totalSent: sent,
        totalDelivered: delivered,
        totalOpened: opened,
        totalClicked: clicked,
        deliveryRate: sent > 0 ? delivered / sent : 0,
        openRate: delivered > 0 ? opened / delivered : 0,
        clickRate: opened > 0 ? clicked / opened : 0,
        averageTime: this.calculateAverageTime(channelHistory)
      };
    });
  }

  private calculateAverageTime(history: NotificationHistory[]): number {
    const delivered = history.filter(h => h.sentAt && h.deliveredAt);
    if (delivered.length === 0) return 0;

    const totalTime = delivered.reduce((sum, h) => {
      return sum + (h.deliveredAt!.getTime() - h.sentAt!.getTime());
    }, 0);

    return totalTime / delivered.length;
  }

  private startCleanupProcessor(): void {
    // Run cleanup daily
    setInterval(() => {
      this.cleanupExpiredRecords();
    }, 24 * 60 * 60 * 1000);
  }

  private cleanupExpiredRecords(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [id, history] of this.history.entries()) {
      if (history.createdAt < cutoffDate) {
        this.history.delete(id);
        cleanedCount++;
      }
    }

    // Clean up expired exports
    for (const [id, exportRecord] of this.exports.entries()) {
      if (exportRecord.expiresAt && exportRecord.expiresAt < new Date()) {
        this.exports.delete(id);
      }
    }

    if (cleanedCount > 0) {
      this.emit('cleanupCompleted', cleanedCount);
    }
  }

  async getHistory(historyId: string): Promise<NotificationHistory | null> {
    return this.history.get(historyId) || null;
  }

  async getExport(exportId: string): Promise<HistoryExport | null> {
    return this.exports.get(exportId) || null;
  }

  async getAnalytics(): Promise<HistoryAnalytics> {
    this.updateAnalytics();
    return { ...this.analytics };
  }

  async updateConfig(updates: Partial<HistoryConfig>): Promise<HistoryConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<HistoryConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalHistory: number;
    searchIndexSize: number;
    activeExports: number;
    lastUpdated: Date;
  }> {
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    const totalHistory = this.history.size;
    const searchIndexSize = this.searchIndex.size;
    const activeExports = Array.from(this.exports.values())
      .filter(e => e.status === 'processing').length;

    if (totalHistory > 1000000 || activeExports > 10) {
      status = 'critical';
    } else if (totalHistory > 500000 || activeExports > 5) {
      status = 'warning';
    }

    return {
      status,
      totalHistory,
      searchIndexSize,
      activeExports,
      lastUpdated: new Date()
    };
  }
}
