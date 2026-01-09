'use client';

import { useState } from 'react';
import { useWalletConnection } from '@/lib/wallet';
import { useBaseNetwork, BASE_NETWORKS } from '@/lib/base-network';
import { GasPriceTracker } from './GasEstimator';

export function NetworkSwitcher() {
  const { switchToBase, switchToBaseSepolia, getCurrentChain, isSwitchingChain } = useWalletConnection();
  const { currentNetwork, isCorrectNetwork, getExplorerUrl } = useBaseNetwork();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGasTracker, setShowGasTracker] = useState(false);

  const handleNetworkSwitch = async (chainId: number) => {
    setIsExpanded(false);
    try {
      if (chainId === 8453) { // Base Mainnet
        await switchToBase();
      } else if (chainId === 84532) { // Base Sepolia
        await switchToBaseSepolia();
      }
    } catch (error) {
      console.error('Network switch failed:', error);
      // You could show a toast notification here
    }
  };

  const isCurrentNetwork = (chainId: number) => {
    return currentNetwork?.chain.id === chainId;
  };

  const getNetworkStatus = (chainId: number) => {
    if (isCurrentNetwork(chainId)) return 'current';
    if (chainId === 8453) return 'recommended';
    return 'available';
  };

  const getNetworkColor = (status: string) => {
    switch (status) {
      case 'current': return 'border-green-500 bg-green-50';
      case 'recommended': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <span className="text-xs text-green-600 font-medium">Current</span>;
      case 'recommended':
        return <span className="text-xs text-blue-600 font-medium">Recommended</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="relative">
        {/* Current Network Display */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isSwitchingChain}
          className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSwitchingChain ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                currentNetwork?.isTestnet ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                <span className="text-white text-xs font-bold">
                  {currentNetwork?.name.charAt(0)}
                </span>
              </div>
              <span>{currentNetwork?.name || 'Unknown Network'}</span>
              
              {/* Network Status Indicator */}
              {!isCorrectNetwork && (
                <div className="w-2 h-2 bg-orange-500 rounded-full" title="Network not optimized"></div>
              )}
            </>
          )}
          
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Network Dropdown */}
        {isExpanded && (
          <>
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Select Network</p>
                  <p className="text-xs text-gray-500">Choose blockchain network for optimal experience</p>
                </div>
                
                <div className="py-1">
                  {BASE_NETWORKS.map((network) => {
                    const status = getNetworkStatus(network.chain.id);
                    const isCurrent = isCurrentNetwork(network.chain.id);
                    
                    return (
                      <button
                        key={network.chain.id}
                        onClick={() => handleNetworkSwitch(network.chain.id)}
                        disabled={isCurrent || isSwitchingChain}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-2 ${getNetworkColor(status)}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              network.isTestnet ? 'bg-yellow-500' : 'bg-green-500'
                            }`}>
                              <span className="text-white text-sm font-bold">
                                {network.name.charAt(0)}
                              </span>
                            </div>
                            {isCurrent && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8a1 1 0 011.414 0L8 9.586l7.293-7.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">{network.name}</span>
                              {getStatusBadge(status)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {network.explorerUrl.replace('https://', '').split('/')[0]}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                network.isTestnet ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <span className="text-xs text-gray-600">
                                {network.isTestnet ? 'Testnet' : 'Mainnet'}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600">
                                {network.blockTime}s block time
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Network Information */}
                <div className="border-t border-gray-100 p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Why Base Network?</h4>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li className="flex items-start space-x-2">
                      <svg className="h-3 w-3 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                      </svg>
                      <span>90% lower gas fees than Ethereum</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg className="h-3 w-3 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                      </svg>
                      <span>2-second block times</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg className="h-3 w-3 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                      </svg>
                      <span>Ethereum L2 security</span>
                    </li>
                  </ul>
                </div>

                {/* Gas Tracker Toggle */}
                <div className="border-t border-gray-100 p-3">
                  <button
                    onClick={() => {
                      setShowGasTracker(true);
                      setIsExpanded(false);
                    }}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Gas Tracker
                  </button>
                </div>
              </div>
            </div>
            
            {/* Click outside to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsExpanded(false)}
            />
          </>
        )}
      </div>

      {/* Gas Tracker Modal */}
      {showGasTracker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gas Price Tracker</h3>
                <button
                  onClick={() => setShowGasTracker(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <GasPriceTracker />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
