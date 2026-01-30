import mongoose, { Document, Schema } from 'mongoose';

export enum ComplianceStatus {
    COMPLIANT = 'compliant',
    NON_COMPLIANT = 'non_compliant',
    PARTIALLY_COMPLIANT = 'partially_compliant',
    PENDING_REVIEW = 'pending_review',
    EXEMPT = 'exempt',
    NOT_APPLICABLE = 'not_applicable'
}

export enum RequirementType {
    TECHNICAL = 'technical',
    OPERATIONAL = 'operational',
    LEGAL = 'legal',
    ADMINISTRATIVE = 'administrative',
    DOCUMENTATION = 'documentation'
}

export interface IComplianceRequirement extends Document {
    regulationId: string;
    jurisdictionCode: string;
    title: string;
    description: string;
    type: RequirementType;
    category: string;
    status: ComplianceStatus;
    mandatory: boolean;
    dueDate?: Date;
    completedDate?: Date;
    assignedTo?: string;
    evidence: Array<{
        id: string;
        type: 'document' | 'screenshot' | 'log' | 'test_result' | 'certification' | 'other';
        name: string;
        url: string;
        verified: boolean;
        uploadedAt: Date;
    }>;
    lastAssessed: Date;
    nextAssessment: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ComplianceRequirementSchema = new Schema<IComplianceRequirement>({
    regulationId: { type: String, index: true },
    jurisdictionCode: { type: String, index: true },
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: Object.values(RequirementType) },
    category: String,
    status: { type: String, enum: Object.values(ComplianceStatus), default: ComplianceStatus.PENDING_REVIEW },
    mandatory: { type: Boolean, default: false },
    dueDate: Date,
    completedDate: Date,
    assignedTo: String,
    evidence: [{
        id: String,
        type: { type: String, enum: ['document', 'screenshot', 'log', 'test_result', 'certification', 'other'] },
        name: String,
        url: String,
        verified: Boolean,
        uploadedAt: { type: Date, default: Date.now }
    }],
    lastAssessed: Date,
    nextAssessment: Date,
    notes: String
}, {
    timestamps: true
});

ComplianceRequirementSchema.index({ jurisdictionCode: 1, status: 1 });

export const ComplianceRequirement = mongoose.model<IComplianceRequirement>('ComplianceRequirement', ComplianceRequirementSchema);
