import { EventEmitter } from 'events'
import { BlockchainEvent, ParsedEvent } from './eventListener'
import { Logger } from '../utils/logger'

// Indexed event interface
export interface IndexedEvent extends ParsedEvent {
  indexedAt: Date
  processedAt?: Date
  searchIndex: string[]
  metadata: any
}

// Event filter interface
export interface EventFilter {
  eventName?: string
  chainId?: number
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
}

// Event aggregation interface
export interface EventAggregation {
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
}

// Event statistics interface
export interface EventStatistics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsByChain: Record<number, number>
  eventsByHour: Record<string, number>
  eventsByDay: Record<string, number>
  topAddresses: Array<{
    address: string
    count: number
    lastSeen: Date
  }>
  timeRange: {
    start: Date
    end: Date
  }
  lastIndexedBlock: number
}

// Event indexer class
export class EventIndexer extends EventEmitter {
  private events: Map<string, IndexedEvent> = new Map()
  private eventIndex: Map<string, Set<string>> = new Map()
  private logger: Logger
  private batchSize: number = 1000
  private indexingInterval: number = 5000 // 5 seconds
  private isIndexing: boolean = false
  private lastIndexedBlock: number = 0

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Store event in index
  async storeEvent(event: ParsedEvent): Promise<void> {
    try {
      const indexedEvent: IndexedEvent = {
        ...event,
        indexedAt: new Date(),
        searchIndex: this.buildSearchIndex(event),
        metadata: {
          processed: false,
          retryCount: 0
        }
      }

      // Store in memory map
      this.events.set(event.id, indexedEvent)

      // Update search index
      this.updateSearchIndex(indexedEvent)

      // Emit event indexed
      this.emit('event:indexed', { event: indexedEvent })

      this.logger.debug(`Indexed event: ${event.eventName} (${event.id})`)

    } catch (error) {
      this.logger.error(`Error indexing event ${event.id}:`, error)
      throw error
    }
  }

  // Store multiple events (batch)
  async storeEvents(events: ParsedEvent[]): Promise<void> {
    try {
      const indexedEvents: IndexedEvent[] = []

      for (const event of events) {
        const indexedEvent: IndexedEvent = {
          ...event,
          indexedAt: new Date(),
          searchIndex: this.buildSearchIndex(event),
          metadata: {
            processed: false,
            retryCount: 0
          }
        }

        indexedEvents.push(indexedEvent)
        this.events.set(event.id, indexedEvent)
        this.updateSearchIndex(indexedEvent)
      }

      // Emit batch indexed
      this.emit('events:batch-indexed', { events: indexedEvents })

      this.logger.debug(`Batch indexed ${indexedEvents.length} events`)

    } catch (error) {
      this.logger.error('Error batch indexing events:', error)
      throw error
    }
  }

  // Build search index for event
  private buildSearchIndex(event: ParsedEvent): string[] {
    const searchTerms: string[] = []

    // Add event name
    searchTerms.push(event.eventName.toLowerCase())

    // Add transaction hash
    searchTerms.push(event.transactionHash.toLowerCase())

    // Add block hash
    searchTerms.push(event.blockHash.toLowerCase())

    // Add address
    searchTerms.push(event.address.toLowerCase())

    // Add parsed data terms
    if (event.parsedData) {
      this.extractSearchTerms(event.parsedData).forEach(term => {
        if (term && term.length > 2) {
          searchTerms.push(term.toLowerCase())
        }
      })
    }

    // Add metadata terms
    if (event.metadata) {
      this.extractSearchTerms(event.metadata).forEach(term => {
        if (term && term.length > 2) {
          searchTerms.push(term.toLowerCase())
        }
      })
    }

    return [...new Set(searchTerms)] // Remove duplicates
  }

  // Extract searchable terms from object
  private extractSearchTerms(obj: any): string[] {
    const terms: string[] = []

    const extractFromValue = (value: any): void => {
      if (typeof value === 'string') {
        terms.push(value)
      } else if (typeof value === 'number') {
        terms.push(value.toString())
      } else if (Array.isArray(value)) {
        value.forEach(extractFromValue)
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(extractFromValue)
      }
    }

    extractFromValue(obj)
    return terms
  }

  // Update search index
  private updateSearchIndex(event: IndexedEvent): void {
    for (const term of event.searchIndex) {
      if (!this.eventIndex.has(term)) {
        this.eventIndex.set(term, new Set())
      }
      this.eventIndex.get(term)!.add(event.id)
    }
  }

  // Search events
  async searchEvents(filter: EventFilter): Promise<{
    events: IndexedEvent[]
    total: number
    hasMore: boolean
  }> {
    try {
      let filteredEvents = Array.from(this.events.values())

      // Apply filters
      filteredEvents = this.applyFilters(filteredEvents, filter)

      // Apply search query
      if (filter.searchQuery) {
        filteredEvents = this.applySearchQuery(filteredEvents, filter.searchQuery)
      }

      // Sort results
      filteredEvents = this.sortEvents(filteredEvents, filter.sortBy, filter.sortOrder)

      // Apply pagination
      const total = filteredEvents.length
      const offset = filter.offset || 0
      const limit = filter.limit || 100
      const events = filteredEvents.slice(offset, offset + limit)
      const hasMore = offset + limit < total

      return {
        events,
        total,
        hasMore
      }

    } catch (error) {
      this.logger.error('Error searching events:', error)
      throw error
    }
  }

  // Apply filters to events
  private applyFilters(events: IndexedEvent[], filter: EventFilter): IndexedEvent[] {
    return events.filter(event => {
      // Event name filter
      if (filter.eventName && event.eventName !== filter.eventName) return false

      // Chain ID filter
      if (filter.chainId && event.chainId !== filter.chainId) return false

      // Address filter
      if (filter.address && event.address.toLowerCase() !== filter.address.toLowerCase()) return false

      // Block range filter
      if (filter.fromBlock && event.blockNumber < filter.fromBlock) return false
      if (filter.toBlock && event.blockNumber > filter.toBlock) return false

      // Time range filter
      if (filter.fromTime && event.timestamp < filter.fromTime) return false
      if (filter.toTime && event.timestamp > filter.toTime) return false

      // Topics filter
      if (filter.topics && filter.topics.length > 0) {
        const hasMatchingTopic = filter.topics.some(topic => 
          event.topics.includes(topic)
        )
        if (!hasMatchingTopic) return false
      }

      return true
    })
  }

  // Apply search query
  private applySearchQuery(events: IndexedEvent[], query: string): IndexedEvent[] {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)

    return events.filter(event => {
      return searchTerms.every(term => 
        event.searchIndex.some(indexedTerm => 
          indexedTerm.includes(term)
        )
      )
    })
  }

  // Sort events
  private sortEvents(
    events: IndexedEvent[],
    sortBy: string = 'timestamp',
    sortOrder: 'desc' | 'asc' = 'desc'
  ): IndexedEvent[] {
    return events.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp.getTime()
          bValue = b.timestamp.getTime()
          break
        case 'blockNumber':
          aValue = a.blockNumber
          bValue = b.blockNumber
          break
        case 'eventName':
          aValue = a.eventName
          bValue = b.eventName
          break
        default:
          aValue = a.timestamp.getTime()
          bValue = b.timestamp.getTime()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  // Get event by ID
  getEventById(id: string): IndexedEvent | null {
    return this.events.get(id) || null
  }

  // Get events by transaction hash
  getEventsByTransactionHash(transactionHash: string): IndexedEvent[] {
    return Array.from(this.events.values()).filter(event =>
      event.transactionHash.toLowerCase() === transactionHash.toLowerCase()
    )
  }

  // Get events by address
  getEventsByAddress(address: string, limit?: number): IndexedEvent[] {
    const events = Array.from(this.events.values()).filter(event =>
      event.address.toLowerCase() === address.toLowerCase()
    )

    return limit ? events.slice(0, limit) : events
  }

  // Get events by event name
  getEventsByEventName(eventName: string, limit?: number): IndexedEvent[] {
    const events = Array.from(this.events.values()).filter(event =>
      event.eventName === eventName
    )

    return limit ? events.slice(0, limit) : events
  }

  // Get events by block range
  getEventsByBlockRange(fromBlock: number, toBlock: number): IndexedEvent[] {
    return Array.from(this.events.values()).filter(event =>
      event.blockNumber >= fromBlock && event.blockNumber <= toBlock
    )
  }

  // Get events by time range
  getEventsByTimeRange(fromTime: Date, toTime: Date): IndexedEvent[] {
    return Array.from(this.events.values()).filter(event =>
      event.timestamp >= fromTime && event.timestamp <= toTime
    )
  }

  // Get event statistics
  getEventStatistics(timeRange?: { start: Date; end: Date }): EventStatistics {
    let events = Array.from(this.events.values())

    // Apply time range filter
    if (timeRange) {
      events = events.filter(event =>
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      )
    }

    const stats: EventStatistics = {
      totalEvents: events.length,
      eventsByType: {},
      eventsByChain: {},
      eventsByHour: {},
      eventsByDay: {},
      topAddresses: [],
      timeRange: {
        start: timeRange?.start || new Date(0),
        end: timeRange?.end || new Date()
      },
      lastIndexedBlock: this.lastIndexedBlock
    }

    // Count events by type
    events.forEach(event => {
      stats.eventsByType[event.eventName] = (stats.eventsByType[event.eventName] || 0) + 1
    })

    // Count events by chain
    events.forEach(event => {
      stats.eventsByChain[event.chainId] = (stats.eventsByChain[event.chainId] || 0) + 1
    })

    // Count events by hour
    events.forEach(event => {
      const hour = event.timestamp.toISOString().substring(0, 13) // YYYY-MM-DDTHH
      stats.eventsByHour[hour] = (stats.eventsByHour[hour] || 0) + 1
    })

    // Count events by day
    events.forEach(event => {
      const day = event.timestamp.toISOString().substring(0, 10) // YYYY-MM-DD
      stats.eventsByDay[day] = (stats.eventsByDay[day] || 0) + 1
    })

    // Get top addresses
    const addressCounts = new Map<string, { count: number; lastSeen: Date }>()
    events.forEach(event => {
      const current = addressCounts.get(event.address) || { count: 0, lastSeen: event.timestamp }
      current.count++
      if (event.timestamp > current.lastSeen) {
        current.lastSeen = event.timestamp
      }
      addressCounts.set(event.address, current)
    })

    stats.topAddresses = Array.from(addressCounts.entries())
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return stats
  }

  // Aggregate events
  aggregateEvents(aggregation: EventAggregation): any {
    let events = Array.from(this.events.values())

    // Apply time range filter
    if (aggregation.timeRange) {
      events = events.filter(event =>
        event.timestamp >= aggregation.timeRange.start && event.timestamp <= aggregation.timeRange.end
      )
    }

    const grouped = new Map()

    events.forEach(event => {
      let key: string

      switch (aggregation.groupBy) {
        case 'eventName':
          key = event.eventName
          break
        case 'chainId':
          key = event.chainId.toString()
          break
        case 'address':
          key = event.address
          break
        default:
          key = event.eventName
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          count: 0,
          uniqueAddresses: new Set(),
          totalValue: 0,
          values: []
        })
      }

      const group = grouped.get(key)!
      group.count++
      group.uniqueAddresses.add(event.address)

      // Extract value from parsed data if available
      if (event.parsedData && typeof event.parsedData.amount === 'number') {
        group.totalValue += event.parsedData.amount
        group.values.push(event.parsedData.amount)
      }
    })

    // Calculate metrics for each group
    const result: any = {}
    grouped.forEach((data, key) => {
      result[key] = {
        count: data.count,
        uniqueAddresses: data.uniqueAddresses.size,
        totalValue: data.totalValue,
        averageValue: data.values.length > 0 ? data.totalValue / data.values.length : 0
      }
    })

    return result
  }

  // Get index statistics
  getIndexStatistics(): {
    totalEvents: number
    indexSize: number
    memoryUsage: any
    lastIndexedBlock: number
  } {
    const memoryUsage = process.memoryUsage()
    
    return {
      totalEvents: this.events.size,
      indexSize: this.eventIndex.size,
      memoryUsage,
      lastIndexedBlock: this.lastIndexedBlock
    }
  }

  // Clear old events
  clearOldEvents(olderThan: Date): number {
    let cleared = 0

    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < olderThan) {
        this.events.delete(id)
        
        // Remove from search index
        for (const term of event.searchIndex) {
          const termSet = this.eventIndex.get(term)
          if (termSet) {
            termSet.delete(id)
            if (termSet.size === 0) {
              this.eventIndex.delete(term)
            }
          }
        }
        
        cleared++
      }
    }

    this.logger.info(`Cleared ${cleared} old events`)
    return cleared
  }

  // Update event processing status
  updateEventProcessingStatus(eventId: string, processed: boolean): void {
    const event = this.events.get(eventId)
    if (event) {
      event.processedAt = processed ? new Date() : undefined
      event.metadata.processed = processed
    }
  }

  // Get unprocessed events
  getUnprocessedEvents(): IndexedEvent[] {
    return Array.from(this.events.values()).filter(event => !event.metadata.processed)
  }

  // Mark event as processed
  markEventAsProcessed(eventId: string): void {
    this.updateEventProcessingStatus(eventId, true)
    this.emit('event:processed', { eventId })
  }

  // Get events by search term
  getEventsBySearchTerm(term: string, limit?: number): IndexedEvent[] {
    const termLower = term.toLowerCase()
    const eventIds = this.eventIndex.get(termLower)
    
    if (!eventIds) return []

    const events = Array.from(eventIds).map(id => this.events.get(id)).filter(Boolean) as IndexedEvent[]
    
    return limit ? events.slice(0, limit) : events
  }

  // Rebuild search index
  rebuildSearchIndex(): void {
    this.eventIndex.clear()
    
    for (const event of this.events.values()) {
      this.updateSearchIndex(event)
    }
    
    this.logger.info('Search index rebuilt')
  }

  // Export events
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    const events = Array.from(this.events.values())

    if (format === 'json') {
      return JSON.stringify(events, null, 2)
    } else if (format === 'csv') {
      const headers = ['id', 'eventName', 'chainId', 'blockNumber', 'transactionHash', 'address', 'timestamp', 'status']
      const csvRows = [headers.join(',')]
      
      for (const event of events) {
        const row = [
          event.id,
          event.eventName,
          event.chainId,
          event.blockNumber,
          event.transactionHash,
          event.address,
          event.timestamp.toISOString(),
          event.status
        ]
        csvRows.push(row.join(','))
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Import events
  importEvents(data: string, format: 'json' | 'csv' = 'json'): number {
    try {
      let events: any[]

      if (format === 'json') {
        events = JSON.parse(data)
      } else if (format === 'csv') {
        const lines = data.split('\n')
        const headers = lines[0].split(',')
        
        events = lines.slice(1).map(line => {
          const values = line.split(',')
          const event: any = {}
          
          headers.forEach((header, index) => {
            event[header.trim()] = values[index]?.trim()
          })
          
          return event
        })
      }

      let imported = 0
      for (const eventData of events) {
        try {
          const indexedEvent: IndexedEvent = {
            ...eventData,
            indexedAt: new Date(),
            searchIndex: this.buildSearchIndex(eventData),
            metadata: {
              processed: false,
              retryCount: 0
            }
          }

          this.events.set(eventData.id, indexedEvent)
          this.updateSearchIndex(indexedEvent)
          imported++
        } catch (error) {
          this.logger.error(`Error importing event ${eventData.id}:`, error)
        }
      }

      this.logger.info(`Imported ${imported} events`)
      return imported

    } catch (error) {
      this.logger.error('Error importing events:', error)
      throw error
    }
  }
}

export default EventIndexer
