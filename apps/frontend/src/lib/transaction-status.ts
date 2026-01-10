import { useState, useEffect } from 'react'

export interface TransactionStatusUpdate {
  id: string
  transactionId: string
  status: 'pending' | 'confirmed' | 'failed' | 'replaced' | 'speedup'
  confirmations?: number
  blockNumber?: number
  gasUsed?: string
  effectiveGasPrice?: string
  timestamp: Date
  message?: string
}

export interface PendingTransaction {
  id: string
  hash: string
  type: 'bid' | 'claim' | 'transfer' | 'deposit' | 'withdrawal' | 'approval' | 'swap'
  amount: number
  currency: string
  fromAddress: string
  toAddress?: string
  gasPrice: string
  gasLimit: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce: number
  submittedAt: Date
  confirmations: number
  requiredConfirmations: number
  estimatedConfirmationTime?: Date
  isSpeedupPossible: boolean
  isCancellationPossible: boolean
  priority: 'low' | 'medium' | 'high'
  description: string
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base'
}

export interface TransactionConfirmation {
  transactionId: string
  currentConfirmations: number
  requiredConfirmations: number
  confirmationBlocks: Array<{
    blockNumber: number
    blockHash: string
    timestamp: Date
    confirmations: number
  }>
  estimatedTimeRemaining?: number
  confirmationRate: number
}

export interface FailedTransaction {
  id: string
  hash?: string
  type: 'bid' | 'claim' | 'transfer' | 'deposit' | 'withdrawal' | 'approval' | 'swap'
  amount: number
  currency: string
  fromAddress: string
  toAddress?: string
  error: {
    code: string
    message: string
    reason: 'insufficient_gas' | 'nonce_too_low' | 'nonce_too_high' | 'reverted' | 'network_error' | 'timeout' | 'unknown'
    details?: any
  }
  gasPrice: string
  gasLimit: string
  nonce: number
  submittedAt: Date
  failedAt: Date
  retryCount: number
  maxRetries: number
  isRetryable: boolean
  suggestedGasPrice?: string
  suggestedGasLimit?: string
  description: string
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base'
}

export interface GasOptimization {
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base'
  currentGasPrice: string
  suggestedGasPrice: string
  priorityFee: string
  maxFeePerGas: string
  estimatedTime: number
  confidence: number
  savings: {
    percentage: number
    amount: number
    currency: string
  }
  recommendations: Array<{
    type: 'speedup' | 'cancel' | 'replace' | 'wait'
    description: string
    impact: string
    estimatedTime: number
  }>
}

export interface TransactionQueue {
  pending: PendingTransaction[]
  failed: FailedTransaction[]
  processing: string[]
  completed: string[]
}

export interface TransactionStatusStats {
  totalPending: number
  totalFailed: number
  totalProcessing: number
  averageConfirmationTime: number
  successRate: number
  totalGasUsed: string
  totalGasCost: string
  gasOptimizationSavings: string
}

export interface NetworkStatus {
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base'
  blockNumber: number
  gasPrice: string
  baseFee: string
  priorityFee: string
  networkCongestion: 'low' | 'medium' | 'high'
  averageBlockTime: number
  isHealthy: boolean
}

export interface TransactionStatusFilters {
  network: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'all'
  type: 'bid' | 'claim' | 'transfer' | 'deposit' | 'withdrawal' | 'approval' | 'swap' | 'all'
  priority: 'low' | 'medium' | 'high' | 'all'
  status: 'pending' | 'failed' | 'processing' | 'all'
  dateRange: {
    start: string
    end: string
  }
  amountRange: {
    min: string
    max: string
  }
}

export interface RealTimeUpdate {
  id: string
  type: 'status_update' | 'confirmation' | 'gas_change' | 'network_status'
  data: any
  timestamp: Date
  severity: 'info' | 'warning' | 'error' | 'success'
}

// Mock data
export const mockPendingTransactions: PendingTransaction[] = [
  {
    id: 'pending-1',
    hash: '0x1234567890abcdef1234567890abcdef12345678',
    type: 'bid',
    amount: 1000,
    currency: 'USDC',
    fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    gasPrice: '20000000000',
    gasLimit: '21000',
    maxFeePerGas: '25000000000',
    maxPriorityFeePerGas: '2000000000',
    nonce: 123,
    submittedAt: new Date(Date.now() - 5 * 60 * 1000),
    confirmations: 2,
    requiredConfirmations: 12,
    estimatedConfirmationTime: new Date(Date.now() + 3 * 60 * 1000),
    isSpeedupPossible: true,
    isCancellationPossible: true,
    priority: 'medium',
    description: 'Bid placed on RWA Auction #42',
    network: 'ethereum'
  },
  {
    id: 'pending-2',
    hash: '0x2345678901bcdef12345678901bcdef123456789',
    type: 'transfer',
    amount: 0.5,
    currency: 'ETH',
    fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    toAddress: '0x9876543210fedcba9876543210fedcba98765432',
    gasPrice: '25000000000',
    gasLimit: '21000',
    nonce: 124,
    submittedAt: new Date(Date.now() - 2 * 60 * 1000),
    confirmations: 5,
    requiredConfirmations: 12,
    estimatedConfirmationTime: new Date(Date.now() + 1 * 60 * 1000),
    isSpeedupPossible: true,
    isCancellationPossible: false,
    priority: 'high',
    description: 'Transfer to wallet',
    network: 'ethereum'
  },
  {
    id: 'pending-3',
    hash: '0x3456789012cdefa123456789012cdefa12345678',
    type: 'claim',
    amount: 500,
    currency: 'USDT',
    fromAddress: '0x1234567890abcdef1234567890abcdef12345678',
    toAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    gasPrice: '18000000000',
    gasLimit: '100000',
    nonce: 125,
    submittedAt: new Date(Date.now() - 10 * 60 * 1000),
    confirmations: 8,
    requiredConfirmations: 12,
    estimatedConfirmationTime: new Date(Date.now() + 30 * 1000),
    isSpeedupPossible: true,
    isCancellationPossible: true,
    priority: 'low',
    description: 'Claim auction rewards',
    network: 'polygon'
  }
]

export const mockFailedTransactions: FailedTransaction[] = [
  {
    id: 'failed-1',
    hash: '0x4567890123defab1234567890123defab12345678',
    type: 'bid',
    amount: 1500,
    currency: 'USDC',
    fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    error: {
      code: 'INSUFFICIENT_GAS',
      message: 'Transaction ran out of gas',
      reason: 'insufficient_gas',
      details: { gasUsed: '20999', gasLimit: '21000' }
    },
    gasPrice: '15000000000',
    gasLimit: '21000',
    nonce: 120,
    submittedAt: new Date(Date.now() - 30 * 60 * 1000),
    failedAt: new Date(Date.now() - 25 * 60 * 1000),
    retryCount: 0,
    maxRetries: 3,
    isRetryable: true,
    suggestedGasPrice: '20000000000',
    suggestedGasLimit: '25000',
    description: 'Bid placed on RWA Auction #41',
    network: 'ethereum'
  },
  {
    id: 'failed-2',
    type: 'transfer',
    amount: 1.0,
    currency: 'ETH',
    fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    toAddress: '0x9876543210fedcba9876543210fedcba98765432',
    error: {
      code: 'NONCE_TOO_LOW',
      message: 'Transaction nonce is too low',
      reason: 'nonce_too_low',
      details: { expectedNonce: 122, actualNonce: 121 }
    },
    gasPrice: '20000000000',
    gasLimit: '21000',
    nonce: 121,
    submittedAt: new Date(Date.now() - 45 * 60 * 1000),
    failedAt: new Date(Date.now() - 40 * 60 * 1000),
    retryCount: 1,
    maxRetries: 3,
    isRetryable: true,
    suggestedGasPrice: '22000000000',
    suggestedGasLimit: '21000',
    description: 'Transfer to exchange',
    network: 'ethereum'
  }
]

export const mockGasOptimizations: GasOptimization[] = [
  {
    network: 'ethereum',
    currentGasPrice: '25000000000',
    suggestedGasPrice: '20000000000',
    priorityFee: '2000000000',
    maxFeePerGas: '25000000000',
    estimatedTime: 120,
    confidence: 85,
    savings: {
      percentage: 20,
      amount: 0.0012,
      currency: 'ETH'
    },
    recommendations: [
      {
        type: 'wait',
        description: 'Wait for lower gas prices',
        impact: 'Save 20% on gas fees',
        estimatedTime: 300
      },
      {
        type: 'speedup',
        description: 'Increase gas price for faster confirmation',
        impact: 'Confirm 2x faster',
        estimatedTime: 60
      }
    ]
  },
  {
    network: 'polygon',
    currentGasPrice: '30000000000',
    suggestedGasPrice: '25000000000',
    priorityFee: '3000000000',
    maxFeePerGas: '35000000000',
    estimatedTime: 30,
    confidence: 90,
    savings: {
      percentage: 16.7,
      amount: 0.0005,
      currency: 'MATIC'
    },
    recommendations: [
      {
        type: 'speedup',
        description: 'Slightly increase gas price',
        impact: 'Confirm 50% faster',
        estimatedTime: 15
      }
    ]
  }
]

export const mockNetworkStatus: NetworkStatus[] = [
  {
    network: 'ethereum',
    blockNumber: 18500000,
    gasPrice: '25000000000',
    baseFee: '20000000000',
    priorityFee: '2000000000',
    networkCongestion: 'medium',
    averageBlockTime: 12,
    isHealthy: true
  },
  {
    network: 'polygon',
    blockNumber: 45000000,
    gasPrice: '30000000000',
    baseFee: '25000000000',
    priorityFee: '3000000000',
    networkCongestion: 'low',
    averageBlockTime: 2,
    isHealthy: true
  },
  {
    network: 'arbitrum',
    blockNumber: 150000000,
    gasPrice: '10000000000',
    baseFee: '8000000000',
    priorityFee: '1000000000',
    networkCongestion: 'low',
    averageBlockTime: 0.25,
    isHealthy: true
  }
]

export const mockTransactionStatusStats: TransactionStatusStats = {
  totalPending: 3,
  totalFailed: 2,
  totalProcessing: 1,
  averageConfirmationTime: 180,
  successRate: 85.5,
  totalGasUsed: '150000',
  totalGasCost: '0.00375',
  gasOptimizationSavings: '0.0017'
}

// Hook for transaction status management
export function useTransactionStatus() {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>(mockPendingTransactions)
  const [failedTransactions, setFailedTransactions] = useState<FailedTransaction[]>(mockFailedTransactions)
  const [gasOptimizations, setGasOptimizations] = useState<GasOptimization[]>(mockGasOptimizations)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus[]>(mockNetworkStatus)
  const [stats, setStats] = useState<TransactionStatusStats>(mockTransactionStatusStats)
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TransactionStatusFilters>({
    network: 'all',
    type: 'all',
    priority: 'all',
    status: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    amountRange: {
      min: '',
      max: ''
    }
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update confirmations for pending transactions
      setPendingTransactions(prev => prev.map(tx => {
        if (tx.confirmations < tx.requiredConfirmations) {
          const newConfirmations = Math.min(tx.confirmations + 1, tx.requiredConfirmations)
          return {
            ...tx,
            confirmations: newConfirmations,
            estimatedConfirmationTime: newConfirmations === tx.requiredConfirmations 
              ? new Date() 
              : new Date(Date.now() + (tx.requiredConfirmations - newConfirmations) * 12 * 1000)
          }
        }
        return tx
      }))

      // Add random real-time updates
      const updateTypes = ['status_update', 'confirmation', 'gas_change'] as const
      const randomType = updateTypes[Math.floor(Math.random() * updateTypes.length)]
      
      const newUpdate: RealTimeUpdate = {
        id: `update-${Date.now()}`,
        type: randomType,
        data: {
          message: `Random ${randomType} occurred`
        },
        timestamp: new Date(),
        severity: Math.random() > 0.7 ? 'warning' : 'info'
      }

      setRealTimeUpdates(prev => [newUpdate, ...prev.slice(0, 9)])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Speed up transaction
  const speedupTransaction = async (transactionId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPendingTransactions(prev => prev.map(tx => 
        tx.id === transactionId 
          ? { 
              ...tx, 
              gasPrice: (parseInt(tx.gasPrice) * 1.2).toString(),
              maxFeePerGas: tx.maxFeePerGas ? (parseInt(tx.maxFeePerGas) * 1.2).toString() : undefined,
              priority: 'high' as const
            }
          : tx
      ))

      const update: RealTimeUpdate = {
        id: `speedup-${Date.now()}`,
        type: 'status_update',
        data: {
          transactionId,
          message: 'Transaction speedup initiated'
        },
        timestamp: new Date(),
        severity: 'success'
      }
      setRealTimeUpdates(prev => [update, ...prev])
    } catch (err) {
      setError('Failed to speed up transaction')
    } finally {
      setIsLoading(false)
    }
  }

  // Cancel transaction
  const cancelTransaction = async (transactionId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPendingTransactions(prev => prev.filter(tx => tx.id !== transactionId))

      const update: RealTimeUpdate = {
        id: `cancel-${Date.now()}`,
        type: 'status_update',
        data: {
          transactionId,
          message: 'Transaction cancelled'
        },
        timestamp: new Date(),
        severity: 'warning'
      }
      setRealTimeUpdates(prev => [update, ...prev])
    } catch (err) {
      setError('Failed to cancel transaction')
    } finally {
      setIsLoading(false)
    }
  }

  // Retry failed transaction
  const retryTransaction = async (transactionId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const failedTx = failedTransactions.find(tx => tx.id === transactionId)
      if (failedTx) {
        const newPending: PendingTransaction = {
          id: `pending-${Date.now()}`,
          hash: `0x${Math.random().toString(16).substr(2, 40)}`,
          type: failedTx.type,
          amount: failedTx.amount,
          currency: failedTx.currency,
          fromAddress: failedTx.fromAddress,
          toAddress: failedTx.toAddress,
          gasPrice: failedTx.suggestedGasPrice || failedTx.gasPrice,
          gasLimit: failedTx.suggestedGasLimit || failedTx.gasLimit,
          nonce: failedTx.nonce + 1,
          submittedAt: new Date(),
          confirmations: 0,
          requiredConfirmations: 12,
          estimatedConfirmationTime: new Date(Date.now() + 2 * 60 * 1000),
          isSpeedupPossible: true,
          isCancellationPossible: true,
          priority: 'medium',
          description: failedTx.description,
          network: failedTx.network
        }

        setPendingTransactions(prev => [...prev, newPending])
        setFailedTransactions(prev => prev.filter(tx => tx.id !== transactionId))

        const update: RealTimeUpdate = {
          id: `retry-${Date.now()}`,
          type: 'status_update',
          data: {
            transactionId,
            message: 'Transaction retry initiated'
          },
          timestamp: new Date(),
          severity: 'success'
        }
        setRealTimeUpdates(prev => [update, ...prev])
      }
    } catch (err) {
      setError('Failed to retry transaction')
    } finally {
      setIsLoading(false)
    }
  }

  // Apply gas optimization
  const applyGasOptimization = async (network: string, optimization: GasOptimization) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setGasOptimizations(prev => prev.map(opt => 
        opt.network === network ? optimization : opt
      ))

      const update: RealTimeUpdate = {
        id: `gas-opt-${Date.now()}`,
        type: 'gas_change',
        data: {
          network,
          message: `Gas optimization applied for ${network}`
        },
        timestamp: new Date(),
        severity: 'success'
      }
      setRealTimeUpdates(prev => [update, ...prev])
    } catch (err) {
      setError('Failed to apply gas optimization')
    } finally {
      setIsLoading(false)
    }
  }

  // Update filters
  const updateFilters = (newFilters: Partial<TransactionStatusFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      network: 'all',
      type: 'all',
      priority: 'all',
      status: 'all',
      dateRange: {
        start: '',
        end: ''
      },
      amountRange: {
        min: '',
        max: ''
      }
    })
  }

  // Clear real-time updates
  const clearUpdates = () => {
    setRealTimeUpdates([])
  }

  return {
    pendingTransactions,
    failedTransactions,
    gasOptimizations,
    networkStatus,
    stats,
    realTimeUpdates,
    isLoading,
    error,
    filters,
    speedupTransaction,
    cancelTransaction,
    retryTransaction,
    applyGasOptimization,
    updateFilters,
    resetFilters,
    clearUpdates
  }
}
