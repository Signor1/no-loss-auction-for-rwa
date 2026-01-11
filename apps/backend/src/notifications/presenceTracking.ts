import { EventEmitter } from 'events';
import { WebSocketServer, ConnectionInfo, ConnectionStatus } from './webSocketServer';

export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  INVISIBLE = 'invisible',
  OFFLINE = 'offline',
  DO_NOT_DISTURB = 'do_not_disturb'
}

export enum PresenceEventType {
  STATUS_CHANGE = 'status_change',
  ROOM_JOIN = 'room_join',
  ROOM_LEAVE = 'room_leave',
  ACTIVITY = 'activity',
  CUSTOM_STATUS = 'custom_status',
  GEOLOCATION_UPDATE = 'geolocation_update',
  DEVICE_CHANGE = 'device_change'
}

export interface PresenceInfo {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
  currentRoom?: string;
  previousStatus?: PresenceStatus;
  statusChangedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  device?: DeviceInfo;
  geolocation?: GeolocationInfo;
  customStatus?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  expiresAt?: Date;
}

export interface DeviceInfo {
  id: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'tv' | 'wearable';
  platform: string;
  version?: string;
  appVersion?: string;
  pushToken?: string;
  capabilities: string[];
  lastActive: Date;
  isActive: boolean;
}

export interface GeolocationInfo {
  country?: string;
  region?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timezone?: string;
  lastUpdated: Date;
}

export interface PresenceEvent {
  id: string;
  userId: string;
  type: PresenceEventType;
  data: any;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface PresenceSubscription {
  id: string;
  subscriberId: string;
  userId: string;
  targetUserId?: string;
  eventType: PresenceEventType;
  filters?: PresenceFilter[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  eventCount: number;
}

export interface PresenceFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
  value: any;
}

export interface PresenceMetrics {
  totalUsers: number;
  usersByStatus: Record<PresenceStatus, number>;
  activeUsers: number;
  idleUsers: number;
  averageSessionDuration: number;
  totalEvents: number;
  eventsByType: Record<PresenceEventType, number>;
  topRooms: Array<{
    roomId: string;
    roomName: string;
    userCount: number;
    activityLevel: number;
  }>;
  deviceDistribution: Array<{
    deviceType: string;
    count: number;
    percentage: number;
  }>;
  geoDistribution: Array<{
    country: string;
    userCount: number;
    percentage: number;
  }>;
  activityHeatmap: Array<{
    hour: number;
    activityLevel: number;
    userCount: number;
  }>;
  statusTransitions: Array<{
    fromStatus: PresenceStatus;
    toStatus: PresenceStatus;
    count: number;
    averageDuration: number;
  }>;
}

export interface PresenceConfig {
  enableStatusTracking: boolean;
  enableGeolocation: boolean;
  enableDeviceTracking: boolean;
  enableCustomStatus: boolean;
  statusTimeout: number;
  idleTimeout: number;
  offlineTimeout: number;
  enableSubscriptions: boolean;
  maxSubscriptionsPerUser: number;
  enableHistory: boolean;
  historyRetentionDays: number;
  enableAnalytics: boolean;
  analyticsInterval: number;
  enablePrivacyMode: boolean;
  privacySettings: {
    hideGeolocation: boolean;
    hideDeviceDetails: boolean;
    hideActivityStatus: boolean;
  };
  enableRealTimeUpdates: boolean;
  updateFrequency: number; // seconds
}

export class PresenceTrackingService extends EventEmitter {
  private webSocketServer: WebSocketServer;
  private presence: Map<string, PresenceInfo> = new Map();
  private events: PresenceEvent[] = [];
  private subscriptions: Map<string, PresenceSubscription> = new Map();
  private config: PresenceConfig;
  private metrics: PresenceMetrics;
  private cleanupInterval?: NodeJS.Timeout;
  private analyticsInterval?: NodeJS.Timeout;
  private statusTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(webSocketServer: WebSocketServer, config: PresenceConfig) {
    super();
    this.webSocketServer = webSocketServer;
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
    this.startCleanup();
    this.startAnalyticsCollection();
  }

  private validateConfig(config: PresenceConfig): PresenceConfig {
    return {
      enableStatusTracking: config.enableStatusTracking !== false,
      enableGeolocation: config.enableGeolocation !== false,
      enableDeviceTracking: config.enableDeviceTracking !== false,
      enableCustomStatus: config.enableCustomStatus !== false,
      statusTimeout: config.statusTimeout || 300000, // 5 minutes
      idleTimeout: config.idleTimeout || 600000, // 10 minutes
      offlineTimeout: config.offlineTimeout || 1800000, // 30 minutes
      enableSubscriptions: config.enableSubscriptions !== false,
      maxSubscriptionsPerUser: config.maxSubscriptionsPerUser || 10,
      enableHistory: config.enableHistory !== false,
      historyRetentionDays: config.historyRetentionDays || 30,
      enableAnalytics: config.enableAnalytics !== false,
      analyticsInterval: config.analyticsInterval || 60000,
      enablePrivacyMode: config.enablePrivacyMode || false,
      privacySettings: {
        hideGeolocation: config.privacySettings?.hideGeolocation || false,
        hideDeviceDetails: config.privacySettings?.hideDeviceDetails || false,
        hideActivityStatus: config.privacySettings?.hideActivityStatus || false
      },
      enableRealTimeUpdates: config.enableRealTimeUpdates !== false,
      updateFrequency: config.updateFrequency || 30
    };
  }

  private initializeMetrics(): PresenceMetrics {
    return {
      totalUsers: 0,
      usersByStatus: {
        online: 0,
        away: 0,
        busy: 0,
        invisible: 0,
        offline: 0,
        do_not_disturb: 0
      },
      activeUsers: 0,
      idleUsers: 0,
      averageSessionDuration: 0,
      totalEvents: 0,
      eventsByType: {
        status_change: 0,
        room_join: 0,
        room_leave: 0,
        activity: 0,
        custom_status: 0,
        geolocation_update: 0,
        device_change: 0
      },
      topRooms: [],
      deviceDistribution: [],
      geoDistribution: [],
      activityHeatmap: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        activityLevel: 0,
        userCount: 0
      })),
      statusTransitions: []
    };
  }

  private setupEventListeners(): void {
    this.webSocketServer.on('connectionEstablished', (connection: ConnectionInfo) => {
      this.handleConnectionEstablished(connection);
    });

    this.webSocketServer.on('connectionClosed', (connection: ConnectionInfo) => {
      this.handleConnectionClosed(connection);
    });

    this.webSocketServer.on('userAuthenticated', (connection: ConnectionInfo, userId: string) => {
      this.handleUserAuthenticated(connection, userId);
    });

    this.webSocketServer.on('roomMessage', (connection: ConnectionInfo, room: any, content: string) => {
      this.handleRoomActivity(connection, room, content);
    });
  }

  private handleConnectionEstablished(connection: ConnectionInfo): void {
    if (!connection.userId) return;

    const presence: PresenceInfo = {
      userId: connection.userId,
      status: PresenceStatus.ONLINE,
      lastSeen: new Date(),
      statusChangedAt: new Date(),
      ipAddress: connection.ipAddress,
      userAgent: connection.userAgent,
      isActive: true,
      metadata: {}
    };

    this.presence.set(connection.userId, presence);
    this.updateMetrics();
    this.emit('userOnline', connection.userId, presence);

    // Broadcast presence change if enabled
    if (this.config.enableRealTimeUpdates) {
      this.broadcastPresenceChange(connection.userId, presence);
    }
  }

  private handleConnectionClosed(connection: ConnectionInfo): void {
    if (!connection.userId) return;

    const presence = this.presence.get(connection.userId);
    if (!presence) return;

    // Clear status timeout
    const timeout = this.statusTimeouts.get(connection.userId);
    if (timeout) {
      clearTimeout(timeout);
      this.statusTimeouts.delete(connection.userId);
    }

    // Update presence to offline
    presence.status = PresenceStatus.OFFLINE;
    presence.lastSeen = new Date();
    presence.statusChangedAt = new Date();
    presence.isActive = false;

    this.presence.set(connection.userId, presence);
    this.updateMetrics();
    this.emit('userOffline', connection.userId, presence);

    // Broadcast presence change if enabled
    if (this.config.enableRealTimeUpdates) {
      this.broadcastPresenceChange(connection.userId, presence);
    }
  }

  private handleUserAuthenticated(connection: ConnectionInfo, userId: string): void {
    // Update existing presence or create new one
    const existingPresence = this.presence.get(userId);
    
    if (existingPresence) {
      existingPresence.status = PresenceStatus.ONLINE;
      existingPresence.lastSeen = new Date();
      existingPresence.statusChangedAt = new Date();
      existingPresence.isActive = true;
      existingPresence.ipAddress = connection.ipAddress;
      existingPresence.userAgent = connection.userAgent;

      this.presence.set(userId, existingPresence);
      this.emit('userOnline', userId, existingPresence);

      if (this.config.enableRealTimeUpdates) {
        this.broadcastPresenceChange(userId, existingPresence);
      }
    }
  }

  private handleRoomActivity(connection: ConnectionInfo, room: any, content: string): void {
    if (!connection.userId) return;

    const presence = this.presence.get(connection.userId);
    if (!presence) return;

    // Update last seen and current room
    presence.lastSeen = new Date();
    presence.currentRoom = room.id;
    presence.isActive = true;

    this.presence.set(connection.userId, presence);
    this.updateMetrics();

    // Record activity event
    this.recordEvent({
      userId: connection.userId,
      type: PresenceEventType.ACTIVITY,
      data: {
        action: 'room_message',
        roomId: room.id,
        content,
        timestamp: new Date()
      },
      source: 'room_activity'
    });
  }

  async updatePresence(userId: string, updates: {
    status?: PresenceStatus;
    customStatus?: string;
    geolocation?: GeolocationInfo;
    device?: DeviceInfo;
    metadata?: Record<string, any>;
    expiresAt?: Date;
  }): Promise<PresenceInfo | null> {
    const presence = this.presence.get(userId);
    if (!presence) return null;

    const previousStatus = presence.status;
    const now = new Date();

    // Apply updates
    if (updates.status !== undefined) {
      presence.status = updates.status;
      presence.statusChangedAt = now;
    }

    if (updates.customStatus !== undefined) {
      presence.customStatus = updates.customStatus;
    }

    if (updates.geolocation !== undefined) {
      presence.geolocation = updates.geolocation;
    }

    if (updates.device !== undefined) {
      presence.device = updates.device;
    }

    if (updates.metadata !== undefined) {
      presence.metadata = { ...presence.metadata, ...updates.metadata };
    }

    if (updates.expiresAt !== undefined) {
      presence.expiresAt = updates.expiresAt;
    }

    presence.lastSeen = now;
    presence.isActive = true;

    this.presence.set(userId, presence);

    // Record status change event
    if (updates.status && updates.status !== previousStatus) {
      this.recordEvent({
        userId,
        type: PresenceEventType.STATUS_CHANGE,
        data: {
          fromStatus: previousStatus,
          toStatus: updates.status,
          timestamp: now
        },
        source: 'presence_update'
      });
    }

    // Broadcast presence change if enabled
    if (this.config.enableRealTimeUpdates) {
      this.broadcastPresenceChange(userId, presence);
    }

    this.updateMetrics();
    this.emit('presenceUpdated', userId, presence);

    return presence;
  }

  async setCustomStatus(userId: string, status: string, metadata?: Record<string, any>): Promise<PresenceInfo | null> {
    return this.updatePresence(userId, {
      customStatus: status,
      metadata
    });
  }

  async setAway(userId: string, reason?: string): Promise<PresenceInfo | null> {
    return this.updatePresence(userId, {
      status: PresenceStatus.AWAY,
      metadata: reason ? { awayReason: reason } : undefined
    });
  }

  async setBusy(userId: string, reason?: string): Promise<PresenceInfo | null> {
    return this.updatePresence(userId, {
      status: PresenceStatus.BUSY,
      metadata: reason ? { busyReason: reason } : undefined
    });
  }

  async setInvisible(userId: string): Promise<PresenceInfo | null> {
    return this.updatePresence(userId, {
      status: PresenceStatus.INVISIBLE
    });
  }

  async setDoNotDisturb(userId: string, enabled: boolean): Promise<PresenceInfo | null> {
    return this.updatePresence(userId, {
      status: enabled ? PresenceStatus.DO_NOT_DISTURB : PresenceStatus.ONLINE,
      metadata: { doNotDisturb: enabled }
    });
  }

  private broadcastPresenceChange(userId: string, presence: PresenceInfo): void {
    const changeEvent = {
      id: this.generateEventId(),
      userId,
      type: PresenceEventType.STATUS_CHANGE,
      data: {
        userId,
        status: presence.status,
        lastSeen: presence.lastSeen,
        currentRoom: presence.currentRoom,
        metadata: this.sanitizePresenceForBroadcast(presence)
      },
      timestamp: new Date(),
      source: 'presence_system'
    };

    // This would broadcast through the WebSocket server
    this.webSocketServer.emit('presenceChange', changeEvent);
  }

  private sanitizePresenceForBroadcast(presence: PresenceInfo): any {
    if (this.config.enablePrivacyMode) {
      const sanitized: any = {
        userId: presence.userId,
        status: presence.status,
        lastSeen: presence.lastSeen
      };

      if (!this.config.privacySettings.hideGeolocation && presence.geolocation) {
        sanitized.geolocation = {
          country: presence.geolocation.country
        };
      }

      if (!this.config.privacySettings.hideDeviceDetails && presence.device) {
        sanitized.device = {
          type: presence.device.type,
          platform: presence.device.platform
        };
      }

      if (!this.config.privacySettings.hideActivityStatus) {
        sanitized.activityLevel = this.getActivityLevel(presence.status);
      }

      return sanitized;
    }

    return presence;
  }

  private getActivityLevel(status: PresenceStatus): number {
    const levels = {
      [PresenceStatus.ONLINE]: 5,
      [PresenceStatus.AWAY]: 3,
      [PresenceStatus.BUSY]: 4,
      [PresenceStatus.INVISIBLE]: 2,
      [PresenceStatus.OFFLINE]: 0,
      [PresenceStatus.DO_NOT_DISTURB]: 1
    };
    return levels[status] || 0;
  }

  async createSubscription(data: {
    subscriberId: string;
    userId: string;
    targetUserId?: string;
    eventType: PresenceEventType;
    filters?: PresenceFilter[];
  }): Promise<PresenceSubscription> {
    const subscription: PresenceSubscription = {
      id: this.generateSubscriptionId(),
      subscriberId: data.subscriberId,
      userId: data.userId,
      targetUserId: data.targetUserId,
      eventType: data.eventType,
      filters: data.filters || [],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
      eventCount: 0
    };

    this.subscriptions.set(subscription.id, subscription);
    this.emit('subscriptionCreated', subscription);

    return subscription;
  }

  async recordEvent(event: {
    userId: string;
    type: PresenceEventType;
    data: any;
    source: string;
    metadata?: Record<string, any>;
  }): Promise<PresenceEvent> {
    const presenceEvent: PresenceEvent = {
      id: this.generateEventId(),
      userId: event.userId,
      type: event.type,
      data: event.data,
      timestamp: new Date(),
      source: event.source,
      metadata: event.metadata || {}
    };

    this.events.push(presenceEvent);
    this.processEventSubscriptions(presenceEvent);
    this.updateMetrics();
    this.emit('eventRecorded', presenceEvent);

    return presenceEvent;
  }

  private processEventSubscriptions(event: PresenceEvent): void {
    const matchingSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => 
        sub.isActive &&
        sub.eventType === event.type &&
        this.evaluateEventFilters(event, sub.filters || [])
      );

    matchingSubscriptions.forEach(subscription => {
      subscription.lastActivity = new Date();
      subscription.eventCount++;
      this.subscriptions.set(sub.id, subscription);

      this.emit('subscriptionTriggered', subscription, event);
    });
  }

  private evaluateEventFilters(event: PresenceEvent, filters: PresenceFilter[]): boolean {
    if (filters.length === 0) return true;

    return filters.every(filter => {
      const fieldValue = this.getEventFieldValue(event, filter.field);
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'equals':
          return fieldValue === filterValue;
        case 'not_equals':
          return fieldValue !== filterValue;
        case 'in':
          return Array.isArray(filterValue) && filterValue.includes(fieldValue);
        case 'not_in':
          return Array.isArray(filterValue) && !filterValue.includes(fieldValue);
        case 'contains':
          return String(fieldValue).includes(String(filterValue));
        default:
          return true;
      }
    });
  }

  private getEventFieldValue(event: PresenceEvent, field: string): any {
    const parts = field.split('.');
    let value: any = event;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else if (value && typeof value === 'object' && 'data' in value && part in value.data) {
        value = value.data[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredPresence();
      this.cleanupOldEvents();
    }, 60000); // Clean every minute
  }

  private cleanupExpiredPresence(): void {
    const now = Date.now();
    const expiredUsers: string[] = [];

    for (const [userId, presence] of this.presence.entries()) {
      if (presence.expiresAt && presence.expiresAt.getTime() < now) {
        expiredUsers.push(userId);
      }

      // Check for offline timeout
      if (presence.isActive && presence.status !== PresenceStatus.OFFLINE) {
        const timeSinceLastSeen = now - presence.lastSeen.getTime();
        
        if (presence.status === PresenceStatus.ONLINE && timeSinceLastSeen > this.config.offlineTimeout) {
          presence.status = PresenceStatus.OFFLINE;
          presence.statusChangedAt = new Date();
          presence.isActive = false;
          expiredUsers.push(userId);
        } else if (presence.status === PresenceStatus.AWAY && timeSinceLastSeen > this.config.idleTimeout) {
          presence.status = PresenceStatus.AWAY;
          presence.statusChangedAt = new Date();
        }
      }
    }

    expiredUsers.forEach(userId => {
      const presence = this.presence.get(userId);
      if (presence) {
        this.presence.set(userId, presence);
      }
    });

    if (expiredUsers.length > 0) {
      this.log('info', `Cleaned up presence for ${expiredUsers.length} expired users`);
    }
  }

  private cleanupOldEvents(): void {
    if (!this.config.enableHistory) return;

    const cutoffDate = new Date(Date.now() - this.config.historyRetentionDays * 24 * 60 * 60 * 1000);
    const initialLength = this.events.length;
    
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
    
    const cleanedCount = initialLength - this.events.length;
    if (cleanedCount > 0) {
      this.log('info', `Cleaned up ${cleanedCount} old presence events`);
    }
  }

  private startAnalyticsCollection(): void {
    this.analyticsInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.analyticsInterval);
  }

  private updateMetrics(): void {
    this.metrics.totalUsers = this.presence.size;

    // Count users by status
    this.metrics.usersByStatus = {
      online: 0,
      away: 0,
      busy: 0,
      invisible: 0,
      offline: 0,
      do_not_disturb: 0
    };

    let activeUsers = 0;
    let idleUsers = 0;

    for (const presence of this.presence.values()) {
      if (presence.isActive) {
        this.metrics.usersByStatus[presence.status]++;
        
        if (presence.status === PresenceStatus.ONLINE || presence.status === PresenceStatus.AWAY) {
          activeUsers++;
        } else {
          idleUsers++;
        }
      }
    }

    this.metrics.activeUsers = activeUsers;
    this.metrics.idleUsers = idleUsers;

    // Update activity heatmap
    const currentHour = new Date().getHours();
    if (this.metrics.activityHeatmap[currentHour]) {
      this.metrics.activityHeatmap[currentHour].activityLevel += activeUsers;
      this.metrics.activityHeatmap[currentHour].userCount = this.metrics.totalUsers;
    }

    // Update device distribution
    const deviceCounts = new Map<string, number>();
    for (const presence of this.presence.values()) {
      if (presence.device) {
        const deviceType = presence.device.type;
        deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);
      }
    }

    this.metrics.deviceDistribution = Array.from(deviceCounts.entries())
      .map(([deviceType, count]) => ({
        deviceType,
        count,
        percentage: this.metrics.totalUsers > 0 ? (count / this.metrics.totalUsers) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Update geo distribution
    const geoCounts = new Map<string, number>();
    for (const presence of this.presence.values()) {
      if (presence.geolocation?.country) {
        const country = presence.geolocation.country;
        geoCounts.set(country, (geoCounts.get(country) || 0) + 1);
      }
    }

    this.metrics.geoDistribution = Array.from(geoCounts.entries())
      .map(([country, count]) => ({
        country,
        userCount: count,
        percentage: this.metrics.totalUsers > 0 ? (count / this.metrics.totalUsers) * 100 : 0
      }))
      .sort((a, b) => b.userCount - a.userCount);
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableAnalytics) return;
    
    const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Public API methods
  async getPresence(userId: string): Promise<PresenceInfo | null> {
    return this.presence.get(userId) || null;
  }

  async getAllPresence(filters?: {
    status?: PresenceStatus;
    currentRoom?: string;
    isActive?: boolean;
  }): Promise<PresenceInfo[]> {
    let presence = Array.from(this.presence.values());

    if (filters) {
      if (filters.status) {
        presence = presence.filter(p => p.status === filters.status);
      }
      if (filters.currentRoom) {
        presence = presence.filter(p => p.currentRoom === filters.currentRoom);
      }
      if (filters.isActive !== undefined) {
        presence = presence.filter(p => p.isActive === filters.isActive);
      }
    }

    return presence.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  async getEvent(eventId: string): Promise<PresenceEvent | null> {
    return this.events.find(event => event.id === eventId) || null;
  }

  async getEvents(filters?: {
    userId?: string;
    type?: PresenceEventType;
    source?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<PresenceEvent[]> {
    let events = [...this.events];

    if (filters) {
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.type) {
        events = events.filter(e => e.type === filters.type);
      }
      if (filters.source) {
        events = events.filter(e => e.source === filters.source);
      }
      if (filters.startDate) {
        events = events.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(e => e.timestamp <= filters.endDate!);
      }
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const limit = filters?.limit || 100;
    return events.slice(0, limit);
  }

  async getSubscription(subscriptionId: string): Promise<PresenceSubscription | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async getSubscriptions(filters?: {
    subscriberId?: string;
    userId?: string;
    targetUserId?: string;
    eventType?: PresenceEventType;
    isActive?: boolean;
  }): Promise<PresenceSubscription[]> {
    let subscriptions = Array.from(this.subscriptions.values());

    if (filters) {
      if (filters.subscriberId) {
        subscriptions = subscriptions.filter(s => s.subscriberId === filters.subscriberId);
      }
      if (filters.userId) {
        subscriptions = subscriptions.filter(s => s.userId === filters.userId);
      }
      if (filters.targetUserId) {
        subscriptions = subscriptions.filter(s => s.targetUserId === filters.targetUserId);
      }
      if (filters.eventType) {
        subscriptions = subscriptions.filter(s => s.eventType === filters.eventType);
      }
      if (filters.isActive !== undefined) {
        subscriptions = subscriptions.filter(s => s.isActive === filters.isActive);
      }
    }

    return subscriptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMetrics(): Promise<PresenceMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<PresenceConfig>): Promise<PresenceConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<PresenceConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down presence tracking service...');

    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }

    // Clear all status timeouts
    for (const timeout of this.statusTimeouts.values()) {
      clearTimeout(timeout);
    }

    this.log('info', 'Presence tracking service shutdown complete');
    this.emit('serviceShutdown');
  }
}
