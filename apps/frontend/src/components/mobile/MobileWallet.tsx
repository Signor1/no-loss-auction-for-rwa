'use client'

import React, { useState } from 'react'
import { useMobileWallet, useResponsive, useTouchOptimized } from '@/lib/mobile-optimization'

export default function MobileWallet() {
  const {
    isSupported,
    isConnected,
    walletType,
    address,
    chainId,
    balance,
    network,
    connect,
    disconnect,
    switchNetwork
  } = useMobileWallet()

  const { deviceInfo } = useResponsive()
  const { hapticFeedback, showTouchFeedback } = useTouchOptimized()

  const [isConnecting, setIsConnecting] = useState(false)
  const [showNetworkSelector, setShowNetworkSelector] = useState(false)

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: string) => {
    if (!bal) return '0'
    const wei = parseInt(bal, 16)
    const eth = wei / 1e18
    return eth.toFixed(4)
  }

  const handleConnect = async () => {
    if (!isSupported) {
      showTouchFeedback('Wallet not supported')
      return
    }

    setIsConnecting(true)
    hapticFeedback('medium')

    try {
      await connect()
      showTouchFeedback('Wallet connected!')
      hapticFeedback('light')
    } catch (error) {
      showTouchFeedback('Connection failed')
      hapticFeedback('heavy')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    hapticFeedback('medium')
    showTouchFeedback('Wallet disconnected')
  }

  const handleSwitchNetwork = async (networkId: number) => {
    try {
      await switchNetwork(networkId)
      setShowNetworkSelector(false)
      showTouchFeedback('Network switched')
      hapticFeedback('light')
    } catch (error) {
      showTouchFeedback('Network switch failed')
      hapticFeedback('heavy')
    }
  }

  const networks = [
    { id: 1, name: 'Ethereum', color: 'blue' },
    { id: 137, name: 'Polygon', color: 'purple' },
    { id: 56, name: 'BSC', color: 'yellow' },
    { id: 42161, name: 'Arbitrum', color: 'cyan' }
  ]

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600">⚠️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-900">Wallet Not Supported</h3>
            <p className="text-xs text-red-700 mt-1">
              Please install a compatible wallet like MetaMask or WalletConnect
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👛</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Connect your wallet to start bidding and managing assets
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              isConnecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            } ${deviceInfo.touchSupport ? 'touch-manipulation' : ''}`}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              'Connect Wallet'
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-lg">👛</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Wallet Connected</h3>
            <p className="text-xs text-gray-600">{walletType}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-800 p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Address */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Address</span>
          <span className="text-sm font-mono text-gray-900">{formatAddress(address || '')}</span>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="text-sm font-medium text-gray-900">{formatBalance(balance || '')} ETH</span>
        </div>

        {/* Network */}
        <div className="relative">
          <button
            onClick={() => setShowNetworkSelector(!showNetworkSelector)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm text-gray-600">Network</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{network}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showNetworkSelector && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleSwitchNetwork(network.id)}
                  className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                    chainId === network.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${network.color}-500`}></div>
                    <span className="text-sm font-medium text-gray-900">{network.name}</span>
                  </div>
                  {chainId === network.id && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button className="py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            Send
          </button>
          <button className="py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
            Receive
          </button>
        </div>
      </div>
    </div>
  )
}
