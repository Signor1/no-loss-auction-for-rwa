'use client';

import { useState } from 'react';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { WalletStatus } from '@/components/WalletStatus';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { GasEstimator } from '@/components/GasEstimator';
import { TransactionTracker } from '@/components/TransactionTracker';
import { BaseExplorerIntegration, BaseNetworkStats } from '@/components/BaseExplorerIntegration';
import { useWalletConnection } from '@/lib/wallet';
import { useBaseNetwork } from '@/lib/base-network';

export default function WalletPage() {
  const { isConnected, address } = useWalletConnection();
  const { currentNetwork, isCorrectNetwork } = useBaseNetwork();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'gas' | 'explorer' | 'settings'>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet & Base Network</h1>
          <p className="mt-2 text-gray-600">
            Manage your wallet connection, network settings, gas estimation, and explore Base ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Connection & Network */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Wallet Connection */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection</h2>
                <WalletConnectButton />
              </div>

              {/* Network Status */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Network</h2>
                <NetworkSwitcher />
              </div>

              {/* Quick Stats */}
              {isConnected && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="text-sm font-medium text-green-600">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Network</span>
                        <span className="text-sm font-medium">{currentNetwork?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Optimized</span>
                        <span className={`text-sm font-medium ${isCorrectNetwork ? 'text-green-600' : 'text-orange-600'}`}>
                          {isCorrectNetwork ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Wallet Type</span>
                        <span className="text-sm font-medium">EVM</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Base Network Stats */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Base Network</h2>
                <BaseNetworkStats />
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'transactions', label: 'Transactions' },
                    { id: 'gas', label: 'Gas Estimation' },
                    { id: 'explorer', label: 'Base Explorer' },
                    { id: 'settings', label: 'Settings' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-6 text-sm font-medium border-b-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'transactions' && <TransactionsTab />}
                {activeTab === 'gas' && <GasTab />}
                {activeTab === 'explorer' && <ExplorerTab />}
                {activeTab === 'settings' && <SettingsTab />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  const { isConnected } = useWalletConnection();
  const { currentNetwork, isCorrectNetwork } = useBaseNetwork();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Wallet Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Security Tips</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                </svg>
                <span>Never share your private key or seed phrase</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                </svg>
                <span>Always verify transaction details before signing</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="h-4 w-4 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
                </svg>
                <span>Use hardware wallets for maximum security</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Base Network Benefits</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Lower gas fees compared to Ethereum</li>
              <li>• Fast transaction finality (~2s blocks)</li>
              <li>• Native RWA token support</li>
              <li>• Growing DeFi ecosystem</li>
              <li>• Ethereum L2 security</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Network Status */}
      {isConnected && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Network Status</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Current Network</span>
                <div className="text-lg font-semibold text-gray-900">
                  {currentNetwork?.name || 'Unknown'}
                </div>
                <div className={`text-sm ${isCorrectNetwork ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCorrectNetwork ? '✓ Optimized for Base' : '⚠ Not optimized'}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Connection Health</span>
                <div className="text-lg font-semibold text-green-600">Excellent</div>
                <div className="text-sm text-gray-600">All systems operational</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionsTab() {
  return (
    <div className="space-y-6">
      <TransactionTracker />
    </div>
  );
}

function GasTab() {
  return (
    <div className="space-y-6">
      <GasEstimator />
    </div>
  );
}

function ExplorerTab() {
  return (
    <div className="space-y-6">
      <BaseExplorerIntegration />
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Wallet Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-connect</p>
              <p className="text-xs text-gray-500">Automatically connect your wallet on page load</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="sr-only">Enable auto-connect</span>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">Get notified about transactions and auctions</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
              <span className="sr-only">Enable notifications</span>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Gas Price Alert</p>
              <p className="text-xs text-gray-500">Alert when gas prices are low</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="sr-only">Enable gas alerts</span>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Base Network Optimization</p>
              <p className="text-xs text-gray-500">Optimize for Base network features</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
              <span className="sr-only">Enable Base optimization</span>
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Default Gas Limit</label>
              <input
                type="number"
                defaultValue="21000"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Gas Price Gwei</label>
              <input
                type="number"
                step="0.1"
                defaultValue="0.5"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Slippage Tolerance (%)</label>
              <input
                type="number"
                step="0.1"
                defaultValue="0.5"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
