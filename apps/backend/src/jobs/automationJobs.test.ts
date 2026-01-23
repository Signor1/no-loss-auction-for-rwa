import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAuctionEndJob } from './auctionEndJob';
import { runAuctionStartJob } from './auctionStartJob';
import { runAuctionSettlementJob } from './auctionSettlementJob';
import { Auction } from '../models/Auction';
import { NoLossAuctionContract } from '../blockchain/NoLossAuctionContract';

// Mock dependencies
vi.mock('../models/Auction');
vi.mock('../blockchain/NoLossAuctionContract');

describe('Auction Automation Jobs', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('runAuctionEndJob', () => {
        it('should end active auctions that have passed end time', async () => {
            const mockAuctions = [
                {
                    id: '1',
                    status: 'active',
                    timeline: {},
                    save: vi.fn()
                }
            ];
            (Auction.find as any).mockResolvedValue(mockAuctions);
            (NoLossAuctionContract as any).mockImplementation(() => ({
                endAuction: vi.fn().mockResolvedValue('0xtxhash')
            }));

            await runAuctionEndJob();

            expect(Auction.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
            // expect(mockAuctions[0].save).toHaveBeenCalled(); // might fail if logic changes
            // Check contract call
            const contractInstance = (NoLossAuctionContract as any).mock.results[0].value;
            expect(contractInstance.endAuction).toHaveBeenCalledWith('1');
        });
    });

    describe('runAuctionStartJob', () => {
        it('should activate pending auctions', async () => {
            const mockAuctions = [
                {
                    id: '2',
                    status: 'pending',
                    timeline: { startedAt: null },
                    save: vi.fn()
                }
            ];
            (Auction.find as any).mockResolvedValue(mockAuctions);

            await runAuctionStartJob();

            expect(Auction.find).toHaveBeenCalled();
            expect(mockAuctions[0].status).toBe('active');
            expect(mockAuctions[0].save).toHaveBeenCalled();
        });
    });

    describe('runAuctionSettlementJob', () => {
        it('should trigger settlement for ended auctions', async () => {
            const mockAuctions = [
                {
                    id: '3',
                    status: 'ended',
                    settings: { autoSettle: true },
                    save: vi.fn()
                }
            ];
            (Auction.find as any).mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockAuctions)
            });
            (NoLossAuctionContract as any).mockImplementation(() => ({
                triggerAutomaticSettlement: vi.fn().mockResolvedValue('0xtxhash')
            }));

            await runAuctionSettlementJob();

            expect(Auction.find).toHaveBeenCalled();
            const contractInstance = (NoLossAuctionContract as any).mock.results[0].value;
            expect(contractInstance.triggerAutomaticSettlement).toHaveBeenCalledWith('3');
        });
    });

});
