'use client';

import { AuctionDiscovery } from '@/components/auction/AuctionDiscovery';
import { WalletStatus } from '@/components/WalletStatus';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { useWalletConnection } from '@/lib/wallet';
import { useBaseNetwork } from '@/lib/base-network';

export default function Home() {
  const { isConnected } = useWalletConnection();
  const { isCorrectNetwork } = useBaseNetwork();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Network Alert */}
      {isConnected && !isCorrectNetwork && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334 2.722 1.33 3.486 0l5.58-9.92c-.765-1.36-2.722-1.36-3.486 0z" clipRule="evenodd" />
                </svg>
                <span className="text-orange-800 font-medium">
                  Switch to Base Network for optimal experience
                </span>
              </div>
              <NetworkSwitcher />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Quick Info */}
        <div className="w-80 flex-shrink-0 p-6">
          <div className="space-y-6">
            {/* Wallet Status */}
            <WalletStatus />
            
            {/* Quick Stats */}
            {isConnected && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Network</span>
                    <span className="text-sm font-medium">Base</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gas Fees</span>
                    <span className="text-sm font-medium text-green-600">Low</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Block Time</span>
                    <span className="text-sm font-medium">~2s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Security</span>
                    <span className="text-sm font-medium text-green-600">Ethereum L2</span>
                  </div>
                </div>
              </div>
            )}

            {/* Base Benefits */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Base Benefits</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-start space-x-2">
                  <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                  </svg>
                  <span>90% lower gas fees</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                  </svg>
                  <span>2-second block times</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                  </svg>
                  <span>Ethereum L2 security</span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                  </svg>
                  <span>Native RWA support</span>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <span className="text-lg">🏠</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Real Estate</div>
                    <div className="text-xs text-gray-500">Property tokenization</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <span className="text-lg">🎨</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Art & Collectibles</div>
                    <div className="text-xs text-gray-500">Digital assets</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <span className="text-lg">📈</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Commodities</div>
                    <div className="text-xs text-gray-500">Physical assets</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <span className="text-lg">💡</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Intellectual Property</div>
                    <div className="text-xs text-gray-500">Patents & trademarks</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <span className="text-lg">💰</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Financial Instruments</div>
                    <div className="text-xs text-gray-500">Tokens & securities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Auction Discovery */}
        <div className="flex-1">
          <AuctionDiscovery />
        </div>
      </div>
    </main>
  );
}
