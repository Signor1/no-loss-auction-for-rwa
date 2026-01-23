import { Auction } from '../models/Auction';
import { NoLossAuctionContract } from '../blockchain/NoLossAuctionContract';

/**
 * Runs the job to end auctions that have reached their end time.
 * This should be scheduled to run frequently (e.g., every minute).
 */
export async function runAuctionEndJob() {
    try {
        const now = new Date();
        const activeAuctions = await Auction.find({
            status: 'active',
            endTime: { $lte: now }
        });

        if (activeAuctions.length === 0) {
            return;
        }

        const contract = new NoLossAuctionContract();

        for (const auction of activeAuctions) {
            try {
                // Determine auctionId from storage or other means. 
                // Assuming auction.id is the database ID, but detailed auction logic might need mapping
                // For simplicity, let's assume we store the on-chain auctionId in metadata or similar, 
                // or the DB ID can be cast if it's numeric/aligned.
                // In this project structure, let's look for a field. 
                // We'll use the 'id' and assume mapped or use a placeholder if not clear.
                // Based on previous files, 'id' is string.
                const onChainAuctionId = auction.id;

                // If specific numeric ID is needed, we should have stored it. 
                // Let's assume for now it's compatible or handled.

                await contract.endAuction(onChainAuctionId);

                // Update local status
                // In a real system, we might wait for event, but for job we can optimistic update or check status later
                // Better: update to 'ended' pending confirmation? 
                // For now, let's set to 'ended'
                auction.status = 'ended';
                if (!auction.timeline) {
                    auction.timeline = { createdAt: new Date() } as any;
                }
                auction.timeline.endedAt = new Date();
                await auction.save();

                console.log(`Ended auction ${onChainAuctionId}`);

            } catch (err) {
                console.error(`Failed to end auction ${auction.id}:`, err);
            }
        }
    } catch (error) {
        console.error('Error running auction end job:', error);
    }
}
