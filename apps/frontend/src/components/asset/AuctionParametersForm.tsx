'use client';

import { AssetFormState } from '@/lib/asset-management';

interface AuctionParametersFormProps {
  formState: AssetFormState;
  updateFormState: (updates: Partial<AssetFormState>) => void;
  validationErrors: Record<string, string[]>;
}

export function AuctionParametersForm({ formState, updateFormState, validationErrors }: AuctionParametersFormProps) {
  const handleInputChange = (field: keyof AssetFormState, value: any) => {
    updateFormState({ [field]: value });
  };

  const handleNestedChange = (parentField: keyof AssetFormState, childField: string, value: any) => {
    const parent = formState[parentField] as any;
    updateFormState({
      [parentField]: {
        ...parent,
        [childField]: value
      }
    });
  };

  const calculateDefaultEndTime = (startTime: Date, duration: number) => {
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + duration);
    return endTime.toISOString().slice(0, 16);
  };

  const handleStartTimeChange = (startTime: string) => {
    handleNestedChange('auctionParameters', 'startTime', startTime);
    
    // Auto-calculate end time if duration is set
    const duration = formState.auctionParameters?.duration || 7;
    const endTime = calculateDefaultEndTime(new Date(startTime), duration);
    handleNestedChange('auctionParameters', 'endTime', endTime);
  };

  const handleDurationChange = (duration: number) => {
    handleNestedChange('auctionParameters', 'duration', duration);
    
    // Recalculate end time if start time is set
    const startTime = formState.auctionParameters?.startTime;
    if (startTime) {
      const endTime = calculateDefaultEndTime(new Date(startTime), duration);
      handleNestedChange('auctionParameters', 'endTime', endTime);
    }
  };

  const getQuickEndTime = (hoursFromNow: number) => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + hoursFromNow);
    return endTime.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Auction Schedule */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Auction Schedule</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={formState.auctionParameters?.startTime || ''}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={new Date().toISOString().slice(0, 16)}
            />
            {validationErrors['auctionParameters.startTime'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['auctionParameters.startTime'][0]}</p>
            )}
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Quick start options:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStartTimeChange(new Date().toISOString().slice(0, 16))}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Now
                </button>
                <button
                  onClick={() => {
                    const startTime = new Date();
                    startTime.setHours(startTime.getHours() + 1);
                    handleStartTimeChange(startTime.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  +1 Hour
                </button>
                <button
                  onClick={() => {
                    const startTime = new Date();
                    startTime.setDate(startTime.getDate() + 1);
                    handleStartTimeChange(startTime.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  +1 Day
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              End Time *
            </label>
            <input
              type="datetime-local"
              id="endTime"
              value={formState.auctionParameters?.endTime || ''}
              onChange={(e) => handleNestedChange('auctionParameters', 'endTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={formState.auctionParameters?.startTime || new Date().toISOString().slice(0, 16)}
            />
            {validationErrors['auctionParameters.endTime'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['auctionParameters.endTime'][0]}</p>
            )}
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Quick end options:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleNestedChange('auctionParameters', 'endTime', getQuickEndTime(24))}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  24 Hours
                </button>
                <button
                  onClick={() => handleNestedChange('auctionParameters', 'endTime', getQuickEndTime(72))}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  3 Days
                </button>
                <button
                  onClick={() => handleNestedChange('auctionParameters', 'endTime', getQuickEndTime(168))}
                  className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  7 Days
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="mt-6">
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Auction Duration
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="duration"
              min="1"
              max="30"
              value={formState.auctionParameters?.duration || 7}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-20">
              {formState.auctionParameters?.duration || 7} days
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 day</span>
            <span>30 days</span>
          </div>
        </div>
      </div>

      {/* Bid Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bid Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="bidExpirationPeriod" className="block text-sm font-medium text-gray-700 mb-2">
              Bid Expiration Period (hours)
            </label>
            <input
              type="number"
              id="bidExpirationPeriod"
              value={formState.auctionParameters?.bidExpirationPeriod || 24}
              onChange={(e) => handleNestedChange('auctionParameters', 'bidExpirationPeriod', parseInt(e.target.value) || 24)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="168"
            />
            <p className="mt-1 text-xs text-gray-500">
              Time after which bids expire if not matched
            </p>
          </div>

          <div>
            <label htmlFor="withdrawalLockPeriod" className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Lock Period (hours)
            </label>
            <input
              type="number"
              id="withdrawalLockPeriod"
              value={formState.auctionParameters?.withdrawalLockPeriod || 1}
              onChange={(e) => handleNestedChange('auctionParameters', 'withdrawalLockPeriod', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="24"
            />
            <p className="mt-1 text-xs text-gray-500">
              Time before auction end when bids cannot be withdrawn
            </p>
          </div>
        </div>
      </div>

      {/* Penalty Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Penalty Settings</h3>
        
        <div>
          <label htmlFor="withdrawalPenaltyBps" className="block text-sm font-medium text-gray-700 mb-2">
            Withdrawal Penalty (%)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              id="withdrawalPenaltyBps"
              min="0"
              max="1000"
              step="50"
              value={formState.auctionParameters?.withdrawalPenaltyBps || 100}
              onChange={(e) => handleNestedChange('auctionParameters', 'withdrawalPenaltyBps', parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700 w-20">
              {((formState.auctionParameters?.withdrawalPenaltyBps || 100) / 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>10%</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Penalty percentage applied to withdrawn bids (100 = 1%)
          </p>
        </div>
      </div>

      {/* Advanced Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Auto-Settlement</h4>
              <p className="text-xs text-gray-500 mt-1">
                Automatically transfer asset to winner after auction ends
              </p>
            </div>
            <button
              onClick={() => handleNestedChange('auctionParameters', 'autoSettleEnabled', !formState.auctionParameters?.autoSettleEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formState.auctionParameters?.autoSettleEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formState.auctionParameters?.autoSettleEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Secure Escrow</h4>
              <p className="text-xs text-gray-500 mt-1">
                Enable enhanced escrow protection for high-value assets
              </p>
            </div>
            <button
              onClick={() => handleNestedChange('auctionParameters', 'secureEscrowEnabled', !formState.auctionParameters?.secureEscrowEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formState.auctionParameters?.secureEscrowEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formState.auctionParameters?.secureEscrowEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Settings */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Auction Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="font-medium text-gray-700">Start Time:</span>
            <p className="text-gray-600">
              {formState.auctionParameters?.startTime 
                ? new Date(formState.auctionParameters.startTime).toLocaleString()
                : 'Not set'
              }
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">End Time:</span>
            <p className="text-gray-600">
              {formState.auctionParameters?.endTime 
                ? new Date(formState.auctionParameters.endTime).toLocaleString()
                : 'Not set'
              }
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Duration:</span>
            <p className="text-gray-600">{formState.auctionParameters?.duration || 7} days</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Bid Expiration:</span>
            <p className="text-gray-600">{formState.auctionParameters?.bidExpirationPeriod || 24} hours</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Withdrawal Lock:</span>
            <p className="text-gray-600">{formState.auctionParameters?.withdrawalLockPeriod || 1} hours before end</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Withdrawal Penalty:</span>
            <p className="text-gray-600">{((formState.auctionParameters?.withdrawalPenaltyBps || 100) / 100).toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {formState.auctionParameters?.autoSettleEnabled && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Auto-Settlement</span>
          )}
          {formState.auctionParameters?.secureEscrowEnabled && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Secure Escrow</span>
          )}
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Auction Parameter Guidelines</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• <strong>Duration:</strong> 3-7 days is optimal for most assets</li>
          <li>• <strong>Bid Expiration:</strong> 24 hours balances flexibility with commitment</li>
          <li>• <strong>Withdrawal Lock:</strong> Prevents last-minute bid withdrawals</li>
          <li>• <strong>Penalty:</strong> 1-2% discourages casual bidding without being punitive</li>
          <li>• <strong>Auto-Settlement:</strong> Recommended for most auctions to reduce friction</li>
        </ul>
      </div>
    </div>
  );
}
