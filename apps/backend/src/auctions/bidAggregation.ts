import { EventEmitter } from 'events';
import { Auction, AuctionStatus, Bid } from './auctionService';

// Enums
export enum AggregationType {
  REAL_TIME = 'real_time',
  BATCH = 'batch',
  SCHEDULED = 'scheduled',
  ON_DEMAND = 'on_demand'
}

export enum AggregationPeriod {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export enum BidStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  OUTBID = 'outbid',
  WINNING = 'winning'
}

export enum ValidationRule {
  MINIMUM_INCREMENT = 'minimum_increment',
  MAXIMUM_BID = 'maximum_bid',
  USER_ELIGIBILITY = 'user_eligibility',
  AUCTION_STATUS = 'auction_status',
  TIMING_VALIDATION = 'timing_validation',
  BALANCE_VALIDATION = 'balance_validation',
  RESERVE_PRICE = 'reserve_price'
}

// Interfaces
export interface BidAggregation {
  id: string;
  auctionId: string;
  aggregationType: AggregationType;
  period: AggregationPeriod;
  startTime: Date;
  endTime: Date;
  
  // Aggregated data
  totalBids: number;
  uniqueBidders: number;
  totalVolume: number;
  averageBid: number;
  medianBid: number;
  highestBid: number;
  lowestBid: number;
  bidFrequency: number; // bids per minute
  
  // Bid distribution
  bidRanges: {
    range: string;
    count: number;
    percentage: number;
  }[];
  
  // Time-based data
  bidTimeline: {
    timestamp: Date;
    bidCount: number;
    highestBid: number;
    averageBid: number;
  }[];
  
  // Bidder activity
  bidderActivity: {
    bidderId: string;
    bidCount: number;
    totalAmount: number;
    averageBid: number;
    firstBidTime: Date;
    lastBidTime: Date;
    isWinner: boolean;
  }[];
  
  // Metadata
  metadata: Record<string, any>;
  createdAt: Date;
  processedAt: Date;
}

export interface BidValidation {
  id: string;
  bidId: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  
  // Validation results
  isValid: boolean;
  status: BidStatus;
  rules: ValidationRule[];
  failures: ValidationFailure[];
  warnings: ValidationWarning[];
  
  // Processing info
  processedAt: Date;
  processingTime: number;
  validatedBy: string;
  
  // Metadata
  metadata: Record<string, any>;
}

export interface ValidationFailure {
  rule: ValidationRule;
  severity: 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  canRetry: boolean;
}

export interface ValidationWarning {
  rule: ValidationRule;
  message: string;
  details?: Record<string, any>;
  recommendation?: string;
}

export interface BidAggregationConfig {
  enableRealTimeAggregation: boolean;
  aggregationInterval: number; // in seconds
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // in milliseconds
  enableValidation: boolean;
  strictValidation: boolean;
  enableAnalytics: boolean;
  retentionPeriod: number; // in days
  compressionEnabled: boolean;
  enableCaching: boolean;
  cacheTTL: number; // in seconds
}

export interface BidAnalytics {
  auctionId: string;
  period: AggregationPeriod;
  startTime: Date;
  endTime: Date;
  
  // Price analytics
  priceTrends: {
    timestamp: Date;
    price: number;
    change: number;
    changePercent: number;
  }[];
  
  // Volume analytics
  volumeAnalytics: {
    totalVolume: number;
    averageVolumePerBid: number;
    volumeByTimeRange: {
      timeRange: string;
      volume: number;
      bidCount: number;
    }[];
  };
  
  // Bidder analytics
  bidderAnalytics: {
    totalBidders: number;
    newBidders: number;
    returningBidders: number;
    bidderRetentionRate: number;
    topBidders: {
      bidderId: string;
      bidCount: number;
      totalAmount: number;
      winRate: number;
    }[];
  };
  
  // Competition analytics
  competitionMetrics: {
    competitionLevel: 'low' | 'medium' | 'high' | 'very_high';
    bidFrequency: number;
    averageBidIncrement: number;
    timeToFirstBid: number;
    timeToLastBid: number;
    biddingHeatmap: {
      hour: number;
      bidCount: number;
      averageBid: number;
    }[];
  };
  
  // Predictions
  predictions: {
    expectedFinalPrice: number;
    confidence: number;
    timeToEnd: number;
    probabilityOfReserveMet: number;
  }?;
}

// Main Bid Aggregation Service
export class BidAggregationService extends EventEmitter {
  private aggregations: Map<string, BidAggregation> = new Map();
  private validations: Map<string, BidValidation> = new Map();
  private bidHistory: Map<string, Bid[]> = new Map(); // auctionId -> bids
  private config: BidAggregationConfig;
  private aggregationTimer?: NodeJS.Timeout;
  private processingQueue: Bid[] = [];
  private isProcessing = false;

  constructor(config?: Partial<BidAggregationConfig>) {
    super();
    this.config = {
      enableRealTimeAggregation: true,
      aggregationInterval: 60, // 1 minute
      batchSize: 100,
      maxRetries: 3,
      retryDelay: 5000,
      enableValidation: true,
      strictValidation: false,
      enableAnalytics: true,
      retentionPeriod: 90,
      compressionEnabled: true,
      enableCaching: true,
      cacheTTL: 300, // 5 minutes
      ...config
    };
  }

  // Bid Processing and Validation
  async processBid(bid: Bid): Promise<BidValidation> {
    const validationId = this.generateId();
    const startTime = Date.now();

    try {
      // Validate bid
      const validation = await this.validateBid(bid);
      validation.id = validationId;
      validation.processedAt = new Date();
      validation.processingTime = Date.now() - startTime;
      validation.validatedBy = 'system';

      // Store validation
      this.validations.set(validationId, validation);

      // Store bid in history
      const auctionBids = this.bidHistory.get(bid.auctionId) || [];
      auctionBids.push(bid);
      this.bidHistory.set(bid.auctionId, auctionBids);

      // Trigger real-time aggregation if enabled
      if (this.config.enableRealTimeAggregation && validation.isValid) {
        await this.triggerRealTimeAggregation(bid.auctionId);
      }

      this.emit('bidProcessed', { bid, validation });
      return validation;

    } catch (error) {
      const validation: BidValidation = {
        id: validationId,
        bidId: bid.id,
        auctionId: bid.auctionId,
        bidderId: bid.bidderId,
        amount: bid.amount,
        timestamp: bid.timestamp,
        isValid: false,
        status: BidStatus.REJECTED,
        rules: [],
        failures: [{
          rule: ValidationRule.USER_ELIGIBILITY,
          severity: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          canRetry: false
        }],
        warnings: [],
        processedAt: new Date(),
        processingTime: Date.now() - startTime,
        validatedBy: 'system',
        metadata: {}
      };

      this.validations.set(validationId, validation);
      this.emit('bidProcessed', { bid, validation });
      return validation;
    }
  }

  private async validateBid(bid: Bid): Promise<BidValidation> {
    const validation: BidValidation = {
      id: '',
      bidId: bid.id,
      auctionId: bid.auctionId,
      bidderId: bid.bidderId,
      amount: bid.amount,
      timestamp: bid.timestamp,
      isValid: true,
      status: BidStatus.PENDING,
      rules: [],
      failures: [],
      warnings: [],
      processedAt: new Date(),
      processingTime: 0,
      validatedBy: 'system',
      metadata: {}
    };

    // Get auction data (placeholder - would fetch from auction service)
    const auction = await this.getAuction(bid.auctionId);
    if (!auction) {
      validation.isValid = false;
      validation.status = BidStatus.REJECTED;
      validation.failures.push({
        rule: ValidationRule.AUCTION_STATUS,
        severity: 'error',
        message: 'Auction not found',
        canRetry: false
      });
      return validation;
    }

    // Validate auction status
    if (auction.status !== AuctionStatus.ACTIVE) {
      validation.isValid = false;
      validation.status = BidStatus.REJECTED;
      validation.failures.push({
        rule: ValidationRule.AUCTION_STATUS,
        severity: 'error',
        message: `Auction is not active (status: ${auction.status})`,
        canRetry: false
      });
    }

    // Validate minimum bid increment
    if (auction.currentBid && bid.amount <= auction.currentBid.amount + auction.minimumBidIncrement) {
      validation.isValid = false;
      validation.status = BidStatus.REJECTED;
      validation.failures.push({
        rule: ValidationRule.MINIMUM_INCREMENT,
        severity: 'error',
        message: `Bid must be at least ${auction.minimumBidIncrement} higher than current bid`,
        details: {
          currentBid: auction.currentBid.amount,
          minimumIncrement: auction.minimumBidIncrement,
          requiredMinimum: auction.currentBid.amount + auction.minimumBidIncrement
        },
        canRetry: true
      });
    }

    // Validate reserve price
    if (auction.reservePrice && bid.amount < auction.reservePrice) {
      validation.warnings.push({
        rule: ValidationRule.RESERVE_PRICE,
        message: 'Bid is below reserve price',
        details: {
          bidAmount: bid.amount,
          reservePrice: auction.reservePrice
        },
        recommendation: 'Consider bidding higher to meet reserve price'
      });
    }

    // Validate user eligibility (placeholder)
    const isEligible = await this.checkUserEligibility(bid.bidderId, bid.auctionId);
    if (!isEligible) {
      validation.isValid = false;
      validation.status = BidStatus.REJECTED;
      validation.failures.push({
        rule: ValidationRule.USER_ELIGIBILITY,
        severity: 'error',
        message: 'User is not eligible to bid',
        canRetry: false
      });
    }

    // Set final status
    if (validation.isValid) {
      validation.status = BidStatus.VALIDATED;
    }

    return validation;
  }

  // Aggregation Methods
  async aggregateBids(
    auctionId: string,
    aggregationType: AggregationType,
    period: AggregationPeriod,
    startTime?: Date,
    endTime?: Date
  ): Promise<BidAggregation> {
    const aggregationId = this.generateId();
    const now = new Date();
    
    // Get bids for the period
    const bids = await this.getBidsForPeriod(auctionId, startTime, endTime);
    
    if (bids.length === 0) {
      throw new Error('No bids found for the specified period');
    }

    // Calculate aggregated metrics
    const totalBids = bids.length;
    const uniqueBidders = new Set(bids.map(b => b.bidderId)).size;
    const totalVolume = bids.reduce((sum, b) => sum + b.amount, 0);
    const averageBid = totalVolume / totalBids;
    const sortedBids = bids.map(b => b.amount).sort((a, b) => a - b);
    const medianBid = sortedBids[Math.floor(sortedBids.length / 2)];
    const highestBid = Math.max(...bids.map(b => b.amount));
    const lowestBid = Math.min(...bids.map(b => b.amount));
    
    const timeSpan = (endTime?.getTime() || now.getTime()) - (startTime?.getTime() || bids[0].timestamp.getTime());
    const bidFrequency = (timeSpan > 0) ? (totalBids / (timeSpan / (1000 * 60))) : 0;

    // Calculate bid ranges
    const bidRanges = this.calculateBidRanges(bids);
    
    // Generate bid timeline
    const bidTimeline = this.generateBidTimeline(bids, period);
    
    // Calculate bidder activity
    const bidderActivity = this.calculateBidderActivity(bids);

    const aggregation: BidAggregation = {
      id: aggregationId,
      auctionId,
      aggregationType,
      period,
      startTime: startTime || bids[0].timestamp,
      endTime: endTime || now,
      totalBids,
      uniqueBidders,
      totalVolume,
      averageBid,
      medianBid,
      highestBid,
      lowestBid,
      bidFrequency,
      bidRanges,
      bidTimeline,
      bidderActivity,
      metadata: {},
      createdAt: now,
      processedAt: now
    };

    this.aggregations.set(aggregationId, aggregation);
    this.emit('aggregationCompleted', aggregation);
    return aggregation;
  }

  async getAggregation(aggregationId: string): Promise<BidAggregation | null> {
    return this.aggregations.get(aggregationId) || null;
  }

  async getAuctionAggregations(auctionId: string): Promise<BidAggregation[]> {
    return Array.from(this.aggregations.values())
      .filter(agg => agg.auctionId === auctionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Analytics
  async generateBidAnalytics(
    auctionId: string,
    period: AggregationPeriod,
    startTime?: Date,
    endTime?: Date
  ): Promise<BidAnalytics> {
    const bids = await this.getBidsForPeriod(auctionId, startTime, endTime);
    
    if (bids.length === 0) {
      throw new Error('No bids found for analytics generation');
    }

    // Price trends
    const priceTrends = this.calculatePriceTrends(bids);
    
    // Volume analytics
    const volumeAnalytics = this.calculateVolumeAnalytics(bids);
    
    // Bidder analytics
    const bidderAnalytics = this.calculateBidderAnalytics(bids);
    
    // Competition metrics
    const competitionMetrics = this.calculateCompetitionMetrics(bids);
    
    // Predictions
    const predictions = this.generatePredictions(bids);

    const analytics: BidAnalytics = {
      auctionId,
      period,
      startTime: startTime || bids[0].timestamp,
      endTime: endTime || new Date(),
      priceTrends,
      volumeAnalytics,
      bidderAnalytics,
      competitionMetrics,
      predictions
    };

    return analytics;
  }

  // Real-time Processing
  private async triggerRealTimeAggregation(auctionId: string): Promise<void> {
    try {
      await this.aggregateBids(
        auctionId,
        AggregationType.REAL_TIME,
        AggregationPeriod.MINUTE
      );
    } catch (error) {
      this.emit('aggregationError', { auctionId, error });
    }
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.processingQueue.splice(0, this.config.batchSize);

    try {
      for (const bid of batch) {
        await this.processBid(bid);
      }
    } catch (error) {
      this.emit('batchProcessingError', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Helper Methods
  private async getAuction(auctionId: string): Promise<Auction | null> {
    // Placeholder - would fetch from auction service
    return null;
  }

  private async checkUserEligibility(userId: string, auctionId: string): Promise<boolean> {
    // Placeholder - would check user eligibility
    return true;
  }

  private async getBidsForPeriod(
    auctionId: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<Bid[]> {
    const bids = this.bidHistory.get(auctionId) || [];
    
    return bids.filter(bid => {
      if (startTime && bid.timestamp < startTime) return false;
      if (endTime && bid.timestamp > endTime) return false;
      return true;
    });
  }

  private calculateBidRanges(bids: Bid[]): BidAggregation['bidRanges'] {
    const amounts = bids.map(b => b.amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    const rangeSize = (max - min) / 5; // 5 ranges

    const ranges: BidAggregation['bidRanges'] = [];
    for (let i = 0; i < 5; i++) {
      const rangeMin = min + (i * rangeSize);
      const rangeMax = i === 4 ? max : min + ((i + 1) * rangeSize);
      const count = amounts.filter(a => a >= rangeMin && a < rangeMax).length;
      
      ranges.push({
        range: `${rangeMin.toFixed(2)}-${rangeMax.toFixed(2)}`,
        count,
        percentage: (count / bids.length) * 100
      });
    }

    return ranges;
  }

  private generateBidTimeline(bids: Bid[], period: AggregationPeriod): BidAggregation['bidTimeline'] {
    const timeline: BidAggregation['bidTimeline'] = [];
    const groupedBids = new Map<string, Bid[]>();

    // Group bids by time period
    for (const bid of bids) {
      const key = this.getTimeKey(bid.timestamp, period);
      if (!groupedBids.has(key)) {
        groupedBids.set(key, []);
      }
      groupedBids.get(key)!.push(bid);
    }

    // Generate timeline data
    for (const [timeKey, periodBids] of groupedBids) {
      const timestamp = new Date(timeKey);
      const bidCount = periodBids.length;
      const highestBid = Math.max(...periodBids.map(b => b.amount));
      const averageBid = periodBids.reduce((sum, b) => sum + b.amount, 0) / bidCount;

      timeline.push({
        timestamp,
        bidCount,
        highestBid,
        averageBid
      });
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateBidderActivity(bids: Bid[]): BidAggregation['bidderActivity'] {
    const bidderMap = new Map<string, BidAggregation['bidderActivity'][0]>();

    for (const bid of bids) {
      const existing = bidderMap.get(bid.bidderId);
      if (existing) {
        existing.bidCount++;
        existing.totalAmount += bid.amount;
        existing.averageBid = existing.totalAmount / existing.bidCount;
        existing.lastBidTime = bid.timestamp;
      } else {
        bidderMap.set(bid.bidderId, {
          bidderId: bid.bidderId,
          bidCount: 1,
          totalAmount: bid.amount,
          averageBid: bid.amount,
          firstBidTime: bid.timestamp,
          lastBidTime: bid.timestamp,
          isWinner: false // Would be determined at auction end
        });
      }
    }

    return Array.from(bidderMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private calculatePriceTrends(bids: Bid[]): BidAnalytics['priceTrends'] {
    const sortedBids = bids.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const trends: BidAnalytics['priceTrends'] = [];
    let previousPrice = 0;

    for (let i = 0; i < sortedBids.length; i++) {
      const bid = sortedBids[i];
      const change = bid.amount - previousPrice;
      const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

      trends.push({
        timestamp: bid.timestamp,
        price: bid.amount,
        change,
        changePercent
      });

      previousPrice = bid.amount;
    }

    return trends;
  }

  private calculateVolumeAnalytics(bids: Bid[]): BidAnalytics['volumeAnalytics'] {
    const totalVolume = bids.reduce((sum, b) => sum + b.amount, 0);
    const averageVolumePerBid = totalVolume / bids.length;

    // Volume by time range
    const volumeByTimeRange = this.calculateVolumeByTimeRange(bids);

    return {
      totalVolume,
      averageVolumePerBid,
      volumeByTimeRange
    };
  }

  private calculateBidderAnalytics(bids: Bid[]): BidAnalytics['bidderAnalytics'] {
    const uniqueBidders = new Set(bids.map(b => b.bidderId));
    const totalBidders = uniqueBidders.size;
    
    // Simplified calculation - would need historical data for accurate metrics
    const newBidders = Math.floor(totalBidders * 0.7);
    const returningBidders = totalBidders - newBidders;
    const bidderRetentionRate = returningBidders / totalBidders;

    // Top bidders
    const bidderMap = new Map<string, { bidCount: number; totalAmount: number }>();
    for (const bid of bids) {
      const existing = bidderMap.get(bid.bidderId) || { bidCount: 0, totalAmount: 0 };
      existing.bidCount++;
      existing.totalAmount += bid.amount;
      bidderMap.set(bid.bidderId, existing);
    }

    const topBidders = Array.from(bidderMap.entries())
      .map(([bidderId, data]) => ({
        bidderId,
        bidCount: data.bidCount,
        totalAmount: data.totalAmount,
        winRate: 0 // Would be calculated based on auction results
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return {
      totalBidders,
      newBidders,
      returningBidders,
      bidderRetentionRate,
      topBidders
    };
  }

  private calculateCompetitionMetrics(bids: Bid[]): BidAnalytics['competitionMetrics'] {
    const bidCount = bids.length;
    const timeSpan = bids[bids.length - 1].timestamp.getTime() - bids[0].timestamp.getTime();
    const bidFrequency = timeSpan > 0 ? (bidCount / (timeSpan / (1000 * 60))) : 0;

    // Average bid increment
    let totalIncrement = 0;
    for (let i = 1; i < bids.length; i++) {
      totalIncrement += bids[i].amount - bids[i - 1].amount;
    }
    const averageBidIncrement = bids.length > 1 ? totalIncrement / (bids.length - 1) : 0;

    // Time to first and last bid
    const timeToFirstBid = 0; // Would be calculated from auction start
    const timeToLastBid = timeSpan;

    // Competition level
    let competitionLevel: BidAnalytics['competitionMetrics']['competitionLevel'] = 'low';
    if (bidFrequency > 10) competitionLevel = 'very_high';
    else if (bidFrequency > 5) competitionLevel = 'high';
    else if (bidFrequency > 2) competitionLevel = 'medium';

    // Bidding heatmap
    const biddingHeatmap = this.calculateBiddingHeatmap(bids);

    return {
      competitionLevel,
      bidFrequency,
      averageBidIncrement,
      timeToFirstBid,
      timeToLastBid,
      biddingHeatmap
    };
  }

  private calculateVolumeByTimeRange(bids: Bid[]): BidAnalytics['volumeAnalytics']['volumeByTimeRange'] {
    const ranges = [
      { name: 'Morning', start: 6, end: 12 },
      { name: 'Afternoon', start: 12, end: 18 },
      { name: 'Evening', start: 18, end: 24 },
      { name: 'Night', start: 0, end: 6 }
    ];

    return ranges.map(range => {
      const rangeBids = bids.filter(bid => {
        const hour = bid.timestamp.getHours();
        return hour >= range.start && hour < range.end;
      });

      return {
        timeRange: range.name,
        volume: rangeBids.reduce((sum, b) => sum + b.amount, 0),
        bidCount: rangeBids.length
      };
    });
  }

  private calculateBiddingHeatmap(bids: Bid[]): BidAnalytics['competitionMetrics']['biddingHeatmap'] {
    const hourlyData = new Map<number, { bidCount: number; totalAmount: number }>();

    for (const bid of bids) {
      const hour = bid.timestamp.getHours();
      const existing = hourlyData.get(hour) || { bidCount: 0, totalAmount: 0 };
      existing.bidCount++;
      existing.totalAmount += bid.amount;
      hourlyData.set(hour, existing);
    }

    return Array.from(hourlyData.entries())
      .map(([hour, data]) => ({
        hour,
        bidCount: data.bidCount,
        averageBid: data.totalAmount / data.bidCount
      }))
      .sort((a, b) => a.hour - b.hour);
  }

  private generatePredictions(bids: Bid[]): BidAnalytics['predictions'] {
    if (bids.length < 3) {
      return undefined;
    }

    // Simple linear regression for price prediction
    const prices = bids.map(b => b.amount);
    const timePoints = bids.map((b, i) => i);
    
    const n = prices.length;
    const sumX = timePoints.reduce((sum, x) => sum + x, 0);
    const sumY = prices.reduce((sum, y) => sum + y, 0);
    const sumXY = timePoints.reduce((sum, x, i) => sum + x * prices[i], 0);
    const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const expectedFinalPrice = slope * (n + 5) + intercept; // Predict 5 more bids
    const confidence = Math.max(0, Math.min(1, 1 - (Math.abs(slope) / prices[prices.length - 1])));
    const timeToEnd = 0; // Would calculate based on auction end time
    const probabilityOfReserveMet = 0.8; // Would calculate based on reserve price

    return {
      expectedFinalPrice,
      confidence,
      timeToEnd,
      probabilityOfReserveMet
    };
  }

  private getTimeKey(timestamp: Date, period: AggregationPeriod): string {
    const date = new Date(timestamp);
    
    switch (period) {
      case AggregationPeriod.MINUTE:
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
      case AggregationPeriod.HOUR:
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      case AggregationPeriod.DAY:
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      case AggregationPeriod.WEEK:
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
      case AggregationPeriod.MONTH:
        return `${date.getFullYear()}-${date.getMonth()}`;
      default:
        return date.toISOString();
    }
  }

  private generateId(): string {
    return `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    if (this.config.enableRealTimeAggregation) {
      this.aggregationTimer = setInterval(async () => {
        await this.processBatch();
      }, this.config.aggregationInterval * 1000);
    }

    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }

    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalAggregations = this.aggregations.size;
    const totalValidations = this.validations.size;
    const queueLength = this.processingQueue.length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (queueLength > 1000) {
      status = 'unhealthy';
    } else if (queueLength > 500) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalAggregations,
        totalValidations,
        queueLength,
        isProcessing: this.isProcessing,
        realTimeAggregationEnabled: this.config.enableRealTimeAggregation
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        aggregations: Array.from(this.aggregations.values()),
        validations: Array.from(this.validations.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for aggregations
      const headers = [
        'ID', 'Auction ID', 'Type', 'Period', 'Total Bids', 'Unique Bidders',
        'Total Volume', 'Average Bid', 'Highest Bid', 'Lowest Bid', 'Bid Frequency'
      ];
      
      const rows = Array.from(this.aggregations.values()).map(a => [
        a.id,
        a.auctionId,
        a.aggregationType,
        a.period,
        a.totalBids,
        a.uniqueBidders,
        a.totalVolume,
        a.averageBid,
        a.highestBid,
        a.lowestBid,
        a.bidFrequency
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
