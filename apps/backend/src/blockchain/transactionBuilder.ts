import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { Logger } from '../utils/logger'
import { CHAIN_CONFIGS } from './chainConfig'
import { AUCTION_CONTRACT, ASSET_CONTRACT, PAYMENT_CONTRACT, USER_CONTRACT } from './abi'

// Transaction type enum
export enum TransactionType {
  TRANSFER = 'transfer',
  APPROVE = 'approve',
  MINT = 'mint',
  BURN = 'burn',
  CREATE_AUCTION = 'createAuction',
  BID = 'bid',
  CANCEL_AUCTION = 'cancelAuction',
  SETTLE_AUCTION = 'settleAuction',
  UPDATE_ASSET = 'updateAsset',
  TRANSFER_OWNERSHIP = 'transferOwnership',
  PAUSE = 'pause',
  UNPAUSE = 'unpause'
}

// Transaction priority enum
export enum TransactionPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

// Transaction build options interface
export interface TransactionBuildOptions {
  from: string
  to?: string
  value?: string
  data?: string
  gasLimit?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: number
  type?: number // 0 for legacy, 2 for EIP-1559
  chainId?: number
  priority?: TransactionPriority
  deadline?: number
  metadata?: any
}

// Built transaction interface
export interface BuiltTransaction {
  id: string
  type: TransactionType
  from: string
  to: string
  value: string
  data: string
  gasLimit: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce: number
  chainId: number
  type: number
  priority: TransactionPriority
  deadline?: number
  metadata: any
  estimatedGas?: string
  estimatedCost?: string
  signature?: string
  rawTransaction?: string
  createdAt: Date
  expiresAt?: Date
}

// Contract call interface
export interface ContractCall {
  contractAddress: string
  functionName: string
  parameters: any[]
  value?: string
  abi: any[]
}

// Batch transaction interface
export interface BatchTransaction {
  id: string
  transactions: BuiltTransaction[]
  maxGasLimit?: string
  totalValue: string
  totalEstimatedGas: string
  totalEstimatedCost: string
  createdAt: Date
}

// Transaction builder service
export class TransactionBuilder extends EventEmitter {
  private logger: Logger
  private isBuilding: boolean = false
  private nonceCache: Map<string, { nonce: number; timestamp: Date }> = new Map()
  private gasPriceCache: Map<number, { price: string; timestamp: Date }> = new Map()
  private defaultGasLimit: number = 21000
  private maxGasLimit: number = 8000000
  private nonceCacheTimeout: number = 60000 // 1 minute
  private gasPriceCacheTimeout: number = 30000 // 30 seconds

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start transaction builder
  async start(): Promise<void> {
    if (this.isBuilding) {
      this.logger.warn('Transaction builder already started')
      return
    }

    this.isBuilding = true
    this.logger.info('Starting transaction builder...')

    // Start cache cleanup
    this.startCacheCleanup()

    this.logger.info('Transaction builder started')
    this.emit('builder:started')
  }

  // Stop transaction builder
  async stop(): Promise<void> {
    if (!this.isBuilding) {
      return
    }

    this.isBuilding = false
    this.logger.info('Stopping transaction builder...')

    // Clear caches
    this.nonceCache.clear()
    this.gasPriceCache.clear()

    this.logger.info('Transaction builder stopped')
    this.emit('builder:stopped')
  }

  // Build simple transfer transaction
  async buildTransferTransaction(options: {
    from: string
    to: string
    value: string
    chainId: number
    priority?: TransactionPriority
    gasPrice?: string
    gasLimit?: string
  }): Promise<BuiltTransaction> {
    const transactionId = this.generateTransactionId()

    try {
      this.logger.debug(`Building transfer transaction: ${options.from} -> ${options.to}`)

      // Get gas price if not provided
      const gasPrice = options.gasPrice || await this.getOptimalGasPrice(options.chainId, options.priority)
      
      // Get nonce
      const nonce = await this.getNonce(options.from, options.chainId)
      
      // Build transaction
      const transaction: BuiltTransaction = {
        id: transactionId,
        type: TransactionType.TRANSFER,
        from: options.from,
        to: options.to,
        value: options.value,
        data: '0x',
        gasLimit: options.gasLimit || this.defaultGasLimit.toString(),
        gasPrice,
        nonce,
        chainId: options.chainId,
        type: 0, // Legacy transaction
        priority: options.priority || TransactionPriority.NORMAL,
        metadata: {
          transferType: 'simple',
          timestamp: Date.now()
        },
        createdAt: new Date()
      }

      // Estimate gas and cost
      await this.estimateTransactionGas(transaction)
      
      this.logger.info(`Transfer transaction built: ${transactionId}`)
      this.emit('transaction:built', { transaction })

      return transaction

    } catch (error) {
      this.logger.error(`Failed to build transfer transaction:`, error)
      this.emit('build:error', { error, type: TransactionType.TRANSFER })
      throw error
    }
  }

  // Build contract transaction
  async buildContractTransaction(options: {
    from: string
    contractCall: ContractCall
    chainId: number
    priority?: TransactionPriority
    gasPrice?: string
    gasLimit?: string
    value?: string
  }): Promise<BuiltTransaction> {
    const transactionId = this.generateTransactionId()

    try {
      this.logger.debug(`Building contract transaction: ${options.contractCall.contractAddress} ${options.contractCall.functionName}`)

      // Get provider
      const provider = await this.getProvider(options.chainId)
      
      // Create contract interface
      const contract = new ethers.Contract(options.contractCall.contractAddress, options.contractCall.abi, provider)
      
      // Encode function call
      const encodedData = contract.interface.encodeFunctionData(
        options.contractCall.functionName,
        options.contractCall.parameters
      )

      // Get gas price if not provided
      const gasPrice = options.gasPrice || await this.getOptimalGasPrice(options.chainId, options.priority)
      
      // Get nonce
      const nonce = await this.getNonce(options.from, options.chainId)
      
      // Build transaction
      const transaction: BuiltTransaction = {
        id: transactionId,
        type: this.getTransactionTypeFromFunction(options.contractCall.functionName),
        from: options.from,
        to: options.contractCall.contractAddress,
        value: options.value || '0',
        data: encodedData,
        gasLimit: options.gasLimit || this.defaultGasLimit.toString(),
        gasPrice,
        nonce,
        chainId: options.chainId,
        type: 0, // Legacy transaction
        priority: options.priority || TransactionPriority.NORMAL,
        metadata: {
          contractCall: options.contractCall,
          timestamp: Date.now()
        },
        createdAt: new Date()
      }

      // Estimate gas and cost
      await this.estimateTransactionGas(transaction)
      
      this.logger.info(`Contract transaction built: ${transactionId}`)
      this.emit('transaction:built', { transaction })

      return transaction

    } catch (error) {
      this.logger.error(`Failed to build contract transaction:`, error)
      this.emit('build:error', { error, type: 'contract' })
      throw error
    }
  }

  // Build EIP-1559 transaction
  async buildEIP1559Transaction(options: TransactionBuildOptions): Promise<BuiltTransaction> {
    const transactionId = this.generateTransactionId()

    try {
      this.logger.debug(`Building EIP-1559 transaction: ${options.from} -> ${options.to}`)

      // Get provider
      const provider = await this.getProvider(options.chainId || 1)
      
      // Get fee data
      const feeData = await provider.getFeeData()
      
      // Get nonce
      const nonce = options.nonce || await this.getNonce(options.from, options.chainId || 1)
      
      // Build transaction
      const transaction: BuiltTransaction = {
        id: transactionId,
        type: TransactionType.TRANSFER,
        from: options.from,
        to: options.to || '',
        value: options.value || '0',
        data: options.data || '0x',
        gasLimit: options.gasLimit || this.defaultGasLimit.toString(),
        maxFeePerGas: options.maxFeePerGas || feeData.maxFeePerGas?.toString() || '0',
        maxPriorityFeePerGas: options.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas?.toString() || '0',
        nonce,
        chainId: options.chainId || 1,
        type: 2, // EIP-1559 transaction
        priority: options.priority || TransactionPriority.NORMAL,
        deadline: options.deadline,
        metadata: options.metadata || {},
        createdAt: new Date()
      }

      // Estimate gas and cost
      await this.estimateTransactionGas(transaction)
      
      this.logger.info(`EIP-1559 transaction built: ${transactionId}`)
      this.emit('transaction:built', { transaction })

      return transaction

    } catch (error) {
      this.logger.error(`Failed to build EIP-1559 transaction:`, error)
      this.emit('build:error', { error, type: 'eip1559' })
      throw error
    }
  }

  // Build batch transaction
  async buildBatchTransaction(options: {
    from: string
    transactions: ContractCall[]
    chainId: number
    priority?: TransactionPriority
    maxGasLimit?: string
  }): Promise<BatchTransaction> {
    const batchId = this.generateTransactionId()

    try {
      this.logger.debug(`Building batch transaction: ${options.transactions.length} calls`)

      const builtTransactions: BuiltTransaction[] = []
      let totalValue = '0'
      let totalEstimatedGas = '0'
      let totalEstimatedCost = '0'

      // Build each transaction
      for (const contractCall of options.transactions) {
        const transaction = await this.buildContractTransaction({
          from: options.from,
          contractCall,
          chainId: options.chainId,
          priority: options.priority
        })

        builtTransactions.push(transaction)
        
        // Accumulate totals
        totalValue = (parseFloat(totalValue) + parseFloat(transaction.value || '0')).toString()
        totalEstimatedGas = (parseInt(totalEstimatedGas) + parseInt(transaction.estimatedGas || '0')).toString()
        totalEstimatedCost = (parseFloat(totalEstimatedCost) + parseFloat(transaction.estimatedCost || '0')).toString()
      }

      // Check gas limit
      const maxGasLimit = options.maxGasLimit || this.maxGasLimit.toString()
      if (parseInt(totalEstimatedGas) > parseInt(maxGasLimit)) {
        throw new Error(`Batch transaction exceeds gas limit: ${totalEstimatedGas} > ${maxGasLimit}`)
      }

      const batchTransaction: BatchTransaction = {
        id: batchId,
        transactions: builtTransactions,
        maxGasLimit,
        totalValue,
        totalEstimatedGas,
        totalEstimatedCost,
        createdAt: new Date()
      }

      this.logger.info(`Batch transaction built: ${batchId}`)
      this.emit('batch:built', { batchTransaction })

      return batchTransaction

    } catch (error) {
      this.logger.error(`Failed to build batch transaction:`, error)
      this.emit('build:error', { error, type: 'batch' })
      throw error
    }
  }

  // Build multi-sig transaction
  async buildMultiSigTransaction(options: {
    from: string
    to: string
    value?: string
    data?: string
    chainId: number
    requiredSignatures: number
    signers: string[]
    priority?: TransactionPriority
  }): Promise<BuiltTransaction> {
    const transactionId = this.generateTransactionId()

    try {
      this.logger.debug(`Building multi-sig transaction: ${options.from} -> ${options.to}`)

      // Get gas price
      const gasPrice = await this.getOptimalGasPrice(options.chainId, options.priority)
      
      // Get nonce
      const nonce = await this.getNonce(options.from, options.chainId)
      
      // Build transaction
      const transaction: BuiltTransaction = {
        id: transactionId,
        type: TransactionType.TRANSFER,
        from: options.from,
        to: options.to,
        value: options.value || '0',
        data: options.data || '0x',
        gasLimit: this.defaultGasLimit.toString(),
        gasPrice,
        nonce,
        chainId: options.chainId,
        type: 0, // Legacy transaction
        priority: options.priority || TransactionPriority.NORMAL,
        metadata: {
          multiSig: {
            requiredSignatures: options.requiredSignatures,
            signers: options.signers,
            timestamp: Date.now()
          }
        },
        createdAt: new Date()
      }

      // Estimate gas and cost
      await this.estimateTransactionGas(transaction)
      
      this.logger.info(`Multi-sig transaction built: ${transactionId}`)
      this.emit('transaction:built', { transaction })

      return transaction

    } catch (error) {
      this.logger.error(`Failed to build multi-sig transaction:`, error)
      this.emit('build:error', { error, type: 'multisig' })
      throw error
    }
  }

  // Sign transaction
  async signTransaction(transaction: BuiltTransaction, privateKey: string): Promise<BuiltTransaction> {
    try {
      this.logger.debug(`Signing transaction: ${transaction.id}`)

      // Create wallet
      const wallet = new ethers.Wallet(privateKey)
      
      // Create transaction object
      const txObject: any = {
        to: transaction.to,
        value: ethers.utils.parseEther(transaction.value || '0'),
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        nonce: transaction.nonce,
        chainId: transaction.chainId
      }

      // Add gas price or EIP-1559 fields
      if (transaction.type === 2) {
        txObject.maxFeePerGas = transaction.maxFeePerGas
        txObject.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas
        txObject.type = 2
      } else {
        txObject.gasPrice = transaction.gasPrice
      }

      // Sign transaction
      const signedTx = await wallet.signTransaction(txObject)
      
      // Update transaction with signature
      transaction.signature = signedTx
      transaction.rawTransaction = signedTx
      
      this.logger.info(`Transaction signed: ${transaction.id}`)
      this.emit('transaction:signed', { transaction })

      return transaction

    } catch (error) {
      this.logger.error(`Failed to sign transaction: ${transaction.id}`, error)
      this.emit('sign:error', { transaction, error })
      throw error
    }
  }

  // Estimate transaction gas
  private async estimateTransactionGas(transaction: BuiltTransaction): Promise<void> {
    try {
      const provider = await this.getProvider(transaction.chainId)
      
      const txObject: any = {
        to: transaction.to,
        value: ethers.utils.parseEther(transaction.value || '0'),
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        nonce: transaction.nonce,
        chainId: transaction.chainId
      }

      // Add gas price or EIP-1559 fields
      if (transaction.type === 2) {
        txObject.maxFeePerGas = transaction.maxFeePerGas
        txObject.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas
        txObject.type = 2
      } else {
        txObject.gasPrice = transaction.gasPrice
      }

      // Estimate gas
      const gasEstimate = await provider.estimateGas(txObject)
      transaction.estimatedGas = gasEstimate.toString()
      
      // Calculate estimated cost
      let gasPrice = transaction.gasPrice
      if (transaction.type === 2 && transaction.maxFeePerGas) {
        gasPrice = transaction.maxFeePerGas
      }
      
      const estimatedCost = ethers.utils.formatEther(
        gasEstimate.mul(ethers.BigNumber.from(gasPrice || '0'))
      )
      
      transaction.estimatedCost = estimatedCost

    } catch (error) {
      this.logger.warn(`Failed to estimate gas for transaction ${transaction.id}:`, error.message)
      transaction.estimatedGas = this.defaultGasLimit.toString()
      transaction.estimatedCost = '0'
    }
  }

  // Get nonce
  private async getNonce(address: string, chainId: number): Promise<number> {
    const cacheKey = `${chainId}:${address}`
    const cached = this.nonceCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp.getTime() < this.nonceCacheTimeout) {
      return cached.nonce
    }

    try {
      const provider = await this.getProvider(chainId)
      const nonce = await provider.getTransactionCount(address, 'pending')
      
      this.nonceCache.set(cacheKey, {
        nonce,
        timestamp: new Date()
      })

      return nonce

    } catch (error) {
      this.logger.error(`Failed to get nonce for ${address}:`, error)
      throw error
    }
  }

  // Get optimal gas price
  private async getOptimalGasPrice(chainId: number, priority?: TransactionPriority): Promise<string> {
    const cacheKey = chainId.toString()
    const cached = this.gasPriceCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp.getTime() < this.gasPriceCacheTimeout) {
      return cached.price
    }

    try {
      const provider = await this.getProvider(chainId)
      const feeData = await provider.getFeeData()
      
      let gasPrice = feeData.gasPrice?.toString() || '20000000000'
      
      // Adjust based on priority
      if (priority === TransactionPriority.HIGH || priority === TransactionPriority.URGENT) {
        gasPrice = feeData.maxFeePerGas?.toString() || gasPrice
      } else if (priority === TransactionPriority.LOW) {
        gasPrice = (parseInt(gasPrice) * 0.8).toString()
      }

      this.gasPriceCache.set(cacheKey, {
        price: gasPrice,
        timestamp: new Date()
      })

      return gasPrice

    } catch (error) {
      this.logger.error(`Failed to get gas price for chain ${chainId}:`, error)
      return '20000000000' // Default 20 gwei
    }
  }

  // Get transaction type from function name
  private getTransactionTypeFromFunction(functionName: string): TransactionType {
    const functionMap: { [key: string]: TransactionType } = {
      'transfer': TransactionType.TRANSFER,
      'approve': TransactionType.APPROVE,
      'mint': TransactionType.MINT,
      'burn': TransactionType.BURN,
      'createAuction': TransactionType.CREATE_AUCTION,
      'bid': TransactionType.BID,
      'cancelAuction': TransactionType.CANCEL_AUCTION,
      'settleAuction': TransactionType.SETTLE_AUCTION,
      'updateAsset': TransactionType.UPDATE_ASSET,
      'transferOwnership': TransactionType.TRANSFER_OWNERSHIP,
      'pause': TransactionType.PAUSE,
      'unpause': TransactionType.UNPAUSE
    }

    return functionMap[functionName] || TransactionType.TRANSFER
  }

  // Get provider for chain
  private async getProvider(chainId: number): Promise<ethers.providers.Provider> {
    const chainConfig = CHAIN_CONFIGS.find(config => config.chainId === chainId)
    
    if (!chainConfig) {
      throw new Error(`Chain configuration not found: ${chainId}`)
    }

    return new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl)
  }

  // Start cache cleanup
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCaches()
    }, 60000) // Every minute
  }

  // Cleanup caches
  private cleanupCaches(): void {
    const now = Date.now()
    let cleanedCount = 0

    // Clean nonce cache
    for (const [key, cached] of this.nonceCache.entries()) {
      if (now - cached.timestamp.getTime() > this.nonceCacheTimeout) {
        this.nonceCache.delete(key)
        cleanedCount++
      }
    }

    // Clean gas price cache
    for (const [key, cached] of this.gasPriceCache.entries()) {
      if (now - cached.timestamp.getTime() > this.gasPriceCacheTimeout) {
        this.gasPriceCache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} cache entries`)
    }
  }

  // Generate transaction ID
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get transaction by ID
  getTransaction(transactionId: string): BuiltTransaction | null {
    // This would retrieve from storage/database
    return null
  }

  // Get pending transactions
  getPendingTransactions(address?: string): BuiltTransaction[] {
    // This would retrieve pending transactions from storage/database
    return []
  }

  // Get transaction statistics
  getTransactionStatistics(): {
    totalBuilt: number
    totalSigned: number
    averageGasLimit: number
    averageGasPrice: string
    totalEstimatedCost: string
    byType: Record<TransactionType, number>
    byPriority: Record<TransactionPriority, number>
  } {
    // This would calculate statistics from stored transactions
    return {
      totalBuilt: 0,
      totalSigned: 0,
      averageGasLimit: 0,
      averageGasPrice: '0',
      totalEstimatedCost: '0',
      byType: {} as Record<TransactionType, number>,
      byPriority: {} as Record<TransactionPriority, number>
    }
  }

  // Export transaction data
  exportTransactionData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      statistics: this.getTransactionStatistics(),
      pendingTransactions: this.getPendingTransactions()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'type', 'from', 'to', 'value', 'gasLimit', 'gasPrice', 'nonce', 'chainId', 'createdAt']
      const csvRows = [headers.join(',')]
      
      for (const tx of this.getPendingTransactions()) {
        csvRows.push([
          tx.id,
          tx.type,
          tx.from,
          tx.to,
          tx.value,
          tx.gasLimit,
          tx.gasPrice || '',
          tx.nonce.toString(),
          tx.chainId.toString(),
          tx.createdAt.toISOString()
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isBuilding: boolean
    nonceCacheSize: number
    gasPriceCacheSize: number
    lastActivity: Date
    metrics: any
  } {
    return {
      isBuilding: this.isBuilding,
      nonceCacheSize: this.nonceCache.size,
      gasPriceCacheSize: this.gasPriceCache.size,
      lastActivity: new Date(),
      metrics: this.getTransactionStatistics()
    }
  }
}

export default TransactionBuilder
