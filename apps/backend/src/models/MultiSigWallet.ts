import { Schema, model, Document } from 'mongoose';

export interface MultiSigWalletDocument extends Document {
    id: string; // Custom ID usually used in service
    address: string;
    owners: string[];
    requiredSignatures: number;
    chainId: number;
    nonce: number;
    dailyLimit?: string;
    monthlyLimit?: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MultiSigWalletSchema = new Schema({
    id: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    owners: { type: [String], required: true },
    requiredSignatures: { type: Number, required: true },
    chainId: { type: Number, required: true },
    nonce: { type: Number, default: 0 },
    dailyLimit: { type: String },
    monthlyLimit: { type: String },
    enabled: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

MultiSigWalletSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const MultiSigWallet = model<MultiSigWalletDocument>('MultiSigWallet', MultiSigWalletSchema);
