import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// IPFS and metadata interfaces
export interface IPFSMetadata {
  id: string
  assetId: string
  version: number
  metadataURI: string
  contentHash: string
  size: number
  uploadedAt: Date
  uploader: string
  encryption: boolean
  accessControl: AccessControl[]
  previousVersion?: string
  status: 'active' | 'deprecated' | 'deleted'
}

export interface AccessControl {
  id: string
  userAddress: string
  permissions: ('read' | 'write' | 'delete')[]
  grantedAt: Date
  grantedBy: string
  expiryDate?: Date
  conditions?: Record<string, any>
}

export interface AssetMetadata {
  name: string
  description: string
  assetType: string
  category: string
  subcategory?: string

  // Physical characteristics
  physicalCharacteristics: {
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
    condition: string
    age?: number
    manufacturer?: string
    model?: string
    serialNumber?: string
  }

  // Location data
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

  // Valuation data
  valuation: {
    appraisedValue: number
    currency: string
    appraisalDate: string
    appraiser: string
    appraisalMethod: string
    marketValue?: number
    replacementValue?: number
  }

  // Ownership data
  ownership: {
    currentOwner: string
    ownershipType: string
    ownershipPercentage: number
    acquisitionDate: string
    acquisitionPrice?: number
  }

  // Documentation
  documentation: {
    titleDeed?: string
    certificateOfAuthenticity?: string
    insurancePolicy?: string
    maintenanceRecords?: string[]
    appraisalReports?: string[]
    legalDocuments?: string[]
  }

  // Digital assets
  images: string[]
  videos?: string[]
  documents: string[]

  // Compliance and legal
  compliance: {
    jurisdiction: string
    regulatoryStatus: string
    kycStatus?: string
    amlStatus?: string
    sanctionsCheck?: string
    environmentalCompliance?: string
  }

  // Technical metadata
  createdAt: string
  updatedAt: string
  version: number
  schemaVersion: string
  checksum: string
}

export interface MetadataValidation {
  id: string
  metadataId: string
  validator: string
  validationType: 'schema' | 'business_rules' | 'regulatory' | 'technical'
  status: 'passed' | 'failed' | 'warning'
  checkedAt: Date
  results: ValidationResult[]
  recommendations?: string[]
}

export interface ValidationResult {
  field: string
  rule: string
  status: 'passed' | 'failed' | 'warning'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestion?: string
}

export interface MetadataUpdate {
  id: string
  metadataId: string
  previousVersion: number
  newVersion: number
  changes: MetadataChange[]
  updatedBy: string
  updatedAt: Date
  reason: string
  approved: boolean
  approver?: string
  approvalDate?: Date
}

export interface MetadataChange {
  field: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'modified' | 'removed'
  impact: 'low' | 'medium' | 'high'
}

/**
 * Asset Metadata Management Service
 * Handles IPFS integration, metadata versioning, validation, and access control
 */
export class AssetMetadataService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private ipfsMetadata: Map<string, IPFSMetadata[]> = new Map() // assetId -> metadata versions
  private validations: Map<string, MetadataValidation[]> = new Map()
  private updates: Map<string, MetadataUpdate[]> = new Map()
  private accessControls: Map<string, AccessControl[]> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.logger = loggerInstance
  }

  // ============ METADATA CREATION & MANAGEMENT ============

  /**
   * Create and upload asset metadata to IPFS
   */
  async createMetadata(assetId: string, metadata: Omit<AssetMetadata, 'createdAt' | 'updatedAt' | 'version' | 'schemaVersion' | 'checksum'>): Promise<IPFSMetadata> {
    try {
      // Add technical metadata
      const fullMetadata: AssetMetadata = {
        ...metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        schemaVersion: '1.0.0',
        checksum: this.calculateChecksum(metadata)
      }

      // Validate metadata
      await this.validateMetadata(fullMetadata)

      // Upload to IPFS
      const metadataURI = await this.uploadToIPFS(fullMetadata)
      const contentHash = this.calculateContentHash(fullMetadata)

      // Create metadata record
      const ipfsMetadata: IPFSMetadata = {
        id: `metadata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        version: 1,
        metadataURI,
        contentHash,
        size: JSON.stringify(fullMetadata).length,
        uploadedAt: new Date(),
        uploader: 'system', // Would be actual user
        encryption: false, // Could be encrypted
        accessControl: [],
        status: 'active'
      }

      // Store metadata record
      if (!this.ipfsMetadata.has(assetId)) {
        this.ipfsMetadata.set(assetId, [])
      }
      this.ipfsMetadata.get(assetId)!.push(ipfsMetadata)

      // Set up default access control
      await this.setupDefaultAccessControl(assetId, ipfsMetadata.id, metadata.ownership.currentOwner)

      this.emit('metadata:created', { assetId, metadata: ipfsMetadata })

      return ipfsMetadata
    } catch (error) {
      this.logger.error(`Failed to create metadata for asset ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update asset metadata with versioning
   */
  async updateMetadata(
    assetId: string,
    updates: Partial<AssetMetadata>,
    updatedBy: string,
    reason: string
  ): Promise<IPFSMetadata> {
    try {
      const currentMetadata = await this.getLatestMetadata(assetId)
      if (!currentMetadata) {
        throw new Error(`No metadata found for asset ${assetId}`)
      }

      // Get current metadata content
      const currentContent = await this.downloadFromIPFS(currentMetadata.metadataURI)

      // Apply updates
      const updatedContent = {
        ...currentContent,
        ...updates,
        updatedAt: new Date().toISOString(),
        version: currentContent.version + 1,
        checksum: this.calculateChecksum({ ...currentContent, ...updates })
      }

      // Validate updated metadata
      await this.validateMetadata(updatedContent)

      // Create update record
      const changes = this.calculateChanges(currentContent, updatedContent)
      const updateRecord: MetadataUpdate = {
        id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadataId: currentMetadata.id,
        previousVersion: currentContent.version,
        newVersion: updatedContent.version,
        changes,
        updatedBy,
        updatedAt: new Date(),
        reason,
        approved: false // Would require approval workflow
      }

      // Upload new version to IPFS
      const metadataURI = await this.uploadToIPFS(updatedContent)
      const contentHash = this.calculateContentHash(updatedContent)

      // Create new metadata record
      const newMetadata: IPFSMetadata = {
        id: `metadata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        version: updatedContent.version,
        metadataURI,
        contentHash,
        size: JSON.stringify(updatedContent).length,
        uploadedAt: new Date(),
        uploader: updatedBy,
        encryption: false,
        accessControl: currentMetadata.accessControl,
        previousVersion: currentMetadata.id,
        status: 'active'
      }

      // Deprecate old version
      currentMetadata.status = 'deprecated'

      // Store records
      this.ipfsMetadata.get(assetId)!.push(newMetadata)

      if (!this.updates.has(assetId)) {
        this.updates.set(assetId, [])
      }
      this.updates.get(assetId)!.push(updateRecord)

      this.emit('metadata:updated', { assetId, oldMetadata: currentMetadata, newMetadata, update: updateRecord })

      return newMetadata
    } catch (error) {
      this.logger.error(`Failed to update metadata for asset ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get latest metadata for asset
   */
  async getLatestMetadata(assetId: string): Promise<IPFSMetadata | null> {
    try {
      const metadataList = this.ipfsMetadata.get(assetId)
      if (!metadataList || metadataList.length === 0) return null

      // Return the most recent active metadata
      return metadataList
        .filter(m => m.status === 'active')
        .sort((a, b) => b.version - a.version)[0] || null
    } catch (error) {
      this.logger.error(`Failed to get latest metadata for ${assetId}:`, error)
      return null
    }
  }

  /**
   * Get metadata by version
   */
  async getMetadataByVersion(assetId: string, version: number): Promise<IPFSMetadata | null> {
    try {
      const metadataList = this.ipfsMetadata.get(assetId)
      if (!metadataList) return null

      return metadataList.find(m => m.version === version) || null
    } catch (error) {
      this.logger.error(`Failed to get metadata version ${version} for ${assetId}:`, error)
      return null
    }
  }

  /**
   * Get all metadata versions for asset
   */
  getMetadataHistory(assetId: string): IPFSMetadata[] {
    const metadataList = this.ipfsMetadata.get(assetId) || []
    return metadataList.sort((a, b) => b.version - a.version)
  }

  // ============ IPFS OPERATIONS ============

  /**
   * Upload data to IPFS (simplified implementation)
   */
  async uploadToIPFS(data: any): Promise<string> {
    try {
      // In a real implementation, this would:
      // 1. Connect to IPFS node or pinning service
      // 2. Upload the data
      // 3. Return the IPFS hash/CID

      // For now, simulate IPFS upload
      const mockHash = `ipfs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this.logger.info(`Mock IPFS upload: ${mockHash}`)

      // Store data locally for retrieval (in real implementation, this would be on IPFS)
      // This is just for demonstration

      return `ipfs://${mockHash}`
    } catch (error) {
      this.logger.error('Failed to upload to IPFS:', error)
      throw error
    }
  }

  /**
   * Download data from IPFS (simplified implementation)
   */
  private async downloadFromIPFS(uri: string): Promise<any> {
    try {
      // In a real implementation, this would:
      // 1. Parse the IPFS URI
      // 2. Fetch data from IPFS network
      // 3. Return parsed JSON

      // For now, return mock data structure
      this.logger.info(`Mock IPFS download: ${uri}`)

      // This would return the actual metadata object
      return {
        name: 'Mock Asset',
        description: 'Mock description',
        // ... other metadata fields
      }
    } catch (error) {
      this.logger.error(`Failed to download from IPFS ${uri}:`, error)
      throw error
    }
  }

  /**
   * Pin content to ensure persistence
   */
  async pinContent(uri: string): Promise<boolean> {
    try {
      // In a real implementation, this would pin the content
      // to ensure it remains available on IPFS
      this.logger.info(`Mock IPFS pin: ${uri}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to pin content ${uri}:`, error)
      return false
    }
  }

  /**
   * Unpin content
   */
  async unpinContent(uri: string): Promise<boolean> {
    try {
      // In a real implementation, this would unpin the content
      this.logger.info(`Mock IPFS unpin: ${uri}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to unpin content ${uri}:`, error)
      return false
    }
  }

  // ============ ACCESS CONTROL ============

  /**
   * Grant access to metadata
   */
  async grantAccess(
    metadataId: string,
    userAddress: string,
    permissions: AccessControl['permissions'],
    grantedBy: string,
    expiryDate?: Date,
    conditions?: Record<string, any>
  ): Promise<AccessControl> {
    try {
      const accessControl: AccessControl = {
        id: `access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userAddress,
        permissions,
        grantedAt: new Date(),
        grantedBy,
        expiryDate,
        conditions
      }

      if (!this.accessControls.has(metadataId)) {
        this.accessControls.set(metadataId, [])
      }

      this.accessControls.get(metadataId)!.push(accessControl)

      this.emit('access:granted', { metadataId, accessControl })

      return accessControl
    } catch (error) {
      this.logger.error(`Failed to grant access to ${metadataId}:`, error)
      throw error
    }
  }

  /**
   * Revoke access from metadata
   */
  async revokeAccess(metadataId: string, userAddress: string): Promise<boolean> {
    try {
      const accessControls = this.accessControls.get(metadataId)
      if (!accessControls) return false

      const index = accessControls.findIndex(ac => ac.userAddress === userAddress)
      if (index === -1) return false

      accessControls.splice(index, 1)

      this.emit('access:revoked', { metadataId, userAddress })

      return true
    } catch (error) {
      this.logger.error(`Failed to revoke access from ${metadataId}:`, error)
      return false
    }
  }

  /**
   * Check if user has permission for metadata
   */
  async checkPermission(metadataId: string, userAddress: string, permission: string): Promise<boolean> {
    try {
      const accessControls = this.accessControls.get(metadataId)
      if (!accessControls) return false

      const userAccess = accessControls.find(ac => ac.userAddress === userAddress)
      if (!userAccess) return false

      // Check expiry
      if (userAccess.expiryDate && userAccess.expiryDate < new Date()) {
        return false
      }

      // Check permissions
      return userAccess.permissions.includes(permission as any)
    } catch (error) {
      this.logger.error(`Failed to check permission for ${metadataId}:`, error)
      return false
    }
  }

  /**
   * Setup default access control for asset owner
   */
  private async setupDefaultAccessControl(assetId: string, metadataId: string, ownerAddress: string): Promise<void> {
    try {
      await this.grantAccess(
        metadataId,
        ownerAddress,
        ['read', 'write'],
        'system',
        undefined, // No expiry for owner
        { role: 'owner' }
      )
    } catch (error) {
      this.logger.error(`Failed to setup default access control for ${assetId}:`, error)
    }
  }

  // ============ VALIDATION ============

  /**
   * Validate metadata against schema and business rules
   */
  private async validateMetadata(metadata: AssetMetadata): Promise<ValidationResult[]> {
    try {
      const results: ValidationResult[] = []

      // Schema validation
      const schemaResults = this.validateSchema(metadata)
      results.push(...schemaResults)

      // Business rules validation
      const businessResults = this.validateBusinessRules(metadata)
      results.push(...businessResults)

      // Regulatory validation (simplified)
      const regulatoryResults = this.validateRegulatory(metadata)
      results.push(...regulatoryResults)

      // Store validation results
      const validation: MetadataValidation = {
        id: `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metadataId: 'temp', // Would be set properly
        validator: 'system',
        validationType: 'schema',
        status: results.some(r => r.status === 'failed') ? 'failed' :
                results.some(r => r.status === 'warning') ? 'warning' : 'passed',
        checkedAt: new Date(),
        results
      }

      // Emit validation results
      this.emit('metadata:validated', { metadata, validation, results })

      return results
    } catch (error) {
      this.logger.error('Failed to validate metadata:', error)
      throw error
    }
  }

  /**
   * Validate against JSON schema
   */
  private validateSchema(metadata: AssetMetadata): ValidationResult[] {
    const results: ValidationResult[] = []

    // Required fields validation
    const requiredFields = ['name', 'description', 'assetType', 'valuation', 'ownership']
    for (const field of requiredFields) {
      if (!metadata[field as keyof AssetMetadata]) {
        results.push({
          field,
          rule: 'required',
          status: 'failed',
          message: `Required field '${field}' is missing`,
          severity: 'high'
        })
      }
    }

    // Data type validation
    if (typeof metadata.valuation.appraisedValue !== 'number') {
      results.push({
        field: 'valuation.appraisedValue',
        rule: 'type',
        status: 'failed',
        message: 'Appraised value must be a number',
        severity: 'high'
      })
    }

    return results
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(metadata: AssetMetadata): ValidationResult[] {
    const results: ValidationResult[] = []

    // Ownership percentage validation
    if (metadata.ownership.ownershipPercentage < 0 || metadata.ownership.ownershipPercentage > 100) {
      results.push({
        field: 'ownership.ownershipPercentage',
        rule: 'range',
        status: 'failed',
        message: 'Ownership percentage must be between 0 and 100',
        severity: 'high'
      })
    }

    // Age validation
    if (metadata.physicalCharacteristics.age && metadata.physicalCharacteristics.age < 0) {
      results.push({
        field: 'physicalCharacteristics.age',
        rule: 'range',
        status: 'warning',
        message: 'Asset age should not be negative',
        severity: 'medium'
      })
    }

    return results
  }

  /**
   * Validate regulatory compliance (simplified)
   */
  private validateRegulatory(metadata: AssetMetadata): ValidationResult[] {
    const results: ValidationResult[] = []

    // Basic regulatory checks
    if (!metadata.compliance.jurisdiction) {
      results.push({
        field: 'compliance.jurisdiction',
        rule: 'required',
        status: 'warning',
        message: 'Jurisdiction should be specified for regulatory compliance',
        severity: 'medium'
      })
    }

    return results
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate checksum for metadata integrity
   */
  private calculateChecksum(data: any): string {
    // Simple checksum calculation
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Calculate content hash
   */
  private calculateContentHash(data: any): string {
    // More sophisticated hash for content integrity
    return this.calculateChecksum(data) // Simplified
  }

  /**
   * Calculate changes between metadata versions
   */
  private calculateChanges(oldData: any, newData: any): MetadataChange[] {
    const changes: MetadataChange[] = []

    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      for (const key in obj1) {
        const fullPath = path ? `${path}.${key}` : key

        if (!(key in obj2)) {
          changes.push({
            field: fullPath,
            oldValue: obj1[key],
            newValue: undefined,
            changeType: 'removed',
            impact: 'medium'
          })
        } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
          changes.push({
            field: fullPath,
            oldValue: obj1[key],
            newValue: obj2[key],
            changeType: 'modified',
            impact: this.calculateImpact(key, obj1[key], obj2[key])
          })
        }
      }

      for (const key in obj2) {
        const fullPath = path ? `${path}.${key}` : key

        if (!(key in obj1)) {
          changes.push({
            field: fullPath,
            oldValue: undefined,
            newValue: obj2[key],
            changeType: 'added',
            impact: 'low'
          })
        }
      }
    }

    compareObjects(oldData, newData)
    return changes
  }

  /**
   * Calculate impact of a change
   */
  private calculateImpact(field: string, oldValue: any, newValue: any): 'low' | 'medium' | 'high' {
    // High impact fields
    const highImpactFields = ['valuation.appraisedValue', 'ownership.currentOwner', 'compliance.regulatoryStatus']

    if (highImpactFields.some(f => field.includes(f))) {
      return 'high'
    }

    // Medium impact fields
    const mediumImpactFields = ['location', 'physicalCharacteristics.condition', 'documentation']

    if (mediumImpactFields.some(f => field.includes(f))) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * Get validation history for metadata
   */
  getValidationHistory(assetId: string): MetadataValidation[] {
    return this.validations.get(assetId) || []
  }

  /**
   * Get update history for metadata
   */
  getUpdateHistory(assetId: string): MetadataUpdate[] {
    return this.updates.get(assetId) || []
  }

  /**
   * Get access control list for metadata
   */
  getAccessControls(metadataId: string): AccessControl[] {
    return this.accessControls.get(metadataId) || []
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
        totalMetadata: Array.from(this.ipfsMetadata.values()).flat().length,
        totalValidations: Array.from(this.validations.values()).flat().length,
        totalUpdates: Array.from(this.updates.values()).flat().length,
        totalAccessControls: Array.from(this.accessControls.values()).flat().length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.ipfsMetadata.clear()
    this.validations.clear()
    this.updates.clear()
    this.accessControls.clear()
    this.logger.info('All metadata service data cleared')
  }
}

export default AssetMetadataService
