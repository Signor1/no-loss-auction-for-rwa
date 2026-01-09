'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain, useChains } from 'wagmi';
import { base, baseSepolia } from '@/lib/wagmi';
import { useEffect, useState } from 'react';

export interface WalletInfo {
  name: string;
  icon: string;
  connectorId: string;
  isInstalled: boolean;
}

export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    name: 'MetaMask',
    icon: '/wallets/metamask.svg',
    connectorId: 'metaMask',
    isInstalled: typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
  },
  {
    name: 'Coinbase Wallet',
    icon: '/wallets/coinbase.svg',
    connectorId: 'coinbaseWallet',
    isInstalled: typeof window !== 'undefined' && !!(window as any).coinbaseWalletExtension,
  },
  {
    name: 'Rainbow Wallet',
    icon: '/wallets/rainbow.svg',
    connectorId: 'rainbowWallet',
    isInstalled: typeof window !== 'undefined' && !!(window as any).rainbow,
  },
  {
    name: 'Base Wallet',
    icon: '/wallets/base.svg',
    connectorId: 'injected',
    isInstalled: typeof window !== 'undefined' && !!(window as any).base,
  },
  {
    name: 'WalletConnect',
    icon: '/wallets/walletconnect.svg',
    connectorId: 'walletConnect',
    isInstalled: true, // Always available via QR code
  },
];

export function useWalletConnection() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const chains = useChains();

  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  // Auto-connect on page load
  useEffect(() => {
    const attemptAutoConnect = async () => {
      if (typeof window === 'undefined') return;
      
      const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
      if (lastConnectedWallet && !isConnected && !isPending) {
        setIsAutoConnecting(true);
        try {
          const connector = connectors.find(c => c.id === lastConnectedWallet);
          if (connector) {
            await connect({ connector });
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          localStorage.removeItem('lastConnectedWallet');
        } finally {
          setIsAutoConnecting(false);
        }
      }
    };

    attemptAutoConnect();
  }, [connectors, isConnected, isPending]);

  const connectWallet = async (walletInfo: WalletInfo) => {
    try {
      setIsAutoConnecting(true);
      const connector = connectors.find(c => c.id === walletInfo.connectorId);
      if (connector) {
        await connect({ connector });
        localStorage.setItem('lastConnectedWallet', walletInfo.connectorId);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsAutoConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      localStorage.removeItem('lastConnectedWallet');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  };

  const switchToBase = async () => {
    try {
      await switchChain({ chainId: base.id });
    } catch (error) {
      console.error('Failed to switch to Base:', error);
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

  const getCurrentChain = () => {
    return chains.find(chain => chain.id === connector?.chainId);
  };

  const isBaseNetwork = () => {
    const currentChain = getCurrentChain();
    return currentChain?.id === base.id || currentChain?.id === baseSepolia.id;
  };

  return {
    // Connection state
    address,
    isConnected,
    connector,
    isPending,
    isAutoConnecting,
    isSwitchingChain,
    
    // Wallet actions
    connectWallet,
    disconnectWallet,
    
    // Chain management
    switchToBase,
    switchToBaseSepolia,
    getCurrentChain,
    isBaseNetwork,
    
    // Available wallets
    supportedWallets: SUPPORTED_WALLETS,
    availableConnectors: connectors,
  };
}

export function useNetworkDetection() {
  const [network, setNetwork] = useState<{
    name: string;
    isTestnet: boolean;
    chainId: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectNetwork = () => {
      if (window.ethereum) {
        const chainId = window.ethereum.chainId;
        if (chainId === '0x2105') {
          setNetwork({ name: 'Base', isTestnet: false, chainId: 8453 });
        } else if (chainId === '0x14a34') {
          setNetwork({ name: 'Base Sepolia', isTestnet: true, chainId: 84532 });
        } else if (chainId === '0x1') {
          setNetwork({ name: 'Ethereum Mainnet', isTestnet: false, chainId: 1 });
        } else if (chainId === '0xaa36a7') {
          setNetwork({ name: 'Ethereum Sepolia', isTestnet: true, chainId: 11155111 });
        }
      }
    };

    detectNetwork();

    // Listen for chain changes
    if (window.ethereum?.on) {
      window.ethereum.on('chainChanged', detectNetwork);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('chainChanged', detectNetwork);
      }
    };
  }, []);

  return network;
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
    coinbaseWalletExtension?: any;
    rainbow?: any;
    base?: any;
  }
}
