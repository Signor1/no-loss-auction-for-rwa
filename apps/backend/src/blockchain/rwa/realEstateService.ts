import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetValuationService from './assetValuationService'
import AssetLifecycleService from './assetLifecycleService'
import RevenueTrackingService from './revenueTrackingService'
import logger from '../../utils/logger'

// Real estate interfaces
export interface PropertyDetails {
  id: string
  assetId: string
  propertyType: PropertyType
  propertySubType: PropertySubType
  yearBuilt: number
  yearRenovated?: number
  totalArea: number // square feet/meters
  livingArea: number
  landArea: number
  buildingArea: number
  floors: number
  units?: number // for multi-family
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  architecturalStyle?: string
  constructionType: ConstructionType
  foundationType: FoundationType
  roofType: RoofType
  heatingType: HeatingType
  coolingType: CoolingType
  utilities: UtilityConnections
  features: PropertyFeatures
  condition: PropertyCondition
  zoning: ZoningInfo
  createdAt: Date
  updatedAt: Date
}

export interface LocationData {
  id: string
  assetId: string
  address: PropertyAddress
  coordinates: GeographicCoordinates
  neighborhood: NeighborhoodInfo
  market: MarketInfo
  accessibility: AccessibilityInfo
  environmental: EnvironmentalInfo
  demographics: DemographicInfo
  createdAt: Date
  updatedAt: Date
}

export interface PropertyValuation {
  id: string
  assetId: string
  valuationDate: Date
  propertyValue: number
  landValue: number
  improvementValue: number
  currency: string
  valuationMethod: ValuationMethod
  comparableSales: ComparableSale[]
  incomeApproach?: IncomeApproach
  costApproach?: CostApproach
  marketApproach?: MarketApproach
  adjustments: ValueAdjustment[]
  confidence: number // 0-100
  appraiser?: string
  appraisalFirm?: string
  certification?: string
  effectiveDate: Date
  expiryDate?: Date
  createdAt: Date
}

export interface RentalIncome {
  id: string
  assetId: string
  totalUnits: number
  occupiedUnits: number
  vacancyRate: number
  averageRent: number
  totalMonthlyRent: number
  annualGrossRent: number
  effectiveGrossIncome: number
  netOperatingIncome: number
  capRate: number
  leases: LeaseAgreement[]
  rentRoll: RentRoll[]
  rentalHistory: RentalHistory[]
  marketRentAnalysis: MarketRentAnalysis
  createdAt: Date
  updatedAt: Date
}

export interface PropertyManagement {
  id: string
  assetId: string
  managementCompany?: string
  propertyManager?: string
  managementFee: number // percentage
  managementType: ManagementType
  services: ManagementService[]
  vendors: PropertyVendor[]
  maintenanceSchedule: MaintenanceSchedule[]
  tenantRelations: TenantRelation[]
  financialReporting: FinancialReport[]
  compliance: ComplianceRecord[]
  performance: ManagementPerformance
  createdAt: Date
  updatedAt: Date
}

export interface LegalDocumentation {
  id: string
  assetId: string
  titleDeed: TitleDeed
  ownershipDocuments: OwnershipDocument[]
  mortgageDocuments?: MortgageDocument[]
  leaseDocuments: LeaseDocument[]
  permitDocuments: PermitDocument[]
  insuranceDocuments: InsuranceDocument[]
  taxDocuments: TaxDocument[]
  regulatoryDocuments: RegulatoryDocument[]
  litigationRecords: LitigationRecord[]
  easementRights: EasementRight[]
  createdAt: Date
  updatedAt: Date
}

export interface PropertyAddress {
  streetAddress: string
  city: string
  state: string
  zipCode: string
  country: string
  county?: string
  formattedAddress: string
  verified: boolean
  verificationDate?: Date
}

export interface GeographicCoordinates {
  latitude: number
  longitude: number
  elevation?: number
  accuracy: number
  source: string
}

export interface NeighborhoodInfo {
  name: string
  type: 'urban' | 'suburban' | 'rural'
  walkabilityScore?: number
  crimeRate?: number
  schoolDistrict?: string
  amenities: NeighborhoodAmenity[]
  demographics: NeighborhoodDemographics
}

export interface MarketInfo {
  marketName: string
  marketType: 'primary' | 'secondary' | 'tertiary'
  marketHealth: 'strong' | 'moderate' | 'weak'
  priceTrends: PriceTrend[]
  inventory: MarketInventory
  daysOnMarket: number
  absorptionRate: number
}

export interface AccessibilityInfo {
  publicTransport: TransportAccess[]
  highways: HighwayAccess[]
  airports: AirportAccess[]
  walkability: number
  bikeability: number
}

export interface EnvironmentalInfo {
  floodZone: FloodZoneInfo
  earthquakeZone?: string
  wildfireRisk?: string
  environmentalReports: EnvironmentalReport[]
  sustainability: SustainabilityInfo
}

export interface DemographicInfo {
  population: number
  populationGrowth: number
  medianIncome: number
  medianAge: number
  educationLevel: string
  employmentRate: number
  householdSize: number
}

export interface ComparableSale {
  id: string
  address: string
  saleDate: Date
  salePrice: number
  pricePerSqFt: number
  propertyType: PropertyType
  size: number
  age: number
  condition: PropertyCondition
  distance: number // miles
  adjustments: SaleAdjustment[]
  adjustedPrice: number
}

export interface IncomeApproach {
  potentialGrossIncome: number
  vacancyAllowance: number
  effectiveGrossIncome: number
  operatingExpenses: number
  netOperatingIncome: number
  capRate: number
  value: number
}

export interface CostApproach {
  landValue: number
  reproductionCost: number
  depreciation: number
  accruedDepreciation: number
  value: number
}

export interface MarketApproach {
  comparableSales: ComparableSale[]
  averagePricePerSqFt: number
  marketAdjustment: number
  value: number
}

export interface ValueAdjustment {
  factor: string
  adjustment: number // percentage
  reasoning: string
  impact: 'positive' | 'negative'
}

export interface LeaseAgreement {
  id: string
  tenantId: string
  tenantName: string
  unitNumber: string
  leaseStartDate: Date
  leaseEndDate: Date
  monthlyRent: number
  securityDeposit: number
  leaseType: 'fixed' | 'month_to_month' | 'commercial'
  status: 'active' | 'expired' | 'terminated' | 'pending'
  autoRenew: boolean
  renewalTerms?: string
  specialConditions?: string
  createdAt: Date
}

export interface RentRoll {
  unitNumber: string
  tenantName: string
  leaseStart: Date
  leaseEnd: Date
  monthlyRent: number
  lastPayment: Date
  paymentStatus: 'current' | 'late' | 'delinquent'
  securityDeposit: number
  balance: number
}

export interface RentalHistory {
  period: string
  occupancyRate: number
  averageRent: number
  totalRevenue: number
  expenses: number
  netIncome: number
  marketComparison: number
}

export interface MarketRentAnalysis {
  currentMarketRent: number
  rentGrowthRate: number
  comparables: RentalComparable[]
  rentTrends: RentTrend[]
  recommendations: string[]
}

export interface ManagementService {
  serviceType: 'maintenance' | 'cleaning' | 'security' | 'landscaping' | 'accounting' | 'legal'
  provider: string
  contractStart: Date
  contractEnd: Date
  monthlyCost: number
  serviceLevel: 'basic' | 'standard' | 'premium'
  performance: ServicePerformance
}

export interface PropertyVendor {
  id: string
  name: string
  category: 'maintenance' | 'cleaning' | 'security' | 'landscaping' | 'accounting' | 'legal'
  contactInfo: VendorContact
  serviceArea: string[]
  rating: number
  contracts: number
  lastUsed?: Date
}

export interface MaintenanceSchedule {
  id: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  nextDue: Date
  assignedTo?: string
  estimatedCost: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue'
}

export interface TenantRelation {
  tenantId: string
  tenantName: string
  satisfactionScore: number
  communicationHistory: CommunicationRecord[]
  maintenanceRequests: MaintenanceRequest[]
  leaseCompliance: boolean
  paymentHistory: PaymentRecord[]
}

export interface FinancialReport {
  period: string
  revenue: number
  expenses: number
  netIncome: number
  occupancyRate: number
  maintenanceCosts: number
  managementFees: number
  capitalImprovements: number
}

export interface ComplianceRecord {
  regulationType: string
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review'
  lastChecked: Date
  nextCheck: Date
  violations?: string[]
  remediationPlan?: string
}

export interface ManagementPerformance {
  overallRating: number
  tenantSatisfaction: number
  maintenanceResponse: number
  financialPerformance: number
  occupancyRate: number
  metrics: PerformanceMetric[]
}

export interface TitleDeed {
  deedNumber: string
  recordingDate: Date
  grantor: string
  grantee: string
  consideration: number
  legalDescription: string
  documentHash: string
  verified: boolean
  verificationDate?: Date
}

export interface OwnershipDocument {
  type: 'warranty_deed' | 'quitclaim_deed' | 'trust_deed' | 'other'
  documentNumber: string
  recordingDate: Date
  parties: DocumentParty[]
  documentHash: string
  verified: boolean
}

export interface MortgageDocument {
  lender: string
  loanAmount: number
  interestRate: number
  loanTerm: number
  monthlyPayment: number
  outstandingBalance: number
  maturityDate: Date
  documentHash: string
}

export interface LeaseDocument {
  leaseId: string
  tenantName: string
  documentType: 'residential' | 'commercial'
  executionDate: Date
  documentHash: string
  status: 'active' | 'expired' | 'terminated'
}

export interface PermitDocument {
  permitType: string
  permitNumber: string
  issueDate: Date
  expiryDate: Date
  issuingAuthority: string
  status: 'active' | 'expired' | 'revoked'
  documentHash: string
}

export interface InsuranceDocument {
  policyNumber: string
  provider: string
  coverageType: string
  coverageAmount: number
  premium: number
  effectiveDate: Date
  expiryDate: Date
  documentHash: string
}

export interface TaxDocument {
  taxYear: number
  propertyTaxes: number
  assessmentValue: number
  taxRate: number
  exemptions: TaxExemption[]
  paymentHistory: TaxPayment[]
  documentHash: string
}

export interface RegulatoryDocument {
  regulationType: string
  documentType: string
  issueDate: Date
  expiryDate?: Date
  complianceStatus: 'compliant' | 'non_compliant'
  documentHash: string
}

export interface LitigationRecord {
  caseNumber: string
  caseType: string
  parties: string[]
  filingDate: Date
  status: 'active' | 'resolved' | 'dismissed'
  resolution?: string
  documentHash: string
}

export interface EasementRight {
  easementType: string
  grantor: string
  grantee: string
  description: string
  recordingDate: Date
  documentHash: string
  status: 'active' | 'terminated'
}

export type PropertyType =
  | 'single_family' | 'multi_family' | 'condominium' | 'townhouse'
  | 'commercial_office' | 'retail' | 'industrial' | 'land' | 'mixed_use'

export type PropertySubType =
  | 'detached' | 'semi_detached' | 'attached' | 'high_rise' | 'garden'
  | 'downtown' | 'suburban' | 'strip_mall' | 'warehouse' | 'flex_space'

export type ConstructionType =
  | 'wood_frame' | 'brick' | 'concrete' | 'steel' | 'other'

export type FoundationType =
  | 'slab' | 'crawl_space' | 'basement' | 'pier_and_beam' | 'other'

export type RoofType =
  | 'shingle' | 'tile' | 'metal' | 'flat' | 'other'

export type HeatingType =
  | 'forced_air' | 'radiant' | 'heat_pump' | 'baseboard' | 'none'

export type CoolingType =
  | 'central_air' | 'window_unit' | 'evaporative' | 'none'

export type PropertyCondition =
  | 'excellent' | 'very_good' | 'good' | 'fair' | 'poor' | 'needs_repair'

export type ValuationMethod =
  | 'sales_comparison' | 'income_capitalization' | 'cost_approach' | 'avm'

export type ManagementType =
  | 'self_managed' | 'third_party' | 'cooperative'

export type SaleAdjustment =
  | 'size' | 'age' | 'condition' | 'location' | 'features'

export type RentalComparable =
  | 'same_building' | 'same_neighborhood' | 'same_city' | 'market_average'

export type RentTrend =
  | 'increasing' | 'decreasing' | 'stable'

export type VendorContact = {
  phone: string
  email: string
  address: string
}

export type ServicePerformance = {
  rating: number
  responseTime: number
  qualityScore: number
  costEfficiency: number
}

export type CommunicationRecord = {
  date: Date
  type: 'email' | 'phone' | 'in_person'
  subject: string
  outcome: string
}

export type MaintenanceRequest = {
  date: Date
  description: string
  priority: 'low' | 'medium' | 'high' | 'emergency'
  status: 'open' | 'in_progress' | 'completed'
  cost?: number
}

export type PaymentRecord = {
  date: Date
  amount: number
  type: 'rent' | 'late_fee' | 'deposit'
  status: 'paid' | 'overdue' | 'partial'
}

export type PerformanceMetric = {
  name: string
  value: number
  target: number
  trend: 'improving' | 'declining' | 'stable'
}

export type DocumentParty = {
  name: string
  role: 'grantor' | 'grantee' | 'witness' | 'notary'
}

export type TaxExemption = {
  type: string
  amount: number
  description: string
}

export type TaxPayment = {
  date: Date
  amount: number
  status: 'paid' | 'overdue'
}

export type NeighborhoodAmenity = {
  type: 'school' | 'park' | 'shopping' | 'transport' | 'medical'
  name: string
  distance: number
  rating?: number
}

export type NeighborhoodDemographics = {
  medianIncome: number
  populationDensity: number
  ownerOccupiedRate: number
  educationLevel: string
}

export type PriceTrend = {
  period: string
  priceChange: number
  percentageChange: number
  volume: number
}

export type MarketInventory = {
  totalListings: number
  activeListings: number
  soldLastMonth: number
  averageDaysOnMarket: number
}

export type TransportAccess = {
  type: 'bus' | 'train' | 'subway' | 'light_rail'
  line: string
  station: string
  distance: number
  frequency: number
}

export type HighwayAccess = {
  highway: string
  interchange: string
  distance: number
  travelTime: number
}

export type AirportAccess = {
  airport: string
  distance: number
  travelTime: number
}

export type FloodZoneInfo = {
  zone: string
  floodRisk: 'low' | 'moderate' | 'high'
  insuranceRequired: boolean
  lastUpdated: Date
}

export type EnvironmentalReport = {
  reportType: string
  date: Date
  findings: string
  recommendations: string
  documentHash: string
}

export type SustainabilityInfo = {
  energyRating?: string
  waterEfficiency?: string
  greenFeatures: string[]
  carbonFootprint?: number
}

export type UtilityConnections = {
  electricity: boolean
  gas: boolean
  water: boolean
  sewer: boolean
  internet: boolean
  cable: boolean
}

export type PropertyFeatures = {
  pool?: boolean
  garage?: boolean
  basement?: boolean
  attic?: boolean
  fireplace?: boolean
  hardwoodFloors?: boolean
  updatedKitchen?: boolean
  updatedBathrooms?: boolean
  smartHome?: boolean
  securitySystem?: boolean
  additionalFeatures: string[]
}

export type ZoningInfo = {
  zone: string
  allowedUses: string[]
  density: string
  setbacks: {
    front: number
    back: number
    side: number
  }
  heightLimit?: number
  lastUpdated: Date
}

/**
 * Real Estate Service for RWA Tokenization
 * Comprehensive real estate asset management with property details,
 * location data, valuation, rental tracking, property management, and legal documentation
 */
export class RealEstateService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private valuationService: AssetValuationService
  private lifecycleService: AssetLifecycleService
  private revenueService: RevenueTrackingService

  // Data storage
  private propertyDetails: Map<string, PropertyDetails> = new Map()
  private locationData: Map<string, LocationData> = new Map()
  private propertyValuations: Map<string, PropertyValuation[]> = new Map()
  private rentalIncome: Map<string, RentalIncome> = new Map()
  private propertyManagement: Map<string, PropertyManagement> = new Map()
  private legalDocumentation: Map<string, LegalDocumentation> = new Map()

  // Monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    valuationService: AssetValuationService,
    lifecycleService: AssetLifecycleService,
    revenueService: RevenueTrackingService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.valuationService = valuationService
    this.lifecycleService = lifecycleService
    this.revenueService = revenueService
    this.logger = loggerInstance
  }

  // ============ PROPERTY DETAILS ============

  /**
   * Create comprehensive property details
   */
  async createPropertyDetails(
    assetId: string,
    propertyData: Omit<PropertyDetails, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<PropertyDetails> {
    try {
      const propertyDetails: PropertyDetails = {
        id: `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...propertyData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.propertyDetails.set(assetId, propertyDetails)

      // Update digital twin with property details
      await this.updateDigitalTwinProperty(assetId, propertyDetails)

      this.emit('property:details:created', { propertyDetails })

      return propertyDetails
    } catch (error) {
      this.logger.error(`Failed to create property details for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update property details
   */
  async updatePropertyDetails(
    assetId: string,
    updates: Partial<Omit<PropertyDetails, 'id' | 'assetId' | 'createdAt'>>
  ): Promise<PropertyDetails> {
    try {
      const existing = this.propertyDetails.get(assetId)
      if (!existing) {
        throw new Error(`Property details not found for ${assetId}`)
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      }

      this.propertyDetails.set(assetId, updated)

      // Update digital twin
      await this.updateDigitalTwinProperty(assetId, updated)

      this.emit('property:details:updated', { propertyDetails: updated })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update property details for ${assetId}:`, error)
      throw error
    }
  }

  // ============ LOCATION DATA ============

  /**
   * Create comprehensive location data
   */
  async createLocationData(
    assetId: string,
    locationData: Omit<LocationData, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<LocationData> {
    try {
      const location: LocationData = {
        id: `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...locationData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.locationData.set(assetId, location)

      this.emit('location:data:created', { location })

      return location
    } catch (error) {
      this.logger.error(`Failed to create location data for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get market analysis for location
   */
  async getMarketAnalysis(assetId: string): Promise<MarketInfo> {
    try {
      const location = this.locationData.get(assetId)
      if (!location) {
        throw new Error(`Location data not found for ${assetId}`)
      }

      // Simplified market analysis - would integrate with real estate APIs
      const marketAnalysis: MarketInfo = {
        marketName: `${location.address.city} ${location.neighborhood.type} Market`,
        marketType: 'secondary', // Would be determined by market size
        marketHealth: 'moderate',
        priceTrends: [
          { period: '3_months', priceChange: 25000, percentageChange: 2.1, volume: 150 },
          { period: '6_months', priceChange: 45000, percentageChange: 3.8, volume: 320 },
          { period: '12_months', priceChange: 85000, percentageChange: 7.2, volume: 680 }
        ],
        inventory: {
          totalListings: 1200,
          activeListings: 890,
          soldLastMonth: 45,
          averageDaysOnMarket: 28
        },
        daysOnMarket: 28,
        absorptionRate: 0.15
      }

      return marketAnalysis
    } catch (error) {
      this.logger.error(`Failed to get market analysis for ${assetId}:`, error)
      throw error
    }
  }

  // ============ PROPERTY VALUATION ============

  /**
   * Perform comprehensive property valuation
   */
  async performPropertyValuation(
    assetId: string,
    valuationData: {
      valuationMethod: ValuationMethod
      valuationDate: Date
      currency: string
      comparableSales?: Omit<ComparableSale, 'id'>[]
      incomeData?: {
        potentialGrossIncome: number
        vacancyRate: number
        operatingExpenses: number
      }
      costData?: {
        landValue: number
        reproductionCost: number
        depreciation: number
      }
    }
  ): Promise<PropertyValuation> {
    try {
      let propertyValue = 0
      let landValue = 0
      let improvementValue = 0

      const adjustments: ValueAdjustment[] = []

      switch (valuationData.valuationMethod) {
        case 'sales_comparison':
          const salesApproach = this.calculateSalesComparison(valuationData.comparableSales || [])
          propertyValue = salesApproach.value
          adjustments.push(...salesApproach.adjustments)
          break

        case 'income_capitalization':
          if (valuationData.incomeData) {
            const incomeApproach: IncomeApproach = {
              potentialGrossIncome: valuationData.incomeData.potentialGrossIncome,
              vacancyAllowance: valuationData.incomeData.potentialGrossIncome * (valuationData.incomeData.vacancyRate / 100),
              effectiveGrossIncome: valuationData.incomeData.potentialGrossIncome * (1 - valuationData.incomeData.vacancyRate / 100),
              operatingExpenses: valuationData.incomeData.operatingExpenses,
              netOperatingIncome: valuationData.incomeData.potentialGrossIncome * (1 - valuationData.incomeData.vacancyRate / 100) - valuationData.incomeData.operatingExpenses,
              capRate: 0.06, // 6% cap rate
              value: 0
            }
            incomeApproach.value = incomeApproach.netOperatingIncome / incomeApproach.capRate
            propertyValue = incomeApproach.value
          }
          break

        case 'cost_approach':
          if (valuationData.costData) {
            const costApproach: CostApproach = {
              landValue: valuationData.costData.landValue,
              reproductionCost: valuationData.costData.reproductionCost,
              depreciation: valuationData.costData.depreciation,
              accruedDepreciation: valuationData.costData.depreciation,
              value: valuationData.costData.landValue + valuationData.costData.reproductionCost - valuationData.costData.depreciation
            }
            propertyValue = costApproach.value
            landValue = costApproach.landValue
            improvementValue = costApproach.value - costApproach.landValue
          }
          break

        case 'avm':
          // Use existing AVM service
          const avmValuation = await this.valuationService.performAVMValuation(assetId, 'real_estate', {})
          propertyValue = avmValuation.value
          break
      }

      const propertyValuation: PropertyValuation = {
        id: `valuation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        valuationDate: valuationData.valuationDate,
        propertyValue,
        landValue,
        improvementValue: propertyValue - landValue,
        currency: valuationData.currency,
        valuationMethod: valuationData.valuationMethod,
        comparableSales: valuationData.comparableSales?.map(sale => ({
          ...sale,
          id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })) || [],
        adjustments,
        confidence: 85, // Would be calculated based on data quality
        effectiveDate: valuationData.valuationDate,
        createdAt: new Date()
      }

      if (!this.propertyValuations.has(assetId)) {
        this.propertyValuations.set(assetId, [])
      }

      this.propertyValuations.get(assetId)!.push(propertyValuation)

      this.emit('property:valuation:performed', { valuation: propertyValuation })

      return propertyValuation
    } catch (error) {
      this.logger.error(`Failed to perform property valuation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Calculate sales comparison approach
   */
  private calculateSalesComparison(comparables: Omit<ComparableSale, 'id'>[]): {
    value: number
    adjustments: ValueAdjustment[]
  } {
    if (comparables.length === 0) {
      return { value: 0, adjustments: [] }
    }

    const adjustments: ValueAdjustment[] = []
    let totalAdjustedValue = 0

    comparables.forEach(comp => {
      let adjustedPrice = comp.salePrice

      // Apply adjustments (simplified)
      comp.adjustments.forEach(adjustment => {
        let adjustmentAmount = 0
        switch (adjustment) {
          case 'size':
            adjustmentAmount = comp.size * 10 // $10 per sq ft adjustment
            break
          case 'age':
            adjustmentAmount = comp.age * -500 // -$500 per year
            break
          case 'condition':
            adjustmentAmount = comp.condition === 'excellent' ? 5000 : comp.condition === 'good' ? 0 : -5000
            break
        }
        adjustedPrice += adjustmentAmount
        adjustments.push({
          factor: adjustment,
          adjustment: (adjustmentAmount / comp.salePrice) * 100,
          reasoning: `Adjustment for ${adjustment}`,
          impact: adjustmentAmount > 0 ? 'positive' : 'negative'
        })
      })

      totalAdjustedValue += adjustedPrice
    })

    const averageValue = totalAdjustedValue / comparables.length

    return { value: averageValue, adjustments }
  }

  /**
   * Get latest property valuation
   */
  getLatestPropertyValuation(assetId: string): PropertyValuation | null {
    const valuations = this.propertyValuations.get(assetId) || []
    return valuations.sort((a, b) => b.valuationDate.getTime() - a.valuationDate.getTime())[0] || null
  }

  // ============ RENTAL INCOME TRACKING ============

  /**
   * Create rental income tracking
   */
  async createRentalIncomeTracking(
    assetId: string,
    rentalData: Omit<RentalIncome, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<RentalIncome> {
    try {
      const rentalIncome: RentalIncome = {
        id: `rental-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...rentalData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.rentalIncome.set(assetId, rentalIncome)

      this.emit('rental:income:created', { rentalIncome })

      return rentalIncome
    } catch (error) {
      this.logger.error(`Failed to create rental income tracking for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update rental income data
   */
  async updateRentalIncome(
    assetId: string,
    updates: Partial<Omit<RentalIncome, 'id' | 'assetId' | 'createdAt'>>
  ): Promise<RentalIncome> {
    try {
      const existing = this.rentalIncome.get(assetId)
      if (!existing) {
        throw new Error(`Rental income tracking not found for ${assetId}`)
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      }

      this.rentalIncome.set(assetId, updated)

      // Update revenue tracking
      await this.updateRevenueFromRental(assetId, updated)

      this.emit('rental:income:updated', { rentalIncome: updated })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update rental income for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Add lease agreement
   */
  async addLeaseAgreement(
    assetId: string,
    leaseData: Omit<LeaseAgreement, 'id'>
  ): Promise<LeaseAgreement> {
    try {
      const lease: LeaseAgreement = {
        id: `lease-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...leaseData
      }

      const rentalIncome = this.rentalIncome.get(assetId)
      if (rentalIncome) {
        rentalIncome.leases.push(lease)

        // Update rental calculations
        await this.updateRentalIncome(assetId, {
          occupiedUnits: rentalIncome.leases.filter(l => l.status === 'active').length,
          vacancyRate: ((rentalIncome.totalUnits - rentalIncome.leases.filter(l => l.status === 'active').length) / rentalIncome.totalUnits) * 100,
          totalMonthlyRent: rentalIncome.leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.monthlyRent, 0),
          annualGrossRent: rentalIncome.leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.monthlyRent, 0) * 12
        })
      }

      this.emit('lease:agreement:added', { lease })

      return lease
    } catch (error) {
      this.logger.error(`Failed to add lease agreement for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get rental performance metrics
   */
  getRentalPerformanceMetrics(assetId: string): {
    occupancyRate: number
    averageRent: number
    rentalIncome: number
    capRate: number
    marketComparison: number
  } {
    const rentalIncome = this.rentalIncome.get(assetId)
    if (!rentalIncome) {
      return {
        occupancyRate: 0,
        averageRent: 0,
        rentalIncome: 0,
        capRate: 0,
        marketComparison: 0
      }
    }

    return {
      occupancyRate: rentalIncome.occupiedUnits / rentalIncome.totalUnits * 100,
      averageRent: rentalIncome.averageRent,
      rentalIncome: rentalIncome.annualGrossRent,
      capRate: rentalIncome.capRate,
      marketComparison: rentalIncome.marketRentAnalysis?.currentMarketRent || 0
    }
  }

  // ============ PROPERTY MANAGEMENT ============

  /**
   * Setup property management
   */
  async setupPropertyManagement(
    assetId: string,
    managementData: Omit<PropertyManagement, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<PropertyManagement> {
    try {
      const propertyManagement: PropertyManagement = {
        id: `management-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...managementData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.propertyManagement.set(assetId, propertyManagement)

      this.emit('property:management:setup', { propertyManagement })

      return propertyManagement
    } catch (error) {
      this.logger.error(`Failed to setup property management for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(
    assetId: string,
    maintenanceData: Omit<MaintenanceSchedule, 'id' | 'status'>
  ): Promise<MaintenanceSchedule> {
    try {
      const schedule: MaintenanceSchedule = {
        id: `maint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...maintenanceData,
        status: 'scheduled'
      }

      const propertyManagement = this.propertyManagement.get(assetId)
      if (propertyManagement) {
        propertyManagement.maintenanceSchedule.push(schedule)
      }

      this.emit('maintenance:scheduled', { schedule })

      return schedule
    } catch (error) {
      this.logger.error(`Failed to schedule maintenance for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Add property vendor
   */
  async addPropertyVendor(
    assetId: string,
    vendorData: Omit<PropertyVendor, 'id' | 'contracts'>
  ): Promise<PropertyVendor> {
    try {
      const vendor: PropertyVendor = {
        id: `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...vendorData,
        contracts: 0
      }

      const propertyManagement = this.propertyManagement.get(assetId)
      if (propertyManagement) {
        propertyManagement.vendors.push(vendor)
      }

      this.emit('vendor:added', { vendor })

      return vendor
    } catch (error) {
      this.logger.error(`Failed to add property vendor for ${assetId}:`, error)
      throw error
    }
  }

  // ============ LEGAL DOCUMENTATION ============

  /**
   * Setup legal documentation
   */
  async setupLegalDocumentation(
    assetId: string,
    legalData: Omit<LegalDocumentation, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<LegalDocumentation> {
    try {
      const legalDocumentation: LegalDocumentation = {
        id: `legal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...legalData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.legalDocumentation.set(assetId, legalDocumentation)

      this.emit('legal:documentation:setup', { legalDocumentation })

      return legalDocumentation
    } catch (error) {
      this.logger.error(`Failed to setup legal documentation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Add legal document
   */
  async addLegalDocument(
    assetId: string,
    documentType: 'title_deed' | 'ownership' | 'mortgage' | 'lease' | 'permit' | 'insurance' | 'tax' | 'regulatory' | 'litigation' | 'easement',
    documentData: any
  ): Promise<void> {
    try {
      const legalDocs = this.legalDocumentation.get(assetId)
      if (!legalDocs) {
        throw new Error(`Legal documentation not setup for ${assetId}`)
      }

      switch (documentType) {
        case 'title_deed':
          legalDocs.titleDeed = documentData
          break
        case 'ownership':
          legalDocs.ownershipDocuments.push(documentData)
          break
        case 'mortgage':
          if (!legalDocs.mortgageDocuments) legalDocs.mortgageDocuments = []
          legalDocs.mortgageDocuments.push(documentData)
          break
        case 'lease':
          legalDocs.leaseDocuments.push(documentData)
          break
        case 'permit':
          legalDocs.permitDocuments.push(documentData)
          break
        case 'insurance':
          legalDocs.insuranceDocuments.push(documentData)
          break
        case 'tax':
          legalDocs.taxDocuments.push(documentData)
          break
        case 'regulatory':
          legalDocs.regulatoryDocuments.push(documentData)
          break
        case 'litigation':
          legalDocs.litigationRecords.push(documentData)
          break
        case 'easement':
          legalDocs.easementRights.push(documentData)
          break
      }

      this.emit('legal:document:added', { assetId, documentType, document: documentData })

    } catch (error) {
      this.logger.error(`Failed to add legal document for ${assetId}:`, error)
      throw error
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Update digital twin with property data
   */
  private async updateDigitalTwinProperty(assetId: string, propertyDetails: PropertyDetails): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        // Update property details in digital twin
        this.emit('digitalTwin:propertyUpdate', {
          twinId: twin.id,
          propertyDetails
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin property for ${assetId}:`, error)
    }
  }

  /**
   * Update revenue tracking from rental data
   */
  private async updateRevenueFromRental(assetId: string, rentalIncome: RentalIncome): Promise<void> {
    try {
      // Create revenue records for rental income
      for (const lease of rentalIncome.leases.filter(l => l.status === 'active')) {
        await this.revenueService.recordRevenue(assetId, {
          revenueSource: 'rental_income',
          amount: lease.monthlyRent,
          currency: 'USD',
          transactionDate: new Date(),
          description: `Monthly rent from ${lease.tenantName} - Unit ${lease.unitNumber}`,
          category: 'rental',
          subCategory: lease.leaseType === 'commercial' ? 'commercial' : 'residential',
          counterparty: lease.tenantName,
          paymentMethod: 'bank_transfer',
          notes: `Lease ID: ${lease.id}`
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update revenue from rental for ${assetId}:`, error)
    }
  }

  /**
   * Get comprehensive real estate overview
   */
  getRealEstateOverview(assetId: string): {
    propertyDetails: PropertyDetails | null
    locationData: LocationData | null
    latestValuation: PropertyValuation | null
    rentalIncome: RentalIncome | null
    propertyManagement: PropertyManagement | null
    legalDocumentation: LegalDocumentation | null
  } {
    return {
      propertyDetails: this.propertyDetails.get(assetId) || null,
      locationData: this.locationData.get(assetId) || null,
      latestValuation: this.getLatestPropertyValuation(assetId),
      rentalIncome: this.rentalIncome.get(assetId) || null,
      propertyManagement: this.propertyManagement.get(assetId) || null,
      legalDocumentation: this.legalDocumentation.get(assetId) || null
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
        totalProperties: this.propertyDetails.size,
        activeValuations: Array.from(this.propertyValuations.values()).flat().length,
        rentalProperties: this.rentalIncome.size,
        managedProperties: this.propertyManagement.size,
        legalDocumentSets: this.legalDocumentation.size
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.propertyDetails.clear()
    this.locationData.clear()
    this.propertyValuations.clear()
    this.rentalIncome.clear()
    this.propertyManagement.clear()
    this.legalDocumentation.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All real estate data cleared')
  }
}

export default RealEstateService
