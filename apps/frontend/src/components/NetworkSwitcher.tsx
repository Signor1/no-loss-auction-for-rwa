'use client';

import { useState } from 'react';
import { useWalletConnection } from '@/lib/wallet';
import { base, baseSepolia } from '@/lib/wagmi';

export function NetworkSwitcher() {
  const { switchToBase, switchToBaseSepolia, getCurrentChain, isSwitchingChain } = useWalletConnection();
  const [isExpanded, setIsExpanded] = useState(false);

  const currentChain = getCurrentChain();
  const networks = [
    {
      name: 'Base Mainnet',
      chain: base,
      icon: '/networks/base.svg',
      color: 'green',
      description: 'Production network',
    },
    {
      name: 'Base Sepolia',
      chain: baseSepolia,
      icon: '/networks/base-sepolia.svg',
      color: 'yellow',
      description: 'Test network',
    },
  ];

  const handleNetworkSwitch = async (chainId: number) => {
    setIsExpanded(false);
    try {
      if (chainId === base.id) {
        await switchToBase();
      } else if (chainId === baseSepolia.id) {
        await switchToBaseSepolia();
      }
    } catch (error) {
      console.error('Network switch failed:', error);
      // You could show a toast notification here
    }
  };

  const isCurrentNetwork = (chainId: number) => {
    return currentChain?.id === chainId;
  };

  return (
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
            <img 
              src={networks.find(n => n.chain.id === currentChain?.id)?.icon || '/networks/unknown.svg'}
              alt="Network"
              className="w-5 h-5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/networks/unknown.svg';
              }}
            />
            <span>{currentChain?.name || 'Unknown Network'}</span>
          </>
        )}
        
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Network Dropdown */}
      {isExpanded && (
        <>
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Select Network</p>
                <p className="text-xs text-gray-500">Choose the blockchain network</p>
              </div>
              
              <div className="py-1">
                {networks.map((network) => {
                  const isCurrent = isCurrentNetwork(network.chain.id);
                  return (
                    <button
                      key={network.chain.id}
                      onClick={() => handleNetworkSwitch(network.chain.id)}
                      disabled={isCurrent || isSwitchingChain}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCurrent ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img 
                            src={network.icon}
                            alt={network.name}
                            className="w-6 h-6"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/networks/unknown.svg';
                            }}
                          />
                          {isCurrent && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-8-8a1 1 0 011.414 0L8 9.586l7.293-7.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{network.name}</span>
                            <div className={`w-2 h-2 rounded-full ${
                              network.color === 'green' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                          </div>
                          <div className="text-xs text-gray-500">{network.description}</div>
                        </div>
                        
                        {isCurrent && (
                          <span className="text-xs text-blue-600 font-medium">Current</span>
                        )}
                      </div>
                    </button>
                  );
                })}
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
  );
}
