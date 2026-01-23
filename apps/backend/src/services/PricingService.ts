import { Service } from 'typedi';

@Service()
export class PricingService {
    // Mock price cache
    private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 60 * 1000; // 1 minute

    /**
     * Get the current price of an asset in USD.
     * @param assetSymbol - The symbol of the asset (e.g., 'ETH', 'BTC').
     * @returns The price in USD.
     */
    async getPrice(assetSymbol: string): Promise<number> {
        const now = Date.now();
        const cached = this.priceCache.get(assetSymbol);

        if (cached && now - cached.timestamp < this.CACHE_TTL) {
            return cached.price;
        }

        const price = await this.fetchPriceFromOracle(assetSymbol);
        this.priceCache.set(assetSymbol, { price, timestamp: now });
        return price;
    }

    /**
     * Mock Oracle fetch. In production, this would call Chainlink or an API like CoinGecko.
     */
    private async fetchPriceFromOracle(assetSymbol: string): Promise<number> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Mock prices
        switch (assetSymbol.toUpperCase()) {
            case 'ETH':
                return 2500 + (Math.random() * 100 - 50); // 2450 - 2550
            case 'BTC':
                return 45000 + (Math.random() * 1000 - 500); // 44500 - 45500
            case 'USDC':
            case 'USDT':
                return 1.0;
            default:
                // Generate a consistent-ish random price for other assets based on char codes
                const seed = assetSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                return (seed % 100) + 10;
        }
    }
}
