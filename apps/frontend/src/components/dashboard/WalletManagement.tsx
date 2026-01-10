'use client';

import { useState } from 'react';
import { useUserProfile } from '@/lib/user-profile';

export function WalletManagement() {
  const { 
    connectedWallets, 
    connectWallet, 
    disconnectWallet, 
    setPrimaryWallet, 
    getWalletBalance,
    formatAddress,
    formatCurrency,
    totalPortfolioValue
  } = useUserProfile();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<string>('');

  const walletTypes = [
    { 
      id: 'metamask', 
      name: 'MetaMask', 
      icon: '🦊',
      description: 'Most popular browser wallet',
      isInstalled: typeof window !== 'undefined' && window.ethereum?.isMetaMask
    },
    { 
      id: 'walletconnect', 
      name: 'WalletConnect', 
      icon: '🔗',
      description: 'Connect mobile wallets',
      isInstalled: true
    },
    { 
      id: 'coinbase', 
      name: 'Coinbase Wallet', 
      icon: '💙',
      description: 'Secure crypto wallet',
      isInstalled: typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet
    },
    { 
      id: 'phantom', 
      name: 'Phantom', 
      icon: '👻',
      description: 'Solana ecosystem wallet',
      isInstalled: false
    }
  ];

  const handleConnectWallet = async (walletType: string) => {
    try {
      await connectWallet(walletType as any);
      setShowConnectModal(false);
      setSelectedWalletType('');
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleDisconnectWallet = async (walletId: string) => {
    try {
      await disconnectWallet(walletId);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    try {
      await setPrimaryWallet(walletId);
    } catch (error) {
      console.error('Error setting primary wallet:', error);
    }
  };

  const getWalletIcon = (type: string) => {
    const wallet = walletTypes.find(w => w.id === type);
    return wallet ? wallet.icon : '👛';
  };

  const getNetworkColor = (chainId: number) => {
    const networks: Record<number, string> = {
      1: '#627EEA', // Ethereum Mainnet
      137: '#8247E9', // Polygon
      56: '#F0B90B', // BSC
      43114: '#2D3748', // Avalanche
      42161: '#2D3748' // Arbitrum
    };
    return networks[chainId] || '#6B7280';
  };

  const getNetworkName = (chainId: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      137: 'Polygon',
      56: 'BSC',
      43114: 'Avalanche',
      42161: 'Arbitrum'
    };
    return networks[chainId] || 'Unknown Network';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connected Wallets</h2>
        <p className="text-gray-600">Manage your connected wallets and view portfolio balances</p>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium mb-1">Total Portfolio Value</h3>
            <p className="text-3xl font-bold">{formatCurrency(totalPortfolioValue)}</p>
            <p className="text-blue-100 text-sm mt-2">
              Across {connectedWallets.filter(w => w.isConnected).length} connected wallet{connectedWallets.filter(w => w.isConnected).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <span className="text-3xl">💰</span>
          </div>
        </div>
      </div>

      {/* Connect Wallet Button */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Add New Wallet</h3>
            <p className="text-sm text-gray-600">Connect additional wallets to manage your assets</p>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>

      {/* Connected Wallets */}
      <div className="space-y-4">
        {connectedWallets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👛</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallets Connected</h3>
            <p className="text-gray-600 mb-4">Connect your first wallet to get started</p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          connectedWallets.map((wallet) => (
            <div key={wallet.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {getWalletIcon(wallet.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-gray-900">{wallet.name}</h4>
                      {wallet.isPrimary && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Primary
                        </span>
                      )}
                      {wallet.isConnected && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Connected
                        </span>
                      )}
                      {!wallet.isConnected && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Disconnected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-mono">
                      {formatAddress(wallet.address)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!wallet.isPrimary && wallet.isConnected && (
                    <button
                      onClick={() => handleSetPrimary(wallet.id)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Set Primary
                    </button>
                  )}
                  {wallet.isConnected ? (
                    <button
                      onClick={() => handleDisconnectWallet(wallet.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectWallet(wallet.type)}
                      className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-200 rounded-lg hover:bg-green-50"
                    >
                      Reconnect
                    </button>
                  )}
                </div>
              </div>

              {/* Wallet Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Balance</div>
                  <div className="text-lg font-bold text-gray-900">
                    {parseFloat(wallet.balance).toFixed(4)} ETH
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(
                      wallet.tokenBalances.reduce((sum, token) => sum + token.valueUSD, 0)
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Network</div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getNetworkColor(wallet.chainId) }}
                    />
                    <div className="text-lg font-bold text-gray-900">
                      {getNetworkName(wallet.chainId)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Chain ID: {wallet.chainId}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Last Connected</div>
                  <div className="text-lg font-bold text-gray-900">
                    {new Date(wallet.lastConnected).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(wallet.lastConnected).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Token Balances */}
              {wallet.tokenBalances.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Token Balances</h5>
                  <div className="space-y-2">
                    {wallet.tokenBalances.map((token, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <img 
                              src={token.icon} 
                              alt={token.tokenSymbol}
                              className="w-6 h-6 rounded-full"
                            />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {parseFloat(token.balance).toFixed(4)} {token.tokenSymbol}
                            </div>
                            <div className="text-sm text-gray-600">{token.tokenName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(token.valueUSD)}
                          </div>
                          <div className={`text-sm ${
                            token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Connect Wallet Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Wallet</h3>
            
            <div className="space-y-3">
              {walletTypes.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => wallet.isInstalled ? handleConnectWallet(wallet.id) : window.open(`https://${wallet.id}.io`, '_blank')}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{wallet.name}</div>
                        <div className="text-sm text-gray-600">{wallet.description}</div>
                      </div>
                    </div>
                    {!wallet.isInstalled && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Install
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
