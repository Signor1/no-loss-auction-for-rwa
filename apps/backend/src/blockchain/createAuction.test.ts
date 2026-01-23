import { describe, it, expect, vi } from 'vitest';
import { NoLossAuctionContract } from './NoLossAuctionContract';
import { BaseSdkService } from './baseSdkService';
import { Address } from 'viem';

describe('NoLossAuctionContract - createAuction', () => {
    it('should call writeContract with correct parameters for creating an auction', async () => {
        // Mock SDK
        const mockSdk = {
            writeContract: vi.fn().mockResolvedValue('0xmocktxhash'),
            readContract: vi.fn(),
            waitForTransaction: vi.fn(),
        } as unknown as BaseSdkService;

        const contractAddress = '0xContractAddress' as Address;
        const noLossAuctionContract = new NoLossAuctionContract(contractAddress, mockSdk);

        const params = {
            assetToken: '0xAssetToken',
            assetTokenId: 1n,
            assetAmount: 100n,
            reservePrice: 50n,
            startTime: 1000n,
            endTime: 2000n,
            minBidIncrement: 5n,
            paymentToken: '0xPaymentToken',
            bidExpirationPeriod: 3600n,
            withdrawalPenaltyBps: 200n,
            autoSettleEnabled: true,
            withdrawalLockPeriod: 7200n,
            secureEscrowEnabled: true
        };

        const txHash = await noLossAuctionContract.createAuction(params);

        expect(txHash).toBe('0xmocktxhash');
        expect(mockSdk.writeContract).toHaveBeenCalledWith({
            address: contractAddress,
            abi: expect.any(Object), // ABI is complex, checking it exists is enough or check specific name if needed
            functionName: 'createAuction',
            args: [
                params.assetToken,
                params.assetTokenId,
                params.assetAmount,
                params.reservePrice,
                params.startTime,
                params.endTime,
                params.minBidIncrement,
                params.paymentToken,
                params.bidExpirationPeriod,
                params.withdrawalPenaltyBps,
                params.autoSettleEnabled,
                params.withdrawalLockPeriod,
                params.secureEscrowEnabled
            ]
        });
    });

    it('should propagate errors from the SDK', async () => {
        const mockError = new Error('SDK Error');
        const mockSdk = {
            writeContract: vi.fn().mockRejectedValue(mockError),
        } as unknown as BaseSdkService;

        const noLossAuctionContract = new NoLossAuctionContract('0xContract' as Address, mockSdk);

        const params = {
            assetToken: '0xAssetToken',
            assetTokenId: 1n,
            assetAmount: 100n,
            reservePrice: 50n,
            startTime: 1000n,
            endTime: 2000n,
            minBidIncrement: 5n,
            paymentToken: '0xPaymentToken',
            bidExpirationPeriod: 3600n,
            withdrawalPenaltyBps: 200n,
            autoSettleEnabled: true,
            withdrawalLockPeriod: 7200n,
            secureEscrowEnabled: true
        };

        await expect(noLossAuctionContract.createAuction(params)).rejects.toThrow('SDK Error');
    });
});
