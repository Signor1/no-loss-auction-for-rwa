import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import CrossMarketplaceService from './crossMarketplaceService'
import NFTAnalyticsService from './nftAnalyticsService'
import NFTPortfolioService from './nftPortfolioService'
import logger from '../../utils/logger'

// Trading automation interfaces
export interface TradingRule {
  id: string
  name: string
  description: string
  type: 'buy' | 'sell' | 'swap' | 'rebalance'
  conditions: TradingCondition[]
  actions: TradingAction[]
  enabled: boolean
  priority: number
  cooldownPeriod: number // minutes
  maxExecutionsPerDay: number
  lastExecuted?: Date
  executionCount: number
  successRate: number
  totalProfit: string
}

export interface TradingCondition {
  type: 'price' | 'floor_price' | 'volume' | 'rarity' | 'time' | 'portfolio' | 'market_sentiment'
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'contains'
  value: any
  contractAddress?: string
  tokenId?: string
}

export interface TradingAction {
  type: 'buy' | 'sell' | 'list' | 'unlist' | 'offer' | 'cancel_offer' | 'alert' | 'rebalance'
  parameters: Record<string, any>
  marketplace?: 'opensea' | 'zora' | 'auto'
  maxSlippage?: number
  priority?: 'low' | 'medium' | 'high'
}

export interface TradingOpportunity {
  id: string
  type: 'arbitrage' | 'flip' | 'momentum' | 'mean_reversion' | 'yield' | 'risk_parity'
  contractAddress: string
  tokenId?: string
  expectedReturn: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
  timeHorizon: 'short' | 'medium' | 'long'
  reasoning: string[]
  suggestedAction: TradingAction
  marketData: {
    floorPrice: string
    lastSalePrice?: string
    volume24h: string
    listingsCount: number
    offersCount: number
  }
}

export interface ArbitrageOpportunity {
  buyMarketplace: string
  sellMarketplace: string
  contractAddress: string
  tokenId: string
  buyPrice: string
  sellPrice: string
  profit: string
  profitPercent: number
  gasCost: string
  netProfit: string
  executionTime: number // seconds
  riskLevel: 'low' | 'medium' | 'high'
}

export interface FlipOpportunity {
  contractAddress: string
  tokenId: string
  acquisitionPrice: string
  estimatedSalePrice: string
  expectedProfit: string
  profitMargin: number
  holdingPeriod: number // days
  marketConditions: {
    floorPrice: string
    volume24h: string
    momentum: 'bullish' | 'bearish' | 'neutral'
  }
  riskFactors: string[]
}

export interface AutomatedTrade {
  id: string
  ruleId: string
  type: 'buy' | 'sell' | 'list' | 'offer'
  contractAddress: string
  tokenId?: string
  price: string
  marketplace: string
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'
  actionType?: string // For additional action types
  transactionHash?: string
  executedAt?: Date
  profit?: string
  gasCost?: string
  error?: string
  metadata: Record<string, any>
}

/**
 * NFT Trading Automation Service
 * Intelligent automated trading strategies and execution for NFT marketplaces
 */
export class NFTTradingAutomationService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private marketplaceService: CrossMarketplaceService
  private analyticsService: NFTAnalyticsService
  private portfolioService: NFTPortfolioService
  private tradingRules: Map<string, TradingRule[]> = new Map()
  private activeTrades: Map<string, AutomatedTrade[]> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  private opportunityCache: Map<string, TradingOpportunity[]> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    marketplaceService: CrossMarketplaceService,
    analyticsService: NFTAnalyticsService,
    portfolioService: NFTPortfolioService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.marketplaceService = marketplaceService
    this.analyticsService = analyticsService
    this.portfolioService = portfolioService
    this.logger = loggerInstance
  }

  // ============ RULE MANAGEMENT ============

  /**
   * Create trading rule
   */
  createRule(ownerAddress: string, rule: Omit<TradingRule, 'id' | 'executionCount' | 'successRate' | 'totalProfit'>): TradingRule {
    const tradingRule: TradingRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      executionCount: 0,
      successRate: 0,
      totalProfit: '0'
    }

    if (!this.tradingRules.has(ownerAddress)) {
      this.tradingRules.set(ownerAddress, [])
    }
    this.tradingRules.get(ownerAddress)!.push(tradingRule)

    this.emit('rule:created', { ownerAddress, rule: tradingRule })

    return tradingRule
  }

  /**
   * Update trading rule
   */
  updateRule(ownerAddress: string, ruleId: string, updates: Partial<TradingRule>): boolean {
    try {
      const rules = this.tradingRules.get(ownerAddress) || []
      const ruleIndex = rules.findIndex(r => r.id === ruleId)

      if (ruleIndex === -1) return false

      rules[ruleIndex] = { ...rules[ruleIndex], ...updates }
      this.emit('rule:updated', { ownerAddress, ruleId, updates })

      return true
    } catch (error) {
      this.logger.error(`Failed to update rule ${ruleId}:`, error)
      return false
    }
  }

  /**
   * Delete trading rule
   */
  deleteRule(ownerAddress: string, ruleId: string): boolean {
    try {
      const rules = this.tradingRules.get(ownerAddress) || []
      const filteredRules = rules.filter(r => r.id !== ruleId)

      if (filteredRules.length === rules.length) return false

      this.tradingRules.set(ownerAddress, filteredRules)
      this.emit('rule:deleted', { ownerAddress, ruleId })

      return true
    } catch (error) {
      this.logger.error(`Failed to delete rule ${ruleId}:`, error)
      return false
    }
  }

  /**
   * Get trading rules
   */
  getRules(ownerAddress: string): TradingRule[] {
    return this.tradingRules.get(ownerAddress) || []
  }

  // ============ OPPORTUNITY DISCOVERY ============

  /**
   * Scan for trading opportunities
   */
  async scanOpportunities(ownerAddress: string): Promise<TradingOpportunity[]> {
    try {
      const opportunities: TradingOpportunity[] = []

      // Scan for arbitrage opportunities
      const arbitrageOps = await this.scanArbitrageOpportunities()
      opportunities.push(...arbitrageOps)

      // Scan for flip opportunities
      const flipOps = await this.scanFlipOpportunities(ownerAddress)
      opportunities.push(...flipOps)

      // Scan for momentum opportunities
      const momentumOps = await this.scanMomentumOpportunities()
      opportunities.push(...momentumOps)

      // Scan for mean reversion opportunities
      const meanReversionOps = await this.scanMeanReversionOpportunities()
      opportunities.push(...meanReversionOps)

      // Cache opportunities
      this.opportunityCache.set(ownerAddress, opportunities)

      this.emit('opportunities:scanned', { ownerAddress, count: opportunities.length })

      return opportunities
    } catch (error) {
      this.logger.error(`Failed to scan opportunities for ${ownerAddress}:`, error)
      return []
    }
  }

  /**
   * Scan for arbitrage opportunities across marketplaces
   */
  private async scanArbitrageOpportunities(): Promise<TradingOpportunity[]> {
    try {
      const opportunities: TradingOpportunity[] = []

      // Get trending collections
      const collections = await this.getTrendingCollections()

      for (const collection of collections.slice(0, 10)) {
        try {
          // Compare marketplace listings
          const comparison = await this.marketplaceService.compareMarketplaces(
            collection.contractAddress,
            '' // Would need to select specific tokens
          )

          if (comparison.allListings.length >= 2) {
            const prices = comparison.allListings.map(l => parseFloat(l.price))
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)

            const spread = (maxPrice - minPrice) / minPrice

            if (spread > 0.05) { // 5%+ spread
              const opportunity: TradingOpportunity = {
                id: `arbitrage-${collection.contractAddress}-${Date.now()}`,
                type: 'arbitrage',
                contractAddress: collection.contractAddress,
                expectedReturn: ((maxPrice - minPrice) * 0.9).toString(), // Account for fees
                confidence: Math.min(spread * 100, 95),
                riskLevel: spread > 0.2 ? 'high' : spread > 0.1 ? 'medium' : 'low',
                timeHorizon: 'short',
                reasoning: [
                  `Price spread of ${(spread * 100).toFixed(1)}% between marketplaces`,
                  `Buy at ${minPrice.toFixed(2)}, sell at ${maxPrice.toFixed(2)}`,
                  `Potential profit: ${(maxPrice - minPrice).toFixed(2)}`
                ],
                suggestedAction: {
                  type: 'buy',
                  parameters: {
                    contractAddress: collection.contractAddress,
                    maxPrice: minPrice.toString(),
                    marketplace: comparison.bestListing?.marketplace
                  },
                  marketplace: 'auto'
                },
                marketData: {
                  floorPrice: comparison.floorPrice,
                  volume24h: '0', // Would need collection data
                  listingsCount: comparison.allListings.length,
                  offersCount: 0
                }
              }

              opportunities.push(opportunity)
            }
          }
        } catch (error) {
          this.logger.error(`Failed to scan arbitrage for ${collection.contractAddress}:`, error)
        }
      }

      return opportunities
    } catch (error) {
      this.logger.error('Failed to scan arbitrage opportunities:', error)
      return []
    }
  }

  /**
   * Scan for flip opportunities in portfolio
   */
  private async scanFlipOpportunities(ownerAddress: string): Promise<TradingOpportunity[]> {
    try {
      const opportunities: TradingOpportunity[] = []
      const positions = this.portfolioService.getPositions(ownerAddress)

      for (const position of positions) {
        try {
          const valuation = await this.analyticsService.getNFTValuation(
            position.contractAddress,
            position.tokenId
          )

          const currentValue = parseFloat(valuation.estimatedValue)
          const acquisitionPrice = parseFloat(position.acquisitionPrice)
          const profitMargin = (currentValue - acquisitionPrice) / acquisitionPrice

          // Look for 50%+ profit potential with low holding period
          if (profitMargin > 0.5 && position.holdingPeriod < 30) {
            const opportunity: TradingOpportunity = {
              id: `flip-${position.contractAddress}-${position.tokenId}`,
              type: 'flip',
              contractAddress: position.contractAddress,
              tokenId: position.tokenId,
              expectedReturn: (currentValue - acquisitionPrice).toString(),
              confidence: Math.min(profitMargin * 50, 90),
              riskLevel: position.holdingPeriod < 7 ? 'high' : 'medium',
              timeHorizon: 'short',
              reasoning: [
                `Held for ${position.holdingPeriod} days`,
                `Current value: ${currentValue.toFixed(2)}`,
                `Profit potential: ${(profitMargin * 100).toFixed(1)}%`,
                `Market sentiment: ${valuation.marketSentiment}`
              ],
              suggestedAction: {
                type: 'sell',
                parameters: {
                  contractAddress: position.contractAddress,
                  tokenId: position.tokenId,
                  minPrice: (currentValue * 0.95).toString() // 5% slippage
                },
                marketplace: 'auto'
              },
              marketData: {
                floorPrice: valuation.currentFloorPrice,
                lastSalePrice: valuation.lastSalePrice,
                volume24h: '0',
                listingsCount: 0,
                offersCount: 0
              }
            }

            opportunities.push(opportunity)
          }
        } catch (error) {
          this.logger.error(`Failed to scan flip opportunity for position ${position.id}:`, error)
        }
      }

      return opportunities
    } catch (error) {
      this.logger.error('Failed to scan flip opportunities:', error)
      return []
    }
  }

  /**
   * Scan for momentum-based opportunities
   */
  private async scanMomentumOpportunities(): Promise<TradingOpportunity[]> {
    try {
      const opportunities: TradingOpportunity[] = []

      // Get market trends
      const trends = await this.analyticsService.getMarketTrends()

      for (const gainer of trends.topGainers.slice(0, 3)) {
        const opportunity: TradingOpportunity = {
          id: `momentum-${gainer.contractAddress}-${Date.now()}`,
          type: 'momentum',
          contractAddress: gainer.contractAddress,
          expectedReturn: (parseFloat(gainer.floorPrice) * 0.1).toString(), // 10% expected return
          confidence: Math.min(gainer.changePercent * 2, 85),
          riskLevel: gainer.changePercent > 50 ? 'high' : 'medium',
          timeHorizon: 'medium',
          reasoning: [
            `Collection gained ${(gainer.changePercent).toFixed(1)}% recently`,
            `Strong upward momentum detected`,
            `Floor price: ${gainer.floorPrice}`
          ],
          suggestedAction: {
            type: 'buy',
            parameters: {
              contractAddress: gainer.contractAddress,
              maxPrice: (parseFloat(gainer.floorPrice) * 1.05).toString() // 5% above floor
            },
            marketplace: 'auto'
          },
          marketData: {
            floorPrice: gainer.floorPrice,
            volume24h: '0',
            listingsCount: 0,
            offersCount: 0
          }
        }

        opportunities.push(opportunity)
      }

      return opportunities
    } catch (error) {
      this.logger.error('Failed to scan momentum opportunities:', error)
      return []
    }
  }

  /**
   * Scan for mean reversion opportunities
   */
  private async scanMeanReversionOpportunities(): Promise<TradingOpportunity[]> {
    try {
      const opportunities: TradingOpportunity[] = []

      // Get market trends
      const trends = await this.analyticsService.getMarketTrends()

      for (const loser of trends.topLosers.slice(0, 3)) {
        const declinePercent = Math.abs(loser.changePercent)

        if (declinePercent > 20) { // Significant decline
          const opportunity: TradingOpportunity = {
            id: `mean-reversion-${loser.contractAddress}-${Date.now()}`,
            type: 'mean_reversion',
            contractAddress: loser.contractAddress,
            expectedReturn: (parseFloat(loser.floorPrice) * 0.15).toString(), // 15% expected rebound
            confidence: Math.min(declinePercent, 80),
            riskLevel: 'medium',
            timeHorizon: 'medium',
            reasoning: [
              `Collection declined ${(declinePercent).toFixed(1)}% recently`,
              `Potential mean reversion opportunity`,
              `Floor price: ${loser.floorPrice}`
            ],
            suggestedAction: {
              type: 'buy',
              parameters: {
                contractAddress: loser.contractAddress,
                maxPrice: (parseFloat(loser.floorPrice) * 0.9).toString() // 10% discount
              },
              marketplace: 'auto'
            },
            marketData: {
              floorPrice: loser.floorPrice,
              volume24h: '0',
              listingsCount: 0,
              offersCount: 0
            }
          }

          opportunities.push(opportunity)
        }
      }

      return opportunities
    } catch (error) {
      this.logger.error('Failed to scan mean reversion opportunities:', error)
      return []
    }
  }

  // ============ AUTOMATED EXECUTION ============

  /**
   * Execute trading rule
   */
  async executeRule(ownerAddress: string, ruleId: string): Promise<AutomatedTrade | null> {
    try {
      const rules = this.tradingRules.get(ownerAddress) || []
      const rule = rules.find(r => r.id === ruleId)

      if (!rule || !rule.enabled) return null

      // Check cooldown
      if (rule.lastExecuted) {
        const timeSinceLastExecution = (Date.now() - rule.lastExecuted.getTime()) / (1000 * 60)
        if (timeSinceLastExecution < rule.cooldownPeriod) {
          return null
        }
      }

      // Check daily execution limit
      if (rule.executionCount >= rule.maxExecutionsPerDay) {
        return null
      }

      // Evaluate conditions
      const conditionsMet = await this.evaluateRuleConditions(ownerAddress, rule.conditions)
      if (!conditionsMet) return null

      // Execute actions
      const trades: AutomatedTrade[] = []
      for (const action of rule.actions) {
        try {
          const trade = await this.executeTradingAction(ownerAddress, rule.id, action)
          if (trade) {
            trades.push(trade)
          }
        } catch (error) {
          this.logger.error(`Failed to execute action for rule ${ruleId}:`, error)
        }
      }

      // Update rule statistics
      rule.lastExecuted = new Date()
      rule.executionCount++

      this.emit('rule:executed', { ownerAddress, ruleId, trades })

      return trades[0] || null
    } catch (error) {
      this.logger.error(`Failed to execute rule ${ruleId}:`, error)
      return null
    }
  }

  /**
   * Evaluate rule conditions
   */
  private async evaluateRuleConditions(ownerAddress: string, conditions: TradingCondition[]): Promise<boolean> {
    try {
      for (const condition of conditions) {
        const result = await this.evaluateCondition(ownerAddress, condition)
        if (!result) return false
      }
      return true
    } catch (error) {
      this.logger.error('Failed to evaluate rule conditions:', error)
      return false
    }
  }

  /**
   * Evaluate individual condition
   */
  private async evaluateCondition(ownerAddress: string, condition: TradingCondition): Promise<boolean> {
    try {
      switch (condition.type) {
        case 'price':
          if (condition.contractAddress && condition.tokenId) {
            const valuation = await this.analyticsService.getNFTValuation(
              condition.contractAddress,
              condition.tokenId
            )
            const currentPrice = parseFloat(valuation.estimatedValue)
            return this.compareValues(currentPrice, condition.operator, condition.value)
          }
          break

        case 'floor_price':
          if (condition.contractAddress) {
            const floorPrice = await this.analyticsService.getCollectionAnalytics(condition.contractAddress)
            const currentFloor = parseFloat(floorPrice.floorPrice)
            return this.compareValues(currentFloor, condition.operator, condition.value)
          }
          break

        case 'portfolio':
          const summary = await this.portfolioService.getPortfolioSummary(ownerAddress)
          return this.compareValues(summary.totalValue, condition.operator, condition.value)
          break

        case 'time':
          const currentHour = new Date().getHours()
          return this.compareValues(currentHour, condition.operator, condition.value)
          break
      }

      return false
    } catch (error) {
      this.logger.error(`Failed to evaluate condition ${condition.type}:`, error)
      return false
    }
  }

  /**
   * Execute trading action
   */
  private async executeTradingAction(
    ownerAddress: string,
    ruleId: string,
    action: TradingAction
  ): Promise<AutomatedTrade | null> {
    try {
      const trade: AutomatedTrade = {
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ruleId,
        type: action.type as any, // Handle different action types
        contractAddress: action.parameters.contractAddress,
        tokenId: action.parameters.tokenId,
        price: action.parameters.price || '0',
        marketplace: action.marketplace || 'auto',
        status: 'pending',
        actionType: action.type, // Store original action type
        metadata: action.parameters
      }

      // Add to active trades
      if (!this.activeTrades.has(ownerAddress)) {
        this.activeTrades.set(ownerAddress, [])
      }
      this.activeTrades.get(ownerAddress)!.push(trade)

      // Execute based on action type
      switch (action.type) {
        case 'buy':
          await this.executeBuyAction(trade)
          break
        case 'sell':
          await this.executeSellAction(trade)
          break
        case 'list':
          await this.executeListAction(trade)
          break
        case 'rebalance':
          // Rebalance actions are handled differently - emit event for portfolio service
          this.emit('rebalance:requested', { ownerAddress, action: action.parameters })
          trade.status = 'completed'
          trade.executedAt = new Date()
          break
        case 'alert':
          // Just emit alert, no execution needed
          this.emit('alert:triggered', { ownerAddress, trade })
          break
      }

      this.emit('trade:executed', { ownerAddress, trade })

      return trade
    } catch (error) {
      this.logger.error(`Failed to execute trading action:`, error)
      return null
    }
  }

  /**
   * Execute buy action
   */
  private async executeBuyAction(trade: AutomatedTrade): Promise<void> {
    try {
      // This would integrate with marketplace services
      // Simplified implementation
      trade.status = 'completed'
      trade.executedAt = new Date()

      this.logger.info(`Executed buy action for ${trade.contractAddress}`)
    } catch (error) {
      trade.status = 'failed'
      trade.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * Execute sell action
   */
  private async executeSellAction(trade: AutomatedTrade): Promise<void> {
    try {
      // This would integrate with marketplace services
      // Simplified implementation
      trade.status = 'completed'
      trade.executedAt = new Date()

      this.logger.info(`Executed sell action for ${trade.contractAddress}`)
    } catch (error) {
      trade.status = 'failed'
      trade.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * Execute list action
   */
  private async executeListAction(trade: AutomatedTrade): Promise<void> {
    try {
      // This would integrate with marketplace services
      // Simplified implementation
      trade.status = 'completed'
      trade.executedAt = new Date()

      this.logger.info(`Executed list action for ${trade.contractAddress}`)
    } catch (error) {
      trade.status = 'failed'
      trade.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  // ============ AUTOMATED MONITORING ============

  /**
   * Start automated trading for owner
   */
  startAutomatedTrading(ownerAddress: string, intervalMinutes: number = 15): void {
    // Clear existing interval
    const existingInterval = this.monitoringIntervals.get(ownerAddress)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Start new monitoring interval
    const interval = setInterval(async () => {
      try {
        // Scan for opportunities
        const opportunities = await this.scanOpportunities(ownerAddress)

        // Execute active rules
        const rules = this.getRules(ownerAddress).filter(r => r.enabled)
        for (const rule of rules) {
          await this.executeRule(ownerAddress, rule.id)
        }

        this.emit('automated:cycle', { ownerAddress, opportunitiesFound: opportunities.length })
      } catch (error) {
        this.logger.error(`Error in automated trading cycle for ${ownerAddress}:`, error)
      }
    }, intervalMinutes * 60 * 1000 as number)

    this.monitoringIntervals.set(ownerAddress, interval)
    this.logger.info(`Started automated trading for ${ownerAddress} (every ${intervalMinutes} minutes)`)
  }

  /**
   * Stop automated trading
   */
  stopAutomatedTrading(ownerAddress: string): void {
    const interval = this.monitoringIntervals.get(ownerAddress)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(ownerAddress)
      this.logger.info(`Stopped automated trading for ${ownerAddress}`)
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Compare values with operator
   */
  private compareValues(current: number, operator: string, target: any): boolean {
    switch (operator) {
      case 'gt': return current > target
      case 'lt': return current < target
      case 'eq': return current === target
      case 'gte': return current >= target
      case 'lte': return current <= target
      case 'between': return current >= target[0] && current <= target[1]
      default: return false
    }
  }

  /**
   * Get trending collections
   */
  private async getTrendingCollections(): Promise<Array<{ contractAddress: string; name: string }>> {
    try {
      // This would require market data aggregation
      // Simplified implementation
      return [
        { contractAddress: '0x...', name: 'Trending Collection 1' },
        { contractAddress: '0x...', name: 'Trending Collection 2' }
      ]
    } catch (error) {
      return []
    }
  }

  /**
   * Get opportunities for owner
   */
  getOpportunities(ownerAddress: string): TradingOpportunity[] {
    return this.opportunityCache.get(ownerAddress) || []
  }

  /**
   * Get active trades for owner
   */
  getActiveTrades(ownerAddress: string): AutomatedTrade[] {
    return this.activeTrades.get(ownerAddress) || []
  }

  /**
   * Get trading performance
   */
  getTradingPerformance(ownerAddress: string): {
    totalTrades: number
    successfulTrades: number
    totalProfit: string
    winRate: number
    averageProfit: string
    bestTrade: string
    worstTrade: string
  } {
    const trades = this.getActiveTrades(ownerAddress)
    const completedTrades = trades.filter(t => t.status === 'completed')

    const totalTrades = completedTrades.length
    const successfulTrades = completedTrades.filter(t => parseFloat(t.profit || '0') > 0).length
    const totalProfit = completedTrades.reduce((sum, t) => sum + parseFloat(t.profit || '0'), 0).toString()
    const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0
    const averageProfit = totalTrades > 0 ? (parseFloat(totalProfit) / totalTrades).toString() : '0'

    const profits = completedTrades.map(t => parseFloat(t.profit || '0'))
    const bestTrade = profits.length > 0 ? Math.max(...profits).toString() : '0'
    const worstTrade = profits.length > 0 ? Math.min(...profits).toString() : '0'

    return {
      totalTrades,
      successfulTrades,
      totalProfit,
      winRate,
      averageProfit,
      bestTrade,
      worstTrade
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
        activeRules: Array.from(this.tradingRules.values()).flat().filter(r => r.enabled).length,
        activeTrades: Array.from(this.activeTrades.values()).flat().length,
        monitoringIntervals: this.monitoringIntervals.size,
        cachedOpportunities: Array.from(this.opportunityCache.values()).flat().length
      }
    }
  }

  /**
   * Clear all data for owner
   */
  clearOwnerData(ownerAddress: string): void {
    this.tradingRules.delete(ownerAddress)
    this.activeTrades.delete(ownerAddress)
    this.opportunityCache.delete(ownerAddress)
    this.stopAutomatedTrading(ownerAddress)
    this.logger.info(`Cleared all trading data for ${ownerAddress}`)
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.tradingRules.clear()
    this.activeTrades.clear()
    this.opportunityCache.clear()

    for (const [ownerAddress] of this.monitoringIntervals) {
      this.stopAutomatedTrading(ownerAddress)
    }

    this.logger.info('All trading automation data cleared')
  }
}

export default NFTTradingAutomationService
