import { EventEmitter } from 'events'
import { ethers } from 'ethers'
import { Logger } from '../utils/logger'
import { CHAIN_CONFIGS } from './chainConfig'
import { AUCTION_CONTRACT, ASSET_CONTRACT, PAYMENT_CONTRACT, USER_CONTRACT } from './abi'

// Contract type enum
export enum ContractType {
  AUCTION = 'auction',
  ASSET = 'asset',
  PAYMENT = 'payment',
  USER = 'user',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155'
}

// Contract interface
export interface Contract {
  address: string
  chainId: number
  type: ContractType
  name: string
  symbol?: string
  decimals?: number
  abi: any[]
  provider: ethers.providers.Provider
  contract: ethers.Contract
  metadata: any
}

// Read operation interface
export interface ReadOperation {
  id: string
  contractAddress: string
  functionName: string
  parameters: any[]
  returnType: string
  cacheKey?: string
  cacheTimeout?: number
  blockNumber?: number
  gasLimit?: number
}

// Read result interface
export interface ReadResult {
  id: string
  success: boolean
  data: any
  error?: string
  gasUsed?: string
  blockNumber?: number
  timestamp: Date
  cached: boolean
  executionTime: number
}

// Contract state interface
export interface ContractState {
  contractAddress: string
  chainId: number
  blockNumber: number
  timestamp: Date
  state: {
    [key: string]: any
  }
  events: any[]
  storage: {
    [key: string]: string
  }
}

// Batch read operation interface
export interface BatchReadOperation {
  operations: ReadOperation[]
  maxConcurrency?: number
  timeout?: number
}

// Contract reader service
export class ContractReader extends EventEmitter {
  private contracts: Map<string, Contract> = new Map()
  private readCache: Map<string, { data: any; timestamp: Date; ttl: number }> = new Map()
  private logger: Logger
  private isReading: boolean = false
  private defaultCacheTimeout: number = 30000 // 30 seconds
  private maxBatchSize: number = 100
  private readTimeout: number = 10000 // 10 seconds

  constructor(logger: Logger) {
    super()
    this.logger = logger
  }

  // Start contract reader
  async start(): Promise<void> {
    if (this.isReading) {
      this.logger.warn('Contract reader already started')
      return
    }

    this.isReading = true
    this.logger.info('Starting contract reader...')

    // Initialize contracts for all chains
    await this.initializeContracts()

    // Start cache cleanup
    this.startCacheCleanup()

    this.logger.info('Contract reader started')
    this.emit('reader:started')
  }

  // Stop contract reader
  async stop(): Promise<void> {
    if (!this.isReading) {
      return
    }

    this.isReading = false
    this.logger.info('Stopping contract reader...')

    // Clear cache
    this.readCache.clear()

    this.logger.info('Contract reader stopped')
    this.emit('reader:stopped')
  }

  // Add contract
  async addContract(contract: Omit<Contract, 'contract'>): Promise<void> {
    const contractKey = `${contract.chainId}:${contract.address}`
    
    if (this.contracts.has(contractKey)) {
      this.logger.warn(`Contract already exists: ${contractKey}`)
      return
    }

    // Get provider for chain
    const provider = await this.getProvider(contract.chainId)
    
    // Create contract instance
    const contractInstance = new ethers.Contract(contract.address, contract.abi, provider)
    
    const fullContract: Contract = {
      ...contract,
      contract: contractInstance
    }

    this.contracts.set(contractKey, fullContract)
    await this.saveContract(fullContract)

    this.logger.info(`Contract added: ${contractKey} (${contract.type})`)
    this.emit('contract:added', { contract: fullContract })
  }

  // Read contract state
  async readContractState(
    contractAddress: string,
    chainId: number,
    functionName: string,
    parameters: any[] = [],
    options: {
      blockNumber?: number
      cacheKey?: string
      cacheTimeout?: number
      gasLimit?: number
    } = {}
  ): Promise<ReadResult> {
    const startTime = Date.now()
    const operationId = this.generateOperationId()

    try {
      this.logger.debug(`Reading contract state: ${contractAddress} ${functionName}`)

      // Check cache first
      const cacheKey = options.cacheKey || `${contractAddress}:${chainId}:${functionName}:${JSON.stringify(parameters)}`
      const cached = this.readCache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
        const result: ReadResult = {
          id: operationId,
          success: true,
          data: cached.data,
          cached: true,
          executionTime: Date.now() - startTime,
          timestamp: cached.timestamp
        }

        this.logger.debug(`Cache hit for: ${cacheKey}`)
        this.emit('read:completed', { result })
        return result
      }

      // Get contract
      const contractKey = `${chainId}:${contractAddress}`
      const contract = this.contracts.get(contractKey)
      
      if (!contract) {
        throw new Error(`Contract not found: ${contractKey}`)
      }

      // Prepare call options
      const callOptions: any = {}
      if (options.blockNumber) {
        callOptions.blockTag = options.blockNumber
      }
      if (options.gasLimit) {
        callOptions.gasLimit = options.gasLimit
      }

      // Execute read
      const result = await contract.contract[functionName](...parameters, callOptions)
      
      // Cache result
      const ttl = options.cacheTimeout || this.defaultCacheTimeout
      this.readCache.set(cacheKey, {
        data: result,
        timestamp: new Date(),
        ttl
      })

      const readResult: ReadResult = {
        id: operationId,
        success: true,
        data: result,
        cached: false,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        blockNumber: options.blockNumber
      }

      this.logger.info(`Contract state read: ${contractAddress} ${functionName}`)
      this.emit('read:completed', { result: readResult })

      return readResult

    } catch (error) {
      const result: ReadResult = {
        id: operationId,
        success: false,
        data: null,
        error: error.message,
        cached: false,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      }

      this.logger.error(`Failed to read contract state: ${contractAddress} ${functionName}`, error)
      this.emit('read:error', { result, error })
      return result
    }
  }

  // Batch read operations
  async batchRead(operations: BatchReadOperation): Promise<ReadResult[]> {
    const startTime = Date.now()
    const maxConcurrency = operations.maxConcurrency || 10
    const timeout = operations.timeout || this.readTimeout

    this.logger.info(`Starting batch read: ${operations.operations.length} operations`)

    const results: ReadResult[] = []
    const batches: ReadOperation[][] = []

    // Split operations into batches
    for (let i = 0; i < operations.operations.length; i += this.maxBatchSize) {
      batches.push(operations.operations.slice(i, i + this.maxBatchSize))
    }

    // Process batches with concurrency control
    for (const batch of batches) {
      const batchPromises = batch.map(async (operation) => {
        try {
          return await Promise.race([
            this.readContractState(
              operation.contractAddress,
              1, // Default to mainnet, should be passed in operation
              operation.functionName,
              operation.parameters,
              {
                blockNumber: operation.blockNumber,
                cacheKey: operation.cacheKey,
                cacheTimeout: operation.cacheTimeout,
                gasLimit: operation.gasLimit
              }
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Read timeout')), timeout)
            )
          ])
        } catch (error) {
          return {
            id: operation.id,
            success: false,
            data: null,
            error: error.message,
            cached: false,
            executionTime: Date.now() - startTime,
            timestamp: new Date()
          }
        }
      })

      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            id: 'unknown',
            success: false,
            data: null,
            error: result.reason?.message || 'Unknown error',
            cached: false,
            executionTime: Date.now() - startTime,
            timestamp: new Date()
          })
        }
      }

      // Small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const totalTime = Date.now() - startTime
    this.logger.info(`Batch read completed: ${results.length} results in ${totalTime}ms`)
    this.emit('batch:completed', { results, totalTime })

    return results
  }

  // Get contract state snapshot
  async getContractStateSnapshot(
    contractAddress: string,
    chainId: number,
    blockNumber?: number
  ): Promise<ContractState> {
    const contractKey = `${chainId}:${contractAddress}`
    const contract = this.contracts.get(contractKey)
    
    if (!contract) {
      throw new Error(`Contract not found: ${contractKey}`)
    }

    try {
      // Get current block number if not provided
      const targetBlockNumber = blockNumber || await contract.provider.getBlockNumber()
      
      // Get all public functions
      const publicFunctions = contract.abi.filter(item => item.type === 'function' && item.stateMutability === 'view')
      
      // Read all state variables
      const state: { [key: string]: any } = {}
      
      for (const func of publicFunctions) {
        try {
          const result = await this.readContractState(
            contractAddress,
            chainId,
            func.name,
            [],
            { blockNumber: targetBlockNumber }
          )
          
          if (result.success) {
            state[func.name] = result.data
          }
        } catch (error) {
          this.logger.warn(`Failed to read ${func.name}:`, error.message)
          state[func.name] = null
        }
      }

      // Get recent events
      const events = await this.getContractEvents(contractAddress, chainId, targetBlockNumber)
      
      // Get storage slots (simplified)
      const storage: { [key: string]: string } = {}
      // This would implement actual storage slot reading
      // For now, return empty storage

      const contractState: ContractState = {
        contractAddress,
        chainId,
        blockNumber: targetBlockNumber,
        timestamp: new Date(),
        state,
        events,
        storage
      }

      this.logger.info(`Contract state snapshot created: ${contractAddress} at block ${targetBlockNumber}`)
      this.emit('snapshot:created', { contractState })

      return contractState

    } catch (error) {
      this.logger.error(`Failed to create contract state snapshot: ${contractAddress}`, error)
      throw error
    }
  }

  // Get contract events
  private async getContractEvents(
    contractAddress: string,
    chainId: number,
    blockNumber: number,
    limit: number = 100
  ): Promise<any[]> {
    const contractKey = `${chainId}:${contractAddress}`
    const contract = this.contracts.get(contractKey)
    
    if (!contract) {
      throw new Error(`Contract not found: ${contractKey}`)
    }

    try {
      // Get events from last 100 blocks
      const fromBlock = Math.max(0, blockNumber - 100)
      const toBlock = blockNumber

      const events = await contract.contract.queryFilter(
        {},
        fromBlock,
        toBlock
      )

      const eventLogs = await contract.provider.getLogs(events)
      
      return eventLogs.slice(0, limit).map(log => ({
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
        address: log.address,
        topics: log.topics,
        data: log.data,
        timestamp: new Date()
      }))

    } catch (error) {
      this.logger.error(`Failed to get contract events: ${contractAddress}`, error)
      return []
    }
  }

  // Monitor contract state changes
  async monitorContractState(
    contractAddress: string,
    chainId: number,
    interval: number = 30000 // 30 seconds
  ): Promise<void> {
    const contractKey = `${chainId}:${contractAddress}`
    
    this.logger.info(`Starting contract state monitoring: ${contractKey}`)

    const monitor = setInterval(async () => {
      try {
        const currentState = await this.getContractStateSnapshot(contractAddress, chainId)
        this.emit('state:changed', { contractAddress, chainId, state: currentState })
      } catch (error) {
        this.logger.error(`Error monitoring contract state: ${contractKey}`, error)
        this.emit('monitor:error', { contractAddress, chainId, error })
      }
    }, interval)

    this.emit('monitor:started', { contractAddress, chainId, monitor })
  }

  // Stop monitoring contract state
  stopMonitoring(contractAddress: string, chainId: number): void {
    const contractKey = `${chainId}:${contractAddress}`
    this.logger.info(`Stopping contract state monitoring: ${contractKey}`)
    this.emit('monitor:stopped', { contractAddress, chainId })
  }

  // Get contract ABI
  async getContractABI(contractAddress: string, chainId: number): Promise<any[]> {
    const contractKey = `${chainId}:${contractAddress}`
    const contract = this.contracts.get(contractKey)
    
    if (contract) {
      return contract.abi
    }

    try {
      const provider = await this.getProvider(chainId)
      const abi = await provider.getCode(contractAddress)
      
      if (abi === '0x') {
        throw new Error('No contract code found at address')
      }

      // This would implement actual ABI extraction
      // For now, return empty ABI
      return []

    } catch (error) {
      this.logger.error(`Failed to get contract ABI: ${contractAddress}`, error)
      throw error
    }
  }

  // Validate contract address
  async validateContractAddress(contractAddress: string, chainId: number): Promise<{
    valid: boolean
    contract?: boolean
    name?: string
    symbol?: string
    decimals?: number
    error?: string
  }> {
    try {
      const provider = await this.getProvider(chainId)
      
      // Check if address is valid
      if (!ethers.utils.isAddress(contractAddress)) {
        return {
          valid: false,
          error: 'Invalid address format'
        }
      }

      // Check if address is a contract
      const code = await provider.getCode(contractAddress)
      const isContract = code !== '0x'

      if (!isContract) {
        return {
          valid: true,
          contract: false
        }
      }

      // Try to get contract details (for ERC20 tokens)
      try {
        const erc20Contract = new ethers.Contract(contractAddress, [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)'
        ], provider)

        const [name, symbol, decimals] = await Promise.all([
          erc20Contract.name(),
          erc20Contract.symbol(),
          erc20Contract.decimals()
        ])

        return {
          valid: true,
          contract: true,
          name,
          symbol,
          decimals
        }

      } catch (error) {
        // Not an ERC20 contract, but still a valid contract
        return {
          valid: true,
          contract: true
        }
      }

    } catch (error) {
      return {
        valid: false,
        error: error.message
      }
    }
  }

  // Initialize contracts
  private async initializeContracts(): Promise<void> {
    const chainConfigs = CHAIN_CONFIGS

    for (const chainConfig of chainConfigs) {
      try {
        // Add auction contract
        if (chainConfig.contracts?.auction) {
          await this.addContract({
            address: chainConfig.contracts.auction,
            chainId: chainConfig.chainId,
            type: ContractType.AUCTION,
            name: 'Auction Contract',
            abi: AUCTION_CONTRACT,
            provider: await this.getProvider(chainConfig.chainId),
            metadata: { chain: chainConfig.name }
          })
        }

        // Add asset contract
        if (chainConfig.contracts?.asset) {
          await this.addContract({
            address: chainConfig.contracts.asset,
            chainId: chainConfig.chainId,
            type: ContractType.ASSET,
            name: 'Asset Contract',
            abi: ASSET_CONTRACT,
            provider: await this.getProvider(chainConfig.chainId),
            metadata: { chain: chainConfig.name }
          })
        }

        // Add payment contract
        if (chainConfig.contracts?.payment) {
          await this.addContract({
            address: chainConfig.contracts.payment,
            chainId: chainConfig.chainId,
            type: ContractType.PAYMENT,
            name: 'Payment Contract',
            abi: PAYMENT_CONTRACT,
            provider: await this.getProvider(chainConfig.chainId),
            metadata: { chain: chainConfig.name }
          })
        }

        // Add user contract
        if (chainConfig.contracts?.user) {
          await this.addContract({
            address: chainConfig.contracts.user,
            chainId: chainConfig.chainId,
            type: ContractType.USER,
            name: 'User Contract',
            abi: USER_CONTRACT,
            provider: await this.getProvider(chainConfig.chainId),
            metadata: { chain: chainConfig.name }
          })
        }

      } catch (error) {
        this.logger.error(`Failed to initialize contracts for chain ${chainConfig.chainId}:`, error)
      }
    }

    this.logger.info(`Initialized contracts for ${chainConfigs.length} chains`)
  }

  // Get provider for chain
  private async getProvider(chainId: number): Promise<ethers.providers.Provider> {
    const chainConfig = CHAIN_CONFIGS.find(config => config.chainId === chainId)
    
    if (!chainConfig) {
      throw new Error(`Chain configuration not found: ${chainId}`)
    }

    return new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl)
  }

  // Start cache cleanup
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupCache()
    }, 60000) // Every minute
  }

  // Cleanup cache
  private cleanupCache(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, cached] of this.readCache.entries()) {
      if (now - cached.timestamp.getTime() > cached.ttl) {
        this.readCache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} cache entries`)
    }
  }

  // Save contract
  private async saveContract(contract: Contract): Promise<void> {
    // This would save to your database
    this.logger.debug(`Contract saved: ${contract.address}`)
  }

  // Generate operation ID
  private generateOperationId(): string {
    return `read_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get contract by address and chain
  getContract(contractAddress: string, chainId: number): Contract | null {
    const contractKey = `${chainId}:${contractAddress}`
    return this.contracts.get(contractKey) || null
  }

  // Get all contracts
  getAllContracts(): Contract[] {
    return Array.from(this.contracts.values())
  }

  // Get contracts by type
  getContractsByType(type: ContractType): Contract[] {
    return Array.from(this.contracts.values()).filter(contract => contract.type === type)
  }

  // Get contracts by chain
  getContractsByChain(chainId: number): Contract[] {
    return Array.from(this.contracts.values()).filter(contract => contract.chainId === chainId)
  }

  // Clear cache
  clearCache(): void {
    this.readCache.clear()
    this.logger.info('Contract read cache cleared')
    this.emit('cache:cleared')
  }

  // Get cache statistics
  getCacheStatistics(): {
    size: number
    hitRate: number
    missRate: number
    totalRequests: number
  } {
    // This would track cache hit/miss statistics
    return {
      size: this.readCache.size,
      hitRate: 0,
      missRate: 0,
      totalRequests: 0
    }
  }

  // Export contract data
  exportContractData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timestamp: new Date().toISOString(),
      contracts: Array.from(this.contracts.values()),
      cacheStatistics: this.getCacheStatistics()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['address', 'chainId', 'type', 'name', 'symbol', 'decimals']
      const csvRows = [headers.join(',')]
      
      for (const contract of this.contracts.values()) {
        csvRows.push([
          contract.address,
          contract.chainId.toString(),
          contract.type,
          contract.name,
          contract.symbol || '',
          contract.decimals?.toString() || ''
        ])
      }
      
      return csvRows.join('\n')
    }

    return ''
  }

  // Get health status
  getHealthStatus(): {
    isReading: boolean
    totalContracts: number
    cacheSize: number
    lastActivity: Date
    metrics: any
  } {
    return {
      isReading: this.isReading,
      totalContracts: this.contracts.size,
      cacheSize: this.readCache.size,
      lastActivity: new Date(),
      metrics: this.getCacheStatistics()
    }
  }
}

export default ContractReader
