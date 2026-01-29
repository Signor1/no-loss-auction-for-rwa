import { EventEmitter } from 'events';
import { UserBehaviorAnalyticsService, UserSegment, EngagementLevel } from './userBehaviorAnalytics';

export enum MetricType {
  REVENUE = 'revenue',
  USER_ACQUISITION = 'user_acquisition',
  USER_RETENTION = 'user_retention',
  CONVERSION_RATE = 'conversion_rate',
  LIFETIME_VALUE = 'lifetime_value',
  CHURN_RATE = 'churn_rate',
  ENGAGEMENT_METRICS = 'engagement_metrics',
  PERFORMANCE_METRICS = 'performance_metrics',
  FINANCIAL_METRICS = 'financial_metrics',
  OPERATIONAL_METRICS = 'operational_metrics'
}

export enum TimePeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  RATE = 'rate',
  PERCENTILE = 'percentile',
  GROWTH_RATE = 'growth_rate'
}

export interface BusinessMetric {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  value: number;
  previousValue?: number;
  change: number;
  changePercent: number;
  period: TimePeriod;
  timestamp: Date;
  segment?: string;
  metadata: Record<string, any>;
  unit?: string;
  target?: number;
  actual?: number;
  variance?: number;
  confidence: number;
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: MetricType;
  calculation: MetricCalculation;
  unit: string;
  targetValue?: number;
  kpi: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricCalculation {
  type: AggregationType;
  field: string;
  filters?: MetricFilter[];
  groupBy?: string[];
  timeWindow?: number;
  formula?: string;
  parameters?: Record<string, any>;
}

export interface MetricFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'between';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface MetricAlert {
  id: string;
  metricId: string;
  name: string;
  condition: AlertCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  currentValue: number;
  isActive: boolean;
  triggeredAt?: Date;
  resolvedAt?: Date;
  notificationSent: boolean;
  actions: AlertAction[];
}

export interface AlertCondition {
  field: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'percentage_change';
  value: number;
  timeWindow?: number;
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'dashboard_alert';
  config: Record<string, any>;
  executed: boolean;
  executedAt?: Date;
}

export interface BusinessAnalytics {
  totalRevenue: number;
  revenueByPeriod: Record<TimePeriod, number>;
  revenueBySegment: Record<string, number>;
  userAcquisition: {
    totalUsers: number;
    newUsers: number;
    acquisitionCost: number;
    cac: number; // Customer Acquisition Cost
    ltv: number; // Lifetime Value
    channels: Array<{
      channel: string;
      users: number;
      cost: number;
      cac: number;
    }>;
  };
  userRetention: {
    retentionRate: number;
    churnRate: number;
    averageLifetime: number;
    cohortAnalysis: Array<{
      cohort: string;
      size: number;
      retentionRates: Array<{
        period: string;
        rate: number;
      }>;
    }>;
  };
  conversionMetrics: {
    overallRate: number;
    ratesByFunnel: Record<string, number>;
    ratesBySegment: Record<string, number>;
    revenuePerConversion: number;
    topConvertingPages: Array<{
      page: string;
      conversions: number;
      rate: number;
      revenue: number;
    }>;
  };
  engagementMetrics: {
    dau: number; // Daily Active Users
    wau: number; // Weekly Active Users
    mau: number; // Monthly Active Users
    sessionDuration: {
      average: number;
      median: number;
      p90: number;
    };
    pageViews: {
      total: number;
      perSession: number;
      uniquePages: number;
    };
    featureUsage: Record<string, number>;
    contentEngagement: Record<string, number>;
  };
  performanceMetrics: {
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requests: number;
      errors: number;
      rate: number;
    };
    availability: {
      uptime: number;
      downtime: number;
      errorRate: number;
    };
    resourceUsage: {
      cpu: number;
      memory: number;
      storage: number;
      bandwidth: number;
    };
  };
  trends: {
    growth: Array<{
      period: string;
      metric: string;
      value: number;
      change: number;
      changePercent: number;
    }>;
    seasonality: Record<string, Array<{
      period: string;
      value: number;
    }>>;
  };
}

export interface MetricsConfig {
  enableRealTime: boolean;
  updateFrequency: number; // minutes
  retentionDays: number;
  enableAlerts: boolean;
  enableForecasting: boolean;
  enableCohortAnalysis: boolean;
  enableSegmentation: boolean;
  enableBenchmarking: boolean;
  dataSources: DataSource[];
  aggregationRules: AggregationRule[];
}

export interface DataSource {
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  config: Record<string, any>;
  isActive: boolean;
  lastSync: Date;
}

export interface AggregationRule {
  id: string;
  name: string;
  metricType: MetricType;
  schedule: string; // cron expression
  calculation: MetricCalculation;
  filters?: MetricFilter[];
  isActive: boolean;
  lastRun: Date;
}

export class BusinessMetricsService extends EventEmitter {
  private userBehaviorService: UserBehaviorAnalyticsService;
  private metrics: Map<string, BusinessMetric> = new Map();
  private definitions: Map<string, MetricDefinition> = new Map();
  private alerts: Map<string, MetricAlert> = new Map();
  private config: MetricsConfig;
  private analytics: BusinessAnalytics;
  private updateInterval?: NodeJS.Timeout;
  private aggregationIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(userBehaviorService: UserBehaviorAnalyticsService, config: MetricsConfig) {
    super();
    this.userBehaviorService = userBehaviorService;
    this.config = this.validateConfig(config);
    this.analytics = this.initializeAnalytics();
    this.setupEventListeners();
    this.startUpdateProcessor();
    this.initializeDefaultMetrics();
  }

  private validateConfig(config: MetricsConfig): MetricsConfig {
    return {
      enableRealTime: config.enableRealTime !== false,
      updateFrequency: config.updateFrequency || 5,
      retentionDays: config.retentionDays || 90,
      enableAlerts: config.enableAlerts !== false,
      enableForecasting: config.enableForecasting !== false,
      enableCohortAnalysis: config.enableCohortAnalysis !== false,
      enableSegmentation: config.enableSegmentation !== false,
      enableBenchmarking: config.enableBenchmarking !== false,
      dataSources: config.dataSources || [],
      aggregationRules: config.aggregationRules || []
    };
  }

  private initializeAnalytics(): BusinessAnalytics {
    return {
      totalRevenue: 0,
      revenueByPeriod: {
        hourly: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0
      },
      revenueBySegment: {},
      userAcquisition: {
        totalUsers: 0,
        newUsers: 0,
        acquisitionCost: 0,
        cac: 0,
        ltv: 0,
        channels: []
      },
      userRetention: {
        retentionRate: 0,
        churnRate: 0,
        averageLifetime: 0,
        cohortAnalysis: []
      },
      conversionMetrics: {
        overallRate: 0,
        ratesByFunnel: {},
        ratesBySegment: {},
        revenuePerConversion: 0,
        topConvertingPages: []
      },
      engagementMetrics: {
        dau: 0,
        wau: 0,
        mau: 0,
        sessionDuration: {
          average: 0,
          median: 0,
          p90: 0
        },
        pageViews: {
          total: 0,
          perSession: number,
          uniquePages: 0
        },
        featureUsage: {},
        contentEngagement: {}
      },
      performanceMetrics: {
        responseTime: {
          average: 0,
          p95: 0,
          p99: 0
        },
        throughput: {
          requests: number,
          errors: number,
          rate: number
        },
        availability: {
          uptime: 0,
          downtime: 0,
          errorRate: 0
        },
        resourceUsage: {
          cpu: 0,
          memory: 0,
          storage: 0,
          bandwidth: 0
        }
      },
      trends: {
        growth: [],
        seasonality: {}
      }
    };
  }

  private setupEventListeners(): void {
    this.userBehaviorService.on('analyticsUpdated', (analytics) => {
      this.processBehaviorAnalytics(analytics);
    });

    this.userBehaviorService.on('userBehaviorUpdated', (userBehavior) => {
      this.processUserBehaviorUpdate(userBehavior);
    });
  }

  private async processBehaviorAnalytics(analytics: any): Promise<void> {
    // Update engagement metrics
    this.updateEngagementMetrics(analytics);

    // Update user acquisition metrics
    this.updateUserAcquisitionMetrics(analytics);

    // Update retention metrics
    this.updateRetentionMetrics(analytics);
  }

  private updateEngagementMetrics(analytics: any): void {
    const engagement = analytics.usersByEngagement;
    
    this.analytics.engagementMetrics.dau = engagement.low + engagement.medium + engagement.high + engagement.very_high;
    this.analytics.engagementMetrics.wau = this.analytics.engagementMetrics.dau * 7; // Simplified weekly calculation
    this.analytics.engagementMetrics.mau = this.analytics.engagementMetrics.dau * 30; // Simplified monthly calculation

    // Calculate session duration metrics
    this.updateSessionDurationMetrics();
  }

  private updateSessionDurationMetrics(): void {
    // This would pull actual session data
    // For now, use placeholder calculations
    this.analytics.engagementMetrics.sessionDuration = {
      average: 1800, // 30 minutes
      median: 1200, // 20 minutes
      p90: 3600 // 1 hour
    };
  }

  private updateUserAcquisitionMetrics(analytics: any): void {
    const totalUsers = analytics.totalUsers;
    const newUsers = analytics.usersBySegment.new_user || 0;
    
    this.analytics.userAcquisition.totalUsers = totalUsers;
    this.analytics.userAcquisition.newUsers = newUsers;

    // Calculate acquisition metrics (simplified)
    if (newUsers > 0) {
      this.analytics.userAcquisition.acquisitionCost = newUsers * 50; // $50 per user
      this.analytics.userAcquisition.cac = this.analytics.userAcquisition.acquisitionCost;
      this.analytics.userAcquisition.ltv = 500; // $500 average LTV
    }

    // Update channel performance
    this.updateChannelMetrics();
  }

  private updateChannelMetrics(): void {
    // Simulate channel data
    this.analytics.userAcquisition.channels = [
      {
        channel: 'organic',
        users: 150,
        cost: 2000,
        cac: 13.33
      },
      {
        channel: 'paid_ads',
        users: 80,
        cost: 4000,
        cac: 50
      },
      {
        channel: 'referral',
        users: 45,
        cost: 900,
        cac: 20
      }
    ];
  }

  private updateRetentionMetrics(analytics: any): void {
    const churnedUsers = analytics.usersBySegment.churned_user || 0;
    const totalUsers = analytics.totalUsers;
    
    this.analytics.userRetention.churnRate = totalUsers > 0 ? churnedUsers / totalUsers : 0;
    this.analytics.userRetention.retentionRate = 1 - this.analytics.userRetention.churnRate;
    this.analytics.userRetention.averageLifetime = 365; // Simplified

    // Update cohort analysis
    this.updateCohortAnalysis();
  }

  private updateCohortAnalysis(): void {
    // Simulate cohort analysis
    this.analytics.userRetention.cohortAnalysis = [
      {
        cohort: '2024-01',
        size: 1000,
        retentionRates: [
          { period: 'Day 1', rate: 1.0 },
          { period: 'Day 7', rate: 0.85 },
          { period: 'Day 30', rate: 0.70 },
          { period: 'Day 90', rate: 0.45 }
        ]
      },
      {
        cohort: '2024-02',
        size: 1200,
        retentionRates: [
          { period: 'Day 1', rate: 1.0 },
          { period: 'Day 7', rate: 0.88 },
          { period: 'Day 30', rate: 0.75 },
          { period: 'Day 90', rate: 0.52 }
        ]
      }
    ];
  }

  private processUserBehaviorUpdate(userBehavior: any): void {
    // Update conversion metrics
    this.updateConversionMetrics(userBehavior);

    // Update page view metrics
    this.updatePageViewMetrics(userBehavior);
  }

  private updateConversionMetrics(userBehavior: any): void {
    const conversions = userBehavior.events.filter(e => e.type === 'form_submit' && e.data.success);
    const totalEvents = userBehavior.events.length;
    
    if (totalEvents > 0) {
      this.analytics.conversionMetrics.overallRate = conversions.length / totalEvents;
    }

    // Update revenue per conversion
    this.analytics.conversionMetrics.revenuePerConversion = conversions.length * 100; // $100 per conversion

    // Update top converting pages
    this.updateTopConvertingPages(userBehavior);
  }

  private updateTopConvertingPages(userBehavior: any): void {
    const pageConversions = new Map<string, number>();
    
    userBehavior.events.forEach(event => {
      if (event.type === 'form_submit' && event.data.success && event.data.page) {
        const page = event.data.page;
        pageConversions.set(page, (pageConversions.get(page) || 0) + 1);
      }
    });

    this.analytics.conversionMetrics.topConvertingPages = Array.from(pageConversions.entries())
      .map(([page, conversions]) => ({
        page,
        conversions,
        rate: conversions / userBehavior.events.length,
        revenue: conversions * 100
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10);
  }

  private updatePageViewMetrics(userBehavior: any): void {
    const pageViews = userBehavior.events.filter(e => e.type === 'page_view');
    const uniquePages = new Set(pageViews.map(e => e.data.page));
    
    this.analytics.engagementMetrics.pageViews.total = pageViews.length;
    this.analytics.engagementMetrics.pageViews.perSession = userBehavior.events.length > 0 ? pageViews.length / userBehavior.metrics.sessionCount : 0;
    this.analytics.engagementMetrics.pageViews.uniquePages = uniquePages.size;
  }

  private startUpdateProcessor(): void {
    this.updateInterval = setInterval(() => {
      this.updateAllMetrics();
    }, this.config.updateFrequency * 60 * 1000);

    // Start aggregation rules
    this.startAggregationRules();
  }

  private updateAllMetrics(): void {
    // Update time-based metrics
    this.updateTimeBasedMetrics();

    // Check alerts
    this.checkMetricAlerts();

    // Clean old data
    this.cleanupOldData();

    this.emit('metricsUpdated', this.analytics);
  }

  private updateTimeBasedMetrics(): void {
    const now = new Date();
    
    // Update revenue metrics (simplified)
    this.analytics.totalRevenue += Math.random() * 1000; // Simulate daily revenue
    this.analytics.revenueByPeriod.daily = this.analytics.totalRevenue;
    this.analytics.revenueByPeriod.monthly = this.analytics.totalRevenue * 30;

    // Update trends
    this.updateTrends();
  }

  private updateTrends(): void {
    // Simulate growth trends
    this.analytics.trends.growth = [
      {
        period: 'Daily',
        metric: 'Revenue',
        value: this.analytics.totalRevenue,
        change: Math.random() * 100 - 50,
        changePercent: (Math.random() * 100 - 50) / this.analytics.totalRevenue * 100
      },
      {
        period: 'Monthly',
        metric: 'Users',
        value: this.analytics.userAcquisition.totalUsers,
        change: Math.random() * 50,
        changePercent: (Math.random() * 50) / this.analytics.userAcquisition.totalUsers * 100
      }
    ];

    // Simulate seasonality
    this.analytics.trends.seasonality = {
      'Q1': [
        { period: 'January', value: 10000 },
        { period: 'February', value: 12000 },
        { period: 'March', value: 15000 }
      ],
      'Q2': [
        { period: 'April', value: 16000 },
        { period: 'May', value: 18000 },
        { period: 'June', value: 20000 }
      ]
    };
  }

  private checkMetricAlerts(): void {
    if (!this.config.enableAlerts) return;

    const alerts = Array.from(this.alerts.values())
      .filter(alert => alert.isActive);

    for (const alert of alerts) {
      const currentMetric = this.metrics.get(alert.metricId);
      
      if (currentMetric && this.evaluateAlertCondition(currentMetric.value, alert.condition)) {
        this.triggerAlert(alert, currentMetric);
      }
    }
  }

  private evaluateAlertCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'percentage_change':
        // This would require historical data
        return false; // Simplified
      default:
        return false;
    }
  }

  private triggerAlert(alert: MetricAlert, metric: BusinessMetric): void {
    alert.currentValue = metric.value;
    alert.triggeredAt = new Date();
    alert.notificationSent = false;

    // Execute alert actions
    alert.actions.forEach(action => {
      this.executeAlertAction(action, alert, metric);
    });

    this.emit('alertTriggered', alert);
  }

  private executeAlertAction(action: AlertAction, alert: MetricAlert, metric: BusinessMetric): void {
    action.executed = true;
    action.executedAt = new Date();

    switch (action.type) {
      case 'email':
        // Send email notification
        console.log(`ALERT: ${alert.name} - ${metric.value} ${alert.condition.operator} ${alert.threshold}`);
        break;
      case 'slack':
        // Send Slack notification
        console.log(`SLACK ALERT: ${alert.name} - ${metric.value} ${alert.condition.operator} ${alert.threshold}`);
        break;
      case 'webhook':
        // Send webhook notification
        console.log(`WEBHOOK: ${alert.name} - ${metric.value} ${alert.condition.operator} ${alert.threshold}`);
        break;
      case 'dashboard_alert':
        // Create dashboard alert
        console.log(`DASHBOARD ALERT: ${alert.name} - ${metric.value} ${alert.condition.operator} ${alert.threshold}`);
        break;
    }
  }

  private startAggregationRules(): void {
    for (const rule of this.config.aggregationRules) {
      if (!rule.isActive) continue;

      const interval = this.parseCronExpression(rule.schedule);
      if (interval) {
        const timer = setInterval(() => {
          this.executeAggregationRule(rule);
        }, interval);
        this.aggregationIntervals.set(rule.id, timer);
      }
    }
  }

  private parseCronExpression(cronExpression: string): number | null {
    // Simplified cron parsing
    // In a real implementation, use a proper cron parser
    if (cronExpression === '0 0 * * * *') return 60 * 60 * 1000; // Every hour
    if (cronExpression === '0 0 * * * 0') return 24 * 60 * 60 * 1000; // Every day at midnight
    return null;
  }

  private async executeAggregationRule(rule: AggregationRule): Promise<void> {
    try {
      // Calculate metric based on rule definition
      const value = await this.calculateMetric(rule);
      
      // Create metric record
      const metric: BusinessMetric = {
        id: this.generateMetricId(),
        name: rule.name,
        description: `Aggregated metric: ${rule.name}`,
        type: rule.metricType,
        value,
        previousValue: this.getPreviousMetricValue(rule.id),
        change: value - (this.getPreviousMetricValue(rule.id) || 0),
        changePercent: this.calculateChangePercent(value, this.getPreviousMetricValue(rule.id)),
        period: TimePeriod.DAILY,
        timestamp: new Date(),
        metadata: { ruleId: rule.id },
        unit: this.getMetricUnit(rule.metricType)
      };

      this.metrics.set(metric.id, metric);
      rule.lastRun = new Date();

      this.emit('metricCalculated', metric);

    } catch (error) {
      console.error(`Error executing aggregation rule ${rule.id}:`, error);
    }
  }

  private async calculateMetric(rule: AggregationRule): Promise<number> {
    // This would query the data source and apply the calculation
    // For now, return a simulated value
    switch (rule.calculation.type) {
      case AggregationType.COUNT:
        return Math.floor(Math.random() * 1000);
      case AggregationType.SUM:
        return Math.floor(Math.random() * 10000);
      case AggregationType.AVERAGE:
        return Math.floor(Math.random() * 100);
      case AggregationType.RATE:
        return Math.random();
      default:
        return 0;
    }
  }

  private getPreviousMetricValue(metricId: string): number | undefined {
    // This would query historical metrics
    // For now, return undefined
    return undefined;
  }

  private calculateChangePercent(current: number, previous: number | undefined): number {
    if (previous === undefined || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private getMetricUnit(metricType: MetricType): string {
    const units = {
      [MetricType.REVENUE]: 'USD',
      [MetricType.USER_ACQUISITION]: 'users',
      [MetricType.USER_RETENTION]: '%',
      [MetricType.CONVERSION_RATE]: '%',
      [MetricType.LIFETIME_VALUE]: 'USD',
      [MetricType.CHURN_RATE]: '%',
      [MetricType.ENGAGEMENT_METRICS]: 'various',
      [MetricType.PERFORMANCE_METRICS]: 'ms',
      [MetricType.FINANCIAL_METRICS]: 'USD',
      [MetricType.OPERATIONAL_METRICS]: 'various'
    };
    return units[metricType] || 'count';
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    
    // Clean old metrics
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoffDate) {
        this.metrics.delete(id);
        cleanedCount++;
      }
    }

    // Clean old alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.triggeredAt && alert.triggeredAt < cutoffDate) {
        this.alerts.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old metric records`);
    }
  }

  private initializeDefaultMetrics(): void {
    // Create default metric definitions
    const defaultMetrics: MetricDefinition[] = [
      {
        id: 'revenue_daily',
        name: 'Daily Revenue',
        description: 'Total revenue generated daily',
        type: MetricType.REVENUE,
        calculation: {
          type: AggregationType.SUM,
          field: 'revenue',
          timeWindow: 1440 // 24 hours
        },
        unit: 'USD',
        kpi: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'active_users_daily',
        name: 'Daily Active Users',
        description: 'Number of active users per day',
        type: MetricType.USER_ACQUISITION,
        calculation: {
          type: AggregationType.COUNT,
          field: 'userId',
          filters: [
            { field: 'lastActivity', operator: 'greater_than', value: 86400000 } // Last 24 hours
          ]
        },
        unit: 'users',
        kpi: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'conversion_rate',
        name: 'Conversion Rate',
        description: 'Overall conversion rate',
        type: MetricType.CONVERSION_RATE,
        calculation: {
          type: AggregationType.RATE,
          field: 'conversions',
          formula: 'conversions / total_sessions'
        },
        unit: '%',
        kpi: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultMetrics.forEach(metric => {
      this.definitions.set(metric.id, metric);
    });
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  async createMetricDefinition(data: {
    name: string;
    description: string;
    type: MetricType;
    calculation: MetricCalculation;
    unit?: string;
    targetValue?: number;
    kpi?: boolean;
  }): Promise<MetricDefinition> {
    const definition: MetricDefinition = {
      id: this.generateMetricId(),
      name: data.name,
      description: data.description,
      type: data.type,
      calculation: data.calculation,
      unit: data.unit || 'count',
      targetValue: data.targetValue,
      kpi: data.kpi || false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.definitions.set(definition.id, definition);
    this.emit('metricDefinitionCreated', definition);

    return definition;
  }

  async getMetric(metricId: string): Promise<BusinessMetric | null> {
    return this.metrics.get(metricId) || null;
  }

  async getMetrics(filters?: {
    type?: MetricType;
    period?: TimePeriod;
    segment?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BusinessMetric[]> {
    let metrics = Array.from(this.metrics.values());

    if (filters) {
      if (filters.type) {
        metrics = metrics.filter(m => m.type === filters.type);
      }
      if (filters.period) {
        metrics = metrics.filter(m => m.period === filters.period);
      }
      if (filters.segment) {
        metrics = metrics.filter(m => m.segment === filters.segment);
      }
      if (filters.startDate) {
        metrics = metrics.filter(m => m.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        metrics = metrics.filter(m => m.timestamp <= filters.endDate!);
      }
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getMetricDefinition(definitionId: string): Promise<MetricDefinition | null> {
    return this.definitions.get(definitionId) || null;
  }

  async getMetricDefinitions(filters?: {
    type?: MetricType;
    isActive?: boolean;
  }): Promise<MetricDefinition[]> {
    let definitions = Array.from(this.definitions.values());

    if (filters) {
      if (filters.type) {
        definitions = definitions.filter(d => d.type === filters.type);
      }
      if (filters.isActive !== undefined) {
        definitions = definitions.filter(d => d.isActive === filters.isActive);
      }
    }

    return definitions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAlert(data: {
    metricId: string;
    name: string;
    condition: AlertCondition;
    severity: 'low' | 'medium' | 'high' | 'critical';
    threshold: number;
    actions?: AlertAction[];
  }): Promise<MetricAlert> {
    const alert: MetricAlert = {
      id: this.generateAlertId(),
      metricId: data.metricId,
      name: data.name,
      condition: data.condition,
      severity: data.severity,
      threshold: data.threshold,
      currentValue: 0,
      isActive: true,
      actions: data.actions || [{
        type: 'email',
        config: { recipients: ['admin@company.com'] },
        executed: false
      }]
    };

    this.alerts.set(alert.id, alert);
    this.emit('alertCreated', alert);

    return alert;
  }

  async getAlert(alertId: string): Promise<MetricAlert | null> {
    return this.alerts.get(alertId) || null;
  }

  async getAlerts(filters?: {
    metricId?: string;
    isActive?: boolean;
    severity?: string;
  }): Promise<MetricAlert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.metricId) {
        alerts = alerts.filter(a => a.metricId === filters.metricId);
      }
      if (filters.isActive !== undefined) {
        alerts = alerts.filter(a => a.isActive === filters.isActive);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
    }

    return alerts.sort((a, b) => b.triggeredAt?.getTime() || 0 - (a.triggeredAt?.getTime() || 0));
  }

  async getAnalytics(): Promise<BusinessAnalytics> {
    this.updateAllMetrics();
    return { ...this.analytics };
  }

  async updateConfig(updates: Partial<MetricsConfig>): Promise<MetricsConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<MetricsConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    for (const interval of this.aggregationIntervals.values()) {
      clearInterval(interval);
    }

    this.emit('shutdown');
  }
}
