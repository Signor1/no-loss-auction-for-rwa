import mongoose, { Document, Schema } from 'mongoose';

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

export interface IComplianceRule extends Document {
    name: string;
    description: string;
    type: RuleType;
    category: string;
    priority: number;
    status: 'active' | 'inactive' | 'draft' | 'archived' | 'error';
    jurisdictions: string[]; // List of jurisdiction codes this rule applies to
    triggers: Array<{
        id: string;
        type: TriggerType;
        config: Record<string, any>;
        isActive: boolean;
    }>;
    conditions: Array<{
        id: string;
        field: string;
        operator: OperatorType;
        value: any;
        logicalOperator: 'AND' | 'OR';
        caseSensitive?: boolean;
        negate?: boolean;
    }>;
    actions: Array<{
        id: string;
        type: ActionType;
        config: Record<string, any>;
        order: number;
        isAsync?: boolean;
        retryCount?: number;
        timeout?: number;
    }>;
    metadata: Record<string, any>;
    version: number;
    createdBy: string;
    lastExecuted?: Date;
    executionCount: number;
    successCount: number;
    errorCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ComplianceRuleSchema = new Schema<IComplianceRule>({
    name: { type: String, required: true, index: true },
    description: { type: String },
    type: { type: String, enum: Object.values(RuleType), required: true },
    category: { type: String, required: true, index: true },
    priority: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'inactive', 'draft', 'archived', 'error'], default: 'draft' },
    jurisdictions: [{ type: String, index: true }], // Apply to specific jurisdictions (e.g., 'US', 'GB')

    triggers: [{
        id: String,
        type: { type: String, enum: Object.values(TriggerType) },
        config: { type: Map, of: Schema.Types.Mixed },
        isActive: { type: Boolean, default: true }
    }],

    conditions: [{
        id: String,
        field: String,
        operator: { type: String, enum: Object.values(OperatorType) },
        value: Schema.Types.Mixed,
        logicalOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' },
        caseSensitive: Boolean,
        negate: { type: Boolean, default: false }
    }],

    actions: [{
        id: String,
        type: { type: String, enum: Object.values(ActionType) },
        config: { type: Map, of: Schema.Types.Mixed },
        order: Number,
        isAsync: Boolean,
        retryCount: Number,
        timeout: Number
    }],

    metadata: { type: Map, of: Schema.Types.Mixed },
    version: { type: Number, default: 1 },
    createdBy: { type: String },
    lastExecuted: Date,
    executionCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

ComplianceRuleSchema.index({ type: 1, status: 1 });

export const ComplianceRule = mongoose.model<IComplianceRule>('ComplianceRule', ComplianceRuleSchema);
