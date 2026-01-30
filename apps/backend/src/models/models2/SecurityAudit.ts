import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityAudit extends Document {
    contractId: string; // Reference to SmartContract _id
    auditor: string;
    auditName: string;
    auditDate: Date;
    reportUrl: string;
    summary: string;
    vulnerabilityCount: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        informational: number;
    };
    status: 'pending' | 'in_progress' | 'completed' | 'remediated';
    remediationPlan?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const SecurityAuditSchema = new Schema<ISecurityAudit>({
    contractId: { type: String, required: true, index: true },
    auditor: { type: String, required: true },
    auditName: { type: String, required: true },
    auditDate: { type: Date, required: true },
    reportUrl: { type: String, required: true },
    summary: String,
    vulnerabilityCount: {
        critical: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        low: { type: Number, default: 0 },
        informational: { type: Number, default: 0 }
    },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'remediated'], default: 'completed' },
    remediationPlan: String,
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

export const SecurityAudit = mongoose.model<ISecurityAudit>('SecurityAudit', SecurityAuditSchema);
