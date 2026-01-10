'use client';

import { useState, useEffect, useMemo } from 'react';
import { AutoBidConfig } from '@/lib/bidding-system';

interface AutoBidManagerProps {
  auctionId: string;
  currentBid: string;
  minBid: string;
  onEnableAutoBid: (config: AutoBidConfig) => void;
  onDisableAutoBid: () => void;
  currentConfig: AutoBidConfig;
}

export function AutoBidManager({
  auctionId,
  currentBid,
  minBid,
  onEnableAutoBid,
  onDisableAutoBid,
  currentConfig,
}: AutoBidManagerProps) {
  const [config, setConfig] = useState<AutoBidConfig>({
    enabled: false,
    maxAmount: '0',
    increment: '0.1',
    maxGas: '0.01',
    active: false,
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bidHistory, setBidHistory] = useState<Array<{
    timestamp: number;
    amount: string;
    triggered: boolean;
  }>>([]);

  // Initialize config from props
  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  // Calculate recommended max bid
  const recommendedMaxBid = useMemo(() => {
    const current = parseFloat(currentBid);
    const min = parseFloat(minBid);
    return Math.max(current * 1.5, min * 2).toFixed(4);
  }, [currentBid, minBid]);

  // Calculate estimated bids remaining
  const estimatedBidsRemaining = useMemo(() => {
    if (!config.enabled || parseFloat(config.maxAmount) <= parseFloat(currentBid)) {
      return 0;
    }
    const increment = parseFloat(config.increment);
    const remaining = parseFloat(config.maxAmount) - parseFloat(currentBid);
    return Math.floor(remaining / increment);
  }, [config, currentBid, config.maxAmount, config.increment]);

  // Simulate auto-bid activation
  const handleToggleAutoBid = () => {
    if (config.active) {
      onDisableAutoBid();
    } else {
      if (!config.maxAmount || parseFloat(config.maxAmount) <= parseFloat(minBid)) {
        alert('Please set a valid maximum bid amount');
        return;
      }
      
      const newConfig = {
        ...config,
        enabled: true,
        active: true,
      };
      
      setConfig(newConfig);
      onEnableAutoBid(newConfig);
      
      // Simulate auto-bid activation
      simulateAutoBidActivation();
    }
  };

  const simulateAutoBidActivation = () => {
    // Simulate bid history
    const mockHistory = [
      { timestamp: Date.now() - 3600000, amount: '2.1', triggered: true },
      { timestamp: Date.now() - 1800000, amount: '2.3', triggered: true },
      { timestamp: Date.now() - 900000, amount: '2.5', triggered: false },
    ];
    setBidHistory(mockHistory);
  };

  const handleConfigChange = (field: keyof AutoBidConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const validateConfig = () => {
    const maxAmount = parseFloat(config.maxAmount);
    const min = parseFloat(minBid);
    const increment = parseFloat(config.increment);
    
    if (maxAmount <= min) {
      return 'Maximum bid must be higher than minimum bid';
    }
    
    if (increment <= 0) {
      return 'Bid increment must be greater than 0';
    }
    
    if (maxAmount - min < increment) {
      return 'Maximum bid must allow for at least one increment';
    }
    
    return null;
  };

  const getAutoBidStatus = () => {
    if (!config.enabled) return 'disabled';
    if (!config.active) return 'paused';
    if (parseFloat(config.maxAmount) <= parseFloat(currentBid)) return 'completed';
    return 'active';
  };

  const getStatusColor = () => {
    const status = getAutoBidStatus();
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    const status = getAutoBidStatus();
    switch (status) {
      case 'active': return '🤖';
      case 'paused': return '⏸️';
      case 'completed': return '✅';
      default: return '❌';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Auto-Bid Manager</h3>
        
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            <span className="mr-1">{getStatusIcon()}</span>
            {getAutoBidStatus().charAt(0).toUpperCase() + getAutoBidStatus().slice(1)}
          </div>
          
          <button
            onClick={handleToggleAutoBid}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              config.active ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              config.active ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Auto-Bid Status */}
      {config.enabled && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Max Bid Amount:</span>
              <div className="font-semibold text-gray-900">{config.maxAmount} ETH</div>
            </div>
            <div>
              <span className="text-gray-600">Bid Increment:</span>
              <div className="font-semibold text-gray-900">{config.increment} ETH</div>
            </div>
            <div>
              <span className="text-gray-600">Est. Bids Remaining:</span>
              <div className="font-semibold text-gray-900">{estimatedBidsRemaining}</div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Bid Amount (ETH)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.0001"
              min={minBid}
              value={config.maxAmount}
              onChange={(e) => handleConfigChange('maxAmount', e.target.value)}
              disabled={config.active}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              onClick={() => handleConfigChange('maxAmount', recommendedMaxBid)}
              disabled={config.active}
              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 rounded-lg text-sm font-medium text-blue-700 disabled:text-gray-500"
            >
              Recommended
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Recommended: {recommendedMaxBid} ETH
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bid Increment (ETH)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              value={config.increment}
              onChange={(e) => handleConfigChange('increment', e.target.value)}
              disabled={config.active}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <div className="flex space-x-1">
              <button
                onClick={() => handleConfigChange('increment', '0.05')}
                disabled={config.active}
                className="px-2 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded text-xs font-medium"
              >
                0.05
              </button>
              <button
                onClick={() => handleConfigChange('increment', '0.1')}
                disabled={config.active}
                className="px-2 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded text-xs font-medium"
              >
                0.1
              </button>
              <button
                onClick={() => handleConfigChange('increment', '0.25')}
                disabled={config.active}
                className="px-2 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded text-xs font-medium"
              >
                0.25
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Gas Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={config.maxGas}
                  onChange={(e) => handleConfigChange('maxGas', e.target.value)}
                  disabled={config.active}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-yellow-900 mb-2">Auto-Bid Strategy</h5>
                <p className="text-xs text-yellow-800">
                  The system will automatically place bids when you are outbid, 
                  up to your maximum amount. Bids are placed using your configured 
                  increment and will not exceed your maximum gas price setting.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Validation Error */}
        {validateConfig() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{validateConfig()}</p>
          </div>
        )}

        {/* Bid History */}
        {bidHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Auto-Bid Activity</h4>
            <div className="space-y-2">
              {bidHistory.map((bid, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                  <div className="flex items-center space-x-2">
                    <span className={bid.triggered ? 'text-green-600' : 'text-gray-400'}>
                      {bid.triggered ? '✓' : '○'}
                    </span>
                    <span className="font-medium">{bid.amount} ETH</span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(bid.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          {config.active ? (
            <button
              onClick={handleToggleAutoBid}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Disable Auto-Bid
            </button>
          ) : (
            <button
              onClick={handleToggleAutoBid}
              disabled={!validateConfig() === null}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
            >
              Enable Auto-Bid
            </button>
          )}
          
          <button
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
