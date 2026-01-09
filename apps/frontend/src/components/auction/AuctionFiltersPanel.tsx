'use client';

import { useState } from 'react';
import { AuctionFilters } from '@/lib/auction-discovery';

interface AuctionFiltersPanelProps {
  filters: AuctionFilters;
  onFiltersChange: (filters: Partial<AuctionFilters>) => void;
  onClose: () => void;
}

export function AuctionFiltersPanel({ filters, onFiltersChange, onClose }: AuctionFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState({
    status: true,
    category: true,
    priceRange: true,
    sortBy: false,
  });

  const toggleExpanded = (section: keyof typeof isExpanded) => {
    setIsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const categories = [
    { value: 'all', label: 'All Categories', icon: '🌐' },
    { value: 'real-estate', label: 'Real Estate', icon: '🏠' },
    { value: 'art', label: 'Art & Collectibles', icon: '🎨' },
    { value: 'commodities', label: 'Commodities', icon: '📈' },
    { value: 'intellectual-property', label: 'Intellectual Property', icon: '💡' },
    { value: 'financial-instruments', label: 'Financial Instruments', icon: '💰' },
  ];

  const sortOptions = [
    { value: 'ending-soon', label: 'Ending Soon', description: 'Auctions ending first' },
    { value: 'highest-bid', label: 'Highest Bid', description: 'Highest current bid' },
    { value: 'newest', label: 'Newest', description: 'Recently created' },
    { value: 'lowest-reserve', label: 'Lowest Reserve', description: 'Lowest reserve price' },
  ];

  const priceRanges = [
    { value: 'all', label: 'Any Price', min: 0, max: Infinity },
    { value: '0-1', label: '0 - 1 ETH', min: 0, max: 1 },
    { value: '1-10', label: '1 - 10 ETH', min: 1, max: 10 },
    { value: '10-100', label: '10 - 100 ETH', min: 10, max: 100 },
    { value: '100+', label: '100+ ETH', min: 100, max: Infinity },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Auctions', color: 'gray' },
    { value: 'upcoming', label: 'Upcoming', color: 'blue' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'ended', label: 'Ended', color: 'red' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6">
        {/* Status Filter */}
        <div>
          <button
            onClick={() => toggleExpanded('status')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Status</span>
              <span className="text-sm text-gray-500">
                {filters.status !== 'all' ? '1 selected' : 'All'}
              </span>
            </div>
            <svg
              className={`h-4 w-4 transform transition-transform ${
                isExpanded.status ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded.status && (
            <div className="mt-3 space-y-2">
              {statusOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={filters.status === option.value}
                    onChange={(e) => onFiltersChange({ status: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      option.color === 'green' ? 'bg-green-500' :
                      option.color === 'blue' ? 'bg-blue-500' :
                      option.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <button
            onClick={() => toggleExpanded('category')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Category</span>
              <span className="text-sm text-gray-500">
                {filters.category !== 'all' ? '1 selected' : 'All'}
              </span>
            </div>
            <svg
              className={`h-4 w-4 transform transition-transform ${
                isExpanded.category ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded.category && (
            <div className="mt-3 space-y-2">
              {categories.map((category) => (
                <label key={category.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={category.value}
                    checked={filters.category === category.value}
                    onChange={(e) => onFiltersChange({ category: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm text-gray-700">{category.label}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div>
          <button
            onClick={() => toggleExpanded('priceRange')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Price Range</span>
              <span className="text-sm text-gray-500">
                {filters.priceRange !== 'all' ? '1 selected' : 'Any'}
              </span>
            </div>
            <svg
              className={`h-4 w-4 transform transition-transform ${
                isExpanded.priceRange ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded.priceRange && (
            <div className="mt-3 space-y-2">
              {priceRanges.map((range) => (
                <label key={range.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    value={range.value}
                    checked={filters.priceRange === range.value}
                    onChange={(e) => onFiltersChange({ priceRange: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div>
          <button
            onClick={() => toggleExpanded('sortBy')}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">Sort By</span>
              <span className="text-sm text-gray-500">
                {sortOptions.find(opt => opt.value === filters.sortBy)?.label || 'Ending Soon'}
              </span>
            </div>
            <svg
              className={`h-4 w-4 transform transition-transform ${
                isExpanded.sortBy ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded.sortBy && (
            <div className="mt-3 space-y-2">
              {sortOptions.map((option) => (
                <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={filters.sortBy === option.value}
                    onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm text-gray-700">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Search</label>
          <input
            type="text"
            placeholder="Search auctions by title or description..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => onFiltersChange({
            status: 'active',
            category: 'all',
            priceRange: 'all',
            sortBy: 'ending-soon',
            search: '',
          })}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear All Filters
        </button>
        
        <button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
