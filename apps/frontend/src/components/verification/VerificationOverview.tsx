'use client';

import { useState, useMemo } from 'react';
import { VerificationStatus } from '@/lib/asset-verification';
import { useAssetVerification } from '@/lib/asset-verification';

interface VerificationOverviewProps {
  assetId: string;
  verificationStatus: VerificationStatus;
}

export function VerificationOverview({ assetId, verificationStatus }: VerificationOverviewProps) {
  const { getAssetRequirements, getAssetBadges, formatDate } = useAssetVerification();

  const [showDetails, setShowDetails] = useState(false);

  const requirements = getAssetRequirements(assetId);
  const badges = getAssetBadges(assetId);

  // Calculate verification progress
  const verificationProgress = useMemo(() => {
    const levels = {
      'unverified': 0,
      'pending': 20,
      'basic': 40,
      'standard': 60,
      'enhanced': 80,
      'premium': 100
    };

    return {
      overall: levels[verificationStatus.overallStatus] || 0,
      kyc: levels[verificationStatus.kycStatus] || 0,
      aml: levels[verificationStatus.amlStatus] || 0,
      documents: levels[verificationStatus.documentStatus] || 0,
      legal: levels[verificationStatus.legalStatus] || 0
    };
  }, [verificationStatus]);

  // Requirement completion status
  const requirementStats = useMemo(() => {
    const total = requirements.length;
    const completed = requirements.filter(req => req.status === 'approved').length;
    const pending = requirements.filter(req => req.status === 'pending' || req.status === 'submitted').length;
    const critical = requirements.filter(req => req.priority === 'critical' && req.status !== 'approved').length;

    return { total, completed, pending, critical };
  }, [requirements]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'unverified': '#EF4444',
      'pending': '#F59E0B',
      'basic': '#3B82F6',
      'standard': '#10B981',
      'enhanced': '#8B5CF6',
      'premium': '#F59E0B',
      'approved': '#10B981',
      'rejected': '#EF4444',
      'under_review': '#F59E0B'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'unverified': '❌',
      'pending': '⏳',
      'basic': '🔵',
      'standard': '✅',
      'enhanced': '🟣',
      'premium': '⭐',
      'approved': '✅',
      'rejected': '❌',
      'under_review': '👁️'
    };
    return icons[status] || '❓';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'critical': '#DC2626'
    };
    return colors[priority] || '#6B7280';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Overview</h2>
        <p className="text-gray-600">Comprehensive view of your asset verification status and progress</p>
      </div>

      {/* Verification Score Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Verification Score</h3>
            <p className="text-gray-600">Based on KYC, AML, documents, and legal compliance</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900">{verificationProgress.overall}%</div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getStatusIcon(verificationStatus.overallStatus)}</span>
              <span className="text-lg font-medium text-gray-700 capitalize">
                {verificationStatus.overallStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white rounded-full h-4 mb-4">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{
              width: `${verificationProgress.overall}%`,
              backgroundColor: getStatusColor(verificationStatus.overallStatus)
            }}
          />
        </div>

        {/* Verification Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">KYC</div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-lg">{getStatusIcon(verificationStatus.kycStatus)}</span>
              <span className="font-medium" style={{ color: getStatusColor(verificationStatus.kycStatus) }}>
                {verificationProgress.kyc}%
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">AML</div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-lg">{getStatusIcon(verificationStatus.amlStatus)}</span>
              <span className="font-medium" style={{ color: getStatusColor(verificationStatus.amlStatus) }}>
                {verificationProgress.aml}%
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Documents</div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-lg">{getStatusIcon(verificationStatus.documentStatus)}</span>
              <span className="font-medium" style={{ color: getStatusColor(verificationStatus.documentStatus) }}>
                {verificationProgress.documents}%
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Legal</div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-lg">{getStatusIcon(verificationStatus.legalStatus)}</span>
              <span className="font-medium" style={{ color: getStatusColor(verificationStatus.legalStatus) }}>
                {verificationProgress.legal}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Verification Requirements</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{requirementStats.total}</div>
            <div className="text-sm text-gray-600">Total Requirements</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{requirementStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{requirementStats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{requirementStats.critical}</div>
            <div className="text-sm text-gray-600">Critical Pending</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500 bg-green-500"
            style={{ width: `${(requirementStats.completed / requirementStats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Detailed Requirements */}
      {showDetails && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Requirement Details</h3>
          <div className="space-y-3">
            {requirements.map((requirement) => (
              <div key={requirement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" 
                         style={{ backgroundColor: getPriorityColor(requirement.priority) + '20' }}>
                      <span className="text-sm font-medium" style={{ color: getPriorityColor(requirement.priority) }}>
                        {requirement.priority.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{requirement.title}</h4>
                      <p className="text-sm text-gray-600">{requirement.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      requirement.status === 'approved' ? 'bg-green-100 text-green-800' :
                      requirement.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                      requirement.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {requirement.status.replace('_', ' ')}
                    </span>
                    {requirement.isRequired && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Type: {requirement.requirementType}</span>
                  <span>Category: {requirement.category}</span>
                  {requirement.dueDate && (
                    <span>Due: {formatDate(requirement.dueDate)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Badges Earned</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: badge.badgeColor }}
                  >
                    {badge.badgeIcon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{badge.badgeName}</h4>
                    <p className="text-xs text-gray-600">{badge.badgeDescription}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Issued by {badge.issuedBy} • {formatDate(badge.issuedDate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Initial Verification</div>
              <div className="text-sm text-gray-600">Basic verification completed</div>
            </div>
            <div className="text-sm text-gray-500">{formatDate(Date.now() - 30 * 24 * 60 * 60 * 1000)}</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Document Upload</div>
              <div className="text-sm text-gray-600">Required documents submitted</div>
            </div>
            <div className="text-sm text-gray-500">{formatDate(Date.now() - 15 * 24 * 60 * 60 * 1000)}</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Enhanced Verification</div>
              <div className="text-sm text-gray-600">KYC and AML screening completed</div>
            </div>
            <div className="text-sm text-gray-500">{formatDate(verificationStatus.verificationDate || Date.now())}</div>
          </div>

          {verificationStatus.expiresAt && (
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Verification Expires</div>
                <div className="text-sm text-gray-600">Re-verification required</div>
              </div>
              <div className="text-sm text-gray-500">{formatDate(verificationStatus.expiresAt)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Recommendations</h3>
        <div className="space-y-2">
          {requirementStats.critical > 0 && (
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <span>⚠️</span>
              <span>Complete {requirementStats.critical} critical requirements to improve verification status</span>
            </div>
          )}
          {verificationProgress.overall < 100 && (
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <span>📈</span>
              <span>Submit remaining documents to achieve enhanced verification level</span>
            </div>
          )}
          {verificationStatus.expiresAt && (
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              <span>🔄</span>
              <span>Schedule re-verification before expiration to maintain compliance</span>
            </div>
          )}
          {verificationProgress.overall >= 80 && (
            <div className="flex items-center space-x-2 text-sm text-green-800">
              <span>🎉</span>
              <span>Excellent verification status! Consider premium verification for maximum trust</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
