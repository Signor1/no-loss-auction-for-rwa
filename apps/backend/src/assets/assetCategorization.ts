import { EventEmitter } from 'events'
import { Logger } from '../utils/logger'
import { Asset, AssetType } from './assetRegistry'

// Category interface
export interface Category {
  id: string
  name: string
  description: string
  parentId?: string
  level: number
  path: string
  assetType: AssetType
  metadata: CategoryMetadata
  rules: CategoryRule[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  children: string[]
  assetCount: number
}

// Category metadata interface
export interface CategoryMetadata {
  icon?: string
  color?: string
  tags: string[]
  attributes: CategoryAttribute[]
  validation: CategoryValidation
  indexing: CategoryIndexing
  display: CategoryDisplay
}

// Category attribute interface
export interface CategoryAttribute {
  name: string
  type: AttributeType
  required: boolean
  searchable: boolean
  filterable: boolean
  displayable: boolean
  defaultValue?: any
  options?: string[]
  validation?: AttributeValidation
}

// Attribute type enum
export enum AttributeType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RATING = 'rating',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone'
}

// Attribute validation interface
export interface AttributeValidation {
  pattern?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  allowedValues?: string[]
  customRules?: string[]
}

// Category validation interface
export interface CategoryValidation {
  requiredFields: string[]
  conditionalRules: ConditionalRule[]
  customValidation: string[]
  autoCategorization: AutoCategorizationRule[]
}

// Conditional rule interface
export interface ConditionalRule {
  id: string
  name: string
  description: string
  condition: RuleCondition
  action: RuleAction
  isActive: boolean
}

// Rule condition interface
export interface RuleCondition {
  field: string
  operator: ConditionOperator
  value: any
  logicalOperator?: 'AND' | 'OR'
  nestedConditions?: RuleCondition[]
}

// Condition operator enum
export enum ConditionOperator {
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
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  REGEX = 'regex'
}

// Rule action interface
export interface RuleAction {
  type: ActionType
  parameters: Record<string, any>
}

// Action type enum
export enum ActionType {
  ADD_CATEGORY = 'add_category',
  REMOVE_CATEGORY = 'remove_category',
  SET_ATTRIBUTE = 'set_attribute',
  VALIDATE_ASSET = 'validate_asset',
  SEND_NOTIFICATION = 'send_notification',
  TRIGGER_WORKFLOW = 'trigger_workflow'
}

// Auto categorization rule interface
export interface AutoCategorizationRule {
  id: string
  name: string
  description: string
  priority: number
  conditions: RuleCondition[]
  categoryIds: string[]
  confidence: number
  isActive: boolean
  machineLearning?: MLRule
}

// ML rule interface
export interface MLRule {
  model: string
  version: string
  features: string[]
  threshold: number
  trainingData: string
}

// Category indexing interface
export interface CategoryIndexing {
  searchable: boolean
  filterable: boolean
  sortable: boolean
  facetable: boolean
  weight: number
  synonyms: string[]
}

// Category display interface
export interface CategoryDisplay {
  template: string
  fields: DisplayField[]
  layout: DisplayLayout
  colors: DisplayColors
  icons: DisplayIcons
}

// Display field interface
export interface DisplayField {
  name: string
  label: string
  type: DisplayFieldType
  order: number
  visible: boolean
  format?: string
}

// Display field type enum
export enum DisplayFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CURRENCY = 'currency',
  DATE = 'date',
  BOOLEAN = 'boolean',
  IMAGE = 'image',
  LINK = 'link',
  BADGE = 'badge',
  PROGRESS = 'progress',
  RATING = 'rating'
}

// Display layout interface
export interface DisplayLayout {
  type: 'grid' | 'list' | 'card' | 'table'
  columns: number
  spacing: number
  responsive: boolean
}

// Display colors interface
export interface DisplayColors {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

// Display icons interface
export interface DisplayIcons {
  category: string
  subcategory: string
  active: string
  inactive: string
}

// Category rule interface
export interface CategoryRule {
  id: string
  name: string
  description: string
  type: RuleType
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority: number
  isActive: boolean
}

// Rule type enum
export enum RuleType {
  ASSIGNMENT = 'assignment',
  VALIDATION = 'validation',
  TRANSFORMATION = 'transformation',
  NOTIFICATION = 'notification',
  WORKFLOW = 'workflow'
}

// Asset categorization interface
export interface AssetCategorization {
  assetId: string
  categories: AssetCategoryAssignment[]
  tags: string[]
  attributes: Record<string, any>
  confidence: number
  method: CategorizationMethod
  categorizedAt: Date
  categorizedBy: string
  reviewed: boolean
  reviewedAt?: Date
  reviewedBy?: string
}

// Asset category assignment interface
export interface AssetCategoryAssignment {
  categoryId: string
  confidence: number
  source: CategorySource
  assignedAt: Date
  assignedBy: string
  isPrimary: boolean
  level: number
}

// Category source enum
export enum CategorySource {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  ML_PREDICTION = 'ml_prediction',
  RULE_BASED = 'rule_based',
  IMPORT = 'import'
}

// Categorization method enum
export enum CategorizationMethod {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  HYBRID = 'hybrid',
  BATCH = 'batch',
  IMPORT = 'import'
}

// Categorization statistics interface
export interface CategorizationStatistics {
  totalAssets: number
  categorizedAssets: number
  uncategorizedAssets: number
  averageCategoriesPerAsset: number
  categoriesByType: Record<AssetType, number>
  topCategories: Array<{ categoryId: string; name: string; count: number }>
  categorizationMethods: Record<CategorizationMethod, number>
  confidenceDistribution: ConfidenceDistribution[]
  recentCategorizations: AssetCategorization[]
}

// Confidence distribution interface
export interface ConfidenceDistribution {
  range: string
  count: number
  percentage: number
}

// Asset categorization service
export class AssetCategorizationService extends EventEmitter {
  private categories: Map<string, Category> = new Map()
  private assetCategorizations: Map<string, AssetCategorization> = new Map()
  private categorizationRules: Map<string, CategoryRule> = new Map()
  private autoCategorizationRules: Map<string, AutoCategorizationRule> = new Map()
  private logger: Logger
  private isRunning: boolean = false
  private maxCategories: number = 10000
  private categorizationTimeout: number = 30000 // 30 seconds

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start categorization service
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Asset categorization service already started')
      return
    }

    this.isRunning = true
    this.logger.info('Starting asset categorization service...')

    // Load categorization data
    await this.loadCategorizationData()

    // Initialize default categories
    await this.initializeDefaultCategories()

    // Start auto-categorization
    this.startAutoCategorization()

    this.logger.info('Asset categorization service started')
    this.emit('categorization:started')
  }

  // Stop categorization service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.logger.info('Stopping asset categorization service...')

    // Save categorization data
    await this.saveCategorizationData()

    this.logger.info('Asset categorization service stopped')
    this.emit('categorization:stopped')
  }

  // Create category
  async createCategory(categoryData: Omit<Category, 'id' | 'level' | 'path' | 'createdAt' | 'updatedAt' | 'children' | 'assetCount'>): Promise<Category> {
    const categoryId = this.generateCategoryId()

    try {
      this.logger.debug(`Creating category: ${categoryData.name}`)

      // Calculate level and path
      let level = 0
      let path = categoryData.name
      if (categoryData.parentId) {
        const parent = this.categories.get(categoryData.parentId)
        if (!parent) {
          throw new Error(`Parent category not found: ${categoryData.parentId}`)
        }
        level = parent.level + 1
        path = `${parent.path} > ${categoryData.name}`
      }

      const category: Category = {
        id: categoryId,
        ...categoryData,
        level,
        path,
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
        assetCount: 0
      }

      // Validate category
      this.validateCategory(category)

      // Store category
      this.categories.set(categoryId, category)
      await this.saveCategory(category)

      // Update parent
      if (categoryData.parentId) {
        const parent = this.categories.get(categoryData.parentId)
        if (parent) {
          parent.children.push(categoryId)
          await this.saveCategory(parent)
        }
      }

      this.logger.info(`Category created: ${categoryId}`)
      this.emit('category:created', { category })

      return category

    } catch (error) {
      this.logger.error(`Failed to create category: ${categoryData.name}`, error)
      this.emit('category:error', { error, categoryData })
      throw error
    }
  }

  // Update category
  async updateCategory(categoryId: string, updates: Partial<Category>, updatedBy: string): Promise<Category> {
    const category = this.categories.get(categoryId)
    if (!category) {
      throw new Error(`Category not found: ${categoryId}`)
    }

    try {
      this.logger.debug(`Updating category: ${categoryId}`)

      const updatedCategory: Category = {
        ...category,
        ...updates,
        updatedAt: new Date(),
        updatedBy
      }

      // Validate updated category
      this.validateCategory(updatedCategory)

      // Store updated category
      this.categories.set(categoryId, updatedCategory)
      await this.saveCategory(updatedCategory)

      this.logger.info(`Category updated: ${categoryId}`)
      this.emit('category:updated', { category: updatedCategory })

      return updatedCategory

    } catch (error) {
      this.logger.error(`Failed to update category: ${categoryId}`, error)
      this.emit('category:error', { error, categoryId })
      throw error
    }
  }

  // Categorize asset
  async categorizeAsset(asset: Asset, categoryIds: string[], method: CategorizationMethod, categorizedBy: string): Promise<AssetCategorization> {
    const categorizationId = this.generateCategorizationId()

    try {
      this.logger.debug(`Categorizing asset: ${asset.id}`)

      // Validate categories
      const validCategories = await this.validateCategories(categoryIds)

      // Create category assignments
      const assignments: AssetCategoryAssignment[] = validCategories.map((categoryId, index) => {
        const category = this.categories.get(categoryId)!
        return {
          categoryId,
          confidence: method === CategorizationMethod.MANUAL ? 1.0 : 0.8,
          source: this.getSourceFromMethod(method),
          assignedAt: new Date(),
          assignedBy: categorizedBy,
          isPrimary: index === 0,
          level: category.level
        }
      })

      // Create categorization
      const categorization: AssetCategorization = {
        assetId: asset.id,
        categories: assignments,
        tags: this.extractTagsFromCategories(validCategories),
        attributes: this.extractAttributesFromCategories(validCategories, asset),
        confidence: this.calculateOverallConfidence(assignments),
        method,
        categorizedAt: new Date(),
        categorizedBy,
        reviewed: method === CategorizationMethod.MANUAL
      }

      // Store categorization
      this.assetCategorizations.set(categorizationId, categorization)
      await this.saveAssetCategorization(categorization)

      // Update asset category counts
      await this.updateCategoryAssetCounts(validCategories, 1)

      // Apply category rules
      await this.applyCategoryRules(asset, validCategories)

      this.logger.info(`Asset categorized: ${asset.id} with ${validCategories.length} categories`)
      this.emit('asset:categorized', { asset, categorization })

      return categorization

    } catch (error) {
      this.logger.error(`Failed to categorize asset: ${asset.id}`, error)
      this.emit('categorization:error', { error, assetId: asset.id })
      throw error
    }
  }

  // Auto categorize asset
  async autoCategorizeAsset(asset: Asset): Promise<AssetCategorization> {
    try {
      this.logger.debug(`Auto categorizing asset: ${asset.id}`)

      // Get applicable rules
      const applicableRules = await this.getApplicableAutoCategorizationRules(asset)

      // Evaluate rules
      const ruleResults = await this.evaluateAutoCategorizationRules(asset, applicableRules)

      // Select best categories
      const selectedCategories = this.selectCategoriesFromRules(ruleResults)

      if (selectedCategories.length === 0) {
        throw new Error('No categories matched for auto categorization')
      }

      // Create categorization
      const categorization = await this.categorizeAsset(
        asset,
        selectedCategories.map(c => c.categoryId),
        CategorizationMethod.AUTOMATIC,
        'system'
      )

      // Update confidence based on rule results
      categorization.confidence = this.calculateRuleBasedConfidence(ruleResults)

      await this.saveAssetCategorization(categorization)

      this.logger.info(`Asset auto categorized: ${asset.id}`)
      this.emit('asset:auto_categorized', { asset, categorization })

      return categorization

    } catch (error) {
      this.logger.error(`Failed to auto categorize asset: ${asset.id}`, error)
      this.emit('auto_categorization:error', { error, assetId: asset.id })
      throw error
    }
  }

  // Batch categorize assets
  async batchCategorizeAssets(assetIds: string[], categoryIds: string[], categorizedBy: string): Promise<AssetCategorization[]> {
    const results: AssetCategorization[] = []

    try {
      this.logger.debug(`Batch categorizing ${assetIds.length} assets`)

      for (const assetId of assetIds) {
        try {
          // This would load the actual asset
          const asset = await this.loadAsset(assetId)
          if (asset) {
            const categorization = await this.categorizeAsset(
              asset,
              categoryIds,
              CategorizationMethod.BATCH,
              categorizedBy
            )
            results.push(categorization)
          }
        } catch (error) {
          this.logger.error(`Failed to categorize asset in batch: ${assetId}`, error)
        }
      }

      this.logger.info(`Batch categorization completed: ${results.length}/${assetIds.length} assets categorized`)
      this.emit('batch:categorized', { assetIds, results })

      return results

    } catch (error) {
      this.logger.error('Batch categorization failed', error)
      this.emit('batch:categorization:error', { error, assetIds })
      throw error
    }
  }

  // Get category by ID
  getCategory(categoryId: string): Category | null {
    return this.categories.get(categoryId) || null
  }

  // Get all categories
  getAllCategories(): Category[] {
    return Array.from(this.categories.values())
      .sort((a, b) => a.path.localeCompare(b.path))
  }

  // Get categories by asset type
  getCategoriesByAssetType(assetType: AssetType): Category[] {
    return Array.from(this.categories.values())
      .filter(category => category.assetType === assetType && category.isActive)
      .sort((a, b) => a.path.localeCompare(b.path))
  }

  // Get category tree
  getCategoryTree(rootCategoryId?: string): CategoryTreeNode[] {
    const rootId = rootCategoryId || 'root'
    const rootCategories = Array.from(this.categories.values())
      .filter(category => !category.parentId || category.parentId === rootId)
      .sort((a, b) => a.name.localeCompare(b.name))

    return rootCategories.map(category => this.buildCategoryTree(category))
  }

  // Get asset categorization
  getAssetCategorization(assetId: string): AssetCategorization | null {
    for (const categorization of this.assetCategorizations.values()) {
      if (categorization.assetId === assetId) {
        return categorization
      }
    }
    return null
  }

  // Get assets by category
  getAssetsByCategory(categoryId: string): AssetCategorization[] {
    return Array.from(this.assetCategorizations.values())
      .filter(categorization => 
        categorization.categories.some(cat => cat.categoryId === categoryId)
      )
      .sort((a, b) => b.categorizedAt.getTime() - a.categorizedAt.getTime())
  }

  // Update asset categorization
  async updateAssetCategorization(assetId: string, categoryIds: string[], updatedBy: string): Promise<AssetCategorization> {
    const existingCategorization = this.getAssetCategorization(assetId)
    if (!existingCategorization) {
      throw new Error(`Asset categorization not found: ${assetId}`)
    }

    // Remove old category counts
    const oldCategoryIds = existingCategorization.categories.map(cat => cat.categoryId)
    await this.updateCategoryAssetCounts(oldCategoryIds, -1)

    // Create new categorization
    const asset = await this.loadAsset(assetId)
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`)
    }

    const newCategorization = await this.categorizeAsset(
      asset,
      categoryIds,
      CategorizationMethod.MANUAL,
      updatedBy
    )

    // Remove old categorization
    for (const [id, categorization] of this.assetCategorizations.entries()) {
      if (categorization.assetId === assetId) {
        this.assetCategorizations.delete(id)
        break
      }
    }

    return newCategorization
  }

  // Get categorization statistics
  getCategorizationStatistics(): CategorizationStatistics {
    const categorizations = Array.from(this.assetCategorizations.values())
    const categories = Array.from(this.categories.values())

    return {
      totalAssets: categorizations.length,
      categorizedAssets: categorizations.filter(c => c.categories.length > 0).length,
      uncategorizedAssets: categorizations.filter(c => c.categories.length === 0).length,
      averageCategoriesPerAsset: categorizations.length > 0 ? 
        categorizations.reduce((sum, c) => sum + c.categories.length, 0) / categorizations.length : 0,
      categoriesByType: this.countCategoriesByType(categories),
      topCategories: this.getTopCategories(),
      categorizationMethods: this.countCategorizationMethods(categorizations),
      confidenceDistribution: this.getConfidenceDistribution(categorizations),
      recentCategorizations: categorizations
        .sort((a, b) => b.categorizedAt.getTime() - a.categorizedAt.getTime())
        .slice(0, 10)
    }
  }

  // Private methods
  private validateCategory(category: Category): void {
    if (!category.name || category.name.trim().length === 0) {
      throw new Error('Category name is required')
    }

    if (this.categories.size >= this.maxCategories) {
      throw new Error('Maximum category limit reached')
    }

    // Check for duplicate names at the same level
    const siblings = Array.from(this.categories.values())
      .filter(cat => cat.parentId === category.parentId && cat.id !== category.id)
    
    if (siblings.some(sibling => sibling.name === category.name)) {
      throw new Error(`Category name already exists at this level: ${category.name}`)
    }
  }

  private async validateCategories(categoryIds: string[]): Promise<string[]> {
    const validCategories: string[] = []

    for (const categoryId of categoryIds) {
      const category = this.categories.get(categoryId)
      if (category && category.isActive) {
        validCategories.push(categoryId)
      }
    }

    if (validCategories.length === 0) {
      throw new Error('No valid categories found')
    }

    return validCategories
  }

  private extractTagsFromCategories(categoryIds: string[]): string[] {
    const tags: string[] = []

    for (const categoryId of categoryIds) {
      const category = this.categories.get(categoryId)
      if (category) {
        tags.push(...category.metadata.tags)
      }
    }

    return [...new Set(tags)] // Remove duplicates
  }

  private extractAttributesFromCategories(categoryIds: string[], asset: Asset): Record<string, any> {
    const attributes: Record<string, any> = {}

    for (const categoryId of categoryIds) {
      const category = this.categories.get(categoryId)
      if (category) {
        for (const attr of category.metadata.attributes) {
          if (!attributes[attr.name]) {
            // Extract attribute value from asset metadata
            attributes[attr.name] = this.extractAttributeValue(asset, attr)
          }
        }
      }
    }

    return attributes
  }

  private extractAttributeValue(asset: Asset, attribute: CategoryAttribute): any {
    // This would extract the actual attribute value from asset metadata
    // For now, return default value or null
    return attribute.defaultValue || null
  }

  private calculateOverallConfidence(assignments: AssetCategoryAssignment[]): number {
    if (assignments.length === 0) return 0
    const total = assignments.reduce((sum, assignment) => sum + assignment.confidence, 0)
    return total / assignments.length
  }

  private getSourceFromMethod(method: CategorizationMethod): CategorySource {
    switch (method) {
      case CategorizationMethod.MANUAL:
        return CategorySource.MANUAL
      case CategorizationMethod.BATCH:
        return CategorySource.MANUAL
      case CategorizationMethod.IMPORT:
        return CategorySource.IMPORT
      default:
        return CategorySource.AUTOMATIC
    }
  }

  private async updateCategoryAssetCounts(categoryIds: string[], increment: number): Promise<void> {
    for (const categoryId of categoryIds) {
      const category = this.categories.get(categoryId)
      if (category) {
        category.assetCount = Math.max(0, category.assetCount + increment)
        await this.saveCategory(category)
      }
    }
  }

  private async applyCategoryRules(asset: Asset, categoryIds: string[]): Promise<void> {
    for (const categoryId of categoryIds) {
      const category = this.categories.get(categoryId)
      if (category) {
        for (const rule of category.rules) {
          if (rule.isActive) {
            await this.applyCategoryRule(asset, rule)
          }
        }
      }
    }
  }

  private async applyCategoryRule(asset: Asset, rule: CategoryRule): Promise<void> {
    // This would apply the actual rule to the asset
    this.logger.debug(`Applying category rule: ${rule.name} to asset: ${asset.id}`)
  }

  private async getApplicableAutoCategorizationRules(asset: Asset): Promise<AutoCategorizationRule[]> {
    return Array.from(this.autoCategorizationRules.values())
      .filter(rule => rule.isActive && this.isRuleApplicable(rule, asset))
      .sort((a, b) => b.priority - a.priority)
  }

  private isRuleApplicable(rule: AutoCategorizationRule, asset: Asset): boolean {
    // This would check if the rule is applicable to the asset
    // For now, return true for all rules
    return true
  }

  private async evaluateAutoCategorizationRules(asset: Asset, rules: AutoCategorizationRule[]): Promise<AutoCategorizationResult[]> {
    const results: AutoCategorizationResult[] = []

    for (const rule of rules) {
      const confidence = await this.evaluateRuleConfidence(asset, rule)
      results.push({
        ruleId: rule.id,
        categoryIds: rule.categoryIds,
        confidence,
        matched: confidence >= rule.confidence
      })
    }

    return results
  }

  private async evaluateRuleConfidence(asset: Asset, rule: AutoCategorizationRule): Promise<number> {
    // This would evaluate the actual confidence score
    // For now, return a mock confidence
    return Math.random() * 0.5 + 0.5 // 0.5 to 1.0
  }

  private selectCategoriesFromRules(results: AutoCategorizationResult[]): string[] {
    const categoryScores = new Map<string, number>()

    for (const result of results) {
      if (result.matched) {
        for (const categoryId of result.categoryIds) {
          const currentScore = categoryScores.get(categoryId) || 0
          categoryScores.set(categoryId, Math.max(currentScore, result.confidence))
        }
      }
    }

    // Return categories with highest scores
    return Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 categories
      .map(([categoryId]) => categoryId)
  }

  private calculateRuleBasedConfidence(results: AutoCategorizationResult[]): number {
    const matchedResults = results.filter(r => r.matched)
    if (matchedResults.length === 0) return 0

    const totalConfidence = matchedResults.reduce((sum, result) => sum + result.confidence, 0)
    return totalConfidence / matchedResults.length
  }

  private buildCategoryTree(category: Category): CategoryTreeNode {
    const children = category.children
      .map(childId => this.categories.get(childId))
      .filter((child): child is Category => child !== undefined && child.isActive)
      .map(child => this.buildCategoryTree(child))

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      level: category.level,
      path: category.path,
      assetType: category.assetType,
      assetCount: category.assetCount,
      metadata: category.metadata,
      children,
      isActive: category.isActive
    }
  }

  private countCategoriesByType(categories: Category[]): Record<AssetType, number> {
    const counts = {} as Record<AssetType, number>
    for (const category of categories) {
      counts[category.assetType] = (counts[category.assetType] || 0) + 1
    }
    return counts
  }

  private getTopCategories(): Array<{ categoryId: string; name: string; count: number }> {
    return Array.from(this.categories.values())
      .map(category => ({
        categoryId: category.id,
        name: category.name,
        count: category.assetCount
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private countCategorizationMethods(categorizations: AssetCategorization[]): Record<CategorizationMethod, number> {
    const counts = {} as Record<CategorizationMethod, number>
    for (const categorization of categorizations) {
      counts[categorization.method] = (counts[categorization.method] || 0) + 1
    }
    return counts
  }

  private getConfidenceDistribution(categorizations: AssetCategorization[]): ConfidenceDistribution[] {
    const ranges = [
      { range: '0.9-1.0', min: 0.9, max: 1.0, count: 0 },
      { range: '0.8-0.9', min: 0.8, max: 0.9, count: 0 },
      { range: '0.7-0.8', min: 0.7, max: 0.8, count: 0 },
      { range: '0.6-0.7', min: 0.6, max: 0.7, count: 0 },
      { range: '0.5-0.6', min: 0.5, max: 0.6, count: 0 },
      { range: '0.0-0.5', min: 0.0, max: 0.5, count: 0 }
    ]

    const total = categorizations.length

    for (const categorization of categorizations) {
      for (const range of ranges) {
        if (categorization.confidence >= range.min && categorization.confidence < range.max) {
          range.count++
          break
        }
      }
    }

    return ranges.map(range => ({
      range: range.range,
      count: range.count,
      percentage: total > 0 ? (range.count / total) * 100 : 0
    }))
  }

  // Default categories initialization
  private async initializeDefaultCategories(): Promise<void> {
    if (this.categories.size === 0) {
      await this.createDefaultCategories()
    }
  }

  private async createDefaultCategories(): Promise<void> {
    // Create default categories for real estate
    const realEstateCategories = [
      {
        name: 'Residential',
        description: 'Residential real estate properties',
        assetType: AssetType.REAL_ESTATE,
        parentId: undefined,
        metadata: {
          tags: ['residential', 'housing', 'home'],
          attributes: [],
          validation: { requiredFields: [], conditionalRules: [], customValidation: [], autoCategorization: [] },
          indexing: { searchable: true, filterable: true, sortable: true, facetable: true, weight: 1, synonyms: [] },
          display: { template: 'default', fields: [], layout: { type: 'grid', columns: 3, spacing: 16, responsive: true }, colors: { primary: '#blue', secondary: '#gray', accent: '#green', background: '#white', text: '#black' }, icons: { category: 'home', subcategory: 'house', active: 'check', inactive: 'x' } }
        },
        rules: [],
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system'
      },
      {
        name: 'Commercial',
        description: 'Commercial real estate properties',
        assetType: AssetType.REAL_ESTATE,
        parentId: undefined,
        metadata: {
          tags: ['commercial', 'business', 'office'],
          attributes: [],
          validation: { requiredFields: [], conditionalRules: [], customValidation: [], autoCategorization: [] },
          indexing: { searchable: true, filterable: true, sortable: true, facetable: true, weight: 1, synonyms: [] },
          display: { template: 'default', fields: [], layout: { type: 'grid', columns: 3, spacing: 16, responsive: true }, colors: { primary: '#blue', secondary: '#gray', accent: '#green', background: '#white', text: '#black' }, icons: { category: 'building', subcategory: 'office', active: 'check', inactive: 'x' } }
        },
        rules: [],
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system'
      }
    ]

    for (const categoryData of realEstateCategories) {
      await this.createCategory(categoryData)
    }

    this.logger.info('Default categories created')
  }

  // Auto-categorization process
  private startAutoCategorization(): void {
    // Schedule auto-categorization every hour
    setInterval(() => {
      this.performAutoCategorization()
    }, 3600000) // Every hour
  }

  private async performAutoCategorization(): Promise<void> {
    // This would identify uncategorized assets and auto-categorize them
    this.logger.debug('Performing auto-categorization')
  }

  // Mock methods (would be implemented with actual data access)
  private async loadAsset(assetId: string): Promise<Asset | null> {
    // This would load the actual asset from your database
    return null
  }

  // ID generation methods
  private generateCategoryId(): string {
    return `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCategorizationId(): string {
    return `categorization_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Data persistence methods
  private async saveCategory(category: Category): Promise<void> {
    // This would save to your database
    this.logger.debug(`Category saved: ${category.id}`)
  }

  private async saveAssetCategorization(categorization: AssetCategorization): Promise<void> {
    // This would save to your database
    this.logger.debug(`Asset categorization saved: ${categorization.assetId}`)
  }

  private async loadCategorizationData(): Promise<void> {
    // This would load from your database
    this.logger.info('Loading categorization data...')
  }

  private async saveCategorizationData(): Promise<void> {
    // This would save to your database
    this.logger.info('Saving categorization data...')
  }

  // Export methods
  exportCategorizationData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      categories: Array.from(this.categories.values()),
      categorizations: Array.from(this.assetCategorizations.values()),
      statistics: this.getCategorizationStatistics()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['assetId', 'categories', 'confidence', 'method', 'categorizedAt', 'categorizedBy']
      const csvRows = [headers.join(',')]
      
      for (const categorization of this.assetCategorizations.values()) {
        csvRows.push([
          categorization.assetId,
          JSON.stringify(categorization.categories.map(c => c.categoryId)),
          categorization.confidence.toString(),
          categorization.method,
          categorization.categorizedAt.toISOString(),
          categorization.categorizedBy
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Health status
  getHealthStatus(): {
    isRunning: boolean
    totalCategories: number
    totalCategorizations: number
    lastActivity: Date
    metrics: CategorizationStatistics
  } {
    return {
      isRunning: this.isRunning,
      totalCategories: this.categories.size,
      totalCategorizations: this.assetCategorizations.size,
      lastActivity: new Date(),
      metrics: this.getCategorizationStatistics()
    }
  }
}

// Supporting interfaces
export interface CategoryTreeNode {
  id: string
  name: string
  description: string
  level: number
  path: string
  assetType: AssetType
  assetCount: number
  metadata: CategoryMetadata
  children: CategoryTreeNode[]
  isActive: boolean
}

export interface AutoCategorizationResult {
  ruleId: string
  categoryIds: string[]
  confidence: number
  matched: boolean
}

export default AssetCategorizationService
