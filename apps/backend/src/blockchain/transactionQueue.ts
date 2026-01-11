import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Transaction, TransactionStatus, TransactionPriority } from './transactionMonitor'

// Queue status enum
export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

// Queue configuration interface
export interface QueueConfig {
  id: string
  name: string
  description: string
  maxTransactions: number
  maxGasLimit: number
  maxGasPrice: string
  priority: TransactionPriority
  autoProcess: boolean
  processInterval: number
  retryAttempts: number
  batchProcessing: boolean
  notifications: {
    email: boolean
    webhook: boolean
    push: boolean
  }
  rateLimiting: {
    transactionsPerSecond: number
    gasPriceUpdates: number
  }
}

// Queue statistics interface
export interface QueueStatistics {
  id: string
  name: string
  status: QueueStatus
  totalTransactions: number
  pendingTransactions: number
  processingTransactions: number
  completedTransactions: number
  failedTransactions: number
  averageProcessingTime: number
  successRate: number
  totalGasUsed: string
  averageGasPrice: string
  totalCost: string
  lastProcessedAt: Date
  createdAt: Date
  updatedAt: Date
}

// Transaction queue manager
export class TransactionQueueManager extends EventEmitter {
  private queues: Map<string, QueueConfig> = new Map()
  private queueTransactions: Map<string, Transaction[]> = new Map()
  private queueStatistics: Map<string, QueueStatistics> = new Map()
  private processingTimers: Map<string, NodeJS.Timeout> = new Map()
  private logger: Logger
  private isProcessing: boolean = false
  private processingInterval: number = 5000 // 5 seconds
  private maxBatchSize: number = 10
  private retryDelay: number = 5000 // 5 seconds
  private maxQueueSize: number = 1000

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Create transaction queue
  async createQueue(config: QueueConfig): Promise<void> {
    if (this.queues.has(config.id)) {
      throw new Error(`Queue with ID ${config.id} already exists`)
    }

    this.queues.set(config.id, config)
    this.queueTransactions.set(config.id, [])
    this.queueStatistics.set(config.id, {
      id: config.id,
      name: config.name,
      status: QueueStatus.PENDING,
      totalTransactions: 0,
      pendingTransactions: 0,
      processingTransactions: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      averageProcessingTime: 0,
      successRate: 0,
      totalGasUsed: '0',
      averageGasPrice: '0',
      totalCost: '0',
      lastProcessedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await this.saveQueueConfig(config)
    this.startQueueProcessing(config.id)

    this.logger.info(`Transaction queue created: ${config.id} (${config.name})`)
    this.emit('queue:created', { queue: config })
  }

  // Add transaction to queue
  async addTransaction(
    queueId: string,
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const queue = this.queues.get(queueId)
    if (!queue) {
      throw new Error(`Queue not found: ${queueId}`)
    }

    const config = this.queues.get(queueId)
    const currentTransactions = this.queueTransactions.get(queueId) || []

    // Check queue limits
    if (currentTransactions.length >= config.maxTransactions) {
      throw new Error(`Queue ${queueId} is full`)
    }

    // Add transaction to queue
    const fullTransaction: Transaction = {
      ...transaction,
      id: this.generateTransactionId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: TransactionStatus.PENDING,
      retryCount: 0,
      maxRetries: config.retryAttempts
    }

    currentTransactions.push(fullTransaction)
    this.queueTransactions.set(queueId, currentTransactions)

    // Update statistics
    this.updateQueueStatistics(queueId)

    // Start processing if auto-process is enabled
    if (config.autoProcess && queue.status === QueueStatus.PENDING) {
      this.startQueueProcessing(queueId)
    }

    this.logger.info(`Transaction added to queue ${queueId}: ${fullTransaction.id}`)
    this.emit('transaction:queued', { queueId, transaction: fullTransaction })
  }

  // Start queue processing
  async startQueueProcessing(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId)
    if (!queue || queue.status === QueueStatus.PROCESSING) {
      return
    }

    queue.status = QueueStatus.PROCESSING
    await this.saveQueueConfig(queue)
    await this.saveQueueStatistics(queueId)

    // Clear existing timer
    this.clearProcessingTimer(queueId)

    // Set up processing timer
    const timer = setInterval(async () => {
      await this.processQueue(queueId)
    }, this.processingInterval)

    this.processingTimers.set(queueId, timer)

    this.logger.info(`Queue processing started: ${queueId}`)
    this.emit('queue:processing', { queueId })
  }

  // Process queue
  private async processQueue(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId)
    const transactions = this.queueTransactions.get(queueId) || []
    const config = this.queues.get(queueId)

    if (transactions.length === 0) {
      queue.status = QueueStatus.PENDING
      await this.saveQueueConfig(queue)
      await this.saveQueueStatistics(queueId)
      return
    }

    queue.status = QueueStatus.PROCESSING

    try {
      // Sort transactions by priority
      const sortedTransactions = this.sortTransactionsByPriority(transactions)

      // Process in batches
      const batchSize = Math.min(this.maxBatchSize, sortedTransactions.length)
      const batch = sortedTransactions.slice(0, batchSize)

      await this.processTransactionBatch(batch, queueId, config)

      // Remove processed transactions from queue
      const remainingTransactions = sortedTransactions.slice(batchSize)
      this.queueTransactions.set(queueId, remainingTransactions)

      // Update queue status
      if (remainingTransactions.length === 0) {
        queue.status = QueueStatus.COMPLETED
        queue.completedAt = new Date()
      } else {
        queue.status = QueueStatus.PENDING
      }

      await this.saveQueueConfig(queue)
      await this.saveQueueStatistics(queueId)

      this.logger.info(`Processed ${batch.length} transactions from queue ${queueId}`)
      this.emit('queue:processed', { queueId, batch })

      // Continue processing if there are more transactions
      if (remainingTransactions.length > 0 && config.autoProcess) {
        setTimeout(() => {
          this.processQueue(queueId)
        }, this.retryDelay)
      }
    } catch (error) {
      this.logger.error(`Error processing queue ${queueId}:`, error)
      
      queue.status = QueueStatus.FAILED
      await this.saveQueueConfig(queue)
      await this.saveQueueStatistics(queueId)
      
      this.emit('queue:error', { queueId, error })
    }
  }

  // Process transaction batch
  private async processTransactionBatch(
    transactions: Transaction[],
    queueId: string,
    config: QueueConfig
  ): Promise<void> {
    const startTime = Date.now()
    let successCount = 0
    let failureCount = 0
    let totalGasUsed = 0

    for (const transaction of transactions) {
      try {
        // Submit transaction
        const result = await this.submitTransaction(transaction, config)
        
        if (result.success) {
          successCount++
          totalGasUsed += result.gasUsed || 0
          transaction.status = TransactionStatus.CONFIRMED
          transaction.confirmedAt = result.confirmedAt
          transaction.gasUsed = result.gasUsed
          transaction.effectiveGasPrice = result.effectiveGasPrice
        } else {
          failureCount++
          transaction.status = TransactionStatus.FAILED
          transaction.error = result.error
        }

        transaction.updatedAt = new Date()
      } catch (error) {
        this.logger.error(`Failed to process transaction ${transaction.id}:`, error)
        transaction.status = TransactionStatus.FAILED
        transaction.error = error.message
        transaction.updatedAt = new Date()
        failureCount++
      }
    }

    const processingTime = Date.now() - startTime
    await this.saveQueueStatistics(queueId)

    this.logger.info(`Batch processed: ${transactions.length} transactions in ${processingTime}ms`)
    this.emit('batch:processed', { queueId, transactions, successCount, failureCount, totalGasUsed, processingTime })
  }

  // Submit transaction
  private async submitTransaction(
    transaction: Transaction,
    config: QueueConfig
  ): Promise<{
    success: boolean
    gasUsed?: string
    confirmedAt?: Date
    effectiveGasPrice?: string
    error?: string
  }> {
    try {
      // This would submit the transaction to your blockchain provider
      // For now, simulate submission
      const gasUsed = Math.floor(Math.random() * 50000 + 21000).toString()
      const confirmedAt = new Date(Date.now() + Math.random() * 60000)
      const effectiveGasPrice = config.maxGasPrice

      this.logger.info(`Transaction submitted: ${transaction.id} with gas limit ${transaction.gasLimit}`)

      return {
        success: true,
        gasUsed,
        confirmedAt,
        effectiveGasPrice
      }
    } catch (error) {
      this.logger.error(`Failed to submit transaction ${transaction.id}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Sort transactions by priority
  private sortTransactionsByPriority(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) => {
      // Higher priority number comes first
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      // If same priority, sort by creation time (FIFO)
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }

  // Update queue statistics
  private async updateQueueStatistics(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId)
    const transactions = this.queueTransactions.get(queueId) || []
    const config = this.queues.get(queueId)

    const stats = this.calculateQueueStatistics(queue, transactions, config)
    this.queueStatistics.set(queueId, stats)
    await this.saveQueueStatistics(queueId)
  }

  // Calculate queue statistics
  private calculateQueueStatistics(
    queue: QueueConfig,
    transactions: Transaction[],
    config: QueueConfig
  ): QueueStatistics {
    const total = transactions.length
    const pending = transactions.filter(tx => tx.status === TransactionStatus.PENDING).length
    const processing = transactions.filter(tx => tx.status === TransactionStatus.PROCESSING).length
    const completed = transactions.filter(tx => tx.status === TransactionStatus.CONFIRMED).length
    const failed = transactions.filter(tx => tx.status === TransactionStatus.FAILED).length

    const successRate = total > 0 ? (completed / total) * 100 : 0

    // Calculate processing time
    const completedTransactions = transactions.filter(tx => tx.status === TransactionStatus.CONFIRMED && tx.confirmedAt)
    const processingTimes = completedTransactions.map(tx => tx.confirmedAt!.getTime() - tx.createdAt.getTime())
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    // Calculate gas metrics
    const gasUsedTransactions = transactions.filter(tx => tx.gasUsed)
    const totalGasUsed = gasUsedTransactions.reduce((sum, tx) => sum + parseInt(tx.gasUsed || '0'), 0)

    const gasPriceTransactions = transactions.filter(tx => tx.effectiveGasPrice)
    const averageGasPrice = gasPriceTransactions.length > 0
      ? gasPriceTransactions.reduce((sum, tx) => sum + parseFloat(tx.effectiveGasPrice || '0'), 0) / gasPriceTransactions.length
      : '0'

    const totalCost = transactions
      .filter(tx => tx.gasUsed && tx.effectiveGasPrice)
      .reduce((sum, tx) => sum + (parseFloat(tx.gasUsed || '0') * parseFloat(tx.effectiveGasPrice || '0')), 0)
      .toString()

    return {
      id: queue.id,
      name: queue.name,
      status: queue.status,
      totalTransactions: total,
      pendingTransactions: pending,
      processingTransactions: processing,
      completedTransactions: completed,
      failedTransactions: failed,
      averageProcessingTime,
      successRate,
      totalGasUsed: totalGasUsed.toString(),
      averageGasPrice,
      totalCost,
      lastProcessedAt: transactions.length > 0 ? 
        Math.max(...transactions.map(tx => tx.updatedAt.getTime())) : new Date(),
      createdAt: queue.createdAt,
      updatedAt: new Date()
    }
  }

  // Pause queue
  async pauseQueue(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId)
    if (!queue) {
      throw new Error(`Queue not found: ${queueId}`)
    }

    if (queue.status === QueueStatus.PROCESSING) {
      queue.status = QueueStatus.PAUSED
      await this.saveQueueConfig(queue)
      this.clearProcessingTimer(queueId)
    }

    this.logger.info(`Queue paused: ${queueId}`)
    this.emit('queue:paused', { queueId })
  }

  // Resume queue
  async resumeQueue(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId)
    if (!queue) {
      throw new Error(`Queue not found: ${queueId}`)
    }

    if (queue.status === QueueStatus.PAUSED) {
      queue.status = QueueStatus.PENDING
      await this.saveQueue(queue)
      this.startQueueProcessing(queueId)
    }

    this.logger.info(`Queue resumed: ${queueId}`)
    this.emit('queue:resumed', { queueId })
  }

  // Clear queue
  async clearQueue(queueId: string): Promise<void> {
    const queue = this.queues.get(queueId)
    if (!queue) {
      throw new Error(`Queue not found: ${queueId}`)
    }

    this.clearProcessingTimer(queueId)
    this.queueTransactions.delete(queueId)
    this.queueStatistics.delete(queueId)
    this.queues.delete(queueId)

    await this.saveQueueConfig(queue)
    await this.saveQueueStatistics(queueId)

    this.logger.info(`Queue cleared: ${queueId}`)
    this.emit('queue:cleared', { queueId })
  }

  // Get queue by ID
  getQueue(queueId: string): QueueConfig | null {
    return this.queues.get(queueId) || null
  }

  // Get all queues
  getAllQueues(): QueueConfig[] {
    return Array.from(this.queues.values())
  }

  // Get queue transactions
  getQueueTransactions(queueId: string): Transaction[] {
    return this.queueTransactions.get(queueId) || []
  }

  // Get queue statistics
  getQueueStatistics(queueId: string): QueueStatistics | null {
    return this.queueStatistics.get(queueId) || null
  }

  // Update queue configuration
  async updateQueueConfig(queueId: string, updates: Partial<QueueConfig>): Promise<void> {
    const queue = this.queues.get(queueId)
    if (!queue) {
      throw new Error(`Queue not found: ${queueId}`)
    }

    const updatedQueue = { ...queue, ...updates }
    this.queues.set(queueId, updatedQueue)
    await this.saveQueueConfig(updatedQueue)

    this.logger.info(`Queue configuration updated: ${queueId}`)
    this.emit('queue:updated', { queueId, config: updatedQueue })
  }

  // Save queue configuration
  private async saveQueueConfig(queue: QueueConfig): Promise<void> {
    // This would save to your database
    this.logger.debug(`Queue configuration saved: ${queue.id}`)
  }

  // Save queue statistics
  private async saveQueueStatistics(queueId: string): Promise<void> {
    // This would save to your database
    this.logger.debug(`Queue statistics saved: ${queueId}`)
  }

  // Start all queue processing
  async startAllQueueProcessing(): Promise<void> {
    for (const [queueId, queue] of this.queues.entries()) {
      if (queue.autoProcess && queue.status === QueueStatus.PENDING) {
        this.startQueueProcessing(queueId)
      }
    }
  }

  // Stop all queue processing
  async stopAllQueueProcessing(): Promise<void> {
    for (const [queueId, queue] of this.queues.entries()) {
      if (queue.status === QueueStatus.PROCESSING) {
        queue.status = QueueStatus.PENDING
        await this.saveQueueConfig(queue)
        this.clearProcessingTimer(queueId)
      }
    }
  }

  // Clear all processing timers
  private clearProcessingTimer(queueId: string): void {
    const timer = this.processingTimers.get(queueId)
    if (timer) {
      clearInterval(timer)
      this.processingTimers.delete(queueId)
    }
  }

  // Clear all processing timers
  private clearAllProcessingTimers(): void {
    for (const timer of this.processingTimers.values()) {
      clearInterval(timer)
    }
    this.processingTimers.clear()
  }

  // Start processing intervals
  private startProcessingIntervals(): void {
    // Process queues every 5 seconds
    setInterval(() => {
      this.processAllQueueProcessing()
    }, this.processingInterval)

    // Update statistics every minute
    setInterval(() => {
      this.updateAllQueueStatistics()
    }, 60000)

    // Clean up old queues
    setInterval(() => {
      this.cleanupOldQueues()
    }, 300000) // Every 5 minutes
  }

  // Clean up old queues
  private async cleanupOldQueues(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    let cleanedCount = 0

    for (const [queueId, queue] of this.queues.entries()) {
      const transactions = this.queueTransactions.get(queueId) || []
      const filteredTransactions = transactions.filter(tx => tx.createdAt < cutoff)
      
      if (filteredTransactions.length < transactions.length) {
        this.queueTransactions.set(queueId, filteredTransactions)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old transactions from queues`)
    }
  }

  // Update all queue statistics
  private async updateAllQueueStatistics(): Promise<void> {
    for (const [queueId, queue] of this.queues.entries()) {
      await this.updateQueueStatistics(queueId)
    }
  }

  // Generate transaction ID
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get all statistics
  getAllStatistics(): {
    totalQueues: number
    totalTransactions: number
    totalPendingTransactions: number
    totalProcessingTransactions: number
    totalCompletedTransactions: number
    totalFailedTransactions: number
    averageProcessingTime: number
    overallSuccessRate: number
    totalGasUsed: string
    averageGasPrice: string
    totalCost: string
  } {
    const queues = Array.from(this.queues.values())
    const allTransactions = Array.from(this.queueTransactions.values()).flat()

    const total = allTransactions.length
    const pending = allTransactions.filter(tx => tx.status === TransactionStatus.PENDING).length
    const processing = allTransactions.filter(tx => tx.status === TransactionStatus.PROCESSING).length
    const completed = allTransactions.filter(tx => tx.status === TransactionStatus.CONFIRMED).length
    const failed = allTransactions.filter(tx => tx.status === TransactionStatus.FAILED).length

    const successRate = total > 0 ? (completed / total) * 100 : 0

    // Calculate average processing time
    const completedTransactions = allTransactions.filter(tx => tx.status === TransactionStatus.CONFIRMED && tx.confirmedAt)
    const processingTimes = completedTransactions.map(tx => tx.confirmedAt!.getTime() - tx.createdAt.getTime())
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0

    // Calculate gas metrics
    const gasUsedTransactions = allTransactions.filter(tx => tx.gasUsed)
    const totalGasUsed = gasUsedTransactions.reduce((sum, tx) => sum + parseInt(tx.gasUsed || '0'), 0)
    const gasPriceTransactions = allTransactions.filter(tx => tx.effectiveGasPrice)
    const averageGasPrice = gasPriceTransactions.length > 0
      ? gasPriceTransactions.reduce((sum, tx) => sum + parseFloat(tx.effectiveGasPrice || '0'), 0) / gasPriceTransactions.length
      : '0'

    const totalCost = transactions
      .filter(tx => tx.gasUsed && tx.effectiveGasPrice)
      .reduce((sum, tx) => sum + (parseFloat(tx.gasUsed || '0') * parseFloat(tx.effectiveGasPrice || '0')), 0)
      .toString()

    return {
      totalQueues: queues.length,
      totalTransactions,
      totalPendingTransactions: pending,
      totalProcessingTransactions: processing,
      totalCompletedTransactions: completed,
      totalFailedTransactions: failed,
      averageProcessingTime,
      overallSuccessRate: successRate,
      totalGasUsed: totalGasUsed.toString(),
      averageGasPrice,
      totalCost
    }
  }

  // Export queue data
  exportQueueData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      queues: Array.from(this.queues.values()),
      transactions: Array.from(this.queueTransactions.values()).flat(),
      statistics: this.getAllStatistics()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['queueId', 'name', 'status', 'totalTransactions', 'pendingTransactions', 'processingTransactions', 'completedTransactions', 'failedTransactions', 'averageProcessingTime', 'successRate', 'totalGasUsed', 'averageGasPrice', 'totalCost']
      const csvRows = [headers.join(',')]
      
      for (const queue of Array.from(this.queues.values())) {
        const transactions = this.queueTransactions.get(queue.id) || []
        for (const transaction of transactions) {
          csvRows.push([
            queue.id,
            queue.name,
            transaction.id,
            transaction.hash,
            transaction.status,
            transaction.createdAt,
            transaction.updatedAt
          ])
        }
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isProcessing: boolean
    totalQueues: number
    totalTransactions: number
    activeQueues: number
    lastActivity: Date
    metrics: any
  } {
    return {
      isProcessing: this.isProcessing,
      totalQueues: this.queues.size,
      totalTransactions: Array.from(this.queueTransactions.values()).flat().length,
      activeQueues: Array.from(this.queues.values()).filter(q => q.status === QueueStatus.PROCESSING).length,
      lastActivity: new Date(),
      metrics: this.getAllStatistics()
    }
  }
}

export default TransactionQueueManager
