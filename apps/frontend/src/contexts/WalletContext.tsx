'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface WalletContextType {
  isConnected: boolean;
  address: string | undefined;
  connector: any;
  isConnecting: boolean;
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-connect logic
  useEffect(() => {
    const attemptAutoConnect = async () => {
      const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
      if (lastConnectedWallet && !isConnected && !isPending) {
        setIsConnecting(true);
        try {
          const connector = connectors.find(c => c.id === lastConnectedWallet);
          if (connector) {
            await connect({ connector });
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          localStorage.removeItem('lastConnectedWallet');
        } finally {
          setIsConnecting(false);
        }
      }
    };

    // Small delay to ensure wallet is ready
    const timer = setTimeout(attemptAutoConnect, 100);
    return () => clearTimeout(timer);
  }, [connectors, isConnected, isPending, connect]);

  const handleConnect = async (walletType: string) => {
    setIsConnecting(true);
    try {
      const connector = connectors.find(c => c.id === walletType);
      if (connector) {
        await connect({ connector });
        localStorage.setItem('lastConnectedWallet', walletType);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem('lastConnectedWallet');
    } catch (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
  };

  const handleSwitchNetwork = async (chainId: number) => {
    try {
      // This would need to be implemented with actual chain switching logic
      console.log('Switching to network:', chainId);
    } catch (error) {
      console.error('Network switch failed:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    isConnected,
    address,
    connector,
    isConnecting: isConnecting || isPending,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}
