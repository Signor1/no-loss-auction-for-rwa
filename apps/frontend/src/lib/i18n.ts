import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Translation types
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh' | 'ar'

export interface TranslationNamespace {
  [key: string]: string | TranslationNamespace
}

export interface Translations {
  [language: string]: TranslationNamespace
}

// Translation keys structure
export interface TranslationKeys {
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    delete: string
    edit: string
    view: string
    search: string
    filter: string
    sort: string
    close: string
    back: string
    next: string
    previous: string
    submit: string
    confirm: string
    yes: string
    no: string
    ok: string
    retry: string
    refresh: string
    copy: string
    share: string
    download: string
    upload: string
  }
  navigation: {
    home: string
    auctions: string
    assets: string
    portfolio: string
    profile: string
    settings: string
    help: string
    about: string
    contact: string
    logout: string
    login: string
    register: string
    dashboard: string
    search: string
    notifications: string
    messages: string
    wallet: string
  }
  auction: {
    title: string
    description: string
    currentBid: string
    startingBid: string
    timeRemaining: string
    endTime: string
    highestBidder: string
    totalBids: string
    placeBid: string
    bidHistory: string
    auctionDetails: string
    seller: string
    category: string
    condition: string
    location: string
    shipping: string
    returns: string
    authenticity: string
    documentation: string
    images: string
    videos: string
    specifications: string
    watchlist: string
    share: string
    report: string
    ended: string
    won: string
    lost: string
    active: string
    upcoming: string
    completed: string
    cancelled: string
  }
  bidding: {
    placeBid: string
    bidAmount: string
    minimumBid: string
    maximumBid: string
    bidIncrement: string
    confirmBid: string
    bidPlaced: string
    bidFailed: string
    outbid: string
    winning: string
    bidHistory: string
    autoBid: string
    maxBid: string
    currentBid: string
    yourBid: string
    bidStatus: string
    bidConfirmed: string
    bidError: string
    insufficientFunds: string
    auctionEnded: string
    bidTooLow: string
    bidAccepted: string
    bidRejected: string
  }
  wallet: {
    connect: string
    disconnect: string
    connected: string
    disconnected: string
    balance: string
    address: string
    network: string
    transaction: string
    send: string
    receive: string
    history: string
    pending: string
    completed: string
    failed: string
    gas: string
    gasPrice: string
    gasLimit: string
    estimate: string
    confirm: string
    sign: string
    approve: string
    reject: string
    insufficientBalance: string
    networkError: string
    transactionHash: string
    blockNumber: string
    timestamp: string
    from: string
    to: string
    value: string
    fee: string
    status: string
    speed: string
    slow: string
    average: string
    fast: string
  }
  search: {
    placeholder: string
    results: string
    noResults: string
    filters: string
    sortBy: string
    categories: string
    priceRange: string
    location: string
    condition: string
    seller: string
    endTime: string
    recentlyViewed: string
    savedSearches: string
    searchHistory: string
    suggestions: string
    trending: string
    popular: string
    new: string
    featured: string
    recommended: string
    similar: string
    related: string
  }
  notifications: {
    title: string
    markAsRead: string
    markAllAsRead: string
    delete: string
    clear: string
    settings: string
    preferences: string
    email: string
    push: string
    sms: string
    inApp: string
    auctionEnding: string
    outbid: string
    won: string
    payment: string
    shipping: string
    message: string
    update: string
    reminder: string
    alert: string
    warning: string
    error: string
    success: string
    info: string
  }
  errors: {
    generic: string
    network: string
    server: string
    validation: string
    authentication: string
    authorization: string
    notFound: string
    timeout: string
    rateLimit: string
    fileSize: string
    fileType: string
    required: string
    invalid: string
    duplicate: string
    expired: string
    cancelled: string
    failed: string
    unavailable: string
    maintenance: string
    forbidden: string
    conflict: string
    tooManyRequests: string
    internal: string
    serviceUnavailable: string
    badGateway: string
    gatewayTimeout: string
  }
  forms: {
    required: string
    optional: string
    invalid: string
    tooShort: string
    tooLong: string
    invalidEmail: string
    invalidPhone: string
    invalidUrl: string
    invalidDate: string
    invalidNumber: string
    passwordMismatch: string
    weakPassword: string
    strongPassword: string
    acceptTerms: string
    acceptPrivacy: string
    subscribe: string
    unsubscribe: string
    update: string
    create: string
    edit: string
    delete: string
    save: string
    cancel: string
    reset: string
    clear: string
    submit: string
    processing: string
    success: string
    error: string
  }
  time: {
    now: string
    minute: string
    minutes: string
    hour: string
    hours: string
    day: string
    days: string
    week: string
    weeks: string
    month: string
    months: string
    year: string
    years: string
    ago: string
    remaining: string
    left: string
    until: string
    since: string
    today: string
    yesterday: string
    tomorrow: string
    lastWeek: string
    nextWeek: string
    lastMonth: string
    nextMonth: string
    lastYear: string
    nextYear: string
    justNow: string
    inProgress: string
    completed: string
    scheduled: string
    overdue: string
  }
  currency: {
    usd: string
    eur: string
    gbp: string
    jpy: string
    cny: string
    krw: string
    inr: string
    brl: string
    cad: string
    aud: string
    chf: string
    sek: string
    nok: string
    dkk: string
    pln: string
    rub: string
    zar: string
    mxn: string
    ars: string
    clp: string
    cop: string
    pen: string
    uyu: string
    ves: string
  }
}

// English translations (base language)
const enTranslations: TranslationKeys = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    retry: 'Retry',
    refresh: 'Refresh',
    copy: 'Copy',
    share: 'Share',
    download: 'Download',
    upload: 'Upload'
  },
  navigation: {
    home: 'Home',
    auctions: 'Auctions',
    assets: 'Assets',
    portfolio: 'Portfolio',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    contact: 'Contact',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    search: 'Search',
    notifications: 'Notifications',
    messages: 'Messages',
    wallet: 'Wallet'
  },
  auction: {
    title: 'Auction',
    description: 'Description',
    currentBid: 'Current Bid',
    startingBid: 'Starting Bid',
    timeRemaining: 'Time Remaining',
    endTime: 'End Time',
    highestBidder: 'Highest Bidder',
    totalBids: 'Total Bids',
    placeBid: 'Place Bid',
    bidHistory: 'Bid History',
    auctionDetails: 'Auction Details',
    seller: 'Seller',
    category: 'Category',
    condition: 'Condition',
    location: 'Location',
    shipping: 'Shipping',
    returns: 'Returns',
    authenticity: 'Authenticity',
    documentation: 'Documentation',
    images: 'Images',
    videos: 'Videos',
    specifications: 'Specifications',
    watchlist: 'Watchlist',
    share: 'Share',
    report: 'Report',
    ended: 'Ended',
    won: 'Won',
    lost: 'Lost',
    active: 'Active',
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled'
  },
  bidding: {
    placeBid: 'Place Bid',
    bidAmount: 'Bid Amount',
    minimumBid: 'Minimum Bid',
    maximumBid: 'Maximum Bid',
    bidIncrement: 'Bid Increment',
    confirmBid: 'Confirm Bid',
    bidPlaced: 'Bid Placed',
    bidFailed: 'Bid Failed',
    outbid: 'You have been outbid',
    winning: 'You are winning',
    bidHistory: 'Bid History',
    autoBid: 'Auto Bid',
    maxBid: 'Max Bid',
    currentBid: 'Current Bid',
    yourBid: 'Your Bid',
    bidStatus: 'Bid Status',
    bidConfirmed: 'Bid Confirmed',
    bidError: 'Bid Error',
    insufficientFunds: 'Insufficient Funds',
    auctionEnded: 'Auction Ended',
    bidTooLow: 'Bid Too Low',
    bidAccepted: 'Bid Accepted',
    bidRejected: 'Bid Rejected'
  },
  wallet: {
    connect: 'Connect Wallet',
    disconnect: 'Disconnect',
    connected: 'Connected',
    disconnected: 'Disconnected',
    balance: 'Balance',
    address: 'Address',
    network: 'Network',
    transaction: 'Transaction',
    send: 'Send',
    receive: 'Receive',
    history: 'History',
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    gas: 'Gas',
    gasPrice: 'Gas Price',
    gasLimit: 'Gas Limit',
    estimate: 'Estimate',
    confirm: 'Confirm',
    sign: 'Sign',
    approve: 'Approve',
    reject: 'Reject',
    insufficientBalance: 'Insufficient Balance',
    networkError: 'Network Error',
    transactionHash: 'Transaction Hash',
    blockNumber: 'Block Number',
    timestamp: 'Timestamp',
    from: 'From',
    to: 'To',
    value: 'Value',
    fee: 'Fee',
    status: 'Status',
    speed: 'Speed',
    slow: 'Slow',
    average: 'Average',
    fast: 'Fast'
  },
  search: {
    placeholder: 'Search for auctions, assets, and more...',
    results: 'Results',
    noResults: 'No results found',
    filters: 'Filters',
    sortBy: 'Sort By',
    categories: 'Categories',
    priceRange: 'Price Range',
    location: 'Location',
    condition: 'Condition',
    seller: 'Seller',
    endTime: 'End Time',
    recentlyViewed: 'Recently Viewed',
    savedSearches: 'Saved Searches',
    searchHistory: 'Search History',
    suggestions: 'Suggestions',
    trending: 'Trending',
    popular: 'Popular',
    new: 'New',
    featured: 'Featured',
    recommended: 'Recommended',
    similar: 'Similar',
    related: 'Related'
  },
  notifications: {
    title: 'Notifications',
    markAsRead: 'Mark as Read',
    markAllAsRead: 'Mark All as Read',
    delete: 'Delete',
    clear: 'Clear',
    settings: 'Settings',
    preferences: 'Preferences',
    email: 'Email',
    push: 'Push',
    sms: 'SMS',
    inApp: 'In-App',
    auctionEnding: 'Auction Ending',
    outbid: 'Outbid',
    won: 'Won',
    payment: 'Payment',
    shipping: 'Shipping',
    message: 'Message',
    update: 'Update',
    reminder: 'Reminder',
    alert: 'Alert',
    warning: 'Warning',
    error: 'Error',
    success: 'Success',
    info: 'Info'
  },
  errors: {
    generic: 'Something went wrong',
    network: 'Network error',
    server: 'Server error',
    validation: 'Validation error',
    authentication: 'Authentication error',
    authorization: 'Authorization error',
    notFound: 'Not found',
    timeout: 'Request timeout',
    rateLimit: 'Too many requests',
    fileSize: 'File too large',
    fileType: 'Invalid file type',
    required: 'This field is required',
    invalid: 'Invalid input',
    duplicate: 'Duplicate entry',
    expired: 'Expired',
    cancelled: 'Cancelled',
    failed: 'Failed',
    unavailable: 'Unavailable',
    maintenance: 'Under maintenance',
    forbidden: 'Access forbidden',
    conflict: 'Conflict',
    tooManyRequests: 'Too many requests',
    internal: 'Internal server error',
    serviceUnavailable: 'Service unavailable',
    badGateway: 'Bad gateway',
    gatewayTimeout: 'Gateway timeout'
  },
  forms: {
    required: 'Required',
    optional: 'Optional',
    invalid: 'Invalid',
    tooShort: 'Too short',
    tooLong: 'Too long',
    invalidEmail: 'Invalid email',
    invalidPhone: 'Invalid phone number',
    invalidUrl: 'Invalid URL',
    invalidDate: 'Invalid date',
    invalidNumber: 'Invalid number',
    passwordMismatch: 'Passwords do not match',
    weakPassword: 'Password is too weak',
    strongPassword: 'Password strength is good',
    acceptTerms: 'You must accept the terms',
    acceptPrivacy: 'You must accept the privacy policy',
    subscribe: 'Subscribe to newsletter',
    unsubscribe: 'Unsubscribe',
    update: 'Update',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    reset: 'Reset',
    clear: 'Clear',
    submit: 'Submit',
    processing: 'Processing...',
    success: 'Success!',
    error: 'Error!'
  },
  time: {
    now: 'Now',
    minute: 'minute',
    minutes: 'minutes',
    hour: 'hour',
    hours: 'hours',
    day: 'day',
    days: 'days',
    week: 'week',
    weeks: 'weeks',
    month: 'month',
    months: 'months',
    year: 'year',
    years: 'years',
    ago: 'ago',
    remaining: 'remaining',
    left: 'left',
    until: 'until',
    since: 'since',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    lastWeek: 'Last week',
    nextWeek: 'Next week',
    lastMonth: 'Last month',
    nextMonth: 'Next month',
    lastYear: 'Last year',
    nextYear: 'Next year',
    justNow: 'Just now',
    inProgress: 'In progress',
    completed: 'Completed',
    scheduled: 'Scheduled',
    overdue: 'Overdue'
  },
  currency: {
    usd: 'USD',
    eur: 'EUR',
    gbp: 'GBP',
    jpy: 'JPY',
    cny: 'CNY',
    krw: 'KRW',
    inr: 'INR',
    brl: 'BRL',
    cad: 'CAD',
    aud: 'AUD',
    chf: 'CHF',
    sek: 'SEK',
    nok: 'NOK',
    dkk: 'DKK',
    pln: 'PLN',
    rub: 'RUB',
    zar: 'ZAR',
    mxn: 'MXN',
    ars: 'ARS',
    clp: 'CLP',
    cop: 'COP',
    pen: 'PEN',
    uyu: 'UYU',
    ves: 'VES'
  }
}

// Spanish translations (example)
const esTranslations: Partial<TranslationKeys> = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    close: 'Cerrar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Enviar',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    retry: 'Reintentar',
    refresh: 'Actualizar',
    copy: 'Copiar',
    share: 'Compartir',
    download: 'Descargar',
    upload: 'Subir'
  },
  navigation: {
    home: 'Inicio',
    auctions: 'Subastas',
    assets: 'Activos',
    portfolio: 'Portafolio',
    profile: 'Perfil',
    settings: 'Configuración',
    help: 'Ayuda',
    about: 'Acerca de',
    contact: 'Contacto',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    dashboard: 'Panel',
    search: 'Buscar',
    notifications: 'Notificaciones',
    messages: 'Mensajes',
    wallet: 'Billetera'
  }
  // ... more translations would go here
}

// All translations
const translations: Translations = {
  en: enTranslations,
  es: esTranslations,
  // Add other languages as needed
}

// Language context
interface I18nContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string
  formatCurrency: (amount: number, currency?: string) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Supported languages
export const supportedLanguages: Language[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar']

// RTL languages
export const rtlLanguages: Language[] = ['ar']

// I18n provider component
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    // Get language from localStorage or browser preference
    const storedLanguage = localStorage.getItem('language') as Language
    if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
      setLanguage(storedLanguage)
    } else {
      // Get browser language
      const browserLanguage = navigator.language.split('-')[0] as Language
      if (supportedLanguages.includes(browserLanguage)) {
        setLanguage(browserLanguage)
      }
    }
  }, [])

  useEffect(() => {
    // Save language preference
    localStorage.setItem('language', language)
    
    // Update document language and direction
    document.documentElement.lang = language
    document.documentElement.dir = rtlLanguages.includes(language) ? 'rtl' : 'ltr'
  }, [language])

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    if (typeof value !== 'string') {
      // Fallback to English if translation not found
      value = translations.en
      for (const k of keys) {
        value = value?.[k]
      }
    }
    
    if (typeof value !== 'string') {
      return key // Return key if no translation found
    }
    
    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param]?.toString() || match
      })
    }
    
    return value
  }, [language])

  // Format date
  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return new Intl.DateTimeFormat(language, options).format(date)
  }, [language])

  // Format number
  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(language, options).format(number)
  }, [language])

  // Format currency
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }, [language])

  const isRTL = rtlLanguages.includes(language)

  return (
    <I18nContext.Provider value={{
      language,
      setLanguage,
      t,
      formatDate,
      formatNumber,
      formatCurrency,
      isRTL
    }}>
      {children}
    </I18nContext.Provider>
  )
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Translation utilities
export const i18nUtils = {
  // Get translation key
  getKey: (key: string, language: Language): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return typeof value === 'string' ? value : key
  },

  // Check if translation exists
  hasTranslation: (key: string, language: Language): boolean => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return false
    }
    
    return typeof value === 'string'
  },

  // Get all available languages
  getAvailableLanguages: (): Language[] => {
    return supportedLanguages
  },

  // Get language display name
  getLanguageDisplayName: (language: Language): string => {
    const displayNames: Record<Language, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ja: '日本語',
      ko: '한국어',
      zh: '中文',
      ar: 'العربية'
    }
    return displayNames[language] || language
  },

  // Get native language name
  getNativeLanguageName: (language: Language): string => {
    const nativeNames: Record<Language, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ja: '日本語',
      ko: '한국어',
      zh: '中文',
      ar: 'العربية'
    }
    return nativeNames[language] || language
  },

  // Format relative time
  formatRelativeTime: (date: Date, language: Language): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })

    if (days > 0) return rtf.format(-days, 'day')
    if (hours > 0) return rtf.format(-hours, 'hour')
    if (minutes > 0) return rtf.format(-minutes, 'minute')
    return rtf.format(-seconds, 'second')
  },

  // Pluralization helper
  pluralize: (count: number, language: Language): string => {
    // Simplified pluralization - in real implementation would be more sophisticated
    if (language === 'en' || language === 'de' || language === 'it' || language === 'pt') {
      return count === 1 ? 'singular' : 'plural'
    }
    // Add more language-specific rules as needed
    return 'plural'
  }
}
