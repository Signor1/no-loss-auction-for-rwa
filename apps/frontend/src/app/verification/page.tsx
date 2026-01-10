'use client';

import { useState } from 'react';
import { AssetVerification } from '@/components/verification/AssetVerification';
import { IdentityVerification } from '@/components/verification/IdentityVerification';
import { ComplianceDashboard } from '@/components/verification/ComplianceDashboard';

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState<'identity' | 'asset' | 'compliance'>('identity');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Center</h1>
          <p className="text-gray-600">Complete your verification to unlock full platform features</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('identity')}
                className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'identity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">👤</span>
                Identity Verification
              </button>
              <button
                onClick={() => setActiveTab('asset')}
                className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'asset'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">🏠</span>
                Asset Verification
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'compliance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">⚖️</span>
                Compliance Dashboard
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'identity' && <IdentityVerification />}
        {activeTab === 'asset' && <AssetVerification />}
        {activeTab === 'compliance' && <ComplianceDashboard />}
      </div>
    </div>
  );
}
