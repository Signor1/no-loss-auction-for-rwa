import { EventListener } from './eventListener'
import { EventIndexer } from './eventIndexer'
import { EventReplay } from './eventReplay'
import { ChainConfigManager } from './chainConfig'
import { Logger } from '../utils/logger'

// Blockchain index manager
export class BlockchainIndexManager {
  private eventListener: EventListener
  private eventIndexer: EventIndexer
  private eventReplay: EventReplay
  private chainConfigManager: ChainConfigManager
  private logger: Logger
  private isInitialized: boolean = false
  private activeConnections: Set<number> = new Set()

  constructor(
    eventListener: EventListener,
    eventIndexer: EventIndexer,
    eventReplay: EventReplay,
    chainConfigManager: ChainConfigManager,
    logger: Logger
  ) {
    this.eventListener = eventListener
    this.eventIndexer = eventIndexer
    this.eventReplay = eventReplay
    this.chainConfigManager = chainConfigManager
    this.logger = logger
  }

  // Initialize blockchain indexing
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Blockchain index manager already initialized')
      return
    }

    try {
      this.logger.info('Initializing blockchain index manager...')

      // Initialize event listener
      await this.eventListener.initialize()

      // Start indexing from last known block
      await this.startFromLastKnownBlock()

      // Initialize all chains
      await this.initializeAllChains()

      // Start periodic cleanup
      this.startPeriodicCleanup()

      this.isInitialized = true

      this.logger.info('Blockchain index manager initialized successfully')

    } catch (error) {
      this.logger.error('Failed to initialize blockchain index manager:', error)
      throw error
    }
  }

  // Initialize all chains
  private async initializeAllChains(): Promise<void> {
    const configs = this.chainConfigManager.getAllChainConfigs()
    
    for (const config of configs) {
      try {
        await this.initializeChain(config.chainId)
        this.activeConnections.add(config.chainId)
      } catch (error) {
        this.logger.error(`Failed to initialize chain ${config.chainId}:`, error)
      }
    }
  }

  // Initialize specific chain
  async initializeChain(chainId: number): Promise<void> {
    const config = this.chainConfigManager.getChainConfig(chainId)
    if (!config) {
      throw new Error(`Chain configuration not found for chainId: ${chainId}`)
    }

    try {
      await this.eventListener.createConnection(config)
      this.activeConnections.add(chainId)
      this.logger.info(`Initialized chain ${chainId} (${config.name})`)
    } catch (error) {
      this.logger.error(`Failed to initialize chain ${chainId}:`, error)
      throw error
    }
  }

  // Start indexing from last known block
  private async startFromLastBlock(): Promise<void> {
    try {
      // Get last indexed block from indexer
      const lastIndexedBlock = await this.eventIndexer.getLastIndexedBlock()
      
      if (lastIndexedBlock > 0) {
        this.logger.info(`Starting indexing from block ${lastIndexedBlock}`)
        
        // Start replay from last known block
        await this.eventReplay.startReplay({
          fromBlock: lastIndexedBlock,
          skipExisting: true
        })
      }
    } catch (error) {
      this.logger.error('Failed to start from last known block:', error)
    }
  }

  // Activate chain
  async activateChain(chainId: number): Promise<void> {
    this.chainConfigManager.activateChain(chainId)
    this.logger.info(`Activated chain ${chainId}`)
  }

  // Deactivate chain
  async deactivateChain(chainId: number): Promise<void> {
    this.chainConfigManager.deactivateChain(chainId)
    this.logger.info(`Deactivated chain ${chainId}`)
  }

  // Get active chains
  getActiveChains(): number[] {
    return Array.from(this.activeConnections)
  }

  // Get chain status
  getChainStatus(chainId: number): {
    return this.eventListener.getConnectionStatus(chainId)
  }

  // Get all chain statuses
  getAllChainStatuses(): Array<{
    chainId: number
    connected: boolean
    reconnectAttempts: number
    lastActivity: Date
    subscriptions: number
  }> {
    return this.eventListener.getAllConnectionsStatus()
  }

  // Search events across all chains
  async searchEvents(filter: {
    chainId?: number
    eventName?: string
    address?: string
    fromBlock?: number
    toBlock?: number
    fromTime?: Date
    toTime?: Date
    topics?: string[]
    searchQuery?: string
    limit?: number
    offset?: number
    sortBy?: 'timestamp' | 'blockNumber' | 'eventName'
    sortOrder?: 'asc' | 'desc'
  }): Promise<{
    events: any[]
    total: number
    hasMore: boolean
  }> {
    try {
      // If chainId is specified, filter by that chain only
      const searchFilter = { ...filter }
      if (chainId !== undefined) {
        searchFilter.chainId = chainId
      }

      return await this.eventIndexer.searchEvents(searchFilter)
    } catch (error) {
      this.logger.error('Error searching events:', error)
      throw error
    }
  }

  // Get events by transaction hash
  async getEventsByTransactionHash(transactionHash: string): Promise<any[]> {
    return this.eventIndexer.getEventsByTransactionHash(transactionHash)
  }

  // Get events by address
  async getEventsByAddress(address: string, limit?: number): Promise<any[]> {
    return this.eventIndexer.getEventsByAddress(address, limit)
  }

  // Get events by event name
  async getEventsByEventName(eventName: string, limit?: number): Promise<any[]> {
    return this.eventIndexer.getEventsByEventName(eventName, limit)
  }

  // Get events by block range
  async getEventsByBlockRange(fromBlock: number, toBlock: number): Promise<any[]> {
    return this.eventIndexer.getEventsByBlockRange(fromBlock, toBlock)
  }

  // Get events by time range
  async getEventsByTimeRange(fromTime: Date, toTime: Date): Promise<any[]> {
    return this.eventIndexer.getEventsByTimeRange(fromTime, toTime)
  }

  // Get event statistics
  getEventStatistics(timeRange?: { start: Date; end: Date }): any {
    return this.eventIndexer.getEventStatistics(timeRange)
  }

  // Get index statistics
  getIndexStatistics(): any {
    return this.eventIndexer.getIndexStatistics()
  }

  // Start event replay
  async startReplay(config: any): Promise<void> {
    return this.eventReplay.startReplay(config)
  }

  // Stop event replay
  stopReplay(): void {
    this.eventReplay.stopReplay()
  }

  // Get replay progress
  getReplayProgress(): any {
    return this.eventReplay.getCurrentProgress()
  }

  // Get replay statistics
  getReplayStatistics(): any {
    return this.eventReplay.getReplayStatistics()
  }

  // Get replay history
  getReplayHistory(): any[] {
    return this.eventReplay.getReplayHistory()
  }

  // Save replay session
  async saveReplaySession(config: any): Promise<string> {
    return this.eventReplay.saveReplaySession(config)
  }

  // Load replay session
  async loadReplaySession(sessionId: string): Promise<any> {
    return this.eventReplay.loadReplaySession(sessionId)
  }

  // Delete replay session
  async deleteReplaySession(sessionId: string): Promise<void> {
    return this.eventReplay.deleteReplaySession(sessionId)
  }

  // Export replay data
  exportReplayData(sessionId: string, format: string): string {
    return this.eventReplay.exportReplayData(sessionId, format)
  }

  // Validate replay configuration
  validateReplayConfig(config: any): { valid: boolean; errors: string[] } {
    return this.eventReplay.validateReplayConfig(config)
  }

  // Get performance metrics
  getPerformanceMetrics(): {
    return this.eventReplay.getPerformanceMetrics()
  }

  // Clear old events
  async clearOldEvents(olderThan: Date): Promise<number> {
    return this.eventIndexer.clearOldEvents(olderThan)
  }

  // Rebuild search index
  rebuildSearchIndex(): void {
    this.eventIndexer.rebuildSearchIndex()
  }

  // Export events
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    return this.eventIndexer.exportEvents(format)
  }

  // Import events
  importEvents(data: string, format: 'json' | 'csv' = 'json'): Promise<number> {
    return this.eventIndexer.importEvents(data, format)
  }

  // Get events by multiple criteria
  async getEventsByMultipleCriteria(criteria: {
    chainIds?: number[]
    eventNames?: string[]
    addresses?: string[]
    fromBlock?: number
    toBlock?: number
    fromTime?: Date
    toTime?: Date
    limit?: number
    offset?: number
    sortBy?: string
    sortOrder?: string
  }): Promise<{
    events: any[]
    total: number
    hasMore: boolean
  }> {
    try {
      let allEvents: any[] = []

      // If no criteria specified, get all events
      if (!criteria.chainIds && !criteria.eventNames && !criteria.addresses) {
        allEvents = await this.eventIndexer.searchEvents({})
      } else {
        // Search by each criterion and merge results
        const searchPromises = []

        if (criteria.chainIds && criteria.chainIds.length > 0) {
          searchPromises.push(
            this.eventIndexer.searchEvents({ chainId: criteria.chainIds[0] })
          )
        }

        if (criteria.eventNames && criteria.eventNames.length > 0) {
          searchPromises.push(
            this.eventIndexer.searchEvents({ eventName: criteria.eventNames[0] })
          )
        }

        if (criteria.addresses && criteria.addresses.length > 0) {
          searchPromises.push(
            this.eventIndexer.searchEvents({ address: criteria.addresses[0] })
          )
        }

        // Wait for all searches to complete
        const results = await Promise.all(searchPromises)
        allEvents = results.flatMap(result => result.events)
      }

      // Apply pagination and sorting
      const limit = criteria.limit || 100
      const offset = criteria.offset || 0
      const sortBy = criteria.sortBy || 'timestamp'
      const sortOrder = criteria.sortOrder || 'desc'

      // Sort results
      allEvents.sort((a, b) => {
        const aValue = sortBy === 'timestamp' ? a.timestamp.getTime() : 
                     sortBy === 'blockNumber' ? a.blockNumber : 
                     sortBy === 'eventName' ? a.eventName.localeCompare(b.eventName) : 0
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      })

      // Apply pagination
      const paginatedEvents = allEvents.slice(offset, offset + limit)

      return {
        events: paginatedEvents,
        total: allEvents.length,
        hasMore: offset + limit < allEvents.length
      }

    } catch (error) {
      this.logger.error('Error searching events by multiple criteria:', error)
      throw error
    }
  }

  // Get event aggregation
  async getEventAggregation(aggregation: {
    timeRange: {
      start: Date
      end: Date
      interval: 'hour' | 'day' | 'week' | 'month'
    }
    groupBy: 'eventName' | 'chainId' | 'address'
    metrics: {
      count: number
      uniqueAddresses: number
      totalValue?: number
      averageValue?: number
    }
  }): Promise<any> {
    return this.eventIndexer.aggregateEvents(aggregation)
  }

  // Get chain statistics
  getChainStatistics(): {
    return this.chainConfigManager.getChainStatistics()
  }

  // Get supported chains
  getSupportedChains(): Array<{
    chainId: number
    name: string
    network: string
    nativeCurrency: {
      name: string
      symbol: string
      decimals: number
    }
  }> {
    return this.chainConfigManager.getSupportedChains()
  }

  // Get testnet chains
  getTestnetChains(): ChainConfig[] {
    return this.chainConfigManager.getTestnetChains()
  }

  // Get mainnet chains
  getMainnetChains(): ChainConfig[] {
    return this.chainConfigManager.getMainnetChains()
  }

  // Get chain by ID
  getChainById(chainId: number): ChainConfig | null {
    return this.chainConfigManager.getChainConfig(chainId)
  }

  // Get chain by name
  getChainByName(name: string): ChainConfig | null {
    return this.chainConfigManager.getChainByName(name)
  }

  // Get chain by network
  getChainsByNetwork(network: string): ChainConfig[] {
    return this.chainConfigManager.getChainsByNetwork(network)
  }

  // Add new chain configuration
  addChainConfig(config: any): void {
    this.chainConfigManager.addChainConfig(config)
    this.logger.info(`Added chain configuration for chain ${config.chainId}`)
  }

  // Update chain configuration
  updateChainConfig(chainId: number, updates: any): void {
    this.chainConfigManager.updateChainConfig(chainId, updates)
    this.logger.info(`Updated chain configuration for chain ${chainId}`)
  }

  // Remove chain configuration
  removeChainConfig(chainId: number): void {
    this.chainConfigManager.removeChainConfig(chainId)
    this.logger.info(`Removed chain configuration for chain ${chainId}`)
  }

  // Export chain configurations
  exportChainConfigs(): string {
    const configs = this.chainConfigManager.getAllChainConfigs()
    return JSON.stringify(configs, null, 2)
  }

  // Import chain configurations
  importChainConfigs(configJson: string): void {
    this.chainConfigManager.importChainConfigs(configJson)
    this.logger.info('Imported chain configurations')
  }

  // Validate chain configuration
  validateChainConfig(config: any): { valid: boolean; errors: string[] } {
    return this.chainConfigManager.validateChainConfig(config)
  }

  // Start periodic cleanup
  private startPeriodicCleanup(): void {
    // Clean up old events every hour
    setInterval(async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      await this.clearOldEvents(oneHourAgo)
    }, 60 * 60 * 1000)
  }

  // Handle chain connection events
  setupEventListeners(): void {
    this.eventListener.on('event:found', (data: { chainId, event }) => {
      this.logger.info(`Event found on chain ${data.chainId}: ${event.eventName}`)
      
      // Store event in indexer
      this.eventIndexer.storeEvent(event)
    })

    this.eventListener.on('block:new', (data: { chainId, blockNumber }) => {
      this.logger.debug(`New block on chain ${data.chainId}: ${blockNumber}`)
    })

    this.eventListener.on('connection:open', (data: { chainId }) => {
      this.logger.info(`Connected to chain ${data.chainId}`)
    })

    this.eventListener.on('connection:close', (data: { chainId, code, reason }) => {
      this.logger.warn(`Disconnected from chain ${data.chainId}: ${code} - ${reason}`)
      this.activeConnections.delete(data.chainId)
    })

    this.eventListener.on('connection:error', (data: { chainId, error }) => {
      this.logger.error(`Connection error on chain ${data.chainId}:`, error)
    })
  }

    // Setup indexer event listeners
    this.eventIndexer.on('event:indexed', (data: { event }) => {
      this.logger.debug(`Event indexed: ${event.eventName} (${event.id})`)
    })
  }

  // Setup replay event listeners
    this.eventReplay.on('replay:started', (data: { config }) => {
      this.logger.info(`Event replay started: ${JSON.stringify(config)}`)
    })

    this.eventReplay.on('replay:progress', (data: { progress }) => {
      this.logger.debug(`Replay progress: ${progress.percentage}%`)
    })

    this.eventReplay.on('replay:completed', (data: { stats }) => {
      this.logger.info(`Event replay completed: ${JSON.stringify(stats)}`)
    })

    this.eventReplay.on('replay:error', (data: { config, error }) => {
      this.logger.error(`Event replay error: ${error}`)
    })
  }

    // Setup performance monitoring
    setInterval(() => {
      const metrics = this.getPerformanceMetrics()
      this.logger.debug('Performance metrics:', metrics)
    }, 60000) // Every minute
  }

    // Graceful shutdown
    process.on('SIGINT', async () => {
      this.logger.info('Shutting down blockchain index manager...')
      
      // Stop all replays
      this.eventReplay.stopReplay()
      
      // Clear all connections
      for (const chainId of this.activeConnections) {
        this.deactivateChain(chainId)
      }
      
      // Process remaining events
      while (this.eventIndexer.getProcessingQueueStats().queueLength > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      this.logger.info('Blockchain index manager shutdown complete')
      process.exit(0)
    })
  }

  // Get health status
  getHealthStatus(): {
    const stats = this.getIndexStatistics()
    const chainStatuses = this.getAllChainStatuses()
    
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      stats,
      chains: chainStatuses,
      performance: this.eventReplay.getPerformanceMetrics()
    }
  }

  // Get detailed status
  getDetailedStatus(): {
    const indexStats = this.getIndexStatistics()
    const chainStatuses = this.getAllChainStatuses()
    const replayProgress = this.getReplayProgress()
    const replayStats = this.getReplayStatistics()
    const performanceMetrics = this.eventReplay.getPerformanceMetrics()
    
    return {
      initialized: this.isInitialized,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      index: indexStats,
      chains: chainStatuses,
      replay: {
        isReplaying: this.eventReplay.isReplaying,
        progress: replayProgress,
        statistics: replayStats
      },
      performance: performanceMetrics
      }
    }
  }
}

export default BlockchainIndexManager
