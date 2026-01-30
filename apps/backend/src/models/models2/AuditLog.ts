import mongoose, { Document, Schema } from 'mongoose';

export enum AuditEventType {
    USER_ACTION = 'user_action',
    SYSTEM_EVENT = 'system_event',
    DATA_ACCESS = 'data_access',
    DATA_MODIFICATION = 'data_modification',
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    COMPLIANCE_CHECK = 'compliance_check',
    CONFIGURATION_CHANGE = 'configuration_change',
    ERROR = 'error',
    SECURITY_INCIDENT = 'security_incident'
}

export enum AuditSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface IAuditLog extends Document {
    timestamp: Date;
    eventType: AuditEventType;
    severity: AuditSeverity;
    status: 'success' | 'failure' | 'warning' | 'pending';
    userId?: string;
    resource: string;
    action: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
    source: string;
    hash: string; // Cryptographic hash of the current record
    previousHash?: string; // Link to previous audit record for chaining
    metadata: Record<string, any>;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    timestamp: { type: Date, default: Date.now, index: true },
    eventType: { type: String, enum: Object.values(AuditEventType), required: true, index: true },
    severity: { type: String, enum: Object.values(AuditSeverity), required: true, index: true },
    status: { type: String, enum: ['success', 'failure', 'warning', 'pending'], required: true },
    userId: { type: String, index: true },
    resource: { type: String, required: true, index: true },
    action: { type: String, required: true },
    details: { type: Map, of: Schema.Types.Mixed },
    ipAddress: String,
    userAgent: String,
    correlationId: { type: String, index: true },
    source: { type: String, default: 'system' },
    hash: { type: String, required: true, index: true },
    previousHash: { type: String, index: true },
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, eventType: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
