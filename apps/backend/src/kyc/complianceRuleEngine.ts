import { EventEmitter } from 'events';

export enum RuleType {
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  COMPLIANCE_CHECK = 'compliance_check',
  RISK_ASSESSMENT = 'risk_assessment',
  NOTIFICATION = 'notification',
  AUTOMATION = 'automation'
}

export enum TriggerType {
  EVENT = 'event',
  SCHEDULE = 'schedule',
  CONDITION = 'condition',
  MANUAL = 'manual',
  API_CALL = 'api_call'
}

export enum OperatorType {
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
  REGEX = 'regex',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null'
}

export enum ActionType {
  APPROVE = 'approve',
  REJECT = 'reject',
  FLAG = 'flag',
  NOTIFY = 'notify',
  LOG = 'log',
  EXECUTE = 'execute',
  TRANSFORM = 'transform',
  ROUTE = 'route',
  ESCALATE = 'escalate',
  DELAY = 'delay'
}

export enum RuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  ERROR = 'error'
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  category: string;
  priority: number;
  status: RuleStatus;
  triggers: RuleTrigger[];
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata: Record<string, any>;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  lastExecuted?: Date;
  executionCount: number;
  successCount: number;
  errorCount: number;
}

export interface RuleTrigger {
  id: string;
  type: TriggerType;
  config: Record<string, any>;
  isActive: boolean;
}

export interface RuleCondition {
  id: string;
  field: string;
  operator: OperatorType;
  value: any;
  logicalOperator?: 'AND' | 'OR';
  caseSensitive?: boolean;
  negate?: boolean;
}

export interface RuleAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  order: number;
  isAsync?: boolean;
  retryCount?: number;
  timeout?: number;
}

export interface RuleExecution {
  id: string;
  ruleId: string;
  triggerData: any;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  executionPath: string[];
  metrics: {
    conditionEvaluationTime: number;
    actionExecutionTime: number;
    totalTime: number;
  };
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: RuleType;
  template: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'errorCount'>;
  variables: RuleTemplateVariable[];
  tags: string[];
}

export interface RuleTemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
}

export interface RuleEngineConfig {
  maxConcurrentExecutions: number;
  defaultTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableMetrics: boolean;
  enableAuditLog: boolean;
  executionHistoryLimit: number;
  enableRuleVersioning: boolean;
  enableDryRun: boolean;
  customFunctions: Record<string, Function>;
}

export interface RuleEngineMetrics {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  executionsByType: Record<RuleType, number>;
  executionsByStatus: Record<RuleExecution['status'], number>;
  topExecutedRules: Array<{
    ruleId: string;
    ruleName: string;
    executionCount: number;
    successRate: number;
  }>;
  executionTrend: Array<{
    date: string;
    executions: number;
    successRate: number;
    averageTime: number;
  }>;
}

export class ComplianceRuleEngine extends EventEmitter {
  private rules: Map<string, Rule> = new Map();
  private executions: Map<string, RuleExecution> = new Map();
  private templates: Map<string, RuleTemplate> = new Map();
  private config: RuleEngineConfig;
  private metrics: RuleEngineMetrics;
  private executionQueue: Array<{ ruleId: string; data: any; priority: number }> = [];
  private isProcessing = false;

  constructor() {
    super();
    this.config = this.initializeDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.initializeDefaultTemplates();
    this.initializeDefaultRules();
    this.startExecutionProcessor();
  }

  private initializeDefaultConfig(): RuleEngineConfig {
    return {
      maxConcurrentExecutions: 10,
      defaultTimeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableMetrics: true,
      enableAuditLog: true,
      executionHistoryLimit: 1000,
      enableRuleVersioning: true,
      enableDryRun: false,
      customFunctions: {}
    };
  }

  private initializeMetrics(): RuleEngineMetrics {
    return {
      totalRules: 0,
      activeRules: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      executionsByType: {
        validation: 0,
        business_logic: 0,
        compliance_check: 0,
        risk_assessment: 0,
        notification: 0,
        automation: 0
      },
      executionsByStatus: {
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      },
      topExecutedRules: [],
      executionTrend: []
    };
  }

  private initializeDefaultTemplates(): void {
    const templates: RuleTemplate[] = [
      {
        id: 'template_kyc_validation',
        name: 'KYC Validation Rule',
        description: 'Template for KYC document validation rules',
        category: 'KYC',
        type: RuleType.VALIDATION,
        template: {
          name: 'KYC Validation Rule',
          description: 'Validates KYC documents against requirements',
          type: RuleType.VALIDATION,
          category: 'KYC',
          priority: 1,
          status: RuleStatus.DRAFT,
          triggers: [{
            id: 'trigger_1',
            type: TriggerType.EVENT,
            config: { eventName: 'kyc.document_uploaded' },
            isActive: true
          }],
          conditions: [{
            id: 'condition_1',
            field: 'document.type',
            operator: OperatorType.IN,
            value: ['passport', 'national_id', 'driving_license'],
            logicalOperator: 'AND'
          }],
          actions: [{
            id: 'action_1',
            type: ActionType.VALIDATE,
            config: { validationType: 'document_quality' },
            order: 1
          }],
          metadata: {},
          version: 1,
          createdBy: 'system'
        },
        variables: [
          {
            name: 'documentTypes',
            type: 'array',
            description: 'Allowed document types',
            required: true,
            defaultValue: ['passport', 'national_id']
          },
          {
            name: 'minQualityScore',
            type: 'number',
            description: 'Minimum quality score',
            required: false,
            defaultValue: 0.8,
            validation: { min: 0, max: 1 }
          }
        ],
        tags: ['kyc', 'validation', 'document']
      },
      {
        id: 'template_aml_check',
        name: 'AML Compliance Check',
        description: 'Template for AML compliance checking',
        category: 'AML',
        type: RuleType.COMPLIANCE_CHECK,
        template: {
          name: 'AML Compliance Check',
          description: 'Performs AML compliance checks',
          type: RuleType.COMPLIANCE_CHECK,
          category: 'AML',
          priority: 2,
          status: RuleStatus.DRAFT,
          triggers: [{
            id: 'trigger_1',
            type: TriggerType.EVENT,
            config: { eventName: 'kyc.verification_completed' },
            isActive: true
          }],
          conditions: [{
            id: 'condition_1',
            field: 'user.riskScore',
            operator: OperatorType.GREATER_THAN,
            value: 0.7,
            logicalOperator: 'AND'
          }],
          actions: [{
            id: 'action_1',
            type: ActionType.FLAG,
            config: { flagType: 'high_risk_aml', severity: 'high' },
            order: 1
          }],
          metadata: {},
          version: 1,
          createdBy: 'system'
        },
        variables: [
          {
            name: 'riskThreshold',
            type: 'number',
            description: 'Risk score threshold for flagging',
            required: true,
            defaultValue: 0.7,
            validation: { min: 0, max: 1 }
          }
        ],
        tags: ['aml', 'compliance', 'risk']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeDefaultRules(): void {
    const rules: Rule[] = [
      {
        id: 'rule_doc_quality_check',
        name: 'Document Quality Check',
        description: 'Validates document quality before processing',
        type: RuleType.VALIDATION,
        category: 'Document Processing',
        priority: 1,
        status: RuleStatus.ACTIVE,
        triggers: [{
          id: 'trigger_1',
          type: TriggerType.EVENT,
          config: { eventName: 'document.uploaded' },
          isActive: true
        }],
        conditions: [
          {
            id: 'condition_1',
            field: 'document.qualityScore',
            operator: OperatorType.GREATER_EQUAL,
            value: 0.8,
            logicalOperator: 'AND'
          },
          {
            id: 'condition_2',
            field: 'document.size',
            operator: OperatorType.LESS_THAN,
            value: 10485760, // 10MB
            logicalOperator: 'AND'
          }
        ],
        actions: [
          {
            id: 'action_1',
            type: ActionType.APPROVE,
            config: { message: 'Document quality approved' },
            order: 1
          }
        ],
        metadata: {},
        version: 1,
        createdBy: 'system',
        createdAt: new Date(),
        executionCount: 0,
        successCount: 0,
        errorCount: 0
      },
      {
        id: 'rule_high_risk_flag',
        name: 'High Risk User Flag',
        description: 'Flags high-risk users for manual review',
        type: RuleType.RISK_ASSESSMENT,
        category: 'Risk Management',
        priority: 2,
        status: RuleStatus.ACTIVE,
        triggers: [{
          id: 'trigger_1',
          type: TriggerType.EVENT,
          config: { eventName: 'user.assessed' },
          isActive: true
        }],
        conditions: [{
          id: 'condition_1',
          field: 'user.riskScore',
          operator: OperatorType.GREATER_THAN,
          value: 0.8,
          logicalOperator: 'AND'
        }],
        actions: [
          {
            id: 'action_1',
            type: ActionType.FLAG,
            config: { 
              flagType: 'high_risk',
              severity: 'critical',
              requiresReview: true
            },
            order: 1
          },
          {
            id: 'action_2',
            type: ActionType.NOTIFY,
            config: {
              recipients: ['compliance@company.com'],
              template: 'high_risk_user'
            },
            order: 2,
            isAsync: true
          }
        ],
        metadata: {},
        version: 1,
        createdBy: 'system',
        createdAt: new Date(),
        executionCount: 0,
        successCount: 0,
        errorCount: 0
      }
    ];

    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    this.updateMetrics();
  }

  async createRule(data: Partial<Rule>): Promise<Rule> {
    const rule: Rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || '',
      description: data.description || '',
      type: data.type || RuleType.VALIDATION,
      category: data.category || 'General',
      priority: data.priority || 1,
      status: data.status || RuleStatus.DRAFT,
      triggers: data.triggers || [],
      conditions: data.conditions || [],
      actions: data.actions || [],
      metadata: data.metadata || {},
      version: 1,
      createdBy: data.createdBy || 'system',
      createdAt: new Date(),
      executionCount: 0,
      successCount: 0,
      errorCount: 0
    };

    this.rules.set(rule.id, rule);
    this.updateMetrics();
    this.emit('ruleCreated', rule);

    return rule;
  }

  async updateRule(ruleId: string, updates: Partial<Rule>): Promise<Rule | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updatedRule = { 
      ...rule, 
      ...updates,
      version: this.config.enableRuleVersioning ? rule.version + 1 : rule.version,
      updatedAt: new Date()
    };

    this.rules.set(ruleId, updatedRule);
    this.updateMetrics();
    this.emit('ruleUpdated', updatedRule);

    return updatedRule;
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.updateMetrics();
      this.emit('ruleDeleted', { ruleId });
    }
    return deleted;
  }

  async executeRule(ruleId: string, triggerData: any, options?: {
    dryRun?: boolean;
    priority?: number;
  }): Promise<RuleExecution> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    if (rule.status !== RuleStatus.ACTIVE && !options?.dryRun) {
      throw new Error(`Rule ${ruleId} is not active`);
    }

    const execution: RuleExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      triggerData,
      startTime: new Date(),
      status: 'running',
      executionPath: [],
      metrics: {
        conditionEvaluationTime: 0,
        actionExecutionTime: 0,
        totalTime: 0
      }
    };

    this.executions.set(execution.id, execution);

    if (options?.dryRun || this.config.enableDryRun) {
      execution.status = 'completed';
      execution.result = { dryRun: true, wouldExecute: true };
      execution.endTime = new Date();
      execution.metrics.totalTime = execution.endTime.getTime() - execution.startTime.getTime();
      return execution;
    }

    // Add to execution queue
    this.executionQueue.push({
      ruleId,
      data: triggerData,
      priority: options?.priority || rule.priority
    });

    return execution;
  }

  private async processExecutionQueue(): Promise<void> {
    if (this.isProcessing || this.executionQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Sort by priority
      this.executionQueue.sort((a, b) => b.priority - a.priority);

      const batch = this.executionQueue.splice(0, this.config.maxConcurrentExecutions);
      const promises = batch.map(item => this.processRuleExecution(item.ruleId, item.data));

      await Promise.allSettled(promises);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processRuleExecution(ruleId: string, triggerData: any): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    const execution = Array.from(this.executions.values())
      .find(e => e.ruleId === ruleId && e.status === 'running' && !e.endTime);

    if (!execution) return;

    try {
      const startTime = Date.now();

      // Evaluate conditions
      const conditionStartTime = Date.now();
      const conditionsMet = await this.evaluateConditions(rule.conditions, triggerData);
      execution.metrics.conditionEvaluationTime = Date.now() - conditionStartTime;

      if (!conditionsMet) {
        execution.status = 'completed';
        execution.result = { conditionsMet: false, actionsExecuted: [] };
        execution.endTime = new Date();
        execution.metrics.totalTime = Date.now() - startTime;
        return;
      }

      // Execute actions
      const actionStartTime = Date.now();
      const actionResults = await this.executeActions(rule.actions, triggerData, execution);
      execution.metrics.actionExecutionTime = Date.now() - actionStartTime;

      execution.status = 'completed';
      execution.result = { conditionsMet: true, actionsExecuted: actionResults };
      execution.endTime = new Date();
      execution.metrics.totalTime = Date.now() - startTime;

      // Update rule metrics
      rule.lastExecuted = execution.endTime;
      rule.executionCount++;
      rule.successCount++;

      this.updateMetrics();
      this.emit('ruleExecuted', { rule, execution, result: execution.result });

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.endTime = new Date();
      execution.metrics.totalTime = Date.now() - execution.startTime.getTime();

      rule.executionCount++;
      rule.errorCount++;

      this.emit('ruleExecutionFailed', { rule, execution, error });
    }
  }

  private async evaluateConditions(conditions: RuleCondition[], data: any): Promise<boolean> {
    if (conditions.length === 0) return true;

    let result = true;
    let currentLogicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, data);

      if (currentLogicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private evaluateCondition(condition: RuleCondition, data: any): boolean {
    const fieldValue = this.getFieldValue(condition.field, data);
    const conditionValue = condition.value;

    let result = false;

    switch (condition.operator) {
      case OperatorType.EQUALS:
        result = fieldValue === conditionValue;
        break;
      case OperatorType.NOT_EQUALS:
        result = fieldValue !== conditionValue;
        break;
      case OperatorType.GREATER_THAN:
        result = Number(fieldValue) > Number(conditionValue);
        break;
      case OperatorType.LESS_THAN:
        result = Number(fieldValue) < Number(conditionValue);
        break;
      case OperatorType.GREATER_EQUAL:
        result = Number(fieldValue) >= Number(conditionValue);
        break;
      case OperatorType.LESS_EQUAL:
        result = Number(fieldValue) <= Number(conditionValue);
        break;
      case OperatorType.CONTAINS:
        result = String(fieldValue).includes(String(conditionValue));
        break;
      case OperatorType.NOT_CONTAINS:
        result = !String(fieldValue).includes(String(conditionValue));
        break;
      case OperatorType.STARTS_WITH:
        result = String(fieldValue).startsWith(String(conditionValue));
        break;
      case OperatorType.ENDS_WITH:
        result = String(fieldValue).endsWith(String(conditionValue));
        break;
      case OperatorType.IN:
        result = Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
        break;
      case OperatorType.NOT_IN:
        result = Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
        break;
      case OperatorType.REGEX:
        result = new RegExp(conditionValue, condition.caseSensitive ? 'g' : 'gi').test(String(fieldValue));
        break;
      case OperatorType.IS_NULL:
        result = fieldValue === null || fieldValue === undefined;
        break;
      case OperatorType.IS_NOT_NULL:
        result = fieldValue !== null && fieldValue !== undefined;
        break;
    }

    return condition.negate ? !result : result;
  }

  private getFieldValue(field: string, data: any): any {
    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async executeActions(actions: RuleAction[], data: any, execution: RuleExecution): Promise<any[]> {
    const results: any[] = [];

    // Sort actions by order
    const sortedActions = actions.sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      try {
        const result = await this.executeAction(action, data, execution);
        results.push({ actionId: action.id, success: true, result });
        execution.executionPath.push(action.id);
      } catch (error) {
        results.push({ 
          actionId: action.id, 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });

        if (action.retryCount && action.retryCount > 0) {
          // Implement retry logic
          await this.retryAction(action, data, execution);
        }
      }
    }

    return results;
  }

  private async executeAction(action: RuleAction, data: any, execution: RuleExecution): Promise<any> {
    switch (action.type) {
      case ActionType.APPROVE:
        return this.handleApproveAction(action, data);
      case ActionType.REJECT:
        return this.handleRejectAction(action, data);
      case ActionType.FLAG:
        return this.handleFlagAction(action, data);
      case ActionType.NOTIFY:
        return this.handleNotifyAction(action, data);
      case ActionType.LOG:
        return this.handleLogAction(action, data);
      case ActionType.EXECUTE:
        return this.handleExecuteAction(action, data);
      case ActionType.TRANSFORM:
        return this.handleTransformAction(action, data);
      case ActionType.ROUTE:
        return this.handleRouteAction(action, data);
      case ActionType.ESCALATE:
        return this.handleEscalateAction(action, data);
      case ActionType.DELAY:
        return this.handleDelayAction(action, data);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async handleApproveAction(action: RuleAction, data: any): Promise<any> {
    this.emit('actionExecuted', { type: 'approve', data, config: action.config });
    return { approved: true, message: action.config.message || 'Approved' };
  }

  private async handleRejectAction(action: RuleAction, data: any): Promise<any> {
    this.emit('actionExecuted', { type: 'reject', data, config: action.config });
    return { approved: false, message: action.config.message || 'Rejected' };
  }

  private async handleFlagAction(action: RuleAction, data: any): Promise<any> {
    this.emit('actionExecuted', { type: 'flag', data, config: action.config });
    return { 
      flagged: true, 
      flagType: action.config.flagType,
      severity: action.config.severity,
      requiresReview: action.config.requiresReview || false
    };
  }

  private async handleNotifyAction(action: RuleAction, data: any): Promise<any> {
    this.emit('actionExecuted', { type: 'notify', data, config: action.config });
    return { 
      notified: true, 
      recipients: action.config.recipients,
      template: action.config.template
    };
  }

  private async handleLogAction(action: RuleAction, data: any): Promise<any> {
    this.emit('actionExecuted', { type: 'log', data, config: action.config });
    return { logged: true, level: action.config.level || 'info' };
  }

  private async handleExecuteAction(action: RuleAction, data: any): Promise<any> {
    const functionName = action.config.functionName;
    const customFunction = this.config.customFunctions[functionName];
    
    if (!customFunction) {
      throw new Error(`Custom function ${functionName} not found`);
    }

    return await customFunction(data, action.config.parameters);
  }

  private async handleTransformAction(action: RuleAction, data: any): Promise<any> {
    const transformation = action.config.transformation;
    // Implement transformation logic
    return { transformed: true, data: this.applyTransformation(data, transformation) };
  }

  private async handleRouteAction(action: RuleAction, data: any): Promise<any> {
    this.emit('actionExecuted', { type: 'route', data, config: action.config });
    return { routed: true, destination: action.config.destination };
  }

  private async handleEscalateAction(action: RuleAction, data: any): Promise<any> {
    this.emit('actionExecuted', { type: 'escalate', data, config: action.config });
    return { 
      escalated: true, 
      level: action.config.level,
      escalatedTo: action.config.escalatedTo
    };
  }

  private async handleDelayAction(action: RuleAction, data: any): Promise<any> {
    const delay = action.config.delay || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { delayed: true, duration: delay };
  }

  private applyTransformation(data: any, transformation: any): any {
    // Implement transformation logic based on configuration
    return data;
  }

  private async retryAction(action: RuleAction, data: any, execution: RuleExecution): Promise<void> {
    const retryCount = action.retryCount || 0;
    const retryDelay = this.config.retryDelay;

    for (let i = 0; i < retryCount; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        await this.executeAction(action, data, execution);
        return;
      } catch (error) {
        if (i === retryCount - 1) {
          throw error;
        }
      }
    }
  }

  private startExecutionProcessor(): void {
    setInterval(() => {
      this.processExecutionQueue();
    }, 1000);
  }

  private updateMetrics(): void {
    const rules = Array.from(this.rules.values());

    this.metrics.totalRules = rules.length;
    this.metrics.activeRules = rules.filter(r => r.status === RuleStatus.ACTIVE).length;

    const executions = Array.from(this.executions.values());
    this.metrics.totalExecutions = executions.length;
    this.metrics.successfulExecutions = executions.filter(e => e.status === 'completed').length;
    this.metrics.failedExecutions = executions.filter(e => e.status === 'failed').length;

    if (executions.length > 0) {
      const totalTime = executions.reduce((sum, e) => sum + e.metrics.totalTime, 0);
      this.metrics.averageExecutionTime = totalTime / executions.length;
    }

    // Update execution by type
    this.metrics.executionsByType = {
      validation: 0,
      business_logic: 0,
      compliance_check: 0,
      risk_assessment: 0,
      notification: 0,
      automation: 0
    };

    executions.forEach(execution => {
      const rule = this.rules.get(execution.ruleId);
      if (rule) {
        this.metrics.executionsByType[rule.type]++;
      }
    });

    // Update execution by status
    this.metrics.executionsByStatus = {
      running: executions.filter(e => e.status === 'running').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      cancelled: executions.filter(e => e.status === 'cancelled').length
    };

    // Update top executed rules
    this.metrics.topExecutedRules = rules
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 10)
      .map(rule => ({
        ruleId: rule.id,
        ruleName: rule.name,
        executionCount: rule.executionCount,
        successRate: rule.executionCount > 0 ? rule.successCount / rule.executionCount : 0
      }));
  }

  async getRule(ruleId: string): Promise<Rule | null> {
    return this.rules.get(ruleId) || null;
  }

  async getRules(filters?: {
    type?: RuleType;
    category?: string;
    status?: RuleStatus;
    isActive?: boolean;
  }): Promise<Rule[]> {
    let rules = Array.from(this.rules.values());

    if (filters) {
      if (filters.type) {
        rules = rules.filter(r => r.type === filters.type);
      }
      if (filters.category) {
        rules = rules.filter(r => r.category === filters.category);
      }
      if (filters.status) {
        rules = rules.filter(r => r.status === filters.status);
      }
      if (filters.isActive !== undefined) {
        rules = rules.filter(r => r.status === RuleStatus.ACTIVE);
      }
    }

    return rules;
  }

  async getExecution(executionId: string): Promise<RuleExecution | null> {
    return this.executions.get(executionId) || null;
  }

  async getExecutions(filters?: {
    ruleId?: string;
    status?: RuleExecution['status'];
    startDate?: Date;
    endDate?: Date;
  }): Promise<RuleExecution[]> {
    let executions = Array.from(this.executions.values());

    if (filters) {
      if (filters.ruleId) {
        executions = executions.filter(e => e.ruleId === filters.ruleId);
      }
      if (filters.status) {
        executions = executions.filter(e => e.status === filters.status);
      }
      if (filters.startDate) {
        executions = executions.filter(e => e.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        executions = executions.filter(e => e.startTime <= filters.endDate!);
      }
    }

    return executions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getMetrics(): Promise<RuleEngineMetrics> {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async updateConfig(updates: Partial<RuleEngineConfig>): Promise<RuleEngineConfig> {
    this.config = { ...this.config, ...updates };
    this.emit('configUpdated', this.config);
    return this.config;
  }

  async getConfig(): Promise<RuleEngineConfig> {
    return { ...this.config };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalRules: number;
    activeRules: number;
    queueSize: number;
    errorRate: number;
    lastUpdated: Date;
  }> {
    this.updateMetrics();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    const errorRate = this.metrics.totalExecutions > 0 
      ? this.metrics.failedExecutions / this.metrics.totalExecutions 
      : 0;

    if (errorRate > 0.2 || this.executionQueue.length > 50) {
      status = 'critical';
    } else if (errorRate > 0.1 || this.executionQueue.length > 20) {
      status = 'warning';
    }

    return {
      status,
      totalRules: this.metrics.totalRules,
      activeRules: this.metrics.activeRules,
      queueSize: this.executionQueue.length,
      errorRate,
      lastUpdated: new Date()
    };
  }
}
