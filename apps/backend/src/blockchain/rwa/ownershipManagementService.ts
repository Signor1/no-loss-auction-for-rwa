import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetLifecycleService from './assetLifecycleService'
import logger from '../../utils/logger'

// Ownership interfaces
export interface OwnershipRecord {
  id: string
  assetId: string
  tokenId?: string
  ownerAddress: string
  ownershipPercentage: number
  ownershipType: OwnershipType
  acquisitionDate: Date
  acquisitionPrice?: number
  acquisitionMethod: AcquisitionMethod
  status: OwnershipStatus
  verificationStatus: VerificationStatus
  createdAt: Date
  updatedAt: Date
  lastVerifiedAt?: Date
}

export interface TransferRecord {
  id: string
  assetId: string
  tokenId?: string
  fromAddress: string
  toAddress: string
  transferAmount: number
  transferPercentage: number
  transferPrice?: number
  transferType: TransferType
  transferMethod: TransferMethod
  transactionHash: string
  blockNumber: number
  gasUsed: number
  transferDate: Date
  status: TransferStatus
  complianceChecks: ComplianceCheck[]
  restrictions: TransferRestriction[]
  createdAt: Date
}

export interface TransferRestriction {
  id: string
  restrictionType: RestrictionType
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  effectiveDate: Date
  expiryDate?: Date
  imposedBy: string
  reason: string
  overrideConditions: OverrideCondition[]
}

export interface OverrideCondition {
  type: 'governance_approval' | 'court_order' | 'regulatory_approval' | 'time_based'
  parameter: string
  value: any
  satisfied: boolean
}

export interface ComplianceCheck {
  checkType: ComplianceCheckType
  status: 'passed' | 'failed' | 'pending' | 'waived'
  checkedAt: Date
  checkedBy: string
  result: string
  evidence?: string
  expiryDate?: Date
}

export interface OwnershipVerification {
  id: string
  ownershipId: string
  verificationType: VerificationType
  verificationMethod: VerificationMethod
  status: VerificationStatus
  verifiedAt?: Date
  verifiedBy: string
  confidence: number // 0-100
  evidence: VerificationEvidence[]
  expiryDate?: Date
  nextVerificationDate?: Date
  createdAt: Date
}

export interface VerificationEvidence {
  type: 'document' | 'signature' | 'oracle' | 'blockchain' | 'third_party'
  description: string
  reference: string
  timestamp: Date
  validity: 'valid' | 'expired' | 'revoked'
}

export interface BeneficialOwner {
  id: string
  ownershipId: string
  beneficialOwnerAddress: string
  ownershipStake: number // percentage of ownership
  relationship: RelationshipType
  controlLevel: ControlLevel
  verificationStatus: VerificationStatus
  kycStatus: KycStatus
  amlStatus: AmlStatus
  sanctionsCheck: SanctionsStatus
  lastVerifiedAt: Date
  verificationExpiry?: Date
  createdAt: Date
  updatedAt: Date
}

export interface OwnershipHistory {
  assetId: string
  totalTransfers: number
  currentOwners: OwnershipRecord[]
  historicalOwners: OwnershipRecord[]
  transferChain: TransferRecord[]
  ownershipConcentration: OwnershipConcentration
  lastUpdated: Date
}

export interface OwnershipConcentration {
  herfindahlIndex: number
  giniCoefficient: number
  largestOwnerPercentage: number
  ownerCount: number
  concentrationLevel: 'highly_concentrated' | 'moderately_concentrated' | 'diversified'
}

export interface OwnershipAnalytics {
  assetId: string
  timeRange: {
    start: Date
    end: Date
  }
  ownershipMetrics: OwnershipMetrics
  transferMetrics: TransferMetrics
  concentrationMetrics: ConcentrationMetrics
  complianceMetrics: ComplianceMetrics
  riskMetrics: RiskMetrics
  generatedAt: Date
}

export interface OwnershipMetrics {
  totalOwners: number
  averageOwnership: number
  medianOwnership: number
  ownershipVolatility: number
  retentionRate: number
  churnRate: number
}

export interface TransferMetrics {
  totalTransfers: number
  averageTransferSize: number
  transferFrequency: number
  transferVelocity: number
  failedTransfers: number
  transferSuccessRate: number
}

export interface ConcentrationMetrics {
  currentConcentration: OwnershipConcentration
  concentrationTrend: 'increasing' | 'decreasing' | 'stable'
  concentrationChange: number
  diversificationIndex: number
}

export interface ComplianceMetrics {
  verifiedOwners: number
  unverifiedOwners: number
  complianceRate: number
  pendingVerifications: number
  failedVerifications: number
  restrictionViolations: number
}

export interface RiskMetrics {
  ownershipRiskScore: number
  transferRiskScore: number
  concentrationRiskScore: number
  complianceRiskScore: number
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: RiskFactor[]
}

export interface RiskFactor {
  factor: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  probability: 'low' | 'medium' | 'high' | 'very_high'
  score: number
  mitigation: string
}

export interface TransferRequest {
  id: string
  assetId: string
  tokenId?: string
  requesterAddress: string
  recipientAddress: string
  transferAmount: number
  transferPercentage: number
  requestedPrice?: number
  transferType: TransferType
  status: TransferRequestStatus
  complianceChecks: ComplianceCheck[]
  restrictions: TransferRestriction[]
  approvalRequired: boolean
  approvals: TransferApproval[]
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export interface TransferApproval {
  id: string
  approverAddress: string
  approverRole: string
  decision: 'approved' | 'rejected' | 'pending'
  comments?: string
  approvedAt?: Date
  requiredAuthority: 'low' | 'medium' | 'high' | 'executive'
}

export interface OwnershipAlert {
  id: string
  assetId: string
  alertType: 'ownership_change' | 'transfer_restriction' | 'verification_expiry' | 'concentration_change' | 'compliance_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendedAction: string
  affectedOwners: string[]
  createdAt: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
}

export type OwnershipType =
  | 'direct' | 'beneficial' | 'custodial' | 'trust' | 'corporate' | 'partnership'

export type AcquisitionMethod =
  | 'purchase' | 'inheritance' | 'gift' | 'initial_distribution' | 'merger' | 'spin_off' | 'other'

export type OwnershipStatus =
  | 'active' | 'inactive' | 'suspended' | 'transferred' | 'liquidated'

export type VerificationStatus =
  | 'unverified' | 'pending' | 'verified' | 'failed' | 'expired' | 'revoked'

export type TransferType =
  | 'sale' | 'gift' | 'inheritance' | 'divorce' | 'bankruptcy' | 'foreclosure' | 'merger' | 'spin_off'

export type TransferMethod =
  | 'direct_transfer' | 'auction' | 'secondary_market' | 'off_chain' | 'forced_sale'

export type TransferStatus =
  | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed'

export type RestrictionType =
  | 'lockup_period' | 'accreditation_required' | 'geographic_restriction' | 'ownership_limit'
  | 'transfer_fee' | 'approval_required' | 'time_restriction' | 'custom'

export type ComplianceCheckType =
  | 'kyc' | 'aml' | 'sanctions' | 'accreditation' | 'tax_compliance' | 'regulatory_approval'
  | 'ownership_verification' | 'transfer_restrictions' | 'jurisdictional_compliance'

export type VerificationType =
  | 'identity' | 'ownership' | 'accreditation' | 'beneficial_ownership' | 'source_of_funds'
  | 'tax_compliance' | 'regulatory_approval'

export type VerificationMethod =
  | 'document_review' | 'third_party_verification' | 'blockchain_analysis' | 'oracle_verification'
  | 'ai_analysis' | 'manual_review'

export type RelationshipType =
  | 'individual' | 'spouse' | 'child' | 'parent' | 'sibling' | 'business_partner'
  | 'trustee' | 'executor' | 'guardian' | 'nominee' | 'other'

export type ControlLevel =
  | 'full_control' | 'significant_influence' | 'material_interest' | 'minor_interest' | 'no_control'

export type KycStatus =
  | 'not_started' | 'in_progress' | 'completed' | 'failed' | 'expired'

export type AmlStatus =
  | 'cleared' | 'flagged' | 'under_review' | 'restricted'

export type SanctionsStatus =
  | 'cleared' | 'sanctioned' | 'under_review'

export type TransferRequestStatus =
  | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'cancelled'

/**
 * Ownership Management Service for RWA Tokenization
 * Comprehensive ownership tracking, transfer restrictions, verification,
 * beneficial ownership, history, and analytics
 */
export class OwnershipManagementService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private lifecycleService: AssetLifecycleService

  // Data storage
  private ownershipRecords: Map<string, OwnershipRecord[]> = new Map()
  private transferRecords: Map<string, TransferRecord[]> = new Map()
  private transferRestrictions: Map<string, TransferRestriction[]> = new Map()
  private ownershipVerifications: Map<string, OwnershipVerification[]> = new Map()
  private beneficialOwners: Map<string, BeneficialOwner[]> = new Map()
  private transferRequests: Map<string, TransferRequest[]> = new Map()
  private ownershipAlerts: Map<string, OwnershipAlert[]> = new Map()

  // Monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    lifecycleService: AssetLifecycleService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.lifecycleService = lifecycleService
    this.logger = loggerInstance
  }

  // ============ OWNERSHIP TRACKING ============

  /**
   * Record initial ownership
   */
  async recordInitialOwnership(
    assetId: string,
    ownershipData: {
      ownerAddress: string
      ownershipPercentage: number
      ownershipType: OwnershipType
      acquisitionMethod: AcquisitionMethod
      acquisitionPrice?: number
    }
  ): Promise<OwnershipRecord> {
    try {
      const ownership: OwnershipRecord = {
        id: `ownership-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ownerAddress: ownershipData.ownerAddress,
        ownershipPercentage: ownershipData.ownershipPercentage,
        ownershipType: ownershipData.ownershipType,
        acquisitionDate: new Date(),
        acquisitionPrice: ownershipData.acquisitionPrice,
        acquisitionMethod: ownershipData.acquisitionMethod,
        status: 'active',
        verificationStatus: 'unverified',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.ownershipRecords.has(assetId)) {
        this.ownershipRecords.set(assetId, [])
      }

      this.ownershipRecords.get(assetId)!.push(ownership)

      // Update digital twin
      await this.updateDigitalTwinOwnership(assetId, ownership)

      this.emit('ownership:recorded', { ownership })

      return ownership
    } catch (error) {
      this.logger.error(`Failed to record initial ownership for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Record ownership transfer
   */
  async recordOwnershipTransfer(
    assetId: string,
    transferData: {
      fromAddress: string
      toAddress: string
      transferAmount: number
      transferPercentage: number
      transferPrice?: number
      transferType: TransferType
      transferMethod: TransferMethod
      transactionHash: string
      blockNumber: number
      gasUsed: number
    }
  ): Promise<TransferRecord> {
    try {
      // Validate transfer
      await this.validateTransfer(assetId, transferData)

      const transfer: TransferRecord = {
        id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        fromAddress: transferData.fromAddress,
        toAddress: transferData.toAddress,
        transferAmount: transferData.transferAmount,
        transferPercentage: transferData.transferPercentage,
        transferPrice: transferData.transferPrice,
        transferType: transferData.transferType,
        transferMethod: transferData.transferMethod,
        transactionHash: transferData.transactionHash,
        blockNumber: transferData.blockNumber,
        gasUsed: transferData.gasUsed,
        transferDate: new Date(),
        status: 'completed',
        complianceChecks: [],
        restrictions: [],
        createdAt: new Date()
      }

      if (!this.transferRecords.has(assetId)) {
        this.transferRecords.set(assetId, [])
      }

      this.transferRecords.get(assetId)!.push(transfer)

      // Update ownership records
      await this.updateOwnershipRecords(assetId, transfer)

      // Update digital twin
      await this.updateDigitalTwinOwnership(assetId)

      // Log lifecycle event
      await this.lifecycleService.logAssetEvent(assetId, {
        eventType: 'ownership_transfer',
        title: 'Ownership Transfer Completed',
        description: `Transferred ${transferData.transferPercentage}% ownership from ${transferData.fromAddress} to ${transferData.toAddress}`,
        participants: [transferData.fromAddress, transferData.toAddress],
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      this.emit('transfer:completed', { transfer })

      return transfer
    } catch (error) {
      this.logger.error(`Failed to record ownership transfer for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get current ownership for asset
   */
  getCurrentOwnership(assetId: string): OwnershipRecord[] {
    const records = this.ownershipRecords.get(assetId) || []
    return records.filter(record => record.status === 'active')
  }

  /**
   * Get ownership history for asset
   */
  getOwnershipHistory(assetId: string): OwnershipHistory {
    const currentOwners = this.getCurrentOwnership(assetId)
    const allRecords = this.ownershipRecords.get(assetId) || []
    const historicalOwners = allRecords.filter(record => record.status !== 'active')
    const transfers = this.transferRecords.get(assetId) || []

    const concentration = this.calculateOwnershipConcentration(currentOwners)

    return {
      assetId,
      totalTransfers: transfers.length,
      currentOwners,
      historicalOwners,
      transferChain: transfers,
      ownershipConcentration: concentration,
      lastUpdated: new Date()
    }
  }

  // ============ TRANSFER RESTRICTIONS ============

  /**
   * Add transfer restriction
   */
  async addTransferRestriction(
    assetId: string,
    restriction: Omit<TransferRestriction, 'id' | 'effectiveDate'>
  ): Promise<TransferRestriction> {
    try {
      const transferRestriction: TransferRestriction = {
        ...restriction,
        id: `restriction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        effectiveDate: new Date()
      }

      if (!this.transferRestrictions.has(assetId)) {
        this.transferRestrictions.set(assetId, [])
      }

      this.transferRestrictions.get(assetId)!.push(transferRestriction)

      // Create alert for high-severity restrictions
      if (restriction.severity === 'high' || restriction.severity === 'critical') {
        const alert: OwnershipAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          assetId,
          alertType: 'transfer_restriction',
          severity: restriction.severity,
          message: `New transfer restriction: ${restriction.description}`,
          recommendedAction: 'Review transfer requests for compliance',
          affectedOwners: [], // All owners affected
          createdAt: new Date(),
          acknowledged: false
        }

        if (!this.ownershipAlerts.has(assetId)) {
          this.ownershipAlerts.set(assetId, [])
        }

        this.ownershipAlerts.get(assetId)!.push(alert)
      }

      this.emit('restriction:added', { restriction: transferRestriction })

      return transferRestriction
    } catch (error) {
      this.logger.error(`Failed to add transfer restriction for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Check transfer restrictions
   */
  async checkTransferRestrictions(
    assetId: string,
    fromAddress: string,
    toAddress: string,
    transferAmount: number
  ): Promise<{ allowed: boolean; restrictions: TransferRestriction[]; violations: string[] }> {
    try {
      const restrictions = this.transferRestrictions.get(assetId) || []
      const activeRestrictions = restrictions.filter(r => r.isActive)

      const violations: string[] = []

      for (const restriction of activeRestrictions) {
        const violation = await this.checkRestrictionViolation(restriction, fromAddress, toAddress, transferAmount)
        if (violation) {
          violations.push(violation)
        }
      }

      return {
        allowed: violations.length === 0,
        restrictions: activeRestrictions,
        violations
      }
    } catch (error) {
      this.logger.error(`Failed to check transfer restrictions for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Request ownership transfer
   */
  async requestOwnershipTransfer(
    assetId: string,
    transferData: {
      requesterAddress: string
      recipientAddress: string
      transferAmount: number
      transferPercentage: number
      requestedPrice?: number
      transferType: TransferType
    }
  ): Promise<TransferRequest> {
    try {
      // Check restrictions first
      const restrictionCheck = await this.checkTransferRestrictions(
        assetId,
        transferData.requesterAddress,
        transferData.recipientAddress,
        transferData.transferAmount
      )

      if (!restrictionCheck.allowed) {
        throw new Error(`Transfer blocked by restrictions: ${restrictionCheck.violations.join(', ')}`)
      }

      // Perform compliance checks
      const complianceChecks = await this.performComplianceChecks(
        transferData.requesterAddress,
        transferData.recipientAddress,
        transferData.transferType
      )

      const transferRequest: TransferRequest = {
        id: `transfer-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        requesterAddress: transferData.requesterAddress,
        recipientAddress: transferData.recipientAddress,
        transferAmount: transferData.transferAmount,
        transferPercentage: transferData.transferPercentage,
        requestedPrice: transferData.requestedPrice,
        transferType: transferData.transferType,
        status: 'submitted',
        complianceChecks,
        restrictions: restrictionCheck.restrictions,
        approvalRequired: this.requiresApproval(restrictionCheck.restrictions, transferData.transferAmount),
        approvals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }

      if (!this.transferRequests.has(assetId)) {
        this.transferRequests.set(assetId, [])
      }

      this.transferRequests.get(assetId)!.push(transferRequest)

      this.emit('transfer:requested', { request: transferRequest })

      return transferRequest
    } catch (error) {
      this.logger.error(`Failed to request ownership transfer for ${assetId}:`, error)
      throw error
    }
  }

  // ============ OWNERSHIP VERIFICATION ============

  /**
   * Verify ownership
   */
  async verifyOwnership(
    ownershipId: string,
    verificationData: {
      verificationType: VerificationType
      verificationMethod: VerificationMethod
      verifiedBy: string
      evidence: Omit<VerificationEvidence, 'timestamp'>[]
    }
  ): Promise<OwnershipVerification> {
    try {
      const verification: OwnershipVerification = {
        id: `verification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ownershipId,
        verificationType: verificationData.verificationType,
        verificationMethod: verificationData.verificationMethod,
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: verificationData.verifiedBy,
        confidence: 95, // Default high confidence
        evidence: verificationData.evidence.map(ev => ({
          ...ev,
          timestamp: new Date()
        })),
        nextVerificationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date()
      }

      if (!this.ownershipVerifications.has(ownershipId)) {
        this.ownershipVerifications.set(ownershipId, [])
      }

      this.ownershipVerifications.get(ownershipId)!.push(verification)

      // Update ownership record
      await this.updateOwnershipVerificationStatus(ownershipId, 'verified')

      this.emit('ownership:verified', { verification })

      return verification
    } catch (error) {
      this.logger.error(`Failed to verify ownership ${ownershipId}:`, error)
      throw error
    }
  }

  /**
   * Get ownership verifications
   */
  getOwnershipVerifications(ownershipId: string): OwnershipVerification[] {
    const verifications = this.ownershipVerifications.get(ownershipId) || []
    return verifications.sort((a, b) => b.verifiedAt!.getTime() - a.verifiedAt!.getTime())
  }

  // ============ BENEFICIAL OWNERSHIP ============

  /**
   * Record beneficial owner
   */
  async recordBeneficialOwner(
    ownershipId: string,
    beneficialOwnerData: Omit<BeneficialOwner, 'id' | 'ownershipId' | 'createdAt' | 'updatedAt'>
  ): Promise<BeneficialOwner> {
    try {
      const beneficialOwner: BeneficialOwner = {
        ...beneficialOwnerData,
        id: `beneficial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ownershipId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.beneficialOwners.has(ownershipId)) {
        this.beneficialOwners.set(ownershipId, [])
      }

      this.beneficialOwners.get(ownershipId)!.push(beneficialOwner)

      this.emit('beneficial:owner:recorded', { beneficialOwner })

      return beneficialOwner
    } catch (error) {
      this.logger.error(`Failed to record beneficial owner for ${ownershipId}:`, error)
      throw error
    }
  }

  /**
   * Update beneficial owner status
   */
  async updateBeneficialOwnerStatus(
    beneficialOwnerId: string,
    updates: Partial<Pick<BeneficialOwner, 'kycStatus' | 'amlStatus' | 'sanctionsCheck' | 'lastVerifiedAt'>>
  ): Promise<BeneficialOwner> {
    try {
      // Find beneficial owner
      let beneficialOwner: BeneficialOwner | null = null

      for (const owners of this.beneficialOwners.values()) {
        const found = owners.find(o => o.id === beneficialOwnerId)
        if (found) {
          beneficialOwner = found
          break
        }
      }

      if (!beneficialOwner) {
        throw new Error(`Beneficial owner ${beneficialOwnerId} not found`)
      }

      // Update beneficial owner
      Object.assign(beneficialOwner, updates)
      beneficialOwner.updatedAt = new Date()

      // Check if all statuses are cleared
      const isFullyCompliant = beneficialOwner.kycStatus === 'completed' &&
                              beneficialOwner.amlStatus === 'cleared' &&
                              beneficialOwner.sanctionsCheck === 'cleared'

      if (isFullyCompliant && beneficialOwner.verificationStatus !== 'verified') {
        beneficialOwner.verificationStatus = 'verified'
        beneficialOwner.lastVerifiedAt = new Date()
      }

      this.emit('beneficial:owner:updated', { beneficialOwner })

      return beneficialOwner
    } catch (error) {
      this.logger.error(`Failed to update beneficial owner ${beneficialOwnerId}:`, error)
      throw error
    }
  }

  /**
   * Get beneficial owners for ownership
   */
  getBeneficialOwners(ownershipId: string): BeneficialOwner[] {
    return this.beneficialOwners.get(ownershipId) || []
  }

  // ============ OWNERSHIP ANALYTICS ============

  /**
   * Generate ownership analytics
   */
  generateOwnershipAnalytics(
    assetId: string,
    timeRange?: { start: Date; end: Date }
  ): OwnershipAnalytics {
    const defaultRange = {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      end: new Date()
    }

    const range = timeRange || defaultRange

    const history = this.getOwnershipHistory(assetId)
    const currentOwners = history.currentOwners

    // Calculate metrics
    const ownershipMetrics = this.calculateOwnershipMetrics(currentOwners, history.transferChain, range)
    const transferMetrics = this.calculateTransferMetrics(history.transferChain, range)
    const concentrationMetrics = this.calculateConcentrationMetrics(currentOwners, history)
    const complianceMetrics = this.calculateComplianceMetrics(currentOwners)
    const riskMetrics = this.calculateRiskMetrics(ownershipMetrics, transferMetrics, concentrationMetrics, complianceMetrics)

    return {
      assetId,
      timeRange: range,
      ownershipMetrics,
      transferMetrics,
      concentrationMetrics,
      complianceMetrics,
      riskMetrics,
      generatedAt: new Date()
    }
  }

  /**
   * Calculate ownership metrics
   */
  private calculateOwnershipMetrics(
    currentOwners: OwnershipRecord[],
    transfers: TransferRecord[],
    timeRange: { start: Date; end: Date }
  ): OwnershipMetrics {
    const totalOwners = currentOwners.length
    const ownershipPercentages = currentOwners.map(o => o.ownershipPercentage)

    const averageOwnership = ownershipPercentages.reduce((sum, p) => sum + p, 0) / totalOwners
    const sortedPercentages = ownershipPercentages.sort((a, b) => a - b)
    const medianOwnership = sortedPercentages[Math.floor(totalOwners / 2)]

    // Calculate volatility (coefficient of variation)
    const variance = ownershipPercentages.reduce((sum, p) => sum + Math.pow(p - averageOwnership, 2), 0) / totalOwners
    const volatility = averageOwnership > 0 ? (Math.sqrt(variance) / averageOwnership) * 100 : 0

    // Calculate retention and churn
    const periodTransfers = transfers.filter(t => t.transferDate >= timeRange.start && t.transferDate <= timeRange.end)
    const uniqueSellers = new Set(periodTransfers.map(t => t.fromAddress)).size
    const uniqueBuyers = new Set(periodTransfers.map(t => t.toAddress)).size

    const retentionRate = totalOwners > 0 ? ((totalOwners - uniqueBuyers) / totalOwners) * 100 : 100
    const churnRate = uniqueSellers > 0 ? (uniqueSellers / totalOwners) * 100 : 0

    return {
      totalOwners,
      averageOwnership,
      medianOwnership,
      ownershipVolatility: volatility,
      retentionRate,
      churnRate
    }
  }

  /**
   * Calculate transfer metrics
   */
  private calculateTransferMetrics(
    transfers: TransferRecord[],
    timeRange: { start: Date; end: Date }
  ): TransferMetrics {
    const periodTransfers = transfers.filter(t => t.transferDate >= timeRange.start && t.transferDate <= timeRange.end)
    const days = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)

    const totalTransfers = periodTransfers.length
    const totalTransferAmount = periodTransfers.reduce((sum, t) => sum + t.transferAmount, 0)
    const averageTransferSize = totalTransfers > 0 ? totalTransferAmount / totalTransfers : 0

    const transferFrequency = days > 0 ? totalTransfers / days : 0
    const transferVelocity = days > 0 ? totalTransferAmount / days : 0

    const failedTransfers = periodTransfers.filter(t => t.status === 'failed').length
    const transferSuccessRate = totalTransfers > 0 ? ((totalTransfers - failedTransfers) / totalTransfers) * 100 : 100

    return {
      totalTransfers,
      averageTransferSize,
      transferFrequency,
      transferVelocity,
      failedTransfers,
      transferSuccessRate
    }
  }

  /**
   * Calculate concentration metrics
   */
  private calculateConcentrationMetrics(
    currentOwners: OwnershipRecord[],
    history: OwnershipHistory
  ): ConcentrationMetrics {
    const percentages = currentOwners.map(o => o.ownershipPercentage)

    // Herfindahl-Hirschman Index
    const herfindahlIndex = percentages.reduce((sum, p) => sum + Math.pow(p / 100, 2), 0)

    // Gini coefficient (simplified)
    const sortedPercentages = percentages.sort((a, b) => a - b)
    const n = sortedPercentages.length
    let giniSum = 0

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        giniSum += Math.abs(sortedPercentages[i] - sortedPercentages[j])
      }
    }

    const giniCoefficient = n > 1 ? giniSum / (2 * n * n * sortedPercentages.reduce((sum, p) => sum + p, 0) / n) : 0

    const largestOwnerPercentage = Math.max(...percentages)
    const ownerCount = currentOwners.length

    let concentrationLevel: ConcentrationMetrics['concentrationLevel']
    if (herfindahlIndex > 0.25) {
      concentrationLevel = 'highly_concentrated'
    } else if (herfindahlIndex > 0.15) {
      concentrationLevel = 'moderately_concentrated'
    } else {
      concentrationLevel = 'diversified'
    }

    return {
      currentConcentration: history.ownershipConcentration,
      concentrationTrend: 'stable', // Would calculate trend
      concentrationChange: 0, // Would calculate change
      diversificationIndex: 1 - herfindahlIndex
    }
  }

  /**
   * Calculate compliance metrics
   */
  private calculateComplianceMetrics(currentOwners: OwnershipRecord[]): ComplianceMetrics {
    const verifiedOwners = currentOwners.filter(o => o.verificationStatus === 'verified').length
    const unverifiedOwners = currentOwners.filter(o => o.verificationStatus === 'unverified' || o.verificationStatus === 'pending').length

    const complianceRate = currentOwners.length > 0 ? (verifiedOwners / currentOwners.length) * 100 : 100
    const pendingVerifications = currentOwners.filter(o => o.verificationStatus === 'pending').length
    const failedVerifications = currentOwners.filter(o => o.verificationStatus === 'failed').length

    // Would need to track restriction violations
    const restrictionViolations = 0

    return {
      verifiedOwners,
      unverifiedOwners,
      complianceRate,
      pendingVerifications,
      failedVerifications,
      restrictionViolations
    }
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(
    ownership: OwnershipMetrics,
    transfer: TransferMetrics,
    concentration: ConcentrationMetrics,
    compliance: ComplianceMetrics
  ): RiskMetrics {
    const riskFactors: RiskFactor[] = []

    // Ownership concentration risk
    if (concentration.currentConcentration.concentrationLevel === 'highly_concentrated') {
      riskFactors.push({
        factor: 'high_ownership_concentration',
        impact: 'high',
        probability: 'medium',
        score: 75,
        mitigation: 'Implement diversification requirements'
      })
    }

    // Compliance risk
    if (compliance.complianceRate < 80) {
      riskFactors.push({
        factor: 'low_compliance_rate',
        impact: 'high',
        probability: 'high',
        score: 85,
        mitigation: 'Strengthen verification processes'
      })
    }

    // Transfer risk
    if (transfer.transferSuccessRate < 95) {
      riskFactors.push({
        factor: 'transfer_failures',
        impact: 'medium',
        probability: 'medium',
        score: 60,
        mitigation: 'Improve transfer validation'
      })
    }

    // Calculate overall risk score
    const ownershipRiskScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0) / Math.max(riskFactors.length, 1)

    let overallRiskLevel: RiskMetrics['overallRiskLevel'] = 'low'
    if (ownershipRiskScore > 75) {
      overallRiskLevel = 'critical'
    } else if (ownershipRiskScore > 60) {
      overallRiskLevel = 'high'
    } else if (ownershipRiskScore > 40) {
      overallRiskLevel = 'medium'
    }

    return {
      ownershipRiskScore,
      transferRiskScore: transfer.transferSuccessRate < 95 ? 60 : 20,
      concentrationRiskScore: concentration.currentConcentration.herfindahlIndex * 100,
      complianceRiskScore: 100 - compliance.complianceRate,
      overallRiskLevel,
      riskFactors
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Update digital twin ownership
   */
  private async updateDigitalTwinOwnership(assetId: string, newOwnership?: OwnershipRecord): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        const currentOwnership = newOwnership ? [newOwnership] : this.getCurrentOwnership(assetId)

        // Update ownership data in digital twin
        this.emit('digitalTwin:ownershipUpdate', {
          twinId: twin.id,
          ownership: currentOwnership
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin ownership for ${assetId}:`, error)
    }
  }

  /**
   * Validate transfer
   */
  private async validateTransfer(assetId: string, transferData: any): Promise<void> {
    // Check if sender has sufficient ownership
    const currentOwnership = this.getCurrentOwnership(assetId)
    const senderOwnership = currentOwnership.find(o => o.ownerAddress === transferData.fromAddress)

    if (!senderOwnership) {
      throw new Error(`Sender ${transferData.fromAddress} does not own any portion of asset ${assetId}`)
    }

    if (senderOwnership.ownershipPercentage < transferData.transferPercentage) {
      throw new Error(`Insufficient ownership: sender has ${senderOwnership.ownershipPercentage}%, trying to transfer ${transferData.transferPercentage}%`)
    }

    // Additional validation would go here
  }

  /**
   * Update ownership records after transfer
   */
  private async updateOwnershipRecords(assetId: string, transfer: TransferRecord): Promise<void> {
    const ownershipRecords = this.ownershipRecords.get(assetId) || []

    // Find sender's record
    const senderRecord = ownershipRecords.find(o => o.ownerAddress === transfer.fromAddress && o.status === 'active')
    if (senderRecord) {
      if (senderRecord.ownershipPercentage === transfer.transferPercentage) {
        // Complete transfer - mark as transferred
        senderRecord.status = 'transferred'
        senderRecord.updatedAt = new Date()
      } else {
        // Partial transfer - reduce percentage
        senderRecord.ownershipPercentage -= transfer.transferPercentage
        senderRecord.updatedAt = new Date()
      }
    }

    // Create or update receiver's record
    let receiverRecord = ownershipRecords.find(o => o.ownerAddress === transfer.toAddress && o.status === 'active')
    if (receiverRecord) {
      receiverRecord.ownershipPercentage += transfer.transferPercentage
      receiverRecord.updatedAt = new Date()
    } else {
      // Create new ownership record for receiver
      const newOwnership: OwnershipRecord = {
        id: `ownership-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ownerAddress: transfer.toAddress,
        ownershipPercentage: transfer.transferPercentage,
        ownershipType: 'direct', // Would be determined
        acquisitionDate: transfer.transferDate,
        acquisitionPrice: transfer.transferPrice,
        acquisitionMethod: 'purchase',
        status: 'active',
        verificationStatus: 'unverified',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      ownershipRecords.push(newOwnership)
    }
  }

  /**
   * Update ownership verification status
   */
  private async updateOwnershipVerificationStatus(ownershipId: string, status: VerificationStatus): Promise<void> {
    // Find ownership record
    for (const records of this.ownershipRecords.values()) {
      const record = records.find(r => r.id === ownershipId)
      if (record) {
        record.verificationStatus = status
        record.lastVerifiedAt = new Date()
        record.updatedAt = new Date()
        break
      }
    }
  }

  /**
   * Check restriction violation
   */
  private async checkRestrictionViolation(
    restriction: TransferRestriction,
    fromAddress: string,
    toAddress: string,
    transferAmount: number
  ): Promise<string | null> {
    // Simplified restriction checking
    switch (restriction.restrictionType) {
      case 'lockup_period':
        // Check if within lockup period
        if (new Date() < restriction.expiryDate!) {
          return `Transfer blocked by lockup period until ${restriction.expiryDate!.toDateString()}`
        }
        break

      case 'ownership_limit':
        // Check ownership limits
        const currentOwnership = this.getCurrentOwnership(restriction.id.split('-')[1]) // Extract assetId
        const receiverOwnership = currentOwnership.find(o => o.ownerAddress === toAddress)
        if (receiverOwnership && receiverOwnership.ownershipPercentage + transferAmount > 50) { // 50% limit example
          return 'Transfer would exceed ownership limit'
        }
        break
    }

    return null
  }

  /**
   * Perform compliance checks
   */
  private async performComplianceChecks(
    fromAddress: string,
    toAddress: string,
    transferType: TransferType
  ): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = []

    // KYC check
    checks.push({
      checkType: 'kyc',
      status: 'passed', // Simplified
      checkedAt: new Date(),
      checkedBy: 'system',
      result: 'KYC verification passed'
    })

    // AML check
    checks.push({
      checkType: 'aml',
      status: 'passed', // Simplified
      checkedAt: new Date(),
      checkedBy: 'system',
      result: 'AML screening passed'
    })

    return checks
  }

  /**
   * Check if transfer requires approval
   */
  private requiresApproval(restrictions: TransferRestriction[], transferAmount: number): boolean {
    return restrictions.some(r => r.restrictionType === 'approval_required') || transferAmount > 25 // >25% requires approval
  }

  /**
   * Calculate ownership concentration
   */
  private calculateOwnershipConcentration(owners: OwnershipRecord[]): OwnershipConcentration {
    const percentages = owners.map(o => o.ownershipPercentage)

    // Herfindahl-Hirschman Index
    const herfindahlIndex = percentages.reduce((sum, p) => sum + Math.pow(p / 100, 2), 0)

    // Gini coefficient (simplified)
    const sortedPercentages = percentages.sort((a, b) => a - b)
    const n = sortedPercentages.length
    let giniSum = 0

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        giniSum += Math.abs(sortedPercentages[i] - sortedPercentages[j])
      }
    }

    const mean = sortedPercentages.reduce((sum, p) => sum + p, 0) / n
    const giniCoefficient = n > 1 && mean > 0 ? giniSum / (2 * n * n * mean) : 0

    const largestOwnerPercentage = Math.max(...percentages)
    const ownerCount = owners.length

    let concentrationLevel: OwnershipConcentration['concentrationLevel']
    if (herfindahlIndex > 0.25) {
      concentrationLevel = 'highly_concentrated'
    } else if (herfindahlIndex > 0.15) {
      concentrationLevel = 'moderately_concentrated'
    } else {
      concentrationLevel = 'diversified'
    }

    return {
      herfindahlIndex,
      giniCoefficient,
      largestOwnerPercentage,
      ownerCount,
      concentrationLevel
    }
  }

  /**
   * Get transfer requests for asset
   */
  getTransferRequests(assetId: string): TransferRequest[] {
    return this.transferRequests.get(assetId) || []
  }

  /**
   * Get ownership alerts
   */
  getOwnershipAlerts(assetId: string): OwnershipAlert[] {
    const alerts = this.ownershipAlerts.get(assetId) || []
    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<OwnershipAlert> {
    try {
      // Find alert
      let alert: OwnershipAlert | null = null

      for (const alerts of this.ownershipAlerts.values()) {
        const found = alerts.find(a => a.id === alertId)
        if (found) {
          alert = found
          break
        }
      }

      if (!alert) {
        throw new Error(`Alert ${alertId} not found`)
      }

      alert.acknowledged = true
      alert.acknowledgedBy = acknowledgedBy
      alert.acknowledgedAt = new Date()

      this.emit('alert:acknowledged', { alert })

      return alert
    } catch (error) {
      this.logger.error(`Failed to acknowledge alert ${alertId}:`, error)
      throw error
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
        totalAssets: this.ownershipRecords.size,
        activeOwnershipRecords: Array.from(this.ownershipRecords.values()).flat().filter(r => r.status === 'active').length,
        totalTransfers: Array.from(this.transferRecords.values()).flat().length,
        pendingTransferRequests: Array.from(this.transferRequests.values()).flat().filter(r => r.status === 'submitted').length,
        activeRestrictions: Array.from(this.transferRestrictions.values()).flat().filter(r => r.isActive).length,
        verifiedOwnerships: Array.from(this.ownershipRecords.values()).flat().filter(r => r.verificationStatus === 'verified').length,
        totalBeneficialOwners: Array.from(this.beneficialOwners.values()).flat().length,
        activeAlerts: Array.from(this.ownershipAlerts.values()).flat().filter(a => !a.acknowledged).length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.ownershipRecords.clear()
    this.transferRecords.clear()
    this.transferRestrictions.clear()
    this.ownershipVerifications.clear()
    this.beneficialOwners.clear()
    this.transferRequests.clear()
    this.ownershipAlerts.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All ownership management data cleared')
  }
}

export default OwnershipManagementService
