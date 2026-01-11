import { EventEmitter } from 'events';
import { WebSocketServer, ConnectionInfo, ConnectionStatus } from './webSocketServer';

export enum AuthenticationMethod {
  TOKEN = 'token',
  JWT = 'jwt',
  API_KEY = 'api_key',
  OAUTH = 'oauth',
  CERTIFICATE = 'certificate'
}

export enum ConnectionRole {
  GUEST = 'guest',
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

export enum Permission {
  READ_MESSAGES = 'read_messages',
  SEND_MESSAGES = 'send_messages',
  JOIN_ROOMS = 'join_rooms',
  CREATE_ROOMS = 'create_rooms',
  MODERATE_ROOMS = 'moderate_rooms',
  BROADCAST_GLOBAL = 'broadcast_global',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  SYSTEM_ADMIN = 'system_admin'
}

export interface AuthenticationChallenge {
  id: string;
  type: AuthenticationMethod;
  data: any;
  expiresAt: Date;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  connectionId: string;
  role: ConnectionRole;
  permissions: Set<Permission>;
  authenticatedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
  isActive: boolean;
}

export interface ConnectionPolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'allow' | 'deny' | 'require_auth' | 'rate_limit';
  actionConfig?: Record<string, any>;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  authenticatedConnections: number;
  connectionsByRole: Record<ConnectionRole, number>;
  connectionsByStatus: Record<ConnectionStatus, number>;
  authenticationAttempts: number;
  authenticationSuccesses: number;
  authenticationFailures: number;
  averageSessionDuration: number;
  topIPAddresses: Array<{
    ipAddress: string;
    connectionCount: number;
    lastSeen: Date;
  }>;
  geoDistribution: Array<{
    country: string;
    connectionCount: number;
    percentage: number;
  }>;
  protocolDistribution: Array<{
    protocol: string;
    connectionCount: number;
    percentage: number;
  }>;
}

export interface ManagementConfig {
  enableAuthentication: boolean;
  defaultAuthMethod: AuthenticationMethod;
  authTimeout: number;
  maxAuthAttempts: number;
  authLockoutDuration: number;
  enableSessionManagement: boolean;
  sessionTimeout: number;
  enableRateLimiting: boolean;
  rateLimitPerIP: number;
  rateLimitPerUser: number;
  enablePolicies: boolean;
  defaultPolicies: string[];
  enableConnectionLimits: boolean;
  maxConnectionsPerUser: number;
  maxConnectionsPerIP: number;
  enableGeoBlocking: boolean;
  blockedCountries: string[];
  enableProtocolRestriction: boolean;
  allowedProtocols: string[];
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  metricsInterval: number;
}

export class ConnectionManagementService extends EventEmitter {
  private webSocketServer: WebSocketServer;
  private challenges: Map<string, AuthenticationChallenge> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private policies: Map<string, ConnectionPolicy> = new Map();
  private connectionLimits: Map<string, number> = new Map(); // IP -> connection count
  private userConnections: Map<string, number> = new Map(); // User -> connection count
  private config: ManagementConfig;
  private metrics: ConnectionMetrics;
  private cleanupInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(webSocketServer: WebSocketServer, config: ManagementConfig) {
    super();
    this.webSocketServer = webSocketServer;
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.setupEventListeners();
    this.initializeDefaultPolicies();
    this.startCleanup();
    this.startMetricsCollection();
  }

  private validateConfig(config: ManagementConfig): ManagementConfig {
    return {
      enableAuthentication: config.enableAuthentication !== false,
      defaultAuthMethod: config.defaultAuthMethod || AuthenticationMethod.TOKEN,
      authTimeout: config.authTimeout || 30000,
      maxAuthAttempts: config.maxAuthAttempts || 5,
      authLockoutDuration: config.authLockoutDuration || 300000, // 5 minutes
      enableSessionManagement: config.enableSessionManagement !== false,
      sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
      enableRateLimiting: config.enableRateLimiting !== false,
      rateLimitPerIP: config.rateLimitPerIP || 10,
      rateLimitPerUser: config.rateLimitPerUser || 5,
      enablePolicies: config.enablePolicies !== false,
      defaultPolicies: config.defaultPolicies || [],
      enableConnectionLimits: config.enableConnectionLimits !== false,
      maxConnectionsPerUser: config.maxConnectionsPerUser || 3,
      maxConnectionsPerIP: config.maxConnectionsPerIP || 10,
      enableGeoBlocking: config.enableGeoBlocking || false,
      blockedCountries: config.blockedCountries || [],
      enableProtocolRestriction: config.enableProtocolRestriction || false,
      allowedProtocols: config.allowedProtocols || ['websocket'],
      enableLogging: config.enableLogging !== false,
      logLevel: config.logLevel || 'info',
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 60000
    };
  }

  private initializeMetrics(): ConnectionMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      authenticatedConnections: 0,
      connectionsByRole: {
        guest: 0,
        user: 0,
        moderator: 0,
        admin: 0,
        system: 0
      },
      connectionsByStatus: {
        connecting: 0,
        connected: 0,
        disconnecting: 0,
        disconnected: 0,
        reconnecting: 0,
        error: 0
      },
      authenticationAttempts: 0,
      authenticationSuccesses: 0,
      authenticationFailures: 0,
      averageSessionDuration: 0,
      topIPAddresses: [],
      geoDistribution: [],
      protocolDistribution: []
    };
  }

  private setupEventListeners(): void {
    this.webSocketServer.on('connection', (connection: ConnectionInfo) => {
      this.handleNewConnection(connection);
    });

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

  private async handleNewConnection(connection: ConnectionInfo): Promise<void> {
    // Check connection limits
    if (!this.checkConnectionLimits(connection)) {
      this.disconnect(connection, 'Connection limit exceeded');
      return;
    }

    // Check geo blocking
    if (this.config.enableGeoBlocking && this.isGeoBlocked(connection)) {
      this.disconnect(connection, 'Geo-blocked location');
      return;
    }

    // Check protocol restrictions
    if (this.config.enableProtocolRestriction && !this.isProtocolAllowed(connection)) {
      this.disconnect(connection, 'Protocol not allowed');
      return;
    }

    // Apply policies
    if (!this.evaluatePolicies(connection)) {
      this.disconnect(connection, 'Policy violation');
      return;
    }

    // Start authentication if enabled
    if (this.config.enableAuthentication) {
      await this.startAuthentication(connection);
    } else {
      // Grant guest access
      await this.grantGuestAccess(connection);
    }
  }

  private checkConnectionLimits(connection: ConnectionInfo): boolean {
    if (!this.config.enableConnectionLimits) return true;

    // Check IP limit
    const ipConnections = this.connectionLimits.get(connection.ipAddress) || 0;
    if (ipConnections >= this.config.maxConnectionsPerIP) {
      this.log('warn', `IP limit exceeded for ${connection.ipAddress}`);
      return false;
    }

    // Check user limit (if authenticated)
    if (connection.userId) {
      const userConnections = this.userConnections.get(connection.userId) || 0;
      if (userConnections >= this.config.maxConnectionsPerUser) {
        this.log('warn', `User limit exceeded for ${connection.userId}`);
        return false;
      }
    }

    return true;
  }

  private isGeoBlocked(connection: ConnectionInfo): boolean {
    if (!this.config.blockedCountries.length) return false;

    // This would require GeoIP lookup
    // For now, return false as placeholder
    return false;
  }

  private isProtocolAllowed(connection: ConnectionInfo): boolean {
    if (!this.config.allowedProtocols.length) return true;

    // This would require protocol detection
    // For now, return true as placeholder
    return true;
  }

  private evaluatePolicies(connection: ConnectionInfo): boolean {
    const activePolicies = Array.from(this.policies.values())
      .filter(policy => policy.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const policy of activePolicies) {
      if (!this.evaluatePolicy(connection, policy)) {
        this.log('warn', `Policy ${policy.name} denied connection ${connection.id}`);
        return false;
      }
    }

    return true;
  }

  private evaluatePolicy(connection: ConnectionInfo, policy: ConnectionPolicy): boolean {
    return policy.rules.every(rule => this.evaluateRule(connection, rule));
  }

  private evaluateRule(connection: ConnectionInfo, rule: PolicyRule): boolean {
    const fieldValue = this.getFieldValue(connection, rule.field);
    const ruleValue = rule.value;

    switch (rule.operator) {
      case 'equals':
        return fieldValue === ruleValue;
      case 'not_equals':
        return fieldValue !== ruleValue;
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(ruleValue));
      case 'greater_than':
        return Number(fieldValue) > Number(ruleValue);
      case 'less_than':
        return Number(fieldValue) < Number(ruleValue);
      default:
        return true;
    }
  }

  private getFieldValue(connection: ConnectionInfo, field: string): any {
    const parts = field.split('.');
    let value: any = connection;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async startAuthentication(connection: ConnectionInfo): Promise<void> {
    const challenge: AuthenticationChallenge = {
      id: this.generateChallengeId(),
      type: this.config.defaultAuthMethod,
      data: this.generateChallengeData(connection),
      expiresAt: new Date(Date.now() + this.config.authTimeout),
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: this.config.maxAuthAttempts,
      isActive: true,
      metadata: {
        connectionId: connection.id,
        ipAddress: connection.ipAddress
      }
    };

    this.challenges.set(challenge.id, challenge);
    this.metrics.authenticationAttempts++;

    // Send challenge to client
    this.sendAuthenticationChallenge(connection, challenge);

    this.log('info', `Authentication challenge sent for connection ${connection.id}`);
    this.emit('authenticationStarted', connection, challenge);
  }

  private generateChallengeData(connection: ConnectionInfo): any {
    switch (this.config.defaultAuthMethod) {
      case AuthenticationMethod.TOKEN:
        return {
          token: this.generateToken(),
          connectionId: connection.id
        };
      case AuthenticationMethod.JWT:
        return {
          jwt: this.generateJWT(connection),
          connectionId: connection.id
        };
      case AuthenticationMethod.API_KEY:
        return {
          apiKey: this.generateApiKey(),
          connectionId: connection.id
        };
      default:
        return {
          challenge: 'authenticate',
          connectionId: connection.id
        };
    }
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  private generateJWT(connection: ConnectionInfo): string {
    // Simplified JWT generation
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: connection.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.signature`;
  }

  private generateApiKey(): string {
    return `ak_${Math.random().toString(36).substr(2, 28)}`;
  }

  private sendAuthenticationChallenge(connection: ConnectionInfo, challenge: AuthenticationChallenge): void {
    const challengeMessage = {
      id: this.generateMessageId(),
      type: 'auth_challenge',
      data: {
        challengeId: challenge.id,
        type: challenge.type,
        data: challenge.data,
        expiresAt: challenge.expiresAt
      },
      timestamp: new Date()
    };

    // This would send through the WebSocket connection
    this.webSocketServer.sendMessage(connection, challengeMessage as any);
  }

  private async grantGuestAccess(connection: ConnectionInfo): Promise<void> {
    const session: UserSession = {
      id: this.generateSessionId(),
      userId: 'guest',
      connectionId: connection.id,
      role: ConnectionRole.GUEST,
      permissions: new Set([Permission.READ_MESSAGES]),
      authenticatedAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionTimeout),
      ipAddress: connection.ipAddress,
      userAgent: connection.userAgent,
      metadata: {},
      isActive: true
    };

    this.sessions.set(session.id, session);
    connection.userId = 'guest';
    connection.isAuthenticated = true;

    this.metrics.authenticatedConnections++;
    this.metrics.connectionsByRole.guest++;

    this.log('info', `Guest access granted for connection ${connection.id}`);
    this.emit('sessionCreated', session);
  }

  private handleConnectionEstablished(connection: ConnectionInfo): void {
    // Update connection limits
    const currentIPCount = this.connectionLimits.get(connection.ipAddress) || 0;
    this.connectionLimits.set(connection.ipAddress, currentIPCount + 1);

    if (connection.userId) {
      const currentUserCount = this.userConnections.get(connection.userId) || 0;
      this.userConnections.set(connection.userId, currentUserCount + 1);
    }

    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
    this.metrics.connectionsByStatus.connected++;
  }

  private handleConnectionClosed(connection: ConnectionInfo, code: number, reason: string): void {
    // Update connection limits
    const currentIPCount = this.connectionLimits.get(connection.ipAddress) || 0;
    this.connectionLimits.set(connection.ipAddress, Math.max(0, currentIPCount - 1));

    if (connection.userId) {
      const currentUserCount = this.userConnections.get(connection.userId) || 0;
      this.userConnections.set(connection.userId, Math.max(0, currentUserCount - 1));
    }

    // Clean up sessions
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.connectionId === connection.id);

    userSessions.forEach(session => {
      session.isActive = false;
      this.sessions.set(session.id, session);
    });

    // Update metrics
    this.metrics.activeConnections--;
    this.metrics.connectionsByStatus.connected--;
    this.metrics.connectionsByStatus.disconnected++;

    if (connection.isAuthenticated) {
      this.metrics.authenticatedConnections--;
      this.metrics.connectionsByRole[connection.role as ConnectionRole]--;
    }

    // Calculate session duration
    if (connection.isAuthenticated && connection.connectedAt) {
      const duration = Date.now() - connection.connectedAt.getTime();
      this.updateAverageSessionDuration(duration);
    }

    this.log('info', `Connection ${connection.id} closed (${code}: ${reason})`);
    this.emit('connectionClosed', connection, code, reason);
  }

  private handleUserAuthenticated(connection: ConnectionInfo, userId: string): Promise<void> {
    // Create user session
    const session: UserSession = {
      id: this.generateSessionId(),
      userId,
      connectionId: connection.id,
      role: ConnectionRole.USER,
      permissions: this.getDefaultPermissions(ConnectionRole.USER),
      authenticatedAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionTimeout),
      ipAddress: connection.ipAddress,
      userAgent: connection.userAgent,
      metadata: {},
      isActive: true
    };

    this.sessions.set(session.id, session);

    // Update connection
    connection.userId = userId;
    connection.isAuthenticated = true;

    // Update metrics
    this.metrics.authenticatedConnections++;
    this.metrics.authenticationSuccesses++;
    this.metrics.connectionsByRole.user++;

    this.log('info', `User ${userId} authenticated (${connection.id})`);
    this.emit('sessionCreated', session);
  }

  private getDefaultPermissions(role: ConnectionRole): Set<Permission> {
    const permissions = {
      [ConnectionRole.GUEST]: new Set([Permission.READ_MESSAGES]),
      [ConnectionRole.USER]: new Set([Permission.READ_MESSAGES, Permission.SEND_MESSAGES, Permission.JOIN_ROOMS]),
      [ConnectionRole.MODERATOR]: new Set([Permission.READ_MESSAGES, Permission.SEND_MESSAGES, Permission.JOIN_ROOMS, Permission.MODERATE_ROOMS]),
      [ConnectionRole.ADMIN]: new Set([Permission.READ_MESSAGES, Permission.SEND_MESSAGES, Permission.JOIN_ROOMS, Permission.CREATE_ROOMS, Permission.MODERATE_ROOMS, Permission.BROADCAST_GLOBAL, Permission.VIEW_ANALYTICS]),
      [ConnectionRole.SYSTEM]: new Set(Object.values(Permission))
    };

    return permissions[role] || new Set();
  }

  private updateAverageSessionDuration(duration: number): void {
    const totalSessions = this.metrics.totalConnections;
    this.metrics.averageSessionDuration = 
      (this.metrics.averageSessionDuration * (totalSessions - 1) + duration) / totalSessions;
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: ConnectionPolicy[] = [
      {
        id: 'policy_rate_limit',
        name: 'Rate Limiting',
        description: 'Limit connections per IP and user',
        rules: [
          {
            field: 'ipAddress',
            operator: 'greater_than',
            value: this.config.rateLimitPerIP,
            action: 'deny'
          },
          {
            field: 'userId',
            operator: 'greater_than',
            value: this.config.rateLimitPerUser,
            action: 'deny'
          }
        ],
        isActive: this.config.enableRateLimiting,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'policy_geo_blocking',
        name: 'Geo Blocking',
        description: 'Block connections from certain countries',
        rules: [
          {
            field: 'country',
            operator: 'in',
            value: this.config.blockedCountries,
            action: 'deny'
          }
        ],
        isActive: this.config.enableGeoBlocking,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredChallenges();
      this.cleanupExpiredSessions();
    }, 60000); // Clean every minute
  }

  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    const expiredChallenges: string[] = [];

    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (challenge.expiresAt.getTime() < now || !challenge.isActive) {
        expiredChallenges.push(challengeId);
      }
    }

    expiredChallenges.forEach(id => {
      this.challenges.delete(id);
    });

    if (expiredChallenges.length > 0) {
      this.log('info', `Cleaned up ${expiredChallenges.length} expired challenges`);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() < now || !session.isActive) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(id => {
      this.sessions.delete(id);
    });

    if (expiredSessions.length > 0) {
      this.log('info', `Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsInterval);
  }

  private updateMetrics(): void {
    // Update connection counts
    this.metrics.activeConnections = Array.from(this.sessions.values())
      .filter(session => session.isActive).length;

    // Update top IP addresses
    const ipCounts = new Map<string, { count: number; lastSeen: Date }>();
    
    this.sessions.forEach(session => {
      const current = ipCounts.get(session.ipAddress) || { count: 0, lastSeen: new Date(0) };
      current.count++;
      if (session.lastActivity > current.lastSeen) {
        current.lastSeen = session.lastActivity;
      }
      ipCounts.set(session.ipAddress, current);
    });

    this.metrics.topIPAddresses = Array.from(ipCounts.entries())
      .map(([ip, data]) => ({
        ipAddress: ip,
        connectionCount: data.count,
        lastSeen: data.lastSeen
      }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 10);
  }

  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private disconnect(connection: ConnectionInfo, reason: string): void {
    if (connection.socket.readyState === 1) { // WebSocket.OPEN
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
  async createPolicy(data: {
    name: string;
    description: string;
    rules: PolicyRule[];
    priority?: number;
  }): Promise<ConnectionPolicy> {
    const policy: ConnectionPolicy = {
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      rules: data.rules,
      isActive: true,
      priority: data.priority || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.policies.set(policy.id, policy);
    this.emit('policyCreated', policy);

    return policy;
  }

  async updatePolicy(policyId: string, updates: Partial<ConnectionPolicy>): Promise<ConnectionPolicy | null> {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const updatedPolicy = { 
      ...policy, 
      ...updates,
      updatedAt: new Date()
    };

    this.policies.set(policyId, updatedPolicy);
    this.emit('policyUpdated', updatedPolicy);

    return updatedPolicy;
  }

  async getPolicy(policyId: string): Promise<ConnectionPolicy | null> {
    return this.policies.get(policyId) || null;
  }

  async getPolicies(filters?: {
    isActive?: boolean;
    priority?: number;
  }): Promise<ConnectionPolicy[]> {
    let policies = Array.from(this.policies.values());

    if (filters) {
      if (filters.isActive !== undefined) {
        policies = policies.filter(p => p.isActive === filters.isActive);
      }
      if (filters.priority !== undefined) {
        policies = policies.filter(p => p.priority === filters.priority);
      }
    }

    return policies.sort((a, b) => a.priority - b.priority);
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessions(filters?: {
    userId?: string;
    connectionId?: string;
    role?: ConnectionRole;
    isActive?: boolean;
  }): Promise<UserSession[]> {
    let sessions = Array.from(this.sessions.values());

    if (filters) {
      if (filters.userId) {
        sessions = sessions.filter(s => s.userId === filters.userId);
      }
      if (filters.connectionId) {
        sessions = sessions.filter(s => s.connectionId === filters.connectionId);
      }
      if (filters.role) {
        sessions = sessions.filter(s => s.role === filters.role);
      }
      if (filters.isActive !== undefined) {
        sessions = sessions.filter(s => s.isActive === filters.isActive);
      }
    }

    return sessions.sort((a, b) => b.authenticatedAt.getTime() - a.authenticatedAt.getTime());
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<UserSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updatedSession = { 
      ...session, 
      ...updates,
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, updatedSession);
    this.emit('sessionUpdated', updatedSession);

    return updatedSession;
  }

  async revokeSession(sessionId: string, reason?: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.isActive = false;
    this.sessions.set(sessionId, session);

    // Disconnect associated connection
    const connection = Array.from(this.webSocketServer.getConnections() || [])
      .find(conn => conn.id === session.connectionId);

    if (connection) {
      this.disconnect(connection, reason || 'Session revoked');
    }

    this.emit('sessionRevoked', session, reason);
    return true;
  }

  async getMetrics(): Promise<ConnectionMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<ManagementConfig>): Promise<ManagementConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<ManagementConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Shutting down connection management service...');

    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Revoke all sessions
    const sessions = Array.from(this.sessions.values());
    for (const session of sessions) {
      await this.revokeSession(session.id, 'Service shutdown');
    }

    this.log('info', 'Connection management service shutdown complete');
    this.emit('serviceShutdown');
  }
}
