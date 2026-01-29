import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';

// Enums
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET = 'reset',
  VERIFICATION = 'verification',
  API = 'api'
}

export enum TokenStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  BLACKLISTED = 'blacklisted'
}

// Interfaces
export interface JWTPayload {
  sub: string; // user ID
  iat: number; // issued at
  exp: number; // expires at
  jti: string; // JWT ID
  type: TokenType;
  scope: string[];
  permissions: string[];
  metadata: Record<string, any>;
}

export interface TokenRecord {
  id: string;
  userId: string;
  type: TokenType;
  token: string; // hashed
  payload: JWTPayload;
  status: TokenStatus;
  
  // Usage tracking
  usedAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  maxUsage?: number;
  
  // Device and location
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Security
  isBlacklisted: boolean;
  blacklistReason?: string;
  
  // Timestamps
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface TokenConfig {
  accessTokenExpiry: number; // minutes
  refreshTokenExpiry: number; // days
  resetTokenExpiry: number; // hours
  verificationTokenExpiry: number; // minutes
  apiTokenExpiry: number; // days
  issuer: string;
  algorithm: string;
  secretKey: string;
  enableBlacklist: boolean;
  enableUsageTracking: boolean;
  maxTokensPerUser: number;
  enableRefreshRotation: boolean;
  refreshRotationThreshold: number; // hours
}

// Main JWT Token Management Service
export class JWTTokenManagementService extends EventEmitter {
  private tokens: Map<string, TokenRecord> = new Map();
  private userTokens: Map<string, string[]> = new Map();
  private blacklistedTokens: Set<string> = new Set();
  private config: TokenConfig;

  constructor(config?: Partial<TokenConfig>) {
    super();
    this.config = {
      accessTokenExpiry: 15,
      refreshTokenExpiry: 30,
      resetTokenExpiry: 2,
      verificationTokenExpiry: 15,
      apiTokenExpiry: 365,
      issuer: 'no-loss-auction',
      algorithm: 'HS256',
      secretKey: process.env.JWT_SECRET || 'default-secret',
      enableBlacklist: true,
      enableUsageTracking: true,
      maxTokensPerUser: 10,
      enableRefreshRotation: true,
      refreshRotationThreshold: 24,
      ...config
    };
  }

  // Token Generation
  async generateToken(
    userId: string,
    type: TokenType,
    options: {
      scope?: string[];
      permissions?: string[];
      metadata?: Record<string, any>;
      deviceId?: string;
      ipAddress?: string;
      userAgent?: string;
      maxUsage?: number;
    } = {}
  ): Promise<string> {
    const tokenId = this.generateId();
    const now = Math.floor(Date.now() / 1000);
    
    let expiry = now;
    switch (type) {
      case TokenType.ACCESS:
        expiry += this.config.accessTokenExpiry * 60;
        break;
      case TokenType.REFRESH:
        expiry += this.config.refreshTokenExpiry * 24 * 60 * 60;
        break;
      case TokenType.RESET:
        expiry += this.config.resetTokenExpiry * 60 * 60;
        break;
      case TokenType.VERIFICATION:
        expiry += this.config.verificationTokenExpiry * 60;
        break;
      case TokenType.API:
        expiry += this.config.apiTokenExpiry * 24 * 60 * 60;
        break;
    }

    const payload: JWTPayload = {
      sub: userId,
      iat: now,
      exp: expiry,
      jti: tokenId,
      type,
      scope: options.scope || [],
      permissions: options.permissions || [],
      metadata: options.metadata || {}
    };

    const token = jwt.sign(payload, this.config.secretKey, {
      algorithm: this.config.algorithm as jwt.Algorithm,
      issuer: this.config.issuer,
      jwtid: tokenId
    });

    // Store token record
    const tokenRecord: TokenRecord = {
      id: tokenId,
      userId,
      type,
      token: this.hashToken(token),
      payload,
      status: TokenStatus.ACTIVE,
      usageCount: 0,
      maxUsage: options.maxUsage,
      deviceId: options.deviceId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      isBlacklisted: false,
      createdAt: new Date(),
      expiresAt: new Date(expiry * 1000)
    };

    await this.storeToken(tokenRecord);
    
    this.emit('tokenGenerated', { token, type, userId });
    return token;
  }

  // Token Validation
  async validateToken(token: string, type?: TokenType): Promise<{
    valid: boolean;
    payload?: JWTPayload;
    error?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.config.secretKey, {
        algorithms: [this.config.algorithm as jwt.Algorithm],
        issuer: this.config.issuer
      }) as JWTPayload;

      if (type && decoded.type !== type) {
        return { valid: false, error: 'Invalid token type' };
      }

      // Check if token is blacklisted
      const tokenHash = this.hashToken(token);
      if (this.isTokenBlacklisted(tokenHash)) {
        return { valid: false, error: 'Token is blacklisted' };
      }

      // Check token record
      const tokenRecord = await this.getToken(decoded.jti);
      if (!tokenRecord) {
        return { valid: false, error: 'Token not found' };
      }

      // Check status
      if (tokenRecord.status !== TokenStatus.ACTIVE) {
        return { valid: false, error: `Token is ${tokenRecord.status}` };
      }

      // Check expiry
      if (Date.now() > tokenRecord.expiresAt.getTime()) {
        await this.revokeToken(decoded.jti, 'expired');
        return { valid: false, error: 'Token expired' };
      }

      // Update usage tracking
      if (this.config.enableUsageTracking) {
        await this.updateTokenUsage(decoded.jti);
      }

      return { valid: true, payload: decoded };

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Unknown error' };
    }
  }

  // Token Management
  async revokeToken(tokenId: string, reason?: string): Promise<boolean> {
    const token = await this.getToken(tokenId);
    if (!token) {
      return false;
    }

    token.status = TokenStatus.REVOKED;
    token.revokedAt = new Date();
    token.metadata.revocationReason = reason;

    // Add to blacklist if enabled
    if (this.config.enableBlacklist) {
      this.blacklistedTokens.add(token.token);
    }

    this.emit('tokenRevoked', { tokenId, reason });
    return true;
  }

  async revokeUserTokens(userId: string, reason?: string): Promise<number> {
    const userTokenIds = this.userTokens.get(userId) || [];
    let revokedCount = 0;

    for (const tokenId of userTokenIds) {
      const revoked = await this.revokeToken(tokenId, reason);
      if (revoked) revokedCount++;
    }

    this.emit('userTokensRevoked', { userId, revokedCount, reason });
    return revokedCount;
  }

  async blacklistToken(tokenHash: string, reason?: string): Promise<boolean> {
    this.blacklistedTokens.add(tokenHash);
    
    // Update token record if exists
    const token = await this.getTokenByHash(tokenHash);
    if (token) {
      token.status = TokenStatus.BLACKLISTED;
      token.isBlacklisted = true;
      token.blacklistReason = reason;
    }

    this.emit('tokenBlacklisted', { tokenHash, reason });
    return true;
  }

  // Token Retrieval
  async getToken(tokenId: string): Promise<TokenRecord | null> {
    return this.tokens.get(tokenId) || null;
  }

  async getTokenByHash(tokenHash: string): Promise<TokenRecord | null> {
    const tokens = Array.from(this.tokens.values());
    return tokens.find(t => t.token === tokenHash) || null;
  }

  async getUserTokens(
    userId: string,
    type?: TokenType,
    status?: TokenStatus
  ): Promise<TokenRecord[]> {
    const userTokenIds = this.userTokens.get(userId) || [];
    const tokens = userTokenIds
      .map(id => this.tokens.get(id))
      .filter((t): t is TokenRecord => t !== undefined);

    let filteredTokens = tokens;
    
    if (type) {
      filteredTokens = filteredTokens.filter(t => t.type === type);
    }
    
    if (status) {
      filteredTokens = filteredTokens.filter(t => t.status === status);
    }

    return filteredTokens.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Refresh Token Management
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    const validation = await this.validateToken(refreshToken, TokenType.REFRESH);
    if (!validation.valid) {
      return null;
    }

    const payload = validation.payload!;
    const userId = payload.sub;

    // Check refresh rotation
    if (this.config.enableRefreshRotation) {
      const oldTokens = await this.getUserTokens(userId, TokenType.REFRESH);
      const recentRefresh = oldTokens.find(t => 
        Date.now() - t.createdAt.getTime() < this.config.refreshRotationThreshold * 60 * 60 * 1000
      );
      
      if (recentRefresh) {
        return null; // Too recent refresh
      }
    }

    // Revoke old refresh token
    await this.revokeToken(payload.jti, 'refreshed');

    // Generate new access token
    const newAccessToken = await this.generateToken(userId, TokenType.ACCESS, {
      scope: payload.scope,
      permissions: payload.permissions,
      metadata: payload.metadata
    });

    this.emit('accessTokenRefreshed', { userId, newAccessToken });
    return newAccessToken;
  }

  // Cleanup
  async cleanupExpiredTokens(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [tokenId, token] of this.tokens.entries()) {
      if (now > token.expiresAt.getTime() && token.status === TokenStatus.ACTIVE) {
        token.status = TokenStatus.EXPIRED;
        cleanedCount++;
      }
    }

    this.emit('tokensCleanedUp', { count: cleanedCount });
    return cleanedCount;
  }

  // Private Methods
  private async storeToken(token: TokenRecord): Promise<void> {
    this.tokens.set(token.id, token);
    
    // Update user token index
    const userTokens = this.userTokens.get(token.userId) || [];
    userTokens.push(token.id);
    
    // Enforce max tokens per user
    if (userTokens.length > this.config.maxTokensPerUser) {
      // Remove oldest tokens of same type
      const sameTypeTokens = userTokens
        .map(id => this.tokens.get(id))
        .filter((t): t is TokenRecord => t !== undefined && t.type === token.type)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const tokensToRemove = sameTypeTokens.slice(0, userTokens.length - this.config.maxTokensPerUser);
      for (const oldToken of tokensToRemove) {
        await this.revokeToken(oldToken.id, 'token_limit_exceeded');
      }
    }
    
    this.userTokens.set(token.userId, userTokens);
  }

  private async updateTokenUsage(tokenId: string): Promise<void> {
    const token = this.tokens.get(tokenId);
    if (!token) return;

    token.usageCount++;
    token.lastUsedAt = new Date();
    
    if (!token.usedAt) {
      token.usedAt = token.lastUsedAt;
    }

    // Check max usage
    if (token.maxUsage && token.usageCount >= token.maxUsage) {
      await this.revokeToken(tokenId, 'max_usage_reached');
    }
  }

  private isTokenBlacklisted(tokenHash: string): boolean {
    return this.blacklistedTokens.has(tokenHash);
  }

  private hashToken(token: string): string {
    // Simple hash - in production, use proper hashing
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  private generateId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getTokenAnalytics(period: { start: Date; end: Date }) {
    const tokens = Array.from(this.tokens.values())
      .filter(t => t.createdAt >= period.start && t.createdAt <= period.end);

    return {
      totalTokens: tokens.length,
      tokensByType: tokens.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {} as Record<TokenType, number>),
      tokensByStatus: tokens.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {} as Record<TokenStatus, number>),
      averageUsagePerToken: tokens.length > 0 
        ? tokens.reduce((sum, t) => sum + t.usageCount, 0) / tokens.length 
        : 0,
      blacklistedTokens: this.blacklistedTokens.size
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000); // Every hour
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalTokens: this.tokens.size,
        blacklistedTokens: this.blacklistedTokens.size,
        enableBlacklist: this.config.enableBlacklist,
        enableUsageTracking: this.config.enableUsageTracking
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        tokens: Array.from(this.tokens.values()),
        config: this.config
      }, null, 2);
    } else {
      const headers = ['ID', 'User ID', 'Type', 'Status', 'Created At', 'Expires At', 'Usage Count'];
      const rows = Array.from(this.tokens.values()).map(t => [
        t.id,
        t.userId,
        t.type,
        t.status,
        t.createdAt.toISOString(),
        t.expiresAt.toISOString(),
        t.usageCount
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
