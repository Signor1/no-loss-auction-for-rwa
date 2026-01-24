import mongoose, { Document, Schema } from 'mongoose';

export enum RestrictionType {
    LOCK_UP = 'lock_up',
    WHITELIST_ONLY = 'whitelist_only',
    VOLUME_LIMIT = 'volume_limit',
    JURISDICTION_BLOCK = 'jurisdiction_block',
    ACCREDITATION_REQUIRED = 'accreditation_required'
}

export interface ITransferRestriction extends Document {
    assetId: string;
    type: RestrictionType;
    description: string;
    parameters: {
        startDate?: Date;
        endDate?: Date;
        maxVolume?: number;
        periodDays?: number;
        allowedJurisdictions?: string[];
        blockedJurisdictions?: string[];
        minAccreditationLevel?: string;
    };
    isActive: boolean;
    exceptionUsers: string[]; // List of user IDs exempt from this restriction
    createdAt: Date;
    updatedAt: Date;
}

const TransferRestrictionSchema = new Schema<ITransferRestriction>({
    assetId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(RestrictionType), required: true },
    description: { type: String },
    parameters: {
        startDate: Date,
        endDate: Date,
        maxVolume: Number,
        periodDays: Number,
        allowedJurisdictions: [String],
        blockedJurisdictions: [String],
        minAccreditationLevel: String
    },
    isActive: { type: Boolean, default: true },
    exceptionUsers: [String]
}, {
    timestamps: true
});

TransferRestrictionSchema.index({ assetId: 1, type: 1 });

export const TransferRestriction = mongoose.model<ITransferRestriction>('TransferRestriction', TransferRestrictionSchema);
