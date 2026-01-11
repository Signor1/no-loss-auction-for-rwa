import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import * as http from 'http';
import * as https from 'https';
import { parse as parseUrl } from 'url';

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export enum MessageType {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  PRESENCE_UPDATE = 'presence_update',
  ROOM_JOIN = 'room_join',
  ROOM_LEAVE = 'room_leave',
  ROOM_MESSAGE = 'room_message',
  HEARTBEAT = 'heartbeat',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  AUTHENTICATE = 'authenticate',
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure'
}

export interface WebSocketMessage {
  id: string;
  type: MessageType;
  data: any;
  timestamp: Date;
  userId?: string;
  roomId?: string;
  metadata?: Record<string, any>;
}

export interface ConnectionInfo {
  id: string;
  userId?: string;
  sessionId: string;
  socket: WebSocket;
  status: ConnectionStatus;
  connectedAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  rooms: Set<string>;
  isAuthenticated: boolean;
  metadata: Record<string, any>;
  pingInterval?: NodeJS.Timeout;
  pongTimeout?: NodeJS.Timeout;
}

export interface RoomInfo {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  maxUsers?: number;
  createdBy: string;
  createdAt: Date;
  members: Set<string>;
  metadata: Record<string, any>;
  settings: RoomSettings;
}

export interface RoomSettings {
  allowAnonymous: boolean;
  requireModeration: boolean;
  messageHistory: boolean;
  maxMessageLength: number;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
}

export interface PresenceInfo {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'invisible';
  lastSeen: Date;
  currentRoom?: string;
  metadata: Record<string, any>;
}

export interface ServerConfig {
  port: number;
  host?: string;
  ssl?: {
    enabled: boolean;
    key?: string;
    cert?: string;
    ca?: string;
  };
  maxConnections: number;
  heartbeatInterval: number;
  pongTimeout: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  enableCompression: boolean;
  enableRateLimiting: boolean;
  rateLimitPerConnection: number;
  enableAuthentication: boolean;
  authTimeout: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  metricsInterval: number;
}

export interface ServerMetrics {
  totalConnections: number;
  activeConnections: number;
  totalRooms: number;
  totalMessages: number;
  messagesPerSecond: number;
  connectionsByStatus: Record<ConnectionStatus, number>;
  topRooms: Array<{
    roomId: string;
    roomName: string;
    memberCount: number;
    messageCount: number;
  }>;
  errorRate: number;
  averageConnectionDuration: number;
  bandwidthUsage: {
    inbound: number;
    outbound: number;
  };
  uptime: number;
}

export class WebSocketServer extends EventEmitter {
  private wss?: WebSocket.Server;
  private server?: http.Server | https.Server;
  private connections: Map<string, ConnectionInfo> = new Map();
  private rooms: Map<string, RoomInfo> = new Map();
  private presence: Map<string, PresenceInfo> = new Map();
  private messageQueue: Map<string, WebSocketMessage[]> = new Map();
  private config: ServerConfig;
  private metrics: ServerMetrics;
  private startTime: Date;
  private heartbeatInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: ServerConfig) {
    super();
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.startTime = new Date();
    this.initializeServer();
    this.startHeartbeat();
    this.startMetricsCollection();
  }

  private validateConfig(config: ServerConfig): ServerConfig {
    return {
      port: config.port || 8080,
      host: config.host || '0.0.0.0',
      ssl: config.ssl || { enabled: false },
      maxConnections: config.maxConnections || 10000,
      heartbeatInterval: config.heartbeatInterval || 30000,
      pongTimeout: config.pongTimeout || 5000,
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 1000,
      enableCompression: config.enableCompression || false,
      enableRateLimiting: config.enableRateLimiting || true,
      rateLimitPerConnection: config.rateLimitPerConnection || 100,
      enableAuthentication: config.enableAuthentication || true,
      authTimeout: config.authTimeout || 10000,
      enableLogging: config.enableLogging || true,
      logLevel: config.logLevel || 'info',
      enableMetrics: config.enableMetrics || true,
      metricsInterval: config.metricsInterval || 60000
    };
  }

  private initializeMetrics(): ServerMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      totalRooms: 0,
      totalMessages: 0,
      messagesPerSecond: 0,
      connectionsByStatus: {
        connecting: 0,
        connected: 0,
        disconnecting: 0,
        disconnected: 0,
        reconnecting: 0,
        error: 0
      },
      topRooms: [],
      errorRate: 0,
      averageConnectionDuration: 0,
      bandwidthUsage: {
        inbound: 0,
        outbound: 0
      },
      uptime: 0
    };
  }

  private initializeServer(): void {
    if (this.config.ssl?.enabled) {
      if (!this.config.ssl.key || !this.config.ssl.cert) {
        throw new Error('SSL enabled but key or certificate not provided');
      }

      this.server = https.createServer({
        key: this.config.ssl.key,
        cert: this.config.ssl.cert,
        ca: this.config.ssl.ca
      });
    } else {
      this.server = http.createServer();
    }

    this.wss = new WebSocket.Server({
      server: this.server,
      maxPayload: 1024 * 1024, // 1MB
      enableCompression: this.config.enableCompression
    });

    this.setupWebSocketServer();
    this.startServer();
  }

  private setupWebSocketServer(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error) => {
      this.log('error', 'WebSocket server error', error);
      this.emit('serverError', error);
    });

    this.wss.on('listening', () => {
      this.log('info', `WebSocket server listening on ${this.config.host}:${this.config.port}`);
      this.emit('serverStarted');
    });
  }

  private startServer(): void {
    if (!this.server) return;

    this.server.listen(this.config.port, this.config.host, () => {
      this.log('info', `Server started on ${this.config.host}:${this.config.port}`);
    });
  }

  private async handleConnection(ws: WebSocket, req: any): Promise<void> {
    const connectionId = this.generateConnectionId();
    const sessionId = this.generateSessionId();
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const connection: ConnectionInfo = {
      id: connectionId,
      sessionId,
      socket: ws,
      status: ConnectionStatus.CONNECTING,
      connectedAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
      rooms: new Set(),
      isAuthenticated: false,
      metadata: {}
    };

    this.connections.set(connectionId, connection);
    this.metrics.totalConnections++;
    this.metrics.connectionsByStatus.connecting++;

    this.log('info', `New connection from ${ipAddress} (${connectionId})`);

    // Setup connection handlers
    this.setupConnectionHandlers(connection);

    // Start authentication timeout if enabled
    if (this.config.enableAuthentication) {
      setTimeout(() => {
        if (!connection.isAuthenticated) {
          this.sendMessage(connection, {
            type: MessageType.AUTH_FAILURE,
            data: { error: 'Authentication timeout' }
          });
          this.disconnect(connection, 'Authentication timeout');
        }
      }, this.config.authTimeout);
    }

    this.emit('connection', connection);
  }

  private setupConnectionHandlers(connection: ConnectionInfo): void {
    const ws = connection.socket;

    ws.on('open', () => {
      connection.status = ConnectionStatus.CONNECTED;
      this.metrics.connectionsByStatus.connecting--;
      this.metrics.connectionsByStatus.connected++;
      this.metrics.activeConnections++;

      this.log('info', `Connection established (${connection.id})`);
      this.emit('connectionEstablished', connection);
    });

    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = this.parseMessage(data.toString());
        await this.handleMessage(connection, message);
      } catch (error) {
        this.log('error', `Message parsing error for ${connection.id}:`, error);
        this.sendError(connection, 'Invalid message format');
      }
    });

    ws.on('close', (code: number, reason: string) => {
      this.handleDisconnection(connection, code, reason);
    });

    ws.on('error', (error) => {
      this.log('error', `WebSocket error for ${connection.id}:`, error);
      connection.status = ConnectionStatus.ERROR;
      this.metrics.connectionsByStatus.error++;
      this.emit('connectionError', connection, error);
    });

    ws.on('pong', () => {
      if (connection.pongTimeout) {
        clearTimeout(connection.pongTimeout);
        connection.pongTimeout = undefined;
      }
      this.log('debug', `Pong received from ${connection.id}`);
    });
  }

  private async handleMessage(connection: ConnectionInfo, message: WebSocketMessage): Promise<void> {
    connection.lastActivity = new Date();

    switch (message.type) {
      case MessageType.AUTHENTICATE:
        await this.handleAuthentication(connection, message.data);
        break;

      case MessageType.MESSAGE:
        await this.handleDirectMessage(connection, message);
        break;

      case MessageType.ROOM_JOIN:
        await this.handleRoomJoin(connection, message);
        break;

      case MessageType.ROOM_LEAVE:
        await this.handleRoomLeave(connection, message);
        break;

      case MessageType.ROOM_MESSAGE:
        await this.handleRoomMessage(connection, message);
        break;

      case MessageType.PRESENCE_UPDATE:
        await this.handlePresenceUpdate(connection, message);
        break;

      case MessageType.PING:
        this.sendMessage(connection, {
          type: MessageType.PONG,
          data: { timestamp: Date.now() }
        });
        break;

      default:
        this.log('warn', `Unknown message type: ${message.type} from ${connection.id}`);
    }
  }

  private async handleAuthentication(connection: ConnectionInfo, data: any): Promise<void> {
    try {
      // Simulate authentication logic
      const { token, userId } = data;

      if (!token) {
        this.sendMessage(connection, {
          type: MessageType.AUTH_FAILURE,
          data: { error: 'Token required' }
        });
        return;
      }

      // Validate token (simplified)
      const isValid = await this.validateToken(token);
      
      if (isValid) {
        connection.userId = userId;
        connection.isAuthenticated = true;
        connection.status = ConnectionStatus.CONNECTED;

        this.sendMessage(connection, {
          type: MessageType.AUTH_SUCCESS,
          data: { userId, sessionId: connection.sessionId }
        });

        // Update presence
        this.updatePresence(userId, {
          status: 'online',
          lastSeen: new Date()
        });

        this.log('info', `User ${userId} authenticated (${connection.id})`);
        this.emit('userAuthenticated', connection, userId);
      } else {
        this.sendMessage(connection, {
          type: MessageType.AUTH_FAILURE,
          data: { error: 'Invalid token' }
        });
      }
    } catch (error) {
      this.log('error', `Authentication error for ${connection.id}:`, error);
      this.sendError(connection, 'Authentication failed');
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    // Simulate token validation
    // In a real implementation, this would validate against a database or auth service
    return token.length > 10; // Simple validation for demo
  }

  private async handleDirectMessage(connection: ConnectionInfo, message: WebSocketMessage): Promise<void> {
    if (!connection.isAuthenticated) {
      this.sendError(connection, 'Authentication required');
      return;
    }

    const targetUserId = message.data?.userId;
    const messageContent = message.data?.content;

    if (!targetUserId || !messageContent) {
      this.sendError(connection, 'Invalid message format');
      return;
    }

    // Find target connection
    const targetConnection = Array.from(this.connections.values())
      .find(conn => conn.userId === targetUserId && conn.isAuthenticated);

    if (targetConnection) {
      this.sendMessage(targetConnection, {
        type: MessageType.MESSAGE,
        data: {
          fromUserId: connection.userId,
          content: messageContent,
          timestamp: new Date()
        }
      });

      this.metrics.totalMessages++;
      this.log('info', `Direct message from ${connection.userId} to ${targetUserId}`);
      this.emit('directMessage', connection, targetConnection, messageContent);
    } else {
      // User not online, queue message
      this.queueMessage(targetUserId, message);
      this.log('info', `Message queued for offline user ${targetUserId}`);
    }
  }

  private async handleRoomJoin(connection: ConnectionInfo, message: WebSocketMessage): Promise<void> {
    if (!connection.isAuthenticated) {
      this.sendError(connection, 'Authentication required');
      return;
    }

    const roomId = message.data?.roomId;
    if (!roomId) {
      this.sendError(connection, 'Room ID required');
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      this.sendError(connection, 'Room not found');
      return;
    }

    if (room.isPrivate && !room.members.has(connection.userId!)) {
      this.sendError(connection, 'Private room access denied');
      return;
    }

    // Leave existing rooms if needed
    for (const existingRoomId of connection.rooms) {
      await this.leaveRoom(connection, existingRoomId);
    }

    // Join new room
    connection.rooms.add(roomId);
    room.members.add(connection.userId!);

    // Notify room members
    this.broadcastToRoom(roomId, {
      type: MessageType.ROOM_JOIN,
      data: {
        userId: connection.userId,
        roomId,
        timestamp: new Date()
      }
    }, connection.id);

    this.log('info', `User ${connection.userId} joined room ${roomId}`);
    this.emit('userJoinedRoom', connection, room);
  }

  private async handleRoomLeave(connection: ConnectionInfo, message: WebSocketMessage): Promise<void> {
    const roomId = message.data?.roomId;
    if (!roomId) return;

    await this.leaveRoom(connection, roomId);
  }

  private async leaveRoom(connection: ConnectionInfo, roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    connection.rooms.delete(roomId);
    room.members.delete(connection.userId!);

    // Notify room members
    this.broadcastToRoom(roomId, {
      type: MessageType.ROOM_LEAVE,
      data: {
        userId: connection.userId,
        roomId,
        timestamp: new Date()
      }
    }, connection.id);

    this.log('info', `User ${connection.userId} left room ${roomId}`);
    this.emit('userLeftRoom', connection, room);
  }

  private async handleRoomMessage(connection: ConnectionInfo, message: WebSocketMessage): Promise<void> {
    if (!connection.isAuthenticated) {
      this.sendError(connection, 'Authentication required');
      return;
    }

    const roomId = message.data?.roomId;
    const content = message.data?.content;

    if (!roomId || !content) {
      this.sendError(connection, 'Invalid room message format');
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room || !room.members.has(connection.userId!)) {
      this.sendError(connection, 'Not in room');
      return;
    }

    // Check rate limits
    if (!this.checkRateLimit(connection, roomId)) {
      this.sendError(connection, 'Rate limit exceeded');
      return;
    }

    // Broadcast to room
    this.broadcastToRoom(roomId, {
      type: MessageType.ROOM_MESSAGE,
      data: {
        fromUserId: connection.userId,
        content,
        roomId,
        timestamp: new Date()
      }
    });

    this.metrics.totalMessages++;
    this.log('info', `Room message in ${roomId} from ${connection.userId}`);
    this.emit('roomMessage', connection, room, content);
  }

  private async handlePresenceUpdate(connection: ConnectionInfo, message: WebSocketMessage): Promise<void> {
    if (!connection.isAuthenticated) {
      this.sendError(connection, 'Authentication required');
      return;
    }

    const presenceData = message.data;
    if (!presenceData) {
      this.sendError(connection, 'Invalid presence data');
      return;
    }

    this.updatePresence(connection.userId!, {
      status: presenceData.status || 'online',
      lastSeen: new Date(),
      currentRoom: presenceData.currentRoom,
      metadata: presenceData.metadata || {}
    });

    // Broadcast presence update
    this.broadcast({
      type: MessageType.PRESENCE_UPDATE,
      data: {
        userId: connection.userId,
        ...presenceData,
        timestamp: new Date()
      }
    });

    this.log('info', `Presence update for ${connection.userId}`);
    this.emit('presenceUpdate', connection, presenceData);
  }

  private broadcast(message: WebSocketMessage, excludeConnectionId?: string): void {
    const messageStr = JSON.stringify(message);
    
    this.connections.forEach((connection, id) => {
      if (id !== excludeConnectionId && connection.isAuthenticated && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(messageStr);
      }
    });
  }

  private broadcastToRoom(roomId: string, message: WebSocketMessage, excludeConnectionId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    room.members.forEach(userId => {
      const connection = Array.from(this.connections.values())
        .find(conn => conn.userId === userId && conn.isAuthenticated);
      
      if (connection && connection.id !== excludeConnectionId && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(messageStr);
      }
    });
  }

  private sendMessage(connection: ConnectionInfo, message: WebSocketMessage): void {
    if (connection.socket.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      connection.socket.send(messageStr);
      this.metrics.bandwidthUsage.outbound += messageStr.length;
    }
  }

  private sendError(connection: ConnectionInfo, error: string): void {
    this.sendMessage(connection, {
      type: MessageType.ERROR,
      data: { error, timestamp: new Date() }
    });
  }

  private queueMessage(userId: string, message: WebSocketMessage): void {
    const queue = this.messageQueue.get(userId) || [];
    queue.push(message);
    this.messageQueue.set(userId, queue);
  }

  private checkRateLimit(connection: ConnectionInfo, roomId: string): boolean {
    if (!this.config.enableRateLimiting) return true;

    // Simplified rate limiting check
    // In a real implementation, this would track messages per time window
    return true;
  }

  private updatePresence(userId: string, presenceData: Partial<PresenceInfo>): void {
    const current = this.presence.get(userId) || {
      userId,
      status: 'offline',
      lastSeen: new Date(),
      metadata: {}
    };

    const updated = { ...current, ...presenceData };
    this.presence.set(userId, updated);
  }

  private parseMessage(data: string): WebSocketMessage {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error('Invalid JSON message');
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(req: any): string {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           'unknown';
  }

  private handleDisconnection(connection: ConnectionInfo, code: number, reason: string): void {
    connection.status = ConnectionStatus.DISCONNECTED;
    this.metrics.activeConnections--;
    this.metrics.connectionsByStatus.connected--;
    this.metrics.connectionsByStatus.disconnected++;

    // Leave all rooms
    for (const roomId of connection.rooms) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.members.delete(connection.userId!);
        
        // Notify room members
        this.broadcastToRoom(roomId, {
          type: MessageType.ROOM_LEAVE,
          data: {
            userId: connection.userId,
            roomId,
            timestamp: new Date()
          }
        }, connection.id);
      }
    }

    // Clear intervals
    if (connection.pingInterval) {
      clearInterval(connection.pingInterval);
    }
    if (connection.pongTimeout) {
      clearTimeout(connection.pongTimeout);
    }

    // Update presence
    if (connection.userId) {
      this.updatePresence(connection.userId, {
        status: 'offline',
        lastSeen: new Date()
      });
    }

    // Remove connection
    this.connections.delete(connection.id);

    const duration = Date.now() - connection.connectedAt.getTime();
    this.updateConnectionDurationMetrics(duration);

    this.log('info', `Connection ${connection.id} disconnected (${code}: ${reason})`);
    this.emit('connectionClosed', connection, code, reason);
  }

  private updateConnectionDurationMetrics(duration: number): void {
    const totalConnections = this.metrics.totalConnections;
    this.metrics.averageConnectionDuration = 
      (this.metrics.averageConnectionDuration * (totalConnections - 1) + duration) / totalConnections;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private sendHeartbeat(): void {
    const heartbeatMessage: WebSocketMessage = {
      id: this.generateConnectionId(),
      type: MessageType.HEARTBEAT,
      data: { timestamp: Date.now() },
      timestamp: new Date()
    };

    this.broadcast(heartbeatMessage);

    // Check for stale connections
    this.connections.forEach((connection, id) => {
      if (connection.isAuthenticated && connection.socket.readyState === WebSocket.OPEN) {
        // Send ping
        this.sendMessage(connection, {
          type: MessageType.PING,
          data: { timestamp: Date.now() }
        });

        // Set pong timeout
        connection.pongTimeout = setTimeout(() => {
          this.log('warn', `Connection ${id} failed to respond to ping`);
          this.disconnect(connection, 'Ping timeout');
        }, this.config.pongTimeout);
      }
    });
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsInterval);
  }

  private updateMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    this.metrics.messagesPerSecond = this.calculateMessagesPerSecond();
    this.metrics.topRooms = this.getTopRooms();
    this.metrics.errorRate = this.calculateErrorRate();
  }

  private calculateMessagesPerSecond(): number {
    // Simplified calculation
    // In a real implementation, this would track messages over time windows
    return this.metrics.totalMessages / (this.metrics.uptime / 1000);
  }

  private getTopRooms(): Array<{
    roomId: string;
    roomName: string;
    memberCount: number;
    messageCount: number;
  }> {
    return Array.from(this.rooms.values())
      .map(room => ({
        roomId: room.id,
        roomName: room.name,
        memberCount: room.members.size,
        messageCount: 0 // Would be tracked separately
      }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 10);
  }

  private calculateErrorRate(): number {
    const totalConnections = this.metrics.totalConnections;
    const errorConnections = this.metrics.connectionsByStatus.error;
    return totalConnections > 0 ? errorConnections / totalConnections : 0;
  }

  private disconnect(connection: ConnectionInfo, reason: string): void {
    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.close(1000, reason);
    }
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.config.enableLogging) return;
    
    const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Public API methods
  async createRoom(data: {
    name: string;
    description?: string;
    isPrivate?: boolean;
    maxUsers?: number;
    createdBy: string;
    settings?: Partial<RoomSettings>;
    metadata?: Record<string, any>;
  }): Promise<RoomInfo> {
    const room: RoomInfo = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate || false,
      maxUsers: data.maxUsers,
      createdBy: data.createdBy,
      createdAt: new Date(),
      members: new Set(),
      metadata: data.metadata || {},
      settings: {
        allowAnonymous: false,
        requireModeration: false,
        messageHistory: true,
        maxMessageLength: 1000,
        rateLimitPerMinute: 10,
        rateLimitPerHour: 100,
        ...data.settings
      }
    };

    this.rooms.set(room.id, room);
    this.metrics.totalRooms++;
    this.emit('roomCreated', room);

    return room;
  }

  async getRoom(roomId: string): Promise<RoomInfo | null> {
    return this.rooms.get(roomId) || null;
  }

  async getRooms(filters?: {
    isPrivate?: boolean;
    createdBy?: string;
    memberCount?: { min?: number; max?: number };
  }): Promise<RoomInfo[]> {
    let rooms = Array.from(this.rooms.values());

    if (filters) {
      if (filters.isPrivate !== undefined) {
        rooms = rooms.filter(r => r.isPrivate === filters.isPrivate);
      }
      if (filters.createdBy) {
        rooms = rooms.filter(r => r.createdBy === filters.createdBy);
      }
      if (filters.memberCount) {
        rooms = rooms.filter(r => {
          const count = r.members.size;
          const min = filters.memberCount!.min || 0;
          const max = filters.memberCount!.max || Infinity;
          return count >= min && count <= max;
        });
      }
    }

    return rooms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getConnection(connectionId: string): Promise<ConnectionInfo | null> {
    return this.connections.get(connectionId) || null;
  }

  async getConnections(filters?: {
    userId?: string;
    status?: ConnectionStatus;
    roomId?: string;
    isAuthenticated?: boolean;
  }): Promise<ConnectionInfo[]> {
    let connections = Array.from(this.connections.values());

    if (filters) {
      if (filters.userId) {
        connections = connections.filter(c => c.userId === filters.userId);
      }
      if (filters.status) {
        connections = connections.filter(c => c.status === filters.status);
      }
      if (filters.roomId) {
        connections = connections.filter(c => c.rooms.has(filters.roomId));
      }
      if (filters.isAuthenticated !== undefined) {
        connections = connections.filter(c => c.isAuthenticated === filters.isAuthenticated);
      }
    }

    return connections.sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());
  }

  async getPresence(userId?: string): Promise<PresenceInfo | null> {
    if (userId) {
      return this.presence.get(userId) || null;
    }
    
    return null;
  }

  async getAllPresence(): Promise<PresenceInfo[]> {
    return Array.from(this.presence.values())
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  async getMetrics(): Promise<ServerMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down WebSocket server...');

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Close all connections
    this.connections.forEach((connection) => {
      this.disconnect(connection, 'Server shutdown');
    });

    // Close server
    if (this.wss) {
      this.wss.close();
    }

    if (this.server) {
      this.server.close();
    }

    this.log('info', 'WebSocket server shutdown complete');
    this.emit('serverShutdown');
  }
}
