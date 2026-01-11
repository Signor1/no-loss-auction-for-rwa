import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';

// Enums
export enum MFAMethod {
  SMS = 'sms',
  EMAIL = 'email',
  TOTP = 'totp',
  PUSH = 'push',
  BACKUP_CODE = 'backup_code',
  HARDWARE_TOKEN = 'hardware_token',
  BIOMETRIC = 'biometric'
}

export enum MFAStatus {
  DISABLED = 'disabled',
  ENABLED = 'enabled',
  PENDING_SETUP = 'pending_setup',
  LOCKED = 'locked'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Interfaces
export interface MFAConfig {
  userId: string;
  methods: MFAMethod[];
  primaryMethod: MFAMethod;
  backupMethods: MFAMethod[];
  status: MFAStatus;
  
  // TOTP configuration
  totpSecret?: string;
  totpBackupCodes?: string[];
  
  // SMS configuration
  phoneNumber?: string;
  phoneCountryCode?: string;
  
  // Email configuration
  email?: string;
  
  // Push configuration
  pushDeviceId?: string;
  pushToken?: string;
  
  // Hardware token
  hardwareTokenId?: string;
  
  // Settings
  rememberDevice: boolean;
  trustedDeviceExpiry: number; // days
  maxAttempts: number;
  lockoutDuration: number; // minutes
  requireMFAForSensitive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
  lockedAt?: Date;
  unlockedAt?: Date;
}

export interface MFAVerification {
  id: string;
  userId: string;
  method: MFAMethod;
  code?: string;
  challenge?: string;
  response?: string;
  
  // Status
  status: VerificationStatus;
  attempts: number;
  maxAttempts: number;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  
  // Timing
  createdAt: Date;
  expiresAt: Date;
  verifiedAt?: Date;
  failedAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod;
  challenge: string;
  challengeData: Record<string, any>;
  
  // QR code for TOTP
  qrCode?: string;
  secret?: string;
  
  // SMS/Email content
  message?: string;
  
  // Push notification data
  pushData?: Record<string, any>;
  
  // Timing
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  
  // Status
  status: 'active' | 'used' | 'expired';
}

export interface MFASession {
  id: string;
  userId: string;
  sessionId: string;
  deviceId?: string;
  isTrusted: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface MFAAnalytics {
  period: { start: Date; end: Date };
  
  // Usage metrics
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  successRate: number;
  
  // Method distribution
  verificationsByMethod: Record<MFAMethod, number>;
  methodSuccessRates: Record<MFAMethod, number>;
  
  // Security metrics
  failedAttempts: number;
  lockouts: number;
  suspiciousActivities: number;
  
  // User metrics
  usersWithMFA: number;
  usersByMethod: Record<MFAMethod, number>;
  newMFASetups: number;
  
  // Performance metrics
  averageVerificationTime: number;
  verificationAttemptsPerUser: number;
  
  // Trends
  dailyVerifications: {
    date: Date;
    count: number;
    successRate: number;
  }[];
}

// Main Multi-Factor Authentication Service
export class MultiFactorAuthenticationService extends EventEmitter {
  private mfaConfigs: Map<string, MFAConfig> = new Map();
  private verifications: Map<string, MFAVerification> = new Map();
  private challenges: Map<string, MFAChallenge> = new Map();
  private trustedSessions: Map<string, MFASession> = new Map();
  private rateLimitTracker: Map<string, { count: number; windowStart: Date }> = new Map();

  constructor() {
    super();
  }

  // MFA Configuration Management
  async enableMFA(
    userId: string,
    method: MFAMethod,
    config: {
      phoneNumber?: string;
      phoneCountryCode?: string;
      email?: string;
      pushDeviceId?: string;
      pushToken?: string;
      hardwareTokenId?: string;
      primaryMethod?: boolean;
    } = {}
  ): Promise<MFAConfig> {
    let mfaConfig = this.mfaConfigs.get(userId);
    
    if (!mfaConfig) {
      mfaConfig = {
        userId,
        methods: [],
        primaryMethod: method,
        backupMethods: [],
        status: MFAStatus.PENDING_SETUP,
        rememberDevice: false,
        trustedDeviceExpiry: 30,
        maxAttempts: 3,
        lockoutDuration: 15,
        requireMFAForSensitive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Add method configuration
    switch (method) {
      case MFAMethod.SMS:
        if (!config.phoneNumber || !config.phoneCountryCode) {
          throw new Error('Phone number and country code required for SMS MFA');
        }
        mfaConfig.phoneNumber = config.phoneNumber;
        mfaConfig.phoneCountryCode = config.phoneCountryCode;
        break;
      
      case MFAMethod.EMAIL:
        if (!config.email) {
          throw new Error('Email required for email MFA');
        }
        mfaConfig.email = config.email;
        break;
      
      case MFAMethod.PUSH:
        if (!config.pushDeviceId || !config.pushToken) {
          throw new Error('Push device ID and token required for push MFA');
        }
        mfaConfig.pushDeviceId = config.pushDeviceId;
        mfaConfig.pushToken = config.pushToken;
        break;
      
      case MFAMethod.HARDWARE_TOKEN:
        if (!config.hardwareTokenId) {
          throw new Error('Hardware token ID required for hardware token MFA');
        }
        mfaConfig.hardwareTokenId = config.hardwareTokenId;
        break;
      
      case MFAMethod.TOTP:
        // Generate TOTP secret
        mfaConfig.totpSecret = this.generateTOTPSecret();
        mfaConfig.totpBackupCodes = this.generateBackupCodes();
        break;
    }

    // Add method to list
    if (!mfaConfig.methods.includes(method)) {
      mfaConfig.methods.push(method);
    }

    // Set as primary if specified
    if (config.primaryMethod || mfaConfig.methods.length === 1) {
      mfaConfig.primaryMethod = method;
    } else {
      // Add to backup methods
      if (!mfaConfig.backupMethods.includes(method)) {
        mfaConfig.backupMethods.push(method);
      }
    }

    mfaConfig.updatedAt = new Date();
    this.mfaConfigs.set(userId, mfaConfig);

    this.emit('mfaMethodEnabled', { userId, method, config: mfaConfig });
    return mfaConfig;
  }

  async disableMFA(userId: string, method: MFAMethod): Promise<boolean> {
    const mfaConfig = this.mfaConfigs.get(userId);
    if (!mfaConfig) {
      return false;
    }

    // Remove method from configuration
    mfaConfig.methods = mfaConfig.methods.filter(m => m !== method);
    mfaConfig.backupMethods = mfaConfig.backupMethods.filter(m => m !== method);

    // Clear method-specific data
    switch (method) {
      case MFAMethod.SMS:
        delete mfaConfig.phoneNumber;
        delete mfaConfig.phoneCountryCode;
        break;
      case MFAMethod.EMAIL:
        delete mfaConfig.email;
        break;
      case MFAMethod.PUSH:
        delete mfaConfig.pushDeviceId;
        delete mfaConfig.pushToken;
        break;
      case MFAMethod.HARDWARE_TOKEN:
        delete mfaConfig.hardwareTokenId;
        break;
      case MFAMethod.TOTP:
        delete mfaConfig.totpSecret;
        delete mfaConfig.totpBackupCodes;
        break;
    }

    // Update primary method if needed
    if (mfaConfig.primaryMethod === method && mfaConfig.methods.length > 0) {
      mfaConfig.primaryMethod = mfaConfig.methods[0];
      mfaConfig.backupMethods = mfaConfig.methods.slice(1);
    }

    // Update status
    if (mfaConfig.methods.length === 0) {
      mfaConfig.status = MFAStatus.DISABLED;
    }

    mfaConfig.updatedAt = new Date();
    this.mfaConfigs.set(userId, mfaConfig);

    this.emit('mfaMethodDisabled', { userId, method });
    return true;
  }

  async getMFAConfig(userId: string): Promise<MFAConfig | null> {
    return this.mfaConfigs.get(userId) || null;
  }

  async updateMFAConfig(
    userId: string,
    updates: {
      primaryMethod?: MFAMethod;
      rememberDevice?: boolean;
      trustedDeviceExpiry?: number;
      maxAttempts?: number;
      lockoutDuration?: number;
      requireMFAForSensitive?: boolean;
    }
  ): Promise<MFAConfig> {
    const mfaConfig = this.mfaConfigs.get(userId);
    if (!mfaConfig) {
      throw new Error('MFA not configured for user');
    }

    Object.assign(mfaConfig, updates);
    mfaConfig.updatedAt = new Date();
    this.mfaConfigs.set(userId, mfaConfig);

    this.emit('mfaConfigUpdated', { userId, config: mfaConfig });
    return mfaConfig;
  }

  // MFA Verification
  async initiateVerification(
    userId: string,
    method: MFAMethod,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      sessionId?: string;
    }
  ): Promise<MFAChallenge> {
    const mfaConfig = this.mfaConfigs.get(userId);
    if (!mfaConfig || !mfaConfig.methods.includes(method)) {
      throw new Error('MFA method not available for user');
    }

    if (mfaConfig.status === MFAStatus.LOCKED) {
      throw new Error('MFA is locked for this user');
    }

    // Check rate limiting
    await this.checkRateLimit(userId);

    const challengeId = this.generateId();
    const now = new Date();

    let challenge: MFAChallenge = {
      id: challengeId,
      userId,
      method,
      challenge: '',
      challengeData: {},
      createdAt: now,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
      status: 'active'
    };

    // Generate challenge based on method
    switch (method) {
      case MFAMethod.SMS:
        const smsCode = this.generateSMSCode();
        challenge.challenge = smsCode;
        challenge.message = `Your verification code is: ${smsCode}`;
        await this.sendSMSCode(mfaConfig.phoneNumber!, smsCode);
        break;
      
      case MFAMethod.EMAIL:
        const emailCode = this.generateEmailCode();
        challenge.challenge = emailCode;
        challenge.message = `Your verification code is: ${emailCode}`;
        await this.sendEmailCode(mfaConfig.email!, emailCode);
        break;
      
      case MFAMethod.TOTP:
        challenge.challenge = mfaConfig.totpSecret!;
        challenge.qrCode = this.generateQRCode(mfaConfig.totpSecret!, userId);
        break;
      
      case MFAMethod.PUSH:
        challenge.challenge = this.generatePushChallenge();
        challenge.pushData = {
          deviceId: mfaConfig.pushDeviceId,
          token: mfaConfig.pushToken,
          message: 'Please approve the login request'
        };
        await this.sendPushNotification(mfaConfig.pushToken!, challenge.challenge);
        break;
      
      case MFAMethod.HARDWARE_TOKEN:
        challenge.challenge = this.generateHardwareChallenge();
        challenge.challengeData = {
          tokenId: mfaConfig.hardwareTokenId,
          challenge: challenge.challenge
        };
        break;
      
      case MFAMethod.BACKUP_CODE:
        // Backup codes are pre-generated
        challenge.challenge = 'backup_code_required';
        break;
    }

    this.challenges.set(challengeId, challenge);
    this.emit('verificationInitiated', { userId, method, challenge });
    return challenge;
  }

  async verifyCode(
    challengeId: string,
    response: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      sessionId?: string;
    }
  ): Promise<MFAVerification> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.status !== 'active') {
      throw new Error('Challenge is not active');
    }

    if (Date.now() > challenge.expiresAt.getTime()) {
      challenge.status = 'expired';
      throw new Error('Challenge expired');
    }

    const verificationId = this.generateId();
    const now = new Date();

    const verification: MFAVerification = {
      id: verificationId,
      userId: challenge.userId,
      method: challenge.method,
      response,
      status: VerificationStatus.PENDING,
      attempts: 1,
      maxAttempts: 3,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      deviceId: context?.deviceId,
      sessionId: context?.sessionId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes
      metadata: {}
    };

    // Verify response based on method
    const isValid = await this.verifyResponse(challenge, response);
    
    if (isValid) {
      verification.status = VerificationStatus.VERIFIED;
      verification.verifiedAt = now;
      challenge.status = 'used';
      challenge.usedAt = now;

      // Update MFA config
      const mfaConfig = this.mfaConfigs.get(challenge.userId);
      if (mfaConfig) {
        mfaConfig.lastVerifiedAt = now;
        mfaConfig.status = MFAStatus.ENABLED;
      }

      // Create trusted session if device is remembered
      if (context?.deviceId && mfaConfig?.rememberDevice) {
        await this.createTrustedSession(
          challenge.userId,
          context.sessionId!,
          context.deviceId
        );
      }

      this.emit('verificationSuccessful', { verification, challenge });
    } else {
      verification.status = VerificationStatus.FAILED;
      verification.failedAt = now;

      // Check for lockout
      const failedAttempts = await this.getFailedAttempts(challenge.userId);
      const mfaConfig = this.mfaConfigs.get(challenge.userId);
      
      if (failedAttempts >= (mfaConfig?.maxAttempts || 3)) {
        await this.lockUserMFA(challenge.userId);
        verification.metadata.locked = true;
      }

      this.emit('verificationFailed', { verification, challenge });
    }

    this.verifications.set(verificationId, verification);
    return verification;
  }

  // Trusted Session Management
  async createTrustedSession(
    userId: string,
    sessionId: string,
    deviceId: string
  ): Promise<MFASession> {
    const mfaConfig = this.mfaConfigs.get(userId);
    if (!mfaConfig) {
      throw new Error('MFA not configured for user');
    }

    const trustedSession: MFASession = {
      id: this.generateId(),
      userId,
      sessionId,
      deviceId,
      isTrusted: true,
      expiresAt: new Date(Date.now() + mfaConfig.trustedDeviceExpiry * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastUsedAt: new Date()
    };

    this.trustedSessions.set(`${userId}:${sessionId}`, trustedSession);
    this.emit('trustedSessionCreated', trustedSession);
    return trustedSession;
  }

  async isTrustedSession(userId: string, sessionId: string): Promise<boolean> {
    const key = `${userId}:${sessionId}`;
    const trustedSession = this.trustedSessions.get(key);
    
    if (!trustedSession) {
      return false;
    }

    // Check expiry
    if (Date.now() > trustedSession.expiresAt.getTime()) {
      this.trustedSessions.delete(key);
      return false;
    }

    // Update last used
    trustedSession.lastUsedAt = new Date();
    return true;
  }

  async revokeTrustedSession(userId: string, sessionId: string): Promise<boolean> {
    const key = `${userId}:${sessionId}`;
    const revoked = this.trustedSessions.delete(key);
    
    if (revoked) {
      this.emit('trustedSessionRevoked', { userId, sessionId });
    }
    
    return revoked;
  }

  // Security Management
  async lockUserMFA(userId: string, reason?: string): Promise<void> {
    const mfaConfig = this.mfaConfigs.get(userId);
    if (!mfaConfig) {
      return;
    }

    mfaConfig.status = MFAStatus.LOCKED;
    mfaConfig.lockedAt = new Date();
    mfaConfig.metadata = { ...mfaConfig.metadata, lockReason: reason };

    this.emit('mfaLocked', { userId, reason });
  }

  async unlockUserMFA(userId: string, unlockedBy: string): Promise<void> {
    const mfaConfig = this.mfaConfigs.get(userId);
    if (!mfaConfig) {
      return;
    }

    mfaConfig.status = MFAStatus.ENABLED;
    mfaConfig.unlockedAt = new Date();
    mfaConfig.metadata = { ...mfaConfig.metadata, unlockedBy };

    this.emit('mfaUnlocked', { userId, unlockedBy });
  }

  // Private Methods
  private async verifyResponse(challenge: MFAChallenge, response: string): Promise<boolean> {
    switch (challenge.method) {
      case MFAMethod.SMS:
      case MFAMethod.EMAIL:
        return response === challenge.challenge;
      
      case MFAMethod.TOTP:
        return this.verifyTOTP(challenge.challenge, response);
      
      case MFAMethod.PUSH:
        return this.verifyPushResponse(challenge.challenge, response);
      
      case MFAMethod.HARDWARE_TOKEN:
        return this.verifyHardwareToken(challenge.challengeData.tokenId, response);
      
      case MFAMethod.BACKUP_CODE:
        const mfaConfig = this.mfaConfigs.get(challenge.userId);
        return mfaConfig?.totpBackupCodes?.includes(response) || false;
      
      default:
        return false;
    }
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes
    
    const tracker = this.rateLimitTracker.get(userId);
    
    if (!tracker || tracker.windowStart < windowStart) {
      this.rateLimitTracker.set(userId, {
        count: 1,
        windowStart: now
      });
    } else {
      tracker.count++;
      
      if (tracker.count > 10) { // Max 10 attempts per 15 minutes
        this.emit('rateLimitExceeded', { userId, count: tracker.count });
        throw new Error('Rate limit exceeded');
      }
    }
  }

  private async getFailedAttempts(userId: string): Promise<number> {
    const userVerifications = Array.from(this.verifications.values())
      .filter(v => v.userId === userId && v.status === VerificationStatus.FAILED);
    
    // Count only recent failures (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return userVerifications.filter(v => v.failedAt && v.failedAt > oneHourAgo).length;
  }

  // Code Generation
  private generateSMSCode(): string {
    return Math.random().toString().slice(2, 8);
  }

  private generateEmailCode(): string {
    return Math.random().toString().slice(2, 8);
  }

  private generateTOTPSecret(): string {
    return randomBytes(16).toString('base32');
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generatePushChallenge(): string {
    return randomBytes(16).toString('hex');
  }

  private generateHardwareChallenge(): string {
    return randomBytes(16).toString('hex');
  }

  // Communication Methods (placeholders)
  private async sendSMSCode(phoneNumber: string, code: string): Promise<void> {
    // Placeholder for SMS sending
    this.emit('smsSent', { phoneNumber, code });
  }

  private async sendEmailCode(email: string, code: string): Promise<void> {
    // Placeholder for email sending
    this.emit('emailSent', { email, code });
  }

  private async sendPushNotification(pushToken: string, challenge: string): Promise<void> {
    // Placeholder for push notification
    this.emit('pushSent', { pushToken, challenge });
  }

  // Verification Methods (placeholders)
  private verifyTOTP(secret: string, token: string): boolean {
    // Placeholder for TOTP verification
    // In a real implementation, you would use a library like 'otplib'
    return true;
  }

  private verifyPushResponse(challenge: string, response: string): boolean {
    // Placeholder for push response verification
    return response === 'approved';
  }

  private verifyHardwareToken(tokenId: string, response: string): boolean {
    // Placeholder for hardware token verification
    return true;
  }

  private generateQRCode(secret: string, userId: string): string {
    // Placeholder for QR code generation
    // In a real implementation, you would generate a proper TOTP QR code
    return `otpauth://totp/NoLossAuction:${userId}?secret=${secret}&issuer=NoLossAuction`;
  }

  private generateId(): string {
    return `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getMFAAnalytics(
    period: { start: Date; end: Date }
  ): Promise<MFAAnalytics> {
    const verifications = Array.from(this.verifications.values())
      .filter(v => v.createdAt >= period.start && v.createdAt <= period.end);

    const totalVerifications = verifications.length;
    const successfulVerifications = verifications.filter(v => v.status === VerificationStatus.VERIFIED).length;
    const failedVerifications = verifications.filter(v => v.status === VerificationStatus.FAILED).length;
    const successRate = totalVerifications > 0 ? successfulVerifications / totalVerifications : 0;

    // Method distribution
    const verificationsByMethod: Record<MFAMethod, number> = {
      [MFAMethod.SMS]: 0,
      [MFAMethod.EMAIL]: 0,
      [MFAMethod.TOTP]: 0,
      [MFAMethod.PUSH]: 0,
      [MFAMethod.BACKUP_CODE]: 0,
      [MFAMethod.HARDWARE_TOKEN]: 0,
      [MFAMethod.BIOMETRIC]: 0
    };

    for (const verification of verifications) {
      verificationsByMethod[verification.method]++;
    }

    const methodSuccessRates: Record<MFAMethod, number> = {} as Record<MFAMethod, number>;
    for (const method of Object.keys(verificationsByMethod) as MFAMethod[]) {
      const methodVerifications = verifications.filter(v => v.method === method);
      const methodSuccesses = methodVerifications.filter(v => v.status === VerificationStatus.VERIFIED).length;
      methodSuccessRates[method] = methodVerifications.length > 0 ? methodSuccesses / methodVerifications.length : 0;
    }

    // User metrics
    const usersWithMFA = this.mfaConfigs.size;
    const usersByMethod: Record<MFAMethod, number> = {} as Record<MFAMethod, number>;
    
    for (const config of this.mfaConfigs.values()) {
      for (const method of config.methods) {
        usersByMethod[method] = (usersByMethod[method] || 0) + 1;
      }
    }

    const newMFASetups = Array.from(this.mfaConfigs.values())
      .filter(c => c.createdAt >= period.start && c.createdAt <= period.end).length;

    // Security metrics
    const failedAttempts = verifications.filter(v => v.status === VerificationStatus.FAILED).length;
    const lockouts = Array.from(this.mfaConfigs.values())
      .filter(c => c.lockedAt && c.lockedAt >= period.start && c.lockedAt <= period.end).length;
    const suspiciousActivities = 0; // Would track from security monitoring

    // Performance metrics
    const averageVerificationTime = 0; // Would measure from verification timestamps
    const verificationAttemptsPerUser = totalVerifications / usersWithMFA;

    // Daily trends
    const dailyVerifications: MFAAnalytics['dailyVerifications'] = [];
    // Would aggregate by date

    return {
      period,
      totalVerifications,
      successfulVerifications,
      failedVerifications,
      successRate,
      verificationsByMethod,
      methodSuccessRates,
      failedAttempts,
      lockouts,
      suspiciousActivities,
      usersWithMFA,
      usersByMethod,
      newMFASetups,
      averageVerificationTime,
      verificationAttemptsPerUser,
      dailyVerifications
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredData(), 5 * 60 * 1000); // Every 5 minutes
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  private async cleanupExpiredData(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up expired challenges
    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt.getTime()) {
        challenge.status = 'expired';
        cleanedCount++;
      }
    }

    // Clean up expired verifications
    for (const [verificationId, verification] of this.verifications.entries()) {
      if (now > verification.expiresAt.getTime()) {
        if (verification.status === VerificationStatus.PENDING) {
          verification.status = VerificationStatus.EXPIRED;
        }
        cleanedCount++;
      }
    }

    // Clean up expired trusted sessions
    for (const [key, session] of this.trustedSessions.entries()) {
      if (now > session.expiresAt.getTime()) {
        this.trustedSessions.delete(key);
        cleanedCount++;
      }
    }

    this.emit('dataCleanedUp', { count: cleanedCount });
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalConfigs: this.mfaConfigs.size,
        activeVerifications: Array.from(this.verifications.values())
          .filter(v => v.status === VerificationStatus.PENDING).length,
        activeChallenges: Array.from(this.challenges.values())
          .filter(c => c.status === 'active').length,
        trustedSessions: this.trustedSessions.size,
        usersWithMFA: this.mfaConfigs.size
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        mfaConfigs: Array.from(this.mfaConfigs.values()),
        verifications: Array.from(this.verifications.values()),
        challenges: Array.from(this.challenges.values()),
        trustedSessions: Array.from(this.trustedSessions.values())
      }, null, 2);
    } else {
      const headers = [
        'User ID', 'Methods', 'Primary Method', 'Status', 'Created At', 'Last Verified'
      ];
      const rows = Array.from(this.mfaConfigs.values()).map(c => [
        c.userId,
        c.methods.join(','),
        c.primaryMethod,
        c.status,
        c.createdAt.toISOString(),
        c.lastVerifiedAt?.toISOString() || ''
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
