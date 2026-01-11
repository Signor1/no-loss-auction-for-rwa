import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { Logger } from '../utils/logger'
import { CHAIN_CONFIGS } from './chainConfig'
import { AUCTION_CONTRACT, ASSET_CONTRACT, PAYMENT_CONTRACT, USER_CONTRACT } from './abi'

// Gas estimation strategy enum
export enum GasEstimationStrategy {
  CONSERVATIVE = 'conservative',
  STANDARD = 'standard',
  AGGRESSIVE = 'aggressive',
  OPTIMISTIC = 'optimistic'
}

// Gas estimation result interface
export interface GasEstimationResult {
  success: boolean
  gasLimit: string
  gasPrice: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  totalCost: string
  estimatedTime: number
  confidence: number
  strategy: GasEstimationStrategy
  warnings: string[]
  recommendations: string[]
}

// Contract gas estimation interface
export interface ContractGasEstimation {
  contractAddress: string
  functionName: string
  parameters: any[]
  gasLimit: string
  gasPrice: string
  totalCost: string
  estimatedTime: number
  confidence: number
}

// Batch gas estimation interface
export interface BatchGasEstimation {
  operations: ContractGasEstimation[]
  totalGasLimit: string
  totalCost: string
  estimatedTime: number
  optimization: {
    originalGas: string
    optimizedGas: string
    savings: string
    savingsPercentage: number
  }
}

// Gas estimator service
export class GasEstimator extends EventEmitter {
  private logger: Logger
  private isEstimating: boolean = false
  private estimationCache: Map<string, { result: GasEstimationResult; timestamp: Date; ttl: number }> = new Map()
  private gasHistory: Map<number, Array<{ price: string; timestamp: Date; blockNumber: number }>> = new Map()
  private defaultCacheTimeout: number = 30000 // 30 seconds
  private maxGasLimit: number = 8000000
  private safetyMargin: number = 1.2 // 20% safety margin

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start gas estimator
  async start(): Promise<void> {
    if (this.isEstimating) {
      this.logger.warn('Gas estimator already started')
      return
    }

    this.isEstimating = true
    this.logger.info('Starting gas estimator...')

    // Initialize gas history
    await this.initializeGasHistory()

    // Start cache cleanup
    this.startCacheCleanup()

    this.logger.info('Gas estimator started')
    this.emit('estimator:started')
  }

  // Stop gas estimator
  async stop(): Promise<void> {
    if (!this.isEstimating) {
      return
    }

    this.isEstimating = false
    this.logger.info('Stopping gas estimator...')

    // Clear cache
    this.estimationCache.clear()

    this.logger.info('Gas estimator stopped')
    this.emit('estimator:stopped')
  }

  // Estimate simple transfer gas
  async estimateTransferGas(options: {
    from: string
    to: string
    value: string
    chainId: number
    strategy?: GasEstimationStrategy
  }): Promise<GasEstimationResult> {
    const cacheKey = `transfer:${options.chainId}:${options.from}:${options.to}:${options.value}`
    
    // Check cache first
    const cached = this.estimationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
      this.logger.debug(`Cache hit for transfer gas estimation: ${cacheKey}`)
      return cached.result
    }

    try {
      this.logger.debug(`Estimating transfer gas: ${options.from} -> ${options.to}`)

      const strategy = options.strategy || GasEstimationStrategy.STANDARD
      const provider = await this.getProvider(options.chainId)
      
      // Get current gas prices
      const gasPrices = await this.getCurrentGasPrices(options.chainId)
      
      // Estimate gas limit
      const gasLimit = await this.estimateGasLimit({
        to: options.to,
        value: options.value,
        data: '0x',
        chainId: options.chainId
      })

      // Apply strategy
      const adjustedGasLimit = this.applyGasStrategy(gasLimit, strategy)
      
      // Calculate costs
      const totalCost = this.calculateTotalCost(adjustedGasLimit, gasPrices)
      
      // Estimate execution time
      const estimatedTime = this.estimateExecutionTime(adjustedGasLimit, options.chainId)
      
      // Calculate confidence
      const confidence = this.calculateConfidence(strategy, gasPrices)
      
      const result: GasEstimationResult = {
        success: true,
        gasLimit: adjustedGasLimit,
        gasPrice: gasPrices.gasPrice,
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
        totalCost,
        estimatedTime,
        confidence,
        strategy,
        warnings: this.generateWarnings(adjustedGasLimit, gasPrices),
        recommendations: this.generateRecommendations(adjustedGasLimit, gasPrices, strategy)
      }

      // Cache result
      this.estimationCache.set(cacheKey, {
        result,
        timestamp: new Date(),
        ttl: this.defaultCacheTimeout
      })

      this.logger.info(`Transfer gas estimated: ${adjustedGasLimit} gas`)
      this.emit('estimation:completed', { type: 'transfer', result })

      return result

    } catch (error) {
      const result: GasEstimationResult = {
        success: false,
        gasLimit: '0',
        gasPrice: '0',
        totalCost: '0',
        estimatedTime: 0,
        confidence: 0,
        strategy: options.strategy || GasEstimationStrategy.STANDARD,
        warnings: [error.message],
        recommendations: []
      }

      this.logger.error(`Failed to estimate transfer gas:`, error)
      this.emit('estimation:error', { type: 'transfer', error, result })
      return result
    }
  }

  // Estimate contract call gas
  async estimateContractCallGas(options: {
    contractAddress: string
    functionName: string
    parameters: any[]
    value?: string
    chainId: number
    abi?: any[]
    strategy?: GasEstimationStrategy
  }): Promise<GasEstimationResult> {
    const cacheKey = `contract:${options.chainId}:${options.contractAddress}:${options.functionName}:${JSON.stringify(options.parameters)}`
    
    // Check cache first
    const cached = this.estimationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
      this.logger.debug(`Cache hit for contract gas estimation: ${cacheKey}`)
      return cached.result
    }

    try {
      this.logger.debug(`Estimating contract call gas: ${options.contractAddress} ${options.functionName}`)

      const strategy = options.strategy || GasEstimationStrategy.STANDARD
      const provider = await this.getProvider(options.chainId)
      
      // Get current gas prices
      const gasPrices = await this.getCurrentGasPrices(options.chainId)
      
      // Create contract interface
      const abi = options.abi || await this.getContractABI(options.contractAddress, options.chainId)
      const contract = new ethers.Contract(options.contractAddress, abi, provider)
      
      // Encode function call
      const encodedData = contract.interface.encodeFunctionData(
        options.functionName,
        options.parameters
      )

      // Estimate gas limit
      const gasLimit = await this.estimateGasLimit({
        to: options.contractAddress,
        value: options.value || '0',
        data: encodedData,
        chainId: options.chainId
      })

      // Apply strategy
      const adjustedGasLimit = this.applyGasStrategy(gasLimit, strategy)
      
      // Calculate costs
      const totalCost = this.calculateTotalCost(adjustedGasLimit, gasPrices)
      
      // Estimate execution time
      const estimatedTime = this.estimateExecutionTime(adjustedGasLimit, options.chainId)
      
      // Calculate confidence
      const confidence = this.calculateConfidence(strategy, gasPrices)
      
      const result: GasEstimationResult = {
        success: true,
        gasLimit: adjustedGasLimit,
        gasPrice: gasPrices.gasPrice,
        maxFeePerGas: gasPrices.maxFeePerGas,
        maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
        totalCost,
        estimatedTime,
        confidence,
        strategy,
        warnings: this.generateWarnings(adjustedGasLimit, gasPrices),
        recommendations: this.generateRecommendations(adjustedGasLimit, gasPrices, strategy)
      }

      // Cache result
      this.estimationCache.set(cacheKey, {
        result,
        timestamp: new Date(),
        ttl: this.defaultCacheTimeout
      })

      this.logger.info(`Contract call gas estimated: ${adjustedGasLimit} gas`)
      this.emit('estimation:completed', { type: 'contract', result })

      return result

    } catch (error) {
      const result: GasEstimationResult = {
        success: false,
        gasLimit: '0',
        gasPrice: '0',
        totalCost: '0',
        estimatedTime: 0,
        confidence: 0,
        strategy: options.strategy || GasEstimationStrategy.STANDARD,
        warnings: [error.message],
        recommendations: []
      }

      this.logger.error(`Failed to estimate contract call gas:`, error)
      this.emit('estimation:error', { type: 'contract', error, result })
      return result
    }
  }

  // Estimate batch gas
  async estimateBatchGas(options: {
    operations: Array<{
      contractAddress: string
      functionName: string
      parameters: any[]
      value?: string
    }>
    chainId: number
    strategy?: GasEstimationStrategy
    optimize?: boolean
  }): Promise<BatchGasEstimation> {
    try {
      this.logger.debug(`Estimating batch gas: ${options.operations.length} operations`)

      const strategy = options.strategy || GasEstimationStrategy.STANDARD
      const results: ContractGasEstimation[] = []
      let totalGasLimit = '0'
      let totalCost = '0'
      let maxEstimatedTime = 0

      // Estimate each operation
      for (const operation of options.operations) {
        const estimation = await this.estimateContractCallGas({
          ...operation,
          chainId: options.chainId,
          strategy
        })

        if (estimation.success) {
          results.push({
            contractAddress: operation.contractAddress,
            functionName: operation.functionName,
            parameters: operation.parameters,
            gasLimit: estimation.gasLimit,
            gasPrice: estimation.gasPrice,
            totalCost: estimation.totalCost,
            estimatedTime: estimation.estimatedTime,
            confidence: estimation.confidence
          })

          totalGasLimit = (parseInt(totalGasLimit) + parseInt(estimation.gasLimit)).toString()
          totalCost = (parseFloat(totalCost) + parseFloat(estimation.totalCost)).toString()
          maxEstimatedTime = Math.max(maxEstimatedTime, estimation.estimatedTime)
        }
      }

      // Optimize if requested
      let optimization
      if (options.optimize) {
        optimization = await this.optimizeBatchOperations(results, options.chainId)
      } else {
        optimization = {
          originalGas: totalGasLimit,
          optimizedGas: totalGasLimit,
          savings: '0',
          savingsPercentage: 0
        }
      }

      const batchEstimation: BatchGasEstimation = {
        operations: results,
        totalGasLimit: optimization.optimizedGas,
        totalCost,
        estimatedTime: maxEstimatedTime,
        optimization
      }

      this.logger.info(`Batch gas estimated: ${optimization.optimizedGas} gas total`)
      this.emit('batch:estimated', { batchEstimation })

      return batchEstimation

    } catch (error) {
      this.logger.error(`Failed to estimate batch gas:`, error)
      throw error
    }
  }

  // Estimate gas limit
  private async estimateGasLimit(options: {
    to: string
    value: string
    data: string
    chainId: number
  }): Promise<string> {
    try {
      const provider = await this.getProvider(options.chainId)
      
      const txObject = {
        to: options.to,
        value: ethers.utils.parseEther(options.value || '0'),
        data: options.data
      }

      const gasEstimate = await provider.estimateGas(txObject)
      
      // Apply safety margin
      const adjustedGas = Math.floor(parseInt(gasEstimate.toString()) * this.safetyMargin)
      
      // Ensure it doesn't exceed max gas limit
      return Math.min(adjustedGas, this.maxGasLimit).toString()

    } catch (error) {
      this.logger.warn(`Gas estimation failed, using default:`, error.message)
      return this.defaultGasLimit.toString()
    }
  }

  // Get current gas prices
  private async getCurrentGasPrices(chainId: number): Promise<{
    gasPrice: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
  }> {
    try {
      const provider = await this.getProvider(chainId)
      const feeData = await provider.getFeeData()
      
      return {
        gasPrice: feeData.gasPrice?.toString() || '20000000000',
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
      }

    } catch (error) {
      this.logger.error(`Failed to get gas prices for chain ${chainId}:`, error)
      return {
        gasPrice: '20000000000'
      }
    }
  }

  // Apply gas strategy
  private applyGasStrategy(gasLimit: string, strategy: GasEstimationStrategy): string {
    const gasLimitNum = parseInt(gasLimit)
    
    switch (strategy) {
      case GasEstimationStrategy.CONSERVATIVE:
        return Math.floor(gasLimitNum * 1.5).toString()
      case GasEstimationStrategy.AGGRESSIVE:
        return Math.floor(gasLimitNum * 1.1).toString()
      case GasEstimationStrategy.OPTIMISTIC:
        return Math.floor(gasLimitNum * 0.9).toString()
      case GasEstimationStrategy.STANDARD:
      default:
        return gasLimit
    }
  }

  // Calculate total cost
  private calculateTotalCost(gasLimit: string, gasPrices: {
    gasPrice: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
  }): string {
    const gasLimitNum = parseInt(gasLimit)
    const gasPriceNum = parseInt(gasPrices.gasPrice)
    
    let totalCost = gasLimitNum * gasPriceNum
    
    // Use EIP-1559 pricing if available
    if (gasPrices.maxFeePerGas) {
      totalCost = gasLimitNum * parseInt(gasPrices.maxFeePerGas)
    }
    
    return ethers.utils.formatEther(totalCost.toString())
  }

  // Estimate execution time
  private estimateExecutionTime(gasLimit: string, chainId: number): number {
    const gasLimitNum = parseInt(gasLimit)
    
    // Base time estimation (simplified)
    let baseTime = gasLimitNum / 1000000 // 1 second per 1M gas
    
    // Adjust based on chain
    switch (chainId) {
      case 1: // Ethereum
        baseTime *= 1.2
        break
      case 137: // Polygon
        baseTime *= 0.3
        break
      case 56: // BSC
        baseTime *= 0.5
        break
      case 43114: // Avalanche
        baseTime *= 0.8
        break
    }
    
    return Math.max(1, Math.floor(baseTime * 1000)) // Minimum 1 second, return in milliseconds
  }

  // Calculate confidence
  private calculateConfidence(strategy: GasEstimationStrategy, gasPrices: any): number {
    let confidence = 0.8 // Base confidence
    
    // Adjust based on strategy
    switch (strategy) {
      case GasEstimationStrategy.CONSERVATIVE:
        confidence = 0.95
        break
      case GasEstimationStrategy.AGGRESSIVE:
        confidence = 0.6
        break
      case GasEstimationStrategy.OPTIMISTIC:
        confidence = 0.5
        break
      case GasEstimationStrategy.STANDARD:
        confidence = 0.8
        break
    }
    
    // Adjust based on gas price volatility
    const volatility = this.calculateGasPriceVolatility(gasPrices)
    confidence *= (1 - volatility)
    
    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Calculate gas price volatility
  private calculateGasPriceVolatility(gasPrices: any): number {
    // This would calculate actual volatility from historical data
    // For now, return a mock volatility
    return 0.1 // 10% volatility
  }

  // Generate warnings
  private generateWarnings(gasLimit: string, gasPrices: any): string[] {
    const warnings: string[] = []
    const gasLimitNum = parseInt(gasLimit)
    
    if (gasLimitNum > this.maxGasLimit * 0.8) {
      warnings.push('High gas limit detected')
    }
    
    if (parseInt(gasPrices.gasPrice) > 100000000000) { // 100 gwei
      warnings.push('High gas price detected')
    }
    
    return warnings
  }

  // Generate recommendations
  private generateRecommendations(
    gasLimit: string,
    gasPrices: any,
    strategy: GasEstimationStrategy
  ): string[] {
    const recommendations: string[] = []
    
    if (strategy === GasEstimationStrategy.AGGRESSIVE) {
      recommendations.push('Consider using standard strategy for better reliability')
    }
    
    if (parseInt(gasPrices.gasPrice) > 50000000000) { // 50 gwei
      recommendations.push('Consider waiting for lower gas prices')
    }
    
    return recommendations
  }

  // Optimize batch operations
  private async optimizeBatchOperations(
    operations: ContractGasEstimation[],
    chainId: number
  ): Promise<{
    originalGas: string
    optimizedGas: string
    savings: string
    savingsPercentage: number
  }> {
    const originalGas = operations.reduce((sum, op) => sum + parseInt(op.gasLimit), 0)
    
    // Simple optimization: look for similar operations that can be batched
    let optimizedGas = originalGas
    
    // Group by contract address
    const contractGroups = new Map<string, ContractGasEstimation[]>()
    for (const op of operations) {
      const group = contractGroups.get(op.contractAddress) || []
      group.push(op)
      contractGroups.set(op.contractAddress, group)
    }
    
    // Optimize within each group
    for (const [contractAddress, groupOps] of contractGroups.entries()) {
      if (groupOps.length > 1) {
        // Apply batch discount (10% per additional operation)
        const batchDiscount = Math.min(0.3, (groupOps.length - 1) * 0.1)
        const groupGas = groupOps.reduce((sum, op) => sum + parseInt(op.gasLimit), 0)
        const optimizedGroupGas = Math.floor(groupGas * (1 - batchDiscount))
        optimizedGas = optimizedGas - groupGas + optimizedGroupGas
      }
    }
    
    const savings = originalGas - optimizedGas
    const savingsPercentage = originalGas > 0 ? (savings / originalGas) * 100 : 0
    
    return {
      originalGas: originalGas.toString(),
      optimizedGas: optimizedGas.toString(),
      savings: savings.toString(),
      savingsPercentage
    }
  }

  // Get contract ABI
  private async getContractABI(contractAddress: string, chainId: number): Promise<any[]> {
    // This would fetch ABI from registry or database
    // For now, return empty ABI
    return []
  }

  // Get provider for chain
  private async getProvider(chainId: number): Promise<ethers.providers.Provider> {
    const chainConfig = CHAIN_CONFIGS.find(config => config.chainId === chainId)
    
    if (!chainConfig) {
      throw new Error(`Chain configuration not found: ${chainId}`)
    }

    return new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl)
  }

  // Initialize gas history
  private async initializeGasHistory(): Promise<void> {
    const chainIds = CHAIN_CONFIGS.map(config => config.chainId)
    
    for (const chainId of chainIds) {
      try {
        const provider = await this.getProvider(chainId)
        const feeData = await provider.getFeeData()
        const blockNumber = await provider.getBlockNumber()
        
        this.gasHistory.set(chainId, [{
          price: feeData.gasPrice?.toString() || '0',
          timestamp: new Date(),
          blockNumber
        }])
      } catch (error) {
        this.logger.error(`Failed to initialize gas history for chain ${chainId}:`, error)
      }
    }
  }

  // Start cache cleanup
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache()
    }, 60000) // Every minute
  }

  // Cleanup cache
  private cleanupCache(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, cached] of this.estimationCache.entries()) {
      if (now - cached.timestamp.getTime() > cached.ttl) {
        this.estimationCache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} cache entries`)
    }
  }

  // Get estimation statistics
  getEstimationStatistics(): {
    totalEstimations: number
    averageGasLimit: number
    averageConfidence: number
    cacheHitRate: number
    byStrategy: Record<GasEstimationStrategy, number>
  } {
    // This would calculate statistics from stored estimations
    return {
      totalEstimations: 0,
      averageGasLimit: 0,
      averageConfidence: 0,
      cacheHitRate: 0,
      byStrategy: {} as Record<GasEstimationStrategy, number>
    }
  }

  // Clear cache
  clearCache(): void {
    this.estimationCache.clear()
    this.logger.info('Gas estimation cache cleared')
    this.emit('cache:cleared')
  }

  // Export estimation data
  exportEstimationData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      statistics: this.getEstimationStatistics(),
      gasHistory: Object.fromEntries(this.gasHistory.entries())
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['chainId', 'price', 'timestamp', 'blockNumber']
      const csvRows = [headers.join(',')]
      
      for (const [chainId, history] of this.gasHistory.entries()) {
        for (const entry of history) {
          csvRows.push([
            chainId.toString(),
            entry.price,
            entry.timestamp.toISOString(),
            entry.blockNumber.toString()
          ])
        }
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isEstimating: boolean
    cacheSize: number
    gasHistorySize: number
    lastActivity: Date
    metrics: any
  } {
    return {
      isEstimating: this.isEstimating,
      cacheSize: this.estimationCache.size,
      gasHistorySize: Array.from(this.gasHistory.values()).flat().length,
      lastActivity: new Date(),
      metrics: this.getEstimationStatistics()
    }
  }
}

export default GasEstimator
