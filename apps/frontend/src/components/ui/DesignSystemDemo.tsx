'use client'

import React, { useState } from 'react'
import { useTheme, ThemeProvider } from '@/lib/design-system'
import { useI18n, I18nProvider } from '@/lib/i18n'
import { a11yUtils, useAriaProps, useScreenReader } from '@/lib/accessibility'
import { LoadingStates } from './LoadingStates'
import { ErrorBoundary } from './ErrorBoundary'

// Theme toggle component
function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Theme: {theme}
      </span>
      <button
        onClick={toggleTheme}
        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
      >
        Toggle
      </button>
      <div className="flex space-x-2">
        {(['light', 'dark', 'system'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              theme === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

// Language selector component
function LanguageSelector() {
  const { language, setLanguage, t } = useI18n()

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' }
  ]

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('navigation.settings')} - {t('common.language')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              language === lang.code
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// Typography demo component
function TypographyDemo() {
  const { tokens } = useTheme()
  const { t } = useI18n()

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Typography
      </h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Font Sizes
          </h3>
          <div className="space-y-2">
            {Object.entries(tokens.typography.fontSize).map(([key, size]) => (
              <div key={key} className="flex items-center space-x-4">
                <span className="text-xs text-gray-500 w-16">{key}</span>
                <span style={{ fontSize: size }} className="text-gray-900 dark:text-white">
                  {t('common.loading')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Font Weights
          </h3>
          <div className="space-y-2">
            {Object.entries(tokens.typography.fontWeight).map(([key, weight]) => (
              <div key={key} className="flex items-center space-x-4">
                <span className="text-xs text-gray-500 w-16">{key}</span>
                <span style={{ fontWeight: weight }} className="text-gray-900 dark:text-white">
                  {t('common.loading')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Color palette demo component
function ColorPaletteDemo() {
  const { colors } = useTheme()

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Color Palette
      </h2>
      
      <div className="space-y-6">
        {/* Primary colors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Primary Colors
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(colors.primary).map(([key, color]) => (
              <div key={key} className="text-center">
                <div
                  className="w-full h-12 rounded border border-gray-200 dark:border-gray-600 mb-1"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic colors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Semantic Colors
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div
                className="w-full h-12 rounded border border-gray-200 dark:border-gray-600 mb-1"
                style={{ backgroundColor: colors.success }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Success</span>
            </div>
            <div className="text-center">
              <div
                className="w-full h-12 rounded border border-gray-200 dark:border-gray-600 mb-1"
                style={{ backgroundColor: colors.warning }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Warning</span>
            </div>
            <div className="text-center">
              <div
                className="w-full h-12 rounded border border-gray-200 dark:border-gray-600 mb-1"
                style={{ backgroundColor: colors.error }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Error</span>
            </div>
            <div className="text-center">
              <div
                className="w-full h-12 rounded border border-gray-200 dark:border-gray-600 mb-1"
                style={{ backgroundColor: colors.info }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Info</span>
            </div>
          </div>
        </div>

        {/* Background colors */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Background Colors
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(colors.background).map(([key, color]) => (
              <div key={key} className="text-center">
                <div
                  className="w-full h-12 rounded border border-gray-200 dark:border-gray-600 mb-1"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Accessibility demo component
function AccessibilityDemo() {
  const { announce, announcePolite, announceAssertive } = useScreenReader()
  const { getButtonProps, getModalProps } = useAriaProps()
  const [showModal, setShowModal] = useState(false)

  const handleAnnounce = () => {
    announce('This is a screen reader announcement')
  }

  const handlePoliteAnnounce = () => {
    announcePolite('This is a polite announcement')
  }

  const handleAssertiveAnnounce = () => {
    announceAssertive('This is an assertive announcement')
  }

  const contrastCheck = a11yUtils.checkColorContrast('#3b82f6', '#ffffff')

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Accessibility Features
      </h2>
      
      <div className="space-y-6">
        {/* Screen Reader Announcements */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Screen Reader Announcements
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAnnounce}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Announce
            </button>
            <button
              onClick={handlePoliteAnnounce}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Polite
            </button>
            <button
              onClick={handleAssertiveAnnounce}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Assertive
            </button>
          </div>
        </div>

        {/* ARIA Props */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            ARIA Attributes
          </h3>
          <div className="space-y-2">
            <button
              {...getButtonProps({ label: 'Accessible Button' })}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
            >
              Accessible Button
            </button>
            <button
              {...getButtonProps({ expanded: showModal, label: 'Toggle Modal' })}
              onClick={() => setShowModal(!showModal)}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
            >
              {showModal ? 'Hide' : 'Show'} Modal
            </button>
          </div>
        </div>

        {/* Color Contrast */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Color Contrast
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Blue on White: {contrastCheck.toFixed(2)}:1
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                a11yUtils.meetsWCAG_AA(contrastCheck)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {a11yUtils.meetsWCAG_AA(contrastCheck) ? 'WCAG AA' : 'Fail'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              {...getModalProps({ label: 'Demo Modal' })}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Accessible Modal
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This modal has proper ARIA attributes for screen readers.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading states demo component
function LoadingStatesDemo() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Loading States
      </h2>
      
      <div className="space-y-6">
        {/* Spinners */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Spinners
          </h3>
          <div className="flex items-center space-x-4">
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <LoadingStates.Spinner key={size} size={size} />
            ))}
          </div>
        </div>

        {/* Skeletons */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Skeletons
          </h3>
          <div className="space-y-4">
            <LoadingStates.Skeleton width="100%" height={20} />
            <LoadingStates.Skeleton variant="rectangular" width="100%" height={100} />
            <LoadingStates.Skeleton variant="circular" width={40} height={40} />
            <LoadingStates.Skeleton lines={3} />
          </div>
        </div>

        {/* Cards */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Loading Cards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LoadingStates.Card />
            <LoadingStates.Card showImage={false} showFooter={false} />
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Progress Bar
          </h3>
          <LoadingStates.ProgressBar value={progress} showLabel />
        </div>

        {/* Loading Button */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Loading Button
          </h3>
          <div className="flex space-x-2">
            <LoadingStates.Button
              isLoading={isLoading}
              onClick={() => setIsLoading(!isLoading)}
              loadingText="Processing..."
            >
              {isLoading ? 'Loading...' : 'Click to Load'}
            </LoadingStates.Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Error boundary demo component
function ErrorBoundaryDemo() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('This is a test error for the error boundary demo')
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Error Boundary
      </h2>
      
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Click the button below to trigger an error and see the error boundary in action.
        </p>
        
        <button
          onClick={() => setShouldError(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Trigger Error
        </button>
      </div>
    </div>
  )
}

// Main demo component
export default function DesignSystemDemo() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto p-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Design System Demo
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Comprehensive demonstration of the design system features
                </p>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Language Selector */}
              <LanguageSelector />

              {/* Demo Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <TypographyDemo />
                <ColorPaletteDemo />
                <AccessibilityDemo />
                <LoadingStatesDemo />
              </div>

              {/* Error Boundary Demo */}
              <div className="mt-6">
                <ErrorBoundary>
                  <ErrorBoundaryDemo />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
