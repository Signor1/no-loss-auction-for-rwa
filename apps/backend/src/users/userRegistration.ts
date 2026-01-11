import { EventEmitter } from 'events';

// Enums
export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  DELETED = 'deleted'
}

export enum UserTier {
  BASIC = 'basic',
  VERIFIED = 'verified',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export enum VerificationStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum RegistrationMethod {
  EMAIL = 'email',
  WALLET = 'wallet',
  SOCIAL = 'social',
  INVITE = 'invite'
}

// Interfaces
export interface User {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  
  // Authentication
  passwordHash?: string;
  walletAddresses: string[];
  socialAccounts?: SocialAccount[];
  
  // Profile
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  location?: UserLocation;
  website?: string;
  
  // Status and verification
  status: UserStatus;
  tier: UserTier;
  verificationStatus: VerificationStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKYCVerified: boolean;
  
  // Registration details
  registrationMethod: RegistrationMethod;
  registeredAt: Date;
  lastLoginAt?: Date;
  invitedBy?: string;
  referralCode?: string;
  
  // Preferences and settings
  preferences: UserPreferences;
  settings: UserSettings;
  
  // Activity and reputation
  reputationScore: number;
  totalAuctions: number;
  totalBids: number;
  winningRate: number;
  
  // Metadata
  metadata: Record<string, any>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccount {
  platform: 'twitter' | 'discord' | 'telegram' | 'github' | 'google';
  platformId: string;
  username: string;
  verified: boolean;
  linkedAt: Date;
}

export interface UserLocation {
  country: string;
  state?: string;
  city?: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  language: string;
  timezone: string;
  currency: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  display: DisplayPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  auctionUpdates: boolean;
  bidUpdates: boolean;
  paymentUpdates: boolean;
  marketing: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'friends_only';
  showActivity: boolean;
  showBiddingHistory: boolean;
  showWalletAddresses: boolean;
  allowDirectMessages: boolean;
  allowTagging: boolean;
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showAdvancedFeatures: boolean;
  defaultView: 'grid' | 'list';
  itemsPerPage: number;
}

export interface UserSettings {
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  sessionTimeout: number;
  autoLogout: boolean;
  apiAccessEnabled: boolean;
  apiKey?: string;
  tradingEnabled: boolean;
  maxBidAmount?: number;
  autoBidEnabled: boolean;
}

export interface RegistrationRequest {
  id: string;
  email?: string;
  username?: string;
  password?: string;
  walletAddress?: string;
  registrationMethod: RegistrationMethod;
  
  // Verification
  verificationToken?: string;
  verificationExpiresAt?: Date;
  isVerified: boolean;
  
  // Social registration
  socialProvider?: string;
  socialId?: string;
  socialData?: Record<string, any>;
  
  // Invitation
  inviteCode?: string;
  invitedBy?: string;
  
  // Status
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  metadata: Record<string, any>;
  
  // Timestamps
  requestedAt: Date;
  processedAt?: Date;
}

export interface RegistrationConfig {
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  requireKYCVerification: boolean;
  allowWalletRegistration: boolean;
  allowSocialRegistration: boolean;
  enableInvitationSystem: boolean;
  enableReferralSystem: boolean;
  defaultUserTier: UserTier;
  verificationTokenExpiry: number; // hours
  maxRegistrationAttempts: number;
  registrationCooldown: number; // minutes
  enableBlacklist: boolean;
  enableRateLimit: boolean;
  rateLimitWindow: number; // minutes
  maxAttemptsPerWindow: number;
}

export interface RegistrationAnalytics {
  period: { start: Date; end: Date };
  
  // Registration metrics
  totalRegistrations: number;
  successfulRegistrations: number;
  failedRegistrations: number;
  registrationsByMethod: Record<RegistrationMethod, number>;
  registrationsByTier: Record<UserTier, number>;
  
  // Verification metrics
  emailVerificationRate: number;
  phoneVerificationRate: number;
  kycVerificationRate: number;
  averageVerificationTime: number;
  
  // Geographic distribution
  registrationsByCountry: Record<string, number>;
  
  // Trends
  dailyRegistrations: {
    date: Date;
    count: number;
    method: RegistrationMethod;
  }[];
  
  // Quality metrics
  duplicateRegistrations: number;
  suspiciousRegistrations: number;
  botRegistrations: number;
}

// Main User Registration Service
export class UserRegistrationService extends EventEmitter {
  private users: Map<string, User> = new Map();
  private registrationRequests: Map<string, RegistrationRequest> = new Map();
  private emailToUserId: Map<string, string> = new Map();
  private usernameToUserId: Map<string, string> = new Map();
  private walletToUserId: Map<string, string> = new Map();
  private config: RegistrationConfig;
  private registrationAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(config?: Partial<RegistrationConfig>) {
    super();
    this.config = {
      requireEmailVerification: true,
      requirePhoneVerification: false,
      requireKYCVerification: false,
      allowWalletRegistration: true,
      allowSocialRegistration: true,
      enableInvitationSystem: false,
      enableReferralSystem: true,
      defaultUserTier: UserTier.BASIC,
      verificationTokenExpiry: 24,
      maxRegistrationAttempts: 5,
      registrationCooldown: 15,
      enableBlacklist: true,
      enableRateLimit: true,
      rateLimitWindow: 60,
      maxAttemptsPerWindow: 3,
      ...config
    };
  }

  // Registration Methods
  async registerWithEmail(
    email: string,
    password: string,
    username?: string,
    options: {
      firstName?: string;
      lastName?: string;
      inviteCode?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<RegistrationRequest> {
    // Validate input
    await this.validateEmailRegistration(email, password, username);
    
    // Check rate limiting
    await this.checkRateLimit(email);
    
    // Check existing user
    if (this.emailToUserId.has(email)) {
      throw new Error('Email already registered');
    }

    if (username && this.usernameToUserId.has(username)) {
      throw new Error('Username already taken');
    }

    // Create registration request
    const requestId = this.generateId();
    const verificationToken = this.generateVerificationToken();
    
    const request: RegistrationRequest = {
      id: requestId,
      email,
      username,
      password,
      registrationMethod: RegistrationMethod.EMAIL,
      verificationToken,
      verificationExpiresAt: new Date(Date.now() + this.config.verificationTokenExpiry * 60 * 60 * 1000),
      isVerified: false,
      inviteCode: options.inviteCode,
      metadata: options.metadata || {},
      requestedAt: new Date(),
      status: 'pending'
    };

    this.registrationRequests.set(requestId, request);
    
    // Send verification email
    await this.sendVerificationEmail(email, verificationToken);
    
    this.emit('registrationRequested', request);
    return request;
  }

  async registerWithWallet(
    walletAddress: string,
    signature: string,
    message: string,
    options: {
      username?: string;
      email?: string;
      inviteCode?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<RegistrationRequest> {
    // Validate wallet signature
    await this.validateWalletSignature(walletAddress, signature, message);
    
    // Check existing wallet
    if (this.walletToUserId.has(walletAddress)) {
      throw new Error('Wallet address already registered');
    }

    if (options.username && this.usernameToUserId.has(options.username)) {
      throw new Error('Username already taken');
    }

    // Create registration request
    const requestId = this.generateId();
    
    const request: RegistrationRequest = {
      id: requestId,
      walletAddress,
      username: options.username,
      email: options.email,
      registrationMethod: RegistrationMethod.WALLET,
      isVerified: true, // Wallet signature serves as verification
      inviteCode: options.inviteCode,
      metadata: options.metadata || {},
      requestedAt: new Date(),
      status: 'pending'
    };

    this.registrationRequests.set(requestId, request);
    
    this.emit('registrationRequested', request);
    return request;
  }

  async registerWithSocial(
    provider: string,
    socialId: string,
    accessToken: string,
    options: {
      email?: string;
      username?: string;
      inviteCode?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<RegistrationRequest> {
    // Validate social token
    const socialData = await this.validateSocialToken(provider, accessToken);
    
    // Create registration request
    const requestId = this.generateId();
    
    const request: RegistrationRequest = {
      id: requestId,
      email: options.email || socialData.email,
      username: options.username || socialData.username,
      registrationMethod: RegistrationMethod.SOCIAL,
      socialProvider: provider,
      socialId,
      socialData,
      isVerified: true, // Social provider verification
      inviteCode: options.inviteCode,
      metadata: options.metadata || {},
      requestedAt: new Date(),
      status: 'pending'
    };

    this.registrationRequests.set(requestId, request);
    
    this.emit('registrationRequested', request);
    return request;
  }

  // Verification
  async verifyRegistration(
    requestId: string,
    token: string
  ): Promise<User> {
    const request = this.registrationRequests.get(requestId);
    if (!request) {
      throw new Error('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Registration request already processed');
    }

    if (request.verificationToken !== token) {
      throw new Error('Invalid verification token');
    }

    if (request.verificationExpiresAt && new Date() > request.verificationExpiresAt) {
      throw new Error('Verification token expired');
    }

    // Create user
    const user = await this.createUserFromRequest(request);
    
    // Update request status
    request.status = 'approved';
    request.processedAt = new Date();
    request.isVerified = true;

    this.emit('registrationVerified', { request, user });
    return user;
  }

  async resendVerification(requestId: string): Promise<boolean> {
    const request = this.registrationRequests.get(requestId);
    if (!request) {
      throw new Error('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Registration request already processed');
    }

    if (request.verificationExpiresAt && new Date() > request.verificationExpiresAt) {
      // Generate new token
      request.verificationToken = this.generateVerificationToken();
      request.verificationExpiresAt = new Date(Date.now() + this.config.verificationTokenExpiry * 60 * 60 * 1000);
    }

    if (request.email && request.verificationToken) {
      await this.sendVerificationEmail(request.email, request.verificationToken);
    }

    this.emit('verificationResent', request);
    return true;
  }

  // Request Management
  async getRegistrationRequest(requestId: string): Promise<RegistrationRequest | null> {
    return this.registrationRequests.get(requestId) || null;
  }

  async approveRegistration(
    requestId: string,
    approvedBy: string,
    notes?: string
  ): Promise<User> {
    const request = this.registrationRequests.get(requestId);
    if (!request) {
      throw new Error('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Registration request already processed');
    }

    // Create user
    const user = await this.createUserFromRequest(request);
    
    // Update request
    request.status = 'approved';
    request.processedAt = new Date();
    request.metadata.approvedBy = approvedBy;
    request.metadata.approvalNotes = notes;

    this.emit('registrationApproved', { request, user, approvedBy });
    return user;
  }

  async rejectRegistration(
    requestId: string,
    reason: string,
    rejectedBy: string
  ): Promise<boolean> {
    const request = this.registrationRequests.get(requestId);
    if (!request) {
      throw new Error('Registration request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Registration request already processed');
    }

    request.status = 'rejected';
    request.rejectionReason = reason;
    request.processedAt = new Date();
    request.metadata.rejectedBy = rejectedBy;

    this.emit('registrationRejected', { request, reason, rejectedBy });
    return true;
  }

  // Private Methods
  private async validateEmailRegistration(
    email: string,
    password: string,
    username?: string
  ): Promise<void> {
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (username && !this.isValidUsername(username)) {
      throw new Error('Invalid username');
    }
  }

  private async validateWalletSignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<void> {
    // Placeholder for wallet signature validation
    // In a real implementation, you would:
    // - Verify the signature against the wallet address
    // - Check if the message is recent and valid
    // - Validate the wallet address format
    
    if (!walletAddress || !signature || !message) {
      throw new Error('Wallet signature validation failed');
    }
  }

  private async validateSocialToken(
    provider: string,
    accessToken: string
  ): Promise<Record<string, any>> {
    // Placeholder for social token validation
    // In a real implementation, you would:
    // - Validate the access token with the social provider
    // - Extract user information from the provider
    // - Verify the token is not expired
    
    return {
      email: 'user@example.com',
      username: 'social_user',
      verified: true
    };
  }

  private async checkRateLimit(identifier: string): Promise<void> {
    if (!this.config.enableRateLimit) return;

    const now = new Date();
    const attempts = this.registrationAttempts.get(identifier) || { count: 0, lastAttempt: now };
    
    // Reset if window expired
    if (now.getTime() - attempts.lastAttempt.getTime() > this.config.rateLimitWindow * 60 * 1000) {
      attempts.count = 0;
    }

    if (attempts.count >= this.config.maxAttemptsPerWindow) {
      throw new Error('Too many registration attempts. Please try again later.');
    }

    attempts.count++;
    attempts.lastAttempt = now;
    this.registrationAttempts.set(identifier, attempts);
  }

  private async createUserFromRequest(request: RegistrationRequest): Promise<User> {
    const userId = this.generateId();
    const now = new Date();

    // Handle invitation/referral
    let invitedBy: string | undefined;
    let referralCode: string | undefined;
    
    if (request.inviteCode && this.config.enableInvitationSystem) {
      invitedBy = await this.validateInviteCode(request.inviteCode);
    }

    if (this.config.enableReferralSystem) {
      referralCode = this.generateReferralCode();
    }

    const user: User = {
      id: userId,
      email: request.email,
      username: request.username,
      walletAddresses: request.walletAddress ? [request.walletAddress] : [],
      status: UserStatus.PENDING_VERIFICATION,
      tier: this.config.defaultUserTier,
      verificationStatus: VerificationStatus.NOT_STARTED,
      isEmailVerified: request.registrationMethod === RegistrationMethod.EMAIL ? false : true,
      isPhoneVerified: false,
      isKYCVerified: false,
      registrationMethod: request.registrationMethod,
      registeredAt: now,
      invitedBy,
      referralCode,
      preferences: this.getDefaultPreferences(),
      settings: this.getDefaultSettings(),
      reputationScore: 0,
      totalAuctions: 0,
      totalBids: 0,
      winningRate: 0,
      metadata: request.metadata,
      tags: [],
      createdAt: now,
      updatedAt: now
    };

    // Store user
    this.users.set(userId, user);
    
    // Update indexes
    if (user.email) {
      this.emailToUserId.set(user.email, userId);
    }
    
    if (user.username) {
      this.usernameToUserId.set(user.username, userId);
    }
    
    for (const wallet of user.walletAddresses) {
      this.walletToUserId.set(wallet, userId);
    }

    return user;
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      notifications: {
        email: true,
        push: true,
        sms: false,
        inApp: true,
        auctionUpdates: true,
        bidUpdates: true,
        paymentUpdates: true,
        marketing: false
      },
      privacy: {
        profileVisibility: 'public',
        showActivity: true,
        showBiddingHistory: true,
        showWalletAddresses: false,
        allowDirectMessages: true,
        allowTagging: true
      },
      display: {
        theme: 'light',
        compactMode: false,
        showAdvancedFeatures: false,
        defaultView: 'grid',
        itemsPerPage: 20
      }
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      twoFactorEnabled: false,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      autoLogout: false,
      apiAccessEnabled: false,
      tradingEnabled: true,
      autoBidEnabled: false
    };
  }

  private async validateInviteCode(inviteCode: string): Promise<string | undefined> {
    // Placeholder for invite code validation
    // In a real implementation, you would:
    // - Check if the invite code exists and is valid
    // - Check if it has exceeded usage limits
    // - Return the inviter's user ID
    
    return undefined;
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Placeholder for email sending
    // In a real implementation, you would:
    // - Send verification email with the token
    // - Use a proper email service provider
    // - Track email delivery status
    
    console.log(`Sending verification email to ${email} with token ${token}`);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Analytics
  async getRegistrationAnalytics(
    period: { start: Date; end: Date }
  ): Promise<RegistrationAnalytics> {
    const requests = Array.from(this.registrationRequests.values())
      .filter(r => r.requestedAt >= period.start && r.requestedAt <= period.end);
    
    const users = Array.from(this.users.values())
      .filter(u => u.registeredAt >= period.start && u.registeredAt <= period.end);

    // Basic metrics
    const totalRegistrations = requests.length;
    const successfulRegistrations = users.length;
    const failedRegistrations = requests.filter(r => r.status === 'rejected').length;

    // By method
    const registrationsByMethod: Record<RegistrationMethod, number> = {
      [RegistrationMethod.EMAIL]: 0,
      [RegistrationMethod.WALLET]: 0,
      [RegistrationMethod.SOCIAL]: 0,
      [RegistrationMethod.INVITE]: 0
    };

    for (const request of requests) {
      registrationsByMethod[request.registrationMethod]++;
    }

    // By tier
    const registrationsByTier: Record<UserTier, number> = {
      [UserTier.BASIC]: 0,
      [UserTier.VERIFIED]: 0,
      [UserTier.PREMIUM]: 0,
      [UserTier.ENTERPRISE]: 0
    };

    for (const user of users) {
      registrationsByTier[user.tier]++;
    }

    // Verification rates
    const emailVerificationRate = users.filter(u => u.isEmailVerified).length / users.length;
    const phoneVerificationRate = users.filter(u => u.isPhoneVerified).length / users.length;
    const kycVerificationRate = users.filter(u => u.isKYCVerified).length / users.length;

    // Geographic distribution (placeholder)
    const registrationsByCountry: Record<string, number> = {};

    // Daily trends
    const dailyMap = new Map<string, { date: Date; count: number; method: RegistrationMethod }>();
    for (const request of requests) {
      const dateKey = request.requestedAt.toISOString().substring(0, 10);
      const existing = dailyMap.get(dateKey);
      if (existing) {
        existing.count++;
      } else {
        dailyMap.set(dateKey, {
          date: request.requestedAt,
          count: 1,
          method: request.registrationMethod
        });
      }
    }

    const dailyRegistrations = Array.from(dailyMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      period,
      totalRegistrations,
      successfulRegistrations,
      failedRegistrations,
      registrationsByMethod,
      registrationsByTier,
      emailVerificationRate,
      phoneVerificationRate,
      kycVerificationRate,
      averageVerificationTime: 0, // Would calculate from verification timestamps
      registrationsByCountry,
      dailyRegistrations,
      duplicateRegistrations: 0, // Would detect duplicates
      suspiciousRegistrations: 0, // Would detect suspicious patterns
      botRegistrations: 0 // Would detect bot registrations
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalUsers = this.users.size;
    const pendingRequests = Array.from(this.registrationRequests.values())
      .filter(r => r.status === 'pending').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (pendingRequests > 1000) {
      status = 'unhealthy';
    } else if (pendingRequests > 500) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalUsers,
        pendingRequests,
        emailVerificationEnabled: this.config.requireEmailVerification,
        walletRegistrationEnabled: this.config.allowWalletRegistration
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        users: Array.from(this.users.values()),
        registrationRequests: Array.from(this.registrationRequests.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for users
      const headers = [
        'ID', 'Email', 'Username', 'Status', 'Tier', 'Registration Method',
        'Registered At', 'Last Login At', 'Is Email Verified', 'Is KYC Verified'
      ];
      
      const rows = Array.from(this.users.values()).map(u => [
        u.id,
        u.email || '',
        u.username || '',
        u.status,
        u.tier,
        u.registrationMethod,
        u.registeredAt.toISOString(),
        u.lastLoginAt?.toISOString() || '',
        u.isEmailVerified,
        u.isKYCVerified
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
