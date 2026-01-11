import { EventEmitter } from 'events';
import { NotificationChannel, NotificationType } from './notificationEngine';

export enum PreferenceLevel {
  GLOBAL = 'global',
  CATEGORY = 'category',
  CHANNEL = 'channel',
  TYPE = 'type'
}

export enum FrequencyPreference {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

export interface UserPreference {
  id: string;
  userId: string;
  level: PreferenceLevel;
  channel?: NotificationChannel;
  type?: NotificationType;
  category?: string;
  enabled: boolean;
  frequency: FrequencyPreference;
  quietHours?: QuietHours;
  limits?: NotificationLimits;
  customRules: PreferenceRule[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuietHours {
  enabled: boolean;
  timezone: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  weekends: boolean;
  holidays: boolean;
  urgentOnly: boolean;
}

export interface NotificationLimits {
  perDay?: number;
  perWeek?: number;
  perMonth?: number;
  perHour?: number;
}

export interface PreferenceRule {
  id: string;
  name: string;
  description: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  action: 'allow' | 'block' | 'delay' | 'transform';
  delayMinutes?: number;
  transformConfig?: Record<string, any>;
  priority: number;
  isActive: boolean;
}

export interface PreferenceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preferences: Omit<UserPreference, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[];
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface PreferenceAnalytics {
  totalUsers: number;
  usersByChannel: Record<NotificationChannel, number>;
  usersByFrequency: Record<FrequencyPreference, number>;
  quietHoursUsage: number;
  customRulesUsage: number;
  preferenceChanges: Array<{
    userId: string;
    changeType: string;
    timestamp: Date;
  }>;
  channelPopularity: Array<{
    channel: NotificationChannel;
    enabledCount: number;
    disabledCount: number;
    percentage: number;
  }>;
  typePopularity: Array<{
    type: NotificationType;
    enabledCount: number;
    disabledCount: number;
    percentage: number;
  }>;
}

export interface PreferenceConfig {
  enableQuietHours: boolean;
  defaultQuietHours: QuietHours;
  enableLimits: boolean;
  defaultLimits: NotificationLimits;
  enableCustomRules: boolean;
  maxRulesPerUser: number;
  enableTemplates: boolean;
  defaultTemplate?: string;
  enableAnalytics: boolean;
  analyticsRetentionDays: number;
  enableBulkUpdates: boolean;
  bulkUpdateLimit: number;
}

export class NotificationPreferencesService extends EventEmitter {
  private preferences: Map<string, UserPreference> = new Map();
  private templates: Map<string, PreferenceTemplate> = new Map();
  private config: PreferenceConfig;
  private analytics: PreferenceAnalytics;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.analytics = this.initializeAnalytics();
    this.initializeDefaultTemplates();
    this.startAnalyticsUpdater();
  }

  private initializeDefaultConfig(): PreferenceConfig {
    return {
      enableQuietHours: true,
      defaultQuietHours: {
        enabled: false,
        timezone: 'UTC',
        startTime: '22:00',
        endTime: '08:00',
        weekends: false,
        holidays: false,
        urgentOnly: true
      },
      enableLimits: true,
      defaultLimits: {
        perDay: 50,
        perWeek: 200,
        perMonth: 500
      },
      enableCustomRules: true,
      maxRulesPerUser: 10,
      enableTemplates: true,
      enableAnalytics: true,
      analyticsRetentionDays: 90,
      enableBulkUpdates: true,
      bulkUpdateLimit: 100
    };
  }

  private initializeAnalytics(): PreferenceAnalytics {
    return {
      totalUsers: 0,
      usersByChannel: {
        email: 0,
        sms: 0,
        push: 0,
        webhook: 0,
        slack: 0,
        microsoft_teams: 0,
        discord: 0,
        in_app: 0
      },
      usersByFrequency: {
        immediate: 0,
        hourly: 0,
        daily: 0,
        weekly: 0,
        never: 0
      },
      quietHoursUsage: 0,
      customRulesUsage: 0,
      preferenceChanges: [],
      channelPopularity: [],
      typePopularity: []
    };
  }

  private initializeDefaultTemplates(): void {
    const templates: PreferenceTemplate[] = [
      {
        id: 'template_minimal',
        name: 'Minimal Notifications',
        description: 'Only essential notifications',
        category: 'minimal',
        preferences: [
          {
            level: PreferenceLevel.GLOBAL,
            enabled: true,
            frequency: FrequencyPreference.DAILY,
            quietHours: {
              enabled: true,
              timezone: 'UTC',
              startTime: '22:00',
              endTime: '08:00',
              weekends: true,
              holidays: true,
              urgentOnly: true
            },
            limits: {
              perDay: 5,
              perWeek: 20,
              perMonth: 50
            },
            customRules: [],
            metadata: {}
          },
          {
            level: PreferenceLevel.TYPE,
            type: NotificationType.MARKETING,
            enabled: false,
            frequency: FrequencyPreference.NEVER,
            metadata: {}
          }
        ],
        isActive: true,
        isDefault: false,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'template_business',
        name: 'Business Hours',
        description: 'Notifications during business hours only',
        category: 'business',
        preferences: [
          {
            level: PreferenceLevel.GLOBAL,
            enabled: true,
            frequency: FrequencyPreference.IMMEDIATE,
            quietHours: {
              enabled: true,
              timezone: 'UTC',
              startTime: '18:00',
              endTime: '09:00',
              weekends: true,
              holidays: true,
              urgentOnly: false
            },
            limits: {
              perDay: 25,
              perWeek: 100,
              perMonth: 300
            },
            customRules: [],
            metadata: {}
          }
        ],
        isActive: true,
        isDefault: false,
        createdBy: 'system',
        createdAt: new Date()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async setPreference(data: {
    userId: string;
    level: PreferenceLevel;
    channel?: NotificationChannel;
    type?: NotificationType;
    category?: string;
    enabled: boolean;
    frequency?: FrequencyPreference;
    quietHours?: QuietHours;
    limits?: NotificationLimits;
    customRules?: PreferenceRule[];
    metadata?: Record<string, any>;
  }): Promise<UserPreference> {
    const key = this.getPreferenceKey(data.userId, data.level, data.channel, data.type, data.category);
    
    const preference: UserPreference = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      level: data.level,
      channel: data.channel,
      type: data.type,
      category: data.category,
      enabled: data.enabled,
      frequency: data.frequency || FrequencyPreference.IMMEDIATE,
      quietHours: data.quietHours,
      limits: data.limits,
      customRules: data.customRules || [],
      metadata: data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate preference
    await this.validatePreference(preference);

    this.preferences.set(key, preference);
    this.updateAnalytics();
    this.emit('preferenceSet', preference);

    return preference;
  }

  async updatePreference(preferenceId: string, updates: Partial<UserPreference>): Promise<UserPreference | null> {
    let preference: UserPreference | undefined;
    
    for (const pref of this.preferences.values()) {
      if (pref.id === preferenceId) {
        preference = pref;
        break;
      }
    }

    if (!preference) return null;

    const updatedPreference = { 
      ...preference, 
      ...updates,
      updatedAt: new Date()
    };

    // Validate updated preference
    await this.validatePreference(updatedPreference);

    const key = this.getPreferenceKey(
      updatedPreference.userId,
      updatedPreference.level,
      updatedPreference.channel,
      updatedPreference.type,
      updatedPreference.category
    );

    this.preferences.set(key, updatedPreference);
    this.updateAnalytics();
    this.emit('preferenceUpdated', updatedPreference);

    return updatedPreference;
  }

  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const userPreferences: UserPreference[] = [];
    
    for (const preference of this.preferences.values()) {
      if (preference.userId === userId) {
        userPreferences.push(preference);
      }
    }

    return userPreferences.sort((a, b) => {
      const levelOrder = {
        [PreferenceLevel.GLOBAL]: 1,
        [PreferenceLevel.CATEGORY]: 2,
        [PreferenceLevel.CHANNEL]: 3,
        [PreferenceLevel.TYPE]: 4
      };
      return levelOrder[a.level] - levelOrder[b.level];
    });
  }

  async getEffectivePreference(
    userId: string,
    channel: NotificationChannel,
    type: NotificationType,
    category?: string
  ): Promise<UserPreference | null> {
    const userPreferences = await this.getUserPreferences(userId);
    
    // Find the most specific preference (in order of specificity)
    let effectivePreference: UserPreference | null = null;
    
    // Check type-specific preference
    const typePref = userPreferences.find(p => 
      p.level === PreferenceLevel.TYPE && 
      p.type === type
    );
    if (typePref) effectivePreference = typePref;
    
    // Check channel-specific preference
    const channelPref = userPreferences.find(p => 
      p.level === PreferenceLevel.CHANNEL && 
      p.channel === channel
    );
    if (channelPref) effectivePreference = channelPref;
    
    // Check category-specific preference
    if (category) {
      const categoryPref = userPreferences.find(p => 
        p.level === PreferenceLevel.CATEGORY && 
        p.category === category
      );
      if (categoryPref) effectivePreference = categoryPref;
    }
    
    // Fall back to global preference
    const globalPref = userPreferences.find(p => p.level === PreferenceLevel.GLOBAL);
    if (globalPref && !effectivePreference) effectivePreference = globalPref;
    
    return effectivePreference;
  }

  async shouldSendNotification(
    userId: string,
    channel: NotificationChannel,
    type: NotificationType,
    category?: string,
    priority?: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    delay?: number;
    transformed?: Record<string, any>;
  }> {
    const preference = await this.getEffectivePreference(userId, channel, type, category);
    
    if (!preference) {
      return { allowed: true };
    }
    
    // Check if notifications are enabled
    if (!preference.enabled) {
      return { allowed: false, reason: 'Notifications disabled' };
    }
    
    // Check quiet hours
    if (preference.quietHours?.enabled) {
      const inQuietHours = this.isInQuietHours(preference.quietHours);
      if (inQuietHours) {
        if (preference.quietHours.urgentOnly && priority === 'urgent') {
          // Allow urgent notifications during quiet hours
        } else {
          return { allowed: false, reason: 'Quiet hours active' };
        }
      }
    }
    
    // Check custom rules
    for (const rule of preference.customRules) {
      if (!rule.isActive) continue;
      
      const ruleResult = await this.evaluateRule(rule, { channel, type, category, priority });
      if (!ruleResult.matches) continue;
      
      switch (rule.action) {
        case 'block':
          return { allowed: false, reason: `Blocked by rule: ${rule.name}` };
        case 'delay':
          return { 
            allowed: true, 
            delay: rule.delayMinutes || 60,
            reason: `Delayed by rule: ${rule.name}`
          };
        case 'transform':
          return { 
            allowed: true, 
            transformed: rule.transformConfig,
            reason: `Transformed by rule: ${rule.name}`
          };
      }
    }
    
    return { allowed: true };
  }

  private isInQuietHours(quietHours: QuietHours): boolean {
    const now = new Date();
    
    // Convert to user's timezone
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: quietHours.timezone }));
    
    const currentTime = userTime.getHours() * 60 + userTime.getMinutes();
    const startTime = this.parseTime(quietHours.startTime);
    const endTime = this.parseTime(quietHours.endTime);
    
    // Check weekends
    if (quietHours.weekends && (userTime.getDay() === 0 || userTime.getDay() === 6)) {
      return true;
    }
    
    // Check time range
    if (startTime <= endTime) {
      // Same day range (e.g., 22:00 - 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      // Overnight range (e.g., 22:00 - 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async evaluateRule(
    rule: PreferenceRule,
    context: { channel: NotificationChannel; type: NotificationType; category?: string; priority?: string }
  ): Promise<{ matches: boolean; value?: any }> {
    const fieldValue = this.getFieldValue(rule.field, context);
    const ruleValue = rule.value;
    
    let matches = false;
    
    switch (rule.operator) {
      case 'equals':
        matches = fieldValue === ruleValue;
        break;
      case 'not_equals':
        matches = fieldValue !== ruleValue;
        break;
      case 'contains':
        matches = String(fieldValue).includes(String(ruleValue));
        break;
      case 'greater_than':
        matches = Number(fieldValue) > Number(ruleValue);
        break;
      case 'less_than':
        matches = Number(fieldValue) < Number(ruleValue);
        break;
      case 'in':
        matches = Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
        break;
      case 'not_in':
        matches = Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
        break;
    }
    
    return { matches };
  }

  private getFieldValue(field: string, context: any): any {
    const parts = field.split('.');
    let value = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private getPreferenceKey(
    userId: string,
    level: PreferenceLevel,
    channel?: NotificationChannel,
    type?: NotificationType,
    category?: string
  ): string {
    const parts = [userId, level];
    if (channel) parts.push(channel);
    if (type) parts.push(type);
    if (category) parts.push(category);
    return parts.join('_');
  }

  private async validatePreference(preference: UserPreference): Promise<void> {
    // Validate quiet hours
    if (preference.quietHours?.enabled) {
      const startTime = this.parseTime(preference.quietHours.startTime);
      const endTime = this.parseTime(preference.quietHours.endTime);
      
      if (startTime < 0 || startTime > 1439 || endTime < 0 || endTime > 1439) {
        throw new Error('Invalid quiet hours time format');
      }
    }
    
    // Validate limits
    if (preference.limits) {
      if (preference.limits.perDay && preference.limits.perDay < 0) {
        throw new Error('Daily limit must be positive');
      }
      if (preference.limits.perWeek && preference.limits.perWeek < 0) {
        throw new Error('Weekly limit must be positive');
      }
      if (preference.limits.perMonth && preference.limits.perMonth < 0) {
        throw new Error('Monthly limit must be positive');
      }
    }
    
    // Validate custom rules
    if (preference.customRules.length > this.config.maxRulesPerUser) {
      throw new Error(`Maximum ${this.config.maxRulesPerUser} custom rules allowed`);
    }
  }

  async applyTemplate(userId: string, templateId: string): Promise<UserPreference[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Remove existing preferences for this user
    const existingKeys: string[] = [];
    for (const [key, preference] of this.preferences.entries()) {
      if (preference.userId === userId) {
        existingKeys.push(key);
      }
    }
    
    existingKeys.forEach(key => this.preferences.delete(key));
    
    // Apply template preferences
    const newPreferences: UserPreference[] = [];
    for (const prefData of template.preferences) {
      const preference: UserPreference = {
        ...prefData,
        id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const key = this.getPreferenceKey(
        userId,
        preference.level,
        preference.channel,
        preference.type,
        preference.category
      );
      
      this.preferences.set(key, preference);
      newPreferences.push(preference);
    }
    
    this.updateAnalytics();
    this.emit('templateApplied', userId, templateId, newPreferences);
    
    return newPreferences;
  }

  private updateAnalytics(): void {
    const preferences = Array.from(this.preferences.values());
    const uniqueUsers = new Set(preferences.map(p => p.userId));
    
    this.analytics.totalUsers = uniqueUsers.size;
    
    // Channel popularity
    const channelStats = new Map<NotificationChannel, { enabled: number; disabled: number }>();
    preferences.forEach(p => {
      if (p.channel) {
        const stats = channelStats.get(p.channel) || { enabled: 0, disabled: 0 };
        if (p.enabled) {
          stats.enabled++;
        } else {
          stats.disabled++;
        }
        channelStats.set(p.channel, stats);
      }
    });
    
    this.analytics.channelPopularity = Array.from(channelStats.entries()).map(([channel, stats]) => ({
      channel,
      enabledCount: stats.enabled,
      disabledCount: stats.disabled,
      percentage: (stats.enabled / (stats.enabled + stats.disabled)) * 100
    }));
    
    // Type popularity
    const typeStats = new Map<NotificationType, { enabled: number; disabled: number }>();
    preferences.forEach(p => {
      if (p.type) {
        const stats = typeStats.get(p.type) || { enabled: 0, disabled: 0 };
        if (p.enabled) {
          stats.enabled++;
        } else {
          stats.disabled++;
        }
        typeStats.set(p.type, stats);
      }
    });
    
    this.analytics.typePopularity = Array.from(typeStats.entries()).map(([type, stats]) => ({
      type,
      enabledCount: stats.enabled,
      disabledCount: stats.disabled,
      percentage: (stats.enabled / (stats.enabled + stats.disabled)) * 100
    }));
    
    // Quiet hours usage
    this.analytics.quietHoursUsage = preferences.filter(p => p.quietHours?.enabled).length;
    
    // Custom rules usage
    this.analytics.customRulesUsage = preferences.filter(p => p.customRules.length > 0).length;
  }

  private startAnalyticsUpdater(): void {
    setInterval(() => {
      this.updateAnalytics();
    }, 60000); // Update every minute
  }

  async getPreference(preferenceId: string): Promise<UserPreference | null> {
    for (const preference of this.preferences.values()) {
      if (preference.id === preferenceId) {
        return preference;
      }
    }
    return null;
  }

  async getTemplate(templateId: string): Promise<PreferenceTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getTemplates(): Promise<PreferenceTemplate[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getAnalytics(): Promise<PreferenceAnalytics> {
    this.updateAnalytics();
    return { ...this.analytics };
  }

  async updateConfig(updates: Partial<PreferenceConfig>): Promise<PreferenceConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<PreferenceConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalPreferences: number;
    totalUsers: number;
    lastUpdated: Date;
  }> {
    this.updateAnalytics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (this.analytics.totalUsers === 0) {
      status = 'warning';
    }

    return {
      status,
      totalPreferences: this.preferences.size,
      totalUsers: this.analytics.totalUsers,
      lastUpdated: new Date()
    };
  }
}
