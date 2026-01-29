import { EventEmitter } from 'events';
import { WinnerDetermination, WinnerStatus } from './winnerDetermination';

// Enums
export enum SettlementType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  ESCALATED = 'escalated'
}

export enum SettlementStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export enum SettlementStep {
  VALIDATION = 'validation',
  PAYMENT_PROCESSING = 'payment_processing',
  ASSET_TRANSFER = 'asset_transfer',
  FEE_DEDUCTION = 'fee_deduction',
  NOTIFICATION = 'notification',
  COMPLETION = 'completion'
}

export enum PaymentMethod {
  CRYPTO = 'crypto',
  BANK_TRANSFER = 'bank_transfer',
  ESCROW = 'escrow',
  SMART_CONTRACT = 'smart_contract',
  PLATFORM_BALANCE = 'platform_balance'
}

// Interfaces
export interface Settlement {
  id: string;
  winnerDeterminationId: string;
  auctionId: string;
  winnerId: string;
  sellerId: string;
  
  // Financial details
  winningAmount: number;
  actualPrice: number;
  currency: string;
  platformFee: number;
  paymentProcessorFee: number;
  gasFee?: number;
  netAmount: number;
  
  // Settlement details
  type: SettlementType;
  status: SettlementStatus;
  paymentMethod: PaymentMethod;
  initiatedAt: Date;
  completedAt?: Date;
  
  // Transaction details
  buyerTransactionHash?: string;
  sellerTransactionHash?: string;
  platformTransactionHash?: string;
  blockNumber?: number;
  confirmations: number;
  
  // Steps tracking
  steps: SettlementStep[];
  currentStep?: SettlementStep;
  stepHistory: SettlementStepRecord[];
  
  // Dispute handling
  disputeId?: string;
  disputeResolution?: string;
  
  // Metadata
  metadata: Record<string, any>;
  notes?: string;
  retryCount: number;
  maxRetries: number;
}

export interface SettlementStepRecord {
  id: string;
  step: SettlementStep;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface SettlementRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    auctionType?: string;
    amountRange?: { min: number; max: number };
    currency?: string;
    paymentMethod?: PaymentMethod;
    userTier?: string;
  }[];
  actions: {
    autoSettle: boolean;
    requireVerification: boolean;
    feeStructure: {
      type: 'fixed' | 'percentage' | 'tiered';
      value: number | number[];
      minFee?: number;
      maxFee?: number;
    };
    paymentMethod: PaymentMethod;
    escrowRequired: boolean;
  };
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettlementBatch {
  id: string;
  name: string;
  description: string;
  settlementIds: string[];
  totalAmount: number;
  currency: string;
  status: SettlementStatus;
  initiatedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface SettlementConfig {
  enableAutoSettlement: boolean;
  settlementDelay: number; // minutes after winner confirmation
  batchProcessing: boolean;
  batchSize: number;
  processingInterval: number; // minutes
  maxRetries: number;
  retryDelay: number; // minutes
  enableEscrow: boolean;
  escrowReleaseDelay: number; // hours
  enableNotifications: boolean;
  enableAuditLog: boolean;
  retentionPeriod: number; // days
  defaultPaymentMethod: PaymentMethod;
  supportedPaymentMethods: PaymentMethod[];
  gasLimit: number;
  gasPriceStrategy: 'slow' | 'standard' | 'fast';
}

export interface SettlementAnalytics {
  period: { start: Date; end: Date };
  
  // Volume metrics
  totalSettlements: number;
  totalAmount: number;
  averageAmount: number;
  settlementsByType: Record<SettlementType, number>;
  settlementsByStatus: Record<SettlementStatus, number>;
  
  // Processing metrics
  averageProcessingTime: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
  
  // Financial metrics
  totalFees: number;
  totalNetAmount: number;
  feeBreakdown: {
    platformFees: number;
    paymentProcessorFees: number;
    gasFees: number;
  };
  
  // Method distribution
  settlementsByMethod: Record<PaymentMethod, {
    count: number;
    amount: number;
    averageTime: number;
  }>;
  
  // Trends
  dailySettlements: {
    date: Date;
    count: number;
    amount: number;
  }[];
}

// Main Settlement Automation Service
export class SettlementAutomationService extends EventEmitter {
  private settlements: Map<string, Settlement> = new Map();
  private rules: Map<string, SettlementRule> = new Map();
  private batches: Map<string, SettlementBatch> = new Map();
  private config: SettlementConfig;
  private processingQueue: Settlement[] = [];
  private isProcessing = false;
  private processingTimer?: NodeJS.Timeout;

  constructor(config?: Partial<SettlementConfig>) {
    super();
    this.config = {
      enableAutoSettlement: true,
      settlementDelay: 30,
      batchProcessing: true,
      batchSize: 50,
      processingInterval: 5,
      maxRetries: 3,
      retryDelay: 30,
      enableEscrow: true,
      escrowReleaseDelay: 24,
      enableNotifications: true,
      enableAuditLog: true,
      retentionPeriod: 365,
      defaultPaymentMethod: PaymentMethod.SMART_CONTRACT,
      supportedPaymentMethods: [
        PaymentMethod.CRYPTO,
        PaymentMethod.SMART_CONTRACT,
        PaymentMethod.ESCROW,
        PaymentMethod.PLATFORM_BALANCE
      ],
      gasLimit: 200000,
      gasPriceStrategy: 'standard',
      ...config
    };
  }

  // Settlement Management
  async initiateSettlement(
    winnerDetermination: WinnerDetermination,
    options: {
      paymentMethod?: PaymentMethod;
      type?: SettlementType;
      scheduledFor?: Date;
    } = {}
  ): Promise<Settlement> {
    const settlementId = this.generateId();
    
    // Apply settlement rules
    const rule = await this.getApplicableRule(winnerDetermination);
    const paymentMethod = options.paymentMethod || rule?.actions.paymentMethod || this.config.defaultPaymentMethod;
    
    // Calculate fees
    const fees = await this.calculateFees(winnerDetermination.winningAmount, rule);
    
    const settlement: Settlement = {
      id: settlementId,
      winnerDeterminationId: winnerDetermination.id,
      auctionId: winnerDetermination.auctionId,
      winnerId: winnerDetermination.winnerId,
      sellerId: '', // Would be fetched from auction data
      winningAmount: winnerDetermination.winningAmount,
      actualPrice: winnerDetermination.actualPrice || winnerDetermination.winningAmount,
      currency: 'ETH', // Would be fetched from auction data
      platformFee: fees.platformFee,
      paymentProcessorFee: fees.paymentProcessorFee,
      gasFee: fees.gasFee,
      netAmount: winnerDetermination.winningAmount - fees.platformFee - fees.paymentProcessorFee - (fees.gasFee || 0),
      type: options.type || SettlementType.AUTOMATIC,
      status: SettlementStatus.PENDING,
      paymentMethod,
      initiatedAt: new Date(),
      steps: [],
      stepHistory: [],
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    // Schedule settlement if needed
    if (options.scheduledFor && options.scheduledFor > new Date()) {
      this.scheduleSettlement(settlementId, options.scheduledFor);
    } else {
      this.processingQueue.push(settlement);
    }

    this.settlements.set(settlementId, settlement);
    this.emit('settlementInitiated', settlement);
    return settlement;
  }

  async getSettlement(settlementId: string): Promise<Settlement | null> {
    return this.settlements.get(settlementId) || null;
  }

  async getSettlements(filter: {
    auctionId?: string;
    winnerId?: string;
    sellerId?: string;
    status?: SettlementStatus;
    type?: SettlementType;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  } = {}): Promise<Settlement[]> {
    let settlements = Array.from(this.settlements.values());

    // Apply filters
    if (filter.auctionId) {
      settlements = settlements.filter(s => s.auctionId === filter.auctionId);
    }

    if (filter.winnerId) {
      settlements = settlements.filter(s => s.winnerId === filter.winnerId);
    }

    if (filter.sellerId) {
      settlements = settlements.filter(s => s.sellerId === filter.sellerId);
    }

    if (filter.status) {
      settlements = settlements.filter(s => s.status === filter.status);
    }

    if (filter.type) {
      settlements = settlements.filter(s => s.type === filter.type);
    }

    if (filter.dateRange) {
      settlements = settlements.filter(s => 
        s.initiatedAt >= filter.dateRange!.start && 
        s.initiatedAt <= filter.dateRange!.end
      );
    }

    return settlements
      .sort((a, b) => b.initiatedAt.getTime() - a.initiatedAt.getTime())
      .slice(filter.offset || 0, (filter.offset || 0) + (filter.limit || 100));
  }

  async updateSettlementStatus(
    settlementId: string,
    newStatus: SettlementStatus,
    notes?: string
  ): Promise<boolean> {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) return false;

    const previousStatus = settlement.status;
    settlement.status = newStatus;
    settlement.notes = notes;

    if (newStatus === SettlementStatus.COMPLETED) {
      settlement.completedAt = new Date();
    }

    this.emit('settlementStatusUpdated', { settlement, previousStatus, newStatus, notes });
    return true;
  }

  async processSettlement(settlementId: string): Promise<boolean> {
    const settlement = this.settlements.get(settlementId);
    if (!settlement || settlement.status !== SettlementStatus.PENDING) {
      return false;
    }

    await this.updateSettlementStatus(settlementId, SettlementStatus.PROCESSING);

    try {
      // Execute settlement steps
      const success = await this.executeSettlementSteps(settlement);
      
      if (success) {
        await this.updateSettlementStatus(settlementId, SettlementStatus.COMPLETED);
        this.emit('settlementCompleted', settlement);
      } else {
        await this.updateSettlementStatus(settlementId, SettlementStatus.FAILED);
        this.emit('settlementFailed', settlement);
      }

      return success;

    } catch (error) {
      await this.updateSettlementStatus(settlementId, SettlementStatus.FAILED, 
        error instanceof Error ? error.message : 'Unknown error');
      this.emit('settlementError', { settlement, error });
      return false;
    }
  }

  // Rule Management
  async createRule(ruleData: Omit<SettlementRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<SettlementRule> {
    const rule: SettlementRule = {
      ...ruleData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.set(rule.id, rule);
    this.emit('ruleCreated', rule);
    return rule;
  }

  async getApplicableRule(winnerDetermination: WinnerDetermination): Promise<SettlementRule | null> {
    const rules = Array.from(this.rules.values())
      .filter(r => r.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      if (this.matchesRule(rule, winnerDetermination)) {
        return rule;
      }
    }

    return null;
  }

  // Batch Processing
  async createBatch(
    name: string,
    description: string,
    settlementIds: string[]
  ): Promise<SettlementBatch> {
    const batchId = this.generateId();
    
    const settlements = settlementIds
      .map(id => this.settlements.get(id))
      .filter((s): s is Settlement => s !== undefined);

    const totalAmount = settlements.reduce((sum, s) => sum + s.netAmount, 0);

    const batch: SettlementBatch = {
      id: batchId,
      name,
      description,
      settlementIds,
      totalAmount,
      currency: settlements[0]?.currency || 'USD',
      status: SettlementStatus.PENDING,
      initiatedAt: new Date()
    };

    this.batches.set(batchId, batch);
    this.emit('batchCreated', batch);
    return batch;
  }

  async processBatch(batchId: string): Promise<boolean> {
    const batch = this.batches.get(batchId);
    if (!batch || batch.status !== SettlementStatus.PENDING) {
      return false;
    }

    batch.status = SettlementStatus.PROCESSING;

    try {
      let successCount = 0;
      let failureCount = 0;

      for (const settlementId of batch.settlementIds) {
        const result = await this.processSettlement(settlementId);
        if (result) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      batch.status = failureCount === 0 ? SettlementStatus.COMPLETED : SettlementStatus.FAILED;
      batch.completedAt = new Date();

      this.emit('batchProcessed', { batch, successCount, failureCount });
      return failureCount === 0;

    } catch (error) {
      batch.status = SettlementStatus.FAILED;
      this.emit('batchFailed', { batch, error });
      return false;
    }
  }

  // Private Methods
  private async executeSettlementSteps(settlement: Settlement): Promise<boolean> {
    const steps = [
      SettlementStep.VALIDATION,
      SettlementStep.PAYMENT_PROCESSING,
      SettlementStep.ASSET_TRANSFER,
      SettlementStep.FEE_DEDUCTION,
      SettlementStep.NOTIFICATION,
      SettlementStep.COMPLETION
    ];

    for (const step of steps) {
      settlement.currentStep = step;
      
      const stepRecord: SettlementStepRecord = {
        id: this.generateId(),
        step,
        status: 'processing',
        startedAt: new Date()
      };

      try {
        const success = await this.executeStep(settlement, step);
        
        stepRecord.status = success ? 'completed' : 'failed';
        stepRecord.completedAt = new Date();
        stepRecord.duration = stepRecord.completedAt.getTime() - stepRecord.startedAt.getTime();
        
        settlement.stepHistory.push(stepRecord);
        
        if (!success) {
          return false;
        }

      } catch (error) {
        stepRecord.status = 'failed';
        stepRecord.error = error instanceof Error ? error.message : 'Unknown error';
        stepRecord.completedAt = new Date();
        settlement.stepHistory.push(stepRecord);
        return false;
      }
    }

    return true;
  }

  private async executeStep(settlement: Settlement, step: SettlementStep): Promise<boolean> {
    switch (step) {
      case SettlementStep.VALIDATION:
        return await this.validateSettlement(settlement);
      case SettlementStep.PAYMENT_PROCESSING:
        return await this.processPayment(settlement);
      case SettlementStep.ASSET_TRANSFER:
        return await this.transferAsset(settlement);
      case SettlementStep.FEE_DEDUCTION:
        return await this.deductFees(settlement);
      case SettlementStep.NOTIFICATION:
        return await this.sendNotifications(settlement);
      case SettlementStep.COMPLETION:
        return await this.completeSettlement(settlement);
      default:
        return false;
    }
  }

  private async validateSettlement(settlement: Settlement): Promise<boolean> {
    // Validate settlement data
    if (!settlement.winnerId || !settlement.sellerId) {
      throw new Error('Winner and seller IDs are required');
    }

    if (settlement.winningAmount <= 0) {
      throw new Error('Winning amount must be greater than 0');
    }

    // Validate payment method
    if (!this.config.supportedPaymentMethods.includes(settlement.paymentMethod)) {
      throw new Error(`Payment method ${settlement.paymentMethod} is not supported`);
    }

    return true;
  }

  private async processPayment(settlement: Settlement): Promise<boolean> {
    switch (settlement.paymentMethod) {
      case PaymentMethod.SMART_CONTRACT:
        return await this.processSmartContractPayment(settlement);
      case PaymentMethod.ESCROW:
        return await this.processEscrowPayment(settlement);
      case PaymentMethod.CRYPTO:
        return await this.processCryptoPayment(settlement);
      case PaymentMethod.PLATFORM_BALANCE:
        return await this.processPlatformBalancePayment(settlement);
      default:
        throw new Error(`Unsupported payment method: ${settlement.paymentMethod}`);
    }
  }

  private async transferAsset(settlement: Settlement): Promise<boolean> {
    // Placeholder for asset transfer
    // In a real implementation, you would:
    // - Transfer NFT or asset to winner
    // - Update ownership records
    // - Handle blockchain transactions
    // - Return transaction details
    
    settlement.sellerTransactionHash = 'ASSET_' + this.generateId();
    return true;
  }

  private async deductFees(settlement: Settlement): Promise<boolean> {
    // Placeholder for fee deduction
    // In a real implementation, you would:
    // - Deduct platform fees
    // - Deduct payment processor fees
    // - Handle gas fees
    // - Update accounting records
    
    settlement.platformTransactionHash = 'FEE_' + this.generateId();
    return true;
  }

  private async sendNotifications(settlement: Settlement): Promise<boolean> {
    // Placeholder for notifications
    // In a real implementation, you would:
    // - Notify winner of successful settlement
    // - Notify seller of payment received
    // - Send receipts and confirmations
    // - Update user dashboards
    
    return true;
  }

  private async completeSettlement(settlement: Settlement): Promise<boolean> {
    // Final settlement completion tasks
    settlement.completedAt = new Date();
    return true;
  }

  private async processSmartContractPayment(settlement: Settlement): Promise<boolean> {
    // Placeholder for smart contract payment
    settlement.buyerTransactionHash = 'SC_' + this.generateId();
    settlement.blockNumber = 12345;
    return true;
  }

  private async processEscrowPayment(settlement: Settlement): Promise<boolean> {
    // Placeholder for escrow payment
    settlement.buyerTransactionHash = 'ESCROW_' + this.generateId();
    return true;
  }

  private async processCryptoPayment(settlement: Settlement): Promise<boolean> {
    // Placeholder for crypto payment
    settlement.buyerTransactionHash = 'CRYPTO_' + this.generateId();
    return true;
  }

  private async processPlatformBalancePayment(settlement: Settlement): Promise<boolean> {
    // Placeholder for platform balance payment
    settlement.buyerTransactionHash = 'BALANCE_' + this.generateId();
    return true;
  }

  private async calculateFees(
    amount: number,
    rule?: SettlementRule
  ): Promise<{
    platformFee: number;
    paymentProcessorFee: number;
    gasFee?: number;
  }> {
    let platformFee = 0;
    let paymentProcessorFee = 0;
    let gasFee: number | undefined;

    if (rule) {
      const feeStructure = rule.actions.feeStructure;
      
      switch (feeStructure.type) {
        case 'fixed':
          platformFee = feeStructure.value as number;
          break;
        case 'percentage':
          platformFee = amount * (feeStructure.value as number / 100);
          break;
        case 'tiered':
          const tiers = feeStructure.value as number[];
          platformFee = this.calculateTieredFee(amount, tiers);
          break;
      }

      // Apply min/max limits
      if (feeStructure.minFee && platformFee < feeStructure.minFee) {
        platformFee = feeStructure.minFee;
      }
      if (feeStructure.maxFee && platformFee > feeStructure.maxFee) {
        platformFee = feeStructure.maxFee;
      }

      paymentProcessorFee = platformFee * 0.1; // 10% of platform fee
      gasFee = settlement.paymentMethod === PaymentMethod.SMART_CONTRACT ? 0.01 : undefined;
    } else {
      // Default fee calculation
      platformFee = amount * 0.025; // 2.5%
      paymentProcessorFee = platformFee * 0.1;
      gasFee = settlement.paymentMethod === PaymentMethod.SMART_CONTRACT ? 0.01 : undefined;
    }

    return { platformFee, paymentProcessorFee, gasFee };
  }

  private calculateTieredFee(amount: number, tiers: number[]): number {
    for (let i = 0; i < tiers.length; i++) {
      if (amount <= tiers[i]) {
        return tiers[i] * 0.02; // 2% of tier threshold
      }
    }
    return tiers[tiers.length - 1] * 0.02;
  }

  private matchesRule(rule: SettlementRule, winnerDetermination: WinnerDetermination): boolean {
    // Check if rule conditions match
    for (const condition of rule.conditions) {
      if (condition.auctionType && winnerDetermination.auctionType !== condition.auctionType) {
        return false;
      }
      
      if (condition.amountRange) {
        const amount = winnerDetermination.winningAmount;
        if (amount < condition.amountRange.min || amount > condition.amountRange.max) {
          return false;
        }
      }
    }

    return true;
  }

  private scheduleSettlement(settlementId: string, scheduledFor: Date): void {
    const delay = scheduledFor.getTime() - Date.now();
    if (delay <= 0) return;

    setTimeout(async () => {
      const settlement = this.settlements.get(settlementId);
      if (settlement) {
        this.processingQueue.push(settlement);
      }
    }, delay);
  }

  private async processSettlementQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.processingQueue.splice(0, this.config.batchSize);

    try {
      for (const settlement of batch) {
        await this.processSettlement(settlement.id);
      }
    } catch (error) {
      this.emit('processingError', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private generateId(): string {
    return `settlement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getSettlementAnalytics(
    period: { start: Date; end: Date }
  ): Promise<SettlementAnalytics> {
    const settlements = Array.from(this.settlements.values())
      .filter(s => s.initiatedAt >= period.start && s.initiatedAt <= period.end);

    // Basic metrics
    const totalSettlements = settlements.length;
    const totalAmount = settlements.reduce((sum, s) => sum + s.netAmount, 0);
    const averageAmount = totalSettlements > 0 ? totalAmount / totalSettlements : 0;

    // By type
    const settlementsByType: Record<SettlementType, number> = {
      [SettlementType.AUTOMATIC]: 0,
      [SettlementType.MANUAL]: 0,
      [SettlementType.SCHEDULED]: 0,
      [SettlementType.ESCALATED]: 0
    };

    for (const settlement of settlements) {
      settlementsByType[settlement.type]++;
    }

    // By status
    const settlementsByStatus: Record<SettlementStatus, number> = {
      [SettlementStatus.PENDING]: 0,
      [SettlementStatus.PROCESSING]: 0,
      [SettlementStatus.COMPLETED]: 0,
      [SettlementStatus.FAILED]: 0,
      [SettlementStatus.CANCELLED]: 0,
      [SettlementStatus.DISPUTED]: 0
    };

    for (const settlement of settlements) {
      settlementsByStatus[settlement.status]++;
    }

    // Processing metrics
    const completedSettlements = settlements.filter(s => s.status === SettlementStatus.COMPLETED);
    const averageProcessingTime = completedSettlements.length > 0
      ? completedSettlements.reduce((sum, s) => 
          sum + (s.completedAt!.getTime() - s.initiatedAt.getTime()), 0) / completedSettlements.length
      : 0;

    const successRate = totalSettlements > 0 ? completedSettlements.length / totalSettlements : 0;
    const failureRate = totalSettlements > 0 ? (settlementsByStatus[SettlementStatus.FAILED] || 0) / totalSettlements : 0;
    const retryRate = totalSettlements > 0 
      ? settlements.reduce((sum, s) => sum + s.retryCount, 0) / totalSettlements 
      : 0;

    // Financial metrics
    const totalFees = settlements.reduce((sum, s) => 
      sum + s.platformFee + s.paymentProcessorFee + (s.gasFee || 0), 0);
    const totalNetAmount = settlements.reduce((sum, s) => sum + s.netAmount, 0);

    const feeBreakdown = {
      platformFees: settlements.reduce((sum, s) => sum + s.platformFee, 0),
      paymentProcessorFees: settlements.reduce((sum, s) => sum + s.paymentProcessorFee, 0),
      gasFees: settlements.reduce((sum, s) => sum + (s.gasFee || 0), 0)
    };

    // By method
    const settlementsByMethod: Record<PaymentMethod, { count: number; amount: number; averageTime: number }> = {};
    for (const method of this.config.supportedPaymentMethods) {
      const methodSettlements = settlements.filter(s => s.paymentMethod === method);
      settlementsByMethod[method] = {
        count: methodSettlements.length,
        amount: methodSettlements.reduce((sum, s) => sum + s.netAmount, 0),
        averageTime: methodSettlements.length > 0
          ? methodSettlements.reduce((sum, s) => 
              sum + (s.completedAt?.getTime() || 0) - s.initiatedAt.getTime(), 0) / methodSettlements.length
          : 0
      };
    }

    // Daily trends
    const dailyMap = new Map<string, { count: number; amount: number }>();
    for (const settlement of settlements) {
      const dateKey = settlement.initiatedAt.toISOString().substring(0, 10);
      const existing = dailyMap.get(dateKey) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += settlement.netAmount;
      dailyMap.set(dateKey, existing);
    }

    const dailySettlements = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        ...data
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      period,
      totalSettlements,
      totalAmount,
      averageAmount,
      settlementsByType,
      settlementsByStatus,
      averageProcessingTime,
      successRate,
      failureRate,
      retryRate,
      totalFees,
      totalNetAmount,
      feeBreakdown,
      settlementsByMethod,
      dailySettlements
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    if (this.config.batchProcessing) {
      this.processingTimer = setInterval(async () => {
        await this.processSettlementQueue();
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
    const totalSettlements = this.settlements.size;
    const queueLength = this.processingQueue.length;
    const pendingSettlements = Array.from(this.settlements.values())
      .filter(s => s.status === SettlementStatus.PENDING).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (queueLength > 100 || pendingSettlements > 50) {
      status = 'unhealthy';
    } else if (queueLength > 50 || pendingSettlements > 25) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalSettlements,
        queueLength,
        pendingSettlements,
        isProcessing: this.isProcessing,
        autoSettlementEnabled: this.config.enableAutoSettlement
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        settlements: Array.from(this.settlements.values()),
        rules: Array.from(this.rules.values()),
        batches: Array.from(this.batches.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for settlements
      const headers = [
        'ID', 'Auction ID', 'Winner ID', 'Seller ID', 'Net Amount',
        'Currency', 'Payment Method', 'Status', 'Initiated At', 'Completed At'
      ];
      
      const rows = Array.from(this.settlements.values()).map(s => [
        s.id,
        s.auctionId,
        s.winnerId,
        s.sellerId,
        s.netAmount,
        s.currency,
        s.paymentMethod,
        s.status,
        s.initiatedAt.toISOString(),
        s.completedAt?.toISOString() || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
