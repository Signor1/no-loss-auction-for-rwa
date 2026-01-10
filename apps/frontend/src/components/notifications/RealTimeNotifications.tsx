'use client'

import React, { useState, useEffect } from 'react'
import { useNotifications } from '@/lib/real-time-notifications'

export default function RealTimeNotifications() {
  const {
    notifications,
    preferences,
    stats,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updatePreferences,
    toggleChannel,
    toggleCategory,
    connectWebSocket
  } = useNotifications()

  const [activeTab, setActiveTab] = useState<'center' | 'preferences' | 'stats'>('center')
  const [filter, setFilter] = useState<'all' | 'unread' | 'type' | 'priority'>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-gray-300 bg-gray-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auction': return '🏛️'
      case 'bid': return '🎯'
      case 'transaction': return '💸'
      case 'portfolio': return '📊'
      case 'system': return '⚙️'
      case 'security': return '🔒'
      case 'marketing': return '📢'
      default: return '📢'
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'type' && selectedType !== 'all') return notif.type === selectedType
    if (filter === 'priority' && selectedPriority !== 'all') return notif.priority === selectedPriority
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {!isConnected && (
            <button
              onClick={connectWebSocket}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unread</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.unread}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Push Sent</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.deliveryStats.push.sent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Email Sent</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.deliveryStats.email.sent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['center', 'preferences', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        {/* Notification Center */}
        {activeTab === 'center' && (
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex space-x-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="type">By Type</option>
                  <option value="priority">By Priority</option>
                </select>
                
                {filter === 'type' && (
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="auction">Auction</option>
                    <option value="bid">Bid</option>
                    <option value="transaction">Transaction</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="system">System</option>
                    <option value="security">Security</option>
                    <option value="marketing">Marketing</option>
                  </select>
                )}
                
                {filter === 'priority' && (
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                )}
              </div>
              
              <div className="flex space-x-2">
                {stats.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="px-3 py-1 border border-red-300 rounded-md text-sm text-red-700 bg-white hover:bg-red-50"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No notifications found</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 p-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                              {notification.category}
                            </span>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          {notification.description && (
                            <p className="mt-1 text-xs text-gray-500">{notification.description}</p>
                          )}
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Source: {notification.source}
                            </span>
                          </div>
                          {notification.actions && notification.actions.length > 0 && (
                            <div className="mt-3 flex space-x-2">
                              {notification.actions.map((action) => (
                                <button
                                  key={action.id}
                                  onClick={() => {
                                    // Handle action click
                                    console.log('Action clicked:', action)
                                  }}
                                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                                    action.style === 'primary'
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : action.style === 'danger'
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Mark as read"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Preferences */}
        {activeTab === 'preferences' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
            
            {/* Channels */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Notification Channels</h4>
              <div className="space-y-3">
                {Object.entries(preferences.channels).map(([channel, enabled]) => (
                  <div key={channel} className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {channel === 'inApp' ? 'In-App' : channel === 'push' ? 'Push' : channel}
                      </label>
                      <p className="text-xs text-gray-500">
                        {channel === 'inApp' && 'Show notifications within the application'}
                        {channel === 'push' && 'Browser push notifications'}
                        {channel === 'email' && 'Email notifications'}
                        {channel === 'sms' && 'SMS text messages'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleChannel(channel as any, !enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Notification Categories</h4>
              <div className="space-y-4">
                {Object.entries(preferences.categories).map(([category, config]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {category}
                        </label>
                        <p className="text-xs text-gray-500">
                          {category === 'auction' && 'Auction-related notifications'}
                          {category === 'bid' && 'Bid status updates'}
                          {category === 'transaction' && 'Transaction confirmations'}
                          {category === 'portfolio' && 'Portfolio performance alerts'}
                          {category === 'system' && 'System updates and maintenance'}
                          {category === 'security' && 'Security and login alerts'}
                          {category === 'marketing' && 'Marketing and promotional content'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleCategory(category as any, !config.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {config.enabled && (
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(config.types).map(([type, enabled]) => (
                          <label key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => {
                                // Handle sub-type toggle
                                console.log('Toggle sub-type:', category, type, e.target.checked)
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-xs text-gray-700 capitalize">
                              {type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Quiet Hours</h4>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable Quiet Hours</label>
                    <p className="text-xs text-gray-500">
                      Suppress non-urgent notifications during specified hours
                    </p>
                  </div>
                  <button
                    onClick={() => updatePreferences({
                      quietHours: {
                        ...preferences.quietHours,
                        enabled: !preferences.quietHours.enabled
                      }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.quietHours.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {preferences.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHours.startTime}
                        onChange={(e) => updatePreferences({
                          quietHours: {
                            ...preferences.quietHours,
                            startTime: e.target.value
                          }
                        })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHours.endTime}
                        onChange={(e) => updatePreferences({
                          quietHours: {
                            ...preferences.quietHours,
                            endTime: e.target.value
                          }
                        })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {activeTab === 'stats' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Statistics</h3>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* By Type */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">By Type</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Priority */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">By Priority</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{priority}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              priority === 'urgent' ? 'bg-red-600' :
                              priority === 'high' ? 'bg-orange-600' :
                              priority === 'medium' ? 'bg-yellow-600' :
                              'bg-gray-600'
                            }`}
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Stats */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Delivery Statistics</h4>
                <div className="space-y-3">
                  {Object.entries(stats.deliveryStats).map(([channel, stats]) => (
                    <div key={channel} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">{channel}</span>
                        <span className="text-sm text-gray-600">
                          {stats.delivered > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0}% delivery rate
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Sent:</span>
                          <span className="font-medium text-gray-900 ml-1">{stats.sent}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Delivered:</span>
                          <span className="font-medium text-gray-900 ml-1">{stats.delivered}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {channel === 'inApp' ? 'Read' :
                             channel === 'push' ? 'Clicked' :
                             channel === 'email' ? 'Opened' : 'Clicked'}:
                          </span>
                          <span className="font-medium text-gray-900 ml-1">
                            {channel === 'inApp' ? stats.read :
                             channel === 'push' ? stats.clicked :
                             channel === 'email' ? stats.opened : stats.clicked}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">By Category</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              category === 'info' ? 'bg-blue-600' :
                              category === 'success' ? 'bg-green-600' :
                              category === 'warning' ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
