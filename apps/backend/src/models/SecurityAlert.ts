import mongoose, { Document, Schema } from 'mongoose';

export enum AlertType {
    SECURITY_INCIDENT = 'security_incident',
    UNAUTHORIZED_ACCESS = 'unauthorized_access',
    SYSTEM_ANOMALY = 'system_anomaly',
    POLICY_BREACH = 'policy_breach',
    COMPLIANCE_VIOLATION = 'compliance_violation'
}

export enum AlertStatus {
    OPEN = 'open',
    ACKNOWLEDGED = 'acknowledged',
    RESOLVED = 'resolved',
    FALSE_POSITIVE = 'false_positive'
}

export interface ISecurityAlert extends Document {
    type: AlertType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: AlertStatus;
    title: string;
    description: string;
    source: string;
    entityId?: string; // Reference to affected asset/user/contract
    userId?: string;
    triggeredAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
    metadata: Record<string, any>;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const SecurityAlertSchema = new Schema<ISecurityAlert>({
    type: { type: String, enum: Object.values(AlertType), required: true, index: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true, index: true },
    status: { type: String, enum: Object.values(AlertStatus), default: AlertStatus.OPEN, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    source: { type: String, required: true },
    entityId: String,
    userId: { type: String, index: true },
    triggeredAt: { type: Date, default: Date.now, index: true },
    resolvedAt: Date,
    resolvedBy: String,
    metadata: { type: Map, of: Schema.Types.Mixed },
    tags: [String]
}, {
    timestamps: true
});

export const SecurityAlert = mongoose.model<ISecurityAlert>('SecurityAlert', SecurityAlertSchema);
