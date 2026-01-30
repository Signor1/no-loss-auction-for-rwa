import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAuctionRefundJob } from './auctionRefundJob';
import { Refund } from '../models/Refund';
import { NoLossAuctionContract } from '../blockchain/NoLossAuctionContract';

// Mock the dependencies
vi.mock('../models/Refund', () => ({
    Refund: {
        create: vi.fn(),
        find: vi.fn()
    }
}));

vi.mock('../blockchain/NoLossAuctionContract', () => {
    return {
        NoLossAuctionContract: vi.fn().mockImplementation(() => ({
            refundLosingBidders: vi.fn().mockResolvedValue('0xmocktransactionhash'),
            waitForRefundEvents: vi.fn().mockResolvedValue([
                { args: { bidder: '0x123', refundAmount: 100n } },
                { args: { bidder: '0x456', refundAmount: 50n } }
            ])
        }))
    };
});

describe('Auction Refund Job', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should trigger refund and persist records for losing bidders', async () => {
        const auctionId = '123';

        await runAuctionRefundJob(auctionId);

        // Verify contract interaction
        expect(NoLossAuctionContract).toHaveBeenCalled();
        const mockContractInstance = (NoLossAuctionContract as any).mock.results[0].value;
        expect(mockContractInstance.refundLosingBidders).toHaveBeenCalledWith(auctionId);
        expect(mockContractInstance.waitForRefundEvents).toHaveBeenCalledWith('0xmocktransactionhash');

        // Verify DB persistence
        expect(Refund.create).toHaveBeenCalledTimes(2);
        expect(Refund.create).toHaveBeenCalledWith(expect.objectContaining({
            auctionId,
            bidder: '0x123',
            amount: 100, // 100n converted to number
            txHash: '0xmocktransactionhash',
            status: 'completed'
        }));
        expect(Refund.create).toHaveBeenCalledWith(expect.objectContaining({
            auctionId,
            bidder: '0x456',
            amount: 50,
            txHash: '0xmocktransactionhash',
            status: 'completed'
        }));
    });

    it('should handle errors gracefully', async () => {
        const auctionId = 'error-auction';
        const error = new Error('Blockchain error');

        // Mock error
        (NoLossAuctionContract as any).mockImplementationOnce(() => ({
            refundLosingBidders: vi.fn().mockRejectedValue(error)
        }));

        await expect(runAuctionRefundJob(auctionId)).rejects.toThrow(error);
        expect(Refund.create).not.toHaveBeenCalled();
    });
});
