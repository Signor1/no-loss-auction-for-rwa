import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Asset, AssetType, AssetStatus, AssetLifecycleStage } from './assetRegistry'

// Search query interface
export interface AssetSearchQuery {
  text?: string
  type?: AssetType[]
  status?: AssetStatus[]
  lifecycleStage?: AssetLifecycleStage[]
  owner?: string[]
  categories?: string[]
  tags?: string[]
  valueRange?: {
    min: number
    max: number
    currency: string
  }
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'valuationDate'
    start: Date
    end: Date
  }
  location?: LocationFilter
  metadata?: MetadataFilter
  documents?: DocumentFilter
  customFields?: CustomFieldFilter[]
  sortBy?: SearchSortOption[]
  filters?: AdvancedFilter[]
  page?: number
  pageSize?: number
  includeFacets?: boolean
  includeAggregations?: boolean
}

// Location filter interface
export interface LocationFilter {
  country?: string[]
  region?: string[]
  city?: string[]
  coordinates?: {
    latitude: number
    longitude: number
    radius: number // in kilometers
  }
  addressContains?: string
}

// Metadata filter interface
export interface MetadataFilter {
  basic?: {
    title?: string
    description?: string
    keywords?: string[]
    language?: string[]
    jurisdiction?: string[]
  }
  financial?: {
    currentValueRange?: {
      min: number
      max: number
      currency: string
    }
    valuationMethod?: string[]
    appraisalAvailable?: boolean
  }
  legal?: {
    ownershipStructure?: string[]
    registrationNumber?: string
    encumbrances?: string[]
    complianceStatus?: string[]
  }
  technical?: {
    condition?: string[]
    certifications?: string[]
    standards?: string[]
  }
  custom?: Record<string, any>
}

// Document filter interface
export interface DocumentFilter {
  hasDocuments?: boolean
  documentTypes?: string[]
  uploadedAfter?: Date
  uploadedBefore?: Date
  uploadedBy?: string[]
  isRequired?: boolean
  isExpired?: boolean
}

// Custom field filter interface
export interface CustomFieldFilter {
  field: string
  operator: FilterOperator
  value: any
}

// Filter operator enum
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  EXISTS = 'exists',
  NOT_EXISTS = 'not_exists'
}

// Search sort option interface
export interface SearchSortOption {
  field: string
  order: 'asc' | 'desc'
  type?: 'string' | 'number' | 'date' | 'boolean'
}

// Advanced filter interface
export interface AdvancedFilter {
  id: string
  name: string
  description: string
  conditions: FilterCondition[]
  logicOperator: 'AND' | 'OR'
  isActive: boolean
}

// Filter condition interface
export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: any
  weight?: number
}

// Search result interface
export interface AssetSearchResult {
  assets: Asset[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  facets?: SearchFacets
  aggregations?: SearchAggregations
  suggestions?: string[]
  searchTime: number
  query: AssetSearchQuery
}

// Search facets interface
export interface SearchFacets {
  types: FacetResult[]
  statuses: FacetResult[]
  lifecycleStages: FacetResult[]
  owners: FacetResult[]
  categories: FacetResult[]
  tags: FacetResult[]
  locations: FacetResult[]
  documentTypes: FacetResult[]
  customFields: Record<string, FacetResult[]>
}

// Facet result interface
export interface FacetResult {
  value: string
  count: number
  selected?: boolean
}

// Search aggregations interface
export interface SearchAggregations {
  totalValue: Record<string, number>
  averageValue: Record<string, number>
  valueDistribution: ValueDistribution[]
  timelineData: TimelineData[]
  geographicData: GeographicData[]
}

// Value distribution interface
export interface ValueDistribution {
  range: string
  count: number
  percentage: number
  totalValue: number
}

// Timeline data interface
export interface TimelineData {
  date: Date
  count: number
  value: number
}

// Geographic data interface
export interface GeographicData {
  location: string
  count: number
  value: number
  coordinates?: {
    latitude: number
    longitude: number
  }
}

// Search index interface
export interface SearchIndex {
  id: string
  name: string
  description: string
  fields: IndexField[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastIndexed: Date
  totalDocuments: number
  size: number
}

// Index field interface
export interface IndexField {
  name: string
  type: FieldType
  searchable: boolean
  filterable: boolean
  sortable: boolean
  aggregatable: boolean
  weight: number
  analyzer?: string
}

// Field type enum
export enum FieldType {
  TEXT = 'text',
  KEYWORD = 'keyword',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  GEO_POINT = 'geo_point',
  OBJECT = 'object',
  ARRAY = 'array'
}

// Search suggestion interface
export interface SearchSuggestion {
  text: string
  type: SuggestionType
  weight: number
  source: string
}

// Suggestion type enum
export enum SuggestionType {
  TERM = 'term',
  PHRASE = 'phrase',
  COMPLETION = 'completion',
  CORRECTION = 'correction'
}

// Search analytics interface
export interface SearchAnalytics {
  totalSearches: number
  averageSearchTime: number
  topQueries: Array<{ query: string; count: number }>
  topFilters: Array<{ filter: string; count: number }>
  noResultQueries: Array<{ query: string; count: number }>
  searchTrends: TimelineData[]
  popularAssets: Array<{ assetId: string; views: number }>
  clickThroughRate: number
}

// Asset search service
export class AssetSearchService extends EventEmitter {
  private searchIndexes: Map<string, SearchIndex> = new Map()
  private searchHistory: Map<string, SearchHistoryEntry> = new Map()
  private searchAnalytics: SearchAnalytics
  private logger: Logger
  private isRunning: boolean = false
  private indexUpdateInterval: number = 300000 // 5 minutes
  private maxSearchResults: number = 10000
  private searchTimeout: number = 30000 // 30 seconds

  constructor(logger: Logger) {
    super()
    this.logger = logger
    this.searchAnalytics = this.initializeAnalytics()
  }

  // Start search service
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Asset search service already started')
      return
    }

    this.isRunning = true
    this.logger.info('Starting asset search service...')

    // Initialize search indexes
    await this.initializeSearchIndexes()

    // Start indexing process
    this.startIndexingProcess()

    // Load search data
    await this.loadSearchData()

    this.logger.info('Asset search service started')
    this.emit('search:started')
  }

  // Stop search service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping asset search service...')

    // Save search data
    await this.saveSearchData()

    this.logger.info('Asset search service stopped')
    this.emit('search:stopped')
  }

  // Search assets
  async searchAssets(query: AssetSearchQuery, userId?: string): Promise<AssetSearchResult> {
    const searchId = this.generateSearchId()
    const startTime = Date.now()

    try {
      this.logger.debug(`Executing asset search: ${searchId}`)

      // Validate query
      this.validateSearchQuery(query)

      // Record search history
      await this.recordSearchHistory(searchId, query, userId)

      // Execute search
      const results = await this.executeSearch(query)

      // Calculate search time
      const searchTime = Date.now() - startTime

      // Update analytics
      this.updateSearchAnalytics(query, results, searchTime)

      // Add suggestions if requested
      if (query.text && query.text.length > 2) {
        results.suggestions = await this.generateSuggestions(query.text)
      }

      const searchResult: AssetSearchResult = {
        ...results,
        searchTime,
        query
      }

      this.logger.info(`Asset search completed: ${searchId} in ${searchTime}ms`)
      this.emit('search:completed', { searchId, query, result: searchResult })

      return searchResult

    } catch (error) {
      const searchTime = Date.now() - startTime
      
      this.logger.error(`Asset search failed: ${searchId}`, error)
      this.emit('search:error', { error, searchId, query, searchTime })
      throw error
    }
  }

  // Get search suggestions
  async getSearchSuggestions(text: string, limit: number = 10): Promise<SearchSuggestion[]> {
    try {
      this.logger.debug(`Generating search suggestions for: ${text}`)

      const suggestions: SearchSuggestion[] = []

      // Generate term suggestions
      const termSuggestions = await this.generateTermSuggestions(text, limit / 2)
      suggestions.push(...termSuggestions)

      // Generate completion suggestions
      const completionSuggestions = await this.generateCompletionSuggestions(text, limit / 2)
      suggestions.push(...completionSuggestions)

      // Sort by weight and limit
      return suggestions
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit)

    } catch (error) {
      this.logger.error(`Failed to generate search suggestions: ${text}`, error)
      return []
    }
  }

  // Create search index
  async createSearchIndex(indexData: Omit<SearchIndex, 'id' | 'createdAt' | 'updatedAt' | 'lastIndexed' | 'totalDocuments' | 'size'>): Promise<SearchIndex> {
    const indexId = this.generateIndexId()

    const index: SearchIndex = {
      id: indexId,
      ...indexData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastIndexed: new Date(),
      totalDocuments: 0,
      size: 0
    }

    this.searchIndexes.set(indexId, index)
    await this.saveSearchIndex(index)

    this.logger.info(`Search index created: ${indexId}`)
    this.emit('index:created', { index })

    return index
  }

  // Update search index
  async updateSearchIndex(indexId: string, assets: Asset[]): Promise<void> {
    const index = this.searchIndexes.get(indexId)
    if (!index) {
      throw new Error(`Search index not found: ${indexId}`)
    }

    try {
      this.logger.debug(`Updating search index: ${indexId} with ${assets.length} assets`)

      // Index assets
      for (const asset of assets) {
        await this.indexAsset(asset, index)
      }

      // Update index metadata
      index.lastIndexed = new Date()
      index.totalDocuments = assets.length
      index.updatedAt = new Date()

      await this.saveSearchIndex(index)

      this.logger.info(`Search index updated: ${indexId}`)
      this.emit('index:updated', { indexId, assetCount: assets.length })

    } catch (error) {
      this.logger.error(`Failed to update search index: ${indexId}`, error)
      throw error
    }
  }

  // Get search index
  getSearchIndex(indexId: string): SearchIndex | null {
    return this.searchIndexes.get(indexId) || null
  }

  // Get all search indexes
  getAllSearchIndexes(): SearchIndex[] {
    return Array.from(this.searchIndexes.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get search analytics
  getSearchAnalytics(): SearchAnalytics {
    return this.searchAnalytics
  }

  // Get search history
  getSearchHistory(limit: number = 100): SearchHistoryEntry[] {
    return Array.from(this.searchHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get popular searches
  getPopularSearches(limit: number = 10): Array<{ query: string; count: number }> {
    return this.searchAnalytics.topQueries.slice(0, limit)
  }

  // Get search trends
  getSearchTrends(days: number = 30): TimelineData[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return this.searchAnalytics.searchTrends
      .filter(trend => trend.date >= cutoff)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  // Private methods
  private async executeSearch(query: AssetSearchQuery): Promise<Omit<AssetSearchResult, 'searchTime' | 'query'>> {
    // This would execute the actual search against your search engine
    // For now, return mock results
    
    const mockAssets: Asset[] = []
    const total = mockAssets.length
    const page = query.page || 0
    const pageSize = Math.min(query.pageSize || 20, this.maxSearchResults)
    const totalPages = Math.ceil(total / pageSize)

    const result: Omit<AssetSearchResult, 'searchTime' | 'query'> = {
      assets: mockAssets,
      total,
      page,
      pageSize,
      totalPages
    }

    // Add facets if requested
    if (query.includeFacets) {
      result.facets = await this.generateFacets(query)
    }

    // Add aggregations if requested
    if (query.includeAggregations) {
      result.aggregations = await this.generateAggregations(query)
    }

    return result
  }

  private async generateFacets(query: AssetSearchQuery): Promise<SearchFacets> {
    // This would generate actual facets from search results
    return {
      types: [],
      statuses: [],
      lifecycleStages: [],
      owners: [],
      categories: [],
      tags: [],
      locations: [],
      documentTypes: [],
      customFields: {}
    }
  }

  private async generateAggregations(query: AssetSearchQuery): Promise<SearchAggregations> {
    // This would generate actual aggregations from search results
    return {
      totalValue: {},
      averageValue: {},
      valueDistribution: [],
      timelineData: [],
      geographicData: []
    }
  }

  private async generateSuggestions(text: string): Promise<string[]> {
    const suggestions = await this.getSearchSuggestions(text, 5)
    return suggestions.map(s => s.text)
  }

  private async generateTermSuggestions(text: string, limit: number): Promise<SearchSuggestion[]> {
    // This would generate term-based suggestions
    return []
  }

  private async generateCompletionSuggestions(text: string, limit: number): Promise<SearchSuggestion[]> {
    // This would generate completion suggestions
    return []
  }

  private async indexAsset(asset: Asset, index: SearchIndex): Promise<void> {
    // This would index the asset in your search engine
    this.logger.debug(`Indexing asset: ${asset.id} in index: ${index.id}`)
  }

  private validateSearchQuery(query: AssetSearchQuery): void {
    if (query.page && query.page < 0) {
      throw new Error('Page number must be non-negative')
    }

    if (query.pageSize && (query.pageSize < 1 || query.pageSize > this.maxSearchResults)) {
      throw new Error(`Page size must be between 1 and ${this.maxSearchResults}`)
    }

    if (query.valueRange && query.valueRange.min > query.valueRange.max) {
      throw new Error('Minimum value cannot be greater than maximum value')
    }

    if (query.dateRange && query.dateRange.start > query.dateRange.end) {
      throw new Error('Start date cannot be after end date')
    }
  }

  private async recordSearchHistory(searchId: string, query: AssetSearchQuery, userId?: string): Promise<void> {
    const historyEntry: SearchHistoryEntry = {
      id: searchId,
      query,
      userId: userId || 'anonymous',
      timestamp: new Date(),
      resultCount: 0,
      searchTime: 0
    }

    this.searchHistory.set(searchId, historyEntry)
    await this.saveSearchHistory(historyEntry)
  }

  private updateSearchAnalytics(query: AssetSearchQuery, results: Omit<AssetSearchResult, 'searchTime' | 'query'>, searchTime: number): void {
    // Update total searches
    this.searchAnalytics.totalSearches++

    // Update average search time
    this.searchAnalytics.averageSearchTime = 
      (this.searchAnalytics.averageSearchTime * (this.searchAnalytics.totalSearches - 1) + searchTime) / 
      this.searchAnalytics.totalSearches

    // Update top queries
    if (query.text) {
      const existingQuery = this.searchAnalytics.topQueries.find(q => q.query === query.text)
      if (existingQuery) {
        existingQuery.count++
      } else {
        this.searchAnalytics.topQueries.push({ query: query.text, count: 1 })
      }
      this.searchAnalytics.topQueries.sort((a, b) => b.count - a.count)
    }

    // Track no result queries
    if (results.total === 0 && query.text) {
      const existingNoResult = this.searchAnalytics.noResultQueries.find(q => q.query === query.text)
      if (existingNoResult) {
        existingNoResult.count++
      } else {
        this.searchAnalytics.noResultQueries.push({ query: query.text, count: 1 })
      }
    }

    // Update timeline data
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingTimeline = this.searchAnalytics.searchTrends.find(t => 
      t.date.getTime() === today.getTime()
    )
    
    if (existingTimeline) {
      existingTimeline.count++
    } else {
      this.searchAnalytics.searchTrends.push({
        date: today,
        count: 1,
        value: 0
      })
    }
  }

  private async initializeSearchIndexes(): Promise<void> {
    // Create default search index if none exists
    if (this.searchIndexes.size === 0) {
      await this.createDefaultSearchIndex()
    }
  }

  private async createDefaultSearchIndex(): Promise<void> {
    const defaultIndex = await this.createSearchIndex({
      name: 'Default Asset Index',
      description: 'Default search index for all assets',
      fields: [
        {
          name: 'id',
          type: FieldType.KEYWORD,
          searchable: false,
          filterable: true,
          sortable: true,
          aggregatable: false,
          weight: 0
        },
        {
          name: 'name',
          type: FieldType.TEXT,
          searchable: true,
          filterable: true,
          sortable: true,
          aggregatable: false,
          weight: 10
        },
        {
          name: 'description',
          type: FieldType.TEXT,
          searchable: true,
          filterable: false,
          sortable: false,
          aggregatable: false,
          weight: 5
        },
        {
          name: 'type',
          type: FieldType.KEYWORD,
          searchable: false,
          filterable: true,
          sortable: true,
          aggregatable: true,
          weight: 0
        },
        {
          name: 'status',
          type: FieldType.KEYWORD,
          searchable: false,
          filterable: true,
          sortable: true,
          aggregatable: true,
          weight: 0
        },
        {
          name: 'owner',
          type: FieldType.KEYWORD,
          searchable: false,
          filterable: true,
          sortable: true,
          aggregatable: true,
          weight: 0
        },
        {
          name: 'categories',
          type: FieldType.KEYWORD,
          searchable: false,
          filterable: true,
          sortable: false,
          aggregatable: true,
          weight: 0
        },
        {
          name: 'tags',
          type: FieldType.KEYWORD,
          searchable: true,
          filterable: true,
          sortable: false,
          aggregatable: true,
          weight: 3
        },
        {
          name: 'value.estimated',
          type: FieldType.NUMBER,
          searchable: false,
          filterable: true,
          sortable: true,
          aggregatable: true,
          weight: 0
        },
        {
          name: 'createdAt',
          type: FieldType.DATE,
          searchable: false,
          filterable: true,
          sortable: true,
          aggregatable: true,
          weight: 0
        },
        {
          name: 'metadata.location.coordinates',
          type: FieldType.GEO_POINT,
          searchable: false,
          filterable: true,
          sortable: false,
          aggregatable: true,
          weight: 0
        }
      ],
      isActive: true
    })

    this.logger.info('Default search index created')
  }

  private startIndexingProcess(): void {
    // Schedule periodic index updates
    setInterval(() => {
      this.performIndexUpdate()
    }, this.indexUpdateInterval)
  }

  private async performIndexUpdate(): Promise<void> {
    // This would perform periodic index updates
    this.logger.debug('Performing scheduled index update')
  }

  private initializeAnalytics(): SearchAnalytics {
    return {
      totalSearches: 0,
      averageSearchTime: 0,
      topQueries: [],
      topFilters: [],
      noResultQueries: [],
      searchTrends: [],
      popularAssets: [],
      clickThroughRate: 0
    }
  }

  // ID generation methods
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateIndexId(): string {
    return `index_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Data persistence methods
  private async saveSearchIndex(index: SearchIndex): Promise<void> {
    // This would save to your database
    this.logger.debug(`Search index saved: ${index.id}`)
  }

  private async saveSearchHistory(history: SearchHistoryEntry): Promise<void> {
    // This would save to your database
    this.logger.debug(`Search history saved: ${history.id}`)
  }

  private async loadSearchData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading search data...')
  }

  private async saveSearchData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving search data...')
  }

  // Export methods
  exportSearchData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      indexes: Array.from(this.searchIndexes.values()),
      analytics: this.searchAnalytics,
      history: Array.from(this.searchHistory.values())
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'query', 'userId', 'timestamp', 'resultCount', 'searchTime']
      const csvRows = [headers.join(',')]
      
      for (const history of this.searchHistory.values()) {
        csvRows.push([
          history.id,
          JSON.stringify(history.query),
          history.userId,
          history.timestamp.toISOString(),
          history.resultCount.toString(),
          history.searchTime.toString()
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Health status
  getHealthStatus(): {
    isRunning: boolean
    totalIndexes: number
    totalSearches: number
    averageSearchTime: number
    lastActivity: Date
    metrics: SearchAnalytics
  } {
    return {
      isRunning: this.isRunning,
      totalIndexes: this.searchIndexes.size,
      totalSearches: this.searchAnalytics.totalSearches,
      averageSearchTime: this.searchAnalytics.averageSearchTime,
      lastActivity: new Date(),
      metrics: this.searchAnalytics
    }
  }
}

// Supporting interfaces
export interface SearchHistoryEntry {
  id: string
  query: AssetSearchQuery
  userId: string
  timestamp: Date
  resultCount: number
  searchTime: number
}

export default AssetSearchService
