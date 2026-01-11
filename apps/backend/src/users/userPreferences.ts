import { EventEmitter } from 'events';

// Enums
export enum PreferenceType {
  NOTIFICATION = 'notification',
  PRIVACY = 'privacy',
  DISPLAY = 'display',
  LANGUAGE = 'language',
  CURRENCY = 'currency',
  TIMEZONE = 'timezone',
  SECURITY = 'security',
  TRADING = 'trading'
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private'
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

// Interfaces
export interface UserPreferences {
  id: string;
  userId: string;
  
  // Notification Preferences
  notifications: NotificationPreferences;
  
  // Privacy Preferences
  privacy: PrivacyPreferences;
  
  // Display Preferences
  display: DisplayPreferences;
  
  // Localization Preferences
  localization: LocalizationPreferences;
  
  // Security Preferences
  security: SecurityPreferences;
  
  // Trading Preferences
  trading: TradingPreferences;
  
  // Custom Preferences
  custom: Record<string, any>;
  
  // Metadata
  version: number;
  lastUpdated: Date;
  updatedBy: string;
  metadata: Record<string, any>;
}

export interface NotificationPreferences {
  // Channel settings
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
    webhook: boolean;
  };
  
  // Email notifications
  email: {
    auctionUpdates: boolean;
    bidUpdates: boolean;
    paymentUpdates: boolean;
    accountUpdates: boolean;
    marketing: boolean;
    newsletter: boolean;
    securityAlerts: boolean;
  };
  
  // Push notifications
  push: {
    auctionUpdates: boolean;
    bidUpdates: boolean;
    paymentUpdates: boolean;
    accountUpdates: boolean;
    securityAlerts: boolean;
  };
  
  // SMS notifications
  sms: {
    securityAlerts: boolean;
    paymentUpdates: boolean;
    accountUpdates: boolean;
  };
  
  // In-app notifications
  inApp: {
    auctionUpdates: boolean;
    bidUpdates: boolean;
    paymentUpdates: boolean;
    accountUpdates: boolean;
    systemUpdates: boolean;
  };
  
  // Webhook settings
  webhook: {
    url?: string;
    events: string[];
    secret?: string;
    active: boolean;
  };
  
  // Frequency settings
  frequency: {
    immediate: string[];
    hourly: string[];
    daily: string[];
    weekly: string[];
  };
  
  // Quiet hours
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    timezone: string;
  };
}

export interface PrivacyPreferences {
  // Profile visibility
  profileVisibility: PrivacyLevel;
  
  // Activity visibility
  showActivity: boolean;
  showBiddingHistory: boolean;
  showWinningAuctions: boolean;
  showTotalSpent: boolean;
  showWalletAddresses: boolean;
  
  // Interaction settings
  allowDirectMessages: boolean;
  allowTagging: boolean;
  allowFriendRequests: boolean;
  allowFollowers: boolean;
  
  // Data sharing
  shareAnalytics: boolean;
  shareLocation: boolean;
  allowThirdPartyTracking: boolean;
  
  // Search visibility
  appearInSearch: boolean;
  searchableByEmail: boolean;
  searchableByWallet: boolean;
  
  // Content filtering
  showMatureContent: boolean;
  hideBlockedUsers: boolean;
  hideMutedUsers: boolean;
  
  // API access
  allowPublicApi: boolean;
  apiRateLimit: number;
}

export interface DisplayPreferences {
  // Theme
  theme: ThemeMode;
  customTheme?: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  
  // Layout
  layout: {
    compactMode: boolean;
    sidebarCollapsed: boolean;
    showAdvancedFeatures: boolean;
    defaultView: 'grid' | 'list' | 'table';
    itemsPerPage: number;
    showTooltips: boolean;
  };
  
  // Dashboard
  dashboard: {
    widgets: DashboardWidget[];
    layout: 'grid' | 'columns';
    refreshInterval: number; // seconds
  };
  
  // Auction display
  auctionDisplay: {
    showReservePrice: boolean;
    showBidHistory: boolean;
    showTimeRemaining: boolean;
    showBidCount: boolean;
    showWatcherCount: boolean;
    currencyDisplay: 'native' | 'converted';
  };
  
  // Animations
  animations: {
    enabled: boolean;
    reducedMotion: boolean;
    transitionSpeed: 'slow' | 'normal' | 'fast';
  };
}

export interface DashboardWidget {
  id: string;
  type: 'active_auctions' | 'recent_bids' | 'watchlist' | 'portfolio' | 'analytics' | 'notifications';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  visible: boolean;
}

export interface LocalizationPreferences {
  // Language
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Currency
  currency: string;
  showCurrencyConversion: boolean;
  preferredCurrencies: string[];
  
  // Timezone
  timezone: string;
  autoDetectTimezone: boolean;
  
  // Number formatting
  numberFormat: {
    decimalSeparator: string;
    thousandsSeparator: string;
    precision: number;
  };
  
  // Regional settings
  region: string;
  measurementSystem: 'metric' | 'imperial';
}

export interface SecurityPreferences {
  // Authentication
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'authenticator' | 'email';
  requireTwoFactorFor: string[];
  
  // Session management
  sessionTimeout: number; // minutes
  autoLogout: boolean;
  concurrentSessions: number;
  
  // Password settings
  passwordChangeReminder: boolean;
  passwordChangeInterval: number; // days
  
  // Device management
  trustedDevices: TrustedDevice[];
  newDeviceAlert: boolean;
  
  // API security
  apiAccessEnabled: boolean;
  apiKeyExpiry: number; // days
  ipWhitelist: string[];
  
  // Transaction security
  requireConfirmationFor: {
    largeAmounts: boolean;
    newAddresses: boolean;
    suspiciousActivity: boolean;
  };
  largeAmountThreshold: number;
}

export interface TrustedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
  ipAddress: string;
  lastUsed: Date;
  trustedAt: Date;
  expiresAt?: Date;
}

export interface TradingPreferences {
  // Default settings
  defaultCurrency: string;
  defaultPaymentMethod: string;
  autoBidEnabled: boolean;
  maxBidAmount: number;
  
  // Auction preferences
  auctionNotifications: boolean;
  autoExtendBidding: boolean;
  snipeProtection: boolean;
  snipeProtectionTime: number; // seconds
  
  // Risk management
  maxActiveAuctions: number;
  maxDailyBids: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  
  // Categories
  preferredCategories: string[];
  blockedCategories: string[];
  
  // Geographic preferences
  preferredRegions: string[];
  blockedRegions: string[];
  
  // Counterparty preferences
  minReputationScore: number;
  onlyVerifiedUsers: boolean;
  allowAnonymousBidders: boolean;
}

export interface PreferenceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner' | 'trader' | 'investor' | 'developer' | 'privacy_focused';
  preferences: Partial<UserPreferences>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferenceConfig {
  allowCustomPreferences: boolean;
  enableTemplates: boolean;
  requireValidation: boolean;
  maxCustomPreferences: number;
  enableAnalytics: boolean;
  enableAging: boolean;
  preferenceRetentionPeriod: number; // days
  enableVersioning: boolean;
  maxVersions: number;
  enableExport: boolean;
  enableImport: boolean;
  supportedLanguages: string[];
  supportedCurrencies: string[];
  supportedTimezones: string[];
}

export interface PreferenceAnalytics {
  period: { start: Date; end: Date };
  
  // Usage metrics
  totalUsers: number;
  activeUsers: number;
  preferenceUpdates: number;
  
  // Popular preferences
  mostPopularLanguages: { language: string; count: number }[];
  mostPopularThemes: { theme: ThemeMode; count: number }[];
  mostPopularCurrencies: { currency: string; count: number }[];
  
  // Notification metrics
  notificationChannelUsage: Record<NotificationChannel, number>;
  emailNotificationOptIn: number;
  pushNotificationOptIn: number;
  
  // Privacy metrics
  privacyLevelDistribution: Record<PrivacyLevel, number>;
  publicProfiles: number;
  privateProfiles: number;
  
  // Template usage
  templateUsage: Record<string, number>;
  customPreferenceUsers: number;
  
  // Trends
  preferenceChangesOverTime: {
    date: Date;
    changes: number;
    type: PreferenceType;
  }[];
}

// Main User Preferences Service
export class UserPreferencesService extends EventEmitter {
  private preferences: Map<string, UserPreferences> = new Map();
  private templates: Map<string, PreferenceTemplate> = new Map();
  private preferenceHistory: Map<string, UserPreferences[]> = new Map();
  private config: PreferenceConfig;
  private defaultPreferences: UserPreferences;

  constructor(config?: Partial<PreferenceConfig>) {
    super();
    this.config = {
      allowCustomPreferences: true,
      enableTemplates: true,
      requireValidation: false,
      maxCustomPreferences: 50,
      enableAnalytics: true,
      enableAging: true,
      preferenceRetentionPeriod: 365,
      enableVersioning: true,
      maxVersions: 10,
      enableExport: true,
      enableImport: true,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'ETH', 'BTC'],
      supportedTimezones: Intl.supportedValuesOf('timeZone'),
      ...config
    };

    this.defaultPreferences = this.createDefaultPreferences();
  }

  // Preference Management
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    let preferences = this.preferences.get(userId);
    
    if (!preferences) {
      preferences = { ...this.defaultPreferences, id: this.generateId(), userId };
      this.preferences.set(userId, preferences);
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    updates: Partial<UserPreferences>,
    updatedBy: string
  ): Promise<UserPreferences> {
    const currentPreferences = await this.getUserPreferences(userId);
    
    // Validate updates
    await this.validatePreferenceUpdates(updates);

    // Create history entry if versioning is enabled
    if (this.config.enableVersioning) {
      const history = this.preferenceHistory.get(userId) || [];
      history.push({ ...currentPreferences });
      
      // Keep only max versions
      if (history.length > this.config.maxVersions) {
        history.splice(0, history.length - this.config.maxVersions);
      }
      
      this.preferenceHistory.set(userId, history);
    }

    // Apply updates
    const updatedPreferences = {
      ...currentPreferences,
      ...updates,
      version: currentPreferences.version + 1,
      lastUpdated: new Date(),
      updatedBy
    };

    this.preferences.set(userId, updatedPreferences);
    
    this.emit('preferencesUpdated', { userId, preferences: updatedPreferences, updates });
    return updatedPreferences;
  }

  async resetUserPreferences(
    userId: string,
    templateId?: string,
    resetBy: string
  ): Promise<UserPreferences> {
    let basePreferences = { ...this.defaultPreferences };
    
    if (templateId && this.config.enableTemplates) {
      const template = this.templates.get(templateId);
      if (template) {
        basePreferences = { ...basePreferences, ...template.preferences };
      }
    }

    const resetPreferences = {
      ...basePreferences,
      id: this.generateId(),
      userId,
      version: 1,
      lastUpdated: new Date(),
      updatedBy: resetBy,
      metadata: { reset: true, templateId }
    };

    this.preferences.set(userId, resetPreferences);
    
    this.emit('preferencesReset', { userId, preferences: resetPreferences, templateId });
    return resetPreferences;
  }

  // Template Management
  async createTemplate(
    name: string,
    description: string,
    category: PreferenceTemplate['category'],
    preferences: Partial<UserPreferences>
  ): Promise<PreferenceTemplate> {
    const template: PreferenceTemplate = {
      id: this.generateId(),
      name,
      description,
      category,
      preferences,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(template.id, template);
    
    this.emit('templateCreated', template);
    return template;
  }

  async getTemplate(templateId: string): Promise<PreferenceTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getTemplates(category?: PreferenceTemplate['category']): Promise<PreferenceTemplate[]> {
    let templates = Array.from(this.templates.values());
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return templates.filter(t => t.isActive)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async applyTemplate(
    userId: string,
    templateId: string,
    appliedBy: string
  ): Promise<UserPreferences> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return await this.updateUserPreferences(userId, template.preferences, appliedBy);
  }

  // Preference History
  async getPreferenceHistory(userId: string): Promise<UserPreferences[]> {
    return this.preferenceHistory.get(userId) || [];
  }

  async restorePreferenceVersion(
    userId: string,
    version: number,
    restoredBy: string
  ): Promise<UserPreferences> {
    const history = this.preferenceHistory.get(userId);
    if (!history) {
      throw new Error('No preference history found');
    }

    const versionToRestore = history.find(p => p.version === version);
    if (!versionToRestore) {
      throw new Error(`Preference version ${version} not found`);
    }

    const restoredPreferences = {
      ...versionToRestore,
      version: (await this.getUserPreferences(userId)).version + 1,
      lastUpdated: new Date(),
      updatedBy: restoredBy,
      metadata: { restored: true, fromVersion: version }
    };

    this.preferences.set(userId, restoredPreferences);
    
    this.emit('preferencesRestored', { userId, preferences: restoredPreferences, fromVersion: version });
    return restoredPreferences;
  }

  // Bulk Operations
  async updateMultipleUserPreferences(
    updates: Array<{
      userId: string;
      preferences: Partial<UserPreferences>;
      updatedBy: string;
    }>
  ): Promise<UserPreferences[]> {
    const results: UserPreferences[] = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateUserPreferences(
          update.userId,
          update.preferences,
          update.updatedBy
        );
        results.push(result);
      } catch (error) {
        // Log error but continue with other updates
        this.emit('updateError', { userId: update.userId, error });
      }
    }

    this.emit('bulkPreferencesUpdated', { results });
    return results;
  }

  // Export/Import
  async exportUserPreferences(userId: string, format: 'json' | 'csv'): Promise<string> {
    const preferences = await this.getUserPreferences(userId);
    
    if (format === 'json') {
      return JSON.stringify(preferences, null, 2);
    } else {
      // CSV export (simplified)
      const headers = ['Category', 'Setting', 'Value'];
      const rows = this.flattenPreferences(preferences);
      
      return [headers, ...rows.map(row => [row.category, row.setting, row.value])]
        .map(row => row.join(','))
        .join('\n');
    }
  }

  async importUserPreferences(
    userId: string,
    data: string,
    format: 'json' | 'csv',
    importedBy: string
  ): Promise<UserPreferences> {
    let preferences: Partial<UserPreferences>;
    
    if (format === 'json') {
      try {
        preferences = JSON.parse(data);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    } else {
      preferences = this.parseCsvPreferences(data);
    }

    return await this.updateUserPreferences(userId, preferences, importedBy);
  }

  // Validation
  async validatePreferenceUpdates(updates: Partial<UserPreferences>): Promise<void> {
    // Validate language
    if (updates.localization?.language) {
      if (!this.config.supportedLanguages.includes(updates.localization.language)) {
        throw new Error(`Unsupported language: ${updates.localization.language}`);
      }
    }

    // Validate currency
    if (updates.localization?.currency) {
      if (!this.config.supportedCurrencies.includes(updates.localization.currency)) {
        throw new Error(`Unsupported currency: ${updates.localization.currency}`);
      }
    }

    // Validate timezone
    if (updates.localization?.timezone) {
      if (!this.config.supportedTimezones.includes(updates.localization.timezone)) {
        throw new Error(`Unsupported timezone: ${updates.localization.timezone}`);
      }
    }

    // Validate custom preferences count
    if (updates.custom && Object.keys(updates.custom).length > this.config.maxCustomPreferences) {
      throw new Error(`Too many custom preferences (max: ${this.config.maxCustomPreferences})`);
    }
  }

  // Private Methods
  private createDefaultPreferences(): UserPreferences {
    return {
      id: '',
      userId: '',
      notifications: {
        channels: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          webhook: false
        },
        email: {
          auctionUpdates: true,
          bidUpdates: true,
          paymentUpdates: true,
          accountUpdates: true,
          marketing: false,
          newsletter: false,
          securityAlerts: true
        },
        push: {
          auctionUpdates: true,
          bidUpdates: true,
          paymentUpdates: true,
          accountUpdates: true,
          securityAlerts: true
        },
        sms: {
          securityAlerts: true,
          paymentUpdates: false,
          accountUpdates: false
        },
        inApp: {
          auctionUpdates: true,
          bidUpdates: true,
          paymentUpdates: true,
          accountUpdates: true,
          systemUpdates: true
        },
        webhook: {
          active: false,
          events: []
        },
        frequency: {
          immediate: ['security_alerts'],
          hourly: ['bid_updates'],
          daily: ['account_updates'],
          weekly: ['newsletter']
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'UTC'
        }
      },
      privacy: {
        profileVisibility: PrivacyLevel.PUBLIC,
        showActivity: true,
        showBiddingHistory: true,
        showWinningAuctions: true,
        showTotalSpent: false,
        showWalletAddresses: false,
        allowDirectMessages: true,
        allowTagging: true,
        allowFriendRequests: true,
        allowFollowers: true,
        shareAnalytics: true,
        shareLocation: false,
        allowThirdPartyTracking: false,
        appearInSearch: true,
        searchableByEmail: false,
        searchableByWallet: false,
        showMatureContent: false,
        hideBlockedUsers: true,
        hideMutedUsers: true,
        allowPublicApi: false,
        apiRateLimit: 100
      },
      display: {
        theme: ThemeMode.LIGHT,
        layout: {
          compactMode: false,
          sidebarCollapsed: false,
          showAdvancedFeatures: false,
          defaultView: 'grid',
          itemsPerPage: 20,
          showTooltips: true
        },
        dashboard: {
          widgets: [],
          layout: 'grid',
          refreshInterval: 30
        },
        auctionDisplay: {
          showReservePrice: false,
          showBidHistory: true,
          showTimeRemaining: true,
          showBidCount: true,
          showWatcherCount: true,
          currencyDisplay: 'native'
        },
        animations: {
          enabled: true,
          reducedMotion: false,
          transitionSpeed: 'normal'
        }
      },
      localization: {
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        showCurrencyConversion: false,
        preferredCurrencies: ['USD', 'EUR'],
        timezone: 'UTC',
        autoDetectTimezone: true,
        numberFormat: {
          decimalSeparator: '.',
          thousandsSeparator: ',',
          precision: 2
        },
        region: 'US',
        measurementSystem: 'imperial'
      },
      security: {
        twoFactorEnabled: false,
        twoFactorMethod: 'authenticator',
        requireTwoFactorFor: [],
        sessionTimeout: 24 * 60, // 24 hours
        autoLogout: false,
        concurrentSessions: 3,
        passwordChangeReminder: true,
        passwordChangeInterval: 90,
        trustedDevices: [],
        newDeviceAlert: true,
        apiAccessEnabled: false,
        apiKeyExpiry: 30,
        ipWhitelist: [],
        requireConfirmationFor: {
          largeAmounts: true,
          newAddresses: true,
          suspiciousActivity: true
        },
        largeAmountThreshold: 1000
      },
      trading: {
        defaultCurrency: 'USD',
        defaultPaymentMethod: 'crypto',
        autoBidEnabled: false,
        maxBidAmount: 10000,
        auctionNotifications: true,
        autoExtendBidding: false,
        snipeProtection: true,
        snipeProtectionTime: 300, // 5 minutes
        maxActiveAuctions: 10,
        maxDailyBids: 50,
        riskLevel: 'moderate',
        preferredCategories: [],
        blockedCategories: [],
        preferredRegions: [],
        blockedRegions: [],
        minReputationScore: 0,
        onlyVerifiedUsers: false,
        allowAnonymousBidders: true
      },
      custom: {},
      version: 1,
      lastUpdated: new Date(),
      updatedBy: 'system',
      metadata: {}
    };
  }

  private flattenPreferences(preferences: UserPreferences): Array<{
    category: string;
    setting: string;
    value: string;
  }> {
    const flattened: Array<{ category: string; setting: string; value: string }> = [];
    
    // Flatten notification preferences
    for (const [key, value] of Object.entries(preferences.notifications)) {
      if (typeof value === 'object') {
        for (const [subKey, subValue] of Object.entries(value)) {
          flattened.push({
            category: 'notifications',
            setting: `${key}.${subKey}`,
            value: String(subValue)
          });
        }
      } else {
        flattened.push({
          category: 'notifications',
          setting: key,
          value: String(value)
        });
      }
    }

    // Add other preference categories...
    // This is a simplified implementation
    
    return flattened;
  }

  private parseCsvPreferences(csvData: string): Partial<UserPreferences> {
    const lines = csvData.split('\n');
    const preferences: Partial<UserPreferences> = {};
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const [category, setting, value] = lines[i].split(',').map(s => s.trim());
      
      if (!category || !setting || !value) continue;
      
      // Parse and set preference values
      // This is a simplified implementation
    }
    
    return preferences;
  }

  private generateId(): string {
    return `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics
  async getPreferenceAnalytics(
    period: { start: Date; end: Date }
  ): Promise<PreferenceAnalytics> {
    const preferences = Array.from(this.preferences.values())
      .filter(p => p.lastUpdated >= period.start && p.lastUpdated <= period.end);

    // Basic metrics
    const totalUsers = preferences.length;
    const preferenceUpdates = preferences.length;
    
    // Popular languages
    const languageCounts = new Map<string, number>();
    for (const pref of preferences) {
      const lang = pref.localization.language;
      languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
    }
    
    const mostPopularLanguages = Array.from(languageCounts.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Popular themes
    const themeCounts = new Map<ThemeMode, number>();
    for (const pref of preferences) {
      const theme = pref.display.theme;
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    }
    
    const mostPopularThemes = Array.from(themeCounts.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    // Popular currencies
    const currencyCounts = new Map<string, number>();
    for (const pref of preferences) {
      const currency = pref.localization.currency;
      currencyCounts.set(currency, (currencyCounts.get(currency) || 0) + 1);
    }
    
    const mostPopularCurrencies = Array.from(currencyCounts.entries())
      .map(([currency, count]) => ({ currency, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Notification channel usage
    const notificationChannelUsage: Record<NotificationChannel, number> = {
      [NotificationChannel.EMAIL]: 0,
      [NotificationChannel.PUSH]: 0,
      [NotificationChannel.SMS]: 0,
      [NotificationChannel.IN_APP]: 0,
      [NotificationChannel.WEBHOOK]: 0
    };

    for (const pref of preferences) {
      if (pref.notifications.channels.email) notificationChannelUsage[NotificationChannel.EMAIL]++;
      if (pref.notifications.channels.push) notificationChannelUsage[NotificationChannel.PUSH]++;
      if (pref.notifications.channels.sms) notificationChannelUsage[NotificationChannel.SMS]++;
      if (pref.notifications.channels.inApp) notificationChannelUsage[NotificationChannel.IN_APP]++;
      if (pref.notifications.channels.webhook) notificationChannelUsage[NotificationChannel.WEBHOOK]++;
    }

    const emailNotificationOptIn = preferences.filter(p => p.notifications.channels.email).length;
    const pushNotificationOptIn = preferences.filter(p => p.notifications.channels.push).length;

    // Privacy level distribution
    const privacyLevelDistribution: Record<PrivacyLevel, number> = {
      [PrivacyLevel.PUBLIC]: 0,
      [PrivacyLevel.FRIENDS_ONLY]: 0,
      [PrivacyLevel.PRIVATE]: 0
    };

    for (const pref of preferences) {
      privacyLevelDistribution[pref.privacy.profileVisibility]++;
    }

    const publicProfiles = privacyLevelDistribution[PrivacyLevel.PUBLIC];
    const privateProfiles = privacyLevelDistribution[PrivacyLevel.PRIVATE];

    // Template usage
    const templateUsage: Record<string, number> = {};
    const customPreferenceUsers = preferences.filter(p => Object.keys(p.custom).length > 0).length;

    return {
      period,
      totalUsers,
      activeUsers: totalUsers, // Would filter by activity
      preferenceUpdates,
      mostPopularLanguages,
      mostPopularThemes,
      mostPopularCurrencies,
      notificationChannelUsage,
      emailNotificationOptIn,
      pushNotificationOptIn,
      privacyLevelDistribution,
      publicProfiles,
      privateProfiles,
      templateUsage,
      customPreferenceUsers,
      preferenceChangesOverTime: [] // Would track changes over time
    };
  }

  // Lifecycle Management
  async start(): Promise<void> {
    this.emit('serviceStarted');
  }

  async stop(): Promise<void> {
    this.emit('serviceStopped');
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const totalPreferences = this.preferences.size;
    const totalTemplates = this.templates.size;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (totalPreferences > 100000) {
      status = 'degraded'; // High load might indicate performance issues
    }

    return {
      status,
      details: {
        totalPreferences,
        totalTemplates,
        templatesEnabled: this.config.enableTemplates,
        versioningEnabled: this.config.enableVersioning,
        analyticsEnabled: this.config.enableAnalytics
      }
    };
  }

  // Export functionality
  async exportData(format: 'json' | 'csv'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify({
        preferences: Array.from(this.preferences.values()),
        templates: Array.from(this.templates.values()),
        config: this.config
      }, null, 2);
    } else {
      // CSV export for preferences
      const headers = [
        'User ID', 'Language', 'Currency', 'Theme', 'Privacy Level',
        'Last Updated', 'Version'
      ];
      
      const rows = Array.from(this.preferences.values()).map(p => [
        p.userId,
        p.localization.language,
        p.localization.currency,
        p.display.theme,
        p.privacy.profileVisibility,
        p.lastUpdated.toISOString(),
        p.version
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}
