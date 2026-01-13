import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FeeService } from './feeService'
import { Auction } from '../models/Auction'

vi.mock('../models/Auction', () => ({
    Auction: {
        findById: vi.fn()
    }
}))

describe('FeeService', () => {
    let feeService: FeeService

    beforeEach(() => {
        feeService = new FeeService()
        vi.clearAllMocks()
    })

    describe('calculateAuctionFees', () => {
        it('should calculate fees based on auction settings', async () => {
            const auctionId = 'auction123'
            const mockAuction = {
                _id: auctionId,
                fees: {
                    platformFee: 2.5,
                    paymentProcessorFee: 1.5
                }
            }

            vi.mocked(Auction.findById).mockResolvedValue(mockAuction)

            const result = await feeService.calculateAuctionFees(auctionId, 1000)

            expect(Auction.findById).toHaveBeenCalledWith(auctionId)
            expect(result.platformFee).toBe(25)
            expect(result.processorFee).toBe(15)
            expect(result.totalFees).toBe(40)
        })

        it('should throw error if auction is not found', async () => {
            vi.mocked(Auction.findById).mockResolvedValue(null)

            await expect(feeService.calculateAuctionFees('invalid', 1000))
                .rejects.toThrow('Auction not found')
        })
    })

    describe('calculateTransactionFee', () => {
        it('should calculate fee for a given percentage', () => {
            const result = feeService.calculateTransactionFee(500, 3)
            expect(result).toBe(15)
        })
    })
})
