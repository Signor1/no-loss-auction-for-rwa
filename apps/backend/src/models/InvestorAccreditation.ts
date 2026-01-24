import mongoose, { Document, Schema } from 'mongoose';

export enum AccreditationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
    REVOKED = 'revoked'
}

export enum AccreditationType {
    INDIVIDUAL = 'individual',
    INSTITUTIONAL = 'institutional',
    QUALIFIED_PURCHASER = 'qualified_purchaser',
    SOPHISTICATED_INVESTOR = 'sophisticated_investor'
}

export interface IInvestorAccreditation extends Document {
    userId: string;
    status: AccreditationStatus;
    type: AccreditationType;
    jurisdiction: string;
    evidence: Array<{
        type: 'net_worth' | 'income' | 'certification' | 'institutional_size' | 'other';
        documentId: string; // Reference to KYCDocument
        verified: boolean;
        verificationDate?: Date;
    }>;
    accreditedAt?: Date;
    expiresAt?: Date;
    metadata: Record<string, any>;
    lastReviewedBy?: string;
    lastReviewedAt?: Date;
    reviewNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const InvestorAccreditationSchema = new Schema<IInvestorAccreditation>({
    userId: { type: String, required: true, index: true },
    status: { type: String, enum: Object.values(AccreditationStatus), default: AccreditationStatus.PENDING },
    type: { type: String, enum: Object.values(AccreditationType), required: true },
    jurisdiction: { type: String, required: true, index: true },
    evidence: [{
        type: { type: String, enum: ['net_worth', 'income', 'certification', 'institutional_size', 'other'] },
        documentId: String,
        verified: { type: Boolean, default: false },
        verificationDate: Date
    }],
    accreditedAt: Date,
    expiresAt: Date,
    metadata: { type: Map, of: Schema.Types.Mixed },
    lastReviewedBy: String,
    lastReviewedAt: Date,
    reviewNotes: String
}, {
    timestamps: true
});

InvestorAccreditationSchema.index({ userId: 1, jurisdiction: 1 }, { unique: true });
InvestorAccreditationSchema.index({ status: 1 });

export const InvestorAccreditation = mongoose.model<IInvestorAccreditation>('InvestorAccreditation', InvestorAccreditationSchema);
