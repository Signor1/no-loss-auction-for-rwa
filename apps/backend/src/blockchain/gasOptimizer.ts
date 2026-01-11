import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { Logger } from '../utils/logger'

// Gas optimization strategy enum
export enum GasStrategy {
  FAST = 'fast',
  STANDARD = 'standard',
  SLOW = 'slow',
  ECONOMICAL = 'economical'
}

// Gas price data interface
export interface GasPriceData {
  chainId: number
  gasPrice: string
  baseFee: string
  priorityFee: string
  maxFeePerGas: string
  estimatedConfirmationTime: number
  timestamp: Date
  blockNumber: number
  networkCongestion: 'low' | 'medium' | 'high'
}

// Transaction estimate interface
export interface TransactionEstimate {
  gasLimit: string
  gasPrice: string
  maxFeePerGas: string
  totalCost: string
  estimatedTime: number
  confidence: number
}

// Gas optimization result interface
export interface GasOptimizationResult {
  strategy: GasStrategy
  gasPrice: string
  gasLimit: string
  maxFeePerGas: string
  totalCost: string
  estimatedTime: number
  savings: string
  confidence: number
  recommendations: string[]
}

// Gas optimizer class
export class GasOptimizer extends EventEmitter {
  private gasPriceHistory: Map<number, GasPriceData[]> = new Map()
  private networkCongestion: Map<number, 'low' | 'medium' | 'high'> = new Map()
  private logger: Logger
  private isOptimizing: boolean = false
  private optimizationInterval: number = 30000 // 30 seconds
  private maxHistorySize: number = 1000
  private minHistorySize: number = 100
  private congestionThreshold: number = 0.8
  private priceChangeThreshold: number = 0.1

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start gas optimization
  async start(): Promise<void> {
    if (this.isOptimizing) {
      this.logger.warn('Gas optimizer already started')
      return
    }

    this.isOptimizing = true
    this.logger.info('Starting gas optimization...')

    // Start optimization intervals
    this.startOptimizationIntervals()

    // Load historical data
    await this.loadGasPriceHistory()

    this.logger.info('Gas optimizer started')
    this.emit('optimizer:started')
  }

  // Stop gas optimization
  async stop(): Promise<void> {
    if (!this.isOptimizing) {
      return
    }

    this.isOptimizing = false
    this.logger.info('Stopping gas optimization...')

    // Save historical data
    await this.saveGasPriceHistory()

    this.logger.info('Gas optimizer stopped')
    this.emit('optimizer:stopped')
  }

  // Get optimal gas price
  async getOptimalGasPrice(
    chainId: number,
    strategy: GasStrategy = GasStrategy.STANDARD,
    urgency: 'low' | 'medium' | 'high' = 'medium',
    transactionData?: {
      to: string
      value: string
      data: string
      gasLimit?: string
    }
  ): Promise<GasOptimizationResult> {
    try {
      this.logger.debug(`Getting optimal gas price for chain ${chainId}, strategy ${strategy}`)

      // Get current gas prices
      const currentPrices = await this.getCurrentGasPrices(chainId)
      
      // Analyze network congestion
      const congestion = this.analyzeNetworkCongestion(chainId)
      
      // Apply strategy
      const result = this.applyGasStrategy(currentPrices, strategy, urgency, transactionData, congestion)
      
      // Cache the result
      this.cacheGasPriceData(chainId, currentPrices)
      
      this.logger.info(`Gas optimization result for chain ${chainId}:`, result)
      this.emit('gas:optimized', { chainId, result })
      
      return result
    } catch (error) {
      this.logger.error('Failed to get optimal gas price:', error)
      throw error
    }
  }

  // Get current gas prices
  private async getCurrentGasPrices(chainId: number): Promise<GasPriceData> {
    // This would fetch current gas prices from your blockchain provider
    // For now, return mock data based on strategy
    const basePrice = '1000000000'
    const priorityFee = '2000000000'
    const maxFeePerGas = '30000000000'
    
    const gasPriceData: GasPriceData = {
      chainId,
      gasPrice: '20000000000',
      baseFee,
      priorityFee,
      maxFeePerGas,
      estimatedConfirmationTime: 120,
      timestamp: new Date(),
      blockNumber: await this.getCurrentBlockNumber(chainId),
      networkCongestion: this.networkCongestion.get(chainId) || 'medium'
    }

    return gasPriceData
  }

  // Get current block number
  private async getCurrentBlockNumber(chainId: number): Promise<number> {
    // This would fetch from your blockchain provider
    // For now, return a mock value
    return 0
  }

  // Analyze network congestion
  private analyzeNetworkCongestion(chainId: number): 'low' | 'medium' | 'high' {
    const history = this.gasPriceHistory.get(chainId) || []
    
    if (history.length < this.minHistorySize) {
      return 'medium'
    }

    // Calculate gas price velocity
    const recentPrices = history.slice(-50) // Last 50 data points
    if (recentPrices.length < 10) {
      return 'medium'
    }

    const priceChanges = this.calculatePriceVelocity(recentPrices)
    
    // Determine congestion based on price changes
    if (priceChanges > this.congestionThreshold) {
      return 'high'
    } else if (priceChanges > this.congestionThreshold / 2) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // Calculate price velocity
  private calculatePriceVelocity(prices: GasPriceData[]): number {
    if (prices.length < 2) return 0

    let totalChange = 0
    let count = 0

    for (let i = 1; i < prices.length; i++) {
      const change = Math.abs(parseFloat(prices[i].gasPrice) - parseFloat(prices[i-1].gasPrice))
      totalChange += change
      count++
    }

    return count > 0 ? totalChange / count : 0
  }

  // Apply gas strategy
  private applyGasStrategy(
    currentPrices: GasPriceData,
    strategy: GasStrategy,
    urgency: 'low' | 'medium' | 'high',
    transactionData?: {
      to: string
      value: string
      data: string
      gasLimit?: string
    },
    congestion: 'low' | 'medium' | 'high'
  ): GasOptimizationResult {
    let gasPrice = currentPrices.gasPrice
    let maxFeePerGas = currentPrices.maxFeePerGas
    let recommendations: string[] = []

    switch (strategy) {
      case GasStrategy.FAST:
        gasPrice = this.calculateFastGasPrice(currentPrices, urgency, congestion)
        maxFeePerGas = this.calculateMaxFeePerGas(gasPrice, urgency, congestion)
        recommendations.push('Fast strategy prioritizes speed over cost')
        break

      case GasStrategy.SLOW:
        gasPrice = this.calculateSlowGasPrice(currentPrices, urgency, congestion)
        maxFeePerGas = this.calculateMaxFeePerGas(gasPrice, urgency, congestion)
        recommendations.push('Slow strategy prioritizes cost over speed')
        break

      case GasStrategy.ECONOMICAL:
        gasPrice = this.calculateEconomicalGasPrice(currentPrices, urgency, congestion)
        maxFeePerGas = this.calculateMaxFeePerGas(gasPrice, urgency, congestion)
        recommendations.push('Economical strategy balances cost and speed')
        break

      default: // STANDARD
        gasPrice = this.calculateStandardGasPrice(currentPrices, urgency, congestion)
        maxFeePerGas = this.calculateMaxFeePerGas(gasPrice, urgency, congestion)
        recommendations.push('Standard strategy provides balanced approach')
        break
    }

    // Adjust for urgency
    if (urgency === 'high') {
      gasPrice = this.adjustGasPriceForUrgency(gasPrice, 'high')
      maxFeePerGas = this.adjustMaxFeeForUrgency(maxFeePerGas, 'high')
      recommendations.push('High urgency applied - increased gas price')
    } else if (urgency === 'low') {
      gasPrice = this.adjustGasPriceForUrgency(gasPrice, 'low')
      maxFeePerGas = this.adjustMaxFeeForUrgency(maxFeePerGas, 'low')
      recommendations.push('Low urgency applied - reduced gas price')
    }

    // Adjust for congestion
    if (congestion === 'high') {
      gasPrice = this.adjustGasPriceForCongestion(gasPrice, 'high')
      maxFeePerGas = this.adjustMaxFeeForCongestion(maxFeePerGas, 'high')
      recommendations.push('High congestion detected - increased gas price')
    } else if (congestion === 'low') {
      gasPrice = this.adjustGasPriceForCongestion(gasPrice, 'low')
      maxFeePerGas = this.adjustMaxFeeForCongestion(maxFeePerGas, 'low')
      recommendations.push('Low congestion detected - reduced gas price')
    }

    // Calculate gas limit if transaction data provided
    let gasLimit = '21000' // Default
    if (transactionData) {
      gasLimit = await this.estimateGasLimit(transactionData)
    }

    const totalCost = (parseFloat(gasPrice) * parseInt(gasLimit)).toString()
    const estimatedTime = this.estimateConfirmationTime(gasPrice, gasLimit, congestion)

    return {
      strategy,
      gasPrice,
      gasLimit,
      maxFeePerGas,
      totalCost,
      estimatedTime,
      confidence: this.calculateConfidence(currentPrices, gasPrice, congestion),
      recommendations
    }
  }

  // Calculate fast gas price
  private calculateFastGasPrice(
    currentPrices: GasPriceData,
    urgency: 'low' | 'medium' | 'high',
    congestion: 'low' | 'medium' | 'high'
  ): string {
    let multiplier = 1.5

    if (urgency === 'high') multiplier = 2.0
    if (congestion === 'high') multiplier = 2.5

    return (parseFloat(currentPrices.gasPrice) * multiplier).toString()
  }

  // Calculate slow gas price
  private calculateSlowGasPrice(
    currentPrices: GasPriceData,
    urgency: 'low' | 'medium' | 'high',
    congestion: 'low' | 'medium' | 'high'
  ): string {
    let multiplier = 0.8

    if (urgency === 'low') multiplier = 0.6
    if (congestion === 'low') multiplier = 0.7

    return (parseFloat(currentPrices.gasPrice) * multiplier).toString()
  }

  // Calculate economical gas price
  private calculateEconomicalGasPrice(
    currentPrices: GasPriceData,
    urgency: 'low' | 'medium' | 'high',
    congestion: 'low' | 'medium' | 'high'
  ): string {
    // Use current gas price with minimal adjustments
    let adjustment = 1.0

    if (urgency === 'high') adjustment = 1.1
    if (congestion === 'high') adjustment = 1.2

    return (parseFloat(currentPrices.gasPrice) * adjustment).toString()
  }

  // Calculate standard gas price
  private calculateStandardGasPrice(
    currentPrices: GasPriceData,
    urgency: 'low' | 'medium' | 'high',
    congestion: 'low' | 'medium' | 'high'
  ): string {
    let adjustment = 1.0

    if (urgency === 'high') adjustment = 1.2
    if (urgency === 'low') adjustment = 0.9
    if (congestion === 'high') adjustment = 1.1

    return (parseFloat(currentPrices.gasPrice) * adjustment).toString()
  }

  // Calculate max fee per gas
  private calculateMaxFeePerGas(
    gasPrice: string,
    urgency: 'low' | 'medium' | 'high',
    congestion: 'low' | 'medium' | 'high'
  ): string {
    let multiplier = 1.0

    if (urgency === 'high') multiplier = 1.5
    if (congestion === 'high') multiplier = 2.0

    return (parseFloat(gasPrice) * multiplier).toString()
  }

  // Adjust gas price for urgency
  private adjustGasPriceForUrgency(gasPrice: string, urgency: 'low' | 'medium' | 'high'): string {
    const multiplier = urgency === 'high' ? 1.3 : urgency === 'low' ? 0.8 : 1.0
    return (parseFloat(gasPrice) * multiplier).toString()
  }

  // Adjust max fee per gas for urgency
  private adjustMaxFeeForUrgency(maxFeePerGas: string, urgency: 'low' | 'medium' | 'high'): string {
    const multiplier = urgency === 'high' ? 1.5 : urgency === 'low' ? 0.8 : 1.0
    return (parseFloat(maxFeePerGas) * multiplier).toString()
  }

  // Adjust gas price for congestion
  private adjustGasPriceForCongestion(gasPrice: string, congestion: 'low' | 'medium' | 'high'): string {
    const multiplier = congestion === 'high' ? 1.3 : congestion === 'low' ? 0.8 : 1.0
    return (parseFloat(gasPrice) * multiplier).toString()
  }

  // Adjust max fee per gas for congestion
  private adjustMaxFeeForCongestion(maxFeePerGas: string, congestion: 'low' | 'medium' | 'high'): string {
    const multiplier = congestion === 'high' ? 1.5 : congestion === 'low' ? 0.8 : 1.0
    return (parseFloat(maxFeePerGas) * multiplier).toString()
  }

  // Estimate gas limit
  private async estimateGasLimit(transactionData: {
    to: string
    value: string
    data: string
    gasLimit?: string
  }): Promise<string> {
    // This would estimate gas limit based on transaction data
    // For now, return a calculated estimate
    let baseLimit = 21000

    // Adjust for complex transactions
    if (transactionData.data && transactionData.data.length > 1000) {
      baseLimit = 50000
    }

    // Adjust for high value transactions
    if (transactionData.value) {
      const valueEth = parseFloat(transactionData.value)
      if (valueEth > 10) {
        baseLimit = 100000
      }
    }

    return baseLimit.toString()
  }

  // Estimate confirmation time
  private estimateConfirmationTime(
    gasPrice: string,
    gasLimit: string,
    congestion: 'low' | 'medium' | 'high'
  ): number {
    const baseTime = 120 // 2 minutes base time
    const gasPriceFloat = parseFloat(gasPrice)
    const gasLimitInt = parseInt(gasLimit)

    // Adjust for gas price
    let timeMultiplier = 1.0
    if (gasPriceFloat > 10000000000) timeMultiplier = 0.5
    if (gasPriceFloat > 50000000000) timeMultiplier = 0.3

    // Adjust for gas limit
    if (gasLimitInt > 50000) timeMultiplier = 1.5

    // Adjust for congestion
    if (congestion === 'high') timeMultiplier = 2.0
    if (congestion === 'low') timeMultiplier = 0.8

    return Math.round(baseTime * timeMultiplier)
  }

  // Calculate confidence
  private calculateConfidence(
    currentPrices: GasPriceData[],
    gasPrice: string,
    congestion: 'low' | 'medium' | 'high'
  ): number {
    const history = this.gasPriceHistory.get(currentPrices.chainId) || []
    
    if (history.length < this.minHistorySize) {
      return 0.5 // Low confidence with limited data
    }

    // Calculate price stability
    const recentPrices = history.slice(-20)
    const avgPrice = recentPrices.reduce((sum, p) => sum + parseFloat(p.gasPrice), 0) / recentPrices.length
    const priceDeviation = Math.sqrt(
      recentPrices.reduce((sum, p) => sum + Math.pow(parseFloat(p.gasPrice) - avgPrice, 2), 0) / recentPrices.length
    )

    // Calculate confidence based on deviation and congestion
    let confidence = 0.8 // Base confidence
    if (priceDeviation > parseFloat(avgPrice) * 0.1) confidence -= 0.2
    if (congestion === 'high') confidence -= 0.3
    if (congestion === 'low') confidence += 0.1

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Cache gas price data
  private cacheGasPriceData(chainId: number, gasPriceData: GasPriceData): void {
    if (!this.gasPriceHistory.has(chainId)) {
      this.gasPriceHistory.set(chainId, [])
    }

    const history = this.gasPriceHistory.get(chainId)!
    history.unshift(gasPriceData)

    // Maintain history size
    if (history.length > this.maxHistorySize) {
      history.splice(this.maxHistorySize)
    }

    this.gasPriceHistory.set(chainId, history)
  }

  // Start optimization intervals
  private startOptimizationIntervals(): void {
    // Update gas prices
    setInterval(async () => {
      await this.updateAllGasPrices()
    }, this.optimizationInterval)

    // Clean old data
    setInterval(() => {
      this.cleanOldGasPriceData()
    }, 60000) // Every minute

    // Analyze network congestion
    setInterval(() => {
      this.analyzeAllNetworkCongestion()
    }, 60000) // Every minute
  }

    // Update all gas prices
  private async updateAllGasPrices(): Promise<void> {
    const chains = [1, 137, 56, 43114] // Ethereum, Polygon, BSC, Avalanche

    for (const chainId of chains) {
      try {
        const gasPriceData = await this.getCurrentGasPrices(chainId)
        this.cacheGasPriceData(chainId, gasPriceData)
        this.networkCongestion.set(chainId, this.analyzeNetworkCongestion(chainId))
      } catch (error) {
        this.logger.error(`Failed to update gas price for chain ${chainId}:`, error)
      }
    }
  }

  // Analyze all network congestion
  private async analyzeAllNetworkCongestion(): Promise<void> {
    const chains = [1, 137, 56, 43114]

    for (const chainId of chains) {
      try {
        const congestion = this.analyzeNetworkCongestion(chainId)
        this.networkCongestion.set(chainId, congestion)
      } catch (error) {
        this.logger.error(`Failed to analyze congestion for chain ${chainId}:`, error)
      }
    }
  }

  // Clean old gas price data
  private cleanOldGasPriceData(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    for (const [chainId, history] of this.gasPriceHistory.entries()) {
      const filteredHistory = history.filter(data => data.timestamp > cutoff)
      if (filteredHistory.length < history.length) {
        this.gasPriceHistory.set(chainId, filteredHistory)
      }
    }
  }

  // Load gas price history
  private async loadGasPriceHistory(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading gas price history...')
  }

  // Save gas price history
  private async saveGasPriceHistory(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving gas price history...')
  }

  // Get gas price history
  getGasPriceHistory(chainId?: number): Map<number, GasPriceData[]> {
    if (chainId) {
      return this.gasPriceHistory.get(chainId) || new Map()
    }
    return this.gasPriceHistory
  }

  // Get optimization statistics
  getOptimizationStatistics(): {
    totalChains: number
    averageGasPrice: string
    totalOptimizations: number
    averageSavings: string
    networkCongestion: Record<number, 'low' | 'medium' | 'high'>
    lastOptimization: Date
  } {
    const chains = Array.from(this.gasPriceHistory.keys())
    const allPrices: GasPriceData[] = []

    for (const [chainId, history] of this.gasPriceHistory.entries()) {
      allPrices.push(...history)
    }

    const averageGasPrice = allPrices.length > 0
      ? (allPrices.reduce((sum, p) => sum + parseFloat(p.gasPrice), 0) / allPrices.length).toFixed(2)
      : '0.00'

    const totalOptimizations = allPrices.length

    // Calculate average savings (mock calculation)
    const averageSavings = '15.5' // Mock average savings percentage

    const networkCongestion: Record<number, 'low' | 'medium' | 'high'> = {}
    for (const chainId of chains) {
      networkCongestion[chainId] = this.networkCongestion.get(chainId) || 'medium'
    }

    return {
      totalChains: chains.length,
      averageGasPrice,
      totalOptimizations,
      averageSavings,
      networkCongestion,
      lastOptimization: new Date()
    }
  }

  // Get gas price recommendations
  getGasPriceRecommendations(chainId: number): string[] {
    const history = this.gasPriceHistory.get(chainId) || []
    const congestion = this.networkCongestion.get(chainId) || 'medium'
    const recommendations: string[] = []

    if (history.length === 0) {
      recommendations.push('No historical data available')
      return recommendations
    }

    const latestData = history[0]
    const avgPrice = history.reduce((sum, p) => sum + parseFloat(p.gasPrice), 0) / history.length

    // Price analysis
    if (parseFloat(latestData.gasPrice) > parseFloat(avgPrice) * 1.2) {
      recommendations.push('Gas price is high - consider waiting for lower prices')
    } else if (parseFloat(latestData.gasPrice) < parseFloat(avgPrice) * 0.8) {
      recommendations.push('Gas price is low - good time to transact')
    }

    // Congestion analysis
    if (congestion === 'high') {
      recommendations.push('Network is congested - consider increasing gas price or delaying transaction')
    } else if (congestion === 'low') {
      recommendations.push('Network is clear - current gas prices are optimal')
    }

    return recommendations
  }

  // Export optimization data
  exportOptimizationData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      statistics: this.getOptimizationStatistics(),
      gasPriceHistory: Object.fromEntries(this.gasPriceHistory.entries()),
      networkCongestion: Object.fromEntries(this.networkCongestion.entries())
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['timestamp', 'chainId', 'gasPrice', 'baseFee', 'priorityFee', 'maxFeePerGas', 'networkCongestion']
      const csvRows = [headers.join(',')]
      
      for (const [chainId, history] of this.gasPriceHistory.entries()) {
        for (const data of history.slice(0, 10)) {
          csvRows.push([
            data.timestamp.toISOString(),
            chainId.toString(),
            data.gasPrice,
            data.baseFee,
            data.priorityFee,
            data.maxFeePerGas,
            data.networkCongestion
          ])
        }
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isOptimizing: boolean
    uptime: number
    totalChains: number
    lastUpdate: Date
    metrics: any
  } {
    return {
      isOptimizing: this.isOptimizing,
      uptime: process.uptime(),
      totalChains: this.gasPriceHistory.size,
      lastUpdate: new Date(),
      metrics: this.getOptimizationStatistics()
    }
  }
}

export default GasOptimizer
