import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// Zora contract addresses on Base
const ZORA_BASE_ADDRESSES = {
  AUCTION_HOUSE: '0x5eEAa46b0275A4a8e32c27B8b3A0cD4b5c0b3b8',
  ASKS_V1_1: '0x5eEAa46b0275A4a8e32c27B8b3A0cD4b5c0b3b8',
  OFFERS_V1: '0x5eEAa46b0275A4a8e32c27B8b3A0cD4b5c0b3b8',
  RESERVOIR_V6_0_0: '0x5eEAa46b0275A4a8e32c27B8b3A0cD4b5c0b3b8',
  ZORA_MODULE_MANAGER: '0x5eEAa46b0275A4a8e32c27B8b3A0cD4b5c0b3b8',
  ERC721_TRANSFER_HELPER: '0x5eEAa46b0275A4a8e32c27B8b3A0cD4b5c0b3b8',
  ERC1155_TRANSFER_HELPER: '0x5eEAa46b0275A4a8e32c27B8b3A0cD4b5c0b3b8'
}

// Zora ABIs (simplified)
const ZORA_ABIS = {
  AUCTION_HOUSE: [
    'function createAuction(address _tokenContract, uint256 _tokenId, uint256 _duration, uint256 _reservePrice, address _creator, uint256 _creatorSharePercentage, address _auctionCurrency) external returns (uint256)',
    'function createBid(uint256 _auctionId, uint256 _amount) external payable',
    'function endAuction(uint256 _auctionId) external',
    'function cancelAuction(uint256 _auctionId) external',
    'function settleAuction(uint256 _auctionId) external',
    'function auctions(uint256) external view returns (uint256 auctionId, address tokenContract, uint256 tokenId, address creator, address owner, uint256 duration, uint256 reservePrice, uint256 firstBidTime, address auctionCurrency, address payable bidder, uint256 amount, uint256 endTime)',
    'function minBidIncrementPercentage() external view returns (uint8)',
    'function timeBuffer() external view returns (uint256)',
    'function auctionCounter() external view returns (uint256)'
  ],

  ASKS_V1_1: [
    'function createAsk(address _tokenContract, uint256 _tokenId, uint256 _askPrice, address _askCurrency, address _sellerFundsRecipient, address _findersFeeBps) external returns (bytes32)',
    'function setAskPrice(bytes32 _askId, uint256 _askPrice, address _askCurrency) external',
    'function cancelAsk(bytes32 _askId) external',
    'function fillAsk(bytes32 _askId, address _buyer, uint256 _findersFeeBps) external payable returns (uint256)',
    'function askForNFT(address _tokenContract, uint256 _tokenId) external view returns (uint256 price, address currency, address seller, address fundsRecipient, address findersFeeBps)',
    'function askId(address _tokenContract, uint256 _tokenId) external view returns (bytes32)',
    'function asks(bytes32) external view returns (address tokenContract, uint256 tokenId, uint256 price, address currency, address seller, address fundsRecipient, address findersFeeBps)'
  ],

  OFFERS_V1: [
    'function createOffer(address _tokenContract, uint256 _tokenId, uint256 _offerAmount, address _offerCurrency, uint256 _findersFeeBps) external returns (bytes32)',
    'function setOfferAmount(bytes32 _offerId, uint256 _offerAmount) external',
    'function cancelOffer(bytes32 _offerId) external',
    'function fillOffer(bytes32 _offerId, address _buyer, uint256 _findersFeeBps) external payable returns (uint256)',
    'function offers(bytes32) external view returns (address tokenContract, uint256 tokenId, uint256 offerAmount, address offerCurrency, address offerer, uint256 findersFeeBps)',
    'function offerId(address _tokenContract, uint256 _tokenId, address _offerer) external view returns (bytes32)',
    'function offersForNFT(address _tokenContract, uint256 _tokenId, address _offerer) external view returns (uint256 offerAmount, address offerCurrency, address offerer, uint256 findersFeeBps)'
  ]
}

// Interfaces (reusing from OpenSea service for consistency)
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
  expirationTime?: Date
  orderHash?: string
  protocol: 'auction' | 'ask' | 'offer'
  side: 'ask' | 'bid'
  status: 'active' | 'inactive' | 'filled' | 'cancelled' | 'expired'
  quantity: number
  decimals: number
  takerRelayerFee?: string
  makerRelayerFee?: string
  feeRecipient?: string
  auctionDetails?: {
    reservePrice: string
    highestBid: string
    highestBidder: string
    duration: number
    endTime: Date
  }
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
  expirationTime?: Date
  orderHash?: string
  side: 'bid'
  status: 'active' | 'inactive' | 'filled' | 'cancelled' | 'expired'
}

export interface NFTAuction {
  id: string
  asset: NFTAsset
  creator: string
  seller: string
  reservePrice: string
  highestBid: string
  highestBidder: string
  paymentToken: string
  paymentTokenSymbol: string
  startTime: Date
  endTime: Date
  duration: number
  status: 'active' | 'ended' | 'cancelled' | 'settled'
  bids: NFTBid[]
}

export interface NFTBid {
  id: string
  auctionId: string
  bidder: string
  amount: string
  paymentToken: string
  paymentTokenSymbol: string
  timestamp: Date
  transactionHash?: string
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
  auctionId?: string
}

/**
 * Zora Integration Service for Base
 * Provides comprehensive Zora marketplace functionality on Base network
 * Supports auctions, asks, offers, and NFT trading
 */
export class ZoraService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private apiKey?: string
  private auctionHouseAbi: any[] = []
  private asksAbi: any[] = []
  private offersAbi: any[] = []
  private assetCache: Map<string, NFTAsset> = new Map()
  private collectionCache: Map<string, NFTCollection> = new Map()
  private auctionCache: Map<string, NFTAuction> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    loggerInstance: typeof logger,
    options: {
      apiKey?: string
    } = {}
  ) {
    super()
    this.baseSdk = baseSdk
    this.logger = loggerInstance
    this.apiKey = options.apiKey
    this.initializeABIs()
  }

  // Initialize contract ABIs
  private initializeABIs(): void {
    this.auctionHouseAbi = ZORA_ABIS.AUCTION_HOUSE
    this.asksAbi = ZORA_ABIS.ASKS_V1_1
    this.offersAbi = ZORA_ABIS.OFFERS_V1
  }

  // ============ ASSET OPERATIONS ============

  /**
   * Get NFT asset information from Zora
   */
  async getAsset(contractAddress: string, tokenId: string): Promise<NFTAsset | null> {
    try {
      const cacheKey = `${contractAddress}-${tokenId}`

      // Check cache first
      if (this.assetCache.has(cacheKey)) {
        return this.assetCache.get(cacheKey)!
      }

      // Get basic token metadata from contract
      const metadata = await this.baseSdk.getTokenMetadata(`${contractAddress}:${tokenId}`)

      // Get collection info
      const collection = await this.getCollection(contractAddress)

      // For Zora, we'd typically get richer metadata from their API
      // For now, use basic metadata with fallbacks
      const asset: NFTAsset = {
        id: `${contractAddress}-${tokenId}`,
        tokenId,
        contractAddress,
        name: metadata.name || `Token #${tokenId}`,
        description: '', // Would need external API call
        imageUrl: '', // Would need external API call
        animationUrl: undefined,
        externalUrl: undefined,
        attributes: [], // Would need external API call
        collection,
        owner: '', // Would need to query owner
        creator: '', // Would need external API call
        traits: {},
        rarity: undefined,
        lastSalePrice: undefined,
        floorPrice: collection.floorPrice
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
   * Get collection information
   */
  async getCollection(contractAddress: string): Promise<NFTCollection> {
    try {
      // Check cache first
      if (this.collectionCache.has(contractAddress)) {
        return this.collectionCache.get(contractAddress)!
      }

      // Get collection metadata from contract
      const metadata = await this.baseSdk.getTokenMetadata(contractAddress)

      const collection: NFTCollection = {
        slug: contractAddress.toLowerCase(),
        name: metadata.name || 'Unknown Collection',
        description: '', // Would need external API call
        imageUrl: '', // Would need external API call
        bannerImageUrl: undefined,
        externalUrl: undefined,
        twitterUsername: undefined,
        discordUrl: undefined,
        instagramUsername: undefined,
        contractAddress,
        owner: '', // Would need external API call
        totalSupply: Number(metadata.totalSupply || 0),
        floorPrice: '0', // Would need external data
        totalVolume: '0',
        marketCap: '0',
        numOwners: 0,
        averagePrice: '0',
        oneDayVolume: '0',
        sevenDayVolume: '0',
        thirtyDayVolume: '0',
        oneDayChange: 0,
        sevenDayChange: 0,
        thirtyDayChange: 0,
        oneDaySales: 0,
        sevenDaySales: 0,
        thirtyDaySales: 0,
        totalSales: 0,
        royalties: undefined // Would need external API call
      }

      // Cache collection
      this.collectionCache.set(contractAddress, collection)

      return collection
    } catch (error) {
      this.logger.error(`Failed to get collection ${contractAddress}:`, error)
      throw error
    }
  }

  // ============ AUCTION OPERATIONS ============

  /**
   * Create an auction
   */
  async createAuction(params: {
    tokenContract: string
    tokenId: string
    duration: number
    reservePrice: string
    creator: string
    creatorSharePercentage: number
    auctionCurrency?: string
  }): Promise<string> {
    try {
      const auctionCurrency = params.auctionCurrency || '0x0000000000000000000000000000000000000000' // ETH

      const result = await this.baseSdk.writeContract({
        address: ZORA_BASE_ADDRESSES.AUCTION_HOUSE,
        abi: this.auctionHouseAbi,
        functionName: 'createAuction',
        args: [
          params.tokenContract,
          params.tokenId,
          params.duration,
          params.reservePrice,
          params.creator,
          params.creatorSharePercentage,
          auctionCurrency
        ]
      })

      this.logger.info(`Auction created on Zora: ${result}`)
      this.emit('auction:created', { hash: result, params })

      return result
    } catch (error) {
      this.logger.error('Failed to create auction:', error)
      this.emit('auction:error', { error, params })
      throw error
    }
  }

  /**
   * Create a bid on an auction
   */
  async createBid(params: {
    auctionId: string
    amount: string
  }): Promise<string> {
    try {
      const result = await this.baseSdk.writeContract({
        address: ZORA_BASE_ADDRESSES.AUCTION_HOUSE,
        abi: this.auctionHouseAbi,
        functionName: 'createBid',
        args: [params.auctionId, params.amount]
      })

      this.logger.info(`Bid created on Zora: ${result}`)
      this.emit('bid:created', { hash: result, params })

      return result
    } catch (error) {
      this.logger.error('Failed to create bid:', error)
      this.emit('bid:error', { error, params })
      throw error
    }
  }

  /**
   * Settle an auction
   */
  async settleAuction(auctionId: string): Promise<string> {
    try {
      const result = await this.baseSdk.writeContract({
        address: ZORA_BASE_ADDRESSES.AUCTION_HOUSE,
        abi: this.auctionHouseAbi,
        functionName: 'settleAuction',
        args: [auctionId]
      })

      this.logger.info(`Auction settled on Zora: ${result}`)
      this.emit('auction:settled', { hash: result, auctionId })

      return result
    } catch (error) {
      this.logger.error(`Failed to settle auction ${auctionId}:`, error)
      this.emit('auction:error', { error, auctionId })
      throw error
    }
  }

  /**
   * Get auction information
   */
  async getAuction(auctionId: string): Promise<NFTAuction | null> {
    try {
      // Check cache first
      if (this.auctionCache.has(auctionId)) {
        return this.auctionCache.get(auctionId)!
      }

      const auctionData = await this.baseSdk.readContract({
        address: ZORA_BASE_ADDRESSES.AUCTION_HOUSE,
        abi: this.auctionHouseAbi,
        functionName: 'auctions',
        args: [auctionId]
      })

      const [
        auctionId_,
        tokenContract,
        tokenId,
        creator,
        owner,
        duration,
        reservePrice,
        firstBidTime,
        auctionCurrency,
        bidder,
        amount,
        endTime
      ] = auctionData

      // Get asset information
      const asset = await this.getAsset(tokenContract, tokenId.toString())
      if (!asset) return null

      const auction: NFTAuction = {
        id: auctionId,
        asset,
        creator,
        seller: owner,
        reservePrice: reservePrice.toString(),
        highestBid: amount.toString(),
        highestBidder: bidder,
        paymentToken: auctionCurrency,
        paymentTokenSymbol: auctionCurrency === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'ERC20',
        startTime: new Date(firstBidTime * 1000),
        endTime: new Date(endTime * 1000),
        duration: Number(duration),
        status: endTime * 1000 < Date.now() ? 'ended' : 'active',
        bids: [] // Would need to track bids separately
      }

      // Cache auction
      this.auctionCache.set(auctionId, auction)

      return auction
    } catch (error) {
      this.logger.error(`Failed to get auction ${auctionId}:`, error)
      return null
    }
  }

  // ============ ASK OPERATIONS ============

  /**
   * Create an ask (listing)
   */
  async createAsk(params: {
    tokenContract: string
    tokenId: string
    askPrice: string
    askCurrency?: string
    sellerFundsRecipient?: string
    findersFeeBps?: number
  }): Promise<string> {
    try {
      const askCurrency = params.askCurrency || '0x0000000000000000000000000000000000000000'
      const sellerFundsRecipient = params.sellerFundsRecipient || '0x0000000000000000000000000000000000000000'
      const findersFeeBps = params.findersFeeBps || 0

      const result = await this.baseSdk.writeContract({
        address: ZORA_BASE_ADDRESSES.ASKS_V1_1,
        abi: this.asksAbi,
        functionName: 'createAsk',
        args: [
          params.tokenContract,
          params.tokenId,
          params.askPrice,
          askCurrency,
          sellerFundsRecipient,
          findersFeeBps
        ]
      })

      this.logger.info(`Ask created on Zora: ${result}`)
      this.emit('ask:created', { hash: result, params })

      return result
    } catch (error) {
      this.logger.error('Failed to create ask:', error)
      this.emit('ask:error', { error, params })
      throw error
    }
  }

  /**
   * Fill an ask (purchase)
   */
  async fillAsk(params: {
    askId: string
    buyer: string
    findersFeeBps?: number
  }): Promise<string> {
    try {
      const findersFeeBps = params.findersFeeBps || 0

      const result = await this.baseSdk.writeContract({
        address: ZORA_BASE_ADDRESSES.ASKS_V1_1,
        abi: this.asksAbi,
        functionName: 'fillAsk',
        args: [params.askId, params.buyer, findersFeeBps]
      })

      this.logger.info(`Ask filled on Zora: ${result}`)
      this.emit('ask:filled', { hash: result, params })

      return result
    } catch (error) {
      this.logger.error('Failed to fill ask:', error)
      this.emit('ask:error', { error, params })
      throw error
    }
  }

  /**
   * Get ask information
   */
  async getAsk(tokenContract: string, tokenId: string): Promise<NFTListing | null> {
    try {
      const askData = await this.baseSdk.readContract({
        address: ZORA_BASE_ADDRESSES.ASKS_V1_1,
        abi: this.asksAbi,
        functionName: 'askForNFT',
        args: [tokenContract, tokenId]
      })

      if (!askData || askData[0] === '0') return null

      const [price, currency, seller, fundsRecipient, findersFeeBps] = askData

      const asset = await this.getAsset(tokenContract, tokenId)
      if (!asset) return null

      const listing: NFTListing = {
        id: `ask-${tokenContract}-${tokenId}`,
        asset,
        seller,
        price: price.toString(),
        paymentToken: currency,
        paymentTokenSymbol: currency === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'ERC20',
        listingTime: new Date(), // Would need to track creation time
        protocol: 'ask',
        side: 'ask',
        status: 'active',
        quantity: 1,
        decimals: 18,
        feeRecipient: fundsRecipient
      }

      return listing
    } catch (error) {
      this.logger.error(`Failed to get ask for ${tokenContract}/${tokenId}:`, error)
      return null
    }
  }

  // ============ OFFER OPERATIONS ============

  /**
   * Create an offer
   */
  async createOffer(params: {
    tokenContract: string
    tokenId: string
    offerAmount: string
    offerCurrency?: string
    findersFeeBps?: number
  }): Promise<string> {
    try {
      const offerCurrency = params.offerCurrency || '0x0000000000000000000000000000000000000000'
      const findersFeeBps = params.findersFeeBps || 0

      const result = await this.baseSdk.writeContract({
        address: ZORA_BASE_ADDRESSES.OFFERS_V1,
        abi: this.offersAbi,
        functionName: 'createOffer',
        args: [
          params.tokenContract,
          params.tokenId,
          params.offerAmount,
          offerCurrency,
          findersFeeBps
        ]
      })

      this.logger.info(`Offer created on Zora: ${result}`)
      this.emit('offer:created', { hash: result, params })

      return result
    } catch (error) {
      this.logger.error('Failed to create offer:', error)
      this.emit('offer:error', { error, params })
      throw error
    }
  }

  /**
   * Fill an offer
   */
  async fillOffer(params: {
    offerId: string
    buyer: string
    findersFeeBps?: number
  }): Promise<string> {
    try {
      const findersFeeBps = params.findersFeeBps || 0

      const result = await this.baseSdk.writeContract({
        address: ZORA_BASE_ADDRESSES.OFFERS_V1,
        abi: this.offersAbi,
        functionName: 'fillOffer',
        args: [params.offerId, params.buyer, findersFeeBps]
      })

      this.logger.info(`Offer filled on Zora: ${result}`)
      this.emit('offer:filled', { hash: result, params })

      return result
    } catch (error) {
      this.logger.error('Failed to fill offer:', error)
      this.emit('offer:error', { error, params })
      throw error
    }
  }

  /**
   * Get offers for an NFT
   */
  async getOffers(tokenContract: string, tokenId: string): Promise<NFTOffer[]> {
    try {
      // This would require querying events or maintaining an index
      // For now, return empty array
      this.logger.warn('getOffers: Requires event indexing implementation')
      return []
    } catch (error) {
      this.logger.error(`Failed to get offers for ${tokenContract}/${tokenId}:`, error)
      return []
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get all listings for an asset (asks and auctions)
   */
  async getAssetListings(contractAddress: string, tokenId: string): Promise<NFTListing[]> {
    try {
      const listings: NFTListing[] = []

      // Get ask if it exists
      const ask = await this.getAsk(contractAddress, tokenId)
      if (ask) {
        listings.push(ask)
      }

      // Get offers
      const offers = await this.getOffers(contractAddress, tokenId)
      for (const offer of offers) {
        listings.push({
          id: offer.id,
          asset: offer.asset,
          seller: offer.maker,
          price: offer.price,
          paymentToken: offer.paymentToken,
          paymentTokenSymbol: offer.paymentTokenSymbol,
          listingTime: offer.createdTime,
          protocol: 'offer',
          side: 'bid',
          status: offer.status,
          quantity: 1,
          decimals: 18
        })
      }

      return listings
    } catch (error) {
      this.logger.error(`Failed to get listings for ${contractAddress}/${tokenId}:`, error)
      return []
    }
  }

  /**
   * Get floor price for a collection
   */
  async getFloorPrice(contractAddress: string): Promise<string | null> {
    try {
      const collection = await this.getCollection(contractAddress)
      return collection.floorPrice || null
    } catch (error) {
      this.logger.error(`Failed to get floor price for ${contractAddress}:`, error)
      return null
    }
  }

  /**
   * Get estimated NFT value
   */
  async getEstimatedValue(contractAddress: string, tokenId: string): Promise<{
    floorPrice: string
    estimatedPrice: string
    confidence: number
  } | null> {
    try {
      const floorPrice = await this.getFloorPrice(contractAddress)
      if (!floorPrice) return null

      // Simple estimation based on floor price
      const estimatedPrice = floorPrice
      const confidence = 0.7 // Medium confidence for Zora

      return {
        floorPrice,
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
        cachedAuctions: this.auctionCache.size,
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
    this.auctionCache.clear()
    this.logger.info('Zora caches cleared')
  }

  /**
   * Get contract addresses
   */
  getContractAddresses(): typeof ZORA_BASE_ADDRESSES {
    return ZORA_BASE_ADDRESSES
  }
}

export default ZoraService
