import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RefundService } from './refundService'
import { Payment } from '../models/Payment'

vi.mock('../models/Payment', () => {
    const mockPayment = vi.fn().mockImplementation((data) => ({
        ...data,
        save: vi.fn().mockResolvedValue({ ...data, _id: 'refund123' })
    }))

    Object.assign(mockPayment, {
        find: vi.fn(),
        findById: vi.fn(),
        findOne: vi.fn()
    })

    return { Payment: mockPayment }
})

describe('RefundService', () => {
    let refundService: RefundService

    beforeEach(() => {
        refundService = new RefundService()
        vi.clearAllMocks()
    })

    describe('processRefund', () => {
        it('should process a full refund correctly', async () => {
            const paymentId = 'payment123'
            const existingPayment = {
                _id: paymentId,
                amount: 100,
                status: 'completed',
                userId: 'user123',
                save: vi.fn().mockResolvedValue(true)
            }

            vi.mocked(Payment.findById).mockResolvedValue(existingPayment)

            const result = await refundService.processRefund(paymentId)

            expect(Payment.findById).toHaveBeenCalledWith(paymentId)
            expect(Payment).toHaveBeenCalled() // New refund record created
            expect(existingPayment.status).toBe('refunded')
            expect(existingPayment.save).toHaveBeenCalled()
            expect(result?.amount).toBe(100)
        })

        it('should process a partial refund correctly', async () => {
            const paymentId = 'payment123'
            const existingPayment = {
                _id: paymentId,
                amount: 100,
                status: 'completed',
                userId: 'user123',
                save: vi.fn().mockResolvedValue(true)
            }

            vi.mocked(Payment.findById).mockResolvedValue(existingPayment)

            const result = await refundService.processRefund(paymentId, 40)

            expect(existingPayment.status).toBe('partially_refunded')
            expect(result?.amount).toBe(40)
        })

        it('should return null if original payment is not completed', async () => {
            vi.mocked(Payment.findById).mockResolvedValue({ status: 'pending' })

            const result = await refundService.processRefund('p1')

            expect(result).toBeNull()
        })
    })
})
