'use client';

import { useState, useMemo } from 'react';
import { useAssetVerification } from '@/lib/asset-verification';

interface VerificationHistoryProps {
  assetId: string;
}

export function VerificationHistory({ assetId }: VerificationHistoryProps) {
  const { getAssetHistory, formatDate, formatDateTime } = useAssetVerification();

  const history = getAssetHistory(assetId);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Filter history based on selected filters
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Filter by action type
    if (filterAction !== 'all') {
      filtered = filtered.filter(item => item.actionType === filterAction);
    }

    // Filter by date range
    const now = Date.now();
    switch (dateRange) {
      case '7d':
        filtered = filtered.filter(item => item.performedDate >= now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        filtered = filtered.filter(item => item.performedDate >= now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        filtered = filtered.filter(item => item.performedDate >= now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    return filtered.sort((a, b) => b.performedDate - a.performedDate);
  }, [history, filterAction, dateRange]);

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'document_uploaded', label: 'Document Uploaded' },
    { value: 'document_verified', label: 'Document Verified' },
    { value: 'document_rejected', label: 'Document Rejected' },
    { value: 'status_changed', label: 'Status Changed' },
    { value: 'badge_issued', label: 'Badge Issued' },
    { value: 'kyc_completed', label: 'KYC Completed' },
    { value: 'aml_screened', label: 'AML Screened' },
    { value: 'requirement_added', label: 'Requirement Added' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      'document_uploaded': '📄',
      'document_verified': '✅',
      'document_rejected': '❌',
      'status_changed': '🔄',
      'badge_issued': '🏆',
      'kyc_completed': '👤',
      'aml_screened': '🛡️',
      'requirement_added': '📋'
    };
    return icons[actionType] || '📝';
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      'document_uploaded': '#3B82F6',
      'document_verified': '#10B981',
      'document_rejected': '#EF4444',
      'status_changed': '#8B5CF6',
      'badge_issued': '#F59E0B',
      'kyc_completed': '#059669',
      'aml_screened': '#0891B2',
      'requirement_added': '#6B7280'
    };
    return colors[actionType] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'unverified': '#EF4444',
      'pending': '#F59E0B',
      'basic': '#3B82F6',
      'standard': '#10B981',
      'enhanced': '#8B5CF6',
      'premium': '#F59E0B'
    };
    return colors[status] || '#6B7280';
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Generate statistics
  const stats = useMemo(() => {
    const totalActions = filteredHistory.length;
    const actionCounts = filteredHistory.reduce((acc, item) => {
      acc[item.actionType] = (acc[item.actionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChanges = filteredHistory.filter(item => item.actionType === 'status_changed');
    const documentUploads = filteredHistory.filter(item => item.actionType === 'document_uploaded');
    const badgesIssued = filteredHistory.filter(item => item.actionType === 'badge_issued');

    return {
      totalActions,
      actionCounts,
      statusChanges: statusChanges.length,
      documentUploads: documentUploads.length,
      badgesIssued: badgesIssued.length
    };
  }, [filteredHistory]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification History</h2>
        <p className="text-gray-600">Complete audit trail of verification activities and changes</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status Changes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.statusChanges}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.documentUploads}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">📄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Badges Issued</p>
              <p className="text-2xl font-bold text-gray-900">{stats.badgesIssued}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-wrap gap-2">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredHistory.length} of {history.length} actions
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📜</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No History Found</h3>
            <p className="text-gray-600">
              {filterAction !== 'all' || dateRange !== 'all' 
                ? 'Try adjusting your filters to see more results' 
                : 'No verification activities recorded yet'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((item, index) => (
              <div key={item.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getActionColor(item.actionType) }}
                    >
                      {getActionIcon(item.actionType)}
                    </div>
                    {index < filteredHistory.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.actionDescription}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">
                            by {formatAddress(item.performedBy)}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">
                            {formatDateTime(item.performedDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{ 
                            backgroundColor: getActionColor(item.actionType) + '20',
                            color: getActionColor(item.actionType)
                          }}
                        >
                          {item.actionType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Status Change */}
                    {item.previousStatus && item.newStatus && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600">Status changed from</span>
                          <span 
                            className="font-medium px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: getStatusColor(item.previousStatus) + '20',
                              color: getStatusColor(item.previousStatus)
                            }}
                          >
                            {item.previousStatus}
                          </span>
                          <span className="text-gray-600">to</span>
                          <span 
                            className="font-medium px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: getStatusColor(item.newStatus) + '20',
                              color: getStatusColor(item.newStatus)
                            }}
                          >
                            {item.newStatus}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    {item.documents.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-1">Documents:</div>
                        <div className="flex flex-wrap gap-2">
                          {item.documents.map((docId, docIndex) => (
                            <span key={docIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Document {docIndex + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-1">Notes:</div>
                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                          {item.notes}
                        </div>
                      </div>
                    )}

                    {/* Technical Details */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {item.ipAddress && (
                        <span>IP: {item.ipAddress}</span>
                      )}
                      {item.userAgent && (
                        <span>User-Agent: {item.userAgent.slice(0, 50)}...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Summary */}
      {filteredHistory.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(stats.actionCounts).map(([action, count]) => (
              <div key={action} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl">{getActionIcon(action)}</span>
                </div>
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{action.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
