import { ethers } from 'ethers'
import { ABI } from './abi'
import { ChainConfig } from './chainConfig'
import { BlockchainEvent } from './eventListener'
import { Logger } from '../utils/logger'

// Parsed event interface
export interface ParsedEvent {
  id: string
  chainId: number
  blockNumber: number
  blockHash: string
  transactionHash: string
  address: string
  topics: string[]
  data: string
  timestamp: Date
  eventName: string
  parsedData: any
  confirmations: number
  status: 'pending' | 'confirmed' | 'failed'
  retryCount: number
}

// Event signature mapping
const EVENT_SIGNATURES: Record<string, string> = {
  'AuctionCreated': '0x' + ethers.id(ethers.utils.formatBytes32String('AuctionCreated(uint256,address,uint256,uint256,uint256)')).slice(2),
  'AuctionEnded': '0x' + ethers.id(ethers.utils.formatBytes32String('AuctionEnded(uint256,address,uint256)')).slice(2),
  'BidPlaced': '0x' + ethers.id(ethers.utils.formatBytes32String('BidPlaced(uint256,address,uint256)')).slice(2),
  'BidWithdrawn': '0x' + ethers.id(ethers.utils.formatBytes32String('BidWithdrawn(uint256,address)')).slice(2),
  'AssetCreated': '0x' + ethers.id(ethers.utils.formatBytes32String('AssetCreated(uint256,address)')).slice(2),
  'AssetUpdated': '0x' + ethers.id(ethers.utils.formatBytes32String('AssetUpdated(uint256,address)')).slice(2),
  'AssetTransferred': '0x' + ethers.id(ethers.utils.formatBytes32String('AssetTransferred(uint256,address,address)')).slice(2),
  'PaymentReceived': '0x' + ethers.id(ethers.utils.formatBytes32String('PaymentReceived(uint256,address,uint256)')).slice(2),
  'PaymentRefunded': '0x' + ethers.id(ethers.utils.formatBytes32String('PaymentRefunded(uint256,address,uint256)')).slice(2),
  'UserRegistered': '0x' + ethers.id(ethers.utils.formatBytes32String('UserRegistered(address)')).slice(2),
  'UserUpdated': '0x' + ethers.id(ethers.utils.formatBytes32String('UserUpdated(address)')).slice(2),
}

// Reverse mapping for event name lookup
const SIGNATURE_TO_EVENT: Record<string, string> = Object.fromEntries(
  Object.entries(EVENT_SIGNATURES).map(([name, signature]) => [signature, name])
)

// Event parser class
export class EventParser {
  private logger: Logger
  private contractInterfaces: Map<string, ethers.utils.Interface>

  constructor(logger: Logger) {
    this.logger = logger
    this.contractInterfaces = new Map()
    this.initializeContractInterfaces()
  }

  // Initialize contract interfaces
  private initializeContractInterfaces(): void {
    try {
      // Initialize main auction contract interface
      const auctionInterface = new ethers.utils.Interface(ABI.AUCTION_CONTRACT)
      this.contractInterfaces.set('auction', auctionInterface)

      // Initialize asset contract interface
      const assetInterface = new ethers.utils.Interface(ABI.ASSET_CONTRACT)
      this.contractInterfaces.set('asset', assetInterface)

      // Initialize payment contract interface
      const paymentInterface = new ethers.utils.Interface(ABI.PAYMENT_CONTRACT)
      this.contractInterfaces.set('payment', paymentInterface)

      // Initialize user contract interface
      const userInterface = new ethers.utils.Interface(ABI.USER_CONTRACT)
      this.contractInterfaces.set('user', userInterface)

      this.logger.info('Contract interfaces initialized')

    } catch (error) {
      this.logger.error('Failed to initialize contract interfaces:', error)
      throw error
    }
  }

  // Parse event from log
  async parseLog(
    log: ethers.providers.Log,
    tx: ethers.providers.TransactionResponse | null,
    block: any,
    config: ChainConfig
  ): Promise<ParsedEvent | null> {
    try {
      // Generate event ID
      const eventId = `${log.transactionHash}-${log.logIndex}`
      
      // Get event name from topic
      const eventName = this.getEventNameFromTopic(log.topics[0])
      
      if (!eventName) {
        this.logger.warn(`Unknown event topic: ${log.topics[0]}`)
        return null
      }

      // Parse event data
      const parsedData = await this.parseEventData(log, eventName, config)

      // Get timestamp
      const timestamp = block ? new Date(parseInt(block.timestamp, 16) * 1000) : new Date()

      const event: ParsedEvent = {
        id: eventId,
        chainId: config.chainId,
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        transactionHash: log.transactionHash,
        address: log.address,
        topics: log.topics,
        data: log.data,
        timestamp,
        eventName,
        parsedData,
        confirmations: 0,
        status: 'pending',
        retryCount: 0
      }

      this.logger.debug(`Parsed event: ${eventName} from log ${log.transactionHash}`)

      return event

    } catch (error) {
      this.logger.error(`Error parsing log:`, error)
      return null
    }
  }

  // Parse event from WebSocket message
  async parseEvent(
    event: any,
    config: ChainConfig
  ): Promise<ParsedEvent> {
    try {
      // Generate event ID
      const eventId = `${event.transactionHash}-${event.logIndex}`
      
      // Get event name from topic
      const eventName = this.getEventNameFromTopic(event.topics[0])
      
      // Parse event data
      const parsedData = await this.parseEventData(event, eventName, config)

      const parsedEvent: ParsedEvent = {
        id: eventId,
        chainId: config.chainId,
        blockNumber: parseInt(event.blockNumber, 16),
        blockHash: event.blockHash,
        transactionHash: event.transactionHash,
        address: event.address,
        topics: event.topics,
        data: event.data,
        timestamp: new Date(),
        eventName,
        parsedData,
        confirmations: 0,
        status: 'pending',
        retryCount: 0
      }

      this.logger.debug(`Parsed event: ${eventName} from WebSocket`)

      return parsedEvent

    } catch (error) {
      this.logger.error(`Error parsing event from WebSocket:`, error)
      throw error
    }
  }

  // Get event name from topic
  private getEventNameFromTopic(topic: string): string | null {
    return SIGNATURE_TO_EVENT[topic] || null
  }

  // Parse event data based on event name
  private async parseEventData(
    event: any,
    eventName: string,
    config: ChainConfig
  ): Promise<any> {
    try {
      switch (eventName) {
        case 'AuctionCreated':
          return this.parseAuctionCreated(event, config)
        case 'AuctionEnded':
          return this.parseAuctionEnded(event, config)
        case 'BidPlaced':
          return this.parseBidPlaced(event, config)
        case 'BidWithdrawn':
          return this.parseBidWithdrawn(event, config)
        case 'AssetCreated':
          return this.parseAssetCreated(event, config)
        case 'AssetUpdated':
          return this.parseAssetUpdated(event, config)
        case 'AssetTransferred':
          return this.parseAssetTransferred(event, config)
        case 'PaymentReceived':
          return this.parsePaymentReceived(event, config)
        case 'PaymentRefunded':
          return this.parsePaymentRefunded(event, config)
        case 'UserRegistered':
          return this.parseUserRegistered(event, config)
        case 'UserUpdated':
          return this.parseUserUpdated(event, config)
        default:
          this.logger.warn(`Unknown event type: ${eventName}`)
          return null
      }
    } catch (error) {
      this.logger.error(`Error parsing event data for ${eventName}:`, error)
      return null
    }
  }

  // Parse AuctionCreated event
  private parseAuctionCreated(event: any, config: ChainConfig): any {
    const auctionInterface = this.contractInterfaces.get('auction')
    if (!auctionInterface) return null

    try {
      const parsedLog = auctionInterface.parseLog(event.data, event.topics)
      
      return {
        auctionId: parsedLog.args.auctionId.toString(),
        seller: parsedLog.args.seller.toLowerCase(),
        assetId: parsedLog.args.assetId.toString(),
        startingBid: ethers.utils.formatEther(parsedLog.args.startingBid),
        endTime: new Date(parsedLog.args.endTime.toNumber() * 1000),
        metadata: parsedLog.args.metadata
      }
    } catch (error) {
      this.logger.error('Error parsing AuctionCreated event:', error)
      return null
    }
  }

  // Parse AuctionEnded event
  private parseAuctionEnded(event: any, config: ChainConfig): any {
    const auctionInterface = this.contractInterfaces.get('auction')
    if (!auctionInterface) return null

    try {
      const parsedLog = auctionInterface.parseLog(event.data, event.topics)
      
      return {
        auctionId: parsedLog.args.auctionId.toString(),
        winner: parsedLog.args.winner.toLowerCase(),
        winningBid: ethers.utils.formatEther(parsedLog.args.winningBid),
        endTime: new Date(),
        metadata: parsedLog.args.metadata
      }
    } catch (error) {
      this.logger.error('Error parsing AuctionEnded event:', error)
      return null
    }
  }

  // Parse BidPlaced event
  private parseBidPlaced(event: any, config: ChainConfig): any {
    const auctionInterface = this.contractInterfaces.get('auction')
    if (!auctionInterface) return null

    try {
      const parsedLog = auctionInterface.parseLog(event.data, event.topics)
      
      return {
        auctionId: parsedLog.args.auctionId.toString(),
        bidder: parsedLog.args.bidder.toLowerCase(),
        amount: ethers.utils.formatEther(parsedLog.args.amount),
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000),
        metadata: parsedLog.args.metadata
      }
    } catch (error) {
      this.logger.error('Error parsing BidPlaced event:', error)
      return null
    }
  }

  // Parse BidWithdrawn event
  private parseBidWithdrawn(event: any, config: ChainConfig): any {
    const auctionInterface = this.contractInterfaces.get('auction')
    if (!auctionInterface) return null

    try {
      const parsedLog = auctionInterface.parseLog(event.data, event.topics)
      
      return {
        auctionId: parsedLog.args.auctionId.toString(),
        bidder: parsedLog.args.bidder.toLowerCase(),
        amount: ethers.utils.formatEther(parsedLog.args.amount),
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000),
        reason: parsedLog.args.reason
      }
    } catch (error) {
      this.logger.error('Error parsing BidWithdrawn event:', error)
      return null
    }
  }

  // Parse AssetCreated event
  private parseAssetCreated(event: any, config: ChainConfig): any {
    const assetInterface = this.contractInterfaces.get('asset')
    if (!assetInterface) return null

    try {
      const parsedLog = assetInterface.parseLog(event.data, event.topics)
      
      return {
        assetId: parsedLog.args.assetId.toString(),
        owner: parsedLog.args.owner.toLowerCase(),
        metadata: parsedLog.args.metadata,
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000)
      }
    } catch (error) {
      this.logger.error('Error parsing AssetCreated event:', error)
      return null
    }
  }

  // Parse AssetUpdated event
  private parseAssetUpdated(event: any, config: ChainConfig): any {
    const assetInterface = this.contractInterfaces.get('asset')
    if (!assetInterface) return null

    try {
      const parsedLog = assetInterface.parseLog(event.data, event.topics)
      
      return {
        assetId: parsedLog.args.assetId.toString(),
        metadata: parsedLog.args.metadata,
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000)
      }
    } catch (error) {
      this.logger.error('Error parsing AssetUpdated event:', error)
      return null
    }
  }

  // Parse AssetTransferred event
  private parseAssetTransferred(event: any, config: ChainConfig): any {
    const assetInterface = this.contractInterfaces.get('asset')
    if (!assetInterface) return null

    try {
      const parsedLog = assetInterface.parseLog(event.data, event.topics)
      
      return {
        assetId: parsedLog.args.assetId.toString(),
        from: parsedLog.args.from.toLowerCase(),
        to: parsedLog.args.to.toLowerCase(),
        metadata: parsedLog.args.metadata,
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000)
      }
    } catch (error) {
      this.logger.error('Error parsing AssetTransferred event:', error)
      return null
    }
  }

  // Parse PaymentReceived event
  private parsePaymentReceived(event: any, config: ChainConfig): any {
    const paymentInterface = this.contractInterfaces.get('payment')
    if (!paymentInterface) return null

    try {
      const parsedLog = paymentInterface.parseLog(event.data, event.topics)
      
      return {
        paymentId: parsedLog.args.paymentId.toString(),
        from: parsedLog.args.from.toLowerCase(),
        to: parsedLog.args.to.toLowerCase(),
        amount: ethers.utils.formatEther(parsedLog.args.amount),
        currency: parsedLog.args.currency,
        auctionId: parsedLog.args.auctionId.toString(),
        metadata: parsedLog.args.metadata,
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000)
      }
    } catch (error) {
      this.logger.error('Error parsing PaymentReceived event:', error)
      return null
    }
  }

  // Parse PaymentRefunded event
  private parsePaymentRefunded(event: any, config: ChainConfig): any {
    const paymentInterface = this.contractInterfaces.get('payment')
    if (!paymentInterface) return null

    try {
      const parsedLog = paymentInterface.parseLog(event.data, event.topics)
      
      return {
        paymentId: parsedLog.args.paymentId.toString(),
        from: parsedLog.args.from.toLowerCase(),
        to: parsedLog.args.to.toLowerCase(),
        amount: ethers.utils.formatEther(parsedLog.args.amount),
        currency: parsedLog.args.currency,
        reason: parsedLog.args.reason,
        metadata: parsedLog.args.metadata,
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000)
      }
    } catch (error) {
      this.logger.error('Error parsing PaymentRefunded event:', error)
      return null
    }
  }

  // Parse UserRegistered event
  private parseUserRegistered(event: any, config: ChainConfig): any {
    const userInterface = this.contractInterfaces.get('user')
    if (!userInterface) return null

    try {
      const parsedLog = userInterface.parseLog(event.data, event.topics)
      
      return {
        user: parsedLog.args.user.toLowerCase(),
        metadata: parsedLog.args.metadata,
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000)
      }
    } catch (error) {
      this.logger.error('Error parsing UserRegistered event:', error)
      return null
    }
  }

  // Parse UserUpdated event
  private parseUserUpdated(event: any, config: ChainConfig): any {
    const userInterface = this.contractInterfaces.get('user')
    if (!userInterface) return null

    try {
      const parsedLog = userInterface.parseLog(event.data, event.topics)
      
      return {
        user: parsedLog.args.user.toLowerCase(),
        metadata: parsedLog.args.metadata,
        timestamp: new Date(parsedLog.args.timestamp.toNumber() * 1000)
      }
    } catch (error) {
      this.logger.error('Error parsing UserUpdated event:', error)
      return null
    }
  }

  // Validate parsed event
  validateParsedEvent(event: ParsedEvent): boolean {
    try {
      // Check required fields
      if (!event.id || !event.chainId || !event.blockNumber || !event.transactionHash) {
        return false
      }

      // Check event name
      if (!event.eventName || !Object.values(EVENT_SIGNATURES).includes(event.topics[0])) {
        return false
      }

      // Check timestamp
      if (!event.timestamp || isNaN(event.timestamp.getTime())) {
        return false
      }

      // Check parsed data
      if (!event.parsedData) {
        return false
      }

      return true

    } catch (error) {
      this.logger.error('Error validating parsed event:', error)
      return false
    }
  }

  // Get event statistics
  getEventStats(events: ParsedEvent[]): {
    totalEvents: number
    eventsByType: Record<string, number>
    eventsByChain: Record<number, number>
    timeRange: { start: Date; end: Date }
  } {
    const stats = {
      totalEvents: events.length,
      eventsByType: {} as Record<string, number>,
      eventsByChain: {} as Record<number, number>,
      timeRange: { start: new Date(), end: new Date(0) }
    }

    if (events.length === 0) return stats

    // Count events by type
    events.forEach(event => {
      stats.eventsByType[event.eventName] = (stats.eventsByType[event.eventName] || 0) + 1
      stats.eventsByChain[event.chainId] = (stats.eventsByChain[event.chainId] || 0) + 1
      
      // Track time range
      if (event.timestamp < stats.timeRange.start) {
        stats.timeRange.start = event.timestamp
      }
      if (event.timestamp > stats.timeRange.end) {
        stats.timeRange.end = event.timestamp
      }
    })

    return stats
  }

  // Filter events
  filterEvents(events: ParsedEvent[], filters: {
    eventName?: string
    chainId?: number
    fromBlock?: number
    toBlock?: number
    fromTime?: Date
    toTime?: Date
    address?: string
  }): ParsedEvent[] {
    return events.filter(event => {
      if (filters.eventName && event.eventName !== filters.eventName) return false
      if (filters.chainId && event.chainId !== filters.chainId) return false
      if (filters.fromBlock && event.blockNumber < filters.fromBlock) return false
      if (filters.toBlock && event.blockNumber > filters.toBlock) return false
      if (filters.fromTime && event.timestamp < filters.fromTime) return false
      if (filters.toTime && event.timestamp > filters.toTime) return false
      if (filters.address && event.address.toLowerCase() !== filters.address.toLowerCase()) return false
      
      return true
    })
  }

  // Get supported events
  getSupportedEvents(): string[] {
    return Object.keys(EVENT_SIGNATURES)
  }

  // Get event signature
  getEventSignature(eventName: string): string | null {
    return EVENT_SIGNATURES[eventName] || null
  }

  // Add new contract interface
  addContractInterface(name: string, abi: any): void {
    try {
      const interface = new ethers.utils.Interface(abi)
      this.contractInterfaces.set(name, interface)
      this.logger.info(`Added contract interface: ${name}`)
    } catch (error) {
      this.logger.error(`Failed to add contract interface ${name}:`, error)
      throw error
    }
  }

  // Remove contract interface
  removeContractInterface(name: string): void {
    this.contractInterfaces.delete(name)
    this.logger.info(`Removed contract interface: ${name}`)
  }

  // Get contract interface
  getContractInterface(name: string): ethers.utils.Interface | null {
    return this.contractInterfaces.get(name) || null
  }
}

export default EventParser
