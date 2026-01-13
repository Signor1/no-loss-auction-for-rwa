export interface FinancialSummary {
    totalRevenue: number
    totalFees: number
    totalPayouts: number
    netIncome: number
    period: string
    startDate: string
    endDate: string
}

export interface FeeBreakdown {
    platform: number
    processor: number
    other: number
}

class FinancialService {
    private baseUrl = '/api/financial'

    async getSummary(startDate?: string, endDate?: string): Promise<FinancialSummary> {
        let url = `${this.baseUrl}/summary`
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (params.toString()) url += `?${params.toString()}`

        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to fetch financial summary')
        }

        return response.json()
    }

    async getFeeBreakdown(startDate?: string, endDate?: string): Promise<FeeBreakdown> {
        let url = `${this.baseUrl}/fees`
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (params.toString()) url += `?${params.toString()}`

        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to fetch fee breakdown')
        }

        return response.json()
    }

    async getPayoutHistory(limit = 20, offset = 0, userId?: string) {
        let url = `${this.baseUrl}/payouts?limit=${limit}&offset=${offset}`
        if (userId) url += `&userId=${userId}`

        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to fetch payout history')
        }

        return response.json()
    }

    async exportCSV(startDate?: string, endDate?: string): Promise<void> {
        let url = `${this.baseUrl}/export`
        const params = new URLSearchParams()
        if (startDate) params.append('startDate', startDate)
        if (endDate) params.append('endDate', endDate)
        if (params.toString()) url += `?${params.toString()}`

        const response = await fetch(url, {
            headers: this.getAuthHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to export CSV')
        }

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
    }

    private getAuthHeaders() {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    }
}

export const financialService = new FinancialService()
