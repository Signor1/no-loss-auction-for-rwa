import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { GasOptimizer, GasStrategy } from '../gasOptimizer'
import logger from '../../utils/logger'

// Mock Logger
vi.mock('../../utils/logger', () => ({
  default: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

describe('GasOptimizer', () => {
  let gasOptimizer: GasOptimizer
  let mockLogger: any

  beforeEach(() => {
    mockLogger = new (logger as any)()
    gasOptimizer = new GasOptimizer(mockLogger)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(gasOptimizer).toBeDefined()
    })

    it('should start and stop successfully', async () => {
      await gasOptimizer.start()
      expect(mockLogger.info).toHaveBeenCalledWith('Starting gas optimization...')

      await gasOptimizer.stop()
      expect(mockLogger.info).toHaveBeenCalledWith('Stopping gas optimization...')
    })
  })

  describe('Gas Price Optimization', () => {
    beforeEach(async () => {
      await gasOptimizer.start()
    })

    afterEach(async () => {
      await gasOptimizer.stop()
    })

    it('should optimize gas price with FAST strategy', async () => {
      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.FAST)

      expect(result).toBeDefined()
      expect(result.strategy).toBe(GasStrategy.FAST)
      expect(typeof result.gasPrice).toBe('string')
      expect(typeof result.maxFeePerGas).toBe('string')
      expect(result.recommendations).toContain('Fast strategy prioritizes speed over cost')
    })

    it('should optimize gas price with STANDARD strategy', async () => {
      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.STANDARD)

      expect(result).toBeDefined()
      expect(result.strategy).toBe(GasStrategy.STANDARD)
      expect(typeof result.gasPrice).toBe('string')
      expect(result.recommendations).toContain('Standard strategy provides balanced approach')
    })

    it('should optimize gas price with ECONOMICAL strategy', async () => {
      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.ECONOMICAL)

      expect(result).toBeDefined()
      expect(result.strategy).toBe(GasStrategy.ECONOMICAL)
      expect(typeof result.gasPrice).toBe('string')
      expect(result.recommendations).toContain('Economical strategy balances cost and speed')
    })

    it('should optimize gas price with SLOW strategy', async () => {
      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.SLOW)

      expect(result).toBeDefined()
      expect(result.strategy).toBe(GasStrategy.SLOW)
      expect(typeof result.gasPrice).toBe('string')
      expect(result.recommendations).toContain('Slow strategy prioritizes cost over speed')
    })

    it('should handle high urgency transactions', async () => {
      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.STANDARD, 'high')

      expect(result).toBeDefined()
      expect(result.recommendations).toContain('High urgency applied - increased gas price')
    })

    it('should handle low urgency transactions', async () => {
      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.STANDARD, 'low')

      expect(result).toBeDefined()
      expect(result.recommendations).toContain('Low urgency applied - reduced gas price')
    })

    it('should handle high congestion network', async () => {
      // Mock high congestion by manipulating internal state
      const optimizer = gasOptimizer as any
      optimizer.gasPriceHistory.set(1, [
        { gasPrice: '50000000000', timestamp: new Date() },
        { gasPrice: '60000000000', timestamp: new Date() },
        { gasPrice: '70000000000', timestamp: new Date() }
      ])

      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.STANDARD, 'medium')

      expect(result).toBeDefined()
      expect(result.recommendations).toContain('High congestion detected - increased gas price')
    })

    it('should handle low congestion network', async () => {
      const optimizer = gasOptimizer as any
      optimizer.gasPriceHistory.set(1, [
        { gasPrice: '1000000000', timestamp: new Date() },
        { gasPrice: '2000000000', timestamp: new Date() },
        { gasPrice: '1500000000', timestamp: new Date() }
      ])

      const result = await gasOptimizer.getOptimalGasPrice(1, GasStrategy.STANDARD, 'medium')

      expect(result).toBeDefined()
      expect(result.recommendations).toContain('Low congestion detected - reduced gas price')
    })
  })

  describe('Gas Price Recommendations', () => {
    beforeEach(async () => {
      await gasOptimizer.start()
    })

    afterEach(async () => {
      await gasOptimizer.stop()
    })

    it('should provide recommendations for high gas prices', async () => {
      const optimizer = gasOptimizer as any
      optimizer.gasPriceHistory.set(1, [
        { gasPrice: '100000000000', timestamp: new Date() } // Very high gas price
      ])

      const recommendations = gasOptimizer.getGasPriceRecommendations(1)

      expect(recommendations).toContain('Gas price is high - consider waiting for lower prices')
    })

    it('should provide recommendations for low gas prices', async () => {
      const optimizer = gasOptimizer as any
      optimizer.gasPriceHistory.set(1, [
        { gasPrice: '1000000000', timestamp: new Date() } // Low gas price
      ])

      const recommendations = gasOptimizer.getGasPriceRecommendations(1)

      expect(recommendations).toContain('Gas price is low - good time to transact')
    })

    it('should provide recommendations for high congestion', async () => {
      const optimizer = gasOptimizer as any
      optimizer.networkCongestion.set(1, 'high')

      const recommendations = gasOptimizer.getGasPriceRecommendations(1)

      expect(recommendations).toContain('Network is congested - consider increasing gas price or delaying transaction')
    })

    it('should provide recommendations for clear network', async () => {
      const optimizer = gasOptimizer as any
      optimizer.networkCongestion.set(1, 'low')

      const recommendations = gasOptimizer.getGasPriceRecommendations(1)

      expect(recommendations).toContain('Network is clear - current gas prices are optimal')
    })
  })

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      await gasOptimizer.start()
    })

    afterEach(async () => {
      await gasOptimizer.stop()
    })

    it('should provide optimization statistics', () => {
      const stats = gasOptimizer.getOptimizationStatistics()

      expect(stats).toBeDefined()
      expect(typeof stats.totalChains).toBe('number')
      expect(typeof stats.averageGasPrice).toBe('string')
      expect(typeof stats.totalOptimizations).toBe('number')
      expect(typeof stats.averageSavings).toBe('string')
      expect(typeof stats.lastOptimization).toBe('object')
      expect(stats.networkCongestion).toBeDefined()
    })

    it('should provide health status', () => {
      const health = gasOptimizer.getHealthStatus()

      expect(health).toBeDefined()
      expect(typeof health.isOptimizing).toBe('boolean')
      expect(typeof health.uptime).toBe('number')
      expect(typeof health.totalChains).toBe('number')
      expect(typeof health.lastUpdate).toBe('object')
      expect(health.metrics).toBeDefined()
    })

    it('should export optimization data', () => {
      const data = gasOptimizer.exportOptimizationData('json')

      expect(data).toBeDefined()
      expect(typeof data).toBe('string')

      const parsed = JSON.parse(data)
      expect(parsed).toBeDefined()
      expect(parsed.timestamp).toBeDefined()
      expect(parsed.statistics).toBeDefined()
    })

    it('should export optimization data as CSV', () => {
      const data = gasOptimizer.exportOptimizationData('csv')

      expect(data).toBeDefined()
      expect(typeof data).toBe('string')
      expect(data.includes('timestamp')).toBe(true)
      expect(data.includes('chainId')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors during optimization', async () => {
      // Mock an error in the internal getCurrentGasPrices method
      const optimizer = gasOptimizer as any
      const originalMethod = optimizer.getCurrentGasPrices
      optimizer.getCurrentGasPrices = vi.fn().mockRejectedValue(new Error('RPC Error'))

      await expect(gasOptimizer.getOptimalGasPrice(1)).rejects.toThrow('RPC Error')

      // Restore original method
      optimizer.getCurrentGasPrices = originalMethod
    })

    it('should handle empty gas price history', () => {
      const recommendations = gasOptimizer.getGasPriceRecommendations(999) // Non-existent chain

      expect(recommendations).toContain('No historical data available')
    })
  })

  describe('Event Emission', () => {
    it('should emit gas optimized event', async () => {
      const mockEmit = vi.fn()
      gasOptimizer.emit = mockEmit

      await gasOptimizer.start()
      await gasOptimizer.getOptimalGasPrice(1, GasStrategy.FAST)
      await gasOptimizer.stop()

      expect(mockEmit).toHaveBeenCalledWith('gas:optimized', expect.any(Object))
    })

    it('should emit optimizer started event', async () => {
      const mockEmit = vi.fn()
      gasOptimizer.emit = mockEmit

      await gasOptimizer.start()

      expect(mockEmit).toHaveBeenCalledWith('optimizer:started')
    })

    it('should emit optimizer stopped event', async () => {
      const mockEmit = vi.fn()
      gasOptimizer.emit = mockEmit

      await gasOptimizer.start()
      await gasOptimizer.stop()

      expect(mockEmit).toHaveBeenCalledWith('optimizer:stopped')
    })
  })
})
