'use client';

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  type TransactionReceipt,
  type Log,
  parseAbi,
  encodeFunctionData,
  decodeFunctionResult,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { usePublicClient, useWalletClient, useAccount, useChainId } from 'wagmi';
import { useState, useEffect, useCallback, useMemo } from 'react';

// ============ TYPES ============

export interface BaseSdkConfig {
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  enableCache?: boolean;
  cacheTime?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ContractCallParams {
  address: Address;
  abi: any[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  account?: Address;
}

export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  value?: bigint;
}

export interface EventFilter {
  address?: Address | Address[];
  eventName?: string;
  fromBlock?: bigint | 'latest' | 'earliest' | 'pending';
  toBlock?: bigint | 'latest' | 'earliest' | 'pending';
  args?: any;
}

export interface ContractEventLog extends Log {
  args?: any;
  eventName?: string;
}

export interface BatchReadCall {
  address: Address;
  abi: any[];
  functionName: string;
  args?: readonly unknown[];
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost: bigint;
  totalCostFormatted: string;
}

// ============ BASE SDK CLASS ============

export class BaseSDK {
  private publicClient: PublicClient;
  private config: BaseSdkConfig;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor(config: BaseSdkConfig) {
    this.config = {
      enableCache: true,
      cacheTime: 30000, // 30 seconds default
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    const chain = config.chainId === base.id ? base : baseSepolia;

    this.publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl, {
        retryCount: this.config.retryAttempts,
        retryDelay: this.config.retryDelay,
      }),
    });

    this.cache = new Map();
  }

  // ============ CACHE METHODS ============

  private getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.config.enableCache) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > (this.config.cacheTime || 30000)) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    if (!this.config.enableCache) return;
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ============ READ OPERATIONS ============

  async readContract<T = any>(params: ContractCallParams): Promise<T> {
    const cacheKey = this.getCacheKey('readContract', params);
    const cached = this.getFromCache<T>(cacheKey);
    if (cached !== null) return cached;

    try {
      const result = await this.publicClient.readContract({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
      });

      this.setCache(cacheKey, result);
      return result as T;
    } catch (error) {
      console.error('[BaseSDK] Read contract error:', error);
      throw this.handleError(error);
    }
  }

  async batchReadContracts<T = any>(calls: BatchReadCall[]): Promise<T[]> {
    try {
      const results = await Promise.all(
        calls.map((call) =>
          this.publicClient.readContract({
            address: call.address,
            abi: call.abi,
            functionName: call.functionName,
            args: call.args,
          })
        )
      );

      return results as T[];
    } catch (error) {
      console.error('[BaseSDK] Batch read error:', error);
      throw this.handleError(error);
    }
  }

  async multicall<T = any>(calls: BatchReadCall[]): Promise<T[]> {
    return this.batchReadContracts<T>(calls);
  }

  // ============ BALANCE OPERATIONS ============

  async getBalance(address: Address): Promise<bigint> {
    const cacheKey = this.getCacheKey('getBalance', { address });
    const cached = this.getFromCache<bigint>(cacheKey);
    if (cached !== null) return cached;

    try {
      const balance = await this.publicClient.getBalance({ address });
      this.setCache(cacheKey, balance);
      return balance;
    } catch (error) {
      console.error('[BaseSDK] Get balance error:', error);
      throw this.handleError(error);
    }
  }

  async getBalanceFormatted(address: Address): Promise<string> {
    const balance = await this.getBalance(address);
    return formatEther(balance);
  }

  async getTokenBalance(tokenAddress: Address, ownerAddress: Address): Promise<bigint> {
    const abi = parseAbi(['function balanceOf(address) view returns (uint256)']);
    return this.readContract<bigint>({
      address: tokenAddress,
      abi,
      functionName: 'balanceOf',
      args: [ownerAddress],
    });
  }

  async getTokenBalanceFormatted(
    tokenAddress: Address,
    ownerAddress: Address,
    decimals: number = 18
  ): Promise<string> {
    const balance = await this.getTokenBalance(tokenAddress, ownerAddress);
    return formatUnits(balance, decimals);
  }

  // ============ TOKEN METADATA ============

  async getTokenMetadata(tokenAddress: Address): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
  }> {
    const cacheKey = this.getCacheKey('getTokenMetadata', { tokenAddress });
    const cached = this.getFromCache<any>(cacheKey);
    if (cached !== null) return cached;

    try {
      const abi = parseAbi([
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
      ]);

      const [name, symbol, decimals, totalSupply] = await this.batchReadContracts([
        { address: tokenAddress, abi, functionName: 'name' },
        { address: tokenAddress, abi, functionName: 'symbol' },
        { address: tokenAddress, abi, functionName: 'decimals' },
        { address: tokenAddress, abi, functionName: 'totalSupply' },
      ]);

      const metadata = {
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        totalSupply: totalSupply as bigint,
      };

      this.setCache(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('[BaseSDK] Get token metadata error:', error);
      throw this.handleError(error);
    }
  }

  // ============ GAS OPERATIONS ============

  async getGasPrice(): Promise<bigint> {
    const cacheKey = 'getGasPrice';
    const cached = this.getFromCache<bigint>(cacheKey);
    if (cached !== null) return cached;

    try {
      const gasPrice = await this.publicClient.getGasPrice();
      this.setCache(cacheKey, gasPrice);
      return gasPrice;
    } catch (error) {
      console.error('[BaseSDK] Get gas price error:', error);
      throw this.handleError(error);
    }
  }

  async estimateGas(params: ContractCallParams): Promise<bigint> {
    try {
      const gas = await this.publicClient.estimateGas({
        account: params.account,
        to: params.address,
        data: encodeFunctionData({
          abi: params.abi,
          functionName: params.functionName,
          args: params.args,
        }),
        value: params.value,
      });

      return gas;
    } catch (error) {
      console.error('[BaseSDK] Estimate gas error:', error);
      throw this.handleError(error);
    }
  }

  async estimateContractGas(params: ContractCallParams): Promise<GasEstimate> {
    try {
      const [gasLimit, feeData] = await Promise.all([
        this.estimateGas(params),
        this.publicClient.estimateFeesPerGas(),
      ]);

      const totalCost = gasLimit * (feeData.maxFeePerGas || 0n);

      return {
        gasLimit,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
        totalCost,
        totalCostFormatted: formatEther(totalCost),
      };
    } catch (error) {
      console.error('[BaseSDK] Estimate contract gas error:', error);
      throw this.handleError(error);
    }
  }

  async getFeeData() {
    const cacheKey = 'getFeeData';
    const cached = this.getFromCache<any>(cacheKey);
    if (cached !== null) return cached;

    try {
      const feeData = await this.publicClient.estimateFeesPerGas();
      this.setCache(cacheKey, feeData);
      return feeData;
    } catch (error) {
      console.error('[BaseSDK] Get fee data error:', error);
      throw this.handleError(error);
    }
  }

  // ============ BLOCK OPERATIONS ============

  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.publicClient.getBlockNumber();
    } catch (error) {
      console.error('[BaseSDK] Get block number error:', error);
      throw this.handleError(error);
    }
  }

  async getBlock(blockNumber?: bigint) {
    try {
      return await this.publicClient.getBlock({
        blockNumber: blockNumber || await this.getBlockNumber(),
      });
    } catch (error) {
      console.error('[BaseSDK] Get block error:', error);
      throw this.handleError(error);
    }
  }

  // ============ TRANSACTION OPERATIONS ============

  async getTransaction(hash: Hash) {
    const cacheKey = this.getCacheKey('getTransaction', { hash });
    const cached = this.getFromCache<any>(cacheKey);
    if (cached !== null) return cached;

    try {
      const tx = await this.publicClient.getTransaction({ hash });
      this.setCache(cacheKey, tx);
      return tx;
    } catch (error) {
      console.error('[BaseSDK] Get transaction error:', error);
      throw this.handleError(error);
    }
  }

  async getTransactionReceipt(hash: Hash): Promise<TransactionReceipt> {
    const cacheKey = this.getCacheKey('getTransactionReceipt', { hash });
    const cached = this.getFromCache<TransactionReceipt>(cacheKey);
    if (cached !== null) return cached;

    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash });
      this.setCache(cacheKey, receipt);
      return receipt;
    } catch (error) {
      console.error('[BaseSDK] Get transaction receipt error:', error);
      throw this.handleError(error);
    }
  }

  async waitForTransaction(hash: Hash, confirmations: number = 1): Promise<TransactionReceipt> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
      });
      return receipt;
    } catch (error) {
      console.error('[BaseSDK] Wait for transaction error:', error);
      throw this.handleError(error);
    }
  }

  async getTransactionCount(address: Address): Promise<number> {
    try {
      return await this.publicClient.getTransactionCount({ address });
    } catch (error) {
      console.error('[BaseSDK] Get transaction count error:', error);
      throw this.handleError(error);
    }
  }

  // ============ EVENT OPERATIONS ============

  async getLogs(filter: EventFilter): Promise<Log[]> {
    try {
      return await this.publicClient.getLogs({
        address: filter.address,
        fromBlock: filter.fromBlock,
        toBlock: filter.toBlock,
      });
    } catch (error) {
      console.error('[BaseSDK] Get logs error:', error);
      throw this.handleError(error);
    }
  }

  async getContractEvents(params: {
    address: Address;
    abi: any[];
    eventName: string;
    fromBlock?: bigint;
    toBlock?: bigint;
    args?: any;
  }): Promise<ContractEventLog[]> {
    try {
      const logs = await this.publicClient.getContractEvents({
        address: params.address,
        abi: params.abi,
        eventName: params.eventName,
        fromBlock: params.fromBlock,
        toBlock: params.toBlock,
        args: params.args,
      });

      return logs as ContractEventLog[];
    } catch (error) {
      console.error('[BaseSDK] Get contract events error:', error);
      throw this.handleError(error);
    }
  }

  watchContractEvent(params: {
    address: Address;
    abi: any[];
    eventName: string;
    onLogs: (logs: ContractEventLog[]) => void;
    onError?: (error: Error) => void;
  }) {
    try {
      return this.publicClient.watchContractEvent({
        address: params.address,
        abi: params.abi,
        eventName: params.eventName,
        onLogs: (logs) => params.onLogs(logs as ContractEventLog[]),
        onError: params.onError,
      });
    } catch (error) {
      console.error('[BaseSDK] Watch contract event error:', error);
      if (params.onError) {
        params.onError(this.handleError(error));
      }
    }
  }

  watchBlocks(onBlock: (block: any) => void, onError?: (error: Error) => void) {
    return this.publicClient.watchBlocks({
      onBlock,
      onError,
    });
  }

  // ============ UTILITY METHODS ============

  formatEther(value: bigint): string {
    return formatEther(value);
  }

  formatUnits(value: bigint, decimals: number): string {
    return formatUnits(value, decimals);
  }

  parseEther(value: string): bigint {
    return parseEther(value);
  }

  parseUnits(value: string, decimals: number): bigint {
    return parseUnits(value, decimals);
  }

  private handleError(error: any): Error {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }

  getPublicClient(): PublicClient {
    return this.publicClient;
  }

  getConfig(): BaseSdkConfig {
    return this.config;
  }
}

// ============ REACT HOOKS ============

export function useBaseSDK() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const sdk = useMemo(() => {
    if (!chainId || (chainId !== base.id && chainId !== baseSepolia.id)) {
      return null;
    }

    const config: BaseSdkConfig = {
      chainId,
      rpcUrl: chainId === base.id ? 'https://mainnet.base.org' : 'https://sepolia.base.org',
      explorerUrl: chainId === base.id ? 'https://basescan.org' : 'https://sepolia.basescan.org',
      enableCache: true,
      cacheTime: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    };

    return new BaseSDK(config);
  }, [chainId]);

  const readContract = useCallback(
    async <T = any>(params: ContractCallParams): Promise<T | null> => {
      if (!sdk) return null;
      return sdk.readContract<T>(params);
    },
    [sdk]
  );

  const batchReadContracts = useCallback(
    async <T = any>(calls: BatchReadCall[]): Promise<T[] | null> => {
      if (!sdk) return null;
      return sdk.batchReadContracts<T>(calls);
    },
    [sdk]
  );

  const writeContract = useCallback(
    async (params: ContractCallParams): Promise<Hash | null> => {
      if (!walletClient || !address) return null;

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
        console.error('[useBaseSDK] Write contract error:', error);
        throw error;
      }
    },
    [walletClient, address, chainId]
  );

  const waitForTransaction = useCallback(
    async (hash: Hash): Promise<TransactionReceipt | null> => {
      if (!sdk) return null;
      return sdk.waitForTransaction(hash);
    },
    [sdk]
  );

  const estimateGas = useCallback(
    async (params: ContractCallParams): Promise<GasEstimate | null> => {
      if (!sdk || !address) return null;
      return sdk.estimateContractGas({ ...params, account: address });
    },
    [sdk, address]
  );

  return {
    sdk,
    publicClient,
    walletClient,
    address,
    chainId,
    isReady: !!sdk,
    // Methods
    readContract,
    batchReadContracts,
    writeContract,
    waitForTransaction,
    estimateGas,
  };
}

export default BaseSDK;
