'use client';

import { useState } from 'react';
import { useUserProfile } from '@/lib/user-profile';
import { ProfileManagement } from './ProfileManagement';
import { ActivityFeed } from './ActivityFeed';
import { WalletManagement } from './WalletManagement';
import { TransactionHistory } from './TransactionHistory';
import { PaymentHistory } from './PaymentHistory';
import { SettingsPanel } from './SettingsPanel';

export function UserDashboard() {
  const { profile, isLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'wallets' | 'transactions' | 'payments' | 'settings'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'wallets', label: 'Wallets', icon: '👛' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Dashboard</h1>
              <p className="text-gray-600">
                Manage your profile, track activity, and control your settings
              </p>
            </div>
            {profile && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Welcome back,</p>
                  <p className="text-lg font-semibold text-gray-900">{profile.displayName}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <img
                    src={profile.avatar}
                    alt={profile.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Summary Card */}
        {profile && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{profile.reputation}</div>
                <div className="text-blue-100">Reputation Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{profile.totalTransactions.toLocaleString()}</div>
                <div className="text-blue-100">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">
                  ${profile.totalVolume.toLocaleString()}
                </div>
                <div className="text-blue-100">Total Volume</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1 capitalize">
                  {profile.verificationLevel}
                </div>
                <div className="text-blue-100">Verification Level</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'profile' && <ProfileManagement />}
          {activeTab === 'activity' && <ActivityFeed />}
          {activeTab === 'wallets' && <WalletManagement />}
          {activeTab === 'transactions' && <TransactionHistory />}
          {activeTab === 'payments' && <PaymentHistory />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}
