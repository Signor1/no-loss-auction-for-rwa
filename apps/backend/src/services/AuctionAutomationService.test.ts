import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retry } from '../utils/retry';
import { AuctionAutomationService } from '../services/AuctionAutomationService';
import { EventListener } from '../blockchain/eventListener';
import { NoLossAuctionContract } from '../blockchain/NoLossAuctionContract';
import { Auction } from '../models/Auction';

// Mock dependencies
vi.mock('../blockchain/eventListener');
vi.mock('../blockchain/NoLossAuctionContract');
vi.mock('../models/Auction');

describe('Utils: retry', () => {
    it('should return result if function succeeds first time', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await retry(fn);
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('fail 1'))
            .mockRejectedValueOnce(new Error('fail 2'))
            .mockResolvedValue('success');

        const result = await retry(fn, 3, 10, 1); // fast retry for test
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw error if all retries fail', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('fail'));
        await expect(retry(fn, 3, 10, 1)).rejects.toThrow('fail');
        expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries? Wait, implementation retry logic:
        // Implementation:
        // try fn()
        // catch: if retries <= 0 throw
        // wait
        // retry(retries-1)
        // So:
        // 1. call (fail) -> retries 3. catch. wait. recurse(2)
        // 2. call (fail) -> retries 2. catch. wait. recurse(1)
        // 3. call (fail) -> retries 1. catch. wait. recurse(0)
        // 4. call (fail) -> retries 0. catch. throw.
        // Total 4 calls. Correct.
    });
});

describe('Service: AuctionAutomationService', () => {
    let service: AuctionAutomationService;
    let mockEventListener: any;
    let mockContract: any;

    beforeEach(() => {
        mockEventListener = new EventListener([], {} as any, {} as any, {} as any);
        mockEventListener.subscribeToEvents = vi.fn();

        mockContract = {
            triggerAutomaticSettlement: vi.fn().mockResolvedValue('0xtx')
        };
        (NoLossAuctionContract as any).mockImplementation(() => mockContract);

        service = new AuctionAutomationService(mockEventListener, '0xaddr');
    });

    it('should initialize and subscribe to events', async () => {
        await service.initialize(1, '0xcontract');
        expect(mockEventListener.subscribeToEvents).toHaveBeenCalledWith(
            1,
            '0xcontract',
            expect.any(Array),
            expect.any(Function)
        );
    });

    it('should handle AuctionEnded event and update DB + trigger settlement', async () => {
        const mockAuction = {
            id: '123',
            status: 'active',
            timeline: {},
            settings: { autoSettle: true },
            save: vi.fn()
        };
        (Auction.findOne as any).mockResolvedValue(mockAuction);

        const event = {
            parsedData: { auctionId: 123n }
        } as any;

        await service.handleAuctionEnded(event);

        expect(mockAuction.status).toBe('ended');
        expect(mockAuction.save).toHaveBeenCalled();
        expect(mockContract.triggerAutomaticSettlement).toHaveBeenCalledWith('123');
    });
});
