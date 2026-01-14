import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import logger from '../../utils/logger'

// Oracle and data feed interfaces
export interface OracleFeed {
  id: string
  name: string
  description: string
  oracleAddress: string
  feedType: 'price' | 'weather' | 'market' | 'iot' | 'valuation' | 'custom'
  assetSymbol: string
  baseCurrency: string
  decimals: number
  heartbeat: number // seconds
  deviationThreshold: number // percentage
  isActive: boolean
  lastUpdate: Date
  lastPrice: string
  status: 'active' | 'inactive' | 'deprecated'
  metadata: Record<string, any>
}

export interface DataFeed {
  id: string
  oracleId: string
  dataType: 'price' | 'weather' | 'market_index' | 'commodity' | 'iot_sensor' | 'valuation'
  source: string
  symbol: string
  value: string
  timestamp: Date
  confidence: number // 0-100
  metadata: Record<string, any>
}

export interface AssetValuationUpdate {
  id: string
  assetId: string
  valuationSource: 'oracle' | 'manual' | 'api' | 'market_data'
  previousValue: number
  newValue: number
  currency: string
  changePercentage: number
  confidence: number
  timestamp: Date
  oracleFeedId?: string
  supportingData: Record<string, any>
  approved: boolean
  approvedBy?: string
  approvalDate?: Date
}

export interface MarketDataFeed {
  id: string
  indexName: string
  value: number
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap?: number
  timestamp: Date
  source: string
  components: MarketComponent[]
}

export interface MarketComponent {
  symbol: string
  weight: number
  price: number
  changePercent: number
}

export interface WeatherData {
  id: string
  location: {
    latitude: number
    longitude: number
    city: string
    country: string
  }
  timestamp: Date
  temperature: number
  humidity: number
  precipitation: number
  windSpeed: number
  windDirection: number
  visibility: number
  pressure: number
  uvIndex: number
  conditions: string
  forecast: WeatherForecast[]
  source: string
  quality: 'high' | 'medium' | 'low'
}

export interface WeatherForecast {
  date: Date
  temperatureHigh: number
  temperatureLow: number
  precipitationChance: number
  conditions: string
  windSpeed: number
}

export interface IoTSensorData {
  id: string
  sensorId: string
  assetId: string
  sensorType: 'temperature' | 'humidity' | 'vibration' | 'pressure' | 'gps' | 'accelerometer' | 'custom'
  value: number
  unit: string
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  metadata: Record<string, any>
  quality: 'high' | 'medium' | 'low'
  calibrationStatus: 'calibrated' | 'needs_calibration' | 'failed'
}

export interface OracleValidation {
  id: string
  feedId: string
  validationType: 'stale_data' | 'deviation_check' | 'source_verification' | 'range_check'
  status: 'passed' | 'failed' | 'warning'
  checkedAt: Date
  details: Record<string, any>
  recommendations?: string[]
}

export interface DataFeedSubscription {
  id: string
  subscriberId: string
  feedId: string
  callbackUrl?: string
  filters: Record<string, any>
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
}

/**
 * Oracle Integration Service for Off-Chain Data
 * Comprehensive Chainlink oracle integration with real-world data feeds
 * Supports asset valuations, market data, weather data, and IoT sensors
 */
export class OracleIntegrationService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger

  // Data storage
  private oracleFeeds: Map<string, OracleFeed> = new Map()
  private dataFeeds: Map<string, DataFeed[]> = new Map()
  private valuationUpdates: Map<string, AssetValuationUpdate[]> = new Map()
  private marketData: Map<string, MarketDataFeed[]> = new Map()
  private weatherData: Map<string, WeatherData[]> = new Map()
  private iotData: Map<string, IoTSensorData[]> = new Map()
  private validations: Map<string, OracleValidation[]> = new Map()
  private subscriptions: Map<string, DataFeedSubscription[]> = new Map()

  // Monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.logger = loggerInstance

    // Initialize default Chainlink feeds
    this.initializeDefaultFeeds()
  }

  // ============ CHAINLINK ORACLE INTEGRATION ============

  /**
   * Initialize default Chainlink oracle feeds
   */
  private initializeDefaultFeeds(): void {
    // Price feeds
    this.registerOracleFeed({
      id: 'eth-usd',
      name: 'ETH/USD Price Feed',
      description: 'Ethereum to USD price feed',
      oracleAddress: '0x71041dddad3595F9Ced3DcCFBe3D1F4b0a16Bb70', // Base ETH/USD
      feedType: 'price',
      assetSymbol: 'ETH',
      baseCurrency: 'USD',
      decimals: 8,
      heartbeat: 3600, // 1 hour
      deviationThreshold: 1.0, // 1%
      isActive: true,
      status: 'active',
      metadata: {
        chainlinkFeedId: 'ETH/USD',
        network: 'base'
      }
    })

    // Weather feeds (simulated for now)
    this.registerOracleFeed({
      id: 'weather-oracle',
      name: 'Weather Data Oracle',
      description: 'Real-world weather data integration',
      oracleAddress: '0x...', // Would be actual weather oracle
      feedType: 'weather',
      assetSymbol: 'WEATHER',
      baseCurrency: 'N/A',
      decimals: 2,
      heartbeat: 1800, // 30 minutes
      deviationThreshold: 5.0,
      isActive: true,
      status: 'active',
      metadata: {
        dataSource: 'openweathermap',
        coverage: 'global'
      }
    })

    // Market data feeds
    this.registerOracleFeed({
      id: 'sp500-oracle',
      name: 'S&P 500 Index Oracle',
      description: 'Stock market index data',
      oracleAddress: '0x...', // Would be actual market oracle
      feedType: 'market',
      assetSymbol: 'SPX',
      baseCurrency: 'USD',
      decimals: 2,
      heartbeat: 86400, // 24 hours
      deviationThreshold: 2.0,
      isActive: true,
      status: 'active',
      metadata: {
        indexProvider: 'yahoo_finance',
        components: 500
      }
    })
  }

  /**
   * Register a new oracle feed
   */
  registerOracleFeed(feed: Omit<OracleFeed, 'lastUpdate' | 'lastPrice'>): OracleFeed {
    const fullFeed: OracleFeed = {
      ...feed,
      lastUpdate: new Date(),
      lastPrice: '0'
    }

    this.oracleFeeds.set(feed.id, fullFeed)

    this.emit('oracleFeed:registered', { feed: fullFeed })

    return fullFeed
  }

  /**
   * Get oracle feed data
   */
  async getOraclePrice(feedId: string): Promise<{
    price: string
    timestamp: Date
    confidence: number
    metadata: Record<string, any>
  }> {
    try {
      const feed = this.oracleFeeds.get(feedId)
      if (!feed) {
        throw new Error(`Oracle feed ${feedId} not found`)
      }

      // In real implementation, this would query the Chainlink oracle contract
      // For now, simulate getting price data
      const priceData = await this.queryChainlinkFeed(feed.oracleAddress, feed.assetSymbol)

      // Update feed with latest data
      feed.lastPrice = priceData.price
      feed.lastUpdate = priceData.timestamp

      return {
        price: priceData.price,
        timestamp: priceData.timestamp,
        confidence: priceData.confidence,
        metadata: priceData.metadata
      }
    } catch (error) {
      this.logger.error(`Failed to get oracle price for ${feedId}:`, error)
      throw error
    }
  }

  /**
   * Query Chainlink oracle feed (simplified implementation)
   */
  private async queryChainlinkFeed(
    oracleAddress: string,
    assetSymbol: string
  ): Promise<{
    price: string
    timestamp: Date
    confidence: number
    metadata: Record<string, any>
  }> {
    try {
      // In a real implementation, this would:
      // 1. Call the Chainlink oracle contract
      // 2. Decode the price data
      // 3. Validate the data freshness and accuracy

      // For now, simulate oracle response
      const mockPrice = (Math.random() * 4000 + 1000).toFixed(8) // Random ETH-like price
      const mockTimestamp = new Date()

      this.logger.info(`Mock Chainlink query for ${assetSymbol}: $${mockPrice}`)

      return {
        price: mockPrice,
        timestamp: mockTimestamp,
        confidence: 95,
        metadata: {
          oracleAddress,
          assetSymbol,
          decimals: 8,
          roundId: Math.floor(Math.random() * 1000000),
          answeredInRound: Math.floor(Math.random() * 1000000)
        }
      }
    } catch (error) {
      this.logger.error('Failed to query Chainlink feed:', error)
      throw error
    }
  }

  // ============ REAL-WORLD DATA FEEDS ============

  /**
   * Record data feed update
   */
  async recordDataFeed(feedId: string, data: Omit<DataFeed, 'id' | 'oracleId'>): Promise<DataFeed> {
    try {
      const feedData: DataFeed = {
        ...data,
        id: `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        oracleId: feedId
      }

      if (!this.dataFeeds.has(feedId)) {
        this.dataFeeds.set(feedId, [])
      }

      this.dataFeeds.get(feedId)!.push(feedData)

      // Trigger subscriptions
      await this.triggerSubscriptions(feedId, feedData)

      this.emit('dataFeed:updated', { feedId, data: feedData })

      return feedData
    } catch (error) {
      this.logger.error(`Failed to record data feed for ${feedId}:`, error)
      throw error
    }
  }

  /**
   * Get latest data for feed
   */
  getLatestData(feedId: string): DataFeed | null {
    const feedData = this.dataFeeds.get(feedId)
    if (!feedData || feedData.length === 0) return null

    return feedData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
  }

  /**
   * Get data feed history
   */
  getDataHistory(feedId: string, limit: number = 100): DataFeed[] {
    const feedData = this.dataFeeds.get(feedId) || []
    return feedData
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // ============ ASSET VALUATION UPDATES ============

  /**
   * Update asset valuation using oracle data
   */
  async updateAssetValuation(
    assetId: string,
    newValue: number,
    currency: string,
    valuationSource: AssetValuationUpdate['valuationSource'],
    oracleFeedId?: string,
    supportingData?: Record<string, any>
  ): Promise<AssetValuationUpdate> {
    try {
      // Get previous valuation
      const previousUpdates = this.valuationUpdates.get(assetId) || []
      const previousValue = previousUpdates.length > 0 ?
        previousUpdates[previousUpdates.length - 1].newValue : 0

      const changePercentage = previousValue > 0 ?
        ((newValue - previousValue) / previousValue) * 100 : 0

      // Calculate confidence based on source and data quality
      const confidence = this.calculateValuationConfidence(valuationSource, supportingData)

      const update: AssetValuationUpdate = {
        id: `valuation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        valuationSource,
        previousValue,
        newValue,
        currency,
        changePercentage,
        confidence,
        timestamp: new Date(),
        oracleFeedId,
        supportingData: supportingData || {},
        approved: false // Would require approval workflow
      }

      if (!this.valuationUpdates.has(assetId)) {
        this.valuationUpdates.set(assetId, [])
      }

      this.valuationUpdates.get(assetId)!.push(update)

      // Emit significant changes
      if (Math.abs(changePercentage) > 5) { // 5%+ change
        this.emit('valuation:significantChange', { assetId, update })
      }

      this.emit('valuation:updated', { assetId, update })

      return update
    } catch (error) {
      this.logger.error(`Failed to update asset valuation for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Calculate valuation confidence
   */
  private calculateValuationConfidence(
    source: AssetValuationUpdate['valuationSource'],
    supportingData?: Record<string, any>
  ): number {
    let confidence = 50 // Base confidence

    switch (source) {
      case 'oracle':
        confidence = 95 // High confidence from oracle data
        break
      case 'manual':
        confidence = 70 // Medium confidence, depends on appraiser
        if (supportingData?.appraiserCertified) confidence += 15
        break
      case 'api':
        confidence = 85 // Good confidence from verified APIs
        break
      case 'market_data':
        confidence = 75 // Market data can be volatile
        break
    }

    // Adjust based on supporting data quality
    if (supportingData?.multipleSources) confidence += 5
    if (supportingData?.recentData) confidence += 5
    if (supportingData?.verifiedSource) confidence += 5

    return Math.min(confidence, 100)
  }

  /**
   * Get asset valuation history
   */
  getAssetValuationHistory(assetId: string): AssetValuationUpdate[] {
    const updates = this.valuationUpdates.get(assetId) || []
    return updates.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Get latest asset valuation
   */
  getLatestAssetValuation(assetId: string): AssetValuationUpdate | null {
    const history = this.getAssetValuationHistory(assetId)
    return history.length > 0 ? history[0] : null
  }

  // ============ MARKET DATA INTEGRATION ============

  /**
   * Record market data feed
   */
  async recordMarketData(marketData: Omit<MarketDataFeed, 'id'>): Promise<MarketDataFeed> {
    try {
      const feed: MarketDataFeed = {
        ...marketData,
        id: `market-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const key = `${marketData.source}-${marketData.indexName}`
      if (!this.marketData.has(key)) {
        this.marketData.set(key, [])
      }

      this.marketData.get(key)!.push(feed)

      // Trigger market data alerts
      await this.checkMarketAlerts(feed)

      this.emit('marketData:updated', { feed })

      return feed
    } catch (error) {
      this.logger.error('Failed to record market data:', error)
      throw error
    }
  }

  /**
   * Check for market data alerts
   */
  private async checkMarketAlerts(feed: MarketDataFeed): Promise<void> {
    try {
      // Check for significant market movements
      if (Math.abs(feed.changePercent24h) > 5) { // 5%+ change
        this.emit('market:significantMovement', {
          indexName: feed.indexName,
          changePercent: feed.changePercent24h,
          timestamp: feed.timestamp
        })
      }

      // Check component alerts
      for (const component of feed.components) {
        if (Math.abs(component.changePercent) > 10) { // 10%+ individual change
          this.emit('market:componentAlert', {
            indexName: feed.indexName,
            symbol: component.symbol,
            changePercent: component.changePercent,
            timestamp: feed.timestamp
          })
        }
      }
    } catch (error) {
      this.logger.error('Failed to check market alerts:', error)
    }
  }

  /**
   * Get latest market data
   */
  getLatestMarketData(indexName: string, source: string): MarketDataFeed | null {
    const key = `${source}-${indexName}`
    const data = this.marketData.get(key)
    if (!data || data.length === 0) return null

    return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
  }

  // ============ WEATHER DATA INTEGRATION ============

  /**
   * Record weather data
   */
  async recordWeatherData(weatherData: Omit<WeatherData, 'id'>): Promise<WeatherData> {
    try {
      const data: WeatherData = {
        ...weatherData,
        id: `weather-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const key = `${weatherData.location.city}-${weatherData.location.country}`
      if (!this.weatherData.has(key)) {
        this.weatherData.set(key, [])
      }

      this.weatherData.get(key)!.push(data)

      // Check for weather alerts
      await this.checkWeatherAlerts(data)

      this.emit('weatherData:recorded', { data })

      return data
    } catch (error) {
      this.logger.error('Failed to record weather data:', error)
      throw error
    }
  }

  /**
   * Check for weather-related alerts
   */
  private async checkWeatherAlerts(data: WeatherData): Promise<void> {
    try {
      // Check for extreme weather conditions
      if (data.temperature > 35 || data.temperature < -10) { // Extreme temperatures
        this.emit('weather:extremeTemperature', {
          location: data.location,
          temperature: data.temperature,
          timestamp: data.timestamp
        })
      }

      if (data.precipitation > 50) { // Heavy precipitation
        this.emit('weather:heavyPrecipitation', {
          location: data.location,
          precipitation: data.precipitation,
          timestamp: data.timestamp
        })
      }

      if (data.windSpeed > 30) { // High winds
        this.emit('weather:highWinds', {
          location: data.location,
          windSpeed: data.windSpeed,
          timestamp: data.timestamp
        })
      }

      // Check forecast for potential issues
      for (const forecast of data.forecast.slice(0, 3)) { // Next 3 days
        if (forecast.precipitationChance > 70) {
          this.emit('weather:precipitationForecast', {
            location: data.location,
            forecast,
            timestamp: data.timestamp
          })
        }
      }
    } catch (error) {
      this.logger.error('Failed to check weather alerts:', error)
    }
  }

  /**
   * Get current weather for location
   */
  getCurrentWeather(city: string, country: string): WeatherData | null {
    const key = `${city}-${country}`
    const data = this.weatherData.get(key)
    if (!data || data.length === 0) return null

    return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
  }

  /**
   * Get weather forecast for location
   */
  getWeatherForecast(city: string, country: string, days: number = 7): WeatherForecast[] {
    const current = this.getCurrentWeather(city, country)
    if (!current) return []

    return current.forecast.slice(0, days)
  }

  // ============ IOT SENSOR DATA INTEGRATION ============

  /**
   * Record IoT sensor data
   */
  async recordIoTSensorData(sensorData: Omit<IoTSensorData, 'id'>): Promise<IoTSensorData> {
    try {
      const data: IoTSensorData = {
        ...sensorData,
        id: `iot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      // Store by asset ID
      if (!this.iotData.has(sensorData.assetId)) {
        this.iotData.set(sensorData.assetId, [])
      }

      this.iotData.get(sensorData.assetId)!.push(data)

      // Check for sensor alerts
      await this.checkSensorAlerts(data)

      // Update asset metrics based on sensor data
      await this.updateAssetMetricsFromSensor(data)

      this.emit('iotData:recorded', { data })

      return data
    } catch (error) {
      this.logger.error('Failed to record IoT sensor data:', error)
      throw error
    }
  }

  /**
   * Check for sensor-based alerts
   */
  private async checkSensorAlerts(data: IoTSensorData): Promise<void> {
    try {
      // Define alert thresholds based on sensor type
      const thresholds: Record<string, { min?: number; max?: number }> = {
        temperature: { min: -10, max: 50 },
        humidity: { min: 10, max: 90 },
        vibration: { max: 5.0 }, // Vibration intensity
        pressure: { min: 0.8, max: 1.2 }, // Atmospheric pressure in atm
      }

      const threshold = thresholds[data.sensorType]
      if (threshold) {
        let alertTriggered = false

        if (threshold.min !== undefined && data.value < threshold.min) {
          alertTriggered = true
          this.emit('sensor:thresholdBreached', {
            sensorId: data.sensorId,
            assetId: data.assetId,
            sensorType: data.sensorType,
            value: data.value,
            threshold: threshold.min,
            direction: 'below',
            timestamp: data.timestamp
          })
        }

        if (threshold.max !== undefined && data.value > threshold.max) {
          alertTriggered = true
          this.emit('sensor:thresholdBreached', {
            sensorId: data.sensorId,
            assetId: data.assetId,
            sensorType: data.sensorType,
            value: data.value,
            threshold: threshold.max,
            direction: 'above',
            timestamp: data.timestamp
          })
        }

        // Check calibration status
        if (data.calibrationStatus === 'needs_calibration' || data.calibrationStatus === 'failed') {
          this.emit('sensor:calibrationRequired', {
            sensorId: data.sensorId,
            assetId: data.assetId,
            status: data.calibrationStatus,
            timestamp: data.timestamp
          })
        }
      }
    } catch (error) {
      this.logger.error('Failed to check sensor alerts:', error)
    }
  }

  /**
   * Update asset metrics from sensor data
   */
  private async updateAssetMetricsFromSensor(data: IoTSensorData): Promise<void> {
    try {
      // This would integrate with asset lifecycle service
      // to update asset condition based on sensor readings

      this.emit('asset:metricsUpdated', {
        assetId: data.assetId,
        sensorType: data.sensorType,
        value: data.value,
        timestamp: data.timestamp
      })
    } catch (error) {
      this.logger.error(`Failed to update asset metrics from sensor ${data.sensorId}:`, error)
    }
  }

  /**
   * Get latest sensor data for asset
   */
  getLatestSensorData(assetId: string, sensorType?: string): IoTSensorData[] {
    const allData = this.iotData.get(assetId) || []

    if (!sensorType) return allData

    return allData.filter(data => data.sensorType === sensorType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // ============ DATA VALIDATION & MONITORING ============

  /**
   * Validate oracle data
   */
  async validateOracleData(feedId: string): Promise<OracleValidation[]> {
    try {
      const validations: OracleValidation[] = []
      const feed = this.oracleFeeds.get(feedId)

      if (!feed) {
        throw new Error(`Oracle feed ${feedId} not found`)
      }

      // Check data freshness
      const timeSinceUpdate = (Date.now() - feed.lastUpdate.getTime()) / 1000
      if (timeSinceUpdate > feed.heartbeat) {
        validations.push({
          id: `validation-${Date.now()}-stale`,
          feedId,
          validationType: 'stale_data',
          status: 'failed',
          checkedAt: new Date(),
          details: {
            timeSinceUpdate,
            heartbeat: feed.heartbeat,
            lastUpdate: feed.lastUpdate
          },
          recommendations: ['Refresh oracle data', 'Check oracle contract status']
        })
      }

      // Check data deviation (would compare with multiple sources)
      // This is simplified - in reality would compare with other oracles
      const deviation = Math.random() * 10 // Mock deviation
      if (deviation > feed.deviationThreshold) {
        validations.push({
          id: `validation-${Date.now()}-deviation`,
          feedId,
          validationType: 'deviation_check',
          status: 'warning',
          checkedAt: new Date(),
          details: {
            deviation,
            threshold: feed.deviationThreshold,
            currentPrice: feed.lastPrice
          },
          recommendations: ['Verify data sources', 'Check for market anomalies']
        })
      }

      // Store validations
      if (!this.validations.has(feedId)) {
        this.validations.set(feedId, [])
      }
      this.validations.get(feedId)!.push(...validations)

      return validations
    } catch (error) {
      this.logger.error(`Failed to validate oracle data for ${feedId}:`, error)
      throw error
    }
  }

  // ============ SUBSCRIPTION MANAGEMENT ============

  /**
   * Subscribe to data feed updates
   */
  subscribeToFeed(
    subscriberId: string,
    feedId: string,
    callbackUrl?: string,
    filters?: Record<string, any>
  ): DataFeedSubscription {
    const subscription: DataFeedSubscription = {
      id: `subscription-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subscriberId,
      feedId,
      callbackUrl,
      filters: filters || {},
      isActive: true,
      createdAt: new Date()
    }

    if (!this.subscriptions.has(subscriberId)) {
      this.subscriptions.set(subscriberId, [])
    }

    this.subscriptions.get(subscriberId)!.push(subscription)

    this.emit('subscription:created', { subscription })

    return subscription
  }

  /**
   * Trigger subscriptions for data feed update
   */
  private async triggerSubscriptions(feedId: string, data: DataFeed): Promise<void> {
    try {
      // Find all active subscriptions for this feed
      const allSubscriptions = Array.from(this.subscriptions.values()).flat()
      const relevantSubscriptions = allSubscriptions.filter(sub =>
        sub.feedId === feedId && sub.isActive
      )

      for (const subscription of relevantSubscriptions) {
        try {
          // Apply filters
          if (this.matchesFilters(data, subscription.filters)) {
            // Update last triggered
            subscription.lastTriggered = new Date()

            // Call webhook if configured
            if (subscription.callbackUrl) {
              await this.callWebhook(subscription.callbackUrl, {
                subscriptionId: subscription.id,
                feedId,
                data,
                timestamp: new Date()
              })
            }

            this.emit('subscription:triggered', { subscription, data })
          }
        } catch (error) {
          this.logger.error(`Failed to trigger subscription ${subscription.id}:`, error)
        }
      }
    } catch (error) {
      this.logger.error(`Failed to trigger subscriptions for ${feedId}:`, error)
    }
  }

  /**
   * Check if data matches subscription filters
   */
  private matchesFilters(data: DataFeed, filters: Record<string, any>): boolean {
    try {
      for (const [key, filterValue] of Object.entries(filters)) {
        const dataValue = data[key as keyof DataFeed]

        if (typeof filterValue === 'object' && filterValue.operator) {
          // Advanced filter with operator
          switch (filterValue.operator) {
            case 'gt':
              if (!(dataValue > filterValue.value)) return false
              break
            case 'lt':
              if (!(dataValue < filterValue.value)) return false
              break
            case 'eq':
              if (dataValue !== filterValue.value) return false
              break
            case 'between':
              if (!(dataValue >= filterValue.min && dataValue <= filterValue.max)) return false
              break
          }
        } else {
          // Simple equality check
          if (dataValue !== filterValue) return false
        }
      }

      return true
    } catch (error) {
      this.logger.error('Failed to check filters:', error)
      return false
    }
  }

  /**
   * Call webhook for subscription
   */
  private async callWebhook(url: string, payload: any): Promise<void> {
    try {
      // In a real implementation, this would make an HTTP request
      this.logger.info(`Mock webhook call to ${url}:`, payload)
    } catch (error) {
      this.logger.error(`Failed to call webhook ${url}:`, error)
    }
  }

  // ============ AUTOMATED MONITORING ============

  /**
   * Start automated oracle monitoring
   */
  startOracleMonitoring(intervalMinutes: number = 5): void {
    // Clear existing interval
    const existingInterval = this.monitoringIntervals.get('oracle-monitoring')
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Start monitoring interval
    const interval = setInterval(async () => {
      try {
        // Validate all active feeds
        for (const feed of this.oracleFeeds.values()) {
          if (feed.isActive) {
            await this.validateOracleData(feed.id)

            // Refresh price data
            await this.getOraclePrice(feed.id)
          }
        }

        this.emit('monitoring:cycle', {
          timestamp: new Date(),
          feedsValidated: Array.from(this.oracleFeeds.values()).filter(f => f.isActive).length
        })
      } catch (error) {
        this.logger.error('Error in oracle monitoring cycle:', error)
      }
    }, intervalMinutes * 60 * 1000)

    this.monitoringIntervals.set('oracle-monitoring', interval)
    this.logger.info(`Started oracle monitoring (every ${intervalMinutes} minutes)`)
  }

  /**
   * Stop automated monitoring
   */
  stopOracleMonitoring(): void {
    const interval = this.monitoringIntervals.get('oracle-monitoring')
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete('oracle-monitoring')
      this.logger.info('Stopped oracle monitoring')
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get all oracle feeds
   */
  getAllOracleFeeds(): OracleFeed[] {
    return Array.from(this.oracleFeeds.values())
  }

  /**
   * Get oracle feed by ID
   */
  getOracleFeed(feedId: string): OracleFeed | null {
    return this.oracleFeeds.get(feedId) || null
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): DataFeedSubscription | null {
    for (const subscriptions of this.subscriptions.values()) {
      const subscription = subscriptions.find(s => s.id === subscriptionId)
      if (subscription) return subscription
    }
    return null
  }

  /**
   * Get subscriptions for subscriber
   */
  getSubscriptions(subscriberId: string): DataFeedSubscription[] {
    return this.subscriptions.get(subscriberId) || []
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
        activeFeeds: Array.from(this.oracleFeeds.values()).filter(f => f.isActive).length,
        totalDataPoints: Array.from(this.dataFeeds.values()).flat().length,
        activeSubscriptions: Array.from(this.subscriptions.values()).flat().filter(s => s.isActive).length,
        monitoringActive: this.monitoringIntervals.has('oracle-monitoring'),
        weatherLocations: this.weatherData.size,
        iotAssets: this.iotData.size
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.oracleFeeds.clear()
    this.dataFeeds.clear()
    this.valuationUpdates.clear()
    this.marketData.clear()
    this.weatherData.clear()
    this.iotData.clear()
    this.validations.clear()
    this.subscriptions.clear()

    this.stopOracleMonitoring()

    this.logger.info('All oracle integration data cleared')
  }
}

export default OracleIntegrationService
