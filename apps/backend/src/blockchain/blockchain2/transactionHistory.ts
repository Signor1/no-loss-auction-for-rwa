import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Transaction, TransactionStatus, TransactionPriority } from './transactionMonitor'

// Transaction history entry interface
export interface TransactionHistoryEntry {
  id: string
  transactionId: string
  userId?: string
  chainId: number
  from: string
  to: string
  value: string
  gasLimit: string
  gasPrice: string
  gasUsed: string
  effectiveGasPrice: string
  nonce: number
  data: string
  status: TransactionStatus
  priority: TransactionPriority
  blockNumber?: number
  blockHash?: string
  transactionHash: string
  confirmations: number
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
  failedAt?: Date
  error?: string
  retryCount: number
  maxRetries: number
  replacedBy?: string
  speedupOf?: string
  metadata: any
  auditTrail: AuditEntry[]
}

// Audit entry interface
export interface AuditEntry {
  id: string
  timestamp: Date
  action: string
  actor: string
  details: any
  oldValue?: any
  newValue?: any
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Transaction filter interface
export interface TransactionFilter {
  userId?: string
  chainId?: number
  from?: string
  to?: string
  status?: TransactionStatus
  priority?: TransactionPriority
  fromBlock?: number
  toBlock?: number
  fromTime?: Date
  toTime?: Date
  minValue?: string
  maxValue?: string
  minGasUsed?: string
  maxGasUsed?: string
  error?: string
  searchQuery?: string
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'confirmedAt' | 'value' | 'gasUsed'
  sortOrder?: 'asc' | 'desc'
}

// Transaction statistics interface
export interface TransactionStatistics {
  totalTransactions: number
  totalVolume: string
  averageTransactionValue: string
  totalGasUsed: string
  averageGasUsed: string
  totalGasCost: string
  averageGasPrice: string
  successRate: number
  failureRate: number
  averageConfirmationTime: number
  transactionsByStatus: Record<TransactionStatus, number>
  transactionsByPriority: Record<TransactionPriority, number>
  transactionsByChain: Record<number, number>
  transactionsByHour: Record<string, number>
  transactionsByDay: Record<string, number>
  transactionsByMonth: Record<string, number>
  topUsers: Array<{
    userId: string
    transactionCount: number
    totalVolume: string
    averageValue: string
  }>
  topContracts: Array<{
    address: string
    transactionCount: number
    totalVolume: string
    averageGasUsed: string
  }>
  gasUsageTrends: Array<{
    date: string
    averageGasUsed: string
    maxGasUsed: string
    totalTransactions: number
  }>
  errorDistribution: Record<string, number>
  retryStatistics: {
    totalRetries: number
    averageRetries: number
    maxRetries: number
    retrySuccessRate: number
  }
}

// Transaction history service
export class TransactionHistory extends EventEmitter {
  private history: Map<string, TransactionHistoryEntry> = new Map()
  private auditTrail: Map<string, AuditEntry[]> = new Map()
  private logger: Logger
  private isRecording: boolean = false
  private recordingInterval: number = 60000 // 1 minute
  private maxHistorySize: number = 100000
  private maxAuditTrailSize: number = 1000
  private batchSize: number = 1000

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start history recording
  async start(): Promise<void> {
    if (this.isRecording) {
      this.logger.warn('Transaction history recording already started')
      return
    }

    this.isRecording = true
    this.logger.info('Starting transaction history recording...')

    // Start recording intervals
    this.startRecordingIntervals()

    // Load existing history
    await this.loadHistoryData()

    this.logger.info('Transaction history recording started')
    this.emit('history:started')
  }

  // Stop history recording
  async stop(): Promise<void> {
    if (!this.isRecording) {
      return
    }

    this.isRecording = false
    this.logger.info('Stopping transaction history recording...')

    // Save history data
    await this.saveHistoryData()

    this.logger.info('Transaction history recording stopped')
    this.emit('history:stopped')
  }

  // Record transaction
  async recordTransaction(transaction: Transaction, metadata?: any): Promise<string> {
    const entryId = this.generateEntryId()
    const historyEntry: TransactionHistoryEntry = {
      id: entryId,
      transactionId: transaction.id,
      userId: metadata?.userId,
      chainId: transaction.chainId,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      gasUsed: transaction.gasUsed,
      effectiveGasPrice: transaction.effectiveGasPrice,
      nonce: transaction.nonce,
      data: transaction.data,
      status: transaction.status,
      priority: transaction.priority,
      blockNumber: transaction.blockNumber,
      blockHash: transaction.blockHash,
      transactionHash: transaction.hash,
      confirmations: transaction.confirmations,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      confirmedAt: transaction.confirmedAt,
      failedAt: transaction.status === TransactionStatus.FAILED ? new Date() : undefined,
      error: transaction.error,
      retryCount: transaction.retryCount,
      maxRetries: transaction.maxRetries,
      replacedBy: transaction.metadata?.replacedBy,
      speedupOf: transaction.metadata?.speedupOf,
      metadata,
      auditTrail: []
    }

    this.history.set(entryId, historyEntry)
    await this.saveHistoryEntry(historyEntry)

    this.logger.info(`Transaction recorded: ${entryId} (${transaction.hash})`)
    this.emit('transaction:recorded', { entry: historyEntry })

    return entryId
  }

  // Update transaction status
  async updateTransactionStatus(
    entryId: string,
    status: TransactionStatus,
    updates: Partial<TransactionHistoryEntry> = {},
    actor?: string,
    details?: any
  ): Promise<void> {
    const entry = this.history.get(entryId)
    if (!entry) {
      throw new Error(`History entry not found: ${entryId}`)
    }

    const auditEntry: AuditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      action: `status_update`,
      actor: actor || 'system',
      details: {
        oldStatus: entry.status,
        newStatus: status,
        updates,
        ...details
      }
    }

    entry.status = status
    entry.updatedAt = new Date()
    entry.auditTrail.push(auditEntry)

    // Update specific status fields
    if (status === TransactionStatus.CONFIRMED && !entry.confirmedAt) {
      entry.confirmedAt = new Date()
    } else if (status === TransactionStatus.FAILED && !entry.failedAt) {
      entry.failedAt = new Date()
    }

    // Apply updates
    Object.assign(entry, updates)

    this.history.set(entryId, entry)
    await this.saveHistoryEntry(entry)
    await this.saveAuditEntry(entryId, auditEntry)

    this.logger.info(`Transaction status updated: ${entryId} -> ${status}`)
    this.emit('transaction:updated', { entry, auditEntry })
  }

  // Add audit entry
  async addAuditEntry(
    entryId: string,
    action: string,
    actor: string,
    details: any,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    const entry = this.history.get(entryId)
    if (!entry) {
      throw new Error(`History entry not found: ${entryId}`)
    }

    const auditEntry: AuditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      action,
      actor,
      details,
      ipAddress,
      userAgent,
      sessionId
    }

    entry.auditTrail.push(auditEntry)
    
    // Maintain audit trail size
    if (entry.auditTrail.length > this.maxAuditTrailSize) {
      entry.auditTrail = entry.auditTrail.slice(-this.maxAuditTrailSize)
    }

    this.history.set(entryId, entry)
    await this.saveHistoryEntry(entry)
    await this.saveAuditEntry(entryId, auditEntry)

    this.logger.debug(`Audit entry added: ${entryId} (${action})`)
    this.emit('audit:added', { entryId, auditEntry })
  }

  // Get transaction history
  async getTransactionHistory(filter: TransactionFilter): Promise<{
    entries: TransactionHistoryEntry[]
    total: number
    hasMore: boolean
  }> {
    let entries = Array.from(this.history.values())

    // Apply filters
    entries = this.applyFilters(entries, filter)

    // Sort results
    entries = this.sortEntries(entries, filter.sortBy, filter.sortOrder)

    // Apply pagination
    const total = entries.length
    const offset = filter.offset || 0
    const limit = filter.limit || 100
    const paginatedEntries = entries.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return {
      entries: paginatedEntries,
      total,
      hasMore
    }
  }

  // Get transaction by ID
  getTransactionById(entryId: string): TransactionHistoryEntry | null {
    return this.history.get(entryId) || null
  }

  // Get transactions by user
  async getTransactionsByUser(
    userId: string,
    limit: number = 50
  ): Promise<TransactionHistoryEntry[]> {
    const entries = Array.from(this.history.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)

    return entries
  }

  // Get transactions by hash
  getTransactionsByHash(transactionHash: string): TransactionHistoryEntry[] {
    return Array.from(this.history.values())
      .filter(entry => entry.transactionHash === transactionHash)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Get transactions by address
  async getTransactionsByAddress(
    address: string,
    limit: number = 50
  ): Promise<TransactionHistoryEntry[]> {
    return Array.from(this.history.values())
      .filter(entry => 
        entry.from.toLowerCase() === address.toLowerCase() ||
        entry.to.toLowerCase() === address.toLowerCase()
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Get transactions by status
  getTransactionsByStatus(status: TransactionStatus, limit: number = 50): TransactionHistoryEntry[] {
    return Array.from(this.history.values())
      .filter(entry => entry.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Get transactions by time range
  async getTransactionsByTimeRange(
    fromTime: Date,
    toTime: Date,
    limit: number = 100
  ): Promise<TransactionHistoryEntry[]> {
    return Array.from(this.history.values())
      .filter(entry => entry.createdAt >= fromTime && entry.createdAt <= toTime)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Get transactions by value range
  async getTransactionsByValueRange(
    minValue: string,
    maxValue: string,
    limit: number = 50
  ): Promise<TransactionHistoryEntry[]> {
    return Array.from(this.history.values())
      .filter(entry => {
        const value = parseFloat(entry.value)
        return value >= parseFloat(minValue) && value <= parseFloat(maxValue)
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Get transactions by gas usage range
  async getTransactionsByGasUsageRange(
    minGasUsed: string,
    maxGasUsed: string,
    limit: number = 50
  ): Promise<TransactionHistoryEntry[]> {
    return Array.from(this.history.values())
      .filter(entry => {
        const gasUsed = parseInt(entry.gasUsed || '0')
        return gasUsed >= parseInt(minGasUsed) && gasUsed <= parseInt(maxGasUsed)
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Search transactions
  async searchTransactions(
    searchQuery: string,
    limit: number = 50
  ): Promise<TransactionHistoryEntry[]> {
    const query = searchQuery.toLowerCase()
    return Array.from(this.history.values())
      .filter(entry => 
        entry.transactionHash.toLowerCase().includes(query) ||
        entry.from.toLowerCase().includes(query) ||
        entry.to.toLowerCase().includes(query) ||
        entry.data.toLowerCase().includes(query) ||
        (entry.metadata && JSON.stringify(entry.metadata).toLowerCase().includes(query))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Apply filters
  private applyFilters(entries: TransactionHistoryEntry[], filter: TransactionFilter): TransactionHistoryEntry[] {
    return entries.filter(entry => {
      // User filter
      if (filter.userId && entry.userId !== filter.userId) return false

      // Chain filter
      if (filter.chainId && entry.chainId !== filter.chainId) return false

      // Address filters
      if (filter.from && entry.from.toLowerCase() !== filter.from.toLowerCase()) return false
      if (filter.to && entry.to.toLowerCase() !== filter.to.toLowerCase()) return false

      // Status filter
      if (filter.status && entry.status !== filter.status) return false

      // Priority filter
      if (filter.priority && entry.priority !== filter.priority) return false

      // Block range filter
      if (filter.fromBlock && entry.blockNumber && entry.blockNumber < filter.fromBlock) return false
      if (filter.toBlock && entry.blockNumber && entry.blockNumber > filter.toBlock) return false

      // Time range filter
      if (filter.fromTime && entry.createdAt < filter.fromTime) return false
      if (filter.toTime && entry.createdAt > filter.toTime) return false

      // Value range filter
      if (filter.minValue && parseFloat(entry.value) < parseFloat(filter.minValue)) return false
      if (filter.maxValue && parseFloat(entry.value) > parseFloat(filter.maxValue)) return false

      // Gas usage range filter
      if (filter.minGasUsed && parseInt(entry.gasUsed || '0') < parseInt(filter.minGasUsed)) return false
      if (filter.maxGasUsed && parseInt(entry.gasUsed || '0') > parseInt(filter.maxGasUsed)) return false

      // Error filter
      if (filter.error && !entry.error?.toLowerCase().includes(filter.error.toLowerCase())) return false

      // Search query filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        const searchableText = `${entry.transactionHash} ${entry.from} ${entry.to} ${entry.data} ${JSON.stringify(entry.metadata)}`.toLowerCase()
        if (!searchableText.includes(query)) return false
      }

      return true
    })
  }

  // Sort entries
  private sortEntries(
    entries: TransactionHistoryEntry[],
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): TransactionHistoryEntry[] {
    return entries.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'updatedAt':
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
        case 'confirmedAt':
          aValue = a.confirmedAt?.getTime() || 0
          bValue = b.confirmedAt?.getTime() || 0
          break
        case 'value':
          aValue = parseFloat(a.value)
          bValue = parseFloat(b.value)
          break
        case 'gasUsed':
          aValue = parseInt(a.gasUsed || '0')
          bValue = parseInt(b.gasUsed || '0')
          break
        default:
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })
  }

  // Get transaction statistics
  async getTransactionStatistics(timeRange?: {
    from?: Date
    to?: Date
    userId?: string
    chainId?: number
  }): Promise<TransactionStatistics> {
    let entries = Array.from(this.history.values())

    // Apply time range filter
    if (timeRange) {
      entries = entries.filter(entry => 
        entry.createdAt >= (timeRange.from || new Date(0)) &&
        entry.createdAt <= (timeRange.to || new Date())
      )
    }

    // Apply user filter
    if (userId) {
      entries = entries.filter(entry => entry.userId === userId)
    }

    // Apply chain filter
    if (chainId) {
      entries = entries.filter(entry => entry.chainId === chainId)
    }

    const totalTransactions = entries.length
    const totalVolume = entries.reduce((sum, entry) => sum + parseFloat(entry.value || '0'), 0)
    const averageTransactionValue = totalVolume > 0 ? (totalVolume / totalTransactions).toFixed(2) : '0'

    const totalGasUsed = entries.reduce((sum, entry) => sum + parseInt(entry.gasUsed || '0'), 0)
    const averageGasUsed = totalGasUsed > 0 ? (totalGasUsed / totalTransactions).toString() : '0'

    const totalGasCost = entries
      .filter(entry => entry.gasUsed && entry.effectiveGasPrice)
      .reduce((sum, entry) => sum + (parseInt(entry.gasUsed || '0') * parseFloat(entry.effectiveGasPrice || '0')), 0)
      .toString()

    const averageGasPrice = entries
      .filter(entry => entry.effectiveGasPrice)
      .reduce((sum, entry) => sum + parseFloat(entry.effectiveGasPrice || '0'), 0) / entries.length
      .toFixed(2)

    const confirmedTransactions = entries.filter(entry => entry.status === TransactionStatus.CONFIRMED)
    const failedTransactions = entries.filter(entry => entry.status === TransactionStatus.FAILED)

    const successRate = totalTransactions > 0 ? (confirmedTransactions.length / totalTransactions) * 100 : 0
    const failureRate = totalTransactions > 0 ? (failedTransactions.length / totalTransactions) * 100 : 0

    const averageConfirmationTime = confirmedTransactions.length > 0
      ? confirmedTransactions.reduce((sum, entry) => sum + (entry.confirmedAt!.getTime() - entry.createdAt.getTime()), 0) / confirmedTransactions.length
      : 0

    // Group by status
    const transactionsByStatus: Record<TransactionStatus, number> = {}
    for (const status of Object.values(TransactionStatus)) {
      transactionsByStatus[status] = entries.filter(entry => entry.status === status).length
    }

    // Group by priority
    const transactionsByPriority: Record<TransactionPriority, number> = {}
    for (const priority of Object.values(TransactionPriority)) {
      transactionsByPriority[priority] = entries.filter(entry => entry.priority === priority).length
    }

    // Group by chain
    const transactionsByChain: Record<number, number> = {}
    for (const entry of entries) {
      transactionsByChain[entry.chainId] = (transactionsByChain[entry.chainId] || 0) + 1
    }

    // Group by hour
    const transactionsByHour: Record<string, number> = {}
    for (const entry of entries) {
      const hour = entry.createdAt.toISOString().substring(0, 13)
      transactionsByHour[hour] = (transactionsByHour[hour] || 0) + 1
    }

    // Group by day
    const transactionsByDay: Record<string, number> = {}
    for (const entry of entries) {
      const day = entry.createdAt.toISOString().substring(0, 10)
      transactionsByDay[day] = (transactionsByDay[day] || 0) + 1
    }

    // Group by month
    const transactionsByMonth: Record<string, number> = {}
    for (const entry of entries) {
      const month = entry.createdAt.toISOString().substring(0, 7)
      transactionsByMonth[month] = (transactionsByMonth[month] || 0) + 1
    }

    // Top users
    const userStats = new Map<string, { count: number; volume: string; value: string }>()
    for (const entry of entries) {
      if (entry.userId) {
        const stats = userStats.get(entry.userId) || { count: 0, volume: '0', value: '0' }
        stats.count++
        stats.volume = (parseFloat(stats.volume) + parseFloat(entry.value || '0')).toString()
        stats.value = (parseFloat(stats.value) + parseFloat(entry.value || '0')) / stats.count
        userStats.set(entry.userId, stats)
      }
    }

    const topUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        transactionCount: stats.count,
        totalVolume: stats.volume,
        averageValue: stats.value
      }))
      .sort((a, b) => b.totalVolume.localeCompare(a.totalVolume))
      .slice(0, 10)

    // Top contracts
    const contractStats = new Map<string, { count: number; volume: string; gasUsed: string }>()
    for (const entry of entries) {
      const contract = entry.to
      const stats = contractStats.get(contract) || { count: 0, volume: '0', gasUsed: '0' }
      stats.count++
      stats.volume = (parseFloat(stats.volume) + parseFloat(entry.value || '0')).toString()
      stats.gasUsed = (parseInt(stats.gasUsed) + parseInt(entry.gasUsed || '0')).toString()
      contractStats.set(contract, stats)
    }

    const topContracts = Array.from(contractStats.entries())
      .map(([address, stats]) => ({
        address,
        transactionCount: stats.count,
        totalVolume: stats.volume,
        averageGasUsed: stats.gasUsed
      }))
      .sort((a, b) => b.totalVolume.localeCompare(a.totalVolume))
      .slice(0, 10)

    // Gas usage trends
    const gasUsageTrends = this.calculateGasUsageTrends(entries)

    // Error distribution
    const errorDistribution: Record<string, number> = {}
    for (const entry of entries) {
      if (entry.error) {
        const error = entry.error.toLowerCase()
        errorDistribution[error] = (errorDistribution[error] || 0) + 1
      }
    }

    // Retry statistics
    const retryStatistics = this.calculateRetryStatistics(entries)

    return {
      totalTransactions,
      totalVolume,
      averageTransactionValue,
      totalGasUsed,
      averageGasUsed,
      totalGasCost,
      averageGasPrice,
      successRate,
      failureRate,
      averageConfirmationTime,
      transactionsByStatus,
      transactionsByPriority,
      transactionsByChain,
      transactionsByHour,
      transactionsByDay,
      transactionsByMonth,
      topUsers,
      topContracts,
      gasUsageTrends,
      errorDistribution,
      retryStatistics
    }
  }

  // Calculate gas usage trends
  private calculateGasUsageTrends(entries: TransactionHistoryEntry[]): Array<{
    date: string
    averageGasUsed: string
    maxGasUsed: string
    totalTransactions: number
  }> {
    const dailyStats = new Map<string, { total: number; sum: number; max: number }>()

    for (const entry of entries) {
      const date = entry.createdAt.toISOString().substring(0, 10)
      const stats = dailyStats.get(date) || { total: 0, sum: 0, max: 0 }
      stats.total++
      stats.sum += parseInt(entry.gasUsed || '0')
      stats.max = Math.max(stats.max, parseInt(entry.gasUsed || '0'))
      dailyStats.set(date, stats)
    }

    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        averageGasUsed: stats.total > 0 ? (stats.sum / stats.total).toString() : '0',
        maxGasUsed: stats.max.toString(),
        totalTransactions: stats.total
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // Calculate retry statistics
  private calculateRetryStatistics(entries: TransactionHistoryEntry[]): {
    totalRetries: number
    averageRetries: number
    maxRetries: number
    retrySuccessRate: number
  } {
    const retriedTransactions = entries.filter(entry => entry.retryCount > 0)
      const totalRetries = retriedTransactions.reduce((sum, entry) => sum + entry.retryCount, 0)
      const averageRetries = totalRetries > 0 ? totalRetries / retriedTransactions.length : 0
      const maxRetries = retriedTransactions.length > 0 ? Math.max(...retriedTransactions.map(entry => entry.retryCount)) : 0

    const successfulRetries = retriedTransactions.filter(entry => entry.status === TransactionStatus.CONFIRMED).length
      const retrySuccessRate = totalRetries > 0 ? (successfulRetries / retriedTransactions.length) * 100 : 0

    return {
      totalRetries,
      averageRetries,
      maxRetries,
      retrySuccessRate
    }
  }

  // Start recording intervals
  private startRecordingIntervals(): void {
    // Clean old history every hour
    setInterval(() => {
      this.cleanupOldHistory()
    }, 3600000) // Every hour

    // Update statistics every minute
    setInterval(() => {
      this.updateStatistics()
    }, 60000) // Every minute

    // Archive old data every day
    setInterval(() => {
      this.archiveOldData()
    }, 86400000) // Every day
  }

    this.logger.info('Recording intervals started')
  }

  // Clean old history
  private async cleanupOldHistory(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    let cleanedCount = 0

    for (const [entryId, entry] of this.history.entries()) {
      if (entry.createdAt < cutoff) {
        this.history.delete(entryId)
        cleanedCount++
      }
    }

    // Also clean audit trail
    for (const [entryId, entry] of this.history.entries()) {
      if (entry.auditTrail) {
        entry.auditTrail = entry.auditTrail.filter(audit => audit.timestamp >= cutoff)
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old history entries`)
    }
  }

  // Archive old data
  private async archiveOldData(): Promise<void> {
    // This would archive old data to cold storage
    this.logger.info('Archiving old transaction history data')
  }

  // Update statistics
  private async updateStatistics(): Promise<void> {
    // This would update statistics in cache or database
    this.logger.debug('Transaction statistics updated')
  }

  // Save history entry
  private async saveHistoryEntry(entry: TransactionHistoryEntry): Promise<void> {
    // This would save to your database
    this.logger.debug(`History entry saved: ${entry.id}`)
  }

  // Save audit entry
  private async saveAuditEntry(entryId: string, auditEntry: AuditEntry): Promise<void> {
    // This would save to your database
    this.logger.debug(`Audit entry saved: ${auditEntry.id}`)
  }

  // Save history data
  private async saveHistoryData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving transaction history data...')
  }

  // Load history data
  private async loadHistoryData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading transaction history data...')
  }

  // Generate entry ID
  private generateEntryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate audit ID
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Export history data
  exportHistoryData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      history: Array.from(this.history.values()),
      statistics: this.getTransactionStatistics()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'transactionId', 'userId', 'chainId', 'from', 'to', 'value', 'gasLimit', 'gasPrice', 'gasUsed', 'status', 'priority', 'createdAt', 'updatedAt', 'confirmedAt', 'failedAt', 'error', 'retryCount']
      const csvRows = [headers.join(',')]
      
      for (const entry of this.history.values()) {
        csvRows.push([
          entry.id,
          entry.transactionId,
          entry.userId || '',
          entry.chainId.toString(),
          entry.from,
          entry.to,
          entry.value,
          entry.gasLimit,
          entry.gasPrice,
          entry.gasUsed,
          entry.status,
          entry.priority.toString(),
          entry.createdAt.toISOString(),
          entry.updatedAt.toISOString(),
          entry.confirmedAt?.toISOString() || '',
          entry.failedAt?.toISOString() || '',
          entry.error || '',
          entry.retryCount.toString()
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isRecording: boolean
    totalEntries: number
    totalAuditEntries: number
    lastActivity: Date
    metrics: any
  } {
    return {
      isRecording: this.isRecording,
      totalEntries: this.history.size,
      totalAuditEntries: Array.from(this.history.values()).reduce((sum, entry) => sum + entry.auditTrail.length, 0),
      lastActivity: this.history.size > 0 ? 
        Math.max(...Array.from(this.history.values()).map(entry => entry.updatedAt.getTime())) : 
        new Date(),
      metrics: this.getTransactionStatistics()
    }
  }
}

export default TransactionHistory
