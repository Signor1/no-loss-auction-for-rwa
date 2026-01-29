import { EventEmitter } from 'events';

// Enums
export enum AuctionType {
  ENGLISH = 'english',
  DUTCH = 'dutch',
  SEALED_BID = 'sealed_bid',
  VICKREY = 'vickrey',
  RESERVE_PRICE = 'reserve_price',
  NO_RESERVE = 'no_reserve'
}

export enum WinnerDeterminationMethod {
  HIGHEST_BID = 'highest_bid',
  SECOND_PRICE = 'second_price',
  LOWEST_BID = 'lowest_bid',
  UNIQUE_BID = 'unique_bid',
  RANDOM_DRAW = 'random_draw',
  RESERVE_MET = 'reserve_met'
}

export enum WinnerStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  DISPUTED = 'disputed',
  SETTLED = 'settled'
}

// Interfaces
export interface WinnerDetermination {
  id: string;
  auctionId: string;
  auctionType: AuctionType;
  method: WinnerDeterminationMethod;
  timestamp: Date;
  
  // Winner information
  winnerId: string;
  winningBidId: string;
  winningAmount: number;
  actualPrice?: number; // For second-price auctions
  
  // Bid details
  totalBids: number;
  uniqueBidders: number;
  bidHistory: string[];
  
  // Validation
  isValid: boolean;
  validationChecks: ValidationCheck[];
  disputes: Dispute[];
  
  // Settlement
  status: WinnerStatus;
  confirmedAt?: Date;
  settledAt?: Date;
  settlementTransactionHash?: string;
  
  // Metadata
  metadata: Record<string, any>;
  notes?: string;
}

export interface ValidationCheck {
  id: string;
  type: 'bid_validity' | 'timing' | 'eligibility' | 'reserve_price' | 'anti_fraud';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Dispute {
  id: string;
  winnerDeterminationId: string;
  raisedBy: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  raisedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface BidData {
  id: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  isValid: boolean;
  isProxy: boolean;
  transactionHash?: string;
}

export interface WinnerDeterminationConfig {
  enableAutoDetermination: boolean;
  determinationDelay: number; // minutes after auction end
  enableValidation: boolean;
  enableDisputeResolution: boolean;
  disputeResolutionTime: number; // hours
  enableAuditLog: boolean;
  maxRetries: number;
  retryDelay: number; // minutes
  enableSecondPriceLogic: boolean;
  enableAntiFraud: boolean;
  fraudDetectionThreshold: number;
}

export interface DeterminationResult {
  success: boolean;
  winnerId?: string;
  winningBidId?: string;
  winningAmount: number;
  actualPrice?: number;
  method: WinnerDeterminationMethod;
  confidence: number; // 0-100
  validationChecks: ValidationCheck[];
  metadata: Record<string, any>;
}

// Main Winner Determination Service
export class WinnerDeterminationService extends EventEmitter {
  private determinations: Map<string, WinnerDetermination> = new Map();
  private disputes: Map<string, Dispute> = new Map();
  private config: WinnerDeterminationConfig;
  private processingQueue: string[] = []; // auctionIds
  private isProcessing = false;

  constructor(config?: Partial<WinnerDeterminationConfig>) {
    super();
    this.config = {
      enableAutoDetermination: true,
      determinationDelay: 5,
      enableValidation: true,
      enableDisputeResolution: true,
      disputeResolutionTime: 48,
      enableAuditLog: true,
      maxRetries: 3,
      retryDelay: 10,
      enableSecondPriceLogic: true,
      enableAntiFraud: true,
      fraudDetectionThreshold: 0.8,
      ...config
    };
  }

  // Winner Determination
  async determineWinner(
    auctionId: string,
    auctionType: AuctionType,
    bids: BidData[],
    auctionSettings: {
      reservePrice?: number;
      enableProxyBidding: boolean;
      minimumBidIncrement: number;
      endTime: Date;
    }
  ): Promise<DeterminationResult> {
    try {
      // Validate inputs
      this.validateInputs(auctionId, auctionType, bids, auctionSettings);

      // Filter valid bids
      const validBids = bids.filter(bid => bid.isValid);
      
      if (validBids.length === 0) {
        throw new Error('No valid bids found');
      }

      // Determine method based on auction type
      const method = this.getDeterminationMethod(auctionType);
      
      // Apply winner determination logic
      const result = await this.applyDeterminationLogic(
        method,
        validBids,
        auctionSettings
      );

      // Perform validation checks
      if (this.config.enableValidation) {
        result.validationChecks = await this.performValidationChecks(
          auctionId,
          result,
          auctionSettings
        );
      }

      // Calculate confidence score
      result.confidence = this.calculateConfidenceScore(result, validBids);

      this.emit('winnerDetermined', { auctionId, result });
      return result;

    } catch (error) {
      const errorResult: DeterminationResult = {
        success: false,
        winningAmount: 0,
        method: WinnerDeterminationMethod.HIGHEST_BID,
        confidence: 0,
        validationChecks: [],
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      this.emit('determinationError', { auctionId, error });
      return errorResult;
    }
  }

  async createWinnerDetermination(
    auctionId: string,
    auctionType: AuctionType,
    result: DeterminationResult
  ): Promise<WinnerDetermination> {
    const determinationId = this.generateId();
    
    const determination: WinnerDetermination = {
      id: determinationId,
      auctionId,
      auctionType,
      method: result.method,
      timestamp: new Date(),
      winnerId: result.winnerId!,
      winningBidId: result.winningBidId!,
      winningAmount: result.winningAmount,
      actualPrice: result.actualPrice,
      totalBids: 0, // Would be populated from bid data
      uniqueBidders: 0, // Would be populated from bid data
      bidHistory: [], // Would be populated from bid data
      isValid: result.success,
      validationChecks: result.validationChecks,
      disputes: [],
      status: WinnerStatus.PENDING,
      metadata: result.metadata
    };

    this.determinations.set(determinationId, determination);
    this.emit('determinationCreated', determination);
    return determination;
  }

  async confirmWinner(
    determinationId: string,
    confirmedBy: string
  ): Promise<boolean> {
    const determination = this.determinations.get(determinationId);
    if (!determination || determination.status !== WinnerStatus.PENDING) {
      return false;
    }

    determination.status = WinnerStatus.CONFIRMED;
    determination.confirmedAt = new Date();

    this.emit('winnerConfirmed', { determination, confirmedBy });
    return true;
  }

  async rejectWinner(
    determinationId: string,
    reason: string,
    rejectedBy: string
  ): Promise<boolean> {
    const determination = this.determinations.get(determinationId);
    if (!determination || determination.status !== WinnerStatus.PENDING) {
      return false;
    }

    determination.status = WinnerStatus.REJECTED;
    determination.notes = `Rejected by ${rejectedBy}: ${reason}`;

    this.emit('winnerRejected', { determination, reason, rejectedBy });
    return true;
  }

  // Dispute Management
  async raiseDispute(
    determinationId: string,
    raisedBy: string,
    reason: string,
    description: string,
    evidence?: string[]
  ): Promise<Dispute> {
    const disputeId = this.generateId();
    
    const dispute: Dispute = {
      id: disputeId,
      winnerDeterminationId: determinationId,
      raisedBy,
      reason,
      description,
      evidence,
      status: 'open',
      raisedAt: new Date()
    };

    this.disputes.set(disputeId, dispute);

    // Update determination status
    const determination = this.determinations.get(determinationId);
    if (determination) {
      determination.status = WinnerStatus.DISPUTED;
      determination.disputes.push(dispute);
    }

    this.emit('disputeRaised', { determinationId, dispute });
    return dispute;
  }

  async resolveDispute(
    disputeId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<boolean> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute || dispute.status === 'resolved') {
      return false;
    }

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolvedAt = new Date();

    // Update determination status if all disputes are resolved
    const determination = this.determinations.get(dispute.winnerDeterminationId);
    if (determination) {
      const openDisputes = determination.disputes.filter(d => d.status === 'open');
      if (openDisputes.length === 0) {
        determination.status = WinnerStatus.CONFIRMED;
      }
    }

    this.emit('disputeResolved', { dispute, resolution, resolvedBy });
    return true;
  }

  // Private Methods
  private validateInputs(
    auctionId: string,
    auctionType: AuctionType,
    bids: BidData[],
    auctionSettings: any
  ): void {
    if (!auctionId) {
      throw new Error('Auction ID is required');
    }

    if (!auctionType) {
      throw new Error('Auction type is required');
    }

    if (!bids || bids.length === 0) {
      throw new Error('Bids are required');
    }

    if (!auctionSettings) {
      throw new Error('Auction settings are required');
    }
  }

  private getDeterminationMethod(auctionType: AuctionType): WinnerDeterminationMethod {
    switch (auctionType) {
      case AuctionType.ENGLISH:
        return WinnerDeterminationMethod.HIGHEST_BID;
      case AuctionType.DUTCH:
        return WinnerDeterminationMethod.LOWEST_BID;
      case AuctionType.SEALED_BID:
        return WinnerDeterminationMethod.HIGHEST_BID;
      case AuctionType.VICKREY:
        return WinnerDeterminationMethod.SECOND_PRICE;
      case AuctionType.RESERVE_PRICE:
        return WinnerDeterminationMethod.RESERVE_MET;
      case AuctionType.NO_RESERVE:
        return WinnerDeterminationMethod.HIGHEST_BID;
      default:
        return WinnerDeterminationMethod.HIGHEST_BID;
    }
  }

  private async applyDeterminationLogic(
    method: WinnerDeterminationMethod,
    bids: BidData[],
    auctionSettings: any
  ): Promise<DeterminationResult> {
    switch (method) {
      case WinnerDeterminationMethod.HIGHEST_BID:
        return this.determineHighestBid(bids, auctionSettings);
      case WinnerDeterminationMethod.SECOND_PRICE:
        return this.determineSecondPrice(bids, auctionSettings);
      case WinnerDeterminationMethod.LOWEST_BID:
        return this.determineLowestBid(bids, auctionSettings);
      case WinnerDeterminationMethod.UNIQUE_BID:
        return this.determineUniqueBid(bids, auctionSettings);
      case WinnerDeterminationMethod.RANDOM_DRAW:
        return this.determineRandomDraw(bids, auctionSettings);
      case WinnerDeterminationMethod.RESERVE_MET:
        return this.determineReserveMet(bids, auctionSettings);
      default:
        throw new Error(`Unsupported determination method: ${method}`);
    }
  }

  private async determineHighestBid(
    bids: BidData[],
    auctionSettings: any
  ): Promise<DeterminationResult> {
    const sortedBids = bids.sort((a, b) => b.amount - a.amount);
    const winningBid = sortedBids[0];

    // Check reserve price
    if (auctionSettings.reservePrice && winningBid.amount < auctionSettings.reservePrice) {
      return {
        success: false,
        winningAmount: winningBid.amount,
        method: WinnerDeterminationMethod.HIGHEST_BID,
        confidence: 0,
        validationChecks: [],
        metadata: { reason: 'Reserve price not met' }
      };
    }

    return {
      success: true,
      winnerId: winningBid.bidderId,
      winningBidId: winningBid.id,
      winningAmount: winningBid.amount,
      method: WinnerDeterminationMethod.HIGHEST_BID,
      confidence: 95,
      validationChecks: [],
      metadata: { bidCount: bids.length }
    };
  }

  private async determineSecondPrice(
    bids: BidData[],
    auctionSettings: any
  ): Promise<DeterminationResult> {
    const sortedBids = bids.sort((a, b) => b.amount - a.amount);
    
    if (sortedBids.length < 2) {
      return {
        success: false,
        winningAmount: sortedBids[0]?.amount || 0,
        method: WinnerDeterminationMethod.SECOND_PRICE,
        confidence: 0,
        validationChecks: [],
        metadata: { reason: 'Insufficient bids for second-price auction' }
      };
    }

    const winningBid = sortedBids[0];
    const secondPrice = sortedBids[1].amount;

    // Check reserve price
    if (auctionSettings.reservePrice && winningBid.amount < auctionSettings.reservePrice) {
      return {
        success: false,
        winningAmount: winningBid.amount,
        method: WinnerDeterminationMethod.SECOND_PRICE,
        confidence: 0,
        validationChecks: [],
        metadata: { reason: 'Reserve price not met' }
      };
    }

    return {
      success: true,
      winnerId: winningBid.bidderId,
      winningBidId: winningBid.id,
      winningAmount: winningBid.amount,
      actualPrice: secondPrice,
      method: WinnerDeterminationMethod.SECOND_PRICE,
      confidence: 90,
      validationChecks: [],
      metadata: { 
        bidCount: bids.length,
        secondPrice,
        firstPrice: winningBid.amount
      }
    };
  }

  private async determineLowestBid(
    bids: BidData[],
    auctionSettings: any
  ): Promise<DeterminationResult> {
    const sortedBids = bids.sort((a, b) => a.amount - b.amount);
    const winningBid = sortedBids[0];

    return {
      success: true,
      winnerId: winningBid.bidderId,
      winningBidId: winningBid.id,
      winningAmount: winningBid.amount,
      method: WinnerDeterminationMethod.LOWEST_BID,
      confidence: 85,
      validationChecks: [],
      metadata: { bidCount: bids.length }
    };
  }

  private async determineUniqueBid(
    bids: BidData[],
    auctionSettings: any
  ): Promise<DeterminationResult> {
    // Find unique bid amounts
    const amountCounts = new Map<number, BidData[]>();
    for (const bid of bids) {
      const existing = amountCounts.get(bid.amount) || [];
      existing.push(bid);
      amountCounts.set(bid.amount, existing);
    }

    // Find amounts with only one bid
    const uniqueAmounts = Array.from(amountCounts.entries())
      .filter(([_, bidList]) => bidList.length === 1)
      .sort((a, b) => b[0] - a[0]);

    if (uniqueAmounts.length === 0) {
      return {
        success: false,
        winningAmount: 0,
        method: WinnerDeterminationMethod.UNIQUE_BID,
        confidence: 0,
        validationChecks: [],
        metadata: { reason: 'No unique bids found' }
      };
    }

    const winningBid = uniqueAmounts[0][1][0];

    return {
      success: true,
      winnerId: winningBid.bidderId,
      winningBidId: winningBid.id,
      winningAmount: winningBid.amount,
      method: WinnerDeterminationMethod.UNIQUE_BID,
      confidence: 75,
      validationChecks: [],
      metadata: { bidCount: bids.length, uniqueBidCount: uniqueAmounts.length }
    };
  }

  private async determineRandomDraw(
    bids: BidData[],
    auctionSettings: any
  ): Promise<DeterminationResult> {
    const validBids = bids.filter(bid => bid.isValid);
    const randomIndex = Math.floor(Math.random() * validBids.length);
    const winningBid = validBids[randomIndex];

    return {
      success: true,
      winnerId: winningBid.bidderId,
      winningBidId: winningBid.id,
      winningAmount: winningBid.amount,
      method: WinnerDeterminationMethod.RANDOM_DRAW,
      confidence: 50,
      validationChecks: [],
      metadata: { 
        bidCount: bids.length,
        randomSeed: randomIndex
      }
    };
  }

  private async determineReserveMet(
    bids: BidData[],
    auctionSettings: any
  ): Promise<DeterminationResult> {
    const sortedBids = bids.sort((a, b) => b.amount - a.amount);
    const highestBid = sortedBids[0];

    if (!auctionSettings.reservePrice) {
      return {
        success: false,
        winningAmount: highestBid?.amount || 0,
        method: WinnerDeterminationMethod.RESERVE_MET,
        confidence: 0,
        validationChecks: [],
        metadata: { reason: 'No reserve price set' }
      };
    }

    const meetsReserve = highestBid && highestBid.amount >= auctionSettings.reservePrice;

    return {
      success: meetsReserve,
      winnerId: meetsReserve ? highestBid.bidderId : undefined,
      winningBidId: meetsReserve ? highestBid.id : undefined,
      winningAmount: meetsReserve ? highestBid.amount : 0,
      method: WinnerDeterminationMethod.RESERVE_MET,
      confidence: meetsReserve ? 90 : 0,
      validationChecks: [],
      metadata: { 
        reservePrice: auctionSettings.reservePrice,
        highestBid: highestBid?.amount || 0,
        meetsReserve
      }
    };
  }

  private async performValidationChecks(
    auctionId: string,
    result: DeterminationResult,
    auctionSettings: any
  ): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];

    // Bid validity check
    checks.push({
      id: this.generateId(),
      type: 'bid_validity',
      status: result.success ? 'passed' : 'failed',
      message: result.success ? 'Winner determination is valid' : 'Winner determination failed',
      severity: result.success ? 'low' : 'high'
    });

    // Timing check
    const now = new Date();
    const auctionEnded = now > auctionSettings.endTime;
    checks.push({
      id: this.generateId(),
      type: 'timing',
      status: auctionEnded ? 'passed' : 'warning',
      message: auctionEnded ? 'Auction has ended' : 'Auction may still be active',
      severity: auctionEnded ? 'low' : 'medium'
    });

    // Reserve price check
    if (auctionSettings.reservePrice) {
      const reserveMet = result.winningAmount >= auctionSettings.reservePrice;
      checks.push({
        id: this.generateId(),
        type: 'reserve_price',
        status: reserveMet ? 'passed' : 'failed',
        message: reserveMet ? 'Reserve price met' : 'Reserve price not met',
        severity: reserveMet ? 'low' : 'high',
        details: { 
          reservePrice: auctionSettings.reservePrice,
          winningAmount: result.winningAmount
        }
      });
    }

    // Anti-fraud check
    if (this.config.enableAntiFraud) {
      const fraudScore = this.calculateFraudScore(result);
      const isSuspicious = fraudScore > this.config.fraudDetectionThreshold;
      
      checks.push({
        id: this.generateId(),
        type: 'anti_fraud',
        status: isSuspicious ? 'warning' : 'passed',
        message: isSuspicious ? 'Suspicious bidding pattern detected' : 'No suspicious activity detected',
        severity: isSuspicious ? 'medium' : 'low',
        details: { fraudScore }
      });
    }

    return checks;
  }

  private calculateConfidenceScore(
    result: DeterminationResult,
    bids: BidData[]
  ): number {
    if (!result.success) return 0;

    let confidence = result.confidence || 50;

    // Adjust based on bid count
    if (bids.length > 10) {
      confidence += 10;
    } else if (bids.length < 3) {
      confidence -= 20;
    }

    // Adjust based on validation checks
    const failedChecks = result.validationChecks.filter(c => c.status === 'failed').length;
    confidence -= failedChecks * 15;

    return Math.max(0, Math.min(100, confidence));
  }

  private calculateFraudScore(result: DeterminationResult): number {
    // Simple fraud detection logic
    let score = 0;

    // High confidence with few bids is suspicious
    if (result.confidence > 90 && (result.metadata.bidCount || 0) < 5) {
      score += 0.3;
    }

    // Unusual winning patterns
    if (result.method === WinnerDeterminationMethod.UNIQUE_BID) {
      score += 0.2;
    }

    return Math.min(1, score);
  }

  private generateId(): string {
    return `winner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.isProcessing = false;
    this.processingQueue.length = 0;
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalDeterminations = this.determinations.size;
    const openDisputes = Array.from(this.disputes.values())
      .filter(d => d.status === 'open').length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (openDisputes > 10) {
      status = 'unhealthy';
    } else if (openDisputes > 5) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalDeterminations,
        openDisputes,
        isProcessing: this.isProcessing,
        autoDeterminationEnabled: this.config.enableAutoDetermination
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        determinations: Array.from(this.determinations.values()),
        disputes: Array.from(this.disputes.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for determinations
      const headers = [
        'ID', 'Auction ID', 'Winner ID', 'Winning Amount', 'Method',
        'Status', 'Timestamp', 'Confirmed At'
      ];
      
      const rows = Array.from(this.determinations.values()).map(d => [
        d.id,
        d.auctionId,
        d.winnerId,
        d.winningAmount,
        d.method,
        d.status,
        d.timestamp.toISOString(),
        d.confirmedAt?.toISOString() || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
