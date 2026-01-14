import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetValuationService from './assetValuationService'
import AssetLifecycleService from './assetLifecycleService'
import logger from '../../utils/logger'

// Commodities interfaces
export interface CommodityDetails {
  id: string
  assetId: string
  commodityType: CommodityType
  subType: string
  grade: CommodityGrade
  origin: CommodityOrigin
  specifications: CommoditySpecifications
  quantity: CommodityQuantity
  qualityMetrics: QualityMetrics
  productionDate: Date
  harvestDate?: Date
  processingDate?: Date
  packaging: CommodityPackaging
  certifications: CommodityCertification[]
  sustainability: SustainabilityInfo
  marketData: CommodityMarketData
  createdAt: Date
  updatedAt: Date
}

export interface StorageLocation {
  id: string
  assetId: string
  facility: StorageFacility
  warehouse: WarehouseDetails
  location: GeographicLocation
  environmental: StorageEnvironment
  security: SecurityMeasures
  capacity: StorageCapacity
  currentInventory: InventoryLevel
  accessControl: AccessControl
  compliance: StorageCompliance
  insurance: StorageInsurance
  costs: StorageCosts
  createdAt: Date
  updatedAt: Date
}

export interface QualityCertification {
  id: string
  assetId: string
  certificationType: CertificationType
  issuingAuthority: CertificationAuthority
  certificationNumber: string
  issueDate: Date
  expiryDate: Date
  grade: CertificationGrade
  standards: CertificationStandards[]
  testResults: TestResult[]
  inspector: CertificationInspector
  auditTrail: CertificationAudit[]
  renewalStatus: RenewalStatus
  blockchainVerification: BlockchainVerification
  createdAt: Date
  updatedAt: Date
}

export interface QuantityTracking {
  id: string
  assetId: string
  totalQuantity: number
  unit: CommodityUnit
  allocatedQuantity: number
  availableQuantity: number
  reservedQuantity: number
  inTransitQuantity: number
  damagedQuantity: number
  lostQuantity: number
  inventoryHistory: InventoryTransaction[]
  allocationRecords: AllocationRecord[]
  qualityAdjustments: QualityAdjustment[]
  shrinkageTracking: ShrinkageRecord[]
  reconciliationHistory: ReconciliationRecord[]
  createdAt: Date
  updatedAt: Date
}

export interface MarketPricing {
  id: string
  assetId: string
  commodityType: CommodityType
  currentPrice: MarketPrice
  priceHistory: PriceHistory[]
  futuresContracts: FuturesContract[]
  spotPrices: SpotPrice[]
  benchmarkPrices: BenchmarkPrice[]
  priceAlerts: PriceAlert[]
  marketIntelligence: MarketIntelligence
  tradingVolume: TradingVolume[]
  marketAnalysis: MarketAnalysis
  createdAt: Date
  updatedAt: Date
}

export interface DeliveryMechanisms {
  id: string
  assetId: string
  deliveryType: DeliveryType
  logistics: LogisticsArrangement
  transportation: TransportationDetails
  warehousing: WarehousingDetails
  customs: CustomsClearance
  insurance: DeliveryInsurance
  documentation: DeliveryDocumentation
  tracking: ShipmentTracking
  settlement: DeliverySettlement
  contingencies: DeliveryContingency[]
  createdAt: Date
  updatedAt: Date
}

export interface CommoditySpecifications {
  purity?: number // percentage
  moisture?: number
  protein?: number
  fat?: number
  carbohydrates?: number
  fiber?: number
  ash?: number
  density?: number
  viscosity?: number
  meltingPoint?: number
  boilingPoint?: number
  particleSize?: string
  color?: string
  odor?: string
  taste?: string
  contaminants?: ContaminantLevels
  allergens?: string[]
}

export interface CommodityOrigin {
  country: string
  region: string
  farm?: string
  producer?: string
  supplierChain: SupplierLink[]
  traceability: TraceabilityInfo
  sustainability: OriginSustainability
}

export interface CommodityQuantity {
  grossWeight: number
  netWeight: number
  tareWeight: number
  unit: CommodityUnit
  packagingType: string
  batchNumber: string
  lotNumber: string
}

export interface QualityMetrics {
  visualInspection: VisualQuality
  laboratoryTesting: LabTesting
  sensoryEvaluation: SensoryEvaluation
  contaminationCheck: ContaminationCheck
  overallGrade: CommodityGrade
  qualityScore: number // 0-100
}

export interface CommodityPackaging {
  type: PackagingType
  material: string
  weight: number
  dimensions: PackagingDimensions
  labeling: PackagingLabel
  sustainability: PackagingSustainability
  reuseInstructions?: string
}

export interface CommodityCertification {
  type: CertificationType
  authority: string
  number: string
  expiryDate: Date
  status: 'active' | 'expired' | 'revoked'
}

export interface SustainabilityInfo {
  carbonFootprint: number // kg CO2 per unit
  waterUsage: number // liters per unit
  energyConsumption: number // kWh per unit
  certifications: string[]
  sustainablePractices: string[]
  environmentalImpact: EnvironmentalImpact
}

export interface CommodityMarketData {
  commodityType: CommodityType
  marketPrice: number
  currency: string
  priceDate: Date
  exchange: string
  contractSize: number
  deliveryMonth: string
}

export interface StorageFacility {
  name: string
  type: 'warehouse' | 'silo' | 'tank' | 'container' | 'cold_storage' | 'bonded_warehouse'
  operator: string
  location: GeographicLocation
  accreditation: string[]
  capacity: number
  utilization: number // percentage
}

export interface WarehouseDetails {
  sections: WarehouseSection[]
  temperatureZones: TemperatureZone[]
  humidityControl: boolean
  ventilation: VentilationSystem
  pestControl: PestControl
  cleaningSchedule: string
}

export interface GeographicLocation {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  coordinates: {
    latitude: number
    longitude: number
    elevation?: number
  }
  timezone: string
  accessibility: LocationAccessibility
}

export interface StorageEnvironment {
  temperature: number
  humidity: number
  ventilation: string
  lighting: string
  noise: number
  vibration: number
  airQuality: string
  monitoring: EnvironmentalMonitoring
}

export interface SecurityMeasures {
  perimeterSecurity: string
  accessControl: string
  surveillance: SurveillanceSystem
  alarmSystem: string
  fireProtection: FireProtection
  emergencyResponse: EmergencyResponse
}

export interface StorageCapacity {
  totalCapacity: number
  availableCapacity: number
  unit: string
  expansionPotential: number
  utilizationRate: number
}

export interface InventoryLevel {
  currentStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  safetyStock: number
}

export interface AccessControl {
  authorizedPersonnel: AuthorizedPerson[]
  accessLogs: AccessLog[]
  securityClearance: string[]
  visitorPolicy: string
}

export interface StorageCompliance {
  regulations: string[]
  certifications: string[]
  inspectionSchedule: string
  lastInspection: Date
  complianceStatus: 'compliant' | 'non_compliant' | 'under_review'
}

export interface StorageInsurance {
  coverage: number
  provider: string
  policyNumber: string
  exclusions: string[]
  claimsHistory: InsuranceClaim[]
}

export interface StorageCosts {
  monthlyRent: number
  utilities: number
  insurance: number
  maintenance: number
  totalMonthlyCost: number
  costPerUnit: number
}

export interface CertificationAuthority {
  name: string
  type: 'government' | 'industry' | 'third_party' | 'international'
  accreditation: string[]
  reputation: number // 0-100
  contact: string
}

export interface CertificationStandards {
  standard: string
  version: string
  requirements: string[]
  compliance: number // percentage
}

export interface TestResult {
  testType: string
  parameter: string
  result: number | string
  unit: string
  acceptableRange: string
  compliant: boolean
  testDate: Date
  lab: string
}

export interface CertificationInspector {
  name: string
  qualifications: string[]
  experience: number
  certifications: string[]
  contact: string
}

export interface CertificationAudit {
  auditDate: Date
  auditor: string
  findings: string[]
  recommendations: string[]
  compliance: number
}

export interface BlockchainVerification {
  verified: boolean
  transactionHash: string
  blockNumber: number
  timestamp: Date
  certificateHash: string
}

export interface InventoryTransaction {
  id: string
  type: 'receipt' | 'issue' | 'adjustment' | 'transfer' | 'loss' | 'damage'
  quantity: number
  reason: string
  reference: string
  location: string
  performedBy: string
  timestamp: Date
  documentation: string[]
}

export interface AllocationRecord {
  id: string
  quantity: number
  allocatedTo: string
  purpose: string
  allocationDate: Date
  releaseDate?: Date
  status: 'active' | 'released' | 'expired'
}

export interface QualityAdjustment {
  date: Date
  quantity: number
  reason: string
  adjustmentType: 'upgrade' | 'downgrade' | 'rejection'
  newGrade: CommodityGrade
  inspector: string
}

export interface ShrinkageRecord {
  period: string
  expectedQuantity: number
  actualQuantity: number
  shrinkage: number
  shrinkageRate: number
  causes: string[]
  prevention: string[]
}

export interface ReconciliationRecord {
  reconciliationDate: Date
  bookQuantity: number
  physicalQuantity: number
  variance: number
  varianceReason: string
  adjustments: ReconciliationAdjustment[]
}

export interface MarketPrice {
  spotPrice: number
  bidPrice: number
  askPrice: number
  lastTradePrice: number
  priceChange: number
  priceChangePercent: number
  volume: number
  timestamp: Date
  source: string
}

export interface PriceHistory {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  market: string
}

export interface FuturesContract {
  contractId: string
  commodity: string
  expiryDate: Date
  contractSize: number
  price: number
  openInterest: number
  volume: number
  exchange: string
}

export interface SpotPrice {
  location: string
  price: number
  premium: number
  effectiveDate: Date
  source: string
  conditions: string
}

export interface BenchmarkPrice {
  benchmark: string
  price: number
  date: Date
  source: string
  methodology: string
}

export interface PriceAlert {
  id: string
  condition: 'above' | 'below' | 'change_percent'
  threshold: number
  triggered: boolean
  triggeredAt?: Date
  notificationSent: boolean
}

export interface MarketIntelligence {
  trend: 'bullish' | 'bearish' | 'sideways'
  volatility: number
  seasonality: Record<string, number>
  demandDrivers: string[]
  supplyFactors: string[]
  geopoliticalFactors: string[]
  weatherImpact: string[]
}

export interface TradingVolume {
  date: string
  volume: number
  openInterest: number
  exchange: string
  contract: string
}

export interface MarketAnalysis {
  technicalIndicators: TechnicalIndicator[]
  fundamentalAnalysis: string
  sentiment: 'positive' | 'neutral' | 'negative'
  forecast: PriceForecast[]
  riskAssessment: MarketRisk
}

export interface LogisticsArrangement {
  provider: string
  contractType: 'spot' | 'contract' | 'dedicated'
  serviceLevel: 'standard' | 'express' | 'priority'
  capacity: number
  cost: number
  transitTime: number
}

export interface TransportationDetails {
  mode: 'truck' | 'rail' | 'ship' | 'air' | 'pipeline'
  carrier: string
  vehicleType: string
  capacity: number
  route: TransportationRoute
  schedule: TransportationSchedule
  costBreakdown: CostBreakdown
}

export interface WarehousingDetails {
  originWarehouse: string
  destinationWarehouse: string
  transferTime: number
  handlingInstructions: string
  qualityChecks: string[]
  insuranceCoverage: boolean
}

export interface CustomsClearance {
  required: boolean
  hsCode: string
  duties: DutyCalculation
  documentation: CustomsDocument[]
  clearanceTime: number
  broker?: string
}

export interface DeliveryInsurance {
  required: boolean
  coverage: number
  provider: string
  premium: number
  conditions: string[]
}

export interface DeliveryDocumentation {
  billOfLading: string
  commercialInvoice: string
  certificateOfOrigin: string
  qualityCertificate: string
  insuranceCertificate: string
  customsDeclaration: string
}

export interface ShipmentTracking {
  trackingNumber: string
  carrier: string
  currentLocation: string
  estimatedDelivery: Date
  status: 'in_transit' | 'delayed' | 'delivered' | 'exception'
  updates: TrackingUpdate[]
  eta: Date
}

export interface DeliverySettlement {
  paymentTerms: string
  settlementMethod: 'cash' | 'letter_of_credit' | 'bank_transfer'
  currency: string
  incoterms: string
  paymentSchedule: PaymentSchedule[]
}

export interface DeliveryContingency {
  type: 'delay' | 'damage' | 'loss' | 'quality_issue'
  probability: number
  impact: string
  mitigation: string
  insuranceCoverage: boolean
}

export type CommodityType =
  | 'agricultural' | 'energy' | 'metals' | 'minerals' | 'chemicals' | 'forestry'

export type CommodityUnit =
  | 'metric_tons' | 'barrels' | 'bushels' | 'pounds' | 'ounces' | 'gallons' | 'cubic_feet'

export type CommodityGrade =
  | 'premium' | 'grade_a' | 'grade_b' | 'grade_c' | 'industrial' | 'feed' | 'ungraded'

export type CertificationType =
  | 'organic' | 'fair_trade' | 'non_gmo' | 'sustainable' | 'quality' | 'origin'

export type CertificationGrade =
  | 'excellent' | 'good' | 'satisfactory' | 'poor' | 'fail'

export type PackagingType =
  | 'bulk' | 'sacks' | 'drums' | 'containers' | 'tanks' | 'pallets'

export type DeliveryType =
  | 'warehouse_to_warehouse' | 'port_to_port' | 'door_to_door' | 'rail_to_rail'

export type RenewalStatus =
  | 'current' | 'due_soon' | 'overdue' | 'renewed' | 'expired'

// Additional type definitions
export type ContaminantLevels = Record<string, number>

export type SupplierLink = {
  supplierId: string
  supplierName: string
  relationship: string
  contact: string
  location: string
}

export type TraceabilityInfo = {
  blockchainTracking: boolean
  gtin?: string
  lotNumber: string
  batchNumber: string
  productionRecords: string[]
  transportationRecords: string[]
}

export type OriginSustainability = {
  fairTradeCertified: boolean
  organicCertified: boolean
  sustainableFarming: boolean
  waterConservation: boolean
  biodiversityProtection: boolean
  socialResponsibility: boolean
}

export type VisualQuality = {
  appearance: string
  color: string
  texture: string
  size: string
  uniformity: string
  defects: string[]
  overallAssessment: string
}

export type LabTesting = {
  moistureContent: number
  proteinContent: number
  fatContent: number
  carbohydrateContent: number
  ashContent: number
  fiberContent: number
  contaminants: Record<string, number>
  microbiological: Record<string, string>
  heavyMetals: Record<string, number>
}

export type SensoryEvaluation = {
  appearance: number // 1-10
  aroma: number
  taste: number
  texture: number
  overallAcceptability: number
  comments: string
}

export type ContaminationCheck = {
  physicalContaminants: string[]
  chemicalContaminants: Record<string, number>
  biologicalContaminants: string[]
  allergenPresence: string[]
  overallSafety: 'safe' | 'caution' | 'unsafe'
}

export type PackagingDimensions = {
  length: number
  width: number
  height: number
  unit: string
  weight: number
}

export type PackagingLabel = {
  productName: string
  netWeight: string
  grossWeight: string
  batchNumber: string
  productionDate: Date
  expiryDate?: Date
  storageInstructions: string
  allergenWarnings: string[]
  certifications: string[]
}

export type PackagingSustainability = {
  recyclable: boolean
  recycledContent: number
  biodegradable: boolean
  carbonFootprint: number
}

export type EnvironmentalImpact = {
  carbonFootprint: number
  waterUsage: number
  landUse: number
  biodiversityImpact: string
  wasteGeneration: number
}

export type WarehouseSection = {
  sectionId: string
  name: string
  capacity: number
  temperature: number
  humidity: number
  commodityType: string
  restrictions: string[]
}

export type TemperatureZone = {
  zoneId: string
  name: string
  minTemp: number
  maxTemp: number
  currentTemp: number
  controlSystem: string
}

export type VentilationSystem = {
  type: string
  capacity: number
  airChangesPerHour: number
  filtration: string
  monitoring: boolean
}

export type PestControl = {
  methods: string[]
  frequency: string
  lastInspection: Date
  certifications: string[]
  effectiveness: number
}

export type LocationAccessibility = {
  roadAccess: string
  railAccess: string
  portAccess: string
  airportAccess: string
  transportationScore: number
}

export type EnvironmentalMonitoring = {
  sensors: string[]
  monitoringFrequency: string
  alertThresholds: Record<string, number>
  maintenanceSchedule: string
  compliance: string
}

export type SurveillanceSystem = {
  cameras: number
  recordingDuration: number
  motionDetection: boolean
  nightVision: boolean
  remoteMonitoring: boolean
}

export type FireProtection = {
  sprinklers: boolean
  extinguishers: string[]
  alarmSystem: string
  emergencyExits: number
  fireDrills: string
}

export type EmergencyResponse = {
  emergencyContacts: string[]
  evacuationPlan: string
  firstAidKits: number
  emergencyEquipment: string[]
  responseTime: number
}

export type AuthorizedPerson = {
  personId: string
  name: string
  role: string
  accessLevel: string
  contact: string
  trainingCompleted: string[]
}

export type AccessLog = {
  timestamp: Date
  personId: string
  personName: string
  accessType: 'entry' | 'exit'
  location: string
  authorization: 'granted' | 'denied'
  reason?: string
}

export type InsuranceClaim = {
  claimNumber: string
  claimDate: Date
  incident: string
  claimedAmount: number
  approvedAmount: number
  settlementDate?: Date
  status: 'filed' | 'under_review' | 'approved' | 'denied' | 'settled'
  adjuster: string
}

export type ReconciliationAdjustment = {
  type: string
  quantity: number
  reason: string
  approvedBy: string
  timestamp: Date
}

export type TechnicalIndicator = {
  indicator: string
  value: number
  signal: 'buy' | 'sell' | 'hold' | 'neutral'
}

export type PriceForecast = {
  period: string
  predictedPrice: number
  confidence: number
  drivers: string[]
}

export type MarketRisk = {
  volatility: number
  downsideRisk: number
  upsidePotential: number
  marketRisk: 'low' | 'moderate' | 'high' | 'extreme'
  geopoliticalRisk: 'low' | 'moderate' | 'high'
}

export type TransportationRoute = {
  origin: string
  destination: string
  distance: number
  estimatedTime: number
  checkpoints: string[]
  alternativeRoutes: string[]
}

export type TransportationSchedule = {
  departureTime: Date
  arrivalTime: Date
  loadingTime: number
  unloadingTime: number
  restStops: string[]
  weatherDependent: boolean
}

export type CostBreakdown = {
  fuel: number
  labor: number
  maintenance: number
  insurance: number
  tolls: number
  permits: number
  total: number
}

export type DutyCalculation = {
  hsCode: string
  dutyRate: number
  valueForDuty: number
  calculatedDuty: number
  exemptions: number
  totalDuty: number
}

export type CustomsDocument = {
  type: string
  documentNumber: string
  issueDate: Date
  expiryDate?: Date
  issuingAuthority: string
}

export type TrackingUpdate = {
  timestamp: Date
  location: string
  status: 'in_transit' | 'delayed' | 'delivered' | 'exception'
  estimatedDelivery?: Date
  notes?: string
}

export type PaymentSchedule = {
  dueDate: Date
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  reference: string
}

/**
 * Commodities Service for RWA Tokenization
 * Comprehensive commodities asset management with type classification,
 * storage management, quality certification, quantity tracking, market pricing, and delivery mechanisms
 */
export class CommoditiesService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private valuationService: AssetValuationService
  private lifecycleService: AssetLifecycleService

  // Data storage
  private commodityDetails: Map<string, CommodityDetails> = new Map()
  private storageLocations: Map<string, StorageLocation[]> = new Map()
  private qualityCertifications: Map<string, QualityCertification[]> = new Map()
  private quantityTracking: Map<string, QuantityTracking> = new Map()
  private marketPricing: Map<string, MarketPricing> = new Map()
  private deliveryMechanisms: Map<string, DeliveryMechanisms[]> = new Map()

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

  // ============ COMMODITY DETAILS ============

  /**
   * Create comprehensive commodity details
   */
  async createCommodityDetails(
    assetId: string,
    commodityData: Omit<CommodityDetails, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<CommodityDetails> {
    try {
      const commodityDetails: CommodityDetails = {
        id: `commodity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...commodityData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.commodityDetails.set(assetId, commodityDetails)

      // Update digital twin with commodity details
      await this.updateDigitalTwinCommodity(assetId, commodityDetails)

      this.emit('commodity:details:created', { commodityDetails })

      return commodityDetails
    } catch (error) {
      this.logger.error(`Failed to create commodity details for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update commodity details
   */
  async updateCommodityDetails(
    assetId: string,
    updates: Partial<Omit<CommodityDetails, 'id' | 'assetId' | 'createdAt'>>
  ): Promise<CommodityDetails> {
    try {
      const existing = this.commodityDetails.get(assetId)
      if (!existing) {
        throw new Error(`Commodity details not found for ${assetId}`)
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      }

      this.commodityDetails.set(assetId, updated)

      // Update digital twin
      await this.updateDigitalTwinCommodity(assetId, updated)

      this.emit('commodity:details:updated', { commodityDetails: updated })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update commodity details for ${assetId}:`, error)
      throw error
    }
  }

  // ============ STORAGE LOCATION ============

  /**
   * Setup storage location
   */
  async setupStorageLocation(
    assetId: string,
    storageData: Omit<StorageLocation, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<StorageLocation> {
    try {
      const storageLocation: StorageLocation = {
        id: `storage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...storageData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.storageLocations.has(assetId)) {
        this.storageLocations.set(assetId, [])
      }

      this.storageLocations.get(assetId)!.push(storageLocation)

      this.emit('storage:location:setup', { storageLocation })

      return storageLocation
    } catch (error) {
      this.logger.error(`Failed to setup storage location for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update storage location
   */
  async updateStorageLocation(
    assetId: string,
    storageId: string,
    updates: Partial<Omit<StorageLocation, 'id' | 'assetId' | 'createdAt'>>
  ): Promise<StorageLocation> {
    try {
      const locations = this.storageLocations.get(assetId) || []
      const storage = locations.find(s => s.id === storageId)

      if (!storage) {
        throw new Error(`Storage location ${storageId} not found`)
      }

      Object.assign(storage, updates)
      storage.updatedAt = new Date()

      this.emit('storage:location:updated', { storageLocation: storage })

      return storage
    } catch (error) {
      this.logger.error(`Failed to update storage location ${storageId}:`, error)
      throw error
    }
  }

  /**
   * Get storage utilization
   */
  getStorageUtilization(assetId: string): {
    totalCapacity: number
    usedCapacity: number
    availableCapacity: number
    utilizationRate: number
    locations: StorageLocation[]
  } {
    const locations = this.storageLocations.get(assetId) || []

    const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity.totalCapacity, 0)
    const usedCapacity = locations.reduce((sum, loc) => sum + loc.capacity.totalCapacity - loc.capacity.availableCapacity, 0)
    const availableCapacity = totalCapacity - usedCapacity
    const utilizationRate = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0

    return {
      totalCapacity,
      usedCapacity,
      availableCapacity,
      utilizationRate,
      locations
    }
  }

  // ============ QUALITY CERTIFICATION ============

  /**
   * Create quality certification
   */
  async createQualityCertification(
    assetId: string,
    certificationData: Omit<QualityCertification, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<QualityCertification> {
    try {
      const certification: QualityCertification = {
        id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...certificationData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.qualityCertifications.has(assetId)) {
        this.qualityCertifications.set(assetId, [])
      }

      this.qualityCertifications.get(assetId)!.push(certification)

      // Update commodity quality metrics
      const commodityDetails = this.commodityDetails.get(assetId)
      if (commodityDetails) {
        commodityDetails.qualityMetrics.overallGrade = certification.grade
        await this.updateCommodityDetails(assetId, { qualityMetrics: commodityDetails.qualityMetrics })
      }

      this.emit('quality:certification:created', { certification })

      return certification
    } catch (error) {
      this.logger.error(`Failed to create quality certification for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Renew certification
   */
  async renewCertification(
    assetId: string,
    certificationId: string,
    renewalData: {
      newExpiryDate: Date
      newGrade?: CertificationGrade
      renewalAudit: CertificationAudit
    }
  ): Promise<QualityCertification> {
    try {
      const certifications = this.qualityCertifications.get(assetId) || []
      const certification = certifications.find(c => c.id === certificationId)

      if (!certification) {
        throw new Error(`Quality certification ${certificationId} not found`)
      }

      certification.expiryDate = renewalData.newExpiryDate
      if (renewalData.newGrade) {
        certification.grade = renewalData.newGrade
      }
      certification.renewalStatus = 'renewed'
      certification.auditTrail.push(renewalData.renewalAudit)
      certification.updatedAt = new Date()

      this.emit('quality:certification:renewed', { certification })

      return certification
    } catch (error) {
      this.logger.error(`Failed to renew certification ${certificationId}:`, error)
      throw error
    }
  }

  /**
   * Get active certifications
   */
  getActiveCertifications(assetId: string): QualityCertification[] {
    const certifications = this.qualityCertifications.get(assetId) || []
    const now = new Date()

    return certifications.filter(cert =>
      cert.expiryDate > now &&
      cert.renewalStatus !== 'expired'
    )
  }

  // ============ QUANTITY TRACKING ============

  /**
   * Initialize quantity tracking
   */
  async initializeQuantityTracking(
    assetId: string,
    trackingData: Omit<QuantityTracking, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<QuantityTracking> {
    try {
      const quantityTracking: QuantityTracking = {
        id: `quantity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...trackingData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.quantityTracking.set(assetId, quantityTracking)

      this.emit('quantity:tracking:initialized', { quantityTracking })

      return quantityTracking
    } catch (error) {
      this.logger.error(`Failed to initialize quantity tracking for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Record inventory transaction
   */
  async recordInventoryTransaction(
    assetId: string,
    transaction: Omit<InventoryTransaction, 'id'>
  ): Promise<QuantityTracking> {
    try {
      const tracking = this.quantityTracking.get(assetId)
      if (!tracking) {
        throw new Error(`Quantity tracking not initialized for ${assetId}`)
      }

      const inventoryTransaction: InventoryTransaction = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...transaction
      }

      tracking.inventoryHistory.push(inventoryTransaction)

      // Update quantities based on transaction type
      switch (transaction.type) {
        case 'receipt':
          tracking.totalQuantity += transaction.quantity
          tracking.availableQuantity += transaction.quantity
          break
        case 'issue':
          tracking.availableQuantity -= transaction.quantity
          break
        case 'adjustment':
          tracking.totalQuantity += transaction.quantity
          tracking.availableQuantity += transaction.quantity
          break
        case 'loss':
        case 'damage':
          tracking.totalQuantity -= transaction.quantity
          tracking.availableQuantity -= transaction.quantity
          tracking.damagedQuantity += transaction.quantity
          break
      }

      tracking.updatedAt = new Date()

      this.emit('inventory:transaction:recorded', { transaction: inventoryTransaction, tracking })

      return tracking
    } catch (error) {
      this.logger.error(`Failed to record inventory transaction for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Allocate quantity
   */
  async allocateQuantity(
    assetId: string,
    allocation: Omit<AllocationRecord, 'id'>
  ): Promise<QuantityTracking> {
    try {
      const tracking = this.quantityTracking.get(assetId)
      if (!tracking) {
        throw new Error(`Quantity tracking not initialized for ${assetId}`)
      }

      if (allocation.quantity > tracking.availableQuantity) {
        throw new Error(`Insufficient available quantity: ${tracking.availableQuantity} available, ${allocation.quantity} requested`)
      }

      const allocationRecord: AllocationRecord = {
        id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...allocation
      }

      tracking.allocationRecords.push(allocationRecord)
      tracking.allocatedQuantity += allocation.quantity
      tracking.availableQuantity -= allocation.quantity
      tracking.updatedAt = new Date()

      this.emit('quantity:allocated', { allocation: allocationRecord, tracking })

      return tracking
    } catch (error) {
      this.logger.error(`Failed to allocate quantity for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Perform inventory reconciliation
   */
  async performInventoryReconciliation(
    assetId: string,
    reconciliation: Omit<ReconciliationRecord, 'reconciliationDate'>
  ): Promise<QuantityTracking> {
    try {
      const tracking = this.quantityTracking.get(assetId)
      if (!tracking) {
        throw new Error(`Quantity tracking not initialized for ${assetId}`)
      }

      const reconciliationRecord: ReconciliationRecord = {
        ...reconciliation,
        reconciliationDate: new Date()
      }

      tracking.reconciliationHistory.push(reconciliationRecord)

      // Adjust quantities based on reconciliation
      const variance = reconciliation.physicalQuantity - reconciliation.bookQuantity
      if (variance !== 0) {
        tracking.totalQuantity += variance
        tracking.availableQuantity += variance

        // Record adjustment transaction
        await this.recordInventoryTransaction(assetId, {
          type: 'adjustment',
          quantity: variance,
          reason: `Inventory reconciliation: ${reconciliation.varianceReason}`,
          reference: reconciliationRecord.reconciliationDate.toISOString(),
          location: 'warehouse',
          performedBy: 'system',
          timestamp: new Date(),
          documentation: []
        })
      }

      this.emit('inventory:reconciliation:performed', { reconciliation: reconciliationRecord, tracking })

      return tracking
    } catch (error) {
      this.logger.error(`Failed to perform inventory reconciliation for ${assetId}:`, error)
      throw error
    }
  }

  // ============ MARKET PRICING ============

  /**
   * Setup market pricing
   */
  async setupMarketPricing(
    assetId: string,
    pricingData: Omit<MarketPricing, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<MarketPricing> {
    try {
      const marketPricing: MarketPricing = {
        id: `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...pricingData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.marketPricing.set(assetId, marketPricing)

      this.emit('market:pricing:setup', { marketPricing })

      return marketPricing
    } catch (error) {
      this.logger.error(`Failed to setup market pricing for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update market price
   */
  async updateMarketPrice(
    assetId: string,
    priceUpdate: {
      spotPrice: number
      bidPrice?: number
      askPrice?: number
      volume?: number
      source: string
    }
  ): Promise<MarketPricing> {
    try {
      const pricing = this.marketPricing.get(assetId)
      if (!pricing) {
        throw new Error(`Market pricing not setup for ${assetId}`)
      }

      const previousPrice = pricing.currentPrice.lastTradePrice
      const newPrice = priceUpdate.spotPrice
      const priceChange = newPrice - previousPrice
      const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0

      pricing.currentPrice = {
        spotPrice: newPrice,
        bidPrice: priceUpdate.bidPrice || newPrice * 0.98,
        askPrice: priceUpdate.askPrice || newPrice * 1.02,
        lastTradePrice: newPrice,
        priceChange,
        priceChangePercent,
        volume: priceUpdate.volume || 0,
        timestamp: new Date(),
        source: priceUpdate.source
      }

      // Add to price history
      const today = new Date().toISOString().split('T')[0]
      const existingHistory = pricing.priceHistory.find(h => h.date === today)

      if (existingHistory) {
        existingHistory.close = newPrice
        existingHistory.high = Math.max(existingHistory.high, newPrice)
        existingHistory.low = Math.min(existingHistory.low, newPrice)
        existingHistory.volume += priceUpdate.volume || 0
      } else {
        const lastHistory = pricing.priceHistory[pricing.priceHistory.length - 1]
        pricing.priceHistory.push({
          date: today,
          open: lastHistory?.close || newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: priceUpdate.volume || 0,
          market: priceUpdate.source
        })
      }

      pricing.updatedAt = new Date()

      // Check price alerts
      this.checkPriceAlerts(assetId, pricing)

      this.emit('market:price:updated', { pricing, priceChange, priceChangePercent })

      return pricing
    } catch (error) {
      this.logger.error(`Failed to update market price for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Check price alerts
   */
  private checkPriceAlerts(assetId: string, pricing: MarketPricing): void {
    pricing.priceAlerts.forEach(alert => {
      if (alert.triggered) return

      const currentPrice = pricing.currentPrice.spotPrice
      let shouldTrigger = false

      switch (alert.condition) {
        case 'above':
          shouldTrigger = currentPrice > alert.threshold
          break
        case 'below':
          shouldTrigger = currentPrice < alert.threshold
          break
        case 'change_percent':
          shouldTrigger = Math.abs(pricing.currentPrice.priceChangePercent) > alert.threshold
          break
      }

      if (shouldTrigger) {
        alert.triggered = true
        alert.triggeredAt = new Date()

        this.emit('price:alert:triggered', { alert, pricing })
      }
    })
  }

  /**
   * Get market analysis
   */
  getMarketAnalysis(assetId: string): MarketAnalysis {
    const pricing = this.marketPricing.get(assetId)
    if (!pricing) {
      return {
        technicalIndicators: [],
        fundamentalAnalysis: 'No pricing data available',
        sentiment: 'neutral',
        forecast: [],
        riskAssessment: {
          volatility: 0,
          downsideRisk: 0,
          upsidePotential: 0,
          marketRisk: 'unknown',
          geopoliticalRisk: 'low'
        }
      }
    }

    // Simplified market analysis
    const technicalIndicators: TechnicalIndicator[] = [
      {
        indicator: 'SMA_20',
        value: this.calculateSMA(pricing.priceHistory.slice(-20), 20),
        signal: 'neutral'
      },
      {
        indicator: 'RSI',
        value: this.calculateRSI(pricing.priceHistory.slice(-14)),
        signal: 'neutral'
      }
    ]

    const sentiment = pricing.marketIntelligence.trend === 'bullish' ? 'positive' :
                     pricing.marketIntelligence.trend === 'bearish' ? 'negative' : 'neutral'

    const forecast: PriceForecast[] = [
      {
        period: '1_month',
        predictedPrice: pricing.currentPrice.spotPrice * 1.05,
        confidence: 75,
        drivers: ['seasonal_trend', 'supply_demand']
      }
    ]

    return {
      technicalIndicators,
      fundamentalAnalysis: `Market analysis for ${pricing.commodityType}`,
      sentiment,
      forecast,
      riskAssessment: {
        volatility: pricing.marketIntelligence.volatility,
        downsideRisk: pricing.marketIntelligence.volatility * 0.8,
        upsidePotential: pricing.marketIntelligence.volatility * 1.2,
        marketRisk: 'moderate',
        geopoliticalRisk: 'low'
      }
    }
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: PriceHistory[], period: number): number {
    if (prices.length < period) return 0

    const recentPrices = prices.slice(-period)
    const sum = recentPrices.reduce((sum, price) => sum + price.close, 0)

    return sum / period
  }

  /**
   * Calculate RSI
   */
  private calculateRSI(prices: PriceHistory[]): number {
    if (prices.length < 2) return 50

    let gains = 0
    let losses = 0

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i].close - prices[i - 1].close
      if (change > 0) {
        gains += change
      } else {
        losses -= change
      }
    }

    const avgGain = gains / (prices.length - 1)
    const avgLoss = losses / (prices.length - 1)

    if (avgLoss === 0) return 100

    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  // ============ DELIVERY MECHANISMS ============

  /**
   * Setup delivery mechanism
   */
  async setupDeliveryMechanism(
    assetId: string,
    deliveryData: Omit<DeliveryMechanisms, 'id' | 'assetId' | 'createdAt' | 'updatedAt'>
  ): Promise<DeliveryMechanisms> {
    try {
      const deliveryMechanism: DeliveryMechanisms = {
        id: `delivery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        ...deliveryData,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (!this.deliveryMechanisms.has(assetId)) {
        this.deliveryMechanisms.set(assetId, [])
      }

      this.deliveryMechanisms.get(assetId)!.push(deliveryMechanism)

      this.emit('delivery:mechanism:setup', { deliveryMechanism })

      return deliveryMechanism
    } catch (error) {
      this.logger.error(`Failed to setup delivery mechanism for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update shipment tracking
   */
  async updateShipmentTracking(
    assetId: string,
    deliveryId: string,
    trackingUpdate: Omit<TrackingUpdate, 'timestamp'>
  ): Promise<DeliveryMechanisms> {
    try {
      const deliveries = this.deliveryMechanisms.get(assetId) || []
      const delivery = deliveries.find(d => d.id === deliveryId)

      if (!delivery) {
        throw new Error(`Delivery mechanism ${deliveryId} not found`)
      }

      const update: TrackingUpdate = {
        ...trackingUpdate,
        timestamp: new Date()
      }

      delivery.tracking.updates.push(update)
      delivery.tracking.currentLocation = trackingUpdate.location
      delivery.tracking.status = trackingUpdate.status

      if (trackingUpdate.estimatedDelivery) {
        delivery.tracking.eta = trackingUpdate.estimatedDelivery
      }

      this.emit('shipment:tracking:updated', { delivery, update })

      return delivery
    } catch (error) {
      this.logger.error(`Failed to update shipment tracking for ${deliveryId}:`, error)
      throw error
    }
  }

  /**
   * Process delivery settlement
   */
  async processDeliverySettlement(
    assetId: string,
    deliveryId: string,
    settlementData: {
      paymentAmount: number
      paymentDate: Date
      settlementReference: string
      status: 'pending' | 'completed' | 'failed'
    }
  ): Promise<DeliveryMechanisms> {
    try {
      const deliveries = this.deliveryMechanisms.get(assetId) || []
      const delivery = deliveries.find(d => d.id === deliveryId)

      if (!delivery) {
        throw new Error(`Delivery mechanism ${deliveryId} not found`)
      }

      delivery.settlement.paymentSchedule.push({
        dueDate: settlementData.paymentDate,
        amount: settlementData.paymentAmount,
        status: settlementData.status,
        reference: settlementData.settlementReference
      })

      this.emit('delivery:settlement:processed', { delivery, settlement: settlementData })

      return delivery
    } catch (error) {
      this.logger.error(`Failed to process delivery settlement for ${deliveryId}:`, error)
      throw error
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Update digital twin with commodity data
   */
  private async updateDigitalTwinCommodity(assetId: string, commodityDetails: CommodityDetails): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        // Update commodity details in digital twin
        this.emit('digitalTwin:commodityUpdate', {
          twinId: twin.id,
          commodityDetails
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin commodity for ${assetId}:`, error)
    }
  }

  /**
   * Get comprehensive commodity overview
   */
  getCommodityOverview(assetId: string): {
    details: CommodityDetails | null
    storageLocations: StorageLocation[]
    activeCertifications: QualityCertification[]
    quantityTracking: QuantityTracking | null
    marketPricing: MarketPricing | null
    deliveryMechanisms: DeliveryMechanisms[]
    storageUtilization: any
    marketAnalysis: MarketAnalysis | null
  } {
    return {
      details: this.commodityDetails.get(assetId) || null,
      storageLocations: this.storageLocations.get(assetId) || [],
      activeCertifications: this.getActiveCertifications(assetId),
      quantityTracking: this.quantityTracking.get(assetId) || null,
      marketPricing: this.marketPricing.get(assetId) || null,
      deliveryMechanisms: this.deliveryMechanisms.get(assetId) || [],
      storageUtilization: this.getStorageUtilization(assetId),
      marketAnalysis: this.marketPricing.has(assetId) ? this.getMarketAnalysis(assetId) : null
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
        totalCommodities: this.commodityDetails.size,
        activeStorageLocations: Array.from(this.storageLocations.values()).flat().length,
        activeCertifications: Array.from(this.qualityCertifications.values()).flat().filter(c => c.renewalStatus === 'current').length,
        trackedQuantities: this.quantityTracking.size,
        activeMarketPricing: this.marketPricing.size,
        deliveryMechanisms: Array.from(this.deliveryMechanisms.values()).flat().length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.commodityDetails.clear()
    this.storageLocations.clear()
    this.qualityCertifications.clear()
    this.quantityTracking.clear()
    this.marketPricing.clear()
    this.deliveryMechanisms.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All commodities data cleared')
  }
}

export default CommoditiesService
