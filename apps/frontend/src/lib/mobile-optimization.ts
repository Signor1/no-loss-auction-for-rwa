import { useState, useEffect, useCallback, useRef } from 'react'

export interface Breakpoint {
  name: string
  min: number
  max?: number
}

export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'longpress'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  scale?: number
  duration: number
}

export interface MobileDeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isIOS: boolean
  isAndroid: boolean
  isSafari: boolean
  isChrome: boolean
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  touchSupport: boolean
  orientation: 'portrait' | 'landscape'
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface OfflineCapability {
  isOnline: boolean
  isOfflineMode: boolean
  cachedAssets: string[]
  pendingActions: Array<{
    id: string
    type: string
    data: any
    timestamp: Date
  }>
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error'
}

export interface MobileWalletInfo {
  isSupported: boolean
  isConnected: boolean
  walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'native'
  address?: string
  chainId?: number
  balance?: string
  network?: string
}

// Breakpoints for responsive design
export const breakpoints: Breakpoint[] = [
  { name: 'mobile', min: 0, max: 639 },
  { name: 'tablet', min: 640, max: 1023 },
  { name: 'desktop', min: 1024, max: 1279 },
  { name: 'large', min: 1280, max: 1535 },
  { name: 'xlarge', min: 1536 }
]

// Hook for responsive design
export function useResponsive() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>(breakpoints[0])
  const [deviceInfo, setDeviceInfo] = useState<MobileDeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 1,
    touchSupport: false,
    orientation: 'landscape'
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent.toLowerCase()
      
      const isMobile = width <= 639
      const isTablet = width >= 640 && width <= 1023
      const isDesktop = width >= 1024
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
      const isChrome = /chrome/.test(userAgent)
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const orientation = width > height ? 'landscape' : 'portrait'

      const newDeviceInfo: MobileDeviceInfo = {
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        screenWidth: width,
        screenHeight: height,
        pixelRatio: window.devicePixelRatio || 1,
        touchSupport,
        orientation
      }

      setDeviceInfo(newDeviceInfo)

      // Update current breakpoint
      const breakpoint = breakpoints.find(bp => 
        width >= bp.min && (bp.max === undefined || width <= bp.max)
      ) || breakpoints[0]
      setCurrentBreakpoint(breakpoint)
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  const isBreakpoint = useCallback((name: string) => {
    return currentBreakpoint.name === name
  }, [currentBreakpoint])

  const isMinBreakpoint = useCallback((name: string) => {
    const breakpoint = breakpoints.find(bp => bp.name === name)
    return breakpoint ? deviceInfo.screenWidth >= breakpoint.min : false
  }, [deviceInfo.screenWidth])

  const isMaxBreakpoint = useCallback((name: string) => {
    const breakpoint = breakpoints.find(bp => bp.name === name)
    return breakpoint && breakpoint.max ? deviceInfo.screenWidth <= breakpoint.max : false
  }, [deviceInfo.screenWidth])

  return {
    currentBreakpoint,
    deviceInfo,
    isBreakpoint,
    isMinBreakpoint,
    isMaxBreakpoint
  }
}

// Hook for touch gestures
export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  onGesture: (gesture: TouchGesture) => void
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current) {
          onGesture({
            type: 'longpress',
            duration: 500
          })
        }
      }, 500)
    }
  }, [onGesture])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (e.changedTouches.length === 1 && touchStartRef.current) {
      const touch = e.changedTouches[0]
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      const deltaX = touchEndRef.current.x - touchStartRef.current.x
      const deltaY = touchEndRef.current.y - touchStartRef.current.y
      const deltaTime = touchEndRef.current.time - touchStartRef.current.time
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // Determine gesture type
      if (distance < 10 && deltaTime < 200) {
        // Tap
        onGesture({
          type: 'tap',
          duration: deltaTime
        })
      } else if (distance > 50 && deltaTime < 300) {
        // Swipe
        let direction: 'up' | 'down' | 'left' | 'right'
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          direction = deltaY > 0 ? 'down' : 'up'
        }

        onGesture({
          type: 'swipe',
          direction,
          distance,
          duration: deltaTime
        })
      }
    }
  }, [onGesture])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd])
}

// Hook for PWA install prompt
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as any)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return false

    try {
      await installPrompt.prompt()
      const result = await installPrompt.userChoice
      return result.outcome === 'accepted'
    } catch (error) {
      console.error('PWA installation failed:', error)
      return false
    }
  }, [installPrompt])

  return {
    isInstallable,
    isInstalled,
    install
  }
}

// Hook for offline capability
export function useOfflineCapability() {
  const [offlineState, setOfflineState] = useState<OfflineCapability>({
    isOnline: navigator.onLine,
    isOfflineMode: false,
    cachedAssets: [],
    pendingActions: [],
    syncStatus: 'synced'
  })

  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: true,
        syncStatus: 'syncing'
      }))

      // Sync pending actions
      syncPendingActions()
    }

    const handleOffline = () => {
      setOfflineState(prev => ({
        ...prev,
        isOnline: false,
        syncStatus: 'offline'
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncPendingActions = useCallback(async () => {
    // Simulate syncing pending actions
    setTimeout(() => {
      setOfflineState(prev => ({
        ...prev,
        pendingActions: [],
        syncStatus: 'synced'
      }))
    }, 2000)
  }, [])

  const addPendingAction = useCallback((action: { type: string; data: any }) => {
    const pendingAction = {
      id: `action-${Date.now()}`,
      ...action,
      timestamp: new Date()
    }

    setOfflineState(prev => ({
      ...prev,
      pendingActions: [...prev.pendingActions, pendingAction]
    }))
  }, [])

  const cacheAsset = useCallback((url: string) => {
    setOfflineState(prev => ({
      ...prev,
      cachedAssets: [...prev.cachedAssets, url]
    }))
  }, [])

  return {
    ...offlineState,
    addPendingAction,
    cacheAsset,
    syncPendingActions
  }
}

// Hook for mobile wallet integration
export function useMobileWallet() {
  const [walletInfo, setWalletInfo] = useState<MobileWalletInfo>({
    isSupported: false,
    isConnected: false,
    walletType: 'metamask'
  })

  useEffect(() => {
    // Check for wallet support
    const checkWalletSupport = () => {
      const hasEthereum = typeof window !== 'undefined' && !!(window as any).ethereum
      const hasWalletConnect = typeof window !== 'undefined' && !!(window as any).WalletConnect
      const hasCoinbase = typeof window !== 'undefined' && !!(window as any).coinbaseWalletExtension

      let walletType: MobileWalletInfo['walletType'] = 'metamask'
      if (hasWalletConnect) walletType = 'walletconnect'
      else if (hasCoinbase) walletType = 'coinbase'

      setWalletInfo({
        isSupported: hasEthereum || hasWalletConnect || hasCoinbase,
        isConnected: false,
        walletType
      })
    }

    checkWalletSupport()
  }, [])

  const connect = useCallback(async () => {
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('No wallet found')

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      const chainId = await ethereum.request({ method: 'eth_chainId' })
      const balance = await ethereum.request({ 
        method: 'eth_getBalance', 
        params: [accounts[0], 'latest'] 
      })

      setWalletInfo({
        ...walletInfo,
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        balance: parseInt(balance, 16).toString(),
        network: getNetworkName(parseInt(chainId, 16))
      })

      return accounts[0]
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }, [walletInfo])

  const disconnect = useCallback(() => {
    setWalletInfo({
      ...walletInfo,
      isConnected: false,
      address: undefined,
      chainId: undefined,
      balance: undefined,
      network: undefined
    })
  }, [walletInfo])

  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      const ethereum = (window as any).ethereum
      if (!ethereum) throw new Error('No wallet found')

      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })

      setWalletInfo(prev => ({
        ...prev,
        chainId,
        network: getNetworkName(chainId)
      }))
    } catch (error) {
      console.error('Network switch failed:', error)
      throw error
    }
  }, [])

  return {
    ...walletInfo,
    connect,
    disconnect,
    switchNetwork
  }
}

// Helper function to get network name
function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1: return 'Ethereum Mainnet'
    case 3: return 'Ropsten Testnet'
    case 4: return 'Rinkeby Testnet'
    case 5: return 'Goerli Testnet'
    case 42: return 'Kovan Testnet'
    case 137: return 'Polygon Mainnet'
    case 80001: return 'Mumbai Testnet'
    case 56: return 'BSC Mainnet'
    case 97: return 'BSC Testnet'
    default: return `Chain ${chainId}`
  }
}

// Hook for touch-optimized interactions
export function useTouchOptimized() {
  const [touchFeedback, setTouchFeedback] = useState<string | null>(null)

  const createRipple = useCallback((event: React.MouseEvent | React.TouchEvent, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    let x: number, y: number

    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left
      y = event.touches[0].clientY - rect.top
    } else {
      x = event.clientX - rect.left
      y = event.clientY - rect.top
    }

    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`

    element.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 600)
  }, [])

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10)
          break
        case 'medium':
          navigator.vibrate(20)
          break
        case 'heavy':
          navigator.vibrate([30, 10, 30])
          break
      }
    }
  }, [])

  const showTouchFeedback = useCallback((message: string) => {
    setTouchFeedback(message)
    setTimeout(() => setTouchFeedback(null), 2000)
  }, [])

  return {
    touchFeedback,
    createRipple,
    hapticFeedback,
    showTouchFeedback
  }
}

// Utility functions for mobile optimization
export const mobileUtils = {
  // Check if device supports touch
  isTouchDevice: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },

  // Get safe area insets for notched devices
  getSafeAreaInsets: () => {
    const style = getComputedStyle(document.documentElement)
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
    }
  },

  // Prevent zoom on input focus (iOS)
  preventZoomOnFocus: () => {
    const inputs = document.querySelectorAll('input, select, textarea')
    inputs.forEach(input => {
      input.addEventListener('touchstart', () => {
        input.style.fontSize = '16px'
      })
      input.addEventListener('blur', () => {
        input.style.fontSize = ''
      })
    })
  },

  // Optimize images for mobile
  optimizeImage: (url: string, width: number, height?: number) => {
    // In a real implementation, this would use an image CDN
    const params = new URLSearchParams()
    params.set('w', width.toString())
    if (height) params.set('h', height.toString())
    params.set('fit', 'cover')
    params.set('auto', 'format')
    
    return `${url}?${params.toString()}`
  },

  // Debounce for mobile performance
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle for mobile performance
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}
