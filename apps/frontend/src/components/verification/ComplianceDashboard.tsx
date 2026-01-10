'use client';

import { useState } from 'react';
import { useComplianceDashboard } from '@/lib/compliance-dashboard';

export function ComplianceDashboard() {
  const {
    dashboard,
    isLoading,
    selectedJurisdiction,
    selectedCategory,
    documentExpiryAlerts,
    complianceTrends,
    setSelectedJurisdiction,
    setSelectedCategory,
    acknowledgeAlert,
    completeAction,
    uploadComplianceDocument,
    updateComplianceStatus,
    scheduleComplianceReview,
    generateComplianceReport
  } = useComplianceDashboard();

  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'documents' | 'regulatory' | 'audit'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'actions', label: 'Required Actions', icon: '✅' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'regulatory', label: 'Regulatory', icon: '⚖️' },
    { id: 'audit', label: 'Audit Trail', icon: '📋' }
  ];

  const jurisdictions = [
    { value: 'all', label: 'All Jurisdictions' },
    { value: 'US', label: 'United States' },
    { value: 'EU', label: 'European Union' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'kyc', label: 'KYC' },
    { value: 'aml', label: 'AML' },
    { value: 'tax', label: 'Tax' },
    { value: 'licensing', label: 'Licensing' },
    { value: 'reporting', label: 'Reporting' }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'compliant': '#10B981',
      'non_compliant': '#EF4444',
      'pending': '#F59E0B',
      'restricted': '#F97316',
      'active': '#10B981',
      'expired': '#EF4444',
      'requires_review': '#F59E0B',
      'rejected': '#EF4444',
      'overdue': '#EF4444',
      'in_progress': '#3B82F6',
      'completed': '#10B981'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'compliant': 'Compliant',
      'non_compliant': 'Non-Compliant',
      'pending': 'Pending',
      'restricted': 'Restricted',
      'active': 'Active',
      'expired': 'Expired',
      'requires_review': 'Requires Review',
      'rejected': 'Rejected',
      'overdue': 'Overdue',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return labels[status] || status;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      'info': '#3B82F6',
      'warning': '#F59E0B',
      'error': '#EF4444',
      'critical': '#991B1B'
    };
    return colors[severity] || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#F97316',
      'urgent': '#EF4444'
    };
    return colors[priority] || '#6B7280';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDaysUntil = (timestamp: number) => {
    const days = Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : `${Math.abs(days)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚖️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance Data Unavailable</h3>
          <p className="text-gray-600">Unable to load compliance information</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Dashboard</h1>
              <p className="text-gray-600">Monitor and manage your regulatory compliance requirements</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ 
                backgroundColor: getStatusColor(dashboard.overallStatus) + '20',
                color: getStatusColor(dashboard.overallStatus)
              }}>
                {getStatusLabel(dashboard.overallStatus)}
              </div>
              <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {dashboard.complianceLevel.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard.complianceScore}%</p>
                <p className="text-sm text-gray-600">Overall score</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-green-600">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className="text-3xl font-bold" style={{ color: getSeverityColor(dashboard.riskLevel) }}>
                  {dashboard.riskLevel.toUpperCase()}
                </p>
                <p className="text-sm text-gray-600">Current risk</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-blue-600">🛡️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Actions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboard.requiredActions.filter(action => action.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Require attention</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-yellow-600">⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboard.alerts.filter(alert => !alert.acknowledged).length}
                </p>
                <p className="text-sm text-gray-600">Need review</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl text-red-600">🔔</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-4">
              <span className="text-sm text-gray-600">Jurisdiction:</span>
              <div className="flex space-x-2">
                {jurisdictions.map((jurisdiction) => (
                  <button
                    key={jurisdiction.value}
                    onClick={() => setSelectedJurisdiction(jurisdiction.value)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedJurisdiction === jurisdiction.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {jurisdiction.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <span className="text-sm text-gray-600">Category:</span>
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'actions' && dashboard.requiredActions.filter(action => action.status === 'pending').length > 0 && (
                    <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                  {tab.id === 'documents' && dashboard.documents.filter(doc => doc.status === 'expired').length > 0 && (
                    <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                  {tab.id === 'regulatory' && dashboard.alerts.filter(alert => alert.category === 'regulatory' && !alert.acknowledged).length > 0 && (
                    <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Compliance Overview</h3>
              
              {/* Compliance Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Compliance Status</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Overall Status</span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ 
                        backgroundColor: getStatusColor(dashboard.overallStatus) + '20',
                        color: getStatusColor(dashboard.overallStatus)
                      }}>
                        {getStatusLabel(dashboard.overallStatus)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Compliance Level</span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {dashboard.complianceLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Risk Level</span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ 
                        backgroundColor: getSeverityColor(dashboard.riskLevel) + '20',
                        color: getSeverityColor(dashboard.riskLevel)
                      }}>
                        {dashboard.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Next Review</span>
                      <span className="text-sm text-gray-900">{getDaysUntil(dashboard.nextReviewDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Jurisdiction Compliance</h4>
                  <div className="space-y-3">
                    {dashboard.jurisdictionRequirements.map((jurisdiction) => (
                      <div key={jurisdiction.jurisdiction} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{jurisdiction.jurisdiction}</div>
                          <div className="text-sm text-gray-600">{jurisdiction.region}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{jurisdiction.complianceScore}%</div>
                          <div className="text-sm text-gray-600">Score</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Alerts */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Recent Alerts</h4>
                <div className="space-y-3">
                  {dashboard.alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: getSeverityColor(alert.severity) }}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium text-gray-900">{alert.title}</h5>
                            <span className="text-sm text-gray-600">{getDaysUntil(alert.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Acknowledge
                        </button>
                        {alert.actionUrl && (
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Action
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Required Actions</h3>
              
              <div className="space-y-4">
                {dashboard.requiredActions.map((action) => (
                  <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            action.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            action.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {action.priority.toUpperCase()}
                          </span>
                          <h4 className="font-medium text-gray-900">{action.title}</h4>
                        </div>
                        <p className="text-gray-600 mb-3">{action.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium text-gray-900 ml-2">{action.category.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-medium text-gray-900 ml-2">{getDaysUntil(action.dueDate)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Estimated Time:</span>
                            <span className="font-medium text-gray-900 ml-2">{action.estimatedTime}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ml-2`} style={{ 
                              backgroundColor: getStatusColor(action.status) + '20',
                              color: getStatusColor(action.status)
                            }}>
                              {getStatusLabel(action.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        {action.status === 'pending' && (
                          <button
                            onClick={() => completeAction(action.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Complete
                          </button>
                        )}
                        {action.actionUrl && (
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Compliance Documents</h3>
              
              {/* Document Expiry Tracking */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Document Expiry Tracking</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-600 font-medium">Expired Documents</p>
                        <p className="text-2xl font-bold text-red-900">
                          {dashboard.documents.filter(doc => doc.status === 'expired').length}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">🚨</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Expiring Soon (30 days)</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {documentExpiryAlerts.filter(alert => alert.severity === 'warning').length}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">⏰</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Active Documents</p>
                        <p className="text-2xl font-bold text-green-900">
                          {dashboard.documents.filter(doc => doc.status === 'active').length}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">✅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Upload New Document</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <p className="text-gray-900 mb-2">Upload compliance documents</p>
                  <p className="text-gray-600 text-sm mb-4">Drag and drop files here or click to browse</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Select Files
                  </button>
                  <p className="text-gray-500 text-xs mt-4">
                    Supported formats: PDF, JPG, PNG (Max 10MB)
                  </p>
                </div>
              </div>
              
              {/* Documents Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Review</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboard.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{doc.name}</div>
                            <div className="text-sm text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                            <div className="text-xs text-gray-400">Uploaded: {formatDate(doc.uploadedAt)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {doc.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{doc.complianceCategory}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full`} style={{ 
                            backgroundColor: getStatusColor(doc.status) + '20',
                            color: getStatusColor(doc.status)
                          }}>
                            {getStatusLabel(doc.status)}
                          </span>
                          {doc.expiresAt && doc.expiresAt <= Date.now() + (30 * 24 * 60 * 60 * 1000) && (
                            <div className="text-xs text-red-600 mt-1">Expiring Soon</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.jurisdiction}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {doc.expiresAt ? getDaysUntil(doc.expiresAt) : 'N/A'}
                          </div>
                          {doc.expiresAt && doc.expiresAt <= Date.now() && (
                            <div className="text-xs text-red-600">Expired</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getDaysUntil(doc.nextReview)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 font-medium">
                              View
                            </button>
                            <button className="text-green-600 hover:text-green-900 font-medium">
                              Renew
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'regulatory' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Regulatory Information</h3>
              
              {/* Applicable Regulations */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Applicable Regulations</h4>
                <div className="space-y-4">
                  {dashboard.regulatoryInfo.applicableRegulations.map((regulation) => (
                    <div key={regulation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-medium text-gray-900">{regulation.name}</h5>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {regulation.jurisdiction}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{regulation.description}</p>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600">
                              <strong>Requirements:</strong>
                            </div>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {regulation.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full`} style={{ 
                            backgroundColor: getStatusColor(regulation.complianceStatus) + '20',
                            color: getStatusColor(regulation.complianceStatus)
                          }}>
                            {getStatusLabel(regulation.complianceStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reporting Obligations */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Reporting Obligations</h4>
                <div className="space-y-3">
                  {dashboard.regulatoryInfo.reportingObligations.map((obligation) => (
                    <div key={obligation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{obligation.name}</div>
                        <div className="text-sm text-gray-600">{obligation.description}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Due: {getDaysUntil(obligation.nextDue)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full`} style={{ 
                          backgroundColor: getStatusColor(obligation.status) + '20',
                          color: getStatusColor(obligation.status)
                        }}>
                          {getStatusLabel(obligation.status)}
                        </span>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Submit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Audit Trail</h3>
              
              <div className="space-y-3">
                {dashboard.auditTrail.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📋</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-gray-900">{entry.action}</h5>
                        <span className="text-sm text-gray-600">{formatDateTime(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{entry.details}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>User: {entry.userId}</span>
                        <span>Category: {entry.category}</span>
                        <span>Status: {entry.status}</span>
                        <span>Risk: {entry.riskLevel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
