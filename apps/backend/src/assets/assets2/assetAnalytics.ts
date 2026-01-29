import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Asset, AssetType, AssetStatus, AssetLifecycleStage } from './assetRegistry'
import { AssetValidationService } from './assetValidation'
import { AssetLifecycleService } from './assetLifecycle'
import { AssetSearchService } from './assetSearch'
import { AssetCategorizationService } from './assetCategorization'
import { AssetRelationshipsService } from './assetRelationships'

// Analytics metric interface
export interface AnalyticsMetric {
  id: string
  name: string
  description: string
  type: MetricType
  category: MetricCategory
  unit: string
  format: MetricFormat
  calculation: MetricCalculation
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Metric type enum
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
  RATIO = 'ratio',
  PERCENTAGE = 'percentage',
  AVERAGE = 'average',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max'
}

// Metric category enum
export enum MetricCategory {
  ASSET_COUNT = 'asset_count',
  ASSET_VALUE = 'asset_value',
  ASSET_PERFORMANCE = 'asset_performance',
  VALIDATION = 'validation',
  LIFECYCLE = 'lifecycle',
  SEARCH = 'search',
  CATEGORIZATION = 'categorization',
  RELATIONSHIPS = 'relationships',
  USER_ACTIVITY = 'user_activity',
  SYSTEM_PERFORMANCE = 'system_performance'
}

// Metric format enum
export enum MetricFormat {
  NUMBER = 'number',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  DURATION = 'duration',
  DATE = 'date',
  BOOLEAN = 'boolean',
  TEXT = 'text'
}

// Metric calculation interface
export interface MetricCalculation {
  method: CalculationMethod
  parameters: Record<string, any>
  filters: MetricFilter[]
  aggregations: MetricAggregation[]
  timeWindow?: TimeWindow
}

// Calculation method enum
export enum CalculationMethod {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  MEDIAN = 'median',
  MODE = 'mode',
  STANDARD_DEVIATION = 'standard_deviation',
  PERCENTILE = 'percentile',
  GROWTH_RATE = 'growth_rate',
  CONVERSION_RATE = 'conversion_rate',
  RETENTION_RATE = 'retention_rate',
  CUSTOM = 'custom'
}

// Metric filter interface
export interface MetricFilter {
  field: string
  operator: FilterOperator
  value: any
}

// Filter operator enum
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains'
}

// Metric aggregation interface
export interface MetricAggregation {
  type: AggregationType
  field: string
  alias: string
}

// Aggregation type enum
export enum AggregationType {
  GROUP_BY = 'group_by',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count'
}

// Time window interface
export interface TimeWindow {
  start: Date
  end: Date
  granularity: TimeGranularity
}

// Time granularity enum
export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

// Analytics dashboard interface
export interface AnalyticsDashboard {
  id: string
  name: string
  description: string
  widgets: DashboardWidget[]
  layout: DashboardLayout
  filters: DashboardFilter[]
  refreshInterval: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

// Dashboard widget interface
export interface DashboardWidget {
  id: string
  type: WidgetType
  title: string
  description: string
  metrics: string[]
  visualization: WidgetVisualization
  position: WidgetPosition
  size: WidgetSize
  config: WidgetConfig
  isVisible: boolean
}

// Widget type enum
export enum WidgetType {
  KPI_CARD = 'kpi_card',
  CHART = 'chart',
  TABLE = 'table',
  GAUGE = 'gauge',
  PROGRESS_BAR = 'progress_bar',
  TREND = 'trend',
  HEAT_MAP = 'heat_map',
  FUNNEL = 'funnel',
  GEO_MAP = 'geo_map'
}

// Widget visualization interface
export interface WidgetVisualization {
  type: VisualizationType
  config: Record<string, any>
  colors: string[]
  labels: string[]
}

// Visualization type enum
export enum VisualizationType {
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  AREA_CHART = 'area_chart',
  SCATTER_PLOT = 'scatter_plot',
  DONUT_CHART = 'donut_chart',
  RADAR_CHART = 'radar_chart'
}

// Widget position interface
export interface WidgetPosition {
  x: number
  y: number
}

// Widget size interface
export interface WidgetSize {
  width: number
  height: number
}

// Widget config interface
export interface WidgetConfig {
  showLegend: boolean
  showTooltip: boolean
  showGrid: boolean
  animation: boolean
  interactive: boolean
}

// Dashboard layout interface
export interface DashboardLayout {
  columns: number
  rows: number
  gap: number
  responsive: boolean
}

// Dashboard filter interface
export interface DashboardFilter {
  id: string
  name: string
  type: FilterType
  field: string
  options: FilterOption[]
  defaultValue?: any
  isRequired: boolean
}

// Filter type enum
export enum FilterType {
  DATE_RANGE = 'date_range',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  TEXT_INPUT = 'text_input',
  NUMBER_RANGE = 'number_range',
  CHECKBOX = 'checkbox'
}

// Filter option interface
export interface FilterOption {
  value: any
  label: string
  count?: number
}

// Analytics report interface
export interface AnalyticsReport {
  id: string
  name: string
  description: string
  type: ReportType
  metrics: string[]
  filters: ReportFilter[]
  schedule: ReportSchedule
  format: ReportFormat
  recipients: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

// Report type enum
export enum ReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  TREND = 'trend',
  COMPARISON = 'comparison',
  CUSTOM = 'custom'
}

// Report filter interface
export interface ReportFilter {
  field: string
  operator: FilterOperator
  value: any
  label: string
}

// Report schedule interface
export interface ReportSchedule {
  frequency: ScheduleFrequency
  timezone: string
  nextRun: Date
  lastRun?: Date
}

// Schedule frequency enum
export enum ScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

// Report format enum
export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html'
}

// Analytics alert interface
export interface AnalyticsAlert {
  id: string
  name: string
  description: string
  metric: string
  condition: AlertCondition
  severity: AlertSeverity
  channels: AlertChannel[]
  isActive: boolean
  cooldown: number
  lastTriggered?: Date
  triggerCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

// Alert condition interface
export interface AlertCondition {
  operator: AlertOperator
  threshold: number
  timeWindow?: TimeWindow
  aggregation?: AggregationType
}

// Alert operator enum
export enum AlertOperator {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  PERCENTAGE_CHANGE = 'percentage_change'
}

// Alert severity enum
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert channel interface
export interface AlertChannel {
  type: ChannelType
  config: Record<string, any>
  enabled: boolean
}

// Channel type enum
export enum ChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  TEAMS = 'teams',
  IN_APP = 'in_app'
}

// Asset analytics service
export class AssetAnalyticsService extends EventEmitter {
  private metrics: Map<string, AnalyticsMetric> = new Map()
  private dashboards: Map<string, AnalyticsDashboard> = new Map()
  private reports: Map<string, AnalyticsReport> = new Map()
  private alerts: Map<string, AnalyticsAlert> = new Map()
  private metricValues: Map<string, MetricValue[]> = new Map()
  private logger: Logger
  private isRunning: boolean = false
  private refreshInterval: number = 60000 // 1 minute
  private maxMetricValues: number = 10000

  constructor(
    logger: Logger,
    private validationService: AssetValidationService,
    private lifecycleService: AssetLifecycleService,
    private searchService: AssetSearchService,
    private categorizationService: AssetCategorizationService,
    private relationshipsService: AssetRelationshipsService
  ) {
    super()
    this.logger = logger
  }

  // Start analytics service
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Asset analytics service already started')
      return
    }

    this.isRunning = true
    this.logger.info('Starting asset analytics service...')

    // Load analytics data
    await this.loadAnalyticsData()

    // Initialize default metrics
    await this.initializeDefaultMetrics()

    // Start metric collection
    this.startMetricCollection()

    // Start alert monitoring
    this.startAlertMonitoring()

    this.logger.info('Asset analytics service started')
    this.emit('analytics:started')
  }

  // Stop analytics service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping asset analytics service...')

    // Save analytics data
    await this.saveAnalyticsData()

    this.logger.info('Asset analytics service stopped')
    this.emit('analytics:stopped')
  }

  // Calculate metric
  async calculateMetric(metricId: string, timeWindow?: TimeWindow): Promise<MetricResult> {
    const metric = this.metrics.get(metricId)
    if (!metric) {
      throw new Error(`Metric not found: ${metricId}`)
    }

    try {
      this.logger.debug(`Calculating metric: ${metricId}`)

      const result = await this.performMetricCalculation(metric, timeWindow)

      // Store metric value
      await this.storeMetricValue(metricId, result)

      this.logger.info(`Metric calculated: ${metricId} = ${result.value}`)
      this.emit('metric:calculated', { metricId, result })

      return result

    } catch (error) {
      this.logger.error(`Failed to calculate metric: ${metricId}`, error)
      this.emit('metric:error', { error, metricId })
      throw error
    }
  }

  // Create dashboard
  async createDashboard(dashboardData: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalyticsDashboard> {
    const dashboardId = this.generateDashboardId()

    const dashboard: AnalyticsDashboard = {
      id: dashboardId,
      ...dashboardData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.dashboards.set(dashboardId, dashboard)
    await this.saveDashboard(dashboard)

    this.logger.info(`Dashboard created: ${dashboardId}`)
    this.emit('dashboard:created', { dashboard })

    return dashboard
  }

  // Get dashboard data
  async getDashboardData(dashboardId: string, filters?: Record<string, any>): Promise<DashboardData> {
    const dashboard = this.dashboards.get(dashboardId)
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`)
    }

    try {
      this.logger.debug(`Getting dashboard data: ${dashboardId}`)

      const widgetData: Record<string, any> = {}

      // Calculate metrics for each widget
      for (const widget of dashboard.widgets) {
        if (!widget.isVisible) {
          continue
        }

        const widgetMetrics: Record<string, MetricResult> = {}
        
        for (const metricId of widget.metrics) {
          const metric = this.metrics.get(metricId)
          if (metric && metric.isActive) {
            try {
              const result = await this.calculateMetric(metricId)
              widgetMetrics[metricId] = result
            } catch (error) {
              this.logger.error(`Failed to calculate widget metric: ${metricId}`, error)
              widgetMetrics[metricId] = {
                value: 0,
                timestamp: new Date(),
                metadata: { error: error.message }
              }
            }
          }
        }

        widgetData[widget.id] = {
          metrics: widgetMetrics,
          visualization: widget.visualization,
          config: widget.config
        }
      }

      const dashboardData: DashboardData = {
        dashboard,
        widgetData,
        filters: filters || {},
        generatedAt: new Date()
      }

      this.logger.info(`Dashboard data generated: ${dashboardId}`)
      return dashboardData

    } catch (error) {
      this.logger.error(`Failed to get dashboard data: ${dashboardId}`, error)
      throw error
    }
  }

  // Create report
  async createReport(reportData: Omit<AnalyticsReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalyticsReport> {
    const reportId = this.generateReportId()

    const report: AnalyticsReport = {
      id: reportId,
      ...reportData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.reports.set(reportId, report)
    await this.saveReport(report)

    this.logger.info(`Report created: ${reportId}`)
    this.emit('report:created', { report })

    return report
  }

  // Generate report
  async generateReport(reportId: string, filters?: Record<string, any>): Promise<GeneratedReport> {
    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error(`Report not found: ${reportId}`)
    }

    try {
      this.logger.debug(`Generating report: ${reportId}`)

      const reportData: ReportData = {
        title: report.name,
        description: report.description,
        type: report.type,
        generatedAt: new Date(),
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date()
        },
        metrics: {}
      }

      // Calculate metrics for report
      for (const metricId of report.metrics) {
        const metric = this.metrics.get(metricId)
        if (metric && metric.isActive) {
          try {
            const result = await this.calculateMetric(metricId)
            reportData.metrics[metricId] = {
              name: metric.name,
              description: metric.description,
              value: result.value,
              unit: metric.unit,
              format: metric.format,
              trend: await this.calculateMetricTrend(metricId)
            }
          } catch (error) {
            this.logger.error(`Failed to calculate report metric: ${metricId}`, error)
          }
        }
      }

      // Generate report content based on format
      let content: string
      switch (report.format) {
        case ReportFormat.JSON:
          content = JSON.stringify(reportData, null, 2)
          break
        case ReportFormat.CSV:
          content = this.generateCSVReport(reportData)
          break
        case ReportFormat.HTML:
          content = this.generateHTMLReport(reportData)
          break
        default:
          content = JSON.stringify(reportData, null, 2)
      }

      const generatedReport: GeneratedReport = {
        report,
        data: reportData,
        content,
        generatedAt: new Date()
      }

      this.logger.info(`Report generated: ${reportId}`)
      this.emit('report:generated', { report: generatedReport })

      return generatedReport

    } catch (error) {
      this.logger.error(`Failed to generate report: ${reportId}`, error)
      this.emit('report:error', { error, reportId })
      throw error
    }
  }

  // Create alert
  async createAlert(alertData: Omit<AnalyticsAlert, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): Promise<AnalyticsAlert> {
    const alertId = this.generateAlertId()

    const alert: AnalyticsAlert = {
      id: alertId,
      ...alertData,
      createdAt: new Date(),
      updatedAt: new Date(),
      triggerCount: 0
    }

    this.alerts.set(alertId, alert)
    await this.saveAlert(alert)

    this.logger.info(`Alert created: ${alertId}`)
    this.emit('alert:created', { alert })

    return alert
  }

  // Get analytics overview
  async getAnalyticsOverview(timeWindow?: TimeWindow): Promise<AnalyticsOverview> {
    try {
      this.logger.debug('Getting analytics overview')

      const overview: AnalyticsOverview = {
        totalAssets: await this.calculateMetric('total_assets', timeWindow),
        totalValue: await this.calculateMetric('total_value', timeWindow),
        averageValue: await this.calculateMetric('average_value', timeWindow),
        validationRate: await this.calculateMetric('validation_rate', timeWindow),
        lifecycleDistribution: await this.getLifecycleDistribution(timeWindow),
        categoryDistribution: await this.getCategoryDistribution(timeWindow),
        relationshipStats: await this.getRelationshipStatistics(timeWindow),
        searchAnalytics: this.searchService.getSearchAnalytics(),
        validationAnalytics: this.validationService.getValidationStatistics(),
        lifecycleAnalytics: this.lifecycleService.getLifecycleStatistics(),
        categorizationAnalytics: this.categorizationService.getCategorizationStatistics(),
        relationshipAnalytics: this.relationshipsService.getRelationshipStatistics()
      }

      this.logger.info('Analytics overview generated')
      return overview

    } catch (error) {
      this.logger.error('Failed to get analytics overview', error)
      throw error
    }
  }

  // Get metric history
  getMetricHistory(metricId: string, timeWindow?: TimeWindow): MetricValue[] {
    const values = this.metricValues.get(metricId) || []
    
    if (!timeWindow) {
      return values
    }

    return values.filter(value => 
      value.timestamp >= timeWindow.start && value.timestamp <= timeWindow.end
    )
  }

  // Get all metrics
  getAllMetrics(): AnalyticsMetric[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get metrics by category
  getMetricsByCategory(category: MetricCategory): AnalyticsMetric[] {
    return Array.from(this.metrics.values())
      .filter(metric => metric.category === category && metric.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get all dashboards
  getAllDashboards(): AnalyticsDashboard[] {
    return Array.from(this.dashboards.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get all reports
  getAllReports(): AnalyticsReport[] {
    return Array.from(this.reports.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get all alerts
  getAllAlerts(): AnalyticsAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Private methods
  private async performMetricCalculation(metric: AnalyticsMetric, timeWindow?: TimeWindow): Promise<MetricResult> {
    switch (metric.calculation.method) {
      case CalculationMethod.COUNT:
        return await this.performCountCalculation(metric, timeWindow)
      case CalculationMethod.SUM:
        return await this.performSumCalculation(metric, timeWindow)
      case CalculationMethod.AVERAGE:
        return await this.performAverageCalculation(metric, timeWindow)
      case CalculationMethod.GROWTH_RATE:
        return await this.performGrowthRateCalculation(metric, timeWindow)
      case CalculationMethod.CONVERSION_RATE:
        return await this.performConversionRateCalculation(metric, timeWindow)
      default:
        throw new Error(`Unsupported calculation method: ${metric.calculation.method}`)
    }
  }

  private async performCountCalculation(metric: AnalyticsMetric, timeWindow?: TimeWindow): Promise<MetricResult> {
    // This would perform actual count calculation based on metric configuration
    // For now, return mock data
    return {
      value: Math.floor(Math.random() * 1000),
      timestamp: new Date(),
      metadata: {
        calculation: metric.calculation.method,
        timeWindow: timeWindow?.start.toISOString()
      }
    }
  }

  private async performSumCalculation(metric: AnalyticsMetric, timeWindow?: TimeWindow): Promise<MetricResult> {
    // This would perform actual sum calculation
    return {
      value: Math.random() * 1000000,
      timestamp: new Date(),
      metadata: {
        calculation: metric.calculation.method,
        timeWindow: timeWindow?.start.toISOString()
      }
    }
  }

  private async performAverageCalculation(metric: AnalyticsMetric, timeWindow?: TimeWindow): Promise<MetricResult> {
    // This would perform actual average calculation
    return {
      value: Math.random() * 100000,
      timestamp: new Date(),
      metadata: {
        calculation: metric.calculation.method,
        timeWindow: timeWindow?.start.toISOString()
      }
    }
  }

  private async performGrowthRateCalculation(metric: AnalyticsMetric, timeWindow?: TimeWindow): Promise<MetricResult> {
    // This would calculate growth rate
    return {
      value: Math.random() * 0.2 - 0.1, // -10% to +10%
      timestamp: new Date(),
      metadata: {
        calculation: metric.calculation.method,
        timeWindow: timeWindow?.start.toISOString()
      }
    }
  }

  private async performConversionRateCalculation(metric: AnalyticsMetric, timeWindow?: TimeWindow): Promise<MetricResult> {
    // This would calculate conversion rate
    return {
      value: Math.random() * 0.5 + 0.3, // 30% to 80%
      timestamp: new Date(),
      metadata: {
        calculation: metric.calculation.method,
        timeWindow: timeWindow?.start.toISOString()
      }
    }
  }

  private async storeMetricValue(metricId: string, result: MetricResult): Promise<void> {
    const values = this.metricValues.get(metricId) || []
    
    values.push(result)
    
    // Keep only recent values
    if (values.length > this.maxMetricValues) {
      values.splice(0, values.length - this.maxMetricValues)
    }
    
    this.metricValues.set(metricId, values)
  }

  private async calculateMetricTrend(metricId: string): Promise<MetricTrend> {
    const values = this.getMetricHistory(metricId)
    
    if (values.length < 2) {
      return {
        direction: 'stable',
        percentage: 0,
        period: '7d'
      }
    }

    const recent = values.slice(-7) // Last 7 values
    const older = values.slice(-14, -7) // Previous 7 values

    if (older.length === 0) {
      return {
        direction: 'stable',
        percentage: 0,
        period: '7d'
      }
    }

    const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length
    const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length

    const percentage = ((recentAvg - olderAvg) / olderAvg) * 100
    let direction: 'up' | 'down' | 'stable'

    if (percentage > 5) {
      direction = 'up'
    } else if (percentage < -5) {
      direction = 'down'
    } else {
      direction = 'stable'
    }

    return {
      direction,
      percentage,
      period: '7d'
    }
  }

  private async getLifecycleDistribution(timeWindow?: TimeWindow): Promise<Record<AssetLifecycleStage, number>> {
    // This would get actual lifecycle distribution
    return {
      [AssetLifecycleStage.CREATION]: Math.floor(Math.random() * 100),
      [AssetLifecycleStage.VALIDATION]: Math.floor(Math.random() * 100),
      [AssetLifecycleStage.TOKENIZATION]: Math.floor(Math.random() * 100),
      [AssetLifecycleStage.LISTING]: Math.floor(Math.random() * 100),
      [AssetLifecycleStage.TRADING]: Math.floor(Math.random() * 100)
    }
  }

  private async getCategoryDistribution(timeWindow?: TimeWindow): Promise<Record<string, number>> {
    // This would get actual category distribution
    return {
      'Residential': Math.floor(Math.random() * 200),
      'Commercial': Math.floor(Math.random() * 150),
      'Industrial': Math.floor(Math.random() * 100),
      'Agricultural': Math.floor(Math.random() * 50)
    }
  }

  private async getRelationshipStatistics(timeWindow?: TimeWindow): Promise<any> {
    // This would get actual relationship statistics
    return this.relationshipsService.getRelationshipStatistics()
  }

  private generateCSVReport(reportData: ReportData): string {
    const headers = ['Metric', 'Value', 'Unit', 'Trend']
    const csvRows = [headers.join(',')]
    
    for (const [metricId, metricInfo] of Object.entries(reportData.metrics)) {
      csvRows.push([
        metricInfo.name,
        metricInfo.value.toString(),
        metricInfo.unit,
        metricInfo.trend.direction
      ])
    }
    
    return csvRows.join('\n')
  }

  private generateHTMLReport(reportData: ReportData): string {
    return `
      <html>
        <head>
          <title>${reportData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
            .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            .trend-up { color: green; }
            .trend-down { color: red; }
            .trend-stable { color: gray; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportData.title}</h1>
            <p>${reportData.description}</p>
            <p>Generated: ${reportData.generatedAt.toISOString()}</p>
          </div>
          <div class="metrics">
            ${Object.entries(reportData.metrics).map(([id, metric]) => `
              <div class="metric">
                <h3>${metric.name}</h3>
                <p>${metric.description}</p>
                <p><strong>${metric.value} ${metric.unit}</strong></p>
                <p class="trend-${metric.trend.direction}">Trend: ${metric.trend.percentage.toFixed(2)}%</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `
  }

  // Default metrics initialization
  private async initializeDefaultMetrics(): Promise<void> {
    if (this.metrics.size === 0) {
      await this.createDefaultMetrics()
    }
  }

  private async createDefaultMetrics(): Promise<void> {
    const defaultMetrics = [
      {
        name: 'Total Assets',
        description: 'Total number of assets in the registry',
        type: MetricType.COUNTER,
        category: MetricCategory.ASSET_COUNT,
        unit: 'count',
        format: MetricFormat.NUMBER,
        calculation: {
          method: CalculationMethod.COUNT,
          parameters: {},
          filters: [],
          aggregations: []
        },
        isActive: true
      },
      {
        name: 'Total Value',
        description: 'Total value of all assets',
        type: MetricType.SUM,
        category: MetricCategory.ASSET_VALUE,
        unit: 'USD',
        format: MetricFormat.CURRENCY,
        calculation: {
          method: CalculationMethod.SUM,
          parameters: { field: 'value.estimated' },
          filters: [],
          aggregations: []
        },
        isActive: true
      },
      {
        name: 'Average Value',
        description: 'Average value of assets',
        type: MetricType.AVERAGE,
        category: MetricCategory.ASSET_VALUE,
        unit: 'USD',
        format: MetricFormat.CURRENCY,
        calculation: {
          method: CalculationMethod.AVERAGE,
          parameters: { field: 'value.estimated' },
          filters: [],
          aggregations: []
        },
        isActive: true
      },
      {
        name: 'Validation Rate',
        description: 'Percentage of validated assets',
        type: MetricType.PERCENTAGE,
        category: MetricCategory.VALIDATION,
        unit: '%',
        format: MetricFormat.PERCENTAGE,
        calculation: {
          method: CalculationMethod.CONVERSION_RATE,
          parameters: { numerator: 'validated', denominator: 'total' },
          filters: [],
          aggregations: []
        },
        isActive: true
      }
    ]

    for (const metricData of defaultMetrics) {
      await this.createMetric(metricData)
    }

    this.logger.info('Default metrics created')
  }

  private async createMetric(metricData: Omit<AnalyticsMetric, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalyticsMetric> {
    const metricId = this.generateMetricId()

    const metric: AnalyticsMetric = {
      id: metricId,
      ...metricData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.metrics.set(metricId, metric)
    await this.saveMetric(metric)

    return metric
  }

  // Metric collection and alert monitoring
  private startMetricCollection(): void {
    // Collect metrics periodically
    setInterval(() => {
      this.collectMetrics()
    }, this.refreshInterval)
  }

  private async collectMetrics(): Promise<void> {
    // This would collect all active metrics
    this.logger.debug('Collecting metrics')
  }

  private startAlertMonitoring(): void {
    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts()
    }, 60000)
  }

  private async checkAlerts(): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (alert.isActive) {
        try {
          await this.checkAlert(alert)
        } catch (error) {
          this.logger.error(`Failed to check alert: ${alert.id}`, error)
        }
      }
    }
  }

  private async checkAlert(alert: AnalyticsAlert): Promise<void> {
    // This would check the alert condition and trigger if necessary
    this.logger.debug(`Checking alert: ${alert.id}`)
  }

  // ID generation methods
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateDashboardId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Data persistence methods
  private async saveMetric(metric: AnalyticsMetric): Promise<void> {
    // This would save to your database
    this.logger.debug(`Metric saved: ${metric.id}`)
  }

  private async saveDashboard(dashboard: AnalyticsDashboard): Promise<void> {
    // This would save to your database
    this.logger.debug(`Dashboard saved: ${dashboard.id}`)
  }

  private async saveReport(report: AnalyticsReport): Promise<void> {
    // This would save to your database
    this.logger.debug(`Report saved: ${report.id}`)
  }

  private async saveAlert(alert: AnalyticsAlert): Promise<void> {
    // This would save to your database
    this.logger.debug(`Alert saved: ${alert.id}`)
  }

  private async loadAnalyticsData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading analytics data...')
  }

  private async saveAnalyticsData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving analytics data...')
  }

  // Export methods
  exportAnalyticsData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: Array.from(this.metrics.values()),
      dashboards: Array.from(this.dashboards.values()),
      reports: Array.from(this.reports.values()),
      alerts: Array.from(this.alerts.values()),
      metricValues: Object.fromEntries(this.metricValues.entries())
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'name', 'type', 'category', 'unit', 'format', 'isActive']
      const csvRows = [headers.join(',')]
      
      for (const metric of this.metrics.values()) {
        csvRows.push([
          metric.id,
          metric.name,
          metric.type,
          metric.category,
          metric.unit,
          metric.format,
          metric.isActive.toString()
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Health status
  getHealthStatus(): {
    isRunning: boolean
    totalMetrics: number
    totalDashboards: number
    totalReports: number
    totalAlerts: number
    lastActivity: Date
  } {
    return {
      isRunning: this.isRunning,
      totalMetrics: this.metrics.size,
      totalDashboards: this.dashboards.size,
      totalReports: this.reports.size,
      totalAlerts: this.alerts.size,
      lastActivity: new Date()
    }
  }
}

// Supporting interfaces
export interface MetricResult {
  value: number
  timestamp: Date
  metadata: Record<string, any>
}

export interface MetricValue {
  value: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface MetricTrend {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  period: string
}

export interface DashboardData {
  dashboard: AnalyticsDashboard
  widgetData: Record<string, any>
  filters: Record<string, any>
  generatedAt: Date
}

export interface ReportData {
  title: string
  description: string
  type: ReportType
  generatedAt: Date
  period: {
    start: Date
    end: Date
  }
  metrics: Record<string, {
    name: string
    description: string
    value: number
    unit: string
    format: MetricFormat
    trend: MetricTrend
  }>
}

export interface GeneratedReport {
  report: AnalyticsReport
  data: ReportData
  content: string
  generatedAt: Date
}

export interface AnalyticsOverview {
  totalAssets: MetricResult
  totalValue: MetricResult
  averageValue: MetricResult
  validationRate: MetricResult
  lifecycleDistribution: Record<AssetLifecycleStage, number>
  categoryDistribution: Record<string, number>
  relationshipStats: any
  searchAnalytics: any
  validationAnalytics: any
  lifecycleAnalytics: any
  categorizationAnalytics: any
  relationshipAnalytics: any
}

export default AssetAnalyticsService
