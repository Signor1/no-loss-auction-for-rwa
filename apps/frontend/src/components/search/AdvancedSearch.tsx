'use client'

import React, { useState, useEffect } from 'react'
import { useAdvancedSearch } from '@/lib/advanced-search'

export default function AdvancedSearch() {
  const {
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
  } = useAdvancedSearch()

  const [filters, setFilters] = useState(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'saved' | 'history'>('results')

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`
    return `$${amount.toFixed(2)}`
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auction': return '🏛️'
      case 'asset': return '📦'
      case 'user': return '👤'
      case 'transaction': return '💸'
      default: return '📄'
    }
  }

  const handleSearch = () => {
    performSearch(filters)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'query') {
      setFilters({ ...filters, query: suggestion.text })
    } else if (suggestion.type === 'category') {
      setFilters({ ...filters, categories: [...filters.categories, suggestion.text] })
    }
    setShowSuggestions(false)
    handleSearch()
  }

  const handleSaveSearch = () => {
    if (saveName.trim()) {
      saveSearch(saveName, saveDescription, filters)
      setShowSaveModal(false)
      setSaveName('')
      setSaveDescription('')
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  useEffect(() => {
    if (filters.query) {
      getSuggestions(filters.query)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [filters.query, getSuggestions])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Search</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search auctions, assets, and more with powerful filters
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Save Search
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="relative">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for auctions, assets, users..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                onFocus={() => setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">{suggestion.text}</span>
                        <span className="text-xs text-gray-500 capitalize">({suggestion.type})</span>
                      </div>
                      <span className="text-xs text-gray-400">{suggestion.count} results</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="space-y-2">
                  {['real_estate', 'collectibles', 'art', 'vehicles', 'jewelry'].map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('categories', [...filters.categories, category])
                          } else {
                            handleFilterChange('categories', filters.categories.filter(c => c !== category))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {category.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange.min}
                    onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, min: Number(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange.max}
                    onChange={(e) => handleFilterChange('priceRange', { ...filters.priceRange, max: Number(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="date_asc">Date: Oldest First</option>
                  <option value="date_desc">Date: Newest First</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Enter location"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Seller Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seller Rating</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.sellerRating.min}
                    onChange={(e) => handleFilterChange('sellerRating', { ...filters.sellerRating, min: Number(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    max="5"
                    step="0.1"
                    value={filters.sellerRating.max}
                    onChange={(e) => handleFilterChange('sellerRating', { ...filters.sellerRating, max: Number(e.target.value) })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  placeholder="Enter tags (comma separated)"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 border border-transparent rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['results', 'saved', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
              {tab === 'saved' && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {savedSearches.length}
                </span>
              )}
              {tab === 'history' && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {searchHistory.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Search Results */}
        {activeTab === 'results' && (
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {searchResults.length === 0 && !isLoading ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No results found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{getTypeIcon(result.type)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                              {result.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">{result.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="capitalize">{result.type.replace('_', ' ')}</span>
                              <span className="capitalize">{result.category.replace('_', ' ')}</span>
                              {result.price && (
                                <span className="font-medium text-gray-900">{formatCurrency(result.price)}</span>
                              )}
                              {result.metadata.location && (
                                <span>📍 {result.metadata.location}</span>
                              )}
                              {result.metadata.rating && (
                                <span>⭐ {result.metadata.rating.toFixed(1)} ({result.metadata.reviews})</span>
                              )}
                            </div>
                            {result.metadata.tags && result.metadata.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {result.metadata.tags.slice(0, 5).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Searches */}
        {activeTab === 'saved' && (
          <div className="p-6">
            <div className="space-y-4">
              {savedSearches.map((savedSearch) => (
                <div key={savedSearch.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{savedSearch.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          savedSearch.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {savedSearch.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {savedSearch.notificationEnabled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🔔 Notifications
                          </span>
                        )}
                      </div>
                      {savedSearch.description && (
                        <p className="mt-1 text-sm text-gray-600">{savedSearch.description}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Results: {savedSearch.resultCount}</span>
                        <span>Created: {formatTime(savedSearch.createdAt)}</span>
                        {savedSearch.lastRun && (
                          <span>Last run: {formatTime(savedSearch.lastRun)}</span>
                        )}
                        <span>Frequency: {savedSearch.frequency}</span>
                      </div>
                      {savedSearch.filters.query && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          Query: "{savedSearch.filters.query}"
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => runSavedSearch(savedSearch)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Run Search
                      </button>
                      <button
                        onClick={() => toggleSavedSearch(savedSearch.id)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(savedSearch.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search History */}
        {activeTab === 'history' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Searches</h3>
              <button
                onClick={clearSearchHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-2">
              {searchHistory.map((historyItem) => (
                <div key={historyItem.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{historyItem.query}</span>
                      {historyItem.clickedResult && (
                        <span className="text-xs text-gray-500">
                          → {historyItem.clickedResult.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{historyItem.resultCount} results</span>
                      <span>{formatTime(historyItem.timestamp)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteHistoryItem(historyItem.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popular Searches Sidebar */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Searches</h3>
        <div className="space-y-2">
          {popularSearches.map((search, index) => (
            <div
              key={index}
              onClick={() => {
                setFilters({ ...filters, query: search.query })
                handleSearch()
              }}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-sm text-gray-700">{search.query}</span>
              <span className="text-xs text-gray-500">{search.count} searches</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Search</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter search name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter search description"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                className="px-4 py-2 border border-transparent rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
