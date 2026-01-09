'use client';

import { useState } from 'react';
import { useAuctionDiscovery, useFeaturedAuctions, Auction, AuctionFilters } from '@/lib/auction-discovery';
import { AuctionCard } from './AuctionCard';
import { AuctionFiltersPanel } from './AuctionFiltersPanel';
import { FeaturedAuctions } from './FeaturedAuctions';

export function AuctionDiscovery() {
  const {
    auctions,
    savedAuctions,
    watchlist,
    isLoading,
    filters,
    pagination,
    updateFilters,
    changePage,
  } = useAuctionDiscovery();
  
  const { featuredAuctions, isLoading: featuredLoading } = useFeaturedAuctions();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auction Discovery</h1>
              <p className="text-sm text-gray-600 mt-1">
                Discover and participate in RWA tokenization auctions
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2v2a2 2 0 012 2h2a2 2 0 012-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 2H6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V4z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              {/* Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01.293.707l-6.414 6.414a1 1 0 01-.707 0l-6.414-6.414A1 1 0 013 7.586V5a1 1 0 011-1z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 011-1H4a1 1 0 01-1-1v-6z" />
                </svg>
                <span>Filters</span>
                {(filters.status !== 'active' || filters.category !== 'all' || filters.priceRange !== 'all' || filters.search) && (
                  <span className="ml-2 bg-blue-800 text-white text-xs px-2 py-1 rounded-full">
                    {Object.values(filters).filter(v => v !== 'all' && v !== '').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Auctions */}
      {!showFilters && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <FeaturedAuctions auctions={featuredAuctions} isLoading={featuredLoading} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <AuctionFiltersPanel
                filters={filters}
                onFiltersChange={updateFilters}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {filters.status === 'all' ? 'All Auctions' : 
                   filters.status === 'active' ? 'Active Auctions' :
                   filters.status === 'upcoming' ? 'Upcoming Auctions' : 'Ended Auctions'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pagination.totalItems} auction{pagination.totalItems !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="ending-soon">Ending Soon</option>
                  <option value="highest-bid">Highest Bid</option>
                  <option value="newest">Newest</option>
                  <option value="lowest-reserve">Lowest Reserve</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Loading auctions...</span>
              </div>
            ) : auctions.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V4a2 2 0 012-2h6a2 2 0 012 2v4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No auctions found</h3>
                <p className="mt-2 text-gray-600">
                  Try adjusting your filters or check back later for new auctions.
                </p>
                <button
                  onClick={() => updateFilters({ 
                    status: 'active', 
                    category: 'all', 
                    priceRange: 'all', 
                    search: '' 
                  })}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Auctions Grid/List */
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {auctions.map((auction) => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    isSaved={savedAuctions.has(auction.id)}
                    isWatched={watchlist.has(auction.id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && !isLoading && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => changePage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => changePage(page)}
                      className={`w-10 h-10 rounded-md text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => changePage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
