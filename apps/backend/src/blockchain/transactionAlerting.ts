import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Transaction, TransactionStatus, TransactionPriority } from './transactionMonitor'
import { TransactionQueueManager } from './transactionQueue'

// Alert type enum
export enum AlertType {
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_STUCK = 'transaction_stuck',
  HIGH_GAS_PRICE = 'high_gas_price',
  QUEUE_FULL = 'queue_full',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  NETWORK_CONGESTION = 'network_congestion',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  CONTRACT_ERROR = 'contract_error',
  TIMEOUT = 'timeout',
  SECURITY_ALERT = 'security_alert',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  SYSTEM_ERROR = 'system_error'
}

// Alert severity enum
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Alert interface
export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  details: any
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  userId?: string
  transactionId?: string
  queueId?: string
  chainId?: number
  metadata: any
}

// Alert rule interface
export interface AlertRule {
  id: string
  name: string
  type: AlertType
  severity: AlertSeverity
  condition: string
  threshold: number
  timeWindow: number
  enabled: boolean
  recipients: string[]
  actions: string[]
  cooldown: number
  lastTriggered?: Date
  metadata: any
}

// Notification channel interface
export interface NotificationChannel {
  id: string
  name: string
  type: 'email' | 'webhook' | 'push' | 'sms' | 'slack' | 'discord'
  config: any
  enabled: boolean
  rateLimit: {
    maxPerHour: number
    maxPerDay: number
  }
  lastUsed?: Date
}

// Alerting service
export class TransactionAlerting extends EventEmitter {
  private alerts: Map<string, Alert> = new Map()
  private alertRules: Map<string, AlertRule> = new Map()
  private notificationChannels: Map<string, NotificationChannel> = new Map()
  private alertHistory: Alert[] = []
  private logger: Logger
  private isAlerting: boolean = false
  private alertingInterval: number = 30000 // 30 seconds
  private maxAlertHistory: number = 10000
  private defaultRules: AlertRule[]

  constructor(logger: Logger) {
    super()
    this.logger = logger
    this.initializeDefaultRules()
  }

  // Initialize default alert rules
  private initializeDefaultRules(): void {
    this.defaultRules = [
      {
        id: 'high_failure_rate',
        name: 'High Transaction Failure Rate',
        type: AlertType.TRANSACTION_FAILED,
        severity: AlertSeverity.HIGH,
        condition: 'failure_rate',
        threshold: 10, // 10% failure rate
        timeWindow: 300000, // 5 minutes
        enabled: true,
        recipients: ['admin'],
        actions: ['email', 'webhook'],
        cooldown: 600000 // 10 minutes
      },
      {
        id: 'stuck_transactions',
        name: 'Stuck Transactions',
        type: AlertType.TRANSACTION_STUCK,
        severity: AlertSeverity.MEDIUM,
        condition: 'stuck_time',
        threshold: 300000, // 5 minutes
        timeWindow: 60000, // 1 minute
        enabled: true,
        recipients: ['admin'],
        actions: ['email'],
        cooldown: 600000 // 10 minutes
      },
      {
        id: 'high_gas_price',
        name: 'High Gas Price',
        type: AlertType.HIGH_GAS_PRICE,
        severity: AlertSeverity.MEDIUM,
        condition: 'gas_price',
        threshold: 100000000000, // 100 gwei
        timeWindow: 60000, // 1 minute
        enabled: true,
        recipients: ['admin'],
        actions: ['push'],
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'queue_full',
        name: 'Queue Full',
        type: AlertType.QUEUE_FULL,
        severity: AlertSeverity.HIGH,
        condition: 'queue_utilization',
        threshold: 90, // 90% full
        timeWindow: 30000, // 30 seconds
        enabled: true,
        recipients: ['admin'],
        actions: ['email', 'webhook'],
        cooldown: 120000 // 2 minutes
      },
      {
        id: 'network_congestion',
        name: 'Network Congestion',
        type: AlertType.NETWORK_CONGESTION,
        severity: AlertSeverity.MEDIUM,
        condition: 'network_congestion',
        threshold: 80, // 80% utilization
        timeWindow: 60000, // 1 minute
        enabled: true,
        recipients: ['admin'],
        actions: ['push'],
        cooldown: 300000 // 5 minutes
      },
      {
        id: 'insufficient_balance',
        name: 'Insufficient Balance',
        type: AlertType.INSUFFICIENT_BALANCE,
        severity: AlertSeverity.HIGH,
        condition: 'insufficient_balance',
        threshold: 1, // Any occurrence
        timeWindow: 1000, // 1 second
        enabled: true,
        recipients: ['user'],
        actions: ['email', 'push'],
        cooldown: 60000 // 1 minute
      },
      {
        id: 'performance_degradation',
        name: 'Performance Degradation',
        type: AlertType.PERFORMANCE_DEGRADATION,
        severity: AlertSeverity.MEDIUM,
        condition: 'response_time',
        threshold: 5000, // 5 seconds
        timeWindow: 60000, // 1 minute
        enabled: true,
        recipients: ['admin'],
        actions: ['email', 'webhook'],
        cooldown: 300000 // 5 minutes
      }
    ]

    // Load default rules
    for (const rule of this.defaultRules) {
      this.alertRules.set(rule.id, rule)
    }
  }

  // Start alerting
  async start(): Promise<void> {
    if (this.isAlerting) {
      this.logger.warn('Transaction alerting already started')
      return
    }

    this.isAlerting = true
    this.logger.info('Starting transaction alerting...')

    // Start alerting intervals
    this.startAlertingIntervals()

    // Load existing alerts and rules
    await this.loadAlertingData()

    this.logger.info('Transaction alerting started')
    this.emit('alerting:started')
  }

  // Stop alerting
  async stop(): Promise<void> {
    if (!this.isAlerting) {
      return
    }

    this.isAlerting = false
    this.logger.info('Stopping transaction alerting...')

    // Save alerting data
    await this.saveAlertingData()

    this.logger.info('Transaction alerting stopped')
    this.emit('alerting:stopped')
  }

  // Create alert
  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const id = this.generateAlertId()
    const fullAlert: Alert = {
      ...alert,
      id,
      timestamp: new Date(),
      resolved: false
    }

    this.alerts.set(id, fullAlert)
    this.alertHistory.unshift(fullAlert)

    // Maintain history size
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(0, this.maxAlertHistory)
    }

    await this.saveAlert(fullAlert)
    await this.processAlert(fullAlert)

    this.logger.info(`Alert created: ${id} (${alert.type})`)
    this.emit('alert:created', { alert: fullAlert })

    return id
  }

  // Process alert
  private async processAlert(alert: Alert): Promise<void> {
    try {
      // Check if alert should be processed
      if (!this.shouldProcessAlert(alert)) {
        return
      }

      // Get notification channels for this alert type and severity
      const channels = this.getNotificationChannels(alert.type, alert.severity)

      // Send notifications
      for (const channel of channels) {
        await this.sendNotification(channel, alert)
      }

      // Trigger alert actions
      await this.triggerAlertActions(alert)

      // Update rule cooldown
      this.updateRuleCooldown(alert.type)

      this.logger.info(`Alert processed: ${alert.id}`)
      this.emit('alert:processed', { alert })

    } catch (error) {
      this.logger.error(`Failed to process alert ${alert.id}:`, error)
      this.emit('alert:error', { alert, error })
    }
  }

  // Check if alert should be processed
  private shouldProcessAlert(alert: Alert): boolean {
    // Check if alert is already resolved
    if (alert.resolved) {
      return false
    }

    // Check if there's a similar unresolved alert
    const similarAlerts = this.alertHistory.filter(a => 
      !a.resolved && 
      a.type === alert.type && 
      a.timestamp > new Date(Date.now() - 60000) // Within last minute
    )

    if (similarAlerts.length > 0) {
      return false
    }

    return true
  }

  // Get notification channels
  private getNotificationChannels(alertType: AlertType, severity: AlertSeverity): NotificationChannel[] {
    const channels: NotificationChannel[] = []

    for (const channel of this.notificationChannels.values()) {
      if (!channel.enabled) continue

      // Check if channel handles this alert type
      if (!this.channelHandlesAlertType(channel, alertType)) continue

      // Check if channel handles this severity
      if (!this.channelHandlesSeverity(channel, severity)) continue

      // Check rate limits
      if (!this.checkRateLimit(channel)) continue

      channels.push(channel)
    }

    return channels
  }

  // Check if channel handles alert type
  private channelHandlesAlertType(channel: NotificationChannel, alertType: AlertType): boolean {
    // This would check channel configuration
    // For now, return true for all channels
    return true
  }

  // Check if channel handles severity
  private channelHandlesSeverity(channel: NotificationChannel, severity: AlertSeverity): boolean {
    // This would check channel configuration
    // For now, return true for all channels
    return true
  }

  // Check rate limits
  private checkRateLimit(channel: NotificationChannel): boolean {
    if (!channel.lastUsed) return true

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Check hourly limit
    const hourlyCount = this.alertHistory.filter(alert => 
      alert.timestamp > oneHourAgo
    ).length

    if (hourlyCount >= channel.rateLimit.maxPerHour) {
      return false
    }

    // Check daily limit
    const dailyCount = this.alertHistory.filter(alert => 
      alert.timestamp > oneDayAgo
    ).length

    if (dailyCount >= channel.rateLimit.maxPerDay) {
      return false
    }

    return true
  }

  // Send notification
  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel, alert)
          break
        case 'webhook':
          await this.sendWebhookNotification(channel, alert)
          break
        case 'push':
          await this.sendPushNotification(channel, alert)
          break
        case 'sms':
          await this.sendSMSNotification(channel, alert)
          break
        case 'slack':
          await this.sendSlackNotification(channel, alert)
          break
        case 'discord':
          await this.sendDiscordNotification(channel, alert)
          break
        default:
          this.logger.warn(`Unknown notification channel type: ${channel.type}`)
      }

      // Update channel last used time
      channel.lastUsed = new Date()
      await this.saveNotificationChannel(channel)

      this.logger.debug(`Notification sent via ${channel.type}: ${alert.id}`)
      this.emit('notification:sent', { channel, alert })

    } catch (error) {
      this.logger.error(`Failed to send notification via ${channel.type}:`, error)
      this.emit('notification:error', { channel, alert, error })
    }
  }

  // Send email notification
  private async sendEmailNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // This would send email using your email service
    this.logger.info(`Email notification sent: ${alert.title}`)
  }

  // Send webhook notification
  private async sendWebhookNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // This would send webhook using your HTTP client
    this.logger.info(`Webhook notification sent: ${alert.title}`)
  }

  // Send push notification
  private async sendPushNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // This would send push notification using your push service
    this.logger.info(`Push notification sent: ${alert.title}`)
  }

  // Send SMS notification
  private async sendSMSNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // This would send SMS using your SMS service
    this.logger.info(`SMS notification sent: ${alert.title}`)
  }

  // Send Slack notification
  private async sendSlackNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // This would send Slack notification using your Slack integration
    this.logger.info(`Slack notification sent: ${alert.title}`)
  }

  // Send Discord notification
  private async sendDiscordNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    // This would send Discord notification using your Discord integration
    this.logger.info(`Discord notification sent: ${alert.title}`)
  }

  // Trigger alert actions
  private async triggerAlertActions(alert: Alert): Promise<void> {
    const rule = this.alertRules.get(alert.type)
    if (!rule || !rule.actions) return

    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, alert)
      } catch (error) {
        this.logger.error(`Failed to execute alert action ${action}:`, error)
      }
    }
  }

  // Execute alert action
  private async executeAlertAction(action: string, alert: Alert): Promise<void> {
    switch (action) {
      case 'pause_queue':
        await this.pauseAffectedQueues(alert)
        break
      case 'scale_up':
        await this.scaleUpResources(alert)
        break
      case 'restart_service':
        await this.restartService(alert)
        break
      case 'create_ticket':
        await this.createSupportTicket(alert)
        break
      case 'notify_admin':
        await this.notifyAdministrator(alert)
        break
      case 'auto_retry':
        await this.autoRetryTransactions(alert)
        break
      case 'emergency_shutdown':
        await this.emergencyShutdown(alert)
        break
      default:
        this.logger.warn(`Unknown alert action: ${action}`)
    }
  }

  // Pause affected queues
  private async pauseAffectedQueues(alert: Alert): Promise<void> {
    // This would pause affected transaction queues
    this.logger.info(`Affected queues paused for alert: ${alert.id}`)
  }

  // Scale up resources
  private async scaleUpResources(alert: Alert): Promise<void> {
    // This would scale up resources
    this.logger.info(`Resources scaled up for alert: ${alert.id}`)
  }

  // Restart service
  private async restartService(alert: Alert): Promise<void> {
    // This would restart the service
    this.logger.info(`Service restarted for alert: ${alert.id}`)
  }

  // Create support ticket
  private async createSupportTicket(alert: Alert): Promise<void> {
    // This would create a support ticket
    this.logger.info(`Support ticket created for alert: ${alert.id}`)
  }

  // Notify administrator
  private async notifyAdministrator(alert: Alert): Promise<void> {
    // This would notify the administrator
    this.logger.info(`Administrator notified for alert: ${alert.id}`)
  }

  // Auto retry transactions
  private async autoRetryTransactions(alert: Alert): Promise<void> {
    // This would auto-retry affected transactions
    this.logger.info(`Auto-retry triggered for alert: ${alert.id}`)
  }

  // Emergency shutdown
  private async emergencyShutdown(alert: Alert): Promise<void> {
    // This would perform emergency shutdown
    this.logger.info(`Emergency shutdown triggered for alert: ${alert.id}`)
  }

  // Update rule cooldown
  private updateRuleCooldown(alertType: AlertType): void {
    const rule = this.alertRules.get(alertType)
    if (rule) {
      rule.lastTriggered = new Date()
      this.alertRules.set(alertType, rule)
    }
  }

  // Resolve alert
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<void> {
    const alert = this.alerts.get(alertId)
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`)
    }

    alert.resolved = true
    alert.resolvedAt = new Date()
    alert.resolvedBy = resolvedBy

    this.alerts.set(alertId, alert)
    await this.saveAlert(alert)

    this.logger.info(`Alert resolved: ${alertId}`)
    this.emit('alert:resolved', { alert })
  }

  // Get alert by ID
  getAlert(alertId: string): Alert | null {
    return this.alerts.get(alertId) || null
  }

  // Get alerts by type
  getAlertsByType(alertType: AlertType, limit: number = 50): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.type === alertType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get alerts by severity
  getAlertsBySeverity(severity: AlertSeverity, limit: number = 50): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get unresolved alerts
  getUnresolvedAlerts(limit: number = 50): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Get alert history
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(0, limit)
  }

  // Add alert rule
  async addAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    const id = this.generateRuleId()
    const fullRule: AlertRule = {
      ...rule,
      id,
      enabled: rule.enabled !== false
    }

    this.alertRules.set(id, fullRule)
    await this.saveAlertRule(fullRule)

    this.logger.info(`Alert rule added: ${id} (${rule.name})`)
    this.emit('rule:added', { rule: fullRule })

    return id
  }

  // Update alert rule
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const rule = this.alertRules.get(ruleId)
    if (!rule) {
      throw new Error(`Alert rule not found: ${ruleId}`)
    }

    const updatedRule = { ...rule, ...updates }
    this.alertRules.set(ruleId, updatedRule)
    await this.saveAlertRule(updatedRule)

    this.logger.info(`Alert rule updated: ${ruleId}`)
    this.emit('rule:updated', { rule: updatedRule })
  }

  // Delete alert rule
  async deleteAlertRule(ruleId: string): Promise<void> {
    const rule = this.alertRules.get(ruleId)
    if (!rule) {
      throw new Error(`Alert rule not found: ${ruleId}`)
    }

    this.alertRules.delete(ruleId)
    await this.deleteAlertRuleData(ruleId)

    this.logger.info(`Alert rule deleted: ${ruleId}`)
    this.emit('rule:deleted', { rule })
  }

  // Add notification channel
  async addNotificationChannel(channel: Omit<NotificationChannel, 'id'>): Promise<string> {
    const id = this.generateChannelId()
    const fullChannel: NotificationChannel = {
      ...channel,
      id,
      enabled: channel.enabled !== false
    }

    this.notificationChannels.set(id, fullChannel)
    await this.saveNotificationChannel(fullChannel)

    this.logger.info(`Notification channel added: ${id} (${channel.name})`)
    this.emit('channel:added', { channel: fullChannel })

    return id
  }

  // Update notification channel
  async updateNotificationChannel(channelId: string, updates: Partial<NotificationChannel>): Promise<void> {
    const channel = this.notificationChannels.get(channelId)
    if (!channel) {
      throw new Error(`Notification channel not found: ${channelId}`)
    }

    const updatedChannel = { ...channel, ...updates }
    this.notificationChannels.set(channelId, updatedChannel)
    await this.saveNotificationChannel(updatedChannel)

    this.logger.info(`Notification channel updated: ${channelId}`)
    this.emit('channel:updated', { channel: updatedChannel })
  }

  // Delete notification channel
  async deleteNotificationChannel(channelId: string): Promise<void> {
    const channel = this.notificationChannels.get(channelId)
    if (!channel) {
      throw new Error(`Notification channel not found: ${channelId}`)
    }

    this.notificationChannels.delete(channelId)
    await this.deleteNotificationChannelData(channelId)

    this.logger.info(`Notification channel deleted: ${channelId}`)
    this.emit('channel:deleted', { channel })
  }

  // Start alerting intervals
  private startAlertingIntervals(): void {
    // Check alert rules every 30 seconds
    setInterval(() => {
      this.checkAlertRules()
    }, this.alertingInterval)

    // Clean old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts()
    }, 3600000) // Every hour

    // Update statistics every minute
    setInterval(() => {
      this.updateAlertStatistics()
    }, 60000) // Every minute
  }

  // Check alert rules
  private async checkAlertRules(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue

      try {
        await this.evaluateAlertRule(rule)
      } catch (error) {
        this.logger.error(`Error evaluating alert rule ${ruleId}:`, error)
      }
    }
  }

  // Evaluate alert rule
  private async evaluateAlertRule(rule: AlertRule): Promise<void> {
    // Check cooldown
    if (rule.lastTriggered) {
      const timeSinceLastTriggered = Date.now() - rule.lastTriggered.getTime()
      if (timeSinceLastTriggered < rule.cooldown) {
        return
      }
    }

    // Evaluate condition
    const shouldTrigger = await this.evaluateCondition(rule)

    if (shouldTrigger) {
      await this.createAlert({
        type: rule.type,
        severity: rule.severity,
        title: rule.name,
        message: `Alert triggered: ${rule.name}`,
        details: {
          ruleId: rule.id,
          condition: rule.condition,
          threshold: rule.threshold,
          timeWindow: rule.timeWindow
        }
      })

      rule.lastTriggered = new Date()
      this.alertRules.set(rule.id, rule)
    }
  }

  // Evaluate condition
  private async evaluateCondition(rule: AlertRule): Promise<boolean> {
    switch (rule.condition) {
      case 'failure_rate':
        return this.evaluateFailureRate(rule)
      case 'stuck_time':
        return this.evaluateStuckTime(rule)
      case 'gas_price':
        return this.evaluateGasPrice(rule)
      case 'queue_utilization':
        return this.evaluateQueueUtilization(rule)
      case 'network_congestion':
        return this.evaluateNetworkCongestion(rule)
      case 'insufficient_balance':
        return this.evaluateInsufficientBalance(rule)
      case 'response_time':
        return this.evaluateResponseTime(rule)
      default:
        return false
    }
  }

  // Evaluate failure rate condition
  private async evaluateFailureRate(rule: AlertRule): Promise<boolean> {
    // This would calculate actual failure rate
    // For now, return false
    return false
  }

  // Evaluate stuck time condition
  private async evaluateStuckTime(rule: AlertRule): Promise<boolean> {
    // This would check for stuck transactions
    // For now, return false
    return false
  }

  // Evaluate gas price condition
  private async evaluateGasPrice(rule: AlertRule): Promise<boolean> {
    // This would check current gas prices
    // For now, return false
    return false
  }

  // Evaluate queue utilization condition
  private async evaluateQueueUtilization(rule: AlertRule): Promise<boolean> {
    // This would check queue utilization
    // For now, return false
    return false
  }

  // Evaluate network congestion condition
  private async evaluateNetworkCongestion(rule: AlertRule): Promise<boolean> {
    // This would check network congestion
    // For now, return false
    return false
  }

  // Evaluate insufficient balance condition
  private async evaluateInsufficientBalance(rule: AlertRule): Promise<boolean> {
    // This would check for insufficient balance
    // For now, return false
    return false
  }

  // Evaluate response time condition
  private async evaluateResponseTime(rule: AlertRule): Promise<boolean> {
    // This would check response times
    // For now, return false
    return false
  }

  // Clean old alerts
  private async cleanupOldAlerts(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    let cleanedCount = 0

    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoff && alert.resolved) {
        this.alerts.delete(alertId)
        cleanedCount++
      }
    }

    // Also clean history
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp >= cutoff)

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} old alerts`)
    }
  }

  // Update alert statistics
  private async updateAlertStatistics(): Promise<void> {
    // This would update alert statistics
    this.logger.debug('Alert statistics updated')
  }

  // Save alert
  private async saveAlert(alert: Alert): Promise<void> {
    // This would save to your database
    this.logger.debug(`Alert saved: ${alert.id}`)
  }

  // Save alert rule
  private async saveAlertRule(rule: AlertRule): Promise<void> {
    // This would save to your database
    this.logger.debug(`Alert rule saved: ${rule.id}`)
  }

  // Delete alert rule data
  private async deleteAlertRuleData(ruleId: string): Promise<void> {
    // This would delete from your database
    this.logger.debug(`Alert rule deleted: ${ruleId}`)
  }

  // Save notification channel
  private async saveNotificationChannel(channel: NotificationChannel): Promise<void> {
    // This would save to your database
    this.logger.debug(`Notification channel saved: ${channel.id}`)
  }

  // Delete notification channel data
  private async deleteNotificationChannelData(channelId: string): Promise<void> {
    // This would delete from your database
    this.logger.debug(`Notification channel deleted: ${channelId}`)
  }

  // Load alerting data
  private async loadAlertingData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading alerting data...')
  }

  // Save alerting data
  private async saveAlertingData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving alerting data...')
  }

  // Generate alert ID
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate rule ID
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate channel ID
  private generateChannelId(): string {
    return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get alert statistics
  getAlertStatistics(): {
    totalAlerts: number
    unresolvedAlerts: number
    alertsByType: Record<string, number>
    alertsBySeverity: Record<string, number>
    averageResolutionTime: number
    mostCommonAlertType: string
    alertRate: number
  } {
    const alerts = Array.from(this.alerts.values())
    const unresolved = alerts.filter(alert => !alert.resolved)

    const alertsByType: Record<string, number> = {}
    const alertsBySeverity: Record<string, number> = {}

    for (const alert of alerts) {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1
    }

    const resolvedAlerts = alerts.filter(alert => alert.resolved && alert.resolvedAt)
    const averageResolutionTime = resolvedAlerts.length > 0
      ? resolvedAlerts.reduce((sum, alert) => sum + (alert.resolvedAt!.getTime() - alert.timestamp.getTime()), 0) / resolvedAlerts.length
      : 0

    const mostCommonAlertType = Object.keys(alertsByType).reduce((a, b) => 
      alertsByType[a] > alertsByType[b] ? a : b
    , Object.keys(alertsByType)[0] || '')

    const alertRate = alerts.length > 0 ? unresolved.length / alerts.length : 0

    return {
      totalAlerts: alerts.length,
      unresolvedAlerts: unresolved.length,
      alertsByType,
      alertsBySeverity,
      averageResolutionTime,
      mostCommonAlertType,
      alertRate
    }
  }

  // Export alerting data
  exportAlertingData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      alerts: Array.from(this.alerts.values()),
      alertRules: Array.from(this.alertRules.values()),
      notificationChannels: Array.from(this.notificationChannels.values()),
      alertHistory: this.alertHistory,
      statistics: this.getAlertStatistics()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'type', 'severity', 'title', 'message', 'timestamp', 'resolved', 'resolvedAt', 'resolvedBy']
      const csvRows = [headers.join(',')]
      
      for (const alert of this.alertHistory) {
        csvRows.push([
          alert.id,
          alert.type,
          alert.severity,
          alert.title,
          alert.message,
          alert.timestamp.toISOString(),
          alert.resolved.toString(),
          alert.resolvedAt?.toISOString() || '',
          alert.resolvedBy || ''
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isAlerting: boolean
    totalAlerts: number
    unresolvedAlerts: number
    activeRules: number
    activeChannels: number
    lastAlert: Date
    metrics: any
  } {
    return {
      isAlerting: this.isAlerting,
      totalAlerts: this.alerts.size,
      unresolvedAlerts: Array.from(this.alerts.values()).filter(alert => !alert.resolved).length,
      activeRules: Array.from(this.alertRules.values()).filter(rule => rule.enabled).length,
      activeChannels: Array.from(this.notificationChannels.values()).filter(channel => channel.enabled).length,
      lastAlert: this.alertHistory.length > 0 ? this.alertHistory[0].timestamp : new Date(),
      metrics: this.getAlertStatistics()
    }
  }
}

export default TransactionAlerting
