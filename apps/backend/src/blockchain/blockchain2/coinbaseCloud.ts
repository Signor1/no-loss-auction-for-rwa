import { ethers } from 'ethers';
import logger from '../utils/logger';

export class CoinbaseCloudService {
    private readonly cloudRpcUrl = process.env.COINBASE_CLOUD_RPC_URL;
    private readonly fallbackRpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    private provider: ethers.JsonRpcProvider;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(this.cloudRpcUrl || this.fallbackRpcUrl);
    }

    /**
     * Get a resilient provider, switching to fallback if Coinbase Cloud is unavailable
     */
    async getResilientProvider(): Promise<ethers.JsonRpcProvider> {
        try {
            await this.provider.getNetwork();
            return this.provider;
        } catch (error) {
            logger.warn('Coinbase Cloud RPC unavailable, switching to fallback RPC');
            return new ethers.JsonRpcProvider(this.fallbackRpcUrl);
        }
    }

    /**
     * Fetch blockchain data optimized by Coinbase Cloud Query
     */
    async getIndexedData(address: string, topic: string) {
        // In a real implementation, this would use the Coinbase Cloud Data API
        // for faster indexing and filtered result sets.
        const provider = await this.getResilientProvider();
        const filter = {
            address,
            topics: [topic]
        };

        try {
            return await provider.getLogs(filter);
        } catch (error) {
            logger.error('Failed to fetch indexed data:', error);
            throw error;
        }
    }

    /**
     * Validate the health of the Cloud Node
     */
    async checkHealth(): Promise<boolean> {
        try {
            const provider = new ethers.JsonRpcProvider(this.cloudRpcUrl);
            await provider.getBlockNumber();
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const coinbaseCloudService = new CoinbaseCloudService();
