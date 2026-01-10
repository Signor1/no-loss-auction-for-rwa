'use client'

import React from 'react'
import { useTheme } from '@/lib/design-system'

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  className?: string
}

export function LoadingSpinner({ size = 'md', color = 'primary', className = '' }: LoadingSpinnerProps) {
  const { colors } = useTheme()

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white',
    gray: 'text-gray-500 dark:text-gray-400'
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Skeleton loader component
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
  lines?: number
  animate?: boolean
}

export function Skeleton({ 
  className = '', 
  variant = 'text', 
  width, 
  height, 
  lines = 1,
  animate = true 
}: SkeletonProps) {
  const { colors } = useTheme()

  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  const animationClasses = animate ? 'animate-pulse' : ''

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  }

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined)
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses}`}
            style={{
              width: index === lines - 1 ? '60%' : '100%',
              height: height || '1rem'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
    />
  )
}

// Loading card component
interface LoadingCardProps {
  showImage?: boolean
  showTitle?: boolean
  showDescription?: boolean
  showFooter?: boolean
  className?: string
}

export function LoadingCard({ 
  showImage = true, 
  showTitle = true, 
  showDescription = true, 
  showFooter = true,
  className = ''
}: LoadingCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {showImage && (
        <Skeleton variant="rectangular" width="100%" height={200} className="mb-4" />
      )}
      
      {showTitle && (
        <Skeleton width="60%" height={24} className="mb-2" />
      )}
      
      {showDescription && (
        <div className="space-y-2 mb-4">
          <Skeleton width="100%" />
          <Skeleton width="100%" />
          <Skeleton width="80%" />
        </div>
      )}
      
      {showFooter && (
        <div className="flex justify-between items-center">
          <Skeleton width={80} height={20} />
          <Skeleton width={100} height={32} variant="rectangular" />
        </div>
      )}
    </div>
  )
}

// Loading table component
interface LoadingTableProps {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}

export function LoadingTable({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className = ''
}: LoadingTableProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} height={20} />
            ))}
          </div>
        </div>
      )}
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} height={16} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Loading list component
interface LoadingListProps {
  items?: number
  showAvatar?: boolean
  className?: string
}

export function LoadingList({ 
  items = 5, 
  showAvatar = true,
  className = ''
}: LoadingListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {showAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="60%" height={14} />
          </div>
          
          <Skeleton width={80} height={24} />
        </div>
      ))}
    </div>
  )
}

// Full page loading component
interface FullPageLoadingProps {
  message?: string
  showSpinner?: boolean
  className?: string
}

export function FullPageLoading({ 
  message = 'Loading...', 
  showSpinner = true,
  className = ''
}: FullPageLoadingProps) {
  const { colors } = useTheme()

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${className}`}>
      {showSpinner && (
        <LoadingSpinner size="xl" className="mb-4" />
      )}
      
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {message}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we load your content
        </p>
      </div>
    </div>
  )
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  spinnerSize?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Loading...', 
  spinnerSize = 'md',
  className = '',
  children 
}: LoadingOverlayProps) {
  const { colors } = useTheme()

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
          <LoadingSpinner size={spinnerSize} className="mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      )}
    </div>
  )
}

// Progress bar component
interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
}

export function ProgressBar({ 
  value, 
  max = 100, 
  showLabel = false, 
  size = 'md',
  color = 'primary',
  className = ''
}: ProgressBarProps) {
  const { colors } = useTheme()

  const percentage = Math.min((value / max) * 100, 100)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  }

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${Math.round(percentage)}% complete`}
        />
      </div>
    </div>
  )
}

// Loading button component
interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
  spinnerSize?: 'sm' | 'md'
  loadingText?: string
}

export function LoadingButton({ 
  isLoading, 
  children, 
  disabled = false,
  className = '',
  spinnerSize = 'sm',
  loadingText = 'Loading...'
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={spinnerSize} color="white" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Loading states collection
export const LoadingStates = {
  Spinner: LoadingSpinner,
  Skeleton,
  Card: LoadingCard,
  Table: LoadingTable,
  List: LoadingList,
  FullPage: FullPageLoading,
  Overlay: LoadingOverlay,
  ProgressBar,
  Button: LoadingButton
}

// Hook for loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState)

  const startLoading = React.useCallback(() => {
    setIsLoading(true)
  }, [])

  const stopLoading = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const toggleLoading = React.useCallback(() => {
    setIsLoading(prev => !prev)
  }, [])

  return {
    isLoading,
    setIsLoading,
    startLoading,
    stopLoading,
    toggleLoading
  }
}

// Hook for delayed loading
export function useDelayedLoading(delay = 300) {
  const [showLoading, setShowLoading] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const startDelayedLoading = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setShowLoading(true)
    }, delay)
  }, [delay])

  const stopDelayedLoading = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowLoading(false)
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    showLoading,
    startDelayedLoading,
    stopDelayedLoading
  }
}
