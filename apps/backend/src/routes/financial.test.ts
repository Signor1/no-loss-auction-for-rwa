import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import financialRoutes from './financial'

vi.mock('../payments/financialService', () => {
    const mock = {
        getFinancialSummary: vi.fn().mockResolvedValue({ totalRevenue: 1000, totalFees: 50, totalPayouts: 200, netIncome: 50 }),
        getFeeBreakdown: vi.fn().mockResolvedValue({ platform: 30, processor: 20, other: 0 }),
        getPayoutHistory: vi.fn().mockResolvedValue([{ _id: 'pay1', amount: 100, type: 'withdrawal' }]),
        exportToCSV: vi.fn().mockResolvedValue('ID,Amount\np1,100')
    }
    return {
        FinancialService: vi.fn().mockImplementation(() => mock),
        financialService: mock
    }
})

// Mock the authenticate and authorize middleware
vi.mock('../middleware/auth', () => ({
    authenticate: vi.fn((req, res, next) => {
        req.user = { id: 'admin123', role: 'admin' }
        next()
    }),
    authorize: vi.fn((role) => (req, res, next) => {
        if (req.user.role === role) next()
        else res.status(403).json({ error: 'Unauthorized' })
    })
}))

describe('Financial Routes', () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())
        app.use('/api/financial', financialRoutes)
        vi.clearAllMocks()
    })

    describe('GET /api/financial/summary', () => {
        it('should return financial summary for admins', async () => {
            const response = await request(app).get('/api/financial/summary')

            expect(response.status).toBe(200)
            expect(response.body.totalRevenue).toBe(1000)
        })
    })

    describe('GET /api/financial/fees', () => {
        it('should return fee breakdown for admins', async () => {
            const response = await request(app).get('/api/financial/fees')

            expect(response.status).toBe(200)
            expect(response.body.platform).toBe(30)
        })
    })

    describe('GET /api/financial/payouts', () => {
        it('should return payout history', async () => {
            const response = await request(app).get('/api/financial/payouts')

            expect(response.status).toBe(200)
            expect(Array.isArray(response.body)).toBe(true)
            expect(response.body[0].amount).toBe(100)
        })
    })

    describe('GET /api/financial/export', () => {
        it('should return a CSV file for admins', async () => {
            const response = await request(app).get('/api/financial/export')

            expect(response.status).toBe(200)
            expect(response.header['content-type']).toBe('text/csv; charset=utf-8')
            expect(response.header['content-disposition']).toContain('attachment; filename="financial-report')
            expect(response.text).toContain('ID,Amount')
        })
    })
})
