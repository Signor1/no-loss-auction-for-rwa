import mongoose, { Document, Schema } from 'mongoose';

export interface IKeyManagement extends Document {
    keyId: string; // Identifier in HSM/KMS
    purpose: string; // e.g., 'DB_ENCRYPTION', 'JWT_SIGNING'
    provider: 'aws_kms' | 'google_kms' | 'hsm' | 'software';
    algorithm: string;
    status: 'active' | 'rotated' | 'compromised' | 'revoked';
    version: number;
    rotationIntervalDays: number;
    lastRotatedAt: Date;
    nextRotationAt: Date;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const KeyManagementSchema = new Schema<IKeyManagement>({
    keyId: { type: String, required: true, unique: true },
    purpose: { type: String, required: true, index: true },
    provider: { type: String, enum: ['aws_kms', 'google_kms', 'hsm', 'software'], required: true },
    algorithm: { type: String, required: true },
    status: { type: String, enum: ['active', 'rotated', 'compromised', 'revoked'], default: 'active' },
    version: { type: Number, default: 1 },
    rotationIntervalDays: { type: Number, default: 90 },
    lastRotatedAt: { type: Date, default: Date.now },
    nextRotationAt: { type: Date, required: true },
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

export const KeyManagement = mongoose.model<IKeyManagement>('KeyManagement', KeyManagementSchema);
