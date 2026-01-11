import { EventEmitter } from 'events';

// Enums
export enum AuctionStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  SETTLED = 'settled'
}

export enum AuctionType {
  ENGLISH = 'english',
  DUTCH = 'dutch',
  SEALED_BID = 'sealed_bid',
  VICKREY = 'vickrey',
  RESERVE_PRICE = 'reserve_price',
  NO_RESERVE = 'no_reserve'
}

export enum BiddingStrategy {
  HIGHEST_BID = 'highest_bid',
  LOWEST_BID = 'lowest_bid',
  SECOND_PRICE = 'second_price',
  FIXED_PRICE = 'fixed_price'
}

export enum AuctionVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITE_ONLY = 'invite_only'
}

// Interfaces
export interface Auction {
  id: string;
  title: string;
  description: string;
  assetId: string;
  assetType: string;
  auctionType: AuctionType;
  biddingStrategy: BiddingStrategy;
  status: AuctionStatus;
  visibility: AuctionVisibility;
  
  // Timing
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  settledAt?: Date;
  
  // Pricing
  startingPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  minimumBidIncrement: number;
  currentPrice: number;
  currentBid?: Bid;
  
  // Participants
  sellerId: string;
  winnerId?: string;
  participantIds: string[];
  invitedParticipants?: string[];
  maxParticipants?: number;
  
  // Settings
  autoExtend: boolean;
  extensionDuration: number; // in minutes
  bidHistoryPublic: boolean;
  requireVerification: boolean;
  allowBuyNow: boolean;
  allowProxyBidding: boolean;
  
  // Metadata
  category: string;
  tags: string[];
  images: string[];
  documents: string[];
  customFields: Record<string, any>;
  
  // Statistics
  totalBids: number;
  uniqueBidders: number;
  totalVolume: number;
  viewCount: number;
  watchCount: number;
  
  // Blockchain
  contractAddress?: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  
  // Settlement
  settlementStatus: 'pending' | 'processing' | 'completed' | 'failed';
  settlementTransactionHash?: string;
  settlementCompletedAt?: Date;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  isProxy: boolean;
  proxyMaxAmount?: number;
  isWinning: boolean;
  status: 'active' | 'outbid' | 'withdrawn' | 'winning';
  
  // Blockchain
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  confirmed: boolean;
  confirmations: number;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuctionConfig {
  defaultAuctionDuration: number; // in hours
  defaultBidIncrement: number;
  maxAuctionDuration: number;
  minReservePrice: number;
  maxReservePrice: number;
  maxParticipants: number;
  extensionThreshold: number; // minutes before end to trigger extension
  maxExtensions: number;
  verificationRequired: boolean;
  autoSettlement: boolean;
  settlementDelay: number; // in hours
  commissionRate: number; // percentage
  minCommission: number;
  maxCommission: number;
}

export interface AuctionFilter {
  status?: AuctionStatus[];
  type?: AuctionType[];
  category?: string[];
  sellerId?: string;
  priceRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  hasReserve?: boolean;
  hasBuyNow?: boolean;
  sortBy?: 'createdAt' | 'startTime' | 'endTime' | 'currentPrice' | 'totalBids';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  completedAuctions: number;
  cancelledAuctions: number;
  totalVolume: number;
  averagePrice: number;
  averageBidsPerAuction: number;
  successRate: number;
  topCategories: { category: string; count: number; volume: number }[];
  recentActivity: {
    date: Date;
    auctionId: string;
    action: 'created' | 'started' | 'ended' | 'cancelled';
    sellerId: string;
  }[];
}

// Main Auction Service
export class AuctionService extends EventEmitter {
  private auctions: Map<string, Auction> = new Map();
  private bids: Map<string, Bid> = new Map();
  private auctionBids: Map<string, string[]> = new Map(); // auctionId -> bidIds
  private userBids: Map<string, string[]> = new Map(); // userId -> bidIds
  private userAuctions: Map<string, string[]> = new Map(); // userId -> auctionIds
  private config: AuctionConfig;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<AuctionConfig>) {
    super();
    this.config = {
      defaultAuctionDuration: 24,
      defaultBidIncrement: 1,
      maxAuctionDuration: 168, // 1 week
      minReservePrice: 0,
      maxReservePrice: 1000000,
      maxParticipants: 1000,
      extensionThreshold: 5, // 5 minutes
      maxExtensions: 3,
      verificationRequired: false,
      autoSettlement: true,
      settlementDelay: 24,
      commissionRate: 2.5,
      minCommission: 1,
      maxCommission: 1000,
      ...config
    };
  }

  // Auction Creation and Management
  async createAuction(auctionData: Omit<Auction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentPrice' | 'totalBids' | 'uniqueBidders' | 'totalVolume' | 'viewCount' | 'watchCount' | 'settlementStatus'>): Promise<Auction> {
    const auctionId = this.generateId();
    const now = new Date();
    
    const auction: Auction = {
      ...auctionData,
      id: auctionId,
      status: AuctionStatus.DRAFT,
      currentPrice: auctionData.startingPrice,
      totalBids: 0,
      uniqueBidders: 0,
      totalVolume: 0,
      viewCount: 0,
      watchCount: 0,
      settlementStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    // Validate auction data
    this.validateAuction(auction);

    // Store auction
    this.auctions.set(auctionId, auction);
    this.auctionBids.set(auctionId, []);

    // Track user auctions
    const userAuctions = this.userAuctions.get(auction.sellerId) || [];
    userAuctions.push(auctionId);
    this.userAuctions.set(auction.sellerId, userAuctions);

    // Schedule auction start if needed
    if (auction.startTime > now) {
      this.scheduleAuctionStart(auctionId, auction.startTime);
      auction.status = AuctionStatus.SCHEDULED;
    } else {
      // Start immediately
      await this.startAuction(auctionId);
    }

    this.emit('auctionCreated', auction);
    return auction;
  }

  async getAuction(auctionId: string): Promise<Auction | null> {
    return this.auctions.get(auctionId) || null;
  }

  async updateAuction(
    auctionId: string,
    updates: Partial<Auction>,
    updatedBy: string
  ): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    // Check if auction can be updated
    if (auction.status === AuctionStatus.ACTIVE || auction.status === AuctionStatus.ENDED) {
      throw new Error('Cannot update active or ended auction');
    }

    // Apply updates
    Object.assign(auction, updates);
    auction.updatedAt = new Date();

    // Validate updated auction
    this.validateAuction(auction);

    // Reschedule if start time changed
    if (updates.startTime && updates.startTime > new Date()) {
      this.rescheduleAuctionStart(auctionId, updates.startTime);
    }

    this.emit('auctionUpdated', { auctionId, updates, updatedBy });
    return true;
  }

  async deleteAuction(auctionId: string, deletedBy: string): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    // Only allow deletion of draft auctions
    if (auction.status !== AuctionStatus.DRAFT) {
      throw new Error('Can only delete draft auctions');
    }

    // Cancel scheduled jobs
    const job = this.scheduledJobs.get(auctionId);
    if (job) {
      clearTimeout(job);
      this.scheduledJobs.delete(auctionId);
    }

    // Remove auction and related data
    this.auctions.delete(auctionId);
    this.auctionBids.delete(auctionId);

    // Update user auctions
    const userAuctions = this.userAuctions.get(auction.sellerId) || [];
    const index = userAuctions.indexOf(auctionId);
    if (index > -1) {
      userAuctions.splice(index, 1);
      this.userAuctions.set(auction.sellerId, userAuctions);
    }

    this.emit('auctionDeleted', { auctionId, deletedBy });
    return true;
  }

  // Auction Lifecycle Management
  async startAuction(auctionId: string): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.status !== AuctionStatus.DRAFT && auction.status !== AuctionStatus.SCHEDULED) {
      throw new Error('Auction cannot be started');
    }

    auction.status = AuctionStatus.ACTIVE;
    auction.updatedAt = new Date();

    // Schedule auction end
    this.scheduleAuctionEnd(auctionId, auction.endTime);

    this.emit('auctionStarted', auction);
    return true;
  }

  async pauseAuction(auctionId: string, pausedBy: string): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new Error('Only active auctions can be paused');
    }

    auction.status = AuctionStatus.PAUSED;
    auction.updatedAt = new Date();

    // Cancel end scheduling
    const job = this.scheduledJobs.get(`${auctionId}_end`);
    if (job) {
      clearTimeout(job);
      this.scheduledJobs.delete(`${auctionId}_end`);
    }

    this.emit('auctionPaused', { auctionId, pausedBy });
    return true;
  }

  async resumeAuction(auctionId: string, resumedBy: string): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.status !== AuctionStatus.PAUSED) {
      throw new Error('Only paused auctions can be resumed');
    }

    auction.status = AuctionStatus.ACTIVE;
    auction.updatedAt = new Date();

    // Reschedule auction end
    this.scheduleAuctionEnd(auctionId, auction.endTime);

    this.emit('auctionResumed', { auctionId, resumedBy });
    return true;
  }

  async endAuction(auctionId: string, reason: 'time' | 'manual' | 'buy_now' = 'time'): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new Error('Only active auctions can be ended');
    }

    // Determine winner
    if (auction.currentBid) {
      auction.winnerId = auction.currentBid.bidderId;
    }

    auction.status = AuctionStatus.ENDED;
    auction.updatedAt = new Date();

    // Cancel end scheduling
    const job = this.scheduledJobs.get(`${auctionId}_end`);
    if (job) {
      clearTimeout(job);
      this.scheduledJobs.delete(`${auctionId}_end`);
    }

    // Schedule settlement if auto-settlement is enabled
    if (this.config.autoSettlement) {
      this.scheduleSettlement(auctionId);
    }

    this.emit('auctionEnded', { auction, reason });
    return true;
  }

  async cancelAuction(auctionId: string, cancelledBy: string, reason?: string): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    if (auction.status === AuctionStatus.ENDED || auction.status === AuctionStatus.CANCELLED) {
      throw new Error('Cannot cancel ended or already cancelled auction');
    }

    auction.status = AuctionStatus.CANCELLED;
    auction.updatedAt = new Date();

    // Cancel all scheduled jobs
    const jobs = ['start', 'end'].map(type => this.scheduledJobs.get(`${auctionId}_${type}`));
    jobs.forEach(job => {
      if (job) clearTimeout(job);
    });
    this.scheduledJobs.delete(`${auctionId}_start`);
    this.scheduledJobs.delete(`${auctionId}_end`);

    // Process refunds if there are bids
    if (auction.totalBids > 0) {
      await this.processRefunds(auctionId);
    }

    this.emit('auctionCancelled', { auctionId, cancelledBy, reason });
    return true;
  }

  // Auction Search and Filtering
  async searchAuctions(filter: AuctionFilter): Promise<Auction[]> {
    let auctions = Array.from(this.auctions.values());

    // Apply filters
    if (filter.status && filter.status.length > 0) {
      auctions = auctions.filter(a => filter.status!.includes(a.status));
    }

    if (filter.type && filter.type.length > 0) {
      auctions = auctions.filter(a => filter.type!.includes(a.auctionType));
    }

    if (filter.category && filter.category.length > 0) {
      auctions = auctions.filter(a => filter.category!.includes(a.category));
    }

    if (filter.sellerId) {
      auctions = auctions.filter(a => a.sellerId === filter.sellerId);
    }

    if (filter.priceRange) {
      auctions = auctions.filter(a => 
        a.currentPrice >= filter.priceRange!.min && 
        a.currentPrice <= filter.priceRange!.max
      );
    }

    if (filter.dateRange) {
      auctions = auctions.filter(a => 
        a.startTime >= filter.dateRange!.start && 
        a.endTime <= filter.dateRange!.end
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      auctions = auctions.filter(a => 
        filter.tags!.some(tag => a.tags.includes(tag))
      );
    }

    if (filter.hasReserve !== undefined) {
      auctions = auctions.filter(a => 
        filter.hasReserve ? !!a.reservePrice : !a.reservePrice
      );
    }

    if (filter.hasBuyNow !== undefined) {
      auctions = auctions.filter(a => 
        filter.hasBuyNow ? !!a.buyNowPrice : !a.buyNowPrice
      );
    }

    // Sort
    if (filter.sortBy) {
      auctions.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (filter.sortBy) {
          case 'createdAt':
            aVal = a.createdAt;
            bVal = b.createdAt;
            break;
          case 'startTime':
            aVal = a.startTime;
            bVal = b.startTime;
            break;
          case 'endTime':
            aVal = a.endTime;
            bVal = b.endTime;
            break;
          case 'currentPrice':
            aVal = a.currentPrice;
            bVal = b.currentPrice;
            break;
          case 'totalBids':
            aVal = a.totalBids;
            bVal = b.totalBids;
            break;
          default:
            return 0;
        }

        if (filter.sortOrder === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    // Pagination
    if (filter.offset) {
      auctions = auctions.slice(filter.offset);
    }

    if (filter.limit) {
      auctions = auctions.slice(0, filter.limit);
    }

    return auctions;
  }

  async getUserAuctions(userId: string, status?: AuctionStatus[]): Promise<Auction[]> {
    const auctionIds = this.userAuctions.get(userId) || [];
    const auctions = auctionIds
      .map(id => this.auctions.get(id))
      .filter((a): a is Auction => a !== undefined);

    if (status && status.length > 0) {
      return auctions.filter(a => status.includes(a.status));
    }

    return auctions;
  }

  async getActiveAuctions(): Promise<Auction[]> {
    return Array.from(this.auctions.values())
      .filter(auction => auction.status === AuctionStatus.ACTIVE);
  }

  async getUpcomingAuctions(): Promise<Auction[]> {
    const now = new Date();
    return Array.from(this.auctions.values())
      .filter(auction => 
        auction.status === AuctionStatus.SCHEDULED && 
        auction.startTime > now
      );
  }

  // Auction Analytics
  async getAuctionStats(auctionId: string): Promise<{
    bidHistory: Bid[];
    priceHistory: { timestamp: Date; price: number }[];
    bidderActivity: { bidderId: string; bidCount: number; totalAmount: number }[];
    timeAnalysis: {
      averageBidInterval: number;
      peakBiddingTime: Date;
      biddingActivity: { hour: number; bidCount: number }[];
    };
  }> {
    const auction = this.auctions.get(auctionId);
    if (!auction) {
      throw new Error('Auction not found');
    }

    const bidIds = this.auctionBids.get(auctionId) || [];
    const bids = bidIds
      .map(id => this.bids.get(id))
      .filter((b): b is Bid => b !== undefined)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Price history
    const priceHistory = bids.map(bid => ({
      timestamp: bid.timestamp,
      price: bid.amount
    }));

    // Bidder activity
    const bidderMap = new Map<string, { bidCount: number; totalAmount: number }>();
    for (const bid of bids) {
      const current = bidderMap.get(bid.bidderId) || { bidCount: 0, totalAmount: 0 };
      current.bidCount++;
      current.totalAmount += bid.amount;
      bidderMap.set(bid.bidderId, current);
    }

    const bidderActivity = Array.from(bidderMap.entries()).map(([bidderId, data]) => ({
      bidderId,
      ...data
    }));

    // Time analysis
    const intervals: number[] = [];
    for (let i = 1; i < bids.length; i++) {
      intervals.push(bids[i].timestamp.getTime() - bids[i - 1].timestamp.getTime());
    }
    const averageBidInterval = intervals.length > 0 
      ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length 
      : 0;

    // Peak bidding time
    const hourCounts = new Map<number, number>();
    for (const bid of bids) {
      const hour = bid.timestamp.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const peakHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    const peakBiddingTime = new Date();
    peakBiddingTime.setHours(peakHour, 0, 0, 0);

    const biddingActivity = Array.from(hourCounts.entries())
      .map(([hour, bidCount]) => ({ hour, bidCount }))
      .sort((a, b) => a.hour - b.hour);

    return {
      bidHistory: bids,
      priceHistory,
      bidderActivity,
      timeAnalysis: {
        averageBidInterval,
        peakBiddingTime,
        biddingActivity
      }
    };
  }

  async getGlobalStats(): Promise<AuctionStats> {
    const auctions = Array.from(this.auctions.values());
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentActivity: AuctionStats['recentActivity'] = [];

    for (const auction of auctions) {
      if (auction.createdAt >= sevenDaysAgo) {
        let action: 'created' | 'started' | 'ended' | 'cancelled';
        if (auction.status === AuctionStatus.CANCELLED) {
          action = 'cancelled';
        } else if (auction.status === AuctionStatus.ENDED) {
          action = 'ended';
        } else if (auction.status === AuctionStatus.ACTIVE) {
          action = 'started';
        } else {
          action = 'created';
        }

        recentActivity.push({
          date: auction.createdAt,
          auctionId: auction.id,
          action,
          sellerId: auction.sellerId
        });
      }
    }

    const activeAuctions = auctions.filter(a => a.status === AuctionStatus.ACTIVE).length;
    const completedAuctions = auctions.filter(a => a.status === AuctionStatus.ENDED).length;
    const cancelledAuctions = auctions.filter(a => a.status === AuctionStatus.CANCELLED).length;
    const successfulAuctions = completedAuctions; // Simplified - would check if reserve was met

    const totalVolume = auctions.reduce((sum, a) => sum + a.totalVolume, 0);
    const averagePrice = completedAuctions > 0 
      ? auctions.reduce((sum, a) => sum + a.currentPrice, 0) / completedAuctions 
      : 0;
    const averageBidsPerAuction = auctions.length > 0 
      ? auctions.reduce((sum, a) => sum + a.totalBids, 0) / auctions.length 
      : 0;

    // Top categories
    const categoryMap = new Map<string, { count: number; volume: number }>();
    for (const auction of auctions) {
      const current = categoryMap.get(auction.category) || { count: 0, volume: 0 };
      current.count++;
      current.volume += auction.totalVolume;
      categoryMap.set(auction.category, current);
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    return {
      totalAuctions: auctions.length,
      activeAuctions,
      completedAuctions,
      cancelledAuctions,
      totalVolume,
      averagePrice,
      averageBidsPerAuction,
      successRate: completedAuctions > 0 ? successfulAuctions / completedAuctions : 0,
      topCategories,
      recentActivity: recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime())
    };
  }

  // Utility Methods
  private validateAuction(auction: Auction): void {
    if (!auction.title || auction.title.trim().length === 0) {
      throw new Error('Auction title is required');
    }

    if (!auction.assetId) {
      throw new Error('Asset ID is required');
    }

    if (auction.startingPrice <= 0) {
      throw new Error('Starting price must be greater than 0');
    }

    if (auction.reservePrice && auction.reservePrice < auction.startingPrice) {
      throw new Error('Reserve price cannot be less than starting price');
    }

    if (auction.buyNowPrice && auction.buyNowPrice <= auction.startingPrice) {
      throw new Error('Buy now price must be greater than starting price');
    }

    if (auction.startTime >= auction.endTime) {
      throw new Error('End time must be after start time');
    }

    const duration = (auction.endTime.getTime() - auction.startTime.getTime()) / (1000 * 60 * 60);
    if (duration > this.config.maxAuctionDuration) {
      throw new Error(`Auction duration cannot exceed ${this.config.maxAuctionDuration} hours`);
    }

    if (auction.minimumBidIncrement <= 0) {
      throw new Error('Minimum bid increment must be greater than 0');
    }
  }

  private scheduleAuctionStart(auctionId: string, startTime: Date): void {
    const delay = startTime.getTime() - Date.now();
    if (delay <= 0) return;

    const job = setTimeout(async () => {
      await this.startAuction(auctionId);
      this.scheduledJobs.delete(auctionId);
    }, delay);

    this.scheduledJobs.set(auctionId, job);
  }

  private scheduleAuctionEnd(auctionId: string, endTime: Date): void {
    const delay = endTime.getTime() - Date.now();
    if (delay <= 0) return;

    const job = setTimeout(async () => {
      await this.endAuction(auctionId, 'time');
      this.scheduledJobs.delete(`${auctionId}_end`);
    }, delay);

    this.scheduledJobs.set(`${auctionId}_end`, job);
  }

  private rescheduleAuctionStart(auctionId: string, newStartTime: Date): void {
    const existingJob = this.scheduledJobs.get(auctionId);
    if (existingJob) {
      clearTimeout(existingJob);
    }
    this.scheduleAuctionStart(auctionId, newStartTime);
  }

  private scheduleSettlement(auctionId: string): void {
    const delay = this.config.settlementDelay * 60 * 60 * 1000; // Convert hours to milliseconds
    
    setTimeout(async () => {
      await this.processSettlement(auctionId);
    }, delay);
  }

  private async processRefunds(auctionId: string): Promise<void> {
    // Placeholder for refund processing
    // In a real implementation, you would:
    // - Identify all bidders who need refunds
    // - Process blockchain transactions for refunds
    // - Update bid statuses
    // - Send notifications
    
    this.emit('refundsProcessed', { auctionId });
  }

  private async processSettlement(auctionId: string): Promise<void> {
    // Placeholder for settlement processing
    // In a real implementation, you would:
    // - Transfer asset to winner
    // - Transfer funds to seller
    // - Deduct commission
    // - Update auction status
    // - Send notifications
    
    const auction = this.auctions.get(auctionId);
    if (auction) {
      auction.settlementStatus = 'processing';
      auction.settlementCompletedAt = new Date();
      
      // Simulate settlement completion
      setTimeout(() => {
        auction.settlementStatus = 'completed';
        auction.status = AuctionStatus.SETTLED;
        this.emit('settlementCompleted', { auctionId });
      }, 5000);
    }
  }

  private generateId(): string {
    return `auc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    // Restart any scheduled auctions
    const now = new Date();
    for (const auction of this.auctions.values()) {
      if (auction.status === AuctionStatus.SCHEDULED && auction.startTime > now) {
        this.scheduleAuctionStart(auction.id, auction.startTime);
      } else if (auction.status === AuctionStatus.ACTIVE && auction.endTime > now) {
        this.scheduleAuctionEnd(auction.id, auction.endTime);
      }
    }

    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    // Clear all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      clearTimeout(job);
    }
    this.scheduledJobs.clear();

    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = await this.getGlobalStats();
    const activeAuctions = stats.activeAuctions;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (activeAuctions === 0 && stats.totalAuctions > 0) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalAuctions: stats.totalAuctions,
        activeAuctions,
        scheduledJobs: this.scheduledJobs.size,
        totalBids: this.bids.size,
        averageSettlementTime: this.config.settlementDelay
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        auctions: Array.from(this.auctions.values()),
        bids: Array.from(this.bids.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for auctions
      const headers = [
        'ID', 'Title', 'Asset ID', 'Status', 'Type', 'Starting Price',
        'Current Price', 'Seller ID', 'Start Time', 'End Time', 'Total Bids'
      ];
      
      const rows = Array.from(this.auctions.values()).map(a => [
        a.id,
        a.title,
        a.assetId,
        a.status,
        a.auctionType,
        a.startingPrice,
        a.currentPrice,
        a.sellerId,
        a.startTime.toISOString(),
        a.endTime.toISOString(),
        a.totalBids
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
