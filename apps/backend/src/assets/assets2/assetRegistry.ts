import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'

// Asset type enum
export enum AssetType {
  REAL_ESTATE = 'real_estate',
  ART = 'art',
  COMMODITY = 'commodity',
  SECURITIES = 'securities',
  INTELLECTUAL_PROPERTY = 'intellectual_property',
  VIRTUAL_ASSETS = 'virtual_assets',
  OTHER = 'other'
}

// Asset status enum
export enum AssetStatus {
  DRAFT = 'draft',
  PENDING_VALIDATION = 'pending_validation',
  VALIDATED = 'validated',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

// Asset lifecycle stage enum
export enum AssetLifecycleStage {
  CREATION = 'creation',
  VALIDATION = 'validation',
  TOKENIZATION = 'tokenization',
  LISTING = 'listing',
  TRADING = 'trading',
  MATURITY = 'maturity',
  SETTLEMENT = 'settlement',
  TERMINATION = 'termination'
}

// Asset interface
export interface Asset {
  id: string
  type: AssetType
  name: string
  description: string
  status: AssetStatus
  lifecycleStage: AssetLifecycleStage
  metadata: AssetMetadata
  validation: AssetValidation
  relationships: AssetRelationship[]
  categories: string[]
  tags: string[]
  owner: string
  custodian?: string
  value: AssetValue
  documents: AssetDocument[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  version: number
  isActive: boolean
  isPublic: boolean
  permissions: AssetPermissions
}

// Asset metadata interface
export interface AssetMetadata {
  basic: {
    title: string
    description: string
    summary: string
    keywords: string[]
    language: string
    jurisdiction: string
  }
  financial: {
    currentValue: string
    originalValue: string
    currency: string
    valuationDate: Date
    valuationMethod: string
    appraisalReport?: string
    insuranceValue?: string
  }
  legal: {
    ownershipStructure: string
    legalDescription: string
    registrationNumber?: string
    jurisdiction: string
    encumbrances: string[]
    restrictions: string[]
    compliance: LegalCompliance[]
  }
  technical: {
    specifications: Record<string, any>
    condition: string
    maintenance: MaintenanceRecord[]
    certifications: Certification[]
    standards: string[]
  }
  location: {
    address?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    country: string
    region: string
    city?: string
    postalCode?: string
  }
  custom: Record<string, any>
}

// Asset validation interface
export interface AssetValidation {
  isValid: boolean
  validationDate: Date
  validatedBy: string
  validationScore: number
  checks: ValidationCheck[]
  issues: ValidationIssue[]
  recommendations: string[]
  nextReviewDate: Date
  requiredActions: string[]
}

// Validation check interface
export interface ValidationCheck {
  id: string
  name: string
  type: ValidationCheckType
  status: ValidationCheckStatus
  score: number
  details: string
  evidence: string[]
  performedAt: Date
  performedBy: string
}

// Validation check type enum
export enum ValidationCheckType {
  DOCUMENT_VERIFICATION = 'document_verification',
  LEGAL_COMPLIANCE = 'legal_compliance',
  FINANCIAL_VALUATION = 'financial_valuation',
  TECHNICAL_ASSESSMENT = 'technical_assessment',
  OWNERSHIP_VERIFICATION = 'ownership_verification',
  RISK_ASSESSMENT = 'risk_assessment',
  MARKET_ANALYSIS = 'market_analysis'
}

// Validation check status enum
export enum ValidationCheckStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  WAIVED = 'waived'
}

// Validation issue interface
export interface ValidationIssue {
  id: string
  severity: ValidationIssueSeverity
  category: string
  description: string
  impact: string
  resolution: string
  status: ValidationIssueStatus
  reportedAt: Date
  resolvedAt?: Date
  resolvedBy?: string
}

// Validation issue severity enum
export enum ValidationIssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Validation issue status enum
export enum ValidationIssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  IGNORED = 'ignored'
}

// Asset relationship interface
export interface AssetRelationship {
  id: string
  type: AssetRelationshipType
  relatedAssetId: string
  description: string
  strength: number
  createdAt: Date
  createdBy: string
  isActive: boolean
}

// Asset relationship type enum
export enum AssetRelationshipType {
  PARENT = 'parent',
  CHILD = 'child',
  SIBLING = 'sibling',
  DEPENDENT = 'dependent',
  COLLATERAL = 'collateral',
  PORTFOLIO = 'portfolio',
  BUNDLE = 'bundle',
  REPLACEMENT = 'replacement',
  UPGRADE = 'upgrade'
}

// Asset value interface
export interface AssetValue {
  estimated: string
  market: string
  book: string
  liquidation: string
  currency: string
  lastUpdated: Date
  valuationSource: string
  confidence: number
  methodology: string
}

// Asset document interface
export interface AssetDocument {
  id: string
  name: string
  type: AssetDocumentType
  url: string
  hash: string
  size: number
  mimeType: string
  uploadedAt: Date
  uploadedBy: string
  isPublic: boolean
  isRequired: boolean
  expiryDate?: Date
  version: number
}

// Asset document type enum
export enum AssetDocumentType {
  TITLE_DEED = 'title_deed',
  APPRAISAL_REPORT = 'appraisal_report',
  LEGAL_DOCUMENT = 'legal_document',
  INSURANCE_POLICY = 'insurance_policy',
  TECHNICAL_SPECIFICATION = 'technical_specification',
  PHOTOGRAPH = 'photograph',
  VIDEO = 'video',
  CERTIFICATE = 'certificate',
  CONTRACT = 'contract',
  OTHER = 'other'
}

// Legal compliance interface
export interface LegalCompliance {
  requirement: string
  status: ComplianceStatus
  authority: string
  reference: string
  expiryDate?: Date
  documents: string[]
  notes: string
}

// Compliance status enum
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING = 'pending',
  EXEMPT = 'exempt'
}

// Maintenance record interface
export interface MaintenanceRecord {
  id: string
  type: string
  description: string
  performedAt: Date
  performedBy: string
  cost: string
  nextScheduled: Date?
  documents: string[]
}

// Certification interface
export interface Certification {
  id: string
  name: string
  issuer: string
  issuedAt: Date
  expiresAt?: Date
  level: string
  documents: string[]
  isValid: boolean
}

// Asset permissions interface
export interface AssetPermissions {
  read: string[]
  write: string[]
  admin: string[]
  public: boolean
  inheritFromParent: boolean
}

// Asset registry service
export class AssetRegistry extends EventEmitter {
  private assets: Map<string, Asset> = new Map()
  private assetIndex: Map<string, Set<string>> = new Map()
  private categoryIndex: Map<string, Set<string>> = new Map()
  private tagIndex: Map<string, Set<string>> = new Map()
  private ownerIndex: Map<string, Set<string>> = new Map()
  private logger: Logger
  private isRunning: boolean = false
  private maxAssets: number = 100000
  private indexUpdateInterval: number = 60000 // 1 minute

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start asset registry
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Asset registry already started')
      return
    }

    this.isRunning = true
    this.logger.info('Starting asset registry...')

    // Load existing assets
    await this.loadAssets()

    // Start indexing
    this.startIndexing()

    this.logger.info('Asset registry started')
    this.emit('registry:started')
  }

  // Stop asset registry
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping asset registry...')

    // Save assets
    await this.saveAssets()

    this.logger.info('Asset registry stopped')
    this.emit('registry:stopped')
  }

  // Create asset
  async createAsset(assetData: Partial<Asset>, createdBy: string): Promise<Asset> {
    const assetId = this.generateAssetId()

    try {
      this.logger.debug(`Creating asset: ${assetId}`)

      const asset: Asset = {
        id: assetId,
        type: assetData.type || AssetType.OTHER,
        name: assetData.name || '',
        description: assetData.description || '',
        status: AssetStatus.DRAFT,
        lifecycleStage: AssetLifecycleStage.CREATION,
        metadata: assetData.metadata || this.getDefaultMetadata(),
        validation: this.getDefaultValidation(),
        relationships: [],
        categories: assetData.categories || [],
        tags: assetData.tags || [],
        owner: assetData.owner || createdBy,
        custodian: assetData.custodian,
        value: assetData.value || this.getDefaultValue(),
        documents: assetData.documents || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        updatedBy: createdBy,
        version: 1,
        isActive: true,
        isPublic: assetData.isPublic || false,
        permissions: assetData.permissions || this.getDefaultPermissions(createdBy)
      }

      // Validate asset
      this.validateAsset(asset)

      // Store asset
      this.assets.set(assetId, asset)
      await this.saveAsset(asset)

      // Update indexes
      this.updateIndexes(asset)

      this.logger.info(`Asset created: ${assetId}`)
      this.emit('asset:created', { asset })

      return asset

    } catch (error) {
      this.logger.error(`Failed to create asset: ${assetId}`, error)
      this.emit('asset:error', { error, assetId })
      throw error
    }
  }

  // Update asset
  async updateAsset(assetId: string, updates: Partial<Asset>, updatedBy: string): Promise<Asset> {
    const asset = this.assets.get(assetId)
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    try {
      this.logger.debug(`Updating asset: ${assetId}`)

      // Create new version
      const updatedAsset: Asset = {
        ...asset,
        ...updates,
        updatedAt: new Date(),
        updatedBy,
        version: asset.version + 1
      }

      // Validate updated asset
      this.validateAsset(updatedAsset)

      // Store updated asset
      this.assets.set(assetId, updatedAsset)
      await this.saveAsset(updatedAsset)

      // Update indexes
      this.updateIndexes(updatedAsset)

      this.logger.info(`Asset updated: ${assetId}`)
      this.emit('asset:updated', { asset: updatedAsset, previousAsset: asset })

      return updatedAsset

    } catch (error) {
      this.logger.error(`Failed to update asset: ${assetId}`, error)
      this.emit('asset:error', { error, assetId })
      throw error
    }
  }

  // Get asset by ID
  getAsset(assetId: string): Asset | null {
    return this.assets.get(assetId) || null
  }

  // Get all assets
  getAllAssets(): Asset[] {
    return Array.from(this.assets.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Search assets
  searchAssets(query: AssetSearchQuery): AssetSearchResult {
    let results = Array.from(this.assets.values())

    // Apply filters
    if (query.type) {
      results = results.filter(asset => asset.type === query.type)
    }

    if (query.status) {
      results = results.filter(asset => asset.status === query.status)
    }

    if (query.lifecycleStage) {
      results = results.filter(asset => asset.lifecycleStage === query.lifecycleStage)
    }

    if (query.owner) {
      results = results.filter(asset => asset.owner === query.owner)
    }

    if (query.categories && query.categories.length > 0) {
      results = results.filter(asset => 
        query.categories!.some(category => asset.categories.includes(category))
      )
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(asset => 
        query.tags!.some(tag => asset.tags.includes(tag))
      )
    }

    if (query.text) {
      const searchText = query.text.toLowerCase()
      results = results.filter(asset => 
        asset.name.toLowerCase().includes(searchText) ||
        asset.description.toLowerCase().includes(searchText) ||
        asset.metadata.basic.description.toLowerCase().includes(searchText)
      )
    }

    if (query.valueRange) {
      results = results.filter(asset => {
        const value = parseFloat(asset.value.estimated)
        return value >= query.valueRange!.min && value <= query.valueRange!.max
      })
    }

    if (query.dateRange) {
      results = results.filter(asset => {
        const assetDate = asset.createdAt
        return assetDate >= query.dateRange!.start && assetDate <= query.dateRange!.end
      })
    }

    // Apply sorting
    if (query.sortBy) {
      results = this.sortAssets(results, query.sortBy, query.sortOrder || 'desc')
    }

    // Apply pagination
    const total = results.length
    const startIndex = (query.page || 0) * (query.pageSize || 20)
    const endIndex = startIndex + (query.pageSize || 20)
    const paginatedResults = results.slice(startIndex, endIndex)

    return {
      assets: paginatedResults,
      total,
      page: query.page || 0,
      pageSize: query.pageSize || 20,
      totalPages: Math.ceil(total / (query.pageSize || 20))
    }
  }

  // Get assets by category
  getAssetsByCategory(category: string): Asset[] {
    const assetIds = this.categoryIndex.get(category)
    if (!assetIds) {
      return []
    }

    return Array.from(assetIds)
      .map(id => this.assets.get(id))
      .filter((asset): asset is Asset => asset !== undefined)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get assets by owner
  getAssetsByOwner(owner: string): Asset[] {
    const assetIds = this.ownerIndex.get(owner)
    if (!assetIds) {
      return []
    }

    return Array.from(assetIds)
      .map(id => this.assets.get(id))
      .filter((asset): asset is Asset => asset !== undefined)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get assets by tag
  getAssetsByTag(tag: string): Asset[] {
    const assetIds = this.tagIndex.get(tag)
    if (!assetIds) {
      return []
    }

    return Array.from(assetIds)
      .map(id => this.assets.get(id))
      .filter((asset): asset is Asset => asset !== undefined)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Add asset relationship
  async addRelationship(assetId: string, relationship: Omit<AssetRelationship, 'id' | 'createdAt' | 'isActive'>): Promise<AssetRelationship> {
    const asset = this.assets.get(assetId)
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    const relatedAsset = this.assets.get(relationship.relatedAssetId)
    if (!relatedAsset) {
      throw new Error(`Related asset not found: ${relationship.relatedAssetId}`)
    }

    const newRelationship: AssetRelationship = {
      id: this.generateRelationshipId(),
      ...relationship,
      createdAt: new Date(),
      isActive: true
    }

    asset.relationships.push(newRelationship)
    await this.saveAsset(asset)

    this.logger.info(`Relationship added: ${assetId} -> ${relationship.relatedAssetId}`)
    this.emit('relationship:added', { assetId, relationship: newRelationship })

    return newRelationship
  }

  // Remove asset relationship
  async removeRelationship(assetId: string, relationshipId: string): Promise<void> {
    const asset = this.assets.get(assetId)
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    const relationshipIndex = asset.relationships.findIndex(rel => rel.id === relationshipId)
    if (relationshipIndex === -1) {
      throw new Error(`Relationship not found: ${relationshipId}`)
    }

    asset.relationships.splice(relationshipIndex, 1)
    await this.saveAsset(asset)

    this.logger.info(`Relationship removed: ${assetId} -> ${relationshipId}`)
    this.emit('relationship:removed', { assetId, relationshipId })
  }

  // Get related assets
  getRelatedAssets(assetId: string, type?: AssetRelationshipType): Asset[] {
    const asset = this.assets.get(assetId)
    if (!asset) {
      return []
    }

    const relationships = type ? 
      asset.relationships.filter(rel => rel.type === type) : 
      asset.relationships

    return relationships
      .map(rel => this.assets.get(rel.relatedAssetId))
      .filter((relatedAsset): relatedAsset is Asset => relatedAsset !== undefined && rel.isActive)
  }

  // Update asset status
  async updateAssetStatus(assetId: string, status: AssetStatus, updatedBy: string): Promise<Asset> {
    return await this.updateAsset(assetId, { status }, updatedBy)
  }

  // Update asset lifecycle stage
  async updateLifecycleStage(assetId: string, stage: AssetLifecycleStage, updatedBy: string): Promise<Asset> {
    return await this.updateAsset(assetId, { lifecycleStage: stage }, updatedBy)
  }

  // Add asset document
  async addDocument(assetId: string, document: Omit<AssetDocument, 'id' | 'uploadedAt'>): Promise<AssetDocument> {
    const asset = this.assets.get(assetId)
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    const newDocument: AssetDocument = {
      id: this.generateDocumentId(),
      ...document,
      uploadedAt: new Date()
    }

    asset.documents.push(newDocument)
    await this.saveAsset(asset)

    this.logger.info(`Document added to asset: ${assetId}`)
    this.emit('document:added', { assetId, document: newDocument })

    return newDocument
  }

  // Remove asset document
  async removeDocument(assetId: string, documentId: string): Promise<void> {
    const asset = this.assets.get(assetId)
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    const documentIndex = asset.documents.findIndex(doc => doc.id === documentId)
    if (documentIndex === -1) {
      throw new Error(`Document not found: ${documentId}`)
    }

    asset.documents.splice(documentIndex, 1)
    await this.saveAsset(asset)

    this.logger.info(`Document removed from asset: ${assetId}`)
    this.emit('document:removed', { assetId, documentId })
  }

  // Validate asset
  async validateAsset(assetId: string, validator: string): Promise<AssetValidation> {
    const asset = this.assets.get(assetId)
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    const validation = await this.performValidation(asset, validator)
    
    await this.updateAsset(assetId, { validation }, validator)

    this.logger.info(`Asset validation completed: ${assetId}`)
    this.emit('asset:validated', { assetId, validation })

    return validation
  }

  // Get asset statistics
  getAssetStatistics(): AssetStatistics {
    const assets = Array.from(this.assets.values())

    return {
      totalAssets: assets.length,
      assetsByType: this.countByType(assets),
      assetsByStatus: this.countByStatus(assets),
      assetsByLifecycleStage: this.countByLifecycleStage(assets),
      assetsByOwner: this.countByOwner(assets),
      totalValue: this.calculateTotalValue(assets),
      averageValue: this.calculateAverageValue(assets),
      topCategories: this.getTopCategories(assets),
      topTags: this.getTopTags(assets),
      recentAssets: assets.slice(0, 10),
      assetsNeedingValidation: assets.filter(asset => 
        asset.validation.nextReviewDate < new Date()
      ).length
    }
  }

  // Private methods
  private validateAsset(asset: Asset): void {
    if (!asset.name || asset.name.trim().length === 0) {
      throw new Error('Asset name is required')
    }

    if (!asset.owner) {
      throw new Error('Asset owner is required')
    }

    if (!asset.metadata) {
      throw new Error('Asset metadata is required')
    }

    if (this.assets.size >= this.maxAssets) {
      throw new Error('Maximum asset limit reached')
    }
  }

  private updateIndexes(asset: Asset): void {
    // Update type index
    if (!this.assetIndex.has(asset.type)) {
      this.assetIndex.set(asset.type, new Set())
    }
    this.assetIndex.get(asset.type)!.add(asset.id)

    // Update category indexes
    for (const category of asset.categories) {
      if (!this.categoryIndex.has(category)) {
        this.categoryIndex.set(category, new Set())
      }
      this.categoryIndex.get(category)!.add(asset.id)
    }

    // Update tag indexes
    for (const tag of asset.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(asset.id)
    }

    // Update owner index
    if (!this.ownerIndex.has(asset.owner)) {
      this.ownerIndex.set(asset.owner, new Set())
    }
    this.ownerIndex.get(asset.owner)!.add(asset.id)
  }

  private sortAssets(assets: Asset[], sortBy: string, sortOrder: 'asc' | 'desc'): Asset[] {
    return assets.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'updatedAt':
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
        case 'value':
          aValue = parseFloat(a.value.estimated)
          bValue = parseFloat(b.value.estimated)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  private async performValidation(asset: Asset, validator: string): Promise<AssetValidation> {
    // This would perform actual validation checks
    // For now, return a mock validation
    return {
      isValid: true,
      validationDate: new Date(),
      validatedBy: validator,
      validationScore: 0.85,
      checks: [],
      issues: [],
      recommendations: [],
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      requiredActions: []
    }
  }

  private getDefaultMetadata(): AssetMetadata {
    return {
      basic: {
        title: '',
        description: '',
        summary: '',
        keywords: [],
        language: 'en',
        jurisdiction: ''
      },
      financial: {
        currentValue: '0',
        originalValue: '0',
        currency: 'USD',
        valuationDate: new Date(),
        valuationMethod: 'market',
        appraisalReport: '',
        insuranceValue: '0'
      },
      legal: {
        ownershipStructure: '',
        legalDescription: '',
        registrationNumber: '',
        jurisdiction: '',
        encumbrances: [],
        restrictions: [],
        compliance: []
      },
      technical: {
        specifications: {},
        condition: '',
        maintenance: [],
        certifications: [],
        standards: []
      },
      location: {
        country: '',
        region: ''
      },
      custom: {}
    }
  }

  private getDefaultValidation(): AssetValidation {
    return {
      isValid: false,
      validationDate: new Date(),
      validatedBy: '',
      validationScore: 0,
      checks: [],
      issues: [],
      recommendations: [],
      nextReviewDate: new Date(),
      requiredActions: []
    }
  }

  private getDefaultValue(): AssetValue {
    return {
      estimated: '0',
      market: '0',
      book: '0',
      liquidation: '0',
      currency: 'USD',
      lastUpdated: new Date(),
      valuationSource: '',
      confidence: 0,
      methodology: ''
    }
  }

  private getDefaultPermissions(createdBy: string): AssetPermissions {
    return {
      read: [createdBy],
      write: [createdBy],
      admin: [createdBy],
      public: false,
      inheritFromParent: false
    }
  }

  private countByType(assets: Asset[]): Record<AssetType, number> {
    const counts = {} as Record<AssetType, number>
    for (const asset of assets) {
      counts[asset.type] = (counts[asset.type] || 0) + 1
    }
    return counts
  }

  private countByStatus(assets: Asset[]): Record<AssetStatus, number> {
    const counts = {} as Record<AssetStatus, number>
    for (const asset of assets) {
      counts[asset.status] = (counts[asset.status] || 0) + 1
    }
    return counts
  }

  private countByLifecycleStage(assets: Asset[]): Record<AssetLifecycleStage, number> {
    const counts = {} as Record<AssetLifecycleStage, number>
    for (const asset of assets) {
      counts[asset.lifecycleStage] = (counts[asset.lifecycleStage] || 0) + 1
    }
    return counts
  }

  private countByOwner(assets: Asset[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const asset of assets) {
      counts[asset.owner] = (counts[asset.owner] || 0) + 1
    }
    return counts
  }

  private calculateTotalValue(assets: Asset[]): string {
    return assets.reduce((sum, asset) => 
      sum + parseFloat(asset.value.estimated), 0).toString()
  }

  private calculateAverageValue(assets: Asset[]): string {
    if (assets.length === 0) return '0'
    const total = this.calculateTotalValue(assets)
    return (parseFloat(total) / assets.length).toString()
  }

  private getTopCategories(assets: Asset[]): Array<{ category: string; count: number }> {
    const categoryCounts: Record<string, number> = {}
    for (const asset of assets) {
      for (const category of asset.categories) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      }
    }

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private getTopTags(assets: Asset[]): Array<{ tag: string; count: number }> {
    const tagCounts: Record<string, number> = {}
    for (const asset of assets) {
      for (const tag of asset.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private startIndexing(): void {
    setInterval(() => {
      this.rebuildIndexes()
    }, this.indexUpdateInterval)
  }

  private rebuildIndexes(): void {
    // Rebuild all indexes from scratch
    this.assetIndex.clear()
    this.categoryIndex.clear()
    this.tagIndex.clear()
    this.ownerIndex.clear()

    for (const asset of this.assets.values()) {
      this.updateIndexes(asset)
    }

    this.logger.debug('Asset indexes rebuilt')
  }

  private generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateRelationshipId(): string {
    return `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async saveAsset(asset: Asset): Promise<void> {
    // This would save to your database
    this.logger.debug(`Asset saved: ${asset.id}`)
  }

  private async loadAssets(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading assets...')
  }

  private async saveAssets(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving assets...')
  }

  // Export methods
  exportAssets(format: 'json' | 'csv' = 'json'): string {
    const assets = Array.from(this.assets.values())

    if (format === 'json') {
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        assets,
        statistics: this.getAssetStatistics()
      }, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'type', 'name', 'status', 'owner', 'value', 'createdAt']
      const csvRows = [headers.join(',')]
      
      for (const asset of assets) {
        csvRows.push([
          asset.id,
          asset.type,
          asset.name,
          asset.status,
          asset.owner,
          asset.value.estimated,
          asset.createdAt.toISOString()
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Health status
  getHealthStatus(): {
    isRunning: boolean
    totalAssets: number
    indexSize: number
    lastActivity: Date
    metrics: AssetStatistics
  } {
    return {
      isRunning: this.isRunning,
      totalAssets: this.assets.size,
      indexSize: this.assetIndex.size + this.categoryIndex.size + this.tagIndex.size + this.ownerIndex.size,
      lastActivity: new Date(),
      metrics: this.getAssetStatistics()
    }
  }
}

// Supporting interfaces
export interface AssetSearchQuery {
  type?: AssetType
  status?: AssetStatus
  lifecycleStage?: AssetLifecycleStage
  owner?: string
  categories?: string[]
  tags?: string[]
  text?: string
  valueRange?: { min: number; max: number }
  dateRange?: { start: Date; end: Date }
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface AssetSearchResult {
  assets: Asset[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AssetStatistics {
  totalAssets: number
  assetsByType: Record<AssetType, number>
  assetsByStatus: Record<AssetStatus, number>
  assetsByLifecycleStage: Record<AssetLifecycleStage, number>
  assetsByOwner: Record<string, number>
  totalValue: string
  averageValue: string
  topCategories: Array<{ category: string; count: number }>
  topTags: Array<{ tag: string; count: number }>
  recentAssets: Asset[]
  assetsNeedingValidation: number
}

export default AssetRegistry
