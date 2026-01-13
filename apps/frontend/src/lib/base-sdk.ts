'use client';

import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  custom,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  type TransactionReceipt,
  parseAbi,
  encodeFunctionData,
  decodeFunctionResult
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';

// Base SDK Configuration
export interface BaseSdkConfig {
  chainId: number;
  rpcUrl: string;
  explorerApiUrl: string;
  explorerApiKey?: string;
  enableAnalytics?: boolean;
}

// Contract interaction types
export interface ContractCallParams {
  address: Address;
  abi: any[];
  functionName: string;
  args?: any[];
  value?: bigint;
}

export interface ContractReadResult<T = any> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export interface ContractWriteResult {
  hash: Hash | null;
  receipt: TransactionReceipt | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
}

// Base SDK Class
export class BaseSDK {
  private publicClient: PublicClient;
  private config: BaseSdkConfig;
  private analyticsEnabled: boolean;

  constructor(config: BaseSdkConfig) {
    this.config = config;
    this.analyticsEnabled = config.enableAnalytics ?? false;

    const chain = config.chainId === base.id ? base : baseSepolia;
    
    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    });
  }

  // Read contract data
  async readContract<T = any>(params: ContractCallParams): Promise<T> {
    try {
      const result = await this.publicClient.readContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
      });

      if (this.analyticsEnabled) {
        this.trackContractRead(params);
      }

      return result as T;
    } catch (error) {
      console.error('Contract read error:', error);
      throw error;
    }
  }

  // Batch read multiple contracts
  async readContractBatch<T = any>(calls: ContractCallParams[]): Promise<T[]> {
    try {
      const promises = calls.map(call => this.readContract<T>(call));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Batch contract read error:', error);
      throw error;
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations: this.config.chainId === base.id ? 2 : 1,
      });
      return receipt;
    } catch (error) {
      console.error('Transaction receipt error:', error);
      throw error;
    }
  }

  // Get block number
  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.publicClient.getBlockNumber();
    } catch (error) {
      console.error('Get block number error:', error);
      throw error;
    }
  }

  // Get gas price
  async getGasPrice(): Promise<bigint> {
    try {
      return await this.publicClient.getGasPrice();
    } catch (error) {
      console.error('Get gas price error:', error);
      throw error;
    }
  }

  // Estimate gas for transaction
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
      console.error('Gas estimation error:', error);
      throw error;
    }
  }

  // Watch contract events
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

  // Get contract logs
  async getContractLogs(params: {
    address: Address;
    abi: any[];
    eventName: string;
    fromBlock?: bigint;
    toBlock?: bigint;
  }) {
    try {
      return await this.publicClient.getContractEvents({
        address: params.address,
        abi: params.abi,
        eventName: params.eventName,
        fromBlock: params.fromBlock,
        toBlock: params.toBlock,
      });
    } catch (error) {
      console.error('Get contract logs error:', error);
      throw error;
    }
  }

  // Get balance
  async getBalance(address: Address): Promise<bigint> {
    try {
      return await this.publicClient.getBalance({ address });
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  // Get token balance (ERC20)
  async getTokenBalance(tokenAddress: Address, ownerAddress: Address): Promise<bigint> {
    try {
      const abi = parseAbi(['function balanceOf(address owner) view returns (uint256)']);
      return await this.readContract<bigint>({
        address: tokenAddress,
        abi,
        functionName: 'balanceOf',
        args: [ownerAddress],
      });
    } catch (error) {
      console.error('Get token balance error:', error);
      throw error;
    }
  }

  // Get token metadata (ERC20)
  async getTokenMetadata(tokenAddress: Address): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }> {
    try {
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
    } catch (error) {
      console.error('Get token metadata error:', error);
      throw error;
    }
  }

  // Analytics tracking
  private trackContractRead(params: ContractCallParams): void {
    if (typeof window !== 'undefined' && this.analyticsEnabled) {
      // Track contract read for analytics
      console.log('Contract read:', {
        address: params.address,
        functionName: params.functionName,
        timestamp: Date.now(),
      });
    }
  }

  // Get public client
  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  // Get SDK configuration
  getConfig(): BaseSdkConfig {
    return this.config;
  }
}

// React Hook for Base SDK
export function useBaseSDK() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address, chainId } = useAccount();

  const [sdk, setSdk] = useState<BaseSDK | null>(null);

  useEffect(() => {
    if (chainId && (chainId === base.id || chainId === baseSepolia.id)) {
      const config: BaseSdkConfig = {
        chainId,
        rpcUrl: chainId === base.id ? 'https://mainnet.base.org' : 'https://sepolia.base.org',
        explorerApiUrl: chainId === base.id 
          ? 'https://api.basescan.org/api' 
          : 'https://api-sepolia.basescan.org/api',
        explorerApiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY,
        enableAnalytics: true,
      };

      setSdk(new BaseSDK(config));
    }
  }, [chainId]);

  // Read contract
  const readContract = useCallback(
    async <T = any>(params: ContractCallParams): Promise<T | null> => {
      if (!sdk) return null;
      try {
        return await sdk.readContract<T>(params);
      } catch (error) {
        console.error('Read contract error:', error);
        return null;
      }
    },
    [sdk]
  );

  // Write contract
  const writeContract = useCallback(
    async (params: ContractCallParams): Promise<Hash | null> => {
      if (!walletClient || !address) {
        throw new Error('Wallet not connected');
      }

      try {
        const hash = await walletClient.writeContract({
          address: params.address,
          abi: params.abi,
          functionName: params.functionName,
          args: params.args,
          account: address,
          value: params.value,
          chain: chainId === base.id ? base : baseSepolia,
        });

        return hash;
      } catch (error) {
        console.error('Write contract error:', error);
        throw error;
      }
    },
    [walletClient, address, chainId]
  );

  // Wait for transaction
  const waitForTransaction = useCallback(
    async (hash: Hash): Promise<TransactionReceipt | null> => {
      if (!sdk) return null;
      try {
        return await sdk.getTransactionReceipt(hash);
      } catch (error) {
        console.error('Wait for transaction error:', error);
        return null;
      }
    },
    [sdk]
  );

  // Estimate gas
  const estimateGas = useCallback(
    async (params: ContractCallParams): Promise<bigint | null> => {
      if (!sdk || !address) return null;
      try {
        return await sdk.estimateGas({ ...params, account: address });
      } catch (error) {
        console.error('Estimate gas error:', error);
        return null;
      }
    },
    [sdk, address]
  );

  return {
    sdk,
    readContract,
    writeContract,
    waitForTransaction,
    estimateGas,
    publicClient,
    walletClient,
    isReady: !!sdk && !!publicClient,
  };
}

// Hook for contract write with state management
export function useContractWrite() {
  const { writeContract, waitForTransaction } = useBaseSDK();
  const [state, setState] = useState<ContractWriteResult>({
    hash: null,
    receipt: null,
    error: null,
    isLoading: false,
    isSuccess: false,
  });

  const write = useCallback(
    async (params: ContractCallParams) => {
      setState({ hash: null, receipt: null, error: null, isLoading: true, isSuccess: false });

      try {
        const hash = await writeContract(params);
        if (!hash) {
          throw new Error('Failed to get transaction hash');
        }

        setState(prev => ({ ...prev, hash }));

        const receipt = await waitForTransaction(hash);
        if (!receipt) {
          throw new Error('Failed to get transaction receipt');
        }

        setState({
          hash,
          receipt,
          error: null,
          isLoading: false,
          isSuccess: receipt.status === 'success',
        });

        return { hash, receipt };
      } catch (error) {
        setState({
          hash: null,
          receipt: null,
          error: error as Error,
          isLoading: false,
          isSuccess: false,
        });
        throw error;
      }
    },
    [writeContract, waitForTransaction]
  );

  const reset = useCallback(() => {
    setState({
      hash: null,
      receipt: null,
      error: null,
      isLoading: false,
      isSuccess: false,
    });
  }, []);

  return {
    write,
    reset,
    ...state,
  };
}

export default BaseSDK;
