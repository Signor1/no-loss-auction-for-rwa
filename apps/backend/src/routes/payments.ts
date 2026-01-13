import { Router, Request, Response } from 'express'
import { paymentService } from '../payments/paymentService'
import { refundService } from '../payments/refundService'
import { feeService } from '../payments/feeService'
import { authenticate } from '../middleware/auth'

const router: Router = Router()

/**
 * @route GET /api/payments/history
 * @desc Get user's payment history
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0

        const history = await paymentService.getPaymentHistory(userId, limit, offset)
        res.json(history)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment history' })
    }
})

/**
 * @route POST /api/payments/create
 * @desc Initialize a payment
 */
router.post('/create', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id
        const { auctionId, amount, currency, type, method, gateway, metadata } = req.body

        const payment = await paymentService.createPayment({
            userId,
            auctionId,
            amount,
            currency,
            type,
            method,
            gateway,
            metadata,
            status: 'pending'
        })

        res.status(201).json(payment)
    } catch (error) {
        res.status(500).json({ error: 'Failed to create payment' })
    }
})

/**
 * @route POST /api/payments/refund
 * @desc Process a refund
 */
router.post('/refund', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id
        const { paymentId, amount, reason } = req.body

        // Check if user owns the payment
        const payment = await paymentService.getPaymentById(paymentId)
        if (!payment || payment.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to refund this payment' })
        }

        const refund = await refundService.processRefund(paymentId, amount, reason)
        if (!refund) {
            res.status(400).json({ error: 'Refund failed or not applicable' })
            return
        }

        res.json(refund)
        return

    } catch (error) {
        res.status(500).json({ error: 'Failed to process refund' })
    }
})

/**
 * @route GET /api/payments/fees/:auctionId
 * @desc Calculate fees for an auction
 */
router.get('/fees/:auctionId', authenticate, async (req: Request, res: Response) => {
    try {
        const { auctionId } = req.params
        const amount = parseFloat(req.query.amount as string)

        if (isNaN(amount)) {
            res.status(400).json({ error: 'Invalid amount' })
            return
        }


        const fees = await feeService.calculateAuctionFees(auctionId, amount)
        res.json(fees)
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate fees' })
    }
})

export default router
