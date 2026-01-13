import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinancialService } from './financialService'
import { Payment } from '../models/Payment'

vi.mock('../models/Payment', () => ({
    Payment: {
        find: vi.fn()
    }
}))

describe('FinancialService', () => {
    let financialService: FinancialService

    beforeEach(() => {
        financialService = new FinancialService()
        vi.clearAllMocks()
    })

    describe('getFinancialSummary', () => {
        it('should correctly aggregate revenue, fees, and payouts', async () => {
            const mockPayments = [
                { type: 'bid', amount: 1000, status: 'completed' },
                { type: 'bid', amount: 500, status: 'completed' },
                { type: 'fee', amount: 50, status: 'completed' },
                { type: 'fee', amount: 25, status: 'completed' },
                { type: 'withdrawal', amount: 800, status: 'completed' }
            ]

            const findSpy = vi.mocked(Payment.find).mockReturnValue({
                sort: vi.fn().mockReturnThis()
            } as any)

            // Re-mocking find to return a promise that resolves to mockPayments
            vi.mocked(Payment.find).mockResolvedValue(mockPayments as any)

            const startDate = new Date('2024-01-01')
            const endDate = new Date('2024-01-31')

            const summary = await financialService.getFinancialSummary(startDate, endDate)

            expect(summary.totalRevenue).toBe(1500)
            expect(summary.totalFees).toBe(75)
            expect(summary.totalPayouts).toBe(800)
            expect(summary.netIncome).toBe(75)
            expect(Payment.find).toHaveBeenCalledWith(expect.objectContaining({
                status: 'completed',
                createdAt: { $gte: startDate, $lte: endDate }
            }))
        })
    })

    describe('getFeeBreakdown', () => {
        it('should correctly breakdown fees by type', async () => {
            const mockFees = [
                { type: 'fee', amount: 50, metadata: { feeType: 'platform' } },
                { type: 'fee', amount: 20, metadata: { feeType: 'processor' } },
                { type: 'fee', amount: 10, metadata: { feeType: 'platform' } },
                { type: 'fee', amount: 5, metadata: { feeType: 'other' } }
            ]

            vi.mocked(Payment.find).mockResolvedValue(mockFees as any)

            const breakdown = await financialService.getFeeBreakdown(new Date(), new Date())

            expect(breakdown.platform).toBe(60)
            expect(breakdown.processor).toBe(20)
            expect(breakdown.other).toBe(5)
        })
    })

    describe('exportToCSV', () => {
        it('should generate a CSV string with correct headers and data', async () => {
            const mockPayments = [
                {
                    _id: 'p1',
                    id: 'p1',
                    createdAt: new Date('2024-01-01T10:00:00Z'),
                    userId: 'user1',
                    type: 'bid',
                    amount: 100,
                    currency: 'USDC',
                    feeAmount: 5,
                    status: 'completed',
                    transactionHash: 'hash1'
                }
            ]

            vi.mocked(Payment.find).mockReturnValue({
                sort: vi.fn().mockResolvedValue(mockPayments as any)
            } as any)

            const csv = await financialService.exportToCSV(new Date(), new Date())

            expect(csv).toContain('ID,Date,User,Type,Amount,Currency,Fee,Status,Hash')
            expect(csv).toContain('p1,2024-01-01T10:00:00.000Z,user1,bid,100,USDC,5,completed,hash1')
        })
    })
})
