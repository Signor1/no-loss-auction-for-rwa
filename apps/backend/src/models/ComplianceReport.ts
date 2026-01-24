import mongoose, { Document, Schema } from 'mongoose';

export enum ComplianceReportType {
    SUMMARY = 'summary',
    DETAILED = 'detailed',
    EXECUTIVE = 'executive',
    AUDIT = 'audit',
    REGULATORY = 'regulatory'
}

export interface IComplianceReport extends Document {
    title: string;
    description: string;
    type: ComplianceReportType;
    jurisdiction: string; // Jurisdiction code if specific, or 'GLOBAL'
    generatedBy: string;
    periodStart: Date;
    periodEnd: Date;
    status: 'draft' | 'final' | 'submitted' | 'archived';

    metrics: {
        overallComplianceScore: number;
        totalRequirements: number;
        compliantCount: number;
        nonCompliantCount: number;
        riskScore: number;
    };

    findings: Array<{
        id: string;
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        category: string;
        requirementId: string;
        remediationPlan?: string;
        status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
    }>;

    recommendations: string[];
    attachments: string[]; // URLs or file references
    metadata: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

const ComplianceReportSchema = new Schema<IComplianceReport>({
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: Object.values(ComplianceReportType), required: true },
    jurisdiction: { type: String, required: true, index: true },
    generatedBy: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'final', 'submitted', 'archived'], default: 'draft' },

    metrics: {
        overallComplianceScore: Number,
        totalRequirements: Number,
        compliantCount: Number,
        nonCompliantCount: Number,
        riskScore: Number
    },

    findings: [{
        id: String,
        title: String,
        description: String,
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
        category: String,
        requirementId: String,
        remediationPlan: String,
        status: { type: String, enum: ['open', 'in_progress', 'resolved', 'accepted_risk'] }
    }],

    recommendations: [String],
    attachments: [String],
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

ComplianceReportSchema.index({ jurisdiction: 1, type: 1 });
ComplianceReportSchema.index({ createdAt: -1 });

export const ComplianceReport = mongoose.model<IComplianceReport>('ComplianceReport', ComplianceReportSchema);
