'use client';

import { useState } from 'react';
import { useAssetVerification } from '@/lib/asset-verification';

interface ComplianceBadgesProps {
  assetId: string;
}

export function ComplianceBadges({ assetId }: ComplianceBadgesProps) {
  const { getAssetBadges, formatDate } = useAssetVerification();

  const badges = getAssetBadges(assetId);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Mock additional badge data - in real app this would come from the hook
  const availableBadges = [
    {
      id: 'badge_kyc_basic',
      badgeType: 'kyc_verified' as const,
      badgeName: 'KYC Basic',
      badgeDescription: 'Basic identity verification completed',
      badgeIcon: '👤',
      badgeColor: '#3B82F6',
      issuedBy: 'Identity Verification Team',
      verificationLevel: 'basic' as const,
      criteria: ['Identity document verified', 'Address confirmed'],
      isPublic: true,
      earned: true,
      issuedDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 300 * 24 * 60 * 60 * 1000
    },
    {
      id: 'badge_kyc_enhanced',
      badgeType: 'kyc_verified' as const,
      badgeName: 'KYC Enhanced',
      badgeDescription: 'Enhanced identity verification with additional checks',
      badgeIcon: '🛡️',
      badgeColor: '#8B5CF6',
      issuedBy: 'Compliance Department',
      verificationLevel: 'enhanced' as const,
      criteria: ['Enhanced identity verification', 'Source of funds verified', 'Risk assessment completed'],
      isPublic: true,
      earned: true,
      issuedDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 330 * 24 * 60 * 60 * 1000
    },
    {
      id: 'badge_aml_standard',
      badgeType: 'aml_compliant' as const,
      badgeName: 'AML Standard',
      badgeDescription: 'Standard anti-money laundering compliance',
      badgeIcon: '🔍',
      badgeColor: '#10B981',
      issuedBy: 'AML Compliance Team',
      verificationLevel: 'standard' as const,
      criteria: ['AML screening completed', 'Transaction monitoring active', 'Risk assessment passed'],
      isPublic: true,
      earned: true,
      issuedDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 315 * 24 * 60 * 60 * 1000
    },
    {
      id: 'badge_premium_asset',
      badgeType: 'premium_asset' as const,
      badgeName: 'Premium Asset',
      badgeDescription: 'Highest level of asset verification and compliance',
      badgeIcon: '⭐',
      badgeColor: '#F59E0B',
      issuedBy: 'Verification Committee',
      verificationLevel: 'premium' as const,
      criteria: ['All documents verified', 'Premium KYC completed', 'Enhanced AML screening', 'Legal compliance verified'],
      isPublic: true,
      earned: false,
      issuedDate: null,
      expiresAt: null
    },
    {
      id: 'badge_verified_owner',
      badgeType: 'verified_owner' as const,
      badgeName: 'Verified Owner',
      badgeDescription: 'Asset ownership has been verified and confirmed',
      badgeIcon: '🏠',
      badgeColor: '#059669',
      issuedBy: 'Ownership Verification Team',
      verificationLevel: 'standard' as const,
      criteria: ['Ownership documents verified', 'Title search completed', 'Legal ownership confirmed'],
      isPublic: true,
      earned: true,
      issuedDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 340 * 24 * 60 * 60 * 1000
    },
    {
      id: 'badge_compliant_jurisdiction',
      badgeType: 'compliant_jurisdiction' as const,
      badgeName: 'Compliant Jurisdiction',
      badgeDescription: 'Asset complies with all relevant jurisdictional requirements',
      badgeIcon: '🌍',
      badgeColor: '#0891B2',
      issuedBy: 'Legal Compliance Team',
      verificationLevel: 'standard' as const,
      criteria: ['Jurisdictional compliance verified', 'All required permits obtained', 'Local regulations met'],
      isPublic: true,
      earned: false,
      issuedDate: null,
      expiresAt: null
    }
  ];

  const allBadges = [...badges, ...availableBadges.filter(badge => !badges.find(earned => earned.id === badge.id))];
  const earnedBadges = allBadges.filter(badge => badge.earned);
  const availableToEarn = allBadges.filter(badge => !badge.earned);

  const getVerificationLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'basic': '#3B82F6',
      'standard': '#10B981',
      'enhanced': '#8B5CF6',
      'premium': '#F59E0B'
    };
    return colors[level] || '#6B7280';
  };

  const getVerificationLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'basic': 'Basic',
      'standard': 'Standard',
      'enhanced': 'Enhanced',
      'premium': 'Premium'
    };
    return labels[level] || level;
  };

  const shareBadge = (badgeId: string) => {
    setSelectedBadge(badgeId);
    setShowShareModal(true);
  };

  const generateShareLink = (badgeId: string) => {
    return `https://no-loss-auction.com/badge/${badgeId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show success message
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Compliance Badges</h2>
        <p className="text-gray-600">Verification badges and compliance achievements for your asset</p>
      </div>

      {/* Badge Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Earned Badges</p>
              <p className="text-2xl font-bold text-gray-900">{earnedBadges.length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">🏆</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available to Earn</p>
              <p className="text-2xl font-bold text-gray-900">{availableToEarn.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Highest Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {earnedBadges.length > 0 ? 
                  getVerificationLevelLabel(
                    Math.max(...earnedBadges.map(b => 
                      ['basic', 'standard', 'enhanced', 'premium'].indexOf(b.verificationLevel)
                    )) === 0 ? 'basic' :
                    Math.max(...earnedBadges.map(b => 
                      ['basic', 'standard', 'enhanced', 'premium'].indexOf(b.verificationLevel)
                    )) === 1 ? 'standard' :
                    Math.max(...earnedBadges.map(b => 
                      ['basic', 'standard', 'enhanced', 'premium'].indexOf(b.verificationLevel)
                    )) === 2 ? 'enhanced' : 'premium'
                  ) : 'None'
                }
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Earned Badges</h3>
        {earnedBadges.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Badges Earned Yet</h3>
            <p className="text-gray-600">Complete verification requirements to earn compliance badges</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: badge.badgeColor }}
                  >
                    {badge.badgeIcon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{badge.badgeName}</h4>
                    <p className="text-sm text-gray-600">{badge.badgeDescription}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Verification Level</span>
                    <span 
                      className="font-medium px-2 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: getVerificationLevelColor(badge.verificationLevel) + '20',
                        color: getVerificationLevelColor(badge.verificationLevel)
                      }}
                    >
                      {getVerificationLevelLabel(badge.verificationLevel)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Issued by</span>
                    <span className="font-medium text-gray-900">{badge.issuedBy}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Issued Date</span>
                    <span className="font-medium text-gray-900">
                      {badge.issuedDate ? formatDate(badge.issuedDate) : 'N/A'}
                    </span>
                  </div>

                  {badge.expiresAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Expires</span>
                      <span className="font-medium text-gray-900">{formatDate(badge.expiresAt)}</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-600 mb-2">Criteria Met:</div>
                    <div className="space-y-1">
                      {badge.criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-3">
                    <button
                      onClick={() => shareBadge(badge.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Share
                    </button>
                    <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Badges */}
      {availableToEarn.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available to Earn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableToEarn.map((badge) => (
              <div key={badge.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-75">
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold grayscale"
                    style={{ backgroundColor: badge.badgeColor }}
                  >
                    {badge.badgeIcon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{badge.badgeName}</h4>
                    <p className="text-sm text-gray-600">{badge.badgeDescription}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Required Level</span>
                    <span 
                      className="font-medium px-2 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: getVerificationLevelColor(badge.verificationLevel) + '20',
                        color: getVerificationLevelColor(badge.verificationLevel)
                      }}
                    >
                      {getVerificationLevelLabel(badge.verificationLevel)}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-600 mb-2">Requirements:</div>
                    <div className="space-y-1">
                      {badge.criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-400">○</span>
                          <span className="text-gray-600">{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-sm text-blue-800">
                      <span>🔒</span>
                      <span>Complete verification requirements to earn this badge</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Badge</h3>
            
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                  style={{ backgroundColor: allBadges.find(b => b.id === selectedBadge)?.badgeColor }}
                >
                  {allBadges.find(b => b.id === selectedBadge)?.badgeIcon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {allBadges.find(b => b.id === selectedBadge)?.badgeName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {allBadges.find(b => b.id === selectedBadge)?.badgeDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={generateShareLink(selectedBadge)}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(generateShareLink(selectedBadge))}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share Options</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    Twitter
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    LinkedIn
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                    Email
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
