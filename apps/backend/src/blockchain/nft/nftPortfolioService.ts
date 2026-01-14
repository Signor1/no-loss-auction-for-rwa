import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import NFTAnalyticsService from './nftAnalyticsService'
import CrossMarketplaceService from './crossMarketplaceService'
import logger from '../../utils/logger'

// Portfolio interfaces
export interface NFTPosition {
  id: string
  contractAddress: string
  tokenId: string
  name: string
  imageUrl: string
  acquisitionDate: Date
  acquisitionPrice: string
  acquisitionCurrency: string
  currentValue: string
  unrealizedGain: string
  unrealizedGainPercent: number
  holdingPeriod: number // days
  marketplace: string
  rarity: number
  traits: Record<string, any>
  tags: string[]
  notes?: string
}

export interface PortfolioSummary {
  ownerAddress: string
  totalValue: string
  totalNFTs: number
  uniqueCollections: number
  averageHoldingPeriod: number
  totalUnrealizedGains: string
  totalRealizedGains: string
  bestPerformer: NFTPosition | null
  worstPerformer: NFTPosition | null
  riskScore: number
  diversificationScore: number
  performanceMetrics: {
    dailyChange: number
    weeklyChange: number
    monthlyChange: number
    allTimeChange: number
  }
  collectionBreakdown: Array<{
    contractAddress: string
    name: string
    count: number
    value: string
    percentage: number
  }>
}

export interface PortfolioAlert {
  id: string
  type: 'price' | 'floor' | 'listing' | 'offer' | 'risk' | 'opportunity'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  contractAddress?: string
  tokenId?: string
  threshold?: number
  currentValue?: number
  timestamp: Date
  actionable: boolean
}

export interface PortfolioStrategy {
  id: string
  name: string
  description: string
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  targetAllocations: Record<string, number> // collection -> percentage
  rebalanceThreshold: number
  autoRebalance: boolean
  maxHoldingsPerCollection: number
  minHoldingPeriod: number // days
  stopLossThreshold: number
  takeProfitThreshold: number
}

export interface RebalanceAction {
  action: 'buy' | 'sell' | 'hold'
  contractAddress: string
  tokenId: string
  reason: string
  expectedImpact: {
    valueChange: string
    diversificationChange: number
    riskChange: number
  }
  urgency: 'low' | 'medium' | 'high'
}

/**
 * NFT Portfolio Management Service
 * Comprehensive portfolio tracking, analysis, and automated management
 */
export class NFTPortfolioService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private analyticsService: NFTAnalyticsService
  private marketplaceService: CrossMarketplaceService
  private portfolios: Map<string, NFTPosition[]> = new Map()
  private alerts: Map<string, PortfolioAlert[]> = new Map()
  private strategies: Map<string, PortfolioStrategy> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    analyticsService: NFTAnalyticsService,
    marketplaceService: CrossMarketplaceService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.analyticsService = analyticsService
    this.marketplaceService = marketplaceService
    this.logger = loggerInstance
  }

  // ============ PORTFOLIO TRACKING ============

  /**
   * Add NFT to portfolio
   */
  async addPosition(
    ownerAddress: string,
    contractAddress: string,
    tokenId: string,
    acquisitionPrice: string,
    acquisitionCurrency: string,
    acquisitionDate?: Date,
    tags: string[] = []
  ): Promise<NFTPosition> {
    try {
      // Get current NFT data
      const valuation = await this.analyticsService.getNFTValuation(contractAddress, tokenId)

      const position: NFTPosition = {
        id: `${ownerAddress}-${contractAddress}-${tokenId}`,
        contractAddress,
        tokenId,
        name: `Token #${tokenId}`, // Would get from analytics
        imageUrl: '', // Would get from analytics
        acquisitionDate: acquisitionDate || new Date(),
        acquisitionPrice,
        acquisitionCurrency,
        currentValue: valuation.estimatedValue,
        unrealizedGain: (parseFloat(valuation.estimatedValue) - parseFloat(acquisitionPrice)).toString(),
        unrealizedGainPercent: ((parseFloat(valuation.estimatedValue) - parseFloat(acquisitionPrice)) / parseFloat(acquisitionPrice)) * 100,
        holdingPeriod: Math.floor((Date.now() - (acquisitionDate?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)),
        marketplace: 'unknown', // Would track acquisition marketplace
        rarity: valuation.rarityScore,
        traits: {}, // Would get from analytics
        tags
      }

      // Add to portfolio
      if (!this.portfolios.has(ownerAddress)) {
        this.portfolios.set(ownerAddress, [])
      }
      this.portfolios.get(ownerAddress)!.push(position)

      this.emit('position:added', { ownerAddress, position })

      return position
    } catch (error) {
      this.logger.error(`Failed to add position for ${ownerAddress}:`, error)
      throw error
    }
  }

  /**
   * Remove NFT from portfolio (sold)
   */
  async removePosition(
    ownerAddress: string,
    contractAddress: string,
    tokenId: string,
    salePrice: string,
    saleCurrency: string
  ): Promise<{
    position: NFTPosition
    realizedGain: string
    realizedGainPercent: number
  }> {
    try {
      const positions = this.portfolios.get(ownerAddress) || []
      const positionIndex = positions.findIndex(
        p => p.contractAddress === contractAddress && p.tokenId === tokenId
      )

      if (positionIndex === -1) {
        throw new Error(`Position not found: ${contractAddress}/${tokenId}`)
      }

      const position = positions[positionIndex]

      // Calculate realized gain
      const realizedGain = (parseFloat(salePrice) - parseFloat(position.acquisitionPrice)).toString()
      const realizedGainPercent = (parseFloat(realizedGain) / parseFloat(position.acquisitionPrice)) * 100

      // Remove from portfolio
      positions.splice(positionIndex, 1)

      this.emit('position:removed', {
        ownerAddress,
        position,
        salePrice,
        saleCurrency,
        realizedGain,
        realizedGainPercent
      })

      return {
        position,
        realizedGain,
        realizedGainPercent
      }
    } catch (error) {
      this.logger.error(`Failed to remove position for ${ownerAddress}:`, error)
      throw error
    }
  }

  /**
   * Update position values
   */
  async updatePositionValues(ownerAddress: string): Promise<void> {
    try {
      const positions = this.portfolios.get(ownerAddress) || []

      for (const position of positions) {
        try {
          const valuation = await this.analyticsService.getNFTValuation(
            position.contractAddress,
            position.tokenId
          )

          position.currentValue = valuation.estimatedValue
          position.unrealizedGain = (parseFloat(valuation.estimatedValue) - parseFloat(position.acquisitionPrice)).toString()
          position.unrealizedGainPercent = (parseFloat(position.unrealizedGain) / parseFloat(position.acquisitionPrice)) * 100
          position.holdingPeriod = Math.floor((Date.now() - position.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24))

        } catch (error) {
          this.logger.error(`Failed to update position ${position.id}:`, error)
        }
      }

      this.emit('portfolio:updated', { ownerAddress, positions })
    } catch (error) {
      this.logger.error(`Failed to update position values for ${ownerAddress}:`, error)
      throw error
    }
  }

  // ============ PORTFOLIO ANALYSIS ============

  /**
   * Get comprehensive portfolio summary
   */
  async getPortfolioSummary(ownerAddress: string): Promise<PortfolioSummary> {
    try {
      await this.updatePositionValues(ownerAddress)

      const positions = this.portfolios.get(ownerAddress) || []

      if (positions.length === 0) {
        return {
          ownerAddress,
          totalValue: '0',
          totalNFTs: 0,
          uniqueCollections: 0,
          averageHoldingPeriod: 0,
          totalUnrealizedGains: '0',
          totalRealizedGains: '0', // Would need sale tracking
          bestPerformer: null,
          worstPerformer: null,
          riskScore: 0,
          diversificationScore: 0,
          performanceMetrics: {
            dailyChange: 0,
            weeklyChange: 0,
            monthlyChange: 0,
            allTimeChange: 0
          },
          collectionBreakdown: []
        }
      }

      // Calculate totals
      const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.currentValue), 0).toString()
      const totalUnrealizedGains = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealizedGain), 0).toString()

      // Unique collections
      const uniqueCollections = new Set(positions.map(p => p.contractAddress)).size

      // Average holding period
      const averageHoldingPeriod = positions.reduce((sum, pos) => sum + pos.holdingPeriod, 0) / positions.length

      // Find best and worst performers
      const sortedByGain = positions.sort((a, b) => b.unrealizedGainPercent - a.unrealizedGainPercent)
      const bestPerformer = sortedByGain[0]
      const worstPerformer = sortedByGain[sortedByGain.length - 1]

      // Calculate diversification score (0-100)
      const diversificationScore = Math.min(uniqueCollections * 20, 100)

      // Calculate risk score based on portfolio composition and volatility
      const riskScore = this.calculateRiskScore(positions)

      // Collection breakdown
      const collectionMap = new Map<string, { count: number; value: number; name: string }>()
      for (const position of positions) {
        const existing = collectionMap.get(position.contractAddress) || { count: 0, value: 0, name: position.name }
        existing.count++
        existing.value += parseFloat(position.currentValue)
        collectionMap.set(position.contractAddress, existing)
      }

      const collectionBreakdown = Array.from(collectionMap.entries()).map(([contractAddress, data]) => ({
        contractAddress,
        name: data.name,
        count: data.count,
        value: data.value.toString(),
        percentage: (data.value / parseFloat(totalValue)) * 100
      }))

      return {
        ownerAddress,
        totalValue,
        totalNFTs: positions.length,
        uniqueCollections,
        averageHoldingPeriod,
        totalUnrealizedGains,
        totalRealizedGains: '0', // Would need sale tracking
        bestPerformer,
        worstPerformer,
        riskScore,
        diversificationScore,
        performanceMetrics: await this.calculatePerformanceMetrics(ownerAddress),
        collectionBreakdown
      }
    } catch (error) {
      this.logger.error(`Failed to get portfolio summary for ${ownerAddress}:`, error)
      throw error
    }
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(positions: NFTPosition[]): number {
    try {
      if (positions.length === 0) return 0

      let riskScore = 0

      // Factor in concentration risk
      const collectionCounts = new Map<string, number>()
      for (const position of positions) {
        collectionCounts.set(position.contractAddress,
          (collectionCounts.get(position.contractAddress) || 0) + 1)
      }

      const maxConcentration = Math.max(...Array.from(collectionCounts.values()))
      const concentrationRisk = (maxConcentration / positions.length) * 50
      riskScore += concentrationRisk

      // Factor in volatility (simplified)
      const avgVolatility = positions.reduce((sum, pos) => sum + (pos.rarity || 50), 0) / positions.length
      riskScore += (avgVolatility / 2) // Scale to 0-50

      return Math.min(riskScore, 100)
    } catch (error) {
      this.logger.error('Failed to calculate risk score:', error)
      return 50 // Neutral score
    }
  }

  /**
   * Calculate performance metrics
   */
  private async calculatePerformanceMetrics(ownerAddress: string): Promise<{
    dailyChange: number
    weeklyChange: number
    monthlyChange: number
    allTimeChange: number
  }> {
    try {
      // Simplified implementation - would need historical portfolio values
      return {
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        allTimeChange: 0
      }
    } catch (error) {
      this.logger.error('Failed to calculate performance metrics:', error)
      return {
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0,
        allTimeChange: 0
      }
    }
  }

  // ============ ALERTS & MONITORING ============

  /**
   * Create portfolio alert
   */
  createAlert(
    ownerAddress: string,
    alert: Omit<PortfolioAlert, 'id' | 'timestamp'>
  ): PortfolioAlert {
    const portfolioAlert: PortfolioAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    if (!this.alerts.has(ownerAddress)) {
      this.alerts.set(ownerAddress, [])
    }
    this.alerts.get(ownerAddress)!.push(portfolioAlert)

    this.emit('alert:created', { ownerAddress, alert: portfolioAlert })

    return portfolioAlert
  }

  /**
   * Get active alerts
   */
  getAlerts(ownerAddress: string): PortfolioAlert[] {
    return this.alerts.get(ownerAddress) || []
  }

  /**
   * Check and trigger alerts
   */
  async checkAlerts(ownerAddress: string): Promise<PortfolioAlert[]> {
    try {
      const alerts = this.alerts.get(ownerAddress) || []
      const triggeredAlerts: PortfolioAlert[] = []

      for (const alert of alerts) {
        const triggered = await this.evaluateAlert(ownerAddress, alert)
        if (triggered) {
          triggeredAlerts.push(alert)
          this.emit('alert:triggered', { ownerAddress, alert })
        }
      }

      return triggeredAlerts
    } catch (error) {
      this.logger.error(`Failed to check alerts for ${ownerAddress}:`, error)
      return []
    }
  }

  /**
   * Evaluate if an alert should trigger
   */
  private async evaluateAlert(ownerAddress: string, alert: PortfolioAlert): Promise<boolean> {
    try {
      switch (alert.type) {
        case 'price':
          if (alert.contractAddress && alert.tokenId && alert.threshold) {
            const valuation = await this.analyticsService.getNFTValuation(alert.contractAddress, alert.tokenId)
            const currentPrice = parseFloat(valuation.estimatedValue)

            // Check if price crossed threshold
            return alert.currentValue ?
              (alert.currentValue < alert.threshold && currentPrice >= alert.threshold) ||
              (alert.currentValue > alert.threshold && currentPrice <= alert.threshold) :
              false
          }
          break

        case 'floor':
          if (alert.contractAddress && alert.threshold) {
            const floorPrice = await this.analyticsService.getCollectionAnalytics(alert.contractAddress)
            const currentFloor = parseFloat(floorPrice.floorPrice)

            return alert.currentValue ?
              (alert.currentValue < alert.threshold && currentFloor >= alert.threshold) ||
              (alert.currentValue > alert.threshold && currentFloor <= alert.threshold) :
              false
          }
          break

        case 'risk':
          if (alert.threshold) {
            const summary = await this.getPortfolioSummary(ownerAddress)
            return summary.riskScore >= alert.threshold
          }
          break
      }

      return false
    } catch (error) {
      this.logger.error(`Failed to evaluate alert ${alert.id}:`, error)
      return false
    }
  }

  // ============ STRATEGY MANAGEMENT ============

  /**
   * Create portfolio strategy
   */
  createStrategy(ownerAddress: string, strategy: Omit<PortfolioStrategy, 'id'>): PortfolioStrategy {
    const portfolioStrategy: PortfolioStrategy = {
      ...strategy,
      id: `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    this.strategies.set(ownerAddress, portfolioStrategy)

    this.emit('strategy:created', { ownerAddress, strategy: portfolioStrategy })

    return portfolioStrategy
  }

  /**
   * Get portfolio strategy
   */
  getStrategy(ownerAddress: string): PortfolioStrategy | null {
    return this.strategies.get(ownerAddress) || null
  }

  /**
   * Analyze rebalancing needs
   */
  async analyzeRebalancing(ownerAddress: string): Promise<RebalanceAction[]> {
    try {
      const strategy = this.strategies.get(ownerAddress)
      if (!strategy) {
        return []
      }

      const summary = await this.getPortfolioSummary(ownerAddress)
      const actions: RebalanceAction[] = []

      // Check collection allocations
      for (const [contractAddress, targetAllocation] of Object.entries(strategy.targetAllocations)) {
        const collection = summary.collectionBreakdown.find(c => c.contractAddress === contractAddress)
        const currentAllocation = collection ? collection.percentage / 100 : 0
        const deviation = Math.abs(currentAllocation - targetAllocation)

        if (deviation > strategy.rebalanceThreshold / 100) {
          if (currentAllocation > targetAllocation) {
            // Need to reduce position
            actions.push({
              action: 'sell',
              contractAddress,
              tokenId: '', // Would need to select specific token
              reason: `Over-allocated (${(currentAllocation * 100).toFixed(1)}% vs target ${(targetAllocation * 100).toFixed(1)}%)`,
              expectedImpact: {
                valueChange: '0', // Would calculate
                diversificationChange: -deviation * 10,
                riskChange: -deviation * 5
              },
              urgency: deviation > 0.2 ? 'high' : deviation > 0.1 ? 'medium' : 'low'
            })
          } else {
            // Need to increase position
            actions.push({
              action: 'buy',
              contractAddress,
              tokenId: '', // Would need to find suitable token
              reason: `Under-allocated (${(currentAllocation * 100).toFixed(1)}% vs target ${(targetAllocation * 100).toFixed(1)}%)`,
              expectedImpact: {
                valueChange: '0', // Would calculate
                diversificationChange: deviation * 10,
                riskChange: deviation * 5
              },
              urgency: deviation > 0.2 ? 'high' : deviation > 0.1 ? 'medium' : 'low'
            })
          }
        }
      }

      // Check position limits
      for (const collection of summary.collectionBreakdown) {
        if (collection.count > strategy.maxHoldingsPerCollection) {
          actions.push({
            action: 'sell',
            contractAddress: collection.contractAddress,
            tokenId: '', // Would need to select specific token
            reason: `Exceeds max holdings per collection (${collection.count} > ${strategy.maxHoldingsPerCollection})`,
            expectedImpact: {
              valueChange: '0',
              diversificationChange: 5,
              riskChange: -5
            },
            urgency: 'medium'
          })
        }
      }

      return actions
    } catch (error) {
      this.logger.error(`Failed to analyze rebalancing for ${ownerAddress}:`, error)
      return []
    }
  }

  // ============ AUTOMATED MONITORING ============

  /**
   * Start automated portfolio monitoring
   */
  startMonitoring(ownerAddress: string, intervalMinutes: number = 60): void {
    // Clear existing interval
    const existingInterval = this.monitoringIntervals.get(ownerAddress)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Start new monitoring interval
    const interval = setInterval(async () => {
      try {
        await this.updatePositionValues(ownerAddress)
        await this.checkAlerts(ownerAddress)

        // Check strategy rebalancing if enabled
        const strategy = this.strategies.get(ownerAddress)
        if (strategy?.autoRebalance) {
          const actions = await this.analyzeRebalancing(ownerAddress)
          if (actions.some(a => a.urgency === 'high')) {
            this.emit('rebalance:needed', { ownerAddress, actions })
          }
        }
      } catch (error) {
        this.logger.error(`Error in automated monitoring for ${ownerAddress}:`, error)
      }
    }, intervalMinutes * 60 * 1000)

    this.monitoringIntervals.set(ownerAddress, interval)
    this.logger.info(`Started monitoring for ${ownerAddress} (every ${intervalMinutes} minutes)`)
  }

  /**
   * Stop automated monitoring
   */
  stopMonitoring(ownerAddress: string): void {
    const interval = this.monitoringIntervals.get(ownerAddress)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(ownerAddress)
      this.logger.info(`Stopped monitoring for ${ownerAddress}`)
    }
  }

  // ============ PORTFOLIO REPORTING ============

  /**
   * Generate portfolio report
   */
  async generateReport(ownerAddress: string): Promise<{
    summary: PortfolioSummary
    alerts: PortfolioAlert[]
    recommendations: RebalanceAction[]
    performance: any
    holdings: NFTPosition[]
  }> {
    try {
      const [summary, alerts, recommendations] = await Promise.all([
        this.getPortfolioSummary(ownerAddress),
        Promise.resolve(this.getAlerts(ownerAddress)),
        this.analyzeRebalancing(ownerAddress)
      ])

      const holdings = this.portfolios.get(ownerAddress) || []

      return {
        summary,
        alerts,
        recommendations,
        performance: summary.performanceMetrics,
        holdings
      }
    } catch (error) {
      this.logger.error(`Failed to generate report for ${ownerAddress}:`, error)
      throw error
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get positions for owner
   */
  getPositions(ownerAddress: string): NFTPosition[] {
    return this.portfolios.get(ownerAddress) || []
  }

  /**
   * Get position by ID
   */
  getPosition(ownerAddress: string, positionId: string): NFTPosition | null {
    const positions = this.portfolios.get(ownerAddress) || []
    return positions.find(p => p.id === positionId) || null
  }

  /**
   * Update position tags
   */
  updatePositionTags(ownerAddress: string, positionId: string, tags: string[]): boolean {
    try {
      const position = this.getPosition(ownerAddress, positionId)
      if (position) {
        position.tags = tags
        this.emit('position:updated', { ownerAddress, position })
        return true
      }
      return false
    } catch (error) {
      this.logger.error(`Failed to update tags for position ${positionId}:`, error)
      return false
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
        activePortfolios: this.portfolios.size,
        activeStrategies: this.strategies.size,
        monitoringIntervals: this.monitoringIntervals.size,
        totalAlerts: Array.from(this.alerts.values()).flat().length
      }
    }
  }

  /**
   * Clear all data for owner
   */
  clearOwnerData(ownerAddress: string): void {
    this.portfolios.delete(ownerAddress)
    this.alerts.delete(ownerAddress)
    this.strategies.delete(ownerAddress)
    this.stopMonitoring(ownerAddress)
    this.logger.info(`Cleared all data for ${ownerAddress}`)
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.portfolios.clear()
    this.alerts.clear()
    this.strategies.clear()

    for (const [ownerAddress] of this.monitoringIntervals) {
      this.stopMonitoring(ownerAddress)
    }

    this.logger.info('All portfolio data cleared')
  }
}

export default NFTPortfolioService
