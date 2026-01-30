import { Schema, model, Document } from 'mongoose';

export interface DisputeDocument extends Document {
    auctionId: string;
    claimant: string; // Address or UserId
    reason: string;
    evidence: string[]; // URLs to evidence
    status: 'open' | 'resolved' | 'dismissed';
    resolution?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DisputeSchema = new Schema({
    auctionId: { type: String, required: true },
    claimant: { type: String, required: true },
    reason: { type: String, required: true },
    evidence: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    resolution: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

DisputeSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const Dispute = model<DisputeDocument>('Dispute', DisputeSchema);
