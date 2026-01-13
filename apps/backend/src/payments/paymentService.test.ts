import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentService } from './paymentService'
import { Payment } from '../models/Payment'

// Mock the Payment model
vi.mock('../models/Payment', () => {
    const mockPayment = vi.fn().mockImplementation((data) => ({
        ...data,
        save: vi.fn().mockResolvedValue({ ...data, _id: 'payment123' })
    }))

    // Add static methods to the mock function
    Object.assign(mockPayment, {
        find: vi.fn(),
        findById: vi.fn(),
        findOne: vi.fn()
    })

    return { Payment: mockPayment }
})


describe('PaymentService', () => {
    let paymentService: PaymentService

    beforeEach(() => {
        paymentService = new PaymentService()
        vi.clearAllMocks()
    })

    describe('createPayment', () => {
        it('should create and save a new payment', async () => {
            const paymentData = {
                userId: 'user123',
                amount: 100,
                currency: 'USDC',
                type: 'bid' as const
            }

            const result = await paymentService.createPayment(paymentData)

            expect(Payment).toHaveBeenCalled()
            expect(result).toMatchObject(paymentData)
        })

    })

    describe('completePayment', () => {
        it('should mark a payment as completed and update transaction details', async () => {
            const paymentId = 'payment123'
            const transactionDetails = {
                gatewayTransactionId: 'gatewayTx123',
                transactionHash: '0xhash123',
                metadata: { confirmed: true }
            }

            const existingPayment = {
                _id: paymentId,
                status: 'pending',
                metadata: {},
                save: vi.fn().mockResolvedValue(true)
            }

            vi.mocked(Payment.findById).mockResolvedValue(existingPayment)

            const result = await paymentService.completePayment(paymentId, transactionDetails)

            expect(Payment.findById).toHaveBeenCalledWith(paymentId)
            expect(existingPayment.status).toBe('completed')
            expect(existingPayment.save).toHaveBeenCalled()
            expect(result?.status).toBe('completed')
        })

        it('should return null if payment is not found', async () => {
            vi.mocked(Payment.findById).mockResolvedValue(null)

            const result = await paymentService.completePayment('invalid', {})

            expect(result).toBeNull()
        })
    })

    describe('getPaymentHistory', () => {
        it('should fetch sorted payment history for a user', async () => {
            const userId = 'user123'
            const mockPayments = [
                { _id: 'p1', amount: 50 },
                { _id: 'p2', amount: 150 }
            ]

            const findMock = {
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue(mockPayments)
            }

            vi.mocked(Payment.find).mockReturnValue(findMock as any)

            const result = await paymentService.getPaymentHistory(userId)

            expect(Payment.find).toHaveBeenCalledWith({ userId })
            expect(findMock.sort).toHaveBeenCalledWith({ createdAt: -1 })
            expect(result).toEqual(mockPayments)
        })
    })
})
