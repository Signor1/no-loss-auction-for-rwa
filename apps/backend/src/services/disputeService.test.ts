import { describe, it, expect, vi, beforeEach } from 'vitest';
import { disputeService } from './disputeService';
import { Dispute } from '../models/Dispute';

vi.mock('../models/Dispute', () => ({
    Dispute: {
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        find: vi.fn(),
        findById: vi.fn()
    }
}));

describe('Dispute Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createDispute', () => {
        it('should create a dispute', async () => {
            const data = {
                auctionId: 'auc1',
                claimant: 'user1',
                reason: 'Item not received'
            };

            const mockDispute = { ...data, status: 'open', _id: 'disp1' };
            vi.mocked(Dispute.create).mockResolvedValue(mockDispute as any);

            const result = await disputeService.createDispute(data);

            expect(Dispute.create).toHaveBeenCalledWith(expect.objectContaining({
                auctionId: 'auc1',
                status: 'open'
            }));
            expect(result).toEqual(mockDispute);
        });
    });

    describe('resolveDispute', () => {
        it('should resolve a dispute', async () => {
            const disputeId = 'disp1';
            const resolution = 'Refund issued';
            const status = 'resolved';

            const mockDispute = { _id: disputeId, status, resolution };
            vi.mocked(Dispute.findByIdAndUpdate).mockResolvedValue(mockDispute as any);

            const result = await disputeService.resolveDispute(disputeId, resolution, status);

            expect(Dispute.findByIdAndUpdate).toHaveBeenCalledWith(
                disputeId,
                expect.objectContaining({ resolution, status }),
                { new: true }
            );
            expect(result).toEqual(mockDispute);
        });
    });
});
