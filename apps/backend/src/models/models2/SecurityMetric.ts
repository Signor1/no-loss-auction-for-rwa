import mongoose, { Document, Schema } from 'mongoose';

export interface ISecurityMetric extends Document {
    category: 'encryption' | 'backup' | 'network' | 'iam';
    name: string;
    value: string | number | boolean;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    lastChecked: Date;
    details?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const SecurityMetricSchema = new Schema<ISecurityMetric>({
    category: { type: String, enum: ['encryption', 'backup', 'network', 'iam'], required: true, index: true },
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['healthy', 'warning', 'critical', 'unknown'], default: 'healthy' },
    lastChecked: { type: Date, default: Date.now },
    details: String,
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

SecurityMetricSchema.index({ category: 1, name: 1 }, { unique: true });

export const SecurityMetric = mongoose.model<ISecurityMetric>('SecurityMetric', SecurityMetricSchema);
