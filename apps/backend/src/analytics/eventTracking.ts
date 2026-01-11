import { EventEmitter } from 'events';

export enum EventType {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTRATION = 'user_registration',
  USER_PROFILE_UPDATE = 'user_profile_update',
  USER_SETTINGS_CHANGE = 'user_settings_change',
  PAGE_VIEW = 'page_view',
  CLICK = 'click',
  FORM_SUBMIT = 'form_submit',
  DOWNLOAD = 'download',
  SEARCH = 'search',
  NOTIFICATION_SENT = 'notification_sent',
  NOTIFICATION_OPENED = 'notification_opened',
  NOTIFICATION_CLICKED = 'notification_clicked',
  ROOM_JOIN = 'room_join',
  ROOM_LEAVE = 'room_leave',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  FILE_UPLOAD = 'file_upload',
  FILE_DOWNLOAD = 'file_download',
  ERROR_OCCURRED = 'error_occurred',
  PERFORMANCE_METRIC = 'performance_metric',
  CUSTOM_EVENT = 'custom_event'
}

export enum EventCategory {
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  BUSINESS_EVENT = 'business_event',
  PERFORMANCE_EVENT = 'performance_event',
  ERROR_EVENT = 'error_event',
  SECURITY_EVENT = 'security_event'
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface TrackedEvent {
  id: string;
  type: EventType;
  category: EventCategory;
  severity: EventSeverity;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: EventMetadata;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  url?: string;
  duration?: number;
  value?: number;
  tags: string[];
  processed: boolean;
  processedAt?: Date;
}

export interface EventMetadata {
  source: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  platform: 'web' | 'mobile' | 'api' | 'desktop';
  correlationId?: string;
  parentId?: string;
  childIds: string[];
  experiment?: string;
  featureFlags: Record<string, boolean>;
  customDimensions: Record<string, any>;
}

export interface EventFilter {
  type?: EventType;
  category?: EventCategory;
  severity?: EventSeverity;
  userId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  customFilters?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: any;
  }>;
}

export interface EventAggregation {
  id: string;
  name: string;
  description: string;
  eventType: EventType;
  aggregationType: 'count' | 'sum' | 'average' | 'min' | 'max' | 'unique_count';
  timeWindow: number; // minutes
  groupBy?: string[];
  filters?: EventFilter[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByCategory: Record<EventCategory, number>;
  eventsBySeverity: Record<EventSeverity, number>;
  uniqueUsers: number;
  uniqueSessions: number;
  averageEventsPerSession: number;
  topEvents: Array<{
    type: EventType;
    count: number;
    percentage: number;
  }>;
  timeSeriesData: Array<{
    timestamp: Date;
    count: number;
    uniqueUsers: number;
  }>;
  userEngagement: {
    averageSessionDuration: number;
    bounceRate: number;
    retentionRate: number;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
  };
  performanceMetrics: {
    averagePageLoadTime: number;
    averageApiResponseTime: number;
    errorRate: number;
    conversionRate: number;
    throughput: number;
  };
}

export interface TrackingConfig {
  enablePersistence: boolean;
  storageLocation: string;
  batchSize: number;
  batchTimeout: number; // milliseconds
  enableRealTime: boolean;
  enableAggregation: boolean;
  enableSampling: boolean;
  samplingRate: number;
  enablePrivacy: boolean;
  privacySettings: {
    anonymizeIPs: boolean;
    hashUserIds: boolean;
    excludeSensitiveData: boolean;
    retentionDays: number;
  };
  enableValidation: boolean;
  validationRules: ValidationRule[];
  enableEnrichment: boolean;
  enrichmentServices: EnrichmentService[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'enum';
  config: Record<string, any>;
  errorMessage: string;
}

export interface EnrichmentService {
  name: string;
  type: 'geolocation' | 'user_agent' | 'device_detection' | 'session_reconstruction';
  config: Record<string, any>;
  isActive: boolean;
}

export class EventTrackingService extends EventEmitter {
  private events: TrackedEvent[] = [];
  private aggregations: Map<string, EventAggregation> = new Map();
  private config: TrackingConfig;
  private metrics: EventMetrics;
  private batchProcessor?: NodeJS.Timeout;
  private metricsUpdater?: NodeJS.Timeout;
  private eventBuffer: TrackedEvent[] = [];

  constructor(config: TrackingConfig) {
    super();
    this.config = this.validateConfig(config);
    this.metrics = this.initializeMetrics();
    this.startBatchProcessor();
    this.startMetricsUpdater();
  }

  private validateConfig(config: TrackingConfig): TrackingConfig {
    return {
      enablePersistence: config.enablePersistence !== false,
      storageLocation: config.storageLocation || './event_data',
      batchSize: config.batchSize || 1000,
      batchTimeout: config.batchTimeout || 5000,
      enableRealTime: config.enableRealTime !== false,
      enableAggregation: config.enableAggregation !== false,
      enableSampling: config.enableSampling || false,
      samplingRate: config.samplingRate || 1.0,
      enablePrivacy: config.enablePrivacy !== false,
      privacySettings: {
        anonymizeIPs: config.privacySettings?.anonymizeIPs || false,
        hashUserIds: config.privacySettings?.hashUserIds || false,
        excludeSensitiveData: config.privacySettings?.excludeSensitiveData || false,
        retentionDays: config.privacySettings?.retentionDays || 90
      },
      enableValidation: config.enableValidation !== false,
      validationRules: config.validationRules || [],
      enableEnrichment: config.enableEnrichment !== false,
      enrichmentServices: config.enrichmentServices || []
    };
  }

  private initializeMetrics(): EventMetrics {
    return {
      totalEvents: 0,
      eventsByType: {
        user_login: 0,
        user_logout: 0,
        user_registration: 0,
        user_profile_update: 0,
        user_settings_change: 0,
        page_view: 0,
        click: 0,
        form_submit: 0,
        download: 0,
        search: 0,
        notification_sent: 0,
        notification_opened: 0,
        notification_clicked: 0,
        room_join: 0,
        room_leave: 0,
        message_sent: 0,
        message_received: 0,
        file_upload: 0,
        file_download: 0,
        error_occurred: 0,
        performance_metric: 0,
        custom_event: 0
      },
      eventsByCategory: {
        user_action: 0,
        system_event: 0,
        business_event: 0,
        performance_event: 0,
        error_event: 0,
        security_event: 0
      },
      eventsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      uniqueUsers: 0,
      uniqueSessions: 0,
      averageEventsPerSession: 0,
      topEvents: [],
      timeSeriesData: [],
      userEngagement: {
        averageSessionDuration: 0,
        bounceRate: 0,
        retentionRate: 0,
        activeUsers: 0,
        newUsers: 0,
        returningUsers: 0
      },
      performanceMetrics: {
        averagePageLoadTime: 0,
        averageApiResponseTime: 0,
        errorRate: 0,
        conversionRate: 0,
        throughput: 0
      }
    };
  }

  async trackEvent(data: {
    type: EventType;
    category: EventCategory;
    severity?: EventSeverity;
    userId?: string;
    sessionId?: string;
    data: Record<string, any>;
    metadata?: Partial<EventMetadata>;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    url?: string;
    duration?: number;
    value?: number;
    tags?: string[];
  }): Promise<TrackedEvent> {
    // Apply sampling if enabled
    if (this.config.enableSampling && Math.random() > this.config.samplingRate) {
      throw new Error('Event sampled out');
    }

    // Validate event data
    if (this.config.enableValidation) {
      this.validateEventData(data);
    }

    const event: TrackedEvent = {
      id: this.generateEventId(),
      type: data.type,
      category: data.category,
      severity: data.severity || EventSeverity.LOW,
      userId: this.applyPrivacySettings('userId', data.userId),
      sessionId: this.applyPrivacySettings('sessionId', data.sessionId),
      timestamp: new Date(),
      data: this.applyPrivacySettings('data', data.data),
      metadata: {
        source: data.metadata?.source || 'client',
        version: data.metadata?.version || '1.0.0',
        environment: data.metadata?.environment || 'production',
        platform: data.metadata?.platform || 'web',
        correlationId: data.metadata?.correlationId,
        parentId: data.metadata?.parentId,
        childIds: data.metadata?.childIds || [],
        experiment: data.metadata?.experiment,
        featureFlags: data.metadata?.featureFlags || {},
        customDimensions: data.metadata?.customDimensions || {}
      },
      ipAddress: this.applyPrivacySettings('ipAddress', data.ipAddress),
      userAgent: data.userAgent,
      referrer: data.referrer,
      url: data.url,
      duration: data.duration,
      value: data.value,
      tags: data.tags || [],
      processed: false
    };

    // Apply enrichment if enabled
    if (this.config.enableEnrichment) {
      await this.enrichEvent(event);
    }

    // Add to buffer or process immediately
    if (this.config.enableRealTime) {
      this.eventBuffer.push(event);
      if (this.eventBuffer.length >= this.config.batchSize) {
        await this.processBatch();
      }
    } else {
      this.events.push(event);
      this.updateMetrics();
    }

    this.emit('eventTracked', event);
    return event;
  }

  private validateEventData(data: any): void {
    for (const rule of this.config.validationRules) {
      this.applyValidationRule(data, rule);
    }
  }

  private applyValidationRule(data: any, rule: ValidationRule): void {
    const fieldValue = this.getNestedValue(data, rule.field);
    
    switch (rule.type) {
      case 'required':
        if (!fieldValue || fieldValue === '') {
          throw new Error(`Required field '${rule.field}' is missing or empty`);
        }
        break;
      case 'format':
        const pattern = new RegExp(rule.config.pattern);
        if (!pattern.test(fieldValue)) {
          throw new Error(`Field '${rule.field}' does not match required format: ${rule.errorMessage}`);
        }
        break;
      case 'range':
        const numValue = Number(fieldValue);
        if (numValue < rule.config.min || numValue > rule.config.max) {
          throw new Error(`Field '${rule.field}' is out of valid range: ${rule.errorMessage}`);
        }
        break;
      case 'enum':
        if (!rule.config.values.includes(fieldValue)) {
          throw new Error(`Field '${rule.field}' is not a valid enum value: ${rule.errorMessage}`);
        }
        break;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private async enrichEvent(event: TrackedEvent): Promise<void> {
    for (const service of this.config.enrichmentServices) {
      if (!service.isActive) continue;

      switch (service.type) {
        case 'geolocation':
          if (event.ipAddress) {
            event.metadata.customDimensions.geolocation = await this.enrichGeolocation(event.ipAddress);
          }
          break;
        case 'user_agent':
          if (event.userAgent) {
            event.metadata.customDimensions.userAgentInfo = await this.enrichUserAgent(event.userAgent);
          }
          break;
        case 'device_detection':
          event.metadata.customDimensions.deviceInfo = await this.enrichDevice(event.userAgent);
          break;
        case 'session_reconstruction':
          if (event.userId) {
            event.metadata.customDimensions.sessionInfo = await this.enrichSession(event.userId);
          }
          break;
      }
    }
  }

  private async enrichGeolocation(ipAddress: string): Promise<any> {
    // Simulate geolocation lookup
    return {
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    };
  }

  private async enrichUserAgent(userAgent: string): Promise<any> {
    // Simulate user agent parsing
    return {
      browser: 'Chrome',
      version: '91.0.4472.124',
      os: 'Windows',
      osVersion: '10',
      device: 'Desktop'
    };
  }

  private async enrichDevice(userAgent: string): Promise<any> {
    // Simulate device detection
    return {
      type: 'desktop',
      brand: 'Unknown',
      model: 'Unknown'
    };
  }

  private async enrichSession(userId: string): Promise<any> {
    // Simulate session reconstruction
    return {
      sessionCount: 5,
      averageDuration: 1800,
      lastSeen: new Date()
    };
  }

  private applyPrivacySettings(field: string, value: any): any {
    if (!this.config.enablePrivacy) return value;

    switch (field) {
      case 'userId':
        return this.config.privacySettings.hashUserIds ? this.hashValue(value) : value;
      case 'ipAddress':
        return this.config.privacySettings.anonymizeIPs ? this.anonymizeIP(value) : value;
      case 'sessionId':
        return this.config.privacySettings.hashUserIds ? this.hashValue(value) : value;
      case 'data':
        return this.config.privacySettings.excludeSensitiveData ? this.filterSensitiveData(value) : value;
      default:
        return value;
    }
  }

  private hashValue(value: string): string {
    // Simple hash implementation
    return `hashed_${value.length}`;
  }

  private anonymizeIP(ip: string): string {
    // Simple IP anonymization
    const parts = ip.split('.');
    if (parts.length >= 3) {
      parts[2] = 'xxx';
    }
    return parts.join('.');
  }

  private filterSensitiveData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card', 'ssn'];
    const filtered = { ...data };

    for (const field of sensitiveFields) {
      if (field in filtered) {
        filtered[field] = '[FILTERED]';
      }
    }

    return filtered;
  }

  private startBatchProcessor(): void {
    this.batchProcessor = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.processBatch();
      }
    }, this.config.batchTimeout);
  }

  private async processBatch(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const batch = this.eventBuffer.splice(0, this.config.batchSize);
    
    try {
      // Process events for aggregations
      if (this.config.enableAggregation) {
        await this.updateAggregations(batch);
      }

      // Mark events as processed
      batch.forEach(event => {
        event.processed = true;
        event.processedAt = new Date();
      });

      // Add to main events array
      this.events.push(...batch);

      // Persist if enabled
      if (this.config.enablePersistence) {
        await this.persistEvents(batch);
      }

      this.updateMetrics();
      this.emit('batchProcessed', batch);

    } catch (error) {
      this.emit('batchError', batch, error);
    }
  }

  private async updateAggregations(events: TrackedEvent[]): Promise<void> {
    for (const aggregation of this.aggregations.values()) {
      if (!aggregation.isActive) continue;

      const filteredEvents = this.filterEventsForAggregation(events, aggregation);
      const result = this.calculateAggregation(filteredEvents, aggregation);

      // Store aggregation result
      this.emit('aggregationUpdated', aggregation.id, result);
    }
  }

  private filterEventsForAggregation(events: TrackedEvent[], aggregation: EventAggregation): TrackedEvent[] {
    let filteredEvents = events;

    // Apply time window filter
    if (aggregation.timeWindow) {
      const cutoff = new Date(Date.now() - aggregation.timeWindow * 60 * 1000);
      filteredEvents = filteredEvents.filter(event => event.timestamp >= cutoff);
    }

    // Apply custom filters
    if (aggregation.filters) {
      filteredEvents = filteredEvents.filter(event => 
        this.passesEventFilters(event, aggregation.filters!)
      );
    }

    // Filter by event type
    if (aggregation.eventType) {
      filteredEvents = filteredEvents.filter(event => event.type === aggregation.eventType);
    }

    return filteredEvents;
  }

  private passesEventFilters(event: TrackedEvent, filters: EventFilter[]): boolean {
    return filters.every(filter => {
      if (filter.type && event.type !== filter.type) return false;
      if (filter.category && event.category !== filter.category) return false;
      if (filter.severity && event.severity !== filter.severity) return false;
      if (filter.userId && event.userId !== filter.userId) return false;
      if (filter.sessionId && event.sessionId !== filter.sessionId) return false;
      if (filter.startDate && event.timestamp < filter.startDate) return false;
      if (filter.endDate && event.timestamp > filter.endDate) return false;
      if (filter.tags && !filter.tags.some(tag => event.tags.includes(tag))) return false;

      if (filter.customFilters) {
        return filter.customFilters.every(customFilter => {
          const fieldValue = this.getNestedValue(event, customFilter.field);
          return this.evaluateFilterCondition(fieldValue, customFilter);
        });
      }

      return true;
    });
  }

  private evaluateFilterCondition(fieldValue: any, filter: any): boolean {
    switch (filter.operator) {
      case 'equals':
        return fieldValue === filter.value;
      case 'not_equals':
        return fieldValue !== filter.value;
      case 'contains':
        return String(fieldValue).includes(String(filter.value));
      case 'greater_than':
        return Number(fieldValue) > Number(filter.value);
      case 'less_than':
        return Number(fieldValue) < Number(filter.value);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
      default:
        return true;
    }
  }

  private calculateAggregation(events: TrackedEvent[], aggregation: EventAggregation): any {
    switch (aggregation.aggregationType) {
      case 'count':
        return events.length;
      case 'sum':
        return events.reduce((sum, event) => sum + (event.value || 0), 0);
      case 'average':
        const values = events.map(event => event.value || 0);
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      case 'min':
        const values = events.map(event => event.value || 0);
        return values.length > 0 ? Math.min(...values) : 0;
      case 'max':
        const values = events.map(event => event.value || 0);
        return values.length > 0 ? Math.max(...values) : 0;
      case 'unique_count':
        const uniqueValues = new Set(events.map(event => event.userId));
        return uniqueValues.size;
      default:
        return null;
    }
  }

  private async persistEvents(events: TrackedEvent[]): Promise<void> {
    // Simulate persistence to database or file system
    console.log(`Persisting ${events.length} events to ${this.config.storageLocation}`);
  }

  private startMetricsUpdater(): void {
    this.metricsUpdater = setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  private updateMetrics(): void {
    this.metrics.totalEvents = this.events.length;

    // Count events by type
    this.metrics.eventsByType = {
      user_login: this.events.filter(e => e.type === EventType.USER_LOGIN).length,
      user_logout: this.events.filter(e => e.type === EventType.USER_LOGOUT).length,
      user_registration: this.events.filter(e => e.type === EventType.USER_REGISTRATION).length,
      user_profile_update: this.events.filter(e => e.type === EventType.USER_PROFILE_UPDATE).length,
      user_settings_change: this.events.filter(e => e.type === EventType.USER_SETTINGS_CHANGE).length,
      page_view: this.events.filter(e => e.type === EventType.PAGE_VIEW).length,
      click: this.events.filter(e => e.type === EventType.CLICK).length,
      form_submit: this.events.filter(e => e.type === EventType.FORM_SUBMIT).length,
      download: this.events.filter(e => e.type === EventType.DOWNLOAD).length,
      search: this.events.filter(e => e.type === EventType.SEARCH).length,
      notification_sent: this.events.filter(e => e.type === EventType.NOTIFICATION_SENT).length,
      notification_opened: this.events.filter(e => e.type === EventType.NOTIFICATION_OPENED).length,
      notification_clicked: this.events.filter(e => e.type === EventType.NOTIFICATION_CLICKED).length,
      room_join: this.events.filter(e => e.type === EventType.ROOM_JOIN).length,
      room_leave: this.events.filter(e => e.type === EventType.ROOM_LEAVE).length,
      message_sent: this.events.filter(e => e.type === EventType.MESSAGE_SENT).length,
      message_received: this.events.filter(e => e.type === EventType.MESSAGE_RECEIVED).length,
      file_upload: this.events.filter(e => e.type === EventType.FILE_UPLOAD).length,
      file_download: this.events.filter(e => e.type === EventType.FILE_DOWNLOAD).length,
      error_occurred: this.events.filter(e => e.type === EventType.ERROR_OCCURRED).length,
      performance_metric: this.events.filter(e => e.type === EventType.PERFORMANCE_METRIC).length,
      custom_event: this.events.filter(e => e.type === EventType.CUSTOM_EVENT).length
    };

    // Count events by category
    this.metrics.eventsByCategory = {
      user_action: this.events.filter(e => e.category === EventCategory.USER_ACTION).length,
      system_event: this.events.filter(e => e.category === EventCategory.SYSTEM_EVENT).length,
      business_event: this.events.filter(e => e.category === EventCategory.BUSINESS_EVENT).length,
      performance_event: this.events.filter(e => e.category === EventCategory.PERFORMANCE_EVENT).length,
      error_event: this.events.filter(e => e.category === EventCategory.ERROR_EVENT).length,
      security_event: this.events.filter(e => e.category === EventCategory.SECURITY_EVENT).length
    };

    // Count events by severity
    this.metrics.eventsBySeverity = {
      low: this.events.filter(e => e.severity === EventSeverity.LOW).length,
      medium: this.events.filter(e => e.severity === EventSeverity.MEDIUM).length,
      high: this.events.filter(e => e.severity === EventSeverity.HIGH).length,
      critical: this.events.filter(e => e.severity === EventSeverity.CRITICAL).length
    };

    // Calculate unique users and sessions
    const uniqueUsers = new Set(this.events.map(e => e.userId).filter(Boolean));
    const uniqueSessions = new Set(this.events.map(e => e.sessionId).filter(Boolean));
    this.metrics.uniqueUsers = uniqueUsers.size;
    this.metrics.uniqueSessions = uniqueSessions.size;

    // Calculate average events per session
    this.metrics.averageEventsPerSession = uniqueSessions.size > 0 ? this.events.length / uniqueSessions.size : 0;

    // Calculate top events
    const eventTypeCounts = new Map<EventType, number>();
    this.events.forEach(event => {
      eventTypeCounts.set(event.type, (eventTypeCounts.get(event.type) || 0) + 1);
    });

    this.metrics.topEvents = Array.from(eventTypeCounts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / this.events.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Update time series data
    const now = new Date();
    this.metrics.timeSeriesData.push({
      timestamp: now,
      count: this.events.filter(e => 
        e.timestamp >= new Date(now.getTime() - 60000) // Last minute
      ).length,
      uniqueUsers: uniqueUsers.size
    });

    // Keep only last 24 hours of time series data
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.metrics.timeSeriesData = this.metrics.timeSeriesData.filter(
      data => data.timestamp >= cutoff
    );
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  async createAggregation(data: {
    name: string;
    description: string;
    eventType: EventType;
    aggregationType: 'count' | 'sum' | 'average' | 'min' | 'max' | 'unique_count';
    timeWindow: number;
    groupBy?: string[];
    filters?: EventFilter[];
  }): Promise<EventAggregation> {
    const aggregation: EventAggregation = {
      id: this.generateAggregationId(),
      name: data.name,
      description: data.description,
      eventType: data.eventType,
      aggregationType: data.aggregationType,
      timeWindow: data.timeWindow,
      groupBy: data.groupBy,
      filters: data.filters || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.aggregations.set(aggregation.id, aggregation);
    this.emit('aggregationCreated', aggregation);

    return aggregation;
  }

  async getEvents(filters?: EventFilter): Promise<TrackedEvent[]> {
    let events = [...this.events];

    if (filters) {
      if (filters.type) {
        events = events.filter(e => e.type === filters.type);
      }
      if (filters.category) {
        events = events.filter(e => e.category === filters.category);
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.sessionId) {
        events = events.filter(e => e.sessionId === filters.sessionId);
      }
      if (filters.startDate) {
        events = events.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(e => e.timestamp <= filters.endDate!);
      }
      if (filters.tags && filters.tags.length > 0) {
        events = events.filter(e => 
          filters.tags!.some(tag => e.tags.includes(tag))
        );
      }
      if (filters.customFilters) {
        events = events.filter(e => 
          this.passesEventFilters(e, filters.customFilters)
        );
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAggregation(aggregationId: string): Promise<EventAggregation | null> {
    return this.aggregations.get(aggregationId) || null;
  }

  async getAggregations(filters?: {
    eventType?: EventType;
    isActive?: boolean;
  }): Promise<EventAggregation[]> {
    let aggregations = Array.from(this.aggregations.values());

    if (filters) {
      if (filters.eventType) {
        aggregations = aggregations.filter(a => a.eventType === filters.eventType);
      }
      if (filters.isActive !== undefined) {
        aggregations = aggregations.filter(a => a.isActive === filters.isActive);
      }
    }

    return aggregations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMetrics(): Promise<EventMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<TrackingConfig>): Promise<TrackingConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<TrackingConfig> {
    return { ...this.config };
  }

  async shutdown(): Promise<void> {
    // Process any remaining events in buffer
    if (this.eventBuffer.length > 0) {
      await this.processBatch();
    }

    // Clear intervals
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
    }
    if (this.metricsUpdater) {
      clearInterval(this.metricsUpdater);
    }

    this.emit('shutdown');
  }

  private generateAggregationId(): string {
    return `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
