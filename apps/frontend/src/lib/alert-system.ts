import { useState, useEffect, useCallback } from 'react'

export interface Alert {
  id: string
  userId: string
  type: 'auction_ending' | 'outbid' | 'price_drop' | 'new_asset' | 'compliance' | 'custom'
  title: string
  message: string
  description?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'triggered' | 'dismissed' | 'expired'
  conditions: AlertCondition[]
  createdAt: Date
  triggeredAt?: Date
  expiresAt?: Date
  isRead: boolean
  metadata?: {
    auctionId?: string
    assetId?: string
    currentPrice?: number
    targetPrice?: number
    percentage?: number
    complianceType?: string
    dueDate?: Date
    link?: string
  }
  actions?: Array<{
    id: string
    label: string
    action: string
    style?: 'primary' | 'secondary' | 'danger'
  }>
}

export interface AlertCondition {
  type: 'price_threshold' | 'percentage_change' | 'time_remaining' | 'auction_status' | 'compliance_deadline' | 'custom'
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'greater_than_or_equal' | 'less_than_or_equal'
  field: string
  value: any
  unit?: string
}

export interface AuctionEndingAlert {
  id: string
  auctionId: string
  auctionTitle: string
  assetName: string
  currentBid: number
  endTime: Date
  timeRemaining: number
  userBid?: number
  isHighestBidder: boolean
  alertThresholds: {
    oneHour: boolean
    thirtyMinutes: boolean
    tenMinutes: boolean
    fiveMinutes: boolean
  }
}

export interface OutbidAlert {
  id: string
  auctionId: string
  auctionTitle: string
  assetName: string
  userBid: number
  newBid: number
  outbidAmount: number
  outbidPercentage: number
  newBidder?: string
  timestamp: Date
  canRebid: boolean
  timeRemaining: number
}

export interface PriceDropAlert {
  id: string
  assetId: string
  assetName: string
  assetCategory: string
  currentPrice: number
  previousPrice: number
  dropAmount: number
  dropPercentage: number
  alertThreshold: number
  timestamp: Date
  volume24h: number
  marketCap: number
  isSignificant: boolean
}

export interface NewAssetListing {
  id: string
  assetId: string
  assetName: string
  assetCategory: string
  description: string
  price: number
  minimumBid: number
  endTime: Date
  seller?: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary'
  features: string[]
  images: string[]
  listedAt: Date
  isWatched: boolean
}

export interface ComplianceReminder {
  id: string
  userId: string
  type: 'kyc' | 'aml' | 'document_expiry' | 'verification_required' | 'tax_reporting'
  title: string
  description: string
  dueDate: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  requiredActions: string[]
  documents?: Array<{
    id: string
    name: string
    type: string
    expiryDate?: Date
    status: 'valid' | 'expiring' | 'expired'
  }>
  penalties?: Array<{
    type: string
    description: string
    amount?: number
    currency?: string
  }>
  lastReminderSent?: Date
  reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'once'
}

export interface CustomAlert {
  id: string
  userId: string
  name: string
  description: string
  type: 'price' | 'volume' | 'auction' | 'portfolio' | 'market'
  conditions: AlertCondition[]
  isActive: boolean
  createdAt: Date
  lastTriggered?: Date
  triggerCount: number
  notificationChannels: Array<'in_app' | 'email' | 'sms' | 'push'>
  schedule?: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
    daysOfWeek: number[]
  }
  category?: string
  assets?: string[]
}

export interface AlertStats {
  total: number
  active: number
  triggered: number
  dismissed: number
  expired: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  recentActivity: Array<{
    date: Date
    type: string
    count: number
  }>
  triggerRate: number
  responseRate: number
}

export interface AlertPreferences {
  userId: string
  globalSettings: {
    enableAuctionAlerts: boolean
    enablePriceAlerts: boolean
    enableComplianceAlerts: boolean
    enableCustomAlerts: boolean
    quietHours: {
      enabled: boolean
      startTime: string
      endTime: string
      timezone: string
    }
    maxAlertsPerHour: number
    alertCooldown: number
  }
  auctionAlerts: {
    endingSoon: {
      enabled: boolean
      thresholds: Array<{
        minutes: number
        enabled: boolean
      }>
    }
    outbid: {
      enabled: boolean
      includeBidderInfo: boolean
      autoRebid: boolean
      maxRebidAmount: number
    }
    won: {
      enabled: boolean
      includePaymentInfo: boolean
    }
  }
  priceAlerts: {
    dropAlerts: {
      enabled: boolean
      threshold: number
      significantOnly: boolean
    }
    riseAlerts: {
      enabled: boolean
      threshold: number
    }
    volumeAlerts: {
      enabled: boolean
      threshold: number
    }
  }
  complianceAlerts: {
    kyc: {
      enabled: boolean
      advanceNotice: number
    }
    documentExpiry: {
      enabled: boolean
      advanceNotice: number
    }
    taxReporting: {
      enabled: boolean
      quarterly: boolean
      annual: boolean
    }
  }
}

// Mock data
export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    userId: 'user-123',
    type: 'auction_ending',
    title: 'Auction Ending Soon',
    message: 'Manhattan Tower A auction ends in 30 minutes',
    description: 'Current bid: $125,000. You are currently the highest bidder.',
    severity: 'high',
    status: 'active',
    conditions: [
      {
        type: 'time_remaining',
        operator: 'less_than_or_equal',
        field: 'time_remaining',
        value: 1800,
        unit: 'seconds'
      }
    ],
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    isRead: false,
    metadata: {
      auctionId: 'auction-1',
      assetId: 'asset-1',
      currentPrice: 125000,
      link: '/auction/auction-1'
    },
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
    ]
  },
  {
    id: 'alert-2',
    userId: 'user-123',
    type: 'outbid',
    title: 'You Have Been Outbid',
    message: 'Someone has outbid your offer of $120,000',
    description: 'New highest bid: $130,000. You have 25 minutes remaining to place a new bid.',
    severity: 'medium',
    status: 'triggered',
    conditions: [
      {
        type: 'auction_status',
        operator: 'equals',
        field: 'status',
        value: 'outbid'
      }
    ],
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000),
    isRead: true,
    metadata: {
      auctionId: 'auction-2',
      assetId: 'asset-2',
      currentPrice: 130000,
      targetPrice: 120000,
      percentage: 8.33,
      link: '/auction/auction-2'
    },
    actions: [
      {
        id: 'rebid',
        label: 'Place New Bid',
        action: 'bid',
        style: 'primary'
      },
      {
        id: 'view-auction',
        label: 'View Auction',
        action: 'navigate',
        style: 'secondary'
      }
    ]
  },
  {
    id: 'alert-3',
    userId: 'user-123',
    type: 'price_drop',
    title: 'Significant Price Drop',
    message: 'Gold Reserve Token has dropped by 5.2%',
    description: 'Price decreased from $2,200 to $2,085. This might be a good buying opportunity.',
    severity: 'medium',
    status: 'triggered',
    conditions: [
      {
        type: 'percentage_change',
        operator: 'less_than',
        field: 'percentage_change',
        value: -5
      }
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    metadata: {
      assetId: 'asset-3',
      currentPrice: 2085,
      targetPrice: 2200,
      percentage: -5.2,
      link: '/assets/asset-3'
    },
    actions: [
      {
        id: 'view-asset',
        label: 'View Asset',
        action: 'navigate',
        style: 'primary'
      },
      {
        id: 'place-order',
        label: 'Place Order',
        action: 'trade',
        style: 'secondary'
      }
    ]
  },
  {
    id: 'alert-4',
    userId: 'user-123',
    type: 'new_asset',
    title: 'New Asset Listed',
    message: 'Rare Painting #42 is now available for auction',
    description: 'Starting bid: $40,000. Estimated value: $50,000 - $75,000.',
    severity: 'low',
    status: 'active',
    conditions: [
      {
        type: 'custom',
        operator: 'equals',
        field: 'event',
        value: 'new_listing'
      }
    ],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true,
    metadata: {
      assetId: 'asset-4',
      link: '/assets/asset-4'
    },
    actions: [
      {
        id: 'view-asset',
        label: 'View Asset',
        action: 'navigate',
        style: 'primary'
      },
      {
        id: 'watch',
        label: 'Add to Watchlist',
        action: 'watch',
        style: 'secondary'
      }
    ]
  },
  {
    id: 'alert-5',
    userId: 'user-123',
    type: 'compliance',
    title: 'KYC Document Expiring Soon',
    message: 'Your proof of address document expires in 7 days',
    description: 'Please upload a new document before the expiry date to avoid account restrictions.',
    severity: 'high',
    status: 'active',
    conditions: [
      {
        type: 'compliance_deadline',
        operator: 'less_than_or_equal',
        field: 'days_remaining',
        value: 7
      }
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isRead: false,
    metadata: {
      complianceType: 'document_expiry',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      link: '/compliance/documents'
    },
    actions: [
      {
        id: 'upload-document',
        label: 'Upload Document',
        action: 'navigate',
        style: 'primary'
      },
      {
        id: 'view-compliance',
        label: 'View Compliance',
        action: 'navigate',
        style: 'secondary'
      }
    ]
  }
]

export const mockCustomAlerts: CustomAlert[] = [
  {
    id: 'custom-1',
    userId: 'user-123',
    name: 'Bitcoin Price Alert',
    description: 'Alert when Bitcoin drops below $25,000',
    type: 'price',
    conditions: [
      {
        type: 'price_threshold',
        operator: 'less_than',
        field: 'price',
        value: 25000,
        unit: 'USD'
      }
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    triggerCount: 2,
    lastTriggered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    notificationChannels: ['in_app', 'email'],
    category: 'cryptocurrency',
    assets: ['bitcoin']
  },
  {
    id: 'custom-2',
    userId: 'user-123',
    name: 'Real Estate Volume Spike',
    description: 'Alert when real estate trading volume increases by 50%',
    type: 'volume',
    conditions: [
      {
        type: 'percentage_change',
        operator: 'greater_than',
        field: 'volume_change',
        value: 50
      }
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    triggerCount: 1,
    lastTriggered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    notificationChannels: ['in_app', 'push'],
    category: 'real_estate'
  }
]

export const mockAlertStats: AlertStats = {
  total: 156,
  active: 23,
  triggered: 89,
  dismissed: 34,
  expired: 10,
  byType: {
    auction_ending: 45,
    outbid: 32,
    price_drop: 28,
    new_asset: 18,
    compliance: 15,
    custom: 18
  },
  bySeverity: {
    low: 68,
    medium: 52,
    high: 28,
    critical: 8
  },
  recentActivity: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
    type: ['auction_ending', 'outbid', 'price_drop', 'new_asset', 'compliance'][Math.floor(Math.random() * 5)],
    count: Math.floor(Math.random() * 10) + 1
  })),
  triggerRate: 67.3,
  responseRate: 78.5
}

export const mockAlertPreferences: AlertPreferences = {
  userId: 'user-123',
  globalSettings: {
    enableAuctionAlerts: true,
    enablePriceAlerts: true,
    enableComplianceAlerts: true,
    enableCustomAlerts: true,
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'America/New_York'
    },
    maxAlertsPerHour: 10,
    alertCooldown: 300
  },
  auctionAlerts: {
    endingSoon: {
      enabled: true,
      thresholds: [
        { minutes: 60, enabled: true },
        { minutes: 30, enabled: true },
        { minutes: 10, enabled: true },
        { minutes: 5, enabled: true }
      ]
    },
    outbid: {
      enabled: true,
      includeBidderInfo: false,
      autoRebid: false,
      maxRebidAmount: 50000
    },
    won: {
      enabled: true,
      includePaymentInfo: true
    }
  },
  priceAlerts: {
    dropAlerts: {
      enabled: true,
      threshold: 5,
      significantOnly: true
    },
    riseAlerts: {
      enabled: false,
      threshold: 10
    },
    volumeAlerts: {
      enabled: true,
      threshold: 25
    }
  },
  complianceAlerts: {
    kyc: {
      enabled: true,
      advanceNotice: 30
    },
    documentExpiry: {
      enabled: true,
      advanceNotice: 14
    },
    taxReporting: {
      enabled: true,
      quarterly: true,
      annual: true
    }
  }
}

// Hook for alert system
export function useAlertSystem() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [customAlerts, setCustomAlerts] = useState<CustomAlert[]>(mockCustomAlerts)
  const [stats, setStats] = useState<AlertStats>(mockAlertStats)
  const [preferences, setPreferences] = useState<AlertPreferences>(mockAlertPreferences)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check auction ending alerts
  const checkAuctionEndingAlerts = useCallback(() => {
    // In a real implementation, this would check active auctions
    const newAlerts: Alert[] = []
    
    // Simulate auction ending check
    if (Math.random() > 0.8) {
      const auctionEndingAlert: Alert = {
        id: `auction-${Date.now()}`,
        userId: 'user-123',
        type: 'auction_ending',
        title: 'Auction Ending Soon',
        message: `Auction ends in ${Math.floor(Math.random() * 60) + 5} minutes`,
        severity: 'high',
        status: 'active',
        conditions: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (Math.floor(Math.random() * 60) + 5) * 60 * 1000),
        isRead: false,
        metadata: {
          auctionId: `auction-${Math.floor(Math.random() * 1000)}`,
          link: `/auction/auction-${Math.floor(Math.random() * 1000)}`
        }
      }
      newAlerts.push(auctionEndingAlert)
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev])
      setStats(prev => ({
        ...prev,
        total: prev.total + newAlerts.length,
        active: prev.active + newAlerts.length
      }))
    }
  }, [])

  // Check outbid alerts
  const checkOutbidAlerts = useCallback(() => {
    // In a real implementation, this would check user's active bids
    if (Math.random() > 0.9) {
      const outbidAlert: Alert = {
        id: `outbid-${Date.now()}`,
        userId: 'user-123',
        type: 'outbid',
        title: 'You Have Been Outbid',
        message: 'Someone has outbid your offer',
        severity: 'medium',
        status: 'triggered',
        conditions: [],
        createdAt: new Date(),
        triggeredAt: new Date(),
        isRead: false,
        metadata: {
          auctionId: `auction-${Math.floor(Math.random() * 1000)}`,
          currentPrice: Math.floor(Math.random() * 50000) + 100000,
          targetPrice: Math.floor(Math.random() * 30000) + 80000,
          percentage: Math.random() * 20,
          link: `/auction/auction-${Math.floor(Math.random() * 1000)}`
        }
      }
      
      setAlerts(prev => [outbidAlert, ...prev])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        triggered: prev.triggered + 1
      }))
    }
  }, [])

  // Check price drop alerts
  const checkPriceDropAlerts = useCallback(() => {
    // In a real implementation, this would check price movements
    if (Math.random() > 0.85) {
      const priceDropAlert: Alert = {
        id: `price-drop-${Date.now()}`,
        userId: 'user-123',
        type: 'price_drop',
        title: 'Significant Price Drop',
        message: `Asset price dropped by ${(Math.random() * 10 + 2).toFixed(1)}%`,
        severity: 'medium',
        status: 'triggered',
        conditions: [],
        createdAt: new Date(),
        triggeredAt: new Date(),
        isRead: false,
        metadata: {
          assetId: `asset-${Math.floor(Math.random() * 1000)}`,
          currentPrice: Math.floor(Math.random() * 5000) + 1000,
          targetPrice: Math.floor(Math.random() * 6000) + 1500,
          percentage: -(Math.random() * 10 + 2),
          link: `/assets/asset-${Math.floor(Math.random() * 1000)}`
        }
      }
      
      setAlerts(prev => [priceDropAlert, ...prev])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        triggered: prev.triggered + 1
      }))
    }
  }, [])

  // Check new asset listings
  const checkNewAssetListings = useCallback(() => {
    // In a real implementation, this would check new listings
    if (Math.random() > 0.7) {
      const newAssetAlert: Alert = {
        id: `new-asset-${Date.now()}`,
        userId: 'user-123',
        type: 'new_asset',
        title: 'New Asset Listed',
        message: `New asset available: ${['Rare Painting', 'Vintage Car', 'Real Estate', 'Collectible'][Math.floor(Math.random() * 4)]}`,
        severity: 'low',
        status: 'active',
        conditions: [],
        createdAt: new Date(),
        isRead: false,
        metadata: {
          assetId: `asset-${Math.floor(Math.random() * 1000)}`,
          link: `/assets/asset-${Math.floor(Math.random() * 1000)}`
        }
      }
      
      setAlerts(prev => [newAssetAlert, ...prev])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        active: prev.active + 1
      }))
    }
  }, [])

  // Check compliance reminders
  const checkComplianceReminders = useCallback(() => {
    // In a real implementation, this would check compliance requirements
    if (Math.random() > 0.95) {
      const complianceAlert: Alert = {
        id: `compliance-${Date.now()}`,
        userId: 'user-123',
        type: 'compliance',
        title: 'Compliance Reminder',
        message: `${['KYC verification', 'Document expiry', 'Tax reporting'][Math.floor(Math.random() * 3)]} required`,
        severity: 'high',
        status: 'active',
        conditions: [],
        createdAt: new Date(),
        isRead: false,
        metadata: {
          complianceType: 'kyc',
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          link: '/compliance'
        }
      }
      
      setAlerts(prev => [complianceAlert, ...prev])
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        active: prev.active + 1
      }))
    }
  }, [])

  // Create custom alert
  const createCustomAlert = useCallback((alertData: Omit<CustomAlert, 'id' | 'userId' | 'createdAt' | 'triggerCount'>) => {
    const newAlert: CustomAlert = {
      ...alertData,
      id: `custom-${Date.now()}`,
      userId: 'user-123',
      createdAt: new Date(),
      triggerCount: 0
    }
    
    setCustomAlerts(prev => [...prev, newAlert])
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      active: prev.active + 1
    }))
  }, [])

  // Update custom alert
  const updateCustomAlert = useCallback((alertId: string, updates: Partial<CustomAlert>) => {
    setCustomAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, ...updates } : alert
    ))
  }, [])

  // Delete custom alert
  const deleteCustomAlert = useCallback((alertId: string) => {
    setCustomAlerts(prev => prev.filter(alert => alert.id !== alertId))
    setStats(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      active: Math.max(0, prev.active - 1)
    }))
  }, [])

  // Toggle custom alert
  const toggleCustomAlert = useCallback((alertId: string) => {
    setCustomAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    ))
  }, [])

  // Mark alert as read
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ))
  }, [])

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'dismissed' as const } : alert
    ))
    setStats(prev => ({
      ...prev,
      active: Math.max(0, prev.active - 1),
      dismissed: prev.dismissed + 1
    }))
  }, [])

  // Delete alert
  const deleteAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    setStats(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      active: Math.max(0, prev.active - 1)
    }))
  }, [])

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<AlertPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))
  }, [])

  // Simulate real-time alert checking
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuctionEndingAlerts()
      checkOutbidAlerts()
      checkPriceDropAlerts()
      checkNewAssetListings()
      checkComplianceReminders()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [checkAuctionEndingAlerts, checkOutbidAlerts, checkPriceDropAlerts, checkNewAssetListings, checkComplianceReminders])

  return {
    alerts,
    customAlerts,
    stats,
    preferences,
    isLoading,
    error,
    createCustomAlert,
    updateCustomAlert,
    deleteCustomAlert,
    toggleCustomAlert,
    markAlertAsRead,
    dismissAlert,
    deleteAlert,
    updatePreferences,
    checkAuctionEndingAlerts,
    checkOutbidAlerts,
    checkPriceDropAlerts,
    checkNewAssetListings,
    checkComplianceReminders
  }
}
