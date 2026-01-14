import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetMetadataService from './assetMetadataService'
import AssetLifecycleService from './assetLifecycleService'
import DocumentVerificationService from './documentVerificationService'
import logger from '../../utils/logger'

// Asset registration interfaces
export interface AssetRegistration {
  id: string
  assetId: string
  registrantAddress: string
  registrationType: AssetType
  status: RegistrationStatus
  currentStep: RegistrationStep
  steps: RegistrationWorkflowStep[]
  metadata: AssetRegistrationMetadata
  documents: AssetDocument[]
  approvals: AssetApproval[]
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
  approvedAt?: Date
  rejectedAt?: Date
  rejectionReason?: string
}

export interface AssetRegistrationMetadata {
  basicInfo: BasicAssetInfo
  valuation: AssetValuationInfo
  ownership: OwnershipInfo
  compliance: ComplianceInfo
  categorization: AssetCategorization
  risk: RiskAssessment
}

export interface BasicAssetInfo {
  name: string
  description: string
  assetType: AssetType
  location: AssetLocation
  physicalCharacteristics: PhysicalCharacteristics
  identifiers: AssetIdentifiers
}

export interface AssetValuationInfo {
  appraisedValue: number
  currency: string
  appraisalDate: Date
  appraiser: string
  appraisalMethod: string
  marketValue?: number
  replacementValue?: number
  valuationSource: 'manual' | 'automated' | 'oracle'
}

export interface OwnershipInfo {
  currentOwner: string
  ownershipType: 'individual' | 'corporate' | 'trust' | 'partnership'
  ownershipPercentage: number
  acquisitionDate: Date
  acquisitionPrice?: number
  previousOwners?: OwnershipHistory[]
}

export interface OwnershipHistory {
  owner: string
  ownershipPercentage: number
  transferDate: Date
  transferPrice?: number
  transactionHash?: string
}

export interface ComplianceInfo {
  jurisdiction: string
  regulatoryStatus: 'compliant' | 'under_review' | 'non_compliant'
  kycStatus: 'verified' | 'pending' | 'failed'
  amlStatus: 'cleared' | 'flagged' | 'under_investigation'
  sanctionsCheck: 'passed' | 'failed' | 'pending'
  environmentalCompliance?: 'compliant' | 'non_compliant' | 'unknown'
  legalRestrictions?: string[]
}

export interface AssetCategorization {
  primaryCategory: AssetCategory
  subcategories: string[]
  riskClass: 'low' | 'medium' | 'high' | 'very_high'
  liquidityClass: 'liquid' | 'semi_liquid' | 'illiquid'
  marketSegment: string
  tags: string[]
  customClassifications: Record<string, any>
}

export interface RiskAssessment {
  overallRiskScore: number // 0-100
  riskFactors: RiskFactor[]
  mitigationStrategies: string[]
  lastAssessment: Date
  nextAssessment?: Date
}

export interface RiskFactor {
  factor: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  probability: 'low' | 'medium' | 'high' | 'very_high'
  score: number
  description: string
}

export interface AssetLocation {
  address: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  country: string
  region?: string
  city?: string
  postalCode?: string
}

export interface PhysicalCharacteristics {
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: string
  }
  weight?: {
    value: number
    unit: string
  }
  material?: string[]
  color?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  age?: number
  manufacturer?: string
  model?: string
  serialNumber?: string
}

export interface AssetIdentifiers {
  vin?: string // Vehicle Identification Number
  serialNumber?: string
  assetTag?: string
  blockchainId?: string
  externalIds: Record<string, string>
}

export interface AssetDocument {
  id: string
  documentId: string // Reference to document verification service
  documentType: 'ownership' | 'valuation' | 'insurance' | 'legal' | 'technical' | 'other'
  name: string
  description: string
  required: boolean
  status: 'pending' | 'submitted' | 'verified' | 'rejected'
  submittedAt?: Date
  verifiedAt?: Date
  rejectionReason?: string
}

export interface AssetApproval {
  id: string
  step: RegistrationStep
  approverAddress: string
  approverRole: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approvedAt?: Date
  requiredRole: string
  approvalCriteria: ApprovalCriteria
}

export interface ApprovalCriteria {
  minimumAuthority: 'low' | 'medium' | 'high' | 'executive'
  requiresDocumentation: boolean
  timeLimit?: number // hours
  conditions: string[]
}

export interface RegistrationWorkflowStep {
  id: string
  name: string
  description: string
  order: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  required: boolean
  dependencies: string[] // Step IDs that must be completed first
  assignedTo?: string
  completedAt?: Date
  completedBy?: string
  data: Record<string, any>
  validation: StepValidation
}

export interface StepValidation {
  requiredFields: string[]
  validationRules: ValidationRule[]
  automatedChecks: string[]
  manualReviewRequired: boolean
}

export interface ValidationRule {
  field: string
  rule: 'required' | 'format' | 'range' | 'custom'
  value?: any
  message: string
}

export interface AssetVerificationResult {
  id: string
  registrationId: string
  verificationType: 'identity' | 'ownership' | 'valuation' | 'compliance' | 'technical'
  status: 'pending' | 'passed' | 'failed' | 'requires_review'
  verifiedAt?: Date
  verifiedBy: string
  results: VerificationCheck[]
  overallScore: number
  recommendations: string[]
}

export interface VerificationCheck {
  checkName: string
  status: 'passed' | 'failed' | 'warning'
  score: number
  details: Record<string, any>
  evidence?: string[]
}

export type AssetType =
  | 'real_estate' | 'vehicle' | 'artwork' | 'collectible' | 'commodity' | 'equipment'
  | 'machinery' | 'intellectual_property' | 'securities' | 'debt_instruments' | 'other'

export type AssetCategory =
  | 'residential_real_estate' | 'commercial_real_estate' | 'industrial_real_estate'
  | 'automotive' | 'art_and_collectibles' | 'industrial_equipment' | 'agricultural'
  | 'precious_metals' | 'energy_assets' | 'infrastructure' | 'other'

export type RegistrationStatus =
  | 'draft' | 'information_collection' | 'verification' | 'review' | 'approval'
  | 'approved' | 'rejected' | 'cancelled'

export type RegistrationStep =
  | 'basic_info' | 'valuation' | 'ownership' | 'documentation' | 'compliance'
  | 'categorization' | 'verification' | 'final_review' | 'approval'

/**
 * Asset Registration Service for RWA Tokenization
 * Comprehensive asset registration workflow with information collection,
 * verification, approval, and metadata standardization
 */
export class AssetRegistrationService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private metadataService: AssetMetadataService
  private lifecycleService: AssetLifecycleService
  private documentService: DocumentVerificationService

  // Data storage
  private registrations: Map<string, AssetRegistration> = new Map()
  private verificationResults: Map<string, AssetVerificationResult[]> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    metadataService: AssetMetadataService,
    lifecycleService: AssetLifecycleService,
    documentService: DocumentVerificationService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.metadataService = metadataService
    this.lifecycleService = lifecycleService
    this.documentService = documentService
    this.logger = loggerInstance
  }

  // ============ ASSET CREATION WORKFLOW ============

  /**
   * Initialize asset registration
   */
  async initializeRegistration(params: {
    registrantAddress: string
    assetType: AssetType
    initialMetadata?: Partial<AssetRegistrationMetadata>
  }): Promise<AssetRegistration> {
    try {
      const registrationId = `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create workflow steps
      const steps = this.createWorkflowSteps(assetType)

      // Initialize metadata
      const metadata: AssetRegistrationMetadata = {
        basicInfo: {
          name: '',
          description: '',
          assetType,
          location: {
            address: '',
            country: '',
            city: ''
          },
          physicalCharacteristics: {
            condition: 'unknown'
          },
          identifiers: {
            externalIds: {}
          }
        },
        valuation: {
          appraisedValue: 0,
          currency: 'USD',
          appraisalDate: new Date(),
          appraiser: '',
          appraisalMethod: '',
          valuationSource: 'manual'
        },
        ownership: {
          currentOwner: params.registrantAddress,
          ownershipType: 'individual',
          ownershipPercentage: 100,
          acquisitionDate: new Date()
        },
        compliance: {
          jurisdiction: '',
          regulatoryStatus: 'under_review',
          kycStatus: 'pending',
          amlStatus: 'flagged',
          sanctionsCheck: 'pending'
        },
        categorization: {
          primaryCategory: 'other',
          subcategories: [],
          riskClass: 'medium',
          liquidityClass: 'illiquid',
          marketSegment: '',
          tags: [],
          customClassifications: {}
        },
        risk: {
          overallRiskScore: 50,
          riskFactors: [],
          mitigationStrategies: [],
          lastAssessment: new Date()
        },
        ...params.initialMetadata
      }

      const registration: AssetRegistration = {
        id: registrationId,
        assetId,
        registrantAddress: params.registrantAddress,
        registrationType: assetType,
        status: 'draft',
        currentStep: 'basic_info',
        steps,
        metadata,
        documents: this.createRequiredDocuments(assetType),
        approvals: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.registrations.set(registrationId, registration)

      this.emit('registration:initialized', { registration })

      return registration
    } catch (error) {
      this.logger.error('Failed to initialize asset registration:', error)
      throw error
    }
  }

  /**
   * Create workflow steps based on asset type
   */
  private createWorkflowSteps(assetType: AssetType): RegistrationWorkflowStep[] {
    const baseSteps: RegistrationWorkflowStep[] = [
      {
        id: 'basic_info',
        name: 'Basic Information',
        description: 'Collect basic asset information',
        order: 1,
        status: 'in_progress',
        required: true,
        dependencies: [],
        data: {},
        validation: {
          requiredFields: ['name', 'description', 'location'],
          validationRules: [
            { field: 'name', rule: 'required', message: 'Asset name is required' },
            { field: 'description', rule: 'required', message: 'Asset description is required' }
          ],
          automatedChecks: ['format_validation'],
          manualReviewRequired: false
        }
      },
      {
        id: 'valuation',
        name: 'Asset Valuation',
        description: 'Collect and verify asset valuation information',
        order: 2,
        status: 'pending',
        required: true,
        dependencies: ['basic_info'],
        data: {},
        validation: {
          requiredFields: ['appraisedValue', 'appraisalDate', 'appraiser'],
          validationRules: [
            { field: 'appraisedValue', rule: 'range', value: { min: 0 }, message: 'Value must be positive' }
          ],
          automatedChecks: ['valuation_consistency', 'market_comparison'],
          manualReviewRequired: true
        }
      },
      {
        id: 'ownership',
        name: 'Ownership Verification',
        description: 'Verify ownership and transfer history',
        order: 3,
        status: 'pending',
        required: true,
        dependencies: ['basic_info'],
        data: {},
        validation: {
          requiredFields: ['currentOwner', 'ownershipType', 'acquisitionDate'],
          validationRules: [
            { field: 'ownershipPercentage', rule: 'range', value: { min: 0, max: 100 }, message: 'Percentage must be 0-100' }
          ],
          automatedChecks: ['ownership_verification', 'chain_analysis'],
          manualReviewRequired: true
        }
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Collect and verify required documents',
        order: 4,
        status: 'pending',
        required: true,
        dependencies: ['basic_info', 'ownership'],
        data: {},
        validation: {
          requiredFields: [],
          validationRules: [],
          automatedChecks: ['document_completeness', 'document_authenticity'],
          manualReviewRequired: true
        }
      },
      {
        id: 'compliance',
        name: 'Compliance Check',
        description: 'Perform regulatory and compliance verification',
        order: 5,
        status: 'pending',
        required: true,
        dependencies: ['ownership', 'documentation'],
        data: {},
        validation: {
          requiredFields: ['jurisdiction', 'kycStatus'],
          validationRules: [],
          automatedChecks: ['kyc_check', 'aml_check', 'sanctions_check'],
          manualReviewRequired: true
        }
      },
      {
        id: 'categorization',
        name: 'Asset Categorization',
        description: 'Categorize and classify the asset',
        order: 6,
        status: 'pending',
        required: true,
        dependencies: ['valuation', 'compliance'],
        data: {},
        validation: {
          requiredFields: ['primaryCategory', 'riskClass'],
          validationRules: [],
          automatedChecks: ['category_validation', 'risk_assessment'],
          manualReviewRequired: false
        }
      },
      {
        id: 'verification',
        name: 'Asset Verification',
        description: 'Comprehensive asset verification process',
        order: 7,
        status: 'pending',
        required: true,
        dependencies: ['valuation', 'ownership', 'documentation', 'compliance'],
        data: {},
        validation: {
          requiredFields: [],
          validationRules: [],
          automatedChecks: ['comprehensive_verification'],
          manualReviewRequired: true
        }
      },
      {
        id: 'final_review',
        name: 'Final Review',
        description: 'Final review before approval',
        order: 8,
        status: 'pending',
        required: true,
        dependencies: ['verification', 'categorization'],
        data: {},
        validation: {
          requiredFields: [],
          validationRules: [],
          automatedChecks: ['final_validation'],
          manualReviewRequired: true
        }
      },
      {
        id: 'approval',
        name: 'Approval',
        description: 'Final approval for asset registration',
        order: 9,
        status: 'pending',
        required: true,
        dependencies: ['final_review'],
        data: {},
        validation: {
          requiredFields: [],
          validationRules: [],
          automatedChecks: [],
          manualReviewRequired: false
        }
      }
    ]

    // Adjust steps based on asset type
    return this.adjustStepsForAssetType(baseSteps, assetType)
  }

  /**
   * Adjust workflow steps based on asset type
   */
  private adjustStepsForAssetType(steps: RegistrationWorkflowStep[], assetTypeParam: AssetType): RegistrationWorkflowStep[] {
    // Add or modify steps based on asset type
    switch (assetTypeParam) {
      case 'real_estate':
        // Add property-specific validations
        const valuationStep = steps.find(s => s.id === 'valuation')
        if (valuationStep) {
          valuationStep.validation.automatedChecks.push('property_valuation_check')
        }
        break

      case 'vehicle':
        // Add VIN verification
        const ownershipStep = steps.find(s => s.id === 'ownership')
        if (ownershipStep) {
          ownershipStep.validation.requiredFields.push('identifiers.vin')
        }
        break

      case 'artwork':
        // Add provenance verification
        const verificationStep = steps.find(s => s.id === 'verification')
        if (verificationStep) {
          verificationStep.validation.automatedChecks.push('provenance_check')
        }
        break
    }

    return steps
  }

  /**
   * Create required documents based on asset type
   */
  private createRequiredDocuments(assetType: AssetType): AssetDocument[] {
    const baseDocuments: AssetDocument[] = [
      {
        id: `doc-${Date.now()}-ownership`,
        documentId: '',
        documentType: 'ownership',
        name: 'Proof of Ownership',
        description: 'Document proving legal ownership',
        required: true,
        status: 'pending'
      },
      {
        id: `doc-${Date.now()}-valuation`,
        documentId: '',
        documentType: 'valuation',
        name: 'Asset Valuation Report',
        description: 'Professional appraisal or valuation report',
        required: true,
        status: 'pending'
      }
    ]

    // Add asset-specific documents
    switch (assetType) {
      case 'real_estate':
        baseDocuments.push(
          {
            id: `doc-${Date.now()}-deed`,
            documentId: '',
            documentType: 'legal',
            name: 'Property Deed',
            description: 'Official property deed',
            required: true,
            status: 'pending'
          },
          {
            id: `doc-${Date.now()}-title`,
            documentId: '',
            documentType: 'legal',
            name: 'Title Insurance',
            description: 'Title insurance policy',
            required: false,
            status: 'pending'
          }
        )
        break

      case 'vehicle':
        baseDocuments.push(
          {
            id: `doc-${Date.now()}-registration`,
            documentId: '',
            documentType: 'legal',
            name: 'Vehicle Registration',
            description: 'Official vehicle registration document',
            required: true,
            status: 'pending'
          }
        )
        break

      case 'artwork':
        baseDocuments.push(
          {
            id: `doc-${Date.now()}-authenticity`,
            documentId: '',
            documentType: 'legal',
            name: 'Certificate of Authenticity',
            description: 'Certificate verifying artwork authenticity',
            required: true,
            status: 'pending'
          }
        )
        break
    }

    return baseDocuments
  }

  // ============ ASSET INFORMATION COLLECTION ============

  /**
   * Update registration step data
   */
  async updateStepData(
    registrationId: string,
    stepId: RegistrationStep,
    data: Record<string, any>
  ): Promise<RegistrationWorkflowStep> {
    try {
      const registration = this.registrations.get(registrationId)
      if (!registration) {
        throw new Error(`Registration ${registrationId} not found`)
      }

      const step = registration.steps.find(s => s.id === stepId)
      if (!step) {
        throw new Error(`Step ${stepId} not found in registration`)
      }

      // Update step data
      step.data = { ...step.data, ...data }
      step.updatedAt = new Date()

      // Validate step data
      const validationResult = this.validateStepData(step)
      if (validationResult.isValid) {
        step.status = 'completed'
        step.completedAt = new Date()
        step.completedBy = registration.registrantAddress // Would be actual user

        // Move to next step
        await this.advanceToNextStep(registration)
      }

      registration.updatedAt = new Date()

      this.emit('step:updated', { registrationId, stepId, step })

      return step
    } catch (error) {
      this.logger.error(`Failed to update step data for ${registrationId}:`, error)
      throw error
    }
  }

  /**
   * Validate step data
   */
  private validateStepData(step: RegistrationWorkflowStep): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required fields
    for (const field of step.validation.requiredFields) {
      if (!this.getNestedValue(step.data, field)) {
        errors.push(`${field} is required`)
      }
    }

    // Apply validation rules
    for (const rule of step.validation.validationRules) {
      const value = this.getNestedValue(step.data, rule.field)
      if (!this.validateRule(value, rule)) {
        errors.push(rule.message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate individual rule
   */
  private validateRule(value: any, rule: ValidationRule): boolean {
    switch (rule.rule) {
      case 'required':
        return value !== undefined && value !== null && value !== ''

      case 'range':
        if (typeof value !== 'number') return false
        const min = rule.value?.min ?? -Infinity
        const max = rule.value?.max ?? Infinity
        return value >= min && value <= max

      case 'format':
        // Basic format validation
        return typeof value === 'string' && value.length > 0

      default:
        return true
    }
  }

  /**
   * Get nested object value
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Advance to next step
   */
  private async advanceToNextStep(registration: AssetRegistration): Promise<void> {
    const currentStepIndex = registration.steps.findIndex(s => s.id === registration.currentStep)
    if (currentStepIndex < registration.steps.length - 1) {
      const nextStep = registration.steps[currentStepIndex + 1]

      // Check dependencies
      const dependenciesMet = nextStep.dependencies.every(depId => {
        const depStep = registration.steps.find(s => s.id === depId)
        return depStep?.status === 'completed'
      })

      if (dependenciesMet) {
        registration.currentStep = nextStep.id as RegistrationStep
        nextStep.status = 'in_progress'

        // Update registration status based on current step
        registration.status = this.getStatusForStep(registration.currentStep)
      }
    }
  }

  /**
   * Get registration status for step
   */
  private getStatusForStep(step: RegistrationStep): RegistrationStatus {
    switch (step) {
      case 'basic_info':
        return 'information_collection'
      case 'valuation':
      case 'ownership':
      case 'documentation':
        return 'information_collection'
      case 'compliance':
      case 'categorization':
        return 'verification'
      case 'verification':
        return 'review'
      case 'final_review':
        return 'approval'
      case 'approval':
        return 'approved'
      default:
        return 'draft'
    }
  }

  // ============ ASSET VERIFICATION PROCESS ============

  /**
   * Perform comprehensive asset verification
   */
  async performAssetVerification(
    registrationId: string,
    verificationTypes: AssetVerificationResult['verificationType'][]
  ): Promise<AssetVerificationResult[]> {
    try {
      const registration = this.registrations.get(registrationId)
      if (!registration) {
        throw new Error(`Registration ${registrationId} not found`)
      }

      const results: AssetVerificationResult[] = []

      for (const verificationType of verificationTypes) {
        const result = await this.performVerificationType(registration, verificationType)
        results.push(result)

        if (!this.verificationResults.has(registrationId)) {
          this.verificationResults.set(registrationId, [])
        }
        this.verificationResults.get(registrationId)!.push(result)
      }

      // Update overall verification status
      this.updateVerificationStatus(registration, results)

      this.emit('verification:completed', { registrationId, results })

      return results
    } catch (error) {
      this.logger.error(`Failed to perform asset verification for ${registrationId}:`, error)
      throw error
    }
  }

  /**
   * Perform specific verification type
   */
  private async performVerificationType(
    registration: AssetRegistration,
    verificationType: AssetVerificationResult['verificationType']
  ): Promise<AssetVerificationResult> {
    try {
      const checks: VerificationCheck[] = []
      let overallScore = 0

      switch (verificationType) {
        case 'identity':
          checks.push(...await this.verifyIdentity(registration))
          break

        case 'ownership':
          checks.push(...await this.verifyOwnership(registration))
          break

        case 'valuation':
          checks.push(...await this.verifyValuation(registration))
          break

        case 'compliance':
          checks.push(...await this.verifyCompliance(registration))
          break

        case 'technical':
          checks.push(...await this.verifyTechnical(registration))
          break
      }

      // Calculate overall score
      if (checks.length > 0) {
        overallScore = checks.reduce((sum, check) => sum + check.score, 0) / checks.length
      }

      return {
        id: `verif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        registrationId: registration.id,
        verificationType,
        status: overallScore >= 80 ? 'passed' : overallScore >= 60 ? 'requires_review' : 'failed',
        verifiedAt: new Date(),
        verifiedBy: 'system',
        results: checks,
        overallScore,
        recommendations: this.generateVerificationRecommendations(checks)
      }
    } catch (error) {
      this.logger.error(`Failed to perform ${verificationType} verification:`, error)
      throw error
    }
  }

  /**
   * Verify identity information
   */
  private async verifyIdentity(registration: AssetRegistration): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = []

    // Basic info verification
    checks.push({
      checkName: 'basic_info_completeness',
      status: registration.metadata.basicInfo.name && registration.metadata.basicInfo.description ? 'passed' : 'failed',
      score: registration.metadata.basicInfo.name && registration.metadata.basicInfo.description ? 100 : 0,
      details: { hasName: !!registration.metadata.basicInfo.name, hasDescription: !!registration.metadata.basicInfo.description }
    })

    // Location verification
    const hasValidLocation = registration.metadata.basicInfo.location.country && registration.metadata.basicInfo.location.city
    checks.push({
      checkName: 'location_verification',
      status: hasValidLocation ? 'passed' : 'warning',
      score: hasValidLocation ? 90 : 60,
      details: { hasCountry: !!registration.metadata.basicInfo.location.country, hasCity: !!registration.metadata.basicInfo.location.city }
    })

    return checks
  }

  /**
   * Verify ownership information
   */
  private async verifyOwnership(registration: AssetRegistration): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = []

    const ownership = registration.metadata.ownership

    // Ownership percentage verification
    checks.push({
      checkName: 'ownership_percentage',
      status: ownership.ownershipPercentage > 0 && ownership.ownershipPercentage <= 100 ? 'passed' : 'failed',
      score: ownership.ownershipPercentage > 0 && ownership.ownershipPercentage <= 100 ? 100 : 0,
      details: { percentage: ownership.ownershipPercentage }
    })

    // Acquisition date verification
    const daysSinceAcquisition = (Date.now() - ownership.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)
    checks.push({
      checkName: 'acquisition_date',
      status: daysSinceAcquisition >= 0 ? 'passed' : 'failed',
      score: daysSinceAcquisition >= 0 ? 100 : 0,
      details: { daysSinceAcquisition, acquisitionDate: ownership.acquisitionDate }
    })

    return checks
  }

  /**
   * Verify valuation information
   */
  private async verifyValuation(registration: AssetRegistration): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = []

    const valuation = registration.metadata.valuation

    // Value range verification
    checks.push({
      checkName: 'valuation_range',
      status: valuation.appraisedValue > 0 ? 'passed' : 'failed',
      score: valuation.appraisedValue > 0 ? 100 : 0,
      details: { appraisedValue: valuation.appraisedValue, currency: valuation.currency }
    })

    // Appraisal date verification
    const daysSinceAppraisal = (Date.now() - valuation.appraisalDate.getTime()) / (1000 * 60 * 60 * 24)
    checks.push({
      checkName: 'appraisal_recency',
      status: daysSinceAppraisal <= 365 ? 'passed' : daysSinceAppraisal <= 730 ? 'warning' : 'failed',
      score: daysSinceAppraisal <= 365 ? 100 : daysSinceAppraisal <= 730 ? 70 : 30,
      details: { daysSinceAppraisal, appraisalDate: valuation.appraisalDate }
    })

    return checks
  }

  /**
   * Verify compliance information
   */
  private async verifyCompliance(registration: AssetRegistration): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = []

    const compliance = registration.metadata.compliance

    // KYC status verification
    checks.push({
      checkName: 'kyc_status',
      status: compliance.kycStatus === 'verified' ? 'passed' : compliance.kycStatus === 'pending' ? 'warning' : 'failed',
      score: compliance.kycStatus === 'verified' ? 100 : compliance.kycStatus === 'pending' ? 50 : 0,
      details: { kycStatus: compliance.kycStatus }
    })

    // AML status verification
    checks.push({
      checkName: 'aml_status',
      status: compliance.amlStatus === 'cleared' ? 'passed' : compliance.amlStatus === 'flagged' ? 'warning' : 'failed',
      score: compliance.amlStatus === 'cleared' ? 100 : compliance.amlStatus === 'flagged' ? 50 : 0,
      details: { amlStatus: compliance.amlStatus }
    })

    return checks
  }

  /**
   * Verify technical information
   */
  private async verifyTechnical(registration: AssetRegistration): Promise<VerificationCheck[]> {
    const checks: VerificationCheck[] = []

    // Document verification
    const requiredDocs = registration.documents.filter(d => d.required)
    const submittedDocs = requiredDocs.filter(d => d.status === 'submitted' || d.status === 'verified')
    const docCompletion = submittedDocs.length / requiredDocs.length

    checks.push({
      checkName: 'document_completeness',
      status: docCompletion >= 1 ? 'passed' : docCompletion >= 0.8 ? 'warning' : 'failed',
      score: docCompletion * 100,
      details: { requiredDocs: requiredDocs.length, submittedDocs: submittedDocs.length, completionRate: docCompletion }
    })

    // Metadata completeness
    const metadataFields = ['basicInfo', 'valuation', 'ownership', 'compliance', 'categorization']
    const completedFields = metadataFields.filter(field => {
      const data = (registration.metadata as any)[field]
      return data && Object.keys(data).length > 0
    })
    const metadataCompletion = completedFields.length / metadataFields.length

    checks.push({
      checkName: 'metadata_completeness',
      status: metadataCompletion >= 1 ? 'passed' : metadataCompletion >= 0.8 ? 'warning' : 'failed',
      score: metadataCompletion * 100,
      details: { totalFields: metadataFields.length, completedFields: completedFields.length, completionRate: metadataCompletion }
    })

    return checks
  }

  /**
   * Generate verification recommendations
   */
  private generateVerificationRecommendations(checks: VerificationCheck[]): string[] {
    const recommendations: string[] = []
    const failedChecks = checks.filter(c => c.status === 'failed')
    const warningChecks = checks.filter(c => c.status === 'warning')

    failedChecks.forEach(check => {
      switch (check.checkName) {
        case 'basic_info_completeness':
          recommendations.push('Complete basic asset information (name, description)')
          break
        case 'ownership_percentage':
          recommendations.push('Verify ownership percentage is between 0 and 100')
          break
        case 'valuation_range':
          recommendations.push('Provide valid positive valuation amount')
          break
        case 'kyc_status':
          recommendations.push('Complete KYC verification process')
          break
      }
    })

    warningChecks.forEach(check => {
      switch (check.checkName) {
        case 'appraisal_recency':
          recommendations.push('Consider updating asset appraisal (older than 1 year)')
          break
        case 'location_verification':
          recommendations.push('Provide complete location information')
          break
      }
    })

    return recommendations
  }

  /**
   * Update verification status
   */
  private updateVerificationStatus(
    registration: AssetRegistration,
    results: AssetVerificationResult[]
  ): void {
    const averageScore = results.reduce((sum, result) => sum + result.overallScore, 0) / results.length
    const hasFailures = results.some(r => r.status === 'failed')
    const hasWarnings = results.some(r => r.status === 'requires_review')

    if (hasFailures) {
      registration.status = 'rejected'
      registration.rejectionReason = 'Verification failed - critical issues found'
    } else if (hasWarnings || averageScore < 80) {
      registration.status = 'review'
    } else {
      registration.status = 'approved'
    }
  }

  // ============ ASSET APPROVAL WORKFLOW ============

  /**
   * Create approval workflow for registration
   */
  async createApprovalWorkflow(
    registrationId: string,
    approverAddress: string
  ): Promise<AssetApproval[]> {
    try {
      const registration = this.registrations.get(registrationId)
      if (!registration) {
        throw new Error(`Registration ${registrationId} not found`)
      }

      const approvals: AssetApproval[] = []

      // Create approval for final review step
      const finalReviewApproval: AssetApproval = {
        id: `approval-${Date.now()}-final`,
        step: 'final_review',
        approverAddress,
        approverRole: 'compliance_officer', // Would be determined by address
        status: 'pending',
        requiredRole: 'compliance_officer',
        approvalCriteria: {
          minimumAuthority: 'high',
          requiresDocumentation: true,
          timeLimit: 168, // 7 days
          conditions: ['all_verifications_passed', 'documents_verified', 'compliance_cleared']
        }
      }

      // Create approval for final approval step
      const finalApproval: AssetApproval = {
        id: `approval-${Date.now()}-approval`,
        step: 'approval',
        approverAddress,
        approverRole: 'executive', // Would be determined by address
        status: 'pending',
        requiredRole: 'executive',
        approvalCriteria: {
          minimumAuthority: 'executive',
          requiresDocumentation: false,
          timeLimit: 72, // 3 days
          conditions: ['final_review_approved', 'no_critical_issues']
        }
      }

      approvals.push(finalReviewApproval, finalApproval)
      registration.approvals = approvals

      this.emit('approval:workflow:created', { registrationId, approvals })

      return approvals
    } catch (error) {
      this.logger.error(`Failed to create approval workflow for ${registrationId}:`, error)
      throw error
    }
  }

  /**
   * Submit registration approval
   */
  async submitApproval(
    registrationId: string,
    approvalId: string,
    approverAddress: string,
    decision: 'approved' | 'rejected',
    comments?: string
  ): Promise<AssetApproval> {
    try {
      const registration = this.registrations.get(registrationId)
      if (!registration) {
        throw new Error(`Registration ${registrationId} not found`)
      }

      const approval = registration.approvals.find(a => a.id === approvalId)
      if (!approval) {
        throw new Error(`Approval ${approvalId} not found`)
      }

      // Update approval
      approval.status = decision
      approval.comments = comments
      approval.approvedAt = new Date()

      // Update registration status
      if (decision === 'approved') {
        if (approval.step === 'final_review') {
          registration.status = 'approval'
          registration.currentStep = 'approval'
        } else if (approval.step === 'approval') {
          registration.status = 'approved'
          registration.approvedAt = new Date()
          await this.finalizeRegistration(registration)
        }
      } else {
        registration.status = 'rejected'
        registration.rejectedAt = new Date()
        registration.rejectionReason = comments || 'Approval rejected'
      }

      this.emit('approval:submitted', { registrationId, approvalId, approval })

      return approval
    } catch (error) {
      this.logger.error(`Failed to submit approval for ${registrationId}:`, error)
      throw error
    }
  }

  /**
   * Finalize approved registration
   */
  private async finalizeRegistration(registration: AssetRegistration): Promise<void> {
    try {
      // Create digital twin
      const digitalTwin = await this.digitalTwinService.createDigitalTwin({
        physicalAssetId: registration.assetId,
        blockchain: 'base',
        tokenStandard: 'ERC721',
        fractionalOwnership: false,
        totalSupply: 1
      })

      // Create standardized metadata
      const standardizedMetadata = this.standardizeMetadata(registration.metadata)
      await this.metadataService.createMetadata(registration.assetId, standardizedMetadata)

      // Initialize lifecycle
      await this.lifecycleService.initializeAssetStatus(registration.assetId, 'tokenized')

      this.emit('registration:finalized', { registration, digitalTwin })

    } catch (error) {
      this.logger.error(`Failed to finalize registration ${registration.id}:`, error)
      // Could implement rollback logic here
    }
  }

  // ============ ASSET METADATA STANDARDIZATION ============

  /**
   * Standardize metadata according to asset type
   */
  private standardizeMetadata(metadata: AssetRegistrationMetadata): any {
    const standardized: any = {
      name: metadata.basicInfo.name,
      description: metadata.basicInfo.description,
      assetType: metadata.basicInfo.assetType,
      category: metadata.categorization.primaryCategory,
      subcategories: metadata.categorization.subcategories,
      tags: metadata.categorization.tags,

      // Location
      location: metadata.basicInfo.location,

      // Physical characteristics
      physicalCharacteristics: metadata.basicInfo.physicalCharacteristics,

      // Valuation
      valuation: {
        appraisedValue: metadata.valuation.appraisedValue,
        currency: metadata.valuation.currency,
        appraisalDate: metadata.valuation.appraisalDate.toISOString(),
        appraiser: metadata.valuation.appraiser,
        appraisalMethod: metadata.valuation.appraisalMethod,
        marketValue: metadata.valuation.marketValue,
        replacementValue: metadata.valuation.replacementValue
      },

      // Ownership
      ownership: {
        currentOwner: metadata.ownership.currentOwner,
        ownershipType: metadata.ownership.ownershipType,
        ownershipPercentage: metadata.ownership.ownershipPercentage,
        acquisitionDate: metadata.ownership.acquisitionDate.toISOString(),
        acquisitionPrice: metadata.ownership.acquisitionPrice,
        previousOwners: metadata.ownership.previousOwners
      },

      // Identifiers
      identifiers: metadata.basicInfo.identifiers,

      // Compliance
      compliance: {
        jurisdiction: metadata.compliance.jurisdiction,
        regulatoryStatus: metadata.compliance.regulatoryStatus,
        kycStatus: metadata.compliance.kycStatus,
        amlStatus: metadata.compliance.amlStatus,
        sanctionsCheck: metadata.compliance.sanctionsCheck,
        environmentalCompliance: metadata.compliance.environmentalCompliance,
        legalRestrictions: metadata.compliance.legalRestrictions
      },

      // Categorization
      categorization: metadata.categorization,

      // Risk assessment
      risk: metadata.risk
    }

    // Asset-type specific standardization
    switch (metadata.basicInfo.assetType) {
      case 'real_estate':
        standardized.propertyDetails = {
          propertyType: 'real_estate',
          zoning: metadata.basicInfo.physicalCharacteristics.material?.[0] || 'unknown',
          squareFootage: this.calculateSquareFootage(metadata.basicInfo.physicalCharacteristics.dimensions),
          yearBuilt: metadata.basicInfo.physicalCharacteristics.age ?
            new Date().getFullYear() - metadata.basicInfo.physicalCharacteristics.age : undefined
        }
        break

      case 'vehicle':
        standardized.vehicleDetails = {
          vin: metadata.basicInfo.identifiers.vin,
          make: metadata.basicInfo.physicalCharacteristics.manufacturer,
          model: metadata.basicInfo.physicalCharacteristics.model,
          year: metadata.basicInfo.physicalCharacteristics.age ?
            new Date().getFullYear() - metadata.basicInfo.physicalCharacteristics.age : undefined,
          mileage: metadata.basicInfo.physicalCharacteristics.weight?.value // Using weight as proxy
        }
        break

      case 'artwork':
        standardized.artworkDetails = {
          artist: metadata.basicInfo.physicalCharacteristics.manufacturer,
          medium: metadata.basicInfo.physicalCharacteristics.material?.[0],
          dimensions: metadata.basicInfo.physicalCharacteristics.dimensions,
          creationYear: metadata.basicInfo.physicalCharacteristics.age ?
            new Date().getFullYear() - metadata.basicInfo.physicalCharacteristics.age : undefined
        }
        break
    }

    return standardized
  }

  /**
   * Calculate square footage from dimensions
   */
  private calculateSquareFootage(dimensions?: any): number | undefined {
    if (!dimensions?.length || !dimensions?.width) return undefined
    return dimensions.length * dimensions.width
  }

  // ============ ASSET CATEGORIZATION ============

  /**
   * Auto-categorize asset based on metadata
   */
  async autoCategorizeAsset(registrationId: string): Promise<AssetCategorization> {
    try {
      const registration = this.registrations.get(registrationId)
      if (!registration) {
        throw new Error(`Registration ${registrationId} not found`)
      }

      const categorization = this.generateCategorization(registration.metadata)
      registration.metadata.categorization = categorization

      // Update risk assessment
      registration.metadata.risk = await this.assessRisk(registration.metadata)

      this.emit('asset:categorized', { registrationId, categorization })

      return categorization
    } catch (error) {
      this.logger.error(`Failed to categorize asset ${registrationId}:`, error)
      throw error
    }
  }

  /**
   * Generate asset categorization
   */
  private generateCategorization(metadata: AssetRegistrationMetadata): AssetCategorization {
    const { basicInfo, valuation, compliance } = metadata

    // Primary category based on asset type
    let primaryCategory: AssetCategory
    switch (basicInfo.assetType) {
      case 'real_estate':
        primaryCategory = basicInfo.physicalCharacteristics.condition === 'excellent' ||
                         basicInfo.description.toLowerCase().includes('commercial') ?
                         'commercial_real_estate' : 'residential_real_estate'
        break
      case 'vehicle':
        primaryCategory = 'automotive'
        break
      case 'artwork':
      case 'collectible':
        primaryCategory = 'art_and_collectibles'
        break
      case 'equipment':
      case 'machinery':
        primaryCategory = 'industrial_equipment'
        break
      default:
        primaryCategory = 'other'
    }

    // Risk class based on various factors
    let riskClass: 'low' | 'medium' | 'high' | 'very_high' = 'medium'
    if (compliance.amlStatus === 'flagged' || compliance.sanctionsCheck === 'failed') {
      riskClass = 'very_high'
    } else if (valuation.appraisedValue > 1000000) {
      riskClass = 'high'
    } else if (valuation.appraisedValue < 10000) {
      riskClass = 'low'
    }

    // Liquidity class
    let liquidityClass: 'liquid' | 'semi_liquid' | 'illiquid' = 'illiquid'
    switch (basicInfo.assetType) {
      case 'securities':
        liquidityClass = 'liquid'
        break
      case 'real_estate':
      case 'vehicle':
        liquidityClass = 'semi_liquid'
        break
      default:
        liquidityClass = 'illiquid'
    }

    // Market segment
    const marketSegment = this.determineMarketSegment(basicInfo, valuation)

    // Tags
    const tags = this.generateTags(basicInfo, valuation, compliance)

    return {
      primaryCategory,
      subcategories: [],
      riskClass,
      liquidityClass,
      marketSegment,
      tags,
      customClassifications: {}
    }
  }

  /**
   * Determine market segment
   */
  private determineMarketSegment(basicInfo: BasicAssetInfo, valuation: AssetValuationInfo): string {
    if (valuation.appraisedValue >= 1000000) {
      return 'high_value'
    } else if (valuation.appraisedValue >= 100000) {
      return 'medium_value'
    } else {
      return 'low_value'
    }
  }

  /**
   * Generate asset tags
   */
  private generateTags(
    basicInfo: BasicAssetInfo,
    valuation: AssetValuationInfo,
    compliance: ComplianceInfo
  ): string[] {
    const tags: string[] = []

    // Asset type tags
    tags.push(basicInfo.assetType)

    // Value tags
    if (valuation.appraisedValue >= 1000000) {
      tags.push('high-value')
    } else if (valuation.appraisedValue >= 100000) {
      tags.push('medium-value')
    } else {
      tags.push('low-value')
    }

    // Compliance tags
    if (compliance.kycStatus === 'verified') {
      tags.push('kyc-verified')
    }
    if (compliance.amlStatus === 'cleared') {
      tags.push('aml-cleared')
    }

    // Location tags
    if (basicInfo.location.country) {
      tags.push(`country-${basicInfo.location.country.toLowerCase()}`)
    }
    if (basicInfo.location.city) {
      tags.push(`city-${basicInfo.location.city.toLowerCase().replace(/\s+/g, '-')}`)
    }

    return [...new Set(tags)] // Remove duplicates
  }

  /**
   * Assess risk for asset
   */
  private async assessRisk(metadata: AssetRegistrationMetadata): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = []

    // Valuation risk
    if (metadata.valuation.appraisedValue > 1000000) {
      riskFactors.push({
        factor: 'high_value',
        impact: 'medium',
        probability: 'low',
        score: 60,
        description: 'High value assets may have increased volatility'
      })
    }

    // Compliance risk
    if (metadata.compliance.amlStatus === 'flagged') {
      riskFactors.push({
        factor: 'aml_flag',
        impact: 'high',
        probability: 'high',
        score: 90,
        description: 'AML flag increases regulatory risk'
      })
    }

    // Location risk
    if (metadata.basicInfo.location.country === 'US') {
      riskFactors.push({
        factor: 'us_jurisdiction',
        impact: 'low',
        probability: 'low',
        score: 20,
        description: 'US jurisdiction provides regulatory clarity'
      })
    }

    // Calculate overall risk score
    const overallRiskScore = riskFactors.length > 0 ?
      riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length : 50

    return {
      overallRiskScore,
      riskFactors,
      mitigationStrategies: this.generateRiskMitigations(riskFactors),
      lastAssessment: new Date(),
      nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  }

  /**
   * Generate risk mitigation strategies
   */
  private generateRiskMitigations(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = []

    riskFactors.forEach(factor => {
      switch (factor.factor) {
        case 'high_value':
          strategies.push('Implement enhanced monitoring and regular valuations')
          break
        case 'aml_flag':
          strategies.push('Conduct enhanced due diligence and monitoring')
          break
        case 'us_jurisdiction':
          strategies.push('Maintain compliance with US regulatory requirements')
          break
      }
    })

    if (strategies.length === 0) {
      strategies.push('Implement standard risk monitoring procedures')
    }

    return strategies
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get registration by ID
   */
  getRegistration(registrationId: string): AssetRegistration | null {
    return this.registrations.get(registrationId) || null
  }

  /**
   * Get registrations by status
   */
  getRegistrationsByStatus(status: RegistrationStatus): AssetRegistration[] {
    return Array.from(this.registrations.values()).filter(r => r.status === status)
  }

  /**
   * Get verification results for registration
   */
  getVerificationResults(registrationId: string): AssetVerificationResult[] {
    return this.verificationResults.get(registrationId) || []
  }

  /**
   * Get comprehensive registration overview
   */
  getRegistrationOverview(registrationId: string): {
    registration: AssetRegistration | null
    verificationResults: AssetVerificationResult[]
    nextSteps: string[]
    completionPercentage: number
  } {
    const registration = this.getRegistration(registrationId)
    const verificationResults = this.getVerificationResults(registrationId)

    if (!registration) {
      return {
        registration: null,
        verificationResults: [],
        nextSteps: [],
        completionPercentage: 0
      }
    }

    const nextSteps = this.calculateNextSteps(registration)
    const completionPercentage = this.calculateCompletionPercentage(registration)

    return {
      registration,
      verificationResults,
      nextSteps,
      completionPercentage
    }
  }

  /**
   * Calculate next steps for registration
   */
  private calculateNextSteps(registration: AssetRegistration): string[] {
    const steps = []

    switch (registration.status) {
      case 'draft':
        steps.push('Complete basic information collection')
        break
      case 'information_collection':
        steps.push('Submit collected information for verification')
        break
      case 'verification':
        steps.push('Address any verification issues')
        steps.push('Complete compliance checks')
        break
      case 'review':
        steps.push('Await final review approval')
        break
      case 'approval':
        steps.push('Await final executive approval')
        break
    }

    return steps
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletionPercentage(registration: AssetRegistration): number {
    const totalSteps = registration.steps.length
    const completedSteps = registration.steps.filter(s => s.status === 'completed').length

    // Weight final approval higher
    const approvalStep = registration.steps.find(s => s.id === 'approval')
    let weightedCompletion = (completedSteps / totalSteps) * 100

    if (approvalStep?.status === 'completed') {
      weightedCompletion = 100
    }

    return Math.round(weightedCompletion)
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
        totalRegistrations: this.registrations.size,
        draftRegistrations: Array.from(this.registrations.values()).filter(r => r.status === 'draft').length,
        approvedRegistrations: Array.from(this.registrations.values()).filter(r => r.status === 'approved').length,
        rejectedRegistrations: Array.from(this.registrations.values()).filter(r => r.status === 'rejected').length,
        pendingApprovals: Array.from(this.registrations.values()).filter(r => r.status === 'approval').length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.registrations.clear()
    this.verificationResults.clear()
    this.logger.info('All asset registration data cleared')
  }
}

export default AssetRegistrationService
