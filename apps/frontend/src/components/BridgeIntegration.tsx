'use client';

import { useState } from 'react';
import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useBaseNetwork } from '@/lib/base-network';
import { formatEther } from 'viem';

export function BridgeIntegration() {
    const { address, isConnected } = useAccount();
    const { currentNetwork } = useBaseNetwork();
    const { switchChain } = useSwitchChain();

    const ethMainnetBalance = useBalance({
        address,
        chainId: mainnet.id,
    });

    const [activeTab, setActiveTab] = useState<'official' | 'ecosystem'>('official');

    const ecosystemBridges = [
        { name: 'Stargate', url: 'https://stargate.finance/transfer', description: 'Cross-chain liquidity protocol' },
        { name: 'Hop Protocol', url: 'https://app.hop.exchange', description: 'Fast, trustless bridge' },
        { name: 'Orbiter Finance', url: 'https://www.orbiter.finance', description: 'Layer 2 bridge protocol' },
    ];

    if (!isConnected) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Bridge to Base</h3>
                <p className="text-gray-600 mb-6">Connect your wallet to see your balance and bridge assets to Base.</p>
                <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Connect Wallet
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Bridge to Base</h3>
                <p className="text-sm text-gray-500">Easily move your assets from Ethereum to Base.</p>
            </div>

            <div className="p-6">
                {/* Balance Overview */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-blue-800">Ethereum Mainnet Balance</div>
                        <div className="text-2xl font-bold text-blue-900">
                            {ethMainnetBalance.data ? `${parseFloat(formatEther(ethMainnetBalance.data.value)).toFixed(4)} ETH` : '0.0000 ETH'}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => switchChain({ chainId: mainnet.id })}
                        className="text-xs font-semibold bg-white text-blue-600 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-50"
                    >
                        Switch to Mainnet
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('official')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'official' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Official Bridge
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ecosystem')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ecosystem' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Ecosystem Bridges
                    </button>
                </div>

                {activeTab === 'official' ? (
                    <div className="space-y-4">
                        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">B</div>
                                <h4 className="font-semibold text-gray-900">Base Official Bridge</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                The most secure way to bridge. Deposits take ~2 minutes. Withdrawals take ~7 days on Mainnet.
                            </p>
                            <a
                                href={currentNetwork?.bridgeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-black transition-colors"
                            >
                                Go to Official Bridge
                            </a>
                        </div>

                        <div className="text-xs text-gray-500 px-2 italic">
                            * Official bridge supports ETH and standard ERC-20 tokens.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ecosystemBridges.map((bridge) => (
                            <a
                                key={bridge.name}
                                href={bridge.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group"
                            >
                                <div>
                                    <div className="font-semibold text-gray-900 flex items-center">
                                        {bridge.name}
                                        <svg className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                    <div className="text-xs text-gray-500">{bridge.description}</div>
                                </div>
                                <svg className="h-5 w-5 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-6">
                <h4 className="text-sm font-bold text-gray-900 mb-3">How to bridge</h4>
                <ol className="space-y-3">
                    <li className="flex items-start space-x-3 text-xs text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center font-bold">1</span>
                        <span>Switch your wallet to Ethereum Mainnet and ensure you have ETH for gas fees.</span>
                    </li>
                    <li className="flex items-start space-x-3 text-xs text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center font-bold">2</span>
                        <span>Select a bridge above and specify the amount you want to move to Base.</span>
                    </li>
                    <li className="flex items-start space-x-3 text-xs text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center font-bold">3</span>
                        <span>Confirm the transaction and wait for the assets to arrive (usually a few minutes).</span>
                    </li>
                </ol>
            </div>
        </div>
    );
}
