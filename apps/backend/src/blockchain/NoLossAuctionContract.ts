import { BaseSdkService, initializeBaseSdk } from './baseSdkService';
import { Address, Hash, parseEventLogs } from 'viem';

export const NO_LOSS_AUCTION_ABI = [
    {
        type: 'function',
        name: 'refundLosingBidders',
        inputs: [{ name: 'auctionId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable'
    },
    {
        type: 'event',
        name: 'BidRefunded',
        inputs: [
            { indexed: true, name: 'auctionId', type: 'uint256' },
            { indexed: true, name: 'bidder', type: 'address' },
            { indexed: false, name: 'refundAmount', type: 'uint256' }
        ]
    }
] as const;

export class NoLossAuctionContract {
    private sdk: BaseSdkService;
    private contractAddress: Address;

    constructor(contractAddress?: Address, sdk?: BaseSdkService) {
        this.sdk = sdk || initializeBaseSdk();
        // In a real app, this would come from env or config service
        this.contractAddress = (contractAddress || process.env.NO_LOSS_AUCTION_ADDRESS) as Address;
        if (!this.contractAddress) {
            // Fallback for dev/testing if env not set, though ideally should throw or handle gracefully
            console.warn('NoLossAuctionContract: No contract address provided, using placeholder');
            this.contractAddress = '0x0000000000000000000000000000000000000000';
        }
    }

    /**
     * Triggers the refund process for all losing bidders of a specific auction.
     * Returns the transaction hash.
     */
    async refundLosingBidders(auctionId: string): Promise<Hash> {
        const hash = await this.sdk.writeContract({
            address: this.contractAddress,
            abi: NO_LOSS_AUCTION_ABI,
            functionName: 'refundLosingBidders',
            args: [BigInt(auctionId)]
        });
        return hash;
    }

    /**
     * Waits for the transaction and parses Refund events.
     */
    async waitForRefundEvents(hash: Hash) {
        const receipt = await this.sdk.waitForTransaction(hash);
        const logs = parseEventLogs({
            abi: NO_LOSS_AUCTION_ABI,
            eventName: 'BidRefunded',
            logs: receipt.logs,
        });
        return logs;
    }
}
