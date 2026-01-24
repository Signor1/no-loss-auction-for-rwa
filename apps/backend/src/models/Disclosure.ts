import mongoose, { Document, Schema } from 'mongoose';

export enum DisclosureType {
    PROSPECTUS = 'prospectus',
    ANNUAL_REPORT = 'annual_report',
    QUARTERLY_REPORT = 'quarterly_report',
    MATERIAL_EVENT = 'material_event',
    OFFERING_MEMORANDUM = 'offering_memorandum',
    REGULATORY_FILING = 'regulatory_filing'
}

export interface IDisclosure extends Document {
    assetId: string;
    type: DisclosureType;
    title: string;
    description: string;
    documentUrl: string;
    checksum: string; // To ensure document integrity
    filingDate: Date;
    authority: string; // e.g., 'SEC', 'FCA'
    filingId?: string; // External filing identifier
    visibility: 'public' | 'investors_only' | 'restricted';
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const DisclosureSchema = new Schema<IDisclosure>({
    assetId: { type: String, required: true, index: true },
    type: { type: String, enum: Object.values(DisclosureType), required: true },
    title: { type: String, required: true },
    description: String,
    documentUrl: { type: String, required: true },
    checksum: String,
    filingDate: { type: Date, default: Date.now },
    authority: String,
    filingId: String,
    visibility: { type: String, enum: ['public', 'investors_only', 'restricted'], default: 'public' },
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

DisclosureSchema.index({ assetId: 1, filingDate: -1 });

export const Disclosure = mongoose.model<IDisclosure>('Disclosure', DisclosureSchema);
