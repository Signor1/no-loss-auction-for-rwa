import { EventEmitter } from 'events';
import { NotificationChannel, NotificationType, NotificationTemplate, TemplateVariable } from './notificationEngine';

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum TemplateCategory {
  WELCOME = 'welcome',
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  ALERT = 'alert',
  REMINDER = 'reminder',
  VERIFICATION = 'verification',
  SECURITY = 'security',
  BILLING = 'billing',
  SUPPORT = 'support',
  ONBOARDING = 'onboarding'
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: TemplateVariable[];
  status: TemplateStatus;
  createdBy: string;
  createdAt: Date;
  changelog?: string;
  isActive: boolean;
}

export interface TemplateLocalization {
  id: string;
  templateId: string;
  locale: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface TemplatePreview {
  templateId: string;
  locale: string;
  variables: Record<string, any>;
  preview: {
    subject?: string;
    content: string;
    htmlContent?: string;
  };
  generatedAt: Date;
}

export interface TemplateMetrics {
  totalTemplates: number;
  templatesByCategory: Record<TemplateCategory, number>;
  templatesByChannel: Record<NotificationChannel, number>;
  templatesByStatus: Record<TemplateStatus, number>;
  topUsedTemplates: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
    successRate: number;
  }>;
  recentVersions: Array<{
    templateId: string;
    templateName: string;
    version: number;
    createdAt: Date;
    createdBy: string;
  }>;
  localizationCoverage: Array<{
    templateId: string;
    templateName: string;
    totalLocales: number;
    activeLocales: number;
  }>;
}

export interface TemplateConfig {
  enableVersioning: boolean;
  maxVersions: number;
  enableLocalization: true;
  defaultLocale: string;
  supportedLocales: string[];
  enablePreview: boolean;
  previewVariables: Record<string, any>;
  enableValidation: true;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  type: 'required_variables' | 'variable_format' | 'content_length' | 'html_validation';
  config: Record<string, any>;
  errorMessage: string;
}

export class NotificationTemplateService extends EventEmitter {
  private templates: Map<string, NotificationTemplate> = new Map();
  private versions: Map<string, TemplateVersion[]> = new Map();
  private localizations: Map<string, TemplateLocalization[]> = new Map();
  private previews: Map<string, TemplatePreview> = new Map();
  private config: TemplateConfig;
  private metrics: TemplateMetrics;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultConfig(): TemplateConfig {
    return {
      enableVersioning: true,
      maxVersions: 10,
      enableLocalization: true,
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ko'],
      enablePreview: true,
      previewVariables: {
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        companyName: 'Acme Corp',
        verificationLink: 'https://example.com/verify'
      },
      enableValidation: true,
      validationRules: [
        {
          type: 'required_variables',
          config: {},
          errorMessage: 'All required variables must be present'
        },
        {
          type: 'content_length',
          config: { minLength: 1, maxLength: 10000 },
          errorMessage: 'Content length must be between 1 and 10000 characters'
        }
      ]
    };
  }

  private initializeMetrics(): TemplateMetrics {
    return {
      totalTemplates: 0,
      templatesByCategory: {
        welcome: 0,
        transactional: 0,
        marketing: 0,
        alert: 0,
        reminder: 0,
        verification: 0,
        security: 0,
        billing: 0,
        support: 0,
        onboarding: 0
      },
      templatesByChannel: {
        email: 0,
        sms: 0,
        push: 0,
        webhook: 0,
        slack: 0,
        microsoft_teams: 0,
        discord: 0,
        in_app: 0
      },
      templatesByStatus: {
        draft: 0,
        active: 0,
        inactive: 0,
        archived: 0
      },
      topUsedTemplates: [],
      recentVersions: [],
      localizationCoverage: []
    };
  }

  private initializeDefaultTemplates(): void {
    // Templates are already initialized in the main notification engine
    // This service focuses on template management features
  }

  async createTemplate(data: {
    name: string;
    description: string;
    channel: NotificationChannel;
    type: NotificationType;
    category: TemplateCategory;
    subject?: string;
    content: string;
    htmlContent?: string;
    variables: TemplateVariable[];
    locale?: string;
    tags?: string[];
    createdBy: string;
  }): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      channel: data.channel,
      type: data.type,
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent,
      variables: data.variables,
      isActive: false,
      version: 1,
      locale: data.locale || this.config.defaultLocale,
      category: data.category,
      createdBy: data.createdBy,
      createdAt: new Date(),
      tags: data.tags || []
    };

    // Validate template
    if (this.config.enableValidation) {
      await this.validateTemplate(template);
    }

    this.templates.set(template.id, template);

    // Create initial version
    if (this.config.enableVersioning) {
      const version: TemplateVersion = {
        id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId: template.id,
        version: 1,
        subject: template.subject,
        content: template.content,
        htmlContent: template.htmlContent,
        variables: template.variables,
        status: TemplateStatus.DRAFT,
        createdBy: data.createdBy,
        createdAt: new Date(),
        isActive: true
      };

      this.versions.set(template.id, [version]);
    }

    this.updateMetrics();
    this.emit('templateCreated', template);

    return template;
  }

  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const updatedTemplate = { 
      ...template, 
      ...updates,
      updatedAt: new Date()
    };

    // Validate updated template
    if (this.config.enableValidation) {
      await this.validateTemplate(updatedTemplate);
    }

    this.templates.set(templateId, updatedTemplate);

    // Create new version if versioning is enabled
    if (this.config.enableVersioning) {
      const versions = this.versions.get(templateId) || [];
      const newVersion: TemplateVersion = {
        id: `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId,
        version: template.version + 1,
        subject: updatedTemplate.subject,
        content: updatedTemplate.content,
        htmlContent: updatedTemplate.htmlContent,
        variables: updatedTemplate.variables,
        status: TemplateStatus.DRAFT,
        createdBy: updates.updatedBy || 'system',
        createdAt: new Date(),
        isActive: false
      };

      versions.push(newVersion);

      // Limit versions
      if (versions.length > this.config.maxVersions) {
        versions.shift();
      }

      this.versions.set(templateId, versions);
    }

    this.updateMetrics();
    this.emit('templateUpdated', updatedTemplate);

    return updatedTemplate;
  }

  async activateTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    template.isActive = true;
    template.updatedAt = new Date();

    // Activate current version
    if (this.config.enableVersioning) {
      const versions = this.versions.get(templateId) || [];
      versions.forEach(v => v.isActive = false);
      const currentVersion = versions.find(v => v.version === template.version);
      if (currentVersion) {
        currentVersion.status = TemplateStatus.ACTIVE;
        currentVersion.isActive = true;
      }
    }

    this.updateMetrics();
    this.emit('templateActivated', template);

    return template;
  }

  async deactivateTemplate(templateId: string): Promise<NotificationTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    template.isActive = false;
    template.updatedAt = new Date();

    // Deactivate all versions
    if (this.config.enableVersioning) {
      const versions = this.versions.get(templateId) || [];
      versions.forEach(v => {
        v.status = TemplateStatus.INACTIVE;
        v.isActive = false;
      });
    }

    this.updateMetrics();
    this.emit('templateDeactivated', template);

    return template;
  }

  async createLocalization(data: {
    templateId: string;
    locale: string;
    subject?: string;
    content: string;
    htmlContent?: string;
    variables: TemplateVariable[];
    createdBy: string;
  }): Promise<TemplateLocalization> {
    const template = this.templates.get(data.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const localization: TemplateLocalization = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: data.templateId,
      locale: data.locale,
      subject: data.subject,
      content: data.content,
      htmlContent: data.htmlContent,
      variables: data.variables,
      isActive: true,
      createdBy: data.createdBy,
      createdAt: new Date()
    };

    const localizations = this.localizations.get(data.templateId) || [];
    localizations.push(localization);
    this.localizations.set(data.templateId, localizations);

    this.updateMetrics();
    this.emit('localizationCreated', localization);

    return localization;
  }

  async previewTemplate(templateId: string, locale?: string, variables?: Record<string, any>): Promise<TemplatePreview> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const targetLocale = locale || template.locale;
    const previewVariables = { ...this.config.previewVariables, ...variables };

    let subject = template.subject;
    let content = template.content;
    let htmlContent = template.htmlContent;

    // Use localized version if available
    if (targetLocale !== template.locale) {
      const localizations = this.localizations.get(templateId) || [];
      const localization = localizations.find(l => l.locale === targetLocale && l.isActive);
      
      if (localization) {
        subject = localization.subject;
        content = localization.content;
        htmlContent = localization.htmlContent;
      }
    }

    // Process template variables
    const processed = this.processTemplateVariables(
      { subject, content, htmlContent },
      previewVariables
    );

    const preview: TemplatePreview = {
      templateId,
      locale: targetLocale,
      variables: previewVariables,
      preview: processed,
      generatedAt: new Date()
    };

    this.previews.set(`${templateId}_${targetLocale}`, preview);
    this.emit('templatePreviewed', preview);

    return preview;
  }

  private processTemplateVariables(
    template: { subject?: string; content: string; htmlContent?: string },
    variables: Record<string, any>
  ): { subject?: string; content: string; htmlContent?: string } {
    const replaceVariables = (text: string): string => {
      if (!text) return text;
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? String(variables[key]) : match;
      });
    };

    return {
      subject: template.subject ? replaceVariables(template.subject) : undefined,
      content: replaceVariables(template.content),
      htmlContent: template.htmlContent ? replaceVariables(template.htmlContent) : undefined
    };
  }

  private async validateTemplate(template: NotificationTemplate): Promise<void> {
    for (const rule of this.config.validationRules) {
      switch (rule.type) {
        case 'required_variables':
          const requiredVars = template.variables.filter(v => v.required);
          const content = template.content + ' ' + (template.subject || '') + ' ' + (template.htmlContent || '');
          
          for (const variable of requiredVars) {
            if (!content.includes(`{{${variable.name}}}`)) {
              throw new Error(`Required variable '${variable.name}' not found in template`);
            }
          }
          break;

        case 'content_length':
          const minLength = rule.config.minLength || 1;
          const maxLength = rule.config.maxLength || 10000;
          
          if (template.content.length < minLength || template.content.length > maxLength) {
            throw new Error(rule.errorMessage);
          }
          break;

        case 'html_validation':
          if (template.htmlContent) {
            // Basic HTML validation
            if (!template.htmlContent.includes('<') || !template.htmlContent.includes('>')) {
              throw new Error('HTML content appears to be invalid');
            }
          }
          break;
      }
    }
  }

  private updateMetrics(): void {
    const templates = Array.from(this.templates.values());

    this.metrics.totalTemplates = templates.length;

    this.metrics.templatesByCategory = {
      welcome: templates.filter(t => t.category === TemplateCategory.WELCOME).length,
      transactional: templates.filter(t => t.category === TemplateCategory.TRANSACTIONAL).length,
      marketing: templates.filter(t => t.category === TemplateCategory.MARKETING).length,
      alert: templates.filter(t => t.category === TemplateCategory.ALERT).length,
      reminder: templates.filter(t => t.category === TemplateCategory.REMINDER).length,
      verification: templates.filter(t => t.category === TemplateCategory.VERIFICATION).length,
      security: templates.filter(t => t.category === TemplateCategory.SECURITY).length,
      billing: templates.filter(t => t.category === TemplateCategory.BILLING).length,
      support: templates.filter(t => t.category === TemplateCategory.SUPPORT).length,
      onboarding: templates.filter(t => t.category === TemplateCategory.ONBOARDING).length
    };

    this.metrics.templatesByChannel = {
      email: templates.filter(t => t.channel === NotificationChannel.EMAIL).length,
      sms: templates.filter(t => t.channel === NotificationChannel.SMS).length,
      push: templates.filter(t => t.channel === NotificationChannel.PUSH).length,
      webhook: templates.filter(t => t.channel === NotificationChannel.WEBHOOK).length,
      slack: templates.filter(t => t.channel === NotificationChannel.SLACK).length,
      microsoft_teams: templates.filter(t => t.channel === NotificationChannel.MICROSOFT_TEAMS).length,
      discord: templates.filter(t => t.channel === NotificationChannel.DISCORD).length,
      in_app: templates.filter(t => t.channel === NotificationChannel.IN_APP).length
    };

    this.metrics.templatesByStatus = {
      draft: templates.filter(t => !t.isActive).length,
      active: templates.filter(t => t.isActive).length,
      inactive: 0,
      archived: 0
    };

    // Localization coverage
    this.metrics.localizationCoverage = templates.map(template => {
      const localizations = this.localizations.get(template.id) || [];
      const activeLocalizations = localizations.filter(l => l.isActive);
      
      return {
        templateId: template.id,
        templateName: template.name,
        totalLocales: localizations.length + 1, // +1 for original
        activeLocales: activeLocalizations.length + 1
      };
    });

    // Recent versions
    const allVersions = Array.from(this.versions.values()).flat();
    this.metrics.recentVersions = allVersions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(v => {
        const template = this.templates.get(v.templateId);
        return {
          templateId: v.templateId,
          templateName: template?.name || 'Unknown',
          version: v.version,
          createdAt: v.createdAt,
          createdBy: v.createdBy
        };
      });
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getTemplates(filters?: {
    channel?: NotificationChannel;
    type?: NotificationType;
    category?: TemplateCategory;
    locale?: string;
    isActive?: boolean;
    tags?: string[];
  }): Promise<NotificationTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.channel) {
        templates = templates.filter(t => t.channel === filters.channel);
      }
      if (filters.type) {
        templates = templates.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.locale) {
        templates = templates.filter(t => t.locale === filters.locale);
      }
      if (filters.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === filters.isActive);
      }
      if (filters.tags && filters.tags.length > 0) {
        templates = templates.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }
    }

    return templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
    return this.versions.get(templateId) || [];
  }

  async getTemplateLocalizations(templateId: string): Promise<TemplateLocalization[]> {
    return this.localizations.get(templateId) || [];
  }

  async getPreview(templateId: string, locale: string): Promise<TemplatePreview | null> {
    return this.previews.get(`${templateId}_${locale}`) || null;
  }

  async getMetrics(): Promise<TemplateMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<TemplateConfig>): Promise<TemplateConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<TemplateConfig> {
    return { ...this.config };
  }
}
