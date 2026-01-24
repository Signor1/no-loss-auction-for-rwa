import mongoose, { Document, Schema } from 'mongoose';

export interface IComplianceAudit extends Document {
    auditName: string;
    scope: 'kyc' | 'aml' | 'jurisdiction' | 'security_tokens' | 'all';
    status: 'passed' | 'failed' | 'conditional';
    outcomeSummary: string;
    auditorName: string;
    findingsCount: {
        critical: number;
        major: number;
        minor: number;
    };
    nextAuditDate?: Date;
    documents: Array<{
        title: string;
        url: string;
        type: string;
    }>;
    metadata: Record<string, any>;
    createdAt: Date;
}

const ComplianceAuditSchema = new Schema<IComplianceAudit>({
    auditName: { type: String, required: true },
    scope: { type: String, enum: ['kyc', 'aml', 'jurisdiction', 'security_tokens', 'all'], required: true },
    status: { type: String, enum: ['passed', 'failed', 'conditional'], required: true },
    outcomeSummary: { type: String, required: true },
    auditorName: { type: String, required: true },
    findingsCount: {
        critical: { type: Number, default: 0 },
        major: { type: Number, default: 0 },
        minor: { type: Number, default: 0 }
    },
    nextAuditDate: Date,
    documents: [{
        title: String,
        url: String,
        type: String
    }],
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

export const ComplianceAudit = mongoose.model<IComplianceAudit>('ComplianceAudit', ComplianceAuditSchema);
