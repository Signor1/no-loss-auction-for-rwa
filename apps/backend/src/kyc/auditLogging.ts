import { EventEmitter } from 'events';

export enum AuditEventType {
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  COMPLIANCE_CHECK = 'compliance_check',
  CONFIGURATION_CHANGE = 'configuration_change',
  ERROR = 'error',
  SECURITY_INCIDENT = 'security_incident'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
  PENDING = 'pending'
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  status: AuditStatus;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  action: string;
  details: Record<string, any>;
  oldValue?: any;
  newValue?: any;
  correlationId?: string;
  source: string;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  retentionPeriod: number; // days
  archived: boolean;
  archivedAt?: Date;
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  status?: AuditStatus;
  resource?: string;
  action?: string;
  ipAddress?: string;
  tags?: string[];
  correlationId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  query: AuditQuery;
  generatedBy: string;
  generatedAt: Date;
  format: 'json' | 'csv' | 'pdf' | 'excel';
  data: any[];
  summary: {
    totalRecords: number;
    eventTypes: Record<AuditEventType, number>;
    severities: Record<AuditSeverity, number>;
    statuses: Record<AuditStatus, number>;
    topUsers: Array<{
      userId: string;
      count: number;
    }>;
    topResources: Array<{
      resource: string;
      count: number;
    }>;
    timeRange: {
      start: Date;
      end: Date;
    };
  };
  metadata?: Record<string, any>;
}

export interface AuditRetentionPolicy {
  id: string;
  name: string;
  description: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  retentionDays: number;
  archiveAfterDays?: number;
  deleteAfterArchiveDays?: number;
  isActive: boolean;
  priority: number;
  conditions: RetentionCondition[];
}

export interface RetentionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface AuditAlert {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  actions: AlertAction[];
  isActive: boolean;
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AlertCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'count_greater_than';
  value: any;
  timeWindow?: number; // minutes
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'log' | 'escalate';
  config: Record<string, any>;
}

export interface AuditConfig {
  enableRealTimeLogging: boolean;
  bufferSize: number;
  flushInterval: number; // milliseconds
  enableCompression: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  defaultRetentionDays: number;
  maxLogSize: number; // bytes
  enableIndexing: boolean;
  indexedFields: string[];
  enableAggregation: boolean;
  aggregationInterval: number; // minutes
  enableBackup: boolean;
  backupInterval: number; // hours
  backupLocation: string;
}

export interface AuditMetrics {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  averageLogsPerDay: number;
  storageUsed: number; // bytes
  archivedLogs: number;
  deletedLogs: number;
  eventTypes: Record<AuditEventType, number>;
  severities: Record<AuditSeverity, number>;
  statuses: Record<AuditStatus, number>;
  topUsers: Array<{
    userId: string;
    count: number;
    lastActivity: Date;
  }>;
  topResources: Array<{
    resource: string;
    count: number;
    lastAccess: Date;
  }>;
  errorRate: number;
  securityIncidents: number;
  complianceViolations: number;
}

export class AuditLoggingService extends EventEmitter {
  private logs: Map<string, AuditLog> = new Map();
  private reports: Map<string, AuditReport> = new Map();
  private retentionPolicies: Map<string, AuditRetentionPolicy> = new Map();
  private alerts: Map<string, AuditAlert> = new Map();
  private config: AuditConfig;
  private metrics: AuditMetrics;
  private buffer: AuditLog[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultRetentionPolicies();
    this.initializeDefaultAlerts();
    this.startBufferProcessor();
    this.startMetricsUpdater();
  }

  private initializeDefaultConfig(): AuditConfig {
    return {
      enableRealTimeLogging: true,
      bufferSize: 1000,
      flushInterval: 5000,
      enableCompression: true,
      enableEncryption: false,
      defaultRetentionDays: 2555, // 7 years
      maxLogSize: 1048576, // 1MB
      enableIndexing: true,
      indexedFields: ['userId', 'eventType', 'severity', 'resource', 'action'],
      enableAggregation: true,
      aggregationInterval: 60,
      enableBackup: true,
      backupInterval: 24,
      backupLocation: '/var/log/audit/backup'
    };
  }

  private initializeMetrics(): AuditMetrics {
    return {
      totalLogs: 0,
      logsToday: 0,
      logsThisWeek: 0,
      logsThisMonth: 0,
      averageLogsPerDay: 0,
      storageUsed: 0,
      archivedLogs: 0,
      deletedLogs: 0,
      eventTypes: {
        user_action: 0,
        system_event: 0,
        data_access: 0,
        data_modification: 0,
        authentication: 0,
        authorization: 0,
        compliance_check: 0,
        configuration_change: 0,
        error: 0,
        security_incident: 0
      },
      severities: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      statuses: {
        success: 0,
        failure: 0,
        warning: 0,
        pending: 0
      },
      topUsers: [],
      topResources: [],
      errorRate: 0,
      securityIncidents: 0,
      complianceViolations: 0
    };
  }

  private initializeDefaultRetentionPolicies(): void {
    const policies: AuditRetentionPolicy[] = [
      {
        id: 'policy_security',
        name: 'Security Events Retention',
        description: 'Extended retention for security-related events',
        eventType: AuditEventType.SECURITY_INCIDENT,
        severity: AuditSeverity.CRITICAL,
        retentionDays: 3650, // 10 years
        archiveAfterDays: 365,
        deleteAfterArchiveDays: 2555,
        isActive: true,
        priority: 1,
        conditions: []
      },
      {
        id: 'policy_compliance',
        name: 'Compliance Events Retention',
        description: 'Standard retention for compliance events',
        eventType: AuditEventType.COMPLIANCE_CHECK,
        retentionDays: 2555, // 7 years
        archiveAfterDays: 730,
        deleteAfterArchiveDays: 1825,
        isActive: true,
        priority: 2,
        conditions: []
      },
      {
        id: 'policy_general',
        name: 'General Events Retention',
        description: 'Standard retention for general events',
        retentionDays: 1095, // 3 years
        archiveAfterDays: 365,
        deleteAfterArchiveDays: 730,
        isActive: true,
        priority: 3,
        conditions: []
      }
    ];

    policies.forEach(policy => {
      this.retentionPolicies.set(policy.id, policy);
    });
  }

  private initializeDefaultAlerts(): void {
    const alerts: AuditAlert[] = [
      {
        id: 'alert_security_incidents',
        name: 'Security Incidents Alert',
        description: 'Alert on critical security incidents',
        conditions: [
          {
            field: 'eventType',
            operator: 'equals',
            value: AuditEventType.SECURITY_INCIDENT
          },
          {
            field: 'severity',
            operator: 'equals',
            value: AuditSeverity.CRITICAL
          }
        ],
        actions: [
          {
            type: 'email',
            config: {
              recipients: ['security@company.com'],
              subject: 'Critical Security Incident Detected',
              template: 'security_incident'
            }
          },
          {
            type: 'escalate',
            config: {
              level: 'critical',
              escalateTo: ['cto@company.com', 'cso@company.com']
            }
          }
        ],
        isActive: true,
        cooldownPeriod: 5,
        triggerCount: 0
      },
      {
        id: 'alert_failed_authentications',
        name: 'Failed Authentication Alert',
        description: 'Alert on multiple failed authentications',
        conditions: [
          {
            field: 'eventType',
            operator: 'equals',
            value: AuditEventType.AUTHENTICATION
          },
          {
            field: 'status',
            operator: 'equals',
            value: AuditStatus.FAILURE
          },
          {
            field: 'count_greater_than',
            operator: 'count_greater_than',
            value: 5,
            timeWindow: 15 // 15 minutes
          }
        ],
        actions: [
          {
            type: 'email',
            config: {
              recipients: ['security@company.com'],
              subject: 'Multiple Failed Authentications Detected'
            }
          }
        ],
        isActive: true,
        cooldownPeriod: 30,
        triggerCount: 0
      }
    ];

    alerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });
  }

  async log(data: {
    eventType: AuditEventType;
    severity: AuditSeverity;
    status: AuditStatus;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource: string;
    action: string;
    details: Record<string, any>;
    oldValue?: any;
    newValue?: any;
    correlationId?: string;
    source?: string;
    category?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    retentionPeriod?: number;
  }): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      eventType: data.eventType,
      severity: data.severity,
      status: data.status,
      userId: data.userId,
      sessionId: data.sessionId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      resource: data.resource,
      action: data.action,
      details: data.details,
      oldValue: data.oldValue,
      newValue: data.newValue,
      correlationId: data.correlationId,
      source: data.source || 'system',
      category: data.category || 'general',
      tags: data.tags || [],
      metadata: data.metadata || {},
      retentionPeriod: data.retentionPeriod || this.config.defaultRetentionDays,
      archived: false
    };

    if (this.config.enableRealTimeLogging) {
      await this.processLog(auditLog);
    } else {
      this.buffer.push(auditLog);
    }

    this.emit('auditLogCreated', auditLog);
    return auditLog;
  }

  private async processLog(log: AuditLog): Promise<void> {
    // Apply retention policy
    log.retentionPeriod = this.getRetentionPeriod(log);

    // Store log
    this.logs.set(log.id, log);

    // Update metrics
    this.updateMetricsForLog(log);

    // Check alerts
    await this.checkAlerts(log);

    // Update storage metrics
    this.metrics.storageUsed += this.calculateLogSize(log);
  }

  private getRetentionPeriod(log: AuditLog): number {
    const applicablePolicies = Array.from(this.retentionPolicies.values())
      .filter(policy => 
        policy.isActive &&
        (!policy.eventType || policy.eventType === log.eventType) &&
        (!policy.severity || policy.severity === log.severity) &&
        this.evaluateRetentionConditions(policy.conditions, log)
      )
      .sort((a, b) => a.priority - b.priority);

    return applicablePolicies.length > 0 ? applicablePolicies[0].retentionDays : this.config.defaultRetentionDays;
  }

  private evaluateRetentionConditions(conditions: RetentionCondition[], log: AuditLog): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.field, log);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  private getFieldValue(field: string, log: AuditLog): any {
    const parts = field.split('.');
    let value: any = log;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private calculateLogSize(log: AuditLog): number {
    return JSON.stringify(log).length;
  }

  private async checkAlerts(log: AuditLog): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (!alert.isActive) continue;

      // Check cooldown period
      if (alert.lastTriggered && 
          Date.now() - alert.lastTriggered.getTime() < alert.cooldownPeriod * 60 * 1000) {
        continue;
      }

      const shouldTrigger = await this.evaluateAlertConditions(alert.conditions, log);
      
      if (shouldTrigger) {
        await this.triggerAlert(alert, log);
      }
    }
  }

  private async evaluateAlertConditions(conditions: AlertCondition[], log: AuditLog): Promise<boolean> {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(condition.field, log);
      
      let result = false;
      
      switch (condition.operator) {
        case 'equals':
          result = fieldValue === condition.value;
          break;
        case 'not_equals':
          result = fieldValue !== condition.value;
          break;
        case 'contains':
          result = String(fieldValue).includes(String(condition.value));
          break;
        case 'greater_than':
          result = Number(fieldValue) > Number(condition.value);
          break;
        case 'less_than':
          result = Number(fieldValue) < Number(condition.value);
          break;
        case 'count_greater_than':
          if (condition.timeWindow) {
            const windowStart = new Date(Date.now() - condition.timeWindow * 60 * 1000);
            const count = Array.from(this.logs.values())
              .filter(l => l.timestamp >= windowStart && 
                          l.eventType === condition.value.eventType &&
                          l.status === condition.value.status)
              .length;
            result = count > Number(condition.value);
          }
          break;
      }
      
      if (!result) return false;
    }
    
    return true;
  }

  private async triggerAlert(alert: AuditAlert, log: AuditLog): Promise<void> {
    alert.lastTriggered = new Date();
    alert.triggerCount++;

    for (const action of alert.actions) {
      try {
        await this.executeAlertAction(action, alert, log);
      } catch (error) {
        console.error(`Failed to execute alert action:`, error);
      }
    }

    this.emit('alertTriggered', { alert, log });
  }

  private async executeAlertAction(action: AlertAction, alert: AuditAlert, log: AuditLog): Promise<void> {
    switch (action.type) {
      case 'email':
        // Implement email sending logic
        console.log(`Email alert sent: ${alert.name}`, { log, config: action.config });
        break;
      case 'webhook':
        // Implement webhook call logic
        console.log(`Webhook alert sent: ${alert.name}`, { log, config: action.config });
        break;
      case 'slack':
        // Implement Slack notification logic
        console.log(`Slack alert sent: ${alert.name}`, { log, config: action.config });
        break;
      case 'log':
        console.log(`Alert logged: ${alert.name}`, { log, config: action.config });
        break;
      case 'escalate':
        // Implement escalation logic
        console.log(`Alert escalated: ${alert.name}`, { log, config: action.config });
        break;
    }
  }

  private startBufferProcessor(): void {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        const logsToProcess = this.buffer.splice(0, this.config.bufferSize);
        logsToProcess.forEach(log => this.processLog(log));
      }
    }, this.config.flushInterval);
  }

  private startMetricsUpdater(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  private updateMetricsForLog(log: AuditLog): void {
    this.metrics.totalLogs++;
    this.metrics.eventTypes[log.eventType]++;
    this.metrics.severities[log.severity]++;
    this.metrics.statuses[log.status]++;

    if (log.eventType === AuditEventType.SECURITY_INCIDENT) {
      this.metrics.securityIncidents++;
    }

    if (log.severity === AuditSeverity.CRITICAL && log.eventType === AuditEventType.COMPLIANCE_CHECK) {
      this.metrics.complianceViolations++;
    }
  }

  private updateMetrics(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const logs = Array.from(this.logs.values());

    this.metrics.logsToday = logs.filter(l => l.timestamp >= today).length;
    this.metrics.logsThisWeek = logs.filter(l => l.timestamp >= weekAgo).length;
    this.metrics.logsThisMonth = logs.filter(l => l.timestamp >= monthAgo).length;

    if (logs.length > 0) {
      const oldestLog = logs.reduce((oldest, log) => 
        log.timestamp < oldest.timestamp ? log : oldest
      );
      const daysSinceOldest = Math.max(1, Math.ceil((now.getTime() - oldestLog.timestamp.getTime()) / (1000 * 60 * 60 * 24)));
      this.metrics.averageLogsPerDay = Math.round(this.metrics.totalLogs / daysSinceOldest);
    }

    // Update top users
    const userCounts = new Map<string, number>();
    const userLastActivity = new Map<string, Date>();
    
    logs.forEach(log => {
      if (log.userId) {
        userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
        const lastActivity = userLastActivity.get(log.userId);
        if (!lastActivity || log.timestamp > lastActivity) {
          userLastActivity.set(log.userId, log.timestamp);
        }
      }
    });

    this.metrics.topUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({
        userId,
        count,
        lastActivity: userLastActivity.get(userId) || new Date()
      }));

    // Update top resources
    const resourceCounts = new Map<string, number>();
    const resourceLastAccess = new Map<string, Date>();
    
    logs.forEach(log => {
      resourceCounts.set(log.resource, (resourceCounts.get(log.resource) || 0) + 1);
      const lastAccess = resourceLastAccess.get(log.resource);
      if (!lastAccess || log.timestamp > lastAccess) {
        resourceLastAccess.set(log.resource, log.timestamp);
      }
    });

    this.metrics.topResources = Array.from(resourceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resource, count]) => ({
        resource,
        count,
        lastAccess: resourceLastAccess.get(resource) || new Date()
      }));

    // Calculate error rate
    const totalEvents = this.metrics.totalLogs;
    const errorEvents = this.metrics.statuses.failure + this.metrics.statuses.warning;
    this.metrics.errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;

    // Update archived and deleted counts
    this.metrics.archivedLogs = logs.filter(l => l.archived).length;
    this.metrics.deletedLogs = this.metrics.totalLogs - logs.length;
  }

  async queryLogs(query: AuditQuery): Promise<{
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  }> {
    let logs = Array.from(this.logs.values());

    // Apply filters
    if (query.startDate) {
      logs = logs.filter(l => l.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      logs = logs.filter(l => l.timestamp <= query.endDate!);
    }
    if (query.userId) {
      logs = logs.filter(l => l.userId === query.userId);
    }
    if (query.eventType) {
      logs = logs.filter(l => l.eventType === query.eventType);
    }
    if (query.severity) {
      logs = logs.filter(l => l.severity === query.severity);
    }
    if (query.status) {
      logs = logs.filter(l => l.status === query.status);
    }
    if (query.resource) {
      logs = logs.filter(l => l.resource.includes(query.resource!));
    }
    if (query.action) {
      logs = logs.filter(l => l.action.includes(query.action!));
    }
    if (query.ipAddress) {
      logs = logs.filter(l => l.ipAddress === query.ipAddress);
    }
    if (query.tags && query.tags.length > 0) {
      logs = logs.filter(l => query.tags!.some(tag => l.tags.includes(tag)));
    }
    if (query.correlationId) {
      logs = logs.filter(l => l.correlationId === query.correlationId);
    }

    // Sort
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';
    
    logs.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'severity':
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'eventType':
          comparison = a.eventType.localeCompare(b.eventType);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = logs.length;
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedLogs = logs.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      logs: paginatedLogs,
      total,
      hasMore
    };
  }

  async generateReport(data: {
    name: string;
    description?: string;
    query: AuditQuery;
    format: AuditReport['format'];
    generatedBy: string;
  }): Promise<AuditReport> {
    const { logs, total } = await this.queryLogs(data.query);

    const summary = {
      totalRecords: total,
      eventTypes: this.groupByField(logs, 'eventType'),
      severities: this.groupByField(logs, 'severity'),
      statuses: this.groupByField(logs, 'status'),
      topUsers: this.getTopFieldCounts(logs, 'userId', 10),
      topResources: this.getTopFieldCounts(logs, 'resource', 10),
      timeRange: {
        start: data.query.startDate || new Date(0),
        end: data.query.endDate || new Date()
      }
    };

    const report: AuditReport = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description || '',
      query: data.query,
      generatedBy: data.generatedBy,
      generatedAt: new Date(),
      format: data.format,
      data: logs,
      summary
    };

    this.reports.set(report.id, report);
    this.emit('reportGenerated', report);

    return report;
  }

  private groupByField(logs: AuditLog[], field: keyof AuditLog): Record<string, number> {
    const groups: Record<string, number> = {};
    
    logs.forEach(log => {
      const value = String(log[field] || 'unknown');
      groups[value] = (groups[value] || 0) + 1;
    });
    
    return groups;
  }

  private getTopFieldCounts(logs: AuditLog[], field: keyof AuditLog, limit: number): Array<{ [key: string]: string | number }> {
    const counts = new Map<string, number>();
    
    logs.forEach(log => {
      const value = String(log[field] || 'unknown');
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ [field]: key, count }));
  }

  async getLog(logId: string): Promise<AuditLog | null> {
    return this.logs.get(logId) || null;
  }

  async getReport(reportId: string): Promise<AuditReport | null> {
    return this.reports.get(reportId) || null;
  }

  async getMetrics(): Promise<AuditMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<AuditConfig>): Promise<AuditConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<AuditConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalLogs: number;
    bufferUsage: number;
    storageUsage: number;
    errorRate: number;
    lastUpdated: Date;
  }> {
    this.updateMetrics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const bufferUsage = this.buffer.length / this.config.bufferSize;
    const storageUsage = this.metrics.storageUsed / this.config.maxLogSize;

    if (this.metrics.errorRate > 0.1 || storageUsage > 0.9) {
      status = 'critical';
    } else if (this.metrics.errorRate > 0.05 || bufferUsage > 0.8 || storageUsage > 0.7) {
      status = 'warning';
    }

    return {
      status,
      totalLogs: this.metrics.totalLogs,
      bufferUsage,
      storageUsage,
      errorRate: this.metrics.errorRate,
      lastUpdated: new Date()
    };
  }

  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Process remaining buffer
    if (this.buffer.length > 0) {
      const logsToProcess = this.buffer.splice(0);
      logsToProcess.forEach(log => this.processLog(log));
    }
  }
}
