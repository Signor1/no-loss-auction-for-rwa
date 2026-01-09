'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useChainId, useEstimateGas, useGasPrice, useFeeData } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { formatEther, formatUnits } from 'viem';

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
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockTime: number;
  gasOptimization: string;
}

export const BASE_NETWORKS: NetworkInfo[] = [
  {
    chain: base,
    name: 'Base Mainnet',
    isTestnet: false,
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
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
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockTime: 2, // ~2 seconds
    gasOptimization: '99% lower than Ethereum Mainnet',
  },
];

export function useBaseNetwork() {
  const { address, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();
  const { data: feeData } = useFeeData();
  const { data: gasPrice } = useGasPrice();

  const [currentNetwork, setCurrentNetwork] = useState<NetworkInfo | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

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

  const estimateTransactionGas = async (to: string, data?: string, value?: bigint): Promise<GasEstimate> => {
    try {
      const { estimateGas } = await import('viem');
      
      const gasLimit = await estimateGas(
        currentNetwork?.chain.client || base.client,
        {
          account: address as `0x${string}`,
          to: to as `0x${string}`,
          data: data as `0x${string}` | undefined,
          value: value,
        }
      );

      const gasPriceValue = feeData?.gasPrice || gasPrice || BigInt('1000000000'); // 1 gwei fallback
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

  const getExplorerUrl = (type: 'tx' | 'address' | 'token', value: string): string => {
    if (!currentNetwork) return '';
    
    const baseUrl = currentNetwork.explorerUrl;
    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'address':
        return `${baseUrl}/address/${value}`;
      case 'token':
        return `${baseUrl}/token/${value}`;
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
