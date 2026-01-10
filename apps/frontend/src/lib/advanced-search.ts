import { useState, useEffect, useCallback, useMemo } from 'react'

export interface SearchFilters {
  query: string
  categories: string[]
  priceRange: {
    min: number
    max: number
  }
  dateRange: {
    start: Date | null
    end: Date | null
  }
  assetType: string[]
  status: string[]
  location: string[]
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'popularity'
  features: string[]
  tags: string[]
  sellerRating: {
    min: number
    max: number
  }
  auctionType: string[]
  endTime: {
    type: 'any' | 'ending_soon' | 'new' | 'custom'
    hours?: number
  }
}

export interface SearchResult {
  id: string
  type: 'auction' | 'asset' | 'user' | 'transaction'
  title: string
  description: string
  category: string
  subcategory?: string
  price?: number
  currency?: string
  imageUrl?: string
  link: string
  relevanceScore: number
  highlights: {
    title?: string[]
    description?: string[]
    category?: string[]
    tags?: string[]
  }
  metadata: {
    auctionId?: string
    assetId?: string
    sellerId?: string
    currentBid?: number
    endTime?: Date
    location?: string
    features?: string[]
    tags?: string[]
    rating?: number
    reviews?: number
    views?: number
    createdAt?: Date
    updatedAt?: Date
  }
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  description?: string
  filters: SearchFilters
  isActive: boolean
  notificationEnabled: boolean
  createdAt: Date
  lastRun?: Date
  resultCount: number
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly'
  tags: string[]
}

export interface SearchHistory {
  id: string
  userId: string
  query: string
  filters: Partial<SearchFilters>
  resultCount: number
  timestamp: Date
  clickedResult?: {
    id: string
    title: string
    type: string
  }
}

export interface SearchSuggestion {
  text: string
  type: 'query' | 'category' | 'tag' | 'location' | 'seller'
  count: number
  category?: string
  imageUrl?: string
}

export interface SearchAnalytics {
  totalSearches: number
  averageResults: number
  popularQueries: Array<{
    query: string
    count: number
    averageResults: number
  }>
  popularFilters: Array<{
    filter: string
    value: string
    count: number
  }>
  searchTrends: Array<{
    date: Date
    searches: number
    uniqueQueries: number
  }>
  conversionRate: number
  clickThroughRate: number
}

// Mock data
export const mockSearchResults: SearchResult[] = [
  {
    id: 'result-1',
    type: 'auction',
    title: 'Luxury Manhattan Penthouse',
    description: 'Stunning 3-bedroom penthouse with panoramic city views, modern amenities, and premium finishes throughout.',
    category: 'real_estate',
    subcategory: 'residential',
    price: 2500000,
    currency: 'USD',
    imageUrl: '/api/placeholder/400/300',
    link: '/auction/auction-1',
    relevanceScore: 0.95,
    highlights: {
      title: ['Luxury', 'Manhattan', 'Penthouse'],
      description: ['Stunning', 'panoramic', 'city views']
    },
    metadata: {
      auctionId: 'auction-1',
      assetId: 'asset-1',
      sellerId: 'seller-1',
      currentBid: 2100000,
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      location: 'Manhattan, New York',
      features: ['3 bedrooms', 'City views', 'Modern amenities'],
      tags: ['luxury', 'penthouse', 'manhattan', 'real-estate'],
      rating: 4.8,
      reviews: 127,
      views: 3420,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  },
  {
    id: 'result-2',
    type: 'asset',
    title: 'Rare Vintage Rolex Submariner',
    description: '1965 Rolex Submariner Ref. 5513 in excellent condition, original box and papers included.',
    category: 'collectibles',
    subcategory: 'watches',
    price: 85000,
    currency: 'USD',
    imageUrl: '/api/placeholder/400/300',
    link: '/assets/asset-2',
    relevanceScore: 0.88,
    highlights: {
      title: ['Rare', 'Vintage', 'Rolex', 'Submariner'],
      description: ['1965', 'excellent condition', 'original']
    },
    metadata: {
      assetId: 'asset-2',
      sellerId: 'seller-2',
      location: 'Geneva, Switzerland',
      features: ['1965 model', 'Original papers', 'Excellent condition'],
      tags: ['rolex', 'submariner', 'vintage', 'watches', 'collectible'],
      rating: 4.9,
      reviews: 89,
      views: 2156,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'result-3',
    type: 'auction',
    title: 'Contemporary Art Collection',
    description: 'Curated collection of emerging artists featuring mixed media, sculptures, and digital art pieces.',
    category: 'art',
    subcategory: 'contemporary',
    price: 125000,
    currency: 'USD',
    imageUrl: '/api/placeholder/400/300',
    link: '/auction/auction-3',
    relevanceScore: 0.82,
    highlights: {
      title: ['Contemporary', 'Art', 'Collection'],
      description: ['emerging artists', 'mixed media', 'digital art']
    },
    metadata: {
      auctionId: 'auction-3',
      assetId: 'asset-3',
      sellerId: 'seller-3',
      currentBid: 95000,
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: 'London, UK',
      features: ['Mixed media', 'Sculptures', 'Digital art'],
      tags: ['art', 'contemporary', 'collection', 'emerging-artists'],
      rating: 4.6,
      reviews: 45,
      views: 1876,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'result-4',
    type: 'user',
    title: 'Premium Art Dealer',
    description: 'Specialized in contemporary art and rare collectibles with 15+ years of experience.',
    category: 'users',
    subcategory: 'dealers',
    imageUrl: '/api/placeholder/400/300',
    link: '/users/user-4',
    relevanceScore: 0.75,
    highlights: {
      title: ['Premium', 'Art', 'Dealer'],
      description: ['contemporary art', 'rare collectibles', '15+ years']
    },
    metadata: {
      sellerId: 'seller-4',
      location: 'Paris, France',
      features: ['Contemporary art specialist', 'Rare collectibles', '15+ years experience'],
      tags: ['art-dealer', 'contemporary-art', 'collectibles', 'paris'],
      rating: 4.9,
      reviews: 234,
      views: 5678,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  },
  {
    id: 'result-5',
    type: 'transaction',
    title: 'Completed Luxury Watch Sale',
    description: 'Successful transaction for Patek Philippe Nautilus with buyer verification and secure delivery.',
    category: 'transactions',
    subcategory: 'completed',
    price: 180000,
    currency: 'USD',
    imageUrl: '/api/placeholder/400/300',
    link: '/transactions/tx-5',
    relevanceScore: 0.68,
    highlights: {
      title: ['Completed', 'Luxury', 'Watch', 'Sale'],
      description: ['Patek Philippe', 'Nautilus', 'buyer verification']
    },
    metadata: {
      assetId: 'asset-5',
      sellerId: 'seller-5',
      location: 'Dubai, UAE',
      features: ['Patek Philippe', 'Buyer verified', 'Secure delivery'],
      tags: ['patek-philippe', 'nautilus', 'luxury-watch', 'completed-transaction'],
      rating: 5.0,
      reviews: 1,
      views: 892,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  }
]

export const mockSavedSearches: SavedSearch[] = [
  {
    id: 'saved-1',
    userId: 'user-123',
    name: 'Luxury Real Estate',
    description: 'High-end properties in major cities',
    filters: {
      query: 'luxury real estate',
      categories: ['real_estate'],
      priceRange: { min: 1000000, max: 10000000 },
      dateRange: { start: null, end: null },
      assetType: [],
      status: ['active'],
      location: ['New York', 'Los Angeles', 'Miami'],
      sortBy: 'price_desc',
      features: [],
      tags: ['luxury', 'premium'],
      sellerRating: { min: 4.5, max: 5 },
      auctionType: [],
      endTime: { type: 'any' }
    },
    isActive: true,
    notificationEnabled: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resultCount: 23,
    frequency: 'daily',
    tags: ['real-estate', 'luxury']
  },
  {
    id: 'saved-2',
    userId: 'user-123',
    name: 'Vintage Watches',
    description: 'Rare and collectible timepieces',
    filters: {
      query: 'vintage watches',
      categories: ['collectibles'],
      priceRange: { min: 10000, max: 200000 },
      dateRange: { start: null, end: null },
      assetType: ['watches'],
      status: ['active'],
      location: [],
      sortBy: 'relevance',
      features: ['vintage', 'original'],
      tags: ['rolex', 'patek', 'vintage'],
      sellerRating: { min: 4.0, max: 5 },
      auctionType: [],
      endTime: { type: 'any' }
    },
    isActive: true,
    notificationEnabled: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000),
    resultCount: 18,
    frequency: 'weekly',
    tags: ['watches', 'vintage', 'collectibles']
  }
]

export const mockSearchHistory: SearchHistory[] = [
  {
    id: 'history-1',
    userId: 'user-123',
    query: 'manhattan penthouse',
    filters: {
      categories: ['real_estate'],
      priceRange: { min: 1000000, max: 5000000 }
    },
    resultCount: 12,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    clickedResult: {
      id: 'result-1',
      title: 'Luxury Manhattan Penthouse',
      type: 'auction'
    }
  },
  {
    id: 'history-2',
    userId: 'user-123',
    query: 'rolex submariner',
    filters: {
      categories: ['collectibles'],
      assetType: ['watches']
    },
    resultCount: 8,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'history-3',
    userId: 'user-123',
    query: 'contemporary art',
    filters: {
      categories: ['art'],
      sortBy: 'popularity'
    },
    resultCount: 34,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    clickedResult: {
      id: 'result-3',
      title: 'Contemporary Art Collection',
      type: 'auction'
    }
  }
]

export const mockSearchSuggestions: SearchSuggestion[] = [
  { text: 'manhattan penthouse', type: 'query', count: 1234 },
  { text: 'rolex submariner', type: 'query', count: 892 },
  { text: 'contemporary art', type: 'query', count: 756 },
  { text: 'real_estate', type: 'category', count: 3456, category: 'Real Estate' },
  { text: 'collectibles', type: 'category', count: 2890, category: 'Collectibles' },
  { text: 'art', type: 'category', count: 2134, category: 'Art' },
  { text: 'luxury', type: 'tag', count: 1876 },
  { text: 'vintage', type: 'tag', count: 1234 },
  { text: 'rare', type: 'tag', count: 987 },
  { text: 'New York', type: 'location', count: 2345 },
  { text: 'London', type: 'location', count: 1876 },
  { text: 'Paris', type: 'location', count: 1543 }
]

export const mockSearchAnalytics: SearchAnalytics = {
  totalSearches: 15420,
  averageResults: 23.5,
  popularQueries: [
    { query: 'luxury real estate', count: 1234, averageResults: 45.2 },
    { query: 'vintage watches', count: 892, averageResults: 18.7 },
    { query: 'contemporary art', count: 756, averageResults: 34.1 },
    { query: 'rare collectibles', count: 623, averageResults: 28.9 },
    { query: 'manhattan property', count: 567, averageResults: 12.3 }
  ],
  popularFilters: [
    { filter: 'category', value: 'real_estate', count: 3456 },
    { filter: 'category', value: 'collectibles', count: 2890 },
    { filter: 'priceRange', value: '100000-500000', count: 1876 },
    { filter: 'location', value: 'New York', count: 1654 },
    { filter: 'sortBy', value: 'price_desc', count: 1432 }
  ],
  searchTrends: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
    searches: Math.floor(Math.random() * 500) + 200,
    uniqueQueries: Math.floor(Math.random() * 100) + 50
  })),
  conversionRate: 12.5,
  clickThroughRate: 67.8
}

// Hook for advanced search
export function useAdvancedSearch() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>(mockSearchResults)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(mockSavedSearches)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(mockSearchHistory)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>(mockSearchSuggestions)
  const [analytics, setAnalytics] = useState<SearchAnalytics>(mockSearchAnalytics)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultFilters: SearchFilters = {
    query: '',
    categories: [],
    priceRange: { min: 0, max: 10000000 },
    dateRange: { start: null, end: null },
    assetType: [],
    status: [],
    location: [],
    sortBy: 'relevance',
    features: [],
    tags: [],
    sellerRating: { min: 0, max: 5 },
    auctionType: [],
    endTime: { type: 'any' }
  }

  // Perform search
  const performSearch = useCallback(async (filters: SearchFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // Filter results based on search criteria
      let filteredResults = mockSearchResults.filter(result => {
        // Text search
        if (filters.query) {
          const query = filters.query.toLowerCase()
          const searchText = `${result.title} ${result.description} ${result.metadata.tags?.join(' ')}`.toLowerCase()
          if (!searchText.includes(query)) return false
        }

        // Category filter
        if (filters.categories.length > 0 && !filters.categories.includes(result.category)) {
          return false
        }

        // Price filter
        if (result.price) {
          if (result.price < filters.priceRange.min || result.price > filters.priceRange.max) {
            return false
          }
        }

        // Location filter
        if (filters.location.length > 0 && result.metadata.location) {
          const locationMatch = filters.location.some(loc => 
            result.metadata.location?.toLowerCase().includes(loc.toLowerCase())
          )
          if (!locationMatch) return false
        }

        // Tags filter
        if (filters.tags.length > 0 && result.metadata.tags) {
          const tagMatch = filters.tags.some(tag => 
            result.metadata.tags?.includes(tag)
          )
          if (!tagMatch) return false
        }

        return true
      })

      // Sort results
      filteredResults.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return (a.price || 0) - (b.price || 0)
          case 'price_desc':
            return (b.price || 0) - (a.price || 0)
          case 'date_asc':
            return (a.metadata.createdAt?.getTime() || 0) - (b.metadata.createdAt?.getTime() || 0)
          case 'date_desc':
            return (b.metadata.createdAt?.getTime() || 0) - (a.metadata.createdAt?.getTime() || 0)
          case 'popularity':
            return (b.metadata.views || 0) - (a.metadata.views || 0)
          case 'relevance':
          default:
            return b.relevanceScore - a.relevanceScore
        }
      })

      setSearchResults(filteredResults)

      // Add to search history
      const historyEntry: SearchHistory = {
        id: `history-${Date.now()}`,
        userId: 'user-123',
        query: filters.query,
        filters: filters,
        resultCount: filteredResults.length,
        timestamp: new Date()
      }

      setSearchHistory(prev => [historyEntry, ...prev.slice(0, 49)])

      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        totalSearches: prev.totalSearches + 1,
        averageResults: (prev.averageResults * prev.totalSearches + filteredResults.length) / (prev.totalSearches + 1)
      }))

    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (!query) {
      setSuggestions(mockSearchSuggestions.slice(0, 10))
      return
    }

    const queryLower = query.toLowerCase()
    const filteredSuggestions = mockSearchSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(queryLower)
    ).slice(0, 8)

    setSuggestions(filteredSuggestions)
  }, [])

  // Save search
  const saveSearch = useCallback((name: string, description: string, filters: SearchFilters) => {
    const savedSearch: SavedSearch = {
      id: `saved-${Date.now()}`,
      userId: 'user-123',
      name,
      description,
      filters,
      isActive: true,
      notificationEnabled: false,
      createdAt: new Date(),
      resultCount: searchResults.length,
      frequency: 'daily',
      tags: []
    }

    setSavedSearches(prev => [...prev, savedSearch])
  }, [searchResults.length])

  // Update saved search
  const updateSavedSearch = useCallback((searchId: string, updates: Partial<SavedSearch>) => {
    setSavedSearches(prev => prev.map(search => 
      search.id === searchId ? { ...search, ...updates } : search
    ))
  }, [])

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => prev.filter(search => search.id !== searchId))
  }, [])

  // Toggle saved search
  const toggleSavedSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => prev.map(search => 
      search.id === searchId ? { ...search, isActive: !search.isActive } : search
    ))
  }, [])

  // Run saved search
  const runSavedSearch = useCallback((savedSearch: SavedSearch) => {
    performSearch(savedSearch.filters)
    updateSavedSearch(savedSearch.id, {
      lastRun: new Date(),
      resultCount: searchResults.length
    })
  }, [performSearch, searchResults.length, updateSavedSearch])

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  // Delete search history item
  const deleteHistoryItem = useCallback((historyId: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== historyId))
  }, [])

  // Get popular searches
  const popularSearches = useMemo(() => {
    return analytics.popularQueries.slice(0, 10)
  }, [analytics.popularQueries])

  // Get recent searches
  const recentSearches = useMemo(() => {
    return searchHistory.slice(0, 10)
  }, [searchHistory])

  return {
    searchResults,
    savedSearches,
    searchHistory,
    suggestions,
    analytics,
    isLoading,
    error,
    performSearch,
    getSuggestions,
    saveSearch,
    updateSavedSearch,
    deleteSavedSearch,
    toggleSavedSearch,
    runSavedSearch,
    clearSearchHistory,
    deleteHistoryItem,
    popularSearches,
    recentSearches,
    defaultFilters
  }
}
