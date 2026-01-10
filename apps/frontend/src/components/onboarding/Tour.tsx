'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useOnboarding, TourStep } from '@/lib/onboarding'
import { useTheme } from '@/lib/design-system'

interface TourOverlayProps {
  step: TourStep
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onEnd: () => void
  isLastStep: boolean
  isFirstStep: boolean
  currentStep: number
  totalSteps: number
}

function TourOverlay({
  step,
  onNext,
  onPrevious,
  onSkip,
  onEnd,
  isLastStep,
  isFirstStep,
  currentStep,
  totalSteps
}: TourOverlayProps) {
  const { colors } = useTheme()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    // Find target element
    let element: HTMLElement | null = null
    
    if (step.target === 'body') {
      element = document.body
    } else {
      element = document.querySelector(step.target) as HTMLElement
    }

    setTargetElement(element)

    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)

      // Scroll element into view if needed
      const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                          rect.bottom <= window.innerHeight && 
                          rect.right <= window.innerWidth
      
      if (!isInViewport) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      }
    }

    // Execute beforeShow callback
    if (step.beforeShow) {
      step.beforeShow()
    }

    return () => {
      // Execute afterShow callback
      if (step.afterShow) {
        step.afterShow()
      }
    }
  }, [step])

  const handleAction = () => {
    if (step.action && targetElement) {
      switch (step.action) {
        case 'click':
          targetElement.click()
          break
        case 'focus':
          targetElement.focus()
          break
        case 'hover':
          // Simulate hover
          const hoverEvent = new MouseEvent('mouseenter', { bubbles: true })
          targetElement.dispatchEvent(hoverEvent)
          break
      }
    }
  }

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const padding = 10
    const tooltipWidth = 350
    const tooltipHeight = 200

    let top = 0
    let left = 0

    switch (step.placement) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'bottom':
        top = targetRect.bottom + padding
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)
        left = targetRect.left - tooltipWidth - padding
        break
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)
        left = targetRect.right + padding
        break
      case 'center':
        top = '50%'
        left = '50%'
        return { top, left, transform: 'translate(-50%, -50%)' }
    }

    // Adjust position to keep tooltip within viewport
    if (left < padding) left = padding
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding
    }
    if (top < padding) top = padding
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding
    }

    return { top: `${top}px`, left: `${left}px` }
  }

  const getArrowPosition = () => {
    if (!targetRect || step.placement === 'center') return { display: 'none' }

    const tooltipWidth = 350
    const arrowSize = 8
    let top = 'auto'
    let left = 'auto'
    let right = 'auto'
    let bottom = 'auto'
    let transform = ''

    switch (step.placement) {
      case 'top':
        bottom = `-${arrowSize}px`
        left = '50%'
        transform = 'translateX(-50%)'
        break
      case 'bottom':
        top = `-${arrowSize}px`
        left = '50%'
        transform = 'translateX(-50%)'
        break
      case 'left':
        right = `-${arrowSize}px`
        top = '50%'
        transform = 'translateY(-50%)'
        break
      case 'right':
        left = `-${arrowSize}px`
        top = '50%'
        transform = 'translateY(-50%)'
        break
    }

    return { top, left, right, bottom, transform, display: 'block' }
  }

  if (!targetElement && step.target !== 'body') {
    return null // Don't show tour if target element not found
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={step.customStyles?.overlay}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        style={{
          pointerEvents: targetElement ? 'auto' : 'none'
        }}
        onClick={step.placement === 'center' ? undefined : onSkip}
      />

      {/* Highlight target element */}
      {targetElement && step.target !== 'body' && (
        <div
          className="absolute border-2 border-blue-500 rounded-lg pointer-events-none"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            ...step.customStyles?.beacon
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 pointer-events-auto max-w-sm`}
        style={{
          ...getTooltipPosition(),
          ...step.customStyles?.tooltip
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-0 h-0 border-8 border-transparent border-b-white dark:border-b-gray-800"
          style={{
            ...getArrowPosition()
          }}
        />

        {/* Progress */}
        {step.showProgress && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <button
                onClick={onSkip}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Skip Tour
              </button>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {step.title}
        </h3>

        {/* Content */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {step.content}
        </p>

        {/* Action Button */}
        {step.action && (
          <button
            onClick={handleAction}
            className="w-full mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            {step.action === 'click' ? 'Click Element' : 
             step.action === 'focus' ? 'Focus Element' : 
             step.action === 'hover' ? 'Hover Element' : 'Action'}
          </button>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {step.showPrevious && !isFirstStep && (
              <button
                onClick={onPrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            {step.showSkip && (
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Skip
              </button>
            )}
            
            {step.showNext && (
              <button
                onClick={isLastStep ? onEnd : onNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tour controller component
export function TourController() {
  const {
    activeTour,
    currentTourStep,
    isTourActive,
    nextTourStep,
    previousTourStep,
    skipTour,
    endTour
  } = useOnboarding()

  if (!isTourActive || !activeTour) {
    return null
  }

  const step = activeTour.steps[currentTourStep]
  const isLastStep = currentTourStep === activeTour.steps.length - 1
  const isFirstStep = currentTourStep === 0

  return (
    <TourOverlay
      step={step}
      onNext={nextTourStep}
      onPrevious={previousTourStep}
      onSkip={skipTour}
      onEnd={endTour}
      isLastStep={isLastStep}
      isFirstStep={isFirstStep}
      currentStep={currentTourStep}
      totalSteps={activeTour.steps.length}
    />
  )
}

// Tour launcher component
export function TourLauncher() {
  const { tours, startTour, userProgress } = useOnboarding()
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const availableTours = tours.filter(tour => 
    !userProgress.completedTours.includes(tour.id) && 
    !userProgress.skippedTours.includes(tour.id)
  )

  if (availableTours.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative">
        {/* Tour Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {availableTours.length > 1 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {availableTours.length}
            </span>
          )}
        </button>

        {/* Tour Dropdown */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Available Tours
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Take a guided tour to learn more about the platform
              </p>
              
              <div className="space-y-2">
                {availableTours.map((tour) => (
                  <div
                    key={tour.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => {
                      startTour(tour.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {tour.name}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {onboardingUtils.formatDuration(tour.estimatedDuration)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tour.description}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{tour.category}</span>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{tour.targetAudience}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Tour progress indicator
export function TourProgress() {
  const { userProgress, tours } = useOnboarding()
  const { colors } = useTheme()

  const completedCount = userProgress.completedTours.length
  const totalCount = tours.length
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Tour Progress
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount}/{totalCount}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      {completionPercentage === 100 && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          🎉 All tours completed!
        </p>
      )}
    </div>
  )
}

// Utility function for tour management
export const onboardingUtils = {
  formatDuration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  },

  getTourIcon: (category: string): string => {
    switch (category) {
      case 'general': return '🏠'
      case 'auctions': return '🏛️'
      case 'wallet': return '👛'
      case 'profile': return '👤'
      case 'search': return '🔍'
      default: return '📚'
    }
  },

  getAudienceColor: (audience: string): string => {
    switch (audience) {
      case 'new': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'returning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'power': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }
}
