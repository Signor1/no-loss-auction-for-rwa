'use client'

import React, { useState, useEffect } from 'react'
import { useResponsive, usePWAInstall, useOfflineCapability, useTouchOptimized } from '@/lib/mobile-optimization'
import MobileWallet from './MobileWallet'

interface MobileOptimizedLayoutProps {
  children: React.ReactNode
  showWallet?: boolean
  showInstallPrompt?: boolean
}

export default function MobileOptimizedLayout({ 
  children, 
  showWallet = true, 
  showInstallPrompt = true 
}: MobileOptimizedLayoutProps) {
  const { deviceInfo, currentBreakpoint } = useResponsive()
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const { isOnline, isOfflineMode, syncStatus, pendingActions } = useOfflineCapability()
  const { touchFeedback } = useTouchOptimized()

  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    // Show install banner on mobile if not installed
    if (deviceInfo.isMobile && isInstallable && !isInstalled && showInstallPrompt) {
      setShowInstallBanner(true)
    }
  }, [deviceInfo.isMobile, isInstallable, isInstalled, showInstallPrompt])

  useEffect(() => {
    // Show offline banner when offline
    if (!isOnline && !isOfflineMode) {
      setShowOfflineBanner(true)
    } else {
      setShowOfflineBanner(false)
    }
  }, [isOnline, isOfflineMode])

  const handleInstall = async () => {
    const success = await install()
    if (success) {
      setShowInstallBanner(false)
    }
  }

  const getMobileMenuItems = () => [
    { icon: '🏠', label: 'Home', href: '/' },
    { icon: '🏛️', label: 'Auctions', href: '/auctions' },
    { icon: '🔍', label: 'Search', href: '/search' },
    { icon: '⭐', label: 'Recommendations', href: '/recommendations' },
    { icon: '👤', label: 'Profile', href: '/profile' },
    { icon: '⚙️', label: 'Settings', href: '/settings' }
  ]

  const renderMobileNavigation = () => {
    if (!deviceInfo.isMobile) return null

    return (
      <>
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">NLAuction</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="bg-white w-80 h-full shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="p-4">
                <div className="space-y-2">
                  {getMobileMenuItems().map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-medium text-gray-900">{item.label}</span>
                    </a>
                  ))}
                </div>
              </nav>

              {/* Mobile Wallet in Menu */}
              {showWallet && (
                <div className="p-4 border-t border-gray-200">
                  <MobileWallet />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="grid grid-cols-5 gap-1">
            {[
              { icon: '🏠', label: 'Home', href: '/', active: true },
              { icon: '🏛️', label: 'Auctions', href: '/auctions', active: false },
              { icon: '🔍', label: 'Search', href: '/search', active: false },
              { icon: '⭐', label: 'For You', href: '/recommendations', active: false },
              { icon: '👤', label: 'Profile', href: '/profile', active: false }
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  item.active ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      </>
    )
  }

  const renderInstallBanner = () => {
    if (!showInstallBanner) return null

    return (
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h3 className="font-semibold">Install NLAuction</h3>
              <p className="text-sm text-blue-100">Get the full experience on your device</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-2 text-blue-200 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderOfflineBanner = () => {
    if (!showOfflineBanner) return null

    return (
      <div className="bg-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">📡</span>
            </div>
            <div>
              <h3 className="font-semibold">You're offline</h3>
              <p className="text-sm text-orange-100">
                {pendingActions.length > 0 
                  ? `${pendingActions.length} actions will sync when you're back online`
                  : 'Some features may be limited'
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowOfflineBanner(false)}
            className="p-2 text-orange-200 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const renderSyncStatus = () => {
    if (syncStatus === 'synced') return null

    return (
      <div className="fixed top-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-700">
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync failed'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${deviceInfo.isMobile ? 'pb-16' : ''}`}>
      {/* Install Banner */}
      {renderInstallBanner()}

      {/* Offline Banner */}
      {renderOfflineBanner()}

      {/* Mobile Navigation */}
      {renderMobileNavigation()}

      {/* Main Content */}
      <main className={`${deviceInfo.isMobile ? 'pt-0' : 'pt-4'} ${deviceInfo.isMobile ? 'px-0' : 'px-4'}`}>
        {/* Desktop Header */}
        {!deviceInfo.isMobile && (
          <header className="bg-white border-b border-gray-200 rounded-lg mb-6">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">NLAuction</h1>
                <nav className="hidden md:flex space-x-6">
                  <a href="/" className="text-gray-700 hover:text-gray-900">Home</a>
                  <a href="/auctions" className="text-gray-700 hover:text-gray-900">Auctions</a>
                  <a href="/search" className="text-gray-700 hover:text-gray-900">Search</a>
                  <a href="/recommendations" className="text-gray-700 hover:text-gray-900">For You</a>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                {/* Connection Status */}
                <div className={`flex items-center space-x-2 text-sm ${
                  isOnline ? 'text-green-600' : 'text-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                
                {/* Desktop Wallet */}
                {showWallet && (
                  <div className="hidden lg:block">
                    <MobileWallet />
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <div className={deviceInfo.isMobile ? '' : 'max-w-7xl mx-auto'}>
          {children}
        </div>
      </main>

      {/* Touch Feedback */}
      {touchFeedback && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm z-50">
          {touchFeedback}
        </div>
      )}

      {/* Sync Status */}
      {renderSyncStatus()}
    </div>
  )
}
