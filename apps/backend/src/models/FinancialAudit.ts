import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialAudit extends Document {
    auditDate: Date;
    type: 'reconciliation' | 'reserve_proof' | 'balance_snapshot';
    status: 'success' | 'failure' | 'discrepancy_detected';
    currency: string;
    systemBalance: number;
    actualBalance: number; // e.g., from bank/on-chain sync
    discrepancy: number;
    evidenceUrl?: string;
    auditorId?: string;
    metadata: Record<string, any>;
    createdAt: Date;
}

const FinancialAuditSchema = new Schema<IFinancialAudit>({
    auditDate: { type: Date, default: Date.now, index: true },
    type: { type: String, enum: ['reconciliation', 'reserve_proof', 'balance_snapshot'], required: true },
    status: { type: String, enum: ['success', 'failure', 'discrepancy_detected'], required: true },
    currency: { type: String, required: true },
    systemBalance: { type: Number, required: true },
    actualBalance: { type: Number, required: true },
    discrepancy: { type: Number, default: 0 },
    evidenceUrl: String,
    auditorId: String,
    metadata: { type: Map, of: Schema.Types.Mixed }
}, {
    timestamps: true
});

FinancialAuditSchema.index({ type: 1, auditDate: -1 });

export const FinancialAudit = mongoose.model<IFinancialAudit>('FinancialAudit', FinancialAuditSchema);
