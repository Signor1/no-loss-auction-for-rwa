'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useOnboarding } from '@/lib/onboarding'
import { useTheme } from '@/lib/design-system'

// Tooltip component
interface TooltipProps {
  id: string
  content: string
  target: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  trigger: 'hover' | 'click' | 'focus' | 'manual'
  delay?: number
  duration?: number
  persistent?: boolean
  dismissible?: boolean
  showOnce?: boolean
  priority?: number
  isVisible?: boolean
  onShow?: () => void
  onHide?: () => void
}

export function Tooltip({
  id,
  content,
  target,
  placement,
  trigger,
  delay = 0,
  duration,
  persistent = false,
  dismissible = true,
  showOnce = false,
  priority = 0,
  isVisible = false,
  onShow,
  onHide
}: TooltipProps) {
  const { colors } = useTheme()
  const { userProgress, dismissTooltip } = useOnboarding()
  const [visible, setVisible] = useState(isVisible)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if tooltip should be shown
  const shouldShow = () => {
    if (showOnce && userProgress.dismissedTooltips.includes(id)) {
      return false
    }
    return true
  }

  // Calculate tooltip position
  const calculatePosition = (targetElement: HTMLElement) => {
    const targetRect = targetElement.getBoundingClientRect()
    const tooltipRect = tooltipRef.current?.getBoundingClientRect()
    
    if (!tooltipRect) {
      return { top: 0, left: 0 }
    }

    const padding = 8
    let top = 0
    let left = 0

    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - padding
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
        break
      case 'bottom':
        top = targetRect.bottom + padding
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
        break
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
        left = targetRect.left - tooltipRect.width - padding
        break
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
        left = targetRect.right + padding
        break
    }

    // Adjust position to keep tooltip within viewport
    if (left < padding) left = padding
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding
    }
    if (top < padding) top = padding
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding
    }

    return { top, left }
  }

  // Show tooltip
  const show = () => {
    if (!shouldShow()) return

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setVisible(true)
        onShow?.()
      }, delay)
    } else {
      setVisible(true)
      onShow?.()
    }
  }

  // Hide tooltip
  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setVisible(false)
    onHide?.()
  }

  // Handle dismiss
  const handleDismiss = () => {
    dismissTooltip(id)
    hide()
  }

  // Find and observe target element
  useEffect(() => {
    const element = document.querySelector(target) as HTMLElement
    targetRef.current = element

    if (!element) return

    const handleMouseEnter = () => {
      if (trigger === 'hover') show()
    }

    const handleMouseLeave = () => {
      if (trigger === 'hover' && !persistent) hide()
    }

    const handleClick = () => {
      if (trigger === 'click') {
        if (visible) {
          hide()
        } else {
          show()
        }
      }
    }

    const handleFocus = () => {
      if (trigger === 'focus') show()
    }

    const handleBlur = () => {
      if (trigger === 'focus' && !persistent) hide()
    }

    // Add event listeners
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('click', handleClick)
    element.addEventListener('focus', handleFocus)
    element.addEventListener('blur', handleBlur)

    // Update position when tooltip becomes visible
    if (visible) {
      const pos = calculatePosition(element)
      setPosition(pos)
    }

    // Observe target element for position changes
    const resizeObserver = new ResizeObserver(() => {
      if (visible) {
        const pos = calculatePosition(element)
        setPosition(pos)
      }
    })
    resizeObserver.observe(element)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('click', handleClick)
      element.removeEventListener('focus', handleFocus)
      element.removeEventListener('blur', handleBlur)
      resizeObserver.disconnect()
    }
  }, [target, trigger, visible, persistent, delay, onShow, onHide])

  // Auto-hide after duration
  useEffect(() => {
    if (visible && duration) {
      timeoutRef.current = setTimeout(() => {
        hide()
      }, duration)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [visible, duration, hide])

  // Manual visibility control
  useEffect(() => {
    if (isVisible !== visible) {
      if (isVisible) {
        show()
      } else {
        hide()
      }
    }
  }, [isVisible, visible, show, hide])

  if (!visible || !shouldShow()) {
    return null
  }

  return (
    <div
      ref={tooltipRef}
      className="absolute z-50 pointer-events-none"
      style={{ top: position.top, left: position.left }}
    >
      <div className="relative">
        {/* Tooltip Content */}
        <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 p-3 max-w-xs pointer-events-auto">
          <div className="flex items-start space-x-2">
            <div className="flex-1">
              <p className="text-sm leading-relaxed">{content}</p>
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div
          className="absolute w-0 h-0 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"
          style={{
            [placement === 'top' ? 'bottom' : 'top']: '-4px',
            [placement === 'top' || placement === 'bottom' ? 'left' : 'top']: '50%',
            [placement === 'top' || placement === 'bottom' ? 'transform' : '']: 'translateX(-50%)',
            [placement === 'left' ? 'right' : placement === 'right' ? 'left' : '']: '-4px',
            [placement === 'left' || placement === 'right' ? 'transform' : '']: 'translateY(-50%)'
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

// Tooltip manager component
export function TooltipManager() {
  const { tooltips, showTooltip, hideTooltip, userProgress } = useOnboarding()
  const [activeTooltips, setActiveTooltips] = useState<Set<string>>(new Set())

  // Filter tooltips that should be shown
  const visibleTooltips = tooltips.filter(tooltip => {
    if (!userProgress.preferences.showTooltips) return false
    if (userProgress.dismissedTooltips.includes(tooltip.id)) return false
    return activeTooltips.has(tooltip.id) || tooltip.trigger === 'manual'
  })

  // Sort by priority
  const sortedTooltips = visibleTooltips.sort((a, b) => (b.priority || 0) - (a.priority || 0))

  return (
    <>
      {sortedTooltips.map((tooltip) => (
        <Tooltip
          key={tooltip.id}
          id={tooltip.id}
          content={tooltip.content}
          target={tooltip.target}
          placement={tooltip.placement}
          trigger={tooltip.trigger}
          delay={tooltip.delay}
          duration={tooltip.duration}
          persistent={tooltip.persistent}
          dismissible={tooltip.dismissible}
          showOnce={tooltip.showOnce}
          priority={tooltip.priority}
          onShow={() => setActiveTooltips(prev => new Set(prev).add(tooltip.id))}
          onHide={() => setActiveTooltips(prev => {
            const newSet = new Set(prev)
            newSet.delete(tooltip.id)
            return newSet
          })}
        />
      ))}
    </>
  )
}

// Help text component
interface HelpTextProps {
  text: string
  variant?: 'info' | 'warning' | 'success' | 'error'
  icon?: boolean
  dismissible?: boolean
  className?: string
}

export function HelpText({ 
  text, 
  variant = 'info', 
  icon = true, 
  dismissible = false,
  className = ''
}: HelpTextProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
      case 'success':
        return 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
      case 'error':
        return 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
      default:
        return 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'info':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'success':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className={`flex items-start space-x-2 p-3 rounded-lg border ${getVariantStyles()} ${className}`}>
      {icon && (
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
      )}
      <div className="flex-1 text-sm">
        {text}
      </div>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 ml-2 text-current opacity-60 hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Contextual help component
interface ContextualHelpProps {
  title: string
  content: string
  links?: Array<{ text: string; href: string }>
  video?: string
  className?: string
}

export function ContextualHelp({ title, content, links, video, className = '' }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-colors"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 01-1-1zm0 4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="absolute z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 mt-2 right-0">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {title}
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {content}
          </p>

          {video && (
            <div className="mb-4">
              <video
                src={video}
                controls
                className="w-full rounded"
                style={{ maxHeight: '200px' }}
              />
            </div>
          )}

          {links && links.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Related Links
              </p>
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {link.text}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Quick tips component
export function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const tips = [
    {
      title: 'Pro Tip',
      content: 'You can use keyboard shortcuts to navigate faster. Press "?" to see all available shortcuts.',
      variant: 'info' as const
    },
    {
      title: 'Did You Know?',
      content: 'You can save your favorite searches and get notified when new matching auctions are listed.',
      variant: 'info' as const
    },
    {
      title: 'Security Tip',
      content: 'Always verify the auction contract address before placing a bid to avoid scams.',
      variant: 'warning' as const
    },
    {
      title: 'Money Saving Tip',
      content: 'Set up auto-bids with your maximum amount to never miss out on an auction you want.',
      variant: 'success' as const
    }
  ]

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length)
  }

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + tips.length) % tips.length)
  }

  if (!isVisible) return null

  const tip = tips[currentTip]

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm">
      <HelpText
        text={
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium">{tip.title}</span>
              <button
                onClick={() => setIsVisible(false)}
                className="text-current opacity-60 hover:opacity-100 ml-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm">{tip.content}</p>
            <div className="flex justify-between items-center mt-3">
              <div className="flex space-x-2">
                <button
                  onClick={prevTip}
                  className="text-xs text-current opacity-60 hover:opacity-100"
                >
                  ←
                </button>
                <span className="text-xs text-current opacity-60">
                  {currentTip + 1} / {tips.length}
                </span>
                <button
                  onClick={nextTip}
                  className="text-xs text-current opacity-60 hover:opacity-100"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        }
        variant={tip.variant}
        icon={false}
        dismissible={false}
        className="pointer-events-auto"
      />
    </div>
  )
}

// Tooltip preferences component
export function TooltipPreferences() {
  const { preferences, updatePreferences } = useOnboarding()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
        Tooltip Preferences
      </h3>
      
      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences.showTooltips}
            onChange={(e) => updatePreferences({ showTooltips: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Show tooltips
          </span>
        </label>
        
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={preferences.enableHints}
            onChange={(e) => updatePreferences({ enableHints: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Enable hints and tips
          </span>
        </label>
      </div>
    </div>
  )
}
