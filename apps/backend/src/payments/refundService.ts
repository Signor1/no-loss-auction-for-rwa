import { Payment, IPayment } from '../models/Payment'
import { runAuctionRefundJob } from '../jobs/auctionRefundJob'

export class RefundService {
    /**
     * Process a refund for a payment
     */
    async processRefund(paymentId: string, amount?: number, reason?: string): Promise<IPayment | null> {
        const payment = await Payment.findById(paymentId)
        if (!payment || payment.status !== 'completed') return null

        const refundAmount = amount || payment.amount

        // In a real application, this would interface with the payment gateway (Stripe, etc.)
        // or trigger an on-chain refund transaction.

        // For now, we simulate the logic:
        const refund = new Payment({
            userId: payment.userId,
            auctionId: payment.auctionId,
            amount: refundAmount,
            currency: payment.currency,
            status: 'completed',
            type: 'refund',
            method: payment.method,
            gateway: payment.gateway,
            metadata: {
                originalPaymentId: payment._id,
                reason
            }
        })

        await refund.save()

        // Update original payment status if fully refunded
        if (refundAmount >= payment.amount) {
            payment.status = 'refunded'
        } else {
            payment.status = 'partially_refunded'
        }

        await payment.save()
        return refund
    }

    /**
     * Process on-chain refund (No-Loss Guarantee)
     * This is triggered when an auction ends and losing bidders need their funds back.
     */
    async processOnChainRefund(userId: string, auctionId: string, amount: number, transactionHash: string): Promise<IPayment> {
        const refund = new Payment({
            userId,
            auctionId,
            amount,
            currency: 'USDC', // Default for this platform
            status: 'completed',
            type: 'refund',
            method: 'crypto',
            gateway: 'on-chain',
            transactionHash,
            metadata: {
                category: 'no-loss-refund'
            }
        })

        await refund.save()
        return refund
    }

    /**
     * Trigger bulk refund for an auction (No-Loss Guarantee)
     */
    async processAuctionRefunds(auctionId: string): Promise<void> {
        await runAuctionRefundJob(auctionId);
    }
}
}

export const refundService = new RefundService()
