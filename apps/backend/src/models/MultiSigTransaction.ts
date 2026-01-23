import { Schema, model, Document } from 'mongoose';

export interface Signature {
    signer: string;
    signature: string;
    timestamp: Date;
    v?: number;
    r?: string;
    s?: string;
}

export interface MultiSigTransactionDocument extends Document {
    id: string; // Custom ID
    walletId: string; // Reference to wallet custom ID
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
    gasPrice?: string;
    nonce: number;
    chainId: number;
    requiredSignatures: number;
    signers: string[]; // List of potential signers (snapshot from wallet)
    signatures: Signature[];
    status: 'pending' | 'partially_signed' | 'ready' | 'executed' | 'cancelled' | 'expired';
    createdAt: Date;
    expiresAt?: Date;
    executedAt?: Date;
    transactionHash?: string;
    metadata?: any;
}

const SignatureSchema = new Schema({
    signer: { type: String, required: true },
    signature: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    v: Number,
    r: String,
    s: String
}, { _id: false });

const MultiSigTransactionSchema = new Schema({
    id: { type: String, required: true, unique: true },
    walletId: { type: String, required: true, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    value: { type: String, required: true },
    data: { type: String, required: true },
    gasLimit: { type: String, required: true },
    gasPrice: { type: String },
    nonce: { type: Number, required: true },
    chainId: { type: Number, required: true },
    requiredSignatures: { type: Number, required: true },
    signers: { type: [String], required: true },
    signatures: { type: [SignatureSchema], default: [] },
    status: {
        type: String,
        enum: ['pending', 'partially_signed', 'ready', 'executed', 'cancelled', 'expired'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    executedAt: { type: Date },
    transactionHash: { type: String },
    metadata: { type: Schema.Types.Mixed }
});

export const MultiSigTransaction = model<MultiSigTransactionDocument>('MultiSigTransaction', MultiSigTransactionSchema);
