import { Payment, IPayment } from '../models/Payment'

export class PaymentReconciliationService {
    /**
     * Reconcile on-chain payments with database records
     * This would typically be called by an event listener or a cron job.
     */
    async reconcileOnChainPayment(transactionHash: string, actualAmount: number, status: 'completed' | 'failed'): Promise<IPayment | null> {
        const payment = await Payment.findOne({ transactionHash })
        if (!payment) return null

        if (payment.amount !== actualAmount) {
            payment.metadata = {
                ...payment.metadata,
                reconciliationError: `Amount mismatch: Expected ${payment.amount}, got ${actualAmount}`
            }
        }

        payment.status = status
        await payment.save()
        return payment
    }

    /**
     * Flag suspicious transactions
     */
    async flagSuspiciousPayments(): Promise<IPayment[]> {
        // Logic to find payments that are pending for too long or have multiple attempts
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        return Payment.find({
            status: 'pending',
            createdAt: { $lt: threshold }
        })
    }
}

export const paymentReconciliationService = new PaymentReconciliationService()
