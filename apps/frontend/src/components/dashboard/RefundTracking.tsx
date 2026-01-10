'use client';

import { RefundRequest } from '@/lib/auction-dashboard';
import { useRefundTracking } from '@/lib/auction-dashboard';

interface RefundTrackingProps {
  refunds: RefundRequest[];
}

export function RefundTracking({ refunds }: RefundTrackingProps) {
  const { getRefundProgress } = useRefundTracking();

  if (refunds.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Tracking</h3>
        
        <div className="text-center py-8">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h4 className="text-sm font-medium text-gray-900 mb-2">No Refunds</h4>
          <p className="text-gray-600 text-sm">No refunds are currently being processed</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'processing': return '⏳';
      case 'pending': return '⏱️';
      case 'failed': return '✗';
      default: return '○';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Refund Tracking</h3>
      
      <div className="space-y-4">
        {refunds.map((refund) => {
          const progress = getRefundProgress(refund);
          
          return (
            <div key={refund.id} className="border border-gray-200 rounded-lg p-4">
              {/* Refund Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(refund.status)}`}>
                    {getStatusIcon(refund.status)} {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-600">Refund #{refund.id.slice(-6)}</span>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{refund.amount} ETH</div>
                  {refund.netAmount && (
                    <div className="text-xs text-green-600">Net: {refund.netAmount} ETH</div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {refund.status === 'pending' || refund.status === 'processing' ? (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Processing Progress</span>
                    <span>{Math.round(progress.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                </div>
              ) : null}
              
              {/* Refund Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested:</span>
                  <span className="text-gray-900">
                    {new Date(refund.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Completion:</span>
                  <span className="text-gray-900">
                    {new Date(refund.estimatedCompletion).toLocaleString()}
                  </span>
                </div>
                
                {refund.penalty && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Penalty:</span>
                    <span className="text-red-600">-{refund.penalty} ETH</span>
                  </div>
                )}
                
                {refund.transactionHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction:</span>
                    <span className="font-mono text-xs text-blue-600">
                      {refund.transactionHash.slice(0, 10)}...{refund.transactionHash.slice(-8)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Status Messages */}
              <div className={`mt-3 p-2 rounded text-xs ${
                refund.status === 'completed' ? 'bg-green-50 text-green-800' :
                refund.status === 'processing' ? 'bg-blue-50 text-blue-800' :
                refund.status === 'pending' ? 'bg-yellow-50 text-yellow-800' :
                'bg-red-50 text-red-800'
              }`}>
                {refund.status === 'completed' && '✓ Refund has been successfully processed and deposited to your wallet.'}
                {refund.status === 'processing' && '⏳ Your refund is currently being processed by the smart contract.'}
                {refund.status === 'pending' && '⏱️ Your refund request has been submitted and is awaiting processing.'}
                {refund.status === 'failed' && '✗ Refund processing failed. Please contact support.'}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Refund Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{refunds.length}</div>
            <div className="text-gray-600">Total Refunds</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {refunds.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
