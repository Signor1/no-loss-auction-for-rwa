import { Payment, IPayment } from '../models/Payment'

export interface FinancialSummary {
    totalRevenue: number
    totalFees: number
    totalPayouts: number
    netIncome: number
    period: string
    startDate: Date
    endDate: Date
}

export class FinancialService {

    /**
     * Get financial summary for a date range
     */
    async getFinancialSummary(startDate: Date, endDate: Date): Promise<FinancialSummary> {
        const payments = await Payment.find({
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
        })

        let totalRevenue = 0
        let totalFees = 0
        let totalPayouts = 0

        payments.forEach((p: IPayment) => {
            if (p.type === 'bid') {
                totalRevenue += p.amount
            } else if (p.type === 'fee') {
                totalFees += p.amount
            } else if (p.type === 'withdrawal') {
                totalPayouts += p.amount
            }
        })

        // On our platform, Net Income = Total Fees Collected
        // (Assuming 'bid' amount is the gross volume, and 'fee' is what the platform keeps)
        // If 'bid' includes the price + fee, we need more granular logic.
        // Based on our FeeService, fees are calculated separately.

        const netIncome = totalFees

        return {
            totalRevenue,
            totalFees,
            totalPayouts,
            netIncome,
            period: 'custom',
            startDate,
            endDate
        }
    }

    /**
     * Generate a breakdown of fees by type
     */
    async getFeeBreakdown(startDate: Date, endDate: Date): Promise<any> {
        const fees = await Payment.find({
            type: 'fee',
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
        })

        const breakdown = {
            platform: 0,
            processor: 0,
            other: 0
        }

        fees.forEach((f: IPayment) => {
            const feeType = f.metadata?.feeType || 'platform'
            if (feeType === 'platform') breakdown.platform += f.amount
            else if (feeType === 'processor') breakdown.processor += f.amount
            else breakdown.other += f.amount
        })

        return breakdown
    }

    /**
     * Get payout records
     */
    async getPayoutHistory(userId?: string, limit: number = 20, offset: number = 0): Promise<IPayment[]> {
        const query: any = { type: 'withdrawal' }
        if (userId) query.userId = userId

        return Payment.find(query)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
    }

    /**
     * Export data to CSV format (simulated)
     */
    async exportToCSV(startDate: Date, endDate: Date): Promise<string> {
        const payments = await Payment.find({
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: 1 })

        let csv = 'ID,Date,User,Type,Amount,Currency,Fee,Status,Hash\n'

        payments.forEach((p: IPayment) => {
            csv += `${(p as any)._id},${p.createdAt.toISOString()},${p.userId},${p.type},${p.amount},${p.currency},${p.feeAmount || 0},${p.status},${p.transactionHash || ''}\n`
        })

        return csv
    }
}

export const financialService = new FinancialService()
