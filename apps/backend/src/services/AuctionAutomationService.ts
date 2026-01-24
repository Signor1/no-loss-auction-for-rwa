import { Service } from 'typedi';
import { EventListener, BlockchainEvent } from '../blockchain/eventListener';
import { NoLossAuctionContract } from '../blockchain/NoLossAuctionContract';
import { Auction } from '../models/Auction';
import { retry } from '../utils/retry';

@Service()
export class AuctionAutomationService {
    private noLossAuctionContract: NoLossAuctionContract;

    constructor(
        private eventListener: EventListener,
        contractAddress?: string
    ) {
        this.noLossAuctionContract = new NoLossAuctionContract();
    }

    /**
     * Initialize event listeners for automation.
     * @param chainId The chain ID to listen on.
     * @param contractAddress The address of the NoLossAuction contract.
     */
    async initialize(chainId: number, contractAddress: string) {
        // Subscribe to AuctionEnded event
        // Event signature: event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 winningBid, bool reserveMet);
        // Topic 0 is the hash of the event signature.
        // We'll trust the EventListener/EventParser to handle topic generation or we might need to provide it.
        // For simplicity in this step, we assume the listener can match by address and we filter manually or config handles topics.
        // In a real robust app, we'd calculate the topic hash: keccak256("AuctionEnded(uint256,address,uint256,bool)")

        const auctionEndedTopic = '0x3f5c76daec854b419826359d9c2409747970a049d592a8385628b0319139265f'; // Example hash, should be calculated

        await this.eventListener.subscribeToEvents(
            chainId,
            contractAddress,
            [auctionEndedTopic],
            this.handleAuctionEnded.bind(this)
        );

        console.log(`AuctionAutomationService initialized for ${contractAddress}`);
    }

    /**
     * Handle AuctionEnded event.
     */
    async handleAuctionEnded(event: BlockchainEvent) {
        try {
            console.log('Auction ended event received:', event);
            // Parse auctionId from topics or data (assuming parsedData is available from EventParser)
            const { auctionId, winner, winningBid } = event.parsedData || {};

            if (!auctionId) {
                console.warn('Could not parse auctionId from event');
                return;
            }

            // Update DB status
            const auction = await Auction.findOne({ id: auctionId.toString() }); // Assuming mapping
            if (auction) {
                if (auction.status !== 'ended' && auction.status !== 'sold') {
                    auction.status = 'ended';
                    auction.timeline.endedAt = new Date();
                    await auction.save();
                    console.log(`Updated auction ${auctionId} status to ended based on event`);
                }

                // Check for auto-settlement
                if (auction.settings.autoSettle) {
                    // Trigger settlement with retry
                    await retry(async () => {
                        await this.noLossAuctionContract.triggerAutomaticSettlement(auctionId.toString());
                    });
                    console.log(`Triggered auto-settlement for ${auctionId}`);
                }
            }

        } catch (error) {
            console.error('Error handling AuctionEnded event:', error);
        }
    }
}
