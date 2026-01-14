import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetLifecycleService from './assetLifecycleService'
import OracleIntegrationService from '../oracle/oracleIntegrationService'
import logger from '../../utils/logger'

// Asset maintenance interfaces
export interface MaintenanceRecord {
  id: string
  assetId: string
  maintenanceType: MaintenanceType
  category: MaintenanceCategory
  title: string
  description: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  scheduledDate: Date
  completedDate?: Date
  estimatedDuration: number // hours
  actualDuration?: number // hours
  estimatedCost: number
  actualCost?: number
  currency: string
  technician?: string
  vendor?: string
  parts: MaintenancePart[]
  notes: string
  attachments: MaintenanceAttachment[]
  preventiveMeasures: string[]
  createdAt: Date
  updatedAt: Date
  approvedBy?: string
  approvedAt?: Date
}

export interface MaintenancePart {
  id: string
  name: string
  partNumber?: string
  quantity: number
  unitCost: number
  totalCost: number
  supplier: string
  warrantyPeriod?: number // months
  installedDate?: Date
}

export interface MaintenanceAttachment {
  id: string
  name: string
  type: 'photo' | 'document' | 'video' | 'report'
  url: string
  uploadedAt: Date
  description?: string
}

export interface InsurancePolicy {
  id: string
  assetId: string
  policyNumber: string
  provider: string
  policyType: InsuranceType
  coverageAmount: number
  premiumAmount: number
  currency: string
  coverageStartDate: Date
  coverageEndDate: Date
  deductible: number
  status: InsuranceStatus
  terms: InsuranceTerms
  claims: InsuranceClaim[]
  renewalDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface InsuranceTerms {
  coveredPerils: string[]
  exclusions: string[]
  conditions: string[]
  specialClauses: string[]
  renewalTerms: string
}

export interface InsuranceClaim {
  id: string
  policyId: string
  claimNumber: string
  incidentDate: Date
  reportedDate: Date
  description: string
  claimAmount: number
  approvedAmount?: number
  status: ClaimStatus
  assessor?: string
  assessmentDate?: Date
  settlementDate?: Date
  documents: ClaimDocument[]
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface ClaimDocument {
  id: string
  name: string
  type: 'police_report' | 'damage_photos' | 'repair_estimate' | 'other'
  url: string
  uploadedAt: Date
}

export interface AssetCondition {
  id: string
  assetId: string
  assessmentDate: Date
  overallCondition: AssetConditionRating
  conditionScore: number // 0-100
  componentConditions: ComponentCondition[]
  inspector: string
  inspectionType: InspectionType
  nextInspectionDate?: Date
  recommendations: ConditionRecommendation[]
  attachments: ConditionAttachment[]
  notes: string
  createdAt: Date
}

export interface ComponentCondition {
  component: string
  condition: AssetConditionRating
  score: number // 0-100
  issues: string[]
  recommendations: string[]
  replacementNeeded: boolean
  estimatedLifespan: number // months remaining
}

export interface ConditionRecommendation {
  id: string
  type: 'maintenance' | 'repair' | 'replacement' | 'upgrade'
  description: string
  priority: MaintenancePriority
  estimatedCost: number
  timeline: string
  impact: 'low' | 'medium' | 'high'
}

export interface ConditionAttachment {
  id: string
  name: string
  type: 'photo' | 'video' | 'document' | 'sensor_data'
  url: string
  uploadedAt: Date
}

export interface ComplianceRecord {
  id: string
  assetId: string
  regulationType: RegulationType
  requirement: string
  complianceStatus: ComplianceStatus
  lastChecked: Date
  nextCheckDate?: Date
  responsibleParty: string
  evidence: ComplianceEvidence[]
  violations: ComplianceViolation[]
  remediationPlan?: string
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceEvidence {
  id: string
  type: 'certificate' | 'inspection' | 'audit' | 'documentation'
  description: string
  documentUrl?: string
  validUntil?: Date
  issuedBy: string
}

export interface ComplianceViolation {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detectedDate: Date
  resolvedDate?: Date
  penalty?: number
  correctiveAction: string
}

export interface AssetImprovement {
  id: string
  assetId: string
  improvementType: ImprovementType
  title: string
  description: string
  startDate: Date
  completionDate?: Date
  estimatedCost: number
  actualCost?: number
  currency: string
  contractor?: string
  status: ImprovementStatus
  valueIncrease: number
  roi: number // Return on Investment percentage
  depreciationImpact: number // months added to asset life
  components: ImprovementComponent[]
  attachments: ImprovementAttachment[]
  createdAt: Date
  updatedAt: Date
}

export interface ImprovementComponent {
  id: string
  component: string
  improvement: string
  cost: number
  expectedLifespan: number // additional months
}

export interface ImprovementAttachment {
  id: string
  name: string
  type: 'before_photo' | 'after_photo' | 'contract' | 'permit' | 'invoice'
  url: string
  uploadedAt: Date
}

export interface DepreciationSchedule {
  id: string
  assetId: string
  method: DepreciationMethod
  usefulLife: number // years
  salvageValue: number
  totalDepreciation: number
  accumulatedDepreciation: number
  currentBookValue: number
  depreciationEntries: DepreciationEntry[]
  lastCalculated: Date
  nextCalculation: Date
}

export interface DepreciationEntry {
  id: string
  period: string // YYYY-MM
  depreciationAmount: number
  accumulatedDepreciation: number
  bookValue: number
  calculationDate: Date
  notes?: string
}

export interface MaintenanceSchedule {
  id: string
  assetId: string
  scheduleType: ScheduleType
  frequency: MaintenanceFrequency
  nextMaintenance: Date
  lastMaintenance?: Date
  isActive: boolean
  checklist: MaintenanceChecklistItem[]
  responsibleParty: string
  createdAt: Date
}

export interface MaintenanceChecklistItem {
  id: string
  item: string
  required: boolean
  instructions: string
  estimatedTime: number // minutes
  toolsRequired: string[]
}

export interface MaintenanceAlert {
  id: string
  assetId: string
  alertType: 'overdue_maintenance' | 'condition_deterioration' | 'insurance_expiring' | 'compliance_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  recommendedAction: string
  dueDate?: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  createdAt: Date
}

export type MaintenanceType =
  | 'preventive' | 'corrective' | 'predictive' | 'emergency' | 'inspection' | 'upgrade'

export type MaintenanceCategory =
  | 'mechanical' | 'electrical' | 'structural' | 'cosmetic' | 'safety' | 'environmental' | 'other'

export type MaintenancePriority =
  | 'low' | 'medium' | 'high' | 'critical' | 'emergency'

export type MaintenanceStatus =
  | 'scheduled' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'

export type InsuranceType =
  | 'property' | 'liability' | 'flood' | 'earthquake' | 'windstorm' | 'comprehensive' | 'other'

export type InsuranceStatus =
  | 'active' | 'expired' | 'cancelled' | 'pending' | 'under_review'

export type ClaimStatus =
  | 'filed' | 'under_review' | 'approved' | 'denied' | 'paid' | 'appealed'

export type AssetConditionRating =
  | 'excellent' | 'good' | 'fair' | 'poor' | 'critical'

export type InspectionType =
  | 'routine' | 'comprehensive' | 'damage_assessment' | 'pre_sale' | 'regulatory'

export type RegulationType =
  | 'building_code' | 'environmental' | 'safety' | 'zoning' | 'accessibility' | 'fire_safety' | 'other'

export type ComplianceStatus =
  | 'compliant' | 'non_compliant' | 'pending_review' | 'conditional' | 'waived'

export type ImprovementType =
  | 'renovation' | 'upgrade' | 'repair' | 'expansion' | 'modernization' | 'energy_efficiency'

export type ImprovementStatus =
  | 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled'

export type DepreciationMethod =
  | 'straight_line' | 'declining_balance' | 'units_of_production' | 'sum_of_years_digits'

export type ScheduleType =
  | 'preventive' | 'inspection' | 'compliance' | 'seasonal'

export type MaintenanceFrequency =
  | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom'

/**
 * Asset Maintenance Service for RWA Tokenization
 * Comprehensive asset maintenance, insurance, condition monitoring,
 * compliance, improvements, and depreciation management
 */
export class AssetMaintenanceService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private lifecycleService: AssetLifecycleService
  private oracleService: OracleIntegrationService

  // Data storage
  private maintenanceRecords: Map<string, MaintenanceRecord[]> = new Map()
  private insurancePolicies: Map<string, InsurancePolicy[]> = new Map()
  private assetConditions: Map<string, AssetCondition[]> = new Map()
  private complianceRecords: Map<string, ComplianceRecord[]> = new Map()
  private assetImprovements: Map<string, AssetImprovement[]> = new Map()
  private depreciationSchedules: Map<string, DepreciationSchedule> = new Map()
  private maintenanceSchedules: Map<string, MaintenanceSchedule[]> = new Map()
  private maintenanceAlerts: Map<string, MaintenanceAlert[]> = new Map()

  // Monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    lifecycleService: AssetLifecycleService,
    oracleService: OracleIntegrationService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.lifecycleService = lifecycleService
    this.oracleService = oracleService
    this.logger = loggerInstance
  }

  // ============ MAINTENANCE TRACKING ============

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(params: {
    assetId: string
    maintenanceType: MaintenanceType
    category: MaintenanceCategory
    title: string
    description: string
    priority: MaintenancePriority
    scheduledDate: Date
    estimatedDuration: number
    estimatedCost: number
    currency: string
    technician?: string
    vendor?: string
    parts?: Omit<MaintenancePart, 'id'>[]
  }): Promise<MaintenanceRecord> {
    try {
      const maintenance: MaintenanceRecord = {
        id: `maint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        maintenanceType: params.maintenanceType,
        category: params.category,
        title: params.title,
        description: params.description,
        priority: params.priority,
        status: 'scheduled',
        scheduledDate: params.scheduledDate,
        estimatedDuration: params.estimatedDuration,
        estimatedCost: params.estimatedCost,
        currency: params.currency,
        technician: params.technician,
        vendor: params.vendor,
        parts: params.parts?.map(part => ({
          ...part,
          id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })) || [],
        notes: '',
        attachments: [],
        preventiveMeasures: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.maintenanceRecords.has(params.assetId)) {
        this.maintenanceRecords.set(params.assetId, [])
      }

      this.maintenanceRecords.get(params.assetId)!.push(maintenance)

      // Update asset status if high priority
      if (params.priority === 'high' || params.priority === 'critical' || params.priority === 'emergency') {
        await this.lifecycleService.updateAssetStatus(
          params.assetId,
          'under_maintenance',
          'system',
          `High priority maintenance scheduled: ${params.title}`
        )
      }

      this.emit('maintenance:scheduled', { maintenance })

      return maintenance
    } catch (error) {
      this.logger.error(`Failed to schedule maintenance for ${params.assetId}:`, error)
      throw error
    }
  }

  /**
   * Complete maintenance
   */
  async completeMaintenance(
    maintenanceId: string,
    completionData: {
      actualDuration: number
      actualCost: number
      notes: string
      attachments?: Omit<MaintenanceAttachment, 'id' | 'uploadedAt'>[]
      preventiveMeasures?: string[]
    }
  ): Promise<MaintenanceRecord> {
    try {
      // Find maintenance record
      let maintenance: MaintenanceRecord | null = null
      let assetId: string = ''

      for (const [asset, records] of this.maintenanceRecords) {
        const record = records.find(r => r.id === maintenanceId)
        if (record) {
          maintenance = record
          assetId = asset
          break
        }
      }

      if (!maintenance) {
        throw new Error(`Maintenance record ${maintenanceId} not found`)
      }

      // Update maintenance record
      maintenance.status = 'completed'
      maintenance.completedDate = new Date()
      maintenance.actualDuration = completionData.actualDuration
      maintenance.actualCost = completionData.actualCost
      maintenance.notes = completionData.notes
      maintenance.preventiveMeasures = completionData.preventiveMeasures || []
      maintenance.attachments = completionData.attachments?.map(att => ({
        ...att,
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uploadedAt: new Date()
      })) || []
      maintenance.updatedAt = new Date()

      // Update asset status back to normal
      const currentStatus = await this.lifecycleService.getCurrentStatus(assetId)
      if (currentStatus?.status === 'under_maintenance') {
        await this.lifecycleService.updateAssetStatus(
          assetId,
          'transferred',
          'system',
          `Maintenance completed: ${maintenance.title}`
        )
      }

      // Log maintenance completion
      await this.lifecycleService.logAssetEvent(assetId, {
        eventType: 'maintenance',
        title: 'Maintenance Completed',
        description: maintenance.description,
        participants: maintenance.technician ? [maintenance.technician] : [],
        documents: maintenance.attachments.map(a => a.url),
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      // Update asset condition
      await this.updateAssetConditionFromMaintenance(assetId, maintenance)

      this.emit('maintenance:completed', { maintenance })

      return maintenance
    } catch (error) {
      this.logger.error(`Failed to complete maintenance ${maintenanceId}:`, error)
      throw error
    }
  }

  /**
   * Get maintenance history for asset
   */
  getMaintenanceHistory(assetId: string): MaintenanceRecord[] {
    const records = this.maintenanceRecords.get(assetId) || []
    return records.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime())
  }

  // ============ INSURANCE MANAGEMENT ============

  /**
   * Add insurance policy
   */
  async addInsurancePolicy(policy: Omit<InsurancePolicy, 'id' | 'claims' | 'createdAt' | 'updatedAt'>): Promise<InsurancePolicy> {
    try {
      const insurancePolicy: InsurancePolicy = {
        ...policy,
        id: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        claims: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.insurancePolicies.has(policy.assetId)) {
        this.insurancePolicies.set(policy.assetId, [])
      }

      this.insurancePolicies.get(policy.assetId)!.push(insurancePolicy)

      // Schedule renewal reminder
      if (policy.renewalDate) {
        this.scheduleRenewalReminder(insurancePolicy)
      }

      this.emit('insurance:policy:added', { policy: insurancePolicy })

      return insurancePolicy
    } catch (error) {
      this.logger.error(`Failed to add insurance policy for ${policy.assetId}:`, error)
      throw error
    }
  }

  /**
   * File insurance claim
   */
  async fileInsuranceClaim(
    policyId: string,
    claimData: Omit<InsuranceClaim, 'id' | 'policyId' | 'claimNumber' | 'reportedDate' | 'status' | 'documents' | 'createdAt' | 'updatedAt'>
  ): Promise<InsuranceClaim> {
    try {
      // Find policy
      let policy: InsurancePolicy | null = null
      let assetId: string = ''

      for (const [asset, policies] of this.insurancePolicies) {
        const foundPolicy = policies.find(p => p.id === policyId)
        if (foundPolicy) {
          policy = foundPolicy
          assetId = asset
          break
        }
      }

      if (!policy) {
        throw new Error(`Insurance policy ${policyId} not found`)
      }

      const claim: InsuranceClaim = {
        ...claimData,
        id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        policyId,
        claimNumber: `CLM-${Date.now()}`,
        reportedDate: new Date(),
        status: 'filed',
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      policy.claims.push(claim)

      // Update asset status
      await this.lifecycleService.updateAssetStatus(
        assetId,
        'insured',
        'system',
        `Insurance claim filed: ${claimData.description}`
      )

      // Log insurance event
      await this.lifecycleService.logAssetEvent(assetId, {
        eventType: 'insurance_claim',
        title: 'Insurance Claim Filed',
        description: claimData.description,
        participants: [policy.provider],
        documents: claim.documents.map(d => d.url),
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      this.emit('insurance:claim:filed', { policy, claim })

      return claim
    } catch (error) {
      this.logger.error(`Failed to file insurance claim for policy ${policyId}:`, error)
      throw error
    }
  }

  /**
   * Update insurance claim status
   */
  async updateInsuranceClaim(
    claimId: string,
    updates: Partial<Pick<InsuranceClaim, 'status' | 'approvedAmount' | 'assessor' | 'assessmentDate' | 'settlementDate' | 'notes'>>
  ): Promise<InsuranceClaim> {
    try {
      // Find claim
      let claim: InsuranceClaim | null = null
      let policy: InsurancePolicy | null = null
      let assetId: string = ''

      for (const [asset, policies] of this.insurancePolicies) {
        for (const pol of policies) {
          const foundClaim = pol.claims.find(c => c.id === claimId)
          if (foundClaim) {
            claim = foundClaim
            policy = pol
            assetId = asset
            break
          }
        }
        if (claim) break
      }

      if (!claim || !policy) {
        throw new Error(`Insurance claim ${claimId} not found`)
      }

      // Update claim
      Object.assign(claim, updates)
      claim.updatedAt = new Date()

      // Update asset status based on claim resolution
      if (updates.status === 'paid' || updates.status === 'denied') {
        const currentStatus = await this.lifecycleService.getCurrentStatus(assetId)
        if (currentStatus?.status === 'insured') {
          await this.lifecycleService.updateAssetStatus(
            assetId,
            'transferred',
            'system',
            `Insurance claim ${updates.status}`
          )
        }
      }

      this.emit('insurance:claim:updated', { policy, claim })

      return claim
    } catch (error) {
      this.logger.error(`Failed to update insurance claim ${claimId}:`, error)
      throw error
    }
  }

  /**
   * Get insurance policies for asset
   */
  getInsurancePolicies(assetId: string): InsurancePolicy[] {
    const policies = this.insurancePolicies.get(assetId) || []
    return policies.sort((a, b) => b.coverageStartDate.getTime() - a.coverageStartDate.getTime())
  }

  // ============ ASSET CONDITION UPDATES ============

  /**
   * Perform condition assessment
   */
  async performConditionAssessment(assessment: Omit<AssetCondition, 'id' | 'createdAt'>): Promise<AssetCondition> {
    try {
      const condition: AssetCondition = {
        ...assessment,
        id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      }

      if (!this.assetConditions.has(assessment.assetId)) {
        this.assetConditions.set(assessment.assetId, [])
      }

      this.assetConditions.get(assessment.assetId)!.push(condition)

      // Update digital twin condition
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assessment.assetId)
      if (twin) {
        await this.digitalTwinService.updateDigitalTwinCondition(twin.id, {
          overallCondition: condition.overallCondition,
          conditionScore: condition.conditionScore,
          lastAssessment: condition.assessmentDate
        })
      }

      // Generate maintenance recommendations
      await this.generateMaintenanceRecommendations(assessment.assetId, condition)

      // Schedule next inspection
      if (condition.nextInspectionDate) {
        await this.scheduleNextInspection(assessment.assetId, condition.nextInspectionDate)
      }

      this.emit('condition:assessed', { condition })

      return condition
    } catch (error) {
      this.logger.error(`Failed to perform condition assessment for ${assessment.assetId}:`, error)
      throw error
    }
  }

  /**
   * Generate maintenance recommendations from condition assessment
   */
  private async generateMaintenanceRecommendations(assetId: string, condition: AssetCondition): Promise<void> {
    try {
      for (const componentCondition of condition.componentConditions) {
        if (componentCondition.condition === 'poor' || componentCondition.condition === 'critical') {
          // Create maintenance alert
          const alert: MaintenanceAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            assetId,
            alertType: 'condition_deterioration',
            severity: componentCondition.condition === 'critical' ? 'high' : 'medium',
            message: `Component "${componentCondition.component}" condition: ${componentCondition.condition}`,
            recommendedAction: componentCondition.recommendations.join('; '),
            acknowledged: false,
            createdAt: new Date()
          }

          if (!this.maintenanceAlerts.has(assetId)) {
            this.maintenanceAlerts.set(assetId, [])
          }

          this.maintenanceAlerts.get(assetId)!.push(alert)

          this.emit('maintenance:alert:generated', { alert })
        }
      }
    } catch (error) {
      this.logger.error('Failed to generate maintenance recommendations:', error)
    }
  }

  /**
   * Update asset condition from maintenance
   */
  private async updateAssetConditionFromMaintenance(assetId: string, maintenance: MaintenanceRecord): Promise<void> {
    try {
      const latestCondition = this.getLatestConditionAssessment(assetId)
      if (latestCondition) {
        // Improve condition score based on maintenance type
        let conditionImprovement = 0

        switch (maintenance.maintenanceType) {
          case 'corrective':
            conditionImprovement = 15
            break
          case 'preventive':
            conditionImprovement = 5
            break
          case 'upgrade':
            conditionImprovement = 25
            break
        }

        const newScore = Math.min(100, latestCondition.conditionScore + conditionImprovement)
        latestCondition.conditionScore = newScore

        // Update overall condition rating
        if (newScore >= 90) latestCondition.overallCondition = 'excellent'
        else if (newScore >= 70) latestCondition.overallCondition = 'good'
        else if (newScore >= 50) latestCondition.overallCondition = 'fair'
        else if (newScore >= 25) latestCondition.overallCondition = 'poor'
        else latestCondition.overallCondition = 'critical'
      }
    } catch (error) {
      this.logger.error(`Failed to update asset condition from maintenance for ${assetId}:`, error)
    }
  }

  /**
   * Get latest condition assessment
   */
  getLatestConditionAssessment(assetId: string): AssetCondition | null {
    const conditions = this.assetConditions.get(assetId) || []
    return conditions.sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime())[0] || null
  }

  // ============ COMPLIANCE MONITORING ============

  /**
   * Add compliance requirement
   */
  async addComplianceRequirement(requirement: Omit<ComplianceRecord, 'id' | 'complianceStatus' | 'lastChecked' | 'violations' | 'createdAt' | 'updatedAt'>): Promise<ComplianceRecord> {
    try {
      const compliance: ComplianceRecord = {
        ...requirement,
        id: `compliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        complianceStatus: 'pending_review',
        lastChecked: new Date(),
        violations: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.complianceRecords.has(requirement.assetId)) {
        this.complianceRecords.set(requirement.assetId, [])
      }

      this.complianceRecords.get(requirement.assetId)!.push(compliance)

      // Schedule compliance check
      if (requirement.nextCheckDate) {
        this.scheduleComplianceCheck(compliance)
      }

      this.emit('compliance:requirement:added', { compliance })

      return compliance
    } catch (error) {
      this.logger.error(`Failed to add compliance requirement for ${requirement.assetId}:`, error)
      throw error
    }
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    complianceId: string,
    status: ComplianceStatus,
    evidence?: Omit<ComplianceEvidence, 'id'>[],
    violations?: Omit<ComplianceViolation, 'id' | 'detectedDate'>[]
  ): Promise<ComplianceRecord> {
    try {
      // Find compliance record
      let compliance: ComplianceRecord | null = null
      let assetId: string = ''

      for (const [asset, records] of this.complianceRecords) {
        const record = records.find(r => r.id === complianceId)
        if (record) {
          compliance = record
          assetId = asset
          break
        }
      }

      if (!compliance) {
        throw new Error(`Compliance record ${complianceId} not found`)
      }

      // Update compliance status
      compliance.complianceStatus = status
      compliance.lastChecked = new Date()
      compliance.updatedAt = new Date()

      // Add evidence
      if (evidence) {
        compliance.evidence.push(...evidence.map(ev => ({
          ...ev,
          id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })))
      }

      // Add violations
      if (violations) {
        compliance.violations.push(...violations.map(v => ({
          ...v,
          id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          detectedDate: new Date()
        })))

        // Create compliance alerts for violations
        for (const violation of compliance.violations) {
          const alert: MaintenanceAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            assetId,
            alertType: 'compliance_violation',
            severity: violation.severity === 'critical' ? 'critical' : violation.severity === 'high' ? 'high' : 'medium',
            message: `Compliance violation: ${violation.description}`,
            recommendedAction: violation.correctiveAction,
            acknowledged: false,
            createdAt: new Date()
          }

          if (!this.maintenanceAlerts.has(assetId)) {
            this.maintenanceAlerts.set(assetId, [])
          }

          this.maintenanceAlerts.get(assetId)!.push(alert)
        }
      }

      this.emit('compliance:status:updated', { compliance })

      return compliance
    } catch (error) {
      this.logger.error(`Failed to update compliance status for ${complianceId}:`, error)
      throw error
    }
  }

  /**
   * Get compliance records for asset
   */
  getComplianceRecords(assetId: string): ComplianceRecord[] {
    const records = this.complianceRecords.get(assetId) || []
    return records.sort((a, b) => b.lastChecked.getTime() - a.lastChecked.getTime())
  }

  // ============ ASSET IMPROVEMENT TRACKING ============

  /**
   * Track asset improvement
   */
  async trackAssetImprovement(improvement: Omit<AssetImprovement, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<AssetImprovement> {
    try {
      const assetImprovement: AssetImprovement = {
        ...improvement,
        id: `improvement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'planned',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.assetImprovements.has(improvement.assetId)) {
        this.assetImprovements.set(improvement.assetId, [])
      }

      this.assetImprovements.get(improvement.assetId)!.push(assetImprovement)

      this.emit('improvement:tracked', { improvement: assetImprovement })

      return assetImprovement
    } catch (error) {
      this.logger.error(`Failed to track asset improvement for ${improvement.assetId}:`, error)
      throw error
    }
  }

  /**
   * Update improvement status
   */
  async updateImprovementStatus(
    improvementId: string,
    status: ImprovementStatus,
    updates?: Partial<Pick<AssetImprovement, 'completionDate' | 'actualCost' | 'valueIncrease' | 'roi'>>
  ): Promise<AssetImprovement> {
    try {
      // Find improvement
      let improvement: AssetImprovement | null = null
      let assetId: string = ''

      for (const [asset, improvements] of this.assetImprovements) {
        const found = improvements.find(i => i.id === improvementId)
        if (found) {
          improvement = found
          assetId = asset
          break
        }
      }

      if (!improvement) {
        throw new Error(`Asset improvement ${improvementId} not found`)
      }

      // Update improvement
      improvement.status = status
      if (updates) {
        Object.assign(improvement, updates)
      }
      improvement.updatedAt = new Date()

      // Update depreciation schedule if improvement affects asset life
      if (updates?.depreciationImpact && improvement.depreciationImpact > 0) {
        await this.updateDepreciationFromImprovement(assetId, improvement)
      }

      // Log improvement completion
      if (status === 'completed') {
        await this.lifecycleService.logAssetEvent(assetId, {
          eventType: 'improvement',
          title: 'Asset Improvement Completed',
          description: improvement.description,
          participants: improvement.contractor ? [improvement.contractor] : [],
          documents: improvement.attachments.map(a => a.url),
          timestamp: new Date(),
          recordedBy: 'system',
          verified: true
        })
      }

      this.emit('improvement:status:updated', { improvement })

      return improvement
    } catch (error) {
      this.logger.error(`Failed to update improvement status for ${improvementId}:`, error)
      throw error
    }
  }

  /**
   * Get asset improvements
   */
  getAssetImprovements(assetId: string): AssetImprovement[] {
    const improvements = this.assetImprovements.get(assetId) || []
    return improvements.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  }

  // ============ DEPRECIATION CALCULATION ============

  /**
   * Create depreciation schedule
   */
  async createDepreciationSchedule(params: {
    assetId: string
    method: DepreciationMethod
    usefulLife: number // years
    salvageValue: number
    initialCost: number
    startDate: Date
  }): Promise<DepreciationSchedule> {
    try {
      const schedule: DepreciationSchedule = {
        id: `depr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        method: params.method,
        usefulLife: params.usefulLife,
        salvageValue: params.salvageValue,
        totalDepreciation: params.initialCost - params.salvageValue,
        accumulatedDepreciation: 0,
        currentBookValue: params.initialCost,
        depreciationEntries: [],
        lastCalculated: params.startDate,
        nextCalculation: this.getNextDepreciationDate(params.startDate, params.method)
      }

      this.depreciationSchedules.set(params.assetId, schedule)

      // Calculate initial depreciation entries
      await this.calculateDepreciation(schedule)

      this.emit('depreciation:schedule:created', { schedule })

      return schedule
    } catch (error) {
      this.logger.error(`Failed to create depreciation schedule for ${params.assetId}:`, error)
      throw error
    }
  }

  /**
   * Calculate depreciation
   */
  async calculateDepreciation(schedule: DepreciationSchedule): Promise<void> {
    try {
      const now = new Date()
      let currentDate = new Date(schedule.lastCalculated)

      while (currentDate <= now) {
        const periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

        // Skip if already calculated
        if (schedule.depreciationEntries.some(e => e.period === periodKey)) {
          currentDate = this.getNextDepreciationDate(currentDate, schedule.method)
          continue
        }

        const depreciationAmount = this.calculateDepreciationAmount(schedule, currentDate)

        if (depreciationAmount > 0) {
          schedule.accumulatedDepreciation += depreciationAmount
          schedule.currentBookValue = Math.max(schedule.salvageValue, schedule.currentBookValue - depreciationAmount)

          const entry: DepreciationEntry = {
            id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            period: periodKey,
            depreciationAmount,
            accumulatedDepreciation: schedule.accumulatedDepreciation,
            bookValue: schedule.currentBookValue,
            calculationDate: new Date()
          }

          schedule.depreciationEntries.push(entry)
        }

        currentDate = this.getNextDepreciationDate(currentDate, schedule.method)
      }

      schedule.lastCalculated = now
      schedule.nextCalculation = this.getNextDepreciationDate(now, schedule.method)

    } catch (error) {
      this.logger.error('Failed to calculate depreciation:', error)
      throw error
    }
  }

  /**
   * Calculate depreciation amount for period
   */
  private calculateDepreciationAmount(schedule: DepreciationSchedule, calculationDate: Date): number {
    try {
      const assetValue = schedule.currentBookValue + schedule.accumulatedDepreciation - schedule.salvageValue

      switch (schedule.method) {
        case 'straight_line':
          return (assetValue - schedule.salvageValue) / schedule.usefulLife / 12 // Monthly

        case 'declining_balance':
          const rate = 2 / schedule.usefulLife // Double declining
          return Math.max(0, schedule.currentBookValue * rate / 12)

        case 'units_of_production':
          // Would need usage data - simplified calculation
          return assetValue * 0.01 // 1% per month

        case 'sum_of_years_digits':
          // Simplified - would need more complex calculation
          return assetValue / schedule.usefulLife / 12

        default:
          return 0
      }
    } catch (error) {
      this.logger.error('Failed to calculate depreciation amount:', error)
      return 0
    }
  }

  /**
   * Update depreciation from improvement
   */
  private async updateDepreciationFromImprovement(assetId: string, improvement: AssetImprovement): Promise<void> {
    try {
      const schedule = this.depreciationSchedules.get(assetId)
      if (schedule && improvement.depreciationImpact > 0) {
        // Extend useful life
        schedule.usefulLife += improvement.depreciationImpact / 12 // Convert months to years

        // Recalculate depreciation
        await this.calculateDepreciation(schedule)
      }
    } catch (error) {
      this.logger.error(`Failed to update depreciation from improvement for ${assetId}:`, error)
    }
  }

  /**
   * Get next depreciation calculation date
   */
  private getNextDepreciationDate(currentDate: Date, method: DepreciationMethod): Date {
    // Monthly depreciation for all methods (simplified)
    const nextDate = new Date(currentDate)
    nextDate.setMonth(nextDate.getMonth() + 1)
    return nextDate
  }

  /**
   * Get depreciation schedule
   */
  getDepreciationSchedule(assetId: string): DepreciationSchedule | null {
    return this.depreciationSchedules.get(assetId) || null
  }

  // ============ MAINTENANCE SCHEDULING ============

  /**
   * Create maintenance schedule
   */
  async createMaintenanceSchedule(schedule: Omit<MaintenanceSchedule, 'id' | 'createdAt'>): Promise<MaintenanceSchedule> {
    try {
      const maintenanceSchedule: MaintenanceSchedule = {
        ...schedule,
        id: `maint-sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      }

      if (!this.maintenanceSchedules.has(schedule.assetId)) {
        this.maintenanceSchedules.set(schedule.assetId, [])
      }

      this.maintenanceSchedules.get(schedule.assetId)!.push(maintenanceSchedule)

      this.emit('maintenance:schedule:created', { schedule: maintenanceSchedule })

      return maintenanceSchedule
    } catch (error) {
      this.logger.error(`Failed to create maintenance schedule for ${schedule.assetId}:`, error)
      throw error
    }
  }

  // ============ ALERTS AND MONITORING ============

  /**
   * Get maintenance alerts for asset
   */
  getMaintenanceAlerts(assetId: string): MaintenanceAlert[] {
    const alerts = this.maintenanceAlerts.get(assetId) || []
    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<MaintenanceAlert> {
    try {
      // Find alert
      let alert: MaintenanceAlert | null = null

      for (const alerts of this.maintenanceAlerts.values()) {
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

  // ============ UTILITY METHODS ============

  /**
   * Schedule renewal reminder
   */
  private scheduleRenewalReminder(policy: InsurancePolicy): void {
    if (!policy.renewalDate) return

    const reminderDate = new Date(policy.renewalDate)
    reminderDate.setMonth(reminderDate.getMonth() - 1) // 1 month before

    // Create alert
    const alert: MaintenanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetId: policy.assetId,
      alertType: 'insurance_expiring',
      severity: 'medium',
      message: `Insurance policy "${policy.policyNumber}" expires on ${policy.renewalDate.toDateString()}`,
      recommendedAction: 'Review renewal options and ensure continuous coverage',
      dueDate: policy.renewalDate,
      acknowledged: false,
      createdAt: new Date()
    }

    if (!this.maintenanceAlerts.has(policy.assetId)) {
      this.maintenanceAlerts.set(policy.assetId, [])
    }

    this.maintenanceAlerts.get(policy.assetId)!.push(alert)
  }

  /**
   * Schedule compliance check
   */
  private scheduleComplianceCheck(compliance: ComplianceRecord): void {
    if (!compliance.nextCheckDate) return

    // Create alert for upcoming check
    const alert: MaintenanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetId: compliance.assetId,
      alertType: 'compliance_violation', // Will be checked
      severity: 'low',
      message: `Compliance check due for: ${compliance.requirement}`,
      recommendedAction: 'Schedule and complete compliance inspection',
      dueDate: compliance.nextCheckDate,
      acknowledged: false,
      createdAt: new Date()
    }

    if (!this.maintenanceAlerts.has(compliance.assetId)) {
      this.maintenanceAlerts.set(compliance.assetId, [])
    }

    this.maintenanceAlerts.get(compliance.assetId)!.push(alert)
  }

  /**
   * Schedule next inspection
   */
  private async scheduleNextInspection(assetId: string, nextInspectionDate: Date): Promise<void> {
    try {
      const alert: MaintenanceAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        alertType: 'overdue_maintenance',
        severity: 'medium',
        message: `Next inspection due on ${nextInspectionDate.toDateString()}`,
        recommendedAction: 'Schedule condition assessment inspection',
        dueDate: nextInspectionDate,
        acknowledged: false,
        createdAt: new Date()
      }

      if (!this.maintenanceAlerts.has(assetId)) {
        this.maintenanceAlerts.set(assetId, [])
      }

      this.maintenanceAlerts.get(assetId)!.push(alert)
    } catch (error) {
      this.logger.error(`Failed to schedule next inspection for ${assetId}:`, error)
    }
  }

  /**
   * Get comprehensive asset maintenance overview
   */
  getAssetMaintenanceOverview(assetId: string): {
    maintenanceRecords: MaintenanceRecord[]
    insurancePolicies: InsurancePolicy[]
    latestCondition: AssetCondition | null
    complianceRecords: ComplianceRecord[]
    improvements: AssetImprovement[]
    depreciationSchedule: DepreciationSchedule | null
    activeAlerts: MaintenanceAlert[]
  } {
    return {
      maintenanceRecords: this.getMaintenanceHistory(assetId),
      insurancePolicies: this.getInsurancePolicies(assetId),
      latestCondition: this.getLatestConditionAssessment(assetId),
      complianceRecords: this.getComplianceRecords(assetId),
      improvements: this.getAssetImprovements(assetId),
      depreciationSchedule: this.getDepreciationSchedule(assetId),
      activeAlerts: this.getMaintenanceAlerts(assetId).filter(a => !a.acknowledged)
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
        totalAssets: this.maintenanceRecords.size,
        activeMaintenanceRecords: Array.from(this.maintenanceRecords.values()).flat().filter(r => r.status === 'in_progress').length,
        activeInsurancePolicies: Array.from(this.insurancePolicies.values()).flat().filter(p => p.status === 'active').length,
        pendingComplianceChecks: Array.from(this.complianceRecords.values()).flat().filter(r => r.complianceStatus === 'pending_review').length,
        activeMaintenanceAlerts: Array.from(this.maintenanceAlerts.values()).flat().filter(a => !a.acknowledged).length,
        activeDepreciationSchedules: this.depreciationSchedules.size
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.maintenanceRecords.clear()
    this.insurancePolicies.clear()
    this.assetConditions.clear()
    this.complianceRecords.clear()
    this.assetImprovements.clear()
    this.depreciationSchedules.clear()
    this.maintenanceSchedules.clear()
    this.maintenanceAlerts.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All asset maintenance data cleared')
  }
}

export default AssetMaintenanceService
