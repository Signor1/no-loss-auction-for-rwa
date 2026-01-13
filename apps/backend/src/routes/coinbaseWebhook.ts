import express from 'express';
import { coinbaseCommerceService } from '../payments/coinbaseCommerce';
import { paymentService } from '../payments/paymentService';
import logger from '../utils/logger';

const router: express.Router = express.Router();

/**
 * Handle Coinbase Commerce webhooks
 */
router.post('/', async (req, res): Promise<any> => {
    const signature = req.headers['x-cc-webhook-signature'] as string;

    if (!signature) {
        return res.status(400).send('Missing signature');
    }

    // Note: req.body must be the raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const isValid = coinbaseCommerceService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
        logger.warn('Invalid Coinbase Commerce webhook signature');
        return res.status(401).send('Invalid signature');
    }

    const { event } = req.body;
    const paymentId = event.data.metadata.paymentId;

    logger.info(`Received Coinbase Commerce event: ${event.type} for payment ${paymentId}`);

    try {
        switch (event.type) {
            case 'charge:confirmed':
                await paymentService.completePayment(paymentId, {
                    gatewayTransactionId: event.data.id,
                    transactionHash: event.data.payments?.[0]?.transaction_id,
                    metadata: { coinbaseEvent: event.type }
                });
                break;

            case 'charge:failed':
                await paymentService.failPayment(paymentId, 'Payment failed in Coinbase Commerce');
                break;

            case 'charge:delayed':
                logger.warn(`Delayed payment for ${paymentId}`);
                // Handle delayed payment if needed
                break;

            default:
                logger.debug(`Unhandled Coinbase Commerce event type: ${event.type}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        logger.error('Error processing Coinbase Commerce webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
