import { EventEmitter } from 'events';

export enum AlertType {
  COMPLIANCE_VIOLATION = 'compliance_violation',
  RISK_THRESHOLD = 'risk_threshold',
  DEADLINE_APPROACHING = 'deadline_approaching',
  REGULATORY_CHANGE = 'regulatory_change',
  SECURITY_INCIDENT = 'security_incident',
  AUDIT_FAILURE = 'audit_failure',
  DOCUMENT_EXPIRY = 'document_expiry',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SYSTEM_ANOMALY = 'system_anomaly',
  POLICY_BREACH = 'policy_breach'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  FALSE_POSITIVE = 'false_positive'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app',
  PUSH = 'push',
  MICROSOFT_TEAMS = 'microsoft_teams',
  DISCORD = 'discord'
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  source: string;
  category: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  metadata: Record<string, any>;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  escalatedAt?: Date;
  escalatedTo?: string;
  dueDate?: Date;
  tags: string[];
  relatedAlerts: string[];
  notifications: AlertNotification[];
  actions: AlertAction[];
  priority: number;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  maxOccurrences?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface AlertNotification {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
  template: string;
  variables: Record<string, any>;
}

export interface AlertAction {
  id: string;
  type: 'acknowledge' | 'resolve' | 'escalate' | 'assign' | 'comment' | 'custom';
  description: string;
  performedBy: string;
  performedAt: Date;
  metadata: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  isActive: boolean;
  conditions: AlertCondition[];
  actions: RuleAction[];
  notificationSettings: NotificationSettings;
  escalationSettings: EscalationSettings;
  priority: number;
  cooldownPeriod: number; // minutes
  maxOccurrences?: number;
  timeWindow?: number; // minutes
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
  caseSensitive?: boolean;
}

export interface RuleAction {
  type: 'create_alert' | 'send_notification' | 'trigger_webhook' | 'execute_script' | 'create_ticket';
  config: Record<string, any>;
  order: number;
}

export interface NotificationSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  recipients: string[];
  templates: Record<NotificationChannel, string>;
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    timezone: string;
  };
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

export interface EscalationSettings {
  enabled: boolean;
  levels: EscalationLevel[];
  autoEscalate: boolean;
  escalateAfter: number; // minutes
}

export interface EscalationLevel {
  level: number;
  severity: AlertSeverity;
  recipients: string[];
  delay: number; // minutes
  actions: string[];
}

export interface AlertTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject: string;
  body: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface AlertMetrics {
  totalAlerts: number;
  alertsByType: Record<AlertType, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByStatus: Record<AlertStatus, number>;
  averageResolutionTime: number;
  criticalAlerts: number;
  overdueAlerts: number;
  notificationsSent: number;
  notificationsFailed: number;
  topAlertSources: Array<{
    source: string;
    count: number;
  }>;
  resolutionTrend: Array<{
    date: string;
    alerts: number;
    resolved: number;
    averageTime: number;
  }>;
  escalationRate: number;
}

export interface AlertConfig {
  enableRealTimeProcessing: boolean;
  defaultRetentionDays: number;
  maxNotificationsPerAlert: number;
  notificationRetryAttempts: number;
  notificationRetryDelay: number;
  enableEscalation: boolean;
  defaultEscalationDelay: number;
  enableQuietHours: boolean;
  quietHoursTimezone: string;
  enableRateLimiting: boolean;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  enableDeduplication: boolean;
  deduplicationWindow: number; // minutes
  enableAutoResolution: boolean;
  autoResolutionConditions: AlertCondition[];
}

export class ComplianceAlertsService extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private templates: Map<string, AlertTemplate> = new Map();
  private config: AlertConfig;
  private metrics: AlertMetrics;
  private notificationQueue: Array<{ alertId: string; notificationId: string }> = [];
  private isProcessingNotifications = false;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultTemplates();
    this.initializeDefaultRules();
    this.startNotificationProcessor();
    this.startMetricsUpdater();
  }

  private initializeDefaultConfig(): AlertConfig {
    return {
      enableRealTimeProcessing: true,
      defaultRetentionDays: 365,
      maxNotificationsPerAlert: 10,
      notificationRetryAttempts: 3,
      notificationRetryDelay: 60000, // 1 minute
      enableEscalation: true,
      defaultEscalationDelay: 30, // minutes
      enableQuietHours: true,
      quietHoursTimezone: 'UTC',
      enableRateLimiting: true,
      rateLimitPerHour: 100,
      rateLimitPerDay: 1000,
      enableDeduplication: true,
      deduplicationWindow: 15, // minutes
      enableAutoResolution: false,
      autoResolutionConditions: []
    };
  }

  private initializeMetrics(): AlertMetrics {
    return {
      totalAlerts: 0,
      alertsByType: {
        compliance_violation: 0,
        risk_threshold: 0,
        deadline_approaching: 0,
        regulatory_change: 0,
        security_incident: 0,
        audit_failure: 0,
        document_expiry: 0,
        unauthorized_access: 0,
        system_anomaly: 0,
        policy_breach: 0
      },
      alertsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      alertsByStatus: {
        open: 0,
        acknowledged: 0,
        in_progress: 0,
        resolved: 0,
        escalated: false_positive
      },
      averageResolutionTime: 0,
      criticalAlerts: 0,
      overdueAlerts: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      topAlertSources: [],
      resolutionTrend: [],
      escalationRate: 0
    };
  }

  private initializeDefaultTemplates(): void {
    const templates: AlertTemplate[] = [
      {
        id: 'template_email_critical',
        name: 'Critical Alert Email',
        channel: NotificationChannel.EMAIL,
        subject: '🚨 Critical Compliance Alert: {{alert.title}}',
        body: `
          <h2>Critical Compliance Alert</h2>
          <p><strong>Title:</strong> {{alert.title}}</p>
          <p><strong>Description:</strong> {{alert.description}}</p>
          <p><strong>Severity:</strong> {{alert.severity}}</p>
          <p><strong>Source:</strong> {{alert.source}}</p>
          <p><strong>Triggered:</strong> {{alert.triggeredAt}}</p>
          <p><strong>Entity:</strong> {{alert.entityType}} - {{alert.entityId}}</p>
          <hr>
          <p>Please take immediate action to address this critical compliance issue.</p>
        `,
        variables: [
          { name: 'alert.title', type: 'string', description: 'Alert title', required: true },
          { name: 'alert.description', type: 'string', description: 'Alert description', required: true },
          { name: 'alert.severity', type: 'string', description: 'Alert severity', required: true },
          { name: 'alert.source', type: 'string', description: 'Alert source', required: true },
          { name: 'alert.triggeredAt', type: 'date', description: 'Alert triggered time', required: true },
          { name: 'alert.entityType', type: 'string', description: 'Entity type', required: false },
          { name: 'alert.entityId', type: 'string', description: 'Entity ID', required: false }
        ],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'template_slack_standard',
        name: 'Standard Alert Slack',
        channel: NotificationChannel.SLACK,
        subject: '',
        body: `
          📋 *Compliance Alert*
          *Title:* {{alert.title}}
          *Severity:* {{alert.severity}}
          *Source:* {{alert.source}}
          *Description:* {{alert.description}}
          *Triggered:* {{alert.triggeredAt}}
        `,
        variables: [
          { name: 'alert.title', type: 'string', description: 'Alert title', required: true },
          { name: 'alert.severity', type: 'string', description: 'Alert severity', required: true },
          { name: 'alert.source', type: 'string', description: 'Alert source', required: true },
          { name: 'alert.description', type: 'string', description: 'Alert description', required: true },
          { name: 'alert.triggeredAt', type: 'date', description: 'Alert triggered time', required: true }
        ],
        isActive: true,
        createdBy: 'system',
        createdAt: new Date()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeDefaultRules(): void {
    const rules: AlertRule[] = [
      {
        id: 'rule_critical_compliance',
        name: 'Critical Compliance Violation',
        description: 'Alert on critical compliance violations',
        type: AlertType.COMPLIANCE_VIOLATION,
        severity: AlertSeverity.CRITICAL,
        isActive: true,
        conditions: [
          {
            field: 'severity',
            operator: 'equals',
            value: 'critical'
          },
          {
            field: 'status',
            operator: 'equals',
            value: 'non_compliant'
          }
        ],
        actions: [
          {
            type: 'create_alert',
            config: { priority: 1 },
            order: 1
          },
          {
            type: 'send_notification',
            config: { channels: ['email', 'slack'] },
            order: 2
          }
        ],
        notificationSettings: {
          enabled: true,
          channels: [NotificationChannel.EMAIL, NotificationChannel.SLACK],
          recipients: ['compliance@company.com', 'security@company.com'],
          templates: {
            email: 'template_email_critical',
            sms: '',
            slack: 'template_slack_standard',
            webhook: '',
            in_app: '',
            push: '',
            microsoft_teams: '',
            discord: ''
          }
        },
        escalationSettings: {
          enabled: true,
          levels: [
            {
              level: 1,
              severity: AlertSeverity.HIGH,
              recipients: ['manager@company.com'],
              delay: 15,
              actions: ['notify']
            },
            {
              level: 2,
              severity: AlertSeverity.CRITICAL,
              recipients: ['cto@company.com', 'cso@company.com'],
              delay: 30,
              actions: ['notify', 'create_ticket']
            }
          ],
          autoEscalate: true,
          escalateAfter: 30
        },
        priority: 1,
        cooldownPeriod: 5,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'rule_deadline_approaching',
        name: 'Compliance Deadline Approaching',
        description: 'Alert when compliance deadlines are approaching',
        type: AlertType.DEADLINE_APPROACHING,
        severity: AlertSeverity.MEDIUM,
        isActive: true,
        conditions: [
          {
            field: 'daysUntilDeadline',
            operator: 'less_than',
            value: 7
          },
          {
            field: 'status',
            operator: 'not_equals',
            value: 'completed'
          }
        ],
        actions: [
          {
            type: 'create_alert',
            config: { priority: 2 },
            order: 1
          },
          {
            type: 'send_notification',
            config: { channels: ['email'] },
            order: 2
          }
        ],
        notificationSettings: {
          enabled: true,
          channels: [NotificationChannel.EMAIL],
          recipients: ['compliance@company.com'],
          templates: {
            email: 'template_email_critical',
            sms: '',
            slack: '',
            webhook: '',
            in_app: '',
            push: '',
            microsoft_teams: '',
            discord: ''
          }
        },
        escalationSettings: {
          enabled: false,
          levels: [],
          autoEscalate: false,
          escalateAfter: 0
        },
        priority: 2,
        cooldownPeriod: 60,
        createdBy: 'system',
        createdAt: new Date()
      }
    ];

    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  async createAlert(data: {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    source: string;
    category: string;
    entityId?: string;
    entityType?: string;
    userId?: string;
    metadata?: Record<string, any>;
    dueDate?: Date;
    tags?: string[];
    relatedAlerts?: string[];
    priority?: number;
    isRecurring?: boolean;
    recurrencePattern?: RecurrencePattern;
  }): Promise<Alert> {
    // Check for deduplication
    if (this.config.enableDeduplication) {
      const duplicate = this.findDuplicateAlert(data);
      if (duplicate) {
        return duplicate;
      }
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      severity: data.severity,
      status: AlertStatus.OPEN,
      title: data.title,
      description: data.description,
      source: data.source,
      category: data.category,
      entityId: data.entityId,
      entityType: data.entityType,
      userId: data.userId,
      metadata: data.metadata || {},
      triggeredAt: new Date(),
      dueDate: data.dueDate,
      tags: data.tags || [],
      relatedAlerts: data.relatedAlerts || [],
      notifications: [],
      actions: [],
      priority: data.priority || 1,
      isRecurring: data.isRecurring || false,
      recurrencePattern: data.recurrencePattern
    };

    this.alerts.set(alert.id, alert);
    this.updateMetrics();

    // Process notifications
    await this.processAlertNotifications(alert);

    this.emit('alertCreated', alert);
    return alert;
  }

  private findDuplicateAlert(data: any): Alert | null {
    const windowStart = new Date(Date.now() - this.config.deduplicationWindow * 60 * 1000);
    
    for (const alert of this.alerts.values()) {
      if (
        alert.triggeredAt >= windowStart &&
        alert.type === data.type &&
        alert.source === data.source &&
        alert.entityId === data.entityId &&
        alert.status === AlertStatus.OPEN
      ) {
        return alert;
      }
    }
    
    return null;
  }

  private async processAlertNotifications(alert: Alert): Promise<void> {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => 
        rule.isActive &&
        rule.type === alert.type &&
        this.evaluateRuleConditions(rule.conditions, alert)
      )
      .sort((a, b) => a.priority - b.priority);

    if (applicableRules.length === 0) return;

    const rule = applicableRules[0];
    
    // Check cooldown period
    if (this.isInCooldownPeriod(alert, rule)) {
      return;
    }

    // Create notifications
    for (const channel of rule.notificationSettings.channels) {
      const templateId = rule.notificationSettings.templates[channel];
      const template = this.templates.get(templateId);
      
      if (!template) continue;

      for (const recipient of rule.notificationSettings.recipients) {
        const notification: AlertNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          channel,
          recipient,
          status: 'pending',
          retryCount: 0,
          template: templateId,
          variables: {
            alert: {
              title: alert.title,
              description: alert.description,
              severity: alert.severity,
              source: alert.source,
              triggeredAt: alert.triggeredAt,
              entityType: alert.entityType,
              entityId: alert.entityId
            }
          }
        };

        alert.notifications.push(notification);
        this.notificationQueue.push({ alertId: alert.id, notificationId: notification.id });
      }
    }

    // Schedule escalation if enabled
    if (rule.escalationSettings.enabled && rule.escalationSettings.autoEscalate) {
      this.scheduleEscalation(alert, rule);
    }
  }

  private evaluateRuleConditions(conditions: AlertCondition[], alert: Alert): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let currentLogicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, alert);
      
      if (currentLogicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private evaluateCondition(condition: AlertCondition, alert: Alert): boolean {
    const fieldValue = this.getFieldValue(condition.field, alert);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'between':
        return Array.isArray(conditionValue) && 
               Number(fieldValue) >= Number(conditionValue[0]) && 
               Number(fieldValue) <= Number(conditionValue[1]);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(field: string, alert: Alert): any {
    const parts = field.split('.');
    let value: any = alert;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private isInCooldownPeriod(alert: Alert, rule: AlertRule): boolean {
    const cooldownEnd = new Date(alert.triggeredAt.getTime() + rule.cooldownPeriod * 60 * 1000);
    return new Date() < cooldownEnd;
  }

  private scheduleEscalation(alert: Alert, rule: AlertRule): void {
    setTimeout(async () => {
      if (alert.status !== AlertStatus.OPEN && alert.status !== AlertStatus.ACKNOWLEDGED) {
        return;
      }

      await this.escalateAlert(alert.id, rule.escalationSettings.levels[0].recipients);
    }, rule.escalationSettings.escalateAfter * 60 * 1000);
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    const action: AlertAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'acknowledge',
      description: `Alert acknowledged by ${acknowledgedBy}`,
      performedBy: acknowledgedBy,
      performedAt: new Date(),
      metadata: {}
    };

    alert.actions.push(action);
    this.updateMetrics();
    this.emit('alertAcknowledged', alert);

    return alert;
  }

  async resolveAlert(alertId: string, resolvedBy: string, resolution?: string): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    const action: AlertAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'resolve',
      description: `Alert resolved by ${resolvedBy}${resolution ? `: ${resolution}` : ''}`,
      performedBy: resolvedBy,
      performedAt: new Date(),
      metadata: { resolution }
    };

    alert.actions.push(action);
    this.updateMetrics();
    this.emit('alertResolved', alert);

    // Handle recurring alerts
    if (alert.isRecurring && alert.recurrencePattern) {
      await this.createRecurringAlert(alert);
    }

    return alert;
  }

  private async createRecurringAlert(originalAlert: Alert): Promise<void> {
    const nextDate = this.calculateNextRecurrenceDate(originalAlert.recurrencePattern!);
    
    if (nextDate && (!originalAlert.recurrencePattern?.endDate || nextDate <= originalAlert.recurrencePattern.endDate)) {
      setTimeout(async () => {
        await this.createAlert({
          type: originalAlert.type,
          severity: originalAlert.severity,
          title: originalAlert.title,
          description: originalAlert.description,
          source: originalAlert.source,
          category: originalAlert.category,
          entityId: originalAlert.entityId,
          entityType: originalAlert.entityType,
          userId: originalAlert.userId,
          metadata: originalAlert.metadata,
          dueDate: originalAlert.dueDate,
          tags: originalAlert.tags,
          relatedAlerts: [...originalAlert.relatedAlerts, originalAlert.id],
          priority: originalAlert.priority,
          isRecurring: true,
          recurrencePattern: originalAlert.recurrencePattern
        });
      }, nextDate.getTime() - Date.now());
    }
  }

  private calculateNextRecurrenceDate(pattern: RecurrencePattern): Date | null {
    const now = new Date();
    let nextDate = new Date(now);

    switch (pattern.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (pattern.interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        if (pattern.dayOfMonth) {
          nextDate.setDate(pattern.dayOfMonth);
        }
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
        break;
    }

    return nextDate > now ? nextDate : null;
  }

  async escalateAlert(alertId: string, escalatedTo: string[]): Promise<Alert | null> {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = AlertStatus.ESCALATED;
    alert.escalatedAt = new Date();
    alert.escalatedTo = escalatedTo.join(', ');

    const action: AlertAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'escalate',
      description: `Alert escalated to ${escalatedTo.join(', ')}`,
      performedBy: 'system',
      performedAt: new Date(),
      metadata: { escalatedTo }
    };

    alert.actions.push(action);
    this.updateMetrics();
    this.emit('alertEscalated', alert);

    // Send escalation notifications
    for (const recipient of escalatedTo) {
      const notification: AlertNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channel: NotificationChannel.EMAIL,
        recipient,
        status: 'pending',
        retryCount: 0,
        template: 'template_email_critical',
        variables: {
          alert: {
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            source: alert.source,
            triggeredAt: alert.triggeredAt
          }
        }
      };

      alert.notifications.push(notification);
      this.notificationQueue.push({ alertId: alert.id, notificationId: notification.id });
    }

    return alert;
  }

  private startNotificationProcessor(): void {
    setInterval(() => {
      this.processNotificationQueue();
    }, 5000);
  }

  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessingNotifications || this.notificationQueue.length === 0) return;

    this.isProcessingNotifications = true;

    try {
      const batch = this.notificationQueue.splice(0, 10);
      const promises = batch.map(item => this.processNotification(item.alertId, item.notificationId));

      await Promise.allSettled(promises);
    } finally {
      this.isProcessingNotifications = false;
    }
  }

  private async processNotification(alertId: string, notificationId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    const notification = alert.notifications.find(n => n.id === notificationId);
    if (!notification) return;

    try {
      const template = this.templates.get(notification.template);
      if (!template) {
        throw new Error(`Template ${notification.template} not found`);
      }

      // Simulate notification sending
      await this.sendNotification(notification, template);

      notification.status = 'sent';
      notification.sentAt = new Date();
      this.metrics.notificationsSent++;

    } catch (error) {
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : String(error);
      notification.retryCount++;
      this.metrics.notificationsFailed++;

      // Retry logic
      if (notification.retryCount < this.config.notificationRetryAttempts) {
        setTimeout(() => {
          this.notificationQueue.push({ alertId, notificationId });
        }, this.config.notificationRetryDelay);
      }
    }
  }

  private async sendNotification(notification: AlertNotification, template: AlertTemplate): Promise<void> {
    // Simulate notification sending based on channel
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case NotificationChannel.SMS:
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      case NotificationChannel.SLACK:
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      case NotificationChannel.WEBHOOK:
        await new Promise(resolve => setTimeout(resolve, 1500));
        break;
      default:
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private startMetricsUpdater(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  private updateMetrics(): void {
    const alerts = Array.from(this.alerts.values());

    this.metrics.totalAlerts = alerts.length;

    this.metrics.alertsByType = {
      compliance_violation: alerts.filter(a => a.type === AlertType.COMPLIANCE_VIOLATION).length,
      risk_threshold: alerts.filter(a => a.type === AlertType.RISK_THRESHOLD).length,
      deadline_approaching: alerts.filter(a => a.type === AlertType.DEADLINE_APPROACHING).length,
      regulatory_change: alerts.filter(a => a.type === AlertType.REGULATORY_CHANGE).length,
      security_incident: alerts.filter(a => a.type === AlertType.SECURITY_INCIDENT).length,
      audit_failure: alerts.filter(a => a.type === AlertType.AUDIT_FAILURE).length,
      document_expiry: alerts.filter(a => a.type === AlertType.DOCUMENT_EXPIRY).length,
      unauthorized_access: alerts.filter(a => a.type === AlertType.UNAUTHORIZED_ACCESS).length,
      system_anomaly: alerts.filter(a => a.type === AlertType.SYSTEM_ANOMALY).length,
      policy_breach: alerts.filter(a => a.type === AlertType.POLICY_BREACH).length
    };

    this.metrics.alertsBySeverity = {
      low: alerts.filter(a => a.severity === AlertSeverity.LOW).length,
      medium: alerts.filter(a => a.severity === AlertSeverity.MEDIUM).length,
      high: alerts.filter(a => a.severity === AlertSeverity.HIGH).length,
      critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length
    };

    this.metrics.alertsByStatus = {
      open: alerts.filter(a => a.status === AlertStatus.OPEN).length,
      acknowledged: alerts.filter(a => a.status === AlertStatus.ACKNOWLEDGED).length,
      in_progress: alerts.filter(a => a.status === AlertStatus.IN_PROGRESS).length,
      resolved: alerts.filter(a => a.status === AlertStatus.RESOLVED).length,
      escalated: alerts.filter(a => a.status === AlertStatus.ESCALATED).length
    };

    this.metrics.criticalAlerts = alerts.filter(a => a.severity === AlertSeverity.CRITICAL && a.status !== AlertStatus.RESOLVED).length;
    this.metrics.overdueAlerts = alerts.filter(a => a.dueDate && a.dueDate < new Date() && a.status !== AlertStatus.RESOLVED).length;

    // Calculate average resolution time
    const resolvedAlerts = alerts.filter(a => a.status === AlertStatus.RESOLVED && a.resolvedAt);
    if (resolvedAlerts.length > 0) {
      const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
        return sum + (alert.resolvedAt!.getTime() - alert.triggeredAt.getTime());
      }, 0);
      this.metrics.averageResolutionTime = totalResolutionTime / resolvedAlerts.length / (1000 * 60 * 60); // hours
    }

    // Update top alert sources
    const sourceCounts = new Map<string, number>();
    alerts.forEach(alert => {
      sourceCounts.set(alert.source, (sourceCounts.get(alert.source) || 0) + 1);
    });

    this.metrics.topAlertSources = Array.from(sourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // Calculate escalation rate
    const totalNonResolved = alerts.filter(a => a.status !== AlertStatus.RESOLVED).length;
    const escalatedCount = alerts.filter(a => a.status === AlertStatus.ESCALATED).length;
    this.metrics.escalationRate = totalNonResolved > 0 ? escalatedCount / totalNonResolved : 0;
  }

  async getAlert(alertId: string): Promise<Alert | null> {
    return this.alerts.get(alertId) || null;
  }

  async getAlerts(filters?: {
    type?: AlertType;
    severity?: AlertSeverity;
    status?: AlertStatus;
    source?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
  }): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.type) {
        alerts = alerts.filter(a => a.type === filters.type);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.source) {
        alerts = alerts.filter(a => a.source === filters.source);
      }
      if (filters.userId) {
        alerts = alerts.filter(a => a.userId === filters.userId);
      }
      if (filters.startDate) {
        alerts = alerts.filter(a => a.triggeredAt >= filters.startDate!);
      }
      if (filters.endDate) {
        alerts = alerts.filter(a => a.triggeredAt <= filters.endDate!);
      }
      if (filters.tags && filters.tags.length > 0) {
        alerts = alerts.filter(a => filters.tags!.some(tag => a.tags.includes(tag)));
      }
    }

    return alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  async getMetrics(): Promise<AlertMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<AlertConfig>): Promise<AlertConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<AlertConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalAlerts: number;
    criticalAlerts: number;
    queueSize: number;
    notificationFailureRate: number;
    lastUpdated: Date;
  }> {
    this.updateMetrics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    const notificationFailureRate = this.metrics.notificationsSent + this.metrics.notificationsFailed > 0
      ? this.metrics.notificationsFailed / (this.metrics.notificationsSent + this.metrics.notificationsFailed)
      : 0;

    if (this.metrics.criticalAlerts > 10 || notificationFailureRate > 0.2) {
      status = 'critical';
    } else if (this.metrics.criticalAlerts > 5 || notificationFailureRate > 0.1) {
      status = 'warning';
    }

    return {
      status,
      totalAlerts: this.metrics.totalAlerts,
      criticalAlerts: this.metrics.criticalAlerts,
      queueSize: this.notificationQueue.length,
      notificationFailureRate,
      lastUpdated: new Date()
    };
  }
}
