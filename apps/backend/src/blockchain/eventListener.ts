import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { WebSocket } from 'ws'
import { EventIndexer } from './eventIndexer'
import { EventParser } from './eventParser'
import { ChainConfig } from './chainConfig'
import { Logger } from '../utils/logger'

// Event interface
export interface BlockchainEvent {
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

// Event subscription interface
export interface EventSubscription {
  id: string
  address: string
  topics: string[]
  fromBlock?: number
  toBlock?: 'latest'
  callback: (event: BlockchainEvent) => void
  active: boolean
  lastProcessedBlock?: number
}

// WebSocket connection interface
export interface WebSocketConnection {
  id: string
  chainId: number
  url: string
  ws?: WebSocket
  provider?: ethers.providers.WebSocketProvider
  connected: boolean
  reconnectAttempts: number
  lastActivity: Date
  subscriptions: Map<string, EventSubscription>
}

// Event listener class
export class EventListener extends EventEmitter {
  private connections: Map<number, WebSocketConnection> = new Map()
  private eventIndexer: EventIndexer
  private eventParser: EventParser
  private logger: Logger
  private reconnectIntervals: Map<number, NodeJS.Timeout> = new Map()
  private processingQueue: BlockchainEvent[] = []
  private isProcessing: boolean = false
  private batchSize: number = 100
  private processingInterval: number = 1000 // 1 second

  constructor(
    private chainConfigs: ChainConfig[],
    private eventIndexer: EventIndexer,
    private eventParser: EventParser,
    logger: Logger
  ) {
    super()
    this.eventIndexer = eventIndexer
    this.eventParser = eventParser
    this.logger = logger
  }

  // Initialize all chain connections
  async initialize(): Promise<void> {
    this.logger.info('Initializing event listener...')

    for (const config of this.chainConfigs) {
      await this.createConnection(config)
    }

    // Start processing queue
    this.startProcessingQueue()

    this.logger.info(`Event listener initialized for ${this.chainConfigs.length} chains`)
  }

  // Create WebSocket connection for a chain
  private async createConnection(config: ChainConfig): Promise<WebSocketConnection> {
    const connection: WebSocketConnection = {
      id: `chain-${config.chainId}`,
      chainId: config.chainId,
      url: config.wsUrl,
      connected: false,
      reconnectAttempts: 0,
      lastActivity: new Date(),
      subscriptions: new Map()
    }

    try {
      // Create WebSocket provider
      const provider = new ethers.providers.WebSocketProvider(config.wsUrl, {
        name: config.network,
        chainId: config.chainId,
        polling: false,
        batchMaxSize: 1,
        batchMaxCount: 1,
        batchStallTime: 0
      })

      // Create WebSocket connection
      const ws = new WebSocket(config.wsUrl)
      
      connection.ws = ws
      connection.provider = provider

      // Setup WebSocket event handlers
      this.setupWebSocketHandlers(connection, config)

      // Setup provider event handlers
      this.setupProviderHandlers(connection, config)

      // Connect to WebSocket
      await this.connectWebSocket(connection)

      this.connections.set(config.chainId, connection)

      this.logger.info(`Created connection for chain ${config.chainId}`)

    } catch (error) {
      this.logger.error(`Failed to create connection for chain ${config.chainId}:`, error)
      throw error
    }

    return connection
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(connection: WebSocketConnection, config: ChainConfig): void {
    if (!connection.ws) return

    connection.ws.on('open', () => {
      this.logger.info(`WebSocket connected for chain ${config.chainId}`)
      connection.connected = true
      connection.reconnectAttempts = 0
      connection.lastActivity = new Date()
      
      this.emit('connection:open', { chainId: config.chainId })
    })

    connection.ws.on('message', async (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString())
        await this.handleWebSocketMessage(connection, message, config)
      } catch (error) {
        this.logger.error(`Error processing WebSocket message for chain ${config.chainId}:`, error)
      }
    })

    connection.ws.on('close', (code: number, reason: string) => {
      this.logger.warn(`WebSocket closed for chain ${config.chainId}: ${code} - ${reason}`)
      connection.connected = false
      
      this.emit('connection:close', { chainId: config.chainId, code, reason })
      
      // Attempt reconnection
      this.scheduleReconnection(connection, config)
    })

    connection.ws.on('error', (error: Error) => {
      this.logger.error(`WebSocket error for chain ${config.chainId}:`, error)
      connection.connected = false
      
      this.emit('connection:error', { chainId: config.chainId, error })
    })

    connection.ws.on('ping', () => {
      connection.lastActivity = new Date()
      
      // Send pong response
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.pong()
      }
    })

    connection.ws.on('pong', () => {
      connection.lastActivity = new Date()
    })
  }

  // Setup provider event handlers
  private setupProviderHandlers(connection: WebSocketConnection, config: ChainConfig): void {
    if (!connection.provider) return

    // Listen to blocks
    connection.provider.on('block', async (blockNumber: number) => {
      this.logger.debug(`New block on chain ${config.chainId}: ${blockNumber}`)
      
      connection.lastActivity = new Date()
      
      this.emit('block:new', { chainId: config.chainId, blockNumber })
      
      // Process block for events
      await this.processBlock(connection, blockNumber, config)
    })

    // Listen to transaction confirmations
    connection.provider.on('pending', (tx: ethers.providers.TransactionResponse) => {
      this.logger.debug(`Pending transaction on chain ${config.chainId}: ${tx.hash}`)
      
      this.emit('transaction:pending', { chainId: config.chainId, transaction: tx })
    })

    // Listen to transaction confirmations
    connection.provider.on('transaction', (tx: ethers.providers.TransactionResponse) => {
      this.logger.debug(`Transaction confirmed on chain ${config.chainId}: ${tx.hash}`)
      
      this.emit('transaction:confirmed', { chainId: config.chainId, transaction: tx })
    })

    // Listen to errors
    connection.provider.on('error', (error: any) => {
      this.logger.error(`Provider error on chain ${config.chainId}:`, error)
      
      this.emit('provider:error', { chainId: config.chainId, error })
    })
  }

  // Connect WebSocket
  private async connectWebSocket(connection: WebSocketConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!connection.ws) {
        reject(new Error('WebSocket not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'))
      }, 10000) // 10 seconds

      connection.ws.once('open', () => {
        clearTimeout(timeout)
        resolve()
      })

      connection.ws.once('error', (error: Error) => {
        clearTimeout(timeout)
        reject(error)
      })

      connection.ws.connect()
    })
  }

  // Handle WebSocket message
  private async handleWebSocketMessage(
    connection: WebSocketConnection,
    message: any,
    config: ChainConfig
  ): Promise<void> {
    connection.lastActivity = new Date()

    // Handle different message types
    switch (message.type) {
      case 'eth_subscription':
        await this.handleSubscriptionMessage(connection, message, config)
        break
      case 'eth_block':
        await this.handleBlockMessage(connection, message, config)
        break
      case 'eth_transaction':
        await this.handleTransactionMessage(connection, message, config)
        break
      default:
        this.logger.warn(`Unknown message type: ${message.type}`)
    }
  }

  // Handle subscription message
  private async handleSubscriptionMessage(
    connection: WebSocketConnection,
    message: any,
    config: ChainConfig
  ): Promise<void> {
    if (!message.data || !message.data.result) return

    const event = message.data.result
    
    // Parse event
    const parsedEvent = await this.eventParser.parseEvent(event, config)
    
    // Add to processing queue
    this.processingQueue.push(parsedEvent)
    
    this.emit('event:received', { chainId: config.chainId, event: parsedEvent })
  }

  // Handle block message
  private async handleBlockMessage(
    connection: WebSocketConnection,
    message: any,
    config: ChainConfig
  ): Promise<void> {
    if (!message.data || !message.data.result) return

    const block = message.data.result
    
    this.emit('block:received', { chainId: config.chainId, block })
    
    // Process block for events
    await this.processBlock(connection, parseInt(block.number, 16), config)
  }

  // Handle transaction message
  private async handleTransactionMessage(
    connection: WebSocketConnection,
    message: any,
    config: ChainConfig
  ): Promise<void> {
    if (!message.data || !message.data.result) return

    const transaction = message.data.result
    
    this.emit('transaction:received', { chainId: config.chainId, transaction })
  }

  // Process block for events
  private async processBlock(
    connection: WebSocketConnection,
    blockNumber: number,
    config: ChainConfig
  ): Promise<void> {
    try {
      // Get block with transactions
      const block = await connection.provider?.getBlock(blockNumber, true)
      
      if (!block) return

      // Process each transaction for events
      for (const tx of block.transactions) {
        await this.processTransaction(tx, block, config)
      }

      // Update last processed block
      connection.lastProcessedBlock = blockNumber

    } catch (error) {
      this.logger.error(`Error processing block ${blockNumber} on chain ${config.chainId}:`, error)
    }
  }

  // Process transaction for events
  private async processTransaction(
    tx: ethers.providers.TransactionResponse,
    block: any,
    config: ChainConfig
  ): Promise<void> {
    try {
      // Get transaction receipt
      const receipt = await tx.wait()
      
      if (!receipt) return

      // Process logs for events
      for (const log of receipt.logs) {
        await this.processLog(log, tx, block, config)
      }

    } catch (error) {
      this.logger.error(`Error processing transaction ${tx.hash} on chain ${config.chainId}:`, error)
    }
  }

  // Process log for events
  private async processLog(
    log: ethers.providers.Log,
    tx: ethers.providers.TransactionResponse,
    block: any,
    config: ChainConfig
  ): Promise<void> {
    try {
      // Parse event from log
      const event = await this.eventParser.parseLog(log, tx, block, config)
      
      if (event) {
        // Add to processing queue
        this.processingQueue.push(event)
        
        this.emit('event:found', { chainId: config.chainId, event })
      }

    } catch (error) {
      this.logger.error(`Error processing log on chain ${config.chainId}:`, error)
    }
  }

  // Subscribe to events
  async subscribeToEvents(
    chainId: number,
    address: string,
    topics: string[],
    callback: (event: BlockchainEvent) => void
  ): Promise<string> {
    const connection = this.connections.get(chainId)
    if (!connection || !connection.provider) {
      throw new Error(`No connection available for chain ${chainId}`)
    }

    const subscriptionId = `sub-${Date.now()}-${Math.random()}`
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      address,
      topics,
      callback,
      active: true
    }

    connection.subscriptions.set(subscriptionId, subscription)

    try {
      // Subscribe to events
      const filter = {
        address,
        topics
      }

      connection.provider.on(filter, (log: ethers.providers.Log) => {
        this.handleSubscriptionEvent(connection, subscriptionId, log, chainId)
      })

      this.logger.info(`Subscribed to events for ${address} on chain ${chainId}`)

      return subscriptionId

    } catch (error) {
      this.logger.error(`Failed to subscribe to events on chain ${chainId}:`, error)
      throw error
    }
  }

  // Handle subscription event
  private async handleSubscriptionEvent(
    connection: WebSocketConnection,
    subscriptionId: string,
    log: ethers.providers.Log,
    chainId: number
  ): Promise<void> {
    const subscription = connection.subscriptions.get(subscriptionId)
    if (!subscription || !subscription.active) return

    try {
      // Parse event
      const event = await this.eventParser.parseLog(log, null, null, this.getChainConfig(chainId))
      
      if (event) {
        // Call subscription callback
        subscription.callback(event)
        
        // Add to processing queue
        this.processingQueue.push(event)
        
        this.emit('subscription:event', { chainId, subscriptionId, event })
      }

    } catch (error) {
      this.logger.error(`Error handling subscription event:`, error)
    }
  }

  // Unsubscribe from events
  async unsubscribeFromEvents(chainId: number, subscriptionId: string): Promise<void> {
    const connection = this.connections.get(chainId)
    if (!connection) return

    const subscription = connection.subscriptions.get(subscriptionId)
    if (!subscription) return

    // Mark as inactive
    subscription.active = false

    // Remove from connection
    connection.subscriptions.delete(subscriptionId)

    this.logger.info(`Unsubscribed from events on chain ${chainId}`)
  }

  // Start processing queue
  private startProcessingQueue(): void {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) return

      this.isProcessing = true

      try {
        // Process batch of events
        const batch = this.processingQueue.splice(0, this.batchSize)
        
        for (const event of batch) {
          await this.processEvent(event)
        }

        this.logger.debug(`Processed ${batch.length} events`)

      } catch (error) {
        this.logger.error('Error processing event batch:', error)
      } finally {
        this.isProcessing = false
      }
    }, this.processingInterval)
  }

  // Process single event
  private async processEvent(event: BlockchainEvent): Promise<void> {
    try {
      // Store event in indexer
      await this.eventIndexer.storeEvent(event)
      
      // Emit event processed
      this.emit('event:processed', { event })

    } catch (error) {
      this.logger.error(`Error processing event ${event.id}:`, error)
      
      // Add back to queue for retry
      if (event.retryCount < 3) {
        event.retryCount++
        this.processingQueue.push(event)
      }
    }
  }

  // Schedule reconnection
  private scheduleReconnection(connection: WebSocketConnection, config: ChainConfig): void {
    const delay = Math.min(1000 * Math.pow(2, connection.reconnectAttempts), 30000) // Max 30 seconds
    
    this.logger.info(`Scheduling reconnection for chain ${config.chainId} in ${delay}ms`)
    
    const interval = setTimeout(async () => {
      connection.reconnectAttempts++
      
      try {
        await this.createConnection(config)
        this.logger.info(`Successfully reconnected to chain ${config.chainId}`)
      } catch (error) {
        this.logger.error(`Reconnection failed for chain ${config.chainId}:`, error)
        this.scheduleReconnection(connection, config)
      }
    }, delay)

    this.reconnectIntervals.set(config.chainId, interval)
  }

  // Get chain config
  private getChainConfig(chainId: number): ChainConfig | undefined {
    return this.chainConfigs.find(config => config.chainId === chainId)
  }

  // Get connection status
  getConnectionStatus(chainId: number): {
    connected: boolean
    reconnectAttempts: number
    lastActivity: Date
    subscriptions: number
  } | null {
    const connection = this.connections.get(chainId)
    if (!connection) return null

    return {
      connected: connection.connected,
      reconnectAttempts: connection.reconnectAttempts,
      lastActivity: connection.lastActivity,
      subscriptions: connection.subscriptions.size
    }
  }

  // Get all connections status
  getAllConnectionsStatus(): Array<{
    chainId: number
    connected: boolean
    reconnectAttempts: number
    lastActivity: Date
    subscriptions: number
  }> {
    return Array.from(this.connections.entries()).map(([chainId, connection]) => ({
      chainId,
      connected: connection.connected,
      reconnectAttempts: connection.reconnectAttempts,
      lastActivity: connection.lastActivity,
      subscriptions: connection.subscriptions.size
    }))
  }

  // Shutdown event listener
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down event listener...')

    // Clear reconnection intervals
    for (const interval of this.reconnectIntervals.values()) {
      clearInterval(interval)
    }
    this.reconnectIntervals.clear()

    // Close all WebSocket connections
    for (const connection of this.connections.values()) {
      if (connection.ws) {
        connection.ws.close()
      }
    }

    this.connections.clear()

    // Process remaining events
    while (this.processingQueue.length > 0) {
      const event = this.processingQueue.shift()!
      await this.processEvent(event)
    }

    this.logger.info('Event listener shutdown complete')
  }

  // Get processing queue stats
  getProcessingQueueStats(): {
    queueLength: number
    isProcessing: boolean
    batchSize: number
    processingInterval: number
  } {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize,
      processingInterval: this.processingInterval
    }
  }

  // Configure processing settings
  configureProcessing(settings: {
    batchSize?: number
    processingInterval?: number
  }): void {
    if (settings.batchSize) {
      this.batchSize = settings.batchSize
    }
    if (settings.processingInterval) {
      this.processingInterval = settings.processingInterval
    }
  }
}

export default EventListener
