import { Auction } from '../models/Auction'

export class FeeService {
    /**
     * Calculate fees for an auction result
     */
    async calculateAuctionFees(auctionId: string, finalAmount: number): Promise<{
        platformFee: number,
        processorFee: number,
        totalFees: number
    }> {
        const auction = await Auction.findById(auctionId)
        if (!auction) {
            throw new Error('Auction not found')
        }

        const { platformFee: platformPct, paymentProcessorFee: processorPct } = auction.fees

        const platformFee = (finalAmount * platformPct) / 100
        const processorFee = (finalAmount * processorPct) / 100
        const totalFees = platformFee + processorFee

        return {
            platformFee,
            processorFee,
            totalFees
        }
    }

    /**
     * Calculate fee for a single transaction
     */
    calculateTransactionFee(amount: number, feePercentage: number): number {
        return (amount * feePercentage) / 100
    }
}

export const feeService = new FeeService()
