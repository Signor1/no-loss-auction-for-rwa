import { Auction } from '../models/Auction';
import { NoLossAuctionContract } from '../blockchain/NoLossAuctionContract';

/**
 * Runs the job to ensure ended auctions are settled.
 */
export async function runAuctionSettlementJob() {
    try {
        // Find auctions that are ended/sold but auto-settle is enabled and maybe explicitly not marked as settled?
        // We don't have a 'settled' flag in the schema shown. 
        // We can check if 'autoSettle' is true in settings.
        // And status is 'ended' or 'sold'.
        // We rely on the contract to prevent double settlement (it does checks).

        const endedAuctions = await Auction.find({
            status: { $in: ['ended', 'sold'] },
            'settings.autoSettle': true
            // In a real app we'd add a 'settlementStatus' field to avoid redundant calls.
            // For this MVP job, we'll try to settle recent ones or log errors if already settled.
        }).limit(20); // Limit to avoid hitting all old auctions every time

        const contract = new NoLossAuctionContract();

        for (const auction of endedAuctions) {
            try {
                // If we had a flag, we'd check it.
                // Call triggerAutomaticSettlement
                await contract.triggerAutomaticSettlement(auction.id);

                console.log(`Triggered settlement for auction ${auction.id}`);
            } catch (err) {
                // Ignore if already settled or other expected errors
                // console.warn(`Settlement trigger failed/skipped for ${auction.id}:`, err);
            }
        }
    } catch (error) {
        console.error('Error running auction settlement job:', error);
    }
}
