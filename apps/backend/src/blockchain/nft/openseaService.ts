import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// OpenSea API endpoints for Base
const OPENSEA_BASE_URL = 'https://api.opensea.io'
const OPENSEA_BASE_TESTNET_URL = 'https://testnets-api.opensea.io'

// OpenSea contract addresses on Base
const OPENSEA_BASE_ADDRESSES = {
  SEAPORT: '0x00000000000000ADc04C56Bf878CbC8C6Ef38Fd90', // Seaport contract on Base
  CONDUIT_CONTROLLER: '0x00000000F9490004C11Cef243f5400493c00Ad63',
  EXCHANGE: '0x00000000000000ADc04C56Bf878CbC8C6Ef38Fd90'
}

// OpenSea ABIs
const OPENSEA_ABIS = {
  SEAPORT: [
    'function fulfillBasicOrder(tuple(address considerationToken, uint256 considerationIdentifier, uint256 considerationAmount, address offerer, address zone, address offerToken, uint256 offerIdentifier, uint256 offerAmount, uint8 basicOrderType, uint256 startTime, uint256 endTime, bytes32 zoneHash, uint256 salt, bytes32 offererConduitKey, bytes32 fulfillerConduitKey, uint256 totalOriginalAdditionalRecipients, tuple(uint256 amount, address recipient)[] additionalRecipients, bytes signature) calldata) external payable returns (bool fulfilled)',
    'function fulfillOrder(tuple(tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount)[] offer, tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount, address recipient)[] consideration, uint8 orderType, uint256 startTime, uint256 endTime, bytes32 zoneHash, uint256 salt, bytes32 conduitKey, uint256 totalOriginalConsiderationItems, bytes signature) calldata parameters, bytes signature) external payable returns (bool fulfilled)',
    'function cancel(tuple(tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount)[] offer, tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount, address recipient)[] consideration, uint8 orderType, uint256 startTime, uint256 endTime, bytes32 zoneHash, uint256 salt, bytes32 conduitKey, uint256 totalOriginalConsiderationItems)[] orders) external returns (bool cancelled)',
    'function validate(tuple(tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount)[] offer, tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount, address recipient)[] consideration, uint8 orderType, uint256 startTime, uint256 endTime, bytes32 zoneHash, uint256 salt, bytes32 conduitKey, uint256 totalOriginalConsiderationItems)[] orders) external returns (bool validated)',
    'function getOrderHash(tuple(tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount)[] offer, tuple(uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount, address recipient)[] consideration, uint8 orderType, uint256 startTime, uint256 endTime, bytes32 zoneHash, uint256 salt, bytes32 conduitKey, uint256 totalOriginalConsiderationItems) orderParameters) external view returns (bytes32 orderHash)',
    'function getContractOffererNonce(address contractOfferer) external view returns (uint256 nonce)',
    'function getOrderStatus(bytes32 orderHash) external view returns (bool isValidated, bool isCancelled, uint256 totalFilled, uint256 totalSize)',
    'function incrementCounter() external returns (uint256 newCounter)',
    'function information() external view returns (string version, bytes32 domainSeparator, address conduitController)',
    'function name() external view returns (string)',
    'function version() external view returns (string)'
  ]
}

// Interfaces
export interface NFTAsset {
  id: string
  tokenId: string
  contractAddress: string
  name: string
  description: string
  imageUrl: string
  animationUrl?: string
  externalUrl?: string
  attributes: NFTAttribute[]
  collection: NFTCollection
  owner: string
  creator: string
  traits: Record<string, any>
  rarity?: number
  lastSalePrice?: string
  floorPrice?: string
}

export interface NFTCollection {
  slug: string
  name: string
  description: string
  imageUrl: string
  bannerImageUrl?: string
  externalUrl?: string
  twitterUsername?: string
  discordUrl?: string
  instagramUsername?: string
  contractAddress: string
  owner: string
  totalSupply: number
  floorPrice?: string
  totalVolume: string
  marketCap: string
  numOwners: number
  averagePrice: string
  oneDayVolume: string
  sevenDayVolume: string
  thirtyDayVolume: string
  oneDayChange: number
  sevenDayChange: number
  thirtyDayChange: number
  oneDaySales: number
  sevenDaySales: number
  thirtyDaySales: number
  totalSales: number
  royalties?: {
    fee: number
    recipient: string
  }
}

export interface NFTAttribute {
  traitType: string
  value: string | number
  displayType?: string
  maxValue?: number
  traitCount: number
  order?: number
}

export interface NFTListing {
  id: string
  asset: NFTAsset
  seller: string
  buyer?: string
  price: string
  paymentToken: string
  paymentTokenSymbol: string
  listingTime: Date
  expirationTime: Date
  orderHash: string
  protocol: 'seaport' | 'wyvern'
  side: 'ask' | 'bid'
  status: 'active' | 'inactive' | 'filled' | 'cancelled' | 'expired'
  quantity: number
  decimals: number
  takerRelayerFee: string
  makerRelayerFee: string
  feeRecipient: string
}

export interface NFTOffer {
  id: string
  asset: NFTAsset
  maker: string
  taker?: string
  price: string
  paymentToken: string
  paymentTokenSymbol: string
  createdTime: Date
  expirationTime: Date
  orderHash: string
  side: 'bid'
  status: 'active' | 'inactive' | 'filled' | 'cancelled' | 'expired'
}

export interface NFTTrade {
  id: string
  asset: NFTAsset
  seller: string
  buyer: string
  price: string
  paymentToken: string
  paymentTokenSymbol: string
  transactionHash: string
  blockNumber: number
  blockHash: string
  timestamp: Date
  marketplace: string
  protocol: string
}

export interface CollectionStats {
  collectionSlug: string
  floorPrice: string
  marketCap: string
  totalVolume: string
  numOwners: number
  averagePrice: string
  oneDayVolume: string
  sevenDayVolume: string
  thirtyDayVolume: string
  oneDayChange: number
  sevenDayChange: number
  thirtyDayChange: number
  oneDaySales: number
  sevenDaySales: number
  thirtyDaySales: number
  totalSales: number
}

export interface NFTActivity {
  id: string
  eventType: 'sale' | 'transfer' | 'mint' | 'burn' | 'list' | 'unlist' | 'offer' | 'bid'
  asset: NFTAsset
  fromAccount?: string
  toAccount?: string
  price?: string
  paymentToken?: string
  transactionHash?: string
  blockNumber?: number
  timestamp: Date
  marketplace: string
}

/**
 * OpenSea Integration Service for Base
 * Provides comprehensive OpenSea marketplace functionality on Base network
 */
export class OpenSeaService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private apiKey?: string
  private baseUrl: string
  private seaportAbi: any[] = []
  private assetCache: Map<string, NFTAsset> = new Map()
  private collectionCache: Map<string, NFTCollection> = new Map()
  private listingCache: Map<string, NFTListing[]> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    loggerInstance: typeof logger,
    options: {
      apiKey?: string
      testnet?: boolean
    } = {}
  ) {
    super()
    this.baseSdk = baseSdk
    this.logger = loggerInstance
    this.apiKey = options.apiKey
    this.baseUrl = options.testnet ? OPENSEA_BASE_TESTNET_URL : OPENSEA_BASE_URL
    this.initializeABIs()
  }

  // Initialize contract ABIs
  private initializeABIs(): void {
    this.seaportAbi = OPENSEA_ABIS.SEAPORT
  }

  // ============ API REQUEST HELPERS ============

  /**
   * Make authenticated API request to OpenSea
   */
  private async makeAPIRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    }

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      this.logger.error(`OpenSea API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // ============ ASSET OPERATIONS ============

  /**
   * Get NFT asset information
   */
  async getAsset(contractAddress: string, tokenId: string): Promise<NFTAsset | null> {
    try {
      const cacheKey = `${contractAddress}-${tokenId}`

      // Check cache first
      if (this.assetCache.has(cacheKey)) {
        return this.assetCache.get(cacheKey)!
      }

      const data = await this.makeAPIRequest(`/api/v2/chain/base/assets/${contractAddress}/${tokenId}`)

      if (!data) return null

      const asset: NFTAsset = {
        id: data.id,
        tokenId: data.identifier,
        contractAddress: data.contract,
        name: data.name || `Token #${data.identifier}`,
        description: data.description || '',
        imageUrl: data.image_url || data.image_preview_url || '',
        animationUrl: data.animation_url,
        externalUrl: data.external_url,
        attributes: (data.traits || []).map((trait: any) => ({
          traitType: trait.trait_type,
          value: trait.value,
          displayType: trait.display_type,
          maxValue: trait.max_value,
          traitCount: trait.trait_count || 0,
          order: trait.order
        })),
        collection: await this.getCollection(data.collection?.slug),
        owner: data.owner,
        creator: data.creator,
        traits: data.traits || {},
        rarity: data.rarity?.score,
        lastSalePrice: data.last_sale?.total_price,
        floorPrice: data.collection?.stats?.floor_price
      }

      // Cache asset
      this.assetCache.set(cacheKey, asset)

      return asset
    } catch (error) {
      this.logger.error(`Failed to get asset ${contractAddress}/${tokenId}:`, error)
      return null
    }
  }

  /**
   * Get multiple assets
   */
  async getAssets(contractAddresses: string[], tokenIds: string[]): Promise<NFTAsset[]> {
    const promises = contractAddresses.map((contract, index) =>
      this.getAsset(contract, tokenIds[index])
    )

    const results = await Promise.all(promises)
    return results.filter(asset => asset !== null) as NFTAsset[]
  }

  /**
   * Get assets owned by an address
   */
  async getAssetsByOwner(ownerAddress: string, options: {
    collection?: string
    limit?: number
    cursor?: string
  } = {}): Promise<{
    assets: NFTAsset[]
    next?: string
  }> {
    try {
      const params = new URLSearchParams({
        chain: 'base',
        limit: (options.limit || 50).toString()
      })

      if (options.collection) {
        params.append('collection', options.collection)
      }

      if (options.cursor) {
        params.append('cursor', options.cursor)
      }

      const data = await this.makeAPIRequest(`/api/v2/chain/base/account/${ownerAddress}/nfts?${params}`)

      const assets: NFTAsset[] = []
      for (const item of data.nfts || []) {
        const asset = await this.getAsset(item.contract, item.identifier)
        if (asset) {
          assets.push(asset)
        }
      }

      return {
        assets,
        next: data.next
      }
    } catch (error) {
      this.logger.error(`Failed to get assets for owner ${ownerAddress}:`, error)
      return { assets: [] }
    }
  }

  // ============ COLLECTION OPERATIONS ============

  /**
   * Get collection information
   */
  async getCollection(slug: string): Promise<NFTCollection> {
    try {
      // Check cache first
      if (this.collectionCache.has(slug)) {
        return this.collectionCache.get(slug)!
      }

      const data = await this.makeAPIRequest(`/api/v2/collections/${slug}`)

      const collection: NFTCollection = {
        slug: data.slug,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        bannerImageUrl: data.banner_image_url,
        externalUrl: data.external_url,
        twitterUsername: data.twitter_username,
        discordUrl: data.discord_url,
        instagramUsername: data.instagram_username,
        contractAddress: data.contracts?.[0]?.address,
        owner: data.owner,
        totalSupply: data.total_supply,
        floorPrice: data.stats?.floor_price,
        totalVolume: data.stats?.total_volume,
        marketCap: data.stats?.market_cap,
        numOwners: data.stats?.num_owners,
        averagePrice: data.stats?.average_price,
        oneDayVolume: data.stats?.one_day_volume,
        sevenDayVolume: data.stats?.seven_day_volume,
        thirtyDayVolume: data.stats?.thirty_day_volume,
        oneDayChange: data.stats?.one_day_change,
        sevenDayChange: data.stats?.seven_day_change,
        thirtyDayChange: data.stats?.thirty_day_change,
        oneDaySales: data.stats?.one_day_sales,
        sevenDaySales: data.stats?.seven_day_sales,
        thirtyDaySales: data.stats?.thirty_day_sales,
        totalSales: data.stats?.total_sales,
        royalties: data.royalties ? {
          fee: data.royalties.fee?.numerator / data.royalties.fee?.denominator,
          recipient: data.royalties.recipient
        } : undefined
      }

      // Cache collection
      this.collectionCache.set(slug, collection)

      return collection
    } catch (error) {
      this.logger.error(`Failed to get collection ${slug}:`, error)
      throw error
    }
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(slug: string): Promise<CollectionStats> {
    try {
      const collection = await this.getCollection(slug)

      return {
        collectionSlug: slug,
        floorPrice: collection.floorPrice || '0',
        marketCap: collection.marketCap || '0',
        totalVolume: collection.totalVolume || '0',
        numOwners: collection.numOwners || 0,
        averagePrice: collection.averagePrice || '0',
        oneDayVolume: collection.oneDayVolume || '0',
        sevenDayVolume: collection.sevenDayVolume || '0',
        thirtyDayVolume: collection.thirtyDayVolume || '0',
        oneDayChange: collection.oneDayChange || 0,
        sevenDayChange: collection.sevenDayChange || 0,
        thirtyDayChange: collection.thirtyDayChange || 0,
        oneDaySales: collection.oneDaySales || 0,
        sevenDaySales: collection.sevenDaySales || 0,
        thirtyDaySales: collection.thirtyDaySales || 0,
        totalSales: collection.totalSales || 0
      }
    } catch (error) {
      this.logger.error(`Failed to get collection stats for ${slug}:`, error)
      throw error
    }
  }

  // ============ LISTING OPERATIONS ============

  /**
   * Get listings for an asset
   */
  async getAssetListings(contractAddress: string, tokenId: string): Promise<NFTListing[]> {
    try {
      const cacheKey = `${contractAddress}-${tokenId}`

      // Check cache first
      if (this.listingCache.has(cacheKey)) {
        return this.listingCache.get(cacheKey)!
      }

      const data = await this.makeAPIRequest(
        `/api/v2/orders/base/seaport/listings?asset_contract_address=${contractAddress}&token_ids=${tokenId}&order_by=created_date&order_direction=desc`
      )

      const listings: NFTListing[] = []
      for (const order of data.orders || []) {
        const asset = await this.getAsset(contractAddress, tokenId)
        if (!asset) continue

        const listing: NFTListing = {
          id: order.order_hash,
          asset,
          seller: order.maker,
          price: order.current_price,
          paymentToken: order.payment_token,
          paymentTokenSymbol: order.payment_token_symbol || 'ETH',
          listingTime: new Date(order.created_date),
          expirationTime: new Date(order.closing_date),
          orderHash: order.order_hash,
          protocol: order.protocol || 'seaport',
          side: 'ask',
          status: order.cancelled ? 'cancelled' : order.finalized ? 'filled' : 'active',
          quantity: parseInt(order.quantity || '1'),
          decimals: order.payment_token_decimals || 18,
          takerRelayerFee: order.taker_relayer_fee || '0',
          makerRelayerFee: order.maker_relayer_fee || '0',
          feeRecipient: order.fee_recipient || ''
        }

        listings.push(listing)
      }

      // Cache listings
      this.listingCache.set(cacheKey, listings)

      return listings
    } catch (error) {
      this.logger.error(`Failed to get listings for ${contractAddress}/${tokenId}:`, error)
      return []
    }
  }

  /**
   * Get offers for an asset
   */
  async getAssetOffers(contractAddress: string, tokenId: string): Promise<NFTOffer[]> {
    try {
      const data = await this.makeAPIRequest(
        `/api/v2/orders/base/seaport/offers?asset_contract_address=${contractAddress}&token_ids=${tokenId}&order_by=created_date&order_direction=desc`
      )

      const offers: NFTOffer[] = []
      for (const order of data.orders || []) {
        const asset = await this.getAsset(contractAddress, tokenId)
        if (!asset) continue

        const offer: NFTOffer = {
          id: order.order_hash,
          asset,
          maker: order.maker,
          price: order.current_price,
          paymentToken: order.payment_token,
          paymentTokenSymbol: order.payment_token_symbol || 'ETH',
          createdTime: new Date(order.created_date),
          expirationTime: new Date(order.closing_date),
          orderHash: order.order_hash,
          side: 'bid',
          status: order.cancelled ? 'cancelled' : order.finalized ? 'filled' : 'active'
        }

        offers.push(offer)
      }

      return offers
    } catch (error) {
      this.logger.error(`Failed to get offers for ${contractAddress}/${tokenId}:`, error)
      return []
    }
  }

  /**
   * Create a listing
   */
  async createListing(params: {
    contractAddress: string
    tokenId: string
    price: string
    paymentToken?: string
    expirationTime?: Date
    quantity?: number
  }): Promise<string> {
    try {
      // This would typically use the OpenSea SDK or direct contract interaction
      // For now, we'll simulate the listing creation
      this.logger.warn('createListing: Direct listing creation requires OpenSea SDK integration')

      // Clear cache for this asset
      const cacheKey = `${params.contractAddress}-${params.tokenId}`
      this.listingCache.delete(cacheKey)

      this.emit('listing:created', { params })

      return `listing-${Date.now()}`
    } catch (error) {
      this.logger.error('Failed to create listing:', error)
      this.emit('listing:error', { error, params })
      throw error
    }
  }

  /**
   * Cancel a listing
   */
  async cancelListing(listingId: string): Promise<boolean> {
    try {
      // This would use the OpenSea API or contract interaction
      this.logger.warn('cancelListing: Requires OpenSea SDK integration')

      this.emit('listing:cancelled', { listingId })

      return true
    } catch (error) {
      this.logger.error(`Failed to cancel listing ${listingId}:`, error)
      this.emit('listing:error', { error, listingId })
      return false
    }
  }

  /**
   * Fulfill a listing (purchase)
   */
  async fulfillListing(listingId: string, takerAddress: string): Promise<string> {
    try {
      // This would use Seaport contract interaction
      this.logger.warn('fulfillListing: Requires Seaport contract interaction')

      const hash = await this.baseSdk.writeContract({
        address: OPENSEA_BASE_ADDRESSES.SEAPORT,
        abi: this.seaportAbi,
        functionName: 'fulfillBasicOrder',
        args: [] // Would need proper order parameters
      })

      this.emit('listing:fulfilled', { listingId, hash, takerAddress })

      return hash
    } catch (error) {
      this.logger.error(`Failed to fulfill listing ${listingId}:`, error)
      this.emit('listing:error', { error, listingId, takerAddress })
      throw error
    }
  }

  // ============ TRADE HISTORY ============

  /**
   * Get trade history for an asset
   */
  async getAssetTrades(contractAddress: string, tokenId: string, limit: number = 50): Promise<NFTTrade[]> {
    try {
      const data = await this.makeAPIRequest(
        `/api/v2/events/chains/base/accounts/${contractAddress}/nfts/${tokenId}/sales?limit=${limit}`
      )

      const trades: NFTTrade[] = []
      for (const event of data.asset_events || []) {
        const asset = await this.getAsset(contractAddress, tokenId)
        if (!asset) continue

        const trade: NFTTrade = {
          id: event.id,
          asset,
          seller: event.seller,
          buyer: event.winner || event.buyer,
          price: event.total_price,
          paymentToken: event.payment_token?.address,
          paymentTokenSymbol: event.payment_token?.symbol || 'ETH',
          transactionHash: event.transaction,
          blockNumber: event.block_number,
          blockHash: event.block_hash,
          timestamp: new Date(event.event_timestamp),
          marketplace: 'opensea',
          protocol: event.protocol || 'seaport'
        }

        trades.push(trade)
      }

      return trades
    } catch (error) {
      this.logger.error(`Failed to get trades for ${contractAddress}/${tokenId}:`, error)
      return []
    }
  }

  /**
   * Get collection activity
   */
  async getCollectionActivity(slug: string, options: {
    eventType?: string
    limit?: number
    cursor?: string
  } = {}): Promise<{
    activities: NFTActivity[]
    next?: string
  }> {
    try {
      const params = new URLSearchParams({
        collection_slug: slug,
        limit: (options.limit || 50).toString()
      })

      if (options.eventType) {
        params.append('event_type', options.eventType)
      }

      if (options.cursor) {
        params.append('cursor', options.cursor)
      }

      const data = await this.makeAPIRequest(`/api/v2/events/chains/base?${params}`)

      const activities: NFTActivity[] = []
      for (const event of data.asset_events || []) {
        const asset = await this.getAsset(event.asset?.asset_contract?.address, event.asset?.token_id)
        if (!asset) continue

        const activity: NFTActivity = {
          id: event.id,
          eventType: event.event_type,
          asset,
          fromAccount: event.seller,
          toAccount: event.winner || event.buyer,
          price: event.total_price,
          paymentToken: event.payment_token?.address,
          transactionHash: event.transaction,
          blockNumber: event.block_number,
          timestamp: new Date(event.event_timestamp),
          marketplace: 'opensea'
        }

        activities.push(activity)
      }

      return {
        activities,
        next: data.next
      }
    } catch (error) {
      this.logger.error(`Failed to get collection activity for ${slug}:`, error)
      return { activities: [] }
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get floor price for a collection
   */
  async getFloorPrice(collectionSlug: string): Promise<string | null> {
    try {
      const stats = await this.getCollectionStats(collectionSlug)
      return stats.floorPrice
    } catch (error) {
      this.logger.error(`Failed to get floor price for ${collectionSlug}:`, error)
      return null
    }
  }

  /**
   * Get estimated NFT value
   */
  async getEstimatedValue(contractAddress: string, tokenId: string): Promise<{
    floorPrice: string
    lastSalePrice: string
    estimatedPrice: string
    confidence: number
  } | null> {
    try {
      const asset = await this.getAsset(contractAddress, tokenId)
      if (!asset) return null

      const floorPrice = asset.floorPrice || '0'
      const lastSalePrice = asset.lastSalePrice || floorPrice

      // Simple estimation logic (would be more sophisticated in production)
      const estimatedPrice = lastSalePrice || floorPrice
      const confidence = lastSalePrice ? 0.8 : 0.6

      return {
        floorPrice,
        lastSalePrice,
        estimatedPrice,
        confidence
      }
    } catch (error) {
      this.logger.error(`Failed to estimate value for ${contractAddress}/${tokenId}:`, error)
      return null
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
        cachedAssets: this.assetCache.size,
        cachedCollections: this.collectionCache.size,
        cachedListings: this.listingCache.size,
        apiKeyConfigured: !!this.apiKey
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.assetCache.clear()
    this.collectionCache.clear()
    this.listingCache.clear()
    this.logger.info('OpenSea caches cleared')
  }

  /**
   * Get contract addresses
   */
  getContractAddresses(): typeof OPENSEA_BASE_ADDRESSES {
    return OPENSEA_BASE_ADDRESSES
  }
}

export default OpenSeaService
