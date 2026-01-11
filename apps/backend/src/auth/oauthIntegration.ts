import { EventEmitter } from 'events';

// Enums
export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  GITHUB = 'github',
  DISCORD = 'discord',
  APPLE = 'apple',
  MICROSOFT = 'microsoft',
  LINKEDIN = 'linkedin'
}

export enum OAuthStatus {
  PENDING = 'pending',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  EXPIRED = 'expired'
}

export enum OAuthScope {
  EMAIL = 'email',
  PROFILE = 'profile',
  OPENID = 'openid',
  PHONE = 'phone',
  ADDRESS = 'address',
  OFFLINE_ACCESS = 'offline_access'
}

// Interfaces
export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: OAuthScope[];
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  revokeUrl?: string;
  enabled: boolean;
}

export interface OAuthUser {
  id: string;
  provider: OAuthProvider;
  providerUserId: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  locale?: string;
  timezone?: string;
  verified: boolean;
  raw: Record<string, any>;
}

export interface OAuthConnection {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  status: OAuthStatus;
  
  // Tokens
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope: string[];
  expiresAt?: Date;
  
  // User data
  userData: OAuthUser;
  
  // Connection details
  connectedAt: Date;
  lastUsedAt?: Date;
  disconnectedAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface OAuthState {
  state: string;
  userId?: string;
  provider: OAuthProvider;
  scopes: OAuthScope[];
  redirectUri: string;
  createdAt: Date;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface OAuthAnalytics {
  period: { start: Date; end: Date };
  
  // Connection metrics
  totalConnections: number;
  newConnections: number;
  disconnectedConnections: number;
  connectionsByProvider: Record<OAuthProvider, number>;
  
  // Usage metrics
  totalAuthentications: number;
  authenticationsByProvider: Record<OAuthProvider, number>;
  averageSessionsPerConnection: number;
  
  // Error metrics
  failedConnections: number;
  errorsByProvider: Record<OAuthProvider, number>;
  errorsByType: Record<string, number>;
  
  // Security metrics
  suspiciousConnections: number;
  revokedConnections: number;
  expiredTokens: number;
  
  // User metrics
  usersWithOAuth: number;
  averageConnectionsPerUser: number;
  multiProviderUsers: number;
  
  // Trends
  connectionsOverTime: {
    date: Date;
    connections: number;
    disconnections: number;
  }[];
}

// Main OAuth Integration Service
export class OAuthIntegrationService extends EventEmitter {
  private configs: Map<OAuthProvider, OAuthConfig> = new Map();
  private connections: Map<string, OAuthConnection> = new Map();
  private userConnections: Map<string, string[]> = new Map();
  private states: Map<string, OAuthState> = new Map();

  constructor() {
    super();
    this.initializeDefaultConfigs();
  }

  // Configuration Management
  async configureProvider(config: OAuthConfig): Promise<void> {
    this.configs.set(config.provider, config);
    this.emit('providerConfigured', { provider: config.provider, config });
  }

  async getProviderConfig(provider: OAuthProvider): Promise<OAuthConfig | null> {
    return this.configs.get(provider) || null;
  }

  async getEnabledProviders(): Promise<OAuthProvider[]> {
    return Array.from(this.configs.values())
      .filter(config => config.enabled)
      .map(config => config.provider);
  }

  // OAuth Flow
  async initiateOAuth(
    userId: string,
    provider: OAuthProvider,
    scopes: OAuthScope[] = [OAuthScope.EMAIL, OAuthScope.PROFILE],
    redirectUri?: string,
    metadata: Record<string, any> = {}
  ): Promise<{ authorizationUrl: string; state: string }> {
    const config = this.configs.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`OAuth provider ${provider} is not configured or enabled`);
    }

    // Generate state
    const state = this.generateState();
    const now = new Date();

    const oauthState: OAuthState = {
      state,
      userId,
      provider,
      scopes,
      redirectUri: redirectUri || config.redirectUri,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
      metadata
    };

    this.states.set(state, oauthState);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri || config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline' // For refresh tokens
    });

    // Add provider-specific parameters
    if (provider === OAuthProvider.GOOGLE) {
      params.set('prompt', 'consent');
    } else if (provider === OAuthProvider.FACEBOOK) {
      params.set('response_type', 'code');
    }

    const authorizationUrl = `${config.authorizationUrl}?${params.toString()}`;

    this.emit('oauthInitiated', { userId, provider, state, authorizationUrl });
    return { authorizationUrl, state };
  }

  async handleOAuthCallback(
    code: string,
    state: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<OAuthConnection> {
    const oauthState = this.states.get(state);
    if (!oauthState) {
      throw new Error('Invalid or expired OAuth state');
    }

    if (Date.now() > oauthState.expiresAt.getTime()) {
      this.states.delete(state);
      throw new Error('OAuth state expired');
    }

    const config = this.configs.get(oauthState.provider);
    if (!config) {
      throw new Error(`OAuth provider ${oauthState.provider} not configured`);
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(
        config,
        code,
        oauthState.redirectUri
      );

      // Get user information
      const userData = await this.getUserInfo(config, tokenResponse.access_token);

      // Create or update connection
      const connection = await this.createOrUpdateConnection(
        oauthState.userId!,
        oauthState.provider,
        userData,
        tokenResponse,
        context
      );

      // Clean up state
      this.states.delete(state);

      this.emit('oauthCallbackSuccess', { connection, state });
      return connection;

    } catch (error) {
      this.emit('oauthCallbackError', { state, error, provider: oauthState.provider });
      throw error;
    }
  }

  // Connection Management
  async createOrUpdateConnection(
    userId: string,
    provider: OAuthProvider,
    userData: OAuthUser,
    tokenResponse: OAuthTokenResponse,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<OAuthConnection> {
    // Check for existing connection
    const existingConnection = await this.getConnectionByProvider(userId, provider);
    
    const connectionId = existingConnection?.id || this.generateId();
    const now = new Date();

    const connection: OAuthConnection = {
      id: connectionId,
      userId,
      provider,
      providerUserId: userData.providerUserId,
      status: OAuthStatus.CONNECTED,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
      expiresAt: tokenResponse.expires_in 
        ? new Date(now.getTime() + tokenResponse.expires_in * 1000)
        : undefined,
      userData,
      connectedAt: now,
      lastUsedAt: now,
      metadata: {
        ...context,
        connectedAt: now
      }
    };

    this.connections.set(connectionId, connection);
    
    // Update user connections index
    const userConnectionIds = this.userConnections.get(userId) || [];
    if (!userConnectionIds.includes(connectionId)) {
      userConnectionIds.push(connectionId);
      this.userConnections.set(userId, userConnectionIds);
    }

    this.emit('connectionCreated', connection);
    return connection;
  }

  async disconnectOAuth(
    userId: string,
    provider: OAuthProvider,
    revokeToken = true
  ): Promise<boolean> {
    const connection = await this.getConnectionByProvider(userId, provider);
    if (!connection) {
      return false;
    }

    // Revoke token if requested
    if (revokeToken) {
      await this.revokeToken(connection);
    }

    // Update connection status
    connection.status = OAuthStatus.DISCONNECTED;
    connection.disconnectedAt = new Date();

    this.emit('connectionDisconnected', { connection, revokeToken });
    return true;
  }

  async refreshAccessToken(connectionId: string): Promise<OAuthConnection> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    const config = this.configs.get(connection.provider);
    if (!config) {
      throw new Error(`OAuth provider ${connection.provider} not configured`);
    }

    try {
      const tokenResponse = await this.refreshTokens(config, connection.refreshToken);

      // Update connection with new tokens
      connection.accessToken = tokenResponse.access_token;
      if (tokenResponse.refresh_token) {
        connection.refreshToken = tokenResponse.refresh_token;
      }
      connection.tokenType = tokenResponse.token_type;
      connection.scope = tokenResponse.scope ? tokenResponse.scope.split(' ') : [];
      connection.expiresAt = tokenResponse.expires_in 
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : undefined;
      connection.lastUsedAt = new Date();

      this.emit('tokenRefreshed', { connection });
      return connection;

    } catch (error) {
      connection.status = OAuthStatus.ERROR;
      this.emit('tokenRefreshError', { connection, error });
      throw error;
    }
  }

  // Connection Retrieval
  async getConnection(connectionId: string): Promise<OAuthConnection | null> {
    return this.connections.get(connectionId) || null;
  }

  async getUserConnections(userId: string): Promise<OAuthConnection[]> {
    const connectionIds = this.userConnections.get(userId) || [];
    return connectionIds
      .map(id => this.connections.get(id))
      .filter((c): c is OAuthConnection => c !== undefined)
      .sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());
  }

  async getConnectionByProvider(
    userId: string,
    provider: OAuthProvider
  ): Promise<OAuthConnection | null> {
    const connections = await this.getUserConnections(userId);
    return connections.find(c => c.provider === provider) || null;
  }

  async getConnectionsByProvider(provider: OAuthProvider): Promise<OAuthConnection[]> {
    return Array.from(this.connections.values())
      .filter(c => c.provider === provider && c.status === OAuthStatus.CONNECTED);
  }

  // Token Validation
  async validateConnection(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.status !== OAuthStatus.CONNECTED) {
      return false;
    }

    // Check if token is expired
    if (connection.expiresAt && Date.now() > connection.expiresAt.getTime()) {
      // Try to refresh token
      if (connection.refreshToken) {
        try {
          await this.refreshAccessToken(connectionId);
          return true;
        } catch (error) {
          connection.status = OAuthStatus.EXPIRED;
          return false;
        }
      } else {
        connection.status = OAuthStatus.EXPIRED;
        return false;
      }
    }

    return true;
  }

  // Private Methods
  private async exchangeCodeForTokens(
    config: OAuthConfig,
    code: string,
    redirectUri: string
  ): Promise<OAuthTokenResponse> {
    // Placeholder for token exchange
    // In a real implementation, you would make HTTP requests to the provider's token endpoint
    const response = {
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'mock_refresh_token',
      scope: config.scopes.join(' ')
    };

    this.emit('tokensExchanged', { provider: config.provider, response });
    return response;
  }

  private async getUserInfo(
    config: OAuthConfig,
    accessToken: string
  ): Promise<OAuthUser> {
    // Placeholder for user info retrieval
    // In a real implementation, you would make HTTP requests to the provider's user info endpoint
    const userData: OAuthUser = {
      id: this.generateId(),
      provider: config.provider,
      providerUserId: 'mock_provider_user_id',
      email: 'user@example.com',
      name: 'Mock User',
      firstName: 'Mock',
      lastName: 'User',
      avatar: 'https://example.com/avatar.jpg',
      verified: true,
      raw: {}
    };

    this.emit('userInfoRetrieved', { provider: config.provider, userData });
    return userData;
  }

  private async refreshTokens(
    config: OAuthConfig,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    // Placeholder for token refresh
    // In a real implementation, you would make HTTP requests to the provider's token endpoint
    const response = {
      access_token: 'new_mock_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'new_mock_refresh_token',
      scope: config.scopes.join(' ')
    };

    this.emit('tokensRefreshed', { provider: config.provider, response });
    return response;
  }

  private async revokeToken(connection: OAuthConnection): Promise<void> {
    const config = this.configs.get(connection.provider);
    if (!config || !config.revokeUrl) {
      return;
    }

    // Placeholder for token revocation
    // In a real implementation, you would make HTTP requests to the provider's revoke endpoint
    this.emit('tokenRevoked', { connection });
  }

  private generateState(): string {
    return `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateId(): string {
    return `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultConfigs(): void {
    // Google OAuth
    this.configs.set(OAuthProvider.GOOGLE, {
      provider: OAuthProvider.GOOGLE,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      scopes: [OAuthScope.EMAIL, OAuthScope.PROFILE, OAuthScope.OPENID],
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
      enabled: false
    });

    // Facebook OAuth
    this.configs.set(OAuthProvider.FACEBOOK, {
      provider: OAuthProvider.FACEBOOK,
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback',
      scopes: [OAuthScope.EMAIL, OAuthScope.PROFILE],
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/me',
      enabled: false
    });

    // GitHub OAuth
    this.configs.set(OAuthProvider.GITHUB, {
      provider: OAuthProvider.GITHUB,
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback',
      scopes: [OAuthScope.USER_EMAIL, OAuthScope.READ_USER],
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      enabled: false
    });

    // Discord OAuth
    this.configs.set(OAuthProvider.DISCORD, {
      provider: OAuthProvider.DISCORD,
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/auth/discord/callback',
      scopes: [OAuthScope.EMAIL, OAuthScope.IDENTIFY],
      authorizationUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      userInfoUrl: 'https://discord.com/api/users/@me',
      enabled: false
    });
  }

  // Cleanup
  async cleanupExpiredData(): Promise<number> {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up expired states
    for (const [state, oauthState] of this.states.entries()) {
      if (now > oauthState.expiresAt.getTime()) {
        this.states.delete(state);
        cleanedCount++;
      }
    }

    // Clean up expired connections
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.expiresAt && now > connection.expiresAt.getTime() && !connection.refreshToken) {
        connection.status = OAuthStatus.EXPIRED;
        cleanedCount++;
      }
    }

    this.emit('dataCleanedUp', { count: cleanedCount });
    return cleanedCount;
  }

  // Analytics
  async getOAuthAnalytics(
    period: { start: Date; end: Date }
  ): Promise<OAuthAnalytics> {
    const connections = Array.from(this.connections.values())
      .filter(c => c.connectedAt >= period.start && c.connectedAt <= period.end);

    const totalConnections = connections.length;
    const newConnections = connections.length;
    const disconnectedConnections = Array.from(this.connections.values())
      .filter(c => c.disconnectedAt && c.disconnectedAt >= period.start && c.disconnectedAt <= period.end).length;

    // Provider distribution
    const connectionsByProvider: Record<OAuthProvider, number> = {
      [OAuthProvider.GOOGLE]: 0,
      [OAuthProvider.FACEBOOK]: 0,
      [OAuthProvider.TWITTER]: 0,
      [OAuthProvider.GITHUB]: 0,
      [OAuthProvider.DISCORD]: 0,
      [OAuthProvider.APPLE]: 0,
      [OAuthProvider.MICROSOFT]: 0,
      [OAuthProvider.LINKEDIN]: 0
    };

    for (const connection of connections) {
      connectionsByProvider[connection.provider]++;
    }

    // User metrics
    const usersWithOAuth = new Set(connections.map(c => c.userId)).size;
    const averageConnectionsPerUser = usersWithOAuth > 0 ? totalConnections / usersWithOAuth : 0;
    const multiProviderUsers = Array.from(this.userConnections.values())
      .filter(ids => ids.length > 1).length;

    return {
      period,
      totalConnections,
      newConnections,
      disconnectedConnections,
      connectionsByProvider,
      totalAuthentications: 0, // Would track from authentication events
      authenticationsByProvider: {} as Record<OAuthProvider, number>,
      averageSessionsPerConnection: 0,
      failedConnections: 0,
      errorsByProvider: {} as Record<OAuthProvider, number>,
      errorsByType: {},
      suspiciousConnections: 0,
      revokedConnections: 0,
      expiredTokens: 0,
      usersWithOAuth,
      averageConnectionsPerUser,
      multiProviderUsers,
      connectionsOverTime: [] // Would aggregate by date
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredData(), 15 * 60 * 1000); // Every 15 minutes
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalConnections: this.connections.size,
        activeStates: this.states.size,
        enabledProviders: Array.from(this.configs.values()).filter(c => c.enabled).length,
        configuredProviders: this.configs.size
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        connections: Array.from(this.connections.values()),
        configs: Array.from(this.configs.values()),
        states: Array.from(this.states.values())
      }, null, 2);
    } else {
      const headers = [
        'User ID', 'Provider', 'Provider User ID', 'Status', 'Connected At', 'Last Used At'
      ];
      const rows = Array.from(this.connections.values()).map(c => [
        c.userId,
        c.provider,
        c.providerUserId,
        c.status,
        c.connectedAt.toISOString(),
        c.lastUsedAt?.toISOString() || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
