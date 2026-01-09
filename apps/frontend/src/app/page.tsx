'use client';

import { AuctionList } from '@/components/auction/AuctionList';
import { Hero } from '@/components/layout/Hero';
import { WalletStatus } from '@/components/WalletStatus';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { useWalletConnection } from '@/lib/wallet';

export default function Home() {
  const { isConnected } = useWalletConnection();

  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Auctions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Active Auctions</h2>
              <AuctionList />
            </div>
          </div>

          {/* Sidebar - Wallet & Network Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Status */}
            <WalletStatus />
            
            {/* Network Switcher */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <NetworkSwitcher />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Wallet Features</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                      </svg>
                      <span>Multi-wallet support</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                      </svg>
                      <span>Network switching</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                      </svg>
                      <span>Auto-connect</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Supported Networks */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Supported Networks</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Base Mainnet</span>
                    </div>
                    <span className="text-xs text-green-600">Recommended</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Base Sepolia</span>
                    </div>
                    <span className="text-xs text-yellow-600">Testnet</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm font-medium">Ethereum Mainnet</span>
                    </div>
                    <span className="text-xs text-gray-600">Compatible</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Ethereum Sepolia</span>
                    </div>
                    <span className="text-xs text-yellow-600">Testnet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
