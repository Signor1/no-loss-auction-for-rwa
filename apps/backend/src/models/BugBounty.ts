import mongoose, { Document, Schema } from 'mongoose';

export enum VulnerabilitySeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface IBugBounty extends Document {
    reporterUserId?: string;
    reporterName: string;
    reporterContact: string; // Email or handle
    title: string;
    description: string;
    affectedContracts: string[]; // List of addresses or names
    severity: VulnerabilitySeverity;
    rewardOffered?: number;
    rewardCurrency?: string;
    status: 'reported' | 'triaged' | 'confirmed' | 'fixed' | 'duplicate' | 'out_of_scope' | 'paid';
    remediationId?: string; // Reference to internal fix ticket
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const BugBountySchema = new Schema<IBugBounty>({
    reporterUserId: { type: String, index: true },
    reporterName: { type: String, required: true },
    reporterContact: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    affectedContracts: [String],
    severity: { type: String, enum: Object.values(VulnerabilitySeverity), required: true },
    rewardOffered: Number,
    rewardCurrency: { type: String, default: 'USDC' },
    status: { type: String, enum: ['reported', 'triaged', 'confirmed', 'fixed', 'duplicate', 'out_of_scope', 'paid'], default: 'reported' },
    remediationId: String,
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

export const BugBounty = mongoose.model<IBugBounty>('BugBounty', BugBountySchema);
