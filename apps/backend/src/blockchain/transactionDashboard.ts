import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Transaction, TransactionStatus, TransactionPriority } from './transactionMonitor'
import { TransactionQueueManager } from './transactionQueue'
import { GasOptimizer } from './gasOptimizer'
import { TransactionAnalytics } from './transactionAnalytics'
import { TransactionAlerting } from './transactionAlerting'
import { TransactionHistory } from './transactionHistory'

// Dashboard configuration interface
export interface DashboardConfig {
  id: string
  name: string
  description: string
  refreshInterval: number
  autoRefresh: boolean
  theme: 'light' | 'dark' | 'auto'
  layout: 'grid' | 'list' | 'cards'
  widgets: WidgetConfig[]
  filters: FilterConfig[]
  permissions: PermissionConfig[]
  notifications: NotificationConfig
}

// Widget configuration interface
export interface WidgetConfig {
  id: string
  type: 'chart' | 'table' | 'metric' | 'alert' | 'status' | 'timeline'
  title: string
  description: string
  position: { x: number; y: number; width: number; height: number }
  dataSource: string
  refreshInterval: number
  config: any
  filters: string[]
  permissions: string[]
}

// Filter configuration interface
export interface FilterConfig {
  id: string
  name: string
  type: 'select' | 'multiselect' | 'date' | 'range' | 'text' | 'boolean'
  options?: string[]
  defaultValue?: any
  required: boolean
  dataSource: string
  mapping: (value: any) => any
}

// Permission configuration interface
export interface PermissionConfig {
  role: string
  permissions: string[]
  widgets: string[]
  filters: string[]
  actions: string[]
}

// Notification configuration interface
export interface NotificationConfig {
  email: boolean
  push: boolean
  webhook: boolean
  thresholds: {
    transactionFailure: number
    queueSize: number
    gasPrice: number
    responseTime: number
  }
}

// Dashboard data interface
export interface DashboardData {
  timestamp: Date
  summary: {
    totalTransactions: number
    pendingTransactions: number
    confirmedTransactions: number
    failedTransactions: number
    successRate: number
    averageGasPrice: string
    totalVolume: string
    averageConfirmationTime: number
    activeQueues: number
    activeAlerts: number
  }
  charts: {
    transactionVolume: ChartData
    gasUsage: ChartData
    successRate: ChartData
    responseTime: ChartData
    queueUtilization: ChartData
    alertTrends: ChartData
  }
  tables: {
    recentTransactions: TableData
    activeQueues: TableData
    unresolvedAlerts: TableData
    topUsers: TableData
    gasOptimization: TableData
  }
  metrics: {
    performance: MetricData[]
    network: MetricData[]
    system: MetricData[]
  }
  alerts: AlertData[]
}

// Chart data interface
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  title: string
  subtitle?: string
  xAxis: {
    label: string
    type: 'time' | 'category' | 'value'
    data: any[]
  }
  yAxis: {
    label: string
    type: 'value' | 'percentage'
    min?: number
    max?: number
  }
  series: {
    name: string
    data: any[]
    color?: string
    type?: string
  }[]
  options?: any
}

// Table data interface
export interface TableData {
  title: string
  columns: {
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'status' | 'badge' | 'link'
    sortable: boolean
    filterable: boolean
    format?: (value: any) => string
  }[]
  rows: any[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  sorting: {
    column: string
    direction: 'asc' | 'desc'
  }
  filters: {
    [key: string]: any
  }
}

// Metric data interface
export interface MetricData {
  id: string
  name: string
  value: number | string
  unit?: string
  trend: 'up' | 'down' | 'stable'
  trendValue?: number
  status: 'good' | 'warning' | 'critical'
  threshold?: {
    warning: number
    critical: number
  }
  lastUpdated: Date
}

// Alert data interface
export interface AlertData {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
  actions: {
    label: string
    action: string
    type: 'primary' | 'secondary' | 'danger'
  }[]
}

// Transaction dashboard service
export class TransactionDashboard extends EventEmitter {
  private config: DashboardConfig
  private transactionMonitor: TransactionMonitor
  private queueManager: TransactionQueueManager
  private gasOptimizer: GasOptimizer
  private analytics: TransactionAnalytics
  private alerting: TransactionAlerting
  private history: TransactionHistory
  private logger: Logger
  private isRunning: boolean = false
  private refreshTimer?: NodeJS.Timeout
  private cache: Map<string, any> = new Map()
  private cacheTimeout: number = 30000 // 30 seconds

  constructor(
    config: DashboardConfig,
    transactionMonitor: TransactionMonitor,
    queueManager: TransactionQueueManager,
    gasOptimizer: GasOptimizer,
    analytics: TransactionAnalytics,
    alerting: TransactionAlerting,
    history: TransactionHistory,
    logger: Logger
  ) {
    super()
    this.config = config
    this.transactionMonitor = transactionMonitor
    this.queueManager = queueManager
    this.gasOptimizer = gasOptimizer
    this.analytics = analytics
    this.alerting = alerting
    this.history = history
    this.logger = logger
  }

  // Start dashboard
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Transaction dashboard already started')
      return
    }

    this.isRunning = true
    this.logger.info('Starting transaction dashboard...')

    // Start refresh timer
    this.startRefreshTimer()

    // Load initial data
    await this.loadDashboardData()

    this.logger.info('Transaction dashboard started')
    this.emit('dashboard:started')
  }

  // Stop dashboard
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping transaction dashboard...')

    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = undefined
    }

    // Clear cache
    this.cache.clear()

    this.logger.info('Transaction dashboard stopped')
    this.emit('dashboard:stopped')
  }

  // Get dashboard data
  async getDashboardData(filters?: any): Promise<DashboardData> {
    try {
      this.logger.debug('Generating dashboard data...')

      // Check cache first
      const cacheKey = this.generateCacheKey(filters)
      const cachedData = this.cache.get(cacheKey)
      if (cachedData && Date.now() - cachedData.timestamp < this.cacheTimeout) {
        return cachedData.data
      }

      // Generate fresh data
      const data = await this.generateDashboardData(filters)

      // Cache the data
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      this.logger.info('Dashboard data generated')
      this.emit('data:updated', { data })

      return data
    } catch (error) {
      this.logger.error('Failed to generate dashboard data:', error)
      throw error
    }
  }

  // Generate dashboard data
  private async generateDashboardData(filters?: any): Promise<DashboardData> {
    const timestamp = new Date()

    // Get summary data
    const summary = await this.getSummaryData(filters)

    // Get chart data
    const charts = await this.getChartData(filters)

    // Get table data
    const tables = await this.getTableData(filters)

    // Get metrics data
    const metrics = await this.getMetricsData(filters)

    // Get alerts data
    const alerts = await this.getAlertsData(filters)

    return {
      timestamp,
      summary,
      charts,
      tables,
      metrics,
      alerts
    }
  }

  // Get summary data
  private async getSummaryData(filters?: any): Promise<DashboardData['summary']> {
    const stats = await this.analytics.getAnalytics(filters)
    const queueStats = this.queueManager.getAllStatistics()
    const alertStats = this.alerting.getAlertStatistics()

    return {
      totalTransactions: stats.totalTransactions,
      pendingTransactions: stats.pendingTransactions,
      confirmedTransactions: stats.confirmedTransactions,
      failedTransactions: stats.failedTransactions,
      successRate: stats.successRate,
      averageGasPrice: stats.averageGasPrice,
      totalVolume: stats.totalVolume,
      averageConfirmationTime: stats.averageConfirmationTime,
      activeQueues: queueStats.totalQueues,
      activeAlerts: alertStats.unresolvedAlerts
    }
  }

  // Get chart data
  private async getChartData(filters?: any): Promise<DashboardData['charts']> {
    const timeRange = filters?.timeRange || '24h'

    return {
      transactionVolume: await this.getTransactionVolumeChart(timeRange),
      gasUsage: await this.getGasUsageChart(timeRange),
      successRate: await this.getSuccessRateChart(timeRange),
      responseTime: await this.getResponseTimeChart(timeRange),
      queueUtilization: await this.getQueueUtilizationChart(timeRange),
      alertTrends: await this.getAlertTrendsChart(timeRange)
    }
  }

  // Get table data
  private async getTableData(filters?: any): Promise<DashboardData['tables']> {
    return {
      recentTransactions: await this.getRecentTransactionsTable(filters),
      activeQueues: await this.getActiveQueuesTable(filters),
      unresolvedAlerts: await this.getUnresolvedAlertsTable(filters),
      topUsers: await this.getTopUsersTable(filters),
      gasOptimization: await this.getGasOptimizationTable(filters)
    }
  }

  // Get metrics data
  private async getMetricsData(filters?: any): Promise<DashboardData['metrics']> {
    return {
      performance: await this.getPerformanceMetrics(),
      network: await this.getNetworkMetrics(),
      system: await this.getSystemMetrics()
    }
  }

  // Get alerts data
  private async getAlertsData(filters?: any): Promise<AlertData[]> {
    const alerts = this.alerting.getUnresolvedAlerts(50)
    
    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      resolved: alert.resolved,
      actions: [
        {
          label: 'View Details',
          action: 'view',
          type: 'primary'
        },
        {
          label: 'Resolve',
          action: 'resolve',
          type: 'secondary'
        }
      ]
    }))
  }

  // Get transaction volume chart
  private async getTransactionVolumeChart(timeRange: string): Promise<ChartData> {
    // This would fetch actual transaction volume data
    const data = {
      type: 'line' as const,
      title: 'Transaction Volume',
      xAxis: {
        label: 'Time',
        type: 'time' as const,
        data: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
      },
      yAxis: {
        label: 'Transactions',
        type: 'value' as const
      },
      series: [
        {
          name: 'Transactions',
          data: [120, 150, 180, 140, 200],
          color: '#3b82f6'
        }
      ]
    }

    return data
  }

  // Get gas usage chart
  private async getGasUsageChart(timeRange: string): Promise<ChartData> {
    // This would fetch actual gas usage data
    const data = {
      type: 'area' as const,
      title: 'Gas Usage',
      xAxis: {
        label: 'Time',
        type: 'time' as const,
        data: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
      },
      yAxis: {
        label: 'Gas Used',
        type: 'value' as const
      },
      series: [
        {
          name: 'Gas Used',
          data: [21000, 25000, 30000, 22000, 28000],
          color: '#10b981'
        }
      ]
    }

    return data
  }

  // Get success rate chart
  private async getSuccessRateChart(timeRange: string): Promise<ChartData> {
    // This would fetch actual success rate data
    const data = {
      type: 'line' as const,
      title: 'Success Rate',
      xAxis: {
        label: 'Time',
        type: 'time' as const,
        data: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
      },
      yAxis: {
        label: 'Success Rate (%)',
        type: 'percentage' as const,
        min: 0,
        max: 100
      },
      series: [
        {
          name: 'Success Rate',
          data: [95, 92, 98, 94, 96],
          color: '#22c55e'
        }
      ]
    }

    return data
  }

  // Get response time chart
  private async getResponseTimeChart(timeRange: string): Promise<ChartData> {
    // This would fetch actual response time data
    const data = {
      type: 'line' as const,
      title: 'Response Time',
      xAxis: {
        label: 'Time',
        type: 'time' as const,
        data: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
      },
      yAxis: {
        label: 'Response Time (ms)',
        type: 'value' as const
      },
      series: [
        {
          name: 'Response Time',
          data: [150, 180, 120, 200, 160],
          color: '#f59e0b'
        }
      ]
    }

    return data
  }

  // Get queue utilization chart
  private async getQueueUtilizationChart(timeRange: string): Promise<ChartData> {
    // This would fetch actual queue utilization data
    const data = {
      type: 'bar' as const,
      title: 'Queue Utilization',
      xAxis: {
        label: 'Queue',
        type: 'category' as const,
        data: ['High Priority', 'Normal', 'Low Priority']
      },
      yAxis: {
        label: 'Utilization (%)',
        type: 'percentage' as const,
        min: 0,
        max: 100
      },
      series: [
        {
          name: 'Utilization',
          data: [75, 60, 45],
          color: '#8b5cf6'
        }
      ]
    }

    return data
  }

  // Get alert trends chart
  private async getAlertTrendsChart(timeRange: string): Promise<ChartData> {
    // This would fetch actual alert trends data
    const data = {
      type: 'line' as const,
      title: 'Alert Trends',
      xAxis: {
        label: 'Time',
        type: 'time' as const,
        data: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
      },
      yAxis: {
        label: 'Alerts',
        type: 'value' as const
      },
      series: [
        {
          name: 'Critical',
          data: [2, 1, 3, 1, 2],
          color: '#ef4444'
        },
        {
          name: 'High',
          data: [5, 4, 6, 3, 5],
          color: '#f97316'
        },
        {
          name: 'Medium',
          data: [8, 7, 9, 6, 8],
          color: '#eab308'
        }
      ]
    }

    return data
  }

  // Get recent transactions table
  private async getRecentTransactionsTable(filters?: any): Promise<TableData> {
    const transactions = await this.history.getTransactionHistory({
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...filters
    })

    return {
      title: 'Recent Transactions',
      columns: [
        {
          key: 'hash',
          label: 'Hash',
          type: 'link',
          sortable: true,
          filterable: true,
          format: (value: string) => value.substring(0, 10) + '...'
        },
        {
          key: 'from',
          label: 'From',
          type: 'text',
          sortable: true,
          filterable: true,
          format: (value: string) => value.substring(0, 8) + '...'
        },
        {
          key: 'to',
          label: 'To',
          type: 'text',
          sortable: true,
          filterable: true,
          format: (value: string) => value.substring(0, 8) + '...'
        },
        {
          key: 'value',
          label: 'Value',
          type: 'number',
          sortable: true,
          filterable: true,
          format: (value: string) => parseFloat(value).toFixed(4) + ' ETH'
        },
        {
          key: 'status',
          label: 'Status',
          type: 'status',
          sortable: true,
          filterable: true
        },
        {
          key: 'createdAt',
          label: 'Created',
          type: 'date',
          sortable: true,
          filterable: true
        }
      ],
      rows: transactions.entries.map(entry => ({
        hash: entry.transactionHash,
        from: entry.from,
        to: entry.to,
        value: entry.value,
        status: entry.status,
        createdAt: entry.createdAt
      })),
      pagination: {
        page: 1,
        pageSize: 50,
        total: transactions.total
      },
      sorting: {
        column: 'createdAt',
        direction: 'desc'
      },
      filters: {}
    }
  }

  // Get active queues table
  private async getActiveQueuesTable(filters?: any): Promise<TableData> {
    const queues = this.queueManager.getAllQueues()

    return {
      title: 'Active Queues',
      columns: [
        {
          key: 'id',
          label: 'Queue ID',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'status',
          label: 'Status',
          type: 'badge',
          sortable: true,
          filterable: true
        },
        {
          key: 'totalTransactions',
          label: 'Total Transactions',
          type: 'number',
          sortable: true,
          filterable: true
        },
        {
          key: 'pendingTransactions',
          label: 'Pending',
          type: 'number',
          sortable: true,
          filterable: true
        },
        {
          key: 'successRate',
          label: 'Success Rate',
          type: 'number',
          sortable: true,
          filterable: true,
          format: (value: number) => value.toFixed(1) + '%'
        }
      ],
      rows: queues.map(queue => ({
        id: queue.id,
        name: queue.name,
        status: queue.status,
        totalTransactions: queue.maxTransactions,
        pendingTransactions: 0, // This would be actual pending count
        successRate: 95.5 // This would be actual success rate
      })),
      pagination: {
        page: 1,
        pageSize: 20,
        total: queues.length
      },
      sorting: {
        column: 'name',
        direction: 'asc'
      },
      filters: {}
    }
  }

  // Get unresolved alerts table
  private async getUnresolvedAlertsTable(filters?: any): Promise<TableData> {
    const alerts = this.alerting.getUnresolvedAlerts(50)

    return {
      title: 'Unresolved Alerts',
      columns: [
        {
          key: 'id',
          label: 'ID',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'type',
          label: 'Type',
          type: 'badge',
          sortable: true,
          filterable: true
        },
        {
          key: 'severity',
          label: 'Severity',
          type: 'badge',
          sortable: true,
          filterable: true
        },
        {
          key: 'title',
          label: 'Title',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'timestamp',
          label: 'Created',
          type: 'date',
          sortable: true,
          filterable: true
        }
      ],
      rows: alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        timestamp: alert.timestamp
      })),
      pagination: {
        page: 1,
        pageSize: 20,
        total: alerts.length
      },
      sorting: {
        column: 'timestamp',
        direction: 'desc'
      },
      filters: {}
    }
  }

  // Get top users table
  private async getTopUsersTable(filters?: any): Promise<TableData> {
    // This would fetch actual top users data
    const topUsers = [
      { userId: 'user1', transactionCount: 150, totalVolume: '45.5 ETH', successRate: 98.5 },
      { userId: 'user2', transactionCount: 120, totalVolume: '32.1 ETH', successRate: 96.2 },
      { userId: 'user3', transactionCount: 95, totalVolume: '28.7 ETH', successRate: 94.8 }
    ]

    return {
      title: 'Top Users',
      columns: [
        {
          key: 'userId',
          label: 'User ID',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'transactionCount',
          label: 'Transactions',
          type: 'number',
          sortable: true,
          filterable: true
        },
        {
          key: 'totalVolume',
          label: 'Total Volume',
          type: 'number',
          sortable: true,
          filterable: true
        },
        {
          key: 'successRate',
          label: 'Success Rate',
          type: 'number',
          sortable: true,
          filterable: true,
          format: (value: number) => value.toFixed(1) + '%'
        }
      ],
      rows: topUsers,
      pagination: {
        page: 1,
        pageSize: 10,
        total: topUsers.length
      },
      sorting: {
        column: 'transactionCount',
        direction: 'desc'
      },
      filters: {}
    }
  }

  // Get gas optimization table
  private async getGasOptimizationTable(filters?: any): Promise<TableData> {
    // This would fetch actual gas optimization data
    const gasData = [
      { chainId: 1, currentGas: '25 gwei', recommendedGas: '20 gwei', savings: '20%', confidence: 85 },
      { chainId: 137, currentGas: '30 gwei', recommendedGas: '25 gwei', savings: '16.7%', confidence: 78 },
      { chainId: 56, currentGas: '15 gwei', recommendedGas: '12 gwei', savings: '20%', confidence: 92 }
    ]

    return {
      title: 'Gas Optimization',
      columns: [
        {
          key: 'chainId',
          label: 'Chain',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'currentGas',
          label: 'Current Gas',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'recommendedGas',
          label: 'Recommended Gas',
          type: 'text',
          sortable: true,
          filterable: true
        },
        {
          key: 'savings',
          label: 'Savings',
          type: 'number',
          sortable: true,
          filterable: true,
          format: (value: string) => value + '%'
        },
        {
          key: 'confidence',
          label: 'Confidence',
          type: 'number',
          sortable: true,
          filterable: true,
          format: (value: number) => value + '%'
        }
      ],
      rows: gasData,
      pagination: {
        page: 1,
        pageSize: 10,
        total: gasData.length
      },
      sorting: {
        column: 'savings',
        direction: 'desc'
      },
      filters: {}
    }
  }

  // Get performance metrics
  private async getPerformanceMetrics(): Promise<MetricData[]> {
    // This would fetch actual performance metrics
    return [
      {
        id: 'response_time',
        name: 'Response Time',
        value: 150,
        unit: 'ms',
        trend: 'down',
        trendValue: -5,
        status: 'good',
        threshold: { warning: 500, critical: 1000 },
        lastUpdated: new Date()
      },
      {
        id: 'throughput',
        name: 'Throughput',
        value: 1250,
        unit: 'tx/min',
        trend: 'up',
        trendValue: 10,
        status: 'good',
        threshold: { warning: 800, critical: 500 },
        lastUpdated: new Date()
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        value: 2.5,
        unit: '%',
        trend: 'stable',
        trendValue: 0,
        status: 'warning',
        threshold: { warning: 3, critical: 5 },
        lastUpdated: new Date()
      }
    ]
  }

  // Get network metrics
  private async getNetworkMetrics(): Promise<MetricData[]> {
    // This would fetch actual network metrics
    return [
      {
        id: 'gas_price',
        name: 'Gas Price',
        value: '25',
        unit: 'gwei',
        trend: 'up',
        trendValue: 5,
        status: 'good',
        threshold: { warning: 50, critical: 100 },
        lastUpdated: new Date()
      },
      {
        id: 'block_time',
        name: 'Block Time',
        value: 12.5,
        unit: 's',
        trend: 'stable',
        trendValue: 0,
        status: 'good',
        threshold: { warning: 15, critical: 20 },
        lastUpdated: new Date()
      },
      {
        id: 'network_utilization',
        name: 'Network Utilization',
        value: 65,
        unit: '%',
        trend: 'up',
        trendValue: 3,
        status: 'good',
        threshold: { warning: 80, critical: 95 },
        lastUpdated: new Date()
      }
    ]
  }

  // Get system metrics
  private async getSystemMetrics(): Promise<MetricData[]> {
    // This would fetch actual system metrics
    return [
      {
        id: 'cpu_usage',
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        trend: 'stable',
        trendValue: 0,
        status: 'good',
        threshold: { warning: 70, critical: 90 },
        lastUpdated: new Date()
      },
      {
        id: 'memory_usage',
        name: 'Memory Usage',
        value: 68,
        unit: '%',
        trend: 'up',
        trendValue: 2,
        status: 'warning',
        threshold: { warning: 75, critical: 90 },
        lastUpdated: new Date()
      },
      {
        id: 'disk_usage',
        name: 'Disk Usage',
        value: 42,
        unit: '%',
        trend: 'stable',
        trendValue: 0,
        status: 'good',
        threshold: { warning: 80, critical: 95 },
        lastUpdated: new Date()
      }
    ]
  }

  // Start refresh timer
  private startRefreshTimer(): void {
    if (this.config.autoRefresh) {
      this.refreshTimer = setInterval(async () => {
        try {
          await this.loadDashboardData()
        } catch (error) {
          this.logger.error('Failed to refresh dashboard data:', error)
        }
      }, this.config.refreshInterval)
    }
  }

  // Load dashboard data
  private async loadDashboardData(): Promise<void> {
    // This would load dashboard data from cache or database
    this.logger.debug('Loading dashboard data...')
  }

  // Generate cache key
  private generateCacheKey(filters?: any): string {
    return JSON.stringify(filters || {})
  }

  // Update configuration
  async updateConfig(updates: Partial<DashboardConfig>): Promise<void> {
    this.config = { ...this.config, ...updates }
    
    // Restart refresh timer if needed
    if (updates.refreshInterval || updates.autoRefresh) {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
      }
      this.startRefreshTimer()
    }

    this.logger.info('Dashboard configuration updated')
    this.emit('config:updated', { config: this.config })
  }

  // Get configuration
  getConfig(): DashboardConfig {
    return this.config
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
    this.logger.info('Dashboard cache cleared')
    this.emit('cache:cleared')
  }

  // Export dashboard data
  async exportData(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    const data = await this.getDashboardData()

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const csvRows = [
        'timestamp,totalTransactions,pendingTransactions,confirmedTransactions,failedTransactions,successRate,averageGasPrice,totalVolume,averageConfirmationTime'
      ]
      
      csvRows.push([
        data.timestamp.toISOString(),
        data.summary.totalTransactions,
        data.summary.pendingTransactions,
        data.summary.confirmedTransactions,
        data.summary.failedTransactions,
        data.summary.successRate,
        data.summary.averageGasPrice,
        data.summary.totalVolume,
        data.summary.averageConfirmationTime
      ].join(','))
      
      return csvRows.join('\n')
    } else if (format === 'pdf') {
      // This would generate PDF
      return 'PDF export not implemented'
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isRunning: boolean
    uptime: number
    cacheSize: number
    lastRefresh: Date
    config: DashboardConfig
    metrics: any
  } {
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      cacheSize: this.cache.size,
      lastRefresh: new Date(),
      config: this.config,
      metrics: {
        totalTransactions: this.transactionMonitor.getTransactionStatistics().totalTransactions,
        activeQueues: this.queueManager.getAllStatistics().totalQueues,
        unresolvedAlerts: this.alerting.getAlertStatistics().unresolvedAlerts
      }
    }
  }
}

export default TransactionDashboard
