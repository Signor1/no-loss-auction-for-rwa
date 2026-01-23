import { Dispute, DisputeDocument } from '../models/Dispute';
import { Logger } from '../utils/logger';

export class DisputeService {
    private logger: typeof Logger; // Assuming Logger is a class or object with static methods

    constructor(logger?: any) {
        this.logger = logger || console;
    }

    /**
     * Create a new dispute
     */
    async createDispute(data: {
        auctionId: string;
        claimant: string;
        reason: string;
        evidence?: string[];
    }): Promise<DisputeDocument> {
        try {
            const dispute = await Dispute.create({
                ...data,
                status: 'open'
            });

            this.logger.info(`Dispute created for auction ${data.auctionId} by ${data.claimant}`);
            return dispute;
        } catch (error) {
            this.logger.error('Failed to create dispute:', error);
            throw error;
        }
    }

    /**
     * Resolve a dispute
     */
    async resolveDispute(disputeId: string, resolution: string, status: 'resolved' | 'dismissed'): Promise<DisputeDocument | null> {
        try {
            const dispute = await Dispute.findByIdAndUpdate(
                disputeId,
                {
                    resolution,
                    status,
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (dispute) {
                this.logger.info(`Dispute ${disputeId} ${status}: ${resolution}`);
            }

            return dispute;
        } catch (error) {
            this.logger.error(`Failed to resolve dispute ${disputeId}:`, error);
            throw error;
        }
    }

    /**
     * Get disputes for an auction
     */
    async getDisputesByAuction(auctionId: string): Promise<DisputeDocument[]> {
        return Dispute.find({ auctionId }).sort({ createdAt: -1 });
    }

    /**
     * Get dispute by ID
     */
    async getDispute(disputeId: string): Promise<DisputeDocument | null> {
        return Dispute.findById(disputeId);
    }
}

export const disputeService = new DisputeService();
