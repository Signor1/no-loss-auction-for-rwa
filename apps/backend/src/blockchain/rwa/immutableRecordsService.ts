import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetMetadataService from './assetMetadataService'
import logger from '../../utils/logger'

// Immutable records interfaces
export interface BlockchainRecord {
  id: string
  assetId: string
  recordType: 'ownership' | 'valuation' | 'maintenance' | 'insurance' | 'compliance' | 'transfer' | 'status_change'
  contentHash: string
  metadataURI: string
  transactionHash: string
  blockNumber: number
  blockHash: string
  timestamp: Date
  recordedBy: string
  verified: boolean
  verificationProof: VerificationProof
  previousRecord?: string // Link to previous record in chain
  nextRecord?: string // Link to next record in chain
}

export interface VerificationProof {
  method: 'blockchain_tx' | 'multi_sig' | 'oracle' | 'zk_proof'
  proofData: Record<string, any>
  verifiedAt: Date
  verifiedBy: string
  confidence: number // 0-100
}

export interface AuditTrail {
  assetId: string
  records: BlockchainRecord[]
  integrityStatus: 'verified' | 'compromised' | 'unknown'
  lastVerification: Date
  totalRecords: number
  unbrokenChain: boolean
  tamperingAttempts: number
}

export interface MerkleTree {
  root: string
  leaves: string[]
  proofs: Record<string, string[]>
  timestamp: Date
}

export interface DataIntegrityCheck {
  assetId: string
  recordType: string
  checkType: 'hash_verification' | 'chain_integrity' | 'content_validation'
  status: 'passed' | 'failed' | 'warning'
  checkedAt: Date
  details: Record<string, any>
  recommendations?: string[]
}

export interface ImmutableLog {
  id: string
  assetId: string
  eventType: string
  eventData: Record<string, any>
  hash: string
  timestamp: Date
  immutable: boolean
  blockchainVerified: boolean
  verificationDetails: {
    transactionHash?: string
    blockNumber?: number
    merkleProof?: string[]
    oracleSignature?: string
  }
}

export interface DataProvenance {
  assetId: string
  originalSource: string
  dataLineage: DataLineageStep[]
  lastModified: Date
  modificationHistory: ModificationRecord[]
  integrityScore: number // 0-100
  trustworthinessRating: 'high' | 'medium' | 'low'
}

export interface DataLineageStep {
  stepId: string
  operation: string
  performedBy: string
  timestamp: Date
  inputHashes: string[]
  outputHash: string
  metadata: Record<string, any>
}

export interface ModificationRecord {
  id: string
  field: string
  oldValue: any
  newValue: any
  modifiedBy: string
  modifiedAt: Date
  reason: string
  authorized: boolean
  blockchainVerified: boolean
}

export interface TamperDetection {
  assetId: string
  detectionType: 'hash_mismatch' | 'chain_break' | 'unauthorized_modification' | 'timing_anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: Date
  affectedRecords: string[]
  evidence: Record<string, any>
  mitigationActions: string[]
  resolved: boolean
  resolvedAt?: Date
}

/**
 * Immutable Records Service with Blockchain Verification
 * Ensures data integrity and immutability through blockchain anchoring
 * Provides tamper-proof audit trails and verification mechanisms
 */
export class ImmutableRecordsService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private metadataService: AssetMetadataService
  private blockchainRecords: Map<string, BlockchainRecord[]> = new Map()
  private auditTrails: Map<string, AuditTrail> = new Map()
  private immutableLogs: Map<string, ImmutableLog[]> = new Map()
  private dataIntegrityChecks: Map<string, DataIntegrityCheck[]> = new Map()
  private merkleTrees: Map<string, MerkleTree> = new Map()
  private tamperDetections: Map<string, TamperDetection[]> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    metadataService: AssetMetadataService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.metadataService = metadataService
    this.logger = loggerInstance
  }

  // ============ BLOCKCHAIN RECORDING ============

  /**
   * Record data immutably on blockchain
   */
  async recordOnBlockchain(params: {
    assetId: string
    recordType: BlockchainRecord['recordType']
    content: Record<string, any>
    recordedBy: string
    verificationMethod?: VerificationProof['method']
  }): Promise<BlockchainRecord> {
    try {
      // Generate content hash
      const contentHash = this.generateContentHash(params.content)

      // Create metadata for IPFS
      const metadata = {
        assetId: params.assetId,
        recordType: params.recordType,
        contentHash,
        content: params.content,
        recordedBy: params.recordedBy,
        timestamp: new Date().toISOString()
      }

      // Upload metadata to IPFS
      const metadataURI = await this.metadataService.uploadToIPFS(metadata)

      // Anchor on blockchain (simplified - would use smart contract)
      const txResult = await this.anchorOnBlockchain(metadataURI, contentHash)

      // Create blockchain record
      const record: BlockchainRecord = {
        id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        recordType: params.recordType,
        contentHash,
        metadataURI,
        transactionHash: txResult.transactionHash,
        blockNumber: txResult.blockNumber,
        blockHash: txResult.blockHash,
        timestamp: new Date(),
        recordedBy: params.recordedBy,
        verified: true,
        verificationProof: await this.generateVerificationProof(
          params.assetId,
          contentHash,
          params.verificationMethod || 'blockchain_tx'
        )
      }

      // Link to previous record for chain integrity
      const previousRecord = this.getLatestRecord(params.assetId)
      if (previousRecord) {
        record.previousRecord = previousRecord.id
        previousRecord.nextRecord = record.id
      }

      // Store record
      if (!this.blockchainRecords.has(params.assetId)) {
        this.blockchainRecords.set(params.assetId, [])
      }
      this.blockchainRecords.get(params.assetId)!.push(record)

      // Update audit trail
      await this.updateAuditTrail(params.assetId)

      // Log immutable event
      await this.logImmutableEvent(params.assetId, params.recordType, params.content, record)

      this.emit('record:blockchain:created', { assetId: params.assetId, record })

      return record
    } catch (error) {
      this.logger.error(`Failed to record on blockchain for ${params.assetId}:`, error)
      throw error
    }
  }

  /**
   * Anchor data on blockchain
   */
  private async anchorOnBlockchain(metadataURI: string, contentHash: string): Promise<{
    transactionHash: string
    blockNumber: number
    blockHash: string
  }> {
    try {
      // In a real implementation, this would:
      // 1. Call a smart contract method to store the hash
      // 2. Wait for transaction confirmation
      // 3. Return transaction details

      // For now, simulate blockchain anchoring
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      const mockBlockNumber = Math.floor(Math.random() * 1000000) + 18000000 // Recent block
      const mockBlockHash = `0x${Math.random().toString(16).substr(2, 64)}`

      this.logger.info(`Mock blockchain anchor: ${mockTxHash}`)

      return {
        transactionHash: mockTxHash,
        blockNumber: mockBlockNumber,
        blockHash: mockBlockHash
      }
    } catch (error) {
      this.logger.error('Failed to anchor on blockchain:', error)
      throw error
    }
  }

  /**
   * Generate verification proof
   */
  private async generateVerificationProof(
    assetId: string,
    contentHash: string,
    method: VerificationProof['method']
  ): Promise<VerificationProof> {
    try {
      const proof: VerificationProof = {
        method,
        proofData: {},
        verifiedAt: new Date(),
        verifiedBy: 'system',
        confidence: 100
      }

      switch (method) {
        case 'blockchain_tx':
          proof.proofData = {
            contentHash,
            anchored: true,
            timestamp: new Date().toISOString()
          }
          break

        case 'multi_sig':
          proof.proofData = {
            signatures: ['sig1', 'sig2', 'sig3'], // Mock signatures
            threshold: 2,
            totalSigners: 3
          }
          break

        case 'oracle':
          proof.proofData = {
            oracleId: 'chainlink_price_feed',
            value: contentHash,
            timestamp: new Date().toISOString()
          }
          break

        case 'zk_proof':
          proof.proofData = {
            proof: 'zk_proof_data', // Mock ZK proof
            publicInputs: [contentHash],
            verificationKey: 'vk_hash'
          }
          break
      }

      return proof
    } catch (error) {
      this.logger.error('Failed to generate verification proof:', error)
      throw error
    }
  }

  // ============ VERIFICATION & INTEGRITY ============

  /**
   * Verify record integrity
   */
  async verifyRecordIntegrity(recordId: string): Promise<{
    verified: boolean
    issues: string[]
    confidence: number
  }> {
    try {
      // Find record
      let record: BlockchainRecord | null = null
      let assetId: string = ''

      for (const [asset, records] of this.blockchainRecords) {
        const foundRecord = records.find(r => r.id === recordId)
        if (foundRecord) {
          record = foundRecord
          assetId = asset
          break
        }
      }

      if (!record) {
        return {
          verified: false,
          issues: ['Record not found'],
          confidence: 0
        }
      }

      const issues: string[] = []
      let confidence = 100

      // Verify blockchain anchoring
      const blockchainVerified = await this.verifyBlockchainAnchoring(record)
      if (!blockchainVerified) {
        issues.push('Blockchain anchoring verification failed')
        confidence -= 30
      }

      // Verify content integrity
      const contentVerified = await this.verifyContentIntegrity(record)
      if (!contentVerified) {
        issues.push('Content integrity verification failed')
        confidence -= 40
      }

      // Verify chain integrity
      const chainVerified = await this.verifyChainIntegrity(assetId)
      if (!chainVerified) {
        issues.push('Chain integrity verification failed')
        confidence -= 30
      }

      const verified = issues.length === 0

      // Log verification result
      if (!verified) {
        await this.detectTampering(assetId, 'chain_break', 'high', [recordId], { issues, confidence })
      }

      return {
        verified,
        issues,
        confidence: Math.max(0, confidence)
      }
    } catch (error) {
      this.logger.error(`Failed to verify record integrity ${recordId}:`, error)
      return {
        verified: false,
        issues: ['Verification process failed'],
        confidence: 0
      }
    }
  }

  /**
   * Verify blockchain anchoring
   */
  private async verifyBlockchainAnchoring(record: BlockchainRecord): Promise<boolean> {
    try {
      // In a real implementation, this would:
      // 1. Query the blockchain for the transaction
      // 2. Verify the transaction contains the expected data
      // 3. Check block confirmation status

      // For now, simulate verification
      this.logger.info(`Mock blockchain verification for ${record.transactionHash}`)
      return true
    } catch (error) {
      this.logger.error('Failed to verify blockchain anchoring:', error)
      return false
    }
  }

  /**
   * Verify content integrity
   */
  private async verifyContentIntegrity(record: BlockchainRecord): Promise<boolean> {
    try {
      // Download metadata from IPFS
      const metadata = await this.metadataService.downloadFromIPFS(record.metadataURI)

      // Verify content hash
      const currentHash = this.generateContentHash(metadata.content || metadata)
      const hashMatches = currentHash === record.contentHash

      if (!hashMatches) {
        this.logger.warn(`Content hash mismatch for record ${record.id}`)
      }

      return hashMatches
    } catch (error) {
      this.logger.error('Failed to verify content integrity:', error)
      return false
    }
  }

  /**
   * Verify chain integrity
   */
  private async verifyChainIntegrity(assetId: string): Promise<boolean> {
    try {
      const records = this.blockchainRecords.get(assetId) || []
      if (records.length === 0) return true

      // Sort records chronologically
      const sortedRecords = records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      // Verify chain links
      for (let i = 1; i < sortedRecords.length; i++) {
        const current = sortedRecords[i]
        const previous = sortedRecords[i - 1]

        if (current.previousRecord !== previous.id) {
          this.logger.warn(`Chain break detected between ${previous.id} and ${current.id}`)
          return false
        }
      }

      return true
    } catch (error) {
      this.logger.error('Failed to verify chain integrity:', error)
      return false
    }
  }

  // ============ AUDIT TRAIL MANAGEMENT ============

  /**
   * Update audit trail for asset
   */
  private async updateAuditTrail(assetId: string): Promise<void> {
    try {
      const records = this.blockchainRecords.get(assetId) || []
      const integrityStatus = await this.verifyChainIntegrity(assetId) ? 'verified' : 'compromised'

      const auditTrail: AuditTrail = {
        assetId,
        records,
        integrityStatus: integrityStatus as any,
        lastVerification: new Date(),
        totalRecords: records.length,
        unbrokenChain: integrityStatus === 'verified',
        tamperingAttempts: this.tamperDetections.get(assetId)?.length || 0
      }

      this.auditTrails.set(assetId, auditTrail)

      this.emit('auditTrail:updated', { assetId, auditTrail })
    } catch (error) {
      this.logger.error(`Failed to update audit trail for ${assetId}:`, error)
    }
  }

  /**
   * Get audit trail for asset
   */
  getAuditTrail(assetId: string): AuditTrail | null {
    return this.auditTrails.get(assetId) || null
  }

  // ============ IMMUTABLE LOGGING ============

  /**
   * Log immutable event
   */
  private async logImmutableEvent(
    assetId: string,
    eventType: string,
    eventData: Record<string, any>,
    blockchainRecord: BlockchainRecord
  ): Promise<void> {
    try {
      const logEntry: ImmutableLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        eventType,
        eventData,
        hash: blockchainRecord.contentHash,
        timestamp: new Date(),
        immutable: true,
        blockchainVerified: blockchainRecord.verified,
        verificationDetails: {
          transactionHash: blockchainRecord.transactionHash,
          blockNumber: blockchainRecord.blockNumber,
          merkleProof: [] // Would be populated for merkle tree verification
        }
      }

      if (!this.immutableLogs.has(assetId)) {
        this.immutableLogs.set(assetId, [])
      }

      this.immutableLogs.get(assetId)!.push(logEntry)

      this.emit('log:immutable:created', { assetId, logEntry })
    } catch (error) {
      this.logger.error(`Failed to log immutable event for ${assetId}:`, error)
    }
  }

  /**
   * Get immutable logs for asset
   */
  getImmutableLogs(assetId: string): ImmutableLog[] {
    const logs = this.immutableLogs.get(assetId) || []
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // ============ TAMPER DETECTION ============

  /**
   * Detect tampering attempts
   */
  private async detectTampering(
    assetId: string,
    detectionType: TamperDetection['detectionType'],
    severity: TamperDetection['severity'],
    affectedRecords: string[],
    evidence: Record<string, any>
  ): Promise<void> {
    try {
      const detection: TamperDetection = {
        assetId,
        detectionType,
        severity,
        detectedAt: new Date(),
        affectedRecords,
        evidence,
        mitigationActions: this.generateMitigationActions(detectionType),
        resolved: false
      }

      if (!this.tamperDetections.has(assetId)) {
        this.tamperDetections.set(assetId, [])
      }

      this.tamperDetections.get(assetId)!.push(detection)

      // Emit critical alert for high severity detections
      if (severity === 'high' || severity === 'critical') {
        this.emit('tamper:detected', { assetId, detection })
      }

      this.logger.warn(`Tamper detection: ${detectionType} for asset ${assetId}`)
    } catch (error) {
      this.logger.error(`Failed to detect tampering for ${assetId}:`, error)
    }
  }

  /**
   * Generate mitigation actions
   */
  private generateMitigationActions(detectionType: TamperDetection['detectionType']): string[] {
    const actions: Record<string, string[]> = {
      hash_mismatch: [
        'Recalculate and re-anchor data hash',
        'Verify IPFS content integrity',
        'Audit access logs for unauthorized modifications'
      ],
      chain_break: [
        'Reconstruct audit trail from backup',
        'Verify all subsequent records',
        'Implement additional verification layers'
      ],
      unauthorized_modification: [
        'Review and revoke suspicious permissions',
        'Implement additional authentication requirements',
        'Audit all recent changes'
      ],
      timing_anomaly: [
        'Verify system clock synchronization',
        'Review timestamp sources',
        'Implement timestamp validation'
      ]
    }

    return actions[detectionType] || ['Investigate and implement appropriate mitigation']
  }

  /**
   * Get tamper detections for asset
   */
  getTamperDetections(assetId: string): TamperDetection[] {
    const detections = this.tamperDetections.get(assetId) || []
    return detections.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
  }

  // ============ MERKLE TREE MANAGEMENT ============

  /**
   * Build merkle tree for records
   */
  async buildMerkleTree(assetId: string): Promise<MerkleTree> {
    try {
      const records = this.blockchainRecords.get(assetId) || []

      if (records.length === 0) {
        throw new Error(`No records found for asset ${assetId}`)
      }

      // Sort records chronologically
      const sortedRecords = records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      // Create leaves from record hashes
      const leaves = sortedRecords.map(record => record.contentHash)

      // Build merkle tree (simplified implementation)
      const tree = this.buildMerkleTreeFromLeaves(leaves)

      // Store tree
      this.merkleTrees.set(assetId, {
        ...tree,
        timestamp: new Date()
      })

      this.emit('merkleTree:built', { assetId, tree })

      return tree
    } catch (error) {
      this.logger.error(`Failed to build merkle tree for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Build merkle tree from leaves (simplified)
   */
  private buildMerkleTreeFromLeaves(leaves: string[]): MerkleTree {
    // Simplified merkle tree implementation
    // In a real implementation, this would use a proper merkle tree library

    const tree: MerkleTree = {
      root: leaves.length > 0 ? this.hashLeaves(leaves) : '',
      leaves: leaves,
      proofs: {},
      timestamp: new Date()
    }

    // Generate proofs for each leaf
    leaves.forEach((leaf, index) => {
      tree.proofs[leaf] = this.generateMerkleProof(leaves, index)
    })

    return tree
  }

  /**
   * Hash leaves together (simplified)
   */
  private hashLeaves(leaves: string[]): string {
    if (leaves.length === 0) return ''
    if (leaves.length === 1) return leaves[0]

    // Simple concatenation hash (not cryptographically secure)
    return this.generateContentHash(leaves.join(''))
  }

  /**
   * Generate merkle proof for leaf (simplified)
   */
  private generateMerkleProof(leaves: string[], index: number): string[] {
    // Simplified proof generation
    // In a real implementation, this would generate proper merkle proofs
    return leaves.filter((_, i) => i !== index).map(leaf => this.generateContentHash(leaf))
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Generate content hash
   */
  private generateContentHash(content: any): string {
    // Simple hash function (in production, use crypto library)
    const str = JSON.stringify(content)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Get latest record for asset
   */
  private getLatestRecord(assetId: string): BlockchainRecord | null {
    const records = this.blockchainRecords.get(assetId)
    if (!records || records.length === 0) return null

    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
  }

  /**
   * Get all records for asset
   */
  getRecords(assetId: string): BlockchainRecord[] {
    const records = this.blockchainRecords.get(assetId) || []
    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Get record by ID
   */
  getRecord(recordId: string): BlockchainRecord | null {
    for (const records of this.blockchainRecords.values()) {
      const record = records.find(r => r.id === recordId)
      if (record) return record
    }
    return null
  }

  /**
   * Get comprehensive immutability report
   */
  async getImmutabilityReport(assetId: string): Promise<{
    auditTrail: AuditTrail | null
    integrityChecks: DataIntegrityCheck[]
    tamperDetections: TamperDetection[]
    merkleTree: MerkleTree | null
    overallIntegrity: 'verified' | 'compromised' | 'unknown'
    confidence: number
  }> {
    const auditTrail = this.getAuditTrail(assetId)
    const integrityChecks = this.dataIntegrityChecks.get(assetId) || []
    const tamperDetections = this.getTamperDetections(assetId)
    const merkleTree = this.merkleTrees.get(assetId) || null

    // Calculate overall integrity
    let overallIntegrity: 'verified' | 'compromised' | 'unknown' = 'unknown'
    let confidence = 50

    if (auditTrail) {
      if (auditTrail.integrityStatus === 'verified' && tamperDetections.length === 0) {
        overallIntegrity = 'verified'
        confidence = 95
      } else if (auditTrail.integrityStatus === 'compromised' || tamperDetections.length > 0) {
        overallIntegrity = 'compromised'
        confidence = 10
      }
    }

    return {
      auditTrail,
      integrityChecks,
      tamperDetections,
      merkleTree,
      overallIntegrity,
      confidence
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
        totalAssets: this.blockchainRecords.size,
        totalRecords: Array.from(this.blockchainRecords.values()).flat().length,
        verifiedRecords: Array.from(this.blockchainRecords.values()).flat().filter(r => r.verified).length,
        tamperDetections: Array.from(this.tamperDetections.values()).flat().length,
        activeMerkleTrees: this.merkleTrees.size
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.blockchainRecords.clear()
    this.auditTrails.clear()
    this.immutableLogs.clear()
    this.dataIntegrityChecks.clear()
    this.merkleTrees.clear()
    this.tamperDetections.clear()
    this.logger.info('All immutable records data cleared')
  }
}

export default ImmutableRecordsService
