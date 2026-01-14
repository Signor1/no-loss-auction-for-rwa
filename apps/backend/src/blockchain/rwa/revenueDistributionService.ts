import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import OwnershipManagementService from './ownershipManagementService'
import AssetLifecycleService from './assetLifecycleService'
import logger from '../../utils/logger'

// Revenue distribution interfaces
export interface DividendDistribution {
  id: string
  assetId: string
  distributionType: DistributionType
  totalAmount: number
  distributableAmount: number
  withheldAmount: number
  currency: string
  distributionDate: Date
  recordDate: Date
  paymentDate: Date
  status: DistributionStatus
  calculationMethod: CalculationMethod
  distributionRatio: number
  totalRecipients: number
  successfulDistributions: number
  failedDistributions: number
  pendingDistributions: number
  createdAt: Date
  processedAt?: Date
  approvedBy?: string
  approvedAt?: Date
}

export interface DistributionRecord {
  id: string
  distributionId: string
  recipientAddress: string
  tokenBalance: number
  ownershipPercentage: number
  entitledAmount: number
  distributedAmount: number
  withheldAmount: number
  taxWithheld: number
  netAmount: number
  distributionMethod: DistributionMethod
  transactionHash?: string
  blockNumber?: number
  status: DistributionRecordStatus
  distributionDate: Date
  claimedAt?: Date
  createdAt: Date
}

export interface DistributionSchedule {
  id: string
  assetId: string
  scheduleName: string
  frequency: DistributionFrequency
  calculationMethod: CalculationMethod
  distributionType: DistributionType
  minimumDistribution: number
  targetDistribution: number
  currency: string
  isActive: boolean
  nextDistribution?: Date
  lastDistribution?: Date
  totalDistributions: number
  totalAmountDistributed: number
  createdAt: Date
  updatedAt: Date
}

export interface DistributionCalculation {
  id: string
  assetId: string
  period: {
    start: Date
    end: Date
  }
  revenue: RevenueData
  expenses: ExpenseData
  netIncome: number
  distributableAmount: number
  distributionRatio: number
  calculationMethod: CalculationMethod
  assumptions: Record<string, any>
  calculatedAt: Date
  approvedAt?: Date
  approvedBy?: string
}

export interface RevenueData {
  totalRevenue: number
  revenueSources: RevenueSource[]
  recognizedRevenue: number
  deferredRevenue: number
  currency: string
}

export interface RevenueSource {
  source: string
  amount: number
  description: string
  category: 'rental' | 'sale' | 'service' | 'interest' | 'dividend' | 'other'
  recognized: boolean
}

export interface ExpenseData {
  totalExpenses: number
  operatingExpenses: number
  depreciation: number
  interest: number
  taxes: number
  otherExpenses: number
  expenseBreakdown: ExpenseBreakdown[]
}

export interface ExpenseBreakdown {
  category: string
  amount: number
  description: string
  taxDeductible: boolean
}

export interface TaxWithholding {
  id: string
  distributionId: string
  recipientAddress: string
  jurisdiction: string
  taxRate: number
  taxableAmount: number
  withheldAmount: number
  taxType: TaxType
  taxId?: string
  reportingStatus: 'pending' | 'reported' | 'exempt'
  reportedAt?: Date
  createdAt: Date
}

export interface DistributionNotification {
  id: string
  distributionId: string
  recipientAddress: string
  notificationType: 'entitlement' | 'payment' | 'reminder' | 'tax_report'
  channel: 'email' | 'sms' | 'wallet' | 'app'
  status: 'sent' | 'delivered' | 'failed' | 'read'
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  retryCount: number
  content: NotificationContent
  createdAt: Date
}

export interface NotificationContent {
  subject: string
  body: string
  amount?: number
  currency?: string
  distributionDate?: Date
  paymentDate?: Date
  actionUrl?: string
  attachments?: string[]
}

export interface DistributionHistory {
  assetId: string
  totalDistributions: number
  totalAmountDistributed: number
  averageDistribution: number
  distributionFrequency: number
  distributions: DividendDistribution[]
  yieldHistory: YieldData[]
  recipientStats: RecipientStats
  lastUpdated: Date
}

export interface YieldData {
  period: string
  distributionAmount: number
  yieldPercentage: number
  annualizedYield: number
  date: Date
}

export interface RecipientStats {
  totalRecipients: number
  activeRecipients: number
  averageHolding: number
  largestRecipient: {
    address: string
    percentage: number
    amount: number
  }
  distributionBySize: {
    small: number // < 1%
    medium: number // 1-5%
    large: number // 5-10%
    institutional: number // > 10%
  }
}

export interface DistributionAnalytics {
  assetId: string
  timeRange: {
    start: Date
    end: Date
  }
  summary: DistributionSummary
  trends: DistributionTrends
  performance: DistributionPerformance
  recipientAnalysis: RecipientAnalysis
  taxAnalysis: TaxAnalysis
  generatedAt: Date
}

export interface DistributionSummary {
  totalDistributions: number
  totalAmount: number
  averageDistribution: number
  medianDistribution: number
  distributionFrequency: string
  successRate: number
  taxWithholdingRate: number
}

export interface DistributionTrends {
  distributionGrowth: number
  yieldTrend: 'increasing' | 'decreasing' | 'stable'
  volatility: number
  seasonality: Record<string, number>
  predictability: number
}

export interface DistributionPerformance {
  onTimeDelivery: number
  processingEfficiency: number
  costPerDistribution: number
  errorRate: number
  customerSatisfaction: number
}

export interface RecipientAnalysis {
  participationRate: number
  averageClaimTime: number
  geographicDistribution: Record<string, number>
  holdingPeriodAnalysis: HoldingPeriodStats
  churnAnalysis: ChurnStats
}

export interface HoldingPeriodStats {
  averageHoldingPeriod: number
  distributionByHoldingPeriod: {
    short: number // < 1 month
    medium: number // 1-6 months
    long: number // 6-12 months
    very_long: number // > 12 months
  }
}

export interface ChurnStats {
  churnRate: number
  retentionRate: number
  newRecipients: number
  lostRecipients: number
}

export interface TaxAnalysis {
  totalTaxWithheld: number
  taxByJurisdiction: Record<string, number>
  taxEfficiency: number
  complianceRate: number
  reportingAccuracy: number
}

export interface DistributionRequest {
  id: string
  assetId: string
  requestedBy: string
  requestType: 'ad_hoc' | 'special' | 'liquidation' | 'extraordinary'
  amount: number
  currency: string
  reason: string
  justification: string
  approvalRequired: boolean
  approvals: DistributionApproval[]
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processed'
  createdAt: Date
  processedAt?: Date
}

export interface DistributionApproval {
  id: string
  approverAddress: string
  approverRole: string
  decision: 'approved' | 'rejected' | 'pending'
  comments?: string
  approvedAt?: Date
  requiredAuthority: 'low' | 'medium' | 'high' | 'executive'
}

export interface DistributionAlert {
  id: string
  assetId: string
  alertType: 'distribution_due' | 'low_balance' | 'processing_error' | 'tax_deadline' | 'compliance_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendedAction: string
  dueDate?: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  createdAt: Date
}

export type DistributionType =
  | 'dividend' | 'interest' | 'royalty' | 'rental_income' | 'capital_return' | 'liquidation' | 'special'

export type DistributionStatus =
  | 'draft' | 'calculating' | 'calculated' | 'approving' | 'approved' | 'processing'
  | 'distributing' | 'completed' | 'failed' | 'cancelled'

export type CalculationMethod =
  | 'pro_rata' | 'tiered' | 'performance_based' | 'equal' | 'custom'

export type DistributionMethod =
  | 'automatic' | 'claim' | 'streaming' | 'scheduled' | 'manual'

export type DistributionRecordStatus =
  | 'pending' | 'processing' | 'distributed' | 'failed' | 'cancelled' | 'reversed'

export type DistributionFrequency =
  | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom'

export type TaxType =
  | 'income_tax' | 'withholding_tax' | 'capital_gains_tax' | 'dividend_tax' | 'corporate_tax'

/**
 * Revenue Distribution Service for RWA Tokenization
 * Comprehensive dividend distribution with automated calculation,
 * proportional distribution, scheduling, history, tax reporting, and notifications
 */
export class RevenueDistributionService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private ownershipService: OwnershipManagementService
  private lifecycleService: AssetLifecycleService

  // Data storage
  private distributions: Map<string, DividendDistribution[]> = new Map()
  private distributionRecords: Map<string, DistributionRecord[]> = new Map()
  private distributionSchedules: Map<string, DistributionSchedule[]> = new Map()
  private taxWithholdings: Map<string, TaxWithholding[]> = new Map()
  private distributionNotifications: Map<string, DistributionNotification[]> = new Map()
  private distributionRequests: Map<string, DistributionRequest[]> = new Map()
  private distributionAlerts: Map<string, DistributionAlert[]> = new Map()

  // Monitoring
  private distributionIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    ownershipService: OwnershipManagementService,
    lifecycleService: AssetLifecycleService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.ownershipService = ownershipService
    this.lifecycleService = lifecycleService
    this.logger = loggerInstance
  }

  // ============ AUTOMATED DIVIDEND CALCULATION ============

  /**
   * Calculate dividend distribution automatically
   */
  async calculateDividendDistribution(
    assetId: string,
    calculationData: {
      distributionType: DistributionType
      period: { start: Date; end: Date }
      revenue: RevenueData
      expenses: ExpenseData
      calculationMethod: CalculationMethod
      distributionRatio: number
      currency: string
    }
  ): Promise<DividendDistribution> {
    try {
      // Calculate distributable amount
      const netIncome = this.calculateNetIncome(calculationData.revenue, calculationData.expenses)
      const distributableAmount = Math.max(0, netIncome * calculationData.distributionRatio)

      // Create calculation record
      const calculation: DistributionCalculation = {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        period: calculationData.period,
        revenue: calculationData.revenue,
        expenses: calculationData.expenses,
        netIncome,
        distributableAmount,
        distributionRatio: calculationData.distributionRatio,
        calculationMethod: calculationData.calculationMethod,
        assumptions: {
          taxRate: 0.25,
          distributionRatio: calculationData.distributionRatio,
          minimumDistribution: 1000
        },
        calculatedAt: new Date()
      }

      // Create dividend distribution
      const distribution: DividendDistribution = {
        id: `dist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        distributionType: calculationData.distributionType,
        totalAmount: distributableAmount,
        distributableAmount,
        withheldAmount: 0, // Calculated during distribution
        currency: calculationData.currency,
        distributionDate: new Date(),
        recordDate: new Date(),
        paymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'calculated',
        calculationMethod: calculationData.calculationMethod,
        distributionRatio: calculationData.distributionRatio,
        totalRecipients: 0, // Set during distribution
        successfulDistributions: 0,
        failedDistributions: 0,
        pendingDistributions: 0,
        createdAt: new Date()
      }

      if (!this.distributions.has(assetId)) {
        this.distributions.set(assetId, [])
      }

      this.distributions.get(assetId)!.push(distribution)

      this.emit('dividend:calculated', { distribution, calculation })

      return distribution
    } catch (error) {
      this.logger.error(`Failed to calculate dividend distribution for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Calculate net income
   */
  private calculateNetIncome(revenue: RevenueData, expenses: ExpenseData): number {
    const totalRevenue = revenue.recognizedRevenue
    const totalExpenses = expenses.totalExpenses

    return totalRevenue - totalExpenses
  }

  // ============ PROPORTIONAL DISTRIBUTION ============

  /**
   * Execute proportional dividend distribution
   */
  async executeProportionalDistribution(
    distributionId: string,
    distributionData: {
      minimumHolding?: number
      minimumHoldingPeriod?: number
      distributionMethod: DistributionMethod
      taxWithholdingRates: Record<string, number>
    }
  ): Promise<DividendDistribution> {
    try {
      // Find distribution
      let distribution: DividendDistribution | null = null
      let assetId: string = ''

      for (const [asset, distributions] of this.distributions) {
        const found = distributions.find(d => d.id === distributionId)
        if (found) {
          distribution = found
          assetId = asset
          break
        }
      }

      if (!distribution) {
        throw new Error(`Dividend distribution ${distributionId} not found`)
      }

      // Get current ownership
      const ownershipRecords = this.ownershipService.getCurrentOwnership(assetId)
      const eligibleRecipients = this.filterEligibleRecipients(
        ownershipRecords,
        distributionData.minimumHolding,
        distributionData.minimumHoldingPeriod
      )

      // Calculate distribution records
      const distributionRecords: DistributionRecord[] = []

      for (const ownership of eligibleRecipients) {
        const entitledAmount = (ownership.ownershipPercentage / 100) * distribution.distributableAmount
        const taxRate = this.getTaxRate(ownership.ownerAddress, distributionData.taxWithholdingRates)
        const taxWithheld = entitledAmount * taxRate
        const netAmount = entitledAmount - taxWithheld

        const record: DistributionRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          distributionId,
          recipientAddress: ownership.ownerAddress,
          tokenBalance: ownership.ownershipPercentage, // Simplified
          ownershipPercentage: ownership.ownershipPercentage,
          entitledAmount,
          distributedAmount: 0,
          withheldAmount: 0,
          taxWithheld,
          netAmount,
          distributionMethod: distributionData.distributionMethod,
          status: 'pending',
          distributionDate: distribution.distributionDate,
          createdAt: new Date()
        }

        distributionRecords.push(record)

        // Create tax withholding record
        if (taxWithheld > 0) {
          const taxRecord: TaxWithholding = {
            id: `tax-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            distributionId,
            recipientAddress: ownership.ownerAddress,
            jurisdiction: 'US', // Simplified
            taxRate,
            taxableAmount: entitledAmount,
            withheldAmount: taxWithheld,
            taxType: 'dividend_tax',
            reportingStatus: 'pending',
            createdAt: new Date()
          }

          if (!this.taxWithholdings.has(distributionId)) {
            this.taxWithholdings.set(distributionId, [])
          }

          this.taxWithholdings.get(distributionId)!.push(taxRecord)
        }
      }

      // Store distribution records
      if (!this.distributionRecords.has(distributionId)) {
        this.distributionRecords.set(distributionId, [])
      }

      this.distributionRecords.get(distributionId)!.push(...distributionRecords)

      // Update distribution status
      distribution.totalRecipients = distributionRecords.length
      distribution.pendingDistributions = distributionRecords.length
      distribution.status = 'processing'

      // Execute distribution based on method
      await this.executeDistributionByMethod(distribution, distributionRecords, distributionData.distributionMethod)

      this.emit('distribution:executed', { distribution, records: distributionRecords })

      return distribution
    } catch (error) {
      this.logger.error(`Failed to execute proportional distribution ${distributionId}:`, error)
      throw error
    }
  }

  /**
   * Filter eligible recipients
   */
  private filterEligibleRecipients(
    ownershipRecords: any[],
    minimumHolding?: number,
    minimumHoldingPeriod?: number
  ): any[] {
    return ownershipRecords.filter(ownership => {
      // Check minimum holding
      if (minimumHolding && ownership.ownershipPercentage < minimumHolding) {
        return false
      }

      // Check minimum holding period
      if (minimumHoldingPeriod) {
        const holdingPeriodDays = (Date.now() - ownership.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)
        if (holdingPeriodDays < minimumHoldingPeriod) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Get tax rate for recipient
   */
  private getTaxRate(recipientAddress: string, taxWithholdingRates: Record<string, number>): number {
    // Simplified tax rate lookup
    return taxWithholdingRates['default'] || 0.15 // 15% default
  }

  /**
   * Execute distribution by method
   */
  private async executeDistributionByMethod(
    distribution: DividendDistribution,
    records: DistributionRecord[],
    method: DistributionMethod
  ): Promise<void> {
    switch (method) {
      case 'automatic':
        await this.executeAutomaticDistribution(distribution, records)
        break
      case 'claim':
        await this.setupClaimDistribution(distribution, records)
        break
      case 'streaming':
        await this.setupStreamingDistribution(distribution, records)
        break
      case 'scheduled':
        await this.scheduleDistribution(distribution, records)
        break
      default:
        await this.executeAutomaticDistribution(distribution, records)
    }
  }

  /**
   * Execute automatic distribution
   */
  private async executeAutomaticDistribution(
    distribution: DividendDistribution,
    records: DistributionRecord[]
  ): Promise<void> {
    for (const record of records) {
      try {
        // Simulate blockchain distribution
        record.transactionHash = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        record.blockNumber = Math.floor(Math.random() * 1000000)
        record.distributedAmount = record.netAmount
        record.status = 'distributed'
        record.claimedAt = new Date()

        distribution.successfulDistributions++
        distribution.pendingDistributions--

        // Send notification
        await this.sendDistributionNotification(record, 'payment')

      } catch (error) {
        record.status = 'failed'
        distribution.failedDistributions++
        distribution.pendingDistributions--

        this.logger.error(`Failed to distribute to ${record.recipientAddress}:`, error)
      }
    }

    if (distribution.pendingDistributions === 0) {
      distribution.status = 'completed'
      distribution.processedAt = new Date()
    }
  }

  /**
   * Setup claim distribution
   */
  private async setupClaimDistribution(
    distribution: DividendDistribution,
    records: DistributionRecord[]
  ): Promise<void> {
    // Send entitlement notifications
    for (const record of records) {
      await this.sendDistributionNotification(record, 'entitlement')
    }
  }

  /**
   * Setup streaming distribution
   */
  private async setupStreamingDistribution(
    distribution: DividendDistribution,
    records: DistributionRecord[]
  ): Promise<void> {
    // Setup streaming contracts (simplified)
    for (const record of records) {
      record.status = 'processing'
      // In real implementation, this would deploy streaming contracts
    }
  }

  /**
   * Schedule distribution
   */
  private async scheduleDistribution(
    distribution: DividendDistribution,
    records: DistributionRecord[]
  ): Promise<void> {
    // Schedule for future execution
    distribution.status = 'processing'
    // In real implementation, this would use a job scheduler
  }

  // ============ DISTRIBUTION SCHEDULING ============

  /**
   * Create distribution schedule
   */
  async createDistributionSchedule(scheduleData: {
    assetId: string
    scheduleName: string
    frequency: DistributionFrequency
    calculationMethod: CalculationMethod
    distributionType: DistributionType
    minimumDistribution: number
    targetDistribution: number
    currency: string
  }): Promise<DistributionSchedule> {
    try {
      const schedule: DistributionSchedule = {
        id: `sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: scheduleData.assetId,
        scheduleName: scheduleData.scheduleName,
        frequency: scheduleData.frequency,
        calculationMethod: scheduleData.calculationMethod,
        distributionType: scheduleData.distributionType,
        minimumDistribution: scheduleData.minimumDistribution,
        targetDistribution: scheduleData.targetDistribution,
        currency: scheduleData.currency,
        isActive: true,
        nextDistribution: this.calculateNextDistributionDate(scheduleData.frequency),
        totalDistributions: 0,
        totalAmountDistributed: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.distributionSchedules.has(scheduleData.assetId)) {
        this.distributionSchedules.set(scheduleData.assetId, [])
      }

      this.distributionSchedules.get(scheduleData.assetId)!.push(schedule)

      // Start scheduled distribution
      this.startScheduledDistribution(schedule)

      this.emit('schedule:created', { schedule })

      return schedule
    } catch (error) {
      this.logger.error(`Failed to create distribution schedule for ${scheduleData.assetId}:`, error)
      throw error
    }
  }

  /**
   * Calculate next distribution date
   */
  private calculateNextDistributionDate(frequency: DistributionFrequency): Date {
    const now = new Date()

    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'bi_weekly':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
      case 'semi_annual':
        return new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
      case 'annual':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Default monthly
    }
  }

  /**
   * Start scheduled distribution
   */
  private startScheduledDistribution(schedule: DistributionSchedule): void {
    let intervalMs: number

    switch (schedule.frequency) {
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000
        break
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000
        break
      case 'monthly':
        intervalMs = 30 * 24 * 60 * 60 * 1000
        break
      default:
        intervalMs = 30 * 24 * 60 * 60 * 1000
    }

    const interval = setInterval(async () => {
      try {
        await this.executeScheduledDistribution(schedule)
      } catch (error) {
        this.logger.error(`Scheduled distribution failed for ${schedule.assetId}:`, error)
      }
    }, intervalMs)

    this.distributionIntervals.set(schedule.id, interval)
  }

  /**
   * Execute scheduled distribution
   */
  private async executeScheduledDistribution(schedule: DistributionSchedule): Promise<void> {
    try {
      // Check if distribution is due
      if (new Date() < schedule.nextDistribution!) {
        return
      }

      // Calculate distribution amount (simplified)
      const distributionAmount = Math.max(schedule.minimumDistribution, schedule.targetDistribution * 0.1)

      if (distributionAmount >= schedule.minimumDistribution) {
        // Create and execute distribution
        const distribution = await this.calculateDividendDistribution(schedule.assetId, {
          distributionType: schedule.distributionType,
          period: {
            start: schedule.lastDistribution || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          },
          revenue: {
            totalRevenue: distributionAmount * 10, // Simplified
            revenueSources: [{
              source: 'asset_income',
              amount: distributionAmount * 10,
              description: 'Asset-generated income',
              category: 'rental',
              recognized: true
            }],
            recognizedRevenue: distributionAmount * 10,
            deferredRevenue: 0,
            currency: schedule.currency
          },
          expenses: {
            totalExpenses: distributionAmount * 9,
            operatingExpenses: distributionAmount * 6,
            depreciation: distributionAmount * 2,
            interest: distributionAmount * 0.5,
            taxes: distributionAmount * 0.5,
            otherExpenses: 0,
            expenseBreakdown: []
          },
          calculationMethod: schedule.calculationMethod,
          distributionRatio: 0.1, // 10%
          currency: schedule.currency
        })

        await this.executeProportionalDistribution(distribution.id, {
          distributionMethod: 'automatic',
          taxWithholdingRates: { default: 0.15 }
        })

        // Update schedule
        schedule.lastDistribution = distribution.distributionDate
        schedule.nextDistribution = this.calculateNextDistributionDate(schedule.frequency)
        schedule.totalDistributions++
        schedule.totalAmountDistributed += distribution.totalAmount
        schedule.updatedAt = new Date()
      }
    } catch (error) {
      this.logger.error(`Failed to execute scheduled distribution for ${schedule.assetId}:`, error)
      throw error
    }
  }

  // ============ DISTRIBUTION HISTORY ============

  /**
   * Get distribution history
   */
  getDistributionHistory(assetId: string): DistributionHistory {
    const distributions = this.distributions.get(assetId) || []
    const allRecords = Array.from(this.distributionRecords.values()).flat()
      .filter(r => distributions.some(d => d.id === r.distributionId))

    // Calculate yield history
    const yieldHistory: YieldData[] = distributions.map(dist => ({
      period: dist.distributionDate.toISOString().split('T')[0],
      distributionAmount: dist.totalAmount,
      yieldPercentage: 0, // Would calculate based on token price
      annualizedYield: 0, // Would calculate annualized
      date: dist.distributionDate
    }))

    // Calculate recipient stats
    const recipientStats = this.calculateRecipientStats(allRecords)

    return {
      assetId,
      totalDistributions: distributions.length,
      totalAmountDistributed: distributions.reduce((sum, d) => sum + d.totalAmount, 0),
      averageDistribution: distributions.length > 0 ?
        distributions.reduce((sum, d) => sum + d.totalAmount, 0) / distributions.length : 0,
      distributionFrequency: this.calculateDistributionFrequency(distributions),
      distributions,
      yieldHistory,
      recipientStats,
      lastUpdated: new Date()
    }
  }

  /**
   * Calculate recipient statistics
   */
  private calculateRecipientStats(records: DistributionRecord[]): RecipientStats {
    if (records.length === 0) {
      return {
        totalRecipients: 0,
        activeRecipients: 0,
        averageHolding: 0,
        largestRecipient: { address: '', percentage: 0, amount: 0 },
        distributionBySize: { small: 0, medium: 0, large: 0, institutional: 0 }
      }
    }

    const uniqueRecipients = [...new Set(records.map(r => r.recipientAddress))]
    const totalRecipients = uniqueRecipients.length

    // Calculate holdings (simplified)
    const holdings = records.reduce((acc, record) => {
      acc[record.recipientAddress] = (acc[record.recipientAddress] || 0) + record.ownershipPercentage
      return acc
    }, {} as Record<string, number>)

    const averageHolding = Object.values(holdings).reduce((sum, h) => sum + h, 0) / totalRecipients

    const largestRecipient = Object.entries(holdings)
      .reduce((max, [address, percentage]) => percentage > max.percentage ? { address, percentage } : max,
              { address: '', percentage: 0 })

    const largestRecipientAmount = records
      .filter(r => r.recipientAddress === largestRecipient.address)
      .reduce((sum, r) => sum + r.distributedAmount, 0)

    // Distribution by size
    const distributionBySize = {
      small: Object.values(holdings).filter(h => h < 1).length,
      medium: Object.values(holdings).filter(h => h >= 1 && h < 5).length,
      large: Object.values(holdings).filter(h => h >= 5 && h < 10).length,
      institutional: Object.values(holdings).filter(h => h >= 10).length
    }

    return {
      totalRecipients,
      activeRecipients: totalRecipients, // Simplified
      averageHolding,
      largestRecipient: {
        address: largestRecipient.address,
        percentage: largestRecipient.percentage,
        amount: largestRecipientAmount
      },
      distributionBySize
    }
  }

  /**
   * Calculate distribution frequency
   */
  private calculateDistributionFrequency(distributions: DividendDistribution[]): number {
    if (distributions.length < 2) return 0

    const sortedDistributions = distributions.sort((a, b) => a.distributionDate.getTime() - b.distributionDate.getTime())
    const intervals: number[] = []

    for (let i = 1; i < sortedDistributions.length; i++) {
      const interval = sortedDistributions[i].distributionDate.getTime() - sortedDistributions[i-1].distributionDate.getTime()
      intervals.push(interval)
    }

    const averageInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length
    const daysPerDistribution = averageInterval / (1000 * 60 * 60 * 24)

    return daysPerDistribution > 0 ? 365 / daysPerDistribution : 0
  }

  // ============ TAX REPORTING ============

  /**
   * Generate tax reports
   */
  async generateTaxReports(
    distributionId: string,
    jurisdiction: string
  ): Promise<TaxWithholding[]> {
    try {
      const taxRecords = this.taxWithholdings.get(distributionId) || []
      const jurisdictionRecords = taxRecords.filter(t => t.jurisdiction === jurisdiction)

      // Mark as reported
      for (const record of jurisdictionRecords) {
        record.reportingStatus = 'reported'
        record.reportedAt = new Date()
      }

      this.emit('tax:reports:generated', { distributionId, jurisdiction, records: jurisdictionRecords })

      return jurisdictionRecords
    } catch (error) {
      this.logger.error(`Failed to generate tax reports for ${distributionId}:`, error)
      throw error
    }
  }

  /**
   * Get tax withholding summary
   */
  getTaxWithholdingSummary(distributionId: string): {
    totalWithheld: number
    byJurisdiction: Record<string, number>
    byTaxType: Record<string, number>
    pendingReports: number
  } {
    const taxRecords = this.taxWithholdings.get(distributionId) || []

    const totalWithheld = taxRecords.reduce((sum, t) => sum + t.withheldAmount, 0)

    const byJurisdiction = taxRecords.reduce((acc, t) => {
      acc[t.jurisdiction] = (acc[t.jurisdiction] || 0) + t.withheldAmount
      return acc
    }, {} as Record<string, number>)

    const byTaxType = taxRecords.reduce((acc, t) => {
      acc[t.taxType] = (acc[t.taxType] || 0) + t.withheldAmount
      return acc
    }, {} as Record<string, number>)

    const pendingReports = taxRecords.filter(t => t.reportingStatus === 'pending').length

    return {
      totalWithheld,
      byJurisdiction,
      byTaxType,
      pendingReports
    }
  }

  // ============ DISTRIBUTION NOTIFICATIONS ============

  /**
   * Send distribution notification
   */
  async sendDistributionNotification(
    record: DistributionRecord,
    notificationType: DistributionNotification['notificationType']
  ): Promise<void> {
    try {
      const notification: DistributionNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        distributionId: record.distributionId,
        recipientAddress: record.recipientAddress,
        notificationType,
        channel: 'email', // Default
        status: 'sent',
        sentAt: new Date(),
        retryCount: 0,
        content: this.generateNotificationContent(record, notificationType),
        createdAt: new Date()
      }

      if (!this.distributionNotifications.has(record.distributionId)) {
        this.distributionNotifications.set(record.distributionId, [])
      }

      this.distributionNotifications.get(record.distributionId)!.push(notification)

      // Simulate sending (in real implementation, integrate with email/SMS service)
      setTimeout(() => {
        notification.status = 'delivered'
        notification.deliveredAt = new Date()
      }, 1000)

      this.emit('notification:sent', { notification })

    } catch (error) {
      this.logger.error(`Failed to send distribution notification:`, error)
      throw error
    }
  }

  /**
   * Generate notification content
   */
  private generateNotificationContent(
    record: DistributionRecord,
    type: DistributionNotification['notificationType']
  ): NotificationContent {
    switch (type) {
      case 'entitlement':
        return {
          subject: 'Dividend Distribution Entitlement',
          body: `You are entitled to ${record.entitledAmount} tokens from the recent distribution. Please claim your distribution.`,
          amount: record.entitledAmount,
          distributionDate: record.distributionDate
        }

      case 'payment':
        return {
          subject: 'Dividend Distribution Payment',
          body: `Your dividend distribution of ${record.distributedAmount} tokens has been processed.`,
          amount: record.distributedAmount,
          distributionDate: record.distributionDate
        }

      case 'reminder':
        return {
          subject: 'Dividend Claim Reminder',
          body: `Reminder: You have ${record.entitledAmount} tokens available for claiming.`,
          amount: record.entitledAmount,
          actionUrl: `/claim/${record.distributionId}`
        }

      case 'tax_report':
        return {
          subject: 'Tax Withholding Report',
          body: `Tax withholding report for your distribution. Withheld: ${record.taxWithheld}`,
          amount: record.taxWithheld
        }

      default:
        return {
          subject: 'Distribution Notification',
          body: 'You have a distribution notification.'
        }
    }
  }

  // ============ DISTRIBUTION ANALYTICS ============

  /**
   * Generate distribution analytics
   */
  generateDistributionAnalytics(
    assetId: string,
    timeRange?: { start: Date; end: Date }
  ): DistributionAnalytics {
    const defaultRange = {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    }

    const range = timeRange || defaultRange

    const history = this.getDistributionHistory(assetId)
    const periodDistributions = history.distributions.filter(
      d => d.distributionDate >= range.start && d.distributionDate <= range.end
    )

    const summary = this.calculateDistributionSummary(periodDistributions)
    const trends = this.calculateDistributionTrends(periodDistributions, range)
    const performance = this.calculateDistributionPerformance(periodDistributions)
    const recipientAnalysis = this.calculateRecipientAnalysis(history, range)
    const taxAnalysis = this.calculateTaxAnalysis(assetId, range)

    return {
      assetId,
      timeRange: range,
      summary,
      trends,
      performance,
      recipientAnalysis,
      taxAnalysis,
      generatedAt: new Date()
    }
  }

  /**
   * Calculate distribution summary
   */
  private calculateDistributionSummary(distributions: DividendDistribution[]): DistributionSummary {
    if (distributions.length === 0) {
      return {
        totalDistributions: 0,
        totalAmount: 0,
        averageDistribution: 0,
        medianDistribution: 0,
        distributionFrequency: 'none',
        successRate: 0,
        taxWithholdingRate: 0
      }
    }

    const amounts = distributions.map(d => d.totalAmount)
    const averageDistribution = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const sortedAmounts = amounts.sort((a, b) => a - b)
    const medianDistribution = sortedAmounts[Math.floor(amounts.length / 2)]

    const successRate = distributions.reduce((sum, d) => sum + (d.successfulDistributions / d.totalRecipients), 0) / distributions.length

    // Simplified tax rate
    const taxWithholdingRate = 0.15

    return {
      totalDistributions: distributions.length,
      totalAmount: amounts.reduce((sum, a) => sum + a, 0),
      averageDistribution,
      medianDistribution,
      distributionFrequency: this.determineFrequency(distributions),
      successRate,
      taxWithholdingRate
    }
  }

  /**
   * Determine distribution frequency
   */
  private determineFrequency(distributions: DividendDistribution[]): string {
    if (distributions.length < 2) return 'irregular'

    const intervals = []
    const sorted = distributions.sort((a, b) => a.distributionDate.getTime() - b.distributionDate.getTime())

    for (let i = 1; i < sorted.length; i++) {
      const interval = sorted[i].distributionDate.getTime() - sorted[i-1].distributionDate.getTime()
      intervals.push(interval)
    }

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length
    const days = avgInterval / (1000 * 60 * 60 * 24)

    if (days <= 7) return 'weekly'
    if (days <= 14) return 'bi-weekly'
    if (days <= 31) return 'monthly'
    if (days <= 93) return 'quarterly'
    if (days <= 183) return 'semi-annual'
    if (days <= 366) return 'annual'
    return 'irregular'
  }

  /**
   * Calculate distribution trends
   */
  private calculateDistributionTrends(
    distributions: DividendDistribution[],
    range: { start: Date; end: Date }
  ): DistributionTrends {
    if (distributions.length < 2) {
      return {
        distributionGrowth: 0,
        yieldTrend: 'stable',
        volatility: 0,
        seasonality: {},
        predictability: 0
      }
    }

    const sorted = distributions.sort((a, b) => a.distributionDate.getTime() - b.distributionDate.getTime())
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.totalAmount, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.totalAmount, 0) / secondHalf.length

    const distributionGrowth = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0

    // Calculate volatility
    const amounts = sorted.map(d => d.totalAmount)
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
    const volatility = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0

    return {
      distributionGrowth,
      yieldTrend: distributionGrowth > 5 ? 'increasing' : distributionGrowth < -5 ? 'decreasing' : 'stable',
      volatility,
      seasonality: {}, // Would calculate seasonal patterns
      predictability: 100 - volatility // Simplified
    }
  }

  /**
   * Calculate distribution performance
   */
  private calculateDistributionPerformance(distributions: DividendDistribution[]): DistributionPerformance {
    if (distributions.length === 0) {
      return {
        onTimeDelivery: 0,
        processingEfficiency: 0,
        costPerDistribution: 0,
        errorRate: 0,
        customerSatisfaction: 0
      }
    }

    // Simplified calculations
    const onTimeDelivery = 95 // Assume 95% on-time
    const processingEfficiency = 90 // Assume 90% efficiency
    const costPerDistribution = 5 // Assume $5 per distribution
    const errorRate = distributions.reduce((sum, d) => sum + (d.failedDistributions / d.totalRecipients), 0) / distributions.length
    const customerSatisfaction = 85 // Assume 85% satisfaction

    return {
      onTimeDelivery,
      processingEfficiency,
      costPerDistribution,
      errorRate,
      customerSatisfaction
    }
  }

  /**
   * Calculate recipient analysis
   */
  private calculateRecipientAnalysis(
    history: DistributionHistory,
    range: { start: Date; end: Date }
  ): RecipientAnalysis {
    const participationRate = history.recipientStats.totalRecipients > 0 ?
      (history.recipientStats.activeRecipients / history.recipientStats.totalRecipients) * 100 : 0

    return {
      participationRate,
      averageClaimTime: 2, // 2 days average
      geographicDistribution: {}, // Would analyze recipient locations
      holdingPeriodAnalysis: {
        averageHoldingPeriod: 180, // 6 months
        distributionByHoldingPeriod: {
          short: 20,
          medium: 50,
          long: 25,
          very_long: 5
        }
      },
      churnAnalysis: {
        churnRate: 10,
        retentionRate: 90,
        newRecipients: 15,
        lostRecipients: 5
      }
    }
  }

  /**
   * Calculate tax analysis
   */
  private calculateTaxAnalysis(assetId: string, range: { start: Date; end: Date }): TaxAnalysis {
    const allTaxRecords = Array.from(this.taxWithholdings.values()).flat()
    const periodTaxRecords = allTaxRecords.filter(t =>
      t.createdAt >= range.start && t.createdAt <= range.end
    )

    const totalTaxWithheld = periodTaxRecords.reduce((sum, t) => sum + t.withheldAmount, 0)

    const taxByJurisdiction = periodTaxRecords.reduce((acc, t) => {
      acc[t.jurisdiction] = (acc[t.jurisdiction] || 0) + t.withheldAmount
      return acc
    }, {} as Record<string, number>)

    const complianceRate = periodTaxRecords.length > 0 ?
      (periodTaxRecords.filter(t => t.reportingStatus === 'reported').length / periodTaxRecords.length) * 100 : 100

    return {
      totalTaxWithheld,
      taxByJurisdiction,
      taxEfficiency: 95, // Assume 95% efficiency
      complianceRate,
      reportingAccuracy: 98 // Assume 98% accuracy
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Claim distribution
   */
  async claimDistribution(
    distributionId: string,
    claimantAddress: string
  ): Promise<DistributionRecord> {
    try {
      const records = this.distributionRecords.get(distributionId) || []
      const record = records.find(r => r.recipientAddress === claimantAddress && r.status === 'pending')

      if (!record) {
        throw new Error(`No claimable distribution found for ${claimantAddress}`)
      }

      // Execute claim
      record.transactionHash = `tx-claim-${Date.now()}`
      record.blockNumber = Math.floor(Math.random() * 1000000)
      record.distributedAmount = record.netAmount
      record.status = 'distributed'
      record.claimedAt = new Date()

      // Update distribution stats
      const distribution = this.distributions.get(record.distributionId.split('-')[1])?.find(d => d.id === distributionId)
      if (distribution) {
        distribution.successfulDistributions++
        distribution.pendingDistributions--
      }

      this.emit('distribution:claimed', { record })

      return record
    } catch (error) {
      this.logger.error(`Failed to claim distribution ${distributionId}:`, error)
      throw error
    }
  }

  /**
   * Get distribution by ID
   */
  getDistribution(distributionId: string): DividendDistribution | null {
    for (const distributions of this.distributions.values()) {
      const found = distributions.find(d => d.id === distributionId)
      if (found) return found
    }
    return null
  }

  /**
   * Get distribution records
   */
  getDistributionRecords(distributionId: string): DistributionRecord[] {
    return this.distributionRecords.get(distributionId) || []
  }

  /**
   * Get distribution notifications
   */
  getDistributionNotifications(distributionId: string): DistributionNotification[] {
    return this.distributionNotifications.get(distributionId) || []
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
        totalDistributions: Array.from(this.distributions.values()).flat().length,
        activeSchedules: Array.from(this.distributionSchedules.values()).flat().filter(s => s.isActive).length,
        pendingDistributions: Array.from(this.distributionRecords.values()).flat().filter(r => r.status === 'pending').length,
        totalTaxWithheld: Array.from(this.taxWithholdings.values()).flat().reduce((sum, records) => sum + records.reduce((s, r) => s + r.withheldAmount, 0), 0),
        sentNotifications: Array.from(this.distributionNotifications.values()).flat().filter(n => n.status === 'sent').length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.distributions.clear()
    this.distributionRecords.clear()
    this.distributionSchedules.clear()
    this.taxWithholdings.clear()
    this.distributionNotifications.clear()
    this.distributionRequests.clear()
    this.distributionAlerts.clear()

    // Clear intervals
    for (const interval of this.distributionIntervals.values()) {
      clearInterval(interval)
    }
    this.distributionIntervals.clear()

    this.logger.info('All revenue distribution data cleared')
  }
}

export default RevenueDistributionService
