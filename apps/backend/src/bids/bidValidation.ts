import { EventEmitter } from 'events';

// Enums
export enum ValidationRule {
  MINIMUM_INCREMENT = 'minimum_increment',
  MAXIMUM_BID = 'maximum_bid',
  USER_ELIGIBILITY = 'user_eligibility',
  AUCTION_STATUS = 'auction_status',
  TIMING_VALIDATION = 'timing_validation',
  BALANCE_VALIDATION = 'balance_validation',
  RESERVE_PRICE = 'reserve_price',
  BIDDER_LIMIT = 'bidder_limit',
  ANTI_SNUPE = 'anti_snipe',
  KYC_REQUIRED = 'kyc_required',
  GEOGRAPHIC_RESTRICTION = 'geographic_restriction'
}

export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum BidStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  OUTBID = 'outbid',
  WINNING = 'winning'
}

// Interfaces
export interface BidValidationRequest {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  status: BidStatus;
  score: number; // 0-100 confidence score
  rules: RuleResult[];
  warnings: ValidationWarning[];
  errors: ValidationError[];
  processingTime: number;
  validatedAt: Date;
}

export interface RuleResult {
  rule: ValidationRule;
  passed: boolean;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, any>;
  score: number; // 0-100 impact on overall score
}

export interface ValidationError {
  id: string;
  rule: ValidationRule;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, any>;
  canRetry: boolean;
  suggestedAction?: string;
}

export interface ValidationWarning {
  id: string;
  rule: ValidationRule;
  message: string;
  details?: Record<string, any>;
  recommendation?: string;
}

export interface ValidationConfig {
  strictMode: boolean;
  enableAntiSnipe: boolean;
  antiSnipeWindow: number; // minutes before end
  requireKYC: boolean;
  enableGeographicRestriction: boolean;
  allowedCountries: string[];
  maxBidAmount: number;
  minBidIncrement: number;
  enableBalanceCheck: boolean;
  enableBidderLimit: boolean;
  maxBiddersPerAuction: number;
  timeoutMs: number;
  enableCaching: boolean;
  cacheTTL: number;
}

// Main Bid Validation Service
export class BidValidationService extends EventEmitter {
  private config: ValidationConfig;
  private validationCache: Map<string, ValidationResult> = new Map();
  private ruleEngine: ValidationRuleEngine;

  constructor(config?: Partial<ValidationConfig>) {
    super();
    this.config = {
      strictMode: false,
      enableAntiSnipe: true,
      antiSnipeWindow: 5,
      requireKYC: false,
      enableGeographicRestriction: false,
      allowedCountries: [],
      maxBidAmount: 1000000,
      minBidIncrement: 1,
      enableBalanceCheck: true,
      enableBidderLimit: false,
      maxBiddersPerAuction: 1000,
      timeoutMs: 5000,
      enableCaching: true,
      cacheTTL: 300,
      ...config
    };
    this.ruleEngine = new ValidationRuleEngine(this.config);
  }

  async validateBid(request: BidValidationRequest): Promise<ValidationResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.validationCache.get(cacheKey);
      if (cached && (Date.now() - cached.validatedAt.getTime()) < this.config.cacheTTL * 1000) {
        this.emit('validationCacheHit', { request, result: cached });
        return cached;
      }
    }

    try {
      // Run validation rules
      const ruleResults = await this.ruleEngine.executeRules(request);
      
      // Separate errors and warnings
      const errors = ruleResults
        .filter(r => !r.passed && (r.severity === ValidationSeverity.ERROR || r.severity === ValidationSeverity.CRITICAL))
        .map(r => ({
          id: this.generateId(),
          rule: r.rule,
          severity: r.severity,
          message: r.message,
          details: r.details,
          canRetry: r.rule !== ValidationRule.USER_ELIGIBILITY,
          suggestedAction: this.getSuggestedAction(r.rule)
        }));

      const warnings = ruleResults
        .filter(r => !r.passed && r.severity === ValidationSeverity.WARNING)
        .map(r => ({
          id: this.generateId(),
          rule: r.rule,
          message: r.message,
          details: r.details,
          recommendation: this.getRecommendation(r.rule)
        }));

      // Calculate overall score
      const score = this.calculateScore(ruleResults);
      
      // Determine validity and status
      const isValid = errors.length === 0;
      const status = isValid ? BidStatus.VALIDATED : BidStatus.REJECTED;

      const result: ValidationResult = {
        isValid,
        status,
        score,
        rules: ruleResults,
        warnings,
        errors,
        processingTime: Date.now() - startTime,
        validatedAt: new Date()
      };

      // Cache result
      if (this.config.enableCaching) {
        this.validationCache.set(cacheKey, result);
      }

      this.emit('bidValidated', { request, result });
      return result;

    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        status: BidStatus.REJECTED,
        score: 0,
        rules: [],
        warnings: [],
        errors: [{
          id: this.generateId(),
          rule: ValidationRule.USER_ELIGIBILITY,
          severity: ValidationSeverity.CRITICAL,
          message: error instanceof Error ? error.message : 'Unknown validation error',
          canRetry: false
        }],
        processingTime: Date.now() - startTime,
        validatedAt: new Date()
      };

      this.emit('validationError', { request, error });
      return errorResult;
    }
  }

  private calculateScore(ruleResults: RuleResult[]): number {
    if (ruleResults.length === 0) return 100;

    const totalWeight = ruleResults.reduce((sum, r) => sum + r.score, 0);
    const passedWeight = ruleResults.filter(r => r.passed).reduce((sum, r) => sum + r.score, 0);

    return Math.round((passedWeight / totalWeight) * 100);
  }

  private getSuggestedAction(rule: ValidationRule): string {
    switch (rule) {
      case ValidationRule.MINIMUM_INCREMENT:
        return 'Increase bid amount to meet minimum increment requirement';
      case ValidationRule.MAXIMUM_BID:
        return 'Reduce bid amount or contact support for higher limits';
      case ValidationRule.USER_ELIGIBILITY:
        return 'Complete user verification or check account status';
      case ValidationRule.AUCTION_STATUS:
        return 'Auction may not be active or may have ended';
      case ValidationRule.BALANCE_VALIDATION:
        return 'Ensure sufficient funds are available';
      case ValidationRule.KYC_REQUIRED:
        return 'Complete identity verification process';
      default:
        return 'Review bid requirements and try again';
    }
  }

  private getRecommendation(rule: ValidationRule): string {
    switch (rule) {
      case ValidationRule.RESERVE_PRICE:
        return 'Consider bidding higher to meet reserve price';
      case ValidationRule.ANTI_SNUPE:
        return 'Place bids earlier to avoid last-minute restrictions';
      case ValidationRule.GEOGRAPHIC_RESTRICTION:
        return 'Check if your location is allowed for this auction';
      default:
        return 'Review bid details for better success';
    }
  }

  private generateCacheKey(request: BidValidationRequest): string {
    return `${request.auctionId}_${request.bidderId}_${request.amount}_${Math.floor(request.timestamp.getTime() / 60000)}`;
  }

  private generateId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getValidationHistory(bidderId: string, limit = 50): Promise<ValidationResult[]> {
    // Placeholder - would fetch from database
    return [];
  }

  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.validationCache.clear();
    this.emit('serviceStopped');
  }
}

// Validation Rule Engine
class ValidationRuleEngine {
  private config: ValidationConfig;
  private rules: Map<ValidationRule, ValidationRuleFunction> = new Map();

  constructor(config: ValidationConfig) {
    this.config = config;
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules.set(ValidationRule.MINIMUM_INCREMENT, this.validateMinimumIncrement.bind(this));
    this.rules.set(ValidationRule.MAXIMUM_BID, this.validateMaximumBid.bind(this));
    this.rules.set(ValidationRule.USER_ELIGIBILITY, this.validateUserEligibility.bind(this));
    this.rules.set(ValidationRule.AUCTION_STATUS, this.validateAuctionStatus.bind(this));
    this.rules.set(ValidationRule.TIMING_VALIDATION, this.validateTiming.bind(this));
    this.rules.set(ValidationRule.BALANCE_VALIDATION, this.validateBalance.bind(this));
    this.rules.set(ValidationRule.RESERVE_PRICE, this.validateReservePrice.bind(this));
    this.rules.set(ValidationRule.BIDDER_LIMIT, this.validateBidderLimit.bind(this));
    this.rules.set(ValidationRule.ANTI_SNUPE, this.validateAntiSnipe.bind(this));
    this.rules.set(ValidationRule.KYC_REQUIRED, this.validateKYC.bind(this));
    this.rules.set(ValidationRule.GEOGRAPHIC_RESTRICTION, this.validateGeographic.bind(this));
  }

  async executeRules(request: BidValidationRequest): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    for (const [rule, ruleFunction] of this.rules) {
      try {
        const result = await ruleFunction(request);
        results.push(result);
      } catch (error) {
        results.push({
          rule,
          passed: false,
          severity: ValidationSeverity.ERROR,
          message: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          score: 0
        });
      }
    }

    return results;
  }

  private async validateMinimumIncrement(request: BidValidationRequest): Promise<RuleResult> {
    // Placeholder - would fetch current bid and auction settings
    const currentBid = 1000;
    const minIncrement = this.config.minBidIncrement;
    const requiredAmount = currentBid + minIncrement;

    return {
      rule: ValidationRule.MINIMUM_INCREMENT,
      passed: request.amount >= requiredAmount,
      severity: ValidationSeverity.ERROR,
      message: request.amount >= requiredAmount 
        ? 'Bid meets minimum increment requirement'
        : `Bid must be at least ${requiredAmount} (current: ${currentBid} + ${minIncrement})`,
      details: { currentBid, minIncrement, requiredAmount, bidAmount: request.amount },
      score: 20
    };
  }

  private async validateMaximumBid(request: BidValidationRequest): Promise<RuleResult> {
    return {
      rule: ValidationRule.MAXIMUM_BID,
      passed: request.amount <= this.config.maxBidAmount,
      severity: ValidationSeverity.ERROR,
      message: request.amount <= this.config.maxBidAmount
        ? 'Bid within maximum limits'
        : `Bid exceeds maximum allowed amount of ${this.config.maxBidAmount}`,
      details: { maxBid: this.config.maxBidAmount, bidAmount: request.amount },
      score: 15
    };
  }

  private async validateUserEligibility(request: BidValidationRequest): Promise<RuleResult> {
    // Placeholder - would check user status, verification, etc.
    const isEligible = true;

    return {
      rule: ValidationRule.USER_ELIGIBILITY,
      passed: isEligible,
      severity: ValidationSeverity.CRITICAL,
      message: isEligible ? 'User is eligible to bid' : 'User not eligible to bid',
      score: 25
    };
  }

  private async validateAuctionStatus(request: BidValidationRequest): Promise<RuleResult> {
    // Placeholder - would check auction status
    const isActive = true;

    return {
      rule: ValidationRule.AUCTION_STATUS,
      passed: isActive,
      severity: ValidationSeverity.CRITICAL,
      message: isActive ? 'Auction is active' : 'Auction is not active',
      score: 20
    };
  }

  private async validateTiming(request: BidValidationRequest): Promise<RuleResult> {
    // Placeholder - would check auction timing
    const isValidTiming = true;

    return {
      rule: ValidationRule.TIMING_VALIDATION,
      passed: isValidTiming,
      severity: ValidationSeverity.ERROR,
      message: isValidTiming ? 'Bid timing is valid' : 'Bid timing is invalid',
      score: 10
    };
  }

  private async validateBalance(request: BidValidationRequest): Promise<RuleResult> {
    if (!this.config.enableBalanceCheck) {
      return {
        rule: ValidationRule.BALANCE_VALIDATION,
        passed: true,
        severity: ValidationSeverity.INFO,
        message: 'Balance validation disabled',
        score: 5
      };
    }

    // Placeholder - would check user balance
    const hasSufficientBalance = true;

    return {
      rule: ValidationRule.BALANCE_VALIDATION,
      passed: hasSufficientBalance,
      severity: ValidationSeverity.ERROR,
      message: hasSufficientBalance ? 'Sufficient balance available' : 'Insufficient balance',
      score: 15
    };
  }

  private async validateReservePrice(request: BidValidationRequest): Promise<RuleResult> {
    // Placeholder - would check against reserve price
    const meetsReserve = true;

    return {
      rule: ValidationRule.RESERVE_PRICE,
      passed: true, // Reserve price is warning, not error
      severity: ValidationSeverity.WARNING,
      message: meetsReserve ? 'Bid meets reserve price' : 'Bid below reserve price',
      score: 5
    };
  }

  private async validateBidderLimit(request: BidValidationRequest): Promise<RuleResult> {
    if (!this.config.enableBidderLimit) {
      return {
        rule: ValidationRule.BIDDER_LIMIT,
        passed: true,
        severity: ValidationSeverity.INFO,
        message: 'Bidder limit disabled',
        score: 5
      };
    }

    // Placeholder - would check current number of bidders
    const withinLimit = true;

    return {
      rule: ValidationRule.BIDDER_LIMIT,
      passed: withinLimit,
      severity: ValidationSeverity.ERROR,
      message: withinLimit ? 'Within bidder limit' : 'Bidder limit exceeded',
      score: 10
    };
  }

  private async validateAntiSnipe(request: BidValidationRequest): Promise<RuleResult> {
    if (!this.config.enableAntiSnipe) {
      return {
        rule: ValidationRule.ANTI_SNUPE,
        passed: true,
        severity: ValidationSeverity.INFO,
        message: 'Anti-snipe protection disabled',
        score: 5
      };
    }

    // Placeholder - would check time until auction end
    const isWithinSnipeWindow = false;

    return {
      rule: ValidationRule.ANTI_SNUPE,
      passed: !isWithinSnipeWindow,
      severity: ValidationSeverity.WARNING,
      message: isWithinSnipeWindow 
        ? `Bid within anti-snipe window of ${this.config.antiSnipeWindow} minutes`
        : 'Bid outside anti-snipe window',
      score: 5
    };
  }

  private async validateKYC(request: BidValidationRequest): Promise<RuleResult> {
    if (!this.config.requireKYC) {
      return {
        rule: ValidationRule.KYC_REQUIRED,
        passed: true,
        severity: ValidationSeverity.INFO,
        message: 'KYC verification not required',
        score: 5
      };
    }

    // Placeholder - would check KYC status
    const isKYCVerified = true;

    return {
      rule: ValidationRule.KYC_REQUIRED,
      passed: isKYCVerified,
      severity: ValidationSeverity.CRITICAL,
      message: isKYCVerified ? 'KYC verified' : 'KYC verification required',
      score: 20
    };
  }

  private async validateGeographic(request: BidValidationRequest): Promise<RuleResult> {
    if (!this.config.enableGeographicRestriction) {
      return {
        rule: ValidationRule.GEOGRAPHIC_RESTRICTION,
        passed: true,
        severity: ValidationSeverity.INFO,
        message: 'Geographic restrictions disabled',
        score: 5
      };
    }

    // Placeholder - would check user location
    const isAllowedLocation = true;

    return {
      rule: ValidationRule.GEOGRAPHIC_RESTRICTION,
      passed: isAllowedLocation,
      severity: ValidationSeverity.ERROR,
      message: isAllowedLocation ? 'Location allowed' : 'Location restricted',
      score: 10
    };
  }
}

type ValidationRuleFunction = (request: BidValidationRequest) => Promise<RuleResult>;
