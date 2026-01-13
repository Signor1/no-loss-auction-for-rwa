import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import paymentRoutes from './payments'

// Mock the services
const mockPaymentService = {
    getPaymentHistory: vi.fn().mockResolvedValue([{ _id: 'p1', amount: 100 }]),
    createPayment: vi.fn().mockResolvedValue({ _id: 'p2', amount: 50 }),
    getPaymentById: vi.fn().mockResolvedValue({ _id: 'p1', userId: 'user123' })
}

const mockRefundService = {
    processRefund: vi.fn().mockResolvedValue({ _id: 'r1', amount: 30 })
}

const mockFeeService = {
    calculateAuctionFees: vi.fn().mockResolvedValue({ platformFee: 5, processorFee: 2, totalFees: 7 })
}

vi.mock('../payments/paymentService', () => ({
    PaymentService: vi.fn().mockImplementation(() => mockPaymentService),
    paymentService: mockPaymentService
}))

vi.mock('../payments/refundService', () => ({
    RefundService: vi.fn().mockImplementation(() => mockRefundService),
    refundService: mockRefundService
}))

vi.mock('../payments/feeService', () => ({
    FeeService: vi.fn().mockImplementation(() => mockFeeService),
    feeService: mockFeeService
}))


// Mock the authenticate middleware
vi.mock('../middleware/auth', () => ({
    authenticate: vi.fn((req, res, next) => {
        req.user = { id: 'user123' } as any
        next()
    })
}))

describe('Payment Routes Integration', () => {
    let app: express.Express

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.use('/api/payments', paymentRoutes)
        vi.clearAllMocks()
    })

    describe('GET /api/payments/history', () => {
        it('should return payment history for authenticated user', async () => {
            const response = await request(app).get('/api/payments/history')

            if (response.status !== 200) console.error('Error Response:', response.body);
            expect(response.status).toBe(200)
            expect(response.body).toBeInstanceOf(Array)
            expect(response.body[0].amount).toBe(100)
        })
    })

    describe('POST /api/payments/create', () => {
        it('should create a new payment', async () => {
            const response = await request(app)
                .post('/api/payments/create')
                .send({ amount: 50, currency: 'USDC', type: 'bid' })

            if (response.status !== 201) console.error('Error Response:', response.body);
            expect(response.status).toBe(201)
            expect(response.body.amount).toBe(50)
        })
    })

    describe('POST /api/payments/refund', () => {
        it('should process a refund', async () => {
            const response = await request(app)
                .post('/api/payments/refund')
                .send({ paymentId: 'p1', amount: 30 })

            if (response.status !== 200) console.error('Error Response:', response.body);
            expect(response.status).toBe(200)
            expect(response.body._id).toBe('r1')
        })
    })

    describe('GET /api/payments/fees/:auctionId', () => {
        it('should return calculated fees', async () => {
            const response = await request(app)
                .get('/api/payments/fees/a123')
                .query({ amount: 1000 })

            if (response.status !== 200) console.error('Error Response:', response.body);
            expect(response.status).toBe(200)
            expect(response.body.totalFees).toBe(7)
        })
    })
})
