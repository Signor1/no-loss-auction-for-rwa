import { EventEmitter } from 'events';
import { Auction, AuctionStatus, AuctionType, Bid } from './auctionService';

// Enums
export enum MetricType {
  REVENUE = 'revenue',
  VOLUME = 'volume',
  PARTICIPATION = 'participation',
  SUCCESS_RATE = 'success_rate',
  AVERAGE_PRICE = 'average_price',
  BID_FREQUENCY = 'bid_frequency',
  TIME_TO_SALE = 'time_to_sale',
  USER_RETENTION = 'user_retention',
  MARKET_SHARE = 'market_share'
}

export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export enum ReportType {
  PERFORMANCE = 'performance',
  USER_BEHAVIOR = 'user_behavior',
  MARKET_TRENDS = 'market_trends',
  REVENUE_ANALYSIS = 'revenue_analysis',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
  PREDICTIVE_ANALYTICS = 'predictive_analytics'
}

export enum VisualizationType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  HEATMAP = 'heatmap',
  SCATTER_PLOT = 'scatter_plot',
  HISTOGRAM = 'histogram',
  TABLE = 'table'
}

// Interfaces
export interface AnalyticsMetric {
  id: string;
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  change: number;
  changePercent: number;
  timestamp: Date;
  granularity: TimeGranularity;
  metadata: Record<string, any>;
}

export interface AnalyticsReport {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
    granularity: TimeGranularity;
  };
  
  // Report data
  metrics: AnalyticsMetric[];
  insights: AnalyticsInsight[];
  visualizations: AnalyticsVisualization[];
  recommendations: string[];
  
  // Filters applied
  filters: {
    auctionTypes?: AuctionType[];
    categories?: string[];
    priceRange?: { min: number; max: number };
    status?: AuctionStatus[];
    sellerIds?: string[];
  };
  
  // Metadata
  generatedBy: string;
  format: 'json' | 'pdf' | 'csv' | 'excel';
  shareable: boolean;
  public: boolean;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'correlation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  data: {
    metric: string;
    value: number;
    comparison: number;
    trend: 'up' | 'down' | 'stable';
  };
  recommendations: string[];
  timestamp: Date;
}

export interface AnalyticsVisualization {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }[];
  };
  config: {
    responsive: boolean;
    legend: boolean;
    animation: boolean;
    customOptions?: Record<string, any>;
  };
  metadata: Record<string, any>;
}

export interface UserBehaviorAnalytics {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Bidding behavior
  totalBids: number;
  totalAmount: number;
  averageBid: number;
  winningBids: number;
  winRate: number;
  bidFrequency: number;
  
  // Auction participation
  auctionsParticipated: number;
  auctionsWon: number;
  uniqueCategories: number;
  favoriteCategories: string[];
  
  // Temporal patterns
  biddingByHour: { hour: number; bidCount: number }[];
  biddingByDay: { day: string; bidCount: number }[];
  averageTimeToBid: number;
  
  // Financial metrics
  totalSpent: number;
  averageSpentPerAuction: number;
  budgetUtilization: number;
  
  // Engagement metrics
  sessionDuration: number;
  pageViews: number;
  watchlistAdds: number;
  searchQueries: number;
}

export interface MarketTrendAnalytics {
  period: {
    start: Date;
    end: Date;
    granularity: TimeGranularity;
  };
  
  // Price trends
  priceTrends: {
    category: string;
    averagePrice: number;
    priceChange: number;
    priceChangePercent: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  
  // Volume trends
  volumeTrends: {
    category: string;
    totalVolume: number;
    volumeChange: number;
    volumeChangePercent: number;
  }[];
  
  // Market health
  marketHealth: {
    totalAuctions: number;
    successRate: number;
    averageTimeToSale: number;
    marketLiquidity: number;
    priceVolatility: number;
  };
  
  // Category performance
  categoryPerformance: {
    category: string;
    auctionCount: number;
    totalRevenue: number;
    averagePrice: number;
    successRate: number;
    growth: number;
  }[];
  
  // Predictions
  predictions: {
    category: string;
    predictedPrice: number;
    predictedVolume: number;
    confidence: number;
    timeframe: string;
  }[];
}

export interface RevenueAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  
  // Revenue metrics
  totalRevenue: number;
  grossRevenue: number;
  netRevenue: number;
  commissionRevenue: number;
  feeRevenue: number;
  
  // Revenue breakdown
  revenueByCategory: {
    category: string;
    revenue: number;
    percentage: number;
    growth: number;
  }[];
  
  revenueByType: {
    type: 'commission' | 'listing_fee' | 'premium_feature' | 'other';
    revenue: number;
    percentage: number;
  }[];
  
  // Revenue trends
  revenueTrends: {
    date: Date;
    revenue: number;
    change: number;
    changePercent: number;
  }[];
  
  // Revenue metrics
  averageRevenuePerAuction: number;
  revenuePerUser: number;
  revenueGrowthRate: number;
  profitMargin: number;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'price_prediction' | 'success_probability' | 'user_behavior' | 'market_trend';
  version: string;
  accuracy: number;
  lastTrained: Date;
  trainingDataPeriod: {
    start: Date;
    end: Date;
  };
  features: string[];
  metadata: Record<string, any>;
}

export interface PredictionResult {
  modelId: string;
  predictionType: string;
  input: Record<string, any>;
  output: {
    value: number;
    confidence: number;
    range: { min: number; max: number };
    factors: {
      feature: string;
      importance: number;
      value: number;
    }[];
  };
  generatedAt: Date;
  expiresAt: Date;
}

// Main Auction Analytics Service
export class AuctionAnalyticsService extends EventEmitter {
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private reports: Map<string, AnalyticsReport> = new Map();
  private insights: Map<string, AnalyticsInsight> = new Map();
  private visualizations: Map<string, AnalyticsVisualization> = new Map();
  private models: Map<string, PredictiveModel> = new Map();
  private predictions: Map<string, PredictionResult> = new Map();

  constructor() {
    super();
    this.initializeDefaultModels();
  }

  // Metrics Management
  async createMetric(
    name: string,
    type: MetricType,
    value: number,
    unit: string,
    granularity: TimeGranularity,
    metadata: Record<string, any> = {}
  ): Promise<AnalyticsMetric> {
    const metricId = this.generateId();
    
    // Calculate change from previous metric
    const previousMetric = await this.getPreviousMetric(type, granularity);
    const change = previousMetric ? value - previousMetric.value : 0;
    const changePercent = previousMetric ? (change / previousMetric.value) * 100 : 0;

    const metric: AnalyticsMetric = {
      id: metricId,
      name,
      type,
      value,
      unit,
      change,
      changePercent,
      timestamp: new Date(),
      granularity,
      metadata
    };

    this.metrics.set(metricId, metric);
    this.emit('metricCreated', metric);
    return metric;
  }

  async getMetric(metricId: string): Promise<AnalyticsMetric | null> {
    return this.metrics.get(metricId) || null;
  }

  async getMetricsByType(
    type: MetricType,
    granularity?: TimeGranularity,
    timeRange?: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    let metrics = Array.from(this.metrics.values())
      .filter(metric => metric.type === type);

    if (granularity) {
      metrics = metrics.filter(metric => metric.granularity === granularity);
    }

    if (timeRange) {
      metrics = metrics.filter(metric => 
        metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async getPreviousMetric(
    type: MetricType,
    granularity: TimeGranularity
  ): Promise<AnalyticsMetric | null> {
    const metrics = Array.from(this.metrics.values())
      .filter(metric => metric.type === type && metric.granularity === granularity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return metrics[1] || null; // Return the second most recent
  }

  // Report Generation
  async generateReport(
    type: ReportType,
    title: string,
    description: string,
    period: {
      start: Date;
      end: Date;
      granularity: TimeGranularity;
    },
    filters: AnalyticsReport['filters'] = {},
    generatedBy: string = 'system'
  ): Promise<AnalyticsReport> {
    const reportId = this.generateId();
    
    // Generate metrics based on report type
    const metrics = await this.generateReportMetrics(type, period, filters);
    
    // Generate insights
    const insights = await this.generateInsights(metrics, type);
    
    // Generate visualizations
    const visualizations = await this.generateVisualizations(metrics, type);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(insights, type);

    const report: AnalyticsReport = {
      id: reportId,
      type,
      title,
      description,
      generatedAt: new Date(),
      period,
      metrics,
      insights,
      visualizations,
      recommendations,
      filters,
      generatedBy,
      format: 'json',
      shareable: true,
      public: false
    };

    this.reports.set(reportId, report);
    this.emit('reportGenerated', report);
    return report;
  }

  async getReport(reportId: string): Promise<AnalyticsReport | null> {
    return this.reports.get(reportId) || null;
  }

  async getReportsByType(type: ReportType): Promise<AnalyticsReport[]> {
    return Array.from(this.reports.values())
      .filter(report => report.type === type)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  private async generateReportMetrics(
    type: ReportType,
    period: { start: Date; end: Date; granularity: TimeGranularity },
    filters: AnalyticsReport['filters']
  ): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    switch (type) {
      case ReportType.PERFORMANCE:
        metrics.push(
          await this.createMetric('Total Revenue', MetricType.REVENUE, 0, 'USD', period.granularity),
          await this.createMetric('Success Rate', MetricType.SUCCESS_RATE, 0, '%', period.granularity),
          await this.createMetric('Average Price', MetricType.AVERAGE_PRICE, 0, 'USD', period.granularity),
          await this.createMetric('Total Volume', MetricType.VOLUME, 0, 'USD', period.granularity)
        );
        break;
      
      case ReportType.USER_BEHAVIOR:
        metrics.push(
          await this.createMetric('User Retention', MetricType.USER_RETENTION, 0, '%', period.granularity),
          await this.createMetric('Participation Rate', MetricType.PARTICIPATION, 0, '%', period.granularity),
          await this.createMetric('Bid Frequency', MetricType.BID_FREQUENCY, 0, 'bids/min', period.granularity)
        );
        break;
      
      case ReportType.MARKET_TRENDS:
        metrics.push(
          await this.createMetric('Market Share', MetricType.MARKET_SHARE, 0, '%', period.granularity),
          await this.createMetric('Price Trend', MetricType.AVERAGE_PRICE, 0, 'USD', period.granularity),
          await this.createMetric('Volume Trend', MetricType.VOLUME, 0, 'USD', period.granularity)
        );
        break;
      
      case ReportType.REVENUE_ANALYSIS:
        metrics.push(
          await this.createMetric('Gross Revenue', MetricType.REVENUE, 0, 'USD', period.granularity),
          await this.createMetric('Net Revenue', MetricType.REVENUE, 0, 'USD', period.granularity),
          await this.createMetric('Commission Revenue', MetricType.REVENUE, 0, 'USD', period.granularity)
        );
        break;
    }

    return metrics;
  }

  private async generateInsights(
    metrics: AnalyticsMetric[],
    reportType: ReportType
  ): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    for (const metric of metrics) {
      // Generate trend insights
      if (Math.abs(metric.changePercent) > 10) {
        insights.push({
          id: this.generateId(),
          type: 'trend',
          title: `${metric.name} ${metric.changePercent > 0 ? 'Increased' : 'Decreased'} Significantly`,
          description: `${metric.name} has ${metric.changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(metric.changePercent).toFixed(1)}% compared to the previous period.`,
          impact: Math.abs(metric.changePercent) > 25 ? 'high' : 'medium',
          confidence: 85,
          data: {
            metric: metric.name,
            value: metric.value,
            comparison: metric.value - metric.change,
            trend: metric.changePercent > 0 ? 'up' : 'down'
          },
          recommendations: [
            metric.changePercent > 0 
              ? `Continue current strategies that are driving ${metric.name} growth`
              : `Investigate causes of ${metric.name} decline and implement corrective measures`
          ],
          timestamp: new Date()
        });
      }

      // Generate anomaly insights
      if (this.isAnomaly(metric)) {
        insights.push({
          id: this.generateId(),
          type: 'anomaly',
          title: `Unusual ${metric.name} Detected`,
          description: `${metric.name} value of ${metric.value} ${metric.unit} is outside normal ranges.`,
          impact: 'medium',
          confidence: 75,
          data: {
            metric: metric.name,
            value: metric.value,
            comparison: metric.value - metric.change,
            trend: 'stable'
          },
          recommendations: [
            'Investigate potential causes of this anomaly',
            'Monitor closely for similar patterns'
          ],
          timestamp: new Date()
        });
      }
    }

    return insights;
  }

  private async generateVisualizations(
    metrics: AnalyticsMetric[],
    reportType: ReportType
  ): Promise<AnalyticsVisualization[]> {
    const visualizations: AnalyticsVisualization[] = [];

    // Line chart for trends
    if (metrics.length > 1) {
      visualizations.push({
        id: this.generateId(),
        type: VisualizationType.LINE_CHART,
        title: 'Metric Trends',
        description: 'Trend analysis of key metrics over time',
        data: {
          labels: metrics.map(m => m.timestamp.toLocaleDateString()),
          datasets: [{
            label: 'Values',
            data: metrics.map(m => m.value),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)'
          }]
        },
        config: {
          responsive: true,
          legend: true,
          animation: true
        },
        metadata: {}
      });
    }

    // Bar chart for comparisons
    visualizations.push({
      id: this.generateId(),
      type: VisualizationType.BAR_CHART,
      title: 'Metric Comparison',
      description: 'Comparison of different metrics',
      data: {
        labels: metrics.map(m => m.name),
        datasets: [{
          label: 'Current Value',
          data: metrics.map(m => m.value),
          backgroundColor: '#28a745'
        }]
      },
      config: {
        responsive: true,
        legend: false,
        animation: true
      },
      metadata: {}
    });

    return visualizations;
  }

  private async generateRecommendations(
    insights: AnalyticsInsight[],
    reportType: ReportType
  ): Promise<string[]> {
    const recommendations: string[] = [];

    for (const insight of insights) {
      recommendations.push(...insight.recommendations);
    }

    // Add general recommendations based on report type
    switch (reportType) {
      case ReportType.PERFORMANCE:
        recommendations.push('Regular monitoring of key performance indicators is essential');
        recommendations.push('Consider A/B testing different auction strategies');
        break;
      
      case ReportType.USER_BEHAVIOR:
        recommendations.push('Focus on improving user engagement and retention');
        recommendations.push('Personalize user experience based on behavior patterns');
        break;
      
      case ReportType.MARKET_TRENDS:
        recommendations.push('Stay informed about market trends and adjust strategies accordingly');
        recommendations.push('Monitor competitor activities and market positioning');
        break;
      
      case ReportType.REVENUE_ANALYSIS:
        recommendations.push('Optimize pricing strategies to maximize revenue');
        recommendations.push('Explore new revenue streams and monetization opportunities');
        break;
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // User Behavior Analytics
  async analyzeUserBehavior(
    userId: string,
    period: { start: Date; end: Date }
  ): Promise<UserBehaviorAnalytics> {
    // Placeholder implementation
    // In a real implementation, you would:
    // - Query user's bidding history
    // - Analyze participation patterns
    // - Calculate behavioral metrics
    // - Generate insights and recommendations

    return {
      userId,
      period,
      totalBids: 0,
      totalAmount: 0,
      averageBid: 0,
      winningBids: 0,
      winRate: 0,
      bidFrequency: 0,
      auctionsParticipated: 0,
      auctionsWon: 0,
      uniqueCategories: 0,
      favoriteCategories: [],
      biddingByHour: [],
      biddingByDay: [],
      averageTimeToBid: 0,
      totalSpent: 0,
      averageSpentPerAuction: 0,
      budgetUtilization: 0,
      sessionDuration: 0,
      pageViews: 0,
      watchlistAdds: 0,
      searchQueries: 0
    };
  }

  // Market Trend Analytics
  async analyzeMarketTrends(
    period: { start: Date; end: Date; granularity: TimeGranularity }
  ): Promise<MarketTrendAnalytics> {
    // Placeholder implementation
    return {
      period,
      priceTrends: [],
      volumeTrends: [],
      marketHealth: {
        totalAuctions: 0,
        successRate: 0,
        averageTimeToSale: 0,
        marketLiquidity: 0,
        priceVolatility: 0
      },
      categoryPerformance: [],
      predictions: []
    };
  }

  // Revenue Analytics
  async analyzeRevenue(
    period: { start: Date; end: Date }
  ): Promise<RevenueAnalytics> {
    // Placeholder implementation
    return {
      period,
      totalRevenue: 0,
      grossRevenue: 0,
      netRevenue: 0,
      commissionRevenue: 0,
      feeRevenue: 0,
      revenueByCategory: [],
      revenueByType: [],
      revenueTrends: [],
      averageRevenuePerAuction: 0,
      revenuePerUser: 0,
      revenueGrowthRate: 0,
      profitMargin: 0
    };
  }

  // Predictive Analytics
  async createModel(
    name: string,
    type: PredictiveModel['type'],
    features: string[],
    metadata: Record<string, any> = {}
  ): Promise<PredictiveModel> {
    const model: PredictiveModel = {
      id: this.generateId(),
      name,
      type,
      version: '1.0.0',
      accuracy: 0,
      lastTrained: new Date(),
      trainingDataPeriod: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        end: new Date()
      },
      features,
      metadata
    };

    this.models.set(model.id, model);
    this.emit('modelCreated', model);
    return model;
  }

  async trainModel(modelId: string): Promise<boolean> {
    const model = this.models.get(modelId);
    if (!model) return false;

    // Placeholder for model training
    // In a real implementation, you would:
    // - Collect training data
    // - Train the model using appropriate algorithms
    // - Validate accuracy
    // - Update model version

    model.accuracy = 0.85; // Placeholder accuracy
    model.lastTrained = new Date();
    model.version = this.incrementVersion(model.version);

    this.emit('modelTrained', model);
    return true;
  }

  async generatePrediction(
    modelId: string,
    input: Record<string, any>
  ): Promise<PredictionResult> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    // Placeholder for prediction generation
    const prediction: PredictionResult = {
      modelId,
      predictionType: model.type,
      input,
      output: {
        value: 1000, // Placeholder prediction
        confidence: model.accuracy,
        range: { min: 800, max: 1200 },
        factors: model.features.map(feature => ({
          feature,
          importance: Math.random(),
          value: input[feature] || 0
        }))
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.predictions.set(this.generateId(), prediction);
    this.emit('predictionGenerated', prediction);
    return prediction;
  }

  // Utility Methods
  private isAnomaly(metric: AnalyticsMetric): boolean {
    // Simple anomaly detection using standard deviation
    // In a real implementation, you would use more sophisticated methods
    const historicalMetrics = Array.from(this.metrics.values())
      .filter(m => m.type === metric.type && m.granularity === metric.granularity)
      .map(m => m.value);

    if (historicalMetrics.length < 3) return false;

    const mean = historicalMetrics.reduce((sum, val) => sum + val, 0) / historicalMetrics.length;
    const variance = historicalMetrics.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalMetrics.length;
    const standardDeviation = Math.sqrt(variance);

    return Math.abs(metric.value - mean) > 2 * standardDeviation;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private initializeDefaultModels(): void {
    // Create default predictive models
    const defaultModels: Omit<PredictiveModel, 'id'>[] = [
      {
        name: 'Price Prediction Model',
        type: 'price_prediction',
        version: '1.0.0',
        accuracy: 0.82,
        lastTrained: new Date(),
        trainingDataPeriod: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        features: ['category', 'startingPrice', 'duration', 'sellerRating', 'marketDemand'],
        metadata: { algorithm: 'random_forest' }
      },
      {
        name: 'Success Probability Model',
        type: 'success_probability',
        version: '1.0.0',
        accuracy: 0.78,
        lastTrained: new Date(),
        trainingDataPeriod: {
          start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        features: ['reservePrice', 'startingPrice', 'category', 'sellerHistory', 'marketConditions'],
        metadata: { algorithm: 'logistic_regression' }
      }
    ];

    for (const modelData of defaultModels) {
      const model: PredictiveModel = {
        ...modelData,
        id: this.generateId()
      };
      this.models.set(model.id, model);
    }
  }

  private generateId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    const totalMetrics = this.metrics.size;
    const totalReports = this.reports.size;
    const totalModels = this.models.size;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (totalModels === 0) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalMetrics,
        totalReports,
        totalModels,
        totalPredictions: this.predictions.size,
        averageModelAccuracy: this.calculateAverageModelAccuracy()
      }
    };
  }

  private calculateAverageModelAccuracy(): number {
    const models = Array.from(this.models.values());
    if (models.length === 0) return 0;
    
    return models.reduce((sum, model) => sum + model.accuracy, 0) / models.length;
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        metrics: Array.from(this.metrics.values()),
        reports: Array.from(this.reports.values()),
        insights: Array.from(this.insights.values()),
        models: Array.from(this.models.values()),
        predictions: Array.from(this.predictions.values())
      }, null, 2);
    } else {
      // CSV export for metrics
      const headers = [
        'ID', 'Name', 'Type', 'Value', 'Unit', 'Change', 'Change Percent',
        'Timestamp', 'Granularity'
      ];
      
      const rows = Array.from(this.metrics.values()).map(m => [
        m.id,
        m.name,
        m.type,
        m.value,
        m.unit,
        m.change,
        m.changePercent,
        m.timestamp.toISOString(),
        m.granularity
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
