'use client';

import { useState, useMemo } from 'react';
import { useAssetVerification } from '@/lib/asset-verification';

interface KYCStatusProps {
  assetId: string;
}

export function KYCStatus({ assetId }: KYCStatusProps) {
  const { getVerificationStatus, formatDate } = useAssetVerification();

  const verificationStatus = getVerificationStatus(assetId);

  // Mock KYC data - in real app this would come from the hook
  const kycData = useMemo(() => ({
    ownerInfo: {
      name: 'John Doe',
      address: '0x1234...5678',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      dateOfBirth: '1990-01-01',
      nationality: 'US',
      residentialAddress: '123 Main St, New York, NY 10001'
    },
    verificationLevel: verificationStatus?.kycStatus || 'unverified',
    verificationDate: verificationStatus?.verificationDate,
    expiryDate: verificationStatus?.expiresAt,
    documents: [
      {
        type: 'passport',
        status: 'verified',
        uploadDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        verifiedDate: Date.now() - 25 * 24 * 60 * 60 * 1000,
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000
      },
      {
        type: 'utility_bill',
        status: 'verified',
        uploadDate: Date.now() - 28 * 24 * 60 * 60 * 1000,
        verifiedDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
        expiryDate: null
      },
      {
        type: 'bank_statement',
        status: 'pending',
        uploadDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
        verifiedDate: null,
        expiryDate: null
      }
    ],
    riskAssessment: {
      score: 75,
      level: 'low',
      factors: [
        'Stable residential address',
        'Verified government-issued ID',
        'No adverse credit history',
        'Consistent financial activity'
      ],
      lastAssessed: Date.now() - 10 * 24 * 60 * 60 * 1000
    },
    complianceChecks: {
      pepStatus: 'clear',
      sanctionsStatus: 'clear',
      adverseMedia: 'clear',
      lastChecked: Date.now() - 5 * 24 * 60 * 60 * 1000
    }
  }), [verificationStatus]);

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'risk' | 'compliance'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'risk', label: 'Risk Assessment', icon: '⚠️' },
    { id: 'compliance', label: 'Compliance', icon: '🛡️' }
  ];

  const getVerificationLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'unverified': '#EF4444',
      'pending': '#F59E0B',
      'basic': '#3B82F6',
      'standard': '#10B981',
      'enhanced': '#8B5CF6',
      'premium': '#F59E0B'
    };
    return colors[level] || '#6B7280';
  };

  const getVerificationLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'unverified': 'Unverified',
      'pending': 'Pending',
      'basic': 'Basic',
      'standard': 'Standard',
      'enhanced': 'Enhanced',
      'premium': 'Premium'
    };
    return labels[level] || level;
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'very_high': '#DC2626'
    };
    return colors[level] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'verified': '#10B981',
      'pending': '#F59E0B',
      'rejected': '#EF4444',
      'expired': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'verified': '✅',
      'pending': '⏳',
      'rejected': '❌',
      'expired': '⏰'
    };
    return icons[status] || '❓';
  };

  if (!verificationStatus) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👤</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">KYC Status Not Available</h3>
        <p className="text-gray-600">KYC verification status could not be retrieved</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">KYC Verification Status</h2>
        <p className="text-gray-600">Know Your Customer verification and identity verification details</p>
      </div>

      {/* KYC Status Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">KYC Verification Level</h3>
            <p className="text-gray-600">Current identity verification status</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {getVerificationLevelLabel(kycData.verificationLevel)}
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getVerificationLevelColor(kycData.verificationLevel) }}
              />
              <span className="text-sm text-gray-600 capitalize">{kycData.verificationLevel}</span>
            </div>
          </div>
        </div>

        {/* Verification Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Verification Date</div>
            <div className="font-medium text-gray-900">
              {kycData.verificationDate ? formatDate(kycData.verificationDate) : 'Not verified'}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Expiry Date</div>
            <div className="font-medium text-gray-900">
              {kycData.expiryDate ? formatDate(kycData.expiryDate) : 'No expiry'}
            </div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Risk Score</div>
            <div className="font-medium text-gray-900">{kycData.riskAssessment.score}/100</div>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Full Name:</span>
              <p className="font-medium text-gray-900">{kycData.ownerInfo.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Wallet Address:</span>
              <p className="font-medium text-gray-900 font-mono">{kycData.ownerInfo.address}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="font-medium text-gray-900">{kycData.ownerInfo.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Phone:</span>
              <p className="font-medium text-gray-900">{kycData.ownerInfo.phone}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Date of Birth:</span>
              <p className="font-medium text-gray-900">{kycData.ownerInfo.dateOfBirth}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Nationality:</span>
              <p className="font-medium text-gray-900">{kycData.ownerInfo.nationality}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Residential Address:</span>
              <p className="font-medium text-gray-900">{kycData.ownerInfo.residentialAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
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

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Verification Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Identity Verification</span>
                      <span className="text-sm font-medium text-green-600">Complete</span>
                    </div>
                    <p className="text-xs text-gray-600">Government-issued ID verified and authenticated</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Address Verification</span>
                      <span className="text-sm font-medium text-green-600">Complete</span>
                    </div>
                    <p className="text-xs text-gray-600">Residential address verified with utility bill</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Financial Verification</span>
                      <span className="text-sm font-medium text-yellow-600">Pending</span>
                    </div>
                    <p className="text-xs text-gray-600">Bank statement under review</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Risk Assessment</span>
                      <span className="text-sm font-medium text-green-600">Low Risk</span>
                    </div>
                    <p className="text-xs text-gray-600">Risk score: {kycData.riskAssessment.score}/100</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Next Steps</h4>
                <div className="space-y-2">
                  {kycData.verificationLevel === 'unverified' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Complete identity verification to unlock enhanced features
                      </p>
                    </div>
                  )}
                  {kycData.verificationLevel === 'basic' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Upgrade to standard verification for higher limits
                      </p>
                    </div>
                  )}
                  {kycData.verificationLevel === 'standard' && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        Complete enhanced verification for premium benefits
                      </p>
                    </div>
                  )}
                  {kycData.expiryDate && Date.now() > kycData.expiryDate && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        Your KYC verification has expired. Please renew your verification.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Verification Documents</h4>
              {kycData.documents.map((doc, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm">{getStatusIcon(doc.status)}</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 capitalize">{doc.type.replace('_', ' ')}</h5>
                        <p className="text-sm text-gray-600">
                          Uploaded: {formatDate(doc.uploadDate)}
                          {doc.verifiedDate && ` • Verified: ${formatDate(doc.verifiedDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                        doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.expiryDate && (
                        <span className="text-xs text-gray-500">
                          Expires: {formatDate(doc.expiryDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Risk Assessment</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{kycData.riskAssessment.score}/100</div>
                      <div className="text-sm text-gray-600">Risk Score</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 capitalize" style={{ color: getRiskLevelColor(kycData.riskAssessment.level) }}>
                        {kycData.riskAssessment.level} Risk
                      </div>
                      <div className="text-sm text-gray-600">Risk Level</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${kycData.riskAssessment.score}%`,
                        backgroundColor: getRiskLevelColor(kycData.riskAssessment.level)
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Risk Factors</h4>
                <div className="space-y-2">
                  {kycData.riskAssessment.factors.map((factor, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                      <span className="text-green-600">✓</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Assessment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Last Assessed:</span>
                    <p className="font-medium text-gray-900">{formatDate(kycData.riskAssessment.lastAssessed)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Next Assessment:</span>
                    <p className="font-medium text-gray-900">{formatDate(kycData.riskAssessment.lastAssessed + 90 * 24 * 60 * 60 * 1000)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Compliance Checks</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">PEP Screening</span>
                      <span className="text-sm font-medium text-green-600">Clear</span>
                    </div>
                    <p className="text-xs text-gray-600">Politically Exposed Person check</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sanctions Check</span>
                      <span className="text-sm font-medium text-green-600">Clear</span>
                    </div>
                    <p className="text-xs text-gray-600">International sanctions list</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Adverse Media</span>
                      <span className="text-sm font-medium text-green-600">Clear</span>
                    </div>
                    <p className="text-xs text-gray-600">Negative news screening</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Screening Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Last Checked:</span>
                      <p className="font-medium text-gray-900">{formatDate(kycData.complianceChecks.lastChecked)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Check:</span>
                      <p className="font-medium text-gray-900">{formatDate(kycData.complianceChecks.lastChecked + 30 * 24 * 60 * 60 * 1000)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Compliance Status</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <span className="text-lg">✅</span>
                    <span className="font-medium">All compliance checks passed</span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    The asset owner has passed all required compliance screenings and is eligible for enhanced verification levels.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
