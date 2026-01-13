'use client';

import { type Address, type Hash } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Basescan API Configuration
export interface BasescanApiConfig {
  chainId: number;
  apiKey?: string;
  baseUrl: string;
}

// Transaction types
export interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export interface TokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

export interface ContractInfo {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

export interface AddressBalance {
  account: string;
  balance: string;
}

export interface GasPriceInfo {
  LastBlock: string;
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
  suggestBaseFee: string;
  gasUsedRatio: string;
}

// Basescan API Client
export class BasescanAPI {
  private config: BasescanApiConfig;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number = 60000; // 1 minute default

  constructor(config: BasescanApiConfig) {
    this.config = config;
    this.cache = new Map();
  }

  // Generic API call
  private async call<T = any>(params: Record<string, string>): Promise<T> {
    const cacheKey = JSON.stringify(params);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    const queryParams = new URLSearchParams({
      ...params,
      ...(this.config.apiKey && { apikey: this.config.apiKey }),
    });

    const url = `${this.config.baseUrl}?${queryParams.toString()}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '0' && data.message !== 'No transactions found') {
        throw new Error(data.result || 'API request failed');
      }

      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Basescan API error:', error);
      throw error;
    }
  }

  // Get transaction list by address
  async getTransactionsByAddress(
    address: Address,
    options?: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    }
  ): Promise<Transaction[]> {
    const result = await this.call<{ result: Transaction[] }>({
      module: 'account',
      action: 'txlist',
      address,
      startblock: options?.startBlock?.toString() || '0',
      endblock: options?.endBlock?.toString() || '99999999',
      page: options?.page?.toString() || '1',
      offset: options?.offset?.toString() || '100',
      sort: options?.sort || 'desc',
    });

    return result.result || [];
  }

  // Get internal transactions
  async getInternalTransactions(
    address: Address,
    options?: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    }
  ): Promise<Transaction[]> {
    const result = await this.call<{ result: Transaction[] }>({
      module: 'account',
      action: 'txlistinternal',
      address,
      startblock: options?.startBlock?.toString() || '0',
      endblock: options?.endBlock?.toString() || '99999999',
      page: options?.page?.toString() || '1',
      offset: options?.offset?.toString() || '100',
      sort: options?.sort || 'desc',
    });

    return result.result || [];
  }

  // Get ERC20 token transfers
  async getTokenTransfers(
    address: Address,
    contractAddress?: Address,
    options?: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    }
  ): Promise<TokenTransfer[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokentx',
      address,
      startblock: options?.startBlock?.toString() || '0',
      endblock: options?.endBlock?.toString() || '99999999',
      page: options?.page?.toString() || '1',
      offset: options?.offset?.toString() || '100',
      sort: options?.sort || 'desc',
    };

    if (contractAddress) {
      params.contractaddress = contractAddress;
    }

    const result = await this.call<{ result: TokenTransfer[] }>(params);
    return result.result || [];
  }

  // Get NFT (ERC721) transfers
  async getNFTTransfers(
    address: Address,
    contractAddress?: Address,
    options?: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    }
  ): Promise<TokenTransfer[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokennfttx',
      address,
      startblock: options?.startBlock?.toString() || '0',
      endblock: options?.endBlock?.toString() || '99999999',
      page: options?.page?.toString() || '1',
      offset: options?.offset?.toString() || '100',
      sort: options?.sort || 'desc',
    };

    if (contractAddress) {
      params.contractaddress = contractAddress;
    }

    const result = await this.call<{ result: TokenTransfer[] }>(params);
    return result.result || [];
  }

  // Get address balance
  async getBalance(address: Address): Promise<string> {
    const result = await this.call<{ result: string }>({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
    });

    return result.result;
  }

  // Get multiple address balances
  async getMultipleBalances(addresses: Address[]): Promise<AddressBalance[]> {
    const result = await this.call<{ result: AddressBalance[] }>({
      module: 'account',
      action: 'balancemulti',
      address: addresses.join(','),
      tag: 'latest',
    });

    return result.result || [];
  }

  // Get contract source code
  async getContractSourceCode(address: Address): Promise<ContractInfo[]> {
    const result = await this.call<{ result: ContractInfo[] }>({
      module: 'contract',
      action: 'getsourcecode',
      address,
    });

    return result.result || [];
  }

  // Get contract ABI
  async getContractABI(address: Address): Promise<string> {
    const result = await this.call<{ result: string }>({
      module: 'contract',
      action: 'getabi',
      address,
    });

    return result.result;
  }

  // Verify contract
  async verifyContract(params: {
    contractAddress: Address;
    sourceCode: string;
    contractName: string;
    compilerVersion: string;
    optimizationUsed: '0' | '1';
    runs?: number;
    constructorArguments?: string;
    evmVersion?: string;
    licenseType?: string;
  }): Promise<{ status: string; message: string; result: string }> {
    return await this.call({
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: params.contractAddress,
      sourceCode: params.sourceCode,
      codeformat: 'solidity-single-file',
      contractname: params.contractName,
      compilerversion: params.compilerVersion,
      optimizationUsed: params.optimizationUsed,
      runs: params.runs?.toString() || '200',
      constructorArguements: params.constructorArguments || '',
      evmversion: params.evmVersion || 'default',
      licenseType: params.licenseType || '1',
    });
  }

  // Get transaction status
  async getTransactionStatus(txHash: Hash): Promise<{
    isError: string;
    errDescription: string;
  }> {
    const result = await this.call<{
      result: { isError: string; errDescription: string };
    }>({
      module: 'transaction',
      action: 'getstatus',
      txhash: txHash,
    });

    return result.result;
  }

  // Get transaction receipt status
  async getTransactionReceiptStatus(txHash: Hash): Promise<{ status: string }> {
    const result = await this.call<{ result: { status: string } }>({
      module: 'transaction',
      action: 'gettxreceiptstatus',
      txhash: txHash,
    });

    return result.result;
  }

  // Get gas oracle
  async getGasOracle(): Promise<GasPriceInfo> {
    const result = await this.call<{ result: GasPriceInfo }>({
      module: 'gastracker',
      action: 'gasoracle',
    });

    return result.result;
  }

  // Get estimated confirmation time
  async getEstimatedConfirmationTime(gasPrice: string): Promise<string> {
    const result = await this.call<{ result: string }>({
      module: 'gastracker',
      action: 'gasestimate',
      gasprice: gasPrice,
    });

    return result.result;
  }

  // Get current block number
  async getBlockNumber(): Promise<string> {
    const result = await this.call<{ result: string }>({
      module: 'proxy',
      action: 'eth_blockNumber',
    });

    return result.result;
  }

  // Get block by number
  async getBlockByNumber(blockNumber: number): Promise<any> {
    const result = await this.call({
      module: 'proxy',
      action: 'eth_getBlockByNumber',
      tag: `0x${blockNumber.toString(16)}`,
      boolean: 'true',
    });

    return result.result;
  }

  // Get transaction by hash
  async getTransactionByHash(txHash: Hash): Promise<any> {
    const result = await this.call({
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash: txHash,
    });

    return result.result;
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash: Hash): Promise<any> {
    const result = await this.call({
      module: 'proxy',
      action: 'eth_getTransactionReceipt',
      txhash: txHash,
    });

    return result.result;
  }

  // Get token supply
  async getTokenSupply(contractAddress: Address): Promise<string> {
    const result = await this.call<{ result: string }>({
      module: 'stats',
      action: 'tokensupply',
      contractaddress: contractAddress,
    });

    return result.result;
  }

  // Get token balance by address
  async getTokenBalance(
    contractAddress: Address,
    address: Address
  ): Promise<string> {
    const result = await this.call<{ result: string }>({
      module: 'account',
      action: 'tokenbalance',
      contractaddress: contractAddress,
      address,
      tag: 'latest',
    });

    return result.result;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Set cache TTL
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }
}

// React Hook for Basescan API
export function useBasescanAPI(chainId?: number) {
  const effectiveChainId = chainId || base.id;

  const config: BasescanApiConfig = {
    chainId: effectiveChainId,
    apiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY,
    baseUrl:
      effectiveChainId === base.id
        ? 'https://api.basescan.org/api'
        : 'https://api-sepolia.basescan.org/api',
  };

  const api = new BasescanAPI(config);

  return {
    api,
    // Convenience methods
    getTransactions: (address: Address, options?: any) =>
      api.getTransactionsByAddress(address, options),
    getBalance: (address: Address) => api.getBalance(address),
    getTokenTransfers: (address: Address, contractAddress?: Address, options?: any) =>
      api.getTokenTransfers(address, contractAddress, options),
    getContractInfo: (address: Address) => api.getContractSourceCode(address),
    getGasOracle: () => api.getGasOracle(),
    getTransactionStatus: (txHash: Hash) => api.getTransactionStatus(txHash),
  };
}

export default BasescanAPI;
