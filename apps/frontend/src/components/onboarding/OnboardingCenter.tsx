'use client'

import React, { useState } from 'react'
import { useOnboarding } from '@/lib/onboarding'
import { useTheme } from '@/lib/design-system'
import TourController from './Tour'
import TutorialController from './Tutorial'
import TooltipManager from './Tooltip'
import TourLauncher from './Tour'
import QuickTips from './Tooltip'
import TourProgress from './Tour'
import TutorialProgress from './Tutorial'
import TooltipPreferences from './Tooltip'

// Onboarding dashboard component
export default function OnboardingCenter() {
  const { 
    tours, 
    tutorials, 
    userProgress, 
    startTour, 
    startTutorial,
    updatePreferences 
  } = useOnboarding()
  const { colors } = useTheme()
  const [activeTab, setActiveTab] = useState<'overview' | 'tours' | 'tutorials' | 'progress' | 'settings'>('overview')

  // Calculate completion stats
  const tourCompletion = userProgress.completedTours.length / tours.length * 100
  const tutorialCompletion = userProgress.completedTutorials.length / tutorials.length * 100
  const overallCompletion = (tourCompletion + tutorialCompletion) / 2

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompletionBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100'
    if (percentage >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Onboarding Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your learning journey and discover new features
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Overall Progress
            </h3>
            <span className={`text-2xl font-bold ${getCompletionColor(overallCompletion)}`}>
              {Math.round(overallCompletion)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getCompletionBgColor(overallCompletion)}`}
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tours Completed
            </h3>
            <span className="text-2xl font-bold text-blue-600">
              {userProgress.completedTours.length}/{tours.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(tourCompletion)}% complete
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tutorials Completed
            </h3>
            <span className="text-2xl font-bold text-green-600">
              {userProgress.completedTutorials.length}/{tutorials.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(tutorialCompletion)}% complete
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Activity
            </h3>
            <span className="text-2xl font-bold text-purple-600">
              {userProgress.lastActivity.toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {userProgress.lastActivity.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'tours', label: 'Tours' },
            { key: 'tutorials', label: 'Tutorials' },
            { key: 'progress', label: 'Progress' },
            { key: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Welcome to Your Onboarding Journey
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Track your progress, discover new features, and get help when you need it.
              </p>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => startTour('welcome-tour')}
                  className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                >
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Start Welcome Tour
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Take a guided tour of the platform
                  </p>
                </button>

                <button
                  onClick={() => startTutorial('wallet-basics')}
                  className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
                >
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Start Tutorial
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Learn with interactive tutorials
                  </p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Recent Activity
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Completed "Wallet Basics" tutorial
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    2 hours ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Started "Advanced Bidding" tour
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    1 day ago
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Recommended for You
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Advanced Bidding Strategies
                  </h5>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    Master the art of strategic bidding
                  </p>
                  <button
                    onClick={() => startTutorial('advanced-bidding')}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Start Tutorial →
                  </button>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg">
                  <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    Security Best Practices
                  </h5>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                    Keep your account and assets secure
                  </p>
                  <button
                    onClick={() => startTour('security-tour')}
                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Start Tour →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tours Tab */}
        {activeTab === 'tours' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tours.map((tour) => (
                <div key={tour.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {tour.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {tour.description}
                      </p>
                    </div>
                    {tour.required && (
                      <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-1 rounded">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>{tour.estimatedDuration} min</span>
                    <span className="capitalize">{tour.category}</span>
                    <span className="capitalize">{tour.targetAudience}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(userProgress.tourProgress[tour.id] || 0) / tour.steps.length * 100}%` 
                        }}
                      />
                    </div>
                    <button
                      onClick={() => startTour(tour.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      {userProgress.completedTours.includes(tour.id) ? 'Review' : 'Start'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tutorials Tab */}
        {activeTab === 'tutorials' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.map((tutorial) => (
                <div key={tutorial.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {tutorial.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {tutorial.description}
                      </p>
                    </div>
                    {tutorial.featured && (
                      <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      tutorial.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      tutorial.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {tutorial.difficulty}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tutorial.estimatedTime} min
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tutorial.steps.length} steps
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-4">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${(userProgress.tutorialProgress[tutorial.id] || 0) / tutorial.steps.length * 100}%` 
                        }}
                      />
                    </div>
                    <button
                      onClick={() => startTutorial(tutorial.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      {userProgress.completedTutorials.includes(tutorial.id) ? 'Review' : 'Start'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="p-6 space-y-6">
            <TourProgress />
            <TutorialProgress />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6">
            <TooltipPreferences />
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Onboarding Preferences
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userProgress.preferences.autoStartTours}
                    onChange={(e) => updatePreferences({ autoStartTours: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto-start tours
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Automatically start tours for new users
                    </p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={userProgress.preferences.enableHints}
                    onChange={(e) => updatePreferences({ enableHints: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable hints and tips
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Show contextual help and suggestions
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Reset Progress
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reset your onboarding progress to start fresh. This action cannot be undone.
                </p>
                
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors">
                  Reset All Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controllers */}
      <TourController />
      <TutorialController />
      <TooltipManager />
      <TourLauncher />
      <QuickTips />
    </div>
  )
}
