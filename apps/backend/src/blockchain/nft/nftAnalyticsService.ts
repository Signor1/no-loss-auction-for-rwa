import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import OpenSeaService from './openseaService'
import ZoraService from './zoraService'
import logger from '../../utils/logger'

// Analytics interfaces
export interface NFTPriceHistory {
  timestamp: Date
  price: string
  paymentToken: string
  marketplace: string
  transactionHash: string
}

export interface NFTValuation {
  contractAddress: string
  tokenId: string
  currentFloorPrice: string
  estimatedValue: string
  confidence: number
  lastSalePrice?: string
  lastSaleDate?: Date
  priceHistory: NFTPriceHistory[]
  volatility: number
  liquidityScore: number
  rarityScore: number
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
}

export interface CollectionAnalytics {
  contractAddress: string
  name: string
  totalSupply: number
  holdersCount: number
  floorPrice: string
  marketCap: string
  volume24h: string
  volume7d: string
  volume30d: string
  change24h: number
  change7d: number
  change30d: number
  averagePrice: string
  sales24h: number
  sales7d: number
  sales30d: number
  listingsCount: number
  offersCount: number
  uniqueBuyers24h: number
  uniqueSellers24h: number
  washTradingScore: number // 0-100, higher = more wash trading
  blueChipScore: number // 0-100, higher = more blue-chip
}

export interface MarketTrends {
  overallChange24h: number
  topGainers: Array<{
    contractAddress: string
    name: string
    changePercent: number
    floorPrice: string
  }>
  topLosers: Array<{
    contractAddress: string
    name: string
    changePercent: number
    floorPrice: string
  }>
  mostActiveCollections: Array<{
    contractAddress: string
    name: string
    volume24h: string
    salesCount: number
  }>
  emergingCollections: Array<{
    contractAddress: string
    name: string
    growthRate: number
    volume24h: string
  }>
}

export interface NFTRecommendation {
  contractAddress: string
  tokenId: string
  name: string
  imageUrl: string
  reason: string
  confidence: number
  expectedReturn: string
  timeHorizon: 'short' | 'medium' | 'long'
  riskLevel: 'low' | 'medium' | 'high'
  strategy: 'buy' | 'sell' | 'hold'
}

export interface PortfolioMetrics {
  totalValue: string
  totalNFTs: number
  uniqueCollections: number
  averageHoldTime: number // days
  bestPerformer: {
    contractAddress: string
    tokenId: string
    gain: string
    gainPercent: number
  }
  worstPerformer: {
    contractAddress: string
    tokenId: string
    loss: string
    lossPercent: number
  }
  diversificationScore: number // 0-100
  riskScore: number // 0-100
  unrealizedGains: string
  realizedGains: string
}

/**
 * NFT Analytics and Pricing Service
 * Provides comprehensive NFT valuation, market analysis, and investment insights
 */
export class NFTAnalyticsService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private openseaService: OpenSeaService
  private zoraService: ZoraService
  private priceCache: Map<string, NFTValuation> = new Map()
  private collectionCache: Map<string, CollectionAnalytics> = new Map()
  private marketDataCache: Map<string, any> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    openseaService: OpenSeaService,
    zoraService: ZoraService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.openseaService = openseaService
    this.zoraService = zoraService
    this.logger = loggerInstance
  }

  // ============ NFT VALUATION ============

  /**
   * Get comprehensive NFT valuation
   */
  async getNFTValuation(contractAddress: string, tokenId: string): Promise<NFTValuation> {
    try {
      const cacheKey = `${contractAddress}-${tokenId}`

      // Check cache first
      if (this.priceCache.has(cacheKey)) {
        return this.priceCache.get(cacheKey)!
      }

      // Get basic asset info
      const [openseaAsset, zoraAsset] = await Promise.all([
        this.openseaService.getAsset(contractAddress, tokenId),
        this.zoraService.getAsset(contractAddress, tokenId)
      ])

      const asset = openseaAsset || zoraAsset
      if (!asset) {
        throw new Error(`Asset not found: ${contractAddress}/${tokenId}`)
      }

      // Get floor price
      const floorPrice = await this.getFloorPrice(contractAddress)

      // Get price history (simplified)
      const priceHistory = await this.getPriceHistory(contractAddress, tokenId)

      // Calculate estimated value using multiple factors
      const estimatedValue = this.calculateEstimatedValue(asset, floorPrice, priceHistory)

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(asset, priceHistory)

      // Calculate volatility
      const volatility = this.calculateVolatility(priceHistory)

      // Calculate liquidity score
      const liquidityScore = await this.calculateLiquidityScore(contractAddress, tokenId)

      // Calculate rarity score
      const rarityScore = this.calculateRarityScore(asset)

      // Determine market sentiment
      const marketSentiment = this.determineMarketSentiment(priceHistory)

      const valuation: NFTValuation = {
        contractAddress,
        tokenId,
        currentFloorPrice: floorPrice,
        estimatedValue,
        confidence,
        lastSalePrice: asset.lastSalePrice,
        lastSaleDate: priceHistory.length > 0 ? priceHistory[0].timestamp : undefined,
        priceHistory,
        volatility,
        liquidityScore,
        rarityScore,
        marketSentiment
      }

      // Cache valuation (short-lived due to price changes)
      this.priceCache.set(cacheKey, valuation)

      return valuation
    } catch (error) {
      this.logger.error(`Failed to get NFT valuation for ${contractAddress}/${tokenId}:`, error)
      throw error
    }
  }

  /**
   * Calculate estimated value using multiple factors
   */
  private calculateEstimatedValue(
    asset: any,
    floorPrice: string,
    priceHistory: NFTPriceHistory[]
  ): string {
    try {
      let baseValue = parseFloat(floorPrice) || 0

      // Factor in last sale price if recent
      if (asset.lastSalePrice && priceHistory.length > 0) {
        const lastSale = parseFloat(asset.lastSalePrice)
        const daysSinceSale = (Date.now() - priceHistory[0].timestamp.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceSale < 30) { // Within last month
          baseValue = (baseValue + lastSale) / 2 // Average of floor and last sale
        }
      }

      // Factor in rarity (simplified)
      if (asset.rarity && asset.rarity > 0.5) {
        baseValue *= (1 + (asset.rarity - 0.5) * 0.5) // Up to 25% premium for high rarity
      }

      return baseValue.toString()
    } catch (error) {
      this.logger.error('Failed to calculate estimated value:', error)
      return floorPrice
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(asset: any, priceHistory: NFTPriceHistory[]): number {
    try {
      let confidence = 0.5 // Base confidence

      // Increase confidence based on data availability
      if (asset.lastSalePrice) confidence += 0.1
      if (priceHistory.length > 0) confidence += 0.1
      if (asset.rarity) confidence += 0.1
      if (asset.attributes && asset.attributes.length > 0) confidence += 0.1

      // Increase confidence for established collections
      if (asset.collection?.totalSupply > 100) confidence += 0.1

      return Math.min(confidence, 1.0)
    } catch (error) {
      this.logger.error('Failed to calculate confidence:', error)
      return 0.5
    }
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(priceHistory: NFTPriceHistory[]): number {
    try {
      if (priceHistory.length < 2) return 0

      const prices = priceHistory.map(h => parseFloat(h.price)).filter(p => !isNaN(p))
      if (prices.length < 2) return 0

      const returns: number[] = []
      for (let i = 1; i < prices.length; i++) {
        const return_ = (prices[i] - prices[i-1]) / prices[i-1]
        returns.push(return_)
      }

      const mean = returns.reduce((a, b) => a + b, 0) / returns.length
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length

      return Math.sqrt(variance) // Standard deviation of returns
    } catch (error) {
      this.logger.error('Failed to calculate volatility:', error)
      return 0
    }
  }

  /**
   * Calculate liquidity score
   */
  private async calculateLiquidityScore(contractAddress: string, tokenId: string): Promise<number> {
    try {
      // Get listings and offers
      const [openseaListings, zoraAsk] = await Promise.all([
        this.openseaService.getAssetListings(contractAddress, tokenId),
        this.zoraService.getAsk(contractAddress, tokenId)
      ])

      const totalListings = openseaListings.length + (zoraAsk ? 1 : 0)

      // Get collection stats
      const collectionStats = await this.getCollectionAnalytics(contractAddress)

      let score = 0

      // Factor in number of listings
      if (totalListings > 0) score += 20
      if (totalListings > 2) score += 20

      // Factor in collection liquidity
      if (collectionStats.volume24h !== '0') score += 30
      if (collectionStats.listingsCount > 10) score += 20
      if (collectionStats.holdersCount > 100) score += 10

      return Math.min(score, 100)
    } catch (error) {
      this.logger.error('Failed to calculate liquidity score:', error)
      return 0
    }
  }

  /**
   * Calculate rarity score
   */
  private calculateRarityScore(asset: any): number {
    try {
      if (!asset.rarity) return 50 // Neutral score

      // Convert rarity score to 0-100 scale
      return Math.min(asset.rarity * 100, 100)
    } catch (error) {
      this.logger.error('Failed to calculate rarity score:', error)
      return 50
    }
  }

  /**
   * Determine market sentiment
   */
  private determineMarketSentiment(priceHistory: NFTPriceHistory[]): 'bullish' | 'bearish' | 'neutral' {
    try {
      if (priceHistory.length < 7) return 'neutral'

      const recentPrices = priceHistory.slice(0, 7).map(h => parseFloat(h.price))
      const olderPrices = priceHistory.slice(7, 14).map(h => parseFloat(h.price))

      if (recentPrices.length === 0 || olderPrices.length === 0) return 'neutral'

      const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
      const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length

      const changePercent = (recentAvg - olderAvg) / olderAvg

      if (changePercent > 0.1) return 'bullish'
      if (changePercent < -0.1) return 'bearish'
      return 'neutral'
    } catch (error) {
      this.logger.error('Failed to determine market sentiment:', error)
      return 'neutral'
    }
  }

  // ============ COLLECTION ANALYTICS ============

  /**
   * Get comprehensive collection analytics
   */
  async getCollectionAnalytics(contractAddress: string): Promise<CollectionAnalytics> {
    try {
      // Check cache first
      if (this.collectionCache.has(contractAddress)) {
        return this.collectionCache.get(contractAddress)!
      }

      // Get collection data from OpenSea
      const collection = await this.openseaService.getCollection(contractAddress)
      const stats = await this.openseaService.getCollectionStats(contractAddress)

      // Get additional metrics
      const [listingsCount, offersCount] = await Promise.all([
        this.getCollectionListingsCount(contractAddress),
        this.getCollectionOffersCount(contractAddress)
      ])

      const analytics: CollectionAnalytics = {
        contractAddress,
        name: collection.name,
        totalSupply: collection.totalSupply,
        holdersCount: stats.numOwners,
        floorPrice: stats.floorPrice,
        marketCap: stats.marketCap,
        volume24h: stats.oneDayVolume,
        volume7d: stats.sevenDayVolume,
        volume30d: stats.thirtyDayVolume,
        change24h: stats.oneDayChange,
        change7d: stats.sevenDayChange,
        change30d: stats.thirtyDayChange,
        averagePrice: stats.averagePrice,
        sales24h: stats.oneDaySales,
        sales7d: stats.sevenDaySales,
        sales30d: stats.thirtyDaySales,
        listingsCount,
        offersCount,
        uniqueBuyers24h: 0, // Would need trade data
        uniqueSellers24h: 0, // Would need trade data
        washTradingScore: await this.calculateWashTradingScore(contractAddress),
        blueChipScore: await this.calculateBlueChipScore(contractAddress)
      }

      // Cache analytics
      this.collectionCache.set(contractAddress, analytics)

      return analytics
    } catch (error) {
      this.logger.error(`Failed to get collection analytics for ${contractAddress}:`, error)
      throw error
    }
  }

  /**
   * Calculate wash trading score
   */
  private async calculateWashTradingScore(contractAddress: string): Promise<number> {
    try {
      // This would require analyzing trade patterns
      // Simplified implementation
      this.logger.warn('calculateWashTradingScore: Requires trade pattern analysis')
      return 10 // Low wash trading score as default
    } catch (error) {
      this.logger.error('Failed to calculate wash trading score:', error)
      return 50 // Neutral score
    }
  }

  /**
   * Calculate blue-chip score
   */
  private async calculateBlueChipScore(contractAddress: string): Promise<number> {
    try {
      const collection = await this.openseaService.getCollection(contractAddress)

      let score = 0

      // Factor in market cap
      const marketCap = parseFloat(collection.marketCap || '0')
      if (marketCap > 1000000) score += 30 // >$1M market cap
      else if (marketCap > 100000) score += 20 // >$100K market cap

      // Factor in holder count
      if (collection.numOwners > 1000) score += 25
      else if (collection.numOwners > 100) score += 15

      // Factor in trading volume
      const volume = parseFloat(collection.totalVolume || '0')
      if (volume > 100000) score += 25 // >$100K volume
      else if (volume > 10000) score += 15 // >$10K volume

      // Factor in social proof (Twitter, Discord)
      if (collection.twitterUsername) score += 5
      if (collection.discordUrl) score += 5

      return Math.min(score, 100)
    } catch (error) {
      this.logger.error('Failed to calculate blue-chip score:', error)
      return 0
    }
  }

  // ============ MARKET TRENDS ============

  /**
   * Get market trends and analysis
   */
  async getMarketTrends(): Promise<MarketTrends> {
    try {
      // This would aggregate data from multiple collections
      // Simplified implementation
      const trends: MarketTrends = {
        overallChange24h: 0, // Would calculate from collection data
        topGainers: [], // Would need collection performance data
        topLosers: [], // Would need collection performance data
        mostActiveCollections: [], // Would need volume data
        emergingCollections: [] // Would need growth analysis
      }

      this.logger.warn('getMarketTrends: Requires comprehensive market data aggregation')
      return trends
    } catch (error) {
      this.logger.error('Failed to get market trends:', error)
      throw error
    }
  }

  // ============ INVESTMENT RECOMMENDATIONS ============

  /**
   * Get NFT investment recommendations
   */
  async getInvestmentRecommendations(
    riskTolerance: 'low' | 'medium' | 'high',
    investmentAmount: string,
    timeHorizon: 'short' | 'medium' | 'long'
  ): Promise<NFTRecommendation[]> {
    try {
      const recommendations: NFTRecommendation[] = []

      // Get trending collections
      const trendingCollections = await this.getTrendingCollections()

      for (const collection of trendingCollections.slice(0, 5)) {
        // Generate recommendation based on collection metrics
        const recommendation = await this.generateRecommendation(
          collection,
          riskTolerance,
          investmentAmount,
          timeHorizon
        )

        if (recommendation) {
          recommendations.push(recommendation)
        }
      }

      return recommendations
    } catch (error) {
      this.logger.error('Failed to get investment recommendations:', error)
      return []
    }
  }

  /**
   * Generate recommendation for a collection
   */
  private async generateRecommendation(
    collection: CollectionAnalytics,
    riskTolerance: 'low' | 'medium' | 'high',
    investmentAmount: string,
    timeHorizon: 'short' | 'medium' | 'long'
  ): Promise<NFTRecommendation | null> {
    try {
      const change24h = collection.change24h

      let strategy: 'buy' | 'sell' | 'hold' = 'hold'
      let reason = ''
      let confidence = 0
      let expectedReturn = '0'

      // Simple recommendation logic
      if (change24h > 10 && riskTolerance !== 'low') {
        strategy = 'buy'
        reason = `Strong 24h performance (+${change24h.toFixed(1)}%) indicates upward momentum`
        confidence = 0.7
        expectedReturn = (change24h * 0.5).toString() // Expect 50% of recent gains
      } else if (change24h < -10 && riskTolerance === 'high') {
        strategy = 'buy'
        reason = `Potential buying opportunity with recent dip (${change24h.toFixed(1)}%)`
        confidence = 0.6
        expectedReturn = Math.abs(change24h * 0.7).toString() // Expect 70% recovery
      } else if (collection.blueChipScore > 70) {
        strategy = 'buy'
        reason = `Blue-chip collection with strong fundamentals (score: ${collection.blueChipScore})`
        confidence = 0.8
        expectedReturn = '15' // Conservative 15% return
      }

      if (strategy === 'hold') return null

      return {
        contractAddress: collection.contractAddress,
        tokenId: '', // Would need specific token selection logic
        name: collection.name,
        imageUrl: '', // Would need collection image
        reason,
        confidence,
        expectedReturn,
        timeHorizon,
        riskLevel: riskTolerance,
        strategy
      }
    } catch (error) {
      this.logger.error('Failed to generate recommendation:', error)
      return null
    }
  }

  // ============ PORTFOLIO ANALYSIS ============

  /**
   * Analyze NFT portfolio
   */
  async analyzePortfolio(ownerAddress: string): Promise<PortfolioMetrics> {
    try {
      // Get user's NFTs
      const userAssets = await this.openseaService.getAssetsByOwner(ownerAddress)

      if (userAssets.assets.length === 0) {
        return {
          totalValue: '0',
          totalNFTs: 0,
          uniqueCollections: 0,
          averageHoldTime: 0,
          bestPerformer: {
            contractAddress: '',
            tokenId: '',
            gain: '0',
            gainPercent: 0
          },
          worstPerformer: {
            contractAddress: '',
            tokenId: '',
            gain: '0',
            gainPercent: 0
          },
          diversificationScore: 0,
          riskScore: 0,
          unrealizedGains: '0',
          realizedGains: '0'
        }
      }

      // Calculate portfolio metrics
      const valuations = await Promise.all(
        userAssets.assets.map(asset =>
          this.getNFTValuation(asset.contractAddress, asset.tokenId)
        )
      )

      const totalValue = valuations.reduce((sum, val) =>
        sum + parseFloat(val.estimatedValue), 0
      ).toString()

      // Count unique collections
      const uniqueCollections = new Set(
        userAssets.assets.map(asset => asset.contractAddress)
      ).size

      // Calculate diversification score (0-100)
      const diversificationScore = Math.min(uniqueCollections * 20, 100)

      // Simple risk score based on portfolio composition
      const riskScore = 50 // Neutral baseline

      return {
        totalValue,
        totalNFTs: userAssets.assets.length,
        uniqueCollections,
        averageHoldTime: 30, // Would need purchase date tracking
        bestPerformer: {
          contractAddress: '',
          tokenId: '',
          gain: '0',
          gainPercent: 0
        }, // Would need performance calculation
        worstPerformer: {
          contractAddress: '',
          tokenId: '',
          loss: '0',
          lossPercent: 0
        }, // Would need performance calculation
        diversificationScore,
        riskScore,
        unrealizedGains: '0', // Would need cost basis tracking
        realizedGains: '0' // Would need sale tracking
      }
    } catch (error) {
      this.logger.error(`Failed to analyze portfolio for ${ownerAddress}:`, error)
      throw error
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get price history for an NFT
   */
  private async getPriceHistory(contractAddress: string, tokenId: string): Promise<NFTPriceHistory[]> {
    try {
      // Get trade history from marketplaces
      const [openseaTrades] = await Promise.all([
        this.openseaService.getAssetTrades(contractAddress, tokenId, 20)
      ])

      return openseaTrades.map(trade => ({
        timestamp: trade.timestamp,
        price: trade.price,
        paymentToken: trade.paymentToken,
        marketplace: trade.marketplace,
        transactionHash: trade.transactionHash
      }))
    } catch (error) {
      this.logger.error(`Failed to get price history for ${contractAddress}/${tokenId}:`, error)
      return []
    }
  }

  /**
   * Get floor price for collection
   */
  private async getFloorPrice(contractAddress: string): Promise<string> {
    try {
      const floorPrice = await this.openseaService.getFloorPrice(contractAddress)
      return floorPrice || '0'
    } catch (error) {
      return '0'
    }
  }

  /**
   * Get collection listings count
   */
  private async getCollectionListingsCount(contractAddress: string): Promise<number> {
    try {
      // This would require querying collection listings
      // Simplified implementation
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Get collection offers count
   */
  private async getCollectionOffersCount(contractAddress: string): Promise<number> {
    try {
      // This would require querying collection offers
      // Simplified implementation
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Get trending collections
   */
  private async getTrendingCollections(): Promise<CollectionAnalytics[]> {
    try {
      // This would require market data aggregation
      // Simplified implementation
      return []
    } catch (error) {
      return []
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
        cachedValuations: this.priceCache.size,
        cachedCollections: this.collectionCache.size,
        cachedMarketData: this.marketDataCache.size
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.priceCache.clear()
    this.collectionCache.clear()
    this.marketDataCache.clear()
    this.logger.info('NFT Analytics caches cleared')
  }
}

export default NFTAnalyticsService
