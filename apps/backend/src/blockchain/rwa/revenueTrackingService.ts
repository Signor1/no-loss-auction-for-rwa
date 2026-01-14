import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetValuationService from './assetValuationService'
import AssetLifecycleService from './assetLifecycleService'
import logger from '../../utils/logger'

// Revenue tracking interfaces
export interface RevenueRecord {
  id: string
  assetId: string
  revenueSource: RevenueSource
  amount: number
  currency: string
  transactionDate: Date
  recognitionDate: Date
  paymentDate?: Date
  description: string
  category: RevenueCategory
  subCategory: string
  contractId?: string
  counterparty: string
  paymentMethod: PaymentMethod
  transactionHash?: string
  blockNumber?: number
  status: RevenueStatus
  taxStatus: TaxStatus
  notes?: string
  attachments: RevenueAttachment[]
  createdAt: Date
  updatedAt: Date
}

export interface RevenueAttachment {
  id: string
  name: string
  type: 'invoice' | 'receipt' | 'contract' | 'bank_statement' | 'other'
  url: string
  uploadedAt: Date
}

export interface RevenueAllocation {
  id: string
  assetId: string
  period: {
    start: Date
    end: Date
  }
  totalRevenue: number
  allocations: AllocationItem[]
  unallocatedAmount: number
  allocationMethod: AllocationMethod
  approvedBy?: string
  approvedAt?: Date
  status: AllocationStatus
  createdAt: Date
  updatedAt: Date
}

export interface AllocationItem {
  id: string
  category: AllocationCategory
  amount: number
  percentage: number
  description: string
  recipient?: string
  priority: AllocationPriority
  dueDate?: Date
  status: AllocationItemStatus
}

export interface RevenueReport {
  id: string
  assetId: string
  reportType: ReportType
  period: {
    start: Date
    end: Date
  }
  summary: RevenueSummary
  breakdowns: RevenueBreakdown[]
  trends: RevenueTrend[]
  comparisons: RevenueComparison[]
  generatedAt: Date
  generatedBy: string
  status: ReportStatus
}

export interface RevenueSummary {
  totalRevenue: number
  recognizedRevenue: number
  deferredRevenue: number
  collectedRevenue: number
  outstandingRevenue: number
  averageMonthlyRevenue: number
  revenueGrowth: number
  topRevenueSources: RevenueSourceSummary[]
  revenueByCategory: Record<RevenueCategory, number>
  currency: string
}

export interface RevenueSourceSummary {
  source: RevenueSource
  amount: number
  percentage: number
  transactionCount: number
  averageTransaction: number
}

export interface RevenueBreakdown {
  category: RevenueCategory
  subCategory: string
  amount: number
  percentage: number
  transactionCount: number
  averageAmount: number
  trend: 'increasing' | 'decreasing' | 'stable'
  growthRate: number
}

export interface RevenueTrend {
  period: string
  revenue: number
  growth: number
  prediction: number
  confidence: number
  factors: TrendFactor[]
}

export interface TrendFactor {
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
  strength: number // 0-100
  description: string
}

export interface RevenueComparison {
  comparisonType: 'previous_period' | 'budget' | 'industry' | 'peer_group'
  metric: string
  currentValue: number
  comparisonValue: number
  difference: number
  differencePercentage: number
  insight: string
}

export interface RevenueForecast {
  id: string
  assetId: string
  forecastPeriod: {
    start: Date
    end: Date
  }
  forecastHorizon: ForecastHorizon
  methodology: ForecastMethodology
  assumptions: ForecastAssumption[]
  scenarios: ForecastScenario[]
  baselineForecast: ForecastData[]
  riskAdjustments: RiskAdjustment[]
  confidenceIntervals: ConfidenceInterval[]
  generatedAt: Date
  lastUpdated: Date
  status: ForecastStatus
}

export interface ForecastAssumption {
  category: string
  assumption: string
  value: any
  source: string
  confidence: number
  lastValidated: Date
}

export interface ForecastScenario {
  id: string
  name: string
  description: string
  probability: number
  adjustments: ScenarioAdjustment[]
  forecastData: ForecastData[]
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
}

export interface ScenarioAdjustment {
  category: string
  adjustment: number // percentage
  reasoning: string
  impact: 'revenue' | 'expense' | 'both'
}

export interface ForecastData {
  period: string
  baselineRevenue: number
  predictedRevenue: number
  lowerBound: number
  upperBound: number
  confidence: number
  drivers: ForecastDriver[]
}

export interface ForecastDriver {
  driver: string
  impact: number // percentage
  confidence: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface RiskAdjustment {
  riskType: string
  probability: number
  impact: number
  mitigation: string
  adjustedForecast: number
}

export interface ConfidenceInterval {
  percentile: number
  lowerBound: number
  upperBound: number
  description: string
}

export interface PerformanceMetrics {
  id: string
  assetId: string
  period: {
    start: Date
    end: Date
  }
  metrics: MetricData[]
  benchmarks: BenchmarkData[]
  kpis: KPI[]
  scorecard: PerformanceScorecard
  generatedAt: Date
}

export interface MetricData {
  metric: string
  value: number
  target: number
  variance: number
  variancePercentage: number
  trend: 'improving' | 'declining' | 'stable'
  status: 'on_track' | 'at_risk' | 'off_track'
}

export interface BenchmarkData {
  benchmark: string
  assetValue: number
  benchmarkValue: number
  percentile: number
  comparison: 'above' | 'below' | 'at' | 'not_available'
}

export interface KPI {
  name: string
  value: number
  target: number
  weight: number
  score: number
  category: 'financial' | 'operational' | 'customer' | 'growth'
  trend: 'up' | 'down' | 'flat'
}

export interface PerformanceScorecard {
  overallScore: number
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ROICalculation {
  id: string
  assetId: string
  calculationPeriod: {
    start: Date
    end: Date
  }
  investment: InvestmentData
  returns: ReturnData
  roi: ROIMetrics
  sensitivity: SensitivityAnalysis[]
  scenarios: ROIScenario[]
  riskAdjustedROI: RiskAdjustedROI
  generatedAt: Date
}

export interface InvestmentData {
  initialInvestment: number
  additionalInvestments: AdditionalInvestment[]
  totalInvestment: number
  investmentDate: Date
  currency: string
}

export interface AdditionalInvestment {
  date: Date
  amount: number
  type: 'maintenance' | 'improvement' | 'expansion' | 'other'
  description: string
}

export interface ReturnData {
  totalReturns: number
  returnBreakdown: ReturnBreakdown[]
  cashFlows: CashFlow[]
  terminalValue?: number
  currency: string
}

export interface ReturnBreakdown {
  source: 'revenue' | 'appreciation' | 'dividends' | 'other'
  amount: number
  percentage: number
  annualized: boolean
}

export interface CashFlow {
  period: string
  amount: number
  type: 'investment' | 'revenue' | 'expense' | 'distribution'
  netCashFlow: number
  cumulativeCashFlow: number
}

export interface ROIMetrics {
  simpleROI: number // (Total Returns / Total Investment) - 1
  annualizedROI: number
  irr: number // Internal Rate of Return
  npv: number // Net Present Value
  paybackPeriod: number // months
  profitabilityIndex: number
  modifiedDietz: number // time-weighted return
}

export interface SensitivityAnalysis {
  variable: string
  baselineValue: number
  range: {
    min: number
    max: number
    step: number
  }
  impactOnROI: number[]
  mostSensitive: boolean
}

export interface ROIScenario {
  name: string
  description: string
  assumptions: Record<string, any>
  roi: number
  probability: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface RiskAdjustedROI {
  sharpeRatio: number
  sortinoRatio: number
  maximumDrawdown: number
  valueAtRisk: number
  expectedShortfall: number
  riskAdjustedReturn: number
}

export interface RevenueAlert {
  id: string
  assetId: string
  alertType: 'revenue_threshold' | 'payment_overdue' | 'forecast_variance' | 'performance_decline' | 'collection_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendedAction: string
  threshold?: number
  currentValue?: number
  dueDate?: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  createdAt: Date
}

export type RevenueSource =
  | 'rental_income' | 'sale_proceeds' | 'interest_income' | 'dividend_income'
  | 'royalty_payments' | 'service_fees' | 'license_fees' | 'other'

export type RevenueCategory =
  | 'rental' | 'sales' | 'interest' | 'dividends' | 'royalties' | 'services' | 'licenses' | 'other'

export type PaymentMethod =
  | 'bank_transfer' | 'wire_transfer' | 'check' | 'cash' | 'cryptocurrency' | 'other'

export type RevenueStatus =
  | 'pending' | 'recognized' | 'collected' | 'failed' | 'disputed' | 'written_off'

export type TaxStatus =
  | 'not_applicable' | 'pending' | 'calculated' | 'paid' | 'exempt'

export type AllocationMethod =
  | 'pro_rata' | 'priority_based' | 'needs_based' | 'performance_based' | 'custom'

export type AllocationCategory =
  | 'operating_expenses' | 'maintenance' | 'debt_service' | 'dividends' | 'reserves' | 'capital_improvements' | 'taxes'

export type AllocationPriority =
  | 'critical' | 'high' | 'medium' | 'low'

export type AllocationStatus =
  | 'draft' | 'submitted' | 'approved' | 'executed' | 'cancelled'

export type AllocationItemStatus =
  | 'pending' | 'allocated' | 'paid' | 'cancelled'

export type ReportType =
  | 'monthly' | 'quarterly' | 'annual' | 'ad_hoc' | 'regulatory' | 'investor'

export type ReportStatus =
  | 'generating' | 'completed' | 'failed' | 'archived'

export type ForecastHorizon =
  | 'short_term' | 'medium_term' | 'long_term' | 'custom'

export type ForecastMethodology =
  | 'linear_regression' | 'exponential_smoothing' | 'arima' | 'machine_learning' | 'expert_judgment' | 'hybrid'

export type ForecastStatus =
  | 'draft' | 'validated' | 'published' | 'outdated' | 'superseded'

/**
 * Revenue Tracking Service for RWA Tokenization
 * Comprehensive revenue collection, allocation, reporting, forecasting,
 * performance metrics, and ROI calculations
 */
export class RevenueTrackingService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private valuationService: AssetValuationService
  private lifecycleService: AssetLifecycleService

  // Data storage
  private revenueRecords: Map<string, RevenueRecord[]> = new Map()
  private revenueAllocations: Map<string, RevenueAllocation[]> = new Map()
  private revenueReports: Map<string, RevenueReport[]> = new Map()
  private revenueForecasts: Map<string, RevenueForecast[]> = new Map()
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map()
  private roiCalculations: Map<string, ROICalculation[]> = new Map()
  private revenueAlerts: Map<string, RevenueAlert[]> = new Map()

  // Monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    valuationService: AssetValuationService,
    lifecycleService: AssetLifecycleService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.valuationService = valuationService
    this.lifecycleService = lifecycleService
    this.logger = loggerInstance
  }

  // ============ REVENUE COLLECTION ============

  /**
   * Record revenue collection
   */
  async recordRevenue(
    assetId: string,
    revenueData: {
      revenueSource: RevenueSource
      amount: number
      currency: string
      transactionDate: Date
      description: string
      category: RevenueCategory
      subCategory: string
      counterparty: string
      paymentMethod: PaymentMethod
      transactionHash?: string
      blockNumber?: number
      attachments?: Omit<RevenueAttachment, 'id' | 'uploadedAt'>[]
      notes?: string
    }
  ): Promise<RevenueRecord> {
    try {
      const revenueRecord: RevenueRecord = {
        id: `revenue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        revenueSource: revenueData.revenueSource,
        amount: revenueData.amount,
        currency: revenueData.currency,
        transactionDate: revenueData.transactionDate,
        recognitionDate: new Date(), // Assume immediate recognition for simplicity
        paymentDate: revenueData.transactionDate,
        description: revenueData.description,
        category: revenueData.category,
        subCategory: revenueData.subCategory,
        counterparty: revenueData.counterparty,
        paymentMethod: revenueData.paymentMethod,
        transactionHash: revenueData.transactionHash,
        blockNumber: revenueData.blockNumber,
        status: 'collected',
        taxStatus: 'pending',
        notes: revenueData.notes,
        attachments: revenueData.attachments?.map(att => ({
          ...att,
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uploadedAt: new Date()
        })) || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.revenueRecords.has(assetId)) {
        this.revenueRecords.set(assetId, [])
      }

      this.revenueRecords.get(assetId)!.push(revenueRecord)

      // Update digital twin with revenue data
      await this.updateDigitalTwinRevenue(assetId, revenueRecord)

      this.emit('revenue:recorded', { revenue: revenueRecord })

      return revenueRecord
    } catch (error) {
      this.logger.error(`Failed to record revenue for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get revenue records for asset
   */
  getRevenueRecords(assetId: string, filters?: {
    startDate?: Date
    endDate?: Date
    category?: RevenueCategory
    status?: RevenueStatus
  }): RevenueRecord[] {
    let records = this.revenueRecords.get(assetId) || []

    if (filters) {
      if (filters.startDate) {
        records = records.filter(r => r.transactionDate >= filters.startDate!)
      }
      if (filters.endDate) {
        records = records.filter(r => r.transactionDate <= filters.endDate!)
      }
      if (filters.category) {
        records = records.filter(r => r.category === filters.category)
      }
      if (filters.status) {
        records = records.filter(r => r.status === filters.status)
      }
    }

    return records.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
  }

  // ============ REVENUE ALLOCATION ============

  /**
   * Create revenue allocation
   */
  async createRevenueAllocation(
    assetId: string,
    allocationData: {
      period: { start: Date; end: Date }
      allocationMethod: AllocationMethod
      allocations: Omit<AllocationItem, 'id' | 'status'>[]
    }
  ): Promise<RevenueAllocation> {
    try {
      // Calculate total revenue for period
      const periodRevenue = this.getRevenueRecords(assetId, {
        startDate: allocationData.period.start,
        endDate: allocationData.period.end,
        status: 'collected'
      })

      const totalRevenue = periodRevenue.reduce((sum, r) => sum + r.amount, 0)
      const totalAllocated = allocationData.allocations.reduce((sum, a) => sum + a.amount, 0)
      const unallocatedAmount = totalRevenue - totalAllocated

      const allocation: RevenueAllocation = {
        id: `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        period: allocationData.period,
        totalRevenue,
        allocations: allocationData.allocations.map(alloc => ({
          ...alloc,
          id: `alloc-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending'
        })),
        unallocatedAmount,
        allocationMethod: allocationData.allocationMethod,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.revenueAllocations.has(assetId)) {
        this.revenueAllocations.set(assetId, [])
      }

      this.revenueAllocations.get(assetId)!.push(allocation)

      this.emit('allocation:created', { allocation })

      return allocation
    } catch (error) {
      this.logger.error(`Failed to create revenue allocation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Execute revenue allocation
   */
  async executeRevenueAllocation(allocationId: string): Promise<RevenueAllocation> {
    try {
      // Find allocation
      let allocation: RevenueAllocation | null = null
      let assetId: string = ''

      for (const [asset, allocations] of this.revenueAllocations) {
        const found = allocations.find(a => a.id === allocationId)
        if (found) {
          allocation = found
          assetId = asset
          break
        }
      }

      if (!allocation) {
        throw new Error(`Revenue allocation ${allocationId} not found`)
      }

      // Execute allocations based on priority and method
      const sortedAllocations = allocation.allocations.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      for (const allocItem of sortedAllocations) {
        allocItem.status = 'allocated'
        // In real implementation, this would trigger actual payments/transfers
      }

      allocation.status = 'executed'
      allocation.updatedAt = new Date()

      this.emit('allocation:executed', { allocation })

      return allocation
    } catch (error) {
      this.logger.error(`Failed to execute revenue allocation ${allocationId}:`, error)
      throw error
    }
  }

  // ============ REVENUE REPORTING ============

  /**
   * Generate revenue report
   */
  generateRevenueReport(
    assetId: string,
    reportConfig: {
      reportType: ReportType
      period: { start: Date; end: Date }
      includeTrends?: boolean
      includeComparisons?: boolean
    }
  ): RevenueReport {
    const revenueRecords = this.getRevenueRecords(assetId, {
      startDate: reportConfig.period.start,
      endDate: reportConfig.period.end
    })

    const summary = this.calculateRevenueSummary(assetId, revenueRecords, reportConfig.period)
    const breakdowns = this.calculateRevenueBreakdowns(revenueRecords)
    const trends = reportConfig.includeTrends ? this.calculateRevenueTrends(assetId, reportConfig.period) : []
    const comparisons = reportConfig.includeComparisons ? this.calculateRevenueComparisons(assetId, reportConfig.period) : []

    const report: RevenueReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      reportType: reportConfig.reportType,
      period: reportConfig.period,
      summary,
      breakdowns,
      trends,
      comparisons,
      generatedAt: new Date(),
      generatedBy: 'system', // Would be actual user
      status: 'completed'
    }

    if (!this.revenueReports.has(assetId)) {
      this.revenueReports.set(assetId, [])
    }

    this.revenueReports.get(assetId)!.push(report)

    this.emit('report:generated', { report })

    return report
  }

  /**
   * Calculate revenue summary
   */
  private calculateRevenueSummary(
    assetId: string,
    records: RevenueRecord[],
    period: { start: Date; end: Date }
  ): RevenueSummary {
    const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0)
    const recognizedRevenue = records.filter(r => r.status === 'recognized' || r.status === 'collected').reduce((sum, r) => sum + r.amount, 0)
    const collectedRevenue = records.filter(r => r.status === 'collected').reduce((sum, r) => sum + r.amount, 0)
    const outstandingRevenue = totalRevenue - collectedRevenue

    const days = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)
    const months = days / 30
    const averageMonthlyRevenue = months > 0 ? totalRevenue / months : 0

    // Calculate growth (simplified - would need historical data)
    const revenueGrowth = 0 // Would calculate year-over-year growth

    // Top revenue sources
    const sourceMap = new Map<RevenueSource, { amount: number; count: number }>()
    records.forEach(record => {
      const existing = sourceMap.get(record.revenueSource) || { amount: 0, count: 0 }
      sourceMap.set(record.revenueSource, {
        amount: existing.amount + record.amount,
        count: existing.count + 1
      })
    })

    const topRevenueSources: RevenueSourceSummary[] = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        amount: data.amount,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0,
        transactionCount: data.count,
        averageTransaction: data.amount / data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Revenue by category
    const revenueByCategory: Record<RevenueCategory, number> = {} as any
    records.forEach(record => {
      revenueByCategory[record.category] = (revenueByCategory[record.category] || 0) + record.amount
    })

    return {
      totalRevenue,
      recognizedRevenue,
      deferredRevenue: totalRevenue - recognizedRevenue,
      collectedRevenue,
      outstandingRevenue,
      averageMonthlyRevenue,
      revenueGrowth,
      topRevenueSources,
      revenueByCategory,
      currency: records[0]?.currency || 'USD'
    }
  }

  /**
   * Calculate revenue breakdowns
   */
  private calculateRevenueBreakdowns(records: RevenueRecord[]): RevenueBreakdown[] {
    const breakdowns: RevenueBreakdown[] = []

    // Group by category and sub-category
    const categoryMap = new Map<string, RevenueRecord[]>()

    records.forEach(record => {
      const key = `${record.category}:${record.subCategory}`
      if (!categoryMap.has(key)) {
        categoryMap.set(key, [])
      }
      categoryMap.get(key)!.push(record)
    })

    const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0)

    categoryMap.forEach((categoryRecords, key) => {
      const [category, subCategory] = key.split(':')
      const amount = categoryRecords.reduce((sum, r) => sum + r.amount, 0)
      const transactionCount = categoryRecords.length
      const averageAmount = amount / transactionCount

      breakdowns.push({
        category: category as RevenueCategory,
        subCategory,
        amount,
        percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
        transactionCount,
        averageAmount,
        trend: 'stable', // Would calculate trend
        growthRate: 0 // Would calculate growth rate
      })
    })

    return breakdowns.sort((a, b) => b.amount - a.amount)
  }

  /**
   * Calculate revenue trends
   */
  private calculateRevenueTrends(assetId: string, period: { start: Date; end: Date }): RevenueTrend[] {
    // Simplified trend calculation
    const trends: RevenueTrend[] = []

    // Monthly breakdown for the period
    const monthlyData: Record<string, number> = {}

    for (let d = new Date(period.start); d <= period.end; d.setMonth(d.getMonth() + 1)) {
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = 0
    }

    // Would populate with actual data
    Object.keys(monthlyData).forEach(month => {
      trends.push({
        period: month,
        revenue: monthlyData[month],
        growth: 0, // Would calculate month-over-month growth
        prediction: monthlyData[month] * 1.05, // Simple 5% growth prediction
        confidence: 75,
        factors: [
          {
            factor: 'market_conditions',
            impact: 'positive',
            strength: 60,
            description: 'Favorable market conditions expected'
          }
        ]
      })
    })

    return trends
  }

  /**
   * Calculate revenue comparisons
   */
  private calculateRevenueComparisons(assetId: string, period: { start: Date; end: Date }): RevenueComparison[] {
    // Simplified comparisons
    return [
      {
        comparisonType: 'previous_period',
        metric: 'total_revenue',
        currentValue: 100000,
        comparisonValue: 95000,
        difference: 5000,
        differencePercentage: 5.26,
        insight: 'Revenue increased by 5.26% compared to previous period'
      }
    ]
  }

  // ============ REVENUE FORECASTING ============

  /**
   * Generate revenue forecast
   */
  async generateRevenueForecast(
    assetId: string,
    forecastConfig: {
      forecastHorizon: ForecastHorizon
      methodology: ForecastMethodology
      scenarios?: Omit<ForecastScenario, 'id' | 'forecastData'>[]
    }
  ): Promise<RevenueForecast> {
    try {
      const forecastPeriod = this.calculateForecastPeriod(forecastConfig.forecastHorizon)
      const historicalData = this.getRevenueRecords(assetId, {
        endDate: new Date(),
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
      })

      const baselineForecast = this.calculateBaselineForecast(historicalData, forecastPeriod, forecastConfig.methodology)

      const scenarios: ForecastScenario[] = forecastConfig.scenarios?.map(scenario => ({
        ...scenario,
        id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        forecastData: this.adjustForecastForScenario(baselineForecast, scenario.adjustments)
      })) || []

      const forecast: RevenueForecast = {
        id: `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        forecastPeriod,
        forecastHorizon: forecastConfig.forecastHorizon,
        methodology: forecastConfig.methodology,
        assumptions: this.generateForecastAssumptions(assetId),
        scenarios,
        baselineForecast,
        riskAdjustments: this.calculateRiskAdjustments(baselineForecast),
        confidenceIntervals: this.calculateConfidenceIntervals(baselineForecast),
        generatedAt: new Date(),
        lastUpdated: new Date(),
        status: 'published'
      }

      if (!this.revenueForecasts.has(assetId)) {
        this.revenueForecasts.set(assetId, [])
      }

      this.revenueForecasts.get(assetId)!.push(forecast)

      this.emit('forecast:generated', { forecast })

      return forecast
    } catch (error) {
      this.logger.error(`Failed to generate revenue forecast for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Calculate forecast period
   */
  private calculateForecastPeriod(horizon: ForecastHorizon): { start: Date; end: Date } {
    const now = new Date()

    let months: number
    switch (horizon) {
      case 'short_term':
        months = 3
        break
      case 'medium_term':
        months = 12
        break
      case 'long_term':
        months = 36
        break
      default:
        months = 12
    }

    return {
      start: now,
      end: new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Calculate baseline forecast
   */
  private calculateBaselineForecast(
    historicalData: RevenueRecord[],
    forecastPeriod: { start: Date; end: Date },
    methodology: ForecastMethodology
  ): ForecastData[] {
    // Simplified forecasting - linear trend
    const monthlyData = this.aggregateRevenueByMonth(historicalData)
    const forecast: ForecastData[] = []

    // Calculate trend
    const months = Object.keys(monthlyData).sort()
    if (months.length >= 2) {
      const recentMonths = months.slice(-6) // Last 6 months
      const avgGrowth = recentMonths.length > 1 ?
        recentMonths.reduce((sum, month, index) => {
          if (index > 0) {
            const prevMonth = recentMonths[index - 1]
            const growth = monthlyData[prevMonth] > 0 ?
              (monthlyData[month] - monthlyData[prevMonth]) / monthlyData[prevMonth] : 0
            return sum + growth
          }
          return sum
        }, 0) / (recentMonths.length - 1) : 0.05 // Default 5% growth

      let currentValue = recentMonths.length > 0 ? monthlyData[recentMonths[recentMonths.length - 1]] : 0

      // Generate forecast
      for (let d = new Date(forecastPeriod.start); d <= forecastPeriod.end; d.setMonth(d.getMonth() + 1)) {
        const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const predictedRevenue = currentValue * (1 + avgGrowth)
        const confidence = Math.max(50, 90 - (avgGrowth * 100)) // Lower confidence with higher volatility

        forecast.push({
          period,
          baselineRevenue: currentValue,
          predictedRevenue,
          lowerBound: predictedRevenue * 0.8,
          upperBound: predictedRevenue * 1.2,
          confidence,
          drivers: [
            {
              driver: 'historical_trend',
              impact: avgGrowth * 100,
              confidence,
              trend: avgGrowth > 0 ? 'increasing' : 'decreasing'
            }
          ]
        })

        currentValue = predictedRevenue
      }
    }

    return forecast
  }

  /**
   * Aggregate revenue by month
   */
  private aggregateRevenueByMonth(records: RevenueRecord[]): Record<string, number> {
    const monthly: Record<string, number> = {}

    records.forEach(record => {
      const month = `${record.transactionDate.getFullYear()}-${String(record.transactionDate.getMonth() + 1).padStart(2, '0')}`
      monthly[month] = (monthly[month] || 0) + record.amount
    })

    return monthly
  }

  // ============ PERFORMANCE METRICS ============

  /**
   * Calculate performance metrics
   */
  calculatePerformanceMetrics(
    assetId: string,
    period: { start: Date; end: Date }
  ): PerformanceMetrics {
    const revenueData = this.getRevenueRecords(assetId, { startDate: period.start, endDate: period.end })
    const totalRevenue = revenueData.reduce((sum, r) => sum + r.amount, 0)

    // Calculate metrics
    const metrics: MetricData[] = [
      {
        metric: 'total_revenue',
        value: totalRevenue,
        target: 100000, // Would be configurable
        variance: totalRevenue - 100000,
        variancePercentage: ((totalRevenue - 100000) / 100000) * 100,
        trend: totalRevenue > 95000 ? 'improving' : 'declining',
        status: totalRevenue >= 95000 ? 'on_track' : 'at_risk'
      },
      {
        metric: 'revenue_growth',
        value: 5.5, // Would calculate actual growth
        target: 8.0,
        variance: -2.5,
        variancePercentage: -31.25,
        trend: 'stable',
        status: 'at_risk'
      }
    ]

    // Benchmarks (simplified)
    const benchmarks: BenchmarkData[] = [
      {
        benchmark: 'industry_average',
        assetValue: totalRevenue,
        benchmarkValue: 120000,
        percentile: 75,
        comparison: 'below'
      }
    ]

    // KPIs
    const kpis: KPI[] = [
      {
        name: 'Revenue Efficiency',
        value: 92,
        target: 95,
        weight: 0.3,
        score: 88,
        category: 'financial',
        trend: 'up'
      },
      {
        name: 'Collection Rate',
        value: 96,
        target: 98,
        weight: 0.4,
        score: 94,
        category: 'operational',
        trend: 'up'
      }
    ]

    const overallScore = kpis.reduce((sum, kpi) => sum + (kpi.score * kpi.weight), 0)
    const scorecard = this.generatePerformanceScorecard(overallScore, metrics, kpis)

    const performanceMetrics: PerformanceMetrics = {
      id: `metrics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      period,
      metrics,
      benchmarks,
      kpis,
      scorecard,
      generatedAt: new Date()
    }

    if (!this.performanceMetrics.has(assetId)) {
      this.performanceMetrics.set(assetId, [])
    }

    this.performanceMetrics.get(assetId)!.push(performanceMetrics)

    return performanceMetrics
  }

  /**
   * Generate performance scorecard
   */
  private generatePerformanceScorecard(
    overallScore: number,
    metrics: MetricData[],
    kpis: KPI[]
  ): PerformanceScorecard {
    let grade: PerformanceScorecard['grade']
    if (overallScore >= 95) grade = 'A+'
    else if (overallScore >= 90) grade = 'A'
    else if (overallScore >= 85) grade = 'A-'
    else if (overallScore >= 80) grade = 'B+'
    else if (overallScore >= 75) grade = 'B'
    else if (overallScore >= 70) grade = 'B-'
    else if (overallScore >= 65) grade = 'C+'
    else if (overallScore >= 60) grade = 'C'
    else if (overallScore >= 55) grade = 'C-'
    else if (overallScore >= 50) grade = 'D'
    else grade = 'F'

    const strengths = []
    const weaknesses = []

    metrics.forEach(metric => {
      if (metric.status === 'on_track') {
        strengths.push(`${metric.metric} is performing well`)
      } else {
        weaknesses.push(`${metric.metric} needs improvement`)
      }
    })

    const recommendations = [
      'Increase focus on high-value revenue streams',
      'Improve collection processes',
      'Monitor market conditions more closely'
    ]

    let riskLevel: PerformanceScorecard['riskLevel'] = 'low'
    if (overallScore < 70) riskLevel = 'high'
    else if (overallScore < 80) riskLevel = 'medium'

    return {
      overallScore,
      grade,
      strengths,
      weaknesses,
      recommendations,
      riskLevel
    }
  }

  // ============ ROI CALCULATIONS ============

  /**
   * Calculate ROI
   */
  calculateROI(
    assetId: string,
    investmentData: InvestmentData,
    calculationPeriod: { start: Date; end: Date }
  ): ROICalculation {
    const returnData = this.calculateReturns(assetId, investmentData, calculationPeriod)
    const roiMetrics = this.calculateROIMetrics(investmentData, returnData, calculationPeriod)

    const sensitivityAnalysis = this.performSensitivityAnalysis(investmentData, returnData, calculationPeriod)
    const scenarios = this.generateROIScenarios(investmentData, returnData, calculationPeriod)
    const riskAdjustedROI = this.calculateRiskAdjustedROI(roiMetrics, calculationPeriod)

    const roiCalculation: ROICalculation = {
      id: `roi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetId,
      calculationPeriod,
      investment: investmentData,
      returns: returnData,
      roi: roiMetrics,
      sensitivity: sensitivityAnalysis,
      scenarios,
      riskAdjustedROI,
      generatedAt: new Date()
    }

    if (!this.roiCalculations.has(assetId)) {
      this.roiCalculations.set(assetId, [])
    }

    this.roiCalculations.get(assetId)!.push(roiCalculation)

    return roiCalculation
  }

  /**
   * Calculate returns
   */
  private calculateReturns(
    assetId: string,
    investment: InvestmentData,
    period: { start: Date; end: Date }
  ): ReturnData {
    const revenueRecords = this.getRevenueRecords(assetId, {
      startDate: period.start,
      endDate: period.end
    })

    const totalRevenue = revenueRecords.reduce((sum, r) => sum + r.amount, 0)

    // Simplified return calculation
    const returnBreakdown: ReturnBreakdown[] = [
      {
        source: 'revenue',
        amount: totalRevenue,
        percentage: 100,
        annualized: false
      }
    ]

    // Generate cash flows (simplified)
    const cashFlows: CashFlow[] = []
    const months = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 30))

    for (let i = 0; i <= months; i++) {
      const date = new Date(period.start.getTime() + i * 30 * 24 * 60 * 60 * 1000)
      const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      let amount = 0
      let type: CashFlow['type'] = 'revenue'

      if (i === 0) {
        amount = -investment.initialInvestment
        type = 'investment'
      } else {
        // Monthly revenue approximation
        amount = totalRevenue / months
        type = 'revenue'
      }

      const cumulativeCashFlow = cashFlows.reduce((sum, cf) => sum + cf.netCashFlow, 0) + amount

      cashFlows.push({
        period: periodKey,
        amount: Math.abs(amount),
        type,
        netCashFlow: amount,
        cumulativeCashFlow
      })
    }

    return {
      totalReturns: totalRevenue,
      returnBreakdown,
      cashFlows,
      currency: investment.currency
    }
  }

  /**
   * Calculate ROI metrics
   */
  private calculateROIMetrics(
    investment: InvestmentData,
    returns: ReturnData,
    period: { start: Date; end: Date }
  ): ROIMetrics {
    const totalInvestment = investment.totalInvestment
    const totalReturns = returns.totalReturns
    const years = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 365)

    // Simple ROI
    const simpleROI = totalInvestment > 0 ? (totalReturns / totalInvestment) - 1 : 0

    // Annualized ROI
    const annualizedROI = years > 0 ? Math.pow(1 + simpleROI, 1 / years) - 1 : simpleROI

    // IRR (simplified calculation)
    const irr = this.calculateIRR(returns.cashFlows)

    // NPV (simplified)
    const discountRate = 0.1 // 10%
    const npv = returns.cashFlows.reduce((sum, cf, index) => {
      const discountFactor = Math.pow(1 + discountRate, -index)
      return sum + (cf.netCashFlow * discountFactor)
    }, 0)

    // Payback period
    let cumulativeCashFlow = 0
    let paybackPeriod = 0
    for (let i = 0; i < returns.cashFlows.length; i++) {
      cumulativeCashFlow += returns.cashFlows[i].netCashFlow
      if (cumulativeCashFlow >= 0) {
        paybackPeriod = i
        break
      }
    }

    // Profitability Index
    const profitabilityIndex = totalInvestment > 0 ? totalReturns / totalInvestment : 0

    // Modified Dietz (simplified)
    const modifiedDietz = simpleROI // Simplified calculation

    return {
      simpleROI,
      annualizedROI,
      irr,
      npv,
      paybackPeriod,
      profitabilityIndex,
      modifiedDietz
    }
  }

  /**
   * Calculate IRR (simplified)
   */
  private calculateIRR(cashFlows: CashFlow[]): number {
    // Simplified IRR calculation - would use proper financial library
    return 0.12 // 12% IRR as example
  }

  // ============ UTILITY METHODS ============

  /**
   * Update digital twin revenue
   */
  private async updateDigitalTwinRevenue(assetId: string, revenue: RevenueRecord): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        // Update revenue data in digital twin
        this.emit('digitalTwin:revenueUpdate', {
          twinId: twin.id,
          revenue: revenue
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin revenue for ${assetId}:`, error)
    }
  }

  /**
   * Generate forecast assumptions
   */
  private generateForecastAssumptions(assetId: string): ForecastAssumption[] {
    return [
      {
        category: 'market_conditions',
        assumption: 'Stable market conditions with moderate growth',
        value: { growth_rate: 0.05 },
        source: 'historical_analysis',
        confidence: 75,
        lastValidated: new Date()
      },
      {
        category: 'occupancy_rate',
        assumption: '95% occupancy maintained',
        value: { occupancy: 0.95 },
        source: 'current_data',
        confidence: 90,
        lastValidated: new Date()
      }
    ]
  }

  /**
   * Adjust forecast for scenario
   */
  private adjustForecastForScenario(baseline: ForecastData[], adjustments: ScenarioAdjustment[]): ForecastData[] {
    return baseline.map(data => {
      let adjustedRevenue = data.predictedRevenue

      adjustments.forEach(adjustment => {
        if (adjustment.impact === 'revenue') {
          adjustedRevenue *= (1 + adjustment.adjustment / 100)
        }
      })

      return {
        ...data,
        predictedRevenue: adjustedRevenue,
        lowerBound: adjustedRevenue * 0.85,
        upperBound: adjustedRevenue * 1.15
      }
    })
  }

  /**
   * Calculate risk adjustments
   */
  private calculateRiskAdjustments(forecast: ForecastData[]): RiskAdjustment[] {
    return [
      {
        riskType: 'market_volatility',
        probability: 0.3,
        impact: -0.1,
        mitigation: 'Diversification strategy',
        adjustedForecast: forecast[0]?.predictedRevenue * 0.9 || 0
      }
    ]
  }

  /**
   * Calculate confidence intervals
   */
  private calculateConfidenceIntervals(forecast: ForecastData[]): ConfidenceInterval[] {
    return [
      {
        percentile: 80,
        lowerBound: forecast[0]?.predictedRevenue * 0.8 || 0,
        upperBound: forecast[0]?.predictedRevenue * 1.2 || 0,
        description: '80% confidence interval'
      }
    ]
  }

  /**
   * Perform sensitivity analysis
   */
  private performSensitivityAnalysis(
    investment: InvestmentData,
    returns: ReturnData,
    period: { start: Date; end: Date }
  ): SensitivityAnalysis[] {
    return [
      {
        variable: 'revenue_growth',
        baselineValue: 5,
        range: { min: -10, max: 20, step: 5 },
        impactOnROI: [-0.2, -0.1, 0, 0.1, 0.15, 0.2, 0.22],
        mostSensitive: true
      }
    ]
  }

  /**
   * Generate ROI scenarios
   */
  private generateROIScenarios(
    investment: InvestmentData,
    returns: ReturnData,
    period: { start: Date; end: Date }
  ): ROIScenario[] {
    return [
      {
        name: 'Base Case',
        description: 'Expected performance based on current trends',
        assumptions: { growth_rate: 0.05, occupancy: 0.95 },
        roi: 0.15,
        probability: 0.5,
        riskLevel: 'medium'
      },
      {
        name: 'Optimistic',
        description: 'Best case scenario with strong market conditions',
        assumptions: { growth_rate: 0.1, occupancy: 0.98 },
        roi: 0.25,
        probability: 0.2,
        riskLevel: 'low'
      },
      {
        name: 'Conservative',
        description: 'Worst case scenario with market downturn',
        assumptions: { growth_rate: 0.02, occupancy: 0.9 },
        roi: 0.08,
        probability: 0.3,
        riskLevel: 'high'
      }
    ]
  }

  /**
   * Calculate risk-adjusted ROI
   */
  private calculateRiskAdjustedROI(roiMetrics: ROIMetrics, period: { start: Date; end: Date }): RiskAdjustedROI {
    return {
      sharpeRatio: 1.2,
      sortinoRatio: 1.5,
      maximumDrawdown: 0.15,
      valueAtRisk: 0.1,
      expectedShortfall: 0.12,
      riskAdjustedReturn: roiMetrics.annualizedROI / 0.1 // Risk-adjusted return
    }
  }

  /**
   * Get revenue analytics
   */
  getRevenueAnalytics(assetId: string): {
    summary: any
    trends: any[]
    forecasts: RevenueForecast[]
    performance: PerformanceMetrics[]
    roi: ROICalculation[]
  } {
    const summary = this.calculateRevenueSummary(assetId, this.getRevenueRecords(assetId), {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    })

    return {
      summary,
      trends: [],
      forecasts: this.revenueForecasts.get(assetId) || [],
      performance: this.performanceMetrics.get(assetId) || [],
      roi: this.roiCalculations.get(assetId) || []
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: Date
    metrics: any
  } {
    return {
      status: 'healthy',
      timestamp: new Date(),
      metrics: {
        totalRevenueRecords: Array.from(this.revenueRecords.values()).flat().length,
        activeAllocations: Array.from(this.revenueAllocations.values()).flat().filter(a => a.status === 'executed').length,
        generatedReports: Array.from(this.revenueReports.values()).flat().length,
        activeForecasts: Array.from(this.revenueForecasts.values()).flat().filter(f => f.status === 'published').length,
        performanceMetrics: Array.from(this.performanceMetrics.values()).flat().length,
        roiCalculations: Array.from(this.roiCalculations.values()).flat().length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.revenueRecords.clear()
    this.revenueAllocations.clear()
    this.revenueReports.clear()
    this.revenueForecasts.clear()
    this.performanceMetrics.clear()
    this.roiCalculations.clear()
    this.revenueAlerts.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All revenue tracking data cleared')
  }
}

export default RevenueTrackingService
