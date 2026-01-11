import { EventEmitter } from 'events';
import { NotificationChannel, NotificationType, NotificationPriority } from './notificationEngine';

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ERROR = 'error'
}

export enum ScheduleType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  CONDITIONAL = 'conditional'
}

export enum RecurrenceFrequency {
  MINUTE = 'minute',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface Schedule {
  id: string;
  name: string;
  description: string;
  type: ScheduleType;
  status: ScheduleStatus;
  templateId?: string;
  channel: NotificationChannel;
  recipients: string[];
  subject?: string;
  content: string;
  htmlContent?: string;
  variables?: Record<string, any>;
  priority: NotificationPriority;
  timezone: string;
  scheduleConfig: ScheduleConfig;
  conditions?: ScheduleCondition[];
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  maxRuns?: number;
  tags: string[];
}

export interface ScheduleConfig {
  startDate: Date;
  endDate?: Date;
  oneTime?: {
    runAt: Date;
  };
  recurring?: {
    frequency: RecurrenceFrequency;
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    monthOfYear?: number;
    lastDayOfMonth?: boolean;
    occurrences?: number;
  };
  conditional?: {
    triggerEvent: string;
    conditions: ScheduleCondition[];
  };
}

export interface ScheduleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  runAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  notificationIds: string[];
  error?: string;
  duration: number;
  metadata: Record<string, any>;
}

export interface ScheduleMetrics {
  totalSchedules: number;
  activeSchedules: number;
  pausedSchedules: number;
  completedSchedules: number;
  schedulesByType: Record<ScheduleType, number>;
  schedulesByChannel: Record<NotificationChannel, number>;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  upcomingRuns: Array<{
    scheduleId: string;
    scheduleName: string;
    nextRun: Date;
    channel: NotificationChannel;
  }>;
  executionTrend: Array<{
    date: string;
    executions: number;
    successRate: number;
    averageTime: number;
  }>;
}

export interface ScheduleConfig {
  maxConcurrentExecutions: number;
  executionTimeout: number;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableConditionEvaluation: boolean;
  conditionEvaluationTimeout: number;
  enableTimezoneConversion: boolean;
  defaultTimezone: string;
  enableDeduplication: boolean;
  deduplicationWindow: number;
  enableHistoryRetention: boolean;
  historyRetentionDays: number;
}

export class NotificationSchedulingService extends EventEmitter {
  private schedules: Map<string, Schedule> = new Map();
  private executions: Map<string, ScheduleExecution[]> = new Map();
  private config: ScheduleConfig;
  private metrics: ScheduleMetrics;
  private executionQueue: Array<{ scheduleId: string; priority: number }> = [];
  private isProcessing = false;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultSchedules();
    this.startScheduleProcessor();
    this.startMetricsUpdater();
  }

  private initializeDefaultConfig(): ScheduleConfig {
    return {
      maxConcurrentExecutions: 10,
      executionTimeout: 300000, // 5 minutes
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 60000, // 1 minute
      enableConditionEvaluation: true,
      conditionEvaluationTimeout: 30000, // 30 seconds
      enableTimezoneConversion: true,
      defaultTimezone: 'UTC',
      enableDeduplication: true,
      deduplicationWindow: 5, // minutes
      enableHistoryRetention: true,
      historyRetentionDays: 90
    };
  }

  private initializeMetrics(): ScheduleMetrics {
    return {
      totalSchedules: 0,
      activeSchedules: 0,
      pausedSchedules: 0,
      completedSchedules: 0,
      schedulesByType: {
        one_time: 0,
        recurring: 0,
        conditional: 0
      },
      schedulesByChannel: {
        email: 0,
        sms: 0,
        push: 0,
        webhook: 0,
        slack: 0,
        microsoft_teams: 0,
        discord: 0,
        in_app: 0
      },
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      upcomingRuns: [],
      executionTrend: []
    };
  }

  private initializeDefaultSchedules(): void {
    const schedules: Schedule[] = [
      {
        id: 'schedule_daily_report',
        name: 'Daily Compliance Report',
        description: 'Send daily compliance summary report',
        type: ScheduleType.RECURRING,
        status: ScheduleStatus.ACTIVE,
        channel: NotificationChannel.EMAIL,
        recipients: ['compliance@company.com'],
        subject: 'Daily Compliance Report - {{date}}',
        content: 'Daily compliance report for {{date}} is attached.',
        priority: NotificationPriority.NORMAL,
        timezone: 'UTC',
        scheduleConfig: {
          startDate: new Date(),
          recurring: {
            frequency: RecurrenceFrequency.DAILY,
            interval: 1
          }
        },
        variables: {
          date: '{{currentDate}}'
        },
        createdBy: 'system',
        createdAt: new Date(),
        runCount: 0,
        tags: ['daily', 'report', 'compliance']
      },
      {
        id: 'schedule_weekly_reminder',
        name: 'Weekly KYC Reminder',
        description: 'Send weekly reminder for pending KYC verifications',
        type: ScheduleType.RECURRING,
        status: ScheduleStatus.ACTIVE,
        channel: NotificationChannel.EMAIL,
        recipients: ['kyc@company.com'],
        subject: 'Weekly KYC Verification Reminder',
        content: 'There are {{pendingCount}} pending KYC verifications requiring attention.',
        priority: NotificationPriority.HIGH,
        timezone: 'UTC',
        scheduleConfig: {
          startDate: new Date(),
          recurring: {
            frequency: RecurrenceFrequency.WEEKLY,
            interval: 1,
            daysOfWeek: [1] // Monday
          }
        },
        variables: {
          pendingCount: '{{getPendingKYCCount}}'
        },
        createdBy: 'system',
        createdAt: new Date(),
        runCount: 0,
        tags: ['weekly', 'reminder', 'kyc']
      }
    ];

    schedules.forEach(schedule => {
      this.schedules.set(schedule.id, schedule);
      this.calculateNextRun(schedule);
    });

    this.updateMetrics();
  }

  async createSchedule(data: {
    name: string;
    description: string;
    type: ScheduleType;
    templateId?: string;
    channel: NotificationChannel;
    recipients: string[];
    subject?: string;
    content: string;
    htmlContent?: string;
    variables?: Record<string, any>;
    priority?: NotificationPriority;
    timezone?: string;
    scheduleConfig: ScheduleConfig;
    conditions?: ScheduleCondition[];
    metadata?: Record<string, any>;
    createdBy: string;
    tags?: string[];
  }): Promise<Schedule> {
    const schedule: Schedule = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      type: data.type,
      status: ScheduleStatus.ACTIVE,
      templateId: data.templateId,
      channel: data.channel,
      recipients: data.recipients,
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent,
      variables: data.variables || {},
      priority: data.priority || NotificationPriority.NORMAL,
      timezone: data.timezone || this.config.defaultTimezone,
      scheduleConfig: data.scheduleConfig,
      conditions: data.conditions,
      metadata: data.metadata || {},
      createdBy: data.createdBy,
      createdAt: new Date(),
      runCount: 0,
      tags: data.tags || []
    };

    // Calculate next run time
    this.calculateNextRun(schedule);

    this.schedules.set(schedule.id, schedule);
    this.updateMetrics();
    this.emit('scheduleCreated', schedule);

    return schedule;
  }

  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule | null> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const updatedSchedule = { 
      ...schedule, 
      ...updates,
      updatedAt: new Date()
    };

    // Recalculate next run time if schedule config changed
    if (updates.scheduleConfig || updates.timezone) {
      this.calculateNextRun(updatedSchedule);
    }

    this.schedules.set(scheduleId, updatedSchedule);
    this.updateMetrics();
    this.emit('scheduleUpdated', updatedSchedule);

    return updatedSchedule;
  }

  async pauseSchedule(scheduleId: string): Promise<Schedule | null> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    schedule.status = ScheduleStatus.PAUSED;
    schedule.updatedAt = new Date();

    this.updateMetrics();
    this.emit('schedulePaused', schedule);

    return schedule;
  }

  async resumeSchedule(scheduleId: string): Promise<Schedule | null> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    schedule.status = ScheduleStatus.ACTIVE;
    schedule.updatedAt = new Date();

    // Recalculate next run time
    this.calculateNextRun(schedule);

    this.updateMetrics();
    this.emit('scheduleResumed', schedule);

    return schedule;
  }

  async cancelSchedule(scheduleId: string): Promise<Schedule | null> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    schedule.status = ScheduleStatus.CANCELLED;
    schedule.updatedAt = new Date();

    this.updateMetrics();
    this.emit('scheduleCancelled', schedule);

    return schedule;
  }

  private calculateNextRun(schedule: Schedule): void {
    if (schedule.status !== ScheduleStatus.ACTIVE) {
      schedule.nextRun = undefined;
      return;
    }

    const now = new Date();
    let nextRun: Date | undefined;

    switch (schedule.type) {
      case ScheduleType.ONE_TIME:
        if (schedule.scheduleConfig.oneTime) {
          const runAt = schedule.scheduleConfig.oneTime.runAt;
          if (runAt > now) {
            nextRun = runAt;
          }
        }
        break;

      case ScheduleType.RECURRING:
        if (schedule.scheduleConfig.recurring) {
          nextRun = this.calculateNextRecurringRun(schedule, now);
        }
        break;

      case ScheduleType.CONDITIONAL:
        // Conditional schedules don't have predictable next runs
        nextRun = undefined;
        break;
    }

    schedule.nextRun = nextRun;
  }

  private calculateNextRecurringRun(schedule: Schedule, now: Date): Date | undefined {
    const config = schedule.scheduleConfig.recurring!;
    const startDate = schedule.scheduleConfig.startDate;
    const endDate = schedule.scheduleConfig.endDate;

    // Check if schedule should still run
    if (endDate && now > endDate) {
      return undefined;
    }

    // Start from the last run or start date
    const baseDate = schedule.lastRun || startDate;
    let nextRun = new Date(baseDate);

    switch (config.frequency) {
      case RecurrenceFrequency.MINUTE:
        nextRun.setMinutes(nextRun.getMinutes() + config.interval);
        break;

      case RecurrenceFrequency.HOURLY:
        nextRun.setHours(nextRun.getHours() + config.interval);
        break;

      case RecurrenceFrequency.DAILY:
        nextRun.setDate(nextRun.getDate() + config.interval);
        break;

      case RecurrenceFrequency.WEEKLY:
        nextRun.setDate(nextRun.getDate() + (config.interval * 7));
        if (config.daysOfWeek && config.daysOfWeek.length > 0) {
          nextRun = this.getNextWeekday(nextRun, config.daysOfWeek);
        }
        break;

      case RecurrenceFrequency.MONTHLY:
        nextRun.setMonth(nextRun.getMonth() + config.interval);
        if (config.dayOfMonth) {
          nextRun.setDate(config.dayOfMonth);
        } else if (config.lastDayOfMonth) {
          nextRun = this.getLastDayOfMonth(nextRun);
        }
        break;

      case RecurrenceFrequency.YEARLY:
        nextRun.setFullYear(nextRun.getFullYear() + config.interval);
        if (config.monthOfYear) {
          nextRun.setMonth(config.monthOfYear);
        }
        if (config.dayOfMonth) {
          nextRun.setDate(config.dayOfMonth);
        }
        break;
    }

    // Check if next run is in the past and calculate again
    if (nextRun <= now) {
      return this.calculateNextRecurringRun(schedule, new Date(nextRun.getTime() + 60000));
    }

    // Check end date
    if (endDate && nextRun > endDate) {
      return undefined;
    }

    // Check max occurrences
    if (config.occurrences && schedule.runCount >= config.occurrences) {
      return undefined;
    }

    return nextRun;
  }

  private getNextWeekday(date: Date, daysOfWeek: number[]): Date {
    const currentDay = date.getDay();
    const sortedDays = daysOfWeek.sort();
    
    for (const day of sortedDays) {
      if (day > currentDay) {
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + (day - currentDay));
        return nextDate;
      }
    }
    
    // If no day this week, go to next week
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + (7 - currentDay + sortedDays[0]));
    return nextDate;
  }

  private getLastDayOfMonth(date: Date): Date {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDay;
  }

  private startScheduleProcessor(): void {
    setInterval(() => {
      this.processSchedules();
    }, 60000); // Check every minute
  }

  private async processSchedules(): Promise<void> {
    const now = new Date();
    const schedulesToRun: Schedule[] = [];

    // Find schedules that need to run
    for (const schedule of this.schedules.values()) {
      if (
        schedule.status === ScheduleStatus.ACTIVE &&
        schedule.nextRun &&
        schedule.nextRun <= now
      ) {
        schedulesToRun.push(schedule);
      }
    }

    // Add to execution queue
    schedulesToRun.forEach(schedule => {
      this.executionQueue.push({
        scheduleId: schedule.id,
        priority: this.getPriorityValue(schedule.priority)
      });
    });
  }

  private getPriorityValue(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT: return 4;
      case NotificationPriority.HIGH: return 3;
      case NotificationPriority.NORMAL: return 2;
      case NotificationPriority.LOW: return 1;
      default: return 2;
    }
  }

  private async processExecutionQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Sort by priority
      this.executionQueue.sort((a, b) => b.priority - a.priority);

      const batch = this.executionQueue.splice(0, this.config.maxConcurrentExecutions);
      const promises = batch.map(item => this.executeSchedule(item.scheduleId));

      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeSchedule(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return;

    const execution: ScheduleExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scheduleId,
      runAt: new Date(),
      status: 'running',
      notificationIds: [],
      duration: 0,
      metadata: {}
    };

    const startTime = Date.now();

    try {
      // Check conditions if it's a conditional schedule
      if (schedule.type === ScheduleType.CONDITIONAL && schedule.conditions) {
        const conditionsMet = await this.evaluateConditions(schedule.conditions);
        if (!conditionsMet) {
          execution.status = 'completed';
          execution.duration = Date.now() - startTime;
          this.addExecution(scheduleId, execution);
          return;
        }
      }

      // Process template variables
      const processedVariables = await this.processVariables(schedule.variables || {});

      // Create notifications for each recipient
      for (const recipient of schedule.recipients) {
        // This would integrate with the notification engine
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        execution.notificationIds.push(notificationId);
      }

      execution.status = 'completed';
      execution.duration = Date.now() - startTime;

      // Update schedule
      schedule.lastRun = new Date();
      schedule.runCount++;

      // Check if schedule should be completed
      if (this.shouldCompleteSchedule(schedule)) {
        schedule.status = ScheduleStatus.COMPLETED;
      } else {
        // Calculate next run
        this.calculateNextRun(schedule);
      }

      this.emit('scheduleExecuted', schedule, execution);

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.duration = Date.now() - startTime;

      this.emit('scheduleExecutionFailed', schedule, execution, error);
    }

    this.addExecution(scheduleId, execution);
    this.updateMetrics();
  }

  private async evaluateConditions(conditions: ScheduleCondition[]): Promise<boolean> {
    // Simulate condition evaluation
    // In a real implementation, this would evaluate against actual data
    return true;
  }

  private async processVariables(variables: Record<string, any>): Promise<Record<string, any>> {
    const processed: Record<string, any> = {};

    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Process dynamic variables
        const variableName = value.slice(2, -2);
        processed[key] = await this.getDynamicVariable(variableName);
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  private async getDynamicVariable(variableName: string): Promise<any> {
    switch (variableName) {
      case 'currentDate':
        return new Date().toISOString().split('T')[0];
      case 'currentDateTime':
        return new Date().toISOString();
      case 'getPendingKYCCount':
        // Simulate getting pending KYC count
        return Math.floor(Math.random() * 50);
      default:
        return `{{${variableName}}}`;
    }
  }

  private shouldCompleteSchedule(schedule: Schedule): boolean {
    // Check max runs
    if (schedule.maxRuns && schedule.runCount >= schedule.maxRuns) {
      return true;
    }

    // Check end date
    if (schedule.scheduleConfig.endDate && new Date() > schedule.scheduleConfig.endDate) {
      return true;
    }

    // Check recurring occurrences
    if (schedule.type === ScheduleType.RECURRING && schedule.scheduleConfig.recurring?.occurrences) {
      if (schedule.runCount >= schedule.scheduleConfig.recurring.occurrences) {
        return true;
      }
    }

    return false;
  }

  private addExecution(scheduleId: string, execution: ScheduleExecution): void {
    const executions = this.executions.get(scheduleId) || [];
    executions.push(execution);
    
    // Limit history based on retention policy
    if (this.config.enableHistoryRetention) {
      const cutoffDate = new Date(Date.now() - this.config.historyRetentionDays * 24 * 60 * 60 * 1000);
      const filtered = executions.filter(e => e.runAt >= cutoffDate);
      this.executions.set(scheduleId, filtered);
    } else {
      this.executions.set(scheduleId, executions);
    }
  }

  private startMetricsUpdater(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  private updateMetrics(): void {
    const schedules = Array.from(this.schedules.values());

    this.metrics.totalSchedules = schedules.length;
    this.metrics.activeSchedules = schedules.filter(s => s.status === ScheduleStatus.ACTIVE).length;
    this.metrics.pausedSchedules = schedules.filter(s => s.status === ScheduleStatus.PAUSED).length;
    this.metrics.completedSchedules = schedules.filter(s => s.status === ScheduleStatus.COMPLETED).length;

    this.metrics.schedulesByType = {
      one_time: schedules.filter(s => s.type === ScheduleType.ONE_TIME).length,
      recurring: schedules.filter(s => s.type === ScheduleType.RECURRING).length,
      conditional: schedules.filter(s => s.type === ScheduleType.CONDITIONAL).length
    };

    this.metrics.schedulesByChannel = {
      email: schedules.filter(s => s.channel === NotificationChannel.EMAIL).length,
      sms: schedules.filter(s => s.channel === NotificationChannel.SMS).length,
      push: schedules.filter(s => s.channel === NotificationChannel.PUSH).length,
      webhook: schedules.filter(s => s.channel === NotificationChannel.WEBHOOK).length,
      slack: schedules.filter(s => s.channel === NotificationChannel.SLACK).length,
      microsoft_teams: schedules.filter(s => s.channel === NotificationChannel.MICROSOFT_TEAMS).length,
      discord: schedules.filter(s => s.channel === NotificationChannel.DISCORD).length,
      in_app: schedules.filter(s => s.channel === NotificationChannel.IN_APP).length
    };

    // Execution metrics
    const allExecutions = Array.from(this.executions.values()).flat();
    this.metrics.totalExecutions = allExecutions.length;
    this.metrics.successfulExecutions = allExecutions.filter(e => e.status === 'completed').length;
    this.metrics.failedExecutions = allExecutions.filter(e => e.status === 'failed').length;

    if (allExecutions.length > 0) {
      const totalTime = allExecutions.reduce((sum, e) => sum + e.duration, 0);
      this.metrics.averageExecutionTime = totalTime / allExecutions.length;
    }

    // Upcoming runs
    this.metrics.upcomingRuns = schedules
      .filter(s => s.status === ScheduleStatus.ACTIVE && s.nextRun)
      .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
      .slice(0, 10)
      .map(s => ({
        scheduleId: s.id,
        scheduleName: s.name,
        nextRun: s.nextRun!,
        channel: s.channel
      }));
  }

  async getSchedule(scheduleId: string): Promise<Schedule | null> {
    return this.schedules.get(scheduleId) || null;
  }

  async getSchedules(filters?: {
    type?: ScheduleType;
    status?: ScheduleStatus;
    channel?: NotificationChannel;
    tags?: string[];
  }): Promise<Schedule[]> {
    let schedules = Array.from(this.schedules.values());

    if (filters) {
      if (filters.type) {
        schedules = schedules.filter(s => s.type === filters.type);
      }
      if (filters.status) {
        schedules = schedules.filter(s => s.status === filters.status);
      }
      if (filters.channel) {
        schedules = schedules.filter(s => s.channel === filters.channel);
      }
      if (filters.tags && filters.tags.length > 0) {
        schedules = schedules.filter(s => 
          filters.tags!.some(tag => s.tags.includes(tag))
        );
      }
    }

    return schedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getScheduleExecutions(scheduleId: string): Promise<ScheduleExecution[]> {
    return this.executions.get(scheduleId) || [];
  }

  async getMetrics(): Promise<ScheduleMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<ScheduleConfig>): Promise<ScheduleConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<ScheduleConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalSchedules: number;
    activeSchedules: number;
    queueSize: number;
    failureRate: number;
    lastUpdated: Date;
  }> {
    this.updateMetrics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    const failureRate = this.metrics.totalExecutions > 0 
      ? this.metrics.failedExecutions / this.metrics.totalExecutions 
      : 0;

    if (failureRate > 0.2 || this.executionQueue.length > 20) {
      status = 'critical';
    } else if (failureRate > 0.1 || this.executionQueue.length > 10) {
      status = 'warning';
    }

    return {
      status,
      totalSchedules: this.metrics.totalSchedules,
      activeSchedules: this.metrics.activeSchedules,
      queueSize: this.executionQueue.length,
      failureRate,
      lastUpdated: new Date()
    };
  }
}
