import mongoose, { Document, Schema } from 'mongoose';

export enum ThreatType {
    PHISHING_DOMAIN = 'phishing_domain',
    MALICIOUS_ADDRESS = 'malicious_address',
    SCAM_TOKEN = 'scam_token',
    PUMP_AND_DUMP = 'pump_and_dump'
}

export interface IThreatIntelligence extends Document {
    type: ThreatType;
    value: string; // domain or address
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    source: string;
    reportedAt: Date;
    isActive: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const ThreatIntelligenceSchema = new Schema<IThreatIntelligence>({
    type: { type: String, enum: Object.values(ThreatType), required: true, index: true },
    value: { type: String, required: true, unique: true, index: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high' },
    description: String,
    source: { type: String, default: 'platform' },
    reportedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

export const ThreatIntelligence = mongoose.model<IThreatIntelligence>('ThreatIntelligence', ThreatIntelligenceSchema);
