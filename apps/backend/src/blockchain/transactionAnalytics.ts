import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Transaction, TransactionStatus, TransactionPriority } from './transactionMonitor'
import { TransactionQueueManager } from './transactionQueue'

// Analytics data interface
export interface TransactionAnalytics {
  totalTransactions: number
  totalVolume: string
  averageTransactionValue: string
  successRate: number
  averageConfirmationTime: number
  peakHourlyTransactions: number
  peakDailyTransactions: number
  averageGasPrice: string
  totalGasUsed: string
  networkUtilization: number
  errorRate: number
  retryRate: number
  transactionTypes: Record<string, number>
  userActivity: Record<string, any>
  performanceMetrics: {
    averageResponseTime: number
    averageProcessingTime: number
    throughput: number
    errorDistribution: Record<string, number>
  }
}

// Time series data interface
export interface TimeSeriesData {
  timestamp: Date
  date: string
  hour: number
  day: string
  transactions: number
  volume: string
  gasUsed: string
  averageGasPrice: string
  successRate: number
  averageConfirmationTime: number
}

// User activity interface
export interface UserActivity {
  userId: string
  transactions: number
  totalVolume: string
  successRate: number
  lastActivity: Date
  preferredChains: number[]
    averageTransactionSize: string
    transactionTypes: Record<string, number>
  activeQueues: number
  networkPreferences: Record<string, any>
  deviceUsage: Record<string, any>
  locationData: Record<string, any>
  }

// Performance metrics interface
export interface PerformanceMetrics {
  apiResponseTime: number
  databaseQueryTime: number
  blockchainResponseTime: number
  cacheHitRate: number
  errorRate: number
  throughput: number
  concurrentUsers: number
  memoryUsage: any
  cpuUsage: any
}

// Transaction analytics service
export class TransactionAnalytics extends EventEmitter {
  private transactionMonitor: TransactionMonitor
  private queueManager: TransactionQueueManager
  private logger: Logger
  private isAnalyzing: boolean = false
  private analyticsInterval: number = 60000 // 1 minute
  private timeSeriesData: Map<string, TimeSeriesData[]> = new Map()
  private userActivity: Map<string, UserActivity> = new Map()
  private performanceMetrics: PerformanceMetrics
  private analyticsData: TransactionAnalytics

  constructor(
    transactionMonitor: TransactionMonitor,
    queueManager: TransactionQueueManager,
    logger: Logger
  ) {
    super()
    this.transactionMonitor = transactionMonitor
    this.queueManager = queueManager
    this.logger = logger
  }

  // Start analytics
  async start(): Promise<void> {
    if (this.isAnalyzing) {
      this.logger.warn('Transaction analytics already started')
      return
    }

    this.isAnalyzing = true
    this.logger.info('Starting transaction analytics...')

    // Start analytics intervals
    this.startAnalyticsIntervals()

    // Load historical data
    await this.loadAnalyticsData()

    this.logger.info('Transaction analytics started')
    this.emit('analytics:started')
  }

  // Stop analytics
  async stop(): Promise<void> {
    if (!this.isAnalyzing) {
      return
    }

    this.isAnalyzing = false
    this.logger.info('Stopping transaction analytics...')

    // Save analytics data
    await this.saveAnalyticsData()

    this.logger.info('Transaction analytics stopped')
    this.emit('analytics:stopped')
  }

  // Get comprehensive analytics
  async getAnalytics(timeRange?: {
    from?: Date
    to?: Date
    chainId?: number
    userId?: string
  }): Promise<TransactionAnalytics> {
    try {
      this.logger.debug('Generating comprehensive analytics...')

      // Get time series data
      const timeSeries = this.getTimeSeriesData(timeRange)
      
      // Calculate analytics from time series
      const analytics = this.calculateAnalyticsFromTimeSeries(timeSeries)

      // Get user activity data
      const userActivity = await this.getUserActivity(userId)

      // Get performance metrics
      const performanceMetrics = this.getPerformanceMetrics()

      this.logger.info('Analytics generated successfully')
      this.emit('analytics:generated', { analytics, timeRange, chainId, userId })

      return {
        ...analytics,
        userActivity,
        performanceMetrics
      }
    } catch (error) {
      this.logger.error('Failed to generate analytics:', error)
      throw error
    }
  }

  // Get transaction analytics
  async getTransactionAnalytics(timeRange?: {
    from?: Date
    to?: Date
    chainId?: number
  }): Promise<{
    totalTransactions: number
    totalVolume: string
    averageTransactionValue: string
    successRate: number
    averageConfirmationTime: number
    peakHourlyTransactions: number
    peakDailyTransactions: number
    averageGasPrice: string
    totalGasUsed: string
    networkUtilization: number
    errorRate: number
    retryRate: number
    transactionTypes: Record<string, number>
    timeSeriesData: TimeSeriesData[]
  }> {
    const timeSeries = this.getTimeSeriesData(timeRange)
    return this.calculateTransactionAnalyticsFromTimeSeries(timeSeries)
  }

  // Get user analytics
  async getUserAnalytics(userId?: string): Promise<{
    totalTransactions: number
    totalVolume: string
    successRate: number
    averageTransactionValue: string
    preferredChains: number[]
    transactionTypes: Record<string, number>
    activeQueues: number
    networkPreferences: Record<string, any>
    deviceUsage: Record<string, any>
    locationData: Record<string, any>
    lastActivity: Date
  }> {
    return this.userActivity.get(userId) || {
      totalTransactions: 0,
      totalVolume: '0',
      successRate: 0,
      preferredChains: [],
      transactionTypes: {},
      activeQueues: 0,
      networkPreferences: {},
      deviceUsage: {},
      locationData: {},
      lastActivity: new Date()
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.performanceMetrics
  }

  // Get time series data
  private getTimeSeriesData(timeRange?: { from?: Date; to?: Date }): Map<string, TimeSeriesData[]> {
    const now = new Date()
    const from = timeRange?.from || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    const to = timeRange?.to || now

    const timeSeries = new Map()

    // Get transaction data for time range
    const transactions = this.getTransactionsInTimeRange(from, to)
    
    // Group by day
    const dailyData = this.groupTransactionsByDay(transactions)
    
    // Group by hour
    const hourlyData = this.groupTransactionsByHour(transactions)
    
    // Store time series data
    for (const [date, dayData] of dailyData.entries()) {
      timeSeries.set(date, dayData)
    }

    for (const [date, hourData] of hourlyData.entries()) {
      const dateKey = date.toISOString().split('T')[0]
      if (!timeSeries.has(dateKey)) {
        timeSeries.set(dateKey, [])
      }
      timeSeries.get(dateKey)!.push(...hourData)
    }

    return timeSeries
  }

  // Get transactions in time range
  private getTransactionsInTimeRange(from: Date, to: Date): Transaction[] {
    const allTransactions = [
      ...this.transactionMonitor.getTransactionsByStatus(TransactionStatus.CONFIRMED),
      ...this.transactionMonitor.getTransactionsByStatus(TransactionStatus.FAILED)
    ]

    return allTransactions.filter(tx => {
      const txDate = new Date(tx.createdAt)
      return txDate >= from && txDate <= to
    })
  }

  // Group transactions by day
  private groupTransactionsByDay(transactions: Transaction[]): Map<string, TimeSeriesData[]> {
    const dailyData = new Map()

    for (const transaction of transactions) {
      const date = new Date(transaction.createdAt)
      const dateKey = date.toISOString().split('T')[0]
      
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, [])
      }

      const dayData = dailyData.get(dateKey) || []
      dayData.push({
        timestamp: date,
        date: dateKey,
        transactions: 1,
        volume: transaction.value,
        gasUsed: transaction.gasUsed || '0',
        averageGasPrice: transaction.effectiveGasPrice || '0',
        successRate: this.calculateSuccessRate(dayData),
        averageConfirmationTime: this.calculateAverageConfirmationTime(dayData)
      })

      dailyData.set(dateKey, dayData)
    }

    return dailyData
  }

  // Group transactions by hour
  private groupTransactionsByHour(transactions: Transaction[]): Map<string, TimeSeriesData[]> {
    const hourlyData = new Map()

    for (const transaction of transactions) {
      const hour = new Date(transaction.createdAt)
      const hourKey = `${hour.getHours()}:00`
      
      if (!hourlyData.has(hourKey)) {
        hourlyData.set(hourKey, [])
      }

      const hourData = hourlyData.get(hourKey) || []
      hourData.push({
        timestamp: hour,
        date: hour.toISOString().split('T')[0],
        hour: hourKey,
        transactions: 1,
        volume: transaction.value,
        gasUsed: transaction.gasUsed || '0',
        averageGasPrice: transaction.effectiveGasPrice || '0',
        successRate: this.calculateSuccessRate(hourData),
        averageConfirmationTime: this.calculateAverageConfirmationTime(hourData)
      })

      hourlyData.set(hourKey, hourData)
    }

    return hourlyData
  }

  // Calculate analytics from time series
  private calculateAnalyticsFromTimeSeries(timeSeries: Map<string, TimeSeriesData[]>): TransactionAnalytics {
    const allData = Array.from(timeSeries.values()).flat()

    const totalTransactions = allData.length
    const totalVolume = allData.reduce((sum, data) => sum + parseFloat(data.volume || '0'), 0)
    const averageTransactionValue = totalVolume > 0 ? (totalVolume / totalTransactions).toFixed(2) : '0'

    const confirmedTransactions = allData.filter(data => data.successRate > 0)
    const successRate = confirmedTransactions.length > 0 ? 
      (confirmedTransactions.reduce((sum, data) => sum + data.successRate, 0) / confirmedTransactions.length : 0

    const averageConfirmationTime = confirmedTransactions.length > 0 ?
      confirmedTransactions.reduce((sum, data) => sum + data.averageConfirmationTime, 0) / confirmedTransactions.length : 0

    const averageGasPrice = allData.length > 0 ?
      allData.reduce((sum, data) => sum + parseFloat(data.averageGasPrice || '0'), 0) / allData.length : '0'

    const totalGasUsed = allData.reduce((sum, data) => sum + parseInt(data.gasUsed || '0'), 0)
    const networkUtilization = this.calculateNetworkUtilization(allData)

    const errorRate = allData.length > 0 ?
      allData.filter(data => data.successRate === 0).length / allData.length : 0

    const transactionTypes = this.calculateTransactionTypes(allData)
    const peakHourlyTransactions = this.calculatePeakHourlyTransactions(allData)
    const peakDailyTransactions = this.calculatePeakDailyTransactions(allData)

    return {
      totalTransactions,
      totalVolume,
      averageTransactionValue,
      successRate,
      averageConfirmationTime,
      peakHourlyTransactions,
      peakDailyTransactions,
      averageGasPrice,
      totalGasUsed,
      networkUtilization,
      errorRate,
      transactionTypes,
      timeSeriesData: Array.from(timeSeries.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }
    }
  }

  // Calculate success rate
  private calculateSuccessRate(data: TimeSeriesData[]): number {
    if (data.length === 0) return 0

    const successfulTransactions = data.filter(d => d.successRate > 0)
    return successfulTransactions.length / data.length
  }

  // Calculate average confirmation time
  private calculateAverageConfirmationTime(data: TimeSeriesData[]): number {
    if (data.length === 0) return 0

    const confirmationTimes = data.map(d => d.averageConfirmationTime).filter(time => time > 0)
    return confirmationTimes.length > 0 ? 
      confirmationTimes.reduce((sum, time) => sum + time, 0) / confirmationTimes.length : 0
  }

  // Calculate peak hourly transactions
  private calculatePeakHourlyTransactions(data: TimeSeriesData[]): number {
    const hourlyCounts = data.map(d => d.transactions)
    return Math.max(...hourlyCounts)
  }

  // Calculate peak daily transactions
  private calculatePeakDailyTransactions(data: TimeSeries[]): number {
    const dailyCounts = data.map(d => d.transactions)
    return Math.max(...dailyCounts)
  }

  // Calculate transaction types
  private calculateTransactionTypes(data: TimeSeriesData[]): Record<string, number> {
    const types: Record<string, number> = {}

    for (const data of data) {
      for (const [type, count] of Object.entries(data.transactionTypes)) {
        types[type] = (types[type] || 0) + count
      }
    }

    return types
  }

  // Calculate network utilization
  private calculateNetworkUtilization(data: TimeSeriesData[]): number {
    // This would calculate actual network utilization based on gas usage
    // For now, return a mock calculation
    const totalGasUsed = data.reduce((sum, d) => sum + parseInt(d.gasUsed || '0'), 0)
    const maxGasLimit = 8000000
    return (totalGasUsed / maxGasLimit) * 100
  }

  // Start analytics intervals
  private startAnalyticsIntervals(): void {
    // Update analytics every minute
    setInterval(async () => {
      await this.updateAllAnalyticsData()
    }, this.analyticsInterval)

    // Update performance metrics every minute
    setInterval(() => {
      this.updatePerformanceMetrics()
    }, 60000)

    // Clean old data every hour
    setInterval(() => {
      this.cleanupOldData()
    }, 3600000) // Every hour

    // Update user activity every 5 minutes
    setInterval(() => {
      this.updateUserActivity()
    }, 300000)
  }

    // Update time series data every 5 minutes
    setInterval(() => {
      this.updateTimeSeriesData()
    }, 300000)
  }

    this.logger.info('Analytics intervals started')
  }

  // Update all analytics data
  private async updateAllAnalyticsData(): Promise<void> {
    try {
      // Get current transaction data
      const transactions = [
        ...this.transactionMonitor.getTransactionsByStatus(TransactionStatus.CONFIRMED),
        ...this.transactionMonitor.getTransactionsByStatus(TransactionStatus.FAILED)
      ]

      // Update time series data
      this.updateTimeSeriesData()

      // Update user activity
      this.updateUserActivity()

      // Update performance metrics
      this.updatePerformanceMetrics()

      // Save analytics data
      await this.saveAnalyticsData()

      this.logger.debug('Analytics data updated')
    } catch (error) {
      this.logger.error('Failed to update analytics data:', error)
    }
  }

  // Update time series data
  private updateTimeSeriesData(): void {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDate = now.toISOString().split('T')[0]

    if (!this.timeSeries.has(currentDate)) {
      this.timeSeries.set(currentDate, [])
    }

    const hourlyData = this.timeSeries.get(currentDate) || []
    hourlyData.push({
      timestamp: now,
      date: currentDate,
      hour: `${currentHour}:00`,
      transactions: 0,
      volume: '0',
      gasUsed: '0',
      averageGasPrice: '0',
      successRate: 0,
      averageConfirmationTime: 0
    })

    this.timeSeries.set(currentDate, hourlyData)
  }

    // Update user activity
  private async updateUserActivity(): Promise<void> {
      // This would update user activity from your database
      this.logger.debug('User activity updated')
    }

    // Update performance metrics
    private updatePerformanceMetrics(): void {
      // This would collect actual performance metrics
    const mockMetrics = {
      apiResponseTime: 150,
      databaseQueryTime: 50,
      blockchainResponseTime: 200,
      cacheHitRate: 85,
      errorRate: 2,
      throughput: 1000,
      concurrentUsers: 50,
      memoryUsage: {
        used: 500,
        total: 4096,
        free: 3596
      },
      cpuUsage: {
        used: 25,
        total: 100
      }
    }

    this.performanceMetrics = mockMetrics
    this.logger.debug('Performance metrics updated')
  }

    // Clean old data
    private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

    for (const [date, data] of this.timeSeries.entries()) {
      const dataDate = new Date(date)
      if (dataDate < cutoff) {
        this.timeSeries.delete(date)
      }
    }
  }

    // Save analytics data
    private async saveAnalyticsData(): Promise<void> {
      // This would save to your database
      this.logger.debug('Analytics data saved')
    }

    // Load analytics data
    private async loadAnalyticsData(): Promise<void> {
      // This would load from your database
      this.logger.info('Loading analytics data...')
    }

    // Get user activity data
    private async getUserActivity(userId?: string): Promise<UserActivity> {
      // This would fetch user activity from your database
      return {
        totalTransactions: 0,
        totalVolume: '0',
        successRate: 0,
        preferredChains: [],
        transactionTypes: {},
        activeQueues: 0,
        networkPreferences: {},
        deviceUsage: {},
        locationData: {},
        lastActivity: new Date()
      }
    }

    // Export analytics data
    exportAnalyticsData(format: 'json' | 'csv' = 'json'): string {
      const data = {
        timestamp: new Date().toISOString(),
        analytics: this.analyticsData,
        timeSeriesData: Array.from(this.timeSeries.values()).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        userActivity: Object.fromEntries(this.userActivity.entries()),
        performanceMetrics: this.performanceMetrics
      }

      if (format === 'json') {
        return JSON.stringify(data, null, 2)
      } else if (format === 'csv') {
        // Convert to CSV format
        const headers = ['timestamp', 'date', 'hour', 'transactions', 'volume', 'gasUsed', 'averageGasPrice', 'successRate', 'averageConfirmationTime']
        const csvRows = [headers.join(',')]
        
        for (const [date, data] of this.timeSeries.entries()) {
          for (const transaction of data.transactions) {
            csvRows.push([
              date,
              date,
              hour,
              transaction.id,
              transaction.hash,
              transaction.status,
              transaction.createdAt,
              transaction.updatedAt
            ])
          }
        }
        
        return csvRows.join('\n')
      }
    }

      return ''
    }
  }

  // Get health status
  getHealthStatus(): {
    return {
      isAnalyzing: this.isAnalyzing,
      uptime: process.uptime(),
      lastUpdate: new Date(),
      metrics: this.performanceMetrics
    }
  }
}

export default TransactionAnalytics
