'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useChainId, useEstimateGas, useGasPrice, useFeeData, usePublicClient, useBalance } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { formatEther, formatUnits, parseEther } from 'viem';

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: string;
  estimatedCostUSD?: string;
}

export interface NetworkInfo {
  chain: typeof base | typeof baseSepolia;
  name: string;
  isTestnet: boolean;
  explorerUrl: string;
  rpcUrl: string;
  bridgeUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockTime: number;
  gasOptimization: string;
}

export interface NetworkHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastUpdated: number;
  syncStatus: 'synced' | 'syncing' | 'behind';
}

export const BASE_NETWORKS: NetworkInfo[] = [
  {
    chain: base,
    name: 'Base Mainnet',
    isTestnet: false,
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
    bridgeUrl: 'https://bridge.base.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockTime: 2, // ~2 seconds
    gasOptimization: '90% lower than Ethereum Mainnet',
  },
  {
    chain: baseSepolia,
    name: 'Base Sepolia Testnet',
    isTestnet: true,
    explorerUrl: 'https://sepolia.basescan.org',
    rpcUrl: 'https://sepolia.base.org',
    bridgeUrl: 'https://bridge.base.org/deposit?network=sepolia',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockTime: 2, // ~2 seconds
    gasOptimization: '99% lower than Ethereum Mainnet',
  },
];

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  description?: string;
}

export const BASE_TOKEN_METADATA: Record<string, TokenMetadata> = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  },
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  USDBC: {
    address: '0xd9aAEc2AD91705Cb33c32fA69097462C19216AFC',
    symbol: 'USDbC',
    name: 'USD Base Coin',
    decimals: 6,
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  CBETH: {
    address: '0x2Ae3F1Ec7F1F5Bc602e11a916E30d824d603a7e4',
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    decimals: 18,
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xbe9895146f7af43049ca1c1ae358b0541ea49704/logo.png',
  },
};

export const BASE_ECOSYSTEM_TOKENS = {
  USDC: BASE_TOKEN_METADATA.USDC.address,
  USDBC: BASE_TOKEN_METADATA.USDBC.address,
  CBETH: BASE_TOKEN_METADATA.CBETH.address,
};

export function useBaseNetwork() {
  const { address, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();
  const { data: feeData } = useFeeData();
  const { data: gasPrice } = useGasPrice();
  const publicClient = usePublicClient();

  const [currentNetwork, setCurrentNetwork] = useState<NetworkInfo | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [networkHealth, setNetworkHealth] = useState<NetworkHealth>({
    status: 'healthy',
    latency: 0,
    lastUpdated: Date.now(),
    syncStatus: 'synced'
  });

  // Determine current network
  useEffect(() => {
    const network = BASE_NETWORKS.find(n => n.chain.id === chainId);
    setCurrentNetwork(network || null);
    setIsCorrectNetwork(!!network);
  }, [chainId]);

  const switchToBase = async () => {
    try {
      await switchChain({ chainId: base.id });
    } catch (error) {
      console.error('Failed to switch to Base Mainnet:', error);
      throw error;
    }
  };

  const switchToBaseSepolia = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
    } catch (error) {
      console.error('Failed to switch to Base Sepolia:', error);
      throw error;
    }
  };

  const estimateTransactionGas = async (targetAddress: string, data?: string, value?: bigint): Promise<GasEstimate> => {
    try {
      if (!publicClient) throw new Error('Public client not available');

      const gasLimit = await publicClient.estimateGas({
        account: address as `0x${string}`,
        to: targetAddress as `0x${string}`,
        data: data as `0x${string}` | undefined,
        value: value,
      });

      const gasPriceValue = (feeData?.gasPrice ?? gasPrice ?? parseEther('0.000000001')) as bigint; // 1 gwei fallback
      const estimatedCost = gasLimit * gasPriceValue;

      return {
        gasLimit,
        gasPrice: gasPriceValue,
        maxFeePerGas: feeData?.maxFeePerGas,
        maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas,
        estimatedCost: formatEther(estimatedCost),
        estimatedCostUSD: estimateUSD(estimatedCost),
      };
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw error;
    }
  };

  const estimateUSD = (weiAmount: bigint): string => {
    // This would integrate with a price oracle API
    // For now, using a placeholder ETH price
    const ethPriceUSD = 2000; // Placeholder
    const ethAmount = parseFloat(formatEther(weiAmount));
    return (ethAmount * ethPriceUSD).toFixed(2);
  };

  const getExplorerUrl = (type: 'tx' | 'address' | 'token' | 'contract' | 'tokenBalance', value: string, extraValue?: string): string => {
    if (!currentNetwork) return '';

    const baseUrl = currentNetwork.explorerUrl;
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'address':
        return `${baseUrl}/address/${value}`;
      case 'token':
        return `${baseUrl}/token/${value}`;
      case 'contract':
        return `${baseUrl}/address/${value}#code`;
      case 'tokenBalance':
        return `${baseUrl}/token/${value}${extraValue ? `?a=${extraValue}` : ''}`;
      default:
        return baseUrl;
    }
  };

  return {
    // Network state
    currentNetwork,
    isCorrectNetwork,
    isSwitching,
    chainId,

    // Network actions
    switchToBase,
    switchToBaseSepolia,

    // Gas estimation
    estimateTransactionGas,
    feeData,
    gasPrice,

    // Utilities
    getExplorerUrl,
    BASE_NETWORKS,

    // Network status
    isConnected,
    address,
    networkHealth,
  };
}

export function useNetworkMonitor() {
  const chainId = useChainId();
  const [healthData, setHealthData] = useState<Record<number, NetworkHealth>>({});

  useEffect(() => {
    const monitorHealth = async () => {
      const network = BASE_NETWORKS.find(n => n.chain.id === chainId);
      if (!network) return;

      try {
        const start = Date.now();
        const response = await fetch(network.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] })
        });
        const latency = Date.now() - start;

        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (latency > 1000) status = 'unhealthy';
        else if (latency > 500) status = 'degraded';

        setHealthData(prev => ({
          ...prev,
          [chainId]: {
            status,
            latency,
            lastUpdated: Date.now(),
            syncStatus: response.ok ? 'synced' : 'behind'
          }
        }));
      } catch (error) {
        setHealthData(prev => ({
          ...prev,
          [chainId]: {
            status: 'unhealthy',
            latency: -1,
            lastUpdated: Date.now(),
            syncStatus: 'behind'
          }
        }));
      }
    };

    const interval = setInterval(monitorHealth, 30000); // Monitor every 30s
    monitorHealth();

    return () => clearInterval(interval);
  }, [chainId]);

  return {
    healthData,
    currentHealth: healthData[chainId] || {
      status: 'healthy',
      latency: 0,
      lastUpdated: Date.now(),
      syncStatus: 'synced'
    }
  };
}

export function useGasOptimization() {
  const [gasHistory, setGasHistory] = useState<Array<{
    timestamp: number;
    gasPrice: string;
    network: string;
  }>>([]);

  const addGasRecord = (gasPrice: string, network: string) => {
    setGasHistory(prev => [
      ...prev.slice(-99), // Keep last 100 records
      {
        timestamp: Date.now(),
        gasPrice,
        network,
      },
    ]);
  };

  const getOptimalGasTime = (): string => {
    if (gasHistory.length < 10) return 'Insufficient data';

    const sortedGas = [...gasHistory].sort((a, b) =>
      parseFloat(a.gasPrice) - parseFloat(b.gasPrice)
    );

    const lowestGas = sortedGas.slice(0, 10);
    const avgGas = lowestGas.reduce((sum, record) =>
      sum + parseFloat(record.gasPrice), 0
    ) / lowestGas.length;

    const hour = new Date().getHours();

    // Simple heuristic: lower gas during off-peak hours
    if (hour >= 2 && hour <= 6) return '2:00 AM - 6:00 AM (Lowest)';
    if (hour >= 22 || hour <= 2) return '10:00 PM - 2:00 AM (Low)';
    if (hour >= 10 && hour <= 14) return '10:00 AM - 2:00 PM (Medium)';
    return 'Current time (Recommended)';
  };

  return {
    gasHistory,
    addGasRecord,
    getOptimalGasTime,
  };
}

export function useEcosystemTokenBalances() {
  const { address } = useAccount();
  const { currentNetwork } = useBaseNetwork();

  const ethBalance = useBalance({
    address,
    chainId: currentNetwork?.chain.id,
  });

  const usdcBalance = useBalance({
    address,
    token: BASE_ECOSYSTEM_TOKENS.USDC as `0x${string}`,
    chainId: currentNetwork?.chain.id,
  });

  const usdbcBalance = useBalance({
    address,
    token: BASE_ECOSYSTEM_TOKENS.USDBC as `0x${string}`,
    chainId: currentNetwork?.chain.id,
  });

  const cbethBalance = useBalance({
    address,
    token: BASE_ECOSYSTEM_TOKENS.CBETH as `0x${string}`,
    chainId: currentNetwork?.chain.id,
  });

  return {
    balances: {
      ETH: ethBalance.data,
      USDC: usdcBalance.data,
      USDBC: usdbcBalance.data,
      CBETH: cbethBalance.data,
    },
    isLoading: ethBalance.isLoading || usdcBalance.isLoading || usdbcBalance.isLoading || cbethBalance.isLoading,
    isError: ethBalance.isError || usdcBalance.isError || usdbcBalance.isError || cbethBalance.isError,
    refresh: () => {
      ethBalance.refetch();
      usdcBalance.refetch();
      usdbcBalance.refetch();
      cbethBalance.refetch();
    }
  };
}
