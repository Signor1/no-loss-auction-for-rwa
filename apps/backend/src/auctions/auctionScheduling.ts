import { EventEmitter } from 'events';
import { Auction, AuctionStatus, AuctionType } from './auctionService';

// Enums
export enum ScheduleType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  RECURRING = 'recurring',
  CONDITIONAL = 'conditional',
  BULK = 'bulk'
}

export enum ScheduleStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum RecurrencePattern {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export enum TriggerType {
  TIME_BASED = 'time_based',
  EVENT_BASED = 'event_based',
  CONDITION_BASED = 'condition_based',
  MANUAL = 'manual'
}

// Interfaces
export interface AuctionSchedule {
  id: string;
  name: string;
  description: string;
  type: ScheduleType;
  status: ScheduleStatus;
  
  // Timing
  startTime: Date;
  endTime?: Date;
  timezone: string;
  
  // Recurrence (for recurring schedules)
  recurrence?: {
    pattern: RecurrencePattern;
    interval: number; // e.g., every 2 weeks
    endDate?: Date;
    maxOccurrences?: number;
    occurrenceCount: number;
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number; // 1-31
    monthOfYear?: number; // 1-12
  };
  
  // Trigger conditions
  trigger?: {
    type: TriggerType;
    conditions: ScheduleCondition[];
  };
  
  // Auction template
  auctionTemplate: AuctionTemplate;
  
  // Execution settings
  executionSettings: {
    maxConcurrentAuctions: number;
    retryAttempts: number;
    retryDelay: number; // in minutes
    autoApprove: boolean;
    requireConfirmation: boolean;
  };
  
  // Targeting
  targeting?: {
    categories?: string[];
    priceRange?: { min: number; max: number };
    sellerIds?: string[];
    excludeSellerIds?: string[];
  };
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  nextExecution?: Date;
  executionHistory: ScheduleExecution[];
  metadata: Record<string, any>;
}

export interface AuctionTemplate {
  name: string;
  description: string;
  auctionType: AuctionType;
  
  // Default auction settings
  defaultDuration: number; // in hours
  startingPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  minimumBidIncrement: number;
  
  // Auction settings
  autoExtend: boolean;
  extensionDuration: number;
  bidHistoryPublic: boolean;
  requireVerification: boolean;
  allowBuyNow: boolean;
  allowProxyBidding: boolean;
  
  // Visibility
  visibility: 'public' | 'private' | 'invite_only';
  maxParticipants?: number;
  
  // Categories and tags
  category: string;
  tags: string[];
  
  // Content
  titleTemplate: string; // Template with placeholders
  descriptionTemplate: string;
  images: string[];
  documents: string[];
  
  // Custom fields
  customFields: Record<string, any>;
}

export interface ScheduleCondition {
  type: 'market_price' | 'user_count' | 'time_of_day' | 'day_of_week' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  description?: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  executionTime: Date;
  status: 'success' | 'failed' | 'partial';
  auctionsCreated: string[];
  errors: ScheduleError[];
  duration: number; // in milliseconds
  triggeredBy: TriggerType;
  metadata: Record<string, any>;
}

export interface ScheduleError {
  id: string;
  type: 'validation' | 'execution' | 'system' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

export interface ScheduleConfig {
  maxConcurrentSchedules: number;
  defaultTimezone: string;
  enableRecurrence: boolean;
  enableConditionalTriggers: boolean;
  maxRecurrenceOccurrences: number;
  scheduleRetentionPeriod: number; // in days
  executionTimeout: number; // in minutes
  enableNotifications: boolean;
  notificationChannels: string[];
  autoRetry: boolean;
  maxRetryAttempts: number;
}

export interface ScheduleStats {
  totalSchedules: number;
  activeSchedules: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  auctionsCreated: number;
  upcomingExecutions: {
    scheduleId: string;
    scheduleName: string;
    nextExecution: Date;
  }[];
  executionTrends: {
    date: Date;
    executions: number;
    successes: number;
    failures: number;
  }[];
}

// Main Auction Scheduling Service
export class AuctionSchedulingService extends EventEmitter {
  private schedules: Map<string, AuctionSchedule> = new Map();
  private executions: Map<string, ScheduleExecution> = new Map();
  private config: ScheduleConfig;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(config?: Partial<ScheduleConfig>) {
    super();
    this.config = {
      maxConcurrentSchedules: 100,
      defaultTimezone: 'UTC',
      enableRecurrence: true,
      enableConditionalTriggers: true,
      maxRecurrenceOccurrences: 365,
      scheduleRetentionPeriod: 90,
      executionTimeout: 30,
      enableNotifications: true,
      notificationChannels: ['email', 'push'],
      autoRetry: true,
      maxRetryAttempts: 3,
      ...config
    };
  }

  // Schedule Management
  async createSchedule(
    scheduleData: Omit<AuctionSchedule, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'executionHistory' | 'occurrenceCount'>
  ): Promise<AuctionSchedule> {
    const scheduleId = this.generateId();
    const now = new Date();

    const schedule: AuctionSchedule = {
      ...scheduleData,
      id: scheduleId,
      status: ScheduleStatus.PENDING,
      createdAt: now,
      updatedAt: now,
      executionHistory: [],
      recurrence: scheduleData.recurrence ? {
        ...scheduleData.recurrence,
        occurrenceCount: 0
      } : undefined
    };

    // Validate schedule
    this.validateSchedule(schedule);

    // Calculate next execution time
    schedule.nextExecution = this.calculateNextExecution(schedule);

    // Store schedule
    this.schedules.set(scheduleId, schedule);

    // Schedule execution if needed
    if (schedule.nextExecution) {
      this.scheduleExecution(scheduleId, schedule.nextExecution);
    }

    this.emit('scheduleCreated', schedule);
    return schedule;
  }

  async getSchedule(scheduleId: string): Promise<AuctionSchedule | null> {
    return this.schedules.get(scheduleId) || null;
  }

  async getSchedules(status?: ScheduleStatus): Promise<AuctionSchedule[]> {
    let schedules = Array.from(this.schedules.values());

    if (status) {
      schedules = schedules.filter(s => s.status === status);
    }

    return schedules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateSchedule(
    scheduleId: string,
    updates: Partial<AuctionSchedule>,
    updatedBy: string
  ): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    // Check if schedule can be updated
    if (schedule.status === ScheduleStatus.ACTIVE) {
      throw new Error('Cannot update active schedule');
    }

    Object.assign(schedule, updates);
    schedule.updatedAt = new Date();
    schedule.updatedBy = updatedBy;

    // Recalculate next execution
    schedule.nextExecution = this.calculateNextExecution(schedule);

    // Reschedule if needed
    this.rescheduleExecution(scheduleId, schedule.nextExecution);

    this.emit('scheduleUpdated', { scheduleId, updates, updatedBy });
    return true;
  }

  async deleteSchedule(scheduleId: string, deletedBy: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    // Cancel scheduled execution
    const job = this.scheduledJobs.get(scheduleId);
    if (job) {
      clearTimeout(job);
      this.scheduledJobs.delete(scheduleId);
    }

    // Remove schedule
    this.schedules.delete(scheduleId);

    this.emit('scheduleDeleted', { scheduleId, deletedBy });
    return true;
  }

  // Schedule Execution
  async executeSchedule(scheduleId: string, triggeredBy: TriggerType = TriggerType.MANUAL): Promise<ScheduleExecution> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const executionId = this.generateId();
    const startTime = Date.now();

    const execution: ScheduleExecution = {
      id: executionId,
      scheduleId,
      executionTime: new Date(),
      status: 'success',
      auctionsCreated: [],
      errors: [],
      duration: 0,
      triggeredBy,
      metadata: {}
    };

    try {
      // Check conditions if conditional trigger
      if (schedule.trigger && schedule.trigger.type === TriggerType.CONDITION_BASED) {
        const conditionsMet = await this.evaluateConditions(schedule.trigger.conditions);
        if (!conditionsMet) {
          execution.status = 'failed';
          execution.errors.push({
            id: this.generateId(),
            type: 'execution',
            severity: 'medium',
            message: 'Trigger conditions not met',
            timestamp: new Date(),
            resolved: false
          });
          throw new Error('Conditions not met');
        }
      }

      // Create auctions based on template
      const auctionsCreated = await this.createAuctionsFromTemplate(schedule.auctionTemplate);
      execution.auctionsCreated = auctionsCreated;

      // Update schedule
      schedule.lastExecuted = new Date();
      schedule.executionHistory.push(execution);

      // Handle recurrence
      if (schedule.recurrence) {
        schedule.recurrence.occurrenceCount++;
        
        // Check if we should continue recurring
        const shouldContinue = this.shouldContinueRecurrence(schedule);
        if (shouldContinue) {
          schedule.nextExecution = this.calculateNextExecution(schedule);
          this.scheduleExecution(scheduleId, schedule.nextExecution);
        } else {
          schedule.status = ScheduleStatus.COMPLETED;
        }
      } else {
        schedule.status = ScheduleStatus.COMPLETED;
      }

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push({
        id: this.generateId(),
        type: 'execution',
        severity: 'high',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        resolved: false
      });

      // Handle retry logic
      if (this.config.autoRetry && schedule.executionSettings.retryAttempts > 0) {
        schedule.executionSettings.retryAttempts--;
        const retryTime = new Date(Date.now() + schedule.executionSettings.retryDelay * 60 * 1000);
        this.scheduleExecution(scheduleId, retryTime);
      } else {
        schedule.status = ScheduleStatus.FAILED;
      }
    }

    execution.duration = Date.now() - startTime;
    this.executions.set(executionId, execution);

    this.emit('scheduleExecuted', { schedule, execution });
    return execution;
  }

  async getExecution(executionId: string): Promise<ScheduleExecution | null> {
    return this.executions.get(executionId) || null;
  }

  async getScheduleExecutions(scheduleId: string): Promise<ScheduleExecution[]> {
    return Array.from(this.executions.values())
      .filter(execution => execution.scheduleId === scheduleId)
      .sort((a, b) => b.executionTime.getTime() - a.executionTime.getTime());
  }

  // Template Management
  async createTemplate(templateData: Omit<AuctionTemplate, 'id'>): Promise<AuctionTemplate> {
    const template: AuctionTemplate = {
      ...templateData,
      id: this.generateId()
    };

    this.emit('templateCreated', template);
    return template;
  }

  async getTemplate(templateId: string): Promise<AuctionTemplate | null> {
    // Placeholder - would fetch from template storage
    return null;
  }

  // Condition Evaluation
  private async evaluateConditions(conditions: ScheduleCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: ScheduleCondition): Promise<boolean> {
    switch (condition.type) {
      case 'time_of_day':
        const currentHour = new Date().getHours();
        return this.compareValues(currentHour, condition.operator, condition.value);
      
      case 'day_of_week':
        const currentDay = new Date().getDay();
        return this.compareValues(currentDay, condition.operator, condition.value);
      
      case 'market_price':
        // Placeholder - would fetch current market price
        const marketPrice = 1000; // Example
        return this.compareValues(marketPrice, condition.operator, condition.value);
      
      case 'user_count':
        // Placeholder - would fetch current user count
        const userCount = 100; // Example
        return this.compareValues(userCount, condition.operator, condition.value);
      
      default:
        return true;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'between':
        return Array.isArray(expected) && actual >= expected[0] && actual <= expected[1];
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected);
      default:
        return false;
    }
  }

  // Utility Methods
  private validateSchedule(schedule: AuctionSchedule): void {
    if (!schedule.name || schedule.name.trim().length === 0) {
      throw new Error('Schedule name is required');
    }

    if (!schedule.auctionTemplate) {
      throw new Error('Auction template is required');
    }

    if (schedule.startTime <= new Date()) {
      throw new Error('Start time must be in the future');
    }

    if (schedule.recurrence && !this.config.enableRecurrence) {
      throw new Error('Recurrence is disabled');
    }

    if (schedule.trigger && schedule.trigger.type === TriggerType.CONDITION_BASED && !this.config.enableConditionalTriggers) {
      throw new Error('Conditional triggers are disabled');
    }

    // Validate recurrence
    if (schedule.recurrence) {
      if (schedule.recurrence.maxOccurrences && schedule.recurrence.maxOccurrences > this.config.maxRecurrenceOccurrences) {
        throw new Error(`Maximum recurrence occurrences is ${this.config.maxRecurrenceOccurrences}`);
      }
    }
  }

  private calculateNextExecution(schedule: AuctionSchedule): Date | undefined {
    if (schedule.type === ScheduleType.IMMEDIATE) {
      return new Date();
    }

    if (schedule.type === ScheduleType.SCHEDULED) {
      return schedule.startTime;
    }

    if (schedule.type === ScheduleType.RECURRING && schedule.recurrence) {
      return this.calculateNextRecurrence(schedule);
    }

    return undefined;
  }

  private calculateNextRecurrence(schedule: AuctionSchedule): Date | undefined {
    if (!schedule.recurrence) return undefined;

    const baseTime = schedule.lastExecuted || schedule.startTime;
    const nextTime = new Date(baseTime);

    switch (schedule.recurrence.pattern) {
      case RecurrencePattern.DAILY:
        nextTime.setDate(nextTime.getDate() + schedule.recurrence.interval);
        break;
      
      case RecurrencePattern.WEEKLY:
        nextTime.setDate(nextTime.getDate() + (schedule.recurrence.interval * 7));
        break;
      
      case RecurrencePattern.MONTHLY:
        nextTime.setMonth(nextTime.getMonth() + schedule.recurrence.interval);
        break;
      
      case RecurrencePattern.QUARTERLY:
        nextTime.setMonth(nextTime.getMonth() + (schedule.recurrence.interval * 3));
        break;
      
      case RecurrencePattern.YEARLY:
        nextTime.setFullYear(nextTime.getFullYear() + schedule.recurrence.interval);
        break;
      
      default:
        return undefined;
    }

    // Check if we've exceeded the end date or max occurrences
    if (schedule.recurrence.endDate && nextTime > schedule.recurrence.endDate) {
      return undefined;
    }

    if (schedule.recurrence.maxOccurrences && 
        schedule.recurrence.occurrenceCount >= schedule.recurrence.maxOccurrences) {
      return undefined;
    }

    return nextTime;
  }

  private shouldContinueRecurrence(schedule: AuctionSchedule): boolean {
    if (!schedule.recurrence) return false;

    if (schedule.recurrence.endDate && new Date() > schedule.recurrence.endDate) {
      return false;
    }

    if (schedule.recurrence.maxOccurrences && 
        schedule.recurrence.occurrenceCount >= schedule.recurrence.maxOccurrences) {
      return false;
    }

    return true;
  }

  private async createAuctionsFromTemplate(template: AuctionTemplate): Promise<string[]> {
    // Placeholder implementation
    // In a real implementation, you would:
    // - Process template placeholders
    // - Create auction instances
    // - Validate and store auctions
    // - Return list of created auction IDs
    
    const auctionId = this.generateId();
    return [auctionId];
  }

  private scheduleExecution(scheduleId: string, executionTime: Date): void {
    const delay = executionTime.getTime() - Date.now();
    if (delay <= 0) return;

    const job = setTimeout(async () => {
      await this.executeSchedule(scheduleId, TriggerType.TIME_BASED);
      this.scheduledJobs.delete(scheduleId);
    }, delay);

    this.scheduledJobs.set(scheduleId, job);
  }

  private rescheduleExecution(scheduleId: string, executionTime?: Date): void {
    // Cancel existing job
    const existingJob = this.scheduledJobs.get(scheduleId);
    if (existingJob) {
      clearTimeout(existingJob);
    }

    // Schedule new job if time provided
    if (executionTime) {
      this.scheduleExecution(scheduleId, executionTime);
    }
  }

  // Statistics and Monitoring
  async getScheduleStats(): Promise<ScheduleStats> {
    const schedules = Array.from(this.schedules.values());
    const executions = Array.from(this.executions.values());

    const activeSchedules = schedules.filter(s => s.status === ScheduleStatus.ACTIVE).length;
    const completedExecutions = executions.filter(e => e.status === 'success').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    
    const averageExecutionTime = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
      : 0;
    
    const successRate = executions.length > 0 ? completedExecutions / executions.length : 0;
    
    const auctionsCreated = executions.reduce((sum, e) => sum + e.auctionsCreated.length, 0);

    // Upcoming executions
    const upcomingExecutions = schedules
      .filter(s => s.nextExecution && s.nextExecution > new Date())
      .map(s => ({
        scheduleId: s.id,
        scheduleName: s.name,
        nextExecution: s.nextExecution!
      }))
      .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime())
      .slice(0, 10);

    // Execution trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentExecutions = executions.filter(e => e.executionTime >= thirtyDaysAgo);
    
    const executionTrends = this.calculateExecutionTrends(recentExecutions);

    return {
      totalSchedules: schedules.length,
      activeSchedules,
      completedExecutions,
      failedExecutions,
      averageExecutionTime,
      successRate,
      auctionsCreated,
      upcomingExecutions,
      executionTrends
    };
  }

  private calculateExecutionTrends(executions: ScheduleExecution[]): ScheduleStats['executionTrends'] {
    const dailyData = new Map<string, { executions: number; successes: number; failures: number }>();

    for (const execution of executions) {
      const dateKey = execution.executionTime.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { executions: 0, successes: 0, failures: 0 };
      
      existing.executions++;
      if (execution.status === 'success') {
        existing.successes++;
      } else if (execution.status === 'failed') {
        existing.failures++;
      }
      
      dailyData.set(dateKey, existing);
    }

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        ...data
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private generateId(): string {
    return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Reschedule all active schedules
    for (const schedule of this.schedules.values()) {
      if (schedule.status === ScheduleStatus.PENDING || schedule.status === ScheduleStatus.ACTIVE) {
        if (schedule.nextExecution && schedule.nextExecution > new Date()) {
          this.scheduleExecution(schedule.id, schedule.nextExecution);
        }
      }
    }

    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Cancel all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      clearTimeout(job);
    }
    this.scheduledJobs.clear();

    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const stats = await this.getScheduleStats();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (stats.successRate < 0.8) {
      status = 'unhealthy';
    } else if (stats.successRate < 0.95) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        totalSchedules: stats.totalSchedules,
        activeSchedules: stats.activeSchedules,
        successRate: Math.round(stats.successRate * 100),
        scheduledJobs: this.scheduledJobs.size,
        isRunning: this.isRunning
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        schedules: Array.from(this.schedules.values()),
        executions: Array.from(this.executions.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for schedules
      const headers = [
        'ID', 'Name', 'Type', 'Status', 'Start Time', 'Next Execution',
        'Created By', 'Created At', 'Last Executed'
      ];
      
      const rows = Array.from(this.schedules.values()).map(s => [
        s.id,
        s.name,
        s.type,
        s.status,
        s.startTime.toISOString(),
        s.nextExecution?.toISOString() || '',
        s.createdBy,
        s.createdAt.toISOString(),
        s.lastExecuted?.toISOString() || ''
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
