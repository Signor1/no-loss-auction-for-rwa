import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import OpenSeaService from './openseaService'
import ZoraService from './zoraService'
import logger from '../../utils/logger'

// Cross-marketplace interfaces
export interface MarketplaceListing {
  marketplace: 'opensea' | 'zora' | 'other'
  id: string
  asset: {
    contractAddress: string
    tokenId: string
    name: string
    imageUrl: string
  }
  price: string
  paymentToken: string
  paymentTokenSymbol: string
  seller: string
  listingTime: Date
  expirationTime?: Date
  protocol: string
  side: 'ask' | 'bid'
  status: 'active' | 'inactive' | 'filled' | 'cancelled' | 'expired'
  marketplaceUrl: string
  rarity?: number
  floorPrice?: string
}

export interface MarketplaceComparison {
  asset: {
    contractAddress: string
    tokenId: string
    name: string
  }
  bestListing?: MarketplaceListing
  allListings: MarketplaceListing[]
  priceRange: {
    min: string
    max: string
    average: string
  }
  floorPrice: string
  recommendedMarketplace: string
  recommendedReason: string
  potentialSavings: string
}

export interface CrossListingParams {
  contractAddress: string
  tokenId: string
  marketplaces: ('opensea' | 'zora' | 'other')[]
  price: string
  paymentToken?: string
  expirationTime?: Date
  autoRelist: boolean
  priceStrategy: 'fixed' | 'floor_based' | 'dynamic'
}

export interface ListingResult {
  marketplace: string
  success: boolean
  listingId?: string
  transactionHash?: string
  error?: string
  marketplaceUrl?: string
}

export interface PortfolioAnalytics {
  totalValue: string
  totalListings: number
  activeListings: number
  soldValue: string
  averageSalePrice: string
  bestPerformingMarketplace: string
  marketplaceDistribution: Record<string, number>
  unrealizedGains: string
}

/**
 * Cross-Marketplace NFT Listing Service
 * Enables listing and managing NFTs across multiple marketplaces on Base
 * Provides unified interface for OpenSea, Zora, and other Base NFT marketplaces
 */
export class CrossMarketplaceService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private openseaService: OpenSeaService
  private zoraService: ZoraService
  private activeListings: Map<string, MarketplaceListing[]> = new Map()
  private portfolioCache: Map<string, PortfolioAnalytics> = new Map()

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

  // ============ CROSS-MARKETPLACE LISTING ============

  /**
   * List NFT across multiple marketplaces
   */
  async createCrossListing(params: CrossListingParams): Promise<ListingResult[]> {
    try {
      const results: ListingResult[] = []
      const assetKey = `${params.contractAddress}-${params.tokenId}`

      // Calculate dynamic price if needed
      let listingPrice = params.price
      if (params.priceStrategy === 'floor_based') {
        listingPrice = await this.calculateFloorBasedPrice(params.contractAddress, params.tokenId)
      }

      // Create listings on each marketplace
      for (const marketplace of params.marketplaces) {
        try {
          const result = await this.createMarketplaceListing(
            marketplace,
            params.contractAddress,
            params.tokenId,
            listingPrice,
            params.paymentToken,
            params.expirationTime
          )

          results.push(result)

          if (result.success && result.listingId) {
            // Track active listing
            const listing: MarketplaceListing = {
              marketplace,
              id: result.listingId,
              asset: {
                contractAddress: params.contractAddress,
                tokenId: params.tokenId,
                name: await this.getAssetName(params.contractAddress, params.tokenId),
                imageUrl: await this.getAssetImage(params.contractAddress, params.tokenId)
              },
              price: listingPrice,
              paymentToken: params.paymentToken || '0x0000000000000000000000000000000000000000',
              paymentTokenSymbol: params.paymentToken ? 'ERC20' : 'ETH',
              seller: 'current_user', // Would need to get from context
              listingTime: new Date(),
              expirationTime: params.expirationTime,
              protocol: marketplace,
              side: 'ask',
              status: 'active',
              marketplaceUrl: result.marketplaceUrl || '',
              floorPrice: await this.getFloorPrice(params.contractAddress)
            }

            // Add to active listings
            if (!this.activeListings.has(assetKey)) {
              this.activeListings.set(assetKey, [])
            }
            this.activeListings.get(assetKey)!.push(listing)
          }
        } catch (error) {
          this.logger.error(`Failed to list on ${marketplace}:`, error)
          results.push({
            marketplace,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      this.emit('crossListing:created', { params, results })

      return results
    } catch (error) {
      this.logger.error('Failed to create cross-marketplace listing:', error)
      this.emit('crossListing:error', { params, error })
      throw error
    }
  }

  /**
   * Create listing on specific marketplace
   */
  private async createMarketplaceListing(
    marketplace: string,
    contractAddress: string,
    tokenId: string,
    price: string,
    paymentToken?: string,
    expirationTime?: Date
  ): Promise<ListingResult> {
    try {
      switch (marketplace) {
        case 'opensea':
          const openseaListingId = await this.openseaService.createListing({
            contractAddress,
            tokenId,
            price,
            paymentToken,
            expirationTime
          })

          return {
            marketplace: 'opensea',
            success: true,
            listingId: openseaListingId,
            marketplaceUrl: `https://opensea.io/assets/base/${contractAddress}/${tokenId}`
          }

        case 'zora':
          const zoraAskId = await this.zoraService.createAsk({
            tokenContract: contractAddress,
            tokenId,
            askPrice: price,
            askCurrency: paymentToken
          })

          return {
            marketplace: 'zora',
            success: true,
            listingId: zoraAskId,
            marketplaceUrl: `https://zora.co/collect/base:${contractAddress}/${tokenId}`
          }

        case 'other':
          // Placeholder for other marketplaces
          return {
            marketplace: 'other',
            success: false,
            error: 'Other marketplace integration not implemented'
          }

        default:
          return {
            marketplace,
            success: false,
            error: 'Unsupported marketplace'
          }
      }
    } catch (error) {
      return {
        marketplace,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ============ MARKETPLACE COMPARISON ============

  /**
   * Compare listings across marketplaces
   */
  async compareMarketplaces(contractAddress: string, tokenId: string): Promise<MarketplaceComparison> {
    try {
      const asset = {
        contractAddress,
        tokenId,
        name: await this.getAssetName(contractAddress, tokenId)
      }

      // Get listings from all marketplaces
      const [openseaListings, zoraAsk] = await Promise.all([
        this.openseaService.getAssetListings(contractAddress, tokenId),
        this.zoraService.getAsk(contractAddress, tokenId)
      ])

      const allListings: MarketplaceListing[] = []

      // Convert OpenSea listings
      for (const listing of openseaListings) {
        allListings.push({
          marketplace: 'opensea',
          id: listing.id,
          asset: {
            contractAddress,
            tokenId,
            name: listing.asset.name,
            imageUrl: listing.asset.imageUrl
          },
          price: listing.price,
          paymentToken: listing.paymentToken,
          paymentTokenSymbol: listing.paymentTokenSymbol,
          seller: listing.seller,
          listingTime: listing.listingTime,
          expirationTime: listing.expirationTime,
          protocol: listing.protocol,
          side: listing.side,
          status: listing.status,
          marketplaceUrl: `https://opensea.io/assets/base/${contractAddress}/${tokenId}`,
          rarity: listing.asset.rarity,
          floorPrice: listing.asset.floorPrice
        })
      }

      // Convert Zora ask
      if (zoraAsk) {
        allListings.push({
          marketplace: 'zora',
          id: zoraAsk.id,
          asset: {
            contractAddress,
            tokenId,
            name: zoraAsk.asset.name,
            imageUrl: zoraAsk.asset.imageUrl
          },
          price: zoraAsk.price,
          paymentToken: zoraAsk.paymentToken,
          paymentTokenSymbol: zoraAsk.paymentTokenSymbol,
          seller: zoraAsk.seller,
          listingTime: zoraAsk.listingTime,
          protocol: zoraAsk.protocol,
          side: zoraAsk.side,
          status: zoraAsk.status,
          marketplaceUrl: `https://zora.co/collect/base:${contractAddress}/${tokenId}`,
          floorPrice: zoraAsk.asset.floorPrice
        })
      }

      // Calculate price statistics
      const prices = allListings.map(l => parseFloat(l.price)).filter(p => !isNaN(p))
      const priceRange = {
        min: prices.length > 0 ? Math.min(...prices).toString() : '0',
        max: prices.length > 0 ? Math.max(...prices).toString() : '0',
        average: prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length).toString() : '0'
      }

      // Find best listing (lowest price for sellers, highest for buyers)
      const bestListing = allListings.length > 0 ?
        allListings.reduce((best, current) =>
          parseFloat(current.price) < parseFloat(best.price) ? current : best
        ) : undefined

      // Recommend marketplace based on various factors
      const recommendation = this.generateMarketplaceRecommendation(allListings, contractAddress)

      const floorPrice = await this.getFloorPrice(contractAddress)

      return {
        asset,
        bestListing,
        allListings,
        priceRange,
        floorPrice,
        recommendedMarketplace: recommendation.marketplace,
        recommendedReason: recommendation.reason,
        potentialSavings: recommendation.savings
      }
    } catch (error) {
      this.logger.error(`Failed to compare marketplaces for ${contractAddress}/${tokenId}:`, error)
      throw error
    }
  }

  /**
   * Generate marketplace recommendation
   */
  private generateMarketplaceRecommendation(
    listings: MarketplaceListing[],
    contractAddress: string
  ): { marketplace: string; reason: string; savings: string } {
    if (listings.length === 0) {
      return {
        marketplace: 'opensea',
        reason: 'No existing listings found, OpenSea has largest user base',
        savings: '0'
      }
    }

    // Simple recommendation logic
    const openseaListings = listings.filter(l => l.marketplace === 'opensea')
    const zoraListings = listings.filter(l => l.marketplace === 'zora')

    const avgOpenseaPrice = openseaListings.length > 0 ?
      openseaListings.reduce((sum, l) => sum + parseFloat(l.price), 0) / openseaListings.length : 0

    const avgZoraPrice = zoraListings.length > 0 ?
      zoraListings.reduce((sum, l) => sum + parseFloat(l.price), 0) / zoraListings.length : 0

    if (avgOpenseaPrice > 0 && avgZoraPrice > 0) {
      if (avgOpenseaPrice < avgZoraPrice) {
        return {
          marketplace: 'opensea',
          reason: 'Lower average prices and larger liquidity',
          savings: (avgZoraPrice - avgOpenseaPrice).toString()
        }
      } else {
        return {
          marketplace: 'zora',
          reason: 'Lower fees and creator-friendly features',
          savings: (avgOpenseaPrice - avgZoraPrice).toString()
        }
      }
    }

    // Default to marketplace with more listings
    return openseaListings.length >= zoraListings.length ? {
      marketplace: 'opensea',
      reason: 'Largest user base and liquidity',
      savings: '0'
    } : {
      marketplace: 'zora',
      reason: 'Lower fees and better creator economics',
      savings: '0'
    }
  }

  // ============ PORTFOLIO MANAGEMENT ============

  /**
   * Get portfolio analytics across marketplaces
   */
  async getPortfolioAnalytics(ownerAddress: string): Promise<PortfolioAnalytics> {
    try {
      // Check cache first
      if (this.portfolioCache.has(ownerAddress)) {
        return this.portfolioCache.get(ownerAddress)!
      }

      // Get assets owned by user from all marketplaces
      const [openseaAssets, zoraAssets] = await Promise.all([
        this.openseaService.getAssetsByOwner(ownerAddress),
        // Zora would need similar functionality
        { assets: [] }
      ])

      const allAssets = [...openseaAssets.assets]

      // Calculate portfolio metrics
      let totalValue = 0
      let totalListings = 0
      let activeListings = 0
      const marketplaceDistribution: Record<string, number> = {}

      for (const asset of allAssets) {
        // Get asset value (simplified)
        const value = await this.getAssetValue(asset.contractAddress, asset.tokenId)
        totalValue += parseFloat(value || '0')

        // Get listings for this asset
        const assetKey = `${asset.contractAddress}-${asset.tokenId}`
        const listings = this.activeListings.get(assetKey) || []

        for (const listing of listings) {
          totalListings++
          if (listing.status === 'active') {
            activeListings++
          }

          marketplaceDistribution[listing.marketplace] =
            (marketplaceDistribution[listing.marketplace] || 0) + 1
        }
      }

      // Mock additional metrics (would need trade history)
      const analytics: PortfolioAnalytics = {
        totalValue: totalValue.toString(),
        totalListings,
        activeListings,
        soldValue: '0', // Would need trade history
        averageSalePrice: '0', // Would need trade history
        bestPerformingMarketplace: this.getBestPerformingMarketplace(marketplaceDistribution),
        marketplaceDistribution,
        unrealizedGains: '0' // Would need calculation
      }

      // Cache analytics
      this.portfolioCache.set(ownerAddress, analytics)

      return analytics
    } catch (error) {
      this.logger.error(`Failed to get portfolio analytics for ${ownerAddress}:`, error)
      throw error
    }
  }

  /**
   * Get best performing marketplace
   */
  private getBestPerformingMarketplace(distribution: Record<string, number>): string {
    let bestMarketplace = 'opensea'
    let maxCount = 0

    for (const [marketplace, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count
        bestMarketplace = marketplace
      }
    }

    return bestMarketplace
  }

  // ============ AUTOMATED MANAGEMENT ============

  /**
   * Auto-relist expired listings
   */
  async autoRelistExpired(params: {
    contractAddress: string
    tokenId: string
    priceAdjustment?: number
    maxRelists?: number
  }): Promise<ListingResult[]> {
    try {
      const assetKey = `${params.contractAddress}-${params.tokenId}`
      const listings = this.activeListings.get(assetKey) || []

      const expiredListings = listings.filter(listing =>
        listing.expirationTime && listing.expirationTime < new Date()
      )

      if (expiredListings.length === 0) {
        return []
      }

      const results: ListingResult[] = []

      for (const expiredListing of expiredListings) {
        try {
          // Adjust price if specified
          let newPrice = expiredListing.price
          if (params.priceAdjustment) {
            const adjustment = params.priceAdjustment / 100
            newPrice = (parseFloat(expiredListing.price) * (1 + adjustment)).toString()
          }

          // Create new listing
          const result = await this.createMarketplaceListing(
            expiredListing.marketplace,
            params.contractAddress,
            params.tokenId,
            newPrice,
            expiredListing.paymentToken
          )

          results.push(result)

          // Update listing status
          expiredListing.status = 'expired'

        } catch (error) {
          this.logger.error(`Failed to relist on ${expiredListing.marketplace}:`, error)
          results.push({
            marketplace: expiredListing.marketplace,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      this.emit('autoRelist:completed', { params, results })

      return results
    } catch (error) {
      this.logger.error('Failed to auto-relist:', error)
      this.emit('autoRelist:error', { params, error })
      throw error
    }
  }

  /**
   * Bulk list multiple NFTs
   */
  async bulkList(params: {
    assets: Array<{
      contractAddress: string
      tokenId: string
      price: string
      marketplaces: string[]
    }>
    defaultPrice?: string
    paymentToken?: string
  }): Promise<ListingResult[]> {
    try {
      const allResults: ListingResult[] = []

      for (const asset of params.assets) {
        const listingParams: CrossListingParams = {
          contractAddress: asset.contractAddress,
          tokenId: asset.tokenId,
          marketplaces: asset.marketplaces as any,
          price: asset.price || params.defaultPrice || '0',
          paymentToken: params.paymentToken,
          autoRelist: false,
          priceStrategy: 'fixed'
        }

        const results = await this.createCrossListing(listingParams)
        allResults.push(...results)
      }

      this.emit('bulkList:completed', { params, results: allResults })

      return allResults
    } catch (error) {
      this.logger.error('Failed to bulk list:', error)
      this.emit('bulkList:error', { params, error })
      throw error
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get asset name
   */
  private async getAssetName(contractAddress: string, tokenId: string): Promise<string> {
    try {
      const asset = await this.openseaService.getAsset(contractAddress, tokenId)
      return asset?.name || `Token #${tokenId}`
    } catch (error) {
      return `Token #${tokenId}`
    }
  }

  /**
   * Get asset image
   */
  private async getAssetImage(contractAddress: string, tokenId: string): Promise<string> {
    try {
      const asset = await this.openseaService.getAsset(contractAddress, tokenId)
      return asset?.imageUrl || ''
    } catch (error) {
      return ''
    }
  }

  /**
   * Get floor price
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
   * Get asset value
   */
  private async getAssetValue(contractAddress: string, tokenId: string): Promise<string | null> {
    try {
      const value = await this.openseaService.getEstimatedValue(contractAddress, tokenId)
      return value?.estimatedPrice || null
    } catch (error) {
      return null
    }
  }

  /**
   * Calculate floor-based price
   */
  private async calculateFloorBasedPrice(contractAddress: string, tokenId: string): Promise<string> {
    try {
      const floorPrice = await this.getFloorPrice(contractAddress)
      if (!floorPrice || floorPrice === '0') {
        return '1000000000000000000' // 1 ETH fallback
      }

      // Price at 1.1x floor price
      return (BigInt(floorPrice) * 11n / 10n).toString()
    } catch (error) {
      this.logger.error('Failed to calculate floor-based price:', error)
      return '1000000000000000000' // 1 ETH fallback
    }
  }

  /**
   * Get active listings for asset
   */
  getActiveListings(contractAddress: string, tokenId: string): MarketplaceListing[] {
    const assetKey = `${contractAddress}-${tokenId}`
    return this.activeListings.get(assetKey)?.filter(l => l.status === 'active') || []
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
        activeListings: Array.from(this.activeListings.values()).flat().length,
        cachedPortfolios: this.portfolioCache.size,
        openseaHealth: this.openseaService.getHealthStatus(),
        zoraHealth: this.zoraService.getHealthStatus()
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.activeListings.clear()
    this.portfolioCache.clear()
    this.openseaService.clearCaches()
    this.zoraService.clearCaches()
    this.logger.info('Cross-marketplace caches cleared')
  }
}

export default CrossMarketplaceService
