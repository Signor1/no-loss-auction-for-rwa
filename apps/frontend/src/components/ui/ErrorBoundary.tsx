'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useTheme } from '@/lib/design-system'

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo: ErrorInfo; errorId: string; resetError: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
  enableReset?: boolean
  showDetails?: boolean
  logErrors?: boolean
}

// Error boundary component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error if enabled
    if (this.props.logErrors !== false) {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId)
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            resetError={this.resetError}
          />
        )
      }

      // Use default fallback
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          resetError={this.resetError}
          enableReset={this.props.enableReset}
          showDetails={this.props.showDetails}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  errorId: string
  resetError: () => void
  enableReset?: boolean
  showDetails?: boolean
}

function DefaultErrorFallback({
  error,
  errorInfo,
  errorId,
  resetError,
  enableReset = true,
  showDetails = process.env.NODE_ENV === 'development'
}: DefaultErrorFallbackProps) {
  const { colors, resolvedTheme } = useTheme()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
          </p>

          {/* Error Details (Development Only) */}
          {showDetails && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error ID:</strong> {errorId}
                </div>
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                </div>
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {enableReset && (
              <button
                onClick={resetError}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Reload Page
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If this problem persists, please contact our support team.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Error ID: <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{errorId}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Async error boundary hook for async operations
export function useAsyncError() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const throwAsync = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  return {
    error,
    resetError,
    throwAsync
  }
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for handling API errors
export function useErrorHandler() {
  const handleError = React.useCallback((error: unknown, context?: string) => {
    if (error instanceof Error) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, error)
      
      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { tags: { context } })
      }
    } else {
      console.error(`Unknown error${context ? ` in ${context}` : ''}:`, error)
    }
  }, [])

  const handleAsyncError = React.useCallback(async (
    asyncFn: () => Promise<any>,
    context?: string
  ) => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error, context)
      throw error
    }
  }, [handleError])

  return {
    handleError,
    handleAsyncError
  }
}

// Error toast component
interface ErrorToastProps {
  error: Error
  onDismiss: () => void
  autoDismiss?: boolean
  dismissAfter?: number
}

export function ErrorToast({ 
  error, 
  onDismiss, 
  autoDismiss = true, 
  dismissAfter = 5000 
}: ErrorToastProps) {
  const { colors } = useTheme()

  React.useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(onDismiss, dismissAfter)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, dismissAfter, onDismiss])

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onDismiss}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Error page component
interface ErrorPageProps {
  title?: string
  message?: string
  showHomeButton?: boolean
  homeButtonText?: string
  homeButtonHref?: string
}

export function ErrorPage({
  title = 'Page Not Found',
  message = "The page you're looking for doesn't exist or has been moved.",
  showHomeButton = true,
  homeButtonText = 'Go Home',
  homeButtonHref = '/'
}: ErrorPageProps) {
  const { colors } = useTheme()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {message}
          </p>
        </div>

        {showHomeButton && (
          <button
            onClick={() => window.location.href = homeButtonHref}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {homeButtonText}
          </button>
        )}

        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}

// Network error component
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Network Error
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Unable to connect to the server. Please check your internet connection and try again.
      </p>

      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Retry
      </button>
    </div>
  )
}

// Error reporting utilities
export const errorReporting = {
  // Report error to monitoring service
  report: (error: Error, context?: Record<string, any>) => {
    // In a real implementation, this would send to Sentry, LogRocket, etc.
    console.error('Error reported:', error, context)
  },

  // Get error context
  getContext: (): Record<string, any> => {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language
    }
  },

  // Create error report
  createReport: (error: Error, errorInfo?: ErrorInfo): any => {
    return {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      context: errorReporting.getContext(),
      timestamp: new Date().toISOString()
    }
  }
}
