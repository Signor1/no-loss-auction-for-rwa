'use client';

import { useState, useEffect } from 'react';
import { useAssetVerification } from '@/lib/asset-verification';
import { VerificationOverview } from './VerificationOverview';
import { DocumentVerification } from './DocumentVerification';
import { KYCStatus } from './KYCStatus';
import { AMLCompliance } from './AMLCompliance';
import { ComplianceBadges } from './ComplianceBadges';
import { VerificationHistory } from './VerificationHistory';

export function AssetVerification() {
  const {
    verificationStatuses,
    selectedAsset,
    isLoading,
    getVerificationStatus,
    setSelectedAsset,
    getVerificationScore,
    getVerificationLevelColor,
    getVerificationLevelLabel
  } = useAssetVerification();

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'kyc' | 'aml' | 'badges' | 'history'>('overview');

  // Get available assets with verification status
  const assetsWithVerification = verificationStatuses.map(status => ({
    id: status.assetId,
    title: status.assetTitle,
    status: status.overallStatus,
    score: getVerificationScore(status.assetId),
    lastUpdated: status.lastUpdated
  }));

  const selectedVerificationStatus = selectedAsset ? getVerificationStatus(selectedAsset) : null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'kyc', label: 'KYC Status', icon: '👤' },
    { id: 'aml', label: 'AML Compliance', icon: '🛡️' },
    { id: 'badges', label: 'Badges', icon: '🏆' },
    { id: 'history', label: 'History', icon: '📜' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Verification</h1>
          <p className="text-gray-600">
            Manage verification status, documents, and compliance for your assets
          </p>
        </div>

        {/* Asset Selection */}
        {assetsWithVerification.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Asset</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assetsWithVerification.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedAsset === asset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-left">{asset.title}</h4>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getVerificationLevelColor(asset.status) }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{getVerificationLevelLabel(asset.status)}</span>
                    <span className="font-medium text-gray-900">{asset.score}%</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${asset.score}%`,
                          backgroundColor: getVerificationLevelColor(asset.status)
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Assets State */}
        {assetsWithVerification.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets Found</h3>
              <p className="text-gray-600">
                You don't have any assets with verification status yet.
              </p>
            </div>
          </div>
        )}

        {/* Verification Content */}
        {selectedAsset && selectedVerificationStatus && (
          <>
            {/* Asset Status Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedVerificationStatus.assetTitle}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getVerificationLevelColor(selectedVerificationStatus.overallStatus) }}
                      />
                      <span className="text-lg font-medium text-gray-900">
                        {getVerificationLevelLabel(selectedVerificationStatus.overallStatus)}
                      </span>
                    </div>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      Score: {getVerificationScore(selectedAsset)}%
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">
                      Updated: {new Date(selectedVerificationStatus.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {getVerificationScore(selectedAsset)}%
                  </div>
                  <div className="text-sm text-gray-600">Verification Score</div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">KYC Status</div>
                  <div
                    className="font-medium"
                    style={{ color: getVerificationLevelColor(selectedVerificationStatus.kycStatus) }}
                  >
                    {getVerificationLevelLabel(selectedVerificationStatus.kycStatus)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">AML Status</div>
                  <div
                    className="font-medium"
                    style={{ color: getVerificationLevelColor(selectedVerificationStatus.amlStatus) }}
                  >
                    {getVerificationLevelLabel(selectedVerificationStatus.amlStatus)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Documents</div>
                  <div
                    className="font-medium"
                    style={{ color: getVerificationLevelColor(selectedVerificationStatus.documentStatus) }}
                  >
                    {getVerificationLevelLabel(selectedVerificationStatus.documentStatus)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Legal</div>
                  <div
                    className="font-medium"
                    style={{ color: getVerificationLevelColor(selectedVerificationStatus.legalStatus) }}
                  >
                    {getVerificationLevelLabel(selectedVerificationStatus.legalStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors
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
              {activeTab === 'overview' && (
                <VerificationOverview 
                  assetId={selectedAsset}
                  verificationStatus={selectedVerificationStatus}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentVerification assetId={selectedAsset} />
              )}

              {activeTab === 'kyc' && (
                <KYCStatus assetId={selectedAsset} />
              )}

              {activeTab === 'aml' && (
                <AMLCompliance assetId={selectedAsset} />
              )}

              {activeTab === 'badges' && (
                <ComplianceBadges assetId={selectedAsset} />
              )}

              {activeTab === 'history' && (
                <VerificationHistory assetId={selectedAsset} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
