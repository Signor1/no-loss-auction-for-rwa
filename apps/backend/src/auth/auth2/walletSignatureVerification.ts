import { EventEmitter } from 'events';
import { ethers } from 'ethers';

// Enums
export enum WalletType {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BSC = 'bsc',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  AVALANCHE = 'avalanche',
  SOLANA = 'solana',
  BITCOIN = 'bitcoin'
}

export enum SignatureType {
  PERSONAL_MESSAGE = 'personal_message',
  EIP712_TYPED_DATA = 'eip712_typed_data',
  TRANSACTION = 'transaction',
  DELEGATION = 'delegation'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

// Interfaces
export interface SignatureRequest {
  id: string;
  userId: string;
  walletAddress: string;
  walletType: WalletType;
  signatureType: SignatureType;
  
  // Message data
  message: string;
  nonce: string;
  domain?: any; // EIP-712 domain
  types?: any; // EIP-712 types
  value?: any; // EIP-712 value
  
  // Verification data
  signature?: string;
  recoveredAddress?: string;
  
  // Status
  status: VerificationStatus;
  attempts: number;
  maxAttempts: number;
  
  // Security
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  
  // Timing
  createdAt: Date;
  expiresAt: Date;
  verifiedAt?: Date;
  failedAt?: Date;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface VerificationResult {
  valid: boolean;
  address: string;
  signature: string;
  message: string;
  timestamp: Date;
  walletType: WalletType;
  verificationTime: number; // milliseconds
  metadata: Record<string, any>;
}

export interface WalletVerificationConfig {
  supportedWalletTypes: WalletType[];
  defaultExpiry: number; // minutes
  maxAttempts: number;
  enableNonceTracking: boolean;
  enableRateLimiting: boolean;
  rateLimitWindow: number; // minutes
  maxRequestsPerWindow: number;
  enableSecurityChecks: boolean;
  enableLogging: boolean;
  enableCaching: boolean;
  cacheExpiry: number; // minutes
  enableAnalytics: boolean;
}

export interface VerificationAnalytics {
  period: { start: Date; end: Date };
  
  // Volume metrics
  totalRequests: number;
  successfulVerifications: number;
  failedVerifications: number;
  successRate: number;
  
  // Type distribution
  requestsByType: Record<SignatureType, number>;
  requestsByWalletType: Record<WalletType, number>;
  
  // Performance metrics
  averageVerificationTime: number;
  requestsPerMinute: number;
  
  // Security metrics
  suspiciousRequests: number;
  blockedRequests: number;
  rateLimitedRequests: number;
  
  // Geographic distribution
  requestsByCountry: Record<string, number>;
  
  // Error analysis
  errorsByType: Record<string, number>;
  
  // Trends
  hourlyRequests: {
    hour: number;
    requests: number;
    successRate: number;
  }[];
}

// Main Wallet Signature Verification Service
export class WalletSignatureVerificationService extends EventEmitter {
  private signatureRequests: Map<string, SignatureRequest> = new Map();
  private userRequests: Map<string, string[]> = new Map();
  private nonces: Map<string, { nonce: string; used: boolean; expiresAt: Date }> = new Map();
  private rateLimitTracker: Map<string, { count: number; windowStart: Date }> = new Map();
  private config: WalletVerificationConfig;
  private verificationCache: Map<string, VerificationResult> = new Map();

  constructor(config?: Partial<WalletVerificationConfig>) {
    super();
    this.config = {
      supportedWalletTypes: [
        WalletType.ETHEREUM,
        WalletType.POLYGON,
        WalletType.BSC,
        WalletType.ARBITRUM,
        WalletType.OPTIMISM,
        WalletType.AVALANCHE
      ],
      defaultExpiry: 15,
      maxAttempts: 3,
      enableNonceTracking: true,
      enableRateLimiting: true,
      rateLimitWindow: 15,
      maxRequestsPerWindow: 10,
      enableSecurityChecks: true,
      enableLogging: true,
      enableCaching: true,
      cacheExpiry: 5,
      enableAnalytics: true,
      ...config
    };
  }

  // Signature Request Creation
  async createSignatureRequest(
    userId: string,
    walletAddress: string,
    walletType: WalletType,
    signatureType: SignatureType,
    options: {
      customMessage?: string;
      domain?: any;
      types?: any;
      value?: any;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<SignatureRequest> {
    // Validate wallet type
    if (!this.config.supportedWalletTypes.includes(walletType)) {
      throw new Error(`Unsupported wallet type: ${walletType}`);
    }

    // Check rate limiting
    if (this.config.enableRateLimiting) {
      await this.checkRateLimit(userId);
    }

    // Generate nonce
    const nonce = this.generateNonce();
    
    // Create message
    const message = this.createMessage(
      walletAddress,
      nonce,
      signatureType,
      options.customMessage,
      options.domain,
      options.types,
      options.value
    );

    const requestId = this.generateId();
    const now = new Date();

    const request: SignatureRequest = {
      id: requestId,
      userId,
      walletAddress: walletAddress.toLowerCase(),
      walletType,
      signatureType,
      message,
      nonce,
      domain: options.domain,
      types: options.types,
      value: options.value,
      status: VerificationStatus.PENDING,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.config.defaultExpiry * 60 * 1000),
      metadata: options.metadata || {}
    };

    // Store request
    this.signatureRequests.set(requestId, request);
    
    // Update user requests index
    const userRequestIds = this.userRequests.get(userId) || [];
    userRequestIds.push(requestId);
    this.userRequests.set(userId, userRequestIds);

    // Store nonce if enabled
    if (this.config.enableNonceTracking) {
      this.nonces.set(nonce, {
        nonce,
        used: false,
        expiresAt: request.expiresAt
      });
    }

    this.emit('signatureRequestCreated', request);
    return request;
  }

  // Signature Verification
  async verifySignature(
    requestId: string,
    signature: string,
    context?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
    }
  ): Promise<VerificationResult> {
    const request = this.signatureRequests.get(requestId);
    if (!request) {
      throw new Error('Signature request not found');
    }

    if (request.status !== VerificationStatus.PENDING) {
      throw new Error(`Request is ${request.status}`);
    }

    if (new Date() > request.expiresAt) {
      request.status = VerificationStatus.EXPIRED;
      throw new Error('Signature request expired');
    }

    // Check attempts
    if (request.attempts >= request.maxAttempts) {
      request.status = VerificationStatus.FAILED;
      request.failedAt = new Date();
      throw new Error('Maximum attempts exceeded');
    }

    // Update request
    request.attempts++;
    request.signature = signature;
    request.ipAddress = context?.ipAddress;
    request.userAgent = context?.userAgent;
    request.deviceId = context?.deviceId;

    const startTime = Date.now();

    try {
      // Verify signature based on type
      const isValid = await this.verifySignatureByType(
        request.walletAddress,
        request.message,
        signature,
        request.signatureType,
        request.domain,
        request.types,
        request.value
      );

      const verificationTime = Date.now() - startTime;

      if (isValid) {
        // Update request status
        request.status = VerificationStatus.VERIFIED;
        request.verifiedAt = new Date();
        request.recoveredAddress = request.walletAddress;

        // Mark nonce as used
        if (this.config.enableNonceTracking) {
          const nonceRecord = this.nonces.get(request.nonce);
          if (nonceRecord) {
            nonceRecord.used = true;
          }
        }

        // Cache result if enabled
        if (this.config.enableCaching) {
          const cacheKey = this.generateCacheKey(request.walletAddress, signature, request.message);
          const result: VerificationResult = {
            valid: true,
            address: request.walletAddress,
            signature,
            message: request.message,
            timestamp: new Date(),
            walletType: request.walletType,
            verificationTime,
            metadata: {
              requestId,
              userId: request.userId,
              signatureType: request.signatureType
            }
          };
          this.verificationCache.set(cacheKey, result);
        }

        this.emit('signatureVerified', { request, verificationTime });
        return result;
      } else {
        request.status = VerificationStatus.FAILED;
        request.failedAt = new Date();
        throw new Error('Invalid signature');
      }

    } catch (error) {
      request.status = VerificationStatus.FAILED;
      request.failedAt = new Date();
      throw error;
    }
  }

  // EIP-712 Typed Data Support
  async createEIP712Request(
    userId: string,
    walletAddress: string,
    walletType: WalletType,
    domain: any,
    types: any,
    value: any
  ): Promise<SignatureRequest> {
    return this.createSignatureRequest(
      userId,
      walletAddress,
      walletType,
      SignatureType.EIP712_TYPED_DATA,
      { domain, types, value }
    );
  }

  // Transaction Verification
  async verifyTransactionSignature(
    userId: string,
    walletAddress: string,
    walletType: WalletType,
    transactionHash: string,
    expectedMessage: string
  ): Promise<VerificationResult> {
    // This would fetch the transaction from blockchain and verify
    // For now, create a simple verification
    const requestId = this.generateId();
    const now = new Date();

    const request: SignatureRequest = {
      id: requestId,
      userId,
      walletAddress: walletAddress.toLowerCase(),
      walletType,
      signatureType: SignatureType.TRANSACTION,
      message: expectedMessage,
      nonce: transactionHash,
      status: VerificationStatus.PENDING,
      attempts: 1,
      maxAttempts: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour for transactions
      metadata: { transactionHash }
    };

    // In a real implementation, you would:
    // 1. Fetch transaction from blockchain
    // 2. Verify it's from the expected address
    // 3. Check transaction data matches expected message
    // 4. Verify transaction is confirmed

    const result: VerificationResult = {
      valid: true,
      address: walletAddress,
      signature: transactionHash,
      message: expectedMessage,
      timestamp: new Date(),
      walletType,
      verificationTime: 0,
      metadata: { requestId, userId, transactionHash }
    };

    this.emit('transactionVerified', { request, result });
    return result;
  }

  // Request Management
  async getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
    return this.signatureRequests.get(requestId) || null;
  }

  async getUserSignatureRequests(
    userId: string,
    status?: VerificationStatus,
    limit = 50
  ): Promise<SignatureRequest[]> {
    const userRequestIds = this.userRequests.get(userId) || [];
    const requests = userRequestIds
      .map(id => this.signatureRequests.get(id))
      .filter((r): r is SignatureRequest => r !== undefined);

    let filteredRequests = requests;
    if (status) {
      filteredRequests = filteredRequests.filter(r => r.status === status);
    }

    return filteredRequests
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async cancelSignatureRequest(requestId: string, reason?: string): Promise<boolean> {
    const request = this.signatureRequests.get(requestId);
    if (!request || request.status !== VerificationStatus.PENDING) {
      return false;
    }

    request.status = VerificationStatus.CANCELLED;
    request.metadata.cancellationReason = reason;

    this.emit('signatureRequestCancelled', { request, reason });
    return true;
  }

  // Security Methods
  async checkRateLimit(userId: string): Promise<void> {
    if (!this.config.enableRateLimiting) return;

    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.rateLimitWindow * 60 * 1000);
    
    const tracker = this.rateLimitTracker.get(userId);
    
    if (!tracker || tracker.windowStart < windowStart) {
      // Reset window
      this.rateLimitTracker.set(userId, {
        count: 1,
        windowStart: now
      });
    } else {
      tracker.count++;
      
      if (tracker.count > this.config.maxRequestsPerWindow) {
        this.emit('rateLimitExceeded', { userId, count: tracker.count });
        throw new Error('Rate limit exceeded');
      }
    }
  }

  async checkSuspiciousActivity(
    request: SignatureRequest,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<boolean> {
    // Placeholder for suspicious activity detection
    // In a real implementation, you would check:
    // - IP address reputation
    // - User agent patterns
    // - Request frequency patterns
    // - Geographic anomalies
    // - Known attack patterns
    
    let suspiciousScore = 0;

    // Check for rapid requests
    const userRequests = await this.getUserSignatureRequests(request.userId, VerificationStatus.PENDING, 10);
    if (userRequests.length > 5) {
      suspiciousScore += 0.3;
    }

    // Check for failed attempts
    const failedRequests = await this.getUserSignatureRequests(request.userId, VerificationStatus.FAILED, 10);
    if (failedRequests.length > 3) {
      suspiciousScore += 0.4;
    }

    if (suspiciousScore > 0.5) {
      this.emit('suspiciousActivityDetected', { request, score: suspiciousScore });
      return true;
    }

    return false;
  }

  // Private Methods
  private async verifySignatureByType(
    address: string,
    message: string,
    signature: string,
    type: SignatureType,
    domain?: any,
    types?: any,
    value?: any
  ): Promise<boolean> {
    try {
      switch (type) {
        case SignatureType.PERSONAL_MESSAGE:
          return this.verifyPersonalMessage(address, message, signature);
        
        case SignatureType.EIP712_TYPED_DATA:
          if (!domain || !types || !value) {
            throw new Error('EIP-712 requires domain, types, and value');
          }
          return this.verifyEIP712TypedData(address, domain, types, value, signature);
        
        case SignatureType.TRANSACTION:
          return this.verifyTransaction(address, message, signature);
        
        case SignatureType.DELEGATION:
          return this.verifyDelegation(address, message, signature);
        
        default:
          throw new Error(`Unsupported signature type: ${type}`);
      }
    } catch (error) {
      if (this.config.enableLogging) {
        this.emit('verificationError', { address, message, signature, type, error });
      }
      return false;
    }
  }

  private verifyPersonalMessage(address: string, message: string, signature: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  private verifyEIP712TypedData(
    address: string,
    domain: any,
    types: any,
    value: any,
    signature: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  private verifyTransaction(address: string, message: string, signature: string): boolean {
    // Placeholder for transaction verification
    // In a real implementation, you would:
    // 1. Decode the transaction
    // 2. Verify the signature
    // 3. Check the sender address
    return true;
  }

  private verifyDelegation(address: string, message: string, signature: string): boolean {
    // Placeholder for delegation verification
    // Similar to personal message but with delegation-specific validation
    return this.verifyPersonalMessage(address, message, signature);
  }

  private createMessage(
    address: string,
    nonce: string,
    type: SignatureType,
    customMessage?: string,
    domain?: any,
    types?: any,
    value?: any
  ): string {
    if (customMessage) {
      return customMessage;
    }

    switch (type) {
      case SignatureType.PERSONAL_MESSAGE:
        return `Welcome to No-Loss Auction!\n\nPlease sign this message to verify your wallet ownership.\n\nWallet: ${address}\nNonce: ${nonce}\n\nThis request will expire in ${this.config.defaultExpiry} minutes.`;
      
      case SignatureType.EIP712_TYPED_DATA:
        // For EIP-712, the message is constructed from domain, types, and value
        return JSON.stringify({ domain, types, value });
      
      case SignatureType.TRANSACTION:
        return `Transaction verification for wallet ${address}\nNonce: ${nonce}`;
      
      case SignatureType.DELEGATION:
        return `Delegation authorization for wallet ${address}\nNonce: ${nonce}\n\nThis authorizes delegated access to your account.`;
      
      default:
        return `Verification message for wallet ${address}\nNonce: ${nonce}`;
    }
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  private generateId(): string {
    return `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(address: string, signature: string, message: string): string {
    return `${address}_${signature}_${message}`;
  }

  // Cleanup
  async cleanupExpiredRequests(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [requestId, request] of this.signatureRequests.entries()) {
      if (now > request.expiresAt && request.status === VerificationStatus.PENDING) {
        request.status = VerificationStatus.EXPIRED;
        cleanedCount++;
      }
    }

    // Clean up expired nonces
    for (const [nonce, record] of this.nonces.entries()) {
      if (now > record.expiresAt) {
        this.nonces.delete(nonce);
      }
    }

    // Clean up expired cache entries
    if (this.config.enableCaching) {
      const cacheExpiryTime = new Date(now.getTime() - this.config.cacheExpiry * 60 * 1000);
      for (const [key, result] of this.verificationCache.entries()) {
        if (result.timestamp < cacheExpiryTime) {
          this.verificationCache.delete(key);
        }
      }
    }

    this.emit('requestsCleanedUp', { count: cleanedCount });
    return cleanedCount;
  }

  // Analytics
  async getVerificationAnalytics(
    period: { start: Date; end: Date }
  ): Promise<VerificationAnalytics> {
    const requests = Array.from(this.signatureRequests.values())
      .filter(r => r.createdAt >= period.start && r.createdAt <= period.end);

    const totalRequests = requests.length;
    const successfulVerifications = requests.filter(r => r.status === VerificationStatus.VERIFIED).length;
    const failedVerifications = requests.filter(r => r.status === VerificationStatus.FAILED).length;
    const successRate = totalRequests > 0 ? successfulVerifications / totalRequests : 0;

    // Type distribution
    const requestsByType: Record<SignatureType, number> = {
      [SignatureType.PERSONAL_MESSAGE]: 0,
      [SignatureType.EIP712_TYPED_DATA]: 0,
      [SignatureType.TRANSACTION]: 0,
      [SignatureType.DELEGATION]: 0
    };

    for (const request of requests) {
      requestsByType[request.signatureType]++;
    }

    // Wallet type distribution
    const requestsByWalletType: Record<WalletType, number> = {
      [WalletType.ETHEREUM]: 0,
      [WalletType.POLYGON]: 0,
      [WalletType.BSC]: 0,
      [WalletType.ARBITRUM]: 0,
      [WalletType.OPTIMISM]: 0,
      [WalletType.AVALANCHE]: 0,
      [WalletType.SOLANA]: 0,
      [WalletType.BITCOIN]: 0
    };

    for (const request of requests) {
      requestsByWalletType[request.walletType]++;
    }

    // Performance metrics
    const verificationTimes = Array.from(this.verificationCache.values())
      .filter(r => r.timestamp >= period.start && r.timestamp <= period.end)
      .map(r => r.verificationTime);
    
    const averageVerificationTime = verificationTimes.length > 0
      ? verificationTimes.reduce((sum, time) => sum + time, 0) / verificationTimes.length
      : 0;

    const requestsPerMinute = totalRequests / ((period.end.getTime() - period.start.getTime()) / (1000 * 60));

    // Security metrics
    const suspiciousRequests = requests.filter(r => r.metadata.suspiciousScore > 0.5).length;
    const blockedRequests = requests.filter(r => r.metadata.blocked).length;
    const rateLimitedRequests = requests.filter(r => r.metadata.rateLimited).length;

    // Hourly distribution
    const hourlyRequests: VerificationAnalytics['hourlyRequests'] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourRequests = requests.filter(r => r.createdAt.getHours() === hour);
      const hourSuccesses = hourRequests.filter(r => r.status === VerificationStatus.VERIFIED).length;
      const hourSuccessRate = hourRequests.length > 0 ? hourSuccesses / hourRequests.length : 0;
      
      hourlyRequests.push({
        hour,
        requests: hourRequests.length,
        successRate: hourSuccessRate
      });
    }

    return {
      period,
      totalRequests,
      successfulVerifications,
      failedVerifications,
      successRate,
      requestsByType,
      requestsByWalletType,
      averageVerificationTime,
      requestsPerMinute,
      suspiciousRequests,
      blockedRequests,
      rateLimitedRequests,
      requestsByCountry: {}, // Would track from IP addresses
      errorsByType: {}, // Would track from error logs
      hourlyRequests
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Start cleanup interval
    setInterval(() => this.cleanupExpiredRequests(), 5 * 60 * 1000); // Every 5 minutes
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      details: {
        totalRequests: this.signatureRequests.size,
        pendingRequests: Array.from(this.signatureRequests.values())
          .filter(r => r.status === VerificationStatus.PENDING).length,
        cacheSize: this.verificationCache.size,
        rateLimitingEnabled: this.config.enableRateLimiting,
        cachingEnabled: this.config.enableCaching
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        signatureRequests: Array.from(this.signatureRequests.values()),
        config: this.config
      }, null, 2);
    } else {
      const headers = [
        'ID', 'User ID', 'Wallet Address', 'Wallet Type', 'Signature Type',
        'Status', 'Created At', 'Expires At', 'Attempts'
      ];
      const rows = Array.from(this.signatureRequests.values()).map(r => [
        r.id,
        r.userId,
        r.walletAddress,
        r.walletType,
        r.signatureType,
        r.status,
        r.createdAt.toISOString(),
        r.expiresAt.toISOString(),
        r.attempts
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
