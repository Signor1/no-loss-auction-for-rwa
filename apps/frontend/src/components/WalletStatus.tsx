'use client';

import { useWalletConnection } from '@/lib/wallet';
import { useNetworkDetection } from '@/lib/wallet';

export function WalletStatus() {
  const { address, isConnected, connector, isBaseNetwork } = useWalletConnection();
  const network = useNetworkDetection();

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        // You could show a toast notification here
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334 2.722 1.33 3.486 0l5.58-9.92c-.765-1.36-2.722-1.36-3.486 0z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">Wallet Not Connected</p>
            <p className="text-xs text-yellow-600">Connect your wallet to participate in auctions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">Connected</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            network?.isTestnet ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {network?.name || 'Unknown Network'}
          </div>
        </div>

        {/* Wallet Info */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Wallet</span>
            <span className="text-sm text-gray-600">{connector?.name || 'Unknown'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Address</span>
            <button
              onClick={copyAddress}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-mono"
              title="Copy address"
            >
              <span>{formatAddress(address || '')}</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v2m0 4h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 012-2h2zm0 4h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 012-2h2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Network Compatibility Warning */}
        {!isBaseNetwork() && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="h-5 w-5 text-orange-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334 2.722 1.33 3.486 0l5.58-9.92c-.765-1.36-2.722-1.36-3.486 0z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-orange-800">Network Mismatch</p>
                <p className="text-xs text-orange-600">
                  This app works best on Base network. Please switch to Base Mainnet or Base Sepolia for the best experience.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
