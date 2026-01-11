import { EventEmitter } from 'events';
import { WebSocketServer, ConnectionInfo } from './webSocketServer';

export enum QueueType {
  FIFO = 'fifo',
  PRIORITY = 'priority',
  DELAYED = 'delayed',
  BROADCAST = 'broadcast',
  PERSISTENT = 'persistent'
}

export enum MessageStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum QueuePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

export interface QueuedMessage {
  id: string;
  type: QueueType;
  priority: QueuePriority;
  status: MessageStatus;
  data: any;
  targetUserId?: string;
  targetConnectionId?: string;
  targetRoomId?: string;
  senderId?: string;
  senderConnectionId?: string;
  createdAt: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  deliveredAt?: Date;
  retryCount: number;
  maxRetries: number;
  delayUntil?: Date;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface QueueMetrics {
  totalMessages: number;
  messagesByType: Record<QueueType, number>;
  messagesByStatus: Record<MessageStatus, number>;
  messagesByPriority: Record<QueuePriority, number>;
  averageQueueTime: number;
  averageProcessingTime: number;
  deliveryRate: number;
  failureRate: number;
  queueSize: number;
  processingRate: number;
  throughput: number;
  oldestMessage?: Date;
  newestMessage?: Date;
  topSenders: Array<{
    senderId: string;
    messageCount: number;
    successRate: number;
  }>;
  timeSeriesData: Array<{
    timestamp: Date;
    queued: number;
    processed: number;
    delivered: number;
    failed: number;
    queueSize: number;
  }>;
}

export interface QueueConfig {
  enablePersistence: boolean;
  storageLocation: string;
  maxQueueSize: number;
  enablePriority: boolean;
  enableDelay: boolean;
  maxDelayTime: number; // minutes
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
  enableExpiration: boolean;
  defaultExpiration: number; // minutes
  enableBatching: boolean;
  batchSize: number;
  batchTimeout: number; // milliseconds
  enableCompression: boolean;
  compressionLevel: number;
  enableDeduplication: boolean;
  deduplicationWindow: number; // seconds
  enableMetrics: boolean;
  metricsInterval: number;
  enableDeadLetterQueue: boolean;
  deadLetterMaxSize: number;
}

export interface DeadLetterMessage {
  id: string;
  originalMessageId: string;
  error: string;
  failureReason: string;
  originalMessage: QueuedMessage;
  failedAt: Date;
  retryCount: number;
  metadata?: Record<string, any>;
}

export class MessageQueuingService extends EventEmitter {
  private webSocketServer: WebSocketServer;
  private queues: Map<QueueType, QueuedMessage[]> = new Map();
  private deadLetterQueue: DeadLetterMessage[] = [];
  private config: QueueConfig;
  private metrics: QueueMetrics;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private batchProcessor?: NodeJS.Timeout;

  constructor(webSocketServer: WebSocketServer, config: QueueConfig) {
    super();
    this.webSocketServer = webSocketServer;
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.initializeQueues();
    this.setupEventListeners();
    this.startProcessing();
    this.startMetricsCollection();
  }

  private validateConfig(config: QueueConfig): QueueConfig {
    return {
      enablePersistence: config.enablePersistence !== false,
      storageLocation: config.storageLocation || './queue_data',
      maxQueueSize: config.maxQueueSize || 10000,
      enablePriority: config.enablePriority !== false,
      enableDelay: config.enableDelay !== false,
      maxDelayTime: config.maxDelayTime || 1440, // 24 hours
      enableRetry: config.enableRetry !== false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      enableExpiration: config.enableExpiration !== false,
      defaultExpiration: config.defaultExpiration || 60, // 1 hour
      enableBatching: config.enableBatching !== false,
      batchSize: config.batchSize || 100,
      batchTimeout: config.batchTimeout || 5000,
      enableCompression: config.enableCompression || false,
      compressionLevel: config.compressionLevel || 6,
      enableDeduplication: config.enableDeduplication !== false,
      deduplicationWindow: config.deduplicationWindow || 300, // 5 minutes
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 60000,
      enableDeadLetterQueue: config.enableDeadLetterQueue !== false,
      deadLetterMaxSize: config.deadLetterMaxSize || 1000
    };
  }

  private initializeMetrics(): QueueMetrics {
    return {
      totalMessages: 0,
      messagesByType: {
        fifo: 0,
        priority: 0,
        delayed: 0,
        broadcast: 0,
        persistent: 0
      },
      messagesByStatus: {
        queued: 0,
        processing: 0,
        delivered: 0,
        failed: 0,
        expired: 0,
        cancelled: 0
      },
      messagesByPriority: {
        [QueuePriority.LOW]: 0,
        [QueuePriority.NORMAL]: 0,
        [QueuePriority.HIGH]: 0,
        [QueuePriority.URGENT]: 0,
        [QueuePriority.CRITICAL]: 0
      },
      averageQueueTime: 0,
      averageProcessingTime: 0,
      deliveryRate: 0,
      failureRate: 0,
      queueSize: 0,
      processingRate: 0,
      throughput: 0,
      oldestMessage: undefined,
      newestMessage: undefined,
      topSenders: [],
      timeSeriesData: []
    };
  }

  private initializeQueues(): void {
    // Initialize all queue types
    Object.values(QueueType).forEach(type => {
      this.queues.set(type, []);
    });
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
  }

  private handleConnectionEstablished(connection: ConnectionInfo): void {
    // Process any queued messages for this user
    this.processQueuedMessagesForUser(connection.userId);
  }

  private handleConnectionClosed(connection: ConnectionInfo): void {
    // Mark any in-flight messages for this connection as failed
    this.markInFlightMessagesAsFailed(connection.id);
  }

  private handleUserAuthenticated(connection: ConnectionInfo, userId: string): void {
    // Process any queued messages for this user
    this.processQueuedMessagesForUser(userId);
  }

  private processQueuedMessagesForUser(userId?: string): void {
    if (!userId) return;

    // Get all queues and find messages for this user
    const userMessages: QueuedMessage[] = [];

    for (const [queueType, messages] of this.queues.entries()) {
      const userQueueMessages = messages.filter(msg => 
        msg.targetUserId === userId && 
        msg.status === MessageStatus.QUEUED
      );
      userMessages.push(...userQueueMessages);
    }

    // Sort by priority and creation time
    userMessages.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Process messages
    for (const message of userMessages) {
      this.processMessage(message);
    }
  }

  async enqueueMessage(data: {
    type: QueueType;
    priority?: QueuePriority;
    data: any;
    targetUserId?: string;
    targetConnectionId?: string;
    targetRoomId?: string;
    senderId?: string;
    senderConnectionId?: string;
    scheduledAt?: Date;
    expiresAt?: Date;
    delayUntil?: Date;
    metadata?: Record<string, any>;
    tags?: string[];
  }): Promise<QueuedMessage> {
    const message: QueuedMessage = {
      id: this.generateMessageId(),
      type: data.type,
      priority: data.priority || QueuePriority.NORMAL,
      status: MessageStatus.QUEUED,
      data: data.data,
      targetUserId: data.targetUserId,
      targetConnectionId: data.targetConnectionId,
      targetRoomId: data.targetRoomId,
      senderId: data.senderId,
      senderConnectionId: data.senderConnectionId,
      createdAt: new Date(),
      scheduledAt: data.scheduledAt,
      expiresAt: data.expiresAt,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      delayUntil: data.delayUntil,
      metadata: data.metadata || {},
      tags: data.tags || []
    };

    // Check for deduplication
    if (this.config.enableDeduplication && this.isDuplicate(message)) {
      this.emit('messageDuplicated', message);
      return message;
    }

    // Check queue size limits
    const queue = this.queues.get(message.type) || [];
    if (queue.length >= this.config.maxQueueSize) {
      // Add to dead letter queue
      this.addToDeadLetterQueue(message, 'Queue full');
      this.emit('messageRejected', message, 'Queue full');
      return message;
    }

    // Add to appropriate queue
    queue.push(message);
    this.queues.set(message.type, queue);

    this.updateMetrics();
    this.emit('messageQueued', message);

    return message;
  }

  private isDuplicate(message: QueuedMessage): boolean {
    const windowStart = Date.now() - (this.config.deduplicationWindow * 1000);
    
    for (const queue of this.queues.values()) {
      for (const existing of queue) {
        if (
          existing.createdAt >= windowStart &&
          existing.targetUserId === message.targetUserId &&
          JSON.stringify(existing.data) === JSON.stringify(message.data)
        ) {
          return true;
        }
      }
    }
    
    return false;
  }

  private async processMessage(message: QueuedMessage): Promise<void> {
    try {
      message.status = MessageStatus.PROCESSING;

      // Check if message is expired
      if (this.config.enableExpiration && message.expiresAt && message.expiresAt < new Date()) {
        message.status = MessageStatus.EXPIRED;
        this.addToDeadLetterQueue(message, 'Message expired');
        return;
      }

      // Check if message is delayed
      if (message.delayUntil && message.delayUntil > new Date()) {
        return; // Skip processing, will be processed later
      }

      // Get target connection
      const targetConnection = await this.getTargetConnection(message);
      
      if (!targetConnection) {
        // User not online, keep in queue
        return;
      }

      // Deliver message
      await this.deliverMessage(message, targetConnection);
      message.status = MessageStatus.DELIVERED;
      message.deliveredAt = new Date();

      this.updateMetrics();
      this.emit('messageDelivered', message, targetConnection);

    } catch (error) {
      message.status = MessageStatus.FAILED;
      message.retryCount++;

      if (message.retryCount < message.maxRetries) {
        // Schedule retry
        setTimeout(() => {
          this.processMessage(message);
        }, this.config.retryDelay * message.retryCount);
      } else {
        // Max retries reached, add to dead letter queue
        this.addToDeadLetterQueue(message, error instanceof Error ? error.message : String(error));
        this.emit('messageFailed', message, error);
      }
    }
  }

  private async getTargetConnection(message: QueuedMessage): Promise<ConnectionInfo | null> {
    if (message.targetConnectionId) {
      const connections = await this.webSocketServer.getConnections();
      return connections.find(conn => conn.id === message.targetConnectionId) || null;
    }

    if (message.targetUserId) {
      const connections = await this.webSocketServer.getConnections();
      return connections.find(conn => conn.userId === message.targetUserId && conn.isAuthenticated) || null;
    }

    return null;
  }

  private async deliverMessage(message: QueuedMessage, targetConnection: ConnectionInfo): Promise<void> {
    const messageData = {
      messageId: message.id,
      type: message.type,
      priority: message.priority,
      data: message.data,
      senderId: message.senderId,
      timestamp: message.createdAt,
      metadata: message.metadata
    };

    // Send through WebSocket server
    this.webSocketServer.sendMessage(targetConnection, messageData as any);
  }

  private markInFlightMessagesAsFailed(connectionId: string): void {
    for (const queue of this.queues.values()) {
      const inFlightMessages = queue.filter(msg => 
        msg.status === MessageStatus.PROCESSING &&
        (msg.targetConnectionId === connectionId || 
         (msg.senderConnectionId === connectionId))
      );

      inFlightMessages.forEach(message => {
        message.status = MessageStatus.FAILED;
        message.retryCount = message.maxRetries; // Mark as max retries
        this.addToDeadLetterQueue(message, 'Connection closed');
      });
    }
  }

  private addToDeadLetterQueue(message: QueuedMessage, reason: string): void {
    if (!this.config.enableDeadLetterQueue) return;

    const deadLetterMessage: DeadLetterMessage = {
      id: this.generateMessageId(),
      originalMessageId: message.id,
      error: reason,
      failureReason: reason,
      originalMessage: message,
      failedAt: new Date(),
      retryCount: message.retryCount,
      metadata: {
        originalQueue: message.type,
        originalPriority: message.priority,
        queueSize: this.queues.get(message.type)?.length || 0
      }
    };

    this.deadLetterQueue.push(deadLetterMessage);

    // Trim dead letter queue if it exceeds max size
    if (this.deadLetterQueue.length > this.config.deadLetterMaxSize) {
      this.deadLetterQueue = this.deadLetterQueue.slice(-this.config.deadLetterMaxSize);
    }

    this.emit('deadLetterMessageAdded', deadLetterMessage);
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processAllQueues();
    }, 1000); // Process every second

    if (this.config.enableBatching) {
      this.batchProcessor = setInterval(() => {
        this.processBatchMessages();
      }, this.config.batchTimeout);
    }
  }

  private async processAllQueues(): Promise<void> {
    for (const [queueType, messages] of this.queues.entries()) {
      const processableMessages = messages.filter(msg => 
        msg.status === MessageStatus.QUEUED &&
        (!msg.delayUntil || msg.delayUntil <= new Date())
      );

      if (processableMessages.length === 0) continue;

      // Sort by priority and creation time
      processableMessages.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      // Process a batch of messages
      const batchSize = Math.min(this.config.batchSize, processableMessages.length);
      const batch = processableMessages.splice(0, batchSize);

      for (const message of batch) {
        await this.processMessage(message);
      }
    }
  }

  private async processBatchMessages(): Promise<void> {
    // Collect all messages from all queues for batch processing
    const allMessages: QueuedMessage[] = [];

    for (const messages of this.queues.values()) {
      const batchMessages = messages.filter(msg => 
        msg.status === MessageStatus.QUEUED &&
        (!msg.delayUntil || msg.delayUntil <= new Date())
      );
      allMessages.push(...batchMessages);
    }

    if (allMessages.length === 0) return;

    // Sort by priority and creation time
    allMessages.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Process in batches
    const batchSize = Math.min(this.config.batchSize, allMessages.length);
    const batch = allMessages.splice(0, batchSize);

    const promises = batch.map(message => this.processMessage(message));
    await Promise.allSettled(promises);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsInterval);
  }

  private updateMetrics(): void {
    // Count total messages across all queues
    this.metrics.totalMessages = 0;
    this.metrics.queueSize = 0;

    for (const [queueType, messages] of this.queues.entries()) {
      this.metrics.messagesByType[queueType] = messages.length;
      this.metrics.queueSize += messages.length;

      messages.forEach(message => {
        this.metrics.messagesByStatus[message.status]++;
        this.metrics.messagesByPriority[message.priority]++;
      });
    }

    // Calculate rates
    const totalProcessed = this.metrics.messagesByStatus.delivered + 
                           this.metrics.messagesByStatus.failed + 
                           this.metrics.messagesByStatus.expired;
    this.metrics.deliveryRate = totalProcessed > 0 ? 
      this.metrics.messagesByStatus.delivered / totalProcessed : 0;
    this.metrics.failureRate = totalProcessed > 0 ? 
      (this.metrics.messagesByStatus.failed + this.metrics.messagesByStatus.expired) / totalProcessed : 0;

    // Update oldest and newest messages
    const allMessages = Array.from(this.queues.values()).flat();
    if (allMessages.length > 0) {
      const sortedMessages = allMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      this.metrics.oldestMessage = sortedMessages[0].createdAt;
      this.metrics.newestMessage = sortedMessages[sortedMessages.length - 1].createdAt;
    }

    // Update top senders
    const senderCounts = new Map<string, { count: number; success: number; }>();
    allMessages.forEach(message => {
      if (message.senderId) {
        const current = senderCounts.get(message.senderId) || { count: 0, success: 0 };
        current.count++;
        if (message.status === MessageStatus.DELIVERED) {
          current.success++;
        }
        senderCounts.set(message.senderId, current);
      }
    });

    this.metrics.topSenders = Array.from(senderCounts.entries())
      .map(([senderId, data]) => ({
        senderId,
        messageCount: data.count,
        successRate: data.count > 0 ? data.success / data.count : 0
      }))
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 10);

    // Update time series data
    this.metrics.timeSeriesData.push({
      timestamp: new Date(),
      queued: this.metrics.messagesByStatus.queued,
      processed: this.metrics.messagesByStatus.processing,
      delivered: this.metrics.messagesByStatus.delivered,
      failed: this.metrics.messagesByStatus.failed,
      queueSize: this.metrics.queueSize
    });

    // Keep only last 24 hours of data
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics.timeSeriesData = this.metrics.timeSeriesData.filter(
      data => data.timestamp >= cutoff
    );
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  async getMessage(messageId: string): Promise<QueuedMessage | null> {
    for (const queue of this.queues.values()) {
      const message = queue.find(msg => msg.id === messageId);
      if (message) return message;
    }
    return null;
  }

  async getMessages(filters?: {
    type?: QueueType;
    status?: MessageStatus;
    targetUserId?: string;
    senderId?: string;
    priority?: QueuePriority;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
  }): Promise<QueuedMessage[]> {
    let messages: QueuedMessage[] = [];

    if (filters?.type) {
      messages = this.queues.get(filters.type) || [];
    } else {
      // Get messages from all queues
      for (const queue of this.queues.values()) {
        messages.push(...queue);
      }
    }

    if (filters) {
      if (filters.status) {
        messages = messages.filter(m => m.status === filters.status);
      }
      if (filters.targetUserId) {
        messages = messages.filter(m => m.targetUserId === filters.targetUserId);
      }
      if (filters.senderId) {
        messages = messages.filter(m => m.senderId === filters.senderId);
      }
      if (filters.priority) {
        messages = messages.filter(m => m.priority === filters.priority);
      }
      if (filters.startDate) {
        messages = messages.filter(m => m.createdAt >= filters.startDate!);
      }
      if (filters.endDate) {
        messages = messages.filter(m => m.createdAt <= filters.endDate!);
      }
      if (filters.tags && filters.tags.length > 0) {
        messages = messages.filter(m => 
          filters.tags!.some(tag => m.tags?.includes(tag))
        );
      }
    }

    return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDeadLetterMessages(limit?: number): Promise<DeadLetterMessage[]> {
    const messages = this.deadLetterQueue.slice(0, limit || 100);
    return messages.sort((a, b) => b.failedAt.getTime() - a.failedAt.getTime());
  }

  async retryDeadLetterMessage(messageId: string): Promise<boolean> {
    const deadLetterMessage = this.deadLetterQueue.find(msg => msg.originalMessageId === messageId);
    if (!deadLetterMessage) return false;

    // Remove from dead letter queue
    const index = this.deadLetterQueue.indexOf(deadLetterMessage);
    this.deadLetterQueue.splice(index, 1);

    // Reset message and re-enqueue
    const originalMessage = deadLetterMessage.originalMessage;
    originalMessage.retryCount = 0;
    originalMessage.status = MessageStatus.QUEUED;

    const queue = this.queues.get(originalMessage.type) || [];
    queue.push(originalMessage);

    this.emit('deadLetterMessageRetried', deadLetterMessage, originalMessage);
    return true;
  }

  async getMetrics(): Promise<QueueMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<QueueConfig>): Promise<QueueConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<QueueConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down message queuing service...');

    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Move all in-flight messages to dead letter queue
    for (const queue of this.queues.values()) {
      const inFlightMessages = queue.filter(msg => msg.status === MessageStatus.PROCESSING);
      inFlightMessages.forEach(message => {
        this.addToDeadLetterQueue(message, 'Service shutdown');
      });
    }

    this.log('info', 'Message queuing service shutdown complete');
    this.emit('serviceShutdown');
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    console.log(`[QUEUE] [${level.toUpperCase()}] ${message}`, data || '');
  }
}
