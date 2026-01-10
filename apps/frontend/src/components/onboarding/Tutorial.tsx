'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useOnboarding, TutorialStep } from '@/lib/onboarding'
import { useTheme } from '@/lib/design-system'

// Tutorial overlay component
interface TutorialOverlayProps {
  tutorial: any
  currentStep: number
  onNext: () => void
  onPrevious: () => void
  onComplete: () => void
  onEnd: () => void
  isLastStep: boolean
  isFirstStep: boolean
}

function TutorialOverlay({
  tutorial,
  currentStep,
  onNext,
  onPrevious,
  onComplete,
  onEnd,
  isLastStep,
  isFirstStep
}: TutorialOverlayProps) {
  const { colors } = useTheme()
  const [showHints, setShowHints] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const step = tutorial.steps[currentStep]

  useEffect(() => {
    // Set up timer if step has time limit
    if (step.timeLimit) {
      setTimeRemaining(step.timeLimit)
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            return null
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    } else {
      setTimeRemaining(null)
    }
  }, [step.timeLimit])

  const handleComplete = () => {
    if (step.validation) {
      const element = document.querySelector(step.validation.target) as HTMLElement
      if (element) {
        let isValid = false
        
        if (step.validation.validator) {
          isValid = step.validation.validator(element)
        } else if (step.validation.expectedValue !== undefined) {
          isValid = element.value === step.validation.expectedValue
        } else {
          isValid = true // Default validation for click actions
        }
        
        if (isValid) {
          setIsCompleted(true)
          onComplete()
        } else {
          // Show error or hint
          setShowHints(true)
        }
      }
    } else {
      setIsCompleted(true)
      onComplete()
    }
  }

  const renderStepContent = () => {
    switch (step.type) {
      case 'instruction':
        return (
          <div className="space-y-4">
            {step.content.text && (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {step.content.text}
              </p>
            )}
            
            {step.content.image && (
              <div className="flex justify-center">
                <img
                  src={step.content.image}
                  alt={step.title}
                  className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
            
            {step.content.video && (
              <div className="aspect-w-16 aspect-h-9">
                <video
                  src={step.content.video}
                  controls
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </div>
        )
        
      case 'action':
        return (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {step.content.text}
            </p>
            
            {step.content.interactive && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  💡 Action Required: {step.content.interactive.action}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Target: {step.content.interactive.target}
                </p>
              </div>
            )}
          </div>
        )
        
      case 'quiz':
        return (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {step.content.text}
            </p>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                🤔 Think about this and then proceed when ready
              </p>
            </div>
          </div>
        )
        
      case 'video':
        return (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {step.content.text}
            </p>
            
            <div className="aspect-w-16 aspect-h-9">
              <video
                src={step.content.video}
                controls
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )
        
      case 'interactive':
        return (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              {step.content.text}
            </p>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                🎮 Interactive: {step.content.interactive?.simulation}
              </p>
            </div>
          </div>
        )
        
      default:
        return (
          <p className="text-gray-700 dark:text-gray-300">
            {step.content.text}
          </p>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tutorial.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Step {currentStep + 1} of {tutorial.steps.length}
              </p>
            </div>
            
            <button
              onClick={onEnd}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorial.steps.length) * 100}%` }}
            />
          </div>
          
          {/* Time Limit */}
          {timeRemaining !== null && (
            <div className="mt-2 flex items-center text-sm">
              <svg className="w-4 h-4 mr-1 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-medium ${
                timeRemaining <= 10 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {timeRemaining}s remaining
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {step.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {step.description}
          </p>
          
          {renderStepContent()}
          
          {/* Hints */}
          {showHints && step.hints && step.hints.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                💡 Hints:
              </h4>
              <ul className="space-y-1">
                {step.hints.map((hint, index) => (
                  <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                    • {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Code Block */}
          {step.content.code && (
            <div className="mt-4">
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                <code className="text-sm text-gray-800 dark:text-gray-200">
                  {step.content.code}
                </code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              {!isFirstStep && (
                <button
                  onClick={onPrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {step.type === 'action' || step.validation ? (
                <button
                  onClick={handleComplete}
                  disabled={isCompleted}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isCompleted ? '✓ Completed' : 'Complete Step'}
                </button>
              ) : (
                <button
                  onClick={isLastStep ? onEnd : onNext}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                >
                  {isLastStep ? 'Finish Tutorial' : 'Next'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Tutorial card component
export function TutorialCard({ tutorial, onStart }: { tutorial: any; onStart: () => void }) {
  const { colors } = useTheme()
  const { userProgress } = useOnboarding()

  const isCompleted = userProgress.completedTutorials.includes(tutorial.id)
  const progress = userProgress.tutorialProgress[tutorial.id] || 0
  const progressPercentage = (progress / tutorial.steps.length) * 100

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {tutorial.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {tutorial.description}
          </p>
        </div>
        
        {tutorial.featured && (
          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
          {tutorial.difficulty}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {onboardingUtils.formatDuration(tutorial.estimatedTime)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {tutorial.steps.length} steps
        </span>
      </div>

      {/* Tags */}
      {tutorial.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tutorial.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
          {tutorial.tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{tutorial.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Progress */}
      {isCompleted ? (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center text-green-800 dark:text-green-200">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Completed</span>
          </div>
        </div>
      ) : progress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Prerequisites:
          </p>
          <div className="flex flex-wrap gap-1">
            {tutorial.prerequisites.map((prereq: string) => (
              <span
                key={prereq}
                className={`text-xs px-2 py-1 rounded ${
                  userProgress.completedTutorials.includes(prereq)
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {prereq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={onStart}
        disabled={tutorial.prerequisites && !tutorial.prerequisites.every((p: string) => userProgress.completedTutorials.includes(p))}
        className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
          isCompleted
            ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            : tutorial.prerequisites && !tutorial.prerequisites.every((p: string) => userProgress.completedTutorials.includes(p))
            ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isCompleted ? 'Review Tutorial' : 
         tutorial.prerequisites && !tutorial.prerequisites.every((p: string) => userProgress.completedTutorials.includes(p))
         ? 'Complete Prerequisites' : 
         progress > 0 ? 'Continue Tutorial' : 'Start Tutorial'}
      </button>
    </div>
  )
}

// Tutorial list component
export function TutorialList() {
  const { tutorials, startTutorial, userProgress } = useOnboarding()
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all')
  const [category, setCategory] = useState<string>('all')

  const filteredTutorials = tutorials.filter(tutorial => {
    const difficultyMatch = filter === 'all' || tutorial.difficulty === filter
    const categoryMatch = category === 'all' || tutorial.category === category
    return difficultyMatch && categoryMatch
  })

  const categories = [...new Set(tutorials.map(t => t.category))]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTutorials.map((tutorial) => (
          <TutorialCard
            key={tutorial.id}
            tutorial={tutorial}
            onStart={() => startTutorial(tutorial.id)}
          />
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No tutorials found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}

// Tutorial controller component
export function TutorialController() {
  const {
    activeTutorial,
    currentTutorialStep,
    isTutorialActive,
    nextTutorialStep,
    previousTutorialStep,
    completeTutorialStep,
    endTutorial
  } = useOnboarding()

  if (!isTutorialActive || !activeTutorial) {
    return null
  }

  const isLastStep = currentTutorialStep === activeTutorial.steps.length - 1
  const isFirstStep = currentTutorialStep === 0

  return (
    <TutorialOverlay
      tutorial={activeTutorial}
      currentStep={currentTutorialStep}
      onNext={nextTutorialStep}
      onPrevious={previousTutorialStep}
      onComplete={completeTutorialStep}
      onEnd={endTutorial}
      isLastStep={isLastStep}
      isFirstStep={isFirstStep}
    />
  )
}

// Tutorial progress component
export function TutorialProgress() {
  const { userProgress, tutorials } = useOnboarding()

  const completedCount = userProgress.completedTutorials.length
  const totalCount = tutorials.length
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const inProgressCount = Object.keys(userProgress.tutorialProgress).filter(
    tutorialId => !userProgress.completedTutorials.includes(tutorialId)
  ).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Tutorial Progress
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount}/{totalCount}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{completedCount} completed</span>
        <span>{inProgressCount} in progress</span>
      </div>
      
      {completionPercentage === 100 && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          🎉 All tutorials completed!
        </p>
      )}
    </div>
  )
}

// Utility functions
export const tutorialUtils = {
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  },

  getDifficultyIcon: (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '🌱'
      case 'intermediate': return '🌿'
      case 'advanced': return '🌳'
      default: return '📚'
    }
  },

  getCategoryIcon: (category: string): string => {
    switch (category) {
      case 'wallet': return '👛'
      case 'auctions': return '🏛️'
      case 'general': return '🏠'
      case 'profile': return '👤'
      case 'search': return '🔍'
      default: return '📚'
    }
  }
}
