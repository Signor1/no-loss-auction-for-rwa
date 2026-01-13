import { Payment, IPayment } from '../models/Payment'

export class PaymentService {

    /**
     * Create a new payment record
     */
    async createPayment(data: Partial<IPayment>): Promise<IPayment> {
        const payment = new Payment(data)
        await payment.save()
        return payment
    }

    /**
     * Complete a payment after gateway confirmation
     */
    async completePayment(paymentId: string, transactionDetails: any): Promise<IPayment | null> {
        const payment = await Payment.findById(paymentId)
        if (!payment) return null

        payment.status = 'completed'
        payment.gatewayTransactionId = transactionDetails.gatewayTransactionId
        payment.transactionHash = transactionDetails.transactionHash
        payment.metadata = { ...payment.metadata, ...transactionDetails.metadata }

        await payment.save()
        return payment
    }

    /**
     * Fail a payment
     */
    async failPayment(paymentId: string, reason: string): Promise<IPayment | null> {
        const payment = await Payment.findById(paymentId)
        if (!payment) return null

        payment.status = 'failed'
        payment.metadata = { ...payment.metadata, failureReason: reason }

        await payment.save()
        return payment
    }

    /**
     * Get payment history for a user
     */
    async getPaymentHistory(userId: string, limit: number = 20, offset: number = 0): Promise<IPayment[]> {
        return Payment.find({ userId })
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
    }

    /**
     * Get payment by ID
     */
    async getPaymentById(paymentId: string): Promise<IPayment | null> {
        return Payment.findById(paymentId)
    }

    /**
     * Calculate total spend for a user in an auction
     */
    async getUserAuctionSpend(userId: string, auctionId: string): Promise<number> {
        const payments = await Payment.find({
            userId,
            auctionId,
            status: 'completed',
            type: 'bid'
        })

        return payments.reduce((sum: number, p: IPayment) => sum + p.amount, 0)

    }
}

export const paymentService = new PaymentService()
