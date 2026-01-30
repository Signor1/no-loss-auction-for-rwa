import { Schema, model, Document } from 'mongoose';

export interface RefundDocument extends Document {
    auctionId: string;
    bidder: string;
    amount: number;
    txHash: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
}

const RefundSchema = new Schema({
    auctionId: { type: String, required: true },
    bidder: { type: String, required: true },
    amount: { type: Number, required: true },
    txHash: { type: String },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

export const Refund = model<RefundDocument>('Refund', RefundSchema);
