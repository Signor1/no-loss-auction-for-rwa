import { EventEmitter } from 'events';

export enum ReportType {
  COMPLIANCE_SUMMARY = 'compliance_summary',
  DETAILED_COMPLIANCE = 'detailed_compliance',
  RISK_ASSESSMENT = 'risk_assessment',
  AUDIT_TRAIL = 'audit_trail',
  REGULATORY_FILING = 'regulatory_filing',
  EXECUTIVE_DASHBOARD = 'executive_dashboard',
  TREND_ANALYSIS = 'trend_analysis',
  INCIDENT_REPORT = 'incident_report',
  PERFORMANCE_METRICS = 'performance_metrics'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}

export enum DeliveryMethod {
  EMAIL = 'email',
  DOWNLOAD = 'download',
  API = 'api',
  WEBHOOK = 'webhook',
  SFTP = 'sftp'
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: string;
  layout: ReportLayout;
  sections: ReportSection[];
  filters: ReportFilter[];
  format: ReportFormat;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface ReportLayout {
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: ReportHeaderFooter;
  footer?: ReportHeaderFooter;
  watermark?: string;
  branding: {
    logo?: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  };
}

export interface ReportHeaderFooter {
  enabled: boolean;
  content: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  includePageNumber: boolean;
  includeDate: boolean;
}

export interface ReportSection {
  id: string;
  type: 'chart' | 'table' | 'text' | 'image' | 'list' | 'summary';
  title: string;
  order: number;
  config: Record<string, any>;
  dataSource: string;
  dependsOn?: string[];
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
}

export interface Report {
  id: string;
  templateId: string;
  name: string;
  description: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  parameters: Record<string, any>;
  generatedBy: string;
  generatedAt?: Date;
  completedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  downloadCount: number;
  lastDownloaded?: Date;
  expiresAt?: Date;
  delivery: ReportDelivery[];
  metadata: Record<string, any>;
  error?: string;
}

export interface ReportDelivery {
  id: string;
  method: DeliveryMethod;
  recipients: string[];
  schedule?: ReportSchedule;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timezone: string;
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  enabled: boolean;
  nextRun?: Date;
}

export interface ReportGenerationConfig {
  maxConcurrentGenerations: number;
  defaultTimeout: number;
  enableCaching: boolean;
  cacheTimeout: number;
  enableCompression: boolean;
  compressionLevel: number;
  storageLocation: string;
  retentionDays: number;
  enableWatermark: boolean;
  defaultWatermark: string;
  enableEncryption: boolean;
  encryptionKey?: string;
}

export interface ReportMetrics {
  totalReports: number;
  reportsByType: Record<ReportType, number>;
  reportsByStatus: Record<ReportStatus, number>;
  reportsByFormat: Record<ReportFormat, number>;
  averageGenerationTime: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalDownloads: number;
  storageUsed: number;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
  }>;
  generationTrend: Array<{
    date: string;
    reports: number;
    successRate: number;
    averageTime: number;
  }>;
}

export class ReportingGenerationService extends EventEmitter {
  private templates: Map<string, ReportTemplate> = new Map();
  private reports: Map<string, Report> = new Map();
  private config: ReportGenerationConfig;
  private metrics: ReportMetrics;
  private generationQueue: Array<{ reportId: string; priority: number }> = [];
  private isProcessing = false;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultTemplates();
    this.startGenerationProcessor();
  }

  private initializeDefaultConfig(): ReportGenerationConfig {
    return {
      maxConcurrentGenerations: 5,
      defaultTimeout: 300000, // 5 minutes
      enableCaching: true,
      cacheTimeout: 3600000, // 1 hour
      enableCompression: true,
      compressionLevel: 6,
      storageLocation: '/var/reports',
      retentionDays: 90,
      enableWatermark: false,
      defaultWatermark: 'CONFIDENTIAL',
      enableEncryption: false
    };
  }

  private initializeMetrics(): ReportMetrics {
    return {
      totalReports: 0,
      reportsByType: {
        compliance_summary: 0,
        detailed_compliance: 0,
        risk_assessment: 0,
        audit_trail: 0,
        regulatory_filing: 0,
        executive_dashboard: 0,
        trend_analysis: 0,
        incident_report: 0,
        performance_metrics: 0
      },
      reportsByStatus: {
        pending: 0,
        generating: 0,
        completed: 0,
        failed: 0,
        scheduled: 0
      },
      reportsByFormat: {
        pdf: 0,
        excel: 0,
        csv: 0,
        json: 0,
        html: 0
      },
      averageGenerationTime: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalDownloads: 0,
      storageUsed: 0,
      topTemplates: [],
      generationTrend: []
    };
  }

  private initializeDefaultTemplates(): void {
    const templates: ReportTemplate[] = [
      {
        id: 'template_compliance_summary',
        name: 'Compliance Summary Report',
        description: 'Overview of compliance status across all regulations',
        type: ReportType.COMPLIANCE_SUMMARY,
        category: 'Compliance',
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          branding: {
            colors: { primary: '#1f2937', secondary: '#6b7280', accent: '#3b82f6' },
            fonts: { heading: 'Arial', body: 'Arial' }
          }
        },
        sections: [
          {
            id: 'summary',
            type: 'summary',
            title: 'Executive Summary',
            order: 1,
            config: { includeCharts: true },
            dataSource: 'compliance_metrics'
          },
          {
            id: 'details',
            type: 'table',
            title: 'Compliance Details',
            order: 2,
            config: { includeFilters: true },
            dataSource: 'compliance_requirements'
          }
        ],
        filters: [
          {
            field: 'dateRange',
            operator: 'between',
            value: [],
            label: 'Date Range',
            required: true,
            type: 'date'
          },
          {
            field: 'regulation',
            operator: 'in',
            value: [],
            label: 'Regulation',
            required: false,
            type: 'multiselect'
          }
        ],
        format: ReportFormat.PDF,
        isDefault: true,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'template_risk_assessment',
        name: 'Risk Assessment Report',
        description: 'Detailed risk analysis and recommendations',
        type: ReportType.RISK_ASSESSMENT,
        category: 'Risk',
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          branding: {
            colors: { primary: '#1f2937', secondary: '#6b7280', accent: '#ef4444' },
            fonts: { heading: 'Arial', body: 'Arial' }
          }
        },
        sections: [
          {
            id: 'risk_overview',
            type: 'chart',
            title: 'Risk Overview',
            order: 1,
            config: { chartType: 'pie' },
            dataSource: 'risk_metrics'
          },
          {
            id: 'risk_details',
            type: 'table',
            title: 'Risk Details',
            order: 2,
            config: { includeRecommendations: true },
            dataSource: 'risk_assessments'
          }
        ],
        filters: [
          {
            field: 'riskLevel',
            operator: 'in',
            value: [],
            label: 'Risk Level',
            required: false,
            type: 'multiselect'
          }
        ],
        format: ReportFormat.EXCEL,
        isDefault: false,
        isActive: true,
        createdBy: 'system',
        createdAt: new Date()
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async createTemplate(data: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const template: ReportTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || '',
      description: data.description || '',
      type: data.type || ReportType.COMPLIANCE_SUMMARY,
      category: data.category || 'General',
      layout: data.layout || this.getDefaultLayout(),
      sections: data.sections || [],
      filters: data.filters || [],
      format: data.format || ReportFormat.PDF,
      isDefault: data.isDefault || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdBy: data.createdBy || 'system',
      createdAt: new Date()
    };

    this.templates.set(template.id, template);
    this.emit('templateCreated', template);

    return template;
  }

  private getDefaultLayout(): ReportLayout {
    return {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      branding: {
        colors: { primary: '#1f2937', secondary: '#6b7280', accent: '#3b82f6' },
        fonts: { heading: 'Arial', body: 'Arial' }
      }
    };
  }

  async generateReport(data: {
    templateId: string;
    name: string;
    description?: string;
    parameters: Record<string, any>;
    format?: ReportFormat;
    delivery?: Omit<ReportDelivery, 'id' | 'status' | 'sentAt' | 'error'>[];
    generatedBy: string;
    priority?: number;
  }): Promise<Report> {
    const template = this.templates.get(data.templateId);
    if (!template) {
      throw new Error(`Template ${data.templateId} not found`);
    }

    const report: Report = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: data.templateId,
      name: data.name,
      description: data.description || '',
      type: template.type,
      status: ReportStatus.PENDING,
      format: data.format || template.format,
      parameters: data.parameters,
      generatedBy: data.generatedBy,
      downloadCount: 0,
      delivery: data.delivery?.map(d => ({
        ...d,
        id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending' as const
      })) || [],
      metadata: {}
    };

    this.reports.set(report.id, report);
    this.updateMetrics();
    this.emit('reportCreated', report);

    // Add to generation queue
    this.generationQueue.push({
      reportId: report.id,
      priority: data.priority || 1
    });

    return report;
  }

  private async processGenerationQueue(): Promise<void> {
    if (this.isProcessing || this.generationQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Sort by priority
      this.generationQueue.sort((a, b) => b.priority - a.priority);

      const batch = this.generationQueue.splice(0, this.config.maxConcurrentGenerations);
      const promises = batch.map(item => this.processReportGeneration(item.reportId));

      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processReportGeneration(reportId: string): Promise<void> {
    const report = this.reports.get(reportId);
    if (!report) return;

    try {
      report.status = ReportStatus.GENERATING;
      const startTime = Date.now();

      const template = this.templates.get(report.templateId);
      if (!template) {
        throw new Error(`Template ${report.templateId} not found`);
      }

      // Generate report content
      const content = await this.generateReportContent(template, report.parameters);

      // Convert to specified format
      const fileData = await this.convertToFormat(content, report.format);
      
      // Save file
      const fileUrl = await this.saveReportFile(reportId, fileData, report.format);

      report.status = ReportStatus.COMPLETED;
      report.fileUrl = fileUrl;
      report.fileSize = fileData.length;
      report.generatedAt = new Date();
      report.completedAt = new Date();

      const generationTime = Date.now() - startTime;
      this.updateMetricsAfterGeneration(report, generationTime, true);

      // Process deliveries
      await this.processDeliveries(report);

      this.emit('reportGenerated', report);

    } catch (error) {
      report.status = ReportStatus.FAILED;
      report.error = error instanceof Error ? error.message : String(error);
      report.completedAt = new Date();

      this.updateMetricsAfterGeneration(report, 0, false);
      this.emit('reportGenerationFailed', { report, error });
    }
  }

  private async generateReportContent(template: ReportTemplate, parameters: Record<string, any>): Promise<any> {
    // Simulate data fetching and content generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const content = {
      title: template.name,
      description: template.description,
      generatedAt: new Date(),
      parameters,
      sections: []
    };

    for (const section of template.sections.sort((a, b) => a.order - b.order)) {
      const sectionData = await this.generateSectionContent(section, parameters);
      content.sections.push(sectionData);
    }

    return content;
  }

  private async generateSectionContent(section: ReportSection, parameters: Record<string, any>): Promise<any> {
    // Simulate section data generation
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: section.id,
      type: section.type,
      title: section.title,
      data: this.getMockData(section.type)
    };
  }

  private getMockData(type: string): any {
    switch (type) {
      case 'chart':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Compliance Score',
            data: [85, 88, 82, 90, 87, 92]
          }]
        };
      case 'table':
        return [
          { regulation: 'GDPR', status: 'Compliant', score: 95 },
          { regulation: 'AML', status: 'Partially Compliant', score: 78 },
          { regulation: 'PCI DSS', status: 'Compliant', score: 88 }
        ];
      case 'summary':
        return {
          overallScore: 87,
          totalRequirements: 150,
          compliantRequirements: 130,
          nonCompliantRequirements: 20
        };
      default:
        return {};
    }
  }

  private async convertToFormat(content: any, format: ReportFormat): Promise<Buffer> {
    // Simulate format conversion
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockData = JSON.stringify(content);
    return Buffer.from(mockData, 'utf8');
  }

  private async saveReportFile(reportId: string, data: Buffer, format: ReportFormat): Promise<string> {
    // Simulate file saving
    const fileName = `${reportId}.${format}`;
    const filePath = `${this.config.storageLocation}/${fileName}`;
    
    // In a real implementation, this would save to actual storage
    return `https://storage.example.com/reports/${fileName}`;
  }

  private async processDeliveries(report: Report): Promise<void> {
    for (const delivery of report.delivery) {
      try {
        await this.processDelivery(delivery, report);
        delivery.status = 'sent';
        delivery.sentAt = new Date();
      } catch (error) {
        delivery.status = 'failed';
        delivery.error = error instanceof Error ? error.message : String(error);
      }
    }
  }

  private async processDelivery(delivery: ReportDelivery, report: Report): Promise<void> {
    switch (delivery.method) {
      case DeliveryMethod.EMAIL:
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case DeliveryMethod.WEBHOOK:
        // Simulate webhook call
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      case DeliveryMethod.SFTP:
        // Simulate SFTP transfer
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      default:
        break;
    }
  }

  private startGenerationProcessor(): void {
    setInterval(() => {
      this.processGenerationQueue();
    }, 1000);
  }

  private updateMetrics(): void {
    const reports = Array.from(this.reports.values());

    this.metrics.totalReports = reports.length;

    this.metrics.reportsByType = {
      compliance_summary: reports.filter(r => r.type === ReportType.COMPLIANCE_SUMMARY).length,
      detailed_compliance: reports.filter(r => r.type === ReportType.DETAILED_COMPLIANCE).length,
      risk_assessment: reports.filter(r => r.type === ReportType.RISK_ASSESSMENT).length,
      audit_trail: reports.filter(r => r.type === ReportType.AUDIT_TRAIL).length,
      regulatory_filing: reports.filter(r => r.type === ReportType.REGULATORY_FILING).length,
      executive_dashboard: reports.filter(r => r.type === ReportType.EXECUTIVE_DASHBOARD).length,
      trend_analysis: reports.filter(r => r.type === ReportType.TREND_ANALYSIS).length,
      incident_report: reports.filter(r => r.type === ReportType.INCIDENT_REPORT).length,
      performance_metrics: reports.filter(r => r.type === ReportType.PERFORMANCE_METRICS).length
    };

    this.metrics.reportsByStatus = {
      pending: reports.filter(r => r.status === ReportStatus.PENDING).length,
      generating: reports.filter(r => r.status === ReportStatus.GENERATING).length,
      completed: reports.filter(r => r.status === ReportStatus.COMPLETED).length,
      failed: reports.filter(r => r.status === ReportStatus.FAILED).length,
      scheduled: reports.filter(r => r.status === ReportStatus.SCHEDULED).length
    };

    this.metrics.reportsByFormat = {
      pdf: reports.filter(r => r.format === ReportFormat.PDF).length,
      excel: reports.filter(r => r.format === ReportFormat.EXCEL).length,
      csv: reports.filter(r => r.format === ReportFormat.CSV).length,
      json: reports.filter(r => r.format === ReportFormat.JSON).length,
      html: reports.filter(r => r.format === ReportFormat.HTML).length
    };

    this.metrics.totalDownloads = reports.reduce((sum, r) => sum + r.downloadCount, 0);
    this.metrics.storageUsed = reports.reduce((sum, r) => sum + (r.fileSize || 0), 0);

    // Update top templates
    const templateUsage = new Map<string, number>();
    reports.forEach(report => {
      templateUsage.set(report.templateId, (templateUsage.get(report.templateId) || 0) + 1);
    });

    this.metrics.topTemplates = Array.from(templateUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([templateId, usageCount]) => {
        const template = this.templates.get(templateId);
        return {
          templateId,
          templateName: template?.name || 'Unknown',
          usageCount
        };
      });
  }

  private updateMetricsAfterGeneration(report: Report, generationTime: number, success: boolean): void {
    if (success) {
      this.metrics.successfulGenerations++;
      
      // Update average generation time
      const totalSuccessful = this.metrics.successfulGenerations;
      this.metrics.averageGenerationTime = 
        (this.metrics.averageGenerationTime * (totalSuccessful - 1) + generationTime) / totalSuccessful;
    } else {
      this.metrics.failedGenerations++;
    }

    this.updateMetrics();
  }

  async getReport(reportId: string): Promise<Report | null> {
    return this.reports.get(reportId) || null;
  }

  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async getReports(filters?: {
    type?: ReportType;
    status?: ReportStatus;
    format?: ReportFormat;
    generatedBy?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Report[]> {
    let reports = Array.from(this.reports.values());

    if (filters) {
      if (filters.type) {
        reports = reports.filter(r => r.type === filters.type);
      }
      if (filters.status) {
        reports = reports.filter(r => r.status === filters.status);
      }
      if (filters.format) {
        reports = reports.filter(r => r.format === filters.format);
      }
      if (filters.generatedBy) {
        reports = reports.filter(r => r.generatedBy === filters.generatedBy);
      }
      if (filters.startDate) {
        reports = reports.filter(r => r.generatedAt && r.generatedAt >= filters.startDate!);
      }
      if (filters.endDate) {
        reports = reports.filter(r => r.generatedAt && r.generatedAt <= filters.endDate!);
      }
    }

    return reports.sort((a, b) => (b.generatedAt?.getTime() || 0) - (a.generatedAt?.getTime() || 0));
  }

  async getTemplates(filters?: {
    type?: ReportType;
    category?: string;
    isActive?: boolean;
    isDefault?: boolean;
  }): Promise<ReportTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.type) {
        templates = templates.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.isActive !== undefined) {
        templates = templates.filter(t => t.isActive === filters.isActive);
      }
      if (filters.isDefault !== undefined) {
        templates = templates.filter(t => t.isDefault === filters.isDefault);
      }
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }

  async downloadReport(reportId: string): Promise<string | null> {
    const report = this.reports.get(reportId);
    if (!report || !report.fileUrl) return null;

    report.downloadCount++;
    report.lastDownloaded = new Date();
    this.emit('reportDownloaded', report);

    return report.fileUrl;
  }

  async getMetrics(): Promise<ReportMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<ReportGenerationConfig>): Promise<ReportGenerationConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<ReportGenerationConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalReports: number;
    queueSize: number;
    successRate: number;
    storageUsage: number;
    lastUpdated: Date;
  }> {
    this.updateMetrics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    const successRate = this.metrics.successfulGenerations + this.metrics.failedGenerations > 0
      ? this.metrics.successfulGenerations / (this.metrics.successfulGenerations + this.metrics.failedGenerations)
      : 1;

    if (successRate < 0.8 || this.generationQueue.length > 20) {
      status = 'critical';
    } else if (successRate < 0.9 || this.generationQueue.length > 10) {
      status = 'warning';
    }

    return {
      status,
      totalReports: this.metrics.totalReports,
      queueSize: this.generationQueue.length,
      successRate,
      storageUsage: this.metrics.storageUsed,
      lastUpdated: new Date()
    };
  }
}
