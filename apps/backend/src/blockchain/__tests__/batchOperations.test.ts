import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { BatchOperations, BatchType } from '../batchOperations'
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

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    utils: {
      formatEther: vi.fn((wei) => wei.toString()),
      isAddress: vi.fn((address) => address.startsWith('0x') && address.length === 42)
    }
  }
}))

describe('BatchOperations', () => {
  let batchOperations: BatchOperations
  let mockLogger: any

  beforeEach(() => {
    mockLogger = new (logger as any)()
    batchOperations = new BatchOperations(mockLogger)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(batchOperations).toBeDefined()
    })

    it('should start and stop successfully', async () => {
      await batchOperations.start()
      expect(mockLogger.info).toHaveBeenCalledWith('Starting batch operations...')

      await batchOperations.stop()
      expect(mockLogger.info).toHaveBeenCalledWith('Stopping batch operations...')
    })
  })

  describe('Batch Creation', () => {
    beforeEach(async () => {
      await batchOperations.start()
    })

    afterEach(async () => {
      await batchOperations.stop()
    })

    it('should create a batch with transfer operations', async () => {
      const operations = [
        {
          id: 'op1',
          type: BatchType.TRANSFER,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: '1000000000000000000', // 1 ETH
          gasLimit: '21000'
        }
      ]

      const batch = await batchOperations.createBatch(operations)

      expect(batch).toBeDefined()
      expect(batch.id).toBeDefined()
      expect(batch.operations).toHaveLength(1)
      expect(batch.status).toBe('pending')
      expect(batch.totalValue).toBe('1000000000000000000')
    })

    it('should create a batch with contract call operations', async () => {
      const operations = [
        {
          id: 'op1',
          type: BatchType.CONTRACT_CALL,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          data: '0xa9059cbb000000000000000000000000abcdef1234567890abcdef1234567890abcdef120000000000000000000000000000000000000000000000000000000000000001',
          gasLimit: '50000'
        }
      ]

      const batch = await batchOperations.createBatch(operations)

      expect(batch).toBeDefined()
      expect(batch.operations).toHaveLength(1)
      expect(batch.status).toBe('pending')
    })

    it('should validate operations before creating batch', async () => {
      const invalidOperations = [
        {
          id: 'op1',
          type: BatchType.TRANSFER,
          from: 'invalid-address',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: '1000000000000000000'
        }
      ]

      await expect(batchOperations.createBatch(invalidOperations)).rejects.toThrow('Invalid from address')
    })

    it('should reject batches exceeding maximum size', async () => {
      const largeBatch = Array.from({ length: 101 }, (_, i) => ({
        id: `op${i}`,
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }))

      await expect(batchOperations.createBatch(largeBatch)).rejects.toThrow('Maximum 100 operations allowed per batch')
    })

    it('should optimize operations for gas efficiency', async () => {
      const operations = [
        {
          id: 'op1',
          type: BatchType.CONTRACT_CALL,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          data: '0xa9059cbb000000000000000000000000abcdef1234567890abcdef1234567890abcdef120000000000000000000000000000000000000000000000000000000000000001',
          gasLimit: '50000'
        },
        {
          id: 'op2',
          type: BatchType.CONTRACT_CALL,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          data: '0xa9059cbb000000000000000000000000abcdef1234567890abcdef1234567890abcdef120000000000000000000000000000000000000000000000000000000000000002',
          gasLimit: '50000'
        }
      ]

      const batch = await batchOperations.createBatch(operations, { gasOptimization: true })

      expect(batch).toBeDefined()
      expect(batch.gasOptimization.savingsPercentage).toBeDefined()
    })
  })

  describe('Batch Processing', () => {
    beforeEach(async () => {
      await batchOperations.start()
    })

    afterEach(async () => {
      await batchOperations.stop()
    })

    it('should process a pending batch', async () => {
      const operations = [
        {
          id: 'op1',
          type: BatchType.TRANSFER,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: '1000000000000000000',
          gasLimit: '21000'
        }
      ]

      const batch = await batchOperations.createBatch(operations)
      const processedBatch = await batchOperations.processBatch(batch.id)

      expect(processedBatch.status).toBe('completed')
      expect(processedBatch.completedAt).toBeDefined()
      expect(processedBatch.results).toHaveLength(1)
    })

    it('should reject processing non-pending batches', async () => {
      const operations = [
        {
          id: 'op1',
          type: BatchType.TRANSFER,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: '1000000000000000000',
          gasLimit: '21000'
        }
      ]

      const batch = await batchOperations.createBatch(operations)
      await batchOperations.processBatch(batch.id) // Process once

      await expect(batchOperations.processBatch(batch.id)).rejects.toThrow('Batch not in pending status')
    })

    it('should handle processing errors gracefully', async () => {
      // Create batch with operations that will fail
      const operations = [
        {
          id: 'op1',
          type: BatchType.TRANSFER,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: 'invalid-value',
          gasLimit: '21000'
        }
      ]

      const batch = await batchOperations.createBatch(operations)
      const processedBatch = await batchOperations.processBatch(batch.id)

      expect(processedBatch.status).toBe('completed') // Still completed, but with errors
      expect(processedBatch.results[0].success).toBe(false)
      expect(processedBatch.results[0].error).toBeDefined()
    })
  })

  describe('Batch Management', () => {
    beforeEach(async () => {
      await batchOperations.start()
    })

    afterEach(async () => {
      await batchOperations.stop()
    })

    it('should retrieve batch by ID', async () => {
      const operations = [
        {
          id: 'op1',
          type: BatchType.TRANSFER,
          from: '0x1234567890abcdef1234567890abcdef12345678',
          to: '0xabcdef1234567890abcdef1234567890abcdef12',
          value: '1000000000000000000',
          gasLimit: '21000'
        }
      ]

      const createdBatch = await batchOperations.createBatch(operations)
      const retrievedBatch = batchOperations.getBatch(createdBatch.id)

      expect(retrievedBatch).toBeDefined()
      expect(retrievedBatch!.id).toBe(createdBatch.id)
    })

    it('should return null for non-existent batch', () => {
      const batch = batchOperations.getBatch('non-existent-id')
      expect(batch).toBeNull()
    })

    it('should retrieve all batches', async () => {
      const operations1 = [{
        id: 'op1',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }]

      const operations2 = [{
        id: 'op2',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '2000000000000000000',
        gasLimit: '21000'
      }]

      await batchOperations.createBatch(operations1)
      await batchOperations.createBatch(operations2)

      const allBatches = batchOperations.getAllBatches()
      expect(allBatches).toHaveLength(2)
      expect(allBatches[0].createdAt.getTime()).toBeGreaterThanOrEqual(allBatches[1].createdAt.getTime())
    })

    it('should retrieve batches by status', async () => {
      const operations = [{
        id: 'op1',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }]

      const batch = await batchOperations.createBatch(operations)
      await batchOperations.processBatch(batch.id)

      const pendingBatches = batchOperations.getBatchesByStatus('pending')
      const completedBatches = batchOperations.getBatchesByStatus('completed')

      expect(pendingBatches).toHaveLength(0)
      expect(completedBatches).toHaveLength(1)
    })
  })

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      await batchOperations.start()
    })

    afterEach(async () => {
      await batchOperations.stop()
    })

    it('should provide batch statistics', async () => {
      const operations1 = [{
        id: 'op1',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }]

      const operations2 = [{
        id: 'op2',
        type: BatchType.CONTRACT_CALL,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        data: '0x',
        gasLimit: '50000'
      }]

      await batchOperations.createBatch(operations1)
      const batch2 = await batchOperations.createBatch(operations2)
      await batchOperations.processBatch(batch2.id)

      const stats = batchOperations.getBatchStatistics()

      expect(stats).toBeDefined()
      expect(stats.totalBatches).toBe(2)
      expect(stats.pendingBatches).toBe(1)
      expect(stats.completedBatches).toBe(1)
      expect(stats.totalOperations).toBe(2)
    })

    it('should provide health status', () => {
      const health = batchOperations.getHealthStatus()

      expect(health).toBeDefined()
      expect(typeof health.isProcessing).toBe('boolean')
      expect(typeof health.totalBatches).toBe('number')
      expect(typeof health.pendingBatches).toBe('number')
      expect(health.lastActivity).toBeDefined()
      expect(health.metrics).toBeDefined()
    })

    it('should export batch data as JSON', async () => {
      const operations = [{
        id: 'op1',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }]

      await batchOperations.createBatch(operations)

      const jsonData = batchOperations.exportBatchData('json')

      expect(jsonData).toBeDefined()
      expect(typeof jsonData).toBe('string')

      const parsed = JSON.parse(jsonData)
      expect(parsed).toBeDefined()
      expect(parsed.timestamp).toBeDefined()
      expect(parsed.batches).toBeDefined()
      expect(parsed.statistics).toBeDefined()
    })

    it('should export batch data as CSV', async () => {
      const operations = [{
        id: 'op1',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }]

      await batchOperations.createBatch(operations)

      const csvData = batchOperations.exportBatchData('csv')

      expect(csvData).toBeDefined()
      expect(typeof csvData).toBe('string')
      expect(csvData.includes('id')).toBe(true)
      expect(csvData.includes('batchId')).toBe(true)
      expect(csvData.includes('status')).toBe(true)
    })
  })

  describe('Event Emission', () => {
    it('should emit batch created event', async () => {
      const mockEmit = vi.fn()
      batchOperations.emit = mockEmit

      await batchOperations.start()

      const operations = [{
        id: 'op1',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }]

      await batchOperations.createBatch(operations)

      expect(mockEmit).toHaveBeenCalledWith('batch:created', expect.any(Object))
    })

    it('should emit batch processed event', async () => {
      const mockEmit = vi.fn()
      batchOperations.emit = mockEmit

      await batchOperations.start()

      const operations = [{
        id: 'op1',
        type: BatchType.TRANSFER,
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '1000000000000000000',
        gasLimit: '21000'
      }]

      const batch = await batchOperations.createBatch(operations)
      await batchOperations.processBatch(batch.id)

      expect(mockEmit).toHaveBeenCalledWith('batch:processed', expect.any(Object))
    })

    it('should emit batch started and stopped events', async () => {
      const mockEmit = vi.fn()
      batchOperations.emit = mockEmit

      await batchOperations.start()
      await batchOperations.stop()

      expect(mockEmit).toHaveBeenCalledWith('batch:started')
      expect(mockEmit).toHaveBeenCalledWith('batch:stopped')
    })
  })

  describe('Error Handling', () => {
    it('should handle batch creation errors', async () => {
      await batchOperations.start()

      const mockEmit = vi.fn()
      batchOperations.emit = mockEmit

      // Create invalid operations that will cause an error
      const invalidOperations: any[] = []

      await expect(batchOperations.createBatch(invalidOperations)).rejects.toThrow('At least one operation is required')

      expect(mockEmit).toHaveBeenCalledWith('batch:error', expect.any(Object))
    })

    it('should handle batch processing errors', async () => {
      await batchOperations.start()

      const mockEmit = vi.fn()
      batchOperations.emit = mockEmit

      // Try to process non-existent batch
      await expect(batchOperations.processBatch('non-existent')).rejects.toThrow('Batch not found')

      expect(mockEmit).toHaveBeenCalledWith('batch:error', expect.any(Object))
    })
  })
})
