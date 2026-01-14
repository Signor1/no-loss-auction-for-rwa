import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { BaseSdkService } from '../baseSdkService'
import { createPublicClient, createWalletClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Mock viem functions
vi.mock('viem', () => ({
  createPublicClient: vi.fn(),
  createWalletClient: vi.fn(),
  http: vi.fn(),
  base: { id: 8453, name: 'Base' },
  baseSepolia: { id: 84532, name: 'Base Sepolia' },
  parseAbi: vi.fn((abi) => abi),
  encodeFunctionData: vi.fn(),
  formatEther: vi.fn((wei) => wei.toString()),
  formatUnits: vi.fn((value, decimals) => value.toString())
}))

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn()
}))

describe('BaseSdkService', () => {
  let baseSdkService: BaseSdkService
  let mockPublicClient: any
  let mockWalletClient: any

  const baseConfig = {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    wsUrl: 'wss://mainnet.base.org',
    privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    explorerApiUrl: 'https://api.basescan.org/api',
    explorerApiKey: 'test_api_key'
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock clients
    mockPublicClient = {
      readContract: vi.fn(),
      getBalance: vi.fn(),
      getGasPrice: vi.fn(),
      estimateGas: vi.fn(),
      estimateFeesPerGas: vi.fn(),
      getBlockNumber: vi.fn(),
      getBlock: vi.fn(),
      getTransaction: vi.fn(),
      getTransactionReceipt: vi.fn(),
      getContractEvents: vi.fn(),
      watchContractEvent: vi.fn(),
      watchBlocks: vi.fn(),
      waitForTransactionReceipt: vi.fn()
    }

    mockWalletClient = {
      writeContract: vi.fn(),
      sendTransaction: vi.fn(),
      account: { address: '0x1234567890abcdef1234567890abcdef12345678' }
    }

    ;(createPublicClient as Mock).mockReturnValue(mockPublicClient)
    ;(createWalletClient as Mock).mockReturnValue(mockWalletClient)
    ;(privateKeyToAccount as Mock).mockReturnValue(mockWalletClient.account)

    baseSdkService = new BaseSdkService(baseConfig)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(createPublicClient).toHaveBeenCalledWith({
        chain: base,
        transport: http(baseConfig.rpcUrl)
      })

      expect(createWalletClient).toHaveBeenCalledWith({
        account: mockWalletClient.account,
        chain: base,
        transport: http(baseConfig.rpcUrl)
      })
    })

    it('should initialize without wallet client when no private key provided', () => {
      const configWithoutKey = { ...baseConfig, privateKey: undefined }
      const service = new BaseSdkService(configWithoutKey)

      expect(createWalletClient).not.toHaveBeenCalled()
      expect(service.getWalletClient()).toBeNull()
    })

    it('should initialize with Base Sepolia for testnet', () => {
      const sepoliaConfig = { ...baseConfig, chainId: 84532 }
      const service = new BaseSdkService(sepoliaConfig)

      expect(createPublicClient).toHaveBeenCalledWith({
        chain: baseSepolia,
        transport: http(sepoliaConfig.rpcUrl)
      })
    })
  })

  describe('Read Operations', () => {
    it('should read contract successfully', async () => {
      const mockResult = '42'
      mockPublicClient.readContract.mockResolvedValue(mockResult)

      const params = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: ['0xabcdef1234567890abcdef1234567890abcdef12']
      }

      const result = await baseSdkService.readContract(params)

      expect(mockPublicClient.readContract).toHaveBeenCalledWith(params)
      expect(result).toBe(mockResult)
    })

    it('should get balance successfully', async () => {
      const mockBalance = 1000000000000000000n // 1 ETH
      mockPublicClient.getBalance.mockResolvedValue(mockBalance)

      const address = '0x1234567890abcdef1234567890abcdef12345678'
      const result = await baseSdkService.getBalance(address)

      expect(mockPublicClient.getBalance).toHaveBeenCalledWith({ address })
      expect(result).toBe(mockBalance)
    })

    it('should get ERC20 token balance', async () => {
      const mockBalance = 1000000n // 1 USDC (6 decimals)
      mockPublicClient.readContract.mockResolvedValue(mockBalance)

      const tokenAddress = '0xa0b86a33e6c6c69b3c6b9e3b6e4c6d8e8f0a1a2a'
      const ownerAddress = '0x1234567890abcdef1234567890abcdef12345678'

      const result = await baseSdkService.getTokenBalance(tokenAddress, ownerAddress)

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: tokenAddress,
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [ownerAddress]
      })
      expect(result).toBe(mockBalance)
    })

    it('should get token metadata', async () => {
      const mockName = 'USD Coin'
      const mockSymbol = 'USDC'
      const mockDecimals = 6
      const mockTotalSupply = 1000000000000000n // 1M USDC

      mockPublicClient.readContract
        .mockResolvedValueOnce(mockName)
        .mockResolvedValueOnce(mockSymbol)
        .mockResolvedValueOnce(mockDecimals)
        .mockResolvedValueOnce(mockTotalSupply)

      const tokenAddress = '0xa0b86a33e6c6c69b3c6b9e3b6e4c6d8e8f0a1a2a'
      const result = await baseSdkService.getTokenMetadata(tokenAddress)

      expect(result).toEqual({
        name: mockName,
        symbol: mockSymbol,
        decimals: mockDecimals,
        totalSupply: mockTotalSupply
      })
    })
  })

  describe('Write Operations', () => {
    it('should write to contract successfully', async () => {
      const mockHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      mockWalletClient.writeContract.mockResolvedValue(mockHash)

      const params = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: ['function transfer(address,uint256) returns (bool)'],
        functionName: 'transfer',
        args: ['0xabcdef1234567890abcdef1234567890abcdef12', 1000000n]
      }

      const result = await baseSdkService.writeContract(params)

      expect(mockWalletClient.writeContract).toHaveBeenCalledWith({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        account: mockWalletClient.account,
        value: undefined,
        gas: undefined,
        gasPrice: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        nonce: undefined
      })
      expect(result).toBe(mockHash)
    })

    it('should throw error when wallet client not initialized', async () => {
      const configWithoutKey = { ...baseConfig, privateKey: undefined }
      const service = new BaseSdkService(configWithoutKey)

      const params = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: ['function transfer(address,uint256) returns (bool)'],
        functionName: 'transfer',
        args: ['0xabcdef1234567890abcdef1234567890abcdef12', 1000000n]
      }

      await expect(service.writeContract(params)).rejects.toThrow('Wallet client not initialized')
    })
  })

  describe('Gas Operations', () => {
    it('should get gas price successfully', async () => {
      const mockGasPrice = 20000000000n // 20 gwei
      mockPublicClient.getGasPrice.mockResolvedValue(mockGasPrice)

      const result = await baseSdkService.getGasPrice()

      expect(mockPublicClient.getGasPrice).toHaveBeenCalled()
      expect(result).toBe(mockGasPrice)
    })

    it('should estimate gas for transaction', async () => {
      const mockGasEstimate = 21000n
      mockPublicClient.estimateGas.mockResolvedValue(mockGasEstimate)

      const params = {
        account: '0x1234567890abcdef1234567890abcdef12345678',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        abi: ['function transfer(address,uint256) returns (bool)'],
        functionName: 'transfer',
        args: ['0xabcdef1234567890abcdef1234567890abcdef12', 1000000n]
      }

      const result = await baseSdkService.estimateGas(params)

      expect(mockPublicClient.estimateGas).toHaveBeenCalled()
      expect(result).toBe(mockGasEstimate)
    })

    it('should get fee data', async () => {
      const mockFeeData = {
        maxFeePerGas: 30000000000n,
        maxPriorityFeePerGas: 2000000000n
      }
      mockPublicClient.estimateFeesPerGas.mockResolvedValue(mockFeeData)

      const result = await baseSdkService.getFeeData()

      expect(mockPublicClient.estimateFeesPerGas).toHaveBeenCalled()
      expect(result).toEqual({
        gasPrice: null,
        maxFeePerGas: mockFeeData.maxFeePerGas,
        maxPriorityFeePerGas: mockFeeData.maxPriorityFeePerGas
      })
    })
  })

  describe('Block Operations', () => {
    it('should get current block number', async () => {
      const mockBlockNumber = 1000000n
      mockPublicClient.getBlockNumber.mockResolvedValue(mockBlockNumber)

      const result = await baseSdkService.getBlockNumber()

      expect(mockPublicClient.getBlockNumber).toHaveBeenCalled()
      expect(result).toBe(mockBlockNumber)
    })

    it('should get block by number', async () => {
      const mockBlock = { number: 1000000n, hash: '0x123...' }
      mockPublicClient.getBlock.mockResolvedValue(mockBlock)

      const blockNumber = 1000000n
      const result = await baseSdkService.getBlock(blockNumber)

      expect(mockPublicClient.getBlock).toHaveBeenCalledWith({ blockNumber })
      expect(result).toBe(mockBlock)
    })
  })

  describe('Transaction Operations', () => {
    it('should get transaction by hash', async () => {
      const mockTransaction = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: 1000000000000000000n
      }
      mockPublicClient.getTransaction.mockResolvedValue(mockTransaction)

      const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      const result = await baseSdkService.getTransaction(hash)

      expect(mockPublicClient.getTransaction).toHaveBeenCalledWith({ hash })
      expect(result).toBe(mockTransaction)
    })

    it('should get transaction receipt', async () => {
      const mockReceipt = {
        status: 'success',
        gasUsed: 21000n,
        blockNumber: 1000000n
      }
      mockPublicClient.getTransactionReceipt.mockResolvedValue(mockReceipt)

      const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      const result = await baseSdkService.getTransactionReceipt(hash)

      expect(mockPublicClient.getTransactionReceipt).toHaveBeenCalledWith({ hash })
      expect(result).toBe(mockReceipt)
    })

    it('should wait for transaction receipt', async () => {
      const mockReceipt = {
        status: 'success',
        gasUsed: 21000n,
        blockNumber: 1000000n
      }
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue(mockReceipt)

      const hash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      const result = await baseSdkService.waitForTransaction(hash, 2)

      expect(mockPublicClient.waitForTransactionReceipt).toHaveBeenCalledWith({
        hash,
        confirmations: 2
      })
      expect(result).toBe(mockReceipt)
    })
  })

  describe('Event Operations', () => {
    it('should get contract events', async () => {
      const mockEvents = [
        {
          eventName: 'Transfer',
          args: { from: '0x123...', to: '0x456...', value: 1000000n }
        }
      ]
      mockPublicClient.getContractEvents.mockResolvedValue(mockEvents)

      const filter = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        eventName: 'Transfer',
        fromBlock: 1000000n,
        toBlock: 1000100n
      }

      const result = await baseSdkService.getContractLogs(filter)

      expect(mockPublicClient.getContractEvents).toHaveBeenCalled()
      expect(result).toBe(mockEvents)
    })

    it('should watch contract events', () => {
      const mockUnwatch = vi.fn()
      mockPublicClient.watchContractEvent.mockReturnValue(mockUnwatch)

      const params = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: ['event Transfer(address indexed from, address indexed to, uint256 value)'],
        eventName: 'Transfer',
        onLogs: vi.fn(),
        onError: vi.fn()
      }

      const result = baseSdkService.watchContractEvent(params)

      expect(mockPublicClient.watchContractEvent).toHaveBeenCalledWith(params)
      expect(result).toBe(mockUnwatch)
    })

    it('should watch blocks', () => {
      const mockUnwatch = vi.fn()
      mockPublicClient.watchBlocks.mockReturnValue(mockUnwatch)

      const onBlock = vi.fn()
      const onError = vi.fn()

      const result = baseSdkService.watchBlocks(onBlock, onError)

      expect(mockPublicClient.watchBlocks).toHaveBeenCalledWith({
        onBlock,
        onError
      })
      expect(result).toBe(mockUnwatch)
    })
  })

  describe('Utility Functions', () => {
    it('should format ether correctly', () => {
      const wei = 1000000000000000000n // 1 ETH
      const result = baseSdkService.formatEther(wei)
      expect(result).toBe('1000000000000000000') // Mock implementation
    })

    it('should format units correctly', () => {
      const value = 1000000n
      const decimals = 6
      const result = baseSdkService.formatUnits(value, decimals)
      expect(result).toBe('1000000') // Mock implementation
    })

    it('should return public client', () => {
      const result = baseSdkService.getPublicClient()
      expect(result).toBe(mockPublicClient)
    })

    it('should return wallet client', () => {
      const result = baseSdkService.getWalletClient()
      expect(result).toBe(mockWalletClient)
    })

    it('should return account', () => {
      const result = baseSdkService.getAccount()
      expect(result).toBe(mockWalletClient.account)
    })

    it('should return configuration', () => {
      const result = baseSdkService.getConfig()
      expect(result).toBe(baseConfig)
    })
  })

  describe('Error Handling', () => {
    it('should handle read contract errors', async () => {
      const error = new Error('Contract read failed')
      mockPublicClient.readContract.mockRejectedValue(error)

      const params = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: ['0xabcdef1234567890abcdef1234567890abcdef12']
      }

      await expect(baseSdkService.readContract(params)).rejects.toThrow('Contract read failed')
    })

    it('should handle write contract errors', async () => {
      const error = new Error('Contract write failed')
      mockWalletClient.writeContract.mockRejectedValue(error)

      const params = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        abi: ['function transfer(address,uint256) returns (bool)'],
        functionName: 'transfer',
        args: ['0xabcdef1234567890abcdef1234567890abcdef12', 1000000n]
      }

      await expect(baseSdkService.writeContract(params)).rejects.toThrow('Contract write failed')
    })

    it('should handle gas estimation errors', async () => {
      const error = new Error('Gas estimation failed')
      mockPublicClient.estimateGas.mockRejectedValue(error)

      const params = {
        account: '0x1234567890abcdef1234567890abcdef12345678',
        address: '0xabcdef1234567890abcdef1234567890abcdef12',
        abi: ['function transfer(address,uint256) returns (bool)'],
        functionName: 'transfer',
        args: ['0xabcdef1234567890abcdef1234567890abcdef12', 1000000n]
      }

      await expect(baseSdkService.estimateGas(params)).rejects.toThrow('Gas estimation failed')
    })
  })
})
