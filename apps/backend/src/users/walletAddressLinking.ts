import { EventEmitter } from 'events';

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

export enum LinkStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended'
}

export enum VerificationMethod {
  SIGNATURE = 'signature',
  TRANSACTION = 'transaction',
  DELEGATION = 'delegation',
  MULTI_SIG = 'multi_sig'
}

// Interfaces
export interface WalletLink {
  id: string;
  userId: string;
  address: string;
  type: WalletType;
  nickname?: string;
  
  // Verification
  status: LinkStatus;
  verificationMethod: VerificationMethod;
  verifiedAt?: Date;
  verificationData?: Record<string, any>;
  
  // Security
  isPrimary: boolean;
  isDelegated: boolean;
  delegatorAddress?: string;
  delegationExpiry?: Date;
  
  // Activity tracking
  lastUsedAt?: Date;
  totalTransactions: number;
  totalVolume: number;
  
  // Permissions
  permissions: WalletPermission[];
  
  // Metadata
  label?: string;
  description?: string;
  tags: string[];
  metadata: Record<string, any>;
  
  // Timestamps
  linkedAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
}

export interface WalletPermission {
  action: 'bid' | 'create_auction' | 'withdraw' | 'transfer' | 'approve' | 'delegate';
  allowed: boolean;
  limits?: {
    maxAmount?: number;
    dailyLimit?: number;
    monthlyLimit?: number;
  };
  conditions?: {
    minReputation?: number;
    kycRequired?: boolean;
    timeRestrictions?: {
      startHour: number;
      endHour: number;
      timezone: string;
    };
  };
}

export interface VerificationRequest {
  id: string;
  userId: string;
  address: string;
  type: WalletType;
  method: VerificationMethod;
  
  // Verification data
  message?: string;
  signature?: string;
  transactionHash?: string;
  nonce?: string;
  
  // Status
  status: 'pending' | 'verified' | 'failed' | 'expired';
  attempts: number;
  maxAttempts: number;
  
  // Security
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  
  // Timestamps
  requestedAt: Date;
  expiresAt: Date;
  verifiedAt?: Date;
  failedAt?: Date;
}

export interface WalletLinkConfig {
  maxWalletsPerUser: number;
  requireVerification: boolean;
  verificationExpiry: number; // minutes
  maxVerificationAttempts: number;
  enableDelegation: boolean;
  delegationExpiry: number; // days
  requirePrimaryWallet: boolean;
  allowMultiplePrimary: boolean;
  enablePermissions: boolean;
  defaultPermissions: WalletPermission[];
  enableActivityTracking: boolean;
  enableSecurityMonitoring: boolean;
  suspiciousActivityThreshold: number;
  supportedWalletTypes: WalletType[];
}

export interface WalletAnalytics {
  period: { start: Date; end: Date };
  
  // Linking metrics
  totalLinks: number;
  newLinks: number;
  linksByType: Record<WalletType, number>;
  linksByStatus: Record<LinkStatus, number>;
  
  // Verification metrics
  verificationRequests: number;
  verificationSuccessRate: number;
  averageVerificationTime: number;
  verificationByMethod: Record<VerificationMethod, number>;
  
  // Activity metrics
  activeWallets: number;
  totalTransactions: number;
  totalVolume: number;
  averageTransactionsPerWallet: number;
  
  // Security metrics
  suspiciousActivities: number;
  revokedLinks: number;
  failedVerifications: number;
  
  // Geographic distribution
  walletsByRegion: Record<string, number>;
  
  // Trends
  dailyLinks: {
    date: Date;
    count: number;
    type: WalletType;
  }[];
}

// Main Wallet Address Linking Service
export class WalletAddressLinkingService extends EventEmitter {
  private walletLinks: Map<string, WalletLink> = new Map();
  private verificationRequests: Map<string, VerificationRequest> = new Map();
  private userIdToWallets: Map<string, string[]> = new Map();
  private addressToUserId: Map<string, string> = new Map();
  private config: WalletLinkConfig;
  private verificationAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(config?: Partial<WalletLinkConfig>) {
    super();
    this.config = {
      maxWalletsPerUser: 5,
      requireVerification: true,
      verificationExpiry: 15,
      maxVerificationAttempts: 3,
      enableDelegation: true,
      delegationExpiry: 30,
      requirePrimaryWallet: true,
      allowMultiplePrimary: false,
      enablePermissions: true,
      defaultPermissions: [
        {
          action: 'bid',
          allowed: true,
          limits: { dailyLimit: 1000 }
        },
        {
          action: 'create_auction',
          allowed: true,
          limits: { monthlyLimit: 50 }
        }
      ],
      enableActivityTracking: true,
      enableSecurityMonitoring: true,
      suspiciousActivityThreshold: 10,
      supportedWalletTypes: [
        WalletType.ETHEREUM,
        WalletType.POLYGON,
        WalletType.BSC,
        WalletType.ARBITRUM,
        WalletType.OPTIMISM,
        WalletType.AVALANCHE
      ],
      ...config
    };
  }

  // Wallet Linking
  async linkWallet(
    userId: string,
    address: string,
    type: WalletType,
    options: {
      nickname?: string;
      isPrimary?: boolean;
      permissions?: WalletPermission[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<VerificationRequest> {
    // Validate inputs
    await this.validateWalletLink(userId, address, type);

    // Check if wallet already linked
    if (this.addressToUserId.has(address)) {
      throw new Error('Wallet address already linked to another user');
    }

    // Check user wallet limit
    const userWallets = await this.getUserWallets(userId);
    if (userWallets.length >= this.config.maxWalletsPerUser) {
      throw new Error(`Maximum wallet limit of ${this.config.maxWalletsPerUser} reached`);
    }

    // Check primary wallet constraint
    if (options.isPrimary && !this.config.allowMultiplePrimary) {
      const existingPrimary = userWallets.find(w => w.isPrimary);
      if (existingPrimary) {
        throw new Error('User already has a primary wallet');
      }
    }

    // Create verification request
    const requestId = this.generateId();
    const nonce = this.generateNonce();
    const message = this.createVerificationMessage(address, nonce);

    const verificationRequest: VerificationRequest = {
      id: requestId,
      userId,
      address,
      type,
      method: VerificationMethod.SIGNATURE,
      message,
      nonce,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.config.maxVerificationAttempts,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.verificationExpiry * 60 * 1000)
    };

    this.verificationRequests.set(requestId, verificationRequest);
    
    this.emit('walletLinkRequested', { userId, address, type, verificationRequest });
    return verificationRequest;
  }

  async verifyWallet(
    requestId: string,
    signature: string,
    options: {
      nickname?: string;
      isPrimary?: boolean;
      permissions?: WalletPermission[];
    } = {}
  ): Promise<WalletLink> {
    const request = this.verificationRequests.get(requestId);
    if (!request) {
      throw new Error('Verification request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Verification request already processed');
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      throw new Error('Verification request expired');
    }

    // Check attempt limit
    await this.checkVerificationAttempts(request.address);

    // Verify signature
    const isValid = await this.verifySignature(
      request.address,
      request.message!,
      signature
    );

    if (!isValid) {
      request.attempts++;
      if (request.attempts >= request.maxAttempts) {
        request.status = 'failed';
        request.failedAt = new Date();
      }
      throw new Error('Invalid signature');
    }

    // Create wallet link
    const walletLink = await this.createWalletLink(request, options);
    
    // Update request
    request.status = 'verified';
    request.verifiedAt = new Date();
    request.signature = signature;

    this.emit('walletVerified', { walletLink, verificationRequest: request });
    return walletLink;
  }

  async linkWalletWithTransaction(
    userId: string,
    address: string,
    type: WalletType,
    transactionHash: string,
    options: {
      nickname?: string;
      isPrimary?: boolean;
      permissions?: WalletPermission[];
    } = {}
  ): Promise<WalletLink> {
    // Validate inputs
    await this.validateWalletLink(userId, address, type);

    // Verify transaction
    const isValid = await this.verifyTransaction(address, transactionHash);
    if (!isValid) {
      throw new Error('Invalid transaction verification');
    }

    // Create verification request
    const requestId = this.generateId();
    
    const verificationRequest: VerificationRequest = {
      id: requestId,
      userId,
      address,
      type,
      method: VerificationMethod.TRANSACTION,
      transactionHash,
      status: 'pending',
      attempts: 1,
      maxAttempts: 1,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.verificationExpiry * 60 * 1000)
    };

    this.verificationRequests.set(requestId, verificationRequest);

    // Create wallet link
    const walletLink = await this.createWalletLink(verificationRequest, options);
    
    // Update request
    verificationRequest.status = 'verified';
    verificationRequest.verifiedAt = new Date();

    this.emit('walletVerified', { walletLink, verificationRequest });
    return walletLink;
  }

  // Wallet Management
  async getWallet(walletId: string): Promise<WalletLink | null> {
    return this.walletLinks.get(walletId) || null;
  }

  async getWalletByAddress(address: string): Promise<WalletLink | null> {
    const userId = this.addressToUserId.get(address);
    if (!userId) return null;

    const userWallets = await this.getUserWallets(userId);
    return userWallets.find(w => w.address.toLowerCase() === address.toLowerCase()) || null;
  }

  async getUserWallets(userId: string): Promise<WalletLink[]> {
    const walletIds = this.userIdToWallets.get(userId) || [];
    return walletIds
      .map(id => this.walletLinks.get(id))
      .filter((w): w is WalletLink => w !== undefined)
      .sort((a, b) => {
        // Primary wallet first
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        // Then by linked date
        return b.linkedAt.getTime() - a.linkedAt.getTime();
      });
  }

  async updateWallet(
    walletId: string,
    updates: Partial<WalletLink>
  ): Promise<WalletLink> {
    const wallet = this.walletLinks.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Validate updates
    if (updates.isPrimary !== undefined && updates.isPrimary && !this.config.allowMultiplePrimary) {
      const userWallets = await this.getUserWallets(wallet.userId);
      const existingPrimary = userWallets.find(w => w.isPrimary && w.id !== walletId);
      if (existingPrimary) {
        throw new Error('User already has a primary wallet');
      }
    }

    // Apply updates
    Object.assign(wallet, updates);
    wallet.updatedAt = new Date();

    this.emit('walletUpdated', { wallet, updates });
    return wallet;
  }

  async unlinkWallet(
    walletId: string,
    reason?: string
  ): Promise<boolean> {
    const wallet = this.walletLinks.get(walletId);
    if (!wallet) {
      return false;
    }

    // Check if primary wallet
    if (wallet.isPrimary && this.config.requirePrimaryWallet) {
      const userWallets = await this.getUserWallets(wallet.userId);
      if (userWallets.length === 1) {
        throw new Error('Cannot unlink primary wallet when it\'s the only wallet');
      }
    }

    // Update status
    wallet.status = LinkStatus.REVOKED;
    wallet.revokedAt = new Date();
    wallet.updatedAt = new Date();
    wallet.metadata.unlinkReason = reason;

    this.emit('walletUnlinked', { wallet, reason });
    return true;
  }

  // Delegation Management
  async delegateWallet(
    walletId: string,
    delegatorAddress: string,
    expiryDays?: number
  ): Promise<WalletLink> {
    if (!this.config.enableDelegation) {
      throw new Error('Wallet delegation is not enabled');
    }

    const wallet = this.walletLinks.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || this.config.delegationExpiry));

    wallet.isDelegated = true;
    wallet.delegatorAddress = delegatorAddress;
    wallet.delegationExpiry = expiryDate;
    wallet.updatedAt = new Date();

    this.emit('walletDelegated', { wallet, delegatorAddress, expiryDate });
    return wallet;
  }

  async revokeDelegation(walletId: string): Promise<boolean> {
    const wallet = this.walletLinks.get(walletId);
    if (!wallet || !wallet.isDelegated) {
      return false;
    }

    wallet.isDelegated = false;
    wallet.delegatorAddress = undefined;
    wallet.delegationExpiry = undefined;
    wallet.updatedAt = new Date();

    this.emit('delegationRevoked', { wallet });
    return true;
  }

  // Permission Management
  async updateWalletPermissions(
    walletId: string,
    permissions: WalletPermission[]
  ): Promise<WalletLink> {
    const wallet = this.walletLinks.get(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    wallet.permissions = permissions;
    wallet.updatedAt = new Date();

    this.emit('walletPermissionsUpdated', { wallet, permissions });
    return wallet;
  }

  async checkWalletPermission(
    walletId: string,
    action: WalletPermission['action'],
    amount?: number
  ): Promise<boolean> {
    const wallet = this.walletLinks.get(walletId);
    if (!wallet || wallet.status !== LinkStatus.ACTIVE) {
      return false;
    }

    const permission = wallet.permissions.find(p => p.action === action);
    if (!permission || !permission.allowed) {
      return false;
    }

    // Check amount limits
    if (amount && permission.limits) {
      if (permission.limits.maxAmount && amount > permission.limits.maxAmount) {
        return false;
      }
      
      if (permission.limits.dailyLimit) {
        // Would check daily usage
      }
      
      if (permission.limits.monthlyLimit) {
        // Would check monthly usage
      }
    }

    // Check conditions
    if (permission.conditions) {
      if (permission.conditions.minReputation) {
        // Would check user reputation
      }
      
      if (permission.conditions.kycRequired) {
        // Would check KYC status
      }
      
      if (permission.conditions.timeRestrictions) {
        const now = new Date();
        const currentHour = now.getHours();
        const { startHour, endHour } = permission.conditions.timeRestrictions;
        
        if (currentHour < startHour || currentHour > endHour) {
          return false;
        }
      }
    }

    return true;
  }

  // Activity Tracking
  async recordWalletActivity(
    walletId: string,
    activity: {
      type: 'transaction' | 'bid' | 'auction_creation' | 'withdrawal';
      amount?: number;
      transactionHash?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<boolean> {
    const wallet = this.walletLinks.get(walletId);
    if (!wallet) {
      return false;
    }

    wallet.lastUsedAt = new Date();
    
    if (activity.type === 'transaction') {
      wallet.totalTransactions++;
      if (activity.amount) {
        wallet.totalVolume += activity.amount;
      }
    }

    // Check for suspicious activity
    if (this.config.enableSecurityMonitoring) {
      await this.checkSuspiciousActivity(wallet, activity);
    }

    this.emit('walletActivityRecorded', { wallet, activity });
    return true;
  }

  // Private Methods
  private async validateWalletLink(
    userId: string,
    address: string,
    type: WalletType
  ): Promise<void> {
    if (!this.config.supportedWalletTypes.includes(type)) {
      throw new Error(`Wallet type ${type} is not supported`);
    }

    if (!this.isValidAddress(address, type)) {
      throw new Error('Invalid wallet address format');
    }
  }

  private async checkVerificationAttempts(address: string): Promise<void> {
    const attempts = this.verificationAttempts.get(address) || { count: 0, lastAttempt: new Date() };
    
    if (attempts.count >= this.config.maxVerificationAttempts) {
      throw new Error('Maximum verification attempts exceeded');
    }

    attempts.count++;
    attempts.lastAttempt = new Date();
    this.verificationAttempts.set(address, attempts);
  }

  private async createWalletLink(
    request: VerificationRequest,
    options: {
      nickname?: string;
      isPrimary?: boolean;
      permissions?: WalletPermission[];
    }
  ): Promise<WalletLink> {
    const walletId = this.generateId();
    const now = new Date();

    const walletLink: WalletLink = {
      id: walletId,
      userId: request.userId,
      address: request.address,
      type: request.type,
      nickname: options.nickname,
      status: LinkStatus.ACTIVE,
      verificationMethod: request.method,
      verifiedAt: now,
      verificationData: {
        requestId: request.id,
        signature: request.signature,
        transactionHash: request.transactionHash
      },
      isPrimary: options.isPrimary || false,
      isDelegated: false,
      totalTransactions: 0,
      totalVolume: 0,
      permissions: options.permissions || this.config.defaultPermissions,
      tags: [],
      metadata: {},
      linkedAt: now,
      updatedAt: now
    };

    // Store wallet link
    this.walletLinks.set(walletId, walletLink);
    
    // Update indexes
    const userWallets = this.userIdToWallets.get(request.userId) || [];
    userWallets.push(walletId);
    this.userIdToWallets.set(request.userId, userWallets);
    
    this.addressToUserId.set(request.address, request.userId);

    return walletLink;
  }

  private async checkSuspiciousActivity(
    wallet: WalletLink,
    activity: any
  ): Promise<void> {
    // Placeholder for suspicious activity detection
    // In a real implementation, you would:
    // - Check for unusual transaction patterns
    // - Monitor for rapid successive transactions
    // - Detect large transactions outside normal patterns
    // - Check for transactions to blacklisted addresses
    
    const suspiciousScore = 0; // Would calculate based on various factors
    
    if (suspiciousScore > this.config.suspiciousActivityThreshold) {
      this.emit('suspiciousActivityDetected', { wallet, activity, score: suspiciousScore });
    }
  }

  private isValidAddress(address: string, type: WalletType): boolean {
    // Placeholder for address validation
    // In a real implementation, you would:
    // - Validate address format for each blockchain
    // - Check checksum validation
    // - Verify address is not blacklisted
    
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private async verifySignature(
    address: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    // Placeholder for signature verification
    // In a real implementation, you would:
    // - Use appropriate crypto library for each blockchain
    // - Verify the signature matches the address
    // - Check message integrity
    
    return true;
  }

  private async verifyTransaction(
    address: string,
    transactionHash: string
  ): Promise<boolean> {
    // Placeholder for transaction verification
    // In a real implementation, you would:
    // - Fetch transaction from blockchain
    // - Verify transaction involves the address
    // - Check transaction is confirmed
    // - Verify transaction meets criteria
    
    return true;
  }

  private createVerificationMessage(address: string, nonce: string): string {
    return `Link wallet ${address} to your account. Nonce: ${nonce}`;
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  private generateId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getWalletAnalytics(
    period: { start: Date; end: Date }
  ): Promise<WalletAnalytics> {
    const links = Array.from(this.walletLinks.values())
      .filter(w => w.linkedAt >= period.start && w.linkedAt <= period.end);

    // Basic metrics
    const totalLinks = links.length;
    const newLinks = links.length;
    
    // By type
    const linksByType: Record<WalletType, number> = {
      [WalletType.ETHEREUM]: 0,
      [WalletType.POLYGON]: 0,
      [WalletType.BSC]: 0,
      [WalletType.ARBITRUM]: 0,
      [WalletType.OPTIMISM]: 0,
      [WalletType.AVALANCHE]: 0,
      [WalletType.SOLANA]: 0,
      [WalletType.BITCOIN]: 0
    };

    for (const link of links) {
      linksByType[link.type]++;
    }

    // By status
    const linksByStatus: Record<LinkStatus, number> = {
      [LinkStatus.PENDING_VERIFICATION]: 0,
      [LinkStatus.ACTIVE]: 0,
      [LinkStatus.INACTIVE]: 0,
      [LinkStatus.REVOKED]: 0,
      [LinkStatus.SUSPENDED]: 0
    };

    for (const link of links) {
      linksByStatus[link.status]++;
    }

    // Verification metrics
    const verificationRequests = Array.from(this.verificationRequests.values())
      .filter(r => r.requestedAt >= period.start && r.requestedAt <= period.end);
    
    const verificationSuccessRate = verificationRequests.length > 0
      ? verificationRequests.filter(r => r.status === 'verified').length / verificationRequests.length
      : 0;

    const verificationByMethod: Record<VerificationMethod, number> = {
      [VerificationMethod.SIGNATURE]: 0,
      [VerificationMethod.TRANSACTION]: 0,
      [VerificationMethod.DELEGATION]: 0,
      [VerificationMethod.MULTI_SIG]: 0
    };

    for (const request of verificationRequests) {
      verificationByMethod[request.method]++;
    }

    // Activity metrics
    const activeWallets = links.filter(l => l.status === LinkStatus.ACTIVE).length;
    const totalTransactions = links.reduce((sum, l) => sum + l.totalTransactions, 0);
    const totalVolume = links.reduce((sum, l) => sum + l.totalVolume, 0);
    const averageTransactionsPerWallet = activeWallets > 0 ? totalTransactions / activeWallets : 0;

    return {
      period,
      totalLinks,
      newLinks,
      linksByType,
      linksByStatus,
      verificationRequests: verificationRequests.length,
      verificationSuccessRate,
      averageVerificationTime: 0, // Would calculate from verification timestamps
      verificationByMethod,
      activeWallets,
      totalTransactions,
      totalVolume,
      averageTransactionsPerWallet,
      suspiciousActivities: 0, // Would track from security monitoring
      revokedLinks: links.filter(l => l.status === LinkStatus.REVOKED).length,
      failedVerifications: verificationRequests.filter(r => r.status === 'failed').length,
      walletsByRegion: {}, // Would track from IP/geolocation data
      dailyLinks: [] // Would aggregate by date
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
    const totalLinks = this.walletLinks.size;
    const pendingVerifications = Array.from(this.verificationRequests.values())
      .filter(r => r.status === 'pending').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (pendingVerifications > 1000) {
      status = 'unhealthy';
    } else if (pendingVerifications > 500) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalLinks,
        pendingVerifications,
        delegationEnabled: this.config.enableDelegation,
        securityMonitoringEnabled: this.config.enableSecurityMonitoring
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        walletLinks: Array.from(this.walletLinks.values()),
        verificationRequests: Array.from(this.verificationRequests.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for wallet links
      const headers = [
        'ID', 'User ID', 'Address', 'Type', 'Status', 'Is Primary',
        'Linked At', 'Verified At', 'Total Transactions', 'Total Volume'
      ];
      
      const rows = Array.from(this.walletLinks.values()).map(w => [
        w.id,
        w.userId,
        w.address,
        w.type,
        w.status,
        w.isPrimary,
        w.linkedAt.toISOString(),
        w.verifiedAt?.toISOString() || '',
        w.totalTransactions,
        w.totalVolume
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
