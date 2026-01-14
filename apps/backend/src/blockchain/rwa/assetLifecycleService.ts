import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import logger from '../../utils/logger'

// Asset lifecycle interfaces
export interface AssetStatus {
  id: string
  assetId: string
  status: AssetLifecycleStatus
  subStatus?: string
  effectiveDate: Date
  reason: string
  changedBy: string
  metadata: Record<string, any>
  blockchainTxHash?: string
  blockNumber?: number
}

export type AssetLifecycleStatus =
  | 'draft'           // Initial creation, not yet tokenized
  | 'under_review'    // Under compliance/legal review
  | 'approved'        // Approved for tokenization
  | 'tokenizing'      // Tokenization in progress
  | 'tokenized'       // Successfully tokenized
  | 'listed'          // Listed for sale/trading
  | 'in_escrow'       // In escrow for transaction
  | 'transferred'     // Ownership transferred
  | 'under_maintenance' // Under maintenance/repair
  | 'insured'         // Insurance claim filed
  | 'foreclosed'      // Foreclosure proceedings
  | 'retired'         // Retired from circulation
  | 'destroyed'       // Physically destroyed

export interface AssetTransition {
  id: string
  assetId: string
  fromStatus: AssetLifecycleStatus
  toStatus: AssetLifecycleStatus
  transitionDate: Date
  initiatedBy: string
  approvedBy?: string
  reason: string
  conditions: TransitionCondition[]
  documents: string[] // IPFS hashes
  blockchainTxHash?: string
  metadata: Record<string, any>
}

export interface TransitionCondition {
  type: 'manual_approval' | 'automatic' | 'time_based' | 'contractual' | 'regulatory'
  description: string
  requiredRole?: string
  deadline?: Date
  completed: boolean
  completedAt?: Date
  completedBy?: string
}

export interface MaintenanceRecord {
  id: string
  assetId: string
  maintenanceType: 'preventive' | 'corrective' | 'predictive' | 'condition_based'
  description: string
  scheduledDate: Date
  completedDate?: Date
  technician: string
  cost: number
  currency: string
  parts: MaintenancePart[]
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes: string
  documents: string[] // IPFS hashes
  nextMaintenanceDate?: Date
}

export interface MaintenancePart {
  name: string
  partNumber?: string
  quantity: number
  cost: number
  supplier?: string
}

export interface InsuranceClaim {
  id: string
  assetId: string
  claimType: 'damage' | 'theft' | 'natural_disaster' | 'liability' | 'other'
  description: string
  incidentDate: Date
  reportedDate: Date
  claimAmount: number
  currency: string
  status: 'filed' | 'under_review' | 'approved' | 'rejected' | 'paid'
  insuranceProvider: string
  policyNumber: string
  adjuster?: string
  settlementAmount?: number
  documents: string[] // IPFS hashes
  notes: string
}

export interface LifecycleWorkflow {
  id: string
  assetId: string
  workflowType: 'tokenization' | 'transfer' | 'maintenance' | 'insurance' | 'retirement'
  status: 'active' | 'completed' | 'cancelled' | 'failed'
  steps: WorkflowStep[]
  currentStep: number
  createdAt: Date
  completedAt?: Date
  initiatedBy: string
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  order: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  assignedTo?: string
  requiredRole?: string
  dependencies: string[] // Step IDs that must be completed first
  actions: WorkflowAction[]
  deadline?: Date
  completedAt?: Date
  completedBy?: string
}

export interface WorkflowAction {
  type: 'update_status' | 'create_document' | 'send_notification' | 'blockchain_transaction' | 'external_api_call'
  parameters: Record<string, any>
  required: boolean
  completed: boolean
  result?: any
}

export interface AssetMetrics {
  assetId: string
  totalUptime: number // days
  downtimeEvents: number
  maintenanceEvents: number
  insuranceClaims: number
  ownershipTransfers: number
  averageMaintenanceCost: number
  totalInsurancePaid: number
  complianceScore: number // 0-100
  riskScore: number // 0-100
  utilizationRate: number // 0-100
  lastUpdated: Date
}

/**
 * Asset Lifecycle Management Service
 * Manages complete lifecycle of RWA assets from creation to retirement
 * Handles status transitions, maintenance, insurance, and compliance
 */
export class AssetLifecycleService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private assetStatuses: Map<string, AssetStatus[]> = new Map()
  private transitions: Map<string, AssetTransition[]> = new Map()
  private maintenanceRecords: Map<string, MaintenanceRecord[]> = new Map()
  private insuranceClaims: Map<string, InsuranceClaim[]> = new Map()
  private workflows: Map<string, LifecycleWorkflow[]> = new Map()
  private assetMetrics: Map<string, AssetMetrics> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.logger = loggerInstance
  }

  // ============ STATUS MANAGEMENT ============

  /**
   * Initialize asset status
   */
  async initializeAssetStatus(assetId: string, initialStatus: AssetLifecycleStatus = 'draft'): Promise<AssetStatus> {
    try {
      const status: AssetStatus = {
        id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        status: initialStatus,
        effectiveDate: new Date(),
        reason: 'Asset initialization',
        changedBy: 'system',
        metadata: {}
      }

      if (!this.assetStatuses.has(assetId)) {
        this.assetStatuses.set(assetId, [])
      }

      this.assetStatuses.get(assetId)!.push(status)

      // Initialize asset metrics
      await this.initializeAssetMetrics(assetId)

      this.emit('status:initialized', { assetId, status })

      return status
    } catch (error) {
      this.logger.error(`Failed to initialize asset status for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Update asset status with transition validation
   */
  async updateAssetStatus(
    assetId: string,
    newStatus: AssetLifecycleStatus,
    changedBy: string,
    reason: string,
    subStatus?: string,
    metadata?: Record<string, any>
  ): Promise<AssetStatus> {
    try {
      const currentStatus = this.getCurrentStatus(assetId)
      if (!currentStatus) {
        throw new Error(`No status found for asset ${assetId}`)
      }

      // Validate transition
      await this.validateStatusTransition(assetId, currentStatus.status, newStatus)

      // Create transition record
      const transition = await this.createTransition(assetId, currentStatus.status, newStatus, changedBy, reason)

      // Update status
      const status: AssetStatus = {
        id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        status: newStatus,
        subStatus,
        effectiveDate: new Date(),
        reason,
        changedBy,
        metadata: metadata || {},
        blockchainTxHash: metadata?.transactionHash,
        blockNumber: metadata?.blockNumber
      }

      this.assetStatuses.get(assetId)!.push(status)

      // Update digital twin status
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        await this.digitalTwinService.updateDigitalTwinStatus(twin.id, newStatus as any, metadata)
      }

      // Update metrics
      await this.updateAssetMetrics(assetId, newStatus)

      this.emit('status:updated', { assetId, oldStatus: currentStatus, newStatus: status, transition })

      return status
    } catch (error) {
      this.logger.error(`Failed to update asset status for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Get current asset status
   */
  getCurrentStatus(assetId: string): AssetStatus | null {
    const statuses = this.assetStatuses.get(assetId)
    if (!statuses || statuses.length === 0) return null

    return statuses.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0]
  }

  /**
   * Get status history for asset
   */
  getStatusHistory(assetId: string): AssetStatus[] {
    const statuses = this.assetStatuses.get(assetId) || []
    return statuses.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())
  }

  // ============ TRANSITION MANAGEMENT ============

  /**
   * Create status transition record
   */
  private async createTransition(
    assetId: string,
    fromStatus: AssetLifecycleStatus,
    toStatus: AssetLifecycleStatus,
    initiatedBy: string,
    reason: string
  ): Promise<AssetTransition> {
    try {
      const transition: AssetTransition = {
        id: `transition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId,
        fromStatus,
        toStatus,
        transitionDate: new Date(),
        initiatedBy,
        reason,
        conditions: await this.generateTransitionConditions(fromStatus, toStatus),
        documents: [],
        metadata: {}
      }

      if (!this.transitions.has(assetId)) {
        this.transitions.set(assetId, [])
      }

      this.transitions.get(assetId)!.push(transition)

      this.emit('transition:created', { assetId, transition })

      return transition
    } catch (error) {
      this.logger.error(`Failed to create transition for ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Validate status transition
   */
  private async validateStatusTransition(
    assetId: string,
    fromStatus: AssetLifecycleStatus,
    toStatus: AssetLifecycleStatus
  ): Promise<void> {
    // Define valid transitions
    const validTransitions: Record<AssetLifecycleStatus, AssetLifecycleStatus[]> = {
      draft: ['under_review', 'destroyed'],
      under_review: ['approved', 'draft', 'destroyed'],
      approved: ['tokenizing', 'destroyed'],
      tokenizing: ['tokenized', 'approved', 'destroyed'],
      tokenized: ['listed', 'under_maintenance', 'insured', 'transferred', 'retired', 'destroyed'],
      listed: ['tokenized', 'in_escrow', 'retired'],
      in_escrow: ['transferred', 'listed'],
      transferred: ['listed', 'under_maintenance', 'insured', 'retired', 'destroyed'],
      under_maintenance: ['transferred', 'retired', 'destroyed'],
      insured: ['transferred', 'retired', 'destroyed'],
      foreclosed: ['transferred', 'retired', 'destroyed'],
      retired: [], // Terminal state
      destroyed: [] // Terminal state
    }

    if (!validTransitions[fromStatus]?.includes(toStatus)) {
      throw new Error(`Invalid status transition from ${fromStatus} to ${toStatus}`)
    }

    // Additional validation logic can be added here
    // e.g., check compliance status, ownership verification, etc.
  }

  /**
   * Generate transition conditions
   */
  private async generateTransitionConditions(
    fromStatus: AssetLifecycleStatus,
    toStatus: AssetLifecycleStatus
  ): Promise<TransitionCondition[]> {
    const conditions: TransitionCondition[] = []

    // Define conditions based on transition type
    switch (`${fromStatus}->${toStatus}`) {
      case 'draft->under_review':
        conditions.push({
          type: 'manual_approval',
          description: 'Legal and compliance review required',
          requiredRole: 'compliance_officer',
          completed: false
        })
        break

      case 'under_review->approved':
        conditions.push({
          type: 'manual_approval',
          description: 'Final approval from compliance officer',
          requiredRole: 'compliance_officer',
          completed: false
        })
        break

      case 'approved->tokenizing':
        conditions.push({
          type: 'contractual',
          description: 'Smart contract deployment and verification',
          completed: false
        })
        break

      // Add more transition conditions as needed
    }

    return conditions
  }

  // ============ MAINTENANCE MANAGEMENT ============

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(params: {
    assetId: string
    maintenanceType: MaintenanceRecord['maintenanceType']
    description: string
    scheduledDate: Date
    technician: string
    estimatedCost: number
    currency: string
    parts?: MaintenancePart[]
  }): Promise<MaintenanceRecord> {
    try {
      const record: MaintenanceRecord = {
        id: `maintenance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        maintenanceType: params.maintenanceType,
        description: params.description,
        scheduledDate: params.scheduledDate,
        technician: params.technician,
        cost: params.estimatedCost,
        currency: params.currency,
        parts: params.parts || [],
        status: 'scheduled',
        notes: '',
        documents: [],
        nextMaintenanceDate: this.calculateNextMaintenanceDate(params.scheduledDate, params.maintenanceType)
      }

      if (!this.maintenanceRecords.has(params.assetId)) {
        this.maintenanceRecords.set(params.assetId, [])
      }

      this.maintenanceRecords.get(params.assetId)!.push(record)

      // Update asset status if major maintenance
      if (params.maintenanceType === 'corrective') {
        await this.updateAssetStatus(params.assetId, 'under_maintenance', 'system', 'Scheduled corrective maintenance')
      }

      this.emit('maintenance:scheduled', { assetId: params.assetId, maintenance: record })

      return record
    } catch (error) {
      this.logger.error(`Failed to schedule maintenance for ${params.assetId}:`, error)
      throw error
    }
  }

  /**
   * Complete maintenance
   */
  async completeMaintenance(
    maintenanceId: string,
    actualCost: number,
    notes: string,
    documents: string[] = []
  ): Promise<MaintenanceRecord> {
    try {
      // Find maintenance record
      let maintenanceRecord: MaintenanceRecord | null = null
      let assetId: string = ''

      for (const [asset, records] of this.maintenanceRecords) {
        const record = records.find(r => r.id === maintenanceId)
        if (record) {
          maintenanceRecord = record
          assetId = asset
          break
        }
      }

      if (!maintenanceRecord) {
        throw new Error(`Maintenance record ${maintenanceId} not found`)
      }

      // Update record
      maintenanceRecord.completedDate = new Date()
      maintenanceRecord.cost = actualCost
      maintenanceRecord.status = 'completed'
      maintenanceRecord.notes = notes
      maintenanceRecord.documents = documents

      // Update asset status back to normal
      const currentStatus = this.getCurrentStatus(assetId)
      if (currentStatus?.status === 'under_maintenance') {
        await this.updateAssetStatus(assetId, 'transferred', 'system', 'Maintenance completed')
      }

      // Log maintenance event
      await this.digitalTwinService.logAssetEvent(assetId, {
        eventType: 'maintenance',
        title: 'Maintenance Completed',
        description: maintenanceRecord.description,
        participants: [maintenanceRecord.technician],
        documents,
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      this.emit('maintenance:completed', { assetId, maintenance: maintenanceRecord })

      return maintenanceRecord
    } catch (error) {
      this.logger.error(`Failed to complete maintenance ${maintenanceId}:`, error)
      throw error
    }
  }

  /**
   * Get maintenance history for asset
   */
  getMaintenanceHistory(assetId: string): MaintenanceRecord[] {
    const records = this.maintenanceRecords.get(assetId) || []
    return records.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime())
  }

  // ============ INSURANCE MANAGEMENT ============

  /**
   * File insurance claim
   */
  async fileInsuranceClaim(params: {
    assetId: string
    claimType: InsuranceClaim['claimType']
    description: string
    incidentDate: Date
    claimAmount: number
    currency: string
    insuranceProvider: string
    policyNumber: string
    documents: string[]
  }): Promise<InsuranceClaim> {
    try {
      const claim: InsuranceClaim = {
        id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        claimType: params.claimType,
        description: params.description,
        incidentDate: params.incidentDate,
        reportedDate: new Date(),
        claimAmount: params.claimAmount,
        currency: params.currency,
        status: 'filed',
        insuranceProvider: params.insuranceProvider,
        policyNumber: params.policyNumber,
        documents: params.documents,
        notes: ''
      }

      if (!this.insuranceClaims.has(params.assetId)) {
        this.insuranceClaims.set(params.assetId, [])
      }

      this.insuranceClaims.get(params.assetId)!.push(claim)

      // Update asset status
      await this.updateAssetStatus(params.assetId, 'insured', 'system', `Insurance claim filed: ${params.claimType}`)

      // Log insurance event
      await this.digitalTwinService.logAssetEvent(params.assetId, {
        eventType: 'insurance_claim',
        title: 'Insurance Claim Filed',
        description: params.description,
        participants: [params.insuranceProvider],
        documents: params.documents,
        timestamp: new Date(),
        recordedBy: 'system',
        verified: true
      })

      this.emit('insurance:claim: filed', { assetId: params.assetId, claim })

      return claim
    } catch (error) {
      this.logger.error(`Failed to file insurance claim for ${params.assetId}:`, error)
      throw error
    }
  }

  /**
   * Update insurance claim status
   */
  async updateInsuranceClaim(
    claimId: string,
    status: InsuranceClaim['status'],
    settlementAmount?: number,
    notes?: string
  ): Promise<InsuranceClaim> {
    try {
      // Find claim
      let claim: InsuranceClaim | null = null
      let assetId: string = ''

      for (const [asset, claims] of this.insuranceClaims) {
        const foundClaim = claims.find(c => c.id === claimId)
        if (foundClaim) {
          claim = foundClaim
          assetId = asset
          break
        }
      }

      if (!claim) {
        throw new Error(`Insurance claim ${claimId} not found`)
      }

      // Update claim
      claim.status = status
      if (settlementAmount !== undefined) claim.settlementAmount = settlementAmount
      if (notes) claim.notes = notes

      // Update asset status if claim is resolved
      if (status === 'paid' || status === 'rejected') {
        const currentStatus = this.getCurrentStatus(assetId)
        if (currentStatus?.status === 'insured') {
          await this.updateAssetStatus(assetId, 'transferred', 'system', `Insurance claim ${status}`)
        }
      }

      this.emit('insurance:claim:updated', { assetId, claimId, claim })

      return claim
    } catch (error) {
      this.logger.error(`Failed to update insurance claim ${claimId}:`, error)
      throw error
    }
  }

  /**
   * Get insurance claims for asset
   */
  getInsuranceClaims(assetId: string): InsuranceClaim[] {
    const claims = this.insuranceClaims.get(assetId) || []
    return claims.sort((a, b) => b.reportedDate.getTime() - a.reportedDate.getTime())
  }

  // ============ WORKFLOW MANAGEMENT ============

  /**
   * Create lifecycle workflow
   */
  async createWorkflow(params: {
    assetId: string
    workflowType: LifecycleWorkflow['workflowType']
    initiatedBy: string
    steps: Omit<WorkflowStep, 'id' | 'status' | 'completedAt' | 'completedBy'>[]
  }): Promise<LifecycleWorkflow> {
    try {
      const workflow: LifecycleWorkflow = {
        id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetId: params.assetId,
        workflowType: params.workflowType,
        status: 'active',
        steps: params.steps.map((step, index) => ({
          ...step,
          id: `step-${Date.now()}-${index}`,
          status: index === 0 ? 'in_progress' : 'pending'
        })),
        currentStep: 0,
        createdAt: new Date(),
        initiatedBy: params.initiatedBy
      }

      if (!this.workflows.has(params.assetId)) {
        this.workflows.set(params.assetId, [])
      }

      this.workflows.get(params.assetId)!.push(workflow)

      this.emit('workflow:created', { assetId: params.assetId, workflow })

      return workflow
    } catch (error) {
      this.logger.error(`Failed to create workflow for ${params.assetId}:`, error)
      throw error
    }
  }

  /**
   * Advance workflow step
   */
  async advanceWorkflow(workflowId: string, completedBy: string): Promise<WorkflowStep> {
    try {
      // Find workflow
      let workflow: LifecycleWorkflow | null = null
      let assetId: string = ''

      for (const [asset, workflows] of this.workflows) {
        const foundWorkflow = workflows.find(w => w.id === workflowId)
        if (foundWorkflow) {
          workflow = foundWorkflow
          assetId = asset
          break
        }
      }

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`)
      }

      const currentStep = workflow.steps[workflow.currentStep]

      // Complete current step
      currentStep.status = 'completed'
      currentStep.completedAt = new Date()
      currentStep.completedBy = completedBy

      // Execute step actions
      for (const action of currentStep.actions) {
        await this.executeWorkflowAction(action, assetId)
        action.completed = true
      }

      // Move to next step
      workflow.currentStep++

      if (workflow.currentStep >= workflow.steps.length) {
        // Workflow completed
        workflow.status = 'completed'
        workflow.completedAt = new Date()
      } else {
        // Start next step
        const nextStep = workflow.steps[workflow.currentStep]

        // Check dependencies
        const dependenciesMet = nextStep.dependencies.every(depId => {
          const depStep = workflow!.steps.find(s => s.id === depId)
          return depStep?.status === 'completed'
        })

        if (dependenciesMet) {
          nextStep.status = 'in_progress'
        } else {
          nextStep.status = 'pending'
        }
      }

      this.emit('workflow:advanced', { assetId, workflowId, workflow })

      return currentStep
    } catch (error) {
      this.logger.error(`Failed to advance workflow ${workflowId}:`, error)
      throw error
    }
  }

  /**
   * Execute workflow action
   */
  private async executeWorkflowAction(action: WorkflowAction, assetId: string): Promise<void> {
    try {
      switch (action.type) {
        case 'update_status':
          await this.updateAssetStatus(
            assetId,
            action.parameters.status,
            'workflow',
            action.parameters.reason || 'Workflow step completion'
          )
          break

        case 'create_document':
          // Would integrate with document service
          this.logger.info(`Creating document for asset ${assetId}: ${action.parameters.documentType}`)
          break

        case 'send_notification':
          // Would integrate with notification service
          this.emit('notification:send', {
            type: action.parameters.notificationType,
            recipients: action.parameters.recipients,
            message: action.parameters.message
          })
          break

        case 'blockchain_transaction':
          // Would execute blockchain transaction
          this.logger.info(`Executing blockchain transaction for asset ${assetId}`)
          break

        case 'external_api_call':
          // Would call external API
          this.logger.info(`Calling external API for asset ${assetId}: ${action.parameters.endpoint}`)
          break
      }
    } catch (error) {
      this.logger.error(`Failed to execute workflow action:`, error)
      throw error
    }
  }

  // ============ METRICS & ANALYTICS ============

  /**
   * Initialize asset metrics
   */
  private async initializeAssetMetrics(assetId: string): Promise<void> {
    try {
      const metrics: AssetMetrics = {
        assetId,
        totalUptime: 0,
        downtimeEvents: 0,
        maintenanceEvents: 0,
        insuranceClaims: 0,
        ownershipTransfers: 0,
        averageMaintenanceCost: 0,
        totalInsurancePaid: 0,
        complianceScore: 100, // Start with perfect score
        riskScore: 50, // Neutral risk
        utilizationRate: 100, // Fully utilized initially
        lastUpdated: new Date()
      }

      this.assetMetrics.set(assetId, metrics)
    } catch (error) {
      this.logger.error(`Failed to initialize metrics for ${assetId}:`, error)
    }
  }

  /**
   * Update asset metrics
   */
  private async updateAssetMetrics(assetId: string, newStatus: AssetLifecycleStatus): Promise<void> {
    try {
      const metrics = this.assetMetrics.get(assetId)
      if (!metrics) return

      // Update counters based on status changes
      switch (newStatus) {
        case 'under_maintenance':
          metrics.maintenanceEvents++
          metrics.downtimeEvents++
          break

        case 'insured':
          metrics.insuranceClaims++
          break

        case 'transferred':
          metrics.ownershipTransfers++
          break
      }

      // Recalculate derived metrics
      const maintenanceRecords = this.getMaintenanceHistory(assetId)
      if (maintenanceRecords.length > 0) {
        metrics.averageMaintenanceCost = maintenanceRecords
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + r.cost, 0) / maintenanceRecords.length
      }

      const insuranceClaims = this.getInsuranceClaims(assetId)
      metrics.totalInsurancePaid = insuranceClaims
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + (c.settlementAmount || 0), 0)

      // Calculate uptime (simplified)
      const totalTime = Date.now() - metrics.lastUpdated.getTime()
      const downtimeTime = metrics.downtimeEvents * 24 * 60 * 60 * 1000 // Assume 24h per downtime event
      metrics.totalUptime = ((totalTime - downtimeTime) / totalTime) * 100

      metrics.lastUpdated = new Date()

      this.emit('metrics:updated', { assetId, metrics })
    } catch (error) {
      this.logger.error(`Failed to update metrics for ${assetId}:`, error)
    }
  }

  /**
   * Get asset metrics
   */
  getAssetMetrics(assetId: string): AssetMetrics | null {
    return this.assetMetrics.get(assetId) || null
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Calculate next maintenance date
   */
  private calculateNextMaintenanceDate(lastMaintenance: Date, type: MaintenanceRecord['maintenanceType']): Date {
    const intervals = {
      preventive: 90, // 90 days
      corrective: 180, // 180 days (only if needed again)
      predictive: 60, // 60 days
      condition_based: 120 // 120 days
    }

    const days = intervals[type] || 90
    const nextDate = new Date(lastMaintenance)
    nextDate.setDate(nextDate.getDate() + days)

    return nextDate
  }

  /**
   * Get comprehensive asset lifecycle overview
   */
  getAssetLifecycleOverview(assetId: string): {
    currentStatus: AssetStatus | null
    statusHistory: AssetStatus[]
    transitions: AssetTransition[]
    maintenanceRecords: MaintenanceRecord[]
    insuranceClaims: InsuranceClaim[]
    activeWorkflows: LifecycleWorkflow[]
    metrics: AssetMetrics | null
  } {
    return {
      currentStatus: this.getCurrentStatus(assetId),
      statusHistory: this.getStatusHistory(assetId),
      transitions: this.transitions.get(assetId) || [],
      maintenanceRecords: this.getMaintenanceHistory(assetId),
      insuranceClaims: this.getInsuranceClaims(assetId),
      activeWorkflows: (this.workflows.get(assetId) || []).filter(w => w.status === 'active'),
      metrics: this.getAssetMetrics(assetId)
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: Date
    metrics: any
  } {
    return {
      status: 'healthy',
      timestamp: new Date(),
      metrics: {
        totalAssets: this.assetStatuses.size,
        activeWorkflows: Array.from(this.workflows.values()).flat().filter(w => w.status === 'active').length,
        pendingMaintenance: Array.from(this.maintenanceRecords.values()).flat().filter(r => r.status === 'scheduled').length,
        activeInsuranceClaims: Array.from(this.insuranceClaims.values()).flat().filter(c => c.status === 'under_review').length
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.assetStatuses.clear()
    this.transitions.clear()
    this.maintenanceRecords.clear()
    this.insuranceClaims.clear()
    this.workflows.clear()
    this.assetMetrics.clear()
    this.logger.info('All lifecycle service data cleared')
  }
}

export default AssetLifecycleService
