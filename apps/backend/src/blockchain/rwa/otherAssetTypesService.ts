import { EventEmitter } from 'events'
import { BaseSdkService } from '../baseSdkService'
import AssetDigitalTwinService from './assetDigitalTwinService'
import AssetValuationService from './assetValuationService'
import AssetLifecycleService from './assetLifecycleService'
import logger from '../../utils/logger'

// Other Asset Types interfaces
export interface CustomAssetType {
  id: string
  name: string
  description: string
  category: string
  subCategory?: string
  schema: AssetSchema
  validationRules: ValidationRule[]
  metadataFields: MetadataField[]
  lifecycleStages: LifecycleStage[]
  permissions: AssetPermissions
  integrations: AssetIntegration[]
  createdAt: Date
  updatedAt: Date
  version: number
  isActive: boolean
}

export interface AssetSchema {
  $schema: string
  type: 'object'
  properties: Record<string, SchemaProperty>
  required: string[]
  additionalProperties: boolean
  dependencies?: Record<string, string[]>
  oneOf?: SchemaCondition[]
  allOf?: SchemaCondition[]
  anyOf?: SchemaCondition[]
}

export interface SchemaProperty {
  type: SchemaType | SchemaType[]
  title?: string
  description?: string
  format?: string
  pattern?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: any[]
  items?: SchemaProperty
  properties?: Record<string, SchemaProperty>
  required?: string[]
  additionalProperties?: boolean
  default?: any
  examples?: any[]
  $ref?: string
}

export interface SchemaCondition {
  properties?: Record<string, SchemaProperty>
  required?: string[]
  if?: {
    properties?: Record<string, SchemaProperty>
  }
  then?: {
    properties?: Record<string, SchemaProperty>
  }
  else?: {
    properties?: Record<string, SchemaProperty>
  }
}

export interface ValidationRule {
  id: string
  name: string
  description: string
  ruleType: 'required' | 'conditional' | 'range' | 'format' | 'custom'
  field: string
  condition?: ValidationCondition
  errorMessage: string
  severity: 'error' | 'warning' | 'info'
  enabled: boolean
}

export interface ValidationCondition {
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex' | 'custom'
  value: any
  field?: string
}

export interface MetadataField {
  id: string
  name: string
  label: string
  type: MetadataType
  required: boolean
  defaultValue?: any
  options?: MetadataOption[]
  validation?: MetadataValidation
  dependencies?: MetadataDependency[]
  display: MetadataDisplay
  permissions: FieldPermissions
}

export interface MetadataOption {
  value: any
  label: string
  description?: string
  disabled?: boolean
  group?: string
}

export interface MetadataValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  customValidator?: string
}

export interface MetadataDependency {
  field: string
  operator: 'equals' | 'not_equals' | 'exists' | 'not_exists'
  value?: any
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'unrequire'
}

export interface MetadataDisplay {
  order: number
  group?: string
  tab?: string
  width?: 'full' | 'half' | 'third' | 'quarter'
  placeholder?: string
  helpText?: string
  tooltip?: string
}

export interface FieldPermissions {
  read: string[]
  write: string[]
  admin: string[]
}

export interface LifecycleStage {
  id: string
  name: string
  description: string
  order: number
  requiredFields: string[]
  validationRules: string[]
  triggers: LifecycleTrigger[]
  transitions: LifecycleTransition[]
  notifications: LifecycleNotification[]
  permissions: StagePermissions
  isActive: boolean
}

export interface LifecycleTrigger {
  type: 'manual' | 'automatic' | 'conditional'
  event: string
  condition?: LifecycleCondition
  actions: LifecycleAction[]
}

export interface LifecycleCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

export interface LifecycleAction {
  type: 'update_field' | 'send_notification' | 'create_task' | 'external_api_call'
  parameters: Record<string, any>
}

export interface LifecycleTransition {
  toStage: string
  condition?: LifecycleCondition
  requiredPermissions: string[]
  validationRequired: boolean
}

export interface LifecycleNotification {
  event: 'enter' | 'exit' | 'transition'
  recipients: string[]
  template: string
  channels: ('email' | 'sms' | 'in_app')[]
}

export interface StagePermissions {
  view: string[]
  edit: string[]
  transition: string[]
  approve: string[]
}

export interface AssetPermissions {
  create: string[]
  read: string[]
  update: string[]
  delete: string[]
  approve: string[]
  publish: string[]
  archive: string[]
}

export interface AssetIntegration {
  type: 'api' | 'webhook' | 'database' | 'blockchain' | 'external_service'
  name: string
  description: string
  config: IntegrationConfig
  mappings: DataMapping[]
  enabled: boolean
  schedule?: string
  lastSync?: Date
  errorCount: number
}

export interface IntegrationConfig {
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  authentication?: AuthenticationConfig
  timeout?: number
  retries?: number
}

export interface AuthenticationConfig {
  type: 'basic' | 'bearer' | 'api_key' | 'oauth2'
  credentials: Record<string, any>
}

export interface DataMapping {
  sourceField: string
  targetField: string
  transformation?: DataTransformation
  required: boolean
}

export interface DataTransformation {
  type: 'direct' | 'lookup' | 'calculation' | 'concatenation' | 'custom'
  parameters?: Record<string, any>
}

export interface CustomAsset {
  id: string
  assetTypeId: string
  name: string
  description: string
  category: string
  subCategory?: string
  status: AssetStatus
  currentStage: string
  metadata: Record<string, any>
  attachments: AssetAttachment[]
  relationships: AssetRelationship[]
  valuation: AssetValuation
  permissions: AssetPermissions
  auditTrail: AuditEntry[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  version: number
}

export interface AssetAttachment {
  id: string
  name: string
  type: 'document' | 'image' | 'video' | 'audio' | 'other'
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: Date
  metadata: Record<string, any>
}

export interface AssetRelationship {
  id: string
  type: 'parent' | 'child' | 'related' | 'depends_on' | 'blocks'
  targetAssetId: string
  targetAssetType: string
  description?: string
  createdAt: Date
  createdBy: string
}

export interface AssetValuation {
  currentValue: number
  currency: string
  valuationDate: Date
  valuationMethod: string
  source: string
  confidence: number
  history: ValuationHistory[]
}

export interface ValuationHistory {
  date: Date
  value: number
  method: string
  source: string
  notes?: string
}

export interface AuditEntry {
  id: string
  timestamp: Date
  userId: string
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'transition'
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  previousState?: any
  newState?: any
}

export interface SchemaValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

export type SchemaType =
  | 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'

export type MetadataType =
  | 'text' | 'textarea' | 'number' | 'decimal' | 'boolean' | 'date' | 'datetime'
  | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'file' | 'image' | 'url'
  | 'email' | 'phone' | 'currency' | 'percentage' | 'json' | 'reference'

export type AssetStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived' | 'deleted'

/**
 * Other Asset Types Service for RWA Tokenization
 * Comprehensive custom asset type management with flexible metadata,
 * category-specific fields, and extensible schema validation
 */
export class OtherAssetTypesService extends EventEmitter {
  private baseSdk: BaseSdkService
  private logger: typeof logger
  private digitalTwinService: AssetDigitalTwinService
  private valuationService: AssetValuationService
  private lifecycleService: AssetLifecycleService

  // Data storage
  private customAssetTypes: Map<string, CustomAssetType> = new Map()
  private customAssets: Map<string, CustomAsset> = new Map()
  private assetTypeVersions: Map<string, CustomAssetType[]> = new Map()

  // Schema cache
  private schemaCache: Map<string, AssetSchema> = new Map()
  private validationCache: Map<string, SchemaValidation> = new Map()

  // Monitoring
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    baseSdk: BaseSdkService,
    digitalTwinService: AssetDigitalTwinService,
    valuationService: AssetValuationService,
    lifecycleService: AssetLifecycleService,
    loggerInstance: typeof logger
  ) {
    super()
    this.baseSdk = baseSdk
    this.digitalTwinService = digitalTwinService
    this.valuationService = valuationService
    this.lifecycleService = lifecycleService
    this.logger = loggerInstance
  }

  // ============ CUSTOM ASSET TYPE MANAGEMENT ============

  /**
   * Create custom asset type
   */
  async createCustomAssetType(
    assetTypeData: Omit<CustomAssetType, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isActive'>
  ): Promise<CustomAssetType> {
    try {
      // Validate schema
      const schemaValidation = this.validateSchema(assetTypeData.schema)
      if (!schemaValidation.isValid) {
        throw new Error(`Invalid schema: ${schemaValidation.errors.map(e => e.message).join(', ')}`)
      }

      const assetType: CustomAssetType = {
        id: `asset-type-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...assetTypeData,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        isActive: true
      }

      this.customAssetTypes.set(assetType.id, assetType)

      // Cache the schema
      this.schemaCache.set(assetType.id, assetType.schema)

      this.emit('asset-type:created', { assetType })

      return assetType
    } catch (error) {
      this.logger.error(`Failed to create custom asset type:`, error)
      throw error
    }
  }

  /**
   * Update custom asset type
   */
  async updateCustomAssetType(
    assetTypeId: string,
    updates: Partial<Omit<CustomAssetType, 'id' | 'createdAt' | 'version'>>
  ): Promise<CustomAssetType> {
    try {
      const existing = this.customAssetTypes.get(assetTypeId)
      if (!existing) {
        throw new Error(`Custom asset type ${assetTypeId} not found`)
      }

      // Validate schema if it's being updated
      if (updates.schema) {
        const schemaValidation = this.validateSchema(updates.schema)
        if (!schemaValidation.isValid) {
          throw new Error(`Invalid schema: ${schemaValidation.errors.map(e => e.message).join(', ')}`)
        }
      }

      const updated: CustomAssetType = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
        version: existing.version + 1
      }

      // Store version history
      if (!this.assetTypeVersions.has(assetTypeId)) {
        this.assetTypeVersions.set(assetTypeId, [])
      }
      this.assetTypeVersions.get(assetTypeId)!.push(existing)

      this.customAssetTypes.set(assetTypeId, updated)

      // Update schema cache
      if (updates.schema) {
        this.schemaCache.set(assetTypeId, updates.schema)
      }

      this.emit('asset-type:updated', { assetType: updated, previousVersion: existing })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update custom asset type ${assetTypeId}:`, error)
      throw error
    }
  }

  /**
   * Get custom asset type by ID
   */
  getCustomAssetType(assetTypeId: string): CustomAssetType | null {
    return this.customAssetTypes.get(assetTypeId) || null
  }

  /**
   * Get all custom asset types
   */
  getAllCustomAssetTypes(category?: string, activeOnly: boolean = true): CustomAssetType[] {
    let assetTypes = Array.from(this.customAssetTypes.values())

    if (activeOnly) {
      assetTypes = assetTypes.filter(type => type.isActive)
    }

    if (category) {
      assetTypes = assetTypes.filter(type => type.category === category)
    }

    return assetTypes.sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Archive custom asset type
   */
  async archiveCustomAssetType(assetTypeId: string): Promise<CustomAssetType> {
    return this.updateCustomAssetType(assetTypeId, { isActive: false })
  }

  // ============ CUSTOM ASSET MANAGEMENT ============

  /**
   * Create custom asset
   */
  async createCustomAsset(
    assetTypeId: string,
    assetData: Omit<CustomAsset, 'id' | 'assetTypeId' | 'createdAt' | 'updatedAt' | 'version' | 'auditTrail'>
  ): Promise<CustomAsset> {
    try {
      const assetType = this.customAssetTypes.get(assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${assetTypeId} not found`)
      }

      // Validate asset data against schema
      const validation = this.validateAssetData(assetTypeId, assetData.metadata)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      const asset: CustomAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        assetTypeId,
        ...assetData,
        currentStage: assetType.lifecycleStages[0]?.id || 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        auditTrail: []
      }

      this.customAssets.set(asset.id, asset)

      // Update digital twin with asset data
      await this.updateDigitalTwinAsset(asset.id, asset)

      // Log audit entry
      await this.logAuditEntry(asset.id, 'create', assetData.createdBy, {
        action: 'asset_created',
        assetTypeId,
        initialData: assetData
      })

      this.emit('asset:created', { asset, assetType })

      return asset
    } catch (error) {
      this.logger.error(`Failed to create custom asset for type ${assetTypeId}:`, error)
      throw error
    }
  }

  /**
   * Update custom asset
   */
  async updateCustomAsset(
    assetId: string,
    updates: Partial<Omit<CustomAsset, 'id' | 'assetTypeId' | 'createdAt' | 'auditTrail'>>,
    updatedBy: string
  ): Promise<CustomAsset> {
    try {
      const existing = this.customAssets.get(assetId)
      if (!existing) {
        throw new Error(`Custom asset ${assetId} not found`)
      }

      const assetType = this.customAssetTypes.get(existing.assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${existing.assetTypeId} not found`)
      }

      // Validate updated data if metadata is being changed
      if (updates.metadata) {
        const validation = this.validateAssetData(existing.assetTypeId, updates.metadata)
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
        }
      }

      const updated: CustomAsset = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
        version: existing.version + 1,
        updatedBy
      }

      this.customAssets.set(assetId, updated)

      // Update digital twin
      await this.updateDigitalTwinAsset(assetId, updated)

      // Log audit entry
      await this.logAuditEntry(assetId, 'update', updatedBy, {
        action: 'asset_updated',
        changes: updates,
        previousVersion: existing.version
      })

      this.emit('asset:updated', { asset: updated, previousVersion: existing })

      return updated
    } catch (error) {
      this.logger.error(`Failed to update custom asset ${assetId}:`, error)
      throw error
    }
  }

  /**
   * Transition asset to new stage
   */
  async transitionAssetStage(
    assetId: string,
    newStageId: string,
    transitionedBy: string,
    notes?: string
  ): Promise<CustomAsset> {
    try {
      const asset = this.customAssets.get(assetId)
      if (!asset) {
        throw new Error(`Asset ${assetId} not found`)
      }

      const assetType = this.customAssetTypes.get(asset.assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${asset.assetTypeId} not found`)
      }

      const currentStage = assetType.lifecycleStages.find(s => s.id === asset.currentStage)
      const newStage = assetType.lifecycleStages.find(s => s.id === newStageId)

      if (!currentStage || !newStage) {
        throw new Error(`Invalid stage transition`)
      }

      // Check if transition is allowed
      const allowedTransition = currentStage.transitions.find(t => t.toStage === newStageId)
      if (!allowedTransition) {
        throw new Error(`Transition from ${currentStage.name} to ${newStage.name} is not allowed`)
      }

      // Validate required fields for new stage
      const requiredFields = newStage.requiredFields
      const missingFields = requiredFields.filter(field => !asset.metadata[field])

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for stage ${newStage.name}: ${missingFields.join(', ')}`)
      }

      // Update asset
      const updated = await this.updateCustomAsset(assetId, {
        currentStage: newStageId,
        status: this.mapStageToStatus(newStageId)
      }, transitionedBy)

      // Log audit entry
      await this.logAuditEntry(assetId, 'transition', transitionedBy, {
        action: 'stage_transition',
        fromStage: currentStage.name,
        toStage: newStage.name,
        notes
      })

      // Trigger stage notifications
      await this.triggerStageNotifications(asset, newStage)

      this.emit('asset:stage-transitioned', {
        asset: updated,
        fromStage: currentStage,
        toStage: newStage
      })

      return updated
    } catch (error) {
      this.logger.error(`Failed to transition asset ${assetId} to stage ${newStageId}:`, error)
      throw error
    }
  }

  /**
   * Get custom asset by ID
   */
  getCustomAsset(assetId: string): CustomAsset | null {
    return this.customAssets.get(assetId) || null
  }

  /**
   * Get assets by type
   */
  getAssetsByType(assetTypeId: string, status?: AssetStatus): CustomAsset[] {
    const assets = Array.from(this.customAssets.values())
      .filter(asset => asset.assetTypeId === assetTypeId)

    if (status) {
      return assets.filter(asset => asset.status === status)
    }

    return assets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  /**
   * Search assets
   */
  searchAssets(query: {
    assetTypeId?: string
    category?: string
    status?: AssetStatus
    metadata?: Record<string, any>
    text?: string
    limit?: number
    offset?: number
  }): CustomAsset[] {
    let assets = Array.from(this.customAssets.values())

    // Filter by asset type
    if (query.assetTypeId) {
      assets = assets.filter(asset => asset.assetTypeId === query.assetTypeId)
    }

    // Filter by category
    if (query.category) {
      assets = assets.filter(asset => {
        const assetType = this.customAssetTypes.get(asset.assetTypeId)
        return assetType?.category === query.category
      })
    }

    // Filter by status
    if (query.status) {
      assets = assets.filter(asset => asset.status === query.status)
    }

    // Filter by metadata
    if (query.metadata) {
      assets = assets.filter(asset =>
        Object.entries(query.metadata!).every(([key, value]) =>
          asset.metadata[key] === value
        )
      )
    }

    // Text search
    if (query.text) {
      const searchTerm = query.text.toLowerCase()
      assets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.description.toLowerCase().includes(searchTerm) ||
        Object.values(asset.metadata).some(value =>
          String(value).toLowerCase().includes(searchTerm)
        )
      )
    }

    // Sort by updated date
    assets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    // Pagination
    const offset = query.offset || 0
    const limit = query.limit || 50

    return assets.slice(offset, offset + limit)
  }

  // ============ SCHEMA VALIDATION ============

  /**
   * Validate JSON schema
   */
  validateSchema(schema: AssetSchema): SchemaValidation {
    try {
      // Basic schema validation
      if (!schema.$schema || !schema.type || !schema.properties) {
        return {
          isValid: false,
          errors: [{
            field: 'schema',
            message: 'Invalid schema structure',
            code: 'INVALID_SCHEMA',
            severity: 'error'
          }],
          warnings: []
        }
      }

      // Check for common issues
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []

      // Validate required fields exist in properties
      if (schema.required) {
        const missingRequired = schema.required.filter(field => !schema.properties[field])
        if (missingRequired.length > 0) {
          errors.push({
            field: 'required',
            message: `Required fields not defined in properties: ${missingRequired.join(', ')}`,
            code: 'MISSING_REQUIRED_PROPERTIES',
            severity: 'error'
          })
        }
      }

      // Validate property types
      Object.entries(schema.properties).forEach(([fieldName, property]) => {
        if (!property.type && !property.$ref) {
          warnings.push({
            field: fieldName,
            message: 'Property missing type definition',
            code: 'MISSING_TYPE'
          })
        }
      })

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'schema',
          message: `Schema validation error: ${error.message}`,
          code: 'VALIDATION_ERROR',
          severity: 'error'
        }],
        warnings: []
      }
    }
  }

  /**
   * Validate asset data against schema
   */
  validateAssetData(assetTypeId: string, data: Record<string, any>): SchemaValidation {
    try {
      const schema = this.schemaCache.get(assetTypeId)
      if (!schema) {
        return {
          isValid: false,
          errors: [{
            field: 'schema',
            message: 'Schema not found for asset type',
            code: 'SCHEMA_NOT_FOUND',
            severity: 'error'
          }],
          warnings: []
        }
      }

      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []

      // Check required fields
      if (schema.required) {
        const missingRequired = schema.required.filter(field => !data[field])
        missingRequired.forEach(field => {
          errors.push({
            field,
            message: `${field} is required`,
            code: 'REQUIRED_FIELD_MISSING',
            severity: 'error'
          })
        })
      }

      // Validate each property
      Object.entries(schema.properties).forEach(([fieldName, property]) => {
        const value = data[fieldName]

        if (value !== undefined) {
          const fieldErrors = this.validateField(fieldName, value, property)
          errors.push(...fieldErrors)
        }
      })

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'validation',
          message: `Validation error: ${error.message}`,
          code: 'VALIDATION_ERROR',
          severity: 'error'
        }],
        warnings: []
      }
    }
  }

  /**
   * Validate individual field
   */
  private validateField(fieldName: string, value: any, property: SchemaProperty): ValidationError[] {
    const errors: ValidationError[] = []

    // Type validation
    if (property.type) {
      const types = Array.isArray(property.type) ? property.type : [property.type]
      const validType = types.some(type => this.validateType(value, type))

      if (!validType) {
        errors.push({
          field: fieldName,
          message: `Invalid type, expected ${types.join(' or ')}`,
          code: 'INVALID_TYPE',
          severity: 'error'
        })
      }
    }

    // String validations
    if (property.type === 'string' || (Array.isArray(property.type) && property.type.includes('string'))) {
      if (property.minLength && String(value).length < property.minLength) {
        errors.push({
          field: fieldName,
          message: `Minimum length is ${property.minLength}`,
          code: 'MIN_LENGTH',
          severity: 'error'
        })
      }

      if (property.maxLength && String(value).length > property.maxLength) {
        errors.push({
          field: fieldName,
          message: `Maximum length is ${property.maxLength}`,
          code: 'MAX_LENGTH',
          severity: 'error'
        })
      }

      if (property.pattern && !new RegExp(property.pattern).test(String(value))) {
        errors.push({
          field: fieldName,
          message: 'Invalid format',
          code: 'INVALID_PATTERN',
          severity: 'error'
        })
      }
    }

    // Number validations
    if (property.type === 'number' || property.type === 'integer') {
      if (property.minimum !== undefined && value < property.minimum) {
        errors.push({
          field: fieldName,
          message: `Minimum value is ${property.minimum}`,
          code: 'MINIMUM_VALUE',
          severity: 'error'
        })
      }

      if (property.maximum !== undefined && value > property.maximum) {
        errors.push({
          field: fieldName,
          message: `Maximum value is ${property.maximum}`,
          code: 'MAXIMUM_VALUE',
          severity: 'error'
        })
      }
    }

    // Enum validation
    if (property.enum && !property.enum.includes(value)) {
      errors.push({
        field: fieldName,
        message: `Value must be one of: ${property.enum.join(', ')}`,
        code: 'INVALID_ENUM',
        severity: 'error'
      })
    }

    return errors
  }

  /**
   * Validate type
   */
  private validateType(value: any, type: SchemaType): boolean {
    switch (type) {
      case 'string': return typeof value === 'string'
      case 'number': return typeof value === 'number' && !isNaN(value)
      case 'integer': return typeof value === 'number' && Number.isInteger(value)
      case 'boolean': return typeof value === 'boolean'
      case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value)
      case 'array': return Array.isArray(value)
      case 'null': return value === null
      default: return false
    }
  }

  // ============ METADATA MANAGEMENT ============

  /**
   * Add metadata field to asset type
   */
  async addMetadataField(
    assetTypeId: string,
    field: Omit<MetadataField, 'id'>
  ): Promise<CustomAssetType> {
    try {
      const assetType = this.customAssetTypes.get(assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${assetTypeId} not found`)
      }

      const newField: MetadataField = {
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...field
      }

      assetType.metadataFields.push(newField)

      // Update schema
      assetType.schema.properties[field.name] = this.convertMetadataFieldToSchemaProperty(field)

      return this.updateCustomAssetType(assetTypeId, {
        metadataFields: assetType.metadataFields,
        schema: assetType.schema
      })
    } catch (error) {
      this.logger.error(`Failed to add metadata field to asset type ${assetTypeId}:`, error)
      throw error
    }
  }

  /**
   * Update metadata field
   */
  async updateMetadataField(
    assetTypeId: string,
    fieldId: string,
    updates: Partial<Omit<MetadataField, 'id'>>
  ): Promise<CustomAssetType> {
    try {
      const assetType = this.customAssetTypes.get(assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${assetTypeId} not found`)
      }

      const fieldIndex = assetType.metadataFields.findIndex(f => f.id === fieldId)
      if (fieldIndex === -1) {
        throw new Error(`Field ${fieldId} not found`)
      }

      assetType.metadataFields[fieldIndex] = {
        ...assetType.metadataFields[fieldIndex],
        ...updates
      }

      // Update schema
      const field = assetType.metadataFields[fieldIndex]
      assetType.schema.properties[field.name] = this.convertMetadataFieldToSchemaProperty(field)

      return this.updateCustomAssetType(assetTypeId, {
        metadataFields: assetType.metadataFields,
        schema: assetType.schema
      })
    } catch (error) {
      this.logger.error(`Failed to update metadata field ${fieldId}:`, error)
      throw error
    }
  }

  /**
   * Convert metadata field to schema property
   */
  private convertMetadataFieldToSchemaProperty(field: MetadataField): SchemaProperty {
    const baseProperty: SchemaProperty = {
      title: field.label,
      description: field.display.helpText
    }

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'phone':
        baseProperty.type = 'string'
        if (field.validation?.minLength) baseProperty.minLength = field.validation.minLength
        if (field.validation?.maxLength) baseProperty.maxLength = field.validation.maxLength
        if (field.validation?.pattern) baseProperty.pattern = field.validation.pattern
        if (field.type === 'email') baseProperty.format = 'email'
        if (field.type === 'url') baseProperty.format = 'uri'
        break

      case 'number':
      case 'decimal':
      case 'currency':
      case 'percentage':
        baseProperty.type = field.type === 'decimal' ? 'number' : 'integer'
        if (field.validation?.minimum) baseProperty.minimum = field.validation.minimum
        if (field.validation?.maximum) baseProperty.maximum = field.validation.maximum
        break

      case 'boolean':
        baseProperty.type = 'boolean'
        break

      case 'date':
      case 'datetime':
        baseProperty.type = 'string'
        baseProperty.format = field.type === 'date' ? 'date' : 'date-time'
        break

      case 'select':
      case 'multiselect':
      case 'radio':
        baseProperty.type = field.type === 'multiselect' ? 'array' : 'string'
        if (field.options) {
          const values = field.options.map(opt => opt.value)
          if (field.type === 'multiselect') {
            baseProperty.items = { type: 'string', enum: values }
          } else {
            baseProperty.enum = values
          }
        }
        break

      case 'checkbox':
        baseProperty.type = 'array'
        if (field.options) {
          const values = field.options.map(opt => opt.value)
          baseProperty.items = { type: 'string', enum: values }
        }
        break

      case 'file':
      case 'image':
        baseProperty.type = 'string'
        baseProperty.format = 'uri'
        break

      case 'json':
        baseProperty.type = 'object'
        break

      case 'reference':
        baseProperty.type = 'string'
        break
    }

    if (field.defaultValue !== undefined) {
      baseProperty.default = field.defaultValue
    }

    if (field.examples) {
      baseProperty.examples = field.examples
    }

    return baseProperty
  }

  // ============ LIFECYCLE MANAGEMENT ============

  /**
   * Add lifecycle stage
   */
  async addLifecycleStage(
    assetTypeId: string,
    stage: Omit<LifecycleStage, 'id'>
  ): Promise<CustomAssetType> {
    try {
      const assetType = this.customAssetTypes.get(assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${assetTypeId} not found`)
      }

      const newStage: LifecycleStage = {
        id: `stage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...stage
      }

      assetType.lifecycleStages.push(newStage)

      // Sort stages by order
      assetType.lifecycleStages.sort((a, b) => a.order - b.order)

      return this.updateCustomAssetType(assetTypeId, {
        lifecycleStages: assetType.lifecycleStages
      })
    } catch (error) {
      this.logger.error(`Failed to add lifecycle stage to asset type ${assetTypeId}:`, error)
      throw error
    }
  }

  // ============ INTEGRATION MANAGEMENT ============

  /**
   * Add integration
   */
  async addIntegration(
    assetTypeId: string,
    integration: Omit<AssetIntegration, 'lastSync' | 'errorCount'>
  ): Promise<CustomAssetType> {
    try {
      const assetType = this.customAssetTypes.get(assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${assetTypeId} not found`)
      }

      const newIntegration: AssetIntegration = {
        ...integration,
        lastSync: undefined,
        errorCount: 0
      }

      assetType.integrations.push(newIntegration)

      return this.updateCustomAssetType(assetTypeId, {
        integrations: assetType.integrations
      })
    } catch (error) {
      this.logger.error(`Failed to add integration to asset type ${assetTypeId}:`, error)
      throw error
    }
  }

  /**
   * Sync integration
   */
  async syncIntegration(assetTypeId: string, integrationId: string): Promise<void> {
    try {
      const assetType = this.customAssetTypes.get(assetTypeId)
      if (!assetType) {
        throw new Error(`Asset type ${assetTypeId} not found`)
      }

      const integration = assetType.integrations.find(i => i.name === integrationId)
      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`)
      }

      // Perform sync based on integration type
      switch (integration.type) {
        case 'api':
          await this.syncApiIntegration(integration)
          break
        case 'webhook':
          await this.syncWebhookIntegration(integration)
          break
        case 'database':
          await this.syncDatabaseIntegration(integration)
          break
        case 'blockchain':
          await this.syncBlockchainIntegration(integration)
          break
      }

      integration.lastSync = new Date()
      integration.errorCount = 0

      await this.updateCustomAssetType(assetTypeId, {
        integrations: assetType.integrations
      })

      this.emit('integration:synced', { integration })
    } catch (error) {
      const assetType = this.customAssetTypes.get(assetTypeId)
      if (assetType) {
        const integration = assetType.integrations.find(i => i.name === integrationId)
        if (integration) {
          integration.errorCount++
          await this.updateCustomAssetType(assetTypeId, {
            integrations: assetType.integrations
          })
        }
      }

      this.logger.error(`Failed to sync integration ${integrationId}:`, error)
      throw error
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Update digital twin with asset data
   */
  private async updateDigitalTwinAsset(assetId: string, asset: CustomAsset): Promise<void> {
    try {
      const twin = this.digitalTwinService.getDigitalTwinByAsset(assetId)
      if (twin) {
        // Update asset details in digital twin
        this.emit('digitalTwin:assetUpdate', {
          twinId: twin.id,
          asset
        })
      }
    } catch (error) {
      this.logger.error(`Failed to update digital twin asset for ${assetId}:`, error)
    }
  }

  /**
   * Log audit entry
   */
  private async logAuditEntry(
    assetId: string,
    action: AuditEntry['action'],
    userId: string,
    details: Record<string, any>
  ): Promise<void> {
    const asset = this.customAssets.get(assetId)
    if (asset) {
      const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId,
        action,
        details
      }

      asset.auditTrail.push(auditEntry)
      this.customAssets.set(assetId, asset)
    }
  }

  /**
   * Map stage to status
   */
  private mapStageToStatus(stageId: string): AssetStatus {
    // Simple mapping - can be customized per asset type
    switch (stageId) {
      case 'draft': return 'draft'
      case 'review': return 'pending_approval'
      case 'approved': return 'approved'
      case 'published': return 'published'
      case 'archived': return 'archived'
      default: return 'draft'
    }
  }

  /**
   * Trigger stage notifications
   */
  private async triggerStageNotifications(asset: CustomAsset, stage: LifecycleStage): Promise<void> {
    const notifications = stage.notifications

    for (const notification of notifications) {
      if (notification.event === 'enter') {
        // Send notifications based on channels
        this.emit('notification:send', {
          recipients: notification.recipients,
          template: notification.template,
          channels: notification.channels,
          data: { asset, stage }
        })
      }
    }
  }

  // Placeholder integration sync methods
  private async syncApiIntegration(integration: AssetIntegration): Promise<void> {
    // Implementation would call external API
    this.logger.info(`Syncing API integration: ${integration.name}`)
  }

  private async syncWebhookIntegration(integration: AssetIntegration): Promise<void> {
    // Implementation would send webhook
    this.logger.info(`Syncing webhook integration: ${integration.name}`)
  }

  private async syncDatabaseIntegration(integration: AssetIntegration): Promise<void> {
    // Implementation would sync with external database
    this.logger.info(`Syncing database integration: ${integration.name}`)
  }

  private async syncBlockchainIntegration(integration: AssetIntegration): Promise<void> {
    // Implementation would sync with blockchain
    this.logger.info(`Syncing blockchain integration: ${integration.name}`)
  }

  /**
   * Get comprehensive asset overview
   */
  getAssetOverview(assetId: string): {
    asset: CustomAsset | null
    assetType: CustomAssetType | null
    validationStatus: SchemaValidation | null
    auditTrail: AuditEntry[]
    relationships: AssetRelationship[]
    attachments: AssetAttachment[]
  } {
    const asset = this.customAssets.get(assetId) || null
    const assetType = asset ? this.customAssetTypes.get(asset.assetTypeId) || null : null
    const validationStatus = asset && assetType ?
      this.validateAssetData(asset.assetTypeId, asset.metadata) : null

    return {
      asset,
      assetType,
      validationStatus,
      auditTrail: asset?.auditTrail || [],
      relationships: asset?.relationships || [],
      attachments: asset?.attachments || []
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
        totalAssetTypes: this.customAssetTypes.size,
        activeAssetTypes: Array.from(this.customAssetTypes.values()).filter(t => t.isActive).length,
        totalAssets: this.customAssets.values(),
        activeAssets: Array.from(this.customAssets.values()).filter(a => a.status === 'published').length,
        totalMetadataFields: Array.from(this.customAssetTypes.values()).reduce((sum, type) => sum + type.metadataFields.length, 0),
        totalLifecycleStages: Array.from(this.customAssetTypes.values()).reduce((sum, type) => sum + type.lifecycleStages.length, 0),
        totalIntegrations: Array.from(this.customAssetTypes.values()).reduce((sum, type) => sum + type.integrations.length, 0)
      }
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.customAssetTypes.clear()
    this.customAssets.clear()
    this.assetTypeVersions.clear()
    this.schemaCache.clear()
    this.validationCache.clear()

    // Clear intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval)
    }
    this.monitoringIntervals.clear()

    this.logger.info('All other asset types data cleared')
  }
}

export default OtherAssetTypesService
