import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// Asset Digital Twin interfaces
export interface PhysicalAsset {
  id: string
  assetType: 'real_estate' | 'artwork' | 'collectible' | 'machinery' | 'vehicle' | 'commodity' | 'other'
  name: string
  description: string
  category: string
  subcategory?: string
  location: {
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    country: string
    region?: string
    city?: string
  }
  physicalCharacteristics: {
    dimensions?: {
      length?: number
      width?: number
      height?: number
      unit: 'mm' | 'cm' | 'm' | 'in' | 'ft'
    }
    weight?: {
      value: number
      unit: 'g' | 'kg' | 'lb' | 'ton'
    }
    material?: string[]
    color?: string
    condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
    age?: number // years
    manufacturer?: string
    model?: string
    serialNumber?: string
  }
  valuation: {
    appraisedValue: number
    currency: string
    appraisalDate: Date
    appraiser: string
    appraisalMethod: string
    marketValue?: number
    replacementValue?: number
  }
  ownership: {
    currentOwner: string
    ownershipType: 'individual' | 'corporate' | 'trust' | 'government'
    ownershipPercentage: number
    acquisitionDate: Date
    acquisitionPrice?: number
  }
  documentation: {
    titleDeed?: string
    certificateOfAuthenticity?: string
    insurancePolicy?: string
    maintenanceRecords?: string[]
    appraisalReports?: string[]
    legalDocuments?: string[]
  }
  images: string[] // IPFS hashes
  videos?: string[] // IPFS hashes
  documents: string[] // IPFS hashes
  createdAt: Date
  updatedAt: Date
}

export interface DigitalTwin {
  id: string
  physicalAssetId: string
  tokenId?: string
  contractAddress?: string
  blockchain: 'base' | 'ethereum' | 'polygon' | 'other'
  tokenStandard: 'ERC721' | 'ERC1155' | 'ERC20'
  metadataURI: string // IPFS hash
  status: 'draft' | 'tokenizing' | 'tokenized' | 'transferred' | 'retired'
  fractionalOwnership: boolean
  totalSupply?: number
  currentSupply?: number
  ownershipTokens: OwnershipToken[]
  auditTrail: AuditEvent[]
  complianceStatus: 'pending' | 'verified' | 'rejected' | 'expired'
  riskRating: 'low' | 'medium' | 'high' | 'critical'
  lastComplianceCheck: Date
  createdAt: Date
  updatedAt: Date
}

export interface OwnershipToken {
  tokenId: string
  owner: string
  ownershipPercentage: number
  acquiredAt: Date
  acquisitionPrice?: number
  transferHistory: TransferEvent[]
  currentValue: number
  dividendsPaid: number
  votingRights: boolean
}

export interface TransferEvent {
  id: string
  from: string
  to: string
  tokenId: string
  percentageTransferred: number
  price?: number
  transactionHash: string
  blockNumber: number
  timestamp: Date
  transferType: 'sale' | 'gift' | 'inheritance' | 'foreclosure' | 'divestment'
}

export interface AuditEvent {
  id: string
  eventType: 'created' | 'updated' | 'transferred' | 'valued' | 'inspected' | 'maintained' | 'compliance_check'
  description: string
  actor: string
  timestamp: Date
  ipfsHash?: string
  transactionHash?: string
  metadata: Record<string, any>
}

export interface AssetEvent {
  id: string
  assetId: string
  eventType: 'creation' | 'valuation' | 'inspection' | 'maintenance' | 'transfer' | 'destruction' | 'insurance_claim'
  title: string
  description: string
  location?: string
  participants: string[]
  documents: string[] // IPFS hashes
  timestamp: Date
  recordedBy: string
  verified: boolean
  verificationMethod?: string
  blockchainTxHash?: string
}

export interface ComplianceRecord {
  id: string
  assetId: string
  checkType: 'kyc' | 'aml' | 'sanctions' | 'regulatory' | 'insurance' | 'environmental'
  status: 'passed' | 'failed' | 'pending' | 'expired'
  checkedAt: Date
  checkedBy: string
  expiryDate?: Date
  details: Record<string, any>
  documents: string[] // IPFS hashes
  riskScore: number
}

export interface AssetValuation {
  id: string
  assetId: string
  valuationDate: Date
  appraisedValue: number
  currency: string
  appraiser: string
  appraisalMethod: string
  confidence: number
  marketComparison: {
    comparableAssets: string[]
    marketTrend: 'up' | 'down' | 'stable'
    volatility: number
  }
  factors: {
    location: number
    condition: number
    marketDemand: number
    economicIndicators: number
    regulatoryChanges: number
  }
  reportURI: string // IPFS hash
}

/**
 * Asset Digital Twin Service for RWA Tokenization
 * Provides comprehensive digital representation and tracking of physical assets
 * Enables seamless off-chain to on-chain asset management and tokenization
 */
export class AssetDigitalTwinService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private physicalAssets: Map<string, PhysicalAsset> = new Map()
  private digitalTwins: Map<string, DigitalTwin> = new Map()
  private assetEvents: Map<string, AssetEvent[]> = new Map()
  private complianceRecords: Map<string, ComplianceRecord[]> = new Map()
  private valuations: Map<string, AssetValuation[]> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.logger = loggerInstance
  }

  // ============ PHYSICAL ASSET MANAGEMENT ============

  /**
   * Create a new physical asset record
   */
  async createPhysicalAsset(assetData: Omit<PhysicalAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhysicalAsset> {
    try {
      const asset: PhysicalAsset = {
        ...assetData,
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.physicalAssets.set(asset.id, asset)

      // Log creation event
      await this.logAssetEvent(asset.id, {
        eventType: 'creation',
        title: 'Asset Created',
        description: `Physical asset ${asset.name} has been registered in the system`,
        participants: [asset.ownership.currentOwner],
        documents: [],
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      this.emit('asset:created', { asset })

      return asset
    } catch (error) {
      this.logger.error('Failed to create physical asset:', error)
      throw error
    }
  }

  /**
   * Update physical asset information
   */
  async updatePhysicalAsset(assetId: string, updates: Partial<PhysicalAsset>): Promise<PhysicalAsset> {
    try {
      const asset = this.physicalAssets.get(assetId)
      if (!asset) {
        throw new Error(`Asset ${assetId} not found`)
      }

      const updatedAsset = {
        ...asset,
        ...updates,
        updatedAt: new Date()
      }

      this.physicalAssets.set(assetId, updatedAsset)

      // Log update event
      await this.logAssetEvent(assetId, {
        eventType: 'maintenance',
        title: 'Asset Updated',
        description: `Physical asset ${asset.name} information has been updated`,
        participants: [asset.ownership.currentOwner],
        documents: [],
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      this.emit('asset:updated', { asset: updatedAsset, updates })

      return updatedAsset
    } catch (error) {
      this.logger.error(`Failed to update physical asset ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get physical asset by ID
   */
  getPhysicalAsset(assetId: string): PhysicalAsset | null {
    return this.physicalAssets.get(assetId) || null
  }

  /**
   * Get all physical assets
   */
  getAllPhysicalAssets(): PhysicalAsset[] {
    return Array.from(this.physicalAssets.values())
  }

  /**
   * Search physical assets by criteria
   */
  searchPhysicalAssets(criteria: {
    assetType?: string
    location?: string
    owner?: string
    minValue?: number
    maxValue?: number
    condition?: string
  }): PhysicalAsset[] {
    const assets = Array.from(this.physicalAssets.values())

    return assets.filter(asset => {
      if (criteria.assetType && asset.assetType !== criteria.assetType) return false
      if (criteria.location && !asset.location.address.toLowerCase().includes(criteria.location.toLowerCase())) return false
      if (criteria.owner && asset.ownership.currentOwner !== criteria.owner) return false
      if (criteria.minValue && asset.valuation.appraisedValue < criteria.minValue) return false
      if (criteria.maxValue && asset.valuation.appraisedValue > criteria.maxValue) return false
      if (criteria.condition && asset.physicalCharacteristics.condition !== criteria.condition) return false

      return true
    })
  }

  // ============ DIGITAL TWIN MANAGEMENT ============

  /**
   * Create digital twin for physical asset
   */
  async createDigitalTwin(params: {
    physicalAssetId: string
    blockchain: 'base' | 'ethereum' | 'polygon' | 'other'
    tokenStandard: 'ERC721' | 'ERC1155' | 'ERC20'
    fractionalOwnership: boolean
    totalSupply?: number
  }): Promise<DigitalTwin> {
    try {
      const physicalAsset = this.physicalAssets.get(params.physicalAssetId)
      if (!physicalAsset) {
        throw new Error(`Physical asset ${params.physicalAssetId} not found`)
      }

      // Create metadata and upload to IPFS (simplified)
      const metadata = await this.createAssetMetadata(physicalAsset)
      const metadataURI = await this.uploadToIPFS(metadata)

      const digitalTwin: DigitalTwin = {
        id: `twin-${params.physicalAssetId}`,
        physicalAssetId: params.physicalAssetId,
        blockchain: params.blockchain,
        tokenStandard: params.tokenStandard,
        metadataURI,
        status: 'draft',
        fractionalOwnership: params.fractionalOwnership,
        totalSupply: params.totalSupply,
        currentSupply: params.totalSupply,
        ownershipTokens: [],
        auditTrail: [],
        complianceStatus: 'pending',
        riskRating: 'medium',
        lastComplianceCheck: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.digitalTwins.set(digitalTwin.id, digitalTwin)

      // Log audit event
      await this.logAuditEvent(digitalTwin.id, {
        eventType: 'created',
        description: `Digital twin created for physical asset ${physicalAsset.name}`,
        actor: 'system',
        timestamp: new Date(),
        ipfsHash: metadataURI,
        metadata: { physicalAssetId: params.physicalAssetId }
      })

      this.emit('digitalTwin:created', { digitalTwin, physicalAsset })

      return digitalTwin
    } catch (error) {
      this.logger.error('Failed to create digital twin:', error)
      throw error
    }
  }

  /**
   * Update digital twin status
   */
  async updateDigitalTwinStatus(twinId: string, status: DigitalTwin['status'], metadata?: any): Promise<DigitalTwin> {
    try {
      const twin = this.digitalTwins.get(twinId)
      if (!twin) {
        throw new Error(`Digital twin ${twinId} not found`)
      }

      const updatedTwin = {
        ...twin,
        status,
        updatedAt: new Date()
      }

      this.digitalTwins.set(twinId, updatedTwin)

      // Log status change
      await this.logAuditEvent(twinId, {
        eventType: 'updated',
        description: `Digital twin status changed to ${status}`,
        actor: 'system',
        timestamp: new Date(),
        metadata: { oldStatus: twin.status, newStatus: status, ...metadata }
      })

      this.emit('digitalTwin:updated', { twin: updatedTwin, status, metadata })

      return updatedTwin
    } catch (error) {
      this.logger.error(`Failed to update digital twin ${twinId}:`, error)
      throw error
    }
  }

  /**
   * Get digital twin by ID
   */
  getDigitalTwin(twinId: string): DigitalTwin | null {
    return this.digitalTwins.get(twinId) || null
  }

  /**
   * Get digital twin by physical asset ID
   */
  getDigitalTwinByAsset(assetId: string): DigitalTwin | null {
    for (const twin of this.digitalTwins.values()) {
      if (twin.physicalAssetId === assetId) {
        return twin
      }
    }
    return null
  }

  /**
   * Get all digital twins
   */
  getAllDigitalTwins(): DigitalTwin[] {
    return Array.from(this.digitalTwins.values())
  }

  // ============ OWNERSHIP TRACKING ============

  /**
   * Record ownership token creation
   */
  async createOwnershipToken(params: {
    twinId: string
    tokenId: string
    owner: string
    ownershipPercentage: number
    acquisitionPrice?: number
  }): Promise<OwnershipToken> {
    try {
      const twin = this.digitalTwins.get(params.twinId)
      if (!twin) {
        throw new Error(`Digital twin ${params.twinId} not found`)
      }

      const ownershipToken: OwnershipToken = {
        tokenId: params.tokenId,
        owner: params.owner,
        ownershipPercentage: params.ownershipPercentage,
        acquiredAt: new Date(),
        acquisitionPrice: params.acquisitionPrice,
        transferHistory: [],
        currentValue: 0, // Will be calculated
        dividendsPaid: 0,
        votingRights: true
      }

      twin.ownershipTokens.push(ownershipToken)

      // Log ownership creation
      await this.logAuditEvent(params.twinId, {
        eventType: 'transferred',
        description: `Ownership token created for ${params.owner} (${params.ownershipPercentage}%)`,
        actor: params.owner,
        timestamp: new Date(),
        metadata: {
          tokenId: params.tokenId,
          ownershipPercentage: params.ownershipPercentage,
          acquisitionPrice: params.acquisitionPrice
        }
      })

      this.emit('ownershipToken:created', { twinId: params.twinId, ownershipToken })

      return ownershipToken
    } catch (error) {
      this.logger.error('Failed to create ownership token:', error)
      throw error
    }
  }

  /**
   * Record ownership transfer
   */
  async recordOwnershipTransfer(params: {
    twinId: string
    tokenId: string
    from: string
    to: string
    percentageTransferred: number
    price?: number
    transactionHash: string
    blockNumber: number
    transferType?: TransferEvent['transferType']
  }): Promise<TransferEvent> {
    try {
      const twin = this.digitalTwins.get(params.twinId)
      if (!twin) {
        throw new Error(`Digital twin ${params.twinId} not found`)
      }

      const ownershipToken = twin.ownershipTokens.find(t => t.tokenId === params.tokenId)
      if (!ownershipToken) {
        throw new Error(`Ownership token ${params.tokenId} not found`)
      }

      const transferEvent: TransferEvent = {
        id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: params.from,
        to: params.to,
        tokenId: params.tokenId,
        percentageTransferred: params.percentageTransferred,
        price: params.price,
        transactionHash: params.transactionHash,
        blockNumber: params.blockNumber,
        timestamp: new Date(),
        transferType: params.transferType || 'sale'
      }

      ownershipToken.transferHistory.push(transferEvent)
      ownershipToken.owner = params.to

      // Log transfer
      await this.logAuditEvent(params.twinId, {
        eventType: 'transferred',
        description: `Ownership transferred from ${params.from} to ${params.to}`,
        actor: params.from,
        timestamp: new Date(),
        transactionHash: params.transactionHash,
        metadata: {
          tokenId: params.tokenId,
          percentageTransferred: params.percentageTransferred,
          price: params.price,
          transferType: params.transferType
        }
      })

      this.emit('ownership:transferred', { twinId: params.twinId, transfer: transferEvent })

      return transferEvent
    } catch (error) {
      this.logger.error('Failed to record ownership transfer:', error)
      throw error
    }
  }

  /**
   * Get ownership history for an asset
   */
  getOwnershipHistory(assetId: string): TransferEvent[] {
    const twin = this.getDigitalTwinByAsset(assetId)
    if (!twin) return []

    const allTransfers: TransferEvent[] = []
    for (const token of twin.ownershipTokens) {
      allTransfers.push(...token.transferHistory)
    }

    return allTransfers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // ============ ASSET EVENTS & AUDIT TRAIL ============

  /**
   * Log asset event
   */
  async logAssetEvent(assetId: string, event: Omit<AssetEvent, 'id' | 'assetId'>): Promise<AssetEvent> {
    try {
      const assetEvent: AssetEvent = {
        ...event,
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId
      }

      if (!this.assetEvents.has(assetId)) {
        this.assetEvents.set(assetId, [])
      }

      this.assetEvents.get(assetId)!.push(assetEvent)

      // Also log as audit event if digital twin exists
      const twin = this.getDigitalTwinByAsset(assetId)
      if (twin) {
        await this.logAuditEvent(twin.id, {
          eventType: event.eventType as any,
          description: event.description,
          actor: event.recordedBy,
          timestamp: event.timestamp,
          metadata: {
            title: event.title,
            location: event.location,
            participants: event.participants
          }
        })
      }

      this.emit('asset:event:logged', { assetId, event: assetEvent })

      return assetEvent
    } catch (error) {
      this.logger.error(`Failed to log asset event for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get asset events
   */
  getAssetEvents(assetId: string): AssetEvent[] {
    return this.assetEvents.get(assetId) || []
  }

  /**
   * Log audit event for digital twin
   */
  private async logAuditEvent(twinId: string, event: Omit<AuditEvent, 'id'>): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        ...event,
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const twin = this.digitalTwins.get(twinId)
      if (twin) {
        twin.auditTrail.push(auditEvent)
      }

      this.emit('audit:event:logged', { twinId, event: auditEvent })
    } catch (error) {
      this.logger.error(`Failed to log audit event for ${twinId}:`, error)
    }
  }

  /**
   * Get audit trail for digital twin
   */
  getAuditTrail(twinId: string): AuditEvent[] {
    const twin = this.digitalTwins.get(twinId)
    return twin ? twin.auditTrail : []
  }

  // ============ COMPLIANCE & VALUATION ============

  /**
   * Add compliance record
   */
  async addComplianceRecord(params: {
    assetId: string
    checkType: ComplianceRecord['checkType']
    status: ComplianceRecord['status']
    checkedBy: string
    details: Record<string, any>
    documents?: string[]
    expiryDate?: Date
  }): Promise<ComplianceRecord> {
    try {
      const record: ComplianceRecord = {
        id: `compliance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        checkType: params.checkType,
        status: params.status,
        checkedAt: new Date(),
        checkedBy: params.checkedBy,
        expiryDate: params.expiryDate,
        details: params.details,
        documents: params.documents || [],
        riskScore: this.calculateRiskScore(params.details)
      }

      if (!this.complianceRecords.has(params.assetId)) {
        this.complianceRecords.set(params.assetId, [])
      }

      this.complianceRecords.get(params.assetId)!.push(record)

      // Update digital twin compliance status
      const twin = this.getDigitalTwinByAsset(params.assetId)
      if (twin) {
        twin.complianceStatus = record.status as any
        twin.lastComplianceCheck = new Date()
        twin.riskRating = this.mapRiskScoreToRating(record.riskScore)
      }

      this.emit('compliance:record:added', { assetId: params.assetId, record })

      return record
    } catch (error) {
      this.logger.error('Failed to add compliance record:', error)
      throw error
    }
  }

  /**
   * Get compliance records for asset
   */
  getComplianceRecords(assetId: string): ComplianceRecord[] {
    return this.complianceRecords.get(assetId) || []
  }

  /**
   * Add asset valuation
   */
  async addAssetValuation(params: {
    assetId: string
    appraisedValue: number
    currency: string
    appraiser: string
    appraisalMethod: string
    confidence: number
    factors: AssetValuation['factors']
    reportURI: string
  }): Promise<AssetValuation> {
    try {
      const valuation: AssetValuation = {
        id: `valuation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        valuationDate: new Date(),
        appraisedValue: params.appraisedValue,
        currency: params.currency,
        appraiser: params.appraiser,
        appraisalMethod: params.appraisalMethod,
        confidence: params.confidence,
        marketComparison: {
          comparableAssets: [], // Would be populated
          marketTrend: 'stable',
          volatility: 0.1
        },
        factors: params.factors,
        reportURI: params.reportURI
      }

      if (!this.valuations.has(params.assetId)) {
        this.valuations.set(params.assetId, [])
      }

      this.valuations.get(params.assetId)!.push(valuation)

      // Update physical asset valuation
      const asset = this.physicalAssets.get(params.assetId)
      if (asset) {
        asset.valuation = {
          appraisedValue: params.appraisedValue,
          currency: params.currency,
          appraisalDate: valuation.valuationDate,
          appraiser: params.appraiser,
          appraisalMethod: params.appraisalMethod
        }
      }

      // Log valuation event
      await this.logAssetEvent(params.assetId, {
        eventType: 'valuation',
        title: 'Asset Valuation Updated',
        description: `Asset valued at ${params.appraisedValue} ${params.currency}`,
        participants: [params.appraiser],
        documents: [params.reportURI],
        timestamp: new Date(),
        recordedBy: params.appraiser,
        verified: true
      })

      this.emit('asset:valued', { assetId: params.assetId, valuation })

      return valuation
    } catch (error) {
      this.logger.error('Failed to add asset valuation:', error)
      throw error
    }
  }

  /**
   * Get asset valuations
   */
  getAssetValuations(assetId: string): AssetValuation[] {
    return this.valuations.get(assetId) || []
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Create asset metadata for tokenization
   */
  private async createAssetMetadata(asset: PhysicalAsset): Promise<any> {
    return {
      name: asset.name,
      description: asset.description,
      image: asset.images[0], // Primary image
      attributes: [
        {
          trait_type: 'Asset Type',
          value: asset.assetType
        },
        {
          trait_type: 'Location',
          value: asset.location.city || asset.location.country
        },
        {
          trait_type: 'Condition',
          value: asset.physicalCharacteristics.condition
        },
        {
          trait_type: 'Appraised Value',
          value: `${asset.valuation.appraisedValue} ${asset.valuation.currency}`
        }
      ],
      properties: {
        physicalAsset: asset,
        documents: asset.documents,
        compliance: this.getComplianceRecords(asset.id)
      }
    }
  }

  /**
   * Upload data to IPFS (simplified)
   */
  private async uploadToIPFS(data: any): Promise<string> {
    try {
      // In a real implementation, this would upload to IPFS
      // For now, return a mock IPFS hash
      const hash = `ipfs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.logger.info(`Mock IPFS upload: ${hash}`)
      return hash
    } catch (error) {
      this.logger.error('Failed to upload to IPFS:', error)
      throw error
    }
  }

  /**
   * Calculate risk score from compliance details
   */
  private calculateRiskScore(details: Record<string, any>): number {
    let score = 50 // Base score

    // Adjust based on various factors
    if (details.kycStatus === 'passed') score -= 10
    if (details.amlStatus === 'passed') score -= 10
    if (details.sanctionsCheck === 'passed') score -= 10
    if (details.insuranceValid) score -= 5
    if (details.regulatoryCompliant) score -= 5

    // Increase for negative factors
    if (details.kycStatus === 'failed') score += 20
    if (details.amlStatus === 'failed') score += 20
    if (details.sanctionsCheck === 'failed') score += 30

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Map risk score to rating
   */
  private mapRiskScoreToRating(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 25) return 'low'
    if (score <= 50) return 'medium'
    if (score <= 75) return 'high'
    return 'critical'
  }

  /**
   * Get comprehensive asset overview
   */
  getAssetOverview(assetId: string): {
    physicalAsset: PhysicalAsset | null
    digitalTwin: DigitalTwin | null
    events: AssetEvent[]
    compliance: ComplianceRecord[]
    valuations: AssetValuation[]
    ownershipHistory: TransferEvent[]
    auditTrail: AuditEvent[]
  } {
    const physicalAsset = this.getPhysicalAsset(assetId)
    const digitalTwin = this.getDigitalTwinByAsset(assetId)

    return {
      physicalAsset,
      digitalTwin,
      events: this.getAssetEvents(assetId),
      compliance: this.getComplianceRecords(assetId),
      valuations: this.getAssetValuations(assetId),
      ownershipHistory: this.getOwnershipHistory(assetId),
      auditTrail: digitalTwin ? this.getAuditTrail(digitalTwin.id) : []
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
        physicalAssets: this.physicalAssets.size,
        digitalTwins: this.digitalTwins.size,
        totalEvents: Array.from(this.assetEvents.values()).flat().length,
        complianceRecords: Array.from(this.complianceRecords.values()).flat().length,
        valuations: Array.from(this.valuations.values()).flat().length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.physicalAssets.clear()
    this.digitalTwins.clear()
    this.assetEvents.clear()
    this.complianceRecords.clear()
    this.valuations.clear()
    this.logger.info('All asset digital twin data cleared')
  }
}

export default AssetDigitalTwinService
