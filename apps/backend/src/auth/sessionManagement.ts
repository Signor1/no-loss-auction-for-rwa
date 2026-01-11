import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';

// Enums
export enum SessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  SUSPENDED = 'suspended'
}

export enum SessionType {
  WEB = 'web',
  MOBILE = 'mobile',
  API = 'api',
  WALLET = 'wallet',
  OAUTH = 'oauth'
}

export enum TerminationReason {
  LOGOUT = 'logout',
  TIMEOUT = 'timeout',
  SECURITY = 'security',
  ADMIN = 'admin',
  TOKEN_EXPIRED = 'token_expired',
  DEVICE_CHANGE = 'device_change',
  LOCATION_CHANGE = 'location_change',
  CONCURRENT_LIMIT = 'concurrent_limit'
}

// Interfaces
export interface UserSession {
  id: string;
  userId: string;
  sessionId: string;
  type: SessionType;
  status: SessionStatus;
  
  // Authentication
  accessTokenId?: string;
  refreshTokenId?: string;
  walletAddress?: string;
  authMethod: 'jwt' | 'wallet' | 'oauth' | 'mfa';
  
  // Device information
  deviceId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  deviceName?: string;
  platform?: string;
  browser?: string;
  version?: string;
  
  // Network information
  ipAddress: string;
  userAgent: string;
  country?: string;
  city?: string;
  timezone?: string;
  isp?: string;
  
  // Timing
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  terminatedAt?: Date;
  
  // Activity tracking
  activityCount: number;
  totalDuration: number; // milliseconds
  averageSessionDuration: number;
  
  // Security
  isTrusted: boolean;
  riskScore: number;
  securityFlags: string[];
  mfaVerified: boolean;
  
  // Geographic tracking
  initialLocation: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  currentLocation?: {
    country?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Metadata
  metadata: Record<string, any>;
}

export interface SessionConfig {
  defaultExpiry: number; // minutes
  maxExpiry: number; // minutes
  inactivityTimeout: number; // minutes
  maxConcurrentSessions: number;
  enableGeographicTracking: boolean;
  enableDeviceTracking: boolean;
  enableRiskScoring: boolean;
  enableSessionPersistence: boolean;
  enableSecurityMonitoring: boolean;
  riskThreshold: number;
  trustedDeviceExpiry: number; // days
  enableSessionAnalytics: boolean;
  enableSessionCleanup: boolean;
  cleanupInterval: number; // minutes
}

export interface SessionAnalytics {
  period: { start: Date; end: Date };
  
  // Volume metrics
  totalSessions: number;
  activeSessions: number;
  newSessions: number;
  terminatedSessions: number;
  
  // Type distribution
  sessionsByType: Record<SessionType, number>;
  sessionsByAuthMethod: Record<string, number>;
  
  // Duration metrics
  averageSessionDuration: number;
  totalSessionDuration: number;
  longestSession: number;
  shortestSession: number;
  
  // Geographic metrics
  sessionsByCountry: Record<string, number>;
  sessionsByCity: Record<string, number>;
  locationChanges: number;
  
  // Device metrics
  sessionsByDeviceType: Record<string, number>;
  sessionsByPlatform: Record<string, number>;
  trustedDeviceSessions: number;
  
  // Security metrics
  highRiskSessions: number;
  terminatedForSecurity: number;
  mfaVerifiedSessions: number;
  
  // Activity metrics
  averageActivityPerSession: number;
  mostActiveHours: {
    hour: number;
    sessionCount: number;
  }[];
  
  // Trends
  sessionsOverTime: {
    date: Date;
    sessions: number;
    active: number;
  }[];
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  userId: string;
  type: 'created' | 'updated' | 'terminated' | 'suspended' | 'resumed';
  timestamp: Date;
  data: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Main Session Management Service
export class SessionManagementService extends EventEmitter {
  private sessions: Map<string, UserSession> = new Map();
  private userSessions: Map<string, string[]> = new Map();
  private trustedDevices: Map<string, { userId: string; expiresAt: Date }> = new Map();
  private sessionEvents: Map<string, SessionEvent[]> = new Map();
  private config: SessionConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<SessionConfig>) {
    super();
    this.config = {
      defaultExpiry: 24 * 60, // 24 hours
      maxExpiry: 30 * 24 * 60, // 30 days
      inactivityTimeout: 30, // 30 minutes
      maxConcurrentSessions: 5,
      enableGeographicTracking: true,
      enableDeviceTracking: true,
      enableRiskScoring: true,
      enableSessionPersistence: true,
      enableSecurityMonitoring: true,
      riskThreshold: 0.7,
      trustedDeviceExpiry: 30, // 30 days
      enableSessionAnalytics: true,
      enableSessionCleanup: true,
      cleanupInterval: 15, // 15 minutes
      ...config
    };
  }

  // Session Creation
  async createSession(
    userId: string,
    type: SessionType,
    authMethod: UserSession['authMethod'],
    context: {
      deviceId: string;
      deviceType: UserSession['deviceType'];
      deviceName?: string;
      platform?: string;
      browser?: string;
      version?: string;
      ipAddress: string;
      userAgent: string;
      country?: string;
      city?: string;
      timezone?: string;
      coordinates?: { lat: number; lng: number };
    },
    options: {
      accessTokenId?: string;
      refreshTokenId?: string;
      walletAddress?: string;
      expiry?: number; // minutes
      isTrusted?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<UserSession> {
    // Check concurrent session limit
    await this.checkConcurrentSessionLimit(userId);

    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiry = Math.min(
      options.expiry || this.config.defaultExpiry,
      this.config.maxExpiry
    );

    const session: UserSession = {
      id: this.generateId(),
      userId,
      sessionId,
      type,
      status: SessionStatus.ACTIVE,
      accessTokenId: options.accessTokenId,
      refreshTokenId: options.refreshTokenId,
      walletAddress: options.walletAddress,
      authMethod,
      deviceId: context.deviceId,
      deviceType: context.deviceType,
      deviceName: context.deviceName,
      platform: context.platform,
      browser: context.browser,
      version: context.version,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      country: context.country,
      city: context.city,
      timezone: context.timezone,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + expiry * 60 * 1000),
      activityCount: 0,
      totalDuration: 0,
      averageSessionDuration: 0,
      isTrusted: options.isTrusted || false,
      riskScore: 0,
      securityFlags: [],
      mfaVerified: false,
      initialLocation: {
        country: context.country,
        city: context.city,
        coordinates: context.coordinates
      },
      currentLocation: {
        country: context.country,
        city: context.city,
        coordinates: context.coordinates
      },
      metadata: options.metadata || {}
    };

    // Calculate risk score if enabled
    if (this.config.enableRiskScoring) {
      session.riskScore = await this.calculateRiskScore(session, context);
    }

    // Check if device is trusted
    if (this.isDeviceTrusted(context.deviceId, userId)) {
      session.isTrusted = true;
    }

    // Store session
    this.sessions.set(session.sessionId, session);
    
    // Update user sessions index
    const userSessionIds = this.userSessions.get(userId) || [];
    userSessionIds.push(session.sessionId);
    this.userSessions.set(userId, userSessionIds);

    // Record session event
    await this.recordSessionEvent(session.sessionId, userId, 'created', {
      authMethod,
      deviceType: context.deviceType,
      ipAddress: context.ipAddress,
      riskScore: session.riskScore
    });

    this.emit('sessionCreated', session);
    return session;
  }

  // Session Retrieval
  async getSession(sessionId: string): Promise<UserSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt.getTime()) {
      await this.terminateSession(sessionId, TerminationReason.TIMEOUT);
      return null;
    }

    // Check inactivity timeout
    if (this.config.inactivityTimeout > 0) {
      const inactiveTime = Date.now() - session.lastActivityAt.getTime();
      if (inactiveTime > this.config.inactivityTimeout * 60 * 1000) {
        await this.terminateSession(sessionId, TerminationReason.TIMEOUT);
        return null;
      }
    }

    return session;
  }

  async getUserSessions(
    userId: string,
    status?: SessionStatus,
    limit = 50
  ): Promise<UserSession[]> {
    const userSessionIds = this.userSessions.get(userId) || [];
    const sessions = userSessionIds
      .map(id => this.sessions.get(id))
      .filter((s): s is UserSession => s !== undefined);

    let filteredSessions = sessions;
    if (status) {
      filteredSessions = filteredSessions.filter(s => s.status === status);
    }

    return filteredSessions
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
      .slice(0, limit);
  }

  async getActiveSessionCount(userId: string): Promise<number> {
    const userSessions = await this.getUserSessions(userId, SessionStatus.ACTIVE);
    return userSessions.length;
  }

  // Session Management
  async updateSession(
    sessionId: string,
    updates: {
      lastActivityAt?: Date;
      currentLocation?: {
        country?: string;
        city?: string;
        coordinates?: { lat: number; lng: number };
      };
      metadata?: Record<string, any>;
    }
  ): Promise<UserSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== SessionStatus.ACTIVE) {
      return null;
    }

    // Update session
    if (updates.lastActivityAt) {
      session.lastActivityAt = updates.lastActivityAt;
      session.activityCount++;
      session.totalDuration = updates.lastActivityAt.getTime() - session.createdAt.getTime();
    }

    if (updates.currentLocation) {
      session.currentLocation = updates.currentLocation;
      
      // Check for location change
      if (this.config.enableGeographicTracking && 
          session.initialLocation.country !== updates.currentLocation.country) {
        session.securityFlags.push('location_change');
        session.riskScore = Math.min(session.riskScore + 0.2, 1);
      }
    }

    if (updates.metadata) {
      session.metadata = { ...session.metadata, ...updates.metadata };
    }

    // Record session event
    await this.recordSessionEvent(sessionId, session.userId, 'updated', updates);

    this.emit('sessionUpdated', session);
    return session;
  }

  async terminateSession(
    sessionId: string,
    reason: TerminationReason,
    terminatedBy?: string
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== SessionStatus.ACTIVE) {
      return false;
    }

    session.status = SessionStatus.TERMINATED;
    session.terminatedAt = new Date();
    session.metadata.terminationReason = reason;
    if (terminatedBy) {
      session.metadata.terminatedBy = terminatedBy;
    }

    // Record session event
    await this.recordSessionEvent(sessionId, session.userId, 'terminated', {
      reason,
      terminatedBy,
      duration: Date.now() - session.createdAt.getTime()
    });

    this.emit('sessionTerminated', { session, reason, terminatedBy });
    return true;
  }

  async terminateUserSessions(
    userId: string,
    reason: TerminationReason,
    terminatedBy?: string,
    excludeSessionId?: string
  ): Promise<number> {
    const userSessions = await this.getUserSessions(userId, SessionStatus.ACTIVE);
    let terminatedCount = 0;

    for (const session of userSessions) {
      if (session.sessionId !== excludeSessionId) {
        const terminated = await this.terminateSession(session.sessionId, reason, terminatedBy);
        if (terminated) terminatedCount++;
      }
    }

    this.emit('userSessionsTerminated', { userId, terminatedCount, reason, terminatedBy });
    return terminatedCount;
  }

  async suspendSession(sessionId: string, reason: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== SessionStatus.ACTIVE) {
      return false;
    }

    session.status = SessionStatus.SUSPENDED;
    session.metadata.suspensionReason = reason;

    await this.recordSessionEvent(sessionId, session.userId, 'suspended', { reason });
    this.emit('sessionSuspended', { session, reason });
    return true;
  }

  async resumeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== SessionStatus.SUSPENDED) {
      return false;
    }

    session.status = SessionStatus.ACTIVE;
    delete session.metadata.suspensionReason;

    await this.recordSessionEvent(sessionId, session.userId, 'resumed', {});
    this.emit('sessionResumed', session);
    return true;
  }

  // Device Trust Management
  async trustDevice(deviceId: string, userId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.config.trustedDeviceExpiry);
    
    this.trustedDevices.set(deviceId, { userId, expiresAt });
    
    // Update existing sessions for this device
    const userSessions = await this.getUserSessions(userId, SessionStatus.ACTIVE);
    for (const session of userSessions) {
      if (session.deviceId === deviceId) {
        session.isTrusted = true;
        session.riskScore = Math.max(0, session.riskScore - 0.3);
      }
    }

    this.emit('deviceTrusted', { deviceId, userId });
  }

  async untrustDevice(deviceId: string, userId: string): Promise<void> {
    this.trustedDevices.delete(deviceId);
    
    // Update existing sessions for this device
    const userSessions = await this.getUserSessions(userId, SessionStatus.ACTIVE);
    for (const session of userSessions) {
      if (session.deviceId === deviceId) {
        session.isTrusted = false;
      }
    }

    this.emit('deviceUntrusted', { deviceId, userId });
  }

  isDeviceTrusted(deviceId: string, userId: string): boolean {
    const trustedDevice = this.trustedDevices.get(deviceId);
    if (!trustedDevice) {
      return false;
    }

    return trustedDevice.userId === userId && trustedDevice.expiresAt > new Date();
  }

  // Security Monitoring
  async calculateRiskScore(
    session: UserSession,
    context: any
  ): Promise<number> {
    let riskScore = 0;

    // Geographic risk
    if (this.config.enableGeographicTracking) {
      const highRiskCountries = ['XX', 'YY']; // Would use real data
      if (session.country && highRiskCountries.includes(session.country)) {
        riskScore += 0.3;
      }
    }

    // Device risk
    if (this.config.enableDeviceTracking) {
      const userSessions = await this.getUserSessions(session.userId);
      const knownDevices = new Set(userSessions.map(s => s.deviceId));
      
      if (!knownDevices.has(session.deviceId)) {
        riskScore += 0.2;
      }
    }

    // Time-based risk
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      riskScore += 0.1;
    }

    // IP risk
    if (this.isSuspiciousIP(context.ipAddress)) {
      riskScore += 0.4;
    }

    // User agent risk
    if (this.isSuspiciousUserAgent(context.userAgent)) {
      riskScore += 0.2;
    }

    return Math.min(riskScore, 1);
  }

  async checkSessionSecurity(sessionId: string): Promise<{
    secure: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { secure: false, riskLevel: 'high', recommendations: ['Session not found'] };
    }

    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check risk score
    if (session.riskScore > 0.7) {
      riskLevel = 'high';
      recommendations.push('High risk score detected');
    } else if (session.riskScore > 0.4) {
      riskLevel = 'medium';
      recommendations.push('Medium risk score detected');
    }

    // Check security flags
    if (session.securityFlags.length > 0) {
      riskLevel = 'high';
      recommendations.push(`Security flags: ${session.securityFlags.join(', ')}`);
    }

    // Check MFA
    if (!session.mfaVerified && session.authMethod !== 'wallet') {
      recommendations.push('MFA not verified');
    }

    // Check device trust
    if (!session.isTrusted) {
      recommendations.push('Device not trusted');
    }

    // Check location consistency
    if (session.initialLocation.country !== session.currentLocation?.country) {
      recommendations.push('Location change detected');
    }

    const secure = riskLevel === 'low' && session.securityFlags.length === 0;

    return { secure, riskLevel, recommendations };
  }

  // Private Methods
  private async checkConcurrentSessionLimit(userId: string): Promise<void> {
    const activeSessionCount = await this.getActiveSessionCount(userId);
    
    if (activeSessionCount >= this.config.maxConcurrentSessions) {
      // Terminate oldest session
      const userSessions = await this.getUserSessions(userId, SessionStatus.ACTIVE);
      const oldestSession = userSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      
      if (oldestSession) {
        await this.terminateSession(oldestSession.sessionId, TerminationReason.CONCURRENT_LIMIT);
      }
    }
  }

  private isSuspiciousIP(ipAddress: string): boolean {
    // Placeholder for IP reputation checking
    // In a real implementation, you would use a service like:
    // - MaxMind GeoIP
    // - IPQualityScore
    // - AbuseIPDB
    return false;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    // Placeholder for user agent analysis
    // In a real implementation, you would check for:
    // - Known bot patterns
    // - Suspicious browser combinations
    // - Missing common headers
    return false;
  }

  private async recordSessionEvent(
    sessionId: string,
    userId: string,
    type: SessionEvent['type'],
    data: Record<string, any>
  ): Promise<void> {
    const event: SessionEvent = {
      id: this.generateId(),
      sessionId,
      userId,
      type,
      timestamp: new Date(),
      data
    };

    const events = this.sessionEvents.get(sessionId) || [];
    events.push(event);
    this.sessionEvents.set(sessionId, events);
  }

  private generateSessionId(): string {
    return randomBytes(32).toString('hex');
  }

  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  async cleanupExpiredSessions(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status === SessionStatus.ACTIVE) {
        // Check expiry
        if (now > session.expiresAt.getTime()) {
          await this.terminateSession(sessionId, TerminationReason.TIMEOUT);
          cleanedCount++;
        }
        // Check inactivity
        else if (this.config.inactivityTimeout > 0) {
          const inactiveTime = now - session.lastActivityAt.getTime();
          if (inactiveTime > this.config.inactivityTimeout * 60 * 1000) {
            await this.terminateSession(sessionId, TerminationReason.TIMEOUT);
            cleanedCount++;
          }
        }
      }
    }

    // Clean up expired trusted devices
    for (const [deviceId, device] of this.trustedDevices.entries()) {
      if (now > device.expiresAt.getTime()) {
        this.trustedDevices.delete(deviceId);
      }
    }

    this.emit('sessionsCleanedUp', { count: cleanedCount });
    return cleanedCount;
  }

  // Analytics
  async getSessionAnalytics(
    period: { start: Date; end: Date }
  ): Promise<SessionAnalytics> {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.createdAt >= period.start && s.createdAt <= period.end);

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === SessionStatus.ACTIVE).length;
    const terminatedSessions = sessions.filter(s => s.status === SessionStatus.TERMINATED).length;

    // Type distribution
    const sessionsByType: Record<SessionType, number> = {
      [SessionType.WEB]: 0,
      [SessionType.MOBILE]: 0,
      [SessionType.API]: 0,
      [SessionType.WALLET]: 0,
      [SessionType.OAUTH]: 0
    };

    for (const session of sessions) {
      sessionsByType[session.type]++;
    }

    const sessionsByAuthMethod: Record<string, number> = {};
    for (const session of sessions) {
      sessionsByAuthMethod[session.authMethod] = (sessionsByAuthMethod[session.authMethod] || 0) + 1;
    }

    // Duration metrics
    const durations = sessions
      .filter(s => s.terminatedAt || s.status === SessionStatus.TERMINATED)
      .map(s => (s.terminatedAt || Date.now()) - s.createdAt.getTime());
    
    const totalSessionDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageSessionDuration = durations.length > 0 ? totalSessionDuration / durations.length : 0;
    const longestSession = durations.length > 0 ? Math.max(...durations) : 0;
    const shortestSession = durations.length > 0 ? Math.min(...durations) : 0;

    // Geographic metrics
    const sessionsByCountry: Record<string, number> = {};
    const sessionsByCity: Record<string, number> = {};
    let locationChanges = 0;

    for (const session of sessions) {
      if (session.country) {
        sessionsByCountry[session.country] = (sessionsByCountry[session.country] || 0) + 1;
      }
      if (session.city) {
        sessionsByCity[session.city] = (sessionsByCity[session.city] || 0) + 1;
      }
      if (session.initialLocation.country !== session.currentLocation?.country) {
        locationChanges++;
      }
    }

    // Device metrics
    const sessionsByDeviceType: Record<string, number> = {};
    const sessionsByPlatform: Record<string, number> = {};
    const trustedDeviceSessions = sessions.filter(s => s.isTrusted).length;

    for (const session of sessions) {
      sessionsByDeviceType[session.deviceType] = (sessionsByDeviceType[session.deviceType] || 0) + 1;
      if (session.platform) {
        sessionsByPlatform[session.platform] = (sessionsByPlatform[session.platform] || 0) + 1;
      }
    }

    // Security metrics
    const highRiskSessions = sessions.filter(s => s.riskScore > 0.7).length;
    const terminatedForSecurity = sessions.filter(s => 
      s.metadata.terminationReason === 'security'
    ).length;
    const mfaVerifiedSessions = sessions.filter(s => s.mfaVerified).length;

    // Activity metrics
    const averageActivityPerSession = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.activityCount, 0) / sessions.length
      : 0;

    // Hourly distribution
    const mostActiveHours: SessionAnalytics['mostActiveHours'] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourSessions = sessions.filter(s => s.createdAt.getHours() === hour);
      mostActiveHours.push({
        hour,
        sessionCount: hourSessions.length
      });
    }

    return {
      period,
      totalSessions,
      activeSessions,
      newSessions: totalSessions,
      terminatedSessions,
      sessionsByType,
      sessionsByAuthMethod,
      averageSessionDuration,
      totalSessionDuration,
      longestSession,
      shortestSession,
      sessionsByCountry,
      sessionsByCity,
      locationChanges,
      sessionsByDeviceType,
      sessionsByPlatform,
      trustedDeviceSessions,
      highRiskSessions,
      terminatedForSecurity,
      mfaVerifiedSessions,
      averageActivityPerSession,
      mostActiveHours,
      sessionsOverTime: [] // Would aggregate by date
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    if (this.config.enableSessionCleanup) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredSessions();
      }, this.config.cleanupInterval * 60 * 1000);
    }

    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.emit('serviceStopped');
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalSessions: this.sessions.size,
        activeSessions: Array.from(this.sessions.values())
          .filter(s => s.status === SessionStatus.ACTIVE).length,
        trustedDevices: this.trustedDevices.size,
        geographicTrackingEnabled: this.config.enableGeographicTracking,
        riskScoringEnabled: this.config.enableRiskScoring,
        securityMonitoringEnabled: this.config.enableSecurityMonitoring
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        sessions: Array.from(this.sessions.values()),
        trustedDevices: Array.from(this.trustedDevices.entries()),
        sessionEvents: Array.from(this.sessionEvents.entries()),
        config: this.config
      }, null, 2);
    } else {
      const headers = [
        'Session ID', 'User ID', 'Type', 'Status', 'Device Type',
        'IP Address', 'Country', 'Created At', 'Last Activity', 'Expires At'
      ];
      const rows = Array.from(this.sessions.values()).map(s => [
        s.sessionId,
        s.userId,
        s.type,
        s.status,
        s.deviceType,
        s.ipAddress,
        s.country || '',
        s.createdAt.toISOString(),
        s.lastActivityAt.toISOString(),
        s.expiresAt.toISOString()
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
