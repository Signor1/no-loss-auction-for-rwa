import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { create } from 'ipfs-http-client'
import { CID } from 'multiformats/cid'
import { createHash } from 'crypto'

// IPFS configuration interface
export interface IPFSConfig {
  url: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  pinEnabled: boolean
  encryptionEnabled: boolean
  compressionEnabled: boolean
}

// IPFS file interface
export interface IPFSFile {
  cid: string
  name: string
  size: number
  type: string
  hash: string
  pinned: boolean
  encrypted: boolean
  compressed: boolean
  uploadedAt: Date
  uploadedBy: string
  metadata: IPFSFileMetadata
}

// IPFS file metadata interface
export interface IPFSFileMetadata {
  originalName: string
  mimeType: string
  encoding: string
  checksum: string
  tags: string[]
  description?: string
  category?: string
  customFields: Record<string, any>
}

// IPFS directory interface
export interface IPFSDirectory {
  cid: string
  name: string
  path: string
  size: number
  fileCount: number
  directoryCount: number
  pinned: boolean
  encrypted: boolean
  compressed: boolean
  createdAt: Date
  createdBy: string
  metadata: IPFSDirectoryMetadata
}

// IPFS directory metadata interface
export interface IPFSDirectoryMetadata {
  description?: string
  category?: string
  tags: string[]
  permissions: IPFSPermissions
  customFields: Record<string, any>
}

// IPFS permissions interface
export interface IPFSPermissions {
  read: string[]
  write: string[]
  admin: string[]
  public: boolean
}

// IPFS upload options interface
export interface IPFSUploadOptions {
  pin?: boolean
  encrypt?: boolean
  compress?: boolean
  tags?: string[]
  category?: string
  description?: string
  customFields?: Record<string, any>
  overwrite?: boolean
}

// IPFS download options interface
export interface IPFSDownloadOptions {
  decrypt?: boolean
  decompress?: boolean
  verifyChecksum?: boolean
  stream?: boolean
}

// IPFS batch operation interface
export interface IPFSBatchOperation {
  id: string
  type: BatchOperationType
  files: IPFSFile[]
  status: BatchOperationStatus
  progress: number
  startedAt: Date
  completedAt?: Date
  error?: string
  metadata: BatchOperationMetadata
}

// Batch operation type enum
export enum BatchOperationType {
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  PIN = 'pin',
  UNPIN = 'unpin',
  DELETE = 'delete',
  MOVE = 'move',
  COPY = 'copy'
}

// Batch operation status enum
export enum BatchOperationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Batch operation metadata interface
export interface BatchOperationMetadata {
  totalFiles: number
  processedFiles: number
  failedFiles: number
  totalSize: number
  processedSize: number
  estimatedTime?: number
}

// IPFS statistics interface
export interface IPFSStatistics {
  totalFiles: number
  totalDirectories: number
  totalSize: number
  pinnedFiles: number
  pinnedDirectories: number
  encryptedFiles: number
  compressedFiles: number
  uploadCount: number
  downloadCount: number
  bandwidthUsage: BandwidthUsage
  storageUsage: StorageUsage
  performanceMetrics: PerformanceMetrics
}

// Bandwidth usage interface
export interface BandwidthUsage {
  upload: number
  download: number
  total: number
  period: {
    start: Date
    end: Date
  }
}

// Storage usage interface
export interface StorageUsage {
  used: number
  available: number
  total: number
  percentage: number
  breakdown: StorageBreakdown
}

// Storage breakdown interface
export interface StorageBreakdown {
  files: number
  directories: number
  pinned: number
  encrypted: number
  compressed: number
}

// Performance metrics interface
export interface PerformanceMetrics {
  averageUploadSpeed: number
  averageDownloadSpeed: number
  uploadLatency: number
  downloadLatency: number
  successRate: number
  errorRate: number
}

// IPFS integration service
export class IPFSIntegrationService extends EventEmitter {
  private client: any
  private config: IPFSConfig
  private files: Map<string, IPFSFile> = new Map()
  private directories: Map<string, IPFSDirectory> = new Map()
  private batchOperations: Map<string, IPFSBatchOperation> = new Map()
  private statistics: IPFSStatistics
  private logger: Logger
  private isRunning: boolean = false
  private maxFileSize: number = 100 * 1024 * 1024 // 100MB
  private maxBatchSize: number = 1000

  constructor(config: IPFSConfig, logger: Logger) {
    super()
    this.config = config
    this.logger = logger
    this.statistics = this.initializeStatistics()
  }

  // Start IPFS service
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('IPFS integration service already started')
      return
    }

    try {
      this.logger.info('Starting IPFS integration service...')

      // Initialize IPFS client
      this.client = create({
        url: this.config.url,
        timeout: this.config.timeout
      })

      // Test IPFS connection
      await this.testConnection()

      // Load existing data
      await this.loadIPFSData()

      // Start periodic tasks
      this.startPeriodicTasks()

      this.isRunning = true
      this.logger.info('IPFS integration service started')
      this.emit('ipfs:started')

    } catch (error) {
      this.logger.error('Failed to start IPFS integration service', error)
      this.emit('ipfs:error', { error })
      throw error
    }
  }

  // Stop IPFS service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping IPFS integration service...')

    // Save data
    await this.saveIPFSData()

    // Close IPFS client
    if (this.client) {
      await this.client.close()
    }

    this.logger.info('IPFS integration service stopped')
    this.emit('ipfs:stopped')
  }

  // Upload file to IPFS
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options: IPFSUploadOptions = {}
  ): Promise<IPFSFile> {
    if (!this.isRunning) {
      throw new Error('IPFS service is not running')
    }

    const fileId = this.generateFileId()

    try {
      this.logger.debug(`Uploading file to IPFS: ${fileName}`)

      // Validate file
      this.validateFile(buffer, fileName, mimeType)

      // Process file
      let processedBuffer = buffer
      let checksum = this.calculateChecksum(buffer)

      // Encrypt if requested
      if (options.encrypt || this.config.encryptionEnabled) {
        processedBuffer = await this.encryptFile(processedBuffer)
        checksum = this.calculateChecksum(processedBuffer)
      }

      // Compress if requested
      if (options.compress || this.config.compressionEnabled) {
        processedBuffer = await this.compressFile(processedBuffer)
        checksum = this.calculateChecksum(processedBuffer)
      }

      // Upload to IPFS
      const result = await this.uploadToIPFS(processedBuffer, fileName)
      
      // Pin if requested
      if (options.pin || this.config.pinEnabled) {
        await this.pinFile(result.cid)
      }

      // Create file record
      const file: IPFSFile = {
        cid: result.cid.toString(),
        name: fileName,
        size: buffer.length,
        type: mimeType,
        hash: checksum,
        pinned: options.pin || this.config.pinEnabled,
        encrypted: options.encrypt || this.config.encryptionEnabled,
        compressed: options.compress || this.config.compressionEnabled,
        uploadedAt: new Date(),
        uploadedBy: 'system', // This would come from auth context
        metadata: {
          originalName: fileName,
          mimeType,
          encoding: 'binary',
          checksum,
          tags: options.tags || [],
          description: options.description,
          category: options.category,
          customFields: options.customFields || {}
        }
      }

      // Store file
      this.files.set(fileId, file)
      await this.saveFile(file)

      // Update statistics
      this.updateStatistics('upload', file.size)

      this.logger.info(`File uploaded to IPFS: ${fileId}`)
      this.emit('file:uploaded', { file })

      return file

    } catch (error) {
      this.logger.error(`Failed to upload file to IPFS: ${fileName}`, error)
      this.emit('file:upload_error', { error, fileName })
      throw error
    }
  }

  // Download file from IPFS
  async downloadFile(cid: string, options: IPFSDownloadOptions = {}): Promise<Buffer> {
    if (!this.isRunning) {
      throw new Error('IPFS service is not running')
    }

    try {
      this.logger.debug(`Downloading file from IPFS: ${cid}`)

      // Find file record
      const file = Array.from(this.files.values()).find(f => f.cid === cid)
      if (!file) {
        throw new Error(`File not found: ${cid}`)
      }

      // Download from IPFS
      let buffer = await this.downloadFromIPFS(cid)

      // Verify checksum if requested
      if (options.verifyChecksum) {
        const checksum = this.calculateChecksum(buffer)
        if (checksum !== file.hash) {
          throw new Error('Checksum verification failed')
        }
      }

      // Decompress if needed
      if (file.compressed && (options.decompress !== false)) {
        buffer = await this.decompressFile(buffer)
      }

      // Decrypt if needed
      if (file.encrypted && (options.decrypt !== false)) {
        buffer = await this.decryptFile(buffer)
      }

      // Update statistics
      this.updateStatistics('download', buffer.length)

      this.logger.info(`File downloaded from IPFS: ${cid}`)
      this.emit('file:downloaded', { cid, size: buffer.length })

      return buffer

    } catch (error) {
      this.logger.error(`Failed to download file from IPFS: ${cid}`, error)
      this.emit('file:download_error', { error, cid })
      throw error
    }
  }

  // Create directory in IPFS
  async createDirectory(
    name: string,
    files: Array<{ name: string; buffer: Buffer; mimeType: string }>,
    options: IPFSUploadOptions = {}
  ): Promise<IPFSDirectory> {
    if (!this.isRunning) {
      throw new Error('IPFS service is not running')
    }

    const directoryId = this.generateDirectoryId()

    try {
      this.logger.debug(`Creating IPFS directory: ${name}`)

      // Upload files
      const uploadedFiles: IPFSFile[] = []
      for (const fileData of files) {
        const file = await this.uploadFile(
          fileData.buffer,
          fileData.name,
          fileData.mimeType,
          options
        )
        uploadedFiles.push(file)
      }

      // Create directory structure
      const directoryStructure = this.createDirectoryStructure(uploadedFiles)

      // Upload directory to IPFS
      const result = await this.uploadDirectoryToIPFS(directoryStructure, name)

      // Pin directory if requested
      if (options.pin || this.config.pinEnabled) {
        await this.pinFile(result.cid)
      }

      // Create directory record
      const directory: IPFSDirectory = {
        cid: result.cid.toString(),
        name,
        path: `/${name}`,
        size: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
        fileCount: uploadedFiles.length,
        directoryCount: 0,
        pinned: options.pin || this.config.pinEnabled,
        encrypted: options.encrypt || this.config.encryptionEnabled,
        compressed: options.compress || this.config.compressionEnabled,
        createdAt: new Date(),
        createdBy: 'system',
        metadata: {
          description: options.description,
          category: options.category,
          tags: options.tags || [],
          permissions: {
            read: [],
            write: [],
            admin: [],
            public: true
          },
          customFields: options.customFields || {}
        }
      }

      // Store directory
      this.directories.set(directoryId, directory)
      await this.saveDirectory(directory)

      this.logger.info(`IPFS directory created: ${directoryId}`)
      this.emit('directory:created', { directory })

      return directory

    } catch (error) {
      this.logger.error(`Failed to create IPFS directory: ${name}`, error)
      this.emit('directory:error', { error, name })
      throw error
    }
  }

  // Pin file/directory
  async pinContent(cid: string): Promise<void> {
    if (!this.isRunning) {
      throw new Error('IPFS service is not running')
    }

    try {
      this.logger.debug(`Pinning content: ${cid}`)

      await this.pinFile(cid)

      // Update file/directory record
      const file = Array.from(this.files.values()).find(f => f.cid === cid)
      if (file) {
        file.pinned = true
        await this.saveFile(file)
      }

      const directory = Array.from(this.directories.values()).find(d => d.cid === cid)
      if (directory) {
        directory.pinned = true
        await this.saveDirectory(directory)
      }

      this.logger.info(`Content pinned: ${cid}`)
      this.emit('content:pinned', { cid })

    } catch (error) {
      this.logger.error(`Failed to pin content: ${cid}`, error)
      this.emit('content:pin_error', { error, cid })
      throw error
    }
  }

  // Unpin file/directory
  async unpinContent(cid: string): Promise<void> {
    if (!this.isRunning) {
      throw new Error('IPFS service is not running')
    }

    try {
      this.logger.debug(`Unpinning content: ${cid}`)

      await this.unpinFile(cid)

      // Update file/directory record
      const file = Array.from(this.files.values()).find(f => f.cid === cid)
      if (file) {
        file.pinned = false
        await this.saveFile(file)
      }

      const directory = Array.from(this.directories.values()).find(d => d.cid === cid)
      if (directory) {
        directory.pinned = false
        await this.saveDirectory(directory)
      }

      this.logger.info(`Content unpinned: ${cid}`)
      this.emit('content:unpinned', { cid })

    } catch (error) {
      this.logger.error(`Failed to unpin content: ${cid}`, error)
      this.emit('content:unpin_error', { error, cid })
      throw error
    }
  }

  // Delete file/directory
  async deleteContent(cid: string): Promise<void> {
    if (!this.isRunning) {
      throw new Error('IPFS service is not running')
    }

    try {
      this.logger.debug(`Deleting content: ${cid}`)

      // Unpin first
      await this.unpinContent(cid)

      // Remove from storage
      const file = Array.from(this.files.values()).find(f => f.cid === cid)
      if (file) {
        const fileId = Array.from(this.files.entries()).find(([_, f]) => f.cid === cid)?.[0]
        if (fileId) {
          this.files.delete(fileId)
        }
      }

      const directory = Array.from(this.directories.values()).find(d => d.cid === cid)
      if (directory) {
        const directoryId = Array.from(this.directories.entries()).find(([_, d]) => d.cid === cid)?.[0]
        if (directoryId) {
          this.directories.delete(directoryId)
        }
      }

      this.logger.info(`Content deleted: ${cid}`)
      this.emit('content:deleted', { cid })

    } catch (error) {
      this.logger.error(`Failed to delete content: ${cid}`, error)
      this.emit('content:delete_error', { error, cid })
      throw error
    }
  }

  // Batch upload
  async batchUpload(
    files: Array<{ name: string; buffer: Buffer; mimeType: string }>,
    options: IPFSUploadOptions = {}
  ): Promise<IPFSBatchOperation> {
    const operationId = this.generateBatchOperationId()

    const operation: IPFSBatchOperation = {
      id: operationId,
      type: BatchOperationType.UPLOAD,
      files: [],
      status: BatchOperationStatus.PENDING,
      progress: 0,
      startedAt: new Date(),
      metadata: {
        totalFiles: files.length,
        processedFiles: 0,
        failedFiles: 0,
        totalSize: files.reduce((sum, file) => sum + file.buffer.length, 0),
        processedSize: 0
      }
    }

    this.batchOperations.set(operationId, operation)
    this.emit('batch:created', { operation })

    // Process batch asynchronously
    this.processBatchUpload(operationId, files, options)

    return operation
  }

  // Get batch operation status
  getBatchOperation(operationId: string): IPFSBatchOperation | null {
    return this.batchOperations.get(operationId) || null
  }

  // Get file by CID
  getFile(cid: string): IPFSFile | null {
    return Array.from(this.files.values()).find(file => file.cid === cid) || null
  }

  // Get directory by CID
  getDirectory(cid: string): IPFSDirectory | null {
    return Array.from(this.directories.values()).find(directory => directory.cid === cid) || null
  }

  // Get all files
  getAllFiles(): IPFSFile[] {
    return Array.from(this.files.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
  }

  // Get all directories
  getAllDirectories(): IPFSDirectory[] {
    return Array.from(this.directories.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Get IPFS statistics
  getStatistics(): IPFSStatistics {
    return { ...this.statistics }
  }

  // Private methods
  private async testConnection(): Promise<void> {
    try {
      const version = await this.client.version()
      this.logger.info(`IPFS connection established: ${version.version}`)
    } catch (error) {
      throw new Error(`IPFS connection failed: ${error.message}`)
    }
  }

  private validateFile(buffer: Buffer, fileName: string, mimeType: string): void {
    if (buffer.length === 0) {
      throw new Error('File cannot be empty')
    }

    if (buffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit: ${this.maxFileSize} bytes`)
    }

    if (!fileName || fileName.trim().length === 0) {
      throw new Error('File name is required')
    }

    if (!mimeType || mimeType.trim().length === 0) {
      throw new Error('MIME type is required')
    }
  }

  private calculateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex')
  }

  private async encryptFile(buffer: Buffer): Promise<Buffer> {
    // This would implement actual encryption
    // For now, return the buffer as-is
    return buffer
  }

  private async decryptFile(buffer: Buffer): Promise<Buffer> {
    // This would implement actual decryption
    // For now, return the buffer as-is
    return buffer
  }

  private async compressFile(buffer: Buffer): Promise<Buffer> {
    // This would implement actual compression
    // For now, return the buffer as-is
    return buffer
  }

  private async decompressFile(buffer: Buffer): Promise<Buffer> {
    // This would implement actual decompression
    // For now, return the buffer as-is
    return buffer
  }

  private async uploadToIPFS(buffer: Buffer, fileName: string): Promise<{ cid: CID }> {
    const result = await this.client.add(buffer, {
      pin: false, // We'll handle pinning separately
      wrapWithDirectory: false,
      progress: (bytes: number) => {
        this.emit('upload:progress', { fileName, bytes, total: buffer.length })
      }
    })

    return { cid: result.cid }
  }

  private async downloadFromIPFS(cid: string): Promise<Buffer> {
    const chunks = []
    for await (const chunk of this.client.cat(cid)) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  private async pinFile(cid: string): Promise<void> {
    await this.client.pin.add(cid)
  }

  private async unpinFile(cid: string): Promise<void> {
    await this.client.pin.rm(cid)
  }

  private createDirectoryStructure(files: IPFSFile[]): any {
    const structure: any = {}

    for (const file of files) {
      const parts = file.name.split('/')
      let current = structure

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!current[part]) {
          current[part] = {}
        }
        current = current[part]
      }

      current[parts[parts.length - 1]] = {
        cid: file.cid,
        size: file.size,
        type: file.type
      }
    }

    return structure
  }

  private async uploadDirectoryToIPFS(structure: any, name: string): Promise<{ cid: CID }> {
    // This would upload the directory structure to IPFS
    // For now, return a mock CID
    const mockCid = CID.parse('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')
    return { cid: mockCid }
  }

  private async processBatchUpload(
    operationId: string,
    files: Array<{ name: string; buffer: Buffer; mimeType: string }>,
    options: IPFSUploadOptions
  ): Promise<void> {
    const operation = this.batchOperations.get(operationId)
    if (!operation) {
      return
    }

    try {
      operation.status = BatchOperationStatus.RUNNING
      this.emit('batch:started', { operation })

      const uploadedFiles: IPFSFile[] = []

      for (let i = 0; i < files.length; i++) {
        const fileData = files[i]

        try {
          const file = await this.uploadFile(
            fileData.buffer,
            fileData.name,
            fileData.mimeType,
            options
          )

          uploadedFiles.push(file)
          operation.metadata.processedFiles++
          operation.metadata.processedSize += fileData.buffer.length
          operation.progress = (operation.metadata.processedFiles / operation.metadata.totalFiles) * 100

          this.emit('batch:progress', { operation, file, progress: operation.progress })

        } catch (error) {
          operation.metadata.failedFiles++
          this.logger.error(`Batch upload failed for file: ${fileData.name}`, error)
        }
      }

      operation.files = uploadedFiles
      operation.status = operation.metadata.failedFiles === 0 ? 
        BatchOperationStatus.COMPLETED : BatchOperationStatus.FAILED
      operation.completedAt = new Date()

      this.emit('batch:completed', { operation })

    } catch (error) {
      operation.status = BatchOperationStatus.FAILED
      operation.error = error.message
      operation.completedAt = new Date()

      this.emit('batch:failed', { operation, error })
    }
  }

  private updateStatistics(operation: 'upload' | 'download', size: number): void {
    if (operation === 'upload') {
      this.statistics.uploadCount++
      this.statistics.bandwidthUsage.upload += size
    } else {
      this.statistics.downloadCount++
      this.statistics.bandwidthUsage.download += size
    }

    this.statistics.bandwidthUsage.total = 
      this.statistics.bandwidthUsage.upload + this.statistics.bandwidthUsage.download
  }

  private initializeStatistics(): IPFSStatistics {
    return {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      pinnedFiles: 0,
      pinnedDirectories: 0,
      encryptedFiles: 0,
      compressedFiles: 0,
      uploadCount: 0,
      downloadCount: 0,
      bandwidthUsage: {
        upload: 0,
        download: 0,
        total: 0,
        period: {
          start: new Date(),
          end: new Date()
        }
      },
      storageUsage: {
        used: 0,
        available: 0,
        total: 0,
        percentage: 0,
        breakdown: {
          files: 0,
          directories: 0,
          pinned: 0,
          encrypted: 0,
          compressed: 0
        }
      },
      performanceMetrics: {
        averageUploadSpeed: 0,
        averageDownloadSpeed: 0,
        uploadLatency: 0,
        downloadLatency: 0,
        successRate: 100,
        errorRate: 0
      }
    }
  }

  private startPeriodicTasks(): void {
    // Update statistics every hour
    setInterval(() => {
      this.updateStatisticsFromStorage()
    }, 3600000) // Every hour

    // Clean up old batch operations every day
    setInterval(() => {
      this.cleanupOldBatchOperations()
    }, 86400000) // Every day
  }

  private async updateStatisticsFromStorage(): Promise<void> {
    this.statistics.totalFiles = this.files.size
    this.statistics.totalDirectories = this.directories.size
    this.statistics.totalSize = Array.from(this.files.values()).reduce((sum, file) => sum + file.size, 0)
    this.statistics.pinnedFiles = Array.from(this.files.values()).filter(file => file.pinned).length
    this.statistics.pinnedDirectories = Array.from(this.directories.values()).filter(dir => dir.pinned).length
    this.statistics.encryptedFiles = Array.from(this.files.values()).filter(file => file.encrypted).length
    this.statistics.compressedFiles = Array.from(this.files.values()).filter(file => file.compressed).length

    this.logger.debug('IPFS statistics updated')
  }

  private cleanupOldBatchOperations(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

    for (const [id, operation] of this.batchOperations.entries()) {
      if (operation.startedAt < cutoffDate) {
        this.batchOperations.delete(id)
      }
    }

    this.logger.debug('Old batch operations cleaned up')
  }

  // ID generation methods
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateDirectoryId(): string {
    return `directory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateBatchOperationId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Data persistence methods
  private async saveFile(file: IPFSFile): Promise<void> {
    // This would save to your database
    this.logger.debug(`File saved: ${file.cid}`)
  }

  private async saveDirectory(directory: IPFSDirectory): Promise<void> {
    // This would save to your database
    this.logger.debug(`Directory saved: ${directory.cid}`)
  }

  private async loadIPFSData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading IPFS data...')
  }

  private async saveIPFSData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving IPFS data...')
  }

  // Export methods
  exportIPFSData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      files: Array.from(this.files.values()),
      directories: Array.from(this.directories.values()),
      statistics: this.statistics,
      config: this.config
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['cid', 'name', 'size', 'type', 'pinned', 'encrypted', 'compressed', 'uploadedAt']
      const csvRows = [headers.join(',')]
      
      for (const file of this.files.values()) {
        csvRows.push([
          file.cid,
          file.name,
          file.size.toString(),
          file.type,
          file.pinned.toString(),
          file.encrypted.toString(),
          file.compressed.toString(),
          file.uploadedAt.toISOString()
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Health status
  getHealthStatus(): {
    isRunning: boolean
    totalFiles: number
    totalDirectories: number
    totalSize: number
    activeBatchOperations: number
    lastActivity: Date
  } {
    return {
      isRunning: this.isRunning,
      totalFiles: this.files.size,
      totalDirectories: this.directories.size,
      totalSize: Array.from(this.files.values()).reduce((sum, file) => sum + file.size, 0),
      activeBatchOperations: Array.from(this.batchOperations.values())
        .filter(op => op.status === BatchOperationStatus.RUNNING).length,
      lastActivity: new Date()
    }
  }
}

export default IPFSIntegrationService
