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
    },
    {
        type: 'function',
        name: 'escrow',
        inputs: [
            { name: 'auctionId', type: 'uint256' },
            { name: 'bidder', type: 'address' }
        ],
        outputs: [{ name: '', type: 'uint256' }], // amount
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'escrowLocks',
        inputs: [
            { name: 'auctionId', type: 'uint256' },
            { name: 'bidder', type: 'address' }
        ],
        outputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'unlockTime', type: 'uint256' },
            { name: 'locked', type: 'bool' },
            { name: 'paymentToken', type: 'address' }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'withdrawBid',
        inputs: [
            { name: 'auctionId', type: 'uint256' },
            { name: 'bidIndex', type: 'uint256' }
        ],
        outputs: [],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'withdrawAllBids',
        inputs: [{ name: 'auctionId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable'
    }
] as const;

export interface EscrowLock {
    amount: bigint;
    unlockTime: bigint;
    locked: boolean;
    paymentToken: Address;
}

export class NoLossAuctionContract {
    private sdk: BaseSdkService;
    private contractAddress: Address;

    constructor(contractAddress?: Address, sdk?: BaseSdkService) {
        this.sdk = sdk || initializeBaseSdk();
        // In a real app, this would come from env or config service
        this.contractAddress = (contractAddress || process.env.NO_LOSS_AUCTION_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;
    }

    /**
     * Triggers the refund process for all losing bidders of a specific auction.
     * Returns the transaction hash.
     */
    async refundLosingBidders(auctionId: string): Promise<Hash> {
        return this.sdk.writeContract({
            address: this.contractAddress,
            abi: NO_LOSS_AUCTION_ABI,
            functionName: 'refundLosingBidders',
            args: [BigInt(auctionId)]
        });
    }

    /**
     * Waits for the transaction and parses Refund events.
     */
    async waitForRefundEvents(hash: Hash) {
        const receipt = await this.sdk.waitForTransaction(hash);
        return parseEventLogs({
            abi: NO_LOSS_AUCTION_ABI,
            eventName: 'BidRefunded',
            logs: receipt.logs,
        });
    }

    /**
     * Get escrowed amount for a bidder in an auction
     */
    async getEscrowAmount(auctionId: string, bidder: Address): Promise<bigint> {
        return this.sdk.readContract({
            address: this.contractAddress,
            abi: NO_LOSS_AUCTION_ABI,
            functionName: 'escrow',
            args: [BigInt(auctionId), bidder]
        });
    }

    /**
     * Get escrow lock details for a bidder
     */
    async getEscrowLock(auctionId: string, bidder: Address): Promise<EscrowLock> {
        const [amount, unlockTime, locked, paymentToken] = await this.sdk.readContract({
            address: this.contractAddress,
            abi: NO_LOSS_AUCTION_ABI,
            functionName: 'escrowLocks',
            args: [BigInt(auctionId), bidder]
        }) as [bigint, bigint, boolean, Address];

        return { amount, unlockTime, locked, paymentToken };
    }

    /**
     * Withdraw a specific bid
     */
    async withdrawBid(auctionId: string, bidIndex: number): Promise<Hash> {
        return this.sdk.writeContract({
            address: this.contractAddress,
            abi: NO_LOSS_AUCTION_ABI,
            functionName: 'withdrawBid',
            args: [BigInt(auctionId), BigInt(bidIndex)]
        });
    }

    /**
     * Withdraw all bids for a user in an auction
     */
    async withdrawAllBids(auctionId: string): Promise<Hash> {
        return this.sdk.writeContract({
            address: this.contractAddress,
            abi: NO_LOSS_AUCTION_ABI,
            functionName: 'withdrawAllBids',
            args: [BigInt(auctionId)]
        });
    }
}
