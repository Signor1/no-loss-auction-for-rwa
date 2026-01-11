import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { ContractReader } from './contractReader'
import { TransactionBuilder } from './transactionBuilder'
import { GasEstimator } from './gasEstimator'
import { MultiSig } from './multiSig'
import { BatchOperations } from './batchOperations'

// Contract interaction type enum
export enum InteractionType {
  READ = 'read',
  WRITE = 'write',
  BATCH = 'batch',
  MULTISIG = 'multisig',
  ESTIMATE = 'estimate'
}

// Contract interaction interface
export interface ContractInteraction {
  id: string
  type: InteractionType
  contractAddress: string
  chainId: number
  functionName?: string
  parameters?: any[]
  value?: string
  from?: string
  gasLimit?: string
  gasPrice?: string
  data?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  result?: any
  error?: string
  createdAt: Date
  processedAt?: Date
  completedAt?: Date
  executionTime?: number
  gasUsed?: string
  transactionHash?: string
  blockNumber?: number
  metadata: any
}

// Interaction analytics interface
export interface InteractionAnalytics {
  totalInteractions: number
  successfulInteractions: number
  failedInteractions: number
  averageExecutionTime: number
  totalGasUsed: string
  averageGasUsed: string
  totalCost: string
  averageCost: string
  interactionsByType: Record<InteractionType, number>
  interactionsByContract: Record<string, number>
  interactionsByChain: Record<number, number>
  topContracts: Array<{
    address: string
    interactions: number
    totalGasUsed: string
    averageGasUsed: string
    totalCost: string
    averageCost: string
  }>
  timeSeriesData: Array<{
    timestamp: Date
    interactions: number
    gasUsed: string
    cost: string
  }>
}

// Contract interaction service
export class ContractInteraction extends EventEmitter {
  private contractReader: ContractReader
  private transactionBuilder: TransactionBuilder
  private gasEstimator: GasEstimator
  private multiSig: MultiSig
  private batchOperations: BatchOperations
  private interactions: Map<string, ContractInteraction> = new Map()
  private analytics: InteractionAnalytics
  private logger: Logger
  private isInteracting: boolean = false
  private interactionTimeout: number = 300000 // 5 minutes
  private maxInteractions: number = 10000

  constructor(
    contractReader: ContractReader,
    transactionBuilder: TransactionBuilder,
    gasEstimator: GasEstimator,
    multiSig: MultiSig,
    batchOperations: BatchOperations,
    logger: Logger
  ) {
    super()
    this.contractReader = contractReader
    this.transactionBuilder = transactionBuilder
    this.gasEstimator = gasEstimator
    this.multiSig = multiSig
    this.batchOperations = batchOperations
    this.logger = logger
    this.initializeAnalytics()
  }

  // Start contract interaction service
  async start(): Promise<void> {
    if (this.isInteracting) {
      this.logger.warn('Contract interaction service already started')
      return
    }

    this.isInteracting = true
    this.logger.info('Starting contract interaction service...')

    // Start cleanup intervals
    this.startCleanupIntervals()

    // Load existing interactions
    await this.loadInteractionData()

    this.logger.info('Contract interaction service started')
    this.emit('interaction:started')
  }

  // Stop contract interaction service
  async stop(): Promise<void> {
    if (!this.isInteracting) {
      return
    }

    this.isInteracting = false
    this.logger.info('Stopping contract interaction service...')

    // Save interaction data
    await this.saveInteractionData()

    this.logger.info('Contract interaction service stopped')
    this.emit('interaction:stopped')
  }

  // Read contract state
  async readContract(options: {
    contractAddress: string
    chainId: number
    functionName: string
    parameters: any[]
    cacheKey?: string
    cacheTimeout?: number
  }): Promise<ContractInteraction> {
    const interactionId = this.generateInteractionId()
    const startTime = Date.now()

    try {
      this.logger.debug(`Reading contract: ${options.contractAddress} ${options.functionName}`)

      const readResult = await this.contractReader.readContractState(
        options.contractAddress,
        options.chainId,
        options.functionName,
        options.parameters,
        {
          cacheKey: options.cacheKey,
          cacheTimeout: options.cacheTimeout
        }
      )

      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.READ,
        contractAddress: options.contractAddress,
        chainId: options.chainId,
        functionName: options.functionName,
        parameters: options.parameters,
        status: 'completed',
        result: readResult.data,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: readResult.executionTime,
        metadata: {
          cacheHit: readResult.cached,
          gasUsed: readResult.gasUsed
        }
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.info(`Contract read completed: ${interactionId}`)
      this.emit('interaction:completed', { interaction })

      return interaction

    } catch (error) {
      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.READ,
        contractAddress: options.contractAddress,
        chainId: options.chainId,
        functionName: options.functionName,
        parameters: options.parameters,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.error(`Contract read failed: ${interactionId}`, error)
      this.emit('interaction:error', { interaction, error })

      return interaction
    }
  }

  // Write to contract
  async writeContract(options: {
    from: string
    contractAddress: string
    chainId: number
    functionName: string
    parameters: any[]
    value?: string
    gasLimit?: string
    gasPrice?: string
    privateKey?: string
    strategy?: any
  }): Promise<ContractInteraction> {
    const interactionId = this.generateInteractionId()
    const startTime = Date.now()

    try {
      this.logger.debug(`Writing to contract: ${options.contractAddress} ${options.functionName}`)

      // Build transaction
      const builtTransaction = await this.transactionBuilder.buildContractTransaction({
        from: options.from,
        contractAddress: options.contractAddress,
        functionName: options.functionName,
        parameters: options.parameters,
        value: options.value,
        chainId: options.chainId,
        gasLimit: options.gasLimit,
        gasPrice: options.gasPrice
      })

      let transactionHash: string | undefined

      // Sign and submit if private key provided
      if (options.privateKey) {
        const signedTransaction = await this.transactionBuilder.signTransaction(builtTransaction, options.privateKey)
        transactionHash = signedTransaction.signature
        // Submit transaction (mock)
        transactionHash = await this.submitTransaction(signedTransaction)
      }

      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.WRITE,
        contractAddress: options.contractAddress,
        chainId: options.chainId,
        functionName: options.functionName,
        parameters: options.parameters,
        from: options.from,
        value: options.value,
        gasLimit: builtTransaction.gasLimit,
        gasPrice: builtTransaction.gasPrice,
        data: builtTransaction.data,
        status: 'completed',
        result: {
          transaction: builtTransaction,
          transactionHash
        },
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime,
        gasUsed: builtTransaction.estimatedGas,
        transactionHash
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.info(`Contract write completed: ${interactionId}`)
      this.emit('interaction:completed', { interaction })

      return interaction

    } catch (error) {
      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.WRITE,
        contractAddress: options.contractAddress,
        chainId: options.chainId,
        functionName: options.functionName,
        parameters: options.parameters,
        from: options.from,
        value: options.value,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.error(`Contract write failed: ${interactionId}`, error)
      this.emit('interaction:error', { interaction, error })

      return interaction
    }
  }

  // Batch contract operations
  async batchContractOperations(options: {
    operations: Array<{
      contractAddress: string
      functionName: string
      parameters: any[]
      value?: string
    }>
    from: string
    chainId: number
    gasOptimization?: boolean
    maxGasLimit?: string
    privateKey?: string
  }): Promise<ContractInteraction> {
    const interactionId = this.generateInteractionId()
    const startTime = Date.now()

    try {
      this.logger.debug(`Batching contract operations: ${options.operations.length} operations`)

      // Create batch operations
      const batchOperations = options.operations.map(op => ({
        id: this.generateOperationId(),
        type: BatchType.CONTRACT_CALL as any,
        from: options.from,
        to: op.contractAddress,
        value: op.value,
        data: '0x', // Will be encoded by batch service
        metadata: {
          functionName: op.functionName,
          parameters: op.parameters
        }
      }))

      // Create batch
      const batch = await this.batchOperations.createBatch(batchOperations, {
        gasOptimization: options.gasOptimization,
        maxGasLimit: options.maxGasLimit
      })

      // Process batch
      const processedBatch = await this.batchOperations.processBatch(batch.id)

      let transactionHash: string | undefined

      // Sign and submit if private key provided
      if (options.privateKey) {
        // This would sign the batch transaction
        transactionHash = `0x${Math.random().toString(16).padStart(64, '0')}`
      }

      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.BATCH,
        contractAddress: '', // Multiple contracts in batch
        chainId: options.chainId,
        status: processedBatch.status,
        result: {
          batch: processedBatch,
          transactionHash
        },
        createdAt: new Date(),
        processedAt: processedBatch.processedAt,
        completedAt: processedBatch.completedAt,
        executionTime: Date.now() - startTime,
        gasUsed: processedBatch.totalGasLimit,
        transactionHash
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.info(`Batch contract operations completed: ${interactionId}`)
      this.emit('interaction:completed', { interaction })

      return interaction

    } catch (error) {
      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.BATCH,
        contractAddress: '',
        chainId: options.chainId,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.error(`Batch contract operations failed: ${interactionId}`, error)
      this.emit('interaction:error', { interaction, error })

      return interaction
    }
  }

  // Multi-signature operation
  async multiSigOperation(options: {
    walletId: string
    to: string
    value?: string
    data?: string
    operationType: 'create' | 'sign' | 'execute'
    signerAddress?: string
    privateKey?: string
    functionName?: string
    parameters?: any[]
  }): Promise<ContractInteraction> {
    const interactionId = this.generateInteractionId()
    const startTime = Date.now()

    try {
      this.logger.debug(`Multi-sig operation: ${options.operationType} for wallet ${options.walletId}`)

      let result: any
      let transactionHash: string | undefined

      switch (options.operationType) {
        case 'create':
          const transaction = await this.multiSig.createTransaction({
            walletId: options.walletId,
            to: options.to,
            value: options.value,
            data: options.data
          })
          result = { transaction }
          break

        case 'sign':
          const signedTransaction = await this.multiSig.signTransaction(
            transaction.id, // This would be the actual transaction ID
            options.signerAddress!,
            options.privateKey!
          )
          result = { signedTransaction }
          break

        case 'execute':
          const executedTransaction = await this.multiSig.executeTransaction(
            transaction.id, // This would be the actual transaction ID
            options.privateKey!
          )
          result = { executedTransaction }
          transactionHash = executedTransaction.signature
          break

        default:
          throw new Error(`Invalid multi-sig operation: ${options.operationType}`)
      }

      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.MULTISIG,
        contractAddress: options.to,
        chainId: 1, // Should be passed in options
        functionName: options.functionName,
        parameters: options.parameters,
        from: '', // Multi-sig wallet address
        value: options.value,
        data: options.data,
        status: 'completed',
        result,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime,
        transactionHash
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.info(`Multi-sig operation completed: ${interactionId}`)
      this.emit('interaction:completed', { interaction })

      return interaction

    } catch (error) {
      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.MULTISIG,
        contractAddress: options.to,
        chainId: 1,
        functionName: options.functionName,
        parameters: options.parameters,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.error(`Multi-sig operation failed: ${interactionId}`, error)
      this.emit('interaction:error', { interaction, error })

      return interaction
    }
  }

  // Estimate gas
  async estimateGas(options: {
    contractAddress: string
    functionName: string
    parameters: any[]
    value?: string
    chainId: number
    strategy?: any
  }): Promise<ContractInteraction> {
    const interactionId = this.generateInteractionId()
    const startTime = Date.now()

    try {
      this.logger.debug(`Estimating gas: ${options.contractAddress} ${options.functionName}`)

      const estimation = await this.gasEstimator.estimateContractCallGas({
        contractAddress: options.contractAddress,
        functionName: options.functionName,
        parameters: options.parameters,
        value: options.value,
        chainId: options.chainId,
        strategy: options.strategy
      })

      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.ESTIMATE,
        contractAddress: options.contractAddress,
        chainId: options.chainId,
        functionName: options.functionName,
        parameters: options.parameters,
        value: options.value,
        status: 'completed',
        result: estimation,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime,
        gasUsed: estimation.gasLimit
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.info(`Gas estimation completed: ${interactionId}`)
      this.emit('interaction:completed', { interaction })

      return interaction

    } catch (error) {
      const interaction: ContractInteraction = {
        id: interactionId,
        type: InteractionType.ESTIMATE,
        contractAddress: options.contractAddress,
        chainId: options.chainId,
        functionName: options.functionName,
        parameters: options.parameters,
        value: options.value,
        status: 'failed',
        error: error.message,
        createdAt: new Date(),
        processedAt: new Date(),
        completedAt: new Date(),
        executionTime: Date.now() - startTime
      }

      this.interactions.set(interactionId, interaction)
      await this.saveInteraction(interaction)
      this.updateAnalytics(interaction)

      this.logger.error(`Gas estimation failed: ${interactionId}`, error)
      this.emit('interaction:error', { interaction, error })

      return interaction
    }
  }

  // Submit transaction (mock)
  private async submitTransaction(transaction: any): Promise<string> {
    // This would submit the transaction to the blockchain
    const hash = `0x${Math.random().toString(16).padStart(64, '0')}`
    
    this.logger.debug(`Transaction submitted: ${hash}`)
    return hash
  }

  // Update analytics
  private updateAnalytics(interaction: ContractInteraction): void {
    this.analytics.totalInteractions++
    
    if (interaction.status === 'completed') {
      this.analytics.successfulInteractions++
    } else if (interaction.status === 'failed') {
      this.analytics.failedInteractions++
    }

    if (interaction.executionTime) {
      this.analytics.averageExecutionTime = 
        (this.analytics.averageExecutionTime * (this.analytics.totalInteractions - 1) + interaction.executionTime) / 
        this.analytics.totalInteractions
    }

    if (interaction.gasUsed) {
      const gasUsed = parseInt(interaction.gasUsed)
      const totalGasUsed = parseInt(this.analytics.totalGasUsed || '0')
      this.analytics.totalGasUsed = (totalGasUsed + gasUsed).toString()
      this.analytics.averageGasUsed = (totalGasUsed / this.analytics.totalInteractions).toString()
    }

    // Update type statistics
    this.analytics.interactionsByType[interaction.type] = 
      (this.analytics.interactionsByType[interaction.type] || 0) + 1

    // Update contract statistics
    if (interaction.contractAddress) {
      this.analytics.interactionsByContract[interaction.contractAddress] = 
        (this.analytics.interactionsByContract[interaction.contractAddress] || 0) + 1
    }

    // Add to time series
    this.analytics.timeSeriesData.push({
      timestamp: new Date(),
      interactions: 1,
      gasUsed: interaction.gasUsed || '0',
      cost: interaction.result?.totalCost || '0'
    })

    // Keep only last 1000 entries
    if (this.analytics.timeSeriesData.length > 1000) {
      this.analytics.timeSeriesData = this.analytics.timeSeriesData.slice(-1000)
    }
  }

  // Initialize analytics
  private initializeAnalytics(): void {
    this.analytics = {
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      averageExecutionTime: 0,
      totalGasUsed: '0',
      averageGasUsed: '0',
      totalCost: '0',
      averageCost: '0',
      interactionsByType: {} as Record<InteractionType, number>,
      interactionsByContract: {} as Record<string, number>,
      topContracts: [],
      timeSeriesData: []
    }
  }

  // Start cleanup intervals
  private startCleanupIntervals(): void {
    // Clean old interactions every hour
    setInterval(() => {
      this.cleanupOldInteractions()
    }, 3600000) // Every hour

    // Update top contracts every 5 minutes
    setInterval(() => {
      this.updateTopContracts()
    }, 300000) // Every 5 minutes
  }

  // Clean old interactions
  private async cleanupOldInteractions(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    let cleanedCount = 0

    for (const [interactionId, interaction] of this.interactions.entries()) {
      if (interaction.createdAt < cutoff && 
          (interaction.status === 'completed' || interaction.status === 'failed')) {
        this.interactions.delete(interactionId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old interactions`)
    }
  }

  // Update top contracts
  private updateTopContracts(): void {
    const contractStats = new Map<string, {
      interactions: number
      totalGasUsed: string
      totalCost: string
    }>()

    // Calculate statistics for each contract
    for (const interaction of this.interactions.values()) {
      if (interaction.contractAddress && interaction.status === 'completed') {
        const stats = contractStats.get(interaction.contractAddress) || {
          interactions: 0,
          totalGasUsed: '0',
          totalCost: '0'
        }

        stats.interactions++
        if (interaction.gasUsed) {
          stats.totalGasUsed = (parseInt(stats.totalGasUsed) + parseInt(interaction.gasUsed)).toString()
        }
        if (interaction.result?.totalCost) {
          stats.totalCost = (parseFloat(stats.totalCost) + parseFloat(interaction.result.totalCost)).toString()
        }

        contractStats.set(interaction.contractAddress, stats)
      }
    }

    // Update top contracts
    this.analytics.topContracts = Array.from(contractStats.entries())
      .map(([address, stats]) => ({
        address,
        interactions: stats.interactions,
        totalGasUsed: stats.totalGasUsed,
        averageGasUsed: (parseInt(stats.totalGasUsed) / stats.interactions).toString(),
        totalCost: stats.totalCost,
        averageCost: (parseFloat(stats.totalCost) / stats.interactions).toString()
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 10)
  }

  // Save interaction
  private async saveInteraction(interaction: ContractInteraction): Promise<void> {
    // This would save to your database
    this.logger.debug(`Interaction saved: ${interaction.id}`)
  }

  // Load interaction data
  private async loadInteractionData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading interaction data...')
  }

  // Save interaction data
  private async saveInteractionData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving interaction data...')
  }

  // Generate interaction ID
  private generateInteractionId(): string {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate operation ID
  private generateOperationId(): string {
    return `operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get interaction by ID
  getInteraction(interactionId: string): ContractInteraction | null {
    return this.interactions.get(interactionId) || null
  }

  // Get all interactions
  getAllInteractions(): ContractInteraction[] {
    return Array.from(this.interactions.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Get interactions by type
  getInteractionsByType(type: InteractionType): ContractInteraction[] {
    return Array.from(this.interactions.values())
      .filter(interaction => interaction.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Get interactions by contract
  getInteractionsByContract(contractAddress: string): ContractInteraction[] {
    return Array.from(this.interactions.values())
      .filter(interaction => interaction.contractAddress === contractAddress)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Get analytics
  getAnalytics(): InteractionAnalytics {
    return this.analytics
  }

  // Export interaction data
  exportInteractionData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      interactions: Array.from(this.interactions.values()),
      analytics: this.analytics
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'type', 'contractAddress', 'chainId', 'functionName', 'status', 'createdAt', 'executionTime', 'gasUsed', 'transactionHash']
      const csvRows = [headers.join(',')]
      
      for (const interaction of this.interactions.values()) {
        csvRows.push([
          interaction.id,
          interaction.type,
          interaction.contractAddress,
          interaction.chainId.toString(),
          interaction.functionName || '',
          interaction.status,
          interaction.createdAt.toISOString(),
          interaction.executionTime?.toString() || '',
          interaction.gasUsed || '',
          interaction.transactionHash || ''
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isInteracting: boolean
    totalInteractions: number
    lastActivity: Date
    metrics: any
  } {
    return {
      isInteracting: this.isInteracting,
      totalInteractions: this.interactions.size,
      lastActivity: new Date(),
      metrics: this.analytics
    }
  }
}

export default ContractInteraction
