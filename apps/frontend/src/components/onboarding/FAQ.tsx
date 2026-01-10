'use client'

import React, { useState, useMemo } from 'react'
import { useOnboarding, mockFAQ } from '@/lib/onboarding'
import { useTheme } from '@/lib/design-system'

// FAQ item component
interface FAQItemProps {
  item: any
  onFeedback: (id: string, feedback: 'helpful' | 'not-helpful') => void
  userFeedback?: 'helpful' | 'not-helpful'
}

function FAQItem({ item, onFeedback, userFeedback }: FAQItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleFeedback = (feedback: 'helpful' | 'not-helpful') => {
    onFeedback(item.id, feedback)
    setShowFeedback(true)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-4">
            {item.question}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.views} views
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.answer}
            </p>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {item.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Feedback */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
            {showFeedback ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Thank you for your feedback!
              </p>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Was this helpful?
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFeedback('helpful')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                      userFeedback === 'helpful'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Yes ({item.helpful})</span>
                  </button>
                  <button
                    onClick={() => handleFeedback('not-helpful')}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                      userFeedback === 'not-helpful'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>No ({item.notHelpful})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Related Items */}
            {item.related && item.related.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Related Questions
                </p>
                <div className="space-y-1">
                  {item.related.slice(0, 3).map((relatedId: string) => {
                    const relatedItem = mockFAQ.find(faq => faq.id === relatedId)
                    if (!relatedItem) return null
                    
                    return (
                      <button
                        key={relatedId}
                        className="block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-left"
                      >
                        {relatedItem.question}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {item.lastUpdated.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// FAQ search component
function FAQSearch({ onSearch, onCategoryChange }: { 
  onSearch: (query: string) => void
  onCategoryChange: (category: string) => void 
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    onCategoryChange(newCategory)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search FAQ
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for answers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Wallet">Wallet</option>
            <option value="Auctions">Auctions</option>
            <option value="Payments">Payments</option>
            <option value="Security">Security</option>
            <option value="Technical">Technical</option>
            <option value="Account">Account</option>
          </select>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  )
}

// FAQ stats component
function FAQStats({ faqItems }: { faqItems: any[] }) {
  const totalViews = faqItems.reduce((sum, item) => sum + item.views, 0)
  const totalHelpful = faqItems.reduce((sum, item) => sum + item.helpful, 0)
  const totalNotHelpful = faqItems.reduce((sum, item) => sum + item.notHelpful, 0)
  const helpfulPercentage = totalHelpful + totalNotHelpful > 0 
    ? (totalHelpful / (totalHelpful + totalNotHelpful)) * 100 
    : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        FAQ Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {faqItems.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Questions
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalViews.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Views
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {helpfulPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Helpfulness Rate
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {totalHelpful}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Helpful Votes
          </div>
        </div>
      </div>
    </div>
  )
}

// Popular questions component
function PopularQuestions({ faqItems, onSelect }: { 
  faqItems: any[]
  onSelect: (item: any) => void 
}) {
  const popularItems = faqItems
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Popular Questions
      </h3>
      
      <div className="space-y-3">
        {popularItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.question}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {item.views} views • {item.category}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Main FAQ component
export default function FAQ() {
  const { faqItems, updateProgress, userProgress } = useOnboarding()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Filter FAQ items
  const filteredItems = useMemo(() => {
    let filtered = faqItems

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.tags.some((tag: string) => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [faqItems, selectedCategory, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleFeedback = (id: string, feedback: 'helpful' | 'not-helpful') => {
    updateProgress({
      faqInteractions: {
        ...userProgress.faqInteractions,
        [id]: feedback
      }
    })
  }

  const handleSelectItem = (item: any) => {
    setExpandedItems(prev => new Set(prev).add(item.id))
    // Scroll to item
    const element = document.getElementById(`faq-item-${item.id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find answers to common questions about No-Loss Auction
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <FAQSearch onSearch={handleSearch} onCategoryChange={handleCategoryChange} />

          {/* Results */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or browse our popular questions below.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} found
                  </p>
                  {(searchQuery || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('all')
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                
                {filteredItems.map((item) => (
                  <div key={item.id} id={`faq-item-${item.id}`}>
                    <FAQItem
                      item={item}
                      onFeedback={handleFeedback}
                      userFeedback={userProgress.faqInteractions[item.id]}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <FAQStats faqItems={faqItems} />

          {/* Popular Questions */}
          <PopularQuestions faqItems={faqItems} onSelect={handleSelectItem} />

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Categories
            </h3>
            <div className="space-y-2">
              {['all', 'Wallet', 'Auctions', 'Payments', 'Security', 'Technical', 'Account'].map((category) => {
                const count = category === 'all' 
                  ? faqItems.length 
                  : faqItems.filter(item => item.category === category).length
                
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`w-full flex justify-between items-center p-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="capitalize">{category}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Still need help?
            </h3>
            <p className="text-blue-800 dark:text-blue-200 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
