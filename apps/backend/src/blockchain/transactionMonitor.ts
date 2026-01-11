import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { Logger } from '../utils/logger'

// Transaction status enum
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REPLACED = 'replaced',
  SPEEDUP = 'speedup'
}

// Transaction priority enum
export enum TransactionPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

// Transaction interface
export interface Transaction {
  id: string
  hash: string
  from: string
  to: string
  value: string
  gasLimit: string
  gasPrice: string
  nonce: number
  data: string
  chainId: number
  status: TransactionStatus
  priority: TransactionPriority
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
  confirmations: number
  gasUsed?: string
  effectiveGasPrice?: string
  blockNumber?: number
  blockHash?: string
  error?: string
  retryCount: number
  maxRetries: number
  metadata: any
}

// Transaction queue interface
export interface TransactionQueue {
  id: string
  transactions: Transaction[]
  priority: TransactionPriority
  maxGasLimit: number
  maxGasPrice: string
  createdAt: Date
  processedAt?: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

// Gas price info interface
export interface GasPriceInfo {
  chainId: number
  gasPrice: string
  baseFee: string
  priorityFee: string
  maxFeePerGas: string
  estimatedConfirmationTime: number
  timestamp: Date
}

// Transaction monitoring service
export class TransactionMonitor extends EventEmitter {
  private transactions: Map<string, Transaction> = new Map()
  private transactionQueues: Map<string, TransactionQueue> = new Map()
  private gasPriceCache: Map<number, GasPriceInfo[]> = new Map()
  private confirmationMonitors: Map<string, NodeJS.Timeout> = new Map()
  private retryTimers: Map<string, NodeJS.Timeout> = new Map()
  private logger: Logger
  private isMonitoring: boolean = false
  private monitoringInterval: number = 5000 // 5 seconds
  private maxRetries: number = 3
  private confirmationThreshold: number = 12
  private gasPriceRefreshInterval: number = 30000 // 30 seconds

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start transaction monitoring
  async start(): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('Transaction monitor already started')
      return
    }

    this.isMonitoring = true
    this.logger.info('Starting transaction monitoring...')

    // Start monitoring intervals
    this.startMonitoringIntervals()

    // Load existing transactions from storage
    await this.loadPendingTransactions()

    // Start gas price monitoring
    this.startGasPriceMonitoring()

    this.logger.info('Transaction monitoring started')
    this.emit('monitoring:started')
  }

  // Stop transaction monitoring
  async stop(): Promise<void> {
    if (!this.isMonitoring) {
      return
    }

    this.isMonitoring = false
    this.logger.info('Stopping transaction monitoring...')

    // Clear all timers
    this.clearAllTimers()

    // Save pending transactions to storage
    await this.savePendingTransactions()

    this.logger.info('Transaction monitoring stopped')
    this.emit('monitoring:stopped')
  }

  // Add transaction to monitor
  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateTransactionId()
    const fullTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: TransactionStatus.PENDING,
      confirmations: 0,
      retryCount: 0,
      maxRetries: this.maxRetries
    }

    this.transactions.set(id, fullTransaction)
    await this.saveTransaction(fullTransaction)

    // Start monitoring
    this.startTransactionMonitoring(id)

    this.logger.info(`Transaction added: ${id} (${transaction.hash})`)
    this.emit('transaction:added', { transaction: fullTransaction })

    return id
  }

  // Update transaction status
  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    updates: Partial<Transaction> = {}
  ): Promise<void> {
    const transaction = this.transactions.get(id)
    if (!transaction) {
      this.logger.warn(`Transaction not found: ${id}`)
      return
    }

    const updatedTransaction = {
      ...transaction,
      ...updates,
      status,
      updatedAt: new Date()
    }

    this.transactions.set(id, updatedTransaction)
    await this.saveTransaction(updatedTransaction)

    // Handle status-specific logic
    if (status === TransactionStatus.CONFIRMED) {
      this.handleTransactionConfirmed(id, updatedTransaction)
    } else if (status === TransactionStatus.FAILED) {
      this.handleTransactionFailed(id, updatedTransaction)
    } else if (status === TransactionStatus.CANCELLED) {
      this.handleTransactionCancelled(id, updatedTransaction)
    }

    this.logger.info(`Transaction status updated: ${id} -> ${status}`)
    this.emit('transaction:updated', { transaction: updatedTransaction })
  }

  // Handle transaction confirmation
  private async handleTransactionConfirmed(id: string, transaction: Transaction): Promise<void> {
    transaction.confirmedAt = new Date()
    transaction.confirmations = this.confirmationThreshold

    // Clear confirmation monitor
    this.clearConfirmationMonitor(id)

    // Update related transactions
    await this.updateRelatedTransactions(id)

    // Emit confirmation event
    this.emit('transaction:confirmed', { transaction })
    this.logger.info(`Transaction confirmed: ${id} (${transaction.hash})`)
  }

  // Handle transaction failure
  private async handleTransactionFailed(id: string, transaction: Transaction): Promise<void> {
    // Check if we should retry
    if (transaction.retryCount < transaction.maxRetries) {
      await this.scheduleRetry(id, transaction)
    } else {
      // Mark as failed permanently
      transaction.status = TransactionStatus.FAILED
      await this.saveTransaction(transaction)
      this.emit('transaction:failed', { transaction })
      this.logger.error(`Transaction failed permanently: ${id} (${transaction.hash})`)
    }
  }

  // Handle transaction cancellation
  private async handleTransactionCancelled(id: string, transaction: Transaction): Promise<void> {
    // Clear all timers for this transaction
    this.clearConfirmationMonitor(id)
    this.clearRetryTimer(id)

    transaction.status = TransactionStatus.CANCELLED
    await this.saveTransaction(transaction)
    this.emit('transaction:cancelled', { transaction })
    this.logger.info(`Transaction cancelled: ${id} (${transaction.hash})`)
  }

  // Start transaction monitoring
  private startTransactionMonitoring(id: string): void {
    // Start confirmation monitoring
    this.startConfirmationMonitor(id)

    // Start timeout for pending transactions
    this.startPendingTimeout(id)
  }

  // Start confirmation monitor
  private startConfirmationMonitor(id: string): void {
    const transaction = this.transactions.get(id)
    if (!transaction) return

    // Clear existing monitor
    this.clearConfirmationMonitor(id)

    // Set up confirmation monitoring
    const monitor = setInterval(async () => {
      const currentTransaction = this.transactions.get(id)
      if (!currentTransaction || currentTransaction.status !== TransactionStatus.PENDING) {
        this.clearConfirmationMonitor(id)
        return
      }

      // Check confirmations
      const currentBlock = await this.getCurrentBlock(currentTransaction.chainId)
      const transactionBlock = parseInt(currentTransaction.blockNumber || '0', 16)
      
      if (currentBlock >= transactionBlock) {
        currentTransaction.confirmations = currentBlock - transactionBlock + 1
        
        if (currentTransaction.confirmations >= this.confirmationThreshold) {
          await this.updateTransactionStatus(id, TransactionStatus.CONFIRMED)
        }
      }
    }, this.monitoringInterval)

    this.confirmationMonitors.set(id, monitor)
  }

  // Start pending timeout
  private startPendingTimeout(id: string): void {
    const transaction = this.transactions.get(id)
    if (!transaction) return

    // Clear existing timeout
    this.clearRetryTimer(id)

    // Set timeout for pending transactions (e.g., 5 minutes)
    const timeout = setTimeout(async () => {
      const currentTransaction = this.transactions.get(id)
      if (currentTransaction && currentTransaction.status === TransactionStatus.PENDING) {
        await this.updateTransactionStatus(id, TransactionStatus.FAILED, {
          error: 'Transaction timed out'
        })
      }
    }, 5 * 60 * 1000) // 5 minutes

    this.retryTimers.set(id, timeout)
  }

  // Schedule transaction retry
  private async scheduleRetry(id: string, transaction: Transaction): Promise<void> {
    transaction.retryCount++
    await this.saveTransaction(transaction)

    // Exponential backoff
    const delay = Math.pow(2, transaction.retryCount) * 1000

    const retryTimer = setTimeout(async () => {
      // Re-submit transaction
      await this.resubmitTransaction(id, transaction)
    }, delay)

    this.retryTimers.set(id, retryTimer)
    this.logger.info(`Transaction retry scheduled: ${id} (attempt ${transaction.retryCount})`)
  }

  // Resubmit transaction
  private async resubmitTransaction(id: string, transaction: Transaction): Promise<void> {
    try {
      // Update status to pending
      transaction.status = TransactionStatus.PENDING
      await this.saveTransaction(transaction)

      // Reset confirmation monitoring
      this.startTransactionMonitoring(id)

      // Emit retry event
      this.emit('transaction:retry', { transaction })
      this.logger.info(`Transaction resubmitted: ${id} (attempt ${transaction.retryCount})`)
    } catch (error) {
      this.logger.error(`Failed to resubmit transaction ${id}:`, error)
      await this.updateTransactionStatus(id, TransactionStatus.FAILED, { error: error.message })
    }
  }

  // Get current block number
  private async getCurrentBlock(chainId: number): Promise<number> {
    // This would use your blockchain provider
    // For now, return a mock value
    return 0
  }

  // Clear confirmation monitor
  private clearConfirmationMonitor(id: string): void {
    const monitor = this.confirmationMonitors.get(id)
    if (monitor) {
      clearInterval(monitor)
      this.confirmationMonitors.delete(id)
    }
  }

  // Clear retry timer
  private clearRetryTimer(id: string): void {
    const timer = this.retryTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.retryTimers.delete(id)
    }
  }

  // Clear all timers
  private clearAllTimers(): void {
    for (const monitor of this.confirmationMonitors.values()) {
      clearInterval(monitor)
    }
    this.confirmationMonitors.clear()

    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer)
    }
    this.retryTimers.clear()
  }

  // Start monitoring intervals
  private startMonitoringIntervals(): void {
    // Gas price monitoring
    setInterval(() => {
      this.updateGasPrices()
    }, this.gasPriceRefreshInterval)

    // Cleanup old transactions
    setInterval(() => {
      this.cleanupOldTransactions()
    }, 60000) // Every minute

    // Performance monitoring
    setInterval(() => {
      this.logPerformanceMetrics()
    }, 60000) // Every minute
  }

  // Update gas prices
  private async updateGasPrices(): Promise<void> {
    try {
      // This would fetch current gas prices from your provider
      // For now, use mock data
      const chains = [1, 137, 56] // Ethereum, Polygon, BSC
      
      for (const chainId of chains) {
        const gasPriceInfo: GasPriceInfo = {
          chainId,
          gasPrice: '20000000000',
          baseFee: '1000000000',
          priorityFee: '1000000000',
          maxFeePerGas: '20000000000',
          estimatedConfirmationTime: 120,
          timestamp: new Date()
        }

        if (!this.gasPriceCache.has(chainId)) {
          this.gasPriceCache.set(chainId, [])
        }

        const cache = this.gasPriceCache.get(chainId)!
        cache.unshift(gasPriceInfo)
        
        // Keep only last 100 entries
        if (cache.length > 100) {
          cache.splice(100)
        }
      }
    } catch (error) {
      this.logger.error('Failed to update gas prices:', error)
    }
  }

  // Start gas price monitoring
  private startGasPriceMonitoring(): void {
    this.updateGasPrices()
    this.logger.info('Gas price monitoring started')
  }

  // Get gas prices
  getGasPrices(chainId?: number): GasPriceInfo[] {
    if (chainId) {
      return this.gasPriceCache.get(chainId) || []
    }
    
    const allPrices: GasPriceInfo[] = []
    for (const prices of this.gasPriceCache.values()) {
      allPrices.push(...prices)
    }
    
    return allPrices
  }

  // Get optimal gas price
  getOptimalGasPrice(chainId: number, priority: TransactionPriority = TransactionPriority.NORMAL): string {
    const prices = this.getGasPrices(chainId)
    if (prices.length === 0) return '20000000000'

    // Select gas price based on priority
    switch (priority) {
      case TransactionPriority.URGENT:
        return prices[0]?.maxFeePerGas || prices[0].gasPrice
      case TransactionPriority.HIGH:
        return prices[0]?.priorityFee || prices[0].gasPrice
      case TransactionPriority.LOW:
        return prices[prices.length - 1]?.gasPrice || prices[0].gasPrice
      default:
        return prices[0]?.gasPrice || '20000000000'
    }
  }

  // Add transaction to queue
  async addToQueue(
    queueId: string,
    transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[],
    priority: TransactionPriority = TransactionPriority.NORMAL,
    maxGasLimit: number = 8000000,
    maxGasPrice?: string
  ): Promise<void> {
    const queue: TransactionQueue = {
      id: queueId,
      transactions: transactions.map(tx => ({
        ...tx,
        id: this.generateTransactionId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TransactionStatus.PENDING,
        confirmations: 0,
        retryCount: 0,
        maxRetries: this.maxRetries
      })),
      priority,
      maxGasLimit,
      maxGasPrice: maxGasPrice || this.getOptimalGasPrice(1, priority),
      createdAt: new Date(),
      status: 'pending'
    }

    this.transactionQueues.set(queueId, queue)
    await this.saveTransactionQueue(queue)

    // Start processing queue
    this.processQueue(queueId)

    this.logger.info(`Transaction queue created: ${queueId} with ${transactions.length} transactions`)
    this.emit('queue:created', { queue })
  }

  // Process transaction queue
  private async processQueue(queueId: string): Promise<void> {
    const queue = this.transactionQueues.get(queueId)
    if (!queue || queue.status !== 'pending') return

    queue.status = 'processing'
    await this.saveTransactionQueue(queue)

    try {
      // Sort transactions by priority
      const sortedTransactions = [...queue.transactions].sort((a, b) => b.priority - a.priority)

      // Process transactions in batches
      const batchSize = 10
      for (let i = 0; i < sortedTransactions.length; i += batchSize) {
        const batch = sortedTransactions.slice(i, i + batchSize)
        await this.processTransactionBatch(batch)
      }

      queue.status = 'completed'
      queue.processedAt = new Date()
      await this.saveTransactionQueue(queue)

      this.logger.info(`Transaction queue processed: ${queueId}`)
      this.emit('queue:completed', { queue })
    } catch (error) {
      queue.status = 'failed'
      await this.saveTransactionQueue(queue)
      this.logger.error(`Failed to process queue ${queueId}:`, error)
      this.emit('queue:failed', { queue, error })
    }
  }

  // Process transaction batch
  private async processTransactionBatch(transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      try {
        // Submit transaction to blockchain
        const hash = await this.submitTransaction(transaction)
        
        // Update transaction with hash
        await this.updateTransactionStatus(transaction.id, TransactionStatus.PENDING, { hash })
        
        // Start monitoring
        this.startTransactionMonitoring(transaction.id)
        
      } catch (error) {
        await this.updateTransactionStatus(transaction.id, TransactionStatus.FAILED, { error: error.message })
      }
    }
  }

  // Submit transaction to blockchain
  private async submitTransaction(transaction: Transaction): Promise<string> {
    // This would submit the transaction to your blockchain provider
    // For now, return a mock hash
    const hash = `0x${Math.random().toString(16).padStart(64, '0')}`
    
    this.logger.info(`Transaction submitted: ${transaction.id} -> ${hash}`)
    return hash
  }

  // Save transaction
  private async saveTransaction(transaction: Transaction): Promise<void> {
    // This would save to your database
    // For now, just log
    this.logger.debug(`Transaction saved: ${transaction.id}`)
  }

  // Save transaction queue
  private async saveTransactionQueue(queue: TransactionQueue): Promise<void> {
    // This would save to your database
    // For now, just log
    this.logger.debug(`Transaction queue saved: ${queue.id}`)
  }

  // Load pending transactions
  private async loadPendingTransactions(): Promise<void> {
    // This would load from your database
    // For now, just log
    this.logger.info('Loading pending transactions...')
  }

  // Save pending transactions
  private async savePendingTransactions(): Promise<void> {
    // This would save to your database
    // For now, just log
    this.logger.info('Saving pending transactions...')
  }

  // Cleanup old transactions
  private async cleanupOldTransactions(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    let cleanedCount = 0

    for (const [id, transaction] of this.transactions.entries()) {
      if (transaction.createdAt < cutoff && 
          (transaction.status === TransactionStatus.CONFIRMED || 
           transaction.status === TransactionStatus.FAILED)) {
        this.transactions.delete(id)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old transactions`)
    }
  }

  // Log performance metrics
  private logPerformanceMetrics(): void {
    const pendingCount = Array.from(this.transactions.values())
      .filter(tx => tx.status === TransactionStatus.PENDING).length
    const confirmedCount = Array.from(this.transactions.values())
      .filter(tx => tx.status === TransactionStatus.CONFIRMED).length
    const failedCount = Array.from(this.transactions.values())
      .filter(tx => tx.status === TransactionStatus.FAILED).length

    const metrics = {
      totalTransactions: this.transactions.size,
      pendingTransactions: pendingCount,
      confirmedTransactions: confirmedCount,
      failedTransactions: failedCount,
      activeQueues: this.transactionQueues.size,
      gasPriceCacheSize: Array.from(this.gasPriceCache.values())
        .reduce((sum, prices) => sum + prices.length, 0),
      timestamp: new Date()
    }

    this.logger.debug('Performance metrics:', metrics)
    this.emit('metrics:updated', metrics)
  }

  // Get transaction by ID
  getTransaction(id: string): Transaction | null {
    return this.transactions.get(id) || null
  }

  // Get transactions by status
  getTransactionsByStatus(status: TransactionStatus): Transaction[] {
    return Array.from(this.transactions.values()).filter(tx => tx.status === status)
  }

  // Get transactions by address
  getTransactionsByAddress(address: string, limit: number = 50): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.from.toLowerCase() === address.toLowerCase())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
  }

  // Get transaction statistics
  getTransactionStatistics(): {
    totalTransactions: number
    pendingTransactions: number
    confirmedTransactions: number
    failedTransactions: number
    averageConfirmationTime: number
    successRate: number
    totalGasUsed: string
    averageGasPrice: string
  } {
    const transactions = Array.from(this.transactions.values())
    
    const total = transactions.length
    const pending = transactions.filter(tx => tx.status === TransactionStatus.PENDING).length
    const confirmed = transactions.filter(tx => tx.status === TransactionStatus.CONFIRMED).length
    const failed = transactions.filter(tx => tx.status === TransactionStatus.FAILED).length

    const successRate = total > 0 ? (confirmed / total) * 100 : 0

    // Calculate average confirmation time
    const confirmedTransactions = transactions.filter(tx => tx.status === TransactionStatus.CONFIRMED && tx.confirmedAt)
    const avgConfirmationTime = confirmedTransactions.length > 0
      ? confirmedTransactions.reduce((sum, tx) => sum + (tx.confirmedAt!.getTime() - tx.createdAt.getTime()), 0) / confirmedTransactions.length
      : 0

    // Calculate gas metrics
    const gasUsedTransactions = transactions.filter(tx => tx.gasUsed)
    const totalGasUsed = gasUsedTransactions.reduce((sum, tx) => sum + parseInt(tx.gasUsed || '0'), 0)
    const averageGasPrice = gasUsedTransactions.length > 0
      ? gasUsedTransactions.reduce((sum, tx) => sum + parseInt(tx.effectiveGasPrice || '0'), 0) / gasUsedTransactions.length
      : '0'

    return {
      totalTransactions: total,
      pendingTransactions: pending,
      confirmedTransactions: confirmed,
      failedTransactions: failed,
      averageConfirmationTime,
      successRate,
      totalGasUsed: totalGasUsed.toString(),
      averageGasPrice
    }
  }

  // Get queue statistics
  getQueueStatistics(): {
    totalQueues: number
    pendingQueues: number
    processingQueues: number
    completedQueues: number
    failedQueues: number
    totalQueuedTransactions: number
  } {
    const queues = Array.from(this.transactionQueues.values())
    
    const total = queues.length
    const pending = queues.filter(q => q.status === 'pending').length
    const processing = queues.filter(q => q.status === 'processing').length
    const completed = queues.filter(q => q.status === 'completed').length
    const failed = queues.filter(q => q.status === 'failed').length

    const totalQueued = queues.reduce((sum, q) => sum + q.transactions.length, 0)

    return {
      totalQueues: total,
      pendingQueues: pending,
      processingQueues: processing,
      completedQueues: completed,
      failedQueues: failed,
      totalQueuedTransactions: totalQueued
    }
  }

  // Generate transaction ID
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get health status
  getHealthStatus(): {
    isMonitoring: boolean
    uptime: number
    transactionCount: number
    queueCount: number
    lastActivity: Date
    metrics: any
  } {
    return {
      isMonitoring: this.isMonitoring,
      uptime: process.uptime(),
      transactionCount: this.transactions.size,
      queueCount: this.transactionQueues.size,
      lastActivity: new Date(),
      metrics: this.getTransactionStatistics()
    }
  }

  // Export transaction data
  exportTransactions(format: 'json' | 'csv' = 'json'): string {
    const transactions = Array.from(this.transactions.values())
    
    if (format === 'json') {
      return JSON.stringify(transactions, null, 2)
    } else if (format === 'csv') {
      const headers = ['id', 'hash', 'from', 'to', 'value', 'status', 'createdAt', 'confirmedAt']
      const csvRows = [headers.join(',')]
      
      for (const tx of transactions) {
        const row = [
          tx.id,
          tx.hash,
          tx.from,
          tx.to,
          tx.value,
          tx.status,
          tx.createdAt.toISOString(),
          tx.confirmedAt?.toISOString() || ''
        ]
        csvRows.push(row.join(','))
      }
      
      return csvRows.join('\n')
    }
    
    return ''
  }
}

export default TransactionMonitor
