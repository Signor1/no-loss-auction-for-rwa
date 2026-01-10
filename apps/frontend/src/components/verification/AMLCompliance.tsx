'use client';

import { useState, useMemo } from 'react';
import { useAssetVerification } from '@/lib/asset-verification';

interface AMLComplianceProps {
  assetId: string;
}

export function AMLCompliance({ assetId }: AMLComplianceProps) {
  const { getVerificationStatus, formatDate } = useAssetVerification();

  const verificationStatus = getVerificationStatus(assetId);

  // Mock AML data - in real app this would come from the hook
  const amlData = useMemo(() => ({
    overallStatus: verificationStatus?.amlStatus || 'unverified',
    riskRating: 'medium' as const,
    lastScreening: Date.now() - 5 * 24 * 60 * 60 * 1000,
    nextScreeningDue: Date.now() + 25 * 24 * 60 * 60 * 1000,
    screeningResults: [
      {
        provider: 'Chainalysis',
        status: 'clear' as const,
        details: 'No suspicious activity detected',
        screenedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
      },
      {
        provider: 'Elliptic',
        status: 'clear' as const,
        details: 'Address score: Low risk',
        screenedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
      },
      {
        provider: 'CipherTrace',
        status: 'clear' as const,
        details: 'No high-risk transactions identified',
        screenedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
      }
    ],
    flaggedTransactions: [
      {
        transactionId: '0x1234...5678',
        amount: 50000,
        date: Date.now() - 60 * 24 * 60 * 60 * 1000,
        reason: 'Large transaction amount',
        status: 'cleared' as const
      },
      {
        transactionId: '0x2345...6789',
        amount: 75000,
        date: Date.now() - 45 * 24 * 60 * 60 * 1000,
        reason: 'Unusual transaction pattern',
        status: 'cleared' as const
      }
    ],
    complianceMetrics: {
      totalTransactions: 1247,
      totalVolume: 2847500,
      averageTransactionSize: 2283,
      highValueTransactions: 23,
      suspiciousActivityReports: 0,
      lastSARDate: null
    },
    jurisdictions: [
      {
        country: 'United States',
        riskLevel: 'low',
        regulations: ['Bank Secrecy Act', 'USA PATRIOT Act'],
        lastChecked: Date.now() - 5 * 24 * 60 * 60 * 1000
      },
      {
        country: 'United Kingdom',
        riskLevel: 'low',
        regulations: ['Money Laundering Regulations 2017'],
        lastChecked: Date.now() - 5 * 24 * 60 * 60 * 1000
      }
    ],
    monitoringSettings: {
      realTimeMonitoring: true,
      transactionThreshold: 10000,
      patternDetection: true,
      geoFencing: true,
      alertFrequency: 'immediate'
    }
  }), [verificationStatus]);

  const [activeTab, setActiveTab] = useState<'overview' | 'screening' | 'transactions' | 'monitoring'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🛡️' },
    { id: 'screening', label: 'Screening Results', icon: '🔍' },
    { id: 'transactions', label: 'Transactions', icon: '💳' },
    { id: 'monitoring', label: 'Monitoring', icon: '📊' }
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

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'very_high': '#DC2626'
    };
    return colors[level] || '#6B7280';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'clear': '#10B981',
      'flagged': '#EF4444',
      'error': '#EF4444',
      'cleared': '#10B981',
      'under_review': '#F59E0B',
      'suspicious': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'clear': '✅',
      'flagged': '🚩',
      'error': '❌',
      'cleared': '✅',
      'under_review': '👁️',
      'suspicious': '⚠️'
    };
    return icons[status] || '❓';
  };

  if (!verificationStatus) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛡️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">AML Status Not Available</h3>
        <p className="text-gray-600">Anti-money laundering compliance status could not be retrieved</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">AML Compliance Status</h2>
        <p className="text-gray-600">Anti-money laundering compliance and transaction monitoring</p>
      </div>

      {/* AML Status Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">AML Compliance Status</h3>
            <p className="text-gray-600">Current anti-money laundering compliance level</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 mb-1 capitalize">
              {amlData.overallStatus}
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getVerificationLevelColor(amlData.overallStatus) }}
              />
              <span className="text-sm text-gray-600">Risk Rating: {amlData.riskRating}</span>
            </div>
          </div>
        </div>

        {/* AML Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Last Screening</div>
            <div className="font-medium text-gray-900">{formatDate(amlData.lastScreening)}</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Next Screening</div>
            <div className="font-medium text-gray-900">{formatDate(amlData.nextScreeningDue)}</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Transactions</div>
            <div className="font-medium text-gray-900">{amlData.complianceMetrics.totalTransactions.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Flagged Items</div>
            <div className="font-medium text-gray-900">{amlData.flaggedTransactions.length}</div>
          </div>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Score</h3>
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Compliance Score</span>
              <span className="text-2xl font-bold text-gray-900">85/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: '85%',
                  backgroundColor: getRiskLevelColor('low')
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">92%</div>
            <div className="text-sm text-gray-600">Transaction Monitoring</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">88%</div>
            <div className="text-sm text-gray-600">Screening Coverage</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">75%</div>
            <div className="text-sm text-gray-600">Documentation</div>
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
                <h4 className="text-md font-medium text-gray-900 mb-3">Compliance Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Risk Assessment</span>
                        <span className="text-sm font-medium text-yellow-600">Medium Risk</span>
                      </div>
                      <p className="text-xs text-gray-600">Based on transaction patterns and geographic exposure</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Monitoring Status</span>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </div>
                      <p className="text-xs text-gray-600">Real-time transaction monitoring enabled</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Screening Coverage</span>
                        <span className="text-sm font-medium text-green-600">100%</span>
                      </div>
                      <p className="text-xs text-gray-600">All required screenings completed</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Compliance Rating</span>
                        <span className="text-sm font-medium text-green-600">A-</span>
                      </div>
                      <p className="text-xs text-gray-600">Above industry standard</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{amlData.complianceMetrics.totalTransactions.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(amlData.complianceMetrics.totalVolume)}</div>
                    <div className="text-xs text-gray-600">Total Volume</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{amlData.complianceMetrics.highValueTransactions}</div>
                    <div className="text-xs text-gray-600">High Value Tx</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{amlData.complianceMetrics.suspiciousActivityReports}</div>
                    <div className="text-xs text-gray-600">SARs Filed</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Jurisdictional Coverage</h4>
                <div className="space-y-2">
                  {amlData.jurisdictions.map((jurisdiction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{jurisdiction.country}</div>
                        <div className="text-xs text-gray-600">{jurisdiction.regulations.join(', ')}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          jurisdiction.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                          jurisdiction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {jurisdiction.riskLevel} risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'screening' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Screening Results</h4>
                <div className="space-y-3">
                  {amlData.screeningResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm">{getStatusIcon(result.status)}</span>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">{result.provider}</h5>
                            <p className="text-sm text-gray-600">{result.details}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            result.status === 'clear' ? 'bg-green-100 text-green-800' :
                            result.status === 'flagged' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(result.screenedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Screening Schedule</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Last Screening:</span>
                      <p className="font-medium text-gray-900">{formatDate(amlData.lastScreening)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Next Screening:</span>
                      <p className="font-medium text-gray-900">{formatDate(amlData.nextScreeningDue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Flagged Transactions</h4>
                {amlData.flaggedTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Flagged Transactions</h3>
                    <p className="text-gray-600">All transactions have been cleared</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {amlData.flaggedTransactions.map((transaction, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm">{getStatusIcon(transaction.status)}</span>
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">{transaction.transactionId}</h5>
                              <p className="text-sm text-gray-600">{transaction.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{formatCurrency(transaction.amount)}</div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                transaction.status === 'cleared' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Transaction Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{amlData.complianceMetrics.totalTransactions.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(amlData.complianceMetrics.totalVolume)}</div>
                    <div className="text-xs text-gray-600">Total Volume</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(amlData.complianceMetrics.averageTransactionSize)}</div>
                    <div className="text-xs text-gray-600">Average Size</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{amlData.complianceMetrics.highValueTransactions}</div>
                    <div className="text-xs text-gray-600">High Value</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Monitoring Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Real-time Monitoring</div>
                        <div className="text-sm text-gray-600">Continuous transaction monitoring</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        amlData.monitoringSettings.realTimeMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {amlData.monitoringSettings.realTimeMonitoring ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Pattern Detection</div>
                        <div className="text-sm text-gray-600">AI-powered pattern recognition</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        amlData.monitoringSettings.patternDetection ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {amlData.monitoringSettings.patternDetection ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Transaction Threshold</div>
                        <div className="text-sm text-gray-600">Alert threshold for transactions</div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {formatCurrency(amlData.monitoringSettings.transactionThreshold)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">Geo-fencing</div>
                        <div className="text-sm text-gray-600">Geographic risk monitoring</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        amlData.monitoringSettings.geoFencing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {amlData.monitoringSettings.geoFencing ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Alert Configuration</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Alert Frequency:</span>
                      <p className="font-medium text-gray-900 capitalize">{amlData.monitoringSettings.alertFrequency}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Monitoring Providers:</span>
                      <p className="font-medium text-gray-900">{amlData.screeningResults.length} active</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Recent Alerts</h4>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Alerts</h3>
                  <p className="text-gray-600">All monitoring systems are operating normally</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
