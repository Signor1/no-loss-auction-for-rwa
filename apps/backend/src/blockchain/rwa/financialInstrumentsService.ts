import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetValuationService from './assetValuationService'
import AssetLifecycleService from './assetLifecycleService'
import logger from '../../utils/logger'

// Financial Instruments interfaces
export interface FinancialInstrument {
  id: string
  assetId: string
  instrumentType: InstrumentType
  issuer: InstrumentIssuer
  holder: InstrumentHolder
  faceValue: number
  currency: string
  issueDate: Date
  maturityDate: Date
  status: InstrumentStatus
  terms: InstrumentTerms
  valuation: InstrumentValuation
  payments: PaymentRecord[]
  ratings: CreditRating[]
  compliance: RegulatoryCompliance
  metadata: InstrumentMetadata
  createdAt: Date
  updatedAt: Date
}

export interface InstrumentTerms {
  interestRate: InterestRateStructure
  paymentSchedule: PaymentSchedule
  redemption: RedemptionTerms
  covenants: Covenant[]
  guarantees: Guarantee[]
  collateral?: CollateralInfo
  seniority: SeniorityLevel
  tranching?: TrancheStructure[]
}

export interface PaymentRecord {
  id: string
  paymentDate: Date
  dueDate: Date
  paymentType: PaymentType
  amount: number
  principal: number
  interest: number
  fees: number
  status: PaymentStatus
  transactionHash?: string
  blockNumber?: number
  paidBy: string
  paidTo: string
  reference: string
  notes?: string
}

export interface CreditRating {
  id: string
  ratingAgency: RatingAgency
  rating: CreditRatingGrade
  outlook: RatingOutlook
  ratingDate: Date
  expiryDate?: Date
  rationale: string
  factors: RatingFactor[]
  surveillance: RatingSurveillance
  reportUrl?: string
  status: RatingStatus
}

export interface RegulatoryCompliance {
  jurisdiction: string[]
  regulations: ApplicableRegulation[]
  registration: RegistrationInfo
  reporting: ReportingRequirements
  complianceStatus: ComplianceStatus
  violations: ComplianceViolation[]
  audits: ComplianceAudit[]
  certifications: ComplianceCertification[]
}

export interface InstrumentIssuer {
  name: string
  type: 'corporate' | 'government' | 'municipal' | 'supranational' | 'financial_institution'
  legalEntity: string
  jurisdiction: string
  creditRating?: string
  financials: IssuerFinancials
  contact: IssuerContact
}

export interface InstrumentHolder {
  name: string
  type: 'individual' | 'institution' | 'fund' | 'pension' | 'insurance'
  jurisdiction: string
  taxId?: string
  contact: HolderContact
  holdings: HoldingInfo
}

export interface InterestRateStructure {
  type: 'fixed' | 'floating' | 'step_up' | 'step_down' | 'zero_coupon'
  rate: number
  dayCount: DayCountConvention
  paymentFrequency: PaymentFrequency
  resetFrequency?: ResetFrequency
  benchmark?: BenchmarkRate
  spread?: number
  cap?: number
  floor?: number
  referenceRate?: string
}

export interface PaymentSchedule {
  scheduleType: 'bullet' | 'amortizing' | 'annuity' | 'custom'
  paymentDates: Date[]
  paymentAmounts: number[]
  remainingBalance: number[]
  totalPayments: number
  nextPaymentDate: Date
  finalPaymentDate: Date
  gracePeriod: number
  latePaymentPenalty: number
}

export interface RedemptionTerms {
  callable: boolean
  callSchedule?: CallSchedule[]
  puttable: boolean
  putSchedule?: PutSchedule[]
  sinkingFund?: SinkingFund
  conversion?: ConversionTerms
  earlyRedemptionPenalty?: number
}

export interface Covenant {
  type: 'affirmative' | 'negative' | 'financial'
  description: string
  condition: string
  consequence: string
  monitoring: CovenantMonitoring
  status: 'active' | 'breached' | 'waived'
}

export interface Guarantee {
  type: 'personal' | 'corporate' | 'insurance' | 'collateral'
  guarantor: string
  coverage: number
  conditions: string[]
  expiryDate?: Date
  status: 'active' | 'expired' | 'called'
}

export interface CollateralInfo {
  type: 'real_estate' | 'securities' | 'cash' | 'other'
  description: string
  value: number
  valuationDate: Date
  lienPosition: number
  coverageRatio: number
}

export interface TrancheStructure {
  trancheId: string
  name: string
  size: number
  percentage: number
  seniority: SeniorityLevel
  coupon: number
  maturity: Date
  rating: string
}

export interface InstrumentValuation {
  currentValue: number
  faceValue: number
  marketPrice?: number
  bookValue: number
  fairValue: number
  accruedInterest: number
  unrealizedGainLoss: number
  valuationDate: Date
  valuationMethod: ValuationMethod
  discountRate?: number
  yieldToMaturity: number
  duration: number
  convexity: number
}

export interface InstrumentMetadata {
  isin?: string
  cusip?: string
  sedol?: string
  ticker?: string
  prospectusUrl?: string
  indentureUrl?: string
  offeringMemorandumUrl?: string
  ratingReports: string[]
  legalDocuments: string[]
  blockchainRecords: BlockchainRecord[]
}

export interface IssuerFinancials {
  totalAssets: number
  totalLiabilities: number
  equity: number
  revenue: number
  netIncome: number
  debtRatio: number
  interestCoverage: number
  lastReported: Date
  auditor: string
}

export interface IssuerContact {
  address: string
  phone: string
  email: string
  website?: string
  primaryContact: string
}

export interface HolderContact {
  address: string
  phone: string
  email: string
  authorizedSignatories: string[]
}

export interface HoldingInfo {
  quantity: number
  acquisitionDate: Date
  acquisitionPrice: number
  costBasis: number
  unrealizedGainLoss: number
}

export interface RatingAgency {
  name: string
  type: 'global' | 'regional' | 'national'
  accreditation: string[]
  reputation: number // 0-100
  contact: string
}

export interface RatingFactor {
  factor: string
  weight: number
  score: number
  impact: 'positive' | 'negative' | 'neutral'
}

export interface RatingSurveillance {
  frequency: 'annual' | 'semi_annual' | 'quarterly'
  lastReview: Date
  nextReview: Date
  triggers: string[]
}

export interface ApplicableRegulation {
  name: string
  jurisdiction: string
  requirements: string[]
  complianceOfficer: string
  status: 'compliant' | 'non_compliant' | 'pending'
}

export interface RegistrationInfo {
  registered: boolean
  registrationType: 'SEC' | 'FINRA' | 'state' | 'international'
  registrationNumber: string
  registrationDate: Date
  expiryDate?: Date
  prospectusFiled: boolean
}

export interface ReportingRequirements {
  frequency: 'annual' | 'quarterly' | 'monthly'
  reports: string[]
  filingDeadline: number // days after period end
  regulator: string
  lastFiled: Date
  nextDue: Date
}

export interface ComplianceViolation {
  date: Date
  regulation: string
  description: string
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  remediation: string
  status: 'open' | 'remediated' | 'dismissed'
  fine?: number
}

export interface ComplianceAudit {
  auditDate: Date
  auditor: string
  scope: string
  findings: string[]
  recommendations: string[]
  status: 'passed' | 'conditional' | 'failed'
  reportUrl?: string
}

export interface ComplianceCertification {
  certification: string
  issuedBy: string
  issueDate: Date
  expiryDate: Date
  status: 'active' | 'expired' | 'revoked'
}

export interface CallSchedule {
  callDate: Date
  callPrice: number
  conditions: string[]
}

export interface PutSchedule {
  putDate: Date
  putPrice: number
  conditions: string[]
}

export interface SinkingFund {
  required: boolean
  schedule: SinkingFundPayment[]
  purpose: string
  trustee: string
}

export interface ConversionTerms {
  convertible: boolean
  conversionRatio: number
  conversionPrice: number
  conversionPeriod: {
    start: Date
    end: Date
  }
  antiDilution: boolean
}

export interface CovenantMonitoring {
  metric: string
  threshold: number
  currentValue: number
  status: 'compliant' | 'breached' | 'warning'
  lastChecked: Date
}

export interface SinkingFundPayment {
  paymentDate: Date
  amount: number
  method: 'purchase' | 'redemption'
}

export interface BlockchainRecord {
  transactionHash: string
  blockNumber: number
  timestamp: Date
  recordType: 'issuance' | 'transfer' | 'payment' | 'redemption'
  details: string
}

export type InstrumentType =
  | 'bond' | 'debenture' | 'note' | 'certificate_of_deposit'
  | 'commercial_paper' | 'mortgage_backed_security' | 'asset_backed_security'
  | 'structured_note' | 'convertible_bond' | 'preferred_stock'
  | 'derivative' | 'warrant' | 'right'

export type InstrumentStatus =
  | 'issued' | 'active' | 'called' | 'matured' | 'defaulted' | 'restructured'

export type PaymentType =
  | 'interest' | 'principal' | 'fee' | 'penalty' | 'premium' | 'dividend'

export type PaymentStatus =
  | 'scheduled' | 'due' | 'paid' | 'overdue' | 'defaulted' | 'waived'

export type CreditRatingGrade =
  | 'AAA' | 'AA+' | 'AA' | 'AA-' | 'A+' | 'A' | 'A-' | 'BBB+' | 'BBB' | 'BBB-'
  | 'BB+' | 'BB' | 'BB-' | 'B+' | 'B' | 'B-' | 'CCC+' | 'CCC' | 'CCC-' | 'CC' | 'C' | 'D'

export type RatingOutlook =
  | 'stable' | 'positive' | 'negative' | 'developing' | 'under_review'

export type RatingStatus =
  | 'active' | 'withdrawn' | 'suspended' | 'expired'

export type ComplianceStatus =
  | 'compliant' | 'under_review' | 'non_compliant' | 'remediated'

export type DayCountConvention =
  | '30/360' | 'actual/360' | 'actual/365' | 'actual/actual'

export type PaymentFrequency =
  | 'annual' | 'semi_annual' | 'quarterly' | 'monthly' | 'weekly' | 'daily' | 'bullet'

export type ResetFrequency =
  | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual'

export type BenchmarkRate =
  | 'LIBOR' | 'SOFR' | 'FEDFUNDS' | 'PRIME' | 'TREASURY' | 'SWAP_RATE'

export type SeniorityLevel =
  | 'senior_secured' | 'senior_unsecured' | 'subordinated' | 'junior_subordinated'

export type ValuationMethod =
  | 'market_price' | 'discounted_cash_flow' | 'yield_to_maturity' | 'comparable_analysis'

/**
 * Financial Instruments Service for RWA Tokenization
 * Comprehensive financial instrument management with type classification,
 * maturity management, interest rate structures, payment schedules,
 * credit ratings, and regulatory compliance
 */
export class FinancialInstrumentsService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private valuationService: AssetValuationService
  private lifecycleService: AssetLifecycleService

  // Data storage
  private financialInstruments: Map<string, FinancialInstrument> = new Map()
  private paymentSchedules: Map<string, PaymentRecord[]> = new Map()
  private creditRatings: Map<string, CreditRating[]> = new Map()
  private complianceRecords: Map<string, RegulatoryCompliance> = new Map()

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

  // ============ FINANCIAL INSTRUMENT CREATION ============

  /**
   * Create comprehensive financial instrument
   */
  async createFinancialInstrument(
    assetId: string,
    instrumentData: Omit<FinancialInstrument, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<FinancialInstrument> {
    try {
      const instrument: FinancialInstrument = {
        id: `instrument-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...instrumentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.financialInstruments.set(assetId, instrument)

      // Update digital twin with instrument data
      await this.updateDigitalTwinInstrument(assetId, instrument)

      this.emit('instrument:created', { instrument })

      return instrument
    } catch (error) {
      this.logger.error(`Failed to create financial instrument for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update financial instrument
   */
  async updateFinancialInstrument(
    assetId: string,
    updates: Partial<Omit<FinancialInstrument, 'id' | 'assetId' | 'createdAt'>>
  ): Promise<FinancialInstrument> {
    try {
      const existing = this.financialInstruments.get(assetId)
      if (!existing) {
        throw new Error(`Financial instrument not found for ${assetId}`)
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      }

      this.financialInstruments.set(assetId, updated)

      // Update digital twin
      await this.updateDigitalTwinInstrument(assetId, updated)

      this.emit('instrument:updated', { instrument: updated })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update financial instrument for ${assetId}:`, error)
      throw error
    }
  }

  // ============ PAYMENT MANAGEMENT ============

  /**
   * Record payment
   */
  async recordPayment(
    assetId: string,
    paymentData: Omit<PaymentRecord, 'id'>
  ): Promise<PaymentRecord> {
    try {
      const payment: PaymentRecord = {
        id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...paymentData
      }

      if (!this.paymentSchedules.has(assetId)) {
        this.paymentSchedules.set(assetId, [])
      }

      this.paymentSchedules.get(assetId)!.push(payment)

      // Update instrument valuation if payment affects it
      const instrument = this.financialInstruments.get(assetId)
      if (instrument) {
        instrument.valuation.accruedInterest = this.calculateAccruedInterest(instrument)
        await this.updateFinancialInstrument(assetId, { valuation: instrument.valuation })
      }

      this.emit('payment:recorded', { payment })

      return payment
    } catch (error) {
      this.logger.error(`Failed to record payment for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Generate payment schedule
   */
  generatePaymentSchedule(
    instrument: FinancialInstrument
  ): PaymentSchedule {
    const { terms, faceValue, issueDate, maturityDate } = instrument
    const { interestRate, paymentFrequency } = terms.interestRate

    const payments: Date[] = []
    const amounts: number[] = []
    const balances: number[] = []

    let currentDate = new Date(issueDate)
    let remainingBalance = faceValue

    // Calculate payment frequency in months
    const frequencyMonths = this.getFrequencyInMonths(paymentFrequency)

    // Generate payment dates
    while (currentDate <= maturityDate) {
      payments.push(new Date(currentDate))

      // Calculate payment amount based on schedule type
      let paymentAmount = 0

      switch (terms.paymentSchedule.scheduleType) {
        case 'bullet':
          if (currentDate.getTime() === maturityDate.getTime()) {
            paymentAmount = remainingBalance + this.calculateInterestPayment(remainingBalance, interestRate, frequencyMonths)
          } else {
            paymentAmount = this.calculateInterestPayment(remainingBalance, interestRate, frequencyMonths)
          }
          break

        case 'amortizing':
          const totalPayments = Math.ceil((maturityDate.getTime() - issueDate.getTime()) / (frequencyMonths * 30 * 24 * 60 * 60 * 1000))
          const periodicRate = interestRate / (12 / frequencyMonths)
          paymentAmount = (remainingBalance * periodicRate * Math.pow(1 + periodicRate, totalPayments)) /
                         (Math.pow(1 + periodicRate, totalPayments) - 1)
          break

        case 'annuity':
          // Similar to amortizing but for annuity payments
          paymentAmount = this.calculateAnnuityPayment(remainingBalance, interestRate, frequencyMonths,
                                                     (maturityDate.getTime() - currentDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
          break
      }

      amounts.push(paymentAmount)

      // Update remaining balance
      if (terms.paymentSchedule.scheduleType === 'amortizing') {
        const interestPayment = this.calculateInterestPayment(remainingBalance, interestRate, frequencyMonths)
        const principalPayment = paymentAmount - interestPayment
        remainingBalance -= principalPayment
      }

      balances.push(remainingBalance)

      // Move to next payment date
      currentDate.setMonth(currentDate.getMonth() + frequencyMonths)
    }

    return {
      scheduleType: terms.paymentSchedule.scheduleType,
      paymentDates: payments,
      paymentAmounts: amounts,
      remainingBalance: balances,
      totalPayments: payments.length,
      nextPaymentDate: payments.find(date => date > new Date()) || maturityDate,
      finalPaymentDate: maturityDate,
      gracePeriod: 30, // Default 30 days
      latePaymentPenalty: 0.05 // 5% penalty
    }
  }

  /**
   * Get upcoming payments
   */
  getUpcomingPayments(assetId: string, daysAhead: number = 30): PaymentRecord[] {
    const payments = this.paymentSchedules.get(assetId) || []
    const cutoffDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)

    return payments
      .filter(payment => payment.dueDate <= cutoffDate && payment.status === 'scheduled')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  // ============ CREDIT RATING MANAGEMENT ============

  /**
   * Add credit rating
   */
  async addCreditRating(
    assetId: string,
    ratingData: Omit<CreditRating, 'id'>
  ): Promise<CreditRating> {
    try {
      const rating: CreditRating = {
        id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...ratingData
      }

      if (!this.creditRatings.has(assetId)) {
        this.creditRatings.set(assetId, [])
      }

      this.creditRatings.get(assetId)!.push(rating)

      // Update instrument with latest rating
      const instrument = this.financialInstruments.get(assetId)
      if (instrument) {
        const latestRating = this.getLatestRating(assetId)
        if (latestRating) {
          // Update instrument valuation based on rating
          instrument.valuation = this.adjustValuationForRating(instrument.valuation, latestRating)
          await this.updateFinancialInstrument(assetId, { valuation: instrument.valuation })
        }
      }

      this.emit('rating:added', { rating })

      return rating
    } catch (error) {
      this.logger.error(`Failed to add credit rating for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get latest rating
   */
  getLatestRating(assetId: string): CreditRating | null {
    const ratings = this.creditRatings.get(assetId) || []
    return ratings.sort((a, b) => b.ratingDate.getTime() - a.ratingDate.getTime())[0] || null
  }

  /**
   * Get rating history
   */
  getRatingHistory(assetId: string): CreditRating[] {
    const ratings = this.creditRatings.get(assetId) || []
    return ratings.sort((a, b) => b.ratingDate.getTime() - a.ratingDate.getTime())
  }

  // ============ REGULATORY COMPLIANCE ============

  /**
   * Setup regulatory compliance
   */
  async setupRegulatoryCompliance(
    assetId: string,
    complianceData: RegulatoryCompliance
  ): Promise<RegulatoryCompliance> {
    try {
      this.complianceRecords.set(assetId, complianceData)

      this.emit('compliance:setup', { compliance: complianceData })

      return complianceData
    } catch (error) {
      this.logger.error(`Failed to setup regulatory compliance for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    assetId: string,
    updates: Partial<RegulatoryCompliance>
  ): Promise<RegulatoryCompliance> {
    try {
      const existing = this.complianceRecords.get(assetId)
      if (!existing) {
        throw new Error(`Regulatory compliance not found for ${assetId}`)
      }

      const updated = { ...existing, ...updates }
      this.complianceRecords.set(assetId, updated)

      this.emit('compliance:updated', { compliance: updated })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update compliance status for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Record compliance violation
   */
  async recordComplianceViolation(
    assetId: string,
    violation: Omit<ComplianceViolation, 'status'>
  ): Promise<ComplianceViolation> {
    try {
      const compliance = this.complianceRecords.get(assetId)
      if (!compliance) {
        throw new Error(`Regulatory compliance not found for ${assetId}`)
      }

      const violationRecord: ComplianceViolation = {
        ...violation,
        status: 'open'
      }

      compliance.violations.push(violationRecord)

      // Update compliance status
      compliance.complianceStatus = 'non_compliant'
      await this.updateComplianceStatus(assetId, { complianceStatus: 'non_compliant' })

      this.emit('violation:recorded', { violation: violationRecord })

      return violationRecord
    } catch (error) {
      this.logger.error(`Failed to record compliance violation for ${assetId}:`, error)
      throw error
    }
  }

  // ============ INTEREST RATE MANAGEMENT ============

  /**
   * Calculate interest payment
   */
  calculateInterestPayment(principal: number, rate: number, periodMonths: number): number {
    return principal * (rate / 100) * (periodMonths / 12)
  }

  /**
   * Calculate annuity payment
   */
  calculateAnnuityPayment(principal: number, rate: number, frequencyMonths: number, remainingPeriods: number): number {
    const periodicRate = rate / 100 / (12 / frequencyMonths)
    return principal * (periodicRate * Math.pow(1 + periodicRate, remainingPeriods)) /
           (Math.pow(1 + periodicRate, remainingPeriods) - 1)
  }

  /**
   * Calculate accrued interest
   */
  calculateAccruedInterest(instrument: FinancialInstrument): number {
    const payments = this.paymentSchedules.get(instrument.assetId) || []
    const lastPayment = payments
      .filter(p => p.status === 'paid')
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0]

    if (!lastPayment) return 0

    const daysSinceLastPayment = (Date.now() - lastPayment.paymentDate.getTime()) / (1000 * 60 * 60 * 24)
    const dailyRate = instrument.terms.interestRate.rate / 100 / 365

    return instrument.valuation.bookValue * dailyRate * daysSinceLastPayment
  }

  /**
   * Get frequency in months
   */
  private getFrequencyInMonths(frequency: PaymentFrequency): number {
    switch (frequency) {
      case 'annual': return 12
      case 'semi_annual': return 6
      case 'quarterly': return 3
      case 'monthly': return 1
      case 'weekly': return 0.25
      case 'daily': return 1/30
      case 'bullet': return 0 // Special handling
      default: return 12
    }
  }

  // ============ VALUATION ADJUSTMENTS ============

  /**
   * Adjust valuation for credit rating
   */
  private adjustValuationForRating(
    valuation: InstrumentValuation,
    rating: CreditRating
  ): InstrumentValuation {
    // Simplified rating adjustment - would use more sophisticated model
    let ratingMultiplier = 1.0

    switch (rating.rating) {
      case 'AAA': ratingMultiplier = 1.0; break
      case 'AA+':
      case 'AA':
      case 'AA-': ratingMultiplier = 0.98; break
      case 'A+':
      case 'A':
      case 'A-': ratingMultiplier = 0.95; break
      case 'BBB+':
      case 'BBB':
      case 'BBB-': ratingMultiplier = 0.90; break
      case 'BB+':
      case 'BB':
      case 'BB-': ratingMultiplier = 0.80; break
      default: ratingMultiplier = 0.70; break
    }

    return {
      ...valuation,
      currentValue: valuation.fairValue * ratingMultiplier,
      yieldToMaturity: valuation.yieldToMaturity + (1 - ratingMultiplier) * 200 // basis points
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Update digital twin with instrument data
   */
  private async updateDigitalTwinInstrument(assetId: string, instrument: FinancialInstrument): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        // Update instrument details in digital twin
        this.emit('digitalTwin:instrumentUpdate', {
          twinId: twin.id,
          instrument
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin instrument for ${assetId}:`, error)
    }
  }

  /**
   * Get comprehensive instrument overview
   */
  getInstrumentOverview(assetId: string): {
    instrument: FinancialInstrument | null
    paymentSchedule: PaymentRecord[]
    creditRatings: CreditRating[]
    upcomingPayments: PaymentRecord[]
    complianceStatus: RegulatoryCompliance | null
    maturityStatus: 'current' | 'approaching' | 'matured' | 'defaulted'
    healthScore: number
  } {
    const instrument = this.financialInstruments.get(assetId) || null
    const paymentSchedule = this.paymentSchedules.get(assetId) || []
    const creditRatings = this.getRatingHistory(assetId)
    const upcomingPayments = this.getUpcomingPayments(assetId)
    const complianceStatus = this.complianceRecords.get(assetId) || null

    let maturityStatus: 'current' | 'approaching' | 'matured' | 'defaulted' = 'current'
    let healthScore = 100

    if (instrument) {
      const daysToMaturity = (instrument.maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

      if (daysToMaturity < 0) {
        maturityStatus = 'matured'
        healthScore -= 50
      } else if (daysToMaturity < 90) {
        maturityStatus = 'approaching'
        healthScore -= 20
      }

      if (instrument.status === 'defaulted') {
        maturityStatus = 'defaulted'
        healthScore -= 100
      }

      // Rating impact
      const latestRating = this.getLatestRating(assetId)
      if (latestRating) {
        const ratingScore = this.convertRatingToScore(latestRating.rating)
        healthScore = Math.min(healthScore, ratingScore)
      }

      // Compliance impact
      if (complianceStatus && complianceStatus.complianceStatus === 'non_compliant') {
        healthScore -= 30
      }

      // Payment status impact
      const overduePayments = paymentSchedule.filter(p => p.status === 'overdue').length
      healthScore -= overduePayments * 10
    }

    return {
      instrument,
      paymentSchedule,
      creditRatings,
      upcomingPayments,
      complianceStatus,
      maturityStatus,
      healthScore: Math.max(0, healthScore)
    }
  }

  /**
   * Convert rating to score
   */
  private convertRatingToScore(rating: CreditRatingGrade): number {
    switch (rating) {
      case 'AAA': return 100
      case 'AA+':
      case 'AA':
      case 'AA-': return 95
      case 'A+':
      case 'A':
      case 'A-': return 85
      case 'BBB+':
      case 'BBB':
      case 'BBB-': return 75
      case 'BB+':
      case 'BB':
      case 'BB-': return 60
      case 'B+':
      case 'B':
      case 'B-': return 40
      case 'CCC+':
      case 'CCC':
      case 'CCC-':
      case 'CC':
      case 'C':
      case 'D': return 0
      default: return 50
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
        totalInstruments: this.financialInstruments.size,
        activeInstruments: Array.from(this.financialInstruments.values()).filter(i => i.status === 'active').length,
        maturedInstruments: Array.from(this.financialInstruments.values()).filter(i => i.status === 'matured').length,
        defaultedInstruments: Array.from(this.financialInstruments.values()).filter(i => i.status === 'defaulted').length,
        totalPayments: Array.from(this.paymentSchedules.values()).flat().length,
        overduePayments: Array.from(this.paymentSchedules.values()).flat().filter(p => p.status === 'overdue').length,
        activeRatings: Array.from(this.creditRatings.values()).flat().filter(r => r.status === 'active').length,
        complianceRecords: this.complianceRecords.size
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.financialInstruments.clear()
    this.paymentSchedules.clear()
    this.creditRatings.clear()
    this.complianceRecords.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All financial instruments data cleared')
  }
}

export default FinancialInstrumentsService
