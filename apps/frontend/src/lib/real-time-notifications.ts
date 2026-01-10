import { useState, useEffect, useCallback, useRef } from 'react'

export interface Notification {
  id: string
  type: 'auction' | 'bid' | 'transaction' | 'portfolio' | 'system' | 'security' | 'marketing'
  title: string
  message: string
  description?: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'info' | 'success' | 'warning' | 'error'
  actions?: Array<{
    id: string
    label: string
    action: string
    style?: 'primary' | 'secondary' | 'danger'
  }>
  metadata?: {
    auctionId?: string
    transactionId?: string
    assetId?: string
    userId?: string
    amount?: number
    currency?: string
    link?: string
  }
  expiresAt?: Date
  source: 'websocket' | 'push' | 'email' | 'sms' | 'in-app'
}

export interface NotificationPreferences {
  userId: string
  channels: {
    inApp: boolean
    push: boolean
    email: boolean
    sms: boolean
  }
  categories: {
    auction: {
      enabled: boolean
      types: {
        endingSoon: boolean
        outbid: boolean
        won: boolean
        newAuction: boolean
        priceChange: boolean
      }
    }
    bid: {
      enabled: boolean
      types: {
        placed: boolean
        confirmed: boolean
        failed: boolean
        cancelled: boolean
      }
    }
    transaction: {
      enabled: boolean
      types: {
        pending: boolean
        confirmed: boolean
        failed: boolean
        completed: boolean
      }
    }
    portfolio: {
      enabled: boolean
      types: {
        priceAlert: boolean
        performanceUpdate: boolean
        rebalancing: boolean
        dividend: boolean
      }
    }
    system: {
      enabled: boolean
      types: {
        maintenance: boolean
        update: boolean
        security: boolean
        feature: boolean
      }
    }
    security: {
      enabled: boolean
      types: {
        login: boolean
        passwordChange: boolean
        twoFactor: boolean
        suspiciousActivity: boolean
      }
    }
    marketing: {
      enabled: boolean
      types: {
        newsletter: boolean
        promotions: boolean
        updates: boolean
        events: boolean
      }
    }
  }
  frequency: {
    immediate: boolean
    hourly: boolean
    daily: boolean
    weekly: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
  doNotDisturb: {
    enabled: boolean
    until?: Date
  }
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
  userId?: string
}

export interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  badge?: number
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
}

export interface EmailNotification {
  id: string
  to: string
  subject: string
  template: string
  variables: Record<string, any>
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
  scheduledAt?: Date
  sentAt?: Date
  status: 'pending' | 'sent' | 'failed' | 'bounced'
}

export interface SMSNotification {
  id: string
  to: string
  message: string
  scheduledAt?: Date
  sentAt?: Date
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  cost?: number
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  byCategory: Record<string, number>
  deliveryStats: {
    inApp: { sent: number; delivered: number; read: number }
    push: { sent: number; delivered: number; clicked: number }
    email: { sent: number; delivered: number; opened: number }
    sms: { sent: number; delivered: number; clicked: number }
  }
}

// Mock data
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'auction',
    title: 'Auction Ending Soon',
    message: 'Manhattan Tower A auction ends in 30 minutes',
    description: 'Current bid: $125,000. Place your final bid now!',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    priority: 'high',
    category: 'warning',
    actions: [
      {
        id: 'view-auction',
        label: 'View Auction',
        action: 'navigate',
        style: 'primary'
      },
      {
        id: 'place-bid',
        label: 'Place Bid',
        action: 'bid',
        style: 'secondary'
      }
    ],
    metadata: {
      auctionId: 'auction-1',
      assetId: 'asset-1',
      amount: 125000,
      currency: 'USD',
      link: '/auction/auction-1'
    },
    source: 'websocket'
  },
  {
    id: 'notif-2',
    type: 'bid',
    title: 'Bid Placed Successfully',
    message: 'Your bid of $130,000 has been placed',
    description: 'You are now the highest bidder',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: true,
    priority: 'medium',
    category: 'success',
    actions: [
      {
        id: 'view-bid',
        label: 'View Bid',
        action: 'navigate',
        style: 'primary'
      }
    ],
    metadata: {
      auctionId: 'auction-1',
      transactionId: 'tx-123',
      amount: 130000,
      currency: 'USD',
      link: '/bids/bid-123'
    },
    source: 'in-app'
  },
  {
    id: 'notif-3',
    type: 'transaction',
    title: 'Transaction Confirmed',
    message: 'Your transaction has been confirmed on the blockchain',
    description: 'Transaction hash: 0x1234...5678',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    priority: 'medium',
    category: 'success',
    actions: [
      {
        id: 'view-tx',
        label: 'View on Explorer',
        action: 'external',
        style: 'primary'
      }
    ],
    metadata: {
      transactionId: 'tx-123',
      link: 'https://etherscan.io/tx/0x1234567890abcdef'
    },
    source: 'push'
  },
  {
    id: 'notif-4',
    type: 'portfolio',
    title: 'Price Alert',
    message: 'Gold Reserve Token has increased by 5%',
    description: 'Current price: $2,100 (+5.2%)',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: false,
    priority: 'low',
    category: 'info',
    actions: [
      {
        id: 'view-asset',
        label: 'View Asset',
        action: 'navigate',
        style: 'primary'
      }
    ],
    metadata: {
      assetId: 'asset-2',
      amount: 2100,
      currency: 'USD',
      link: '/assets/asset-2'
    },
    source: 'email'
  },
  {
    id: 'notif-5',
    type: 'security',
    title: 'New Login Detected',
    message: 'New login from Chrome on Windows',
    description: 'IP: 192.168.1.1, Location: New York, US',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    priority: 'urgent',
    category: 'warning',
    actions: [
      {
        id: 'review-login',
        label: 'Review Activity',
        action: 'navigate',
        style: 'primary'
      },
      {
        id: 'secure-account',
        label: 'Secure Account',
        action: 'security',
        style: 'danger'
      }
    ],
    metadata: {
      userId: 'user-123',
      link: '/security/login-history'
    },
    source: 'sms'
  }
]

export const mockNotificationPreferences: NotificationPreferences = {
  userId: 'user-123',
  channels: {
    inApp: true,
    push: true,
    email: true,
    sms: false
  },
  categories: {
    auction: {
      enabled: true,
      types: {
        endingSoon: true,
        outbid: true,
        won: true,
        newAuction: true,
        priceChange: false
      }
    },
    bid: {
      enabled: true,
      types: {
        placed: true,
        confirmed: true,
        failed: true,
        cancelled: true
      }
    },
    transaction: {
      enabled: true,
      types: {
        pending: true,
        confirmed: true,
        failed: true,
        completed: true
      }
    },
    portfolio: {
      enabled: true,
      types: {
        priceAlert: true,
        performanceUpdate: true,
        rebalancing: false,
        dividend: true
      }
    },
    system: {
      enabled: true,
      types: {
        maintenance: true,
        update: true,
        security: true,
        feature: false
      }
    },
    security: {
      enabled: true,
      types: {
        login: true,
        passwordChange: true,
        twoFactor: true,
        suspiciousActivity: true
      }
    },
    marketing: {
      enabled: false,
      types: {
        newsletter: false,
        promotions: false,
        updates: false,
        events: false
      }
    }
  },
  frequency: {
    immediate: true,
    hourly: false,
    daily: false,
    weekly: false
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'America/New_York'
  },
  doNotDisturb: {
    enabled: false
  }
}

export const mockNotificationStats: NotificationStats = {
  total: 156,
  unread: 3,
  byType: {
    auction: 45,
    bid: 32,
    transaction: 28,
    portfolio: 18,
    system: 15,
    security: 12,
    marketing: 6
  },
  byPriority: {
    low: 68,
    medium: 52,
    high: 28,
    urgent: 8
  },
  byCategory: {
    info: 89,
    success: 34,
    warning: 25,
    error: 8
  },
  deliveryStats: {
    inApp: { sent: 156, delivered: 156, read: 124 },
    push: { sent: 89, delivered: 82, clicked: 23 },
    email: { sent: 45, delivered: 43, opened: 28 },
    sms: { sent: 12, delivered: 11, clicked: 3 }
  }
}

// Hook for real-time notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [preferences, setPreferences] = useState<NotificationPreferences>(mockNotificationPreferences)
  const [stats, setStats] = useState<NotificationStats>(mockNotificationStats)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      // In a real implementation, this would connect to actual WebSocket server
      const ws = new WebSocket('wss://api.no-loss-auction.com/notifications')
      
      ws.onopen = () => {
        setIsConnected(true)
        console.log('WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }
      
      ws.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket disconnected')
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('WebSocket connection error')
      }
      
      wsRef.current = ws
    } catch (err) {
      console.error('Failed to connect WebSocket:', err)
      setError('Failed to connect to notification service')
    }
  }, [])

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'notification') {
      const notification: Notification = {
        ...message.data,
        id: `ws-${Date.now()}`,
        timestamp: new Date(message.timestamp),
        read: false,
        source: 'websocket'
      }
      
      setNotifications(prev => [notification, ...prev])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
        byType: {
          ...prev.byType,
          [notification.type]: (prev.byType[notification.type] || 0) + 1
        },
        byPriority: {
          ...prev.byPriority,
          [notification.priority]: (prev.byPriority[notification.priority] || 0) + 1
        },
        byCategory: {
          ...prev.byCategory,
          [notification.category]: (prev.byCategory[notification.category] || 0) + 1
        }
      }))
      
      // Send push notification if enabled
      if (preferences.channels.push && shouldSendNotification(notification)) {
        sendPushNotification(notification)
      }
      
      // Send email if enabled
      if (preferences.channels.email && shouldSendNotification(notification)) {
        sendEmailNotification(notification)
      }
      
      // Send SMS if enabled
      if (preferences.channels.sms && shouldSendNotification(notification)) {
        sendSMSNotification(notification)
      }
    }
  }, [preferences])

  // Check if notification should be sent based on preferences
  const shouldSendNotification = useCallback((notification: Notification): boolean => {
    // Check do not disturb
    if (preferences.doNotDisturb.enabled) {
      if (preferences.doNotDisturb.until && new Date() < preferences.doNotDisturb.until) {
        return false
      }
    }
    
    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date()
      const startTime = new Date()
      const endTime = new Date()
      
      const [startHour, startMin] = preferences.quietHours.startTime.split(':')
      const [endHour, endMin] = preferences.quietHours.endTime.split(':')
      
      startTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0)
      endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0)
      
      if (now >= startTime && now <= endTime) {
        return false
      }
    }
    
    // Check category preferences
    const categoryPrefs = preferences.categories[notification.type]
    if (!categoryPrefs?.enabled) {
      return false
    }
    
    return true
  }, [preferences])

  // Send push notification
  const sendPushNotification = useCallback(async (notification: Notification) => {
    if (!('Notification' in window)) {
      return
    }
    
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
          data: notification.metadata,
          requireInteraction: notification.priority === 'urgent'
        })
      }
    } catch (err) {
      console.error('Error sending push notification:', err)
    }
  }, [])

  // Send email notification
  const sendEmailNotification = useCallback(async (notification: Notification) => {
    try {
      // In a real implementation, this would call an API endpoint
      console.log('Sending email notification:', notification)
      
      setStats(prev => ({
        ...prev,
        deliveryStats: {
          ...prev.deliveryStats,
          email: {
            ...prev.deliveryStats.email,
            sent: prev.deliveryStats.email.sent + 1
          }
        }
      }))
    } catch (err) {
      console.error('Error sending email notification:', err)
    }
  }, [])

  // Send SMS notification
  const sendSMSNotification = useCallback(async (notification: Notification) => {
    try {
      // In a real implementation, this would call an API endpoint
      console.log('Sending SMS notification:', notification)
      
      setStats(prev => ({
        ...prev,
        deliveryStats: {
          ...prev.deliveryStats,
          sms: {
            ...prev.deliveryStats.sms,
            sent: prev.deliveryStats.sms.sent + 1
          }
        }
      }))
    } catch (err) {
      console.error('Error sending SMS notification:', err)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ))
    
    setStats(prev => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
      deliveryStats: {
        ...prev.deliveryStats,
        inApp: {
          ...prev.deliveryStats.inApp,
          read: prev.deliveryStats.inApp.read + 1
        }
      }
    }))
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    setStats(prev => ({
      ...prev,
      unread: 0,
      deliveryStats: {
        ...prev.deliveryStats,
        inApp: {
          ...prev.deliveryStats.inApp,
          read: prev.deliveryStats.inApp.read + prev.unread
        }
      }
    }))
  }, [])

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    
    if (notification && !notification.read) {
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        unread: Math.max(0, prev.unread - 1),
        byType: {
          ...prev.byType,
          [notification.type]: Math.max(0, (prev.byType[notification.type] || 0) - 1)
        },
        byPriority: {
          ...prev.byPriority,
          [notification.priority]: Math.max(0, (prev.byPriority[notification.priority] || 0) - 1)
        },
        byCategory: {
          ...prev.byCategory,
          [notification.category]: Math.max(0, (prev.byCategory[notification.category] || 0) - 1)
        }
      }))
    }
  }, [notifications])

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
    setStats(prev => ({
      ...prev,
      total: 0,
      unread: 0,
      byType: {},
      byPriority: {},
      byCategory: {}
    }))
  }, [])

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))
  }, [])

  // Enable/disable notification channel
  const toggleChannel = useCallback((channel: keyof NotificationPreferences['channels'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled
      }
    }))
  }, [])

  // Enable/disable notification category
  const toggleCategory = useCallback((category: keyof NotificationPreferences['categories'], enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          enabled
        }
      }
    }))
  }, [])

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const types = ['auction', 'bid', 'transaction', 'portfolio', 'system']
        const categories = ['info', 'success', 'warning', 'error']
        const priorities = ['low', 'medium', 'high', 'urgent']
        
        const newNotification: Notification = {
          id: `sim-${Date.now()}`,
          type: types[Math.floor(Math.random() * types.length)] as any,
          title: 'Simulated Notification',
          message: 'This is a simulated real-time notification',
          timestamp: new Date(),
          read: false,
          priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
          category: categories[Math.floor(Math.random() * categories.length)] as any,
          source: 'websocket'
        }
        
        setNotifications(prev => [newNotification, ...prev.slice(0, 49)])
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1
        }))
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connectWebSocket])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return {
    notifications,
    preferences,
    stats,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    toggleChannel,
    toggleCategory,
    connectWebSocket
  }
}
