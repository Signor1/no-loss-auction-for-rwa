import { NoLossAuctionContract } from '../blockchain/NoLossAuctionContract';
import { Refund } from '../models/Refund';

export async function runAuctionRefundJob(auctionId: string): Promise<void> {
    try {
        const contract = new NoLossAuctionContract();

        // Trigger the refund transaction on-chain
        console.log(`Starting refund job for auction ${auctionId}`);
        const hash = await contract.refundLosingBidders(auctionId);
        console.log(`Refund transaction sent: ${hash}. Waiting for confirmation...`);

        // Wait for the transaction to be mined and events to be emitted
        const logs = await contract.waitForRefundEvents(hash);
        console.log(`Refund transaction confirmed. Found ${logs.length} refund events.`);

        // Persist refund records
        for (const log of logs) {
            const { bidder, refundAmount } = log.args;

            await Refund.create({
                auctionId,
                bidder,
                amount: Number(refundAmount), // Convert bigint to number (beware of precision loss for large values)
                txHash: hash,
                status: 'completed',
                createdAt: new Date()
            });
        }

        console.log(`Successfully processed refunds for auction ${auctionId}`);
    } catch (error) {
        console.error(`Failed to process refunds for auction ${auctionId}:`, error);
        // In a real job queue, we might throw here to trigger a retry
        throw error;
    }
}
