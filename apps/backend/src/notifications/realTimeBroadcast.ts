import { EventEmitter } from 'events';
import { WebSocketServer, ConnectionInfo, MessageType, WebSocketMessage } from './webSocketServer';

export enum BroadcastType {
  GLOBAL = 'global',
  ROOM = 'room',
  USER = 'user',
  ROLE = 'role',
  CHANNEL = 'channel',
  TOPIC = 'topic'
}

export enum BroadcastPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum FilterType {
  USER_ID = 'user_id',
  ROLE = 'role',
  PERMISSION = 'permission',
  ROOM_ID = 'room_id',
  CHANNEL = 'channel',
  TOPIC = 'topic',
  CUSTOM = 'custom'
}

export interface BroadcastMessage {
  id: string;
  type: BroadcastType;
  priority: BroadcastPriority;
  data: any;
  filters?: BroadcastFilter[];
  exclude?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  retryCount: number;
  maxRetries: number;
  createdBy?: string;
  tags?: string[];
}

export interface BroadcastFilter {
  type: FilterType;
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  caseSensitive?: boolean;
}

export interface BroadcastSubscription {
  id: string;
  userId?: string;
  connectionId?: string;
  type: BroadcastType;
  filters: BroadcastFilter[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  lastMessageId?: string;
}

export interface BroadcastMetrics {
  totalBroadcasts: number;
  broadcastsByType: Record<BroadcastType, number>;
  broadcastsByPriority: Record<BroadcastPriority, number>;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  topBroadcasters: Array<{
    userId: string;
    count: number;
    successRate: number;
  }>;
  popularTopics: Array<{
    topic: string;
    messageCount: number;
    subscriberCount: number;
  }>;
  timeSeriesData: Array<{
    timestamp: Date;
    broadcasts: number;
    deliveries: number;
    failures: number;
    averageTime: number;
  }>;
}

export interface BroadcastConfig {
  enablePersistence: boolean;
  retentionDays: number;
  enableFiltering: boolean;
  enablePrioritization: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableExpiration: boolean;
  defaultExpiration: number; // hours
  enableMetrics: boolean;
  metricsInterval: number;
  enableDeduplication: boolean;
  deduplicationWindow: number; // seconds
  enableCompression: boolean;
  compressionLevel: number;
  maxMessageSize: number;
  enableRateLimit: boolean;
  rateLimitPerUser: number;
  rateLimitPerConnection: number;
}

export class RealTimeBroadcastService extends EventEmitter {
  private webSocketServer: WebSocketServer;
  private broadcasts: Map<string, BroadcastMessage> = new Map();
  private subscriptions: Map<string, BroadcastSubscription> = new Map();
  private deliveryQueue: Map<string, BroadcastMessage[]> = new Map();
  private config: BroadcastConfig;
  private metrics: BroadcastMetrics;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(webSocketServer: WebSocketServer, config: BroadcastConfig) {
    super();
    this.webSocketServer = webSocketServer;
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
    this.startProcessing();
    this.startMetricsCollection();
  }

  private validateConfig(config: BroadcastConfig): BroadcastConfig {
    return {
      enablePersistence: config.enablePersistence !== false,
      retentionDays: config.retentionDays || 30,
      enableFiltering: config.enableFiltering !== false,
      enablePrioritization: config.enablePrioritization !== false,
      enableRetry: config.enableRetry !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      enableExpiration: config.enableExpiration !== false,
      defaultExpiration: config.defaultExpiration || 24,
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 60000,
      enableDeduplication: config.enableDeduplication !== false,
      deduplicationWindow: config.deduplicationWindow || 30,
      enableCompression: config.enableCompression || false,
      compressionLevel: config.compressionLevel || 6,
      maxMessageSize: config.maxMessageSize || 1024 * 1024, // 1MB
      enableRateLimit: config.enableRateLimit !== false,
      rateLimitPerUser: config.rateLimitPerUser || 100,
      rateLimitPerConnection: config.rateLimitPerConnection || 50
    };
  }

  private initializeMetrics(): BroadcastMetrics {
    return {
      totalBroadcasts: 0,
      broadcastsByType: {
        global: 0,
        room: 0,
        user: 0,
        role: 0,
        channel: 0,
        topic: 0
      },
      broadcastsByPriority: {
        low: 0,
        normal: 0,
        high: 0,
        urgent: 0
      },
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      deliveryRate: 0,
      averageDeliveryTime: 0,
      topBroadcasters: [],
      popularTopics: [],
      timeSeriesData: []
    };
  }

  private setupEventListeners(): void {
    this.webSocketServer.on('connectionEstablished', (connection: ConnectionInfo) => {
      this.handleNewConnection(connection);
    });

    this.webSocketServer.on('connectionClosed', (connection: ConnectionInfo) => {
      this.handleConnectionClosed(connection);
    });

    this.webSocketServer.on('userAuthenticated', (connection: ConnectionInfo, userId: string) => {
      this.handleUserAuthenticated(connection, userId);
    });
  }

  private handleNewConnection(connection: ConnectionInfo): void {
    // Create default subscriptions for new connections
    this.createSubscription(connection.id, undefined, BroadcastType.GLOBAL);
    
    this.emit('connectionSubscribed', connection);
  }

  private handleConnectionClosed(connection: ConnectionInfo): void {
    // Remove subscriptions for closed connection
    const subscriptionsToRemove: string[] = [];
    
    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      if (subscription.connectionId === connection.id) {
        subscriptionsToRemove.push(subscriptionId);
      }
    }

    subscriptionsToRemove.forEach(id => {
      this.subscriptions.delete(id);
    });

    this.emit('connectionUnsubscribed', connection, subscriptionsToRemove);
  }

  private handleUserAuthenticated(connection: ConnectionInfo, userId: string): void {
    // Update subscriptions with user ID
    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      if (subscription.connectionId === connection.id) {
        subscription.userId = userId;
        this.subscriptions.set(subscriptionId, subscription);
      }
    }

    // Deliver queued messages for this user
    this.deliverQueuedMessages(userId);
  }

  async createBroadcast(data: {
    type: BroadcastType;
    priority?: BroadcastPriority;
    data: any;
    filters?: BroadcastFilter[];
    exclude?: string[];
    metadata?: Record<string, any>;
    expiresAt?: Date;
    createdBy?: string;
    tags?: string[];
  }): Promise<BroadcastMessage> {
    const broadcast: BroadcastMessage = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      priority: data.priority || BroadcastPriority.NORMAL,
      data: data.data,
      filters: data.filters || [],
      exclude: data.exclude || [],
      metadata: data.metadata || {},
      createdAt: new Date(),
      expiresAt: data.expiresAt,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      createdBy: data.createdBy,
      tags: data.tags || []
    };

    // Check for deduplication
    if (this.config.enableDeduplication && this.isDuplicate(broadcast)) {
      this.emit('broadcastDuplicated', broadcast);
      return broadcast;
    }

    // Validate message size
    const messageSize = JSON.stringify(broadcast).length;
    if (messageSize > this.config.maxMessageSize) {
      throw new Error(`Message size (${messageSize}) exceeds maximum (${this.config.maxMessageSize})`);
    }

    this.broadcasts.set(broadcast.id, broadcast);

    if (this.config.enablePersistence) {
      // Add to delivery queue for processing
      this.addToDeliveryQueue(broadcast);
    } else {
      // Process immediately
      await this.processBroadcast(broadcast);
    }

    this.updateMetrics();
    this.emit('broadcastCreated', broadcast);

    return broadcast;
  }

  private isDuplicate(broadcast: BroadcastMessage): boolean {
    const windowStart = Date.now() - (this.config.deduplicationWindow * 1000);
    
    for (const existing of this.broadcasts.values()) {
      if (
        existing.createdAt >= windowStart &&
        existing.type === broadcast.type &&
        JSON.stringify(existing.data) === JSON.stringify(broadcast.data)
      ) {
        return true;
      }
    }
    
    return false;
  }

  private addToDeliveryQueue(broadcast: BroadcastMessage): void {
    const queue = this.deliveryQueue.get(broadcast.type) || [];
    queue.push(broadcast);
    this.deliveryQueue.set(broadcast.type, queue);
  }

  private async processBroadcast(broadcast: BroadcastMessage): Promise<void> {
    try {
      const startTime = Date.now();
      const targetConnections = this.getTargetConnections(broadcast);
      
      let deliveryCount = 0;
      let failureCount = 0;

      for (const connection of targetConnections) {
        try {
          await this.deliverToConnection(connection, broadcast);
          deliveryCount++;
        } catch (error) {
          failureCount++;
          this.log('error', `Failed to deliver broadcast ${broadcast.id} to ${connection.id}:`, error);
        }
      }

      const deliveryTime = Date.now() - startTime;

      // Update metrics
      this.metrics.totalDeliveries += deliveryCount;
      this.metrics.successfulDeliveries += deliveryCount;
      this.metrics.failedDeliveries += failureCount;
      this.updateAverageDeliveryTime(deliveryTime);

      this.emit('broadcastProcessed', broadcast, deliveryCount, failureCount, deliveryTime);

    } catch (error) {
      this.handleBroadcastFailure(broadcast, error);
    }
  }

  private getTargetConnections(broadcast: BroadcastMessage): ConnectionInfo[] {
    const allConnections = await this.webSocketServer.getConnections();
    let targetConnections = allConnections;

    // Apply filters
    if (broadcast.filters && broadcast.filters.length > 0) {
      targetConnections = allConnections.filter(connection => 
        this.passesFilters(connection, broadcast.filters!)
      );
    }

    // Apply exclusions
    if (broadcast.exclude && broadcast.exclude.length > 0) {
      targetConnections = targetConnections.filter(connection => 
        !broadcast.exclude!.includes(connection.userId || '')
      );
    }

    // Apply rate limiting
    if (this.config.enableRateLimit) {
      targetConnections = this.applyRateLimit(targetConnections, broadcast);
    }

    return targetConnections;
  }

  private passesFilters(connection: ConnectionInfo, filters: BroadcastFilter[]): boolean {
    return filters.every(filter => this.evaluateFilter(connection, filter));
  }

  private evaluateFilter(connection: ConnectionInfo, filter: BroadcastFilter): boolean {
    let fieldValue: any;

    switch (filter.field) {
      case 'user_id':
        fieldValue = connection.userId;
        break;
      case 'connection_id':
        fieldValue = connection.id;
        break;
      case 'room_id':
        fieldValue = Array.from(connection.rooms);
        break;
      case 'status':
        fieldValue = connection.status;
        break;
      case 'is_authenticated':
        fieldValue = connection.isAuthenticated;
        break;
      default:
        fieldValue = connection.metadata[filter.field];
        break;
    }

    const filterValue = filter.value;
    const caseSensitive = filter.caseSensitive || false;

    switch (filter.operator) {
      case 'equals':
        return caseSensitive ? fieldValue === filterValue : 
               String(fieldValue).toLowerCase() === String(filterValue).toLowerCase();
      case 'not_equals':
        return caseSensitive ? fieldValue !== filterValue : 
               String(fieldValue).toLowerCase() !== String(filterValue).toLowerCase();
      case 'in':
        return Array.isArray(filterValue) && 
               filterValue.some(val => caseSensitive ? fieldValue === val : 
                              String(fieldValue).toLowerCase() === String(val).toLowerCase());
      case 'not_in':
        return Array.isArray(filterValue) && 
               !filterValue.some(val => caseSensitive ? fieldValue === val : 
                                 String(fieldValue).toLowerCase() === String(val).toLowerCase());
      case 'contains':
        return String(fieldValue).includes(String(filterValue));
      case 'greater_than':
        return Number(fieldValue) > Number(filterValue);
      case 'less_than':
        return Number(fieldValue) < Number(filterValue);
      default:
        return false;
    }
  }

  private applyRateLimit(connections: ConnectionInfo[], broadcast: BroadcastMessage): ConnectionInfo[] {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Count recent broadcasts per connection
    const connectionCounts = new Map<string, number>();
    
    connections.forEach(connection => {
      const count = this.subscriptions.get(connection.id)?.messageCount || 0;
      connectionCounts.set(connection.id, count);
    });

    // Filter based on rate limits
    return connections.filter(connection => {
      const userId = connection.userId;
      const connectionId = connection.id;
      
      const userCount = userId ? this.getUserBroadcastCount(userId, windowStart) : 0;
      const connectionCount = connectionCounts.get(connectionId) || 0;

      return userCount < this.config.rateLimitPerUser && 
             connectionCount < this.config.rateLimitPerConnection;
    });
  }

  private getUserBroadcastCount(userId: string, since: number): number {
    let count = 0;
    
    for (const broadcast of this.broadcasts.values()) {
      if (broadcast.createdBy === userId && broadcast.createdAt.getTime() >= since) {
        count++;
      }
    }
    
    return count;
  }

  private async deliverToConnection(connection: ConnectionInfo, broadcast: BroadcastMessage): Promise<void> {
    if (connection.socket.readyState !== 1) { // WebSocket.OPEN
      throw new Error('Connection not ready');
    }

    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: MessageType.MESSAGE,
      data: {
        broadcastId: broadcast.id,
        type: broadcast.type,
        priority: broadcast.priority,
        data: broadcast.data,
        metadata: broadcast.metadata,
        timestamp: broadcast.createdAt
      },
      timestamp: new Date()
    };

    // Apply compression if enabled
    let messageData = JSON.stringify(message);
    if (this.config.enableCompression) {
      // Simulate compression
      messageData = this.compressMessage(messageData);
    }

    connection.socket.send(messageData);

    // Update subscription activity
    this.updateSubscriptionActivity(connection.id);
  }

  private compressMessage(data: string): string {
    // Simulate compression
    // In a real implementation, use zlib or similar
    return data;
  }

  private updateSubscriptionActivity(connectionId: string): void {
    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      if (subscription.connectionId === connectionId) {
        subscription.lastActivity = new Date();
        subscription.messageCount++;
        this.subscriptions.set(subscriptionId, subscription);
      }
    }
  }

  private handleBroadcastFailure(broadcast: BroadcastMessage, error: any): void {
    broadcast.retryCount++;

    if (broadcast.retryCount < broadcast.maxRetries) {
      // Schedule retry
      setTimeout(() => {
        this.addToDeliveryQueue(broadcast);
      }, this.config.retryDelay * broadcast.retryCount);
    } else {
      // Mark as failed
      this.metrics.failedDeliveries++;
      this.emit('broadcastFailed', broadcast, error);
    }
  }

  private updateAverageDeliveryTime(deliveryTime: number): void {
    const totalDeliveries = this.metrics.totalDeliveries;
    this.metrics.averageDeliveryTime = 
      (this.metrics.averageDeliveryTime * (totalDeliveries - 1) + deliveryTime) / totalDeliveries;
  }

  async createSubscription(data: {
    connectionId?: string;
    userId?: string;
    type: BroadcastType;
    filters?: BroadcastFilter[];
  }): Promise<BroadcastSubscription> {
    const subscription: BroadcastSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      connectionId: data.connectionId,
      userId: data.userId,
      type: data.type,
      filters: data.filters || [],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0
    };

    this.subscriptions.set(subscription.id, subscription);
    this.emit('subscriptionCreated', subscription);

    return subscription;
  }

  async removeSubscription(subscriptionId: string): Promise<boolean> {
    const deleted = this.subscriptions.delete(subscriptionId);
    if (deleted) {
      this.emit('subscriptionRemoved', subscriptionId);
    }
    return deleted;
  }

  async updateSubscription(subscriptionId: string, updates: Partial<BroadcastSubscription>): Promise<BroadcastSubscription | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return null;

    const updatedSubscription = { ...subscription, ...updates };
    this.subscriptions.set(subscriptionId, updatedSubscription);
    this.emit('subscriptionUpdated', updatedSubscription);

    return updatedSubscription;
  }

  private deliverQueuedMessages(userId: string): void {
    const userSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.userId === userId && sub.isActive);

    userSubscriptions.forEach(subscription => {
      const queue = this.deliveryQueue.get(subscription.type) || [];
      const userMessages = queue.filter(msg => 
        !msg.exclude?.includes(userId) && 
        this.passesFiltersForUser(userId, msg.filters || [])
      );

      userMessages.forEach(message => {
        // Deliver queued message
        this.processBroadcast(message);
      });

      // Clear delivered messages from queue
      const remainingQueue = queue.filter(msg => !userMessages.includes(msg));
      this.deliveryQueue.set(subscription.type, remainingQueue);
    });
  }

  private passesFiltersForUser(userId: string, filters: BroadcastFilter[]): boolean {
    // This would need user context to properly evaluate
    // For now, return true as a simplified implementation
    return true;
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processDeliveryQueues();
    }, 1000); // Process every second
  }

  private async processDeliveryQueues(): Promise<void> {
    for (const [broadcastType, queue] of this.deliveryQueue.entries()) {
      if (queue.length === 0) continue;

      // Get broadcasts to process (prioritized by priority and creation time)
      const sortedQueue = queue.sort((a, b) => {
        const priorityOrder = {
          [BroadcastPriority.URGENT]: 4,
          [BroadcastPriority.HIGH]: 3,
          [BroadcastPriority.NORMAL]: 2,
          [BroadcastPriority.LOW]: 1
        };
        
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      // Process a batch of broadcasts
      const batchSize = Math.min(10, sortedQueue.length);
      const batch = sortedQueue.splice(0, batchSize);
      
      for (const broadcast of batch) {
        await this.processBroadcast(broadcast);
      }

      // Update queue
      this.deliveryQueue.set(broadcastType, sortedQueue);
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsInterval);
  }

  private updateMetrics(): void {
    this.metrics.totalBroadcasts = this.broadcasts.size;

    this.metrics.broadcastsByType = {
      global: Array.from(this.broadcasts.values()).filter(b => b.type === BroadcastType.GLOBAL).length,
      room: Array.from(this.broadcasts.values()).filter(b => b.type === BroadcastType.ROOM).length,
      user: Array.from(this.broadcasts.values()).filter(b => b.type === BroadcastType.USER).length,
      role: Array.from(this.broadcasts.values()).filter(b => b.type === BroadcastType.ROLE).length,
      channel: Array.from(this.broadcasts.values()).filter(b => b.type === BroadcastType.CHANNEL).length,
      topic: Array.from(this.broadcasts.values()).filter(b => b.type === BroadcastType.TOPIC).length
    };

    this.metrics.broadcastsByPriority = {
      low: Array.from(this.broadcasts.values()).filter(b => b.priority === BroadcastPriority.LOW).length,
      normal: Array.from(this.broadcasts.values()).filter(b => b.priority === BroadcastPriority.NORMAL).length,
      high: Array.from(this.broadcasts.values()).filter(b => b.priority === BroadcastPriority.HIGH).length,
      urgent: Array.from(this.broadcasts.values()).filter(b => b.priority === BroadcastPriority.URGENT).length
    };

    this.metrics.deliveryRate = this.metrics.totalDeliveries > 0 ? 
      this.metrics.successfulDeliveries / this.metrics.totalDeliveries : 0;

    // Update time series data
    const now = new Date();
    this.metrics.timeSeriesData.push({
      timestamp: now,
      broadcasts: this.metrics.totalBroadcasts,
      deliveries: this.metrics.totalDeliveries,
      failures: this.metrics.failedDeliveries,
      averageTime: this.metrics.averageDeliveryTime
    });

    // Keep only last 24 hours of data
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.metrics.timeSeriesData = this.metrics.timeSeriesData.filter(
      data => data.timestamp >= cutoff
    );
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    console.log(`[BROADCAST] [${level.toUpperCase()}] ${message}`, data || '');
  }

  // Public API methods
  async getBroadcast(broadcastId: string): Promise<BroadcastMessage | null> {
    return this.broadcasts.get(broadcastId) || null;
  }

  async getBroadcasts(filters?: {
    type?: BroadcastType;
    priority?: BroadcastPriority;
    createdBy?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
  }): Promise<BroadcastMessage[]> {
    let broadcasts = Array.from(this.broadcasts.values());

    if (filters) {
      if (filters.type) {
        broadcasts = broadcasts.filter(b => b.type === filters.type);
      }
      if (filters.priority) {
        broadcasts = broadcasts.filter(b => b.priority === filters.priority);
      }
      if (filters.createdBy) {
        broadcasts = broadcasts.filter(b => b.createdBy === filters.createdBy);
      }
      if (filters.startDate) {
        broadcasts = broadcasts.filter(b => b.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        broadcasts = broadcasts.filter(b => b.createdAt <= filters.endDate!);
      }
      if (filters.tags && filters.tags.length > 0) {
        broadcasts = broadcasts.filter(b => 
          filters.tags!.some(tag => b.tags?.includes(tag))
        );
      }
    }

    return broadcasts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSubscription(subscriptionId: string): Promise<BroadcastSubscription | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async getSubscriptions(filters?: {
    userId?: string;
    connectionId?: string;
    type?: BroadcastType;
    isActive?: boolean;
  }): Promise<BroadcastSubscription[]> {
    let subscriptions = Array.from(this.subscriptions.values());

    if (filters) {
      if (filters.userId) {
        subscriptions = subscriptions.filter(s => s.userId === filters.userId);
      }
      if (filters.connectionId) {
        subscriptions = subscriptions.filter(s => s.connectionId === filters.connectionId);
      }
      if (filters.type) {
        subscriptions = subscriptions.filter(s => s.type === filters.type);
      }
      if (filters.isActive !== undefined) {
        subscriptions = subscriptions.filter(s => s.isActive === filters.isActive);
      }
    }

    return subscriptions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMetrics(): Promise<BroadcastMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<BroadcastConfig>): Promise<BroadcastConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<BroadcastConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down broadcast service...');

    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.log('info', 'Broadcast service shutdown complete');
    this.emit('serviceShutdown');
  }
}
