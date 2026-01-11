import { EventEmitter } from 'events';

// Enums
export enum HistoryEventType {
  BID_PLACED = 'bid_placed',
  BID_WITHDRAWN = 'bid_withdrawn',
  BID_OUTBID = 'bid_outbid',
  BID_ACCEPTED = 'bid_accepted',
  BID_REJECTED = 'bid_rejected',
  AUCTION_STARTED = 'auction_started',
  AUCTION_ENDED = 'auction_ended',
  AUCTION_CANCELLED = 'auction_cancelled',
  RESERVE_MET = 'reserve_met',
  RESERVE_NOT_MET = 'reserve_not_met',
  EXTENSION_TRIGGERED = 'extension_triggered',
  WINNER_DETERMINED = 'winner_determined'
}

export enum BidStatus {
  ACTIVE = 'active',
  WITHDRAWN = 'withdrawn',
  OUTBID = 'outbid',
  WINNING = 'winning',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted'
}

export enum SortOrder {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
}

// Interfaces
export interface BidHistoryEntry {
  id: string;
  auctionId: string;
  bidId: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  status: BidStatus;
  
  // Bid details
  isProxy: boolean;
  proxyMaxAmount?: number;
  isWinning: boolean;
  isReserveMet: boolean;
  
  // Transaction details
  transactionHash?: string;
  blockNumber?: number;
  confirmations: number;
  gasUsed?: number;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  
  // Change tracking
  previousStatus?: BidStatus;
  statusChangedAt?: Date;
  changeReason?: string;
}

export interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  auctionId: string;
  timestamp: Date;
  
  // Event data
  data: {
    bidId?: string;
    bidderId?: string;
    amount?: number;
    previousAmount?: number;
    newAmount?: number;
    winnerId?: string;
    finalPrice?: number;
    reason?: string;
    metadata?: Record<string, any>;
  };
  
  // Context
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Processing
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export interface BidHistoryFilter {
  auctionId?: string;
  bidderId?: string;
  status?: BidStatus[];
  dateRange?: { start: Date; end: Date };
  amountRange?: { min: number; max: number };
  isProxy?: boolean;
  isWinning?: boolean;
  hasTransaction?: boolean;
  sortBy?: 'timestamp' | 'amount' | 'status';
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface HistoryAnalytics {
  auctionId: string;
  period: { start: Date; end: Date };
  
  // Bid statistics
  totalBids: number;
  uniqueBidders: number;
  totalVolume: number;
  averageBid: number;
  medianBid: number;
  highestBid: number;
  lowestBid: number;
  
  // Bidder statistics
  bidderStats: {
    bidderId: string;
    bidCount: number;
    totalAmount: number;
    averageBid: number;
    firstBid: Date;
    lastBid: Date;
    winRate: number;
  }[];
  
  // Timeline data
  bidTimeline: {
    timestamp: Date;
    bidCount: number;
    totalAmount: number;
    highestBid: number;
    averageBid: number;
  }[];
  
  // Status distribution
  statusDistribution: Record<BidStatus, number>;
  
  // Geographic distribution
  geographicDistribution: {
    country: string;
    bidCount: number;
    totalAmount: number;
  }[];
}

export interface HistoryConfig {
  retentionPeriod: number; // in days
  enableCompression: boolean;
  enableEncryption: boolean;
  batchSize: number;
  enableRealTimeTracking: boolean;
  enableAnalytics: boolean;
  cacheSize: number;
  enableIndexing: boolean;
  indexFields: string[];
}

// Main Bid History Service
export class BidHistoryService extends EventEmitter {
  private history: Map<string, BidHistoryEntry> = new Map();
  private events: Map<string, HistoryEvent> = new Map();
  private auctionHistory: Map<string, string[]> = new Map(); // auctionId -> bidIds
  private bidderHistory: Map<string, string[]> = new Map(); // bidderId -> bidIds
  private config: HistoryConfig;
  private eventQueue: HistoryEvent[] = [];
  private isProcessing = false;

  constructor(config?: Partial<HistoryConfig>) {
    super();
    this.config = {
      retentionPeriod: 365,
      enableCompression: true,
      enableEncryption: false,
      batchSize: 1000,
      enableRealTimeTracking: true,
      enableAnalytics: true,
      cacheSize: 10000,
      enableIndexing: true,
      indexFields: ['auctionId', 'bidderId', 'timestamp', 'amount', 'status'],
      ...config
    };
  }

  // Bid History Management
  async recordBid(bidData: Omit<BidHistoryEntry, 'id' | 'timestamp' | 'status'>): Promise<BidHistoryEntry> {
    const bidId = this.generateId();
    const timestamp = new Date();

    const bid: BidHistoryEntry = {
      ...bidData,
      id: bidId,
      timestamp,
      status: BidStatus.ACTIVE,
      isWinning: false,
      isReserveMet: false
    };

    // Store bid
    this.history.set(bidId, bid);

    // Update indexes
    this.updateIndexes(bid);

    // Create history event
    await this.createEvent(HistoryEventType.BID_PLACED, {
      auctionId: bid.auctionId,
      bidId: bid.id,
      bidderId: bid.bidderId,
      amount: bid.amount,
      data: {
        bidId: bid.id,
        bidderId: bid.bidderId,
        amount: bid.amount,
        isProxy: bid.isProxy
      }
    });

    this.emit('bidRecorded', bid);
    return bid;
  }

  async updateBidStatus(
    bidId: string,
    newStatus: BidStatus,
    reason?: string
  ): Promise<boolean> {
    const bid = this.history.get(bidId);
    if (!bid) return false;

    const previousStatus = bid.status;
    bid.previousStatus = previousStatus;
    bid.status = newStatus;
    bid.statusChangedAt = new Date();
    bid.changeReason = reason;

    // Create appropriate event
    let eventType: HistoryEventType;
    switch (newStatus) {
      case BidStatus.WITHDRAWN:
        eventType = HistoryEventType.BID_WITHDRAWN;
        break;
      case BidStatus.OUTBID:
        eventType = HistoryEventType.BID_OUTBID;
        break;
      case BidStatus.WINNING:
        eventType = HistoryEventType.BID_ACCEPTED;
        break;
      case BidStatus.REJECTED:
        eventType = HistoryEventType.BID_REJECTED;
        break;
      default:
        return true; // No event for other status changes
    }

    await this.createEvent(eventType, {
      auctionId: bid.auctionId,
      bidId: bid.id,
      bidderId: bid.bidderId,
      data: {
        bidId: bid.id,
        bidderId: bid.bidderId,
        amount: bid.amount,
        previousStatus,
        newStatus,
        reason
      }
    });

    this.emit('bidStatusUpdated', { bid, previousStatus, newStatus, reason });
    return true;
  }

  async recordBidTransaction(
    bidId: string,
    transactionData: {
      hash: string;
      blockNumber: number;
      confirmations: number;
      gasUsed?: number;
    }
  ): Promise<boolean> {
    const bid = this.history.get(bidId);
    if (!bid) return false;

    bid.transactionHash = transactionData.hash;
    bid.blockNumber = transactionData.blockNumber;
    bid.confirmations = transactionData.confirmations;
    bid.gasUsed = transactionData.gasUsed;

    this.emit('bidTransactionRecorded', { bid, transactionData });
    return true;
  }

  // History Retrieval
  async getBidHistory(filter: BidHistoryFilter): Promise<BidHistoryEntry[]> {
    let bids = Array.from(this.history.values());

    // Apply filters
    if (filter.auctionId) {
      bids = bids.filter(bid => bid.auctionId === filter.auctionId);
    }

    if (filter.bidderId) {
      bids = bids.filter(bid => bid.bidderId === filter.bidderId);
    }

    if (filter.status && filter.status.length > 0) {
      bids = bids.filter(bid => filter.status!.includes(bid.status));
    }

    if (filter.dateRange) {
      bids = bids.filter(bid => 
        bid.timestamp >= filter.dateRange!.start && 
        bid.timestamp <= filter.dateRange!.end
      );
    }

    if (filter.amountRange) {
      bids = bids.filter(bid => 
        bid.amount >= filter.amountRange!.min && 
        bid.amount <= filter.amountRange!.max
      );
    }

    if (filter.isProxy !== undefined) {
      bids = bids.filter(bid => bid.isProxy === filter.isProxy);
    }

    if (filter.isWinning !== undefined) {
      bids = bids.filter(bid => bid.isWinning === filter.isWinning);
    }

    if (filter.hasTransaction !== undefined) {
      bids = bids.filter(bid => !!bid.transactionHash === filter.hasTransaction);
    }

    // Sort
    if (filter.sortBy) {
      bids.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (filter.sortBy) {
          case 'timestamp':
            aVal = a.timestamp;
            bVal = b.timestamp;
            break;
          case 'amount':
            aVal = a.amount;
            bVal = b.amount;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          default:
            return 0;
        }

        if (filter.sortOrder === SortOrder.DESCENDING) {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    // Pagination
    if (filter.offset) {
      bids = bids.slice(filter.offset);
    }

    if (filter.limit) {
      bids = bids.slice(0, filter.limit);
    }

    return bids;
  }

  async getAuctionBidHistory(auctionId: string, limit = 100): Promise<BidHistoryEntry[]> {
    return this.getBidHistory({
      auctionId,
      sortBy: 'timestamp',
      sortOrder: SortOrder.DESCENDING,
      limit
    });
  }

  async getBidderHistory(bidderId: string, limit = 100): Promise<BidHistoryEntry[]> {
    return this.getBidHistory({
      bidderId,
      sortBy: 'timestamp',
      sortOrder: SortOrder.DESCENDING,
      limit
    });
  }

  async getBid(bidId: string): Promise<BidHistoryEntry | null> {
    return this.history.get(bidId) || null;
  }

  // Event Management
  async createEvent(
    type: HistoryEventType,
    data: {
      auctionId: string;
      bidId?: string;
      bidderId?: string;
      amount?: number;
      data?: Record<string, any>;
    }
  ): Promise<HistoryEvent> {
    const eventId = this.generateId();
    
    const event: HistoryEvent = {
      id: eventId,
      type,
      auctionId: data.auctionId,
      timestamp: new Date(),
      data: data.data || {},
      processed: false
    };

    this.events.set(eventId, event);
    this.eventQueue.push(event);

    if (this.config.enableRealTimeTracking) {
      this.processEventQueue();
    }

    this.emit('eventCreated', event);
    return event;
  }

  async getEvents(filter: {
    auctionId?: string;
    type?: HistoryEventType;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  } = {}): Promise<HistoryEvent[]> {
    let events = Array.from(this.events.values());

    if (filter.auctionId) {
      events = events.filter(event => event.auctionId === filter.auctionId);
    }

    if (filter.type) {
      events = events.filter(event => event.type === filter.type);
    }

    if (filter.dateRange) {
      events = events.filter(event => 
        event.timestamp >= filter.dateRange!.start && 
        event.timestamp <= filter.dateRange!.end
      );
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, filter.limit || 100);
  }

  // Analytics
  async getHistoryAnalytics(
    auctionId: string,
    period?: { start: Date; end: Date }
  ): Promise<HistoryAnalytics> {
    const bids = await this.getBidHistory({
      auctionId,
      dateRange: period
    });

    if (bids.length === 0) {
      throw new Error('No bid history found for analytics');
    }

    // Basic statistics
    const totalBids = bids.length;
    const uniqueBidders = new Set(bids.map(b => b.bidderId)).size;
    const totalVolume = bids.reduce((sum, b) => sum + b.amount, 0);
    const averageBid = totalVolume / totalBids;
    const sortedBids = bids.map(b => b.amount).sort((a, b) => a - b);
    const medianBid = sortedBids[Math.floor(sortedBids.length / 2)];
    const highestBid = Math.max(...bids.map(b => b.amount));
    const lowestBid = Math.min(...bids.map(b => b.amount));

    // Bidder statistics
    const bidderMap = new Map<string, HistoryAnalytics['bidderStats'][0]>();
    for (const bid of bids) {
      const existing = bidderMap.get(bid.bidderId) || {
        bidderId: bid.bidderId,
        bidCount: 0,
        totalAmount: 0,
        averageBid: 0,
        firstBid: bid.timestamp,
        lastBid: bid.timestamp,
        winRate: 0
      };
      
      existing.bidCount++;
      existing.totalAmount += bid.amount;
      existing.averageBid = existing.totalAmount / existing.bidCount;
      existing.lastBid = bid.timestamp;
      
      if (bid.timestamp < existing.firstBid) {
        existing.firstBid = bid.timestamp;
      }
      
      bidderMap.set(bid.bidderId, existing);
    }

    const bidderStats = Array.from(bidderMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Timeline data
    const timelineMap = new Map<string, HistoryAnalytics['bidTimeline'][0]>();
    for (const bid of bids) {
      const timeKey = bid.timestamp.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
      const existing = timelineMap.get(timeKey) || {
        timestamp: bid.timestamp,
        bidCount: 0,
        totalAmount: 0,
        highestBid: bid.amount,
        averageBid: 0
      };
      
      existing.bidCount++;
      existing.totalAmount += bid.amount;
      existing.averageBid = existing.totalAmount / existing.bidCount;
      existing.highestBid = Math.max(existing.highestBid, bid.amount);
      
      timelineMap.set(timeKey, existing);
    }

    const bidTimeline = Array.from(timelineMap.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Status distribution
    const statusDistribution: Record<BidStatus, number> = {
      [BidStatus.ACTIVE]: 0,
      [BidStatus.WITHDRAWN]: 0,
      [BidStatus.OUTBID]: 0,
      [BidStatus.WINNING]: 0,
      [BidStatus.REJECTED]: 0,
      [BidStatus.ACCEPTED]: 0
    };

    for (const bid of bids) {
      statusDistribution[bid.status]++;
    }

    // Geographic distribution (placeholder)
    const geographicDistribution: HistoryAnalytics['geographicDistribution'] = [];

    return {
      auctionId,
      period: period || { start: bids[0].timestamp, end: bids[bids.length - 1].timestamp },
      totalBids,
      uniqueBidders,
      totalVolume,
      averageBid,
      medianBid,
      highestBid,
      lowestBid,
      bidderStats,
      bidTimeline,
      statusDistribution,
      geographicDistribution
    };
  }

  // Private Methods
  private updateIndexes(bid: BidHistoryEntry): void {
    // Auction index
    const auctionBids = this.auctionHistory.get(bid.auctionId) || [];
    auctionBids.push(bid.id);
    this.auctionHistory.set(bid.auctionId, auctionBids);

    // Bidder index
    const bidderBids = this.bidderHistory.get(bid.bidderId) || [];
    bidderBids.push(bid.id);
    this.bidderHistory.set(bid.bidderId, bidderBids);
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.eventQueue.splice(0, this.config.batchSize);

    try {
      for (const event of batch) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.emit('eventProcessingError', error);
    } finally {
      this.isProcessing = false;
      
      // Continue processing if more events
      if (this.eventQueue.length > 0) {
        setTimeout(() => this.processEventQueue(), 100);
      }
    }
  }

  private async processEvent(event: HistoryEvent): Promise<void> {
    try {
      // Process event based on type
      switch (event.type) {
        case HistoryEventType.BID_PLACED:
          await this.processBidPlacedEvent(event);
          break;
        case HistoryEventType.BID_OUTBID:
          await this.processBidOutbidEvent(event);
          break;
        case HistoryEventType.AUCTION_ENDED:
          await this.processAuctionEndedEvent(event);
          break;
        // Add other event types as needed
      }

      event.processed = true;
      event.processedAt = new Date();

    } catch (error) {
      event.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('eventError', { event, error });
    }
  }

  private async processBidPlacedEvent(event: HistoryEvent): Promise<void> {
    // Update winning status for previous bids
    const auctionBids = await this.getAuctionBidHistory(event.auctionId);
    const newBidAmount = event.data.amount;

    for (const bid of auctionBids) {
      if (bid.amount < newBidAmount && bid.status === BidStatus.ACTIVE) {
        await this.updateBidStatus(bid.id, BidStatus.OUTBID, 'Outbid by higher bid');
      }
    }

    // Set new bid as winning
    if (event.data.bidId) {
      await this.updateBidStatus(event.data.bidId, BidStatus.WINNING, 'Highest bid');
    }
  }

  private async processBidOutbidEvent(event: HistoryEvent): Promise<void> {
    // Already handled in bid placed event
  }

  private async processAuctionEndedEvent(event: HistoryEvent): Promise<void> {
    // Mark final winning bid
    const auctionBids = await this.getAuctionBidHistory(event.auctionId);
    const highestBid = auctionBids.reduce((highest, bid) => 
      bid.amount > highest.amount ? bid : highest, auctionBids[0]
    );

    if (highestBid) {
      await this.updateBidStatus(highestBid.id, BidStatus.ACCEPTED, 'Auction ended - winner');
    }
  }

  private generateId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.isProcessing = false;
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.isProcessing = false;
    this.eventQueue.length = 0; // Clear queue
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalBids = this.history.size;
    const totalEvents = this.events.size;
    const queueLength = this.eventQueue.length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (queueLength > 1000) {
      status = 'unhealthy';
    } else if (queueLength > 500) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalBids,
        totalEvents,
        queueLength,
        isProcessing: this.isProcessing,
        realTimeTrackingEnabled: this.config.enableRealTimeTracking
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        history: Array.from(this.history.values()),
        events: Array.from(this.events.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for bid history
      const headers = [
        'ID', 'Auction ID', 'Bid ID', 'Bidder ID', 'Amount', 'Timestamp',
        'Status', 'Is Proxy', 'Is Winning', 'Transaction Hash', 'Block Number'
      ];
      
      const rows = Array.from(this.history.values()).map(b => [
        b.id,
        b.auctionId,
        b.bidId,
        b.bidderId,
        b.amount,
        b.timestamp.toISOString(),
        b.status,
        b.isProxy,
        b.isWinning,
        b.transactionHash || '',
        b.blockNumber || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
