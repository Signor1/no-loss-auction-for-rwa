import mongoose, { Document, Schema } from 'mongoose'

export interface IPayment extends Document {
    userId: string
    auctionId?: string
    bidId?: string
    amount: number
    currency: string
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
    type: 'bid' | 'refund' | 'fee' | 'withdrawal'
    method: 'crypto' | 'fiat'
    gateway: 'on-chain' | 'stripe' | 'coinbase-pay' | 'coinbase-commerce'
    gatewayTransactionId?: string
    transactionHash?: string
    feeAmount?: number
    exchangeRate?: number
    metadata?: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>({
    userId: {
        type: String,
        required: true,
        ref: 'User',
        index: true
    },
    auctionId: {
        type: String,
        ref: 'Auction',
        index: true
    },
    bidId: {
        type: String,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        uppercase: true,
        default: 'USDC'
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending',
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['bid', 'refund', 'fee', 'withdrawal'],
        index: true
    },
    method: {
        type: String,
        required: true,
        enum: ['crypto', 'fiat'],
        default: 'crypto'
    },
    gateway: {
        type: String,
        required: true,
        enum: ['on-chain', 'stripe', 'coinbase-pay', 'coinbase-commerce'],
        default: 'on-chain'
    },
    gatewayTransactionId: {
        type: String,
        index: true
    },
    transactionHash: {
        type: String,
        index: true
    },
    feeAmount: {
        type: Number,
        default: 0
    },
    exchangeRate: {
        type: Number,
        default: 1
    },
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
})

// Indexes
PaymentSchema.index({ createdAt: -1 })
PaymentSchema.index({ userId: 1, type: 1 })
PaymentSchema.index({ auctionId: 1, status: 1 })
PaymentSchema.index({ type: 1, status: 1, createdAt: 1 })

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema)
