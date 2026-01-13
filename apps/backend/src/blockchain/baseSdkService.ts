import { 
  createPublicClient, 
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  type TransactionReceipt,
  parseAbi,
  encodeFunctionData,
  formatEther,
  formatUnits
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Base SDK Configuration
interface BaseSdkConfig {
  chainId: number;
  rpcUrl: string;
  wsUrl?: string;
  privateKey?: string;
  explorerApiUrl: string;
  explorerApiKey?: string;
}

// Contract call parameters
interface ContractCallParams {
  address: Address;
  abi: any[];
  functionName: string;
  args?: any[];
  value?: bigint;
}

// Transaction options
interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

// Event filter
interface EventFilter {
  address?: Address;
  eventName: string;
  fromBlock?: bigint;
  toBlock?: bigint;
  args?: any;
}

/**
 * Base SDK Service for Backend
 * Provides comprehensive blockchain interaction capabilities
 */
export class BaseSdkService {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;
  private config: BaseSdkConfig;
  private account: ReturnType<typeof privateKeyToAccount> | null = null;

  constructor(config: BaseSdkConfig) {
    this.config = config;

    // Determine chain
    const chain = config.chainId === 8453 ? base : baseSepolia;

    // Create public client
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });

    // Create wallet client if private key is provided
    if (config.privateKey) {
      try {
        this.account = privateKeyToAccount(config.privateKey as `0x${string}`);
        this.walletClient = createWalletClient({
          account: this.account,
          chain,
          transport: http(config.rpcUrl),
        });
      } catch (error) {
        console.error('Failed to create wallet client:', error);
      }
    }
  }

  // ============ READ OPERATIONS ============

  /**
   * Read data from a contract
   */
  async readContract<T = any>(params: ContractCallParams): Promise<T> {
    try {
      const result = await this.publicClient.readContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
      });

      return result as T;
    } catch (error) {
      console.error('Contract read error:', error);
      throw error;
    }
  }

  /**
   * Batch read multiple contracts
   */
  async readContractBatch<T = any>(calls: ContractCallParams[]): Promise<T[]> {
    try {
      const promises = calls.map(call => this.readContract<T>(call));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Batch read error:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: Address): Promise<bigint> {
    try {
      return await this.publicClient.getBalance({ address });
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: Address, ownerAddress: Address): Promise<bigint> {
    const abi = parseAbi(['function balanceOf(address) view returns (uint256)']);
    return await this.readContract<bigint>({
      address: tokenAddress,
      abi,
      functionName: 'balanceOf',
      args: [ownerAddress],
    });
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(tokenAddress: Address): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }> {
    const abi = parseAbi([
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function totalSupply() view returns (uint256)',
    ]);

    const [name, symbol, decimals, totalSupply] = await this.readContractBatch([
      { address: tokenAddress, abi, functionName: 'name' },
      { address: tokenAddress, abi, functionName: 'symbol' },
      { address: tokenAddress, abi, functionName: 'decimals' },
      { address: tokenAddress, abi, functionName: 'totalSupply' },
    ]);

    return {
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
      totalSupply: totalSupply as bigint,
    };
  }

  // ============ WRITE OPERATIONS ============

  /**
   * Write to a contract (requires wallet client)
   */
  async writeContract(
    params: ContractCallParams,
    options?: TransactionOptions
  ): Promise<Hash> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet client not initialized. Provide a private key.');
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        account: this.account,
        value: params.value,
        gas: options?.gasLimit,
        gasPrice: options?.gasPrice,
        maxFeePerGas: options?.maxFeePerGas,
        maxPriorityFeePerGas: options?.maxPriorityFeePerGas,
        nonce: options?.nonce,
      });

      return hash;
    } catch (error) {
      console.error('Contract write error:', error);
      throw error;
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    to: Address,
    value: bigint,
    data?: `0x${string}`,
    options?: TransactionOptions
  ): Promise<Hash> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet client not initialized.');
    }

    try {
      const hash = await this.walletClient.sendTransaction({
        to,
        value,
        data,
        account: this.account,
        gas: options?.gasLimit,
        gasPrice: options?.gasPrice,
        maxFeePerGas: options?.maxFeePerGas,
        maxPriorityFeePerGas: options?.maxPriorityFeePerGas,
        nonce: options?.nonce,
      });

      return hash;
    } catch (error) {
      console.error('Send transaction error:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction receipt
   */
  async waitForTransaction(hash: Hash, confirmations: number = 2): Promise<TransactionReceipt> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
      });

      return receipt;
    } catch (error) {
      console.error('Wait for transaction error:', error);
      throw error;
    }
  }

  // ============ GAS OPERATIONS ============

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      return await this.publicClient.getGasPrice();
    } catch (error) {
      console.error('Get gas price error:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(params: ContractCallParams & { account: Address }): Promise<bigint> {
    try {
      return await this.publicClient.estimateGas({
        account: params.account,
        to: params.address,
        data: encodeFunctionData({
          abi: params.abi,
          functionName: params.functionName,
          args: params.args,
        }),
        value: params.value,
      });
    } catch (error) {
      console.error('Estimate gas error:', error);
      throw error;
    }
  }

  /**
   * Get fee data (EIP-1559)
   */
  async getFeeData(): Promise<{
    gasPrice: bigint | null;
    maxFeePerGas: bigint | null;
    maxPriorityFeePerGas: bigint | null;
  }> {
    try {
      const feeData = await this.publicClient.estimateFeesPerGas();
      return {
        gasPrice: null,
        maxFeePerGas: feeData.maxFeePerGas || null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || null,
      };
    } catch (error) {
      console.error('Get fee data error:', error);
      throw error;
    }
  }

  // ============ BLOCK OPERATIONS ============

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.publicClient.getBlockNumber();
    } catch (error) {
      console.error('Get block number error:', error);
      throw error;
    }
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: bigint) {
    try {
      return await this.publicClient.getBlock({ blockNumber });
    } catch (error) {
      console.error('Get block error:', error);
      throw error;
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: Hash) {
    try {
      return await this.publicClient.getTransaction({ hash });
    } catch (error) {
      console.error('Get transaction error:', error);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    try {
      return await this.publicClient.getTransactionReceipt({ hash });
    } catch (error) {
      console.error('Get transaction receipt error:', error);
      throw error;
    }
  }

  // ============ EVENT OPERATIONS ============

  /**
   * Get contract logs/events
   */
  async getContractLogs(filter: EventFilter) {
    try {
      return await this.publicClient.getContractEvents({
        address: filter.address,
        abi: [], // Provide ABI externally
        eventName: filter.eventName,
        fromBlock: filter.fromBlock,
        toBlock: filter.toBlock,
        args: filter.args,
      });
    } catch (error) {
      console.error('Get contract logs error:', error);
      throw error;
    }
  }

  /**
   * Watch contract events
   */
  watchContractEvent(params: {
    address: Address;
    abi: any[];
    eventName: string;
    onLogs: (logs: any[]) => void;
    onError?: (error: Error) => void;
  }) {
    try {
      return this.publicClient.watchContractEvent({
        address: params.address,
        abi: params.abi,
        eventName: params.eventName,
        onLogs: params.onLogs,
        onError: params.onError,
      });
    } catch (error) {
      console.error('Watch contract event error:', error);
      throw error;
    }
  }

  /**
   * Watch blocks
   */
  watchBlocks(onBlock: (block: any) => void, onError?: (error: Error) => void) {
    return this.publicClient.watchBlocks({
      onBlock,
      onError,
    });
  }

  // ============ UTILITY OPERATIONS ============

  /**
   * Format wei to ether
   */
  formatEther(wei: bigint): string {
    return formatEther(wei);
  }

  /**
   * Format token amount
   */
  formatUnits(value: bigint, decimals: number): string {
    return formatUnits(value, decimals);
  }

  /**
   * Get public client
   */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  /**
   * Get wallet client
   */
  getWalletClient(): WalletClient | null {
    return this.walletClient;
  }

  /**
   * Get account
   */
  getAccount(): ReturnType<typeof privateKeyToAccount> | null {
    return this.account;
  }

  /**
   * Get configuration
   */
  getConfig(): BaseSdkConfig {
    return this.config;
  }
}

// Singleton instance for backend
let baseSdkInstance: BaseSdkService | null = null;

/**
 * Get or create Base SDK instance
 */
export function getBaseSdkInstance(config?: BaseSdkConfig): BaseSdkService {
  if (!baseSdkInstance && config) {
    baseSdkInstance = new BaseSdkService(config);
  }

  if (!baseSdkInstance) {
    throw new Error('Base SDK not initialized. Provide configuration.');
  }

  return baseSdkInstance;
}

/**
 * Initialize Base SDK for backend
 */
export function initializeBaseSdk(chainId: number = 8453): BaseSdkService {
  const config: BaseSdkConfig = {
    chainId,
    rpcUrl: chainId === 8453 
      ? process.env.BASE_RPC_URL || 'https://mainnet.base.org'
      : process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    wsUrl: chainId === 8453
      ? process.env.BASE_WS_URL
      : process.env.BASE_SEPOLIA_WS_URL,
    privateKey: process.env.PRIVATE_KEY,
    explorerApiUrl: chainId === 8453
      ? 'https://api.basescan.org/api'
      : 'https://api-sepolia.basescan.org/api',
    explorerApiKey: process.env.BASESCAN_API_KEY,
  };

  return getBaseSdkInstance(config);
}

export default BaseSdkService;
