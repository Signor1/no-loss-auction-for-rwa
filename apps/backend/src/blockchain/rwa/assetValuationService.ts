import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import OracleIntegrationService from '../oracle/oracleIntegrationService'
import logger from '../../utils/logger'

// Asset valuation interfaces
export interface AssetValuation {
  id: string
  assetId: string
  valuationType: ValuationType
  valuationMethod: ValuationMethod
  value: number
  currency: string
  valuationDate: Date
  effectiveDate: Date
  expiryDate?: Date
  confidence: number // 0-100
  status: ValuationStatus
  metadata: ValuationMetadata
  createdAt: Date
  updatedAt: Date
  approvedBy?: string
  approvedAt?: Date
}

export interface ValuationMetadata {
  source: string
  methodology: string
  assumptions: Record<string, any>
  comparables?: ComparableAsset[]
  marketData?: MarketDataPoint[]
  riskAdjustments?: RiskAdjustment[]
  sensitivityAnalysis?: SensitivityAnalysis
  qualityScore: number // 0-100
  externalReferences?: string[]
}

export interface ComparableAsset {
  id: string
  assetId: string
  transactionDate: Date
  transactionValue: number
  similarityScore: number // 0-100
  adjustmentFactors: Record<string, number>
  adjustedValue: number
}

export interface MarketDataPoint {
  indicator: string
  value: number
  date: Date
  source: string
  confidence: number
}

export interface RiskAdjustment {
  factor: string
  adjustment: number // percentage
  reasoning: string
  impact: 'low' | 'medium' | 'high'
}

export interface SensitivityAnalysis {
  variable: string
  currentValue: number
  scenarios: SensitivityScenario[]
  keyDrivers: string[]
}

export interface SensitivityScenario {
  name: string
  valueChange: number // percentage
  resultingValue: number
  probability: number // 0-100
}

export interface AutomatedValuationModel {
  id: string
  name: string
  description: string
  assetType: string
  version: string
  status: 'active' | 'deprecated' | 'testing'
  algorithm: ValuationAlgorithm
  parameters: Record<string, any>
  trainingData: ModelTrainingData
  performance: ModelPerformance
  lastTrained: Date
  createdAt: Date
}

export interface ValuationAlgorithm {
  type: 'regression' | 'neural_network' | 'rule_based' | 'hybrid'
  framework: string
  hyperparameters: Record<string, any>
  featureEngineering: FeatureEngineering[]
  validationMethod: string
}

export interface FeatureEngineering {
  name: string
  type: 'numerical' | 'categorical' | 'temporal' | 'spatial'
  transformation: string
  importance: number // 0-100
}

export interface ModelTrainingData {
  datasetSize: number
  features: number
  timeRange: {
    start: Date
    end: Date
  }
  dataQuality: number // 0-100
  geographicCoverage: string[]
  assetTypes: string[]
}

export interface ModelPerformance {
  rSquared: number
  meanAbsoluteError: number
  rootMeanSquaredError: number
  meanAbsolutePercentageError: number
  crossValidationScore: number
  backtestingResults: BacktestingResult[]
}

export interface BacktestingResult {
  period: {
    start: Date
    end: Date
  }
  predictions: number
  accuracy: number
  errorDistribution: {
    mean: number
    std: number
    percentiles: Record<string, number>
  }
}

export interface ThirdPartyAppraisal {
  id: string
  assetId: string
  appraiserId: string
  appraiserName: string
  appraiserCredentials: string[]
  appraisalType: 'full' | 'desktop' | 'drive_by'
  appraisalDate: Date
  reportDate: Date
  value: number
  currency: string
  confidence: number
  methodology: string
  assumptions: string[]
  limitations: string[]
  attachments: AppraisalAttachment[]
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: Date
  reviewComments?: string
}

export interface AppraisalAttachment {
  id: string
  name: string
  type: 'report' | 'photos' | 'comparables' | 'maps' | 'other'
  url: string
  size: number
  uploadedAt: Date
}

export interface ValuationSchedule {
  id: string
  assetId: string
  frequency: ValuationFrequency
  nextValuation: Date
  lastValuation?: Date
  method: ValuationMethod
  triggerConditions: ValuationTrigger[]
  isActive: boolean
  createdAt: Date
}

export interface ValuationTrigger {
  type: 'time_based' | 'value_change' | 'market_event' | 'asset_event'
  threshold: any
  operator: 'gt' | 'lt' | 'eq' | 'pct_change'
  description: string
}

export interface ValuationHistory {
  assetId: string
  valuations: AssetValuation[]
  trends: ValuationTrend[]
  volatility: number
  totalValuations: number
  lastUpdated: Date
}

export interface ValuationTrend {
  period: {
    start: Date
    end: Date
  }
  startValue: number
  endValue: number
  change: number
  changePercent: number
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  drivers: string[]
}

export interface ValuationRequest {
  id: string
  assetId: string
  requestedBy: string
  requestType: 'initial' | 'periodic' | 'ad_hoc' | 'triggered'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  methods: ValuationMethod[]
  deadline?: Date
  reason: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  result?: AssetValuation
}

export type ValuationType =
  | 'initial' | 'periodic' | 'triggered' | 'liquidation' | 'insurance' | 'tax'

export type ValuationMethod =
  | 'avm' | 'comparable_sales' | 'income_capitalization' | 'cost_approach'
  | 'dcfa' | 'market_data' | 'appraisal' | 'oracle_feed' | 'hybrid'

export type ValuationStatus =
  | 'draft' | 'pending_review' | 'approved' | 'rejected' | 'expired' | 'superseded'

export type ValuationFrequency =
  | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom'

/**
 * Asset Valuation Service for RWA Tokenization
 * Comprehensive asset valuation with AVM, appraisals, market data,
 * and automated revaluation scheduling
 */
export class AssetValuationService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private oracleService: OracleIntegrationService

  // Data storage
  private valuations: Map<string, AssetValuation[]> = new Map()
  private automatedModels: Map<string, AutomatedValuationModel[]> = new Map()
  private thirdPartyAppraisals: Map<string, ThirdPartyAppraisal[]> = new Map()
  private valuationSchedules: Map<string, ValuationSchedule> = new Map()
  private valuationRequests: Map<string, ValuationRequest[]> = new Map()

  // Monitoring
  private revaluationIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    oracleService: OracleIntegrationService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.oracleService = oracleService
    this.logger = loggerInstance

    // Initialize default AVM models
    this.initializeDefaultModels()
  }

  // ============ INITIAL VALUATION ============

  /**
   * Perform initial asset valuation
   */
  async performInitialValuation(
    assetId: string,
    valuationData: {
      method: ValuationMethod
      currency: string
      source: string
      metadata?: Partial<ValuationMetadata>
    }
  ): Promise<AssetValuation> {
    try {
      const valuation = await this.performValuation(assetId, {
        ...valuationData,
        type: 'initial',
        valuationDate: new Date(),
        effectiveDate: new Date()
      })

      // Update digital twin with initial valuation
      // Note: updateDigitalTwinValuation method would need to be implemented in AssetDigitalTwinService
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        this.emit('digitalTwin:valuationUpdate', {
          twinId: twin.id,
          valuation: {
            currentValue: valuation.value,
            currency: valuation.currency,
            lastUpdated: valuation.valuationDate
          }
        })
      }

      // Schedule periodic revaluation
      await this.schedulePeriodicRevaluation(assetId, 'monthly')

      this.emit('valuation:initial:completed', { assetId, valuation })

      return valuation
    } catch (error) {
      this.logger.error(`Failed to perform initial valuation for ${assetId}:`, error)
      throw error
    }
  }

  // ============ PERIODIC REVALUATION ============

  /**
   * Schedule periodic revaluation
   */
  async schedulePeriodicRevaluation(
    assetId: string,
    frequency: ValuationFrequency,
    customInterval?: number // days
  ): Promise<ValuationSchedule> {
    try {
      const nextValuation = this.calculateNextValuationDate(frequency, customInterval)

      const schedule: ValuationSchedule = {
        id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        frequency,
        nextValuation,
        method: 'avm', // Default to AVM for periodic
        triggerConditions: this.getDefaultTriggers(frequency),
        isActive: true,
        createdAt: new Date()
      }

      if (!this.valuationSchedules.has(assetId)) {
        this.valuationSchedules.set(assetId, [])
      }

      this.valuationSchedules.get(assetId)!.push(schedule)

      // Start automated revaluation
      this.startAutomatedRevaluation(schedule)

      this.emit('revaluation:scheduled', { assetId, schedule })

      return schedule
    } catch (error) {
      this.logger.error(`Failed to schedule revaluation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Perform periodic revaluation
   */
  async performPeriodicRevaluation(assetId: string): Promise<AssetValuation | null> {
    try {
      const schedule = this.getActiveSchedule(assetId)
      if (!schedule) {
        return null
      }

      // Check if revaluation is due
      if (new Date() < schedule.nextValuation) {
        return null
      }

      // Check trigger conditions
      const shouldRevalue = await this.checkTriggerConditions(schedule)
      if (!shouldRevalue) {
        // Update next valuation date
        schedule.nextValuation = this.calculateNextValuationDate(schedule.frequency)
        return null
      }

      // Perform revaluation
      const valuation = await this.performValuation(assetId, {
        method: schedule.method,
        type: 'periodic',
        valuationDate: new Date(),
        effectiveDate: new Date(),
        source: 'automated'
      })

      // Update schedule
      schedule.lastValuation = valuation.valuationDate
      schedule.nextValuation = this.calculateNextValuationDate(schedule.frequency)

      this.emit('revaluation:completed', { assetId, valuation, schedule })

      return valuation
    } catch (error) {
      this.logger.error(`Failed to perform periodic revaluation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Check trigger conditions for revaluation
   */
  private async checkTriggerConditions(schedule: ValuationSchedule): Promise<boolean> {
    try {
      for (const trigger of schedule.triggerConditions) {
        switch (trigger.type) {
          case 'time_based':
            // Already checked in performPeriodicRevaluation
            break

          case 'value_change':
            const lastValuation = this.getLatestValuation(schedule.assetId)
            if (lastValuation) {
              const changePercent = Math.abs(trigger.threshold)
              const currentValuations = this.getAssetValuations(schedule.assetId)
              if (currentValuations.length >= 2) {
                const recentValuation = currentValuations[currentValuations.length - 1]
                const previousValuation = currentValuations[currentValuations.length - 2]
                const actualChange = Math.abs(
                  (recentValuation.value - previousValuation.value) / previousValuation.value * 100
                )
                if (actualChange >= changePercent) {
                  return true
                }
              }
            }
            break

          case 'market_event':
            // Check for significant market changes
            const marketData = await this.oracleService.getLatestMarketData('S&P 500', 'yahoo_finance')
            if (marketData && Math.abs(marketData.changePercent24h) > trigger.threshold) {
              return true
            }
            break

          case 'asset_event':
            // Check for asset-specific events (maintenance, damage, etc.)
            // This would integrate with lifecycle service
            break
        }
      }

      return false
    } catch (error) {
      this.logger.error('Failed to check trigger conditions:', error)
      return false
    }
  }

  // ============ AUTOMATED VALUATION MODELS (AVM) ============

  /**
   * Initialize default AVM models
   */
  private initializeDefaultModels(): void {
    // Real estate AVM
    this.createAutomatedValuationModel({
      id: 'avm-real-estate-v1',
      name: 'Real Estate AVM',
      description: 'Automated valuation model for residential and commercial real estate',
      assetType: 'real_estate',
      version: '1.0.0',
      status: 'active',
      algorithm: {
        type: 'regression',
        framework: 'linear_regression',
        hyperparameters: {
          learning_rate: 0.01,
          iterations: 1000
        },
        featureEngineering: [
          {
            name: 'location_score',
            type: 'spatial',
            transformation: 'geohash_encoding',
            importance: 85
          },
          {
            name: 'property_features',
            type: 'categorical',
            transformation: 'one_hot_encoding',
            importance: 75
          },
          {
            name: 'market_trends',
            type: 'temporal',
            transformation: 'time_series_features',
            importance: 70
          }
        ],
        validationMethod: 'cross_validation'
      },
      parameters: {
        location_weight: 0.4,
        property_weight: 0.35,
        market_weight: 0.25,
        min_confidence: 0.7
      },
      trainingData: {
        datasetSize: 100000,
        features: 45,
        timeRange: {
          start: new Date('2020-01-01'),
          end: new Date('2024-01-01')
        },
        dataQuality: 85,
        geographicCoverage: ['US', 'CA', 'UK', 'DE'],
        assetTypes: ['residential', 'commercial']
      },
      performance: {
        rSquared: 0.82,
        meanAbsoluteError: 15000,
        rootMeanSquaredError: 25000,
        meanAbsolutePercentageError: 8.5,
        crossValidationScore: 0.81,
        backtestingResults: []
      },
      lastTrained: new Date('2024-01-01'),
      createdAt: new Date()
    })

    // Vehicle AVM
    this.createAutomatedValuationModel({
      id: 'avm-vehicle-v1',
      name: 'Vehicle AVM',
      description: 'Automated valuation model for automobiles',
      assetType: 'vehicle',
      version: '1.0.0',
      status: 'active',
      algorithm: {
        type: 'hybrid',
        framework: 'gradient_boosting',
        hyperparameters: {
          n_estimators: 100,
          max_depth: 6,
          learning_rate: 0.1
        },
        featureEngineering: [
          {
            name: 'vehicle_specs',
            type: 'categorical',
            transformation: 'ordinal_encoding',
            importance: 80
          },
          {
            name: 'condition_factors',
            type: 'numerical',
            transformation: 'standardization',
            importance: 75
          }
        ],
        validationMethod: 'train_test_split'
      },
      parameters: {
        make_model_weight: 0.5,
        condition_weight: 0.3,
        market_weight: 0.2
      },
      trainingData: {
        datasetSize: 50000,
        features: 25,
        timeRange: {
          start: new Date('2021-01-01'),
          end: new Date('2024-01-01')
        },
        dataQuality: 78,
        geographicCoverage: ['US', 'CA', 'UK', 'DE', 'JP'],
        assetTypes: ['sedan', 'suv', 'truck', 'sports_car']
      },
      performance: {
        rSquared: 0.89,
        meanAbsoluteError: 1200,
        rootMeanSquaredError: 1800,
        meanAbsolutePercentageError: 6.2,
        crossValidationScore: 0.88,
        backtestingResults: []
      },
      lastTrained: new Date('2024-01-01'),
      createdAt: new Date()
    })
  }

  /**
   * Create automated valuation model
   */
  createAutomatedValuationModel(model: AutomatedValuationModel): AutomatedValuationModel {
    const assetType = model.assetType

    if (!this.automatedModels.has(assetType)) {
      this.automatedModels.set(assetType, [])
    }

    this.automatedModels.get(assetType)!.push(model)

    this.emit('avm:model:created', { model })

    return model
  }

  /**
   * Perform AVM valuation
   */
  async performAVMValuation(
    assetId: string,
    assetType: string,
    assetData: Record<string, any>
  ): Promise<AssetValuation> {
    try {
      const models = this.automatedModels.get(assetType) || []
      const activeModel = models.find(m => m.status === 'active')

      if (!activeModel) {
        throw new Error(`No active AVM model found for asset type ${assetType}`)
      }

      // Perform AVM calculation (simplified)
      const avmValue = await this.calculateAVMValue(activeModel, assetData)
      const confidence = this.calculateAVMConfidence(activeModel, assetData)

      const valuation: AssetValuation = {
        id: `avm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        valuationType: 'periodic',
        valuationMethod: 'avm',
        value: avmValue,
        currency: 'USD', // Would be determined from asset
        valuationDate: new Date(),
        effectiveDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        confidence,
        status: 'approved',
        metadata: {
          source: `AVM-${activeModel.name}`,
          methodology: activeModel.algorithm.type,
          assumptions: activeModel.parameters,
          qualityScore: confidence,
          externalReferences: [`model-${activeModel.id}`]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Store valuation
      this.storeValuation(valuation)

      this.emit('avm:valuation:completed', { assetId, valuation, model: activeModel })

      return valuation
    } catch (error) {
      this.logger.error(`Failed to perform AVM valuation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Calculate AVM value (simplified implementation)
   */
  private async calculateAVMValue(model: AutomatedValuationModel, assetData: Record<string, any>): Promise<number> {
    try {
      // Simplified AVM calculation based on model type
      let baseValue = 100000 // Default base value

      switch (model.assetType) {
        case 'real_estate':
          baseValue = this.calculateRealEstateAVM(assetData)
          break
        case 'vehicle':
          baseValue = this.calculateVehicleAVM(assetData)
          break
        default:
          baseValue = 100000
      }

      // Apply market adjustments
      const marketAdjustment = await this.getMarketAdjustment(model.assetType)
      baseValue *= (1 + marketAdjustment / 100)

      return Math.round(baseValue)
    } catch (error) {
      this.logger.error('Failed to calculate AVM value:', error)
      throw error
    }
  }

  /**
   * Calculate real estate AVM value
   */
  private calculateRealEstateAVM(assetData: Record<string, any>): number {
    let value = 200000 // Base value

    // Location factor
    if (assetData.location?.city === 'New York') value *= 2.5
    else if (assetData.location?.city === 'San Francisco') value *= 2.0

    // Property size
    if (assetData.physicalCharacteristics?.dimensions) {
      const sqft = assetData.physicalCharacteristics.dimensions.length *
                  assetData.physicalCharacteristics.dimensions.width
      value *= (sqft / 2000) // Normalize to 2000 sqft
    }

    // Condition factor
    switch (assetData.physicalCharacteristics?.condition) {
      case 'excellent': value *= 1.1; break
      case 'good': value *= 1.0; break
      case 'fair': value *= 0.9; break
      case 'poor': value *= 0.7; break
    }

    return value
  }

  /**
   * Calculate vehicle AVM value
   */
  private calculateVehicleAVM(assetData: Record<string, any>): number {
    let value = 30000 // Base value

    // Age depreciation (5% per year)
    if (assetData.physicalCharacteristics?.age) {
      const depreciation = Math.pow(0.95, assetData.physicalCharacteristics.age)
      value *= depreciation
    }

    // Mileage depreciation (2% per 10k miles)
    if (assetData.physicalCharacteristics?.weight?.value) {
      const mileage = assetData.physicalCharacteristics.weight.value
      const mileageDepreciation = Math.pow(0.98, mileage / 10000)
      value *= mileageDepreciation
    }

    // Condition factor
    switch (assetData.physicalCharacteristics?.condition) {
      case 'excellent': value *= 1.05; break
      case 'good': value *= 1.0; break
      case 'fair': value *= 0.8; break
      case 'poor': value *= 0.6; break
    }

    return value
  }

  /**
   * Calculate AVM confidence
   */
  private calculateAVMConfidence(model: AutomatedValuationModel, assetData: Record<string, any>): number {
    let confidence = 70 // Base confidence

    // Data completeness factor
    const requiredFields = ['location', 'physicalCharacteristics']
    const completedFields = requiredFields.filter(field => assetData[field])
    confidence += (completedFields.length / requiredFields.length) * 20

    // Model performance factor
    confidence += model.performance.rSquared * 10

    return Math.min(confidence, 95)
  }

  /**
   * Get market adjustment factor
   */
  private async getMarketAdjustment(assetType: string): Promise<number> {
    try {
      // Get market data from oracle service
      const marketData = await this.oracleService.getLatestMarketData('S&P 500', 'yahoo_finance')
      if (marketData) {
        return marketData.changePercent24h * 0.5 // Dampened market impact
      }

      return 0
    } catch (error) {
      this.logger.error('Failed to get market adjustment:', error)
      return 0
    }
  }

  // ============ THIRD-PARTY APPRAISALS ============

  /**
   * Submit third-party appraisal
   */
  async submitThirdPartyAppraisal(appraisal: Omit<ThirdPartyAppraisal, 'id' | 'status'>): Promise<ThirdPartyAppraisal> {
    try {
      const fullAppraisal: ThirdPartyAppraisal = {
        ...appraisal,
        id: `appraisal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'submitted'
      }

      if (!this.thirdPartyAppraisals.has(appraisal.assetId)) {
        this.thirdPartyAppraisals.set(appraisal.assetId, [])
      }

      this.thirdPartyAppraisals.get(appraisal.assetId)!.push(fullAppraisal)

      this.emit('appraisal:submitted', { appraisal: fullAppraisal })

      return fullAppraisal
    } catch (error) {
      this.logger.error(`Failed to submit appraisal for ${appraisal.assetId}:`, error)
      throw error
    }
  }

  /**
   * Review third-party appraisal
   */
  async reviewThirdPartyAppraisal(
    appraisalId: string,
    reviewerAddress: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<ThirdPartyAppraisal> {
    try {
      // Find appraisal
      let appraisal: ThirdPartyAppraisal | null = null
      let assetId: string = ''

      for (const [asset, appraisals] of this.thirdPartyAppraisals) {
        const found = appraisals.find(a => a.id === appraisalId)
        if (found) {
          appraisal = found
          assetId = asset
          break
        }
      }

      if (!appraisal) {
        throw new Error(`Appraisal ${appraisalId} not found`)
      }

      // Update appraisal
      appraisal.status = decision
      appraisal.reviewedBy = reviewerAddress
      appraisal.reviewedAt = new Date()
      appraisal.reviewComments = comments

      if (decision === 'approved') {
        // Create valuation from appraisal
        const valuation = await this.createValuationFromAppraisal(appraisal)
        this.emit('appraisal:approved', { appraisal, valuation })
      } else {
        this.emit('appraisal:rejected', { appraisal })
      }

      return appraisal
    } catch (error) {
      this.logger.error(`Failed to review appraisal ${appraisalId}:`, error)
      throw error
    }
  }

  /**
   * Create valuation from approved appraisal
   */
  private async createValuationFromAppraisal(appraisal: ThirdPartyAppraisal): Promise<AssetValuation> {
    try {
      const valuation = await this.performValuation(appraisal.assetId, {
        method: 'appraisal',
        type: 'periodic',
        valuationDate: appraisal.appraisalDate,
        effectiveDate: appraisal.reportDate,
        source: appraisal.appraiserName,
        metadata: {
          source: appraisal.appraiserName,
          methodology: appraisal.methodology,
          assumptions: appraisal.assumptions,
          qualityScore: appraisal.confidence,
          externalReferences: appraisal.attachments.map(a => a.url)
        }
      })

      return valuation
    } catch (error) {
      this.logger.error('Failed to create valuation from appraisal:', error)
      throw error
    }
  }

  // ============ MARKET-BASED VALUATION ============

  /**
   * Perform market-based valuation using comparables
   */
  async performMarketBasedValuation(
    assetId: string,
    comparableAssets: string[],
    marketData: Record<string, any>
  ): Promise<AssetValuation> {
    try {
      const comparables = await this.getComparableAssets(assetId, comparableAssets)
      const marketAdjustment = await this.calculateMarketAdjustment(marketData)

      // Calculate weighted average of comparables
      let totalWeightedValue = 0
      let totalWeight = 0

      for (const comparable of comparables) {
        const weight = comparable.similarityScore / 100
        const adjustedValue = comparable.adjustedValue * (1 + marketAdjustment / 100)

        totalWeightedValue += adjustedValue * weight
        totalWeight += weight
      }

      const marketValue = totalWeight > 0 ? totalWeightedValue / totalWeight : 0

      const valuation = await this.performValuation(assetId, {
        method: 'comparable_sales',
        type: 'periodic',
        valuationDate: new Date(),
        effectiveDate: new Date(),
        source: 'market_comparables',
        metadata: {
          source: 'market_analysis',
          methodology: 'comparable_sales_approach',
          comparables,
          marketAdjustment,
          qualityScore: 85,
          externalReferences: comparableAssets
        }
      })

      // Override value with market calculation
      valuation.value = marketValue
      valuation.confidence = this.calculateMarketConfidence(comparables)

      return valuation
    } catch (error) {
      this.logger.error(`Failed to perform market-based valuation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get comparable assets
   */
  private async getComparableAssets(assetId: string, comparableIds: string[]): Promise<ComparableAsset[]> {
    try {
      // In a real implementation, this would query a database of comparable transactions
      // For now, return mock comparables
      const comparables: ComparableAsset[] = []

      for (const comparableId of comparableIds) {
        comparables.push({
          id: comparableId,
          assetId: comparableId,
          transactionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          transactionValue: 150000 + Math.random() * 100000,
          similarityScore: 70 + Math.random() * 25, // 70-95%
          adjustmentFactors: {
            location: Math.random() * 20 - 10, // -10% to +10%
            condition: Math.random() * 15 - 7.5, // -7.5% to +7.5%
            size: Math.random() * 10 - 5 // -5% to +5%
          },
          adjustedValue: 160000 + Math.random() * 80000
        })
      }

      return comparables
    } catch (error) {
      this.logger.error('Failed to get comparable assets:', error)
      throw error
    }
  }

  /**
   * Calculate market adjustment
   */
  private async calculateMarketAdjustment(marketData: Record<string, any>): Promise<number> {
    try {
      // Calculate adjustment based on market indicators
      let adjustment = 0

      if (marketData.price_index) {
        adjustment += marketData.price_index - 100 // Percentage change from base
      }

      if (marketData.interest_rate) {
        adjustment -= marketData.interest_rate * 0.5 // Interest rate impact
      }

      return adjustment
    } catch (error) {
      this.logger.error('Failed to calculate market adjustment:', error)
      return 0
    }
  }

  /**
   * Calculate market confidence
   */
  private calculateMarketConfidence(comparables: ComparableAsset[]): number {
    if (comparables.length === 0) return 0

    const avgSimilarity = comparables.reduce((sum, comp) => sum + comp.similarityScore, 0) / comparables.length
    const recencyFactor = 0.8 // Assume recent comparables

    return Math.min(avgSimilarity * recencyFactor, 90)
  }

  // ============ VALUATION HISTORY TRACKING ============

  /**
   * Get asset valuation history
   */
  getAssetValuationHistory(assetId: string): ValuationHistory {
    const valuations = this.getAssetValuations(assetId)

    // Calculate trends
    const trends = this.calculateValuationTrends(valuations)

    // Calculate volatility (coefficient of variation)
    const values = valuations.map(v => v.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const volatility = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0

    return {
      assetId,
      valuations,
      trends,
      volatility,
      totalValuations: valuations.length,
      lastUpdated: new Date()
    }
  }

  /**
   * Calculate valuation trends
   */
  private calculateValuationTrends(valuations: AssetValuation[]): ValuationTrend[] {
    if (valuations.length < 2) return []

    const trends: ValuationTrend[] = []
    const sortedValuations = valuations.sort((a, b) => a.valuationDate.getTime() - b.valuationDate.getTime())

    // Calculate quarterly trends
    const quarterlyTrends = this.groupValuationsByQuarter(sortedValuations)

    for (const [quarter, quarterValuations] of quarterlyTrends) {
      if (quarterValuations.length >= 2) {
        const startValue = quarterValuations[0].value
        const endValue = quarterValuations[quarterValuations.length - 1].value
        const change = endValue - startValue
        const changePercent = startValue > 0 ? (change / startValue) * 100 : 0

        let trend: ValuationTrend['trend'] = 'stable'
        if (Math.abs(changePercent) > 10) {
          trend = changePercent > 0 ? 'increasing' : 'decreasing'
        } else if (Math.abs(changePercent) > 5) {
          trend = 'volatile'
        }

        trends.push({
          period: {
            start: quarterValuations[0].valuationDate,
            end: quarterValuations[quarterValuations.length - 1].valuationDate
          },
          startValue,
          endValue,
          change,
          changePercent,
          trend,
          drivers: this.identifyTrendDrivers(quarterValuations)
        })
      }
    }

    return trends
  }

  /**
   * Group valuations by quarter
   */
  private groupValuationsByQuarter(valuations: AssetValuation[]): Map<string, AssetValuation[]> {
    const quarters = new Map<string, AssetValuation[]>()

    for (const valuation of valuations) {
      const year = valuation.valuationDate.getFullYear()
      const quarter = Math.floor(valuation.valuationDate.getMonth() / 3) + 1
      const key = `${year}-Q${quarter}`

      if (!quarters.has(key)) {
        quarters.set(key, [])
      }

      quarters.get(key)!.push(valuation)
    }

    return quarters
  }

  /**
   * Identify trend drivers
   */
  private identifyTrendDrivers(valuations: AssetValuation[]): string[] {
    const drivers: string[] = []

    // Analyze method changes
    const methods = [...new Set(valuations.map(v => v.valuationMethod))]
    if (methods.length > 1) {
      drivers.push('valuation_method_changes')
    }

    // Analyze confidence changes
    const avgConfidence = valuations.reduce((sum, v) => sum + v.confidence, 0) / valuations.length
    if (avgConfidence < 70) {
      drivers.push('low_confidence_valuations')
    }

    // Analyze market timing
    const hasMarketBased = valuations.some(v => v.valuationMethod === 'market_data')
    if (hasMarketBased) {
      drivers.push('market_conditions')
    }

    return drivers.length > 0 ? drivers : ['natural_market_fluctuations']
  }

  // ============ UTILITY METHODS ============

  /**
   * Perform core valuation logic
   */
  private async performValuation(
    assetId: string,
    params: {
      method: ValuationMethod
      type: ValuationType
      valuationDate: Date
      effectiveDate: Date
      source: string
      currency?: string
      metadata?: Partial<ValuationMetadata>
    }
  ): Promise<AssetValuation> {
    try {
      let value = 0
      let confidence = 0

      // Calculate value based on method
      switch (params.method) {
        case 'avm':
          const avmResult = await this.performAVMValuation(assetId, 'real_estate', {}) // Would get asset type
          value = avmResult.value
          confidence = avmResult.confidence
          break

        case 'oracle_feed':
          const oracleData = await this.oracleService.getOraclePrice('eth-usd')
          value = parseFloat(oracleData.price) * 1000 // Mock conversion
          confidence = oracleData.confidence
          break

        default:
          // Mock value calculation
          value = 100000 + Math.random() * 50000
          confidence = 75
      }

      const valuation: AssetValuation = {
        id: `valuation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        valuationType: params.type,
        valuationMethod: params.method,
        value: Math.round(value),
        currency: params.currency || 'USD',
        valuationDate: params.valuationDate,
        effectiveDate: params.effectiveDate,
        confidence,
        status: 'approved',
        metadata: {
          source: params.source,
          methodology: params.method,
          assumptions: {},
          qualityScore: confidence,
          ...params.metadata
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.storeValuation(valuation)

      return valuation
    } catch (error) {
      this.logger.error(`Failed to perform valuation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Store valuation
   */
  private storeValuation(valuation: AssetValuation): void {
    if (!this.valuations.has(valuation.assetId)) {
      this.valuations.set(valuation.assetId, [])
    }

    this.valuations.get(valuation.assetId)!.push(valuation)
  }

  /**
   * Get asset valuations
   */
  getAssetValuations(assetId: string): AssetValuation[] {
    const valuations = this.valuations.get(assetId) || []
    return valuations.sort((a, b) => b.valuationDate.getTime() - a.valuationDate.getTime())
  }

  /**
   * Get latest valuation
   */
  getLatestValuation(assetId: string): AssetValuation | null {
    const valuations = this.getAssetValuations(assetId)
    return valuations.length > 0 ? valuations[0] : null
  }

  /**
   * Get active schedule
   */
  private getActiveSchedule(assetId: string): ValuationSchedule | null {
    const schedules = this.valuationSchedules.get(assetId) || []
    return schedules.find(s => s.isActive) || null
  }

  /**
   * Calculate next valuation date
   */
  private calculateNextValuationDate(frequency: ValuationFrequency, customDays?: number): Date {
    const now = new Date()

    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())
      case 'semi_annual':
        return new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
      case 'annual':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
      case 'custom':
        return new Date(now.getTime() + (customDays || 30) * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    }
  }

  /**
   * Get default trigger conditions
   */
  private getDefaultTriggers(frequency: ValuationFrequency): ValuationTrigger[] {
    const triggers: ValuationTrigger[] = []

    // Time-based trigger is always included
    triggers.push({
      type: 'time_based',
      threshold: frequency,
      operator: 'eq',
      description: `Scheduled ${frequency} revaluation`
    })

    // Add value change trigger for monthly+ frequencies
    if (['monthly', 'quarterly', 'semi_annual', 'annual'].includes(frequency)) {
      triggers.push({
        type: 'value_change',
        threshold: 10, // 10% change
        operator: 'pct_change',
        description: 'Significant value change trigger'
      })
    }

    return triggers
  }

  /**
   * Start automated revaluation
   */
  private startAutomatedRevaluation(schedule: ValuationSchedule): void {
    // Calculate interval in milliseconds
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
        await this.performPeriodicRevaluation(schedule.assetId)
      } catch (error) {
        this.logger.error(`Automated revaluation failed for ${schedule.assetId}:`, error)
      }
    }, intervalMs)

    this.revaluationIntervals.set(schedule.id, interval)
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
        totalValuations: Array.from(this.valuations.values()).flat().length,
        activeSchedules: Array.from(this.valuationSchedules.values()).flat().filter(s => s.isActive).length,
        automatedModels: Array.from(this.automatedModels.values()).flat().filter(m => m.status === 'active').length,
        pendingAppraisals: Array.from(this.thirdPartyAppraisals.values()).flat().filter(a => a.status === 'submitted').length,
        revaluationIntervals: this.revaluationIntervals.size
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.valuations.clear()
    this.automatedModels.clear()
    this.thirdPartyAppraisals.clear()
    this.valuationSchedules.clear()
    this.valuationRequests.clear()

    // Clear intervals
    for (const interval of this.revaluationIntervals.values()) {
      clearInterval(interval)
    }
    this.revaluationIntervals.clear()

    this.logger.info('All asset valuation data cleared')
  }
}

export default AssetValuationService
