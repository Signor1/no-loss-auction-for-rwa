'use client';

import { useState } from 'react';
import { useWalletConnection } from '@/lib/wallet';
import { SUPPORTED_WALLETS, WalletInfo } from '@/lib/wallet';
import { useNetworkDetection } from '@/lib/wallet';

export function WalletConnectButton() {
  const {
    address,
    isConnected,
    connector,
    isPending,
    isAutoConnecting,
    connectWallet,
    disconnectWallet,
    switchToBase,
    switchToBaseSepolia,
    getCurrentChain,
    isBaseNetwork,
  } = useWalletConnection();
  
  const network = useNetworkDetection();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNetworkSwitch, setShowNetworkSwitch] = useState(false);

  const currentChain = getCurrentChain();
  const connectedWalletName = connector?.name || 'Unknown Wallet';

  const handleConnect = async (wallet: WalletInfo) => {
    setIsDropdownOpen(false);
    try {
      await connectWallet(wallet);
    } catch (error) {
      console.error('Connection failed:', error);
      // You could show a toast notification here
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const handleNetworkSwitch = async (isTestnet: boolean) => {
    setShowNetworkSwitch(false);
    try {
      if (isTestnet) {
        await switchToBaseSepolia();
      } else {
        await switchToBase();
      }
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isAutoConnecting) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Auto-connecting wallet...</span>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        {/* Connected Wallet Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {connectedWalletName.charAt(0)}
            </span>
          </div>
          <span className="hidden sm:block">{formatAddress(address)}</span>
          
          {/* Network Indicator */}
          {network && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
              network.isTestnet 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                network.isTestnet ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span>{network.name}</span>
            </div>
          )}
          
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              {/* Account Info */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Connected Wallet</p>
                <p className="text-xs text-gray-500">{connectedWalletName}</p>
                <p className="text-xs font-mono text-gray-600 mt-1">{formatAddress(address)}</p>
              </div>

              {/* Network Switch */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 mb-2">Network</p>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNetworkSwitch(false)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                      !network?.isTestnet 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Base Mainnet</span>
                      {!network?.isTestnet && <span className="text-green-600 text-xs">✓</span>}
                    </div>
                  </button>
                  <button
                    onClick={() => handleNetworkSwitch(true)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                      network?.isTestnet 
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Base Sepolia</span>
                      {network?.isTestnet && <span className="text-yellow-600 text-xs">✓</span>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Disconnect Button */}
              <div className="px-4 py-2">
                <button
                  onClick={handleDisconnect}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connect Wallet Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isPending}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Connecting...</span>
          </div>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      {/* Wallet Selection Dropdown */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-gray-900 mb-3">Select Wallet</p>
              <div className="space-y-2">
                {SUPPORTED_WALLETS.map((wallet) => (
                  <button
                    key={wallet.connectorId}
                    onClick={() => handleConnect(wallet)}
                    disabled={!wallet.isInstalled && wallet.connectorId !== 'walletConnect'}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img 
                      src={wallet.icon} 
                      alt={wallet.name}
                      className="w-6 h-6"
                      onError={(e) => {
                        // Fallback for missing wallet icons
                        (e.target as HTMLImageElement).src = '/wallets/default.svg';
                      }}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{wallet.name}</div>
                      {!wallet.isInstalled && wallet.connectorId !== 'walletConnect' && (
                        <div className="text-xs text-gray-500">Not installed</div>
                      )}
                    </div>
                    {wallet.isInstalled || wallet.connectorId === 'walletConnect' ? (
                      <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8a1 1 0 011.414 0L8 9.586l7.293-7.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
