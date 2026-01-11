import { EventEmitter } from 'events';
import { BidHistoryEntry, BidStatus } from './bidHistory';

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

export enum AggregationMetric {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  MEDIAN = 'median',
  MIN = 'min',
  MAX = 'max',
  STD_DEV = 'std_dev',
  PERCENTILE = 'percentile'
}

export enum AggregationDimension {
  TIME = 'time',
  BIDDER = 'bidder',
  AUCTION = 'auction',
  CATEGORY = 'category',
  PRICE_RANGE = 'price_range',
  GEOGRAPHIC = 'geographic'
}

// Interfaces
export interface BidAggregation {
  id: string;
  type: AggregationType;
  period: AggregationPeriod;
  startTime: Date;
  endTime: Date;
  
  // Dimensions
  dimensions: {
    primary: AggregationDimension;
    secondary?: AggregationDimension;
  };
  
  // Metrics
  metrics: {
    [key: string]: {
      [AggregationMetric.COUNT]: number;
      [AggregationMetric.SUM]: number;
      [AggregationMetric.AVERAGE]: number;
      [AggregationMetric.MEDIAN]: number;
      [AggregationMetric.MIN]: number;
      [AggregationMetric.MAX]: number;
      [AggregationMetric.STD_DEV]: number;
    };
  };
  
  // Data points
  dataPoints: AggregationDataPoint[];
  
  // Metadata
  filters: AggregationFilter[];
  createdAt: Date;
  processedAt: Date;
  metadata: Record<string, any>;
}

export interface AggregationDataPoint {
  dimension: string;
  timestamp: Date;
  metrics: {
    [AggregationMetric.COUNT]: number;
    [AggregationMetric.SUM]: number;
    [AggregationMetric.AVERAGE]: number;
    [AggregationMetric.MEDIAN]: number;
    [AggregationMetric.MIN]: number;
    [AggregationMetric.MAX]: number;
    [AggregationMetric.STD_DEV]: number;
  };
  breakdown?: Record<string, number>;
}

export interface AggregationFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  description?: string;
}

export interface AggregationConfig {
  enableRealTimeAggregation: boolean;
  aggregationInterval: number; // in seconds
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // in milliseconds
  enableCaching: boolean;
  cacheTTL: number; // in seconds
  enableCompression: boolean;
  retentionPeriod: number; // in days
  maxDataPoints: number;
  enablePercentiles: boolean;
  percentileValues: number[]; // [50, 75, 90, 95, 99]
}

export interface AggregationRequest {
  id: string;
  type: AggregationType;
  period: AggregationPeriod;
  startTime: Date;
  endTime: Date;
  dimensions: {
    primary: AggregationDimension;
    secondary?: AggregationDimension;
  };
  metrics: AggregationMetric[];
  filters: AggregationFilter[];
  options: {
    includeBreakdown?: boolean;
    includePercentiles?: boolean;
    includeTrends?: boolean;
    maxDataPoints?: number;
  };
  requestedBy: string;
  createdAt: Date;
}

export interface AggregationResult {
  id: string;
  requestId: string;
  aggregation: BidAggregation;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processingTime: number;
  createdAt: Date;
  completedAt?: Date;
}

// Main Enhanced Bid Aggregation Service
export class BidAggregationEnhancedService extends EventEmitter {
  private aggregations: Map<string, BidAggregation> = new Map();
  private requests: Map<string, AggregationRequest> = new Map();
  private results: Map<string, AggregationResult> = new Map();
  private config: AggregationConfig;
  private aggregationQueue: AggregationRequest[] = [];
  private isProcessing = false;
  private aggregationTimer?: NodeJS.Timeout;

  constructor(config?: Partial<AggregationConfig>) {
    super();
    this.config = {
      enableRealTimeAggregation: true,
      aggregationInterval: 60,
      batchSize: 1000,
      maxRetries: 3,
      retryDelay: 5000,
      enableCaching: true,
      cacheTTL: 300,
      enableCompression: true,
      retentionPeriod: 90,
      maxDataPoints: 10000,
      enablePercentiles: true,
      percentileValues: [50, 75, 90, 95, 99],
      ...config
    };
  }

  // Aggregation Request Management
  async requestAggregation(request: Omit<AggregationRequest, 'id' | 'createdAt'>): Promise<AggregationResult> {
    const requestId = this.generateId();
    
    const fullRequest: AggregationRequest = {
      ...request,
      id: requestId,
      createdAt: new Date()
    };

    this.requests.set(requestId, fullRequest);
    this.aggregationQueue.push(fullRequest);

    const result: AggregationResult = {
      id: this.generateId(),
      requestId,
      aggregation: {} as BidAggregation,
      status: 'pending',
      processingTime: 0,
      createdAt: new Date()
    };

    this.results.set(result.id, result);

    // Process queue
    this.processAggregationQueue();

    this.emit('aggregationRequested', { request: fullRequest, result });
    return result;
  }

  async getAggregation(aggregationId: string): Promise<BidAggregation | null> {
    return this.aggregations.get(aggregationId) || null;
  }

  async getAggregationResult(resultId: string): Promise<AggregationResult | null> {
    return this.results.get(resultId) || null;
  }

  async getAggregations(filter: {
    type?: AggregationType;
    period?: AggregationPeriod;
    dimension?: AggregationDimension;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  } = {}): Promise<BidAggregation[]> {
    let aggregations = Array.from(this.aggregations.values());

    if (filter.type) {
      aggregations = aggregations.filter(a => a.type === filter.type);
    }

    if (filter.period) {
      aggregations = aggregations.filter(a => a.period === filter.period);
    }

    if (filter.dimension) {
      aggregations = aggregations.filter(a => a.dimensions.primary === filter.dimension);
    }

    if (filter.dateRange) {
      aggregations = aggregations.filter(a => 
        a.startTime >= filter.dateRange!.start && 
        a.endTime <= filter.dateRange!.end
      );
    }

    return aggregations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, filter.limit || 100);
  }

  // Real-time Aggregation
  async createRealTimeAggregation(
    dimension: AggregationDimension,
    period: AggregationPeriod = AggregationPeriod.MINUTE
  ): Promise<BidAggregation> {
    const aggregationId = this.generateId();
    const now = new Date();
    const endTime = new Date(now.getTime() + this.getPeriodMs(period));

    const aggregation: BidAggregation = {
      id: aggregationId,
      type: AggregationType.REAL_TIME,
      period,
      startTime: now,
      endTime,
      dimensions: { primary: dimension },
      metrics: {},
      dataPoints: [],
      filters: [],
      createdAt: now,
      processedAt: now,
      metadata: { realTime: true }
    };

    this.aggregations.set(aggregationId, aggregation);
    this.emit('realTimeAggregationCreated', aggregation);
    return aggregation;
  }

  async updateRealTimeAggregation(
    aggregationId: string,
    bidData: BidHistoryEntry[]
  ): Promise<boolean> {
    const aggregation = this.aggregations.get(aggregationId);
    if (!aggregation || aggregation.type !== AggregationType.REAL_TIME) {
      return false;
    }

    // Process new bid data
    const newDataPoint = this.processBidData(bidData, aggregation.dimensions);
    
    // Add to data points
    aggregation.dataPoints.push(newDataPoint);
    
    // Limit data points
    if (aggregation.dataPoints.length > this.config.maxDataPoints) {
      aggregation.dataPoints = aggregation.dataPoints.slice(-this.config.maxDataPoints);
    }

    // Update metrics
    aggregation.metrics = this.calculateMetrics(aggregation.dataPoints);
    aggregation.processedAt = new Date();

    this.emit('realTimeAggregationUpdated', aggregation);
    return true;
  }

  // Batch Aggregation
  async createBatchAggregation(request: AggregationRequest): Promise<BidAggregation> {
    const aggregationId = this.generateId();
    
    const aggregation: BidAggregation = {
      id: aggregationId,
      type: AggregationType.BATCH,
      period: request.period,
      startTime: request.startTime,
      endTime: request.endTime,
      dimensions: request.dimensions,
      metrics: {},
      dataPoints: [],
      filters: request.filters,
      createdAt: new Date(),
      processedAt: new Date(),
      metadata: {
        requestId: request.id,
        metrics: request.metrics,
        options: request.options
      }
    };

    // Fetch bid data for the period
    const bidData = await this.fetchBidData(request);
    
    // Process data
    const dataPoints = this.processBatchData(bidData, request);
    aggregation.dataPoints = dataPoints;
    
    // Calculate metrics
    aggregation.metrics = this.calculateMetrics(dataPoints, request.metrics);
    aggregation.processedAt = new Date();

    this.aggregations.set(aggregationId, aggregation);
    this.emit('batchAggregationCreated', aggregation);
    return aggregation;
  }

  // Advanced Analytics
  async getBidderAggregation(
    bidderId: string,
    period: AggregationPeriod,
    dateRange: { start: Date; end: Date }
  ): Promise<BidAggregation> {
    const request: AggregationRequest = {
      id: this.generateId(),
      type: AggregationType.ON_DEMAND,
      period,
      startTime: dateRange.start,
      endTime: dateRange.end,
      dimensions: { primary: AggregationDimension.BIDDER },
      metrics: [
        AggregationMetric.COUNT,
        AggregationMetric.SUM,
        AggregationMetric.AVERAGE,
        AggregationMetric.MAX
      ],
      filters: [
        {
          field: 'bidderId',
          operator: 'equals',
          value: bidderId
        }
      ],
      options: { includeBreakdown: true },
      requestedBy: 'system',
      createdAt: new Date()
    };

    return this.createBatchAggregation(request);
  }

  async getAuctionAggregation(
    auctionId: string,
    period: AggregationPeriod,
    dateRange: { start: Date; end: Date }
  ): Promise<BidAggregation> {
    const request: AggregationRequest = {
      id: this.generateId(),
      type: AggregationType.ON_DEMAND,
      period,
      startTime: dateRange.start,
      endTime: dateRange.end,
      dimensions: { primary: AggregationDimension.AUCTION },
      metrics: [
        AggregationMetric.COUNT,
        AggregationMetric.SUM,
        AggregationMetric.AVERAGE,
        AggregationMetric.MEDIAN,
        AggregationMetric.MAX,
        AggregationMetric.MIN
      ],
      filters: [
        {
          field: 'auctionId',
          operator: 'equals',
          value: auctionId
        }
      ],
      options: { 
        includeBreakdown: true,
        includePercentiles: this.config.enablePercentiles
      },
      requestedBy: 'system',
      createdAt: new Date()
    };

    return this.createBatchAggregation(request);
  }

  async getTimeSeriesAggregation(
    dimension: AggregationDimension,
    period: AggregationPeriod,
    dateRange: { start: Date; end: Date },
    filters: AggregationFilter[] = []
  ): Promise<BidAggregation> {
    const request: AggregationRequest = {
      id: this.generateId(),
      type: AggregationType.ON_DEMAND,
      period,
      startTime: dateRange.start,
      endTime: dateRange.end,
      dimensions: { primary: AggregationDimension.TIME, secondary: dimension },
      metrics: [
        AggregationMetric.COUNT,
        AggregationMetric.SUM,
        AggregationMetric.AVERAGE,
        AggregationMetric.MAX
      ],
      filters,
      options: { 
        includeBreakdown: true,
        includeTrends: true,
        maxDataPoints: 1000
      },
      requestedBy: 'system',
      createdAt: new Date()
    };

    return this.createBatchAggregation(request);
  }

  // Private Methods
  private async processAggregationQueue(): Promise<void> {
    if (this.isProcessing || this.aggregationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batch = this.aggregationQueue.splice(0, this.config.batchSize);

    try {
      for (const request of batch) {
        await this.processAggregationRequest(request);
      }
    } catch (error) {
      this.emit('aggregationError', error);
    } finally {
      this.isProcessing = false;
      
      // Continue processing if more requests
      if (this.aggregationQueue.length > 0) {
        setTimeout(() => this.processAggregationQueue(), 100);
      }
    }
  }

  private async processAggregationRequest(request: AggregationRequest): Promise<void> {
    const result = this.results.values().find(r => r.requestId === request.id);
    if (!result) return;

    try {
      result.status = 'processing';
      const startTime = Date.now();

      const aggregation = await this.createBatchAggregation(request);
      
      result.aggregation = aggregation;
      result.status = 'completed';
      result.processingTime = Date.now() - startTime;
      result.completedAt = new Date();

      this.emit('aggregationCompleted', { request, result, aggregation });

    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('aggregationFailed', { request, result, error });
    }
  }

  private async fetchBidData(request: AggregationRequest): Promise<BidHistoryEntry[]> {
    // Placeholder - would fetch from bid history service
    // Apply filters and date range
    return [];
  }

  private processBidData(
    bidData: BidHistoryEntry[],
    dimensions: BidAggregation['dimensions']
  ): AggregationDataPoint {
    const amounts = bidData.map(b => b.amount);
    
    const metrics = {
      [AggregationMetric.COUNT]: bidData.length,
      [AggregationMetric.SUM]: amounts.reduce((sum, a) => sum + a, 0),
      [AggregationMetric.AVERAGE]: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
      [AggregationMetric.MEDIAN]: this.calculateMedian(amounts),
      [AggregationMetric.MIN]: Math.min(...amounts),
      [AggregationMetric.MAX]: Math.max(...amounts),
      [AggregationMetric.STD_DEV]: this.calculateStandardDeviation(amounts)
    };

    let dimension = '';
    let breakdown: Record<string, number> | undefined;

    switch (dimensions.primary) {
      case AggregationDimension.TIME:
        dimension = new Date().toISOString();
        break;
      case AggregationDimension.BIDDER:
        const bidderCounts = new Map<string, number>();
        for (const bid of bidData) {
          bidderCounts.set(bid.bidderId, (bidderCounts.get(bid.bidderId) || 0) + 1);
        }
        dimension = 'bidders';
        breakdown = Object.fromEntries(bidderCounts);
        break;
      case AggregationDimension.AUCTION:
        const auctionCounts = new Map<string, number>();
        for (const bid of bidData) {
          auctionCounts.set(bid.auctionId, (auctionCounts.get(bid.auctionId) || 0) + 1);
        }
        dimension = 'auctions';
        breakdown = Object.fromEntries(auctionCounts);
        break;
      default:
        dimension = 'unknown';
    }

    return {
      dimension,
      timestamp: new Date(),
      metrics,
      breakdown
    };
  }

  private processBatchData(
    bidData: BidHistoryEntry[],
    request: AggregationRequest
  ): AggregationDataPoint[] {
    const dataPoints: AggregationDataPoint[] = [];
    const periodMs = this.getPeriodMs(request.period);
    
    // Group by time periods
    const timeGroups = new Map<string, BidHistoryEntry[]>();
    
    for (const bid of bidData) {
      const timeKey = this.getTimeKey(bid.timestamp, request.period);
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey)!.push(bid);
    }

    // Process each time group
    for (const [timeKey, groupBids] of timeGroups) {
      const dataPoint = this.processBidData(groupBids, request.dimensions);
      dataPoint.dimension = timeKey;
      dataPoints.push(dataPoint);
    }

    return dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateMetrics(
    dataPoints: AggregationDataPoint[],
    requestedMetrics?: AggregationMetric[]
  ): BidAggregation['metrics'] {
    const metrics: BidAggregation['metrics'] = {};

    // Aggregate across all data points
    const allCounts = dataPoints.map(dp => dp.metrics[AggregationMetric.COUNT]);
    const allSums = dataPoints.map(dp => dp.metrics[AggregationMetric.SUM]);
    const allAverages = dataPoints.map(dp => dp.metrics[AggregationMetric.AVERAGE]);
    const allMedians = dataPoints.map(dp => dp.metrics[AggregationMetric.MEDIAN]);
    const allMins = dataPoints.map(dp => dp.metrics[AggregationMetric.MIN]);
    const allMaxs = dataPoints.map(dp => dp.metrics[AggregationMetric.MAX]);
    const allStdDevs = dataPoints.map(dp => dp.metrics[AggregationMetric.STD_DEV]);

    metrics.total = {
      [AggregationMetric.COUNT]: allCounts.reduce((sum, c) => sum + c, 0),
      [AggregationMetric.SUM]: allSums.reduce((sum, s) => sum + s, 0),
      [AggregationMetric.AVERAGE]: allAverages.reduce((sum, a) => sum + a, 0) / allAverages.length,
      [AggregationMetric.MEDIAN]: this.calculateMedian(allMedians),
      [AggregationMetric.MIN]: Math.min(...allMins),
      [AggregationMetric.MAX]: Math.max(...allMaxs),
      [AggregationMetric.STD_DEV]: this.calculateStandardDeviation(allStdDevs)
    };

    // Add percentiles if enabled
    if (this.config.enablePercentiles) {
      for (const percentile of this.config.percentileValues) {
        metrics[`percentile_${percentile}`] = {
          [AggregationMetric.COUNT]: 0,
          [AggregationMetric.SUM]: 0,
          [AggregationMetric.AVERAGE]: 0,
          [AggregationMetric.MEDIAN]: 0,
          [AggregationMetric.MIN]: 0,
          [AggregationMetric.MAX]: 0,
          [AggregationMetric.STD_DEV]: 0
        };
      }
    }

    return metrics;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private getPeriodMs(period: AggregationPeriod): number {
    switch (period) {
      case AggregationPeriod.MINUTE: return 60 * 1000;
      case AggregationPeriod.HOUR: return 60 * 60 * 1000;
      case AggregationPeriod.DAY: return 24 * 60 * 60 * 1000;
      case AggregationPeriod.WEEK: return 7 * 24 * 60 * 60 * 1000;
      case AggregationPeriod.MONTH: return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
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
        return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
      case AggregationPeriod.MONTH:
        return `${date.getFullYear()}-${date.getMonth()}`;
      default:
        return date.toISOString();
    }
  }

  private generateId(): string {
    return `agg_enh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    if (this.config.enableRealTimeAggregation) {
      this.aggregationTimer = setInterval(async () => {
        await this.processAggregationQueue();
      }, this.config.aggregationInterval * 1000);
    }

    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = undefined;
    }

    this.isProcessing = false;
    this.aggregationQueue.length = 0;
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalAggregations = this.aggregations.size;
    const queueLength = this.aggregationQueue.length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (queueLength > 100) {
      status = 'unhealthy';
    } else if (queueLength > 50) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalAggregations,
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
        requests: Array.from(this.requests.values()),
        results: Array.from(this.results.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for aggregations
      const headers = [
        'ID', 'Type', 'Period', 'Start Time', 'End Time',
        'Primary Dimension', 'Data Points', 'Created At'
      ];
      
      const rows = Array.from(this.aggregations.values()).map(a => [
        a.id,
        a.type,
        a.period,
        a.startTime.toISOString(),
        a.endTime.toISOString(),
        a.dimensions.primary,
        a.dataPoints.length,
        a.createdAt.toISOString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
