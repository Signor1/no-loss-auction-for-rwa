import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Asset, AssetValidation, ValidationCheck, ValidationIssue, ValidationCheckType, ValidationCheckStatus, ValidationIssueSeverity, ValidationIssueStatus } from './assetRegistry'

// Validation rule interface
export interface ValidationRule {
  id: string
  name: string
  type: ValidationCheckType
  description: string
  severity: ValidationIssueSeverity
  enabled: boolean
  required: boolean
  weight: number
  condition: ValidationCondition
  actions: ValidationAction[]
}

// Validation condition interface
export interface ValidationCondition {
  field: string
  operator: ValidationOperator
  value: any
  nestedConditions?: ValidationCondition[]
  logicOperator?: 'AND' | 'OR'
}

// Validation operator enum
export enum ValidationOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_EQUAL = 'greater_equal',
  LESS_EQUAL = 'less_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  LENGTH_GREATER = 'length_greater',
  LENGTH_LESS = 'length_less',
  DATE_BEFORE = 'date_before',
  DATE_AFTER = 'date_after'
}

// Validation action interface
export interface ValidationAction {
  type: ValidationActionType
  parameters: Record<string, any>
  condition?: ValidationCondition
}

// Validation action type enum
export enum ValidationActionType {
  CREATE_ISSUE = 'create_issue',
  SEND_NOTIFICATION = 'send_notification',
  REQUIRE_DOCUMENT = 'require_document',
  SET_STATUS = 'set_status',
  ASSIGN_REVIEWER = 'assign_reviewer',
  CALCULATE_SCORE = 'calculate_score'
}

// Validation template interface
export interface ValidationTemplate {
  id: string
  name: string
  description: string
  assetType: string
  rules: ValidationRule[]
  version: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

// Validation report interface
export interface ValidationReport {
  id: string
  assetId: string
  templateId: string
  validationDate: Date
  validatedBy: string
  overallScore: number
  status: ValidationReportStatus
  checks: ValidationCheck[]
  issues: ValidationIssue[]
  recommendations: string[]
  nextReviewDate: Date
  requiredActions: string[]
  metadata: Record<string, any>
}

// Validation report status enum
export enum ValidationReportStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Validation workflow interface
export interface ValidationWorkflow {
  id: string
  name: string
  description: string
  steps: ValidationWorkflowStep[]
  triggers: ValidationTrigger[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Validation workflow step interface
export interface ValidationWorkflowStep {
  id: string
  name: string
  type: ValidationStepType
  order: number
  config: Record<string, any>
  conditions: ValidationCondition[]
  actions: ValidationAction[]
  timeout?: number
  retryCount?: number
}

// Validation step type enum
export enum ValidationStepType {
  DATA_COLLECTION = 'data_collection',
  DOCUMENT_VERIFICATION = 'document_verification',
  EXTERNAL_API_CHECK = 'external_api_check',
  MANUAL_REVIEW = 'manual_review',
  AUTOMATED_VALIDATION = 'automated_validation',
  RISK_ASSESSMENT = 'risk_assessment',
  COMPLIANCE_CHECK = 'compliance_check'
}

// Validation trigger interface
export interface ValidationTrigger {
  type: ValidationTriggerType
  conditions: ValidationCondition[]
  actions: ValidationAction[]
}

// Validation trigger type enum
export enum ValidationTriggerType {
  ASSET_CREATED = 'asset_created',
  ASSET_UPDATED = 'asset_updated',
  DOCUMENT_UPLOADED = 'document_uploaded',
  STATUS_CHANGED = 'status_changed',
  SCHEDULED = 'scheduled',
  MANUAL = 'manual'
}

// Asset validation service
export class AssetValidationService extends EventEmitter {
  private validationRules: Map<string, ValidationRule> = new Map()
  private validationTemplates: Map<string, ValidationTemplate> = new Map()
  private validationWorkflows: Map<string, ValidationWorkflow> = new Map()
  private validationReports: Map<string, ValidationReport> = new Map()
  private logger: Logger
  private isRunning: boolean = false
  private defaultTimeout: number = 300000 // 5 minutes
  private maxRetries: number = 3

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start validation service
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Asset validation service already started')
      return
    }

    this.isRunning = true
    this.logger.info('Starting asset validation service...')

    // Load validation rules and templates
    await this.loadValidationData()

    // Initialize default rules
    await this.initializeDefaultRules()

    // Start scheduled validations
    this.startScheduledValidations()

    this.logger.info('Asset validation service started')
    this.emit('validation:started')
  }

  // Stop validation service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping asset validation service...')

    // Save validation data
    await this.saveValidationData()

    this.logger.info('Asset validation service stopped')
    this.emit('validation:stopped')
  }

  // Validate asset
  async validateAsset(asset: Asset, templateId?: string, validator: string): Promise<ValidationReport> {
    const reportId = this.generateReportId()

    try {
      this.logger.debug(`Starting asset validation: ${asset.id}`)

      // Get validation template
      const template = templateId ? 
        this.validationTemplates.get(templateId) : 
        this.getDefaultTemplate(asset.type)

      if (!template) {
        throw new Error(`Validation template not found: ${templateId}`)
      }

      // Create validation report
      const report: ValidationReport = {
        id: reportId,
        assetId: asset.id,
        templateId: template.id,
        validationDate: new Date(),
        validatedBy: validator,
        overallScore: 0,
        status: ValidationReportStatus.IN_PROGRESS,
        checks: [],
        issues: [],
        recommendations: [],
        nextReviewDate: new Date(),
        requiredActions: [],
        metadata: {}
      }

      this.validationReports.set(reportId, report)

      // Execute validation rules
      const results = await this.executeValidationRules(asset, template.rules, validator)

      // Update report with results
      report.checks = results.checks
      report.issues = results.issues
      report.overallScore = this.calculateOverallScore(results.checks)
      report.recommendations = this.generateRecommendations(results.issues)
      report.requiredActions = this.getRequiredActions(results.issues)
      report.status = ValidationReportStatus.COMPLETED

      // Set next review date
      report.nextReviewDate = this.calculateNextReviewDate(report)

      // Save report
      await this.saveValidationReport(report)

      this.logger.info(`Asset validation completed: ${asset.id} with score ${report.overallScore}`)
      this.emit('validation:completed', { asset, report })

      return report

    } catch (error) {
      const report = this.validationReports.get(reportId)
      if (report) {
        report.status = ValidationReportStatus.FAILED
        await this.saveValidationReport(report)
      }

      this.logger.error(`Asset validation failed: ${asset.id}`, error)
      this.emit('validation:error', { asset, error })
      throw error
    }
  }

  // Execute validation rules
  private async executeValidationRules(asset: Asset, rules: ValidationRule[], validator: string): Promise<{
    checks: ValidationCheck[]
    issues: ValidationIssue[]
  }> {
    const checks: ValidationCheck[] = []
    const issues: ValidationIssue[] = []

    for (const rule of rules) {
      if (!rule.enabled) {
        continue
      }

      try {
        const check = await this.executeValidationRule(asset, rule, validator)
        checks.push(check)

        // Create issues for failed checks
        if (check.status === ValidationCheckStatus.FAILED) {
          const issue = await this.createValidationIssue(asset, rule, check)
          issues.push(issue)
        }

      } catch (error) {
        this.logger.error(`Failed to execute validation rule: ${rule.id}`, error)
        
        // Create a failed check
        const failedCheck: ValidationCheck = {
          id: this.generateCheckId(),
          name: rule.name,
          type: rule.type,
          status: ValidationCheckStatus.FAILED,
          score: 0,
          details: `Rule execution failed: ${error.message}`,
          evidence: [],
          performedAt: new Date(),
          performedBy: validator
        }
        checks.push(failedCheck)
      }
    }

    return { checks, issues }
  }

  // Execute single validation rule
  private async executeValidationRule(asset: Asset, rule: ValidationRule, validator: string): Promise<ValidationCheck> {
    const startTime = Date.now()

    try {
      // Evaluate condition
      const conditionResult = await this.evaluateCondition(rule.condition, asset)
      
      // Execute actions based on condition result
      const actions = conditionResult ? rule.actions : []

      // Calculate score
      const score = conditionResult ? rule.weight : 0

      // Gather evidence
      const evidence = await this.gatherEvidence(asset, rule)

      const check: ValidationCheck = {
        id: this.generateCheckId(),
        name: rule.name,
        type: rule.type,
        status: conditionResult ? ValidationCheckStatus.PASSED : ValidationCheckStatus.FAILED,
        score,
        details: conditionResult ? 'Validation passed' : 'Validation failed',
        evidence,
        performedAt: new Date(),
        performedBy: validator
      }

      // Execute actions
      await this.executeActions(actions, asset, check)

      return check

    } catch (error) {
      const check: ValidationCheck = {
        id: this.generateCheckId(),
        name: rule.name,
        type: rule.type,
        status: ValidationCheckStatus.FAILED,
        score: 0,
        details: `Rule execution error: ${error.message}`,
        evidence: [],
        performedAt: new Date(),
        performedBy: validator
      }

      return check
    }
  }

  // Evaluate validation condition
  private async evaluateCondition(condition: ValidationCondition, asset: Asset): Promise<boolean> {
    try {
      // Get field value from asset
      const fieldValue = this.getFieldValue(asset, condition.field)
      
      // Apply operator
      const result = this.applyOperator(fieldValue, condition.operator, condition.value)

      // Handle nested conditions
      if (condition.nestedConditions && condition.nestedConditions.length > 0) {
        const nestedResults = await Promise.all(
          condition.nestedConditions.map(nested => this.evaluateCondition(nested, asset))
        )

        if (condition.logicOperator === 'OR') {
          return result || nestedResults.some(r => r)
        } else {
          return result && nestedResults.every(r => r)
        }
      }

      return result

    } catch (error) {
      this.logger.error(`Failed to evaluate condition: ${condition.field}`, error)
      return false
    }
  }

  // Get field value from asset
  private getFieldValue(asset: Asset, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value: any = asset

    for (const part of parts) {
      if (value === null || value === undefined) {
        return null
      }
      value = value[part]
    }

    return value
  }

  // Apply validation operator
  private applyOperator(fieldValue: any, operator: ValidationOperator, expectedValue: any): boolean {
    switch (operator) {
      case ValidationOperator.EQUALS:
        return fieldValue === expectedValue
      case ValidationOperator.NOT_EQUALS:
        return fieldValue !== expectedValue
      case ValidationOperator.GREATER_THAN:
        return Number(fieldValue) > Number(expectedValue)
      case ValidationOperator.LESS_THAN:
        return Number(fieldValue) < Number(expectedValue)
      case ValidationOperator.GREATER_EQUAL:
        return Number(fieldValue) >= Number(expectedValue)
      case ValidationOperator.LESS_EQUAL:
        return Number(fieldValue) <= Number(expectedValue)
      case ValidationOperator.CONTAINS:
        return String(fieldValue).includes(String(expectedValue))
      case ValidationOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(expectedValue))
      case ValidationOperator.STARTS_WITH:
        return String(fieldValue).startsWith(String(expectedValue))
      case ValidationOperator.ENDS_WITH:
        return String(fieldValue).endsWith(String(expectedValue))
      case ValidationOperator.REGEX:
        return new RegExp(expectedValue).test(String(fieldValue))
      case ValidationOperator.IN:
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
      case ValidationOperator.NOT_IN:
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue)
      case ValidationOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined
      case ValidationOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined
      case ValidationOperator.LENGTH_GREATER:
        return String(fieldValue).length > Number(expectedValue)
      case ValidationOperator.LENGTH_LESS:
        return String(fieldValue).length < Number(expectedValue)
      case ValidationOperator.DATE_BEFORE:
        return new Date(fieldValue) < new Date(expectedValue)
      case ValidationOperator.DATE_AFTER:
        return new Date(fieldValue) > new Date(expectedValue)
      default:
        return false
    }
  }

  // Execute validation actions
  private async executeActions(actions: ValidationAction[], asset: Asset, check: ValidationCheck): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, asset, check)
      } catch (error) {
        this.logger.error(`Failed to execute validation action: ${action.type}`, error)
      }
    }
  }

  // Execute single validation action
  private async executeAction(action: ValidationAction, asset: Asset, check: ValidationCheck): Promise<void> {
    switch (action.type) {
      case ValidationActionType.CREATE_ISSUE:
        // Issue creation is handled in the main validation flow
        break
      case ValidationActionType.SEND_NOTIFICATION:
        await this.sendNotification(asset, check, action.parameters)
        break
      case ValidationActionType.REQUIRE_DOCUMENT:
        await this.requireDocument(asset, action.parameters)
        break
      case ValidationActionType.SET_STATUS:
        await this.setAssetStatus(asset, action.parameters.status)
        break
      case ValidationActionType.ASSIGN_REVIEWER:
        await this.assignReviewer(asset, action.parameters.reviewer)
        break
      case ValidationActionType.CALCULATE_SCORE:
        // Score calculation is handled in the main validation flow
        break
      default:
        this.logger.warn(`Unknown validation action type: ${action.type}`)
    }
  }

  // Create validation issue
  private async createValidationIssue(asset: Asset, rule: ValidationRule, check: ValidationCheck): Promise<ValidationIssue> {
    const issue: ValidationIssue = {
      id: this.generateIssueId(),
      severity: rule.severity,
      category: rule.type,
      description: `Validation failed: ${rule.description}`,
      impact: `Failed validation check: ${rule.name}`,
      resolution: `Address the validation requirements for ${rule.name}`,
      status: ValidationIssueStatus.OPEN,
      reportedAt: new Date()
    }

    this.emit('issue:created', { asset, issue })
    return issue
  }

  // Calculate overall validation score
  private calculateOverallScore(checks: ValidationCheck[]): number {
    if (checks.length === 0) {
      return 0
    }

    const totalWeight = checks.reduce((sum, check) => sum + check.score, 0)
    const maxWeight = checks.length * 100 // Assuming max score per check is 100

    return Math.round((totalWeight / maxWeight) * 100)
  }

  // Generate recommendations
  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = []

    for (const issue of issues) {
      switch (issue.severity) {
        case ValidationIssueSeverity.CRITICAL:
          recommendations.push(`Critical issue: ${issue.description}. Immediate action required.`)
          break
        case ValidationIssueSeverity.HIGH:
          recommendations.push(`High priority: ${issue.description}. Address within 24 hours.`)
          break
        case ValidationIssueSeverity.MEDIUM:
          recommendations.push(`Medium priority: ${issue.description}. Address within 7 days.`)
          break
        case ValidationIssueSeverity.LOW:
          recommendations.push(`Low priority: ${issue.description}. Address in next review cycle.`)
          break
      }
    }

    return recommendations
  }

  // Get required actions
  private getRequiredActions(issues: ValidationIssue[]): string[] {
    const actions: string[] = []

    for (const issue of issues) {
      if (issue.severity === ValidationIssueSeverity.CRITICAL || issue.severity === ValidationIssueSeverity.HIGH) {
        actions.push(`Resolve issue: ${issue.description}`)
      }
    }

    return actions
  }

  // Calculate next review date
  private calculateNextReviewDate(report: ValidationReport): Date {
    const baseInterval = 30 * 24 * 60 * 60 * 1000 // 30 days

    // Adjust interval based on score
    let multiplier = 1
    if (report.overallScore >= 90) {
      multiplier = 2 // 60 days for high scores
    } else if (report.overallScore < 70) {
      multiplier = 0.5 // 15 days for low scores
    }

    // Adjust for critical issues
    const hasCriticalIssues = report.issues.some(issue => issue.severity === ValidationIssueSeverity.CRITICAL)
    if (hasCriticalIssues) {
      multiplier = 0.25 // 7 days for critical issues
    }

    return new Date(Date.now() + baseInterval * multiplier)
  }

  // Create validation template
  async createTemplate(templateData: Omit<ValidationTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<ValidationTemplate> {
    const templateId = this.generateTemplateId()

    const template: ValidationTemplate = {
      id: templateId,
      ...templateData,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.validationTemplates.set(templateId, template)
    await this.saveValidationTemplate(template)

    this.logger.info(`Validation template created: ${templateId}`)
    this.emit('template:created', { template })

    return template
  }

  // Update validation template
  async updateTemplate(templateId: string, updates: Partial<ValidationTemplate>, updatedBy: string): Promise<ValidationTemplate> {
    const template = this.validationTemplates.get(templateId)
    if (!template) {
      throw new Error(`Validation template not found: ${templateId}`)
    }

    const updatedTemplate: ValidationTemplate = {
      ...template,
      ...updates,
      version: template.version + 1,
      updatedAt: new Date(),
      updatedBy
    }

    this.validationTemplates.set(templateId, updatedTemplate)
    await this.saveValidationTemplate(updatedTemplate)

    this.logger.info(`Validation template updated: ${templateId}`)
    this.emit('template:updated', { template: updatedTemplate })

    return updatedTemplate
  }

  // Get validation template
  getTemplate(templateId: string): ValidationTemplate | null {
    return this.validationTemplates.get(templateId) || null
  }

  // Get all templates
  getAllTemplates(): ValidationTemplate[] {
    return Array.from(this.validationTemplates.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get validation report
  getReport(reportId: string): ValidationReport | null {
    return this.validationReports.get(reportId) || null
  }

  // Get reports by asset
  getReportsByAsset(assetId: string): ValidationReport[] {
    return Array.from(this.validationReports.values())
      .filter(report => report.assetId === assetId)
      .sort((a, b) => b.validationDate.getTime() - a.validationDate.getTime())
  }

  // Get validation statistics
  getValidationStatistics(): ValidationStatistics {
    const reports = Array.from(this.validationReports.values())

    return {
      totalReports: reports.length,
      averageScore: this.calculateAverageScore(reports),
      reportsByStatus: this.countReportsByStatus(reports),
      reportsByScore: this.countReportsByScore(reports),
      recentReports: reports.slice(0, 10),
      criticalIssues: this.countIssuesBySeverity(reports, ValidationIssueSeverity.CRITICAL),
      highIssues: this.countIssuesBySeverity(reports, ValidationIssueSeverity.HIGH),
      mediumIssues: this.countIssuesBySeverity(reports, ValidationIssueSeverity.MEDIUM),
      lowIssues: this.countIssuesBySeverity(reports, ValidationIssueSeverity.LOW),
      nextReviews: this.getUpcomingReviews(reports)
    }
  }

  // Private helper methods
  private getDefaultTemplate(assetType: string): ValidationTemplate | null {
    // Find default template for asset type
    for (const template of this.validationTemplates.values()) {
      if (template.assetType === assetType && template.isActive) {
        return template
      }
    }
    return null
  }

  private async gatherEvidence(asset: Asset, rule: ValidationRule): Promise<string[]> {
    const evidence: string[] = []

    // Gather field values as evidence
    if (rule.condition.field) {
      const fieldValue = this.getFieldValue(asset, rule.condition.field)
      evidence.push(`${rule.condition.field}: ${JSON.stringify(fieldValue)}`)
    }

    // Add document evidence if available
    if (asset.documents && asset.documents.length > 0) {
      evidence.push(`Documents: ${asset.documents.length} available`)
    }

    return evidence
  }

  private async sendNotification(asset: Asset, check: ValidationCheck, parameters: Record<string, any>): Promise<void> {
    // This would send notifications via your notification system
    this.logger.info(`Notification sent for asset ${asset.id}: ${check.name}`)
  }

  private async requireDocument(asset: Asset, parameters: Record<string, any>): Promise<void> {
    // This would create a document requirement
    this.logger.info(`Document required for asset ${asset.id}: ${parameters.documentType}`)
  }

  private async setAssetStatus(asset: Asset, status: string): Promise<void> {
    // This would update the asset status
    this.logger.info(`Asset status updated: ${asset.id} -> ${status}`)
  }

  private async assignReviewer(asset: Asset, reviewer: string): Promise<void> {
    // This would assign a reviewer to the asset
    this.logger.info(`Reviewer assigned: ${asset.id} -> ${reviewer}`)
  }

  private calculateAverageScore(reports: ValidationReport[]): number {
    if (reports.length === 0) return 0
    const total = reports.reduce((sum, report) => sum + report.overallScore, 0)
    return Math.round(total / reports.length)
  }

  private countReportsByStatus(reports: ValidationReport[]): Record<ValidationReportStatus, number> {
    const counts = {} as Record<ValidationReportStatus, number>
    for (const report of reports) {
      counts[report.status] = (counts[report.status] || 0) + 1
    }
    return counts
  }

  private countReportsByScore(reports: ValidationReport[]): Record<string, number> {
    const ranges = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      '0-59': 0
    }

    for (const report of reports) {
      const score = report.overallScore
      if (score >= 90) ranges['90-100']++
      else if (score >= 80) ranges['80-89']++
      else if (score >= 70) ranges['70-79']++
      else if (score >= 60) ranges['60-69']++
      else ranges['0-59']++
    }

    return ranges
  }

  private countIssuesBySeverity(reports: ValidationReport[], severity: ValidationIssueSeverity): number {
    return reports.reduce((count, report) => 
      count + report.issues.filter(issue => issue.severity === severity).length, 0)
  }

  private getUpcomingReviews(reports: ValidationReport[]): Array<{ assetId: string; nextReviewDate: Date; daysUntil: number }> {
    const now = new Date()
    const upcoming = reports
      .filter(report => report.nextReviewDate > now)
      .map(report => ({
        assetId: report.assetId,
        nextReviewDate: report.nextReviewDate,
        daysUntil: Math.ceil((report.nextReviewDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10)

    return upcoming
  }

  private async initializeDefaultRules(): Promise<void> {
    // Initialize default validation rules if none exist
    if (this.validationTemplates.size === 0) {
      await this.createDefaultTemplates()
    }
  }

  private async createDefaultTemplates(): Promise<void> {
    // Create default validation templates for different asset types
    const defaultTemplates = [
      {
        name: 'Real Estate Validation',
        description: 'Standard validation rules for real estate assets',
        assetType: 'real_estate',
        rules: this.getRealEstateRules(),
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        name: 'Art Validation',
        description: 'Standard validation rules for art assets',
        assetType: 'art',
        rules: this.getArtRules(),
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system'
      }
    ]

    for (const templateData of defaultTemplates) {
      await this.createTemplate(templateData)
    }
  }

  private getRealEstateRules(): ValidationRule[] {
    return [
      {
        id: 're_001',
        name: 'Property Title Verification',
        type: ValidationCheckType.DOCUMENT_VERIFICATION,
        description: 'Verify property title documents',
        severity: ValidationIssueSeverity.CRITICAL,
        enabled: true,
        required: true,
        weight: 100,
        condition: {
          field: 'documents',
          operator: ValidationOperator.CONTAINS,
          value: 'title_deed'
        },
        actions: [
          {
            type: ValidationActionType.REQUIRE_DOCUMENT,
            parameters: { documentType: 'title_deed' }
          }
        ]
      },
      {
        id: 're_002',
        name: 'Property Valuation',
        type: ValidationCheckType.FINANCIAL_VALUATION,
        description: 'Verify property valuation',
        severity: ValidationIssueSeverity.HIGH,
        enabled: true,
        required: true,
        weight: 80,
        condition: {
          field: 'metadata.financial.currentValue',
          operator: ValidationOperator.GREATER_THAN,
          value: 0
        },
        actions: []
      }
    ]
  }

  private getArtRules(): ValidationRule[] {
    return [
      {
        id: 'art_001',
        name: 'Art Authentication',
        type: ValidationCheckType.DOCUMENT_VERIFICATION,
        description: 'Verify art authentication documents',
        severity: ValidationIssueSeverity.CRITICAL,
        enabled: true,
        required: true,
        weight: 100,
        condition: {
          field: 'documents',
          operator: ValidationOperator.CONTAINS,
          value: 'certificate'
        },
        actions: [
          {
            type: ValidationActionType.REQUIRE_DOCUMENT,
            parameters: { documentType: 'certificate' }
          }
        ]
      }
    ]
  }

  private startScheduledValidations(): void {
    // Schedule periodic validations
    setInterval(() => {
      this.performScheduledValidations()
    }, 24 * 60 * 60 * 1000) // Daily
  }

  private async performScheduledValidations(): Promise<void> {
    // This would identify assets needing validation and trigger them
    this.logger.debug('Performing scheduled validations')
  }

  // ID generation methods
  private generateReportId(): string {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCheckId(): string {
    return `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateIssueId(): string {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Data persistence methods
  private async saveValidationReport(report: ValidationReport): Promise<void> {
    // This would save to your database
    this.logger.debug(`Validation report saved: ${report.id}`)
  }

  private async saveValidationTemplate(template: ValidationTemplate): Promise<void> {
    // This would save to your database
    this.logger.debug(`Validation template saved: ${template.id}`)
  }

  private async loadValidationData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading validation data...')
  }

  private async saveValidationData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving validation data...')
  }

  // Export methods
  exportValidationData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      templates: Array.from(this.validationTemplates.values()),
      reports: Array.from(this.validationReports.values()),
      statistics: this.getValidationStatistics()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'assetId', 'overallScore', 'status', 'validationDate']
      const csvRows = [headers.join(',')]
      
      for (const report of this.validationReports.values()) {
        csvRows.push([
          report.id,
          report.assetId,
          report.overallScore.toString(),
          report.status,
          report.validationDate.toISOString()
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Health status
  getHealthStatus(): {
    isRunning: boolean
    totalTemplates: number
    totalReports: number
    lastActivity: Date
    metrics: ValidationStatistics
  } {
    return {
      isRunning: this.isRunning,
      totalTemplates: this.validationTemplates.size,
      totalReports: this.validationReports.size,
      lastActivity: new Date(),
      metrics: this.getValidationStatistics()
    }
  }
}

// Supporting interfaces
export interface ValidationStatistics {
  totalReports: number
  averageScore: number
  reportsByStatus: Record<ValidationReportStatus, number>
  reportsByScore: Record<string, number>
  recentReports: ValidationReport[]
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  nextReviews: Array<{ assetId: string; nextReviewDate: Date; daysUntil: number }>
}

export default AssetValidationService
