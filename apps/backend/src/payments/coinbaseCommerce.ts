import crypto from 'crypto';
import logger from '../utils/logger';
import { IPayment } from '../models/Payment';

export interface CoinbaseCommerceCharge {
    id: string;
    hosted_url: string;
    expires_at: string;
    pricing: {
        local: {
            amount: string;
            currency: string;
        };
    };
    metadata?: Record<string, any>;
}

export class CoinbaseCommerceService {
    private readonly apiUrl = 'https://api.commerce.coinbase.com';
    private readonly apiKey = process.env.COINBASE_COMMERCE_API_KEY;
    private readonly webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;

    /**
     * Create a new charge (payment request) in Coinbase Commerce
     */
    async createCharge(payment: IPayment): Promise<CoinbaseCommerceCharge> {
        if (!this.apiKey) {
            throw new Error('COINBASE_COMMERCE_API_KEY is not configured');
        }

        const payload = {
            name: `No-Loss Auction - ${payment.type}`,
            description: `Payment for auction/bid ${payment.auctionId || 'General'}`,
            pricing_type: 'fixed_price',
            local_price: {
                amount: payment.amount.toString(),
                currency: payment.currency,
            },
            metadata: {
                paymentId: payment._id.toString(),
                userId: payment.userId,
                auctionId: payment.auctionId,
            },
            redirect_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            cancel_url: process.env.FRONTEND_URL || 'http://localhost:3000',
        };

        try {
            const response = await fetch(`${this.apiUrl}/charges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CC-Api-Key': this.apiKey,
                    'X-CC-Version': '2018-03-22',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Coinbase Commerce Error: ${JSON.stringify(error)}`);
            }

            const data = await response.json() as { data: CoinbaseCommerceCharge };
            return data.data;
        } catch (error) {
            logger.error('Failed to create Coinbase Commerce charge:', error);
            throw error;
        }
    }

    /**
     * Verify the authenticity of a Coinbase Commerce webhook
     */
    verifyWebhookSignature(rawBody: string, signature: string): boolean {
        if (!this.webhookSecret) {
            logger.error('COINBASE_COMMERCE_WEBHOOK_SECRET is not configured');
            return false;
        }

        const hmac = crypto.createHmac('sha256', this.webhookSecret);
        const hash = hmac.update(rawBody).digest('hex');

        return hash === signature;
    }
}

export const coinbaseCommerceService = new CoinbaseCommerceService();
