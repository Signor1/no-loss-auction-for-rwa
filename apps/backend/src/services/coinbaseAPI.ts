import logger from '../utils/logger';

export interface CoinbasePrice {
    base: string;
    currency: string;
    amount: string;
}

export class CoinbaseAPIService {
    private readonly baseUrl = 'https://api.coinbase.com/v2';
    private readonly apiKey = process.env.COINBASE_API_KEY;

    /**
     * Fetch the current spot price for a given currency pair
     */
    async getSpotPrice(base: string, currency: string = 'USD'): Promise<CoinbasePrice> {
        try {
            const response = await fetch(`${this.baseUrl}/prices/${base}-${currency}/spot`, {
                headers: {
                    'X-CC-Version': '2024-01-01',
                    ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
                }
            });

            if (!response.ok) {
                throw new Error(`Coinbase API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data as CoinbasePrice;
        } catch (error) {
            logger.error(`Failed to fetch price for ${base}-${currency}:`, error);
            // Return a fallback price logic or throw
            throw error;
        }
    }

    /**
     * Fetch exchange rates for multiple currencies relative to a base
     */
    async getExchangeRates(base: string = 'USD'): Promise<Record<string, string>> {
        try {
            const response = await fetch(`${this.baseUrl}/exchange-rates?currency=${base}`);

            if (!response.ok) {
                throw new Error(`Coinbase API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data.rates;
        } catch (error) {
            logger.error(`Failed to fetch exchange rates for ${base}:`, error);
            throw error;
        }
    }

    /**
     * Fetch historical price data for RWA valuation trends
     */
    async getHistoricalPrice(base: string, date: string, currency: string = 'USD'): Promise<CoinbasePrice> {
        // Note: This often requires authentication and specific permissions
        try {
            const response = await fetch(`${this.baseUrl}/prices/${base}-${currency}/spot?date=${date}`);
            if (!response.ok) {
                throw new Error(`Coinbase API Error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data as CoinbasePrice;
        } catch (error) {
            logger.error(`Failed to fetch historical price for ${base} on ${date}:`, error);
            throw error;
        }
    }
}

export const coinbaseAPIService = new CoinbaseAPIService();
