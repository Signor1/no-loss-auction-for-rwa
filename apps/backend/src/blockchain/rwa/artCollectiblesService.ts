import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetValuationService from './assetValuationService'
import AssetLifecycleService from './assetLifecycleService'
import logger from '../../utils/logger'

// Art & Collectibles interfaces
export interface ArtworkDetails {
  id: string
  assetId: string
  artworkType: ArtworkType
  category: ArtworkCategory
  subCategory: string
  title: string
  artist: string
  yearCreated: number
  medium: string
  dimensions: ArtworkDimensions
  weight?: number
  edition?: ArtworkEdition
  series?: string
  description: string
  style: string
  period: string
  region: string
  culturalSignificance?: string
  historicalContext?: string
  materials: ArtworkMaterial[]
  techniques: string[]
  inscriptions: ArtworkInscription[]
  signatures: ArtworkSignature[]
  createdAt: Date
  updatedAt: Date
}

export interface ProvenanceRecord {
  id: string
  assetId: string
  ownershipTransferId: string
  previousOwner: ProvenanceOwner
  currentOwner: ProvenanceOwner
  transferDate: Date
  transferType: ProvenanceTransferType
  transferMethod: ProvenanceTransferMethod
  purchasePrice?: number
  currency?: string
  location: string
  transactionHash?: string
  blockNumber?: number
  documentation: ProvenanceDocument[]
  witnesses?: ProvenanceWitness[]
  verificationStatus: VerificationStatus
  chainOfCustody: boolean
  createdAt: Date
}

export interface AuthenticationRecord {
  id: string
  assetId: string
  authenticationType: AuthenticationType
  authenticatingParty: AuthenticatingParty
  authenticationDate: Date
  expiryDate?: Date
  confidence: number // 0-100
  methodology: string
  findings: AuthenticationFindings
  certificate: AuthenticationCertificate
  expertOpinion: string
  limitations: string[]
  verificationStatus: VerificationStatus
  appealHistory: AuthenticationAppeal[]
  createdAt: Date
  updatedAt: Date
}

export interface ConditionReport {
  id: string
  assetId: string
  assessmentDate: Date
  conditionGrade: ConditionGrade
  overallCondition: number // 0-100
  assessor: ConditionAssessor
  assessmentType: AssessmentType
  componentConditions: ComponentCondition[]
  damageAssessment: DamageAssessment[]
  conservationNeeds: ConservationNeed[]
  environmentalConditions: EnvironmentalConditions
  displayRecommendations: DisplayRecommendation[]
  handlingInstructions: string
  insuranceValue?: number
  reportDocument: string // IPFS hash
  images: ConditionImage[]
  videoDocumentation?: string
  nextAssessmentDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface InsuranceRecord {
  id: string
  assetId: string
  policyNumber: string
  insurer: string
  insuranceType: InsuranceType
  coverageAmount: number
  currency: string
  deductible: number
  premium: number
  premiumFrequency: PremiumFrequency
  policyStartDate: Date
  policyEndDate: Date
  renewalDate: Date
  specialConditions: string[]
  exclusions: string[]
  appraisalRequired: boolean
  lastAppraisalDate?: Date
  claimsHistory: InsuranceClaim[]
  riskAssessment: InsuranceRisk
  broker?: string
  status: InsuranceStatus
  createdAt: Date
  updatedAt: Date
}

export interface ExhibitionRecord {
  id: string
  assetId: string
  exhibitionTitle: string
  venue: ExhibitionVenue
  exhibitionType: ExhibitionType
  startDate: Date
  endDate: Date
  curator?: string
  organizer: string
  catalogueNumber?: string
  displayLocation: string
  lightingConditions: LightingConditions
  environmentalControls: EnvironmentalControls
  attendance?: number
  mediaCoverage: MediaCoverage[]
  salePrice?: number
  loanAgreement?: ExhibitionLoan
  insurance: ExhibitionInsurance
  conditionBefore: string
  conditionAfter: string
  photographs: ExhibitionPhotograph[]
  certificates: ExhibitionCertificate[]
  createdAt: Date
}

export interface ValuationRecord {
  id: string
  assetId: string
  valuationDate: Date
  appraisedValue: number
  currency: string
  valuationMethod: ValuationMethod
  appraiser: ValuationAppraiser
  marketAnalysis: MarketAnalysis
  comparableSales: ComparableArtwork[]
  auctionResults: AuctionResult[]
  indexAdjustments: IndexAdjustment[]
  conditionAdjustment: number
  marketAdjustment: number
  finalAdjustment: number
  confidence: number
  reportDocument: string
  effectiveDate: Date
  expiryDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ArtworkDimensions {
  height: number
  width: number
  depth?: number
  unit: 'cm' | 'in' | 'mm'
  framed: boolean
  frameDimensions?: {
    height: number
    width: number
    depth: number
  }
}

export interface ArtworkEdition {
  type: 'unique' | 'limited' | 'open' | 'artists_proof'
  number?: number
  total?: number
  printersProofs?: number
  bonATirer?: boolean
}

export interface ArtworkMaterial {
  material: string
  percentage: number
  supplier?: string
  dateAcquired?: Date
}

export interface ArtworkInscription {
  text: string
  location: string
  language: string
  translation?: string
  date?: Date
  verified: boolean
}

export interface ArtworkSignature {
  type: 'artist' | 'estate' | 'authorized'
  location: string
  verified: boolean
  verificationMethod: string
  verificationDate: Date
}

export interface ProvenanceOwner {
  name: string
  type: 'individual' | 'institution' | 'gallery' | 'museum' | 'dealer' | 'estate'
  contact?: string
  address?: string
  taxId?: string
}

export interface ProvenanceDocument {
  type: 'invoice' | 'receipt' | 'certificate' | 'contract' | 'appraisal'
  documentHash: string
  description: string
  issuingParty: string
  issueDate: Date
}

export interface ProvenanceWitness {
  name: string
  title: string
  organization: string
  contact: string
  testimony: string
}

export interface AuthenticatingParty {
  name: string
  type: 'expert' | 'laboratory' | 'institution' | 'auction_house'
  credentials: string[]
  accreditation: string[]
  contact: string
  reputation: number // 0-100
}

export interface AuthenticationFindings {
  authenticity: 'authentic' | 'forgery' | 'uncertain'
  attribution: string
  dating: string
  materials: string
  technique: string
  anomalies: string[]
  supportingEvidence: string[]
}

export interface AuthenticationCertificate {
  certificateNumber: string
  issueDate: Date
  expiryDate?: Date
  certificateHash: string
  hologramPresent: boolean
  securityFeatures: string[]
}

export interface AuthenticationAppeal {
  appealDate: Date
  reason: string
  outcome: 'upheld' | 'overturned' | 'pending'
  newAssessment?: string
}

export interface ConditionAssessor {
  name: string
  qualifications: string[]
  accreditation: string[]
  experience: number // years
  specializations: string[]
  contact: string
}

export interface ComponentCondition {
  component: string
  condition: number // 0-100
  issues: string[]
  recommendations: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface DamageAssessment {
  type: string
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
  location: string
  cause: string
  age: string
  treatmentRequired: boolean
  treatmentCost?: number
  images: string[]
}

export interface ConservationNeed {
  type: 'cleaning' | 'repair' | 'restoration' | 'stabilization' | 'preventive'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  estimatedCost: number
  recommendedConservator: string
  timeline: string
}

export interface EnvironmentalConditions {
  temperature: number
  humidity: number
  lightLevels: number
  airQuality: string
  vibration: number
  recommendations: string[]
}

export interface DisplayRecommendation {
  location: string
  lighting: string
  mounting: string
  environmental: string
  security: string
}

export interface ConditionImage {
  url: string
  description: string
  angle: string
  lighting: string
  equipment: string
  dateTaken: Date
}

export interface InsuranceClaim {
  claimNumber: string
  claimDate: Date
  incident: string
  claimedAmount: number
  approvedAmount: number
  settlementDate?: Date
  status: 'filed' | 'under_review' | 'approved' | 'denied' | 'settled'
  adjuster: string
}

export interface InsuranceRisk {
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  factors: string[]
  mitigation: string[]
  premiumImpact: number // percentage
}

export interface ExhibitionVenue {
  name: string
  type: 'museum' | 'gallery' | 'auction_house' | 'private_collection' | 'public_space'
  address: string
  city: string
  country: string
  accreditation: string[]
  reputation: number // 0-100
}

export interface LightingConditions {
  type: 'natural' | 'artificial' | 'mixed'
  intensity: number // lux
  spectrum: string
  uvProtection: boolean
  duration: number // hours per day
}

export interface EnvironmentalControls {
  temperature: number
  humidity: number
  airFiltration: boolean
  vibrationControl: boolean
  securityLevel: 'basic' | 'standard' | 'high' | 'maximum'
}

export interface MediaCoverage {
  publication: string
  date: Date
  type: 'review' | 'feature' | 'mention'
  author?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  url?: string
}

export interface ExhibitionLoan {
  lender: string
  loanAgreement: string
  insurance: string
  transport: string
  returnCondition: string
}

export interface ExhibitionInsurance {
  provider: string
  policyNumber: string
  coverageAmount: number
  premium: number
  specialConditions: string[]
}

export interface ExhibitionPhotograph {
  url: string
  photographer: string
  date: Date
  description: string
  usageRights: string
}

export interface ExhibitionCertificate {
  type: 'participation' | 'authenticity' | 'condition'
  issuingParty: string
  certificateNumber: string
  issueDate: Date
  certificateHash: string
}

export interface ValuationAppraiser {
  name: string
  qualifications: string[]
  accreditation: string[]
  experience: number
  specializations: string[]
  contact: string
  reputation: number
}

export interface MarketAnalysis {
  marketTrend: 'bull' | 'bear' | 'sideways'
  artistMarket: string
  comparableMarket: string
  auctionResults: string
  galleryPrices: string
}

export interface ComparableArtwork {
  artwork: string
  artist: string
  saleDate: Date
  salePrice: number
  auctionHouse?: string
  similarity: number // 0-100
  adjustments: string[]
  adjustedPrice: number
}

export interface AuctionResult {
  auctionHouse: string
  lotNumber: string
  date: Date
  hammerPrice: number
  premium: number
  totalPrice: number
  buyer?: string
}

export interface IndexAdjustment {
  index: string
  value: number
  adjustment: number
  reasoning: string
}

export type ArtworkType =
  | 'painting' | 'sculpture' | 'drawing' | 'print' | 'photograph'
  | 'installation' | 'performance' | 'digital' | 'mixed_media'

export type ArtworkCategory =
  | 'fine_art' | 'decorative_art' | 'contemporary' | 'antique'
  | 'collectible' | 'jewelry' | 'watches' | 'coins' | 'stamps' | 'other'

export type ProvenanceTransferType =
  | 'sale' | 'gift' | 'inheritance' | 'bequest' | 'divorce' | 'bankruptcy'
  | 'donation' | 'museum_loan' | 'gallery_consignment' | 'auction'

export type ProvenanceTransferMethod =
  | 'private_sale' | 'auction' | 'gallery' | 'dealer' | 'estate_sale' | 'donation'

export type AuthenticationType =
  | 'visual' | 'technical' | 'scientific' | 'documentary' | 'stylistic'

export type VerificationStatus =
  | 'unverified' | 'pending' | 'verified' | 'questioned' | 'revoked'

export type ConditionGrade =
  | 'pristine' | 'excellent' | 'very_good' | 'good' | 'fair' | 'poor' | 'damaged'

export type AssessmentType =
  | 'initial' | 'pre_sale' | 'post_exhibition' | 'insurance' | 'restoration'

export type InsuranceType =
  | 'fine_art' | 'jewelry' | 'collectibles' | 'museum' | 'transit' | 'event'

export type PremiumFrequency =
  | 'annual' | 'semi_annual' | 'quarterly' | 'monthly'

export type InsuranceStatus =
  | 'active' | 'expired' | 'cancelled' | 'claimed'

export type ExhibitionType =
  | 'solo' | 'group' | 'museum' | 'gallery' | 'auction_preview' | 'private_viewing'

export type ValuationMethod =
  | 'auction_comparison' | 'private_sale' | 'retail_comparison' | 'cost_basis' | 'index_adjustment'

/**
 * Art & Collectibles Service for RWA Tokenization
 * Comprehensive art and collectibles asset management with provenance tracking,
 * authentication, condition reports, insurance, exhibition history, and valuation updates
 */
export class ArtCollectiblesService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private valuationService: AssetValuationService
  private lifecycleService: AssetLifecycleService

  // Data storage
  private artworkDetails: Map<string, ArtworkDetails> = new Map()
  private provenanceRecords: Map<string, ProvenanceRecord[]> = new Map()
  private authenticationRecords: Map<string, AuthenticationRecord[]> = new Map()
  private conditionReports: Map<string, ConditionReport[]> = new Map()
  private insuranceRecords: Map<string, InsuranceRecord[]> = new Map()
  private exhibitionRecords: Map<string, ExhibitionRecord[]> = new Map()
  private valuationRecords: Map<string, ValuationRecord[]> = new Map()

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

  // ============ ARTWORK DETAILS ============

  /**
   * Create comprehensive artwork details
   */
  async createArtworkDetails(
    assetId: string,
    artworkData: Omit<ArtworkDetails, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<ArtworkDetails> {
    try {
      const artworkDetails: ArtworkDetails = {
        id: `artwork-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...artworkData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.artworkDetails.set(assetId, artworkDetails)

      // Update digital twin with artwork details
      await this.updateDigitalTwinArtwork(assetId, artworkDetails)

      this.emit('artwork:details:created', { artworkDetails })

      return artworkDetails
    } catch (error) {
      this.logger.error(`Failed to create artwork details for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update artwork details
   */
  async updateArtworkDetails(
    assetId: string,
    updates: Partial<Omit<ArtworkDetails, 'id' | 'assetId' | 'createdAt'>>
  ): Promise<ArtworkDetails> {
    try {
      const existing = this.artworkDetails.get(assetId)
      if (!existing) {
        throw new Error(`Artwork details not found for ${assetId}`)
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      }

      this.artworkDetails.set(assetId, updated)

      // Update digital twin
      await this.updateDigitalTwinArtwork(assetId, updated)

      this.emit('artwork:details:updated', { artworkDetails: updated })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update artwork details for ${assetId}:`, error)
      throw error
    }
  }

  // ============ PROVENANCE TRACKING ============

  /**
   * Record provenance transfer
   */
  async recordProvenanceTransfer(
    assetId: string,
    transferData: Omit<ProvenanceRecord, 'id' | 'assetId' | 'createdAt'>
  ): Promise<ProvenanceRecord> {
    try {
      const provenanceRecord: ProvenanceRecord = {
        id: `provenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...transferData,
        createdAt: new Date()
      }

      if (!this.provenanceRecords.has(assetId)) {
        this.provenanceRecords.set(assetId, [])
      }

      this.provenanceRecords.get(assetId)!.push(provenanceRecord)

      // Update digital twin with provenance
      await this.updateDigitalTwinProvenance(assetId, provenanceRecord)

      this.emit('provenance:transfer:recorded', { provenanceRecord })

      return provenanceRecord
    } catch (error) {
      this.logger.error(`Failed to record provenance transfer for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get complete provenance chain
   */
  getProvenanceChain(assetId: string): ProvenanceRecord[] {
    const records = this.provenanceRecords.get(assetId) || []
    return records.sort((a, b) => a.transferDate.getTime() - b.transferDate.getTime())
  }

  /**
   * Verify provenance chain
   */
  async verifyProvenanceChain(assetId: string): Promise<{
    verified: boolean
    gaps: string[]
    inconsistencies: string[]
    confidence: number
  }> {
    try {
      const chain = this.getProvenanceChain(assetId)

      if (chain.length === 0) {
        return {
          verified: false,
          gaps: ['No provenance records found'],
          inconsistencies: [],
          confidence: 0
        }
      }

      const gaps: string[] = []
      const inconsistencies: string[] = []

      // Check for chronological gaps
      for (let i = 1; i < chain.length; i++) {
        const current = chain[i]
        const previous = chain[i - 1]

        // Check if there's a gap between transfers
        const gapDays = (current.transferDate.getTime() - previous.transferDate.getTime()) / (1000 * 60 * 60 * 24)
        if (gapDays > 365 * 2) { // More than 2 years gap
          gaps.push(`Gap of ${Math.floor(gapDays / 365)} years between ${previous.transferDate.toDateString()} and ${current.transferDate.toDateString()}`)
        }

        // Check ownership continuity
        if (previous.currentOwner.name !== current.previousOwner.name) {
          inconsistencies.push(`Ownership discontinuity at ${current.transferDate.toDateString()}: expected ${previous.currentOwner.name}, got ${current.previousOwner.name}`)
        }
      }

      // Check documentation completeness
      const undocumentedTransfers = chain.filter(r => r.documentation.length === 0)
      if (undocumentedTransfers.length > 0) {
        gaps.push(`${undocumentedTransfers.length} transfers lack documentation`)
      }

      // Calculate confidence score
      let confidence = 100
      confidence -= gaps.length * 15
      confidence -= inconsistencies.length * 25
      confidence = Math.max(0, Math.min(100, confidence))

      return {
        verified: gaps.length === 0 && inconsistencies.length === 0,
        gaps,
        inconsistencies,
        confidence
      }
    } catch (error) {
      this.logger.error(`Failed to verify provenance chain for ${assetId}:`, error)
      throw error
    }
  }

  // ============ AUTHENTICATION ============

  /**
   * Record authentication
   */
  async recordAuthentication(
    assetId: string,
    authData: Omit<AuthenticationRecord, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<AuthenticationRecord> {
    try {
      const authentication: AuthenticationRecord = {
        id: `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...authData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.authenticationRecords.has(assetId)) {
        this.authenticationRecords.set(assetId, [])
      }

      this.authenticationRecords.get(assetId)!.push(authentication)

      this.emit('authentication:recorded', { authentication })

      return authentication
    } catch (error) {
      this.logger.error(`Failed to record authentication for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get latest authentication
   */
  getLatestAuthentication(assetId: string): AuthenticationRecord | null {
    const records = this.authenticationRecords.get(assetId) || []
    return records.sort((a, b) => b.authenticationDate.getTime() - a.authenticationDate.getTime())[0] || null
  }

  /**
   * Appeal authentication decision
   */
  async appealAuthentication(
    assetId: string,
    authenticationId: string,
    appealData: {
      reason: string
      evidence: string[]
      appellant: string
    }
  ): Promise<AuthenticationRecord> {
    try {
      const records = this.authenticationRecords.get(assetId) || []
      const authentication = records.find(r => r.id === authenticationId)

      if (!authentication) {
        throw new Error(`Authentication record ${authenticationId} not found`)
      }

      const appeal: AuthenticationAppeal = {
        appealDate: new Date(),
        reason: appealData.reason,
        outcome: 'pending'
      }

      authentication.appealHistory.push(appeal)

      this.emit('authentication:appealed', { authentication, appeal })

      return authentication
    } catch (error) {
      this.logger.error(`Failed to appeal authentication ${authenticationId}:`, error)
      throw error
    }
  }

  // ============ CONDITION REPORTS ============

  /**
   * Create condition report
   */
  async createConditionReport(
    assetId: string,
    reportData: Omit<ConditionReport, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<ConditionReport> {
    try {
      const conditionReport: ConditionReport = {
        id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...reportData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.conditionReports.has(assetId)) {
        this.conditionReports.set(assetId, [])
      }

      this.conditionReports.get(assetId)!.push(conditionReport)

      // Update artwork condition in digital twin
      const artworkDetails = this.artworkDetails.get(assetId)
      if (artworkDetails) {
        artworkDetails.condition = this.mapConditionGradeToArtworkCondition(conditionReport.conditionGrade)
        await this.updateArtworkDetails(assetId, { condition: artworkDetails.condition })
      }

      this.emit('condition:report:created', { conditionReport })

      return conditionReport
    } catch (error) {
      this.logger.error(`Failed to create condition report for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get latest condition report
   */
  getLatestConditionReport(assetId: string): ConditionReport | null {
    const reports = this.conditionReports.get(assetId) || []
    return reports.sort((a, b) => b.assessmentDate.getTime() - a.assessmentDate.getTime())[0] || null
  }

  /**
   * Map condition grade to artwork condition
   */
  private mapConditionGradeToArtworkCondition(grade: ConditionGrade): any {
    switch (grade) {
      case 'pristine': return 'excellent'
      case 'excellent': return 'excellent'
      case 'very_good': return 'very_good'
      case 'good': return 'good'
      case 'fair': return 'fair'
      case 'poor': return 'poor'
      case 'damaged': return 'needs_repair'
      default: return 'good'
    }
  }

  // ============ INSURANCE INFORMATION ============

  /**
   * Create insurance record
   */
  async createInsuranceRecord(
    assetId: string,
    insuranceData: Omit<InsuranceRecord, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<InsuranceRecord> {
    try {
      const insurance: InsuranceRecord = {
        id: `insurance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...insuranceData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.insuranceRecords.has(assetId)) {
        this.insuranceRecords.set(assetId, [])
      }

      this.insuranceRecords.get(assetId)!.push(insurance)

      this.emit('insurance:record:created', { insurance })

      return insurance
    } catch (error) {
      this.logger.error(`Failed to create insurance record for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update insurance record
   */
  async updateInsuranceRecord(
    assetId: string,
    insuranceId: string,
    updates: Partial<Omit<InsuranceRecord, 'id' | 'assetId' | 'createdAt'>>
  ): Promise<InsuranceRecord> {
    try {
      const records = this.insuranceRecords.get(assetId) || []
      const insurance = records.find(r => r.id === insuranceId)

      if (!insurance) {
        throw new Error(`Insurance record ${insuranceId} not found`)
      }

      Object.assign(insurance, updates)
      insurance.updatedAt = new Date()

      this.emit('insurance:record:updated', { insurance })

      return insurance
    } catch (error) {
      this.logger.error(`Failed to update insurance record ${insuranceId}:`, error)
      throw error
    }
  }

  /**
   * File insurance claim
   */
  async fileInsuranceClaim(
    assetId: string,
    insuranceId: string,
    claimData: Omit<InsuranceClaim, 'claimNumber' | 'status'>
  ): Promise<InsuranceRecord> {
    try {
      const records = this.insuranceRecords.get(assetId) || []
      const insurance = records.find(r => r.id === insuranceId)

      if (!insurance) {
        throw new Error(`Insurance record ${insuranceId} not found`)
      }

      const claim: InsuranceClaim = {
        ...claimData,
        claimNumber: `CLAIM-${Date.now()}`,
        status: 'filed'
      }

      insurance.claimsHistory.push(claim)

      this.emit('insurance:claim:filed', { insurance, claim })

      return insurance
    } catch (error) {
      this.logger.error(`Failed to file insurance claim for ${insuranceId}:`, error)
      throw error
    }
  }

  // ============ EXHIBITION HISTORY ============

  /**
   * Record exhibition
   */
  async recordExhibition(
    assetId: string,
    exhibitionData: Omit<ExhibitionRecord, 'id' | 'assetId' | 'createdAt'>
  ): Promise<ExhibitionRecord> {
    try {
      const exhibition: ExhibitionRecord = {
        id: `exhibition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...exhibitionData,
        createdAt: new Date()
      }

      if (!this.exhibitionRecords.has(assetId)) {
        this.exhibitionRecords.set(assetId, [])
      }

      this.exhibitionRecords.get(assetId)!.push(exhibition)

      // Update artwork exhibition history
      await this.lifecycleService.logAssetEvent(assetId, {
        eventType: 'exhibition',
        title: `Exhibited at ${exhibitionData.exhibitionTitle}`,
        description: `Artwork displayed at ${exhibitionData.venue.name} from ${exhibitionData.startDate.toDateString()} to ${exhibitionData.endDate.toDateString()}`,
        participants: exhibitionData.curator ? [exhibitionData.curator] : [],
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      this.emit('exhibition:recorded', { exhibition })

      return exhibition
    } catch (error) {
      this.logger.error(`Failed to record exhibition for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get exhibition history
   */
  getExhibitionHistory(assetId: string): ExhibitionRecord[] {
    const exhibitions = this.exhibitionRecords.get(assetId) || []
    return exhibitions.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
  }

  // ============ VALUATION UPDATES ============

  /**
   * Record valuation update
   */
  async recordValuationUpdate(
    assetId: string,
    valuationData: Omit<ValuationRecord, 'id' | 'assetId' | 'createdAt'>
  ): Promise<ValuationRecord> {
    try {
      const valuation: ValuationRecord = {
        id: `valuation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...valuationData,
        createdAt: new Date()
      }

      if (!this.valuationRecords.has(assetId)) {
        this.valuationRecords.set(assetId, [])
      }

      this.valuationRecords.get(assetId)!.push(valuation)

      // Update asset valuation in valuation service
      await this.valuationService.updateAssetValuation(assetId, {
        value: valuationData.appraisedValue,
        currency: valuationData.currency,
        valuationDate: valuationData.valuationDate,
        source: `Art Valuation - ${valuationData.appraiser.name}`,
        confidence: valuationData.confidence
      })

      this.emit('valuation:updated', { valuation })

      return valuation
    } catch (error) {
      this.logger.error(`Failed to record valuation update for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get valuation history
   */
  getValuationHistory(assetId: string): ValuationRecord[] {
    const valuations = this.valuationRecords.get(assetId) || []
    return valuations.sort((a, b) => b.valuationDate.getTime() - a.valuationDate.getTime())
  }

  /**
   * Get latest valuation
   */
  getLatestValuation(assetId: string): ValuationRecord | null {
    const valuations = this.getValuationHistory(assetId)
    return valuations.length > 0 ? valuations[0] : null
  }

  // ============ COMPREHENSIVE ARTWORK OVERVIEW ============

  /**
   * Get comprehensive artwork overview
   */
  getArtworkOverview(assetId: string): {
    details: ArtworkDetails | null
    provenanceChain: ProvenanceRecord[]
    latestAuthentication: AuthenticationRecord | null
    latestConditionReport: ConditionReport | null
    currentInsurance: InsuranceRecord | null
    exhibitionHistory: ExhibitionRecord[]
    valuationHistory: ValuationRecord[]
    provenanceVerified: boolean
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  } {
    const details = this.artworkDetails.get(assetId) || null
    const provenanceChain = this.getProvenanceChain(assetId)
    const latestAuthentication = this.getLatestAuthentication(assetId)
    const latestConditionReport = this.getLatestConditionReport(assetId)
    const currentInsurance = this.getCurrentInsurance(assetId)
    const exhibitionHistory = this.getExhibitionHistory(assetId)
    const valuationHistory = this.getValuationHistory(assetId)

    // Determine provenance verification status
    const provenanceVerification = this.verifyProvenanceChain(assetId)
    const provenanceVerified = provenanceVerification.verified

    // Calculate overall health score
    let healthScore = 100

    // Authentication reduces health if unverified or low confidence
    if (!latestAuthentication || latestAuthentication.confidence < 80) {
      healthScore -= 30
    }

    // Condition affects health
    if (latestConditionReport) {
      switch (latestConditionReport.conditionGrade) {
        case 'pristine':
        case 'excellent':
          break
        case 'very_good':
          healthScore -= 5
          break
        case 'good':
          healthScore -= 10
          break
        case 'fair':
          healthScore -= 20
          break
        case 'poor':
        case 'damaged':
          healthScore -= 40
          break
      }
    }

    // Provenance issues reduce health
    if (!provenanceVerified) {
      healthScore -= 25
    }

    // No insurance reduces health
    if (!currentInsurance) {
      healthScore -= 15
    }

    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    if (healthScore >= 90) overallHealth = 'excellent'
    else if (healthScore >= 75) overallHealth = 'good'
    else if (healthScore >= 60) overallHealth = 'fair'
    else if (healthScore >= 40) overallHealth = 'poor'
    else overallHealth = 'critical'

    return {
      details,
      provenanceChain,
      latestAuthentication,
      latestConditionReport,
      currentInsurance,
      exhibitionHistory,
      valuationHistory,
      provenanceVerified,
      overallHealth
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Update digital twin with artwork data
   */
  private async updateDigitalTwinArtwork(assetId: string, artworkDetails: ArtworkDetails): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        // Update artwork details in digital twin
        this.emit('digitalTwin:artworkUpdate', {
          twinId: twin.id,
          artworkDetails
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin artwork for ${assetId}:`, error)
    }
  }

  /**
   * Update digital twin with provenance
   */
  private async updateDigitalTwinProvenance(assetId: string, provenance: ProvenanceRecord): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        // Update provenance in digital twin
        this.emit('digitalTwin:provenanceUpdate', {
          twinId: twin.id,
          provenance
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin provenance for ${assetId}:`, error)
    }
  }

  /**
   * Get current insurance
   */
  private getCurrentInsurance(assetId: string): InsuranceRecord | null {
    const records = this.insuranceRecords.get(assetId) || []
    const now = new Date()

    const activeRecords = records.filter(r =>
      r.status === 'active' &&
      r.policyStartDate <= now &&
      r.policyEndDate >= now
    )

    return activeRecords.sort((a, b) => b.policyStartDate.getTime() - a.policyStartDate.getTime())[0] || null
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
        totalArtworks: this.artworkDetails.size,
        totalProvenanceRecords: Array.from(this.provenanceRecords.values()).flat().length,
        totalAuthentications: Array.from(this.authenticationRecords.values()).flat().length,
        totalConditionReports: Array.from(this.conditionReports.values()).flat().length,
        activeInsurancePolicies: Array.from(this.insuranceRecords.values()).flat().filter(r => r.status === 'active').length,
        totalExhibitions: Array.from(this.exhibitionRecords.values()).flat().length,
        totalValuations: Array.from(this.valuationRecords.values()).flat().length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.artworkDetails.clear()
    this.provenanceRecords.clear()
    this.authenticationRecords.clear()
    this.conditionReports.clear()
    this.insuranceRecords.clear()
    this.exhibitionRecords.clear()
    this.valuationRecords.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All art and collectibles data cleared')
  }
}

export default ArtCollectiblesService
