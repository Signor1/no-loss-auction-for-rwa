import { ethers } from 'ethers';
import { Logger } from '../utils/logger';
import { CHAIN_CONFIGS } from './chainConfig';

// Base GasPriceOracle contract address (constant across Base chains)
const GAS_PRICE_ORACLE_ADDRESS = '0x420000000000000000000000000000000000000F';

// Minimal ABI for GasPriceOracle
const GAS_PRICE_ORACLE_ABI = [
    'function getL1Fee(bytes data) view returns (uint256)',
    'function l1BaseFee() view returns (uint256)',
    'function overhead() view returns (uint256)',
    'function scalar() view returns (uint256)',
    'function decimals() view returns (uint256)'
];

export class BaseFeeService {
    private logger: Logger;
    private oracleContracts: Map<number, ethers.Contract> = new Map();

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /**
     * Get the L1 fee for a transaction on Base
     * @param chainId The chain ID (must be Base Mainnet or Sepolia)
     * @param data The signed or unsigned transaction data
     * @returns The L1 fee in wei as a string
     */
    async getL1Fee(chainId: number, data: string): Promise<string> {
        if (!this.isBaseChain(chainId)) {
            return '0';
        }

        try {
            const contract = await this.getOracleContract(chainId);
            const l1Fee = await contract.getL1Fee(data);
            return l1Fee.toString();
        } catch (error) {
            this.logger.error(`Failed to get L1 fee for chain ${chainId}:`, error);
            return '0';
        }
    }

    /**
     * Check if the chain is a Base network
     */
    private isBaseChain(chainId: number): boolean {
        return chainId === 8453 || chainId === 84532;
    }

    /**
     * Get or create the oracle contract instance for a chain
     */
    private async getOracleContract(chainId: number): Promise<ethers.Contract> {
        if (this.oracleContracts.has(chainId)) {
            return this.oracleContracts.get(chainId)!;
        }

        const config = CHAIN_CONFIGS.find(c => c.chainId === chainId);
        if (!config) {
            throw new Error(`Chain configuration not found for chainId: ${chainId}`);
        }

        const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        const contract = new ethers.Contract(GAS_PRICE_ORACLE_ADDRESS, GAS_PRICE_ORACLE_ABI, provider);

        this.oracleContracts.set(chainId, contract);
        return contract;
    }
}

export default BaseFeeService;
