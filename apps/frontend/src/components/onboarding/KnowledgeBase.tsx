'use client'

import React, { useState, useMemo } from 'react'
import { useOnboarding, mockKnowledgeBase } from '@/lib/onboarding'
import { useTheme } from '@/lib/design-system'

// Article card component
interface ArticleCardProps {
  article: any
  onRead: (article: any) => void
  userFeedback?: 'helpful' | 'not-helpful'
}

function ArticleCard({ article, onRead, userFeedback }: ArticleCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(article.difficulty)}`}>
          {article.difficulty}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {article.readingTime} min read
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(article.publishedAt)}
        </span>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {article.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{article.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span>by {article.author}</span>
          <span>{article.views} views</span>
        </div>
        
        <button
          onClick={() => onRead(article)}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
        >
          Read More
        </button>
      </div>
    </div>
  )
}

// Article reader component
interface ArticleReaderProps {
  article: any
  onClose: () => void
  onFeedback: (id: string, feedback: 'helpful' | 'not-helpful') => void
  userFeedback?: 'helpful' | 'not-helpful'
}

function ArticleReader({ article, onClose, onFeedback, userFeedback }: ArticleReaderProps) {
  const [showFeedback, setShowFeedback] = useState(false)

  const handleFeedback = (feedback: 'helpful' | 'not-helpful') => {
    onFeedback(article.id, feedback)
    setShowFeedback(true)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {article.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>by {article.author}</span>
              <span>•</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span>•</span>
              <span>{article.readingTime} min read</span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {article.related && article.related.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Related Articles
              </h3>
              <div className="space-y-2">
                {article.related.slice(0, 3).map((relatedId: string) => {
                  const relatedArticle = mockKnowledgeBase.find(a => a.id === relatedId)
                  if (!relatedArticle) return null
                  
                  return (
                    <button
                      key={relatedId}
                      className="block text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {relatedArticle.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {relatedArticle.excerpt}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{article.views} views</span>
              <span>{article.helpful} helpful</span>
              <span>{article.notHelpful} not helpful</span>
            </div>

            {/* Feedback */}
            <div className="flex items-center space-x-4">
              {showFeedback ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Thank you for your feedback!
                </p>
              ) : (
                <>
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
                      <span>Yes</span>
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
                      <span>No</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Search component
function KnowledgeBaseSearch({ onSearch, onCategoryChange, onDifficultyChange }: {
  onSearch: (query: string) => void
  onCategoryChange: (category: string) => void
  onDifficultyChange: (difficulty: string) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    onCategoryChange(newCategory)
  }

  const handleDifficultyChange = (newDifficulty: string) => {
    setDifficulty(newDifficulty)
    onDifficultyChange(newDifficulty)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Knowledge Base
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for articles..."
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

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <option value="Technology">Technology</option>
              <option value="Auctions">Auctions</option>
              <option value="Wallet">Wallet</option>
              <option value="Security">Security</option>
              <option value="Getting Started">Getting Started</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
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

// Popular articles component
function PopularArticles({ articles, onSelect }: { 
  articles: any[]
  onSelect: (article: any) => void 
}) {
  const popularArticles = articles
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Popular Articles
      </h3>
      
      <div className="space-y-3">
        {popularArticles.map((article, index) => (
          <button
            key={article.id}
            onClick={() => onSelect(article)}
            className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {article.views} views • {article.readingTime} min read
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Main knowledge base component
export default function KnowledgeBase() {
  const { knowledgeBase, updateProgress, userProgress } = useOnboarding()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [isReaderOpen, setIsReaderOpen] = useState(false)

  // Filter articles
  const filteredArticles = useMemo(() => {
    let filtered = knowledgeBase

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(article => article.difficulty === selectedDifficulty)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some((tag: string) => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [knowledgeBase, selectedCategory, selectedDifficulty, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty)
  }

  const handleReadArticle = (article: any) => {
    setSelectedArticle(article)
    setIsReaderOpen(true)
  }

  const handleCloseReader = () => {
    setIsReaderOpen(false)
    setSelectedArticle(null)
  }

  const handleFeedback = (id: string, feedback: 'helpful' | 'not-helpful') => {
    updateProgress({
      faqInteractions: {
        ...userProgress.faqInteractions,
        [id]: feedback
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Knowledge Base
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive guides and documentation to help you get the most out of No-Loss Auction
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <KnowledgeBaseSearch
            onSearch={handleSearch}
            onCategoryChange={handleCategoryChange}
            onDifficultyChange={handleDifficultyChange}
          />

          {/* Results */}
          <div className="space-y-4">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 19 7.5 19s3.332-.523 4.5-1.747M13 6.253v13c0-.85.688-1.539 1.539-1.539h1.862c.85 0 1.539.688 1.539 1.539v13M13 6.253v13c0-.85.688-1.539 1.539-1.539h1.862c.85 0 1.539.688 1.539 1.539" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search terms or browse our popular articles below.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'} found
                  </p>
                  {(searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedCategory('all')
                        setSelectedDifficulty('all')
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
                
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onRead={handleReadArticle}
                    userFeedback={userProgress.faqInteractions[article.id]}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Articles */}
          <PopularArticles articles={knowledgeBase} onSelect={handleReadArticle} />

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Categories
            </h3>
            <div className="space-y-2">
              {['all', 'Technology', 'Auctions', 'Wallet', 'Security', 'Getting Started'].map((category) => {
                const count = category === 'all' 
                  ? knowledgeBase.length 
                  : knowledgeBase.filter(item => item.category === category).length
                
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
                    <span>{category}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Quick Links
            </h3>
            <div className="space-y-2">
              <a href="#" className="block text-blue-800 dark:text-blue-200 hover:underline">
                Getting Started Guide
              </a>
              <a href="#" className="block text-blue-800 dark:text-blue-200 hover:underline">
                Wallet Setup Tutorial
              </a>
              <a href="#" className="block text-blue-800 dark:text-blue-200 hover:underline">
                FAQ Section
              </a>
              <a href="#" className="block text-blue-800 dark:text-blue-200 hover:underline">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Article Reader Modal */}
      <ArticleReader
        article={selectedArticle}
        isOpen={isReaderOpen}
        onClose={handleCloseReader}
        onFeedback={handleFeedback}
        userFeedback={selectedArticle ? userProgress.faqInteractions[selectedArticle.id] : undefined}
      />
    </div>
  )
}
