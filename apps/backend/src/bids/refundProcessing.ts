import { EventEmitter } from 'events';

// Enums
export enum RefundType {
  AUCTION_CANCELLED = 'auction_cancelled',
  OUTBID = 'outbid',
  RESERVE_NOT_MET = 'reserve_not_met',
  PAYMENT_FAILED = 'payment_failed',
  SYSTEM_ERROR = 'system_error',
  USER_REQUEST = 'user_request',
  DUPLICATE_BID = 'duplicate_bid',
  INVALID_BID = 'invalid_bid'
}

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated'
}

export enum RefundMethod {
  CRYPTO = 'crypto',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  WALLET_CREDIT = 'wallet_credit',
  PLATFORM_CREDIT = 'platform_credit'
}

export enum RefundPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Interfaces
export interface RefundRequest {
  id: string;
  type: RefundType;
  userId: string;
  auctionId: string;
  bidId?: string;
  amount: number;
  currency: string;
  
  // Refund details
  method: RefundMethod;
  destinationAddress?: string;
  destinationAccount?: string;
  reason?: string;
  
  // Original transaction details
  originalTransactionHash?: string;
  originalAmount?: number;
  originalCurrency?: string;
  
  // Processing
  status: RefundStatus;
  priority: RefundPriority;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Fees and deductions
  processingFee?: number;
  platformFee?: number;
  gasFee?: number;
  netAmount?: number;
  
  // Tracking
  refundTransactionHash?: string;
  blockNumber?: number;
  confirmations: number;
  
  // Metadata
  metadata?: Record<string, any>;
  notes?: string;
  internalNotes?: string;
}

export interface RefundPolicy {
  id: string;
  name: string;
  type: RefundType;
  description: string;
  
  // Policy rules
  autoApprove: boolean;
  requireVerification: boolean;
  maxAmount?: number;
  timeLimit?: number; // in hours
  feeStructure: {
    fixedFee?: number;
    percentageFee?: number;
    minFee?: number;
    maxFee?: number;
  };
  
  // Conditions
  conditions: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between';
    value: any;
  }[];
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundBatch {
  id: string;
  name: string;
  description: string;
  refundIds: string[];
  totalAmount: number;
  currency: string;
  status: RefundStatus;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface RefundConfig {
  enableAutoProcessing: boolean;
  batchProcessing: boolean;
  batchSize: number;
  processingInterval: number; // in minutes
  maxRetries: number;
  retryDelay: number; // in minutes
  enableEscalation: boolean;
  escalationThreshold: number; // in hours
  enableNotifications: boolean;
  retentionPeriod: number; // in days
  defaultMethod: RefundMethod;
  supportedMethods: RefundMethod[];
  enableAuditLog: boolean;
}

export interface RefundAnalytics {
  period: { start: Date; end: Date };
  
  // Volume metrics
  totalRefunds: number;
  totalAmount: number;
  averageRefundAmount: number;
  refundsByType: Record<RefundType, number>;
  refundsByStatus: Record<RefundStatus, number>;
  
  // Processing metrics
  averageProcessingTime: number;
  successRate: number;
  failureRate: number;
  escalationRate: number;
  
  // Method distribution
  refundsByMethod: Record<RefundMethod, {
    count: number;
    amount: number;
    averageTime: number;
  }>;
  
  // Financial metrics
  totalFees: number;
  totalNetAmount: number;
  feeBreakdown: {
    processingFees: number;
    platformFees: number;
    gasFees: number;
  };
  
  // Trends
  dailyRefunds: {
    date: Date;
    count: number;
    amount: number;
  }[];
}

// Main Refund Processing Service
export class RefundProcessingService extends EventEmitter {
  private refunds: Map<string, RefundRequest> = new Map();
  private policies: Map<string, RefundPolicy> = new Map();
  private batches: Map<string, RefundBatch> = new Map();
  private config: RefundConfig;
  private processingQueue: RefundRequest[] = [];
  private isProcessing = false;
  private processingTimer?: NodeJS.Timeout;

  constructor(config?: Partial<RefundConfig>) {
    super();
    this.config = {
      enableAutoProcessing: true,
      batchProcessing: true,
      batchSize: 50,
      processingInterval: 5,
      maxRetries: 3,
      retryDelay: 30,
      enableEscalation: true,
      escalationThreshold: 24,
      enableNotifications: true,
      retentionPeriod: 365,
      defaultMethod: RefundMethod.WALLET_CREDIT,
      supportedMethods: [
        RefundMethod.CRYPTO,
        RefundMethod.BANK_TRANSFER,
        RefundMethod.WALLET_CREDIT,
        RefundMethod.PLATFORM_CREDIT
      ],
      enableAuditLog: true,
      ...config
    };
  }

  // Refund Request Management
  async createRefundRequest(
    refundData: Omit<RefundRequest, 'id' | 'status' | 'requestedAt' | 'confirmations'>
  ): Promise<RefundRequest> {
    const refundId = this.generateId();
    
    const refund: RefundRequest = {
      ...refundData,
      id: refundId,
      status: RefundStatus.PENDING,
      requestedAt: new Date(),
      confirmations: 0
    };

    // Validate refund request
    await this.validateRefundRequest(refund);
    
    // Apply refund policy
    const policy = await this.getApplicablePolicy(refund.type);
    if (policy) {
      await this.applyPolicy(refund, policy);
    }

    // Calculate fees and net amount
    await this.calculateFees(refund);

    // Store refund
    this.refunds.set(refundId, refund);
    this.processingQueue.push(refund);

    // Process queue if auto-processing is enabled
    if (this.config.enableAutoProcessing) {
      this.processRefundQueue();
    }

    this.emit('refundRequested', refund);
    return refund;
  }

  async getRefund(refundId: string): Promise<RefundRequest | null> {
    return this.refunds.get(refundId) || null;
  }

  async getRefunds(filter: {
    userId?: string;
    auctionId?: string;
    type?: RefundType;
    status?: RefundStatus;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  } = {}): Promise<RefundRequest[]> {
    let refunds = Array.from(this.refunds.values());

    // Apply filters
    if (filter.userId) {
      refunds = refunds.filter(r => r.userId === filter.userId);
    }

    if (filter.auctionId) {
      refunds = refunds.filter(r => r.auctionId === filter.auctionId);
    }

    if (filter.type) {
      refunds = refunds.filter(r => r.type === filter.type);
    }

    if (filter.status) {
      refunds = refunds.filter(r => r.status === filter.status);
    }

    if (filter.dateRange) {
      refunds = refunds.filter(r => 
        r.requestedAt >= filter.dateRange!.start && 
        r.requestedAt <= filter.dateRange!.end
      );
    }

    return refunds
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 100));
  }

  async updateRefundStatus(
    refundId: string,
    newStatus: RefundStatus,
    notes?: string
  ): Promise<boolean> {
    const refund = this.refunds.get(refundId);
    if (!refund) return false;

    const previousStatus = refund.status;
    refund.status = newStatus;
    refund.internalNotes = notes;

    if (newStatus === RefundStatus.PROCESSING) {
      refund.processedAt = new Date();
    } else if (newStatus === RefundStatus.COMPLETED) {
      refund.completedAt = new Date();
    }

    this.emit('refundStatusUpdated', { refund, previousStatus, newStatus, notes });
    return true;
  }

  async processRefund(refundId: string): Promise<boolean> {
    const refund = this.refunds.get(refundId);
    if (!refund || refund.status !== RefundStatus.PENDING) {
      return false;
    }

    await this.updateRefundStatus(refundId, RefundStatus.PROCESSING);

    try {
      // Process refund based on method
      const result = await this.executeRefund(refund);
      
      if (result.success) {
        refund.refundTransactionHash = result.transactionHash;
        refund.blockNumber = result.blockNumber;
        await this.updateRefundStatus(refundId, RefundStatus.COMPLETED);
        this.emit('refundCompleted', refund);
      } else {
        await this.updateRefundStatus(refundId, RefundStatus.FAILED, result.error);
        this.emit('refundFailed', { refund, error: result.error });
      }

      return result.success;

    } catch (error) {
      await this.updateRefundStatus(refundId, RefundStatus.FAILED, 
        error instanceof Error ? error.message : 'Unknown error');
      this.emit('refundFailed', { refund, error });
      return false;
    }
  }

  // Policy Management
  async createPolicy(policyData: Omit<RefundPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<RefundPolicy> {
    const policy: RefundPolicy = {
      ...policyData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.policies.set(policy.id, policy);
    this.emit('policyCreated', policy);
    return policy;
  }

  async getApplicablePolicy(type: RefundType): Promise<RefundPolicy | null> {
    const policies = Array.from(this.policies.values())
      .filter(p => p.type === type && p.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return policies[0] || null;
  }

  // Batch Processing
  async createBatch(
    name: string,
    description: string,
    refundIds: string[]
  ): Promise<RefundBatch> {
    const batchId = this.generateId();
    
    const refunds = refundIds
      .map(id => this.refunds.get(id))
      .filter((r): r is RefundRequest => r !== undefined);

    const totalAmount = refunds.reduce((sum, r) => sum + (r.netAmount || r.amount), 0);

    const batch: RefundBatch = {
      id: batchId,
      name,
      description,
      refundIds,
      totalAmount,
      currency: refunds[0]?.currency || 'USD',
      status: RefundStatus.PENDING,
      createdAt: new Date()
    };

    this.batches.set(batchId, batch);
    this.emit('batchCreated', batch);
    return batch;
  }

  async processBatch(batchId: string): Promise<boolean> {
    const batch = this.batches.get(batchId);
    if (!batch || batch.status !== RefundStatus.PENDING) {
      return false;
    }

    batch.status = RefundStatus.PROCESSING;
    batch.processedAt = new Date();

    try {
      let successCount = 0;
      let failureCount = 0;

      for (const refundId of batch.refundIds) {
        const result = await this.processRefund(refundId);
        if (result) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      batch.status = failureCount === 0 ? RefundStatus.COMPLETED : RefundStatus.FAILED;
      batch.completedAt = new Date();

      this.emit('batchProcessed', { batch, successCount, failureCount });
      return failureCount === 0;

    } catch (error) {
      batch.status = RefundStatus.FAILED;
      this.emit('batchFailed', { batch, error });
      return false;
    }
  }

  // Analytics
  async getRefundAnalytics(
    period: { start: Date; end: Date }
  ): Promise<RefundAnalytics> {
    const refunds = Array.from(this.refunds.values())
      .filter(r => r.requestedAt >= period.start && r.requestedAt <= period.end);

    // Basic metrics
    const totalRefunds = refunds.length;
    const totalAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
    const averageRefundAmount = totalRefunds > 0 ? totalAmount / totalRefunds : 0;

    // By type
    const refundsByType: Record<RefundType, number> = {
      [RefundType.AUCTION_CANCELLED]: 0,
      [RefundType.OUTBID]: 0,
      [RefundType.RESERVE_NOT_MET]: 0,
      [RefundType.PAYMENT_FAILED]: 0,
      [RefundType.SYSTEM_ERROR]: 0,
      [RefundType.USER_REQUEST]: 0,
      [RefundType.DUPLICATE_BID]: 0,
      [RefundType.INVALID_BID]: 0
    };

    for (const refund of refunds) {
      refundsByType[refund.type]++;
    }

    // By status
    const refundsByStatus: Record<RefundStatus, number> = {
      [RefundStatus.PENDING]: 0,
      [RefundStatus.PROCESSING]: 0,
      [RefundStatus.COMPLETED]: 0,
      [RefundStatus.FAILED]: 0,
      [RefundStatus.CANCELLED]: 0,
      [RefundStatus.ESCALATED]: 0
    };

    for (const refund of refunds) {
      refundsByStatus[refund.status]++;
    }

    // Processing metrics
    const completedRefunds = refunds.filter(r => r.status === RefundStatus.COMPLETED);
    const averageProcessingTime = completedRefunds.length > 0
      ? completedRefunds.reduce((sum, r) => 
          sum + (r.processedAt!.getTime() - r.requestedAt.getTime()), 0) / completedRefunds.length
      : 0;

    const successRate = totalRefunds > 0 ? completedRefunds.length / totalRefunds : 0;
    const failureRate = totalRefunds > 0 ? (refundsByStatus[RefundStatus.FAILED] || 0) / totalRefunds : 0;
    const escalationRate = totalRefunds > 0 ? (refundsByStatus[RefundStatus.ESCALATED] || 0) / totalRefunds : 0;

    // By method
    const refundsByMethod: Record<RefundMethod, { count: number; amount: number; averageTime: number }> = {};
    for (const method of this.config.supportedMethods) {
      const methodRefunds = refunds.filter(r => r.method === method);
      refundsByMethod[method] = {
        count: methodRefunds.length,
        amount: methodRefunds.reduce((sum, r) => sum + r.amount, 0),
        averageTime: methodRefunds.length > 0
          ? methodRefunds.reduce((sum, r) => 
              sum + (r.processedAt?.getTime() || 0) - r.requestedAt.getTime(), 0) / methodRefunds.length
          : 0
      };
    }

    // Financial metrics
    const totalFees = refunds.reduce((sum, r) => 
      sum + (r.processingFee || 0) + (r.platformFee || 0) + (r.gasFee || 0), 0);
    const totalNetAmount = refunds.reduce((sum, r) => sum + (r.netAmount || r.amount), 0);

    const feeBreakdown = {
      processingFees: refunds.reduce((sum, r) => sum + (r.processingFee || 0), 0),
      platformFees: refunds.reduce((sum, r) => sum + (r.platformFee || 0), 0),
      gasFees: refunds.reduce((sum, r) => sum + (r.gasFee || 0), 0)
    };

    // Daily trends
    const dailyMap = new Map<string, { count: number; amount: number }>();
    for (const refund of refunds) {
      const dateKey = refund.requestedAt.toISOString().substring(0, 10);
      const existing = dailyMap.get(dateKey) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += refund.amount;
      dailyMap.set(dateKey, existing);
    }

    const dailyRefunds = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        ...data
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      period,
      totalRefunds,
      totalAmount,
      averageRefundAmount,
      refundsByType,
      refundsByStatus,
      averageProcessingTime,
      successRate,
      failureRate,
      escalationRate,
      refundsByMethod,
      totalFees,
      totalNetAmount,
      feeBreakdown,
      dailyRefunds
    };
  }

  // Private Methods
  private async validateRefundRequest(refund: RefundRequest): Promise<void> {
    if (!refund.userId) {
      throw new Error('User ID is required');
    }

    if (!refund.auctionId) {
      throw new Error('Auction ID is required');
    }

    if (refund.amount <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }

    if (!this.config.supportedMethods.includes(refund.method)) {
      throw new Error(`Refund method ${refund.method} is not supported`);
    }

    // Additional validation based on refund type
    switch (refund.type) {
      case RefundType.OUTBID:
        if (!refund.bidId) {
          throw new Error('Bid ID is required for outbid refunds');
        }
        break;
      case RefundType.AUCTION_CANCELLED:
        // Verify auction was actually cancelled
        break;
    }
  }

  private async applyPolicy(refund: RefundRequest, policy: RefundPolicy): Promise<void> {
    // Check conditions
    for (const condition of policy.conditions) {
      if (!this.evaluateCondition(condition, refund)) {
        throw new Error(`Refund does not meet policy conditions: ${condition.field}`);
      }
    }

    // Apply fees
    if (policy.feeStructure.fixedFee) {
      refund.processingFee = policy.feeStructure.fixedFee;
    }

    if (policy.feeStructure.percentageFee) {
      const percentageFee = refund.amount * (policy.feeStructure.percentageFee / 100);
      refund.processingFee = (refund.processingFee || 0) + percentageFee;
    }

    // Apply min/max fee limits
    if (policy.feeStructure.minFee && (refund.processingFee || 0) < policy.feeStructure.minFee) {
      refund.processingFee = policy.feeStructure.minFee;
    }

    if (policy.feeStructure.maxFee && (refund.processingFee || 0) > policy.feeStructure.maxFee) {
      refund.processingFee = policy.feeStructure.maxFee;
    }

    // Auto-approve if policy allows
    if (policy.autoApprove) {
      refund.priority = RefundPriority.NORMAL;
    } else {
      refund.priority = RefundPriority.LOW;
    }
  }

  private async calculateFees(refund: RefundRequest): Promise<void> {
    const processingFee = refund.processingFee || 0;
    const platformFee = refund.amount * 0.01; // 1% platform fee
    const gasFee = refund.method === RefundMethod.CRYPTO ? 0.001 : 0; // Gas fee for crypto

    refund.processingFee = processingFee;
    refund.platformFee = platformFee;
    refund.gasFee = gasFee;
    refund.netAmount = refund.amount - processingFee - platformFee - gasFee;
  }

  private async executeRefund(refund: RefundRequest): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    try {
      switch (refund.method) {
        case RefundMethod.CRYPTO:
          return await this.processCryptoRefund(refund);
        case RefundMethod.BANK_TRANSFER:
          return await this.processBankTransferRefund(refund);
        case RefundMethod.WALLET_CREDIT:
          return await this.processWalletCreditRefund(refund);
        case RefundMethod.PLATFORM_CREDIT:
          return await this.processPlatformCreditRefund(refund);
        default:
          throw new Error(`Unsupported refund method: ${refund.method}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processCryptoRefund(refund: RefundRequest): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    // Placeholder for crypto refund processing
    // In a real implementation, you would:
    // - Create blockchain transaction
    // - Sign and broadcast transaction
    // - Wait for confirmations
    // - Return transaction details
    
    return {
      success: true,
      transactionHash: this.generateId(),
      blockNumber: 12345
    };
  }

  private async processBankTransferRefund(refund: RefundRequest): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    // Placeholder for bank transfer processing
    return {
      success: true,
      transactionHash: 'BANK_' + this.generateId()
    };
  }

  private async processWalletCreditRefund(refund: RefundRequest): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    // Placeholder for wallet credit processing
    return {
      success: true,
      transactionHash: 'WALLET_' + this.generateId()
    };
  }

  private async processPlatformCreditRefund(refund: RefundRequest): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
  }> {
    // Placeholder for platform credit processing
    return {
      success: true,
      transactionHash: 'PLATFORM_' + this.generateId()
    };
  }

  private evaluateCondition(
    condition: RefundPolicy['conditions'][0],
    refund: RefundRequest
  ): boolean {
    const fieldValue = (refund as any)[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'between':
        return Array.isArray(condition.value) && 
          fieldValue >= condition.value[0] && 
          fieldValue <= condition.value[1];
      default:
        return false;
    }
  }

  private async processRefundQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.processingQueue.splice(0, this.config.batchSize);

    try {
      for (const refund of batch) {
        await this.processRefund(refund.id);
      }
    } catch (error) {
      this.emit('processingError', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private generateId(): string {
    return `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    if (this.config.enableAutoProcessing) {
      this.processingTimer = setInterval(async () => {
        await this.processRefundQueue();
      }, this.config.processingInterval * 60 * 1000);
    }

    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }

    this.isProcessing = false;
    this.processingQueue.length = 0;
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalRefunds = this.refunds.size;
    const queueLength = this.processingQueue.length;
    const pendingRefunds = Array.from(this.refunds.values())
      .filter(r => r.status === RefundStatus.PENDING).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (queueLength > 100 || pendingRefunds > 50) {
      status = 'unhealthy';
    } else if (queueLength > 50 || pendingRefunds > 25) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalRefunds,
        queueLength,
        pendingRefunds,
        isProcessing: this.isProcessing,
        autoProcessingEnabled: this.config.enableAutoProcessing
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        refunds: Array.from(this.refunds.values()),
        policies: Array.from(this.policies.values()),
        batches: Array.from(this.batches.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for refunds
      const headers = [
        'ID', 'Type', 'User ID', 'Auction ID', 'Amount', 'Currency',
        'Method', 'Status', 'Requested At', 'Processed At', 'Completed At'
      ];
      
      const rows = Array.from(this.refunds.values()).map(r => [
        r.id,
        r.type,
        r.userId,
        r.auctionId,
        r.amount,
        r.currency,
        r.method,
        r.status,
        r.requestedAt.toISOString(),
        r.processedAt?.toISOString() || '',
        r.completedAt?.toISOString() || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
