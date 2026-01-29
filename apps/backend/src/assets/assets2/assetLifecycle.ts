import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Asset, AssetLifecycleStage, AssetStatus } from './assetRegistry'

// Lifecycle event interface
export interface LifecycleEvent {
  id: string
  assetId: string
  eventType: LifecycleEventType
  previousStage?: AssetLifecycleStage
  currentStage: AssetLifecycleStage
  previousStatus?: AssetStatus
  currentStatus: AssetStatus
  timestamp: Date
  triggeredBy: string
  reason: string
  metadata: Record<string, any>
  documents: string[]
  approvals: LifecycleApproval[]
  conditions: LifecycleCondition[]
  automated: boolean
}

// Lifecycle event type enum
export enum LifecycleEventType {
  STAGE_TRANSITION = 'stage_transition',
  STATUS_CHANGE = 'status_change',
  AUTOMATED_TRANSITION = 'automated_transition',
  MANUAL_OVERRIDE = 'manual_override',
  EXPIRY = 'expiry',
  COMPLETION = 'completion',
  CANCELLATION = 'cancellation',
  SUSPENSION = 'suspension',
  REACTIVATION = 'reactivation'
}

// Lifecycle approval interface
export interface LifecycleApproval {
  id: string
  approver: string
  role: string
  decision: ApprovalDecision
  timestamp: Date
  comments?: string
  conditions: string[]
}

// Approval decision enum
export enum ApprovalDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
  CONDITIONAL = 'conditional'
}

// Lifecycle condition interface
export interface LifecycleCondition {
  id: string
  type: ConditionType
  description: string
  required: boolean
  met: boolean
  checkedAt: Date
  checkedBy: string
  evidence: string[]
  dueDate?: Date
}

// Condition type enum
export enum ConditionType {
  DOCUMENT_SUBMISSION = 'document_submission',
  VALIDATION_COMPLETION = 'validation_completion',
  PAYMENT_RECEIVED = 'payment_received',
  REGISTRATION_COMPLETE = 'registration_complete',
  INSPECTION_PASSED = 'inspection_passed',
  APPROVAL_OBTAINED = 'approval_obtained',
  TIME_ELAPSED = 'time_elapsed',
  CUSTOM = 'custom'
}

// Lifecycle workflow interface
export interface LifecycleWorkflow {
  id: string
  name: string
  description: string
  assetType: string
  stages: WorkflowStage[]
  transitions: WorkflowTransition[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

// Workflow stage interface
export interface WorkflowStage {
  id: string
  name: string
  description: string
  stage: AssetLifecycleStage
  order: number
  duration?: number // in days
  requirements: StageRequirement[]
  automations: StageAutomation[]
  notifications: StageNotification[]
  permissions: StagePermission[]
}

// Stage requirement interface
export interface StageRequirement {
  id: string
  type: RequirementType
  description: string
  required: boolean
  conditions: LifecycleCondition[]
  documents: string[]
  validations: string[]
  approvals: ApprovalRequirement[]
}

// Requirement type enum
export enum RequirementType {
  DOCUMENT = 'document',
  VALIDATION = 'validation',
  APPROVAL = 'approval',
  PAYMENT = 'payment',
  INSPECTION = 'inspection',
  REGISTRATION = 'registration',
  CUSTOM = 'custom'
}

// Approval requirement interface
export interface ApprovalRequirement {
  role: string
  minApprovals: number
  timeout: number // in hours
  canDelegate: boolean
}

// Stage automation interface
export interface StageAutomation {
  id: string
  trigger: AutomationTrigger
  action: AutomationAction
  condition?: string
  enabled: boolean
}

// Automation trigger enum
export enum AutomationTrigger {
  STAGE_ENTRY = 'stage_entry',
  STAGE_EXIT = 'stage_exit',
  DOCUMENT_UPLOADED = 'document_uploaded',
  VALIDATION_COMPLETED = 'validation_completed',
  APPROVAL_RECEIVED = 'approval_received',
  TIME_BASED = 'time_based',
  CUSTOM = 'custom'
}

// Automation action enum
export enum AutomationAction {
  SEND_NOTIFICATION = 'send_notification',
  CREATE_TASK = 'create_task',
  UPDATE_STATUS = 'update_status',
  TRANSITION_STAGE = 'transition_stage',
  REQUEST_DOCUMENT = 'request_document',
  SCHEDULE_VALIDATION = 'schedule_validation',
  CUSTOM = 'custom'
}

// Stage notification interface
export interface StageNotification {
  id: string
  type: NotificationType
  recipients: string[]
  template: string
  trigger: NotificationTrigger
  enabled: boolean
}

// Notification type enum
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}

// Notification trigger enum
export enum NotificationTrigger {
  STAGE_ENTRY = 'stage_entry',
  STAGE_EXIT = 'stage_exit',
  DEADLINE_APPROACHING = 'deadline_approaching',
  DEADLINE_MISSED = 'deadline_missed',
  REQUIREMENT_MET = 'requirement_met',
  REQUIREMENT_FAILED = 'requirement_failed'
}

// Stage permission interface
export interface StagePermission {
  role: string
  permissions: string[]
  conditions: string[]
}

// Workflow transition interface
export interface WorkflowTransition {
  id: string
  fromStage: AssetLifecycleStage
  toStage: AssetLifecycleStage
  conditions: TransitionCondition[]
  approvals: ApprovalRequirement[]
  automations: StageAutomation[]
  allowedRoles: string[]
  timeout?: number
}

// Transition condition interface
export interface TransitionCondition {
  type: ConditionType
  description: string
  required: boolean
  validator: string
  parameters: Record<string, any>
}

// Lifecycle tracking interface
export interface LifecycleTracking {
  assetId: string
  currentStage: AssetLifecycleStage
  currentStatus: AssetStatus
  stageHistory: LifecycleStageHistory[]
  statusHistory: LifecycleStatusHistory[]
  upcomingEvents: LifecycleEvent[]
  overdueRequirements: StageRequirement[]
  nextMilestone: WorkflowStage
  estimatedCompletion: Date
  progress: number
}

// Lifecycle stage history interface
export interface LifecycleStageHistory {
  stage: AssetLifecycleStage
  enteredAt: Date
  exitedAt?: Date
  duration?: number
  events: string[]
  notes: string
}

// Lifecycle status history interface
export interface LifecycleStatusHistory {
  status: AssetStatus
  changedAt: Date
  changedBy: string
  reason: string
  events: string[]
}

// Asset lifecycle service
export class AssetLifecycleService extends EventEmitter {
  private workflows: Map<string, LifecycleWorkflow> = new Map()
  private lifecycleEvents: Map<string, LifecycleEvent> = new Map()
  private lifecycleTracking: Map<string, LifecycleTracking> = new Map()
  private logger: Logger
  private isRunning: boolean = false
  private defaultTimeout: number = 86400000 // 24 hours
  private maxEvents: number = 10000

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start lifecycle service
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Asset lifecycle service already started')
      return
    }

    this.isRunning = true
    this.logger.info('Starting asset lifecycle service...')

    // Load workflows and tracking data
    await this.loadLifecycleData()

    // Initialize default workflows
    await this.initializeDefaultWorkflows()

    // Start automated processing
    this.startAutomatedProcessing()

    this.logger.info('Asset lifecycle service started')
    this.emit('lifecycle:started')
  }

  // Stop lifecycle service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping asset lifecycle service...')

    // Save lifecycle data
    await this.saveLifecycleData()

    this.logger.info('Asset lifecycle service stopped')
    this.emit('lifecycle:stopped')
  }

  // Initialize asset lifecycle
  async initializeLifecycle(asset: Asset, workflowId?: string): Promise<LifecycleTracking> {
    const trackingId = this.generateTrackingId()

    try {
      this.logger.debug(`Initializing lifecycle for asset: ${asset.id}`)

      // Get workflow
      const workflow = workflowId ? 
        this.workflows.get(workflowId) : 
        this.getDefaultWorkflow(asset.type)

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
      }

      // Create lifecycle tracking
      const tracking: LifecycleTracking = {
        assetId: asset.id,
        currentStage: AssetLifecycleStage.CREATION,
        currentStatus: asset.status,
        stageHistory: [{
          stage: AssetLifecycleStage.CREATION,
          enteredAt: new Date(),
          events: [],
          notes: 'Asset created'
        }],
        statusHistory: [{
          status: asset.status,
          changedAt: new Date(),
          changedBy: asset.createdBy,
          reason: 'Asset creation',
          events: []
        }],
        upcomingEvents: [],
        overdueRequirements: [],
        nextMilestone: workflow.stages[1] || workflow.stages[0],
        estimatedCompletion: this.calculateEstimatedCompletion(workflow),
        progress: 0
      }

      this.lifecycleTracking.set(trackingId, tracking)
      await this.saveLifecycleTracking(tracking)

      // Create initial lifecycle event
      await this.createLifecycleEvent({
        assetId: asset.id,
        eventType: LifecycleEventType.STAGE_TRANSITION,
        currentStage: AssetLifecycleStage.CREATION,
        currentStatus: asset.status,
        triggeredBy: asset.createdBy,
        reason: 'Asset initialization',
        automated: true
      })

      this.logger.info(`Lifecycle initialized for asset: ${asset.id}`)
      this.emit('lifecycle:initialized', { asset, tracking })

      return tracking

    } catch (error) {
      this.logger.error(`Failed to initialize lifecycle for asset: ${asset.id}`, error)
      this.emit('lifecycle:error', { error, assetId: asset.id })
      throw error
    }
  }

  // Transition asset to next stage
  async transitionStage(assetId: string, toStage: AssetLifecycleStage, triggeredBy: string, reason?: string): Promise<LifecycleEvent> {
    const tracking = this.getTrackingByAsset(assetId)
    if (!tracking) {
      throw new Error(`Lifecycle tracking not found for asset: ${assetId}`)
    }

    try {
      this.logger.debug(`Transitioning asset ${assetId} to stage: ${toStage}`)

      const previousStage = tracking.currentStage
      const workflow = this.getWorkflowForAsset(assetId)

      if (!workflow) {
        throw new Error(`Workflow not found for asset: ${assetId}`)
      }

      // Validate transition
      await this.validateTransition(workflow, previousStage, toStage, triggeredBy)

      // Check transition conditions
      const conditions = await this.checkTransitionConditions(workflow, previousStage, toStage, assetId)

      // Create lifecycle event
      const event = await this.createLifecycleEvent({
        assetId,
        eventType: LifecycleEventType.STAGE_TRANSITION,
        previousStage,
        currentStage: toStage,
        currentStatus: tracking.currentStatus,
        triggeredBy,
        reason: reason || `Transition from ${previousStage} to ${toStage}`,
        conditions,
        automated: false
      })

      // Update tracking
      await this.updateTracking(assetId, {
        currentStage: toStage,
        stageHistory: [
          ...tracking.stageHistory,
          {
            stage: toStage,
            enteredAt: new Date(),
            events: [event.id],
            notes: reason || `Transitioned to ${toStage}`
          }
        ],
        progress: this.calculateProgress(workflow, toStage)
      })

      // Execute stage automations
      await this.executeStageAutomations(workflow, toStage, assetId, triggeredBy)

      this.logger.info(`Asset transitioned to stage: ${assetId} -> ${toStage}`)
      this.emit('stage:transitioned', { assetId, previousStage, currentStage: toStage, event })

      return event

    } catch (error) {
      this.logger.error(`Failed to transition asset stage: ${assetId}`, error)
      this.emit('transition:error', { error, assetId })
      throw error
    }
  }

  // Update asset status
  async updateStatus(assetId: string, newStatus: AssetStatus, triggeredBy: string, reason?: string): Promise<LifecycleEvent> {
    const tracking = this.getTrackingByAsset(assetId)
    if (!tracking) {
      throw new Error(`Lifecycle tracking not found for asset: ${assetId}`)
    }

    try {
      this.logger.debug(`Updating asset status: ${assetId} -> ${newStatus}`)

      const previousStatus = tracking.currentStatus

      // Create lifecycle event
      const event = await this.createLifecycleEvent({
        assetId,
        eventType: LifecycleEventType.STATUS_CHANGE,
        currentStage: tracking.currentStage,
        previousStatus,
        currentStatus: newStatus,
        triggeredBy,
        reason: reason || `Status changed from ${previousStatus} to ${newStatus}`,
        automated: false
      })

      // Update tracking
      await this.updateTracking(assetId, {
        currentStatus: newStatus,
        statusHistory: [
          ...tracking.statusHistory,
          {
            status: newStatus,
            changedAt: new Date(),
            changedBy: triggeredBy,
            reason: reason || `Status updated to ${newStatus}`,
            events: [event.id]
          }
        ]
      })

      this.logger.info(`Asset status updated: ${assetId} -> ${newStatus}`)
      this.emit('status:updated', { assetId, previousStatus, currentStatus: newStatus, event })

      return event

    } catch (error) {
      this.logger.error(`Failed to update asset status: ${assetId}`, error)
      this.emit('status:error', { error, assetId })
      throw error
    }
  }

  // Get lifecycle tracking
  getLifecycleTracking(assetId: string): LifecycleTracking | null {
    return this.getTrackingByAsset(assetId)
  }

  // Get lifecycle events
  getLifecycleEvents(assetId: string, limit?: number): LifecycleEvent[] {
    const events = Array.from(this.lifecycleEvents.values())
      .filter(event => event.assetId === assetId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return limit ? events.slice(0, limit) : events
  }

  // Get stage history
  getStageHistory(assetId: string): LifecycleStageHistory[] {
    const tracking = this.getTrackingByAsset(assetId)
    return tracking ? tracking.stageHistory : []
  }

  // Get status history
  getStatusHistory(assetId: string): LifecycleStatusHistory[] {
    const tracking = this.getTrackingByAsset(assetId)
    return tracking ? tracking.statusHistory : []
  }

  // Get upcoming events
  getUpcomingEvents(assetId: string): LifecycleEvent[] {
    const tracking = this.getTrackingByAsset(assetId)
    return tracking ? tracking.upcomingEvents : []
  }

  // Get overdue requirements
  getOverdueRequirements(assetId: string): StageRequirement[] {
    const tracking = this.getTrackingByAsset(assetId)
    return tracking ? tracking.overdueRequirements : []
  }

  // Get progress percentage
  getProgress(assetId: string): number {
    const tracking = this.getTrackingByAsset(assetId)
    return tracking ? tracking.progress : 0
  }

  // Get estimated completion date
  getEstimatedCompletion(assetId: string): Date | null {
    const tracking = this.getTrackingByAsset(assetId)
    return tracking ? tracking.estimatedCompletion : null
  }

  // Create workflow
  async createWorkflow(workflowData: Omit<LifecycleWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<LifecycleWorkflow> {
    const workflowId = this.generateWorkflowId()

    const workflow: LifecycleWorkflow = {
      id: workflowId,
      ...workflowData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.workflows.set(workflowId, workflow)
    await this.saveWorkflow(workflow)

    this.logger.info(`Workflow created: ${workflowId}`)
    this.emit('workflow:created', { workflow })

    return workflow
  }

  // Update workflow
  async updateWorkflow(workflowId: string, updates: Partial<LifecycleWorkflow>, updatedBy: string): Promise<LifecycleWorkflow> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const updatedWorkflow: LifecycleWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
      updatedBy
    }

    this.workflows.set(workflowId, updatedWorkflow)
    await this.saveWorkflow(updatedWorkflow)

    this.logger.info(`Workflow updated: ${workflowId}`)
    this.emit('workflow:updated', { workflow: updatedWorkflow })

    return updatedWorkflow
  }

  // Get workflow
  getWorkflow(workflowId: string): LifecycleWorkflow | null {
    return this.workflows.get(workflowId) || null
  }

  // Get all workflows
  getAllWorkflows(): LifecycleWorkflow[] {
    return Array.from(this.workflows.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get workflows by asset type
  getWorkflowsByAssetType(assetType: string): LifecycleWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.assetType === assetType && workflow.isActive)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  // Get lifecycle statistics
  getLifecycleStatistics(): LifecycleStatistics {
    const tracking = Array.from(this.lifecycleTracking.values())
    const events = Array.from(this.lifecycleEvents.values())

    return {
      totalAssets: tracking.length,
      assetsByStage: this.countAssetsByStage(tracking),
      assetsByStatus: this.countAssetsByStatus(tracking),
      averageProgress: this.calculateAverageProgress(tracking),
      totalEvents: events.length,
      eventsByType: this.countEventsByType(events),
      recentEvents: events.slice(0, 10),
      overdueRequirements: this.countOverdueRequirements(tracking),
      upcomingMilestones: this.getUpcomingMilestones(tracking),
      workflowUsage: this.getWorkflowUsage(tracking)
    }
  }

  // Private methods
  private async createLifecycleEvent(eventData: Omit<LifecycleEvent, 'id' | 'timestamp'>): Promise<LifecycleEvent> {
    const event: LifecycleEvent = {
      id: this.generateEventId(),
      ...eventData,
      timestamp: new Date()
    }

    this.lifecycleEvents.set(event.id, event)
    await this.saveLifecycleEvent(event)

    return event
  }

  private getTrackingByAsset(assetId: string): LifecycleTracking | null {
    for (const tracking of this.lifecycleTracking.values()) {
      if (tracking.assetId === assetId) {
        return tracking
      }
    }
    return null
  }

  private getWorkflowForAsset(assetId: string): LifecycleWorkflow | null {
    const tracking = this.getTrackingByAsset(assetId)
    if (!tracking) {
      return null
    }

    // Find active workflow for this asset type
    for (const workflow of this.workflows.values()) {
      if (workflow.isActive) {
        return workflow
      }
    }

    return null
  }

  private getDefaultWorkflow(assetType: string): LifecycleWorkflow | null {
    for (const workflow of this.workflows.values()) {
      if (workflow.assetType === assetType && workflow.isActive) {
        return workflow
      }
    }
    return null
  }

  private async validateTransition(workflow: LifecycleWorkflow, fromStage: AssetLifecycleStage, toStage: AssetLifecycleStage, triggeredBy: string): Promise<void> {
    // Find transition rule
    const transition = workflow.transitions.find(t => t.fromStage === fromStage && t.toStage === toStage)
    if (!transition) {
      throw new Error(`Invalid transition: ${fromStage} -> ${toStage}`)
    }

    // Check role permissions
    if (transition.allowedRoles.length > 0) {
      // This would check user roles
      // For now, assume all roles are allowed
    }

    // Check timeout
    if (transition.timeout) {
      const tracking = this.getTrackingByAsset(workflow.id)
      if (tracking) {
        const currentStageHistory = tracking.stageHistory.find(h => h.stage === fromStage)
        if (currentStageHistory && currentStageHistory.enteredAt) {
          const elapsed = Date.now() - currentStageHistory.enteredAt.getTime()
          if (elapsed > transition.timeout * 1000) {
            throw new Error(`Transition timeout exceeded for stage: ${fromStage}`)
          }
        }
      }
    }
  }

  private async checkTransitionConditions(workflow: LifecycleWorkflow, fromStage: AssetLifecycleStage, toStage: AssetLifecycleStage, assetId: string): Promise<LifecycleCondition[]> {
    const transition = workflow.transitions.find(t => t.fromStage === fromStage && t.toStage === toStage)
    if (!transition) {
      return []
    }

    const conditions: LifecycleCondition[] = []

    for (const condition of transition.conditions) {
      const met = await this.evaluateCondition(condition, assetId)
      
      conditions.push({
        id: this.generateConditionId(),
        type: condition.type,
        description: condition.description,
        required: condition.required,
        met,
        checkedAt: new Date(),
        checkedBy: 'system',
        evidence: [],
        dueDate: condition.required ? new Date(Date.now() + 86400000) : undefined // 24 hours
      })

      if (condition.required && !met) {
        throw new Error(`Required condition not met: ${condition.description}`)
      }
    }

    return conditions
  }

  private async evaluateCondition(condition: TransitionCondition, assetId: string): Promise<boolean> {
    // This would evaluate the actual condition
    // For now, return true for all conditions
    return true
  }

  private async updateTracking(assetId: string, updates: Partial<LifecycleTracking>): Promise<void> {
    const tracking = this.getTrackingByAsset(assetId)
    if (!tracking) {
      throw new Error(`Lifecycle tracking not found for asset: ${assetId}`)
    }

    const updatedTracking: LifecycleTracking = {
      ...tracking,
      ...updates
    }

    // Update the tracking in the map
    for (const [trackingId, existingTracking] of this.lifecycleTracking.entries()) {
      if (existingTracking.assetId === assetId) {
        this.lifecycleTracking.set(trackingId, updatedTracking)
        break
      }
    }

    await this.saveLifecycleTracking(updatedTracking)
  }

  private async executeStageAutomations(workflow: LifecycleWorkflow, stage: AssetLifecycleStage, assetId: string, triggeredBy: string): Promise<void> {
    const workflowStage = workflow.stages.find(s => s.stage === stage)
    if (!workflowStage) {
      return
    }

    for (const automation of workflowStage.automations) {
      if (!automation.enabled) {
        continue
      }

      try {
        await this.executeAutomation(automation, assetId, triggeredBy)
      } catch (error) {
        this.logger.error(`Failed to execute automation: ${automation.id}`, error)
      }
    }
  }

  private async executeAutomation(automation: StageAutomation, assetId: string, triggeredBy: string): Promise<void> {
    switch (automation.action) {
      case AutomationAction.SEND_NOTIFICATION:
        await this.sendNotification(assetId, automation)
        break
      case AutomationAction.CREATE_TASK:
        await this.createTask(assetId, automation)
        break
      case AutomationAction.UPDATE_STATUS:
        await this.updateAssetStatus(assetId, automation)
        break
      case AutomationAction.TRANSITION_STAGE:
        await this.transitionAssetStage(assetId, automation)
        break
      case AutomationAction.REQUEST_DOCUMENT:
        await this.requestDocument(assetId, automation)
        break
      case AutomationAction.SCHEDULE_VALIDATION:
        await this.scheduleValidation(assetId, automation)
        break
      default:
        this.logger.warn(`Unknown automation action: ${automation.action}`)
    }
  }

  private async sendNotification(assetId: string, automation: StageAutomation): Promise<void> {
    // This would send notifications via your notification system
    this.logger.info(`Notification sent for asset: ${assetId}`)
  }

  private async createTask(assetId: string, automation: StageAutomation): Promise<void> {
    // This would create tasks in your task management system
    this.logger.info(`Task created for asset: ${assetId}`)
  }

  private async updateAssetStatus(assetId: string, automation: StageAutomation): Promise<void> {
    // This would update the asset status
    this.logger.info(`Asset status updated via automation: ${assetId}`)
  }

  private async transitionAssetStage(assetId: string, automation: StageAutomation): Promise<void> {
    // This would transition the asset stage
    this.logger.info(`Asset stage transitioned via automation: ${assetId}`)
  }

  private async requestDocument(assetId: string, automation: StageAutomation): Promise<void> {
    // This would request documents
    this.logger.info(`Document requested for asset: ${assetId}`)
  }

  private async scheduleValidation(assetId: string, automation: StageAutomation): Promise<void> {
    // This would schedule validation
    this.logger.info(`Validation scheduled for asset: ${assetId}`)
  }

  private calculateProgress(workflow: LifecycleWorkflow, currentStage: AssetLifecycleStage): number {
    const totalStages = workflow.stages.length
    const currentStageIndex = workflow.stages.findIndex(s => s.stage === currentStage)
    
    if (currentStageIndex === -1) {
      return 0
    }

    return Math.round(((currentStageIndex + 1) / totalStages) * 100)
  }

  private calculateEstimatedCompletion(workflow: LifecycleWorkflow): Date {
    const totalDuration = workflow.stages.reduce((sum, stage) => sum + (stage.duration || 0), 0)
    return new Date(Date.now() + totalDuration * 24 * 60 * 60 * 1000)
  }

  // Statistics methods
  private countAssetsByStage(tracking: LifecycleTracking[]): Record<AssetLifecycleStage, number> {
    const counts = {} as Record<AssetLifecycleStage, number>
    for (const item of tracking) {
      counts[item.currentStage] = (counts[item.currentStage] || 0) + 1
    }
    return counts
  }

  private countAssetsByStatus(tracking: LifecycleTracking[]): Record<AssetStatus, number> {
    const counts = {} as Record<AssetStatus, number>
    for (const item of tracking) {
      counts[item.currentStatus] = (counts[item.currentStatus] || 0) + 1
    }
    return counts
  }

  private calculateAverageProgress(tracking: LifecycleTracking[]): number {
    if (tracking.length === 0) return 0
    const total = tracking.reduce((sum, item) => sum + item.progress, 0)
    return Math.round(total / tracking.length)
  }

  private countEventsByType(events: LifecycleEvent[]): Record<LifecycleEventType, number> {
    const counts = {} as Record<LifecycleEventType, number>
    for (const event of events) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1
    }
    return counts
  }

  private countOverdueRequirements(tracking: LifecycleTracking[]): number {
    return tracking.reduce((count, item) => count + item.overdueRequirements.length, 0)
  }

  private getUpcomingMilestones(tracking: LifecycleTracking[]): Array<{ assetId: string; milestone: string; estimatedDate: Date }> {
    return tracking
      .filter(item => item.nextMilestone)
      .map(item => ({
        assetId: item.assetId,
        milestone: item.nextMilestone.name,
        estimatedDate: item.estimatedCompletion
      }))
      .sort((a, b) => a.estimatedDate.getTime() - b.estimatedDate.getTime())
      .slice(0, 10)
  }

  private getWorkflowUsage(tracking: LifecycleTracking[]): Record<string, number> {
    const usage: Record<string, number> = {}
    
    for (const item of tracking) {
      const workflow = this.getWorkflowForAsset(item.assetId)
      if (workflow) {
        usage[workflow.name] = (usage[workflow.name] || 0) + 1
      }
    }

    return usage
  }

  // Automated processing
  private startAutomatedProcessing(): void {
    // Process automated transitions every hour
    setInterval(() => {
      this.processAutomatedTransitions()
    }, 3600000) // Every hour

    // Check for overdue requirements every 6 hours
    setInterval(() => {
      this.checkOverdueRequirements()
    }, 21600000) // Every 6 hours

    // Update progress every 5 minutes
    setInterval(() => {
      this.updateAllProgress()
    }, 300000) // Every 5 minutes
  }

  private async processAutomatedTransitions(): Promise<void> {
    // This would process automated transitions based on conditions
    this.logger.debug('Processing automated transitions')
  }

  private async checkOverdueRequirements(): Promise<void> {
    // This would check for overdue requirements and create alerts
    this.logger.debug('Checking overdue requirements')
  }

  private async updateAllProgress(): Promise<void> {
    // This would update progress for all tracked assets
    this.logger.debug('Updating all progress')
  }

  // Default workflows initialization
  private async initializeDefaultWorkflows(): Promise<void> {
    if (this.workflows.size === 0) {
      await this.createDefaultWorkflows()
    }
  }

  private async createDefaultWorkflows(): Promise<void> {
    // Create default workflow for real estate assets
    const realEstateWorkflow = await this.createWorkflow({
      name: 'Real Estate Asset Lifecycle',
      description: 'Standard lifecycle workflow for real estate assets',
      assetType: 'real_estate',
      stages: [
        {
          id: 'creation',
          name: 'Creation',
          description: 'Initial asset creation',
          stage: AssetLifecycleStage.CREATION,
          order: 1,
          duration: 1,
          requirements: [],
          automations: [],
          notifications: [],
          permissions: []
        },
        {
          id: 'validation',
          name: 'Validation',
          description: 'Asset validation and verification',
          stage: AssetLifecycleStage.VALIDATION,
          order: 2,
          duration: 7,
          requirements: [],
          automations: [],
          notifications: [],
          permissions: []
        },
        {
          id: 'tokenization',
          name: 'Tokenization',
          description: 'Asset tokenization process',
          stage: AssetLifecycleStage.TOKENIZATION,
          order: 3,
          duration: 3,
          requirements: [],
          automations: [],
          notifications: [],
          permissions: []
        },
        {
          id: 'listing',
          name: 'Listing',
          description: 'Asset listing on marketplace',
          stage: AssetLifecycleStage.LISTING,
          order: 4,
          duration: 1,
          requirements: [],
          automations: [],
          notifications: [],
          permissions: []
        },
        {
          id: 'trading',
          name: 'Trading',
          description: 'Active trading phase',
          stage: AssetLifecycleStage.TRADING,
          order: 5,
          requirements: [],
          automations: [],
          notifications: [],
          permissions: []
        }
      ],
      transitions: [
        {
          id: 'creation_to_validation',
          fromStage: AssetLifecycleStage.CREATION,
          toStage: AssetLifecycleStage.VALIDATION,
          conditions: [],
          approvals: [],
          automations: [],
          allowedRoles: ['admin', 'asset_manager']
        },
        {
          id: 'validation_to_tokenization',
          fromStage: AssetLifecycleStage.VALIDATION,
          toStage: AssetLifecycleStage.TOKENIZATION,
          conditions: [],
          approvals: [],
          automations: [],
          allowedRoles: ['admin', 'validator']
        }
      ],
      isActive: true,
      createdBy: 'system',
      updatedBy: 'system'
    })

    this.logger.info('Default workflows created')
  }

  // ID generation methods
  private generateTrackingId(): string {
    return `tracking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConditionId(): string {
    return `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Data persistence methods
  private async saveLifecycleEvent(event: LifecycleEvent): Promise<void> {
    // This would save to your database
    this.logger.debug(`Lifecycle event saved: ${event.id}`)
  }

  private async saveLifecycleTracking(tracking: LifecycleTracking): Promise<void> {
    // This would save to your database
    this.logger.debug(`Lifecycle tracking saved: ${tracking.assetId}`)
  }

  private async saveWorkflow(workflow: LifecycleWorkflow): Promise<void> {
    // This would save to your database
    this.logger.debug(`Workflow saved: ${workflow.id}`)
  }

  private async loadLifecycleData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading lifecycle data...')
  }

  private async saveLifecycleData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving lifecycle data...')
  }

  // Export methods
  exportLifecycleData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      workflows: Array.from(this.workflows.values()),
      events: Array.from(this.lifecycleEvents.values()),
      tracking: Array.from(this.lifecycleTracking.values()),
      statistics: this.getLifecycleStatistics()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'assetId', 'eventType', 'currentStage', 'currentStatus', 'timestamp', 'triggeredBy']
      const csvRows = [headers.join(',')]
      
      for (const event of this.lifecycleEvents.values()) {
        csvRows.push([
          event.id,
          event.assetId,
          event.eventType,
          event.currentStage,
          event.currentStatus,
          event.timestamp.toISOString(),
          event.triggeredBy
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Health status
  getHealthStatus(): {
    isRunning: boolean
    totalWorkflows: number
    totalEvents: number
    totalTracking: number
    lastActivity: Date
    metrics: LifecycleStatistics
  } {
    return {
      isRunning: this.isRunning,
      totalWorkflows: this.workflows.size,
      totalEvents: this.lifecycleEvents.size,
      totalTracking: this.lifecycleTracking.size,
      lastActivity: new Date(),
      metrics: this.getLifecycleStatistics()
    }
  }
}

// Supporting interfaces
export interface LifecycleStatistics {
  totalAssets: number
  assetsByStage: Record<AssetLifecycleStage, number>
  assetsByStatus: Record<AssetStatus, number>
  averageProgress: number
  totalEvents: number
  eventsByType: Record<LifecycleEventType, number>
  recentEvents: LifecycleEvent[]
  overdueRequirements: number
  upcomingMilestones: Array<{ assetId: string; milestone: string; estimatedDate: Date }>
  workflowUsage: Record<string, number>
}

export default AssetLifecycleService
