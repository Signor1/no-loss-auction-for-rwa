import { Transaction } from './transaction-history'

export interface PaymentRecord {
    _id: string
    userId: string
    auctionId?: string
    bidId?: string
    amount: number
    currency: string
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded'
    type: 'bid' | 'refund' | 'fee' | 'withdrawal'
    method: 'crypto' | 'fiat'
    gateway: 'on-chain' | 'stripe' | 'coinbase-pay'
    gatewayTransactionId?: string
    transactionHash?: string
    feeAmount?: number
    createdAt: string
    updatedAt: string
    metadata?: Record<string, any>
}

class PaymentService {
    private baseUrl = '/api/payments'

    async getHistory(limit = 20, offset = 0): Promise<PaymentRecord[]> {
        const response = await fetch(`${this.baseUrl}/history?limit=${limit}&offset=${offset}`, {
            headers: this.getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to fetch payment history')
        }

        return response.json()
    }

    async createPayment(data: Partial<PaymentRecord>): Promise<PaymentRecord> {
        const response = await fetch(`${this.baseUrl}/create`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            throw new Error('Failed to create payment')
        }

        return response.json()
    }

    async processRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentRecord> {
        const response = await fetch(`${this.baseUrl}/refund`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ paymentId, amount, reason })
        })

        if (!response.ok) {
            throw new Error('Failed to process refund')
        }

        return response.json()
    }

    async getFees(auctionId: string, amount: number) {
        const response = await fetch(`${this.baseUrl}/fees/${auctionId}?amount=${amount}`, {
            headers: this.getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to calculate fees')
        }

        return response.json()
    }

    private getAuthHeaders() {
        // In a real app, this would get the token from a context or local storage
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    }
}

export const paymentService = new PaymentService()
