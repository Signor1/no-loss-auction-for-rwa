'use client';

import { useState, useEffect } from 'react';
import { useBaseNetwork } from '@/lib/base-network';
import { formatEther, formatUnits } from 'viem';

interface GasEstimatorProps {
  to?: string;
  data?: string;
  value?: string;
  onGasEstimate?: (estimate: any) => void;
}

export function GasEstimator({ to, data, value, onGasEstimate }: GasEstimatorProps) {
  const { currentNetwork, estimateTransactionGas, feeData } = useBaseNetwork();
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (to && currentNetwork) {
      estimateGas();
    }
  }, [to, data, value, currentNetwork]);

  const estimateGas = async () => {
    if (!to || !currentNetwork) return;

    setIsEstimating(true);
    setError(null);

    try {
      const estimate = await estimateTransactionGas(
        to,
        data,
        value ? BigInt(value) : undefined
      );
      
      setGasEstimate(estimate);
      onGasEstimate?.(estimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gas estimation failed');
    } finally {
      setIsEstimating(false);
    }
  };

  const formatGasPrice = (gasPrice: bigint): string => {
    return formatUnits(gasPrice, 'gwei');
  };

  const getGasLevel = (gasPrice: bigint): 'low' | 'medium' | 'high' => {
    const gwei = parseFloat(formatUnits(gasPrice, 'gwei'));
    if (gwei < 0.5) return 'low';
    if (gwei < 2) return 'medium';
    return 'high';
  };

  const getGasColor = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
    }
  };

  if (!currentNetwork) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Please connect to Base network to see gas estimates
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Gas Estimation</h3>
      
      {isEstimating && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Estimating gas...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={estimateGas}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry estimation
          </button>
        </div>
      )}

      {gasEstimate && !isEstimating && !error && (
        <div className="space-y-4">
          {/* Gas Price Level */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Gas Price</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">
                {formatGasPrice(gasEstimate.gasPrice)} Gwei
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getGasColor(getGasLevel(gasEstimate.gasPrice))}`}>
                {getGasLevel(gasEstimate.gasPrice).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Gas Limit */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Gas Limit</span>
            <span className="text-sm font-mono">
              {gasEstimate.gasLimit.toString()}
            </span>
          </div>

          {/* Estimated Cost */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estimated Cost</span>
            <div className="text-right">
              <div className="text-sm font-mono font-semibold">
                {gasEstimate.estimatedCost} ETH
              </div>
              {gasEstimate.estimatedCostUSD && (
                <div className="text-xs text-gray-500">
                  ≈ ${gasEstimate.estimatedCostUSD}
                </div>
              )}
            </div>
          </div>

          {/* EIP-1559 Fees (if available) */}
          {gasEstimate.maxFeePerGas && gasEstimate.maxPriorityFeePerGas && (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-900">EIP-1559 Fees</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Max Fee</span>
                <span className="text-sm font-mono">
                  {formatGasPrice(gasEstimate.maxFeePerGas)} Gwei
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priority Fee</span>
                <span className="text-sm font-mono">
                  {formatGasPrice(gasEstimate.maxPriorityFeePerGas)} Gwei
                </span>
              </div>
            </div>
          )}

          {/* Base Network Benefits */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Base Network Benefits
            </h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• {currentNetwork.gasOptimization}</li>
              <li>• ~2 second block time</li>
              <li>• Optimistic rollup technology</li>
              <li>• Ethereum L2 security</li>
            </ul>
          </div>

          {/* Refresh Button */}
          <button
            onClick={estimateGas}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh Estimate
          </button>
        </div>
      )}
    </div>
  );
}

export function GasPriceTracker() {
  const { currentNetwork, feeData, gasPrice } = useBaseNetwork();
  const [gasHistory, setGasHistory] = useState<Array<{
    timestamp: number;
    price: string;
    level: 'low' | 'medium' | 'high';
  }>>([]);

  useEffect(() => {
    if (gasPrice && currentNetwork) {
      const price = parseFloat(formatUnits(gasPrice, 'gwei'));
      let level: 'low' | 'medium' | 'high';
      
      if (price < 0.5) level = 'low';
      else if (price < 2) level = 'medium';
      else level = 'high';

      setGasHistory(prev => [
        ...prev.slice(-23), // Keep last 24 records
        {
          timestamp: Date.now(),
          price: price.toFixed(3),
          level,
        },
      ]);
    }
  }, [gasPrice, currentNetwork]);

  const getAverageGas = (): string => {
    if (gasHistory.length === 0) return '0.000';
    const sum = gasHistory.reduce((acc, record) => acc + parseFloat(record.price), 0);
    return (sum / gasHistory.length).toFixed(3);
  };

  const getGasTrend = (): 'up' | 'down' | 'stable' => {
    if (gasHistory.length < 2) return 'stable';
    
    const recent = gasHistory.slice(-5);
    const older = gasHistory.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((acc, r) => acc + parseFloat(r.price), 0) / recent.length;
    const olderAvg = older.reduce((acc, o) => acc + parseFloat(o.price), 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  };

  const trend = getGasTrend();
  const averageGas = getAverageGas();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Gas Price Tracker</h3>
      
      {currentNetwork ? (
        <div className="space-y-4">
          {/* Current Gas Price */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {gasPrice ? parseFloat(formatUnits(gasPrice, 'gwei')).toFixed(3) : '0.000'} Gwei
            </div>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <span className="text-sm text-gray-600">Average (24h): {averageGas} Gwei</span>
              {trend !== 'stable' && (
                <div className={`flex items-center space-x-1 ${
                  trend === 'up' ? 'text-red-600' : 'text-green-600'
                }`}>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    {trend === 'up' ? (
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span className="text-sm font-medium">{trend === 'up' ? 'Rising' : 'Falling'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Network</span>
              <span className="text-sm font-medium">{currentNetwork.name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Block Time</span>
              <span className="text-sm">~{currentNetwork.blockTime}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Gas Optimization</span>
              <span className="text-sm text-green-600">{currentNetwork.gasOptimization}</span>
            </div>
          </div>

          {/* Gas Level Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Gas Level</span>
              <span className="text-gray-600">Current</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  parseFloat(formatUnits(gasPrice || BigInt('1000000000'), 'gwei')) < 0.5 
                    ? 'bg-green-500' 
                    : parseFloat(formatUnits(gasPrice || BigInt('1000000000'), 'gwei')) < 2 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (parseFloat(formatUnits(gasPrice || BigInt('1000000000'), 'gwei')) / 10) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low (0.5 Gwei)</span>
              <span>Medium (2 Gwei)</span>
              <span>High (5+ Gwei)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          <p>Connect to Base network to see gas information</p>
        </div>
      )}
    </div>
  );
}
