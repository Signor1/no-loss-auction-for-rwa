'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useBaseNetwork } from '@/lib/base-network';

interface ExplorerData {
  address?: string;
  balance?: string;
  transactionCount?: number;
  tokenBalances?: Array<{
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    balance: string;
    decimals: number;
  }>;
  nfts?: Array<{
    contractAddress: string;
    tokenId: string;
    name: string;
    imageUrl?: string;
  }>;
}

interface ExplorerIntegrationProps {
  address?: string;
  showTokens?: boolean;
  showNFTs?: boolean;
  showTransactions?: boolean;
}

export function BaseExplorerIntegration({
  address: propAddress,
  showTokens = true,
  showNFTs = true,
  showTransactions = true
}: ExplorerIntegrationProps) {
  const { address: connectedAddress } = useAccount();
  const { currentNetwork, getExplorerUrl } = useBaseNetwork();
  const [data, setData] = useState<ExplorerData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'transactions'>('tokens');

  const address = propAddress || connectedAddress;

  useEffect(() => {
    if (address && currentNetwork) {
      loadExplorerData();
    }
  }, [address, currentNetwork]);

  const loadExplorerData = async () => {
    if (!address || !currentNetwork) return;

    setIsLoading(true);
    try {
      // This would integrate with BaseScan API
      // For now, using mock data
      const mockData: ExplorerData = {
        address,
        balance: '2.54321',
        transactionCount: 42,
        tokenBalances: [
          {
            tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
            tokenSymbol: 'USDC',
            tokenName: 'USD Coin',
            balance: '1000.50',
            decimals: 6,
          },
          {
            tokenAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            tokenSymbol: 'WETH',
            tokenName: 'Wrapped Ether',
            balance: '0.75',
            decimals: 18,
          },
        ],
        nfts: [
          {
            contractAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
            tokenId: '1',
            name: 'RWA Asset #1',
            imageUrl: '/api/placeholder/nft/1',
          },
          {
            contractAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
            tokenId: '2',
            name: 'RWA Asset #2',
            imageUrl: '/api/placeholder/nft/2',
          },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to load explorer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: string, decimals: number = 18) => {
    const value = parseFloat(balance);
    if (value < 0.001) return '< 0.001';
    return value.toFixed(4);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could show a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!address) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-center text-gray-500">Connect wallet to view Base explorer data</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Base Explorer</h3>
        <div className="flex items-center space-x-2">
          <a
            href={getExplorerUrl('address', address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View on BaseScan
          </a>
          <button
            onClick={loadExplorerData}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Address Overview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Address</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(address)}
                  className="text-gray-600 hover:text-gray-800"
                  title="Copy address"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v2m0 4h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <span className="text-sm font-mono text-gray-900">{formatAddress(address)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">ETH Balance</span>
                <div className="font-medium">{data.balance || '0'} ETH</div>
              </div>
              <div>
                <span className="text-gray-600">Transactions</span>
                <div className="font-medium">{data.transactionCount || 0}</div>
              </div>
              <div>
                <span className="text-gray-600">Tokens</span>
                <div className="font-medium">{data.tokenBalances?.length || 0}</div>
              </div>
              <div>
                <span className="text-gray-600">NFTs</span>
                <div className="font-medium">{data.nfts?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {showTokens && (
                <button
                  onClick={() => setActiveTab('tokens')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'tokens'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Tokens ({data.tokenBalances?.length || 0})
                </button>
              )}
              {showNFTs && (
                <button
                  onClick={() => setActiveTab('nfts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'nfts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  NFTs ({data.nfts?.length || 0})
                </button>
              )}
              {showTransactions && (
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Transactions ({data.transactionCount || 0})
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'tokens' && showTokens && (
              <div className="space-y-3">
                {data.tokenBalances && data.tokenBalances.length > 0 ? (
                  data.tokenBalances.map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">
                            {token.tokenSymbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium flex items-center">
                            {token.tokenName}
                            <a
                              href={getExplorerUrl('tokenBalance', token.tokenAddress, address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700"
                              title="View balance on BaseScan"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                          <div className="text-sm text-gray-500 font-mono text-xs">{formatAddress(token.tokenAddress)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatBalance(token.balance, token.decimals)}
                        </div>
                        <div className="text-sm text-gray-500">{token.tokenSymbol}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2zm0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <p className="mt-4 text-gray-600">No tokens found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'nfts' && showNFTs && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.nfts && data.nfts.length > 0 ? (
                  data.nfts.map((nft, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-200 relative">
                        <img
                          src={nft.imageUrl}
                          alt={nft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/nft';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm truncate">{nft.name}</div>
                          <a
                            href={getExplorerUrl('contract', nft.contractAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                            title="Verify contract on BaseScan"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </a>
                        </div>
                        <div className="text-xs text-gray-500">#{nft.tokenId}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-gray-600">No NFTs found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && showTransactions && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="mt-4 text-gray-600">Transaction history will be available soon</p>
                <a
                  href={getExplorerUrl('address', address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all transactions on BaseScan
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function BaseNetworkStats() {
  const { currentNetwork } = useBaseNetwork();
  const [stats, setStats] = useState({
    gasPrice: '0.5',
    blockTime: '2.1',
    tps: '15.2',
    totalTransactions: '125.3M',
    activeAddresses: '892.1K',
  });

  useEffect(() => {
    // This would fetch real-time stats from Base network
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        gasPrice: (Math.random() * 2 + 0.1).toFixed(2),
        blockTime: (Math.random() * 0.5 + 1.8).toFixed(1),
        tps: (Math.random() * 10 + 10).toFixed(1),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!currentNetwork) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-center text-gray-500">Connect to Base network to see network stats</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {currentNetwork.name} Network Stats
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Gas Price</span>
            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.gasPrice} Gwei</div>
          <div className="text-xs text-blue-700">Low gas fees</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Block Time</span>
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.blockTime}s</div>
          <div className="text-xs text-green-700">Fast confirmations</div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">TPS</span>
            <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-purple-900">{stats.tps}</div>
          <div className="text-xs text-purple-700">Transactions/sec</div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-900">Total Transactions</span>
            <svg className="h-4 w-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.totalTransactions}</div>
          <div className="text-xs text-orange-700">All time</div>
        </div>

        <div className="bg-pink-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-pink-900">Active Addresses</span>
            <svg className="h-4 w-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-pink-900">{stats.activeAddresses}</div>
          <div className="text-xs text-pink-700">24h volume</div>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-900">Network</span>
            <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-indigo-900">
            {currentNetwork.isTestnet ? 'Testnet' : 'Mainnet'}
          </div>
          <div className="text-xs text-indigo-700">Base Network</div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Network Benefits</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
            <span>90% lower gas fees than Ethereum Mainnet</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
            <span>2-second block times for fast confirmations</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
            <span>Secured by Ethereum's validator set</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7a1 1 0 112 0z" clipRule="evenodd" />
            </svg>
            <span>Optimistic rollup technology</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
