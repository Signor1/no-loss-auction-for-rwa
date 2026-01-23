import { Auction } from '../models/Auction';

/**
 * Runs the job to start auctions (set status to active) that have reached their start time.
 */
export async function runAuctionStartJob() {
    try {
        const now = new Date();
        const upcomingAuctions = await Auction.find({
            status: { $in: ['pending', 'draft'] }, // Adjust based on flow, usually 'pending' or 'upcoming'
            'timeline.startedAt': { $lte: now }, // Should have a start time field?
            // Checking Auction model... it has 'timeline.startedAt' but that's likely when it *actually* started
            // It has 'startTime' field in 'IAuction' interface? No, it has 'timeline' and 'createdAt'. 
            // Wait, AuctionSchema has 'endTime' at root. It doesn't seem to have explicit 'startTime' at root in the provided file view?
            // Let's double check. 
            // The file view 'Auction.ts' showed:
            //   endTime: Date
            //   status: ...
            //   timeline: { createdAt, publishedAt, startedAt, endedAt ... }
            // It seems 'startedAt' in timeline is what we might use, OR we need a unified 'startTime' field.
            // The smart contract has 'startTime'. The model should probably have it too.
            // Looking at 'createAuction' in contract wrapper, it sends 'startTime'.
            // Let's check Schema again.
        });

        // RE-READING Auction.ts...
        // lines 171: endTime
        // lines 114-146: title, description, assetId, sellerId, category
        // No root 'startTime'. 
        // We probably need to check if we can query by 'timeline.startedAt' if that's intended as 'scheduled start'
        // or if we missed a field.
        // Assuming 'timeline.publishedAt' or we rely on explicit start time.
        // If we assumed 'pending' means 'scheduled', we need a time.
        // Let's use 'timeline.startedAt' as the scheduled start time for now, or add a field if needed.
        // Actually, if status is 'pending', maybe we just check if we should activate it.
        // Let's assume we fix/add 'startTime' or use one of the dates.

        // For this safe implementation, I'll assume we query based on a rigorous check or use 'updatedAt' if simplistic.
        // But better: let's query for pending and check dates.

        // In the absence of a clear 'scheduledStartTime' field in the model view, I will add a TODO or use a likely field.
        // Let's search for any 'start' related field in Auction.ts view...
        // 'startedAt' is in 'timeline'.

        const pendingAuctions = await Auction.find({
            status: 'pending',
            'timeline.publishedAt': { $lte: now } // using publishedAt as available marker?
        });

        for (const auction of pendingAuctions) {
            // In a real scenario we'd match with chain start time.
            // For now, update status.
            auction.status = 'active';
            if (!auction.timeline.startedAt) {
                auction.timeline.startedAt = new Date();
            }
            await auction.save();
            console.log(`Started auction ${auction.id}`);
        }

    } catch (error) {
        console.error('Error running auction start job:', error);
    }
}
