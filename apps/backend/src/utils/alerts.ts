import logger from './logger'
import * as Sentry from "@sentry/node"

/**
 * Service for sending critical alerts
 */
export class AlertService {
    /**
     * Send a critical alert
     * In a real implementation, this could send to Slack, Discord, Email, etc.
     */
    static async sendCriticalAlert(message: string, context: any = {}) {
        logger.error(`CRITICAL ALERT: ${message}`, {
            ...context,
            alert: true,
            timestamp: new Date().toISOString()
        })

        // Also report to Sentry
        Sentry.captureMessage(message, {
            level: 'fatal',
            extra: context
        })

        // Placeholder for actual notification logic (e.g., Slack Webhook)
        if (process.env.SLACK_WEBHOOK_URL) {
            try {
                // await axios.post(process.env.SLACK_WEBHOOK_URL, { text: `<!channel> CRITICAL: ${message}` })
            } catch (error) {
                logger.error('Failed to send Slack alert', { error })
            }
        }
    }

    /**
     * Send a security alert
     */
    static async sendSecurityAlert(message: string, context: any = {}) {
        logger.warn(`SECURITY ALERT: ${message}`, {
            ...context,
            security: true,
            timestamp: new Date().toISOString()
        })

        Sentry.captureMessage(message, {
            level: 'warning',
            tags: { category: 'security' },
            extra: context
        })
    }
}

export default AlertService
