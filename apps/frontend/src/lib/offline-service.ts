// Offline service worker and PWA configuration

export interface CacheConfig {
  name: string
  version: string
  urls: string[]
  strategy: 'cacheFirst' | 'networkFirst' | 'cacheOnly' | 'networkOnly'
}

export interface OfflineAction {
  id: string
  type: 'bid' | 'transaction' | 'profile_update' | 'settings_update'
  data: any
  timestamp: Date
  retryCount: number
  maxRetries: number
}

// Cache configurations for different asset types
export const cacheConfigs: CacheConfig[] = [
  {
    name: 'static-assets',
    version: 'v1',
    urls: [
      '/',
      '/manifest.json',
      '/offline.html',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ],
    strategy: 'cacheFirst'
  },
  {
    name: 'api-responses',
    version: 'v1',
    urls: [
      '/api/auctions',
      '/api/assets',
      '/api/user/profile'
    ],
    strategy: 'networkFirst'
  },
  {
    name: 'images',
    version: 'v1',
    urls: [],
    strategy: 'cacheFirst'
  }
]

// Service worker registration
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  notifyUserOfUpdate()
                }
              })
            }
          })
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

// Notify user of available update
function notifyUserOfUpdate() {
  // In a real implementation, this would show a toast or modal
  if (confirm('New version available! Reload to update?')) {
    window.location.reload()
  }
}

// Offline action queue
class OfflineActionQueue {
  private actions: OfflineAction[] = []
  private storageKey = 'offline-actions'

  constructor() {
    this.loadFromStorage()
  }

  addAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    const newAction: OfflineAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    }

    this.actions.push(newAction)
    this.saveToStorage()
  }

  removeAction(id: string) {
    this.actions = this.actions.filter(action => action.id !== id)
    this.saveToStorage()
  }

  getActions(): OfflineAction[] {
    return this.actions
  }

  getActionsByType(type: string): OfflineAction[] {
    return this.actions.filter(action => action.type === type)
  }

  incrementRetryCount(id: string) {
    const action = this.actions.find(a => a.id === id)
    if (action) {
      action.retryCount++
      this.saveToStorage()
    }
  }

  clearActions() {
    this.actions = []
    this.saveToStorage()
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.actions))
    } catch (error) {
      console.error('Failed to save offline actions:', error)
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.actions = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load offline actions:', error)
    }
  }
}

// Cache manager
class CacheManager {
  private caches = new Map<string, Cache>()

  async openCache(name: string): Promise<Cache> {
    if (!this.caches.has(name)) {
      const cache = await caches.open(name)
      this.caches.set(name, cache)
    }
    return this.caches.get(name)!
  }

  async addToCache(cacheName: string, request: RequestInfo, response: Response) {
    const cache = await this.openCache(cacheName)
    await cache.put(request, response)
  }

  async getFromCache(cacheName: string, request: RequestInfo): Promise<Response | null> {
    const cache = await this.openCache(cacheName)
    return cache.match(request)
  }

  async deleteCache(cacheName: string) {
    await caches.delete(cacheName)
    this.caches.delete(cacheName)
  }

  async clearAllCaches() {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    this.caches.clear()
  }
}

// Network monitor
class NetworkMonitor {
  private listeners: ((online: boolean) => void)[] = []
  private isOnline = navigator.onLine

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  private handleOnline() {
    this.isOnline = true
    this.notifyListeners(true)
  }

  private handleOffline() {
    this.isOnline = false
    this.notifyListeners(false)
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online))
  }

  subscribe(listener: (online: boolean) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }
}

// Offline request handler
class OfflineRequestHandler {
  private cacheManager = new CacheManager()
  private actionQueue = new OfflineActionQueue()
  private networkMonitor = new NetworkMonitor()

  constructor() {
    this.setupNetworkListener()
  }

  private setupNetworkListener() {
    this.networkMonitor.subscribe((online) => {
      if (online) {
        this.syncPendingActions()
      }
    })
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const cacheConfig = this.getCacheConfig(url.pathname)

    if (!this.networkMonitor.getOnlineStatus()) {
      // Offline mode
      if (cacheConfig?.strategy === 'cacheFirst' || cacheConfig?.strategy === 'cacheOnly') {
        const cachedResponse = await this.cacheManager.getFromCache(cacheConfig.name, request)
        if (cachedResponse) {
          return cachedResponse
        }
      }

      // Queue the request if it's a mutation
      if (this.isMutationRequest(request)) {
        this.queueRequest(request)
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Request queued for when online' 
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response('Offline', { status: 503 })
    }

    // Online mode
    switch (cacheConfig?.strategy) {
      case 'cacheFirst':
        return this.handleCacheFirst(request, cacheConfig)
      case 'networkFirst':
        return this.handleNetworkFirst(request, cacheConfig)
      case 'cacheOnly':
        return this.handleCacheOnly(request, cacheConfig)
      case 'networkOnly':
        return this.handleNetworkOnly(request)
      default:
        return fetch(request)
    }
  }

  private async handleCacheFirst(request: Request, config: CacheConfig): Promise<Response> {
    const cachedResponse = await this.cacheManager.getFromCache(config.name, request)
    if (cachedResponse) {
      // Update cache in background
      this.updateCacheInBackground(request, config)
      return cachedResponse
    }
    return this.handleNetworkOnly(request)
  }

  private async handleNetworkFirst(request: Request, config: CacheConfig): Promise<Response> {
    try {
      const response = await fetch(request)
      if (response.ok) {
        await this.cacheManager.addToCache(config.name, request, response.clone())
      }
      return response
    } catch (error) {
      const cachedResponse = await this.cacheManager.getFromCache(config.name, request)
      if (cachedResponse) {
        return cachedResponse
      }
      throw error
    }
  }

  private async handleCacheOnly(request: Request, config: CacheConfig): Promise<Response> {
    const cachedResponse = await this.cacheManager.getFromCache(config.name, request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response('Not found in cache', { status: 404 })
  }

  private async handleNetworkOnly(request: Request): Promise<Response> {
    return fetch(request)
  }

  private async updateCacheInBackground(request: Request, config: CacheConfig) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        await this.cacheManager.addToCache(config.name, request, response)
      }
    } catch (error) {
      console.error('Background cache update failed:', error)
    }
  }

  private getCacheConfig(pathname: string): CacheConfig | undefined {
    return cacheConfigs.find(config => 
      config.urls.some(url => pathname.startsWith(url))
    )
  }

  private isMutationRequest(request: Request): boolean {
    const method = request.method.toUpperCase()
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)
  }

  private queueRequest(request: Request) {
    // In a real implementation, this would store the request details
    // for later processing when back online
    console.log('Request queued for offline processing:', request.url)
  }

  private async syncPendingActions() {
    const actions = this.actionQueue.getActions()
    
    for (const action of actions) {
      if (action.retryCount >= action.maxRetries) {
        this.actionQueue.removeAction(action.id)
        continue
      }

      try {
        await this.executeAction(action)
        this.actionQueue.removeAction(action.id)
      } catch (error) {
        this.actionQueue.incrementRetryCount(action.id)
        console.error('Failed to execute action:', error)
      }
    }
  }

  private async executeAction(action: OfflineAction) {
    // In a real implementation, this would execute the queued action
    console.log('Executing offline action:', action)
  }
}

// PWA manifest generator
export function generatePWAManifest() {
  return {
    name: 'No-Loss Auction',
    short_name: 'NLAuction',
    description: 'Decentralized auction platform for real-world assets',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    shortcuts: [
      {
        name: 'Browse Auctions',
        short_name: 'Auctions',
        description: 'Browse active auctions',
        url: '/auctions',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
      },
      {
        name: 'My Bids',
        short_name: 'Bids',
        description: 'View your active bids',
        url: '/bids',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
      }
    ],
    categories: ['business', 'finance', 'shopping'],
    lang: 'en',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false
  }
}

// Service worker template
export const serviceWorkerTemplate = `
const CACHE_NAME = 'nlauction-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
`

// Export instances
export const offlineActionQueue = new OfflineActionQueue()
export const cacheManager = new CacheManager()
export const networkMonitor = new NetworkMonitor()
export const offlineRequestHandler = new OfflineRequestHandler()
